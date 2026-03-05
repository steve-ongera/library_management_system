from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
from rest_framework_simplejwt.tokens import RefreshToken
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from django.db.models import Q, Sum, Count
from django.shortcuts import get_object_or_404
from decimal import Decimal

from .models import (
    User, StudentProfile, LibrarianProfile, Category, Author,
    Publisher, Book, Borrowing, Fine, Reservation, Announcement,
    PaymentTransaction
)
from .serializers import (
    LoginSerializer, UserSerializer, RegisterSerializer,
    StudentProfileSerializer, LibrarianProfileSerializer,
    CategorySerializer, AuthorSerializer, PublisherSerializer,
    BookListSerializer, BookDetailSerializer, BorrowingSerializer,
    ReturnBookSerializer, FineSerializer, WaiveFineSerializer,
    InitiatePaymentSerializer, PaymentTransactionSerializer,
    ReservationSerializer, AnnouncementSerializer
)
from .permissions  import IsLibrarian, IsStudent, IsOwnerOrLibrarian
from .payment_services import MpesaService, PayPalService, StripeService


# ─── Auth ViewSets ─────────────────────────────────────────────────────────────

class AuthViewSet(viewsets.ViewSet):
    permission_classes = [AllowAny]

    @action(detail=False, methods=['post'], url_path='login')
    def login(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        refresh = RefreshToken.for_user(user)
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserSerializer(user).data,
        })

    @action(detail=False, methods=['post'], url_path='register')
    def register(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserSerializer(user).data,
        }, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['post'], url_path='logout', permission_classes=[IsAuthenticated])
    def logout(self, request):
        try:
            token = RefreshToken(request.data.get('refresh'))
            token.blacklist()
        except Exception:
            pass
        return Response({'detail': 'Logged out successfully.'})

    @action(detail=False, methods=['get'], url_path='me', permission_classes=[IsAuthenticated])
    def me(self, request):
        return Response(UserSerializer(request.user).data)

    @action(detail=False, methods=['put', 'patch'], url_path='me/update', permission_classes=[IsAuthenticated])
    def update_me(self, request):
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


# ─── Dashboard ViewSet ─────────────────────────────────────────────────────────

class DashboardViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'], url_path='student')
    def student_dashboard(self, request):
        user = request.user
        borrowings = user.borrowings.select_related('book')
        overdue = [b for b in borrowings.filter(status='borrowed') if b.is_overdue]
        fines = user.fines.all()
        return Response({
            'borrowed_books': borrowings.filter(status='borrowed').count(),
            'overdue_books': len(overdue),
            'total_fines': fines.aggregate(t=Sum('amount'))['t'] or 0,
            'pending_fines': fines.filter(status='pending').aggregate(t=Sum('amount'))['t'] or 0,
            'reservations': user.reservations.filter(status='active').count(),
            'recent_borrowings': BorrowingSerializer(
                borrowings.order_by('-borrow_date')[:5], many=True
            ).data,
            'active_fines': FineSerializer(
                fines.filter(status='pending')[:5], many=True
            ).data,
        })

    @action(detail=False, methods=['get'], url_path='librarian')
    def librarian_dashboard(self, request):
        if request.user.role not in ['librarian', 'admin']:
            return Response({'detail': 'Forbidden.'}, status=status.HTTP_403_FORBIDDEN)
        overdue_ids = [
            b.id for b in Borrowing.objects.filter(status='borrowed')
            if b.is_overdue
        ]
        return Response({
            'total_books': Book.objects.filter(is_active=True).count(),
            'total_borrowings': Borrowing.objects.filter(status='borrowed').count(),
            'overdue_borrowings': len(overdue_ids),
            'total_students': StudentProfile.objects.filter(is_active=True).count(),
            'total_fines_collected': Fine.objects.filter(status='paid').aggregate(
                t=Sum('amount'))['t'] or 0,
            'pending_fines_amount': Fine.objects.filter(status='pending').aggregate(
                t=Sum('amount'))['t'] or 0,
            'recent_borrowings': BorrowingSerializer(
                Borrowing.objects.order_by('-borrow_date')[:10], many=True
            ).data,
            'recent_fines': FineSerializer(
                Fine.objects.order_by('-created_at')[:10], many=True
            ).data,
        })


# ─── Catalog ViewSets ──────────────────────────────────────────────────────────

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    lookup_field = 'slug'
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description']

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]
        return [IsLibrarian()]


class AuthorViewSet(viewsets.ModelViewSet):
    queryset = Author.objects.all()
    serializer_class = AuthorSerializer
    lookup_field = 'slug'
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'nationality', 'bio']

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]
        return [IsLibrarian()]


class PublisherViewSet(viewsets.ModelViewSet):
    queryset = Publisher.objects.all()
    serializer_class = PublisherSerializer
    lookup_field = 'slug'

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]
        return [IsLibrarian()]


class BookViewSet(viewsets.ModelViewSet):
    queryset = Book.objects.filter(is_active=True).select_related(
        'category', 'publisher'
    ).prefetch_related('authors')
    lookup_field = 'slug'
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category__slug', 'language', 'condition', 'is_active']
    search_fields = ['title', 'isbn', 'description', 'authors__name', 'category__name']
    ordering_fields = ['title', 'publication_year', 'created_at', 'available_copies']

    def get_serializer_class(self):
        if self.action in ['list']:
            return BookListSerializer
        return BookDetailSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]
        return [IsLibrarian()]

    def get_queryset(self):
        qs = super().get_queryset()
        available = self.request.query_params.get('available')
        if available == 'true':
            qs = qs.filter(available_copies__gt=0)
        return qs

    @action(detail=True, methods=['post'], permission_classes=[IsLibrarian])
    def update_copies(self, request, slug=None):
        book = self.get_object()
        total = request.data.get('total_copies')
        if total is not None:
            diff = int(total) - book.total_copies
            book.total_copies = int(total)
            book.available_copies = max(0, book.available_copies + diff)
            book.save()
        return Response(BookDetailSerializer(book).data)


# ─── Borrowing ViewSet ─────────────────────────────────────────────────────────

class BorrowingViewSet(viewsets.ModelViewSet):
    serializer_class = BorrowingSerializer
    lookup_field = 'slug'
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status']
    search_fields = ['book__title', 'user__first_name', 'user__last_name', 'user__username']
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role in ['librarian', 'admin']:
            return Borrowing.objects.all().select_related('user', 'book', 'issued_by')
        return Borrowing.objects.filter(user=user).select_related('book', 'issued_by')

    def get_permissions(self):
        if self.action in ['create', 'return_book']:
            return [IsLibrarian()]
        return [IsAuthenticated()]

    @action(detail=False, methods=['post'], url_path='issue', permission_classes=[IsLibrarian])
    def issue_book(self, request):
        """Librarian issues a book to a student."""
        student_slug = request.data.get('student_slug')
        student = get_object_or_404(User, slug=student_slug)
        if not hasattr(student, 'student_profile') or not student.student_profile.can_borrow:
            return Response(
                {'detail': 'Student cannot borrow more books.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        serializer = BorrowingSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        # Override user with selected student
        borrowing = serializer.save(user=student, issued_by=request.user)
        return Response(BorrowingSerializer(borrowing).data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['post'], url_path='return', permission_classes=[IsLibrarian])
    def return_book(self, request):
        serializer = ReturnBookSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        borrowing = get_object_or_404(Borrowing, slug=serializer.validated_data['slug'])
        if borrowing.status == 'returned':
            return Response({'detail': 'Book already returned.'}, status=status.HTTP_400_BAD_REQUEST)

        borrowing.return_date = timezone.now()
        borrowing.status = 'returned'
        borrowing.notes = serializer.validated_data.get('notes', '')
        borrowing.save()

        book = borrowing.book
        book.available_copies = min(book.total_copies, book.available_copies + 1)
        if condition := serializer.validated_data.get('condition'):
            book.condition = condition
        book.save()

        # Auto-generate fine if overdue
        if borrowing.days_overdue > 0:
            fine, _ = Fine.objects.get_or_create(
                borrowing=borrowing,
                defaults={
                    'user': borrowing.user,
                    'amount': borrowing.calculated_fine,
                }
            )
            return Response({
                'borrowing': BorrowingSerializer(borrowing).data,
                'fine_generated': True,
                'fine': FineSerializer(fine).data,
            })

        return Response({'borrowing': BorrowingSerializer(borrowing).data, 'fine_generated': False})

    @action(detail=False, methods=['get'], url_path='overdue')
    def overdue(self, request):
        all_active = Borrowing.objects.filter(status='borrowed').select_related('user', 'book')
        overdue = [b for b in all_active if b.is_overdue]
        return Response(BorrowingSerializer(overdue, many=True).data)

    @action(detail=False, methods=['get'], url_path='my-history')
    def my_history(self, request):
        borrowings = Borrowing.objects.filter(user=request.user).order_by('-borrow_date')
        page = self.paginate_queryset(borrowings)
        if page is not None:
            return self.get_paginated_response(BorrowingSerializer(page, many=True).data)
        return Response(BorrowingSerializer(borrowings, many=True).data)


# ─── Fine ViewSet ──────────────────────────────────────────────────────────────

class FineViewSet(viewsets.ModelViewSet):
    serializer_class = FineSerializer
    lookup_field = 'slug'
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['status', 'payment_method']

    def get_queryset(self):
        user = self.request.user
        if user.role in ['librarian', 'admin']:
            return Fine.objects.all().select_related('user', 'borrowing', 'waived_by')
        return Fine.objects.filter(user=user).select_related('borrowing')

    @action(detail=True, methods=['post'], permission_classes=[IsLibrarian])
    def waive(self, request, slug=None):
        fine = self.get_object()
        serializer = WaiveFineSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        fine.status = 'waived'
        fine.waived_by = request.user
        fine.waive_reason = serializer.validated_data['waive_reason']
        fine.save()
        return Response(FineSerializer(fine).data)

    @action(detail=True, methods=['post'], url_path='initiate-payment')
    def initiate_payment(self, request, slug=None):
        fine = self.get_object()
        if fine.status != 'pending':
            return Response({'detail': 'Fine is not payable.'}, status=status.HTTP_400_BAD_REQUEST)

        serializer = InitiatePaymentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        gateway = data['gateway']

        txn = PaymentTransaction.objects.create(
            fine=fine, user=request.user, gateway=gateway,
            amount=fine.amount,
            currency='KES' if gateway == 'mpesa' else 'USD',
            phone_number=data.get('phone_number', '')
        )

        try:
            if gateway == 'mpesa':
                result = MpesaService.initiate_stk_push(
                    phone=data['phone_number'], amount=float(fine.amount),
                    reference=txn.slug
                )
            elif gateway == 'paypal':
                result = PayPalService.create_order(
                    amount=float(fine.amount), reference=txn.slug,
                    return_url=data.get('return_url', ''),
                    cancel_url=data.get('cancel_url', '')
                )
            elif gateway == 'stripe':
                result = StripeService.create_payment_intent(
                    amount=fine.amount, reference=txn.slug
                )

            txn.gateway_response = result
            txn.gateway_transaction_id = result.get('transaction_id', result.get('id', ''))
            txn.save()

            return Response({
                'transaction': PaymentTransactionSerializer(txn).data,
                'gateway_data': result,
            })
        except Exception as e:
            txn.status = 'failed'
            txn.save()
            return Response({'detail': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'], url_path='confirm-payment')
    def confirm_payment(self, request, slug=None):
        fine = self.get_object()
        txn_slug = request.data.get('transaction_slug')
        txn = get_object_or_404(PaymentTransaction, slug=txn_slug, fine=fine)
        txn.status = 'success'
        txn.gateway_transaction_id = request.data.get('gateway_transaction_id', txn.gateway_transaction_id)
        txn.save()

        fine.status = 'paid'
        fine.payment_method = txn.gateway
        fine.payment_reference = txn.gateway_transaction_id
        fine.paid_at = timezone.now()
        fine.save()

        return Response({'fine': FineSerializer(fine).data, 'transaction': PaymentTransactionSerializer(txn).data})


# ─── Reservation ViewSet ───────────────────────────────────────────────────────

class ReservationViewSet(viewsets.ModelViewSet):
    serializer_class = ReservationSerializer
    lookup_field = 'slug'
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['status']

    def get_queryset(self):
        user = self.request.user
        if user.role in ['librarian', 'admin']:
            return Reservation.objects.all().select_related('user', 'book')
        return Reservation.objects.filter(user=user).select_related('book')

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def cancel(self, request, slug=None):
        reservation = self.get_object()
        if reservation.user != request.user and request.user.role not in ['librarian', 'admin']:
            return Response({'detail': 'Forbidden.'}, status=status.HTTP_403_FORBIDDEN)
        reservation.status = 'cancelled'
        reservation.save()
        return Response(ReservationSerializer(reservation).data)


# ─── Announcement ViewSet ──────────────────────────────────────────────────────

class AnnouncementViewSet(viewsets.ModelViewSet):
    serializer_class = AnnouncementSerializer
    lookup_field = 'slug'
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = Announcement.objects.filter(is_active=True)
        if user.role == 'student':
            qs = qs.filter(target_role__in=['all', 'student'])
        elif user.role == 'librarian':
            qs = qs.filter(target_role__in=['all', 'librarian'])
        return qs.select_related('created_by')

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsLibrarian()]
        return [IsAuthenticated()]


# ─── Student Management ViewSet ────────────────────────────────────────────────

class StudentManagementViewSet(viewsets.ModelViewSet):
    queryset = StudentProfile.objects.all().select_related('user')
    serializer_class = StudentProfileSerializer
    lookup_field = 'slug'
    permission_classes = [IsLibrarian]
    filter_backends = [filters.SearchFilter, DjangoFilterBackend]
    search_fields = ['user__first_name', 'user__last_name', 'student_id', 'department', 'course']
    filterset_fields = ['is_active', 'year_of_study', 'department']

    @action(detail=True, methods=['get'], url_path='borrowing-history')
    def borrowing_history(self, request, slug=None):
        profile = self.get_object()
        borrowings = Borrowing.objects.filter(user=profile.user).order_by('-borrow_date')
        return Response(BorrowingSerializer(borrowings, many=True).data)

    @action(detail=True, methods=['get'], url_path='fines')
    def student_fines(self, request, slug=None):
        profile = self.get_object()
        fines = Fine.objects.filter(user=profile.user)
        return Response(FineSerializer(fines, many=True).data)

    @action(detail=True, methods=['post'], url_path='toggle-active')
    def toggle_active(self, request, slug=None):
        profile = self.get_object()
        profile.is_active = not profile.is_active
        profile.save()
        return Response(StudentProfileSerializer(profile).data)


# ─── Payment Transaction ViewSet ───────────────────────────────────────────────

class PaymentTransactionViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = PaymentTransactionSerializer
    lookup_field = 'slug'
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['gateway', 'status']

    def get_queryset(self):
        user = self.request.user
        if user.role in ['librarian', 'admin']:
            return PaymentTransaction.objects.all().select_related('user', 'fine')
        return PaymentTransaction.objects.filter(user=user).select_related('fine')

    @action(detail=False, methods=['post'], url_path='mpesa-callback', permission_classes=[AllowAny])
    def mpesa_callback(self, request):
        """Daraja M-Pesa STK Push callback endpoint."""
        data = request.data
        try:
            result_code = data['Body']['stkCallback']['ResultCode']
            checkout_request_id = data['Body']['stkCallback']['CheckoutRequestID']
            txn = PaymentTransaction.objects.filter(
                gateway_transaction_id=checkout_request_id
            ).first()
            if txn:
                if result_code == 0:
                    txn.status = 'success'
                    txn.fine.status = 'paid'
                    txn.fine.paid_at = timezone.now()
                    txn.fine.save()
                else:
                    txn.status = 'failed'
                txn.gateway_response = data
                txn.save()
        except Exception:
            pass
        return Response({'ResultCode': 0, 'ResultDesc': 'Accepted'})
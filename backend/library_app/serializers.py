from rest_framework import serializers
from django.contrib.auth import authenticate
from django.utils import timezone
from .models import (
    User, StudentProfile, LibrarianProfile, Category, Author,
    Publisher, Book, Borrowing, Fine, Reservation, Announcement,
    PaymentTransaction
)


# ─── Auth Serializers ──────────────────────────────────────────────────────────

class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        user = authenticate(username=data['username'], password=data['password'])
        if not user:
            raise serializers.ValidationError("Invalid credentials.")
        if not user.is_active:
            raise serializers.ValidationError("Account is deactivated.")
        data['user'] = user
        return data


class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'slug', 'username', 'email', 'first_name', 'last_name',
                  'full_name', 'role', 'phone_number', 'profile_picture', 'date_joined']
        read_only_fields = ['slug', 'date_joined']

    def get_full_name(self, obj):
        return obj.get_full_name()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True)
    student_id = serializers.CharField(required=False, allow_blank=True)
    department = serializers.CharField(required=False, allow_blank=True)
    course = serializers.CharField(required=False, allow_blank=True)
    year_of_study = serializers.IntegerField(required=False, default=1)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'confirm_password', 'first_name',
                  'last_name', 'role', 'phone_number', 'student_id', 'department',
                  'course', 'year_of_study']

    def validate(self, data):
        if data['password'] != data.pop('confirm_password'):
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        if data.get('role') == 'student' and not data.get('student_id'):
            raise serializers.ValidationError({"student_id": "Student ID is required for students."})
        return data

    def create(self, validated_data):
        student_id = validated_data.pop('student_id', None)
        department = validated_data.pop('department', '')
        course = validated_data.pop('course', '')
        year_of_study = validated_data.pop('year_of_study', 1)

        user = User.objects.create_user(**validated_data)

        if user.role == 'student' and student_id:
            StudentProfile.objects.create(
                user=user, student_id=student_id,
                department=department, course=course,
                year_of_study=year_of_study
            )
        return user


# ─── Profile Serializers ───────────────────────────────────────────────────────

class StudentProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    current_borrowed_count = serializers.ReadOnlyField()
    can_borrow = serializers.ReadOnlyField()

    class Meta:
        model = StudentProfile
        fields = ['id', 'slug', 'user', 'student_id', 'department', 'course',
                  'year_of_study', 'max_books_allowed', 'is_active',
                  'current_borrowed_count', 'can_borrow']
        read_only_fields = ['slug']


class LibrarianProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = LibrarianProfile
        fields = ['id', 'slug', 'user', 'staff_id', 'department']
        read_only_fields = ['slug']


# ─── Catalog Serializers ───────────────────────────────────────────────────────

class CategorySerializer(serializers.ModelSerializer):
    book_count = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ['id', 'slug', 'name', 'description', 'icon', 'book_count', 'created_at']
        read_only_fields = ['slug', 'created_at']

    def get_book_count(self, obj):
        return obj.books.filter(is_active=True).count()


class AuthorSerializer(serializers.ModelSerializer):
    book_count = serializers.SerializerMethodField()

    class Meta:
        model = Author
        fields = ['id', 'slug', 'name', 'bio', 'nationality', 'book_count', 'created_at']
        read_only_fields = ['slug', 'created_at']

    def get_book_count(self, obj):
        return obj.books.filter(is_active=True).count()


class PublisherSerializer(serializers.ModelSerializer):
    class Meta:
        model = Publisher
        fields = ['id', 'slug', 'name', 'address', 'website']
        read_only_fields = ['slug']


class BookListSerializer(serializers.ModelSerializer):
    authors = AuthorSerializer(many=True, read_only=True)
    category = CategorySerializer(read_only=True)
    is_available = serializers.ReadOnlyField()

    class Meta:
        model = Book
        fields = ['id', 'slug', 'title', 'isbn', 'authors', 'category', 'cover_image',
                  'publication_year', 'edition', 'language', 'total_copies',
                  'available_copies', 'is_available', 'location', 'condition',
                  'fine_per_day', 'is_active']


class BookDetailSerializer(serializers.ModelSerializer):
    authors = AuthorSerializer(many=True, read_only=True)
    author_ids = serializers.PrimaryKeyRelatedField(
        queryset=Author.objects.all(), many=True, write_only=True, source='authors'
    )
    category = CategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(), write_only=True, source='category', required=False
    )
    publisher = PublisherSerializer(read_only=True)
    publisher_id = serializers.PrimaryKeyRelatedField(
        queryset=Publisher.objects.all(), write_only=True, source='publisher', required=False
    )
    is_available = serializers.ReadOnlyField()

    class Meta:
        model = Book
        fields = ['id', 'slug', 'title', 'isbn', 'authors', 'author_ids', 'publisher',
                  'publisher_id', 'category', 'category_id', 'description', 'cover_image',
                  'publication_year', 'edition', 'language', 'pages', 'total_copies',
                  'available_copies', 'is_available', 'location', 'condition',
                  'fine_per_day', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['slug', 'available_copies', 'created_at', 'updated_at']


# ─── Borrowing Serializers ─────────────────────────────────────────────────────

class BorrowingSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    book = BookListSerializer(read_only=True)
    book_slug = serializers.SlugRelatedField(
        queryset=Book.objects.all(), write_only=True, slug_field='slug', source='book'
    )
    issued_by = UserSerializer(read_only=True)
    is_overdue = serializers.ReadOnlyField()
    days_overdue = serializers.ReadOnlyField()
    calculated_fine = serializers.ReadOnlyField()

    class Meta:
        model = Borrowing
        fields = ['id', 'slug', 'user', 'book', 'book_slug', 'issued_by', 'borrow_date',
                  'due_date', 'return_date', 'status', 'notes', 'is_overdue',
                  'days_overdue', 'calculated_fine', 'created_at', 'updated_at']
        read_only_fields = ['slug', 'borrow_date', 'created_at', 'updated_at']

    def validate(self, data):
        book = data.get('book')
        if book and not book.is_available:
            raise serializers.ValidationError({"book_slug": "This book is not currently available."})
        return data

    def create(self, validated_data):
        request = self.context.get('request')
        book = validated_data['book']
        validated_data['user'] = request.user
        validated_data['issued_by'] = request.user
        if not validated_data.get('due_date'):
            validated_data['due_date'] = timezone.now() + timezone.timedelta(days=14)

        borrowing = super().create(validated_data)
        book.available_copies = max(0, book.available_copies - 1)
        book.save()
        return borrowing


class ReturnBookSerializer(serializers.Serializer):
    slug = serializers.SlugField()
    condition = serializers.ChoiceField(
        choices=['new', 'good', 'fair', 'poor'], required=False
    )
    notes = serializers.CharField(required=False, allow_blank=True)


# ─── Fine Serializers ──────────────────────────────────────────────────────────

class FineSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    borrowing = BorrowingSerializer(read_only=True)
    waived_by = UserSerializer(read_only=True)

    class Meta:
        model = Fine
        fields = ['id', 'slug', 'user', 'borrowing', 'amount', 'status',
                  'payment_method', 'payment_reference', 'paid_at',
                  'waived_by', 'waive_reason', 'created_at', 'updated_at']
        read_only_fields = ['slug', 'created_at', 'updated_at']


class WaiveFineSerializer(serializers.Serializer):
    waive_reason = serializers.CharField(min_length=10)


# ─── Payment Serializers ───────────────────────────────────────────────────────

class InitiatePaymentSerializer(serializers.Serializer):
    fine_slug = serializers.SlugField()
    gateway = serializers.ChoiceField(choices=['mpesa', 'paypal', 'stripe'])
    phone_number = serializers.CharField(required=False, allow_blank=True)
    # For PayPal / Stripe
    return_url = serializers.URLField(required=False, allow_blank=True)
    cancel_url = serializers.URLField(required=False, allow_blank=True)


class PaymentTransactionSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    fine = FineSerializer(read_only=True)

    class Meta:
        model = PaymentTransaction
        fields = ['id', 'slug', 'user', 'fine', 'gateway', 'gateway_transaction_id',
                  'amount', 'currency', 'status', 'gateway_response',
                  'phone_number', 'created_at', 'updated_at']
        read_only_fields = ['slug', 'created_at', 'updated_at']


# ─── Reservation Serializers ───────────────────────────────────────────────────

class ReservationSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    book = BookListSerializer(read_only=True)
    book_slug = serializers.SlugRelatedField(
        queryset=Book.objects.all(), write_only=True, slug_field='slug', source='book'
    )

    class Meta:
        model = Reservation
        fields = ['id', 'slug', 'user', 'book', 'book_slug', 'reserved_at',
                  'expires_at', 'status', 'notified']
        read_only_fields = ['slug', 'reserved_at', 'expires_at']

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


# ─── Announcement Serializers ──────────────────────────────────────────────────

class AnnouncementSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)

    class Meta:
        model = Announcement
        fields = ['id', 'slug', 'title', 'content', 'created_by', 'is_active',
                  'target_role', 'created_at', 'updated_at']
        read_only_fields = ['slug', 'created_at', 'updated_at']

    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)


# ─── Dashboard Serializers ─────────────────────────────────────────────────────

class StudentDashboardSerializer(serializers.Serializer):
    borrowed_books = serializers.IntegerField()
    overdue_books = serializers.IntegerField()
    total_fines = serializers.DecimalField(max_digits=10, decimal_places=2)
    pending_fines = serializers.DecimalField(max_digits=10, decimal_places=2)
    reservations = serializers.IntegerField()
    recent_borrowings = BorrowingSerializer(many=True)
    active_fines = FineSerializer(many=True)


class LibrarianDashboardSerializer(serializers.Serializer):
    total_books = serializers.IntegerField()
    total_borrowings = serializers.IntegerField()
    overdue_borrowings = serializers.IntegerField()
    total_students = serializers.IntegerField()
    total_fines_collected = serializers.DecimalField(max_digits=10, decimal_places=2)
    pending_fines_amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    recent_borrowings = BorrowingSerializer(many=True)
    recent_fines = FineSerializer(many=True)
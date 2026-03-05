from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    AuthViewSet, DashboardViewSet,
    CategoryViewSet, AuthorViewSet, PublisherViewSet, BookViewSet,
    BorrowingViewSet, FineViewSet, ReservationViewSet,
    AnnouncementViewSet, StudentManagementViewSet, PaymentTransactionViewSet
)

router = DefaultRouter()

# Auth
router.register(r'auth', AuthViewSet, basename='auth')

# Dashboard
router.register(r'dashboard', DashboardViewSet, basename='dashboard')

# Catalog
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'authors', AuthorViewSet, basename='author')
router.register(r'publishers', PublisherViewSet, basename='publisher')
router.register(r'books', BookViewSet, basename='book')

# Circulation
router.register(r'borrowings', BorrowingViewSet, basename='borrowing')
router.register(r'fines', FineViewSet, basename='fine')
router.register(r'reservations', ReservationViewSet, basename='reservation')

# Payments
router.register(r'transactions', PaymentTransactionViewSet, basename='transaction')

# Announcements
router.register(r'announcements', AnnouncementViewSet, basename='announcement')

# Librarian - Student Management
router.register(r'students', StudentManagementViewSet, basename='student-management')

urlpatterns = [
    path('', include(router.urls)),
]
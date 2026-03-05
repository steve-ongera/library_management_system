# 📚 UniLibrary — University Library Management System

A full-stack, production-ready university library management system with role-based access control, digital payments (M-Pesa, PayPal, Stripe), and a modern React UI backed by Django REST Framework.

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Django 4.2+, Django REST Framework |
| Auth | SimpleJWT (JWT access + refresh tokens) |
| Database | PostgreSQL |
| Frontend | React 18 + Vite |
| Routing | React Router v6 |
| HTTP Client | Axios |
| Payments | M-Pesa Daraja API, PayPal REST SDK, Stripe |
| Styling | Custom CSS (design system with CSS variables) |

---

## 📁 Project Structure

```
library-system/
├── backend/
│   ├── config/
│   │   ├── settings.py          # Django settings (JWT, CORS, payments)
│   │   └── urls.py              # Root URL → api/
│   └── library/
│       ├── models.py            # All Django models (User, Book, Borrowing, Fine…)
│       ├── serializers.py       # DRF serializers
│       ├── views.py             # ViewSets (auth, books, borrowings, fines…)
│       ├── urls.py              # App URLs (registered with DefaultRouter)
│       ├── permissions.py       # IsLibrarian, IsStudent, IsOwnerOrLibrarian
│       └── payment_services.py  # MpesaService, PayPalService, StripeService
│
└── frontend/
    └── src/
        ├── App.jsx              # Root app, routing, ProtectedRoute, AppShell
        ├── context/
        │   └── AuthContext.jsx  # Auth state, login, logout, role helpers
        ├── services/
        │   └── api.js           # Axios instance + all API modules
        ├── styles/
        │   └── globalStyles.css # Full design system (CSS variables, components)
        ├── components/
        │   └── common/
        │       ├── Sidebar.jsx  # Responsive, collapsible sidebar (role-aware nav)
        │       └── Navbar.jsx   # Top bar with search, notifications, user menu
        └── pages/
            ├── auth/
            │   ├── LoginPage.jsx    # Split-panel login with role-based redirect
            │   └── RegisterPage.jsx # Student self-registration
            ├── student/
            │   ├── Dashboard.jsx    # Stats, recent borrowings, pending fines
            │   ├── Books.jsx        # Browse + reserve books
            │   ├── MyBooks.jsx      # Full borrowing history
            │   ├── Fines.jsx        # Pay fines (M-Pesa / PayPal / Stripe)
            │   ├── Reservations.jsx # View / cancel reservations
            │   ├── Announcements.jsx
            │   ├── Transactions.jsx
            │   └── Profile.jsx
            └── librarian/
                ├── Dashboard.jsx    # Operational stats + recent activity
                ├── Books.jsx        # Full CRUD for book catalog
                ├── IssueBook.jsx    # Issue book to student
                ├── ReturnBook.jsx   # Process return + auto-generate fine
                ├── Overdue.jsx      # All overdue borrowings
                ├── Borrowings.jsx   # All borrowings with status filter
                ├── Fines.jsx        # Manage fines, waive with reason
                ├── Reservations.jsx
                ├── Transactions.jsx # Payment transaction ledger
                ├── Students.jsx     # Student management + borrowing history
                ├── Categories.jsx   # Book category CRUD
                ├── Authors.jsx      # Author CRUD
                ├── Announcements.jsx
                └── Profile.jsx
```

---

## 🗄️ Data Models

| Model | Key Fields |
|-------|-----------|
| `User` | role (student/librarian/admin), slug |
| `StudentProfile` | student_id, department, course, year, max_books_allowed |
| `LibrarianProfile` | staff_id, department |
| `Book` | title, isbn, authors (M2M), category, total_copies, available_copies, fine_per_day, slug |
| `Borrowing` | user, book, borrow_date, due_date, return_date, status, slug |
| `Fine` | borrowing, amount, status (pending/paid/waived), payment_method |
| `Reservation` | user, book, expires_at, status |
| `PaymentTransaction` | fine, gateway, gateway_transaction_id, amount, status |
| `Announcement` | title, content, target_role, created_by |

All models use **slug** as the lookup field in URLs.

---

## 🚀 Getting Started

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL 14+

---

### Backend Setup

```bash
# 1. Navigate to backend
cd library-system/backend

# 2. Create virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# 3. Install dependencies
pip install django djangorestframework djangorestframework-simplejwt \
            django-cors-headers django-filter Pillow psycopg2-binary \
            stripe paypalrestsdk requests python-dotenv

# 4. Create .env file
cat > .env << EOF
SECRET_KEY=your-secret-key-here
DEBUG=True
DB_NAME=library_db
DB_USER=postgres
DB_PASSWORD=your_db_password
DB_HOST=localhost
DB_PORT=5432
FRONTEND_URL=http://localhost:5173

# M-Pesa (Safaricom Daraja Sandbox)
MPESA_CONSUMER_KEY=your_consumer_key
MPESA_CONSUMER_SECRET=your_consumer_secret
MPESA_SHORTCODE=174379
MPESA_PASSKEY=your_passkey
MPESA_CALLBACK_URL=https://your-ngrok-url.ngrok.io/api/transactions/mpesa-callback/

# PayPal
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_secret
PAYPAL_MODE=sandbox

# Stripe
STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
EOF

# 5. Create the database
createdb library_db

# 6. Run migrations
python manage.py makemigrations library
python manage.py migrate

# 7. Create superuser (admin / librarian)
python manage.py createsuperuser

# 8. Load sample data (optional)
python manage.py loaddata fixtures/sample_data.json

# 9. Run development server
python manage.py runserver
```

The API will be available at: `http://localhost:8000/api/`

---

### Frontend Setup

```bash
# 1. Navigate to frontend
cd library-system/frontend

# 2. Install dependencies
npm install

# 3. Create .env file
echo "VITE_API_URL=http://localhost:8000/api" > .env

# 4. Start dev server
npm run dev
```

The app will be at: `http://localhost:5173`

---

## 🔐 Authentication & Roles

### Login Flow
1. POST `/api/auth/login/` → returns `access` (1h) + `refresh` (7d) JWT tokens
2. Frontend stores tokens in `localStorage`
3. Axios interceptor auto-attaches `Authorization: Bearer <token>` to every request
4. On 401, interceptor auto-refreshes token using the refresh endpoint
5. After login, user is redirected based on `user.role`:
   - `student` → `/student/dashboard`
   - `librarian` / `admin` → `/librarian/dashboard`

### Role Permissions

| Action | Student | Librarian | Admin |
|--------|---------|-----------|-------|
| Browse books | ✅ | ✅ | ✅ |
| Reserve books | ✅ | ✅ | ✅ |
| Pay fines | ✅ | ✅ | ✅ |
| Issue books | ❌ | ✅ | ✅ |
| Return books | ❌ | ✅ | ✅ |
| Add/edit books | ❌ | ✅ | ✅ |
| Waive fines | ❌ | ✅ | ✅ |
| Manage students | ❌ | ✅ | ✅ |
| Post announcements | ❌ | ✅ | ✅ |
| View all transactions | ❌ | ✅ | ✅ |

---

## 💳 Payment Integration

### M-Pesa (Daraja STK Push)
1. Student selects M-Pesa, enters phone number
2. Backend calls Safaricom Daraja `stkpush/v1/processrequest`
3. Student receives STK push on phone and enters M-Pesa PIN
4. Safaricom sends callback to `/api/transactions/mpesa-callback/`
5. Backend auto-marks fine as **paid**

**For local testing with M-Pesa callback**, use [ngrok](https://ngrok.com):
```bash
ngrok http 8000
# Update MPESA_CALLBACK_URL in .env with the ngrok HTTPS URL
```

### PayPal
1. Student clicks PayPal pay
2. Backend creates a PayPal order and returns `approval_url`
3. Student is redirected to PayPal approval page
4. On return, frontend confirms payment via `/confirm-payment/`

### Stripe / Card
1. Backend creates a `PaymentIntent` and returns `client_secret`
2. Frontend uses **Stripe.js** with the `client_secret` to complete card payment
3. Install Stripe.js: `npm install @stripe/stripe-js @stripe/react-stripe-js`

---

## 🌐 API Endpoints

All endpoints are prefixed with `/api/`.

```
POST   /api/auth/login/               Login, returns JWT
POST   /api/auth/register/            Student self-registration
POST   /api/auth/logout/              Blacklist refresh token
GET    /api/auth/me/                  Current user profile
PUT    /api/auth/me/update/           Update profile

GET    /api/dashboard/student/        Student dashboard stats
GET    /api/dashboard/librarian/      Librarian dashboard stats

GET    /api/books/                    List books (search, filter, paginate)
POST   /api/books/                    Create book (librarian)
GET    /api/books/{slug}/             Book detail
PUT    /api/books/{slug}/             Update book
DELETE /api/books/{slug}/             Delete book

GET    /api/borrowings/               All borrowings (librarian sees all)
POST   /api/borrowings/issue/         Issue book to student
POST   /api/borrowings/return/        Process return + auto fine
GET    /api/borrowings/overdue/       All overdue borrowings
GET    /api/borrowings/my-history/    Current user's history

GET    /api/fines/                    List fines
POST   /api/fines/{slug}/waive/       Waive a fine
POST   /api/fines/{slug}/initiate-payment/   Start M-Pesa/PayPal/Stripe
POST   /api/fines/{slug}/confirm-payment/    Confirm payment

POST   /api/transactions/mpesa-callback/     M-Pesa Daraja webhook

GET    /api/reservations/             List reservations
POST   /api/reservations/             Create reservation
POST   /api/reservations/{slug}/cancel/  Cancel reservation

GET    /api/students/                 List students (librarian)
GET    /api/students/{slug}/borrowing-history/
GET    /api/students/{slug}/fines/
POST   /api/students/{slug}/toggle-active/

GET    /api/categories/               List categories
GET    /api/authors/                  List authors
GET    /api/announcements/            List announcements (role-filtered)
GET    /api/transactions/             List payment transactions
```

---

## ⚙️ Django Admin

Access the Django admin panel at `http://localhost:8000/admin/`

Use the superuser account to:
- Create librarian accounts (set `role = librarian`)
- Create `LibrarianProfile` records for librarians
- Manage all models directly

---

## 🔧 Environment Variables Reference

### Backend (.env)
```env
SECRET_KEY=                    # Django secret key
DEBUG=True                     # Set False in production
DB_NAME=library_db
DB_USER=postgres
DB_PASSWORD=
DB_HOST=localhost
DB_PORT=5432
FRONTEND_URL=http://localhost:5173

# M-Pesa
MPESA_CONSUMER_KEY=
MPESA_CONSUMER_SECRET=
MPESA_SHORTCODE=174379
MPESA_PASSKEY=
MPESA_CALLBACK_URL=
MPESA_ENV=sandbox              # or production

# PayPal
PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=
PAYPAL_MODE=sandbox            # or live

# Stripe
STRIPE_PUBLIC_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_HOST_USER=
EMAIL_HOST_PASSWORD=
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:8000/api
VITE_STRIPE_PUBLIC_KEY=pk_test_...
```

---

## 🚢 Production Deployment

### Backend
```bash
# Install production server
pip install gunicorn whitenoise

# Collect static files
python manage.py collectstatic

# Run with Gunicorn
gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 3
```

### Frontend
```bash
npm run build
# Serve the dist/ folder with Nginx or deploy to Vercel/Netlify
```

### Recommended Stack
- **Backend**: AWS EC2 / DigitalOcean Droplet + Gunicorn + Nginx
- **Database**: AWS RDS PostgreSQL / Supabase
- **Frontend**: Vercel / Netlify
- **Media Files**: AWS S3 + django-storages
- **SSL**: Let's Encrypt (Certbot)

---

## 🧪 Running Tests

```bash
# Backend
cd backend
python manage.py test library

# Frontend (if you add tests)
cd frontend
npm test
```

---

## 📋 Fine Calculation

Fines are calculated automatically:
- Each book has a configurable `fine_per_day` (default: **KES 5.00/day**)
- When a book is returned after its `due_date`, the system calculates:
  ```
  fine_amount = days_overdue × book.fine_per_day
  ```
- A `Fine` record is auto-created on return
- Students can pay via M-Pesa, PayPal, or Stripe
- Librarians can waive fines with a documented reason

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m 'Add my feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a Pull Request

---

## 📄 License

MIT License — free to use, modify, and distribute.

---

> Built for university libraries in Kenya and Africa — M-Pesa first, globally ready.
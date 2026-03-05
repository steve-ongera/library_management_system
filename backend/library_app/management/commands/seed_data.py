"""
Management command: seed_data
─────────────────────────────────────────────────────────────────────────────
Populates the database with realistic sample data for development / demo.

Usage
─────
  # Full seed (all models)
  python manage.py seed_data

  # Partial seed – only specific sections
  python manage.py seed_data --only users books

  # Wipe all library data first, then re-seed
  python manage.py seed_data --flush

  # Control quantity
  python manage.py seed_data --students 30 --books 80 --borrowings 60

  # Quiet mode (no progress output)
  python manage.py seed_data --quiet

Seeded sections (in dependency order)
─────────────────────────────────────
  1. users          – 1 admin, 3 librarians, N students
  2. catalog        – publishers, authors, categories
  3. books          – N books spread across categories
  4. borrowings     – active, returned, and overdue records
  5. fines          – pending, paid, and waived fines
  6. reservations   – active reservations for available books
  7. announcements  – library announcements from librarians
  8. transactions   – sample payment transactions

Credentials
───────────
  Admin:      admin / Admin@1234
  Librarians: librarian1 / Lib@1234  …  librarian3 / Lib@1234
  Students:   student001 / Stu@1234  …  studentNNN / Stu@1234
"""

import random
from datetime import timedelta
from decimal import Decimal

from django.contrib.auth.hashers import make_password
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone

from library_app.models import (
    Announcement,
    Author,
    Book,
    Borrowing,
    Category,
    Fine,
    LibrarianProfile,
    PaymentTransaction,
    Publisher,
    Reservation,
    StudentProfile,
    User,
)

# ─── Static seed data ─────────────────────────────────────────────────────────

CATEGORIES = [
    ("Computer Science",       "cs",          "Algorithms, software, networking, AI"),
    ("Mathematics",            "mathematics", "Pure and applied mathematics"),
    ("Engineering",            "engineering", "Civil, mechanical, electrical engineering"),
    ("Medicine & Health",      "medicine",    "Clinical medicine, anatomy, pharmacology"),
    ("Business & Economics",   "business",    "Management, economics, finance"),
    ("Law",                    "law",         "Constitutional, criminal and commercial law"),
    ("Literature & Language",  "literature",  "Fiction, poetry, linguistics"),
    ("History & Philosophy",   "history",     "World history, philosophy, ethics"),
    ("Natural Sciences",       "sciences",    "Biology, chemistry, physics"),
    ("Social Sciences",        "social",      "Psychology, sociology, anthropology"),
]

PUBLISHERS = [
    ("Pearson Education",     "https://www.pearson.com"),
    ("O'Reilly Media",        "https://www.oreilly.com"),
    ("Springer Nature",       "https://www.springer.com"),
    ("Oxford University Press","https://global.oup.com"),
    ("Cambridge University Press","https://www.cambridge.org"),
    ("McGraw-Hill",           "https://www.mheducation.com"),
    ("Wiley",                 "https://www.wiley.com"),
    ("East African Publishers","https://www.eastafricanpublishers.com"),
    ("Longhorn Publishers",   "https://longhornpublishers.com"),
    ("Jomo Kenyatta Foundation","https://www.jkf.co.ke"),
]

AUTHORS = [
    ("Donald E. Knuth",       "American",  "Legendary computer scientist, author of TAOCP"),
    ("Wangari Maathai",       "Kenyan",    "Nobel Peace Prize laureate, environmentalist"),
    ("Thomas H. Cormen",      "American",  "Co-author of Introduction to Algorithms"),
    ("Chinua Achebe",         "Nigerian",  "Father of African literature"),
    ("Ngugi wa Thiong'o",     "Kenyan",    "Renowned Kenyan novelist and playwright"),
    ("Andrew S. Tanenbaum",   "American",  "Author of Modern Operating Systems"),
    ("Robert C. Martin",      "American",  "Software craftsmanship advocate, Clean Code"),
    ("Marcia Luyties",        "South African","Mathematics textbook author"),
    ("Richard Feynman",       "American",  "Nobel-winning physicist and educator"),
    ("James Mwangi",          "Kenyan",    "Banking and finance expert"),
    ("Yuval Noah Harari",     "Israeli",   "Author of Sapiens and Homo Deus"),
    ("Wole Soyinka",          "Nigerian",  "Nobel laureate in Literature"),
    ("Martin Fowler",         "British",   "Software architecture and refactoring"),
    ("Eric Evans",            "American",  "Domain-Driven Design author"),
    ("Lupita Nyong'o",        "Kenyan",    "Oscar-winning actress and children's author"),
    ("Ken Bloch",             "Danish",    "Control systems and engineering"),
    ("Barbara Oakley",        "American",  "Learning how to learn, STEM education"),
    ("Graca Machel",          "Mozambican","Humanitarian and education advocate"),
    ("Stuart Russell",        "British",   "Artificial Intelligence: A Modern Approach"),
    ("Charles Kimani",        "Kenyan",    "East African business law specialist"),
]

# (title, isbn_suffix, category_key, author_indices, year, pages, fine_per_day, copies)
BOOKS_DATA = [
    # Computer Science
    ("Introduction to Algorithms",               "978-0262033848", "cs",          [2],     2022, 1292, "5.00", 4),
    ("The Art of Computer Programming Vol 1",    "978-0201896831", "cs",          [0],     2011, 672,  "8.00", 2),
    ("Clean Code",                               "978-0132350884", "cs",          [6],     2008, 464,  "5.00", 3),
    ("Modern Operating Systems",                 "978-0133591620", "cs",          [5],     2014, 1136, "5.00", 3),
    ("Design Patterns",                          "978-0201633610", "cs",          [6, 12], 1994, 395,  "5.00", 2),
    ("Domain-Driven Design",                     "978-0321125217", "cs",          [13],    2003, 560,  "6.00", 2),
    ("Artificial Intelligence: A Modern Approach","978-0136042594","cs",          [18],    2020, 1132, "8.00", 3),
    ("Refactoring",                              "978-0134757599", "cs",          [12],    2018, 448,  "5.00", 2),

    # Mathematics
    ("Calculus: Early Transcendentals",          "978-1285741550", "mathematics", [7],     2015, 1368, "4.00", 5),
    ("Linear Algebra and Its Applications",      "978-0321982384", "mathematics", [7],     2016, 576,  "4.00", 4),
    ("Discrete Mathematics and Its Applications","978-0073383095", "mathematics", [7],     2018, 992,  "4.00", 3),
    ("Introduction to Probability",              "978-1886529236", "mathematics", [7],     2019, 544,  "5.00", 3),

    # Engineering
    ("Engineering Mechanics: Statics",           "978-0133918922", "engineering", [15],    2016, 752,  "5.00", 4),
    ("Control Systems Engineering",              "978-1118170519", "engineering", [15],    2017, 944,  "6.00", 3),
    ("Electrical Engineering: Principles",       "978-0133116649", "engineering", [15],    2015, 928,  "5.00", 3),

    # Medicine
    ("Gray's Anatomy",                           "978-0702052309", "medicine",    [7],     2020, 1584, "10.00",2),
    ("Harrison's Principles of Internal Medicine","978-1259644030","medicine",    [7],     2018, 4000, "10.00",2),
    ("Pharmacology for Nurses",                  "978-0135203958", "medicine",    [7],     2019, 672,  "6.00", 3),

    # Business
    ("Principles of Economics",                  "978-1305585126", "business",    [9],     2018, 896,  "5.00", 5),
    ("Financial Accounting",                     "978-1260247930", "business",    [9],     2019, 784,  "5.00", 4),
    ("Business in East Africa",                  "978-9966250100", "business",    [9],     2020, 320,  "4.00", 3),

    # Law
    ("Constitutional Law of Kenya",              "978-9966252000", "law",         [19],    2021, 480,  "5.00", 3),
    ("East African Business Law",                "978-9966252001", "law",         [19],    2019, 360,  "5.00", 3),
    ("Criminal Law Essentials",                  "978-0198747635", "law",         [19],    2020, 512,  "5.00", 2),

    # Literature
    ("Things Fall Apart",                        "978-0385474542", "literature",  [3],     1958, 209,  "3.00", 5),
    ("Weep Not Child",                           "978-0435908133", "literature",  [4],     1964, 150,  "3.00", 4),
    ("A Grain of Wheat",                         "978-0143039792", "literature",  [4],     1967, 288,  "3.00", 3),
    ("Season of Migration to the North",         "978-0435909536", "literature",  [11],    1969, 169,  "3.00", 2),

    # History & Philosophy
    ("Sapiens: A Brief History of Humankind",    "978-0062316097", "history",     [10],    2015, 443,  "4.00", 4),
    ("Unbowed: A Memoir",                        "978-0307275202", "history",     [1],     2006, 326,  "4.00", 3),
    ("The Challenge for Africa",                 "978-0307390288", "history",     [1],     2009, 352,  "4.00", 3),

    # Natural Sciences
    ("The Feynman Lectures on Physics Vol 1",    "978-0465024933", "sciences",    [8],     2011, 560,  "6.00", 2),
    ("Biology: A Global Approach",               "978-1292170435", "sciences",    [7],     2017, 1464, "5.00", 3),
    ("Chemistry: The Central Science",           "978-0134414232", "sciences",    [7],     2018, 1232, "5.00", 3),

    # Social Sciences
    ("A Mind for Numbers",                       "978-0399165245", "social",      [16],    2014, 336,  "4.00", 3),
    ("Thinking, Fast and Slow",                  "978-0374533557", "social",      [10],    2011, 499,  "4.00", 4),
    ("Half of a Yellow Sun",                     "978-1400095209", "social",      [3],     2006, 433,  "4.00", 3),
    ("Americanah",                               "978-0307455925", "social",      [3],     2013, 477,  "4.00", 2),
]

DEPARTMENTS = [
    ("Computer Science",      ["BSc. Computer Science", "BSc. Software Engineering", "BSc. Data Science"]),
    ("Engineering",           ["BEng. Civil Engineering", "BEng. Electrical Engineering", "BEng. Mechanical Engineering"]),
    ("Medicine",              ["MBChB Medicine", "BSc. Nursing", "BSc. Pharmacy"]),
    ("Business",              ["BBA Business Administration", "BCom. Accounting", "BCom. Finance"]),
    ("Law",                   ["LLB Law"]),
    ("Mathematics",           ["BSc. Mathematics", "BSc. Statistics", "BSc. Actuarial Science"]),
    ("Natural Sciences",      ["BSc. Biology", "BSc. Chemistry", "BSc. Physics"]),
    ("Social Sciences",       ["BA. Psychology", "BA. Sociology", "BA. Anthropology"]),
    ("Literature",            ["BA. English Literature", "BA. Swahili & African Languages"]),
    ("History & Philosophy",  ["BA. History", "BA. Philosophy", "BA. Political Science"]),
]

FIRST_NAMES = [
    "Amina", "Brian", "Cynthia", "David", "Esther", "Felix", "Grace", "Hassan",
    "Irene", "James", "Kendi", "Liam", "Mercy", "Noah", "Olivia", "Patrick",
    "Queen", "Robert", "Sophia", "Timothy", "Ursula", "Victor", "Wanjiru",
    "Xavier", "Yvonne", "Zacharia", "Aisha", "Benson", "Caroline", "Daniel",
    "Elizabeth", "Francis", "Gladys", "Henry", "Isabella", "Joseph", "Kalani",
    "Linda", "Michael", "Nancy", "Oscar", "Purity", "Quincy", "Ruth", "Samuel",
    "Tabitha", "Ugo", "Violet", "William", "Xena",
]

LAST_NAMES = [
    "Kamau", "Odhiambo", "Wanjiku", "Mwangi", "Otieno", "Kariuki", "Njoroge",
    "Achieng", "Mutua", "Kimani", "Omondi", "Wairimu", "Githinji", "Adhiambo",
    "Njenga", "Owino", "Wambua", "Kiprotich", "Ndung'u", "Auma", "Mburu",
    "Ogutu", "Waweru", "Chebet", "Nyambura", "Musyoka", "Opondo", "Kiptoo",
    "Macharia", "Awino", "Maina", "Odinga", "Wangeci", "Tanui", "Njeru",
    "Akoth", "Ng'ang'a", "Rotich", "Wanjiru", "Ouma",
]

ANNOUNCEMENT_CONTENT = [
    {
        "title": "Extended Library Hours During Examinations",
        "content": (
            "Dear students and staff, the library will be operating extended hours "
            "during the upcoming examination period from 7:00 AM to 11:00 PM, "
            "Monday through Sunday. Additional study spaces will be opened on the "
            "second floor. Please carry your valid student ID for access."
        ),
        "target_role": "all",
    },
    {
        "title": "New Arrivals: Computer Science Collection",
        "content": (
            "We are pleased to announce the addition of over 50 new titles to our "
            "Computer Science collection. Highlights include the latest editions of "
            "Algorithm Design, Machine Learning, and Cloud Computing titles. "
            "Visit the CS section on the 3rd floor or use the online catalog to reserve."
        ),
        "target_role": "all",
    },
    {
        "title": "Fine Waiver Amnesty Week",
        "content": (
            "From Monday 15th to Friday 19th, the library will be running a fine amnesty "
            "programme. Students with overdue fines of up to KES 500 can have their fines "
            "fully waived upon returning all outstanding books. Visit the circulation desk "
            "with your student ID. This offer is not transferable."
        ),
        "target_role": "student",
    },
    {
        "title": "Librarian Staff Meeting — Action Required",
        "content": (
            "All library staff are reminded of the monthly performance review meeting "
            "scheduled for this Friday at 2:00 PM in the Conference Room B, Ground Floor. "
            "Please bring your circulation statistics report for the past month. "
            "Attendance is mandatory."
        ),
        "target_role": "librarian",
    },
    {
        "title": "Digital Resources & eBook Access",
        "content": (
            "UniLibrary now provides access to JSTOR, ScienceDirect, and the African "
            "Journals OnLine (AJOL) databases. Access is available both on-campus and "
            "remotely using your university email credentials. Visit the library portal "
            "at library.university.ac.ke for setup instructions."
        ),
        "target_role": "all",
    },
    {
        "title": "Book Return Reminder — End of Semester",
        "content": (
            "All students are reminded that all borrowed books must be returned by "
            "Friday before the end-of-semester break. Failure to return books will "
            "result in a hold being placed on your academic records, which will "
            "prevent registration for the next semester. Fines will continue to "
            "accrue during the break period."
        ),
        "target_role": "student",
    },
]

PHONE_PREFIXES = ["0712", "0722", "0733", "0741", "0745", "0756", "0768", "0790", "0701", "0110"]


# ─── Helpers ──────────────────────────────────────────────────────────────────

def rnd_phone():
    return random.choice(PHONE_PREFIXES) + "".join([str(random.randint(0, 9)) for _ in range(6)])


def rnd_date_past(min_days=1, max_days=120):
    return timezone.now() - timedelta(days=random.randint(min_days, max_days))


def rnd_date_future(min_days=1, max_days=30):
    return timezone.now() + timedelta(days=random.randint(min_days, max_days))


# ─── Command ──────────────────────────────────────────────────────────────────

class Command(BaseCommand):
    help = "Seed the database with realistic sample data for UniLibrary"

    # ── Argument declaration ──────────────────────────────────────────────────
    def add_arguments(self, parser):
        parser.add_argument(
            "--students", type=int, default=20,
            help="Number of student accounts to create (default: 20)",
        )
        parser.add_argument(
            "--books", type=int, default=None,
            help="Number of books to seed (default: all built-in books)",
        )
        parser.add_argument(
            "--borrowings", type=int, default=40,
            help="Number of borrowing records to create (default: 40)",
        )
        parser.add_argument(
            "--flush", action="store_true",
            help="Delete all existing library data before seeding",
        )
        parser.add_argument(
            "--only", nargs="+",
            choices=["users", "catalog", "books", "borrowings", "fines", "reservations", "announcements", "transactions"],
            help="Seed only specific sections",
        )
        parser.add_argument(
            "--quiet", action="store_true",
            help="Suppress all output except errors",
        )

    # ── Entry point ───────────────────────────────────────────────────────────
    def handle(self, *args, **options):
        self.quiet = options["quiet"]
        self.only = set(options["only"]) if options["only"] else None

        if options["flush"]:
            self._flush()

        with transaction.atomic():
            self._header("UniLibrary Database Seeder")

            librarians = []
            students = []
            books = []

            if self._should("users"):
                self._create_admin()
                librarians = self._create_librarians()
                students = self._create_students(options["students"])

            if self._should("catalog"):
                self._create_catalog()

            if self._should("books"):
                books = self._create_books(options["books"])

            # Re-fetch if partial run
            if not librarians:
                librarians = list(User.objects.filter(role="librarian"))
            if not students:
                students = list(User.objects.filter(role="student"))
            if not books:
                books = list(Book.objects.filter(is_active=True))

            borrowings = []
            if self._should("borrowings") and students and books and librarians:
                borrowings = self._create_borrowings(students, books, librarians, options["borrowings"])

            if self._should("fines") and borrowings:
                self._create_fines(borrowings)

            if self._should("reservations") and students and books:
                self._create_reservations(students, books)

            if self._should("announcements") and librarians:
                self._create_announcements(librarians)

            if self._should("transactions"):
                self._create_transactions()

        self._success("\n✅  Seeding complete!\n")
        self._print_credentials()

    # ── Flush ─────────────────────────────────────────────────────────────────
    def _flush(self):
        self._warn("⚠  Flushing all library data…")
        models_to_flush = [
            PaymentTransaction, Fine, Borrowing, Reservation,
            Announcement, Book, Author, Publisher, Category,
            LibrarianProfile, StudentProfile,
        ]
        for model in models_to_flush:
            count, _ = model.objects.all().delete()
            if count and not self.quiet:
                self.stdout.write(f"   Deleted {count} {model.__name__} records")
        # Delete non-superuser accounts
        deleted, _ = User.objects.filter(is_superuser=False).delete()
        if not self.quiet:
            self.stdout.write(f"   Deleted {deleted} User records")
        self._success("   Flush complete.\n")

    # ── Users ─────────────────────────────────────────────────────────────────
    def _create_admin(self):
        self._section("👤  Users — Admin")
        if User.objects.filter(username="admin").exists():
            self._info("   admin already exists, skipping.")
            return
        User.objects.create(
            username="admin",
            email="admin@university.ac.ke",
            first_name="System",
            last_name="Administrator",
            role="admin",
            phone_number=rnd_phone(),
            is_staff=True,
            is_superuser=True,
            password=make_password("Admin@1234"),
        )
        self._ok("   Created: admin / Admin@1234")

    def _create_librarians(self):
        self._section("👤  Users — Librarians")
        librarians = []
        lib_data = [
            ("librarian1", "Alice",   "Wambui",   "LIB001", "Circulation & Reference"),
            ("librarian2", "Bernard", "Omondi",   "LIB002", "Technical Services"),
            ("librarian3", "Carolyne","Ndung'u",  "LIB003", "Digital Resources"),
        ]
        for username, first, last, staff_id, dept in lib_data:
            user, created = User.objects.get_or_create(
                username=username,
                defaults={
                    "email": f"{username}@university.ac.ke",
                    "first_name": first,
                    "last_name": last,
                    "role": "librarian",
                    "phone_number": rnd_phone(),
                    "is_staff": True,
                    "password": make_password("Lib@1234"),
                },
            )
            if created:
                LibrarianProfile.objects.create(user=user, staff_id=staff_id, department=dept)
                self._ok(f"   Created: {username} / Lib@1234  ({dept})")
            else:
                self._info(f"   Skipped: {username} already exists")
            librarians.append(user)
        return librarians

    def _create_students(self, count):
        self._section(f"👤  Users — Students ({count})")
        students = []
        used_names = set()
        hashed_pw = make_password("Stu@1234")

        for i in range(1, count + 1):
            # Unique name pair
            attempts = 0
            while True:
                first = random.choice(FIRST_NAMES)
                last = random.choice(LAST_NAMES)
                key = (first, last)
                if key not in used_names or attempts > 50:
                    used_names.add(key)
                    break
                attempts += 1

            username = f"student{i:03d}"
            student_id = f"UNI{2021 + random.randint(0, 3)}{i:04d}"
            dept_name, courses = random.choice(DEPARTMENTS)
            course = random.choice(courses)
            year = random.randint(1, 4)

            user, created = User.objects.get_or_create(
                username=username,
                defaults={
                    "email": f"{username}@student.university.ac.ke",
                    "first_name": first,
                    "last_name": last,
                    "role": "student",
                    "phone_number": rnd_phone(),
                    "password": hashed_pw,
                },
            )
            if created:
                StudentProfile.objects.create(
                    user=user,
                    student_id=student_id,
                    department=dept_name,
                    course=course,
                    year_of_study=year,
                    max_books_allowed=5,
                    is_active=True,
                )
                students.append(user)

        self._ok(f"   Created {len(students)} student(s)  (password: Stu@1234)")
        return students

    # ── Catalog ───────────────────────────────────────────────────────────────
    def _create_catalog(self):
        self._section("📂  Catalog — Categories, Publishers, Authors")

        # Categories
        cat_map = {}
        for name, slug, desc in CATEGORIES:
            obj, created = Category.objects.get_or_create(
                slug=slug,
                defaults={"name": name, "description": desc},
            )
            cat_map[slug] = obj
            if created:
                self._ok(f"   Category: {name}")

        # Publishers
        for name, website in PUBLISHERS:
            Publisher.objects.get_or_create(
                name=name,
                defaults={"website": website},
            )
        self._ok(f"   {len(PUBLISHERS)} publishers ensured")

        # Authors
        for name, nationality, bio in AUTHORS:
            Author.objects.get_or_create(
                name=name,
                defaults={"nationality": nationality, "bio": bio},
            )
        self._ok(f"   {len(AUTHORS)} authors ensured")

    # ── Books ─────────────────────────────────────────────────────────────────
    def _create_books(self, limit):
        self._section("📚  Books")
        authors_list = list(Author.objects.all())
        publishers_list = list(Publisher.objects.all())
        cat_map = {c.slug: c for c in Category.objects.all()}

        if not authors_list:
            raise CommandError("No authors found — run with --only catalog first or include catalog in seed.")
        if not cat_map:
            raise CommandError("No categories found — run with --only catalog first or include catalog in seed.")

        books_to_seed = BOOKS_DATA[:limit] if limit else BOOKS_DATA
        created_books = []

        for (title, isbn, cat_slug, author_idxs, year, pages, fine, copies) in books_to_seed:
            if Book.objects.filter(isbn=isbn).exists():
                self._info(f"   Skip (exists): {title[:50]}")
                continue

            category = cat_map.get(cat_slug)
            publisher = random.choice(publishers_list)
            locations = ["A1", "A2", "B1", "B2", "C1", "C2", "D1", "D2", "E1", "E2"]

            book = Book.objects.create(
                title=title,
                isbn=isbn,
                category=category,
                publisher=publisher,
                publication_year=year,
                pages=pages,
                language="English",
                fine_per_day=Decimal(fine),
                total_copies=copies,
                available_copies=copies,
                location=f"Shelf {random.choice(locations)}",
                condition=random.choice(["new", "good", "good", "fair"]),
                is_active=True,
                description=f"A comprehensive resource on {title}. "
                            f"Essential reading for students in the {category.name if category else 'General'} department.",
            )

            # Attach authors
            valid_idxs = [i for i in author_idxs if i < len(authors_list)]
            if valid_idxs:
                book.authors.set([authors_list[i] for i in valid_idxs])

            created_books.append(book)
            self._ok(f"   📖 {title[:55]}")

        all_books = list(Book.objects.filter(is_active=True))
        self._ok(f"   Total books in DB: {len(all_books)}")
        return all_books

    # ── Borrowings ────────────────────────────────────────────────────────────
    def _create_borrowings(self, students, books, librarians, count):
        self._section(f"📤  Borrowings ({count} records)")
        created = []

        for i in range(count):
            student = random.choice(students)
            book = random.choice(books)
            librarian = random.choice(librarians)

            # Determine scenario
            scenario = random.choices(
                ["active", "returned_clean", "returned_overdue", "overdue_still_out"],
                weights=[25, 35, 25, 15],
                k=1,
            )[0]

            borrow_date = rnd_date_past(min_days=30, max_days=120)

            if scenario == "active":
                due = borrow_date + timedelta(days=14)
                status = "borrowed"
                return_date = None

            elif scenario == "returned_clean":
                due = borrow_date + timedelta(days=14)
                return_date = borrow_date + timedelta(days=random.randint(1, 13))
                status = "returned"

            elif scenario == "returned_overdue":
                due = borrow_date + timedelta(days=14)
                return_date = due + timedelta(days=random.randint(1, 30))
                status = "returned"

            else:  # overdue_still_out
                due = timezone.now() - timedelta(days=random.randint(1, 45))
                status = "borrowed"
                return_date = None

            try:
                borrowing = Borrowing.objects.create(
                    user=student,
                    book=book,
                    issued_by=librarian,
                    borrow_date=borrow_date,
                    due_date=due,
                    return_date=return_date,
                    status=status,
                    notes=f"Seeded record #{i+1}",
                )
                created.append(borrowing)

                # Decrement available copies for active borrowings
                if status == "borrowed" and book.available_copies > 0:
                    book.available_copies = max(0, book.available_copies - 1)
                    book.save(update_fields=["available_copies"])

            except Exception as e:
                self._warn(f"   Could not create borrowing #{i+1}: {e}")

        # Summary
        active = sum(1 for b in created if b.status == "borrowed")
        returned = sum(1 for b in created if b.status == "returned")
        overdue = sum(1 for b in created if b.status == "borrowed" and timezone.now() > b.due_date)
        self._ok(f"   Created {len(created)} borrowings  |  Active: {active}  Returned: {returned}  Overdue: {overdue}")
        return created

    # ── Fines ─────────────────────────────────────────────────────────────────
    def _create_fines(self, borrowings):
        self._section("💰  Fines")
        created = 0

        # Generate fines for overdue-returned borrowings
        overdue_returned = [
            b for b in borrowings
            if b.status == "returned"
            and b.return_date
            and b.return_date > b.due_date
        ]

        for borrowing in overdue_returned:
            if Fine.objects.filter(borrowing=borrowing).exists():
                continue
            days_late = (borrowing.return_date - borrowing.due_date).days
            amount = Decimal(days_late) * borrowing.book.fine_per_day

            status = random.choices(["paid", "waived", "pending"], weights=[50, 20, 30], k=1)[0]

            fine = Fine(
                borrowing=borrowing,
                user=borrowing.user,
                amount=amount,
                status=status,
            )
            if status == "paid":
                fine.payment_method = random.choice(["mpesa", "stripe", "paypal", "cash"])
                fine.payment_reference = f"TXN{random.randint(100000, 999999)}"
                fine.paid_at = borrowing.return_date + timedelta(days=random.randint(0, 5))
            elif status == "waived":
                try:
                    librarian = User.objects.filter(role__in=["librarian", "admin"]).order_by("?").first()
                    fine.waived_by = librarian
                except User.DoesNotExist:
                    pass
                fine.waive_reason = random.choice([
                    "Student demonstrated financial hardship.",
                    "First-time offence — granted amnesty.",
                    "Waived during the annual fine amnesty week.",
                    "Medical emergency documented by student.",
                    "Books returned in excellent condition.",
                ])
            fine.save()
            created += 1

        # Generate fines for currently overdue borrowings
        still_overdue = [
            b for b in borrowings
            if b.status == "borrowed" and timezone.now() > b.due_date
        ]
        for borrowing in still_overdue:
            if Fine.objects.filter(borrowing=borrowing).exists():
                continue
            days_late = (timezone.now() - borrowing.due_date).days
            amount = Decimal(days_late) * borrowing.book.fine_per_day
            Fine.objects.create(
                borrowing=borrowing,
                user=borrowing.user,
                amount=amount,
                status="pending",
            )
            created += 1

        paid = Fine.objects.filter(status="paid").count()
        pending = Fine.objects.filter(status="pending").count()
        waived = Fine.objects.filter(status="waived").count()
        self._ok(f"   Created {created} fines  |  Paid: {paid}  Pending: {pending}  Waived: {waived}")

    # ── Reservations ──────────────────────────────────────────────────────────
    def _create_reservations(self, students, books):
        self._section("🔖  Reservations")
        available_books = [b for b in books if b.available_copies > 0]
        if not available_books:
            self._warn("   No available books to reserve.")
            return

        count = min(15, len(students), len(available_books))
        created = 0
        pairs = set()

        for _ in range(count * 3):
            if created >= count:
                break
            student = random.choice(students)
            book = random.choice(available_books)
            pair = (student.id, book.id)
            if pair in pairs:
                continue
            pairs.add(pair)

            status = random.choices(
                ["active", "fulfilled", "cancelled", "expired"],
                weights=[50, 20, 15, 15],
                k=1,
            )[0]

            reserved_at = rnd_date_past(min_days=1, max_days=30)
            expires = reserved_at + timedelta(days=3)
            if status == "active":
                expires = timezone.now() + timedelta(days=random.randint(1, 3))

            try:
                Reservation.objects.create(
                    user=student,
                    book=book,
                    reserved_at=reserved_at,
                    expires_at=expires,
                    status=status,
                )
                created += 1
            except Exception:
                pass

        self._ok(f"   Created {created} reservations")

    # ── Announcements ─────────────────────────────────────────────────────────
    def _create_announcements(self, librarians):
        self._section("📢  Announcements")
        created = 0
        for data in ANNOUNCEMENT_CONTENT:
            if Announcement.objects.filter(title=data["title"]).exists():
                self._info(f"   Skip: {data['title'][:50]}")
                continue
            Announcement.objects.create(
                title=data["title"],
                content=data["content"],
                target_role=data["target_role"],
                created_by=random.choice(librarians),
                is_active=True,
            )
            created += 1
            self._ok(f"   📣 {data['title'][:60]}")
        self._ok(f"   Created {created} announcements")

    # ── Transactions ──────────────────────────────────────────────────────────
    def _create_transactions(self):
        self._section("💳  Payment Transactions")
        paid_fines = Fine.objects.filter(status="paid").exclude(
            transactions__status="success"
        ).select_related("user")[:20]

        created = 0
        for fine in paid_fines:
            gateway = fine.payment_method if fine.payment_method in ["mpesa", "paypal", "stripe"] else "mpesa"
            txn_id = f"TXN-{gateway.upper()}-{random.randint(100000, 9999999):07d}"
            PaymentTransaction.objects.create(
                fine=fine,
                user=fine.user,
                gateway=gateway,
                gateway_transaction_id=txn_id,
                amount=fine.amount,
                currency="KES" if gateway == "mpesa" else "USD",
                status="success",
                gateway_response={
                    "ResultCode": 0,
                    "ResultDesc": "The service request is processed successfully.",
                    "CheckoutRequestID": txn_id,
                },
                phone_number=fine.user.phone_number if gateway == "mpesa" else "",
            )
            created += 1

        self._ok(f"   Created {created} payment transactions")

    # ── Output helpers ────────────────────────────────────────────────────────
    def _should(self, section):
        return self.only is None or section in self.only

    def _header(self, text):
        if not self.quiet:
            self.stdout.write(self.style.HTTP_INFO(f"\n{'─' * 60}"))
            self.stdout.write(self.style.HTTP_INFO(f"  {text}"))
            self.stdout.write(self.style.HTTP_INFO(f"{'─' * 60}"))

    def _section(self, text):
        if not self.quiet:
            self.stdout.write(f"\n{self.style.MIGRATE_HEADING(text)}")

    def _ok(self, text):
        if not self.quiet:
            self.stdout.write(self.style.SUCCESS(text))

    def _info(self, text):
        if not self.quiet:
            self.stdout.write(text)

    def _warn(self, text):
        self.stdout.write(self.style.WARNING(text))

    def _success(self, text):
        self.stdout.write(self.style.SUCCESS(text))

    def _print_credentials(self):
        if self.quiet:
            return
        self.stdout.write(self.style.HTTP_INFO("\n📋  Default Credentials"))
        self.stdout.write(self.style.HTTP_INFO("─" * 40))
        rows = [
            ("Role",       "Username",       "Password"),
            ("Admin",      "admin",           "Admin@1234"),
            ("Librarian",  "librarian1",      "Lib@1234"),
            ("Librarian",  "librarian2",      "Lib@1234"),
            ("Librarian",  "librarian3",      "Lib@1234"),
            ("Student",    "student001",      "Stu@1234"),
            ("Student",    "student002",      "Stu@1234"),
            ("Student",    "student003",      "Stu@1234"),
        ]
        for role, username, password in rows:
            self.stdout.write(f"  {role:<12} {username:<18} {password}")
        self.stdout.write("")
        self.stdout.write("  API endpoint: http://localhost:8000/api/")
        self.stdout.write("  Admin panel:  http://localhost:8000/admin/\n")
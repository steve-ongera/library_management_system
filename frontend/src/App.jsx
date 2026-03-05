import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/common/Sidebar';
import Navbar from './components/common/Navbar';
import './styles/globalStyles.css';

// Auth pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

// Student pages
import StudentDashboard from './pages/student/Dashboard';
import StudentBooks from './pages/student/Books';
import StudentMyBooks from './pages/student/MyBooks';
import StudentFines from './pages/student/Fines';
import StudentReservations from './pages/student/Reservations';
import StudentProfile from './pages/student/Profile';
import StudentAnnouncements from './pages/student/Announcements';

// Librarian pages
import LibrarianDashboard from './pages/librarian/Dashboard';
import LibrarianBooks from './pages/librarian/Books';
import LibrarianBorrowings from './pages/librarian/Borrowings';
import LibrarianIssue from './pages/librarian/IssueBook';
import LibrarianReturn from './pages/librarian/ReturnBook';
import LibrarianOverdue from './pages/librarian/Overdue';
import LibrarianFines from './pages/librarian/Fines';
import LibrarianStudents from './pages/librarian/Students';
import LibrarianCategories from './pages/librarian/Categories';
import LibrarianAuthors from './pages/librarian/Authors';
import LibrarianAnnouncements from './pages/librarian/Announcements';
import LibrarianProfile from './pages/librarian/Profile';
import LibrarianReservations from './pages/librarian/Reservations';
import LibrarianTransactions from './pages/librarian/Transactions';
import StudentTransactions from './pages/student/Transactions';

// ─── Protected Route ─────────────────────────────────────────────────────────
function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-center"><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={user.role === 'student' ? '/student/dashboard' : '/librarian/dashboard'} replace />;
  }
  return children;
}

// ─── App Shell Layout ─────────────────────────────────────────────────────────
function AppShell({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  const isMobile = window.innerWidth <= 768;
  const sidebarCollapsed = isMobile ? !mobileOpen : collapsed;

  const toggleSidebar = () => {
    if (isMobile) setMobileOpen(!mobileOpen);
    else setCollapsed(!collapsed);
  };

  return (
    <div className="app-shell">
      <Sidebar
        collapsed={isMobile ? false : collapsed}
        onClose={() => { if (isMobile) setMobileOpen(false); }}
      />
      {/* Mobile overlay handled inside Sidebar via CSS class */}
      <div className={`main-content ${!isMobile && collapsed ? 'sidebar-collapsed' : ''}`}>
        <Navbar
          sidebarCollapsed={!isMobile && collapsed}
          onToggleSidebar={toggleSidebar}
        />
        <main className="page-content">
          {children}
        </main>
      </div>
    </div>
  );
}

// ─── Router ───────────────────────────────────────────────────────────────────
function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) return <div className="loading-center" style={{ height: '100vh' }}><div className="spinner" /></div>;

  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={user ? <Navigate to={user.role === 'student' ? '/student/dashboard' : '/librarian/dashboard'} replace /> : <LoginPage />} />
      <Route path="/register" element={user ? <Navigate to="/student/dashboard" replace /> : <RegisterPage />} />

      {/* Root redirect */}
      <Route path="/" element={<Navigate to={user ? (user.role === 'student' ? '/student/dashboard' : '/librarian/dashboard') : '/login'} replace />} />

      {/* Student Routes */}
      <Route path="/student/*" element={
        <ProtectedRoute allowedRoles={['student']}>
          <AppShell>
            <Routes>
              <Route path="dashboard" element={<StudentDashboard />} />
              <Route path="books" element={<StudentBooks />} />
              <Route path="my-books" element={<StudentMyBooks />} />
              <Route path="fines" element={<StudentFines />} />
              <Route path="reservations" element={<StudentReservations />} />
              <Route path="announcements" element={<StudentAnnouncements />} />
              <Route path="transactions" element={<StudentTransactions />} />
              <Route path="profile" element={<StudentProfile />} />
              <Route path="*" element={<Navigate to="/student/dashboard" replace />} />
            </Routes>
          </AppShell>
        </ProtectedRoute>
      } />

      {/* Librarian Routes */}
      <Route path="/librarian/*" element={
        <ProtectedRoute allowedRoles={['librarian', 'admin']}>
          <AppShell>
            <Routes>
              <Route path="dashboard" element={<LibrarianDashboard />} />
              <Route path="books" element={<LibrarianBooks />} />
              <Route path="categories" element={<LibrarianCategories />} />
              <Route path="authors" element={<LibrarianAuthors />} />
              <Route path="borrowings" element={<LibrarianBorrowings />} />
              <Route path="issue" element={<LibrarianIssue />} />
              <Route path="return" element={<LibrarianReturn />} />
              <Route path="overdue" element={<LibrarianOverdue />} />
              <Route path="reservations" element={<LibrarianReservations />} />
              <Route path="fines" element={<LibrarianFines />} />
              <Route path="transactions" element={<LibrarianTransactions />} />
              <Route path="students" element={<LibrarianStudents />} />
              <Route path="announcements" element={<LibrarianAnnouncements />} />
              <Route path="profile" element={<LibrarianProfile />} />
              <Route path="*" element={<Navigate to="/librarian/dashboard" replace />} />
            </Routes>
          </AppShell>
        </ProtectedRoute>
      } />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
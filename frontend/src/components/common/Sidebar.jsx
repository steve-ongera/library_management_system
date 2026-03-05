import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const studentNav = [
  { section: 'Main', items: [
    { path: '/student/dashboard', icon: '🏠', label: 'Dashboard' },
    { path: '/student/books', icon: '📚', label: 'Browse Books' },
    { path: '/student/my-books', icon: '📖', label: 'My Books' },
    { path: '/student/reservations', icon: '🔖', label: 'Reservations' },
  ]},
  { section: 'Finance', items: [
    { path: '/student/fines', icon: '💳', label: 'My Fines' },
    { path: '/student/transactions', icon: '📋', label: 'Transactions' },
  ]},
  { section: 'More', items: [
    { path: '/student/announcements', icon: '📢', label: 'Announcements' },
    { path: '/student/profile', icon: '👤', label: 'Profile' },
  ]},
];

const librarianNav = [
  { section: 'Overview', items: [
    { path: '/librarian/dashboard', icon: '🏠', label: 'Dashboard' },
    { path: '/librarian/announcements', icon: '📢', label: 'Announcements' },
  ]},
  { section: 'Catalog', items: [
    { path: '/librarian/books', icon: '📚', label: 'Books' },
    { path: '/librarian/categories', icon: '🗂️', label: 'Categories' },
    { path: '/librarian/authors', icon: '✍️', label: 'Authors' },
  ]},
  { section: 'Circulation', items: [
    { path: '/librarian/borrowings', icon: '📤', label: 'Borrowings' },
    { path: '/librarian/issue', icon: '➕', label: 'Issue Book' },
    { path: '/librarian/return', icon: '↩️', label: 'Return Book' },
    { path: '/librarian/overdue', icon: '⚠️', label: 'Overdue' },
    { path: '/librarian/reservations', icon: '🔖', label: 'Reservations' },
  ]},
  { section: 'Finance', items: [
    { path: '/librarian/fines', icon: '💰', label: 'Fines' },
    { path: '/librarian/transactions', icon: '💳', label: 'Transactions' },
  ]},
  { section: 'Users', items: [
    { path: '/librarian/students', icon: '👨‍🎓', label: 'Students' },
    { path: '/librarian/profile', icon: '👤', label: 'Profile' },
  ]},
];

export default function Sidebar({ collapsed, onClose }) {
  const { user, isLibrarian } = useAuth();
  const navItems = isLibrarian ? librarianNav : studentNav;
  const location = useLocation();

  return (
    <>
      <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="logo-icon">📚</div>
          {!collapsed && (
            <div className="logo-text">
              UniLibrary
              <span>Management System</span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {navItems.map(({ section, items }) => (
            <div key={section}>
              {!collapsed && (
                <div className="nav-section-label">{section}</div>
              )}
              {items.map(({ path, icon, label, badge }) => {
                const isActive = location.pathname === path ||
                  location.pathname.startsWith(path + '/');
                return (
                  <NavLink
                    key={path}
                    to={path}
                    className={`nav-item ${isActive ? 'active' : ''}`}
                    onClick={onClose}
                    title={collapsed ? label : undefined}
                  >
                    <span className="nav-icon">{icon}</span>
                    {!collapsed && <span className="nav-label">{label}</span>}
                    {!collapsed && badge > 0 && (
                      <span className="nav-badge">{badge}</span>
                    )}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Footer - User info */}
        <div className="sidebar-footer">
          {!collapsed ? (
            <div className="nav-item" style={{ cursor: 'default' }}>
              <div className="user-avatar" style={{ width: 32, height: 32, fontSize: 13 }}>
                {user?.first_name?.[0]}{user?.last_name?.[0]}
              </div>
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user?.first_name} {user?.last_name}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(160,180,200,0.7)', textTransform: 'capitalize' }}>
                  {user?.role}
                </div>
              </div>
            </div>
          ) : (
            <div className="nav-item" style={{ justifyContent: 'center', cursor: 'default' }}>
              <div className="user-avatar" style={{ width: 32, height: 32, fontSize: 13 }}>
                {user?.first_name?.[0]}{user?.last_name?.[0]}
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile overlay */}
      <div
        className={`mobile-overlay ${!collapsed ? 'show' : ''}`}
        onClick={onClose}
      />
    </>
  );
}
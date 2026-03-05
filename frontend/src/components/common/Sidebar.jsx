import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const studentNav = [
  {
    section: 'Main',
    items: [
      { path: '/student/dashboard',     icon: 'bi-house-door-fill',       label: 'Dashboard' },
      { path: '/student/books',         icon: 'bi-journals',              label: 'Browse Books' },
      { path: '/student/my-books',      icon: 'bi-book-half',             label: 'My Books' },
      { path: '/student/reservations',  icon: 'bi-bookmark-star',         label: 'Reservations' },
    ],
  },
  {
    section: 'Finance',
    items: [
      { path: '/student/fines',         icon: 'bi-credit-card-2-front',   label: 'My Fines' },
      { path: '/student/transactions',  icon: 'bi-receipt',               label: 'Transactions' },
    ],
  },
  {
    section: 'More',
    items: [
      { path: '/student/announcements', icon: 'bi-megaphone',             label: 'Announcements' },
      { path: '/student/profile',       icon: 'bi-person-circle',         label: 'Profile' },
    ],
  },
];

const librarianNav = [
  {
    section: 'Overview',
    items: [
      { path: '/librarian/dashboard',      icon: 'bi-speedometer2',           label: 'Dashboard' },
      { path: '/librarian/announcements',  icon: 'bi-megaphone',              label: 'Announcements' },
    ],
  },
  {
    section: 'Catalog',
    items: [
      { path: '/librarian/books',       icon: 'bi-journals',               label: 'Books' },
      { path: '/librarian/categories',  icon: 'bi-grid-3x3-gap',           label: 'Categories' },
      { path: '/librarian/authors',     icon: 'bi-person-lines-fill',      label: 'Authors' },
    ],
  },
  {
    section: 'Circulation',
    items: [
      { path: '/librarian/borrowings',   icon: 'bi-arrow-left-right',        label: 'Borrowings' },
      { path: '/librarian/issue',        icon: 'bi-box-arrow-up-right',      label: 'Issue Book' },
      { path: '/librarian/return',       icon: 'bi-box-arrow-in-down-left',  label: 'Return Book' },
      { path: '/librarian/overdue',      icon: 'bi-exclamation-triangle',    label: 'Overdue' },
      { path: '/librarian/reservations', icon: 'bi-bookmark-check',          label: 'Reservations' },
    ],
  },
  {
    section: 'Finance',
    items: [
      { path: '/librarian/fines',        icon: 'bi-cash-coin',              label: 'Fines' },
      { path: '/librarian/transactions', icon: 'bi-credit-card',            label: 'Transactions' },
    ],
  },
  {
    section: 'Users',
    items: [
      { path: '/librarian/students', icon: 'bi-mortarboard',               label: 'Students' },
      { path: '/librarian/profile',  icon: 'bi-person-badge',              label: 'Profile' },
    ],
  },
];

export default function Sidebar({ collapsed, onClose }) {
  const { user, isLibrarian } = useAuth();
  const navItems = isLibrarian ? librarianNav : studentNav;
  const location = useLocation();

  return (
    <>
      <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>

        {/* ── Logo ─────────────────────────────── */}
        <div className="sidebar-logo">
          <div className="logo-icon">
            <i className="bi bi-book-fill" />
          </div>
          {!collapsed && (
            <div className="logo-text">
              UniLibrary
              <span>Management System</span>
            </div>
          )}
        </div>

        {/* ── Nav ──────────────────────────────── */}
        <nav className="sidebar-nav">
          {navItems.map(({ section, items }) => (
            <div key={section}>
              {!collapsed && (
                <div className="nav-section-label">{section}</div>
              )}
              {items.map(({ path, icon, label, badge }) => {
                const isActive =
                  location.pathname === path ||
                  location.pathname.startsWith(path + '/');
                return (
                  <NavLink
                    key={path}
                    to={path}
                    className={`nav-item ${isActive ? 'active' : ''}`}
                    onClick={onClose}
                    title={collapsed ? label : undefined}
                  >
                    <i className={`bi ${icon} nav-icon`} />
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

        {/* ── Footer ───────────────────────────── */}
        <div className="sidebar-footer">
          {!collapsed ? (
            <div className="nav-item" style={{ cursor: 'default' }}>
              <div className="user-avatar" style={{ width: 32, height: 32, fontSize: 13, flexShrink: 0 }}>
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

      {/* Mobile backdrop */}
      <div
        className={`mobile-overlay ${!collapsed ? 'show' : ''}`}
        onClick={onClose}
      />
    </>
  );
}
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Navbar({ sidebarCollapsed, onToggleSidebar }) {
  const { user, logout, isLibrarian } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const goToProfile = () => {
    navigate(isLibrarian ? '/librarian/profile' : '/student/profile');
    setDropdownOpen(false);
  };

  const initials = `${user?.first_name?.[0] || ''}${user?.last_name?.[0] || ''}`;

  return (
    <header className={`navbar ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>

      {/* ── Left ─────────────────────────────────────────── */}
      <div className="navbar-left">
        <button className="hamburger" onClick={onToggleSidebar} aria-label="Toggle sidebar">
          <i className={`bi ${sidebarCollapsed ? 'bi-list' : 'bi-x-lg'}`} />
        </button>

        <div className="navbar-search">
          <i className="bi bi-search search-icon" />
          <input
            type="search"
            placeholder="Search books, students…"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.target.value.trim()) {
                const base = isLibrarian ? '/librarian' : '/student';
                navigate(`${base}/books?search=${encodeURIComponent(e.target.value)}`);
                e.target.value = '';
              }
            }}
          />
        </div>
      </div>

      {/* ── Right ────────────────────────────────────────── */}
      <div className="navbar-right">
        <button className="nav-icon-btn" title="Notifications">
          <i className="bi bi-bell" />
          <span className="badge" />
        </button>

        <div className="user-menu" ref={dropdownRef}>
          <div
            className="user-avatar"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            title={`${user?.first_name} ${user?.last_name}`}
          >
            {initials || <i className="bi bi-person-fill" />}
          </div>

          {dropdownOpen && (
            <div className="user-dropdown">
              <div className="user-dropdown-header">
                <div className="name">{user?.first_name} {user?.last_name}</div>
                <div className="role">{user?.role} · {user?.username}</div>
              </div>

              <div className="user-dropdown-item" onClick={goToProfile}>
                <i className="bi bi-person-circle" /> My Profile
              </div>
              <div
                className="user-dropdown-item"
                onClick={() => {
                  navigate(isLibrarian ? '/librarian/dashboard' : '/student/dashboard');
                  setDropdownOpen(false);
                }}
              >
                <i className="bi bi-house-door" /> Dashboard
              </div>

              <hr style={{ margin: '4px 0', border: 'none', borderTop: '1px solid #e2e8f0' }} />

              <div className="user-dropdown-item danger" onClick={handleLogout}>
                <i className="bi bi-box-arrow-right" /> Logout
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
import { useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FiMenu, FiExternalLink } from 'react-icons/fi';

const pageMap = {
  '/': 'Dashboard',
  '/properties': 'Properties',
  '/categories': 'Categories',
  '/locations': 'Locations',
  '/enquiries': 'Enquiries',
  '/site-visits': 'Site Visits',
  '/testimonials': 'Testimonials',
  '/banners': 'Banners',
  '/users': 'Users',
  '/settings': 'Settings',
};

function Header({ onMenuToggle }) {
  const { adminData, logout } = useAuth();
  const location = useLocation();

  const pageName = pageMap[location.pathname] ||
    pageMap[Object.keys(pageMap).find(k => location.pathname.startsWith(k) && k !== '/') || ''] ||
    'Admin';

  const initials = adminData?.name || adminData?.fullName
    ? (adminData.name || adminData.fullName).split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'AD';

  return (
    <header className="admin-header">
      <div className="admin-header__left">
        <button
          onClick={onMenuToggle}
          className="btn btn-ghost btn-icon mobile-menu-btn"
          aria-label="Toggle menu"
          id="mobile-menu-btn"
        >
          <FiMenu size={20} />
        </button>

        <div className="breadcrumb">
          <span className="breadcrumb__home">Honesty Realtors</span>
          <span className="breadcrumb__separator">/</span>
          <span className="breadcrumb__current">{pageName}</span>
        </div>
      </div>

      <div className="admin-header__right" style={{ position: 'relative' }}>
        <a
          href="https://honestyrealtor.com"
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-secondary btn-sm header-view-site-btn"
          title="View public website"
        >
          <FiExternalLink size={14} />
          <span className="header-view-site-label">View Website</span>
        </a>

        <div className="header-user-info">
          <div className="header-user-info__name">{adminData?.name || adminData?.fullName || 'Admin'}</div>
          <div className="header-user-info__role">{adminData?.role || 'Admin'}</div>
        </div>

        <div 
          className="header-avatar" 
          title={adminData?.name || adminData?.fullName || 'Admin'} 
          onClick={() => {
            const dropdown = document.getElementById('profile-dropdown');
            dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
          }}
          style={{ cursor: 'pointer' }}
        >
          {initials}
        </div>

        <div 
          id="profile-dropdown"
          style={{
            display: 'none',
            position: 'absolute',
            top: 'calc(100% + 10px)',
            right: 0,
            background: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '8px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
            minWidth: '150px',
            zIndex: 100
          }}
        >
          <button 
            className="btn btn-ghost w-full" 
            style={{ color: '#ef4444', justifyContent: 'flex-start' }} 
            onClick={() => {
              const dropdown = document.getElementById('profile-dropdown');
              if(dropdown) dropdown.style.display = 'none';
              logout();
            }}
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;

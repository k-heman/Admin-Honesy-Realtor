import { useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FiMenu, FiBell, FiExternalLink } from 'react-icons/fi';

const pageMap = {
  '/': 'Dashboard',
  '/properties': 'Properties',
  '/categories': 'Categories',
  '/locations': 'Locations',
  '/enquiries': 'Enquiries',
  '/testimonials': 'Testimonials',
  '/banners': 'Banners',
  '/users': 'Users',
  '/settings': 'Settings',
};

function Header({ onMenuToggle }) {
  const { adminData } = useAuth();
  const location = useLocation();

  const pageName = pageMap[location.pathname] ||
    pageMap[Object.keys(pageMap).find(k => location.pathname.startsWith(k) && k !== '/') || ''] ||
    'Admin';

  const initials = adminData?.name
    ? adminData.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'AD';

  return (
    <header className="admin-header">
      <div className="admin-header__left">
        <button
          onClick={onMenuToggle}
          className="btn btn-ghost btn-icon"
          style={{ display: 'none' }}
          aria-label="Toggle menu"
          id="mobile-menu-btn"
        >
          <FiMenu size={20} />
        </button>
        <style>{`
          @media (max-width: 768px) { #mobile-menu-btn { display: flex !important; } }
        `}</style>

        <div className="breadcrumb">
          <span>Honesty Realtors</span>
          <span className="breadcrumb__separator">/</span>
          <span className="breadcrumb__current">{pageName}</span>
        </div>
      </div>

      <div className="admin-header__right">
        <a
          href="https://honestyrealtor.com"
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-secondary btn-sm"
          title="View public website"
        >
          <FiExternalLink size={14} />
          View Website
        </a>

        <div className="header-user-info" style={{ display: 'none' }}>
          <div className="header-user-info__name">{adminData?.name || 'Admin'}</div>
          <div className="header-user-info__role">{adminData?.role || 'Admin'}</div>
        </div>
        <style>{`@media (min-width: 640px) { .header-user-info { display: block !important; } }`}</style>

        <div className="header-avatar" title={adminData?.name || 'Admin'}>
          {initials}
        </div>
      </div>
    </header>
  );
}

export default Header;

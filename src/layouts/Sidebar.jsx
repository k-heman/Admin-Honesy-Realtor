import { NavLink, useNavigate } from 'react-router-dom';
import logo from '../assets/honestylogo.jpeg';
import { useAuth } from '../contexts/AuthContext';
import {
  FiGrid, FiHome, FiTag, FiMapPin, FiMessageSquare,
  FiStar, FiImage, FiUsers, FiSettings, FiLogOut,
  FiChevronLeft, FiChevronRight, FiCalendar, FiX,
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const navItems = [
  { section: 'Main' },
  { label: 'Dashboard', icon: FiGrid, path: '/' },
  { section: 'Listings' },
  { label: 'Properties', icon: FiHome, path: '/properties' },
  { label: 'Categories', icon: FiTag, path: '/categories' },
  { label: 'Locations', icon: FiMapPin, path: '/locations' },
  { section: 'Engagement' },
  { label: 'Enquiries', icon: FiMessageSquare, path: '/enquiries', badge: 'enquiries' },
  { label: 'Site Visits', icon: FiCalendar, path: '/site-visits' },
  { label: 'Testimonials', icon: FiStar, path: '/testimonials' },
  { label: 'Banners', icon: FiImage, path: '/banners' },
  { section: 'Admin' },
  { label: 'Users', icon: FiUsers, path: '/users' },
  { label: 'Settings', icon: FiSettings, path: '/settings' },
];

function Sidebar({ collapsed, setCollapsed, mobileOpen, setMobileOpen, pendingCount = 0 }) {
  const { logout, adminData } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
      navigate('/login');
    } catch {
      toast.error('Logout failed');
    }
  };

  const handleNavClick = () => {
    // Close mobile sidebar on navigation
    if (mobileOpen && setMobileOpen) {
      setMobileOpen(false);
    }
  };

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
      {/* Mobile close button */}
      <button
        className="sidebar-mobile-close"
        onClick={() => setMobileOpen && setMobileOpen(false)}
        aria-label="Close sidebar"
      >
        <FiX size={20} />
      </button>

      {/* Logo */}
      <div className="sidebar-logo">
        <img src={logo} alt="Honesty Realtors Logo" style={{ width: 40, height: 40, objectFit: 'contain' }} />
        <div className="sidebar-logo__text">
          <h2>Honesty Realtors</h2>
          <p>Admin Dashboard</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {navItems.map((item, idx) => {
          if (item.section) {
            return <div key={idx} className="sidebar-section">{item.section}</div>;
          }

          const Icon = item.icon;
          const badge = item.badge === 'enquiries' && pendingCount > 0 ? pendingCount : null;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) => `sidebar-item${isActive ? ' active' : ''}`}
              title={collapsed ? item.label : undefined}
              onClick={handleNavClick}
            >
              <span className="sidebar-item__icon">
                <Icon size={17} />
              </span>
              <span className="sidebar-item__label">{item.label}</span>
              {badge && <span className="sidebar-item__badge">{badge > 99 ? '99+' : badge}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer: User info + logout */}
      <div className="sidebar-footer">
        {!collapsed && adminData && (
          <div style={{ padding: '8px 16px 12px', overflow: 'hidden' }}>
            <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {adminData.name || 'Admin'}
            </div>
            <div style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
              {adminData.role || 'Admin'}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: collapsed ? 'column' : 'row', gap: 8, padding: '0 8px' }}>
          <button
            onClick={handleLogout}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(239, 68, 68, 0.1)',
              color: '#ef4444',
              border: 'none',
              borderRadius: '8px',
              padding: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            title="Logout"
            onMouseOver={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
            onMouseOut={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
          >
            <FiLogOut size={16} />
            {!collapsed && <span style={{ marginLeft: 8, fontSize: '0.875rem', fontWeight: 600 }}>Logout</span>}
          </button>
          
          <button
            className="sidebar-toggle"
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            style={{ padding: '8px' }}
          >
            {collapsed ? <FiChevronRight size={16} /> : <FiChevronLeft size={16} />}
          </button>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;

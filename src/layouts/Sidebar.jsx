import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  FiGrid, FiHome, FiTag, FiMapPin, FiMessageSquare,
  FiStar, FiImage, FiUsers, FiSettings, FiLogOut,
  FiChevronLeft, FiChevronRight,
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
  { label: 'Testimonials', icon: FiStar, path: '/testimonials' },
  { label: 'Banners', icon: FiImage, path: '/banners' },
  { section: 'Admin' },
  { label: 'Users', icon: FiUsers, path: '/users' },
  { label: 'Settings', icon: FiSettings, path: '/settings' },
];

function Sidebar({ collapsed, setCollapsed, mobileOpen, pendingCount = 0 }) {
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

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo__icon">HR</div>
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

        <button
          className="sidebar-item"
          onClick={handleLogout}
          style={{ width: 'calc(100% - 16px)', margin: '0 8px', color: '#f87171' }}
          title={collapsed ? 'Logout' : undefined}
        >
          <span className="sidebar-item__icon"><FiLogOut size={17} /></span>
          <span className="sidebar-item__label">Logout</span>
        </button>

        <button
          className="sidebar-toggle"
          onClick={() => setCollapsed(!collapsed)}
          style={{ marginTop: 8 }}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <FiChevronRight size={16} /> : <FiChevronLeft size={16} />}
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;

import { useState, useEffect, useCallback } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { enquiriesService } from '../services/firestoreService';

function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const location = useLocation();

  useEffect(() => {
    // Fetch pending enquiries count for badge
    const fetchPending = async () => {
      try {
        const enquiries = await enquiriesService.getAll();
        const pending = enquiries.filter(e => e.status === 'Pending').length;
        setPendingCount(pending);
      } catch {}
    };
    fetchPending();
  }, []);

  // Auto-close sidebar on route change (mobile)
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Lock body scroll when mobile sidebar is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const handleMobileToggle = useCallback(() => setMobileOpen(prev => !prev), []);
  const closeMobile = useCallback(() => setMobileOpen(false), []);

  return (
    <div className="admin-layout">
      {/* Mobile overlay */}
      <div
        className={`mobile-sidebar-overlay ${mobileOpen ? 'active' : ''}`}
        onClick={closeMobile}
        aria-hidden="true"
      />

      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        pendingCount={pendingCount}
      />

      <div className={`admin-content ${collapsed ? 'collapsed' : ''}`}>
        <Header onMenuToggle={handleMobileToggle} />
        <main className="page-wrapper">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;

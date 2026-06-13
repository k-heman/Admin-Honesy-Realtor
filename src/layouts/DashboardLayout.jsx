import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { enquiriesService } from '../services/firestoreService';

function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

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

  const handleMobileToggle = () => setMobileOpen(!mobileOpen);

  return (
    <div className="admin-layout">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            zIndex: 99, display: 'none'
          }}
          id="mobile-overlay"
        />
      )}
      <style>{`@media (max-width: 768px) { #mobile-overlay { display: block !important; } }`}</style>

      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
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

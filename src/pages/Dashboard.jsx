import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getDashboardStats } from '../services/firestoreService';
import { formatDate, formatCurrency, getStatusColor } from '../utils/formatters';
import {
  FiHome, FiCheckCircle, FiStar, FiMessageSquare,
  FiClock, FiUsers, FiAward, FiArrowRight
} from 'react-icons/fi';

function SkeletonStatCard() {
  return (
    <div className="stat-card" style={{ gap: 12 }}>
      <div className="skeleton" style={{ width: 44, height: 44, borderRadius: 10, flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div className="skeleton skeleton-text" style={{ width: '50%', height: 28, marginBottom: 8 }} />
        <div className="skeleton skeleton-text" style={{ width: '70%' }} />
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className={`stat-card ${color}`}>
      <div className={`stat-icon ${color}`}><Icon size={20} /></div>
      <div className="stat-content">
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
}

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getDashboardStats();
        setStats(data);
      } catch (err) {
        setError('Failed to load dashboard data. Check Firestore connection.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const statCards = stats ? [
    { icon: FiHome, label: 'Total Properties', value: stats.totalProperties, color: 'primary' },
    { icon: FiCheckCircle, label: 'Available', value: stats.availableProperties, color: 'success' },
    { icon: FiStar, label: 'Featured', value: stats.featuredProperties, color: 'warning' },
    { icon: FiMessageSquare, label: 'Total Enquiries', value: stats.totalEnquiries, color: 'info' },
    { icon: FiClock, label: 'Pending Enquiries', value: stats.pendingEnquiries, color: 'danger' },
    { icon: FiAward, label: 'Testimonials', value: stats.totalTestimonials, color: 'purple' },
    { icon: FiUsers, label: 'Admin Users', value: stats.totalUsers, color: 'secondary' },
  ] : [];

  return (
    <div>
      <div className="page-header">
        <div className="page-header__left">
          <h1>Dashboard</h1>
          <p>Welcome back! Here's what's happening with your properties.</p>
        </div>
        <Link to="/properties" className="btn btn-primary">
          <FiHome size={16} /> Add Property
        </Link>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: 20 }}>{error}</div>}

      {/* Stats Grid */}
      <div className="stats-grid">
        {loading
          ? Array.from({ length: 7 }).map((_, i) => <SkeletonStatCard key={i} />)
          : statCards.map(card => <StatCard key={card.label} {...card} />)
        }
      </div>

      {/* Recent Data Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Recent Enquiries */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="card-header" style={{ padding: '16px 20px' }}>
            <h3 className="card-title">Recent Enquiries</h3>
            <Link to="/enquiries" className="btn btn-ghost btn-sm">View all <FiArrowRight size={14} /></Link>
          </div>
          {loading ? (
            <div style={{ padding: 20 }}>
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="skeleton skeleton-row" style={{ borderRadius: 8, marginBottom: 8 }} />
              ))}
            </div>
          ) : stats?.recentEnquiries?.length ? (
            <div>
              {stats.recentEnquiries.map(enq => (
                <div key={enq.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', borderBottom: '1px solid #f1f5f9' }}>
                  <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#e0e7ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.875rem', flexShrink: 0 }}>
                    {(enq.customerName || 'U')[0].toUpperCase()}
                  </div>
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{enq.customerName || 'Unknown'}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{enq.propertyTitle || enq.message || '—'}</div>
                  </div>
                  <span className={`badge badge-${getStatusColor(enq.status)}`}>{enq.status || 'Pending'}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="table-empty"><div className="table-empty-icon">📭</div><p>No enquiries yet</p></div>
          )}
        </div>

        {/* Recent Properties */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="card-header" style={{ padding: '16px 20px' }}>
            <h3 className="card-title">Recent Properties</h3>
            <Link to="/properties" className="btn btn-ghost btn-sm">View all <FiArrowRight size={14} /></Link>
          </div>
          {loading ? (
            <div style={{ padding: 20 }}>
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="skeleton skeleton-row" style={{ borderRadius: 8, marginBottom: 8 }} />
              ))}
            </div>
          ) : stats?.recentProperties?.length ? (
            <div>
              {stats.recentProperties.map(prop => (
                <div key={prop.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', borderBottom: '1px solid #f1f5f9' }}>
                  {(prop.images?.[0] || prop.image) ? (
                    <img src={prop.images?.[0] || prop.image} alt={prop.title} className="prop-img-thumb" />
                  ) : (
                    <div style={{ width: 52, height: 40, borderRadius: 6, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', flexShrink: 0 }}>🏠</div>
                  )}
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{prop.title}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{prop.type} • {prop.location}</div>
                  </div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#6366f1', flexShrink: 0 }}>
                    {typeof prop.priceValue === 'number' ? formatCurrency(prop.priceValue) : prop.price}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="table-empty"><div className="table-empty-icon">🏘️</div><p>No properties yet</p></div>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          div[style*="grid-template-columns: 1fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

export default Dashboard;

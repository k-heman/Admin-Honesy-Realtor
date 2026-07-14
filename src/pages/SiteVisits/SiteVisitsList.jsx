import { useState, useEffect } from 'react';
import { siteVisitsService } from '../../services/firestoreService';
import { formatDate, formatDateTime } from '../../utils/formatters';
import toast from 'react-hot-toast';
import { FiSearch, FiTrash2, FiHome, FiMail, FiPhone, FiCalendar, FiClock, FiMapPin, FiDollarSign } from 'react-icons/fi';

const PAGE_SIZE = 10;

function ConfirmDialog({ title, message, onConfirm, onCancel, loading }) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal modal-sm" onClick={e => e.stopPropagation()}>
        <div className="modal-body" style={{ padding: '24px 20px' }}>
          <div className="confirm-dialog">
            <div className="confirm-dialog__icon" style={{ fontSize: '2.5rem', marginBottom: 12, textAlign: 'center' }}>⚠️</div>
            <h3 style={{ textAlign: 'center', marginBottom: 8, fontSize: '1.125rem' }}>{title}</h3>
            <p style={{ textAlign: 'center', color: '#64748b', fontSize: '0.875rem' }}>{message}</p>
          </div>
        </div>
        <div className="modal-footer" style={{ borderTop: 'none', padding: '12px 20px 20px', gap: 12 }}>
          <button className="btn btn-secondary" style={{ flex: 1 }} onClick={onCancel} disabled={loading}>Cancel</button>
          <button className="btn btn-danger" style={{ flex: 1 }} onClick={onConfirm} disabled={loading}>{loading ? 'Deleting...' : 'Delete'}</button>
        </div>
      </div>
    </div>
  );
}

function SiteVisitsList() {
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await siteVisitsService.getAll();
      
      // Sort by newest first
      data.sort((a, b) => {
        const dateA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : new Date(a.createdAt).getTime();
        const dateB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : new Date(b.createdAt).getTime();
        return dateB - dateA;
      });

      setVisits(data);
    } catch (err) {
      toast.error('Failed to load site visits');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await siteVisitsService.delete(deleteId);
      toast.success('Site visit record deleted');
      setDeleteId(null);
      fetchData();
    } catch {
      toast.error('Delete failed');
    } finally {
      setDeleteLoading(false);
    }
  };

  const filtered = visits.filter(v => {
    const s = search.toLowerCase();
    const matchSearch = !s ||
      (v.fullName || '').toLowerCase().includes(s) ||
      (v.mobileNumber || '').includes(s) ||
      (v.email || '').toLowerCase().includes(s) ||
      (v.property?.title || '').toLowerCase().includes(s);
    return matchSearch;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const getInitials = (name) => {
    if (!name) return 'SV';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="visits-container">
      <div className="page-header">
        <div className="page-header__left">
          <h1>Site Visits</h1>
          <p>{visits.length} scheduled visits total</p>
        </div>
      </div>

      <div className="table-wrapper">
        <div className="table-toolbar">
          <div className="table-toolbar__left">
            <div className="search-bar">
              <FiSearch className="search-bar__icon" />
              <input 
                placeholder="Search by name, phone, property..." 
                value={search} 
                onChange={e => { setSearch(e.target.value); setPage(1); }} 
              />
            </div>
          </div>
          <div className="table-toolbar__right">
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
              {filtered.length} results
            </span>
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="table-scroll desktop-only">
          <table>
            <thead>
              <tr>
                <th style={{ width: '4%' }}>#</th>
                <th style={{ width: '18%' }}>Customer</th>
                <th style={{ width: '18%' }}>Contact</th>
                <th style={{ width: '25%' }}>Property Details</th>
                <th style={{ width: '22%' }}>Preferred Appointment</th>
                <th style={{ width: '8%' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j}><div className="skeleton skeleton-text" style={{ margin: 0, height: 16 }} /></td>
                    ))}
                  </tr>
                ))
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="table-empty">
                      <div className="table-empty-icon">📅</div>
                      <p style={{ fontWeight: 500, fontSize: '0.95rem' }}>No site visits found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginated.map((visit, i) => (
                  <tr key={visit.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedVisit(visit)}>
                    <td style={{ color: 'var(--text-tertiary)' }} onClick={e => e.stopPropagation()}>
                      {(page - 1) * PAGE_SIZE + i + 1}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="avatar-circle-visit">{getInitials(visit.fullName)}</div>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{visit.fullName || '—'}</div>
                          <div style={{ color: 'var(--text-tertiary)', fontSize: '0.73rem', marginTop: 2 }}>
                            Submitted {visit?.createdAt ? formatDateTime(visit.createdAt) : formatDate(visit.createdAt)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.8125rem', display: 'flex', flexDirection: 'column', gap: 2 }} onClick={e => e.stopPropagation()}>
                        <a href={`tel:${visit.mobileNumber}`} style={{ color: 'var(--primary)', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <FiPhone size={12} /> {visit.mobileNumber || '—'}
                        </a>
                        <a href={`mailto:${visit.email}`} style={{ color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.75rem' }}>
                          <FiMail size={12} /> {visit.email || '—'}
                        </a>
                      </div>
                    </td>
                    <td>
                      {visit.property ? (
                        <div style={{ fontSize: '0.8125rem' }}>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '280px' }} title={visit.property.title}>
                            <FiHome size={13} style={{ marginRight: 4, color: 'var(--primary)', verticalAlign: 'text-bottom' }} />
                            {visit.property.title}
                          </div>
                          <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: 2, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}><FiMapPin size={11} /> {visit.property.location || '—'}</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 2, color: 'var(--primary)', fontWeight: 500 }}><FiDollarSign size={11} /> {visit.property.price || '—'}</span>
                          </div>
                        </div>
                      ) : (
                        <div style={{ color: 'var(--text-tertiary)', fontSize: '0.8125rem' }}>—</div>
                      )}
                    </td>
                    <td>
                      <div className="appointment-badge">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, color: '#1e293b' }}>
                          <FiCalendar size={13} style={{ color: 'var(--primary)' }} />
                          {visit.preferredDate || '—'}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                          <FiClock size={13} />
                          {visit.preferredTime || '—'}
                        </div>
                      </div>
                    </td>
                    <td onClick={e => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button 
                          className="btn btn-ghost btn-icon" 
                          style={{ color: 'var(--danger)', background: 'var(--danger-light)' }} 
                          onClick={() => setDeleteId(visit.id)} 
                          title="Delete Appointment"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile / Tablet Cards View */}
        <div className="mobile-only">
          {loading ? (
            <div style={{ padding: 20 }}>
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="skeleton skeleton-card-item" style={{ height: 170, borderRadius: 12, marginBottom: 16 }} />
              ))}
            </div>
          ) : paginated.length === 0 ? (
            <div className="table-empty" style={{ padding: '36px 16px' }}>
              <div className="table-empty-icon">📅</div>
              <p style={{ fontWeight: 500 }}>No site visits found</p>
            </div>
          ) : (
            <div className="mobile-cards-list">
              {paginated.map((visit, i) => (
                <div key={visit.id} className="mobile-card" onClick={() => setSelectedVisit(visit)}>
                  <div className="mobile-card-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="avatar-circle-visit">{getInitials(visit.fullName)}</div>
                      <div>
                        <h4>{visit.fullName || '—'}</h4>
                        <span>Scheduled: {visit.preferredDate || '—'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mobile-card-body">
                    {visit.property && (
                      <div className="mobile-card-row">
                        <FiHome size={14} className="card-row-icon" />
                        <span className="card-row-label">Property:</span>
                        <strong className="card-row-value">{visit.property.title}</strong>
                      </div>
                    )}
                    <div className="mobile-card-row">
                      <FiPhone size={14} className="card-row-icon" />
                      <span className="card-row-label">Phone:</span>
                      <a href={`tel:${visit.mobileNumber}`} className="card-row-link" onClick={e => e.stopPropagation()}>{visit.mobileNumber || '—'}</a>
                    </div>
                    <div className="mobile-card-row">
                      <FiMail size={14} className="card-row-icon" />
                      <span className="card-row-label">Email:</span>
                      <a href={`mailto:${visit.email}`} className="card-row-link" onClick={e => e.stopPropagation()}>{visit.email || '—'}</a>
                    </div>

                    <div className="mobile-appointment-slot">
                      <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-tertiary)', display: 'block', marginBottom: 2 }}>Preferred Timing slot</span>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <FiClock size={13} style={{ color: 'var(--primary)' }} />
                        {visit.preferredTime || '—'} ({visit.preferredDate || '—'})
                      </div>
                    </div>
                  </div>

                  <div className="mobile-card-actions" onClick={e => e.stopPropagation()}>
                    <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => setSelectedVisit(visit)}>
                      View Details
                    </button>
                    <button 
                      className="btn btn-danger btn-sm btn-icon" 
                      onClick={() => setDeleteId(visit.id)}
                      style={{ padding: '6px 12px', background: 'var(--danger-light)', color: 'var(--danger)', borderColor: 'transparent' }}
                    >
                      <FiTrash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination footer */}
        {!loading && filtered.length > PAGE_SIZE && (
          <div className="pagination">
            <span>Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}</span>
            <div className="pagination__controls">
              <button className="page-btn" onClick={() => setPage(p => p - 1)} disabled={page === 1}>‹</button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button 
                  key={i + 1} 
                  className={`page-btn ${page === i + 1 ? 'active' : ''}`} 
                  onClick={() => setPage(i + 1)}
                >
                  {i + 1}
                </button>
              ))}
              <button className="page-btn" onClick={() => setPage(p => p + 1)} disabled={page === totalPages}>›</button>
            </div>
          </div>
        )}
      </div>

      {/* Selected Visit Details Modal */}
      {selectedVisit && (
        <div className="modal-overlay" onClick={() => setSelectedVisit(null)}>
          <div className="modal modal-md" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Site Visit Details</h2>
              <button className="modal-close" onClick={() => setSelectedVisit(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                
                {/* Appointment time header box */}
                <div style={{
                  background: 'linear-gradient(135deg, var(--primary-light) 0%, #e0f2fe 100%)',
                  padding: '20px',
                  borderRadius: '14px',
                  border: '1px solid rgba(99, 102, 241, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16
                }}>
                  <div style={{
                    width: 48,
                    height: 48,
                    borderRadius: '12px',
                    background: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 10px rgba(99, 102, 241, 0.12)'
                  }}>
                    <FiCalendar size={22} style={{ color: 'var(--primary)' }} />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.72rem', fontStyle: 'normal', color: 'var(--primary-dark)', letterSpacing: '0.04em', textTransform: 'uppercase', fontWeight: 600 }}>Scheduled Appointment</span>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '2px 0 0', color: 'var(--text-primary)' }}>
                      {selectedVisit.preferredDate} at {selectedVisit.preferredTime}
                    </h3>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
                  <div style={{ background: '#f8fafc', padding: 12, borderRadius: 10, border: '1px solid #e2e8f0' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 2 }}>Customer</span>
                    <strong style={{ fontSize: '0.90rem', color: 'var(--text-primary)' }}>{selectedVisit.fullName || '—'}</strong>
                  </div>
                  <div style={{ background: '#f8fafc', padding: 12, borderRadius: 10, border: '1px solid #e2e8f0' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 2 }}>Contact Details</span>
                    <div style={{ fontSize: '0.90rem', marginTop: 2 }}>
                      <a href={`tel:${selectedVisit.mobileNumber}`} style={{ color: 'var(--primary)', fontWeight: 600, display: 'block' }}>{selectedVisit.mobileNumber || '—'}</a>
                      <a href={`mailto:${selectedVisit.email}`} style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.8rem' }}>{selectedVisit.email || '—'}</a>
                    </div>
                  </div>
                </div>

                {selectedVisit.property && (
                  <div>
                    <label style={{ fontWeight: 600, fontSize: '0.875rem', display: 'block', marginBottom: 6, color: 'var(--text-primary)' }}>Requested Property</label>
                    <div style={{ background: '#f8fafc', padding: 14, borderRadius: 12, border: '1px solid #e2e8f0' }}>
                      <h4 style={{ fontSize: '0.90rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
                        <FiHome size={14} style={{ marginRight: 6, color: 'var(--primary)', verticalAlign: 'text-bottom' }} />
                        {selectedVisit.property.title}
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, paddingLeft: 20 }}>
                        <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <FiMapPin size={12} /> {selectedVisit.property.location || '—'}
                        </div>
                        <div style={{ fontSize: '0.8125rem', color: 'var(--primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <FiDollarSign size={12} /> {selectedVisit.property.price || '—'}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {selectedVisit.createdAt && (
                  <div style={{ fontSize: '0.73rem', color: 'var(--text-tertiary)', textAlign: 'right' }}>
                    Record added: {formatDateTime(selectedVisit.createdAt)}
                  </div>
                )}

              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary w-full" onClick={() => setSelectedVisit(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <ConfirmDialog
          title="Delete Site Visit Record"
          message="Are you sure you want to delete this site visit appointment? This will permanently erase the record from the database."
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
          loading={deleteLoading}
        />
      )}

      <style>{`
        .avatar-circle-visit {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: #e0f2fe;
          color: #0369a1;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.8125rem;
          flex-shrink: 0;
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.06);
          border: 1.5px solid white;
        }

        .appointment-badge {
          background: #f8fafc;
          border: 1.5px solid #e2e8f0;
          border-radius: 10px;
          padding: 8px 12px;
          display: inline-block;
          font-size: 0.8125rem;
        }

        .desktop-only {
          display: block;
        }

        .mobile-only {
          display: none;
        }

        /* Mobile Card Style */
        .mobile-cards-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
          padding: 16px;
          background: #f8fafc;
        }

        .mobile-card {
          background: white;
          border-radius: 12px;
          border: 1px solid var(--border);
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .mobile-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 12px -1px rgba(0, 0, 0, 0.08);
        }

        .mobile-card-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          border-bottom: 1px solid #f1f5f9;
          padding-bottom: 10px;
        }

        .mobile-card-header h4 {
          font-size: 0.925rem;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 2px;
        }

        .mobile-card-header span {
          font-size: 0.75rem;
          color: var(--primary-dark);
          background: var(--primary-light);
          padding: 2px 8px;
          border-radius: 20px;
          font-weight: 500;
        }

        .mobile-card-body {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .mobile-card-row {
          display: flex;
          align-items: center;
          font-size: 0.8125rem;
          color: var(--text-secondary);
        }

        .card-row-icon {
          color: var(--primary);
          margin-right: 6px;
          flex-shrink: 0;
        }

        .card-row-label {
          color: var(--text-tertiary);
          margin-right: 4px;
          width: 55px;
          flex-shrink: 0;
        }

        .card-row-value {
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .card-row-link {
          color: var(--primary);
          font-weight: 500;
          text-decoration: underline;
        }

        .mobile-appointment-slot {
          background: #f0fdfa;
          padding: 8px 12px;
          border-radius: 8px;
          border: 1.5px solid #ccfbf1;
          margin-top: 4px;
        }

        .mobile-card-actions {
          display: flex;
          align-items: center;
          gap: 8px;
          border-top: 1px solid #f1f5f9;
          padding-top: 12px;
          margin-top: 4px;
        }

        @keyframes shimmer-fast {
          0% { background-position: -200px 0; }
          100% { background-position: 200px 0; }
        }

        .skeleton-card-item {
          background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
          background-size: 400px 100%;
          animation: shimmer-fast 1.4s ease infinite;
        }

        @media (max-width: 768px) {
          .desktop-only {
            display: none;
          }
          .mobile-only {
            display: block;
          }
        }
      `}</style>
    </div>
  );
}

export default SiteVisitsList;

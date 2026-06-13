import { useState, useEffect } from 'react';
import { enquiriesService } from '../../services/firestoreService';
import { formatDate, formatDateTime, getStatusColor } from '../../utils/formatters';
import toast from 'react-hot-toast';
import { FiSearch, FiEdit2, FiTrash2, FiMessageSquare } from 'react-icons/fi';

const STATUSES = ['Pending', 'Contacted', 'Interested', 'Closed'];
const PAGE_SIZE = 10;

function ConfirmDialog({ title, message, onConfirm, onCancel, loading }) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal modal-sm" onClick={e => e.stopPropagation()}>
        <div className="modal-body"><div className="confirm-dialog"><div className="confirm-dialog__icon">⚠️</div><h3>{title}</h3><p>{message}</p></div></div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onCancel} disabled={loading}>Cancel</button>
          <button className="btn btn-danger" onClick={onConfirm} disabled={loading}>{loading ? 'Deleting...' : 'Delete'}</button>
        </div>
      </div>
    </div>
  );
}

function EnquiriesList() {
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage] = useState(1);
  const [viewEnq, setViewEnq] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [notes, setNotes] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      setEnquiries(await enquiriesService.getAll());
    } catch {
      toast.error('Failed to load enquiries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const openView = (enq) => {
    setViewEnq(enq);
    setNotes(enq.notes || '');
    setEditStatus(enq.status || 'Pending');
  };

  const handleSaveUpdate = async () => {
    setSaving(true);
    try {
      await enquiriesService.update(viewEnq.id, { status: editStatus, notes });
      toast.success('Enquiry updated');
      setViewEnq(null);
      fetchData();
    } catch {
      toast.error('Update failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await enquiriesService.delete(deleteId);
      toast.success('Enquiry deleted');
      setDeleteId(null);
      fetchData();
    } catch {
      toast.error('Delete failed');
    } finally {
      setDeleteLoading(false);
    }
  };

  const filtered = enquiries.filter(e => {
    const s = search.toLowerCase();
    const matchSearch = !s || (e.customerName || '').toLowerCase().includes(s) || (e.phone || '').includes(s) || (e.email || '').toLowerCase().includes(s) || (e.propertyTitle || '').toLowerCase().includes(s);
    const matchStatus = !filterStatus || e.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div>
      <div className="page-header">
        <div className="page-header__left">
          <h1>Enquiries</h1>
          <p>{enquiries.filter(e => e.status === 'Pending').length} pending • {enquiries.length} total</p>
        </div>
      </div>

      <div className="table-wrapper">
        <div className="table-toolbar">
          <div className="table-toolbar__left">
            <div className="search-bar">
              <FiSearch className="search-bar__icon" />
              <input placeholder="Search by name, phone, property..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
            </div>
            <select className="filter-select" value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}>
              <option value="">All Statuses</option>
              {STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="table-toolbar__right">
            <span style={{ fontSize: '0.875rem', color: '#64748b' }}>{filtered.length} results</span>
          </div>
        </div>

        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Customer</th>
                <th>Contact</th>
                <th>Property</th>
                <th>Message</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>{Array.from({ length: 8 }).map((_, j) => <td key={j}><div className="skeleton skeleton-text" /></td>)}</tr>
                ))
              ) : paginated.length === 0 ? (
                <tr><td colSpan={8}><div className="table-empty"><div className="table-empty-icon">📭</div><p>No enquiries found</p></div></td></tr>
              ) : (
                paginated.map((enq, i) => (
                  <tr key={enq.id}>
                    <td style={{ color: '#94a3b8' }}>{(page - 1) * PAGE_SIZE + i + 1}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{enq.customerName || '—'}</div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.8125rem' }}>{enq.phone}</div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{enq.email}</div>
                    </td>
                    <td style={{ maxWidth: 150 }}>
                      <div style={{ fontSize: '0.8125rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{enq.propertyTitle || '—'}</div>
                    </td>
                    <td style={{ maxWidth: 200 }}>
                      <div style={{ fontSize: '0.8125rem', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{enq.message || '—'}</div>
                    </td>
                    <td>
                      <span className={`badge badge-${getStatusColor(enq.status)}`}>{enq.status || 'Pending'}</span>
                    </td>
                    <td style={{ color: '#64748b', fontSize: '0.8125rem' }}>{formatDate(enq.createdAt)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn btn-ghost btn-icon" onClick={() => openView(enq)} title="View & Update"><FiMessageSquare size={16} /></button>
                        <button className="btn btn-ghost btn-icon" style={{ color: '#ef4444' }} onClick={() => setDeleteId(enq.id)} title="Delete"><FiTrash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && filtered.length > PAGE_SIZE && (
          <div className="pagination">
            <span>Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}</span>
            <div className="pagination__controls">
              <button className="page-btn" onClick={() => setPage(p => p - 1)} disabled={page === 1}>‹</button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button key={i + 1} className={`page-btn ${page === i + 1 ? 'active' : ''}`} onClick={() => setPage(i + 1)}>{i + 1}</button>
              ))}
              <button className="page-btn" onClick={() => setPage(p => p + 1)} disabled={page === totalPages}>›</button>
            </div>
          </div>
        )}
      </div>

      {/* View/Edit Modal */}
      {viewEnq && (
        <div className="modal-overlay" onClick={() => setViewEnq(null)}>
          <div className="modal modal-md" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Enquiry Details</h2>
              <button className="modal-close" onClick={() => setViewEnq(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  ['Customer', viewEnq.customerName],
                  ['Phone', viewEnq.phone],
                  ['Email', viewEnq.email],
                  ['Property', viewEnq.propertyTitle],
                  ['Date', formatDateTime(viewEnq.createdAt)],
                ].map(([k, v]) => (
                  <div key={k} className="enquiry-detail-row">
                    <label>{k}:</label><span>{v || '—'}</span>
                  </div>
                ))}
                {viewEnq.message && (
                  <div>
                    <label style={{ fontWeight: 600, fontSize: '0.875rem', display: 'block', marginBottom: 6 }}>Message:</label>
                    <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, fontSize: '0.875rem', color: '#475569', lineHeight: 1.7 }}>{viewEnq.message}</div>
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label">Update Status</label>
                  <select className="form-control" value={editStatus} onChange={e => setEditStatus(e.target.value)}>
                    {STATUSES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Notes</label>
                  <textarea className="form-control" rows={3} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Add internal notes about this enquiry..." />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setViewEnq(null)} disabled={saving}>Close</button>
              <button className="btn btn-primary" onClick={handleSaveUpdate} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <ConfirmDialog
          title="Delete Enquiry"
          message="Permanently delete this enquiry?"
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
          loading={deleteLoading}
        />
      )}
    </div>
  );
}

export default EnquiriesList;

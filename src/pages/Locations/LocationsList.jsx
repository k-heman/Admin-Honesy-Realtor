import { useState, useEffect } from 'react';
import { locationsService } from '../../services/firestoreService';
import { formatDate } from '../../utils/formatters';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';

function ConfirmDialog({ title, message, onConfirm, onCancel, loading }) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal modal-sm" onClick={e => e.stopPropagation()}>
        <div className="modal-body">
          <div className="confirm-dialog">
            <div className="confirm-dialog__icon">⚠️</div>
            <h3>{title}</h3><p>{message}</p>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onCancel} disabled={loading}>Cancel</button>
          <button className="btn btn-danger" onClick={onConfirm} disabled={loading}>{loading ? 'Deleting...' : 'Delete'}</button>
        </div>
      </div>
    </div>
  );
}

function LocationsList() {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [form, setForm] = useState({ locationName: '', city: '', status: 'active' });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const fetchData = async () => {
    setLoading(true);
    try {
      setLocations(await locationsService.getAll());
    } catch {
      toast.error('Failed to load locations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const openAdd = () => { setEditItem(null); setForm({ locationName: '', city: '', status: 'active' }); setErrors({}); setShowForm(true); };
  const openEdit = (loc) => { setEditItem(loc); setForm({ locationName: loc.locationName || '', city: loc.city || '', status: loc.status || 'active' }); setErrors({}); setShowForm(true); };

  const validate = () => {
    const errs = {};
    if (!form.locationName.trim()) errs.locationName = 'Location name is required';
    if (!form.city.trim()) errs.city = 'City is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      if (editItem) {
        await locationsService.update(editItem.id, form);
        toast.success('Location updated');
      } else {
        await locationsService.create(form);
        toast.success('Location added');
      }
      setShowForm(false);
      fetchData();
    } catch {
      toast.error('Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await locationsService.delete(deleteId);
      toast.success('Location deleted');
      setDeleteId(null);
      fetchData();
    } catch {
      toast.error('Delete failed');
    } finally {
      setDeleteLoading(false);
    }
  };

  const toggleStatus = async (loc) => {
    const newStatus = loc.status === 'active' ? 'inactive' : 'active';
    try {
      await locationsService.update(loc.id, { status: newStatus });
      toast.success(`Status set to ${newStatus}`);
      fetchData();
    } catch {
      toast.error('Update failed');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header__left">
          <h1>Locations</h1>
          <p>Manage property locations available for filtering</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}><FiPlus size={16} /> Add Location</button>
      </div>

      <div className="table-wrapper">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Location Name</th>
                <th>City</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>{Array.from({ length: 6 }).map((_, j) => <td key={j}><div className="skeleton skeleton-text" /></td>)}</tr>
                ))
              ) : locations.length === 0 ? (
                <tr><td colSpan={6}><div className="table-empty"><div className="table-empty-icon">📍</div><p>No locations yet</p></div></td></tr>
              ) : (
                locations.map((loc, i) => (
                  <tr key={loc.id}>
                    <td style={{ color: '#94a3b8', fontSize: '0.875rem' }}>{i + 1}</td>
                    <td><div style={{ fontWeight: 600 }}>📍 {loc.locationName}</div></td>
                    <td style={{ color: '#64748b' }}>{loc.city}</td>
                    <td>
                      <button
                        onClick={() => toggleStatus(loc)}
                        className={`badge ${loc.status === 'active' ? 'badge-success' : 'badge-secondary'}`}
                        style={{ cursor: 'pointer', border: 'none' }}
                      >
                        {loc.status === 'active' ? '✓ Active' : '✗ Inactive'}
                      </button>
                    </td>
                    <td style={{ color: '#64748b', fontSize: '0.8125rem' }}>{formatDate(loc.createdAt)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn btn-ghost btn-icon" onClick={() => openEdit(loc)} title="Edit"><FiEdit2 size={16} /></button>
                        <button className="btn btn-ghost btn-icon" style={{ color: '#ef4444' }} onClick={() => setDeleteId(loc.id)} title="Delete"><FiTrash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal modal-sm" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editItem ? 'Edit Location' : 'Add Location'}</h2>
              <button className="modal-close" onClick={() => setShowForm(false)}>✕</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="form-group">
                  <label className="form-label required">Location Name</label>
                  <input className={`form-control ${errors.locationName ? 'error' : ''}`} value={form.locationName} onChange={e => setForm(p => ({ ...p, locationName: e.target.value }))} placeholder="e.g. Jubilee Hills" autoFocus />
                  {errors.locationName && <span className="form-error">{errors.locationName}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label required">City</label>
                  <input className={`form-control ${errors.city ? 'error' : ''}`} value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))} placeholder="e.g. Hyderabad" />
                  {errors.city && <span className="form-error">{errors.city}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-control" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)} disabled={saving}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : editItem ? 'Update' : 'Add Location'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteId && (
        <ConfirmDialog
          title="Delete Location"
          message="Delete this location?"
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
          loading={deleteLoading}
        />
      )}
    </div>
  );
}

export default LocationsList;

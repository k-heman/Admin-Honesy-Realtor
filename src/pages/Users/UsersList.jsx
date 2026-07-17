import { useState, useEffect } from 'react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { adminsService } from '../../services/firestoreService';
import { formatDate, getStatusColor } from '../../utils/formatters';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit2, FiTrash2, FiSearch } from 'react-icons/fi';

const ROLES = ['Super Admin', 'Admin', 'Manager', 'Agent'];

function ConfirmDialog({ title, message, onConfirm, onCancel, loading }) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal modal-sm" onClick={e => e.stopPropagation()}>
        <div className="modal-body">
          <div className="confirm-dialog">
            <div className="confirm-dialog__icon">⚠️</div>
            <h3>{title}</h3>
            <p>{message}</p>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onCancel} disabled={loading}>Cancel</button>
          <button className="btn btn-danger" onClick={onConfirm} disabled={loading}>
            {loading ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

function UsersList() {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [form, setForm] = useState({ name: '', mobileNumber: '', role: 'Agent', status: 'active' });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const fetchData = async () => {
    setLoading(true);
    try {
      setUsers(await adminsService.getAll());
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAdd = () => {
    setEditItem(null);
    setForm({ name: '', mobileNumber: '', role: 'Agent', status: 'active' });
    setErrors({});
    setShowForm(true);
  };

  const openEdit = (user) => {
    setEditItem(user);
    setForm({
      name: user.name || '',
      mobileNumber: user.mobileNumber || '',
      role: user.role || 'Agent',
      status: user.status || 'active',
    });
    setErrors({});
    setShowForm(true);
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    
    const rawPhone = form.mobileNumber.trim();
    if (!rawPhone) {
      errs.mobileNumber = 'Mobile number is required';
    } else {
      let val = rawPhone;
      if (!val.startsWith('+')) val = '+91' + val;
      if (val.length < 12) {
        errs.mobileNumber = 'Enter a valid mobile number (e.g. +918523802251)';
      }
    }
    
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);

    let formattedPhone = form.mobileNumber.trim();
    if (!formattedPhone.startsWith('+')) {
      formattedPhone = '+91' + formattedPhone;
    }

    try {
      if (editItem) {
        // Update existing admin record
        await adminsService.update(editItem.id, {
          name: form.name,
          mobileNumber: formattedPhone,
          role: form.role,
          active: form.status === 'active',
          status: form.status,
          updatedAt: serverTimestamp(),
        });
        toast.success('User updated');
      } else {
        // Create new admin record directly in Firestore
        await adminsService.create({
          name: form.name,
          mobileNumber: formattedPhone,
          role: form.role,
          active: form.status === 'active',
          status: form.status,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        toast.success('Admin user added');
      }
      setShowForm(false);
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to save user');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await adminsService.delete(deleteId);
      toast.success('User removed from admin');
      setDeleteId(null);
      fetchData();
    } catch {
      toast.error('Delete failed');
    } finally {
      setDeleteLoading(false);
    }
  };

  const toggleStatus = async (user) => {
    if (user.mobileNumber === currentUser?.phoneNumber) {
      toast.error("Can't deactivate yourself");
      return;
    }
    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    try {
      await adminsService.update(user.id, {
        status: newStatus,
        active: newStatus === 'active',
        updatedAt: serverTimestamp(),
      });
      toast.success(`User ${newStatus}`);
      fetchData();
    } catch {
      toast.error('Update failed');
    }
  };

  const filtered = users.filter(u => {
    const s = search.toLowerCase();
    return (
      !s ||
      (u.name || '').toLowerCase().includes(s) ||
      (u.mobileNumber || '').toLowerCase().includes(s) ||
      (u.role || '').toLowerCase().includes(s)
    );
  });

  return (
    <div>
      <div className="page-header">
        <div className="page-header__left">
          <h1>Admin Users</h1>
          <p>Manage admin access and mobile pre-approval list</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <FiPlus size={16} /> Add Admin User
        </button>
      </div>

      <div className="table-wrapper">
        <div className="table-toolbar">
          <div className="table-toolbar__left">
            <div className="search-bar">
              <FiSearch className="search-bar__icon" />
              <input placeholder="Search users by name or mobile..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
        </div>

        {/* Desktop Table */}
        <div className="table-scroll desktop-table">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Mobile Number</th>
                <th>Role</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j}><div className="skeleton skeleton-text" /></td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="table-empty">
                      <div className="table-empty-icon">👥</div>
                      <p>No admin users found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((user, i) => (
                  <tr key={user.id} style={{ opacity: user.status === 'inactive' ? 0.6 : 1 }}>
                    <td style={{ color: '#94a3b8' }}>{i + 1}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 36,
                          height: 36,
                          borderRadius: '50%',
                          background: '#e0e7ff',
                          color: '#4f46e5',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '0.875rem',
                          flexShrink: 0
                        }}>
                          {(user.name || 'A')[0].toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600 }}>{user.name}</div>
                          {user.mobileNumber === currentUser?.phoneNumber && (
                            <div style={{ fontSize: '0.7rem', color: '#6366f1', fontWeight: 600 }}>You</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td style={{ color: '#64748b', fontSize: '0.875rem' }}>{user.mobileNumber}</td>
                    <td>
                      <span className={`badge badge-${getStatusColor(user.role)}`}>{user.role}</span>
                    </td>
                    <td>
                      <button
                        onClick={() => toggleStatus(user)}
                        className={`badge ${user.status === 'active' ? 'badge-success' : 'badge-secondary'}`}
                        style={{ cursor: 'pointer', border: 'none' }}
                        disabled={user.mobileNumber === currentUser?.phoneNumber}
                      >
                        {user.status === 'active' ? '✓ Active' : '✗ Inactive'}
                      </button>
                    </td>
                    <td style={{ color: '#64748b', fontSize: '0.8125rem' }}>{formatDate(user.createdAt)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn btn-ghost btn-icon" onClick={() => openEdit(user)} title="Edit">
                          <FiEdit2 size={16} />
                        </button>
                        {user.mobileNumber !== currentUser?.phoneNumber && (
                          <button
                            className="btn btn-ghost btn-icon"
                            style={{ color: '#ef4444' }}
                            onClick={() => setDeleteId(user.id)}
                            title="Remove"
                          >
                            <FiTrash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="mobile-table-cards">
          {loading ? (
            <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="skeleton" style={{ height: 100, borderRadius: 12 }} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="table-empty">
              <div className="table-empty-icon">👥</div>
              <p>No admin users found</p>
            </div>
          ) : (
            <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {filtered.map((user) => (
                <div key={user.id} className="mobile-user-card" style={{ opacity: user.status === 'inactive' ? 0.6 : 1 }}>
                  <div className="mobile-user-card__top">
                    <div className="mobile-user-card__avatar">
                      {(user.name || 'A')[0].toUpperCase()}
                    </div>
                    <div className="mobile-user-card__details">
                      <div className="mobile-user-card__name">
                        {user.name}
                        {user.mobileNumber === currentUser?.phoneNumber && (
                          <span style={{ fontSize: '0.7rem', color: '#6366f1', fontWeight: 600, marginLeft: 6 }}>You</span>
                        )}
                      </div>
                      <div className="mobile-user-card__phone">{user.mobileNumber}</div>
                    </div>
                  </div>
                  <div className="mobile-simple-card__row">
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <span className={`badge badge-${getStatusColor(user.role)}`}>{user.role}</span>
                      <button
                        onClick={() => toggleStatus(user)}
                        className={`badge ${user.status === 'active' ? 'badge-success' : 'badge-secondary'}`}
                        style={{ cursor: 'pointer', border: 'none' }}
                        disabled={user.mobileNumber === currentUser?.phoneNumber}
                      >
                        {user.status === 'active' ? '✓ Active' : '✗ Inactive'}
                      </button>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{formatDate(user.createdAt)}</span>
                  </div>
                  <div className="mobile-simple-card__actions">
                    <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => openEdit(user)}>
                      <FiEdit2 size={14} /> Edit
                    </button>
                    {user.mobileNumber !== currentUser?.phoneNumber && (
                      <button className="btn btn-ghost btn-sm btn-icon" style={{ color: '#ef4444', background: '#fee2e2', borderColor: 'transparent' }} onClick={() => setDeleteId(user.id)}>
                        <FiTrash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal modal-sm" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editItem ? 'Edit Admin User' : 'Add Admin User'}</h2>
              <button className="modal-close" onClick={() => setShowForm(false)}>✕</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="form-group">
                  <label className="form-label required">Full Name</label>
                  <input
                    className={`form-control ${errors.name ? 'error' : ''}`}
                    value={form.name}
                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    placeholder="e.g. Rajesh Kumar"
                    autoFocus
                  />
                  {errors.name && <span className="form-error">{errors.name}</span>}
                </div>
                
                <div className="form-group">
                  <label className="form-label required">Mobile Number</label>
                  <input
                    className={`form-control ${errors.mobileNumber ? 'error' : ''}`}
                    type="tel"
                    value={form.mobileNumber}
                    onChange={e => setForm(p => ({ ...p, mobileNumber: e.target.value }))}
                    placeholder="e.g. +918523802251"
                  />
                  {errors.mobileNumber && <span className="form-error">{errors.mobileNumber}</span>}
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Include country code (e.g. +91)</span>
                </div>

                <div className="form-group">
                  <label className="form-label">Role</label>
                  <select className="form-control" value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}>
                    {ROLES.map(r => <option key={r}>{r}</option>)}
                  </select>
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
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : editItem ? 'Update User' : 'Create Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteId && (
        <ConfirmDialog
          title="Remove Admin Access"
          message="This removes the admin's approval. They will no longer be allowed to log into the admin panel."
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
          loading={deleteLoading}
        />
      )}
    </div>
  );
}

export default UsersList;

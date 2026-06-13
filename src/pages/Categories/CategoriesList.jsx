import { useState, useEffect } from 'react';
import { categoriesService } from '../../services/firestoreService';
import { formatDate } from '../../utils/formatters';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiCheck } from 'react-icons/fi';

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

function CategoriesList() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [form, setForm] = useState({ name: '', status: 'active' });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await categoriesService.getAll();
      setCategories(data);
    } catch {
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const openAdd = () => {
    setEditItem(null);
    setForm({ name: '', status: 'active' });
    setFormError('');
    setShowForm(true);
  };

  const openEdit = (cat) => {
    setEditItem(cat);
    setForm({ name: cat.name || '', status: cat.status || 'active' });
    setFormError('');
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setFormError('Category name is required'); return; }
    setSaving(true);
    try {
      if (editItem) {
        await categoriesService.update(editItem.id, form);
        toast.success('Category updated');
      } else {
        await categoriesService.create(form);
        toast.success('Category added');
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
      await categoriesService.delete(deleteId);
      toast.success('Category deleted');
      setDeleteId(null);
      fetchData();
    } catch {
      toast.error('Delete failed');
    } finally {
      setDeleteLoading(false);
    }
  };

  const toggleStatus = async (cat) => {
    const newStatus = cat.status === 'active' ? 'inactive' : 'active';
    try {
      await categoriesService.update(cat.id, { status: newStatus });
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
          <h1>Property Categories</h1>
          <p>Manage property types shown on the website</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <FiPlus size={16} /> Add Category
        </button>
      </div>

      <div className="table-wrapper">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Category Name</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>{Array.from({ length: 5 }).map((_, j) => <td key={j}><div className="skeleton skeleton-text" /></td>)}</tr>
                ))
              ) : categories.length === 0 ? (
                <tr><td colSpan={5}><div className="table-empty"><div className="table-empty-icon">🏷️</div><p>No categories yet</p></div></td></tr>
              ) : (
                categories.map((cat, i) => (
                  <tr key={cat.id}>
                    <td style={{ color: '#94a3b8', fontSize: '0.875rem' }}>{i + 1}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{cat.name}</div>
                    </td>
                    <td>
                      <button
                        onClick={() => toggleStatus(cat)}
                        className={`badge ${cat.status === 'active' ? 'badge-success' : 'badge-secondary'}`}
                        style={{ cursor: 'pointer', border: 'none' }}
                      >
                        {cat.status === 'active' ? '✓ Active' : '✗ Inactive'}
                      </button>
                    </td>
                    <td style={{ color: '#64748b', fontSize: '0.8125rem' }}>{formatDate(cat.createdAt)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn btn-ghost btn-icon" onClick={() => openEdit(cat)} title="Edit">
                          <FiEdit2 size={16} />
                        </button>
                        <button className="btn btn-ghost btn-icon" style={{ color: '#ef4444' }} onClick={() => setDeleteId(cat.id)} title="Delete">
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
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal modal-sm" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editItem ? 'Edit Category' : 'Add Category'}</h2>
              <button className="modal-close" onClick={() => setShowForm(false)}>✕</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="form-group">
                  <label className="form-label required">Category Name</label>
                  <input
                    className={`form-control ${formError ? 'error' : ''}`}
                    value={form.name}
                    onChange={e => { setForm(p => ({ ...p, name: e.target.value })); setFormError(''); }}
                    placeholder="e.g. Flats, Villas, Plots"
                    autoFocus
                  />
                  {formError && <span className="form-error">{formError}</span>}
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
                  {saving ? 'Saving...' : editItem ? 'Update' : 'Add Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <ConfirmDialog
          title="Delete Category"
          message="Delete this category? This won't affect existing properties."
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
          loading={deleteLoading}
        />
      )}
    </div>
  );
}

export default CategoriesList;

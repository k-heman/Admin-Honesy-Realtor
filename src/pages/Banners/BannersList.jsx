import { useState, useEffect, useRef } from 'react';
import { bannersService } from '../../services/firestoreService';
import { uploadFile } from '../../hooks/useStorage';
import { formatDate } from '../../utils/formatters';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit2, FiTrash2, FiUpload, FiArrowUp, FiArrowDown, FiX } from 'react-icons/fi';

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

const defaultForm = { title: '', priority: 1, isActive: true, imageUrl: '' };

function BannersList() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const fileRef = useRef();

  const fetchData = async () => {
    setLoading(true);
    try {
      setBanners(await bannersService.getAll());
    } catch {
      toast.error('Failed to load banners');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const openAdd = () => {
    setEditItem(null);
    setForm({ ...defaultForm, priority: banners.length + 1 });
    setImageFile(null);
    setImagePreview('');
    setErrors({});
    setShowForm(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setForm({ title: item.title || '', priority: item.priority || 1, isActive: item.isActive !== false, imageUrl: item.imageUrl || '' });
    setImageFile(null);
    setImagePreview(item.imageUrl || '');
    setErrors({});
    setShowForm(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const validate = () => {
    const errs = {};
    if (!form.title.trim()) errs.title = 'Banner title is required';
    if (!imagePreview) errs.imageUrl = 'Banner image is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      let imageUrl = form.imageUrl;
      if (imageFile) imageUrl = await uploadFile(imageFile, 'banners');
      const data = { ...form, imageUrl };
      if (editItem) {
        await bannersService.update(editItem.id, data);
        toast.success('Banner updated');
      } else {
        await bannersService.create(data);
        toast.success('Banner added');
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
      await bannersService.delete(deleteId);
      toast.success('Banner deleted');
      setDeleteId(null);
      fetchData();
    } catch {
      toast.error('Delete failed');
    } finally {
      setDeleteLoading(false);
    }
  };

  const toggleActive = async (banner) => {
    try {
      await bannersService.update(banner.id, { isActive: !banner.isActive });
      toast.success(`Banner ${!banner.isActive ? 'activated' : 'deactivated'}`);
      fetchData();
    } catch {
      toast.error('Update failed');
    }
  };

  const movePriority = async (banner, direction) => {
    const sorted = [...banners].sort((a, b) => (a.priority || 0) - (b.priority || 0));
    const idx = sorted.findIndex(b => b.id === banner.id);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    const swapBanner = sorted[swapIdx];
    try {
      await bannersService.update(banner.id, { priority: swapBanner.priority || swapIdx + 1 });
      await bannersService.update(swapBanner.id, { priority: banner.priority || idx + 1 });
      toast.success('Order updated');
      fetchData();
    } catch {
      toast.error('Reorder failed');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header__left">
          <h1>Hero Banners</h1>
          <p>Manage the hero section images on the public website</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}><FiPlus size={16} /> Add Banner</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', height: 120 }}>
              <div className="skeleton" style={{ width: 180, height: '100%', borderRadius: 0 }} />
              <div style={{ flex: 1, padding: 20 }}>
                <div className="skeleton skeleton-text" style={{ width: '40%', marginBottom: 12 }} />
                <div className="skeleton skeleton-text" style={{ width: '25%' }} />
              </div>
            </div>
          ))
        ) : banners.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 48 }}>
            <div style={{ fontSize: '3rem', marginBottom: 12 }}>🖼️</div>
            <p style={{ color: '#64748b' }}>No banners yet. Add your first hero banner!</p>
          </div>
        ) : (
          [...banners].sort((a, b) => (a.priority || 0) - (b.priority || 0)).map((banner, idx, arr) => (
            <div key={banner.id} className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', alignItems: 'stretch' }}>
              {/* Image */}
              <div style={{ width: 200, flexShrink: 0, overflow: 'hidden', position: 'relative' }}>
                <img src={banner.imageUrl} alt={banner.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', top: 8, left: 8, background: '#0f172a', color: 'white', borderRadius: 6, padding: '2px 8px', fontSize: '0.75rem', fontWeight: 700 }}>
                  #{banner.priority || idx + 1}
                </div>
              </div>

              {/* Content */}
              <div style={{ flex: 1, padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 6 }}>{banner.title}</div>
                  <div style={{ fontSize: '0.8125rem', color: '#94a3b8' }}>{formatDate(banner.createdAt)}</div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <button
                    onClick={() => toggleActive(banner)}
                    className={`badge ${banner.isActive !== false ? 'badge-success' : 'badge-secondary'}`}
                    style={{ cursor: 'pointer', border: 'none', padding: '6px 14px' }}
                  >
                    {banner.isActive !== false ? '✓ Active' : '✗ Inactive'}
                  </button>

                  {/* Priority Controls */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <button className="btn btn-ghost btn-icon" style={{ padding: 4 }} onClick={() => movePriority(banner, 'up')} disabled={idx === 0} title="Move up">
                      <FiArrowUp size={14} />
                    </button>
                    <button className="btn btn-ghost btn-icon" style={{ padding: 4 }} onClick={() => movePriority(banner, 'down')} disabled={idx === arr.length - 1} title="Move down">
                      <FiArrowDown size={14} />
                    </button>
                  </div>

                  <button className="btn btn-ghost btn-icon" onClick={() => openEdit(banner)} title="Edit"><FiEdit2 size={16} /></button>
                  <button className="btn btn-ghost btn-icon" style={{ color: '#ef4444' }} onClick={() => setDeleteId(banner.id)} title="Delete"><FiTrash2 size={16} /></button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal modal-md" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editItem ? 'Edit Banner' : 'Add Banner'}</h2>
              <button className="modal-close" onClick={() => setShowForm(false)}>✕</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Image Upload */}
                <div className="form-group">
                  <label className="form-label required">Banner Image</label>
                  {imagePreview ? (
                    <div style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', marginBottom: 8 }}>
                      <img src={imagePreview} alt="Preview" style={{ width: '100%', height: 180, objectFit: 'cover' }} />
                      <button type="button" style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.7)', color: 'white', border: 'none', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                        onClick={() => { setImagePreview(''); setImageFile(null); setForm(p => ({ ...p, imageUrl: '' })); }}>
                        <FiX size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className={`image-upload-zone ${errors.imageUrl ? 'error' : ''}`} onClick={() => fileRef.current.click()} style={{ height: 140, border: errors.imageUrl ? '2px dashed #ef4444' : undefined }}>
                      <div className="image-upload-zone__icon"><FiUpload /></div>
                      <p className="image-upload-zone__text"><strong>Click to upload</strong> banner image</p>
                    </div>
                  )}
                  <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageChange} />
                  {errors.imageUrl && <span className="form-error">{errors.imageUrl}</span>}
                  {!imagePreview && <button type="button" className="btn btn-secondary btn-sm" style={{ marginTop: 8 }} onClick={() => fileRef.current.click()}><FiUpload size={14} /> Upload Image</button>}
                </div>

                <div className="form-group">
                  <label className="form-label required">Banner Title</label>
                  <input className={`form-control ${errors.title ? 'error' : ''}`} value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Find Your Dream Home" />
                  {errors.title && <span className="form-error">{errors.title}</span>}
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Priority Order</label>
                    <input className="form-control" type="number" min="1" value={form.priority} onChange={e => setForm(p => ({ ...p, priority: Number(e.target.value) }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <div style={{ marginTop: 8 }}>
                      <label className="toggle">
                        <input type="checkbox" checked={form.isActive} onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))} />
                        <span className="toggle-track"><span className="toggle-thumb" /></span>
                        <span style={{ fontSize: '0.875rem' }}>{form.isActive ? 'Active' : 'Inactive'}</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)} disabled={saving}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : editItem ? 'Update' : 'Add Banner'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteId && (
        <ConfirmDialog title="Delete Banner" message="Delete this banner from the hero section?" onConfirm={handleDelete} onCancel={() => setDeleteId(null)} loading={deleteLoading} />
      )}
    </div>
  );
}

export default BannersList;

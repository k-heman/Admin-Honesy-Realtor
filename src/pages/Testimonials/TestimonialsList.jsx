import { useState, useEffect, useRef } from 'react';
import { testimonialsService } from '../../services/firestoreService';
import { uploadFile } from '../../hooks/useStorage';
import { formatDate } from '../../utils/formatters';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit2, FiTrash2, FiUpload, FiX } from 'react-icons/fi';

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

function StarRating({ rating, onChange }) {
  return (
    <div className="star-rating">
      {[1, 2, 3, 4, 5].map(star => (
        <button key={star} type="button" className={star <= rating ? 'filled' : ''} onClick={() => onChange(star)}>
          ★
        </button>
      ))}
    </div>
  );
}

const defaultForm = { customerName: '', review: '', rating: 5, imageUrl: '' };

function TestimonialsList() {
  const [testimonials, setTestimonials] = useState([]);
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
      setTestimonials(await testimonialsService.getAll());
    } catch {
      toast.error('Failed to load testimonials');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const openAdd = () => {
    setEditItem(null);
    setForm(defaultForm);
    setImageFile(null);
    setImagePreview('');
    setErrors({});
    setShowForm(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setForm({ customerName: item.customerName || '', review: item.review || '', rating: item.rating || 5, imageUrl: item.imageUrl || '' });
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
    if (!form.customerName.trim()) errs.customerName = 'Name is required';
    if (!form.review.trim()) errs.review = 'Review is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      let imageUrl = form.imageUrl;
      if (imageFile) {
        imageUrl = await uploadFile(imageFile, 'testimonials');
      }
      const data = { ...form, imageUrl };
      if (editItem) {
        await testimonialsService.update(editItem.id, data);
        toast.success('Testimonial updated');
      } else {
        await testimonialsService.create(data);
        toast.success('Testimonial added');
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
      await testimonialsService.delete(deleteId);
      toast.success('Testimonial deleted');
      setDeleteId(null);
      fetchData();
    } catch {
      toast.error('Delete failed');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header__left">
          <h1>Testimonials</h1>
          <p>{testimonials.length} customer reviews</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}><FiPlus size={16} /> Add Testimonial</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card">
              <div className="skeleton" style={{ width: 56, height: 56, borderRadius: '50%', marginBottom: 12 }} />
              <div className="skeleton skeleton-text" style={{ width: '60%', marginBottom: 8 }} />
              <div className="skeleton skeleton-text" />
              <div className="skeleton skeleton-text" style={{ width: '80%' }} />
            </div>
          ))
        ) : testimonials.length === 0 ? (
          <div className="card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 48 }}>
            <div style={{ fontSize: '3rem', marginBottom: 12 }}>⭐</div>
            <p style={{ color: '#64748b' }}>No testimonials yet. Add your first one!</p>
          </div>
        ) : (
          testimonials.map(item => (
            <div key={item.id} className="card">
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.customerName} style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                ) : (
                  <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#e0e7ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.25rem', flexShrink: 0 }}>
                    {(item.customerName || 'U')[0].toUpperCase()}
                  </div>
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, marginBottom: 2 }}>{item.customerName}</div>
                  <div style={{ color: '#f59e0b', fontSize: '0.875rem' }}>{'★'.repeat(item.rating || 5)}{'☆'.repeat(5 - (item.rating || 5))}</div>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button className="btn btn-ghost btn-icon" onClick={() => openEdit(item)}><FiEdit2 size={15} /></button>
                  <button className="btn btn-ghost btn-icon" style={{ color: '#ef4444' }} onClick={() => setDeleteId(item.id)}><FiTrash2 size={15} /></button>
                </div>
              </div>
              <p style={{ fontSize: '0.875rem', color: '#475569', lineHeight: 1.7, fontStyle: 'italic' }}>"{item.review}"</p>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 10 }}>{formatDate(item.createdAt)}</div>
            </div>
          ))
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal modal-md" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editItem ? 'Edit Testimonial' : 'Add Testimonial'}</h2>
              <button className="modal-close" onClick={() => setShowForm(false)}>✕</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Photo Upload */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  {imagePreview ? (
                    <div style={{ position: 'relative' }}>
                      <img src={imagePreview} alt="Preview" style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', border: '3px solid #6366f1' }} />
                      <button type="button" className="image-preview-remove" onClick={() => { setImagePreview(''); setImageFile(null); setForm(p => ({ ...p, imageUrl: '' })); }}>
                        <FiX size={11} />
                      </button>
                    </div>
                  ) : (
                    <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem', border: '2px dashed #e2e8f0', cursor: 'pointer' }} onClick={() => fileRef.current.click()}>
                      👤
                    </div>
                  )}
                  <div>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => fileRef.current.click()}><FiUpload size={14} /> Upload Photo</button>
                    <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageChange} />
                    <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 4 }}>Optional profile photo</p>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label required">Customer Name</label>
                  <input className={`form-control ${errors.customerName ? 'error' : ''}`} value={form.customerName} onChange={e => setForm(p => ({ ...p, customerName: e.target.value }))} placeholder="e.g. Rajesh Kumar" />
                  {errors.customerName && <span className="form-error">{errors.customerName}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">Rating</label>
                  <StarRating rating={form.rating} onChange={r => setForm(p => ({ ...p, rating: r }))} />
                </div>

                <div className="form-group">
                  <label className="form-label required">Review</label>
                  <textarea className={`form-control ${errors.review ? 'error' : ''}`} rows={4} value={form.review} onChange={e => setForm(p => ({ ...p, review: e.target.value }))} placeholder="Customer's testimonial text..." />
                  {errors.review && <span className="form-error">{errors.review}</span>}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)} disabled={saving}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : editItem ? 'Update' : 'Add Testimonial'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteId && (
        <ConfirmDialog title="Delete Testimonial" message="Delete this testimonial?" onConfirm={handleDelete} onCancel={() => setDeleteId(null)} loading={deleteLoading} />
      )}
    </div>
  );
}

export default TestimonialsList;

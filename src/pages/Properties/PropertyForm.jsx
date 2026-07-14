import { useState, useEffect, useRef } from 'react';
import { propertiesService } from '../../services/firestoreService';
import { uploadMultipleFiles } from '../../hooks/useStorage';
import { formatDate, formatCurrency } from '../../utils/formatters';
import toast from 'react-hot-toast';
import { FiX, FiUpload, FiPlus } from 'react-icons/fi';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

const PROPERTY_TYPES = ['Flat', 'Independent House', 'Villa', 'Farm House', 'Plot'];
const SUB_TYPES = {
  'Flat': ['2BHK', '3BHK', '4BHK', 'New Flat', 'Resale Flat'],
  'Villa': ['2BHK', '3BHK', '4BHK', 'Duplex', 'Triplex'],
  'Farm House': ['1-2 Acres', '2-5 Acres', '5+ Acres'],
  'Independent House': [],
  'Plot': [],
};
const BHK_OPTIONS = ['1BHK', '2BHK', '3BHK', '4BHK', '5BHK', 'N/A'];
const FURNISHING = ['Furnished', 'Semi-Furnished', 'Unfurnished'];
const STATUS_OPTIONS = ['available', 'sold', 'rented'];

const defaultForm = {
  title: '', description: '', type: 'Flat', subType: '', bhk: '2BHK',
  furnishing: 'Unfurnished', location: '', price: '', priceValue: '',
  area: '', bedrooms: '', bathrooms: '', parking: '', status: 'available',
  isFeatured: false, isNew: false, amenities: '', images: [], tags: [],
  youtubeLink: '',
};

function TagsInput({ tags, onChange }) {
  const [input, setInput] = useState('');

  const addTag = (val) => {
    const tag = val.trim().toLowerCase().replace(/\s+/g, '-');
    if (tag && !tags.includes(tag)) onChange([...tags, tag]);
    setInput('');
  };

  const handleKeyDown = (e) => {
    if ((e.key === 'Enter' || e.key === ',') && input.trim()) {
      e.preventDefault();
      addTag(input);
    }
  };

  return (
    <div className="tags-input-wrapper">
      {tags.map(tag => (
        <span key={tag} className="tag-chip">
          {tag}
          <button type="button" onClick={() => onChange(tags.filter(t => t !== tag))}><FiX size={11} /></button>
        </span>
      ))}
      <input
        className="tags-input-field"
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => input.trim() && addTag(input)}
        placeholder={tags.length === 0 ? 'Type tags and press Enter...' : ''}
      />
    </div>
  );
}

function ImageUpload({ images, existingUrls, onNewFiles, onRemoveExisting }) {
  const [previews, setPreviews] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef();

  const handleFiles = (files) => {
    const valid = Array.from(files).filter(f => f.type.startsWith('image/'));
    const newPreviews = valid.map(f => ({ file: f, url: URL.createObjectURL(f) }));
    setPreviews(prev => [...prev, ...newPreviews]);
    onNewFiles(prev => [...prev, ...valid]);
  };

  const removeNew = (idx) => {
    URL.revokeObjectURL(previews[idx].url);
    const newPreviews = previews.filter((_, i) => i !== idx);
    setPreviews(newPreviews);
    onNewFiles(prev => prev.filter((_, i) => i !== idx));
  };

  return (
    <div>
      <div
        className={`image-upload-zone ${dragOver ? 'drag-over' : ''}`}
        onClick={() => inputRef.current.click()}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
      >
        <div className="image-upload-zone__icon"><FiUpload /></div>
        <p className="image-upload-zone__text">
          <strong>Click to upload</strong> or drag & drop images<br />
          <span style={{ fontSize: '0.75rem' }}>PNG, JPG, WEBP up to 10MB each</span>
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          style={{ display: 'none' }}
          onChange={e => handleFiles(e.target.files)}
        />
      </div>

      {(existingUrls.length > 0 || previews.length > 0) && (
        <div className="image-previews">
          {existingUrls.map((url, i) => (
            <div key={`ex-${i}`} className="image-preview-item">
              <img src={url} alt={`Image ${i + 1}`} />
              <button className="image-preview-remove" type="button" onClick={() => onRemoveExisting(i)}>
                <FiX size={11} />
              </button>
            </div>
          ))}
          {previews.map((p, i) => (
            <div key={`new-${i}`} className="image-preview-item" style={{ border: '2px solid #6366f1' }}>
              <img src={p.url} alt={`New ${i + 1}`} />
              <button className="image-preview-remove" type="button" onClick={() => removeNew(i)}>
                <FiX size={11} />
              </button>
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(99,102,241,0.85)', color: 'white', fontSize: '0.6rem', textAlign: 'center', padding: '2px' }}>NEW</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PropertyForm({ property, onClose, onSuccess }) {
  const isEdit = !!property;
  const [form, setForm] = useState(isEdit ? {
    ...defaultForm,
    ...property,
    images: property.images || (property.image ? [property.image] : []),
    amenities: Array.isArray(property.amenities) ? property.amenities.join(', ') : property.amenities || '',
    tags: property.tags || [],
    youtubeLink: property.youtubeLink || '',
  } : defaultForm);
  const [newFiles, setNewFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const set = (field, val) => {
    setForm(prev => ({ ...prev, [field]: val }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!form.title.trim()) errs.title = 'Title is required';
    if (!form.type) errs.type = 'Property type is required';
    if (!form.location.trim()) errs.location = 'Location is required';
    if (!form.price.trim()) errs.price = 'Price is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    try {
      let finalImages = [...form.images];

      // Upload new files
      if (newFiles.length > 0) {
        setUploading(true);
        const uploadedUrls = await uploadMultipleFiles(newFiles, 'properties', setUploadProgress);
        finalImages = [...finalImages, ...uploadedUrls];
        setUploading(false);
      }

      const data = {
        ...form,
        images: finalImages,
        image: finalImages[0] || '',  // Backward compatibility with existing website
        priceValue: Number(form.priceValue) || 0,
        bedrooms: Number(form.bedrooms) || 0,
        bathrooms: Number(form.bathrooms) || 0,
        parking: Number(form.parking) || 0,
        amenities: typeof form.amenities === 'string' ? form.amenities.split(',').map(a => a.trim()).filter(Boolean) : form.amenities,
      };

      if (isEdit) {
        await propertiesService.update(property.id, data);
        toast.success('Property updated successfully!');
      } else {
        await propertiesService.create(data);
        toast.success('Property created successfully!');
      }
      onSuccess();
    } catch (err) {
      toast.error('Failed to save property: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const subTypes = SUB_TYPES[form.type] || [];

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Basic Info */}
        <div>
          <div className="settings-section-title">Basic Information</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="form-group">
              <label className="form-label required">Property Title</label>
              <input className={`form-control ${errors.title ? 'error' : ''}`} value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Luxury 3BHK Flat in Jubilee Hills" />
              {errors.title && <span className="form-error">{errors.title}</span>}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label required">Property Type</label>
                <select className={`form-control ${errors.type ? 'error' : ''}`} value={form.type} onChange={e => set('type', e.target.value)}>
                  {PROPERTY_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              {subTypes.length > 0 && (
                <div className="form-group">
                  <label className="form-label">Sub Type</label>
                  <select className="form-control" value={form.subType} onChange={e => set('subType', e.target.value)}>
                    <option value="">Select Sub Type</option>
                    {subTypes.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
              )}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">BHK</label>
                <select className="form-control" value={form.bhk} onChange={e => set('bhk', e.target.value)}>
                  {BHK_OPTIONS.map(b => <option key={b}>{b}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Furnishing</label>
                <select className="form-control" value={form.furnishing} onChange={e => set('furnishing', e.target.value)}>
                  {FURNISHING.map(f => <option key={f}>{f}</option>)}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <div style={{ backgroundColor: 'white' }}>
                <ReactQuill theme="snow" value={form.description} onChange={val => set('description', val)} placeholder="Describe the property in detail..." />
              </div>
            </div>
          </div>
        </div>

        {/* Location & Price */}
        <div>
          <div className="settings-section-title">Location & Pricing</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="form-group">
              <label className="form-label required">Location</label>
              <input className={`form-control ${errors.location ? 'error' : ''}`} value={form.location} onChange={e => set('location', e.target.value)} placeholder="e.g. Jubilee Hills, Hyderabad" />
              {errors.location && <span className="form-error">{errors.location}</span>}
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label required">Display Price</label>
                <input className={`form-control ${errors.price ? 'error' : ''}`} value={form.price} onChange={e => set('price', e.target.value)} placeholder="e.g. ₹1.5 Crore" />
                {errors.price && <span className="form-error">{errors.price}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Price Value (₹ for filtering)</label>
                <input className="form-control" type="number" value={form.priceValue} onChange={e => set('priceValue', e.target.value)} placeholder="e.g. 15000000" />
              </div>
            </div>
          </div>
        </div>

        {/* Details */}
        <div>
          <div className="settings-section-title">Property Details</div>
          <div className="form-row-3" style={{ gap: 14 }}>
            <div className="form-group">
              <label className="form-label">Area</label>
              <input className="form-control" value={form.area} onChange={e => set('area', e.target.value)} placeholder="e.g. 1500 sq ft" />
            </div>
            <div className="form-group">
              <label className="form-label">Bedrooms</label>
              <input className="form-control" type="number" min="0" value={form.bedrooms} onChange={e => set('bedrooms', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Bathrooms</label>
              <input className="form-control" type="number" min="0" value={form.bathrooms} onChange={e => set('bathrooms', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Parking</label>
              <input className="form-control" type="number" min="0" value={form.parking} onChange={e => set('parking', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-control" value={form.status} onChange={e => set('status', e.target.value)}>
                {STATUS_OPTIONS.map(s => <option key={s} value={s} style={{ textTransform: 'capitalize' }}>{s}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 24, marginTop: 14 }}>
            <label className="toggle">
              <input type="checkbox" checked={form.isFeatured} onChange={e => set('isFeatured', e.target.checked)} />
              <span className="toggle-track"><span className="toggle-thumb" /></span>
              <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Featured Property</span>
            </label>
            <label className="toggle">
              <input type="checkbox" checked={form.isNew} onChange={e => set('isNew', e.target.checked)} />
              <span className="toggle-track"><span className="toggle-thumb" /></span>
              <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>New Property</span>
            </label>
          </div>
        </div>

        {/* Amenities */}
        <div>
          <div className="settings-section-title">Amenities</div>
          <div className="form-group">
            <label className="form-label">Comma-Separated Amenities</label>
            <input className="form-control" value={form.amenities} onChange={e => set('amenities', e.target.value)} placeholder="e.g. Swimming Pool, Lift, Power Backup" />
          </div>
        </div>

        {/* Tags */}
        <div>
          <div className="settings-section-title">Search Tags</div>
          <div className="form-group">
            <label className="form-label">Tags</label>
            <TagsInput tags={form.tags} onChange={tags => set('tags', tags)} />
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Press Enter or comma to add a tag</span>
          </div>
        </div>

        {/* Media & Images */}
        <div>
          <div className="settings-section-title">Media & Images</div>
          
          <div className="form-group" style={{ marginBottom: 20 }}>
            <label className="form-label">YouTube Video URL</label>
            <input 
              className="form-control" 
              type="url"
              value={form.youtubeLink} 
              onChange={e => set('youtubeLink', e.target.value)} 
              placeholder="e.g. https://www.youtube.com/watch?v=..." 
            />
          </div>

          <ImageUpload
            images={newFiles}
            existingUrls={form.images}
            onNewFiles={setNewFiles}
            onRemoveExisting={(idx) => set('images', form.images.filter((_, i) => i !== idx))}
          />
          {uploading && (
            <div style={{ marginTop: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: '0.75rem', color: '#64748b' }}>
                <span>Uploading images...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="progress-bar">
                <div className="progress-bar__fill" style={{ width: `${uploadProgress}%` }} />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="modal-footer" style={{ borderTop: '1px solid #e2e8f0', marginTop: 24, paddingTop: 16 }}>
        <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={saving || uploading}>
          {saving ? 'Saving...' : isEdit ? 'Update Property' : 'Add Property'}
        </button>
      </div>
    </form>
  );
}

export default PropertyForm;

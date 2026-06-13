import { useState, useEffect, useMemo } from 'react';
import { propertiesService } from '../../services/firestoreService';
import { formatDate, formatCurrency, getStatusColor, debounce } from '../../utils/formatters';
import PropertyForm from './PropertyForm';
import toast from 'react-hot-toast';
import {
  FiPlus, FiSearch, FiEdit2, FiTrash2, FiEye,
  FiFilter, FiChevronLeft, FiChevronRight, FiStar,
  FiCheckSquare, FiSquare
} from 'react-icons/fi';

const PAGE_SIZE = 10;

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

function Modal({ title, onClose, size = 'modal-xl', children }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={`modal ${size}`} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

function PropertiesList() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sortField, setSortField] = useState('createdAt');
  const [sortDir, setSortDir] = useState('desc');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editProp, setEditProp] = useState(null);
  const [viewProp, setViewProp] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [bulkAction, setBulkAction] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await propertiesService.getAll();
      setProperties(data);
    } catch (err) {
      toast.error('Failed to load properties');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Filter + Search + Sort
  const filtered = useMemo(() => {
    let result = [...properties];
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(p =>
        (p.title || '').toLowerCase().includes(s) ||
        (p.location || '').toLowerCase().includes(s) ||
        (p.type || '').toLowerCase().includes(s)
      );
    }
    if (filterType) result = result.filter(p => p.type === filterType);
    if (filterStatus) result = result.filter(p => p.status === filterStatus);

    result.sort((a, b) => {
      let av = a[sortField], bv = b[sortField];
      if (sortField === 'createdAt') {
        av = av?.seconds || 0;
        bv = bv?.seconds || 0;
      } else if (sortField === 'priceValue') {
        av = Number(av) || 0;
        bv = Number(bv) || 0;
      } else {
        av = (av || '').toString().toLowerCase();
        bv = (bv || '').toString().toLowerCase();
      }
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return result;
  }, [properties, search, filterType, filterStatus, sortField, sortDir]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
    setPage(1);
  };

  const sortIcon = (field) => {
    if (sortField !== field) return ' ↕';
    return sortDir === 'asc' ? ' ↑' : ' ↓';
  };

  const toggleSelect = (id) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selected.length === paginated.length) setSelected([]);
    else setSelected(paginated.map(p => p.id));
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await propertiesService.delete(deleteId);
      toast.success('Property deleted');
      setDeleteId(null);
      fetchData();
    } catch {
      toast.error('Delete failed');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selected.length === 0) return;
    try {
      if (bulkAction === 'delete') {
        await propertiesService.bulkDelete(selected);
        toast.success(`${selected.length} properties deleted`);
      } else {
        await propertiesService.bulkUpdateStatus(selected, bulkAction);
        toast.success(`${selected.length} properties updated to "${bulkAction}"`);
      }
      setSelected([]);
      setBulkAction('');
      fetchData();
    } catch {
      toast.error('Bulk action failed');
    }
  };

  const uniqueTypes = [...new Set(properties.map(p => p.type).filter(Boolean))];

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header__left">
          <h1>Properties</h1>
          <p>{properties.length} total properties in database</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditProp(null); setShowForm(true); }}>
          <FiPlus size={16} /> Add Property
        </button>
      </div>

      {/* Table */}
      <div className="table-wrapper">
        {/* Toolbar */}
        <div className="table-toolbar">
          <div className="table-toolbar__left">
            <div className="search-bar">
              <FiSearch className="search-bar__icon" />
              <input
                placeholder="Search properties..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            <select className="filter-select" value={filterType} onChange={e => { setFilterType(e.target.value); setPage(1); }}>
              <option value="">All Types</option>
              {uniqueTypes.map(t => <option key={t}>{t}</option>)}
            </select>
            <select className="filter-select" value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}>
              <option value="">All Status</option>
              <option value="available">Available</option>
              <option value="sold">Sold</option>
              <option value="rented">Rented</option>
            </select>
          </div>
          <div className="table-toolbar__right">
            <span style={{ fontSize: '0.875rem', color: '#64748b' }}>{filtered.length} results</span>
          </div>
        </div>

        {/* Bulk Action Bar */}
        {selected.length > 0 && (
          <div className="bulk-action-bar">
            <span>{selected.length} selected</span>
            <select className="filter-select" value={bulkAction} onChange={e => setBulkAction(e.target.value)}>
              <option value="">Bulk Action...</option>
              <option value="available">Set Available</option>
              <option value="sold">Set Sold</option>
              <option value="rented">Set Rented</option>
              <option value="delete">Delete Selected</option>
            </select>
            <button className="btn btn-primary btn-sm" onClick={handleBulkAction} disabled={!bulkAction}>Apply</button>
            <button className="btn btn-ghost btn-sm" onClick={() => setSelected([])}>Clear</button>
          </div>
        )}

        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th style={{ width: 40 }}>
                  <button className="btn btn-ghost btn-icon" style={{ padding: 4 }} onClick={toggleSelectAll}>
                    {selected.length === paginated.length && paginated.length > 0 ? <FiCheckSquare size={16} color="#6366f1" /> : <FiSquare size={16} />}
                  </button>
                </th>
                <th>Image</th>
                <th className="sortable" onClick={() => handleSort('title')}>Title{sortIcon('title')}</th>
                <th className="sortable" onClick={() => handleSort('type')}>Type{sortIcon('type')}</th>
                <th className="sortable" onClick={() => handleSort('location')}>Location{sortIcon('location')}</th>
                <th className="sortable" onClick={() => handleSort('priceValue')}>Price{sortIcon('priceValue')}</th>
                <th className="sortable" onClick={() => handleSort('status')}>Status{sortIcon('status')}</th>
                <th>Featured</th>
                <th className="sortable" onClick={() => handleSort('createdAt')}>Created{sortIcon('createdAt')}</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 10 }).map((_, j) => (
                      <td key={j}><div className="skeleton skeleton-text" style={{ width: j === 0 ? 24 : '80%' }} /></td>
                    ))}
                  </tr>
                ))
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={10}>
                    <div className="table-empty">
                      <div className="table-empty-icon">🏘️</div>
                      <p>{search || filterType || filterStatus ? 'No properties match your filters' : 'No properties yet. Add your first one!'}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginated.map(prop => (
                  <tr key={prop.id} className={selected.includes(prop.id) ? 'selected' : ''}>
                    <td>
                      <button className="btn btn-ghost btn-icon" style={{ padding: 4 }} onClick={() => toggleSelect(prop.id)}>
                        {selected.includes(prop.id) ? <FiCheckSquare size={16} color="#6366f1" /> : <FiSquare size={16} />}
                      </button>
                    </td>
                    <td>
                      {(prop.images?.[0] || prop.image) ? (
                        <img src={prop.images?.[0] || prop.image} alt={prop.title} className="prop-img-thumb" />
                      ) : (
                        <div style={{ width: 52, height: 40, borderRadius: 6, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🏠</div>
                      )}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{prop.title}</div>
                      {prop.bhk && <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{prop.bhk}</div>}
                    </td>
                    <td><span className="badge badge-secondary">{prop.type}</span></td>
                    <td style={{ color: '#64748b', fontSize: '0.875rem' }}>📍 {prop.location}</td>
                    <td style={{ fontWeight: 600, color: '#6366f1' }}>
                      {typeof prop.priceValue === 'number' && prop.priceValue > 0
                        ? formatCurrency(prop.priceValue)
                        : prop.price || '—'}
                    </td>
                    <td>
                      <span className={`badge badge-${getStatusColor(prop.status)}`} style={{ textTransform: 'capitalize' }}>
                        {prop.status || 'available'}
                      </span>
                    </td>
                    <td>
                      {prop.isFeatured ? <FiStar size={16} color="#f59e0b" fill="#f59e0b" /> : <FiStar size={16} color="#cbd5e1" />}
                    </td>
                    <td style={{ color: '#64748b', fontSize: '0.8125rem' }}>{formatDate(prop.createdAt)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn btn-ghost btn-icon" title="View" onClick={() => setViewProp(prop)}>
                          <FiEye size={16} />
                        </button>
                        <button className="btn btn-ghost btn-icon" title="Edit" onClick={() => { setEditProp(prop); setShowForm(true); }}>
                          <FiEdit2 size={16} />
                        </button>
                        <button className="btn btn-ghost btn-icon" title="Delete" style={{ color: '#ef4444' }} onClick={() => setDeleteId(prop.id)}>
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

        {/* Pagination */}
        {!loading && filtered.length > PAGE_SIZE && (
          <div className="pagination">
            <span className="pagination__info">
              Showing {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
            </span>
            <div className="pagination__controls">
              <button className="page-btn" onClick={() => setPage(1)} disabled={page === 1}>«</button>
              <button className="page-btn" onClick={() => setPage(p => p - 1)} disabled={page === 1}><FiChevronLeft /></button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pg = Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
                return (
                  <button key={pg} className={`page-btn ${pg === page ? 'active' : ''}`} onClick={() => setPage(pg)}>
                    {pg}
                  </button>
                );
              })}
              <button className="page-btn" onClick={() => setPage(p => p + 1)} disabled={page === totalPages}><FiChevronRight /></button>
              <button className="page-btn" onClick={() => setPage(totalPages)} disabled={page === totalPages}>»</button>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal modal-xl" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editProp ? 'Edit Property' : 'Add New Property'}</h2>
              <button className="modal-close" onClick={() => setShowForm(false)}>✕</button>
            </div>
            <div className="modal-body">
              <PropertyForm
                property={editProp}
                onClose={() => setShowForm(false)}
                onSuccess={() => { setShowForm(false); fetchData(); }}
              />
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewProp && (
        <div className="modal-overlay" onClick={() => setViewProp(null)}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Property Details</h2>
              <button className="modal-close" onClick={() => setViewProp(null)}>✕</button>
            </div>
            <div className="modal-body">
              {viewProp.images?.length > 0 && (
                <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 20 }}>
                  {viewProp.images.map((img, i) => (
                    <img key={i} src={img} alt={`Image ${i + 1}`} style={{ height: 160, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />
                  ))}
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[
                  ['Title', viewProp.title],
                  ['Type', viewProp.type],
                  ['BHK', viewProp.bhk],
                  ['Location', viewProp.location],
                  ['Price', viewProp.price],
                  ['Area', viewProp.area],
                  ['Bedrooms', viewProp.bedrooms],
                  ['Bathrooms', viewProp.bathrooms],
                  ['Parking', viewProp.parking],
                  ['Status', viewProp.status],
                  ['Featured', viewProp.isFeatured ? 'Yes' : 'No'],
                  ['New', viewProp.isNew ? 'Yes' : 'No'],
                  ['Furnishing', viewProp.furnishing],
                  ['Created', formatDate(viewProp.createdAt)],
                ].map(([k, v]) => (
                  <div key={k} className="enquiry-detail-row">
                    <label>{k}:</label>
                    <span>{v || '—'}</span>
                  </div>
                ))}
              </div>
              {viewProp.description && (
                <div style={{ marginTop: 16 }}>
                  <div style={{ fontWeight: 600, marginBottom: 8 }}>Description</div>
                  <p style={{ color: '#64748b', lineHeight: 1.7 }}>{viewProp.description}</p>
                </div>
              )}
              {viewProp.amenities?.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <div style={{ fontWeight: 600, marginBottom: 8 }}>Amenities</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {viewProp.amenities.map(a => <span key={a} className="badge badge-primary">✓ {a}</span>)}
                  </div>
                </div>
              )}
              {viewProp.tags?.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <div style={{ fontWeight: 600, marginBottom: 8 }}>Tags</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {viewProp.tags.map(t => <span key={t} className="tag-chip">{t}</span>)}
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setViewProp(null)}>Close</button>
              <button className="btn btn-primary" onClick={() => { setViewProp(null); setEditProp(viewProp); setShowForm(true); }}>
                <FiEdit2 size={14} /> Edit Property
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <ConfirmDialog
          title="Delete Property"
          message="Are you sure? This will permanently remove the property and cannot be undone."
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
          loading={deleteLoading}
        />
      )}
    </div>
  );
}

export default PropertiesList;

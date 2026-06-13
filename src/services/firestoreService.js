// Firestore service utilities shared across all modules
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  doc,
  getDocs,
  getDoc,
  query,
  orderBy,
  where,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase/config';

// ─────────────────────────────────────────────
// Generic CRUD helpers
// ─────────────────────────────────────────────

export const getCollection = async (collectionName, constraints = []) => {
  const ref = collection(db, collectionName);
  const q = constraints.length ? query(ref, ...constraints) : query(ref, orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const getDocument = async (collectionName, id) => {
  const snap = await getDoc(doc(db, collectionName, id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

export const addDocument = async (collectionName, data) => {
  const ref = await addDoc(collection(db, collectionName), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
};

export const updateDocument = async (collectionName, id, data) => {
  await updateDoc(doc(db, collectionName, id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
};

export const deleteDocument = async (collectionName, id) => {
  await deleteDoc(doc(db, collectionName, id));
};

export const batchDelete = async (collectionName, ids) => {
  const batch = writeBatch(db);
  ids.forEach(id => batch.delete(doc(db, collectionName, id)));
  await batch.commit();
};

export const batchUpdate = async (collectionName, ids, data) => {
  const batch = writeBatch(db);
  ids.forEach(id => batch.update(doc(db, collectionName, id), { ...data, updatedAt: serverTimestamp() }));
  await batch.commit();
};

// ─────────────────────────────────────────────
// Collection-specific services
// ─────────────────────────────────────────────

// Properties
export const propertiesService = {
  getAll: () => getCollection('properties'),
  getOne: (id) => getDocument('properties', id),
  create: (data) => addDocument('properties', data),
  update: (id, data) => updateDocument('properties', id, data),
  delete: (id) => deleteDocument('properties', id),
  bulkDelete: (ids) => batchDelete('properties', ids),
  bulkUpdateStatus: (ids, status) => batchUpdate('properties', ids, { status }),
};

// Property Types / Categories
export const categoriesService = {
  getAll: () => getCollection('propertyTypes'),
  create: (data) => addDocument('propertyTypes', data),
  update: (id, data) => updateDocument('propertyTypes', id, data),
  delete: (id) => deleteDocument('propertyTypes', id),
};

// Locations
export const locationsService = {
  getAll: () => getCollection('locations'),
  create: (data) => addDocument('locations', data),
  update: (id, data) => updateDocument('locations', id, data),
  delete: (id) => deleteDocument('locations', id),
};

// Enquiries
export const enquiriesService = {
  getAll: () => getCollection('enquiries'),
  update: (id, data) => updateDocument('enquiries', id, data),
  delete: (id) => deleteDocument('enquiries', id),
};

// Testimonials
export const testimonialsService = {
  getAll: () => getCollection('testimonials'),
  create: (data) => addDocument('testimonials', data),
  update: (id, data) => updateDocument('testimonials', id, data),
  delete: (id) => deleteDocument('testimonials', id),
};

// Banners
export const bannersService = {
  getAll: () => getCollection('banners', [orderBy('priority', 'asc')]),
  create: (data) => addDocument('banners', data),
  update: (id, data) => updateDocument('banners', id, data),
  delete: (id) => deleteDocument('banners', id),
};

// Admins / Users (create is handled directly in the Users page with Firebase Auth)
export const adminsService = {
  getAll: () => getCollection('admins'),
  create: (data) => addDocument('admins', data),
  update: (id, data) => updateDocument('admins', id, data),
  delete: (id) => deleteDocument('admins', id),
};

// Settings (single document)
export const settingsService = {
  get: () => getDocument('settings', 'main'),
  save: async (data) => {
    const ref = doc(db, 'settings', 'main');
    await setDoc(ref, { ...data, updatedAt: serverTimestamp() }, { merge: true });
  },
};

// Dashboard stats
export const getDashboardStats = async () => {
  const [properties, enquiries, testimonials, admins] = await Promise.all([
    getCollection('properties'),
    getCollection('enquiries'),
    getCollection('testimonials'),
    getCollection('admins'),
  ]);

  return {
    totalProperties: properties.length,
    availableProperties: properties.filter(p => p.status === 'available').length,
    featuredProperties: properties.filter(p => p.isFeatured).length,
    totalEnquiries: enquiries.length,
    pendingEnquiries: enquiries.filter(e => e.status === 'Pending').length,
    totalTestimonials: testimonials.length,
    totalUsers: admins.length,
    recentEnquiries: enquiries.slice(0, 5),
    recentProperties: properties.slice(0, 5),
  };
};

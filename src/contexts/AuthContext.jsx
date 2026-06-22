import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  signOut,
  onAuthStateChanged,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from '../firebase/config';

const AuthContext = createContext();

// The single allowed admin email — only this account can access the panel
const ALLOWED_ADMIN_EMAIL = 'honestyrealtor@gmail.com';

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [adminData, setAdminData] = useState(null);
  const [loading, setLoading] = useState(true);      // true until onAuthStateChanged fires first time
  const [adminReady, setAdminReady] = useState(false); // true once adminData attempt is complete
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState(null);

  // ----- Email / Password Login -----
  const loginWithEmail = async (email, password) => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      // Client-side whitelist check before hitting Firebase
      if (email.trim().toLowerCase() !== ALLOWED_ADMIN_EMAIL) {
        throw new Error('Unauthorized Access: This email is not registered as an admin.');
      }

      const result = await signInWithEmailAndPassword(auth, email.trim(), password);
      const user = result.user;

      // Optimistically set currentUser so ProtectedRoute knows we're logged in
      setCurrentUser(user);

      // Fetch/create admin record in Firestore
      const adminInfo = await upsertAdminRecord(user);

      // Set both adminData and adminReady together so ProtectedRoute
      // never sees currentUser=set + adminData=null (the "unauthorized" trap)
      setAdminData(adminInfo);
      setAdminReady(true);

      return result;
    } catch (err) {
      const msg = mapFirebaseError(err);
      setAuthError(msg);
      // Reset on error so ProtectedRoute doesn't get stuck
      setCurrentUser(null);
      setAdminData(null);
      setAdminReady(true);
      throw new Error(msg);
    } finally {
      setAuthLoading(false);
    }
  };

  // ----- Upsert admin record in Firestore -----
  const upsertAdminRecord = async (user) => {
    try {
      const q = query(
        collection(db, 'admins'),
        where('email', '==', user.email),
        where('active', '==', true)
      );
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        // Auto-create admin document on first login
        const newAdminRef = doc(collection(db, 'admins'));
        const newAdminData = {
          name: 'Honesty Realtors Admin',
          email: user.email,
          role: 'Super Admin',
          active: true,
          status: 'active',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          lastLogin: serverTimestamp(),
        };
        await setDoc(newAdminRef, newAdminData);
        return { id: newAdminRef.id, ...newAdminData, lastLogin: new Date() };
      } else {
        const adminDoc = querySnapshot.docs[0];
        const adminDocRef = doc(db, 'admins', adminDoc.id);
        await updateDoc(adminDocRef, { lastLogin: serverTimestamp() });
        return { id: adminDoc.id, ...adminDoc.data(), lastLogin: new Date() };
      }
    } catch (dbErr) {
      console.error('Firestore admin upsert error:', dbErr);
      // Fallback so login still works even if Firestore is unavailable
      return {
        name: 'Honesty Realtors Admin',
        email: user.email,
        role: 'Super Admin',
        active: true,
        lastLogin: new Date(),
      };
    }
  };

  // ----- Fetch admin data on auth state change (page refresh / persisted session) -----
  const fetchAdminData = async (user) => {
    if (!user || !user.email) {
      setAdminData(null);
      return;
    }
    if (user.email.toLowerCase() !== ALLOWED_ADMIN_EMAIL) {
      // Email not whitelisted — sign them out silently
      await signOut(auth);
      setAdminData(null);
      return;
    }
    try {
      const q = query(
        collection(db, 'admins'),
        where('email', '==', user.email),
        where('active', '==', true)
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const adminDoc = querySnapshot.docs[0];
        setAdminData({ id: adminDoc.id, ...adminDoc.data() });
      } else {
        // Fallback: admin is authenticated but no Firestore doc yet
        setAdminData({
          name: 'Honesty Realtors Admin',
          email: user.email,
          active: true,
          role: 'Super Admin',
        });
      }
    } catch (err) {
      console.error('Error fetching admin data on auth change:', err);
      setAdminData({
        name: 'Honesty Realtors Admin',
        email: user.email,
        active: true,
        role: 'Super Admin',
      });
    }
  };

  // ----- Auth State Listener -----
  // Handles page refresh / persisted Firebase sessions
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setAdminReady(false); // reset while we resolve admin data

      if (user) {
        await fetchAdminData(user);
      } else {
        setAdminData(null);
      }

      setAdminReady(true); // done resolving (success or no-user)
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // ----- Logout -----
  const logout = async () => {
    await signOut(auth);
    setAdminData(null);
    setCurrentUser(null);
    setAdminReady(true);
  };

  // ----- Map Firebase error codes to user-friendly messages -----
  const mapFirebaseError = (err) => {
    const code = err?.code || '';
    if (
      code === 'auth/wrong-password' ||
      code === 'auth/invalid-credential' ||
      code === 'auth/invalid-email'
    ) {
      return 'Invalid email or password. Please try again.';
    }
    if (code === 'auth/user-not-found') {
      return 'No admin account found with this email.';
    }
    if (code === 'auth/too-many-requests') {
      return 'Too many failed attempts. Please wait a moment and try again.';
    }
    if (code === 'auth/user-disabled') {
      return 'This admin account has been disabled.';
    }
    return err.message || 'Login failed. Please try again.';
  };

  const value = {
    currentUser,
    adminData,
    loading,
    adminReady,
    authLoading,
    authError,
    setAuthError,
    loginWithEmail,
    logout,
    isAdmin: adminData?.active === true,
    role: adminData?.role || 'Admin',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

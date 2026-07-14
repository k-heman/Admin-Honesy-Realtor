import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  signOut,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';
import {
  doc,
  getDoc,
} from 'firebase/firestore';
import { auth, db } from '../firebase/config';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [adminData, setAdminData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adminReady, setAdminReady] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);

  const fetchAdminData = async (user) => {
    if (!user) {
      setAdminData(null);
      return;
    }
    
    try {
      const adminDocRef = doc(db, 'admins', user.uid);
      const adminDocSnap = await getDoc(adminDocRef);

      if (!adminDocSnap.exists()) {
        await signOut(auth);
        setAdminData(null);
        throw new Error("Admin account not found.");
      }

      const data = adminDocSnap.data();
      
      if (data.active !== true) {
        await signOut(auth);
        setAdminData(null);
        throw new Error("Your admin account has been disabled.");
      }

      setAdminData({ 
        id: user.uid, 
        uid: user.uid,
        role: data.role || '',
        fullName: data.fullName || '',
        email: data.email || user.email,
        phone: data.phone || '',
        active: data.active
      });

    } catch (err) {
      console.error('Error fetching admin data:', err);
      await signOut(auth);
      setAdminData(null);
      if (err.message === "Admin account not found." || err.message === "Your admin account has been disabled.") {
          throw err;
      }
      throw new Error("Unable to login. Please try again.");
    }
  };

  const loginWithEmail = async (email, password) => {
    setAuthLoading(true);
    try {
      // Ensure persistence is set (Session Persistence)
      await setPersistence(auth, browserLocalPersistence);

      const result = await signInWithEmailAndPassword(auth, email.trim(), password);
      await fetchAdminData(result.user);
      
      setCurrentUser(result.user);
      setAdminReady(true);
      return result;
    } catch (err) {
      setCurrentUser(null);
      setAdminData(null);
      setAdminReady(true);
      
      let msg = err.message;
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential' || err.code === 'auth/invalid-email' || err.code === 'auth/user-not-found') {
        msg = "Invalid email or password.";
      }
      throw new Error(msg);
    } finally {
      setAuthLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setAdminReady(false);
      try {
        if (user) {
          await fetchAdminData(user);
          // If fetchAdminData throws, it signs out and sets adminData null
          // thus we should only set current user if adminData successfully resolves
        } else {
          setAdminData(null);
        }
      } catch (err) {
        // fetchAdminData already signed the user out on explicit failures
      }
      
      // We check auth.currentUser directly to see if they survived authorization
      setCurrentUser(auth.currentUser); 
      setAdminReady(true);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const logout = async () => {
    await signOut(auth);
    setAdminData(null);
    setCurrentUser(null);
    setAdminReady(true);
  };

  const value = {
    currentUser,
    adminData,
    loading,
    adminReady,
    authLoading,
    loginWithEmail,
    logout,
    isAdmin: adminData?.active === true,
    role: adminData?.role || '',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

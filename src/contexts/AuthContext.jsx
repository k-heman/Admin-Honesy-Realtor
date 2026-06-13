import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  signOut,
  onAuthStateChanged,
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from '../firebase/config';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState({ uid: 'open-admin-uid', phoneNumber: '+910000000000' });
  const [adminData, setAdminData] = useState({
    name: 'Open Admin',
    mobileNumber: '+910000000000',
    role: 'Super Admin',
    active: true,
  });
  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState(null);

  // Setup reCAPTCHA for phone login
  const setupRecaptcha = (elementId) => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, elementId, {
        size: 'invisible',
        callback: () => {},
      });
    }
    return window.recaptchaVerifier;
  };

  // Login with phone number - step 1
  const loginWithPhone = async (phoneNumber, elementId) => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      const appVerifier = setupRecaptcha(elementId);
      const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
      window.confirmationResult = confirmationResult;
      return confirmationResult;
    } catch (err) {
      setAuthError(err.message);
      // Reset recaptcha on failure
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
      throw err;
    } finally {
      setAuthLoading(false);
    }
  };

  // Login with phone - step 2 (verify OTP)
  const verifyOTP = async (otp) => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      const result = await window.confirmationResult.confirm(otp);
      const user = result.user;

      if (!user.phoneNumber) {
        await signOut(auth);
        throw new Error('Access denied. A valid mobile number is required.');
      }

      const ALLOWED_NUMBERS = ['+918074411454', '+918523802251'];
      if (!ALLOWED_NUMBERS.includes(user.phoneNumber)) {
        await signOut(auth);
        throw new Error('Unauthorized Access');
      }

      // Query admins collection: Verify mobileNumber matches and active = true
      const q = query(
        collection(db, 'admins'),
        where('mobileNumber', '==', user.phoneNumber),
        where('active', '==', true)
      );
      const querySnapshot = await getDocs(q);

      let adminInfo = null;
      if (querySnapshot.empty) {
        // Auto-create in firestore so they appear in the user list!
        try {
          const newAdminRef = doc(collection(db, 'admins'));
          const newAdminData = {
            name: user.phoneNumber === '+918074411454' ? 'Admin 1' : 'Admin 2',
            mobileNumber: user.phoneNumber,
            role: 'Super Admin',
            active: true,
            status: 'active',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            lastLogin: serverTimestamp(),
          };
          await setDoc(newAdminRef, newAdminData);
          adminInfo = { id: newAdminRef.id, ...newAdminData, lastLogin: new Date() };
        } catch (dbErr) {
          console.error("Error auto-creating admin doc: ", dbErr);
          // If firestore write fails, fallback to local object so login still succeeds
          adminInfo = {
            name: user.phoneNumber === '+918074411454' ? 'Admin 1' : 'Admin 2',
            mobileNumber: user.phoneNumber,
            role: 'Super Admin',
            active: true,
            status: 'active',
            lastLogin: new Date(),
          };
        }
      } else {
        const adminDoc = querySnapshot.docs[0];
        const adminDocRef = doc(db, 'admins', adminDoc.id);

        // Update lastLogin in Firestore
        await updateDoc(adminDocRef, {
          lastLogin: serverTimestamp(),
        });

        const data = adminDoc.data();
        adminInfo = { id: adminDoc.id, ...data, lastLogin: new Date() };
      }

      setAdminData(adminInfo);
      return result;
    } catch (err) {
      let friendlyMessage = err.message;
      if (err.message.includes('auth/invalid-verification-code') || err.message.includes('invalid-credential')) {
        friendlyMessage = 'Invalid OTP. Please check the code and try again.';
      } else if (err.message === 'Unauthorized Access') {
        friendlyMessage = 'Unauthorized Access';
      }
      setAuthError(friendlyMessage);
      throw new Error(friendlyMessage);
    } finally {
      setAuthLoading(false);
    }
  };

  // Logout
  const logout = async () => {
    await signOut(auth);
    setAdminData(null);
    setCurrentUser(null);
  };

  // Fetch admin data by querying mobileNumber
  const fetchAdminData = async (user) => {
    if (!user || !user.phoneNumber) {
      setAdminData(null);
      return;
    }
    const ALLOWED_NUMBERS = ['+918074411454', '+918523802251'];
    if (!ALLOWED_NUMBERS.includes(user.phoneNumber)) {
      setAdminData(null);
      return;
    }
    try {
      const q = query(
        collection(db, 'admins'),
        where('mobileNumber', '==', user.phoneNumber),
        where('active', '==', true)
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const adminDoc = querySnapshot.docs[0];
        setAdminData({ id: adminDoc.id, ...adminDoc.data() });
      } else {
        // Fallback admin data
        setAdminData({
          name: user.phoneNumber === '+918074411454' ? 'Admin 1' : 'Admin 2',
          mobileNumber: user.phoneNumber,
          active: true,
          role: 'Super Admin'
        });
      }
    } catch (err) {
      console.error('Error fetching admin data on auth change:', err);
      // Fallback admin data
      setAdminData({
        name: user.phoneNumber === '+918074411454' ? 'Admin 1' : 'Admin 2',
        mobileNumber: user.phoneNumber,
        active: true,
        role: 'Super Admin'
      });
    }
  };

  useEffect(() => {
    // Authentication is bypassed. Admin panel is open directly.
    setLoading(false);
    /*
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await fetchAdminData(user);
      } else {
        setAdminData(null);
      }
      setLoading(false);
    });
    return unsubscribe;
    */
  }, []);

  const value = {
    currentUser,
    adminData,
    loading,
    authLoading,
    authError,
    setAuthError,
    loginWithPhone,
    verifyOTP,
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

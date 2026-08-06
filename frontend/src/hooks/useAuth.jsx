import { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged, signInWithEmailAndPassword,
  createUserWithEmailAndPassword, signOut as fbSignOut
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { api } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);       // Firebase auth user
  const [profile, setProfile] = useState(null);  // Firestore profile via backend
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      setUser(fbUser);
      if (fbUser) {
        try {
          const p = await api.getUser(fbUser.uid);
          setProfile(p);
        } catch (e) {
          setProfile(null);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const login = (email, password) => signInWithEmailAndPassword(auth, email, password);

  const signup = async (name, handle, email, password) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await api.registerUser(name, handle);
    const p = await api.getUser(cred.user.uid);
    setProfile(p);
    return cred;
  };

  const logout = () => fbSignOut(auth);

  const refreshProfile = async () => {
    if (!user) return;
    const p = await api.getUser(user.uid);
    setProfile(p);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, signup, logout, refreshProfile, setProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

import { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signOut,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { auth, googleProvider } from "../Firebase";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 👀 Auth State Listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // 📩 Email/Password Signup
  const signup = async (name, email, password) => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update profile with display name
      await updateProfile(cred.user, { displayName: name });
      
      // ✅ Refresh user state to include displayName
      setUser({ ...cred.user, displayName: name });
      
      return cred.user;
    } catch (error) {
      console.error("Signup Error:", error);
      throw error;
    }
  };

  // 🔐 Email/Password Login
  const login = async (email, password) => {
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      return cred.user;
    } catch (error) {
      console.error("Login Error:", error);
      throw error;
    }
  };

  // 🔥 Google Login/Signup
  const loginWithGoogle = async () => {
    try {
      // ✅ Ensure provider is properly initialized
      if (!googleProvider) {
        throw new Error("Google Provider not initialized");
      }
      
      const result = await signInWithPopup(auth, googleProvider);
      return result.user;
    } catch (error) {
      console.error("Google Login Error:", error);
      throw error;
    }
  };

  // 🚪 Logout
  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout Error:", error);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    signup,
    login,
    loginWithGoogle,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
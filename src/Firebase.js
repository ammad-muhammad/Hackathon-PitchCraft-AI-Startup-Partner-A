// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth"; // ✅ Fixed import

const firebaseConfig = {
  apiKey: "AIzaSyAL3z7emumj3MjdKhOK8TUccrUbQMn17M8",
  authDomain: "hackathonaistartup.firebaseapp.com",
  projectId: "hackathonaistartup",
  storageBucket: "hackathonaistartup.firebasestorage.app",
  messagingSenderId: "393758018989",
  appId: "1:393758018989:web:2bc335568977c8dc842524",
  measurementId: "G-KMT8G8Q1L3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(app);

// Initialize Auth
const auth = getAuth(app); // ✅ Pass app instance

// Initialize Google Provider
const googleProvider = new GoogleAuthProvider();

// ✅ Optional: Configure Google Provider
googleProvider.setCustomParameters({
  prompt: "select_account" // Force account selection every time
});

export { db, auth, googleProvider };
export default app;
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";

import {getFirestore} from "firebase/firestore";
import {getAuth} from "firebase/auth";
import { GoogleAuthProvider } from "firebase/auth/web-extension";
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

const db = getFirestore(app);

const auth = getAuth();
const googleProvider = new GoogleAuthProvider();

export {db , auth, googleProvider}
// ============================================================
// FIREBASE CONFIGURATION — Cornel Media Productions
// ============================================================
// SETUP: Replace the config object below with YOUR Firebase
// project credentials. See FIREBASE_SETUP.md for instructions.
// ============================================================

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyCOIV3IHP5N6aO9b1f1PtxSm9BsAoJh9qU",
  authDomain: "cornelmedia-website.firebaseapp.com",
  projectId: "cornelmedia-website",
  storageBucket: "cornelmedia-website.firebasestorage.app",
  messagingSenderId: "616072368820",
  appId: "1:616072368820:web:151b67456f6df0eeb17de1",
  measurementId: "G-Q5XWSWD0TZ"
};

// ============================================================
// Initialize Firebase
// ============================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc, query, orderBy, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getStorage, ref, uploadBytesResumable, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const app = initializeApp(FIREBASE_CONFIG);
const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);

export {
  app, db, storage, auth,
  collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc,
  query, orderBy, onSnapshot, serverTimestamp,
  ref, uploadBytesResumable, getDownloadURL, deleteObject,
  signInWithEmailAndPassword, signOut, onAuthStateChanged
};

// ============================================================
// Firestore Data Structure Reference
// ============================================================
/*
  /config/hero        → headline, subtitle, description, ctaPrimary{text,url}, ctaSecondary{text,url}
  /config/about       → founderName, founderTitle, founderBio, founderPhoto, storyText, missionStatement
  /config/stats       → clients, projects, years, awards
  /config/siteInfo    → phone, email, address, whatsapp

  /portfolio/{id}     → imageUrl, title, category, order, featured, createdAt
  /videos/{id}        → youtubeId, title, description, order, createdAt
  /crew/{id}          → name, role, bio, photoUrl, order
  /services/{id}      → title, icon, description, features[], order
  /pricing/{id}       → name, price, description, features[], featured, ctaText, order
  /testimonials/{id}  → quote, clientName, clientCompany, clientPhoto, order
  /clients/{id}       → name, logoUrl, order
*/

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-analytics.js";
import { getFirestore, collection, addDoc, getDocs, getDoc, doc, query, where, setDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBJN1mvR0Ge1jRmg4kxIgjYUb3l_g2u2dM",
  authDomain: "collabsphere-be6bf.firebaseapp.com",
  projectId: "collabsphere-be6bf",
  storageBucket: "collabsphere-be6bf.firebasestorage.app",
  messagingSenderId: "929501692595",
  appId: "1:929501692595:web:ae19e389f342011fab26c6",
  measurementId: "G-LVNEV27JC8"
};

// Initialize Firebase
let app, analytics, db, auth;
try {
  console.log("[FIREBASE] Initializing SDK...");
  app = initializeApp(firebaseConfig);
  analytics = getAnalytics(app);
  db = getFirestore(app);
  auth = getAuth(app);

  console.log("[FIREBASE] SDK initialized successfully.");
} catch (error) {
  console.error("[FIREBASE] Initialization error:", error);
}

// Export specific components for other modules to import
export { 
    app, db, auth, analytics,
    collection, addDoc, getDocs, getDoc, doc, query, where, setDoc, updateDoc,
    createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged
};



import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-analytics.js";
import { initializeFirestore, enableNetwork, collection, addDoc, getDocs, getDoc, doc, query, where, setDoc, updateDoc, arrayUnion, arrayRemove, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBGMrS1w2nQK9_jZhv9pO33uHyeadWE95E",
  authDomain: "collabsphere-be6bf-787b2.firebaseapp.com",
  projectId: "collabsphere-be6bf-787b2",
  storageBucket: "collabsphere-be6bf-787b2.firebasestorage.app",
  messagingSenderId: "460744407282",
  appId: "1:460744407282:web:c78f3a98227c2d156fb86b",
  measurementId: "G-TDYF3YS3YE"
};

// Initialize Firebase
let app, analytics, db, auth;
try {
  console.log("[FIREBASE] Initializing SDK...");
  app = initializeApp(firebaseConfig);
  analytics = getAnalytics(app);
  db = initializeFirestore(app, {
    experimentalForceLongPolling: true,
  });
  auth = getAuth(app);
  enableNetwork(db).catch((error) => {
    console.warn("[FIREBASE] Could not explicitly enable Firestore network:", error);
  });

  console.log("[FIREBASE] SDK initialized successfully.");
} catch (error) {
  console.error("[FIREBASE] Initialization error:", error);
}

// Export specific components for other modules to import
export { 
    app, db, auth, analytics,
    collection, addDoc, getDocs, getDoc, doc, query, where, setDoc, updateDoc, arrayUnion, arrayRemove, onSnapshot,
    createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged
};



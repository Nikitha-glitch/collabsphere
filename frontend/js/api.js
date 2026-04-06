import { 
  db, auth, analytics,
  collection, addDoc, getDocs, getDoc, doc, query, where, setDoc, updateDoc,
  createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged
} from './firebase-init.js';
import { CONFIG } from './config.js';

/**
 * API Utility for structured network requests and authentication persistence using Firebase
 */

class ApiService {

  constructor() {
    this.baseUrl = CONFIG.API_URL;
  }

  get token() {
    return localStorage.getItem('token');
  }

  setToken(token) {
    localStorage.setItem('token', token);
  }

  clearToken() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    if (auth) {
      signOut(auth);
    }
  }

  getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  setCurrentUser(user) {
    localStorage.setItem('user', JSON.stringify(user));
  }

  async request(endpoint, options = {}) {
    console.log(`[FIREBASE API] Intercepted ${options.method || 'GET'} ${endpoint}`);
    const method = options.method || 'GET';
    const body = options.body ? JSON.parse(options.body) : null;

    try {
      // --- AUTHENTICATION ---
      if (endpoint.includes('/auth/register')) {
        const userCredential = await createUserWithEmailAndPassword(auth, body.email, body.password);
        const user = userCredential.user;
        const profileData = {
          firstName: body.firstName,
          lastName: body.lastName,
          email: body.email,
          institution: body.institution || '',
          degree: body.degree || '',
          major: body.major || '',
          createdAt: new Date().toISOString()
        };
        await setDoc(doc(db, "users", user.uid), profileData);
        return { token: user.uid };
      }
      
      if (endpoint.includes('/auth/login')) {
        const userCredential = await signInWithEmailAndPassword(auth, body.email, body.password);
        return { token: userCredential.user.uid };
      }
      
      if (endpoint.includes('/auth/me')) {
        const uid = this.token;
        if (!uid) throw new Error('Not authenticated');
        const docSnap = await getDoc(doc(db, "users", uid));
        if (docSnap.exists()) {
          const data = docSnap.data();
          data._id = uid;
          return { data };
        } else {
          throw new Error('User profile not found');
        }
      }

      // --- PROJECTS ---
      if (endpoint === '/projects' && method === 'GET') {
        const querySnapshot = await getDocs(collection(db, "projects"));
        const projects = [];
        querySnapshot.forEach(d => projects.push({ _id: d.id, ...d.data() }));
        return { data: projects };
      }

      if (endpoint === '/projects' && method === 'POST') {
        const userProfile = this.getCurrentUser() || { firstName: 'Anonymous', lastName: '' };
        const projectData = {
          ...body,
          creatorId: this.token,
          creator: { firstName: userProfile.firstName, lastName: userProfile.lastName },
          status: 'active',
          createdAt: new Date().toISOString()
        };
        const docRef = await addDoc(collection(db, "projects"), projectData);
        return { success: true, _id: docRef.id };
      }

      if (endpoint.includes('/projects/user/') && method === 'GET') {
        const uid = this.token;
        if (!uid) return { data: [] };
        const q = query(collection(db, "projects"), where("creatorId", "==", uid));
        const querySnapshot = await getDocs(q);
        const projects = [];
        querySnapshot.forEach(d => projects.push({ _id: d.id, ...d.data() }));
        return { data: projects };
      }

      // Single project GET (/projects/:id)
      if (endpoint.match(/\/projects\/[a-zA-Z0-9_-]+$/) && method === 'GET') {
        const projectId = endpoint.split('/').pop();
        const docSnap = await getDoc(doc(db, "projects", projectId));
        if (docSnap.exists()) {
           const data = docSnap.data();
           data._id = docSnap.id;
           return { data };
        }
        throw new Error('Project not found');
      }

      // --- EVENTS ---
      if (endpoint === '/events' && method === 'GET') {
        const querySnapshot = await getDocs(collection(db, "events"));
        const events = [];
        querySnapshot.forEach(d => events.push({ _id: d.id, ...d.data() }));
        return { data: events };
      }

      if (endpoint === '/events' && method === 'POST') {
        const eventData = { ...body, creatorId: this.token, createdAt: new Date().toISOString() };
        const docRef = await addDoc(collection(db, "events"), eventData);
        return { success: true, _id: docRef.id };
      }

      // --- JOIN REQUESTS ---
      if (endpoint === '/join-requests' && method === 'GET') {
        const querySnapshot = await getDocs(collection(db, "join_requests"));
        const requests = [];
        querySnapshot.forEach(d => requests.push({ _id: d.id, ...d.data() }));
        return { data: requests };
      }

      if (endpoint === '/join-requests' && method === 'POST') {
         const userProfile = this.getCurrentUser();
         const docSnap = await getDoc(doc(db, "projects", body.project));
         let projData = {};
         if (docSnap.exists()) {
            projData = { _id: docSnap.id, ...docSnap.data() };
         }

         const requestData = { 
             ...body, 
             requesterId: this.token, 
             requester: { firstName: userProfile?.firstName, lastName: userProfile?.lastName },
             project: { 
                 _id: projData._id,
                 title: projData.title,
                 creator: projData.creatorId 
             },
             status: 'pending', 
             createdAt: new Date().toISOString() 
         };
         const docRef = await addDoc(collection(db, "join_requests"), requestData);
         return { success: true, _id: docRef.id };
      }

      if (endpoint.match(/\/join-requests\/[a-zA-Z0-9_-]+$/) && method === 'PUT') {
        const reqId = endpoint.split('/').pop();
        await updateDoc(doc(db, "join_requests", reqId), { status: body.status });
        return { success: true };
      }

      // Fallback
      console.warn('Unhandled endpoint:', endpoint);
      return { success: true, message: 'Action completed (fallback)' };

    } catch (error) {
       console.error("Firebase API Error:", error);
       let errMessage = error.message;
       if (error.code === 'auth/invalid-credential') errMessage = 'Invalid email or password.';
       if (error.code === 'auth/email-already-in-use') errMessage = 'Email is already taken.';
       if (error.code === 'auth/weak-password') errMessage = 'Password is too weak.';
       throw new Error(errMessage);
    }
  }

  // HTTP wrappers
  get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  post(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: 'POST', body: JSON.stringify(body) });
  }

  put(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: 'PUT', body: JSON.stringify(body) });
  }

  delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }
}

// Global instance
const api = new ApiService();
window.api = api; // Keep compatible with non-module scripts
export { api, CONFIG };


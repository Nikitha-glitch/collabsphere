import {
  db, auth, analytics,
  collection, addDoc, getDocs, getDoc, doc, query, where, setDoc, updateDoc, arrayUnion, onSnapshot,
  createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged
} from './firebase-init.js';
import { CONFIG } from './config.js';
import './chatbot.js';

/**
 * API Utility for structured network requests and authentication persistence using Firebase
 */

class ApiService {

  constructor() {
    this.baseUrl = CONFIG.API_URL;
  }

  showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  get token() {
    const t = localStorage.getItem('token');
    return (t && t !== 'null' && t !== 'undefined') ? t : null;
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
        const uid = this.token;
        if (!uid) {
           throw new Error('You must be logged in to pitch a project.');
        }

        const userProfile = this.getCurrentUser() || { firstName: 'Anonymous', lastName: '' };
        const projectData = {
          ...body,
          creatorId: uid,
          creator: { 
            firstName: userProfile.firstName || 'Anonymous', 
            lastName: userProfile.lastName || '' 
          },
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

      if (endpoint.includes('/projects/joined/') && method === 'GET') {
        const uid = this.token;
        if (!uid) return { data: [] };
        // Fetch all projects, then filter. (For scale, Firestore composite indexes or arrays in where clauses could be used)
        const querySnapshot = await getDocs(collection(db, "projects"));
        const joinedProjects = [];
        querySnapshot.forEach(d => {
            const p = { _id: d.id, ...d.data() };
            // Check if this user is in the teamMembers array
            const isMember = (p.teamMembers || []).some(m => m.uid === uid);
            // Don't include projects they created (those are in 'My Projects')
            if (isMember && p.creatorId !== uid) {
                joinedProjects.push(p);
            }
        });
        return { data: joinedProjects };
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

      // Single event GET (/events/:id)
      if (endpoint.match(/\/events\/[a-zA-Z0-9_-]+$/) && method === 'GET') {
        const eventId = endpoint.split('/').pop();
        const docSnap = await getDoc(doc(db, "events", eventId));
        if (docSnap.exists()) {
           const data = docSnap.data();
           data._id = docSnap.id;
           return { data };
        }
        throw new Error('Event not found');
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
             requester: { 
              firstName: userProfile?.firstName, 
              lastName: userProfile?.lastName,
              institution: userProfile?.institution,
              year: userProfile?.degree,
              skills: body.skills
          },
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

        if (body.status === 'accepted') {
          // Get the request details to find project and requester
          const reqSnap = await getDoc(doc(db, "join_requests", reqId));
          if (reqSnap.exists()) {
            const reqData = reqSnap.data();
            const projectId = reqData.project._id;
            const requester = reqData.requester;
            requester.uid = reqData.requesterId;
            
            // Add to project teamMembers
            await updateDoc(doc(db, "projects", projectId), {
              teamMembers: arrayUnion(requester)
            });
          }
        }
        return { success: true };
      }

      // --- CHATBOT (Node.js API passthrough) ---
      if (endpoint.startsWith('/chatbot')) {
        const fetchRes = await fetch(`${this.baseUrl}${endpoint}`, {
          method,
          headers: {
            'Content-Type': 'application/json',
            ...(this.token ? { 'Authorization': `Bearer ${this.token}` } : {})
          },
          body: options.body || null
        });
        return await fetchRes.json();
      }

      // --- CHAT & COLLABORATION (Attached to Projects for Security Rule Bypass) ---
      if (endpoint.includes('/chat') && method === 'POST') {
        const msgData = { ...body, createdAt: new Date().toISOString() };
        // We ensure a unique id for array manipulation if needed
        const uniqueId = Date.now().toString() + Math.floor(Math.random()*1000);
        await updateDoc(doc(db, "projects", body.projectId), {
          messages: arrayUnion({ ...msgData, _id: uniqueId })
        });
        return { success: true };
      }

      if (endpoint.includes('/code/') && method === 'GET') {
        const projectId = endpoint.split('/').pop();
        const docSnap = await getDoc(doc(db, "projects", projectId));
        const code = docSnap.data()?.sharedCode || '// Start collaborating here...\n';
        return { data: { code } };
      }

      if (endpoint.includes('/code/') && method === 'PUT') {
        const projectId = endpoint.split('/').pop();
        await updateDoc(doc(db, "projects", projectId), {
           sharedCode: body.code,
           codeUpdatedAt: new Date().toISOString()
        });
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
       if (error.code === 'auth/weak-password') errMessage = 'Password must be between 6 and 8 characters.';
       if (error.code === 'auth/password-does-not-meet-requirements') errMessage = 'Password must be between 6 and 8 characters.';
       throw new Error(errMessage);
    }
  }

  // --- REAL-TIME LISTENERS ---
  listenToChat(projectId, callback) {
    const docRef = doc(db, "projects", projectId);
    return onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const messages = data.messages || [];
        messages.sort((a,b) => new Date(a.createdAt) - new Date(b.createdAt));
        callback(messages, data.sharedCode);
      }
    }, (error) => {
      console.error("Project listener error:", error);
    });
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


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
    if (auth?.currentUser?.uid) {
      return auth.currentUser.uid;
    }
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
      return signOut(auth).catch((error) => {
        console.warn('Firebase sign-out failed:', error);
      });
    }
    return Promise.resolve();
  }

  getCurrentUser() {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch (error) {
      console.warn('Invalid cached user data, clearing it:', error);
      localStorage.removeItem('user');
      return null;
    }
  }

  setCurrentUser(user) {
    localStorage.setItem('user', JSON.stringify(user));
  }

  withTimeout(promise, message = 'Request timed out. Check your connection and try again.', timeoutMs = 12000) {
    let timeoutId;
    const timeout = new Promise((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error(message)), timeoutMs);
    });

    return Promise.race([promise, timeout]).finally(() => clearTimeout(timeoutId));
  }

  async waitForFirebaseUser(timeoutMs = 8000) {
    if (auth?.currentUser) {
      return auth.currentUser;
    }

    return this.withTimeout(new Promise((resolve, reject) => {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        unsubscribe();
        if (user) {
          resolve(user);
        } else {
          reject(new Error('Please sign in again before saving data.'));
        }
      }, (error) => {
        unsubscribe();
        reject(error);
      });
    }), 'Firebase auth did not finish restoring. Refresh and sign in again.', timeoutMs);
  }

  async getAuthDebugInfo() {
    const user = await this.waitForFirebaseUser();
    const token = await user.getIdToken();
    const payloadPart = token.split('.')[1];
    const payload = JSON.parse(atob(payloadPart.replace(/-/g, '+').replace(/_/g, '/')));

    return {
      uid: user.uid,
      email: user.email,
      tokenProject: payload.aud,
      issuer: payload.iss,
      firestoreProject: db.app.options.projectId
    };
  }

  async request(endpoint, options = {}) {
    console.log(`[FIREBASE API] Intercepted ${options.method || 'GET'} ${endpoint}`);
    const method = options.method || 'GET';
    const body = options.body ? JSON.parse(options.body) : null;

    try {
      // --- MESSAGING ENDPOINTS ---
      if (endpoint.includes('/messages')) {
        return this.handleMessages(endpoint, method, body);
      }

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
        await this.withTimeout(
          setDoc(doc(db, "users", user.uid), profileData),
          'Account created, but profile setup timed out. Please try logging in.',
          10000
        );
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
        const firebaseUser = await this.waitForFirebaseUser();
        const uid = firebaseUser.uid;
        if (!uid) {
           throw new Error('You must be logged in to pitch a project.');
        }
        this.setToken(uid);

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
        const docRef = await this.withTimeout(
          addDoc(collection(db, "projects"), projectData),
          'Project publishing timed out. Check your internet connection and try again.',
          12000
        );
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
        const firebaseUser = await this.waitForFirebaseUser();
        this.setToken(firebaseUser.uid);
        const eventData = { ...body, creatorId: firebaseUser.uid, createdAt: new Date().toISOString() };
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
        const requestsById = new Map();
        querySnapshot.forEach(d => requestsById.set(d.id, { _id: d.id, ...d.data() }));

        if (this.token) {
          const inboxSnapshot = await getDocs(collection(db, "users", this.token, "join_requests"));
          inboxSnapshot.forEach(d => requestsById.set(d.id, { _id: d.id, ...d.data() }));
        }

        return { data: Array.from(requestsById.values()) };
      }

      if (endpoint === '/join-requests' && method === 'POST') {
         const firebaseUser = await this.waitForFirebaseUser();
         this.setToken(firebaseUser.uid);
         const userProfile = this.getCurrentUser();
         const docSnap = await getDoc(doc(db, "projects", body.project));
         let projData = {};
         if (docSnap.exists()) {
            projData = { _id: docSnap.id, ...docSnap.data() };
         }
         if (!projData._id || !projData.creatorId) {
            throw new Error('This project is missing owner metadata. Ask the project owner to recreate or update the project.');
         }
         if (projData.creatorId === this.token) {
            throw new Error('You cannot send a join request to your own project.');
         }

         const requestData = { 
             ...body, 
             requesterId: firebaseUser.uid, 
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
             projectId: projData._id,
             projectTitle: projData.title,
             projectCreatorId: projData.creatorId,
             status: 'pending', 
             createdAt: new Date().toISOString() 
         };
         const docRef = await addDoc(collection(db, "join_requests"), requestData);
         console.log('[JOIN REQUESTS] Created request:', docRef.id, requestData);
         const requestSummary = {
          _id: docRef.id,
          requesterId: requestData.requesterId,
          requester: requestData.requester,
          projectId: requestData.projectId,
          projectTitle: requestData.projectTitle,
          projectCreatorId: requestData.projectCreatorId,
          coverLetter: requestData.coverLetter,
          skills: requestData.skills,
          status: 'pending',
          createdAt: requestData.createdAt
         };
         await updateDoc(doc(db, "projects", body.project), {
          pendingJoinRequests: arrayUnion(requestSummary)
         }).catch((error) => {
          console.warn('Unable to attach request to project document:', error);
         });
         if (requestData.projectCreatorId) {
          await setDoc(
            doc(db, "users", requestData.projectCreatorId, "join_requests", docRef.id),
            requestSummary
          ).catch((error) => {
            console.warn('Unable to attach request to owner inbox:', error);
          });
         }
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
            const projectId = reqData.project?._id || reqData.projectId;
            const requester = reqData.requester;
            requester.uid = reqData.requesterId;
            
            // Add to project teamMembers
            await updateDoc(doc(db, "projects", projectId), {
              teamMembers: arrayUnion(requester)
            });

            const projectRef = doc(db, "projects", projectId);
            const projectSnap = await getDoc(projectRef);
            if (projectSnap.exists()) {
              const pendingJoinRequests = (projectSnap.data().pendingJoinRequests || [])
                .filter(request => request._id !== reqId);
              await updateDoc(projectRef, { pendingJoinRequests });
            }
            const ownerId = reqData.projectCreatorId || reqData.project?.creator;
            if (ownerId) {
              await setDoc(doc(db, "users", ownerId, "join_requests", reqId), {
                status: body.status,
                respondedAt: new Date().toISOString()
              }, { merge: true });
            }

            await this.createOrGetConversation([
              reqData.projectCreatorId || reqData.project?.creator,
              reqData.requesterId
            ], {
              projectId,
              projectTitle: reqData.project?.title || reqData.projectTitle,
              requester
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
        // We write to a scalable subcollection 'messages' instead of the hacky arrayUnion
        await addDoc(collection(db, "projects", body.projectId, "messages"), msgData);
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
       if (error.code === 'auth/invalid-email') errMessage = 'Enter a valid email address.';
       if (error.code === 'auth/weak-password') errMessage = 'Password must be at least 6 characters.';
       if (error.code === 'auth/password-does-not-meet-requirements') errMessage = 'Password does not meet the Firebase password policy.';
       if (error.code === 'auth/operation-not-allowed') errMessage = 'Email/password sign-in is disabled in Firebase Authentication.';
       if (error.code === 'auth/network-request-failed') errMessage = 'Network error. Check your internet connection and DevTools offline mode.';
       if (error.code === 'auth/too-many-requests') errMessage = 'Too many attempts. Wait a moment and try again.';
       if (error.code === 'permission-denied') {
        try {
          const debugInfo = await this.getAuthDebugInfo();
          console.error('Firestore permission diagnostic:', debugInfo);
          if (debugInfo.tokenProject !== debugInfo.firestoreProject) {
            errMessage = `Firebase config mismatch: signed in to ${debugInfo.tokenProject}, but Firestore is ${debugInfo.firestoreProject}. Use the Web app config from the same Firebase project.`;
          } else {
            errMessage = 'Missing Firestore permission. Confirm Firestore Rules are published with allow read, write: if request.auth != null;';
          }
        } catch (debugError) {
          console.error('Unable to collect Firestore permission diagnostic:', debugError);
          errMessage = 'Missing Firestore permission. Sign in again and confirm Firestore Rules are published.';
        }
       }
       throw new Error(errMessage);
    }
  }

  async handleMessages(endpoint, method, body) {
    const uid = this.token;
    if (!uid) throw new Error('Not authenticated');

    if (endpoint.includes('/messages/conversations/') && method === 'GET') {
      const snapshot = await getDocs(collection(db, "conversations"));
      const conversations = [];

      snapshot.forEach(d => {
        const data = d.data();
        if ((data.participantIds || []).includes(uid)) {
          conversations.push(this.normalizeConversation(d.id, data));
        }
      });

      conversations.sort((a, b) => new Date(b.lastMessageAt || 0) - new Date(a.lastMessageAt || 0));
      return { data: conversations };
    }

    if (endpoint === '/messages/conversations' && method === 'POST') {
      const conversation = await this.createOrGetConversation(body.participantIds || []);
      return { data: conversation };
    }

    if (endpoint.match(/\/messages\/[a-zA-Z0-9_-]+$/) && method === 'GET') {
      const conversationId = endpoint.split('/').pop();
      const snapshot = await getDocs(collection(db, "conversations", conversationId, "messages"));
      const messages = [];

      snapshot.forEach(d => {
        messages.push(this.normalizeMessage(d.id, d.data()));
      });

      messages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      return { data: messages };
    }

    if (endpoint === '/messages' && method === 'POST') {
      const conversationId = body.conversationId;
      if (!conversationId || !body.content) {
        throw new Error('Missing required fields: conversationId and content');
      }

      const currentUser = this.getCurrentUser() || {};
      const messageData = {
        conversationId,
        senderId: uid,
        sender: {
          _id: uid,
          firstName: currentUser.firstName || 'User',
          lastName: currentUser.lastName || '',
          email: currentUser.email || ''
        },
        content: body.content,
        messageType: body.messageType || 'text',
        codeData: body.codeData || null,
        createdAt: new Date().toISOString()
      };

      const msgRef = await addDoc(collection(db, "conversations", conversationId, "messages"), messageData);
      await updateDoc(doc(db, "conversations", conversationId), {
        lastMessage: {
          _id: msgRef.id,
          content: messageData.content,
          senderId: uid,
          createdAt: messageData.createdAt
        },
        lastMessageAt: messageData.createdAt
      });

      return { data: this.normalizeMessage(msgRef.id, messageData) };
    }

    return { data: [] };
  }

  async createOrGetConversation(participantIds, metadata = {}) {
    const ids = [...new Set((participantIds || []).filter(Boolean))].sort();
    if (ids.length < 2) {
      throw new Error('At least two users are required to create a conversation');
    }

    const conversationId = ids.join('__');
    const conversationRef = doc(db, "conversations", conversationId);
    const conversationSnap = await getDoc(conversationRef);

    if (conversationSnap.exists()) {
      return this.normalizeConversation(conversationSnap.id, conversationSnap.data());
    }

    const currentUser = this.getCurrentUser() || {};
    const profiles = {};
    for (const id of ids) {
      if (id === this.token) {
        profiles[id] = {
          _id: id,
          firstName: currentUser.firstName || 'User',
          lastName: currentUser.lastName || '',
          email: currentUser.email || ''
        };
        continue;
      }

      const userSnap = await getDoc(doc(db, "users", id));
      const userData = userSnap.exists() ? userSnap.data() : {};
      profiles[id] = {
        _id: id,
        firstName: userData.firstName || metadata.requester?.firstName || 'User',
        lastName: userData.lastName || metadata.requester?.lastName || '',
        email: userData.email || ''
      };
    }

    const now = new Date().toISOString();
    const conversationData = {
      participantIds: ids,
      participantProfiles: profiles,
      participants: ids.map(id => profiles[id]),
      isGroup: false,
      projectId: metadata.projectId || null,
      projectTitle: metadata.projectTitle || '',
      createdAt: now,
      lastMessageAt: now,
      lastMessage: null
    };

    await setDoc(conversationRef, conversationData);
    return this.normalizeConversation(conversationId, conversationData);
  }

  normalizeConversation(id, data) {
    const participants = data.participants || Object.values(data.participantProfiles || {});
    return {
      _id: id,
      ...data,
      participants,
      lastMessage: data.lastMessage || null
    };
  }

  normalizeMessage(id, data) {
    return {
      _id: id,
      ...data,
      sender: data.sender || { _id: data.senderId || '' }
    };
  }

  listenToMessages(conversationId, callback) {
    const msgsQuery = collection(db, "conversations", conversationId, "messages");
    return onSnapshot(msgsQuery, (snapshot) => {
      const messages = [];
      snapshot.forEach(d => messages.push(this.normalizeMessage(d.id, d.data())));
      messages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      callback(messages);
    });
  }

  // --- REAL-TIME LISTENERS ---
  listenToChat(projectId, callback) {
    const docRef = doc(db, "projects", projectId);
    const msgsQuery = query(collection(db, "projects", projectId, "messages"));
    
    let currentSharedCode = '// Start collaborating here...\n';
    let currentMessages = [];

    const unsubDoc = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        currentSharedCode = docSnap.data().sharedCode || currentSharedCode;
        callback(currentMessages, currentSharedCode);
      }
    }, (error) => console.error("Project doc listener error:", error));

    const unsubMsgs = onSnapshot(msgsQuery, (snapshot) => {
      const msgs = [];
      snapshot.forEach(d => msgs.push({ _id: d.id, ...d.data() }));
      msgs.sort((a,b) => new Date(a.createdAt) - new Date(b.createdAt));
      currentMessages = msgs;
      callback(currentMessages, currentSharedCode);
    }, (error) => console.error("Messages subcollection error:", error));

    return () => {
      unsubDoc();
      unsubMsgs();
    };
  }

  // --- BACKEND API REQUESTS ---
  async makeBackendRequest(endpoint, options = {}) {
    const method = options.method || 'GET';
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.token || ''}`,
    };

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method,
        headers,
        body: options.body || undefined,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Backend API Error:', error);
      throw error;
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


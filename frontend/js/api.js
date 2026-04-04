/**
 * API Utility for structured network requests and authentication persistence
 */

class ApiService {
  constructor() {
    this.baseUrl = window.CONFIG.API_URL;
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
  }

  getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  setCurrentUser(user) {
    localStorage.setItem('user', JSON.stringify(user));
  }

  async request(endpoint, options = {}) {
    console.log(`[MOCK API] Intercepted ${options.method || 'GET'} ${endpoint}`);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 600));

    // MOCK DATA ROUTER
    if (endpoint.includes('/auth/register')) {
      return { token: 'mock-token-123' };
    }
    
    if (endpoint.includes('/auth/login')) {
      return { token: 'mock-token-123' };
    }
    
    if (endpoint.includes('/auth/me')) {
      return { data: { _id: 'u1', firstName: 'John', lastName: 'Doe', email: 'john@college.edu', institution: 'MIT', degree: '3rd Year', major: 'CS' } };
    }

    if (endpoint.includes('/projects/user/')) {
      return {
        data: [
          { _id: 'p1', title: 'AI Study Planner', description: 'Building an AI tool to schedule and map study habits for exams.', category: 'AI', teamSize: { max: 4 }, status: 'active', requiredSkills: ['Python', 'React'] }
        ]
      };
    }

    if (endpoint.includes('/join-requests') && (options.method === 'GET' || !options.method)) {
      return {
        data: [
          { _id: 'r1', status: 'pending', coverLetter: 'I am a skilled React dev and love your idea!', proposedRole: 'Frontend Lead', project: { creator: 'u1', title: 'AI Study Planner'}, requester: { firstName: 'Alice', lastName: 'Smith' }}
        ]
      };
    }

    if (endpoint === '/projects' && (options.method === 'GET' || !options.method)) {
      return {
        data: [
          { _id: 'p1', title: 'AI Study Planner', description: 'Building an AI tool to schedule and map study habits for exams.', category: 'AI', teamSize: { max: 4 }, status: 'active', requiredSkills: ['Python', 'React'] },
          { _id: 'p2', title: 'Campus Ride Share', description: 'An app for students to safely carpool to campus.', category: 'Mobile Development', teamSize: { max: 3 }, status: 'planning', requiredSkills: ['Flutter', 'Firebase'] },
          { _id: 'p3', title: 'Blockchain Voting', description: 'Decentralized voting system for student governments.', category: 'Blockchain', teamSize: { max: 5 }, status: 'planning', requiredSkills: ['Solidity', 'Web3.js'] }
        ]
      };
    }
    
    // Single project fallback mock
    if (endpoint.includes('/projects/') && !endpoint.includes('/user/')) {
       return {
         data: { _id: 'p1', title: 'AI Study Planner', description: 'Building an AI tool to schedule and map study habits for exams.', category: 'AI', teamSize: { max: 4 }, status: 'active', requiredSkills: ['Python', 'React'], creator: { firstName: 'Mock', lastName: 'User' } }
       }
    }

    if (endpoint.includes('/events') && (options.method === 'GET' || !options.method)) {
      if (endpoint === '/events') {
        const nextWeek = new Date(); nextWeek.setDate(nextWeek.getDate() + 7);
        return {
          data: [
            { _id: 'e1', title: 'Global AI Hackathon', eventType: 'hackathon', capacity: 300, startDate: nextWeek.toISOString(), endDate: nextWeek.toISOString(), description: 'Compete with colleges around the globe in this 48hr AI challenge', organizer: { firstName: 'ML', lastName: 'Society' } },
            { _id: 'e2', title: 'Web3 Startup Meetup', eventType: 'meetup', capacity: 50, startDate: new Date().toISOString(), endDate: new Date().toISOString(), description: 'Networking event for aspiring web3 developers.', organizer: { firstName: 'Decentral', lastName: 'Club' } }
          ]
        };
      }
      // Single event mock
      return {
        data: { _id: 'e1', title: 'Global AI Hackathon', eventType: 'hackathon', capacity: 300, startDate: new Date().toISOString(), endDate: new Date().toISOString(), description: 'Compete with colleges around the globe in this 48hr AI challenge', organizer: { firstName: 'ML', lastName: 'Society' } }
      }
    }

    // Default mock response for POST/PUT (like Join requests, project creation)
    return { success: true, message: 'Mock action completed' };
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
window.api = new ApiService();

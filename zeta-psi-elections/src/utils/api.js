// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

// Helper to get auth token
const getToken = () => {
  return localStorage.getItem('token');
};

// Helper to set auth token
export const setToken = (token) => {
  localStorage.setItem('token', token);
};

// Helper to remove auth token
export const removeToken = () => {
  localStorage.removeItem('token');
};

// Helper to get auth headers
const getAuthHeaders = () => {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

// Generic API request handler
const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Something went wrong');
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// ======================
// AUTH API
// ======================

export const authAPI = {
  // Register new user
  register: async (userData) => {
    return apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  // Login user
  login: async (credentials) => {
    return apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  // Get current user
  getCurrentUser: async () => {
    return apiRequest('/auth/me');
  },
};

// ======================
// POSITIONS API
// ======================

export const positionsAPI = {
  // Get all positions
  getAll: async () => {
    return apiRequest('/positions');
  },

  // Get single position
  getById: async (id) => {
    return apiRequest(`/positions/${id}`);
  },

  // Create position (admin only)
  create: async (positionData) => {
    return apiRequest('/positions', {
      method: 'POST',
      body: JSON.stringify(positionData),
    });
  },

  // Update position (admin only)
  update: async (id, positionData) => {
    return apiRequest(`/positions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(positionData),
    });
  },

  // Delete position (admin only)
  delete: async (id) => {
    return apiRequest(`/positions/${id}`, {
      method: 'DELETE',
    });
  },
};

// ======================
// APPLICATIONS API
// ======================

export const applicationsAPI = {
  // Get all applications
  getAll: async () => {
    return apiRequest('/applications');
  },

  // Get applications by position
  getByPosition: async (positionId) => {
    return apiRequest(`/applications/position/${positionId}`);
  },

  // Get my applications
  getMy: async () => {
    return apiRequest('/applications/my-applications');
  },

  // Submit application with photo
  submit: async (applicationData) => {
    const formData = new FormData();
    formData.append('positionId', applicationData.positionId);
    formData.append('statement', applicationData.statement);
    
    // Handle terms array
    if (applicationData.terms) {
      applicationData.terms.forEach(term => {
        formData.append('terms[]', term);
      });
    }
    
    // Handle photo file
    if (applicationData.photo) {
      formData.append('photo', applicationData.photo);
    }

    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/applications`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to submit application');
    }

    return data;
  },

  // Update application
  update: async (id, applicationData) => {
    const formData = new FormData();
    formData.append('statement', applicationData.statement);
    
    if (applicationData.terms) {
      applicationData.terms.forEach(term => {
        formData.append('terms[]', term);
      });
    }
    
    if (applicationData.photo) {
      formData.append('photo', applicationData.photo);
    }

    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/applications/${id}`, {
      method: 'PUT',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to update application');
    }

    return data;
  },

  // Delete application
  delete: async (id) => {
    return apiRequest(`/applications/${id}`, {
      method: 'DELETE',
    });
  },
};

// ======================
// ELECTIONS API
// ======================

export const electionsAPI = {
  // Get all elections
  getAll: async () => {
    return apiRequest('/elections');
  },

  // Get active elections
  getActive: async () => {
    return apiRequest('/elections/active');
  },

  // Get election results
  getResults: async (id) => {
    return apiRequest(`/elections/${id}/results`);
  },

  // Start election (admin only)
  start: async (positionId) => {
    return apiRequest('/elections/start', {
      method: 'POST',
      body: JSON.stringify({ positionId }),
    });
  },

  // End election (admin only)
  end: async (id) => {
    return apiRequest(`/elections/${id}/end`, {
      method: 'PUT',
    });
  },

  // Reset all elections (admin only)
  resetAll: async () => {
    return apiRequest('/elections/reset', {
      method: 'DELETE',
    });
  },
};

// ======================
// VOTING API
// ======================

export const votingAPI = {
  // Cast vote
  vote: async (electionId, applicationId) => {
    return apiRequest('/voting/vote', {
      method: 'POST',
      body: JSON.stringify({ electionId, applicationId }),
    });
  },

  // Check if user has voted
  hasVoted: async (electionId) => {
    return apiRequest(`/voting/has-voted/${electionId}`);
  },

  // Get voting history
  getHistory: async () => {
    return apiRequest('/voting/my-votes');
  },
};

export default {
  auth: authAPI,
  positions: positionsAPI,
  applications: applicationsAPI,
  elections: electionsAPI,
  voting: votingAPI,
};
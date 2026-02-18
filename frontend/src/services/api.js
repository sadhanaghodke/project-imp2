import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

// Create axios instance
const authAPI = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
authAPI.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
authAPI.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      delete authAPI.defaults.headers.common['Authorization'];
      
      // Redirect to login if not already there
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// API service functions
export const complaintAPI = {
  // Create new complaint
  create: async (formData) => {
    const response = await authAPI.post('/complaints', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Get complaints (with filters)
  getAll: async (params = {}) => {
    const response = await authAPI.get('/complaints', { params });
    return response.data;
  },

  // Get complaint by ID
  getById: async (id) => {
    const response = await authAPI.get(`/complaints/${id}`);
    return response.data;
  },

  // Update complaint status
  updateStatus: async (id, statusData) => {
    const response = await authAPI.put(`/complaints/${id}/status`, statusData);
    return response.data;
  },

  // Upload before image
  uploadBeforeImage: async (id, imageFile) => {
    const formData = new FormData();
    formData.append('image', imageFile);
    
    const response = await authAPI.post(`/complaints/${id}/before-image`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Upload after image
  uploadAfterImage: async (id, imageFile) => {
    const formData = new FormData();
    formData.append('image', imageFile);
    
    const response = await authAPI.post(`/complaints/${id}/after-image`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Submit feedback
  submitFeedback: async (id, feedbackData) => {
    const response = await authAPI.post(`/complaints/${id}/feedback`, feedbackData);
    return response.data;
  },
};

export const adminAPI = {
  // Get dashboard analytics
  getAnalytics: async () => {
    const response = await authAPI.get('/admin/analytics');
    return response.data;
  },

  // Get workers list
  getWorkers: async () => {
    const response = await authAPI.get('/admin/workers');
    return response.data;
  },

  // Assign worker to complaint
  assignWorker: async (complaintId, assignmentData) => {
    const response = await authAPI.put(`/admin/complaints/${complaintId}/assign`, assignmentData);
    return response.data;
  },

  // Approve/reject resolution
  approveResolution: async (complaintId, approvalData) => {
    const response = await authAPI.put(`/admin/complaints/${complaintId}/approve`, approvalData);
    return response.data;
  },

  // Get complaint history
  getComplaintHistory: async (complaintId) => {
    const response = await authAPI.get(`/admin/complaints/${complaintId}/history`);
    return response.data;
  },

  // Manage user points
  manageUserPoints: async (userId, pointsData) => {
    const response = await authAPI.put(`/admin/users/${userId}/points`, pointsData);
    return response.data;
  },
};

export const userAPI = {
  // Get user reward history
  getRewards: async () => {
    const response = await authAPI.get('/users/rewards');
    return response.data;
  },

  // Get user statistics
  getStats: async () => {
    const response = await authAPI.get('/users/stats');
    return response.data;
  },
};

// Utility functions
export const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  if (imagePath.startsWith('http')) return imagePath;
  return `${BACKEND_URL}${imagePath}`;
};

export const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const getStatusColor = (status) => {
  const colors = {
    PENDING: 'warning',
    ASSIGNED: 'blue',
    IN_PROGRESS: 'primary',
    RESOLVED: 'success',
    REJECTED: 'danger',
  };
  return colors[status] || 'gray';
};

export const getStatusText = (status) => {
  const texts = {
    PENDING: 'Pending',
    ASSIGNED: 'Assigned',
    IN_PROGRESS: 'In Progress',
    RESOLVED: 'Resolved',
    REJECTED: 'Rejected',
  };
  return texts[status] || status;
};

export const getRoleText = (role) => {
  const texts = {
    CITIZEN: 'Citizen',
    WORKER: 'Worker',
    ADMIN: 'Administrator',
  };
  return texts[role] || role;
};

// Export the main API instance
export { authAPI };
export default authAPI;
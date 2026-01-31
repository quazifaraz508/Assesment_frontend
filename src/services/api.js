import axios from 'axios';

// Use environment variable or fallback to localhost
const BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
const API_URL = `${BASE_URL}/api`;

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add auth token to requests
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Token ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Handle response errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export const authAPI = {
    // Multi-step registration
    register: (userData) => api.post('/auth/register/', userData),
    verifyOTP: (data) => api.post('/auth/verify-otp/', data),
    resendOTP: (email) => api.post('/auth/resend-otp/', { email }),
    completeProfile: (profileData) => api.post('/auth/complete-profile/', profileData),

    // Auth
    login: (credentials) => api.post('/auth/login/', credentials),
    logout: () => api.post('/auth/logout/'),
    getUser: () => api.get('/auth/user/'),

    // Password Reset
    forgotPassword: (email) => api.post('/auth/forgot-password/', {
        email,
        frontend_url: window.location.origin
    }),
    resetPassword: (data) => api.post('/auth/reset-password/', data),

    // Manager Assessments
    // Manager Assessments
    getAssessments: () => api.get('/manager/assessments/'),
    createAssessment: (data) => api.post('/manager/assessments/', data),
    updateAssessment: (id, data) => api.put(`/manager/assessments/${id}/`, data),
    deleteAssessment: (id) => api.delete(`/manager/assessments/${id}/`),
    getNotifications: () => api.get('/manager/notifications/'),
    getAllSubmissions: (searchQuery = '') => api.get(`/manager/admin/submissions/?q=${searchQuery}`),

    // Templates
    getTemplates: () => api.get('/manager/templates/'),
    createTemplate: (data) => api.post('/manager/templates/', data),
    updateTemplate: (id, data) => api.put(`/manager/templates/${id}/`, data),
    deleteTemplate: (id) => api.delete(`/manager/templates/${id}/`),

    // Reporting Manager
    getTeamStatus: () => api.get('/reporting/team-status/'),
    getEmployeeHistory: (employeeId) => api.get(`/reporting/employee/${employeeId}/history/`),
    getSubmissionForReview: (submissionId) => api.get(`/reporting/submission/${submissionId}/for-review/`),
    submitReview: (data) => api.post('/reporting/submit-review/', data),
    getReview: (submissionId) => api.get(`/reporting/submission/${submissionId}/review/`),
    submitAdminReview: (data) => api.post('/reporting/submit-admin-review/', data),
    issueDisciplinaryAction: (data) => api.post('/reporting/issue-disciplinary-action/', data),
    removeDisciplinaryAction: (id) => api.delete(`/reporting/disciplinary-action/${id}/delete/`),

    // Employee Assessments
    getEmployeeAssessments: () => api.get('/employee/assessments/'),
    submitAssessment: (id, answers) => api.post(`/employee/assessments/${id}/submit/`, answers),
    getAssessmentSubmission: (id) => api.get(`/employee/assessments/${id}/submission/`),

    // Profile Image
    updateProfileImage: (formData) => api.post('/auth/update-profile-image/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),

    // Reporting Manager
    getHierarchy: () => api.get('/reporting/hierarchy/'),
    getAllocateData: () => Promise.all([
        api.get('/reporting/managers/'),
        api.get('/reporting/users/')
    ]),
    allocateUser: (data) => api.post('/reporting/allocate/', data),
    deallocateManager: (managerId) => api.post('/reporting/deallocate-manager/', { manager_id: managerId }),

    // Admin Settings
    getSiteSettings: () => api.get('/auth/site-settings/'),
    updateSiteSettings: (data) => api.post('/auth/site-settings/', data),
};

export default api;

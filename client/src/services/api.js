import axios from 'axios';

const API = axios.create({ 
  baseURL: import.meta.env.VITE_API_URL || '/api' 
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

API.interceptors.response.use(
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

// Auth
export const login = (data) => API.post('/auth/login', data);
export const register = (data) => API.post('/auth/register', data);
export const getMe = () => API.get('/auth/me');
export const getMyPayslips = () => API.get('/auth/mypayslips');
export const updateProfile = (data) => API.put('/auth/profile', data);

// Attendance
export const checkIn = (data) => API.post('/attendance/checkin', data);
export const checkOut = (data) => API.post('/attendance/checkout', data);
export const getMyAttendance = (params) => API.get('/attendance/my', { params });
export const getAllAttendance = (params) => API.get('/attendance/all', { params });
export const getTodayAttendance = () => API.get('/attendance/today');
export const getAttendanceSummary = (params) => API.get('/attendance/summary', { params });
export const getEmployeeSummary = (userId, params) => API.get(`/attendance/employee-summary/${userId}`, { params });
export const manualCheckout = (id, data) => API.put(`/attendance/manual-checkout/${id}`, data);
export const adminRegularizeAttendance = (data) => API.post('/attendance/admin-regularize', data);
export const remindCheckIn = () => API.post('/attendance/remind-checkin');
export const remindCheckOut = () => API.post('/attendance/remind-checkout');

// Work Updates
export const addWork = (data) => API.post('/work', data);
export const getMyWork = (params) => API.get('/work/my', { params });
export const getAllWork = (params) => API.get('/work/all', { params });
export const updateWork = (id, data) => API.put(`/work/${id}`, data);
export const deleteWork = (id) => API.delete(`/work/${id}`);

// Leave
export const applyLeave = (data) => API.post('/leave', data);
export const getMyLeaves = () => API.get('/leave/my');
export const getAllLeaves = () => API.get('/leave/all');
export const updateLeave = (id, data) => API.put(`/leave/${id}`, data);
export const deleteLeave = (id) => API.delete(`/leave/${id}`);
export const getPendingLeavesCount = () => API.get('/leave/pending-count');
// On Duty
export const applyOnDuty = (data) => API.post('/onduty', data);
export const getMyOnDuty = () => API.get('/onduty/my');
export const getAllOnDuty = (params) => API.get('/onduty/all', { params });
export const updateOnDuty = (id, data) => API.put(`/onduty/${id}`, data);
export const deleteOnDuty = (id) => API.delete(`/onduty/${id}`);
export const getPendingOnDutyCount = () => API.get('/onduty/pending-count');

// Users (Admin)
export const getUsers = () => API.get('/users');
export const getLeads = () => API.get('/users/leads');
export const addUser = (data) => API.post('/users', data);
export const updateUser = (id, data) => API.put(`/users/${id}`, data);
export const deleteUser = (id) => API.delete(`/users/${id}`);
export const getTeam = () => API.get('/users/team');
// Payslips
export const generatePayslip = (userId, data) => API.post(`/payslips/generate/${userId}`, data);
export const getUserPayslips = (userId) => API.get(`/payslips/user-history/${userId}`);
export const removePayslip = (id) => API.delete(`/payslips/${id}`);
export const fetchMyPayslips = () => API.get('/payslips/my-payslips');

// Notifications
export const getMyNotifications = () => API.get('/notifications/my');
export const getAllNotifications = () => API.get('/notifications/all');
export const sendNotification = (data) => API.post('/notifications', data);
export const deleteNotification = (id) => API.delete(`/notifications/${id}`);
// Projects
export const getProjects = () => API.get('/projects');
export const addProject = (data) => API.post('/projects', data);
export const updateProject = (id, data) => API.put(`/projects/${id}`, data);
export const deleteProject = (id) => API.delete(`/projects/${id}`);
// Portfolios
export const getPortfolios = () => API.get('/portfolios');
export const addPortfolio = (data) => API.post('/portfolios', data);
export const updatePortfolio = (id, data) => API.put(`/portfolios/${id}`, data);
export const deletePortfolio = (id) => API.delete(`/portfolios/${id}`);

// Requests
export const getMyRequests = () => API.get('/requests/my-requests');
export const getIncomingRequests = () => API.get('/requests/incoming');
export const getPendingRequestsCount = () => API.get('/requests/pending-count');
export const addRequest = (data) => API.post('/requests', data);
export const updateRequest = (id, data) => API.put(`/requests/${id}`, data);
export const deleteRequest = (id) => API.delete(`/requests/${id}`);

// Dashboard (combined)
export const getDashboardData = () => API.get('/dashboard/admin');
export const getDashboardStats = () => API.get('/dashboard/stats');

// Internships
export const submitInternshipEnquiry = (data) => API.post('/internships/enquiry', data);
export const getInternships = () => API.get('/internships');
export const getInternship = (id) => API.get(`/internships/${id}`);
export const updateInternship = (id, data) => API.put(`/internships/${id}`, data);
export const deleteInternship = (id) => API.delete(`/internships/${id}`);
export const getInternshipStats = () => API.get('/internships/stats/summary');

// Enquiries
export const getEnquiries = () => API.get('/enquiries');
export const addEnquiry = (data) => API.post('/enquiries', data);
export const updateEnquiry = (id, data) => API.put(`/enquiries/${id}`, data);
export const deleteEnquiry = (id) => API.delete(`/enquiries/${id}`);

// Leads
export const getLeadsData = () => API.get('/leads'); // Note: 'getLeads' is already exported above for users/leads
export const addLead = (data) => API.post('/leads', data);
export const updateLead = (id, data) => API.put(`/leads/${id}`, data);
export const deleteLead = (id) => API.delete(`/leads/${id}`);

// Holidays
export const getHolidays = () => API.get('/holidays');
export const addHoliday = (data) => API.post('/holidays', data);
export const deleteHoliday = (id) => API.delete(`/holidays/${id}`);

// Leave Balances
export const getLeaveBalances = () => API.get('/leave/balances');
export const getUserLeaveBalances = (userId) => API.get(`/leave/balances/${userId}`);

// Tasks & Project Milestones
export const getMyTasks = () => API.get('/tasks/my');
export const getAllTasks = () => API.get('/tasks/all');
export const addTask = (data) => API.post('/tasks', data);
export const updateTaskStatus = (id, data) => API.put(`/tasks/${id}/status`, data);
export const addTaskComment = (id, data) => API.post(`/tasks/${id}/comments`, data);
export const deleteTask = (id) => API.delete(`/tasks/${id}`);

// Expenses & Claims
export const getMyExpenses = () => API.get('/expenses/my');
export const getAllExpenses = () => API.get('/expenses/all');
export const addExpense = (data) => API.post('/expenses', data);
export const updateExpenseStatus = (id, data) => API.put(`/expenses/${id}/status`, data);
export const deleteExpense = (id) => API.delete(`/expenses/${id}`);

// Hardware & Assets
export const getMyAssets = () => API.get('/assets/my');
export const getAllAssets = () => API.get('/assets/all');
export const addAsset = (data) => API.post('/assets', data);
export const allocateAsset = (id, data) => API.put(`/assets/${id}/allocate`, data);
export const deleteAsset = (id) => API.delete(`/assets/${id}`);

// Reports & Muster Roll
export const getMusterRollReport = (params) => API.get('/reports/muster-roll', { params });
export const getSummaryOverviewReport = (params) => API.get('/reports/summary-overview', { params });

// Internal Chat & Direct Messaging
export const getChatUsers = () => API.get('/chat/users');
export const getChatHistory = (userId) => API.get(`/chat/messages/${userId}`);
export const sendChatMessage = (data) => API.post('/chat/messages', data);
export const markChatRead = (userId) => API.put(`/chat/read/${userId}`);

export default API;

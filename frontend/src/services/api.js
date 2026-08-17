import axios from "axios";

export const BASE_URL = "http://localhost:5000";

const API = axios.create({
  baseURL: `${BASE_URL}/api`,
});

API.interceptors.request.use((req) => {
  const user = JSON.parse(localStorage.getItem("hrmsUserInfo") || 'null');
  if (user?.token) {
    req.headers.Authorization = `Bearer ${user.token}`;
  }
  return req;
});

// Auto-logout on 401 — token expired or invalid
API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      // Clear stored session and redirect to login
      localStorage.removeItem("hrmsUserInfo");
      // Only redirect if not already on login page
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

// ---- Auth ----
export const registerUser = (data) => API.post("/auth/register", data);
export const loginUser    = (data) => API.post("/auth/login", data);
export const toggleClock  = ()     => API.put("/auth/clock");
export const toggleWFH    = ()     => API.put("/auth/wfh");

// ---- Dashboard ----
export const getDashboardData = () => API.get("/dashboard");
export const getAdminDashboardData = () => API.get("/dashboard/admin");

// ---- Tasks ----
export const getMyTasks = () => API.get("/tasks/mine");
export const createTask = (data) => API.post("/tasks", data);
export const updateTaskStatus = (id, status) => API.put(`/tasks/${id}/status`, { status });

// ---- Employee Management (admin only) ----
export const getAllEmployees = (params) => API.get("/users", { params });
export const getEmployee = (id) => API.get(`/users/${id}`);
export const createEmployee = (data) => API.post("/users", data);
export const updateEmployee = (id, data) => API.put(`/users/${id}`, data);
export const deactivateEmployee = (id) => API.put(`/users/${id}/deactivate`);
export const reactivateEmployee = (id) => API.put(`/users/${id}/reactivate`);

// ---- Departments (admin only) ----
export const getAllDepartments = () => API.get("/departments");
export const createDepartment = (data) => API.post("/departments", data);
export const updateDepartment = (id, data) => API.put(`/departments/${id}`, data);
export const deleteDepartment = (id) => API.delete(`/departments/${id}`);

// ---- Attendance ----
export const getMyAttendance = (days) => API.get("/attendance/mine", { params: days ? { days } : {} });
export const getDailyAttendance = (date) => API.get("/attendance", { params: date ? { date } : {} });
export const getAttendanceTrend = (days) => API.get("/attendance/trend", { params: days ? { days } : {} });

// ---- Leave Management ----
export const applyLeave = (data) => API.post("/leaves", data);
export const getMyLeaves = () => API.get("/leaves/mine");
export const cancelLeave = (id) => API.put(`/leaves/${id}/cancel`);
export const getAllLeaves = (status) => API.get("/leaves", { params: status ? { status } : {} });
export const reviewLeave = (id, data) => API.put(`/leaves/${id}/review`, data);

// ---- Payroll ----
export const generatePayroll = (month) => API.post("/payroll/generate", { month });
export const getPayrollByMonth = (month) => API.get("/payroll", { params: month ? { month } : {} });
export const updatePayrollEntry = (id, data) => API.put(`/payroll/${id}`, data);
export const markPayrollAsPaid = (id) => API.put(`/payroll/${id}/pay`);
export const getMyPayroll = () => API.get("/payroll/mine");

// ---- Projects ----
export const getAllProjects = () => API.get("/projects");
export const createProject = (data) => API.post("/projects", data);
export const updateProject = (id, data) => API.put(`/projects/${id}`, data);
export const deleteProject = (id) => API.delete(`/projects/${id}`);

// ---- Tasks (admin-only extras) ----
export const getAllTasks = (params) => API.get("/tasks", { params });

// ---- Notifications ----
export const getMyNotifications       = () => API.get("/notifications");
export const markNotificationRead     = (id) => API.put(`/notifications/${id}/read`);
export const markAllNotificationsRead = () => API.put("/notifications/read-all");
export const deleteNotification       = (id) => API.delete(`/notifications/${id}`);
export const clearAllNotifications    = () => API.delete("/notifications/clear-all");

// ---- Announcements ----
export const getAnnouncements    = (params) => API.get("/announcements", { params });
export const getLatestAnnouncements = (limit) => API.get("/announcements/latest", { params: limit ? { limit } : {} });
export const createAnnouncement  = (data) => API.post("/announcements", data);
export const updateAnnouncement  = (id, data) => API.put(`/announcements/${id}`, data);
export const deleteAnnouncement  = (id) => API.delete(`/announcements/${id}`);

// ---- Documents ----
export const getDocuments        = (params) => API.get("/documents", { params });
export const getRecentDocuments  = (limit) => API.get("/documents/recent", { params: limit ? { limit } : {} });
export const getDocumentFolders  = () => API.get("/documents/folders");
export const getDocumentStats    = () => API.get("/documents/stats");
export const uploadDocument      = (formData) => API.post("/documents/upload", formData, {
  headers: { "Content-Type": "multipart/form-data" },
});
export const downloadDocumentUrl = (id) => `${BASE_URL}/api/documents/${id}/download`;
export const updateDocument      = (id, data) => API.put(`/documents/${id}`, data);
export const deleteDocument      = (id) => API.delete(`/documents/${id}`);

// ---- Reports ----
export const getReportsOverview    = () => API.get("/reports/overview");
export const getAttendanceReport   = (params) => API.get("/reports/attendance", { params });
export const getPayrollReport      = (params) => API.get("/reports/payroll",    { params });
export const getLeavesReport       = (params) => API.get("/reports/leaves",     { params });
export const getEmployeesReport    = () => API.get("/reports/employees");
export const getTasksReport        = (params) => API.get("/reports/tasks",      { params });

// ---- Settings ----
export const getSettings    = () => API.get("/settings");
export const updateSettings = (formData) => API.put("/settings", formData, {
  headers: { "Content-Type": "multipart/form-data" },
});

// ---- WFH Requests ----
export const submitWFHRequest  = (data)  => API.post("/wfh", data);
export const getMyWFHRequests  = ()      => API.get("/wfh/mine");
export const getWFHToday       = ()      => API.get("/wfh/today");
export const getAllWFHRequests  = (params)=> API.get("/wfh", { params });
export const cancelWFHRequest  = (id)    => API.put(`/wfh/${id}/cancel`);
export const reviewWFHRequest  = (id, data) => API.put(`/wfh/${id}/review`, data);

// ---- Birthdays ----
export const getBirthdays        = (days)    => API.get("/birthdays", { params: days ? { days } : {} });
export const sendBirthdayWish    = (userId, data) => API.post(`/birthdays/${userId}/wish`, data);
export const getWishesForUser    = (userId)  => API.get(`/birthdays/${userId}/wishes`);
export const getUnreadWishCount  = ()        => API.get("/birthdays/wishes/unread-count");

// ---- On Leave Today ----
export const getOnLeaveToday = (params) => API.get("/leaves", { params: { today: "1", ...params } });

// ---- Report Export ----
export const getMonthlyAttendanceReport = (params) => API.get("/report-export/attendance/monthly", { params });
export const getOrgMonthlyAttendance    = (params) => API.get("/report-export/attendance/org-monthly", { params });
export const getProjectReport           = (params) => API.get("/report-export/projects", { params });

// ---- Quotes ----
export const getTodayQuote = ()     => API.get("/quotes/today");
export const getAllQuotes   = ()     => API.get("/quotes");
export const createQuote   = (data) => API.post("/quotes", data);
export const updateQuote   = (id, data) => API.put(`/quotes/${id}`, data);
export const deleteQuote   = (id)   => API.delete(`/quotes/${id}`);

export default API;

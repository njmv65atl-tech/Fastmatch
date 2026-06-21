import { apiMethods } from "./apiMethods";

export const headers = {
  "Content-Type": "application/json",
  Accept: "application/json",
};

export const multipartHeaders = {
  "Content-Type": "multipart/form-data",
  Accept: "application/json",
};

export const login = (data) => apiMethods.POST("admin/login", data, headers);

export const logout = () => apiMethods.POST("admin/logout", {}, headers);

export const forgotPassword = (data) =>
  apiMethods.POST("admin/forgot-password", data, headers);

export const verifyOtp = (data) =>
  apiMethods.POST("admin/verify-otp", data, headers);

export const resetPassword = (data) =>
  apiMethods.POST("admin/reset-password", data, headers);

//Dashboard

export const dashboardStats = (data) => {
  return apiMethods.GET("admin/dashboard-stats", data, headers);
};

//analytics

export const analytics = (data) =>
  apiMethods.GET("admin/analytics", data, headers);

//userManagement

export const userManagement = (data) =>
  apiMethods.GET("admin/users", data, headers);

//activityMonitoring

export const activitySessions = (data) =>
  apiMethods.GET("admin/active-sessions", data, headers);

export const activityLogs = (data) =>
  apiMethods.GET("admin/activity-logs", data, headers);

//profile

export const getProfile = (data) =>
  apiMethods.GET("admin/get-profile", data, headers);

export const updateProfile = (data) =>
  apiMethods.POST("admin/update-profile", data, { Accept: "application/json" });


export const changePassword = (data) =>
  apiMethods.POST("admin/change-password", data, headers);

export const banUser = (userId) =>
  apiMethods.POST(`admin/ban-user/${userId}`, {}, headers);

export const unbanUser = (userId) =>
  apiMethods.POST(`admin/unban-user/${userId}`, {}, headers);

// Subscriptions
export const getSubscribers = (data) => apiMethods.GET("admin/subscribers", data, headers);
export const grantPremium = (data) => apiMethods.POST("admin/grant-premium", data, headers);
export const revokePremium = (userId) => apiMethods.POST(`admin/revoke-premium/${userId}`, {}, headers);

// Icebreakers
export const getIcebreakers = (data) => apiMethods.GET("admin/icebreakers", data, headers);
export const createIcebreaker = (data) => apiMethods.POST("admin/icebreakers", data, headers);
export const updateIcebreaker = (id, data) => apiMethods.PATCH(`admin/icebreakers/${id}`, data, headers);
export const deleteIcebreaker = (id) => apiMethods.DELETE(`admin/icebreakers/${id}`, {}, headers);

// Announcements
export const getAnnouncements = (data) => apiMethods.GET("admin/announcements", data, headers);
export const createAnnouncement = (data) => apiMethods.POST("admin/announcements", data, headers);
export const deleteAnnouncement = (id) => apiMethods.DELETE(`admin/announcements/${id}`, {}, headers);

import React, { useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AnimatePresence, motion } from "motion/react";
import { Sidebar } from "./main/layout/sidebar";
import { Header } from "./main/layout/header";
import { DashboardOverview } from "./main/screens/DashboardOverview";
import { UserManagement } from "./main/screens/UserManagement";
import { ActivityMonitoring } from "./main/screens/ActivityMonitoring";
import { Analytics } from "./main/screens/Analytics";
import { SubscriptionManagement } from "./main/screens/SubscriptionManagement";
import { ContentManagement } from "./main/screens/ContentManagement";
import { Announcements } from "./main/screens/Announcements";
import { Profile, ChangePassword, EditProfile } from "./main/screens/Profile";
import { OTPVerification } from "./main/auth/otpVerification";
import { ForgotPassword } from "./main/auth/ForgotPassword";
import { ResetPassword } from "./main/auth/ResetPassword";
import { Login } from "./main/auth/Login";
import { LogoutModal } from "./components/common/logoutModal";
import { AuthContext } from "./contexts/AuthContext";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { queryClient } from "./reactQuery/queryClient";


const ProtectedLayout = ({ onLogoutClick }) => {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-[#F4EEFE] flex">
      <Sidebar onLogout={onLogoutClick} />

      <main className="flex-1 ml-64 min-h-screen flex flex-col">
        <Header />
        <div className="flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("token"));
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("wf_user");
    setIsLoggedIn(false);
    setIsLogoutModalOpen(false);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider value={{ isLoggedIn, setIsLoggedIn }}>
        <BrowserRouter>
          <Routes>
            {/* Public Auth Routes */}
            <Route
              path="/login"
              element={!isLoggedIn ? <Login /> : <Navigate to="/dashboard" />}
            />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/verify-email" element={<OTPVerification />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Protected Routes */}
            <Route
              path="/"
              element={
                isLoggedIn ? (
                  <ProtectedLayout
                    onLogoutClick={() => setIsLogoutModalOpen(true)}
                  />
                ) : (
                  <Navigate to="/login" />
                )
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardOverview />} />
              <Route path="users" element={<UserManagement />} />
              <Route path="activity" element={<ActivityMonitoring />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="subscriptions" element={<SubscriptionManagement />} />
              <Route path="content" element={<ContentManagement />} />
              <Route path="announcements" element={<Announcements />} />
              <Route path="profile" element={<Profile />} />
              <Route path="profile/edit" element={<EditProfile />} />
              <Route path="profile/security" element={<ChangePassword />} />
            </Route>
          </Routes>

          <LogoutModal
            isOpen={isLogoutModalOpen}
            onClose={() => setIsLogoutModalOpen(false)}
            onConfirm={handleLogout}
          />
        </BrowserRouter>
        <ToastContainer />
      </AuthContext.Provider>
    </QueryClientProvider>
  );
}

export default App;

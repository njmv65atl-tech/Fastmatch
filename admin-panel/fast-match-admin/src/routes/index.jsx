import { 
  LayoutDashboard, 
  Users, 
  Activity, 
  BarChart3, 
  UserCircle,
  Crown,
  MessageSquare,
  Bell
} from 'lucide-react';

export const NAVIGATION_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'users', label: 'User Management', icon: Users },
  { id: 'subscriptions', label: 'Subscriptions', icon: Crown },
  { id: 'content', label: 'Content Management', icon: MessageSquare },
  { id: 'announcements', label: 'Announcements', icon: Bell },
  { id: 'activity', label: 'Activity Monitoring', icon: Activity },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
];

export const PROFILE_ROUTES = [
  { id: 'profile', label: 'My Profile', icon: UserCircle },
  { id: 'edit-profile', label: 'Edit Profile' },
  { id: 'change-password', label: 'Change Password' },
];

export const AUTH_ROUTES = [
  { id: 'login', label: 'Login' },
  { id: 'email-verify', label: 'Email Verification' },
  { id: 'forgot-password', label: 'Forgot Password' },
  { id: 'reset-password', label: 'Reset Password' },
];

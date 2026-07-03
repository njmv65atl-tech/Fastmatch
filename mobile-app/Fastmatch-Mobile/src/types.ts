export enum AppView {
  WELCOME = "WELCOME",
  LOGIN = "LOGIN",
  SIGNUP = "SIGNUP",
  OTP = "OTP",
  FORGOT_PASSWORD = "FORGOT_PASSWORD",
  PROFILE_SETUP = "PROFILE_SETUP",
  HOME = "HOME",
  MATCH_FILTERS = "MATCH_FILTERS",
  SEARCHING = "SEARCHING",
  MATCH_FOUND = "MATCH_FOUND",
  VIDEO_CHAT = "VIDEO_CHAT",
  CHAT_INBOX = "CHAT_INBOX",
  CHAT_DETAIL = "CHAT_DETAIL",
  SUBSCRIPTION = "SUBSCRIPTION",
  PAYMENT_SUCCESS = "PAYMENT_SUCCESS",
  SETTINGS = "SETTINGS",
  ADMIN_DASHBOARD = "ADMIN_DASHBOARD",
  PRIVACY = "PRIVACY",
  SPLASH = "SPLASH",
  RESET_PASSWORD = "RESET_PASSWORD",
  EDIT_PROFILE = "EDIT_PROFILE",
  TERMS = "TERMS",
  PROFILE = "PROFILE",
  WALLET = "WALLET",
  FRIENDS = "FRIENDS",
  DISCOVER = "DISCOVER",
  MY_GIFTS = "MY_GIFTS",
  MONETIZATION = "MONETIZATION",
}

export enum UserRole {
  FREE = "user",
  PREMIUM = "PREMIUM",
  ADMIN = "ADMIN",
}

export enum Gender {
  MALE = "MALE",
  FEMALE = "FEMALE",
  OTHER = "OTHER",
  ANY = "ANY",
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: UserRole;
  interests: string[];
  gender: Gender;
  bio?: string;
  displayName?: string;
  fullName?: string;
  profilePicture?: string;
  platform?: "android" | "ios" | "web";
  walletBalance?: number;
  trustScore?: number;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  timestamp: number;
}

export interface ChatSession {
  id: string;
  partnerName: string;
  partnerAvatar: string;
  lastMessage: string;
  unreadCount: number;
  timestamp: number;
  messages: ChatMessage[];
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: string;
  duration: string;
  features: string[];
}

// commonText.tsx with dynamic i18n integration
import i18n from "../i18n";

// Welcome View
export const WELCOME_TEXT = {
  get title() { return i18n.t("welcome.title", { defaultValue: "Connect Instantly" }); },
  get subtitle() { return i18n.t("welcome.subtitle", { defaultValue: "Experience premium video chat with people around the globe." }); },
  get createAccount() { return i18n.t("auth.signupBtn", { defaultValue: "Create Account" }); },
  get signIn() { return i18n.t("auth.loginBtn", { defaultValue: "Sign In" }); },
};

// Login View
export const LOGIN_TEXT = {
  get pageTitle() { return i18n.t("auth.loginTitle", { defaultValue: "Welcome Back" }); },
  get pageSubtitle() { return i18n.t("auth.loginSubtitle", { defaultValue: "Sign in to continue connecting." }); },
  get backLink() { return i18n.t("common.back", { defaultValue: "Back" }); },
  get emailLabel() { return i18n.t("auth.email", { defaultValue: "Email Address" }); },
  get emailPlaceholder() { return i18n.t("auth.emailPlaceholder", { defaultValue: "Enter email address" }); },
  get passwordLabel() { return i18n.t("auth.password", { defaultValue: "Password" }); },
  get passwordPlaceholder() { return i18n.t("auth.passwordPlaceholder", { defaultValue: "Enter password" }); },
  get forgotPassword() { return i18n.t("auth.forgotPassword", { defaultValue: "Forgot Password?" }); },
  get logInButton() { return i18n.t("auth.loginBtn", { defaultValue: "Log In" }); },
  get noAccount() { return i18n.t("auth.dontHaveAccount", { defaultValue: "Don't have an account? " }); },
  get signUpLink() { return i18n.t("auth.signupBtn", { defaultValue: "Sign Up" }); },
};

// Forgot Password View
export const FORGOT_PASSWORD_TEXT = {
  get pageTitle() { return i18n.t("auth.forgotPassword", { defaultValue: "Forgot Password" }); },
  get pageSubtitle() { return i18n.t("auth.forgotSubtitle", { defaultValue: "Enter your email and we will send a password reset link." }); },
  get emailLabel() { return i18n.t("auth.email", { defaultValue: "Email Address" }); },
  get emailPlaceholder() { return i18n.t("auth.emailPlaceholder", { defaultValue: "Enter email address" }); },
  get sendButton() { return i18n.t("auth.loginBtn", { defaultValue: "Send Reset OTP" }); },
  get backLink() { return "← " + i18n.t("common.back", { defaultValue: "Back" }); },
};

export const RESET_PASSWORD_TEXT = {
  get pageTitle() { return i18n.t("auth.forgotPassword", { defaultValue: "Reset Password" }); },
  get pageSubtitle() { return i18n.t("auth.loginSubtitle", { defaultValue: "Enter your new password." }); },
  get resetPasswordLabel() { return i18n.t("auth.password", { defaultValue: "New password" }); },
  get resetPasswordPlaceholder() { return i18n.t("auth.passwordPlaceholder", { defaultValue: "Enter new password" }); },
  get resetButton() { return i18n.t("common.confirm", { defaultValue: "Reset Password" }); },
  get backLink() { return "← " + i18n.t("common.back", { defaultValue: "Back" }); },
  get confirmPasswordLabel() { return i18n.t("auth.password", { defaultValue: "Confirm Password" }); },
  get confirmPasswordPlaceholder() { return i18n.t("auth.passwordPlaceholder", { defaultValue: "Enter confirm password" }); }
};

// Signup View
export const SIGNUP_TEXT = {
  get pageTitle() { return i18n.t("auth.signupTitle", { defaultValue: "Create Account" }); },
  get pageSubtitle() { return i18n.t("auth.signupSubtitle", { defaultValue: "Join the exclusive community." }); },
  get backLink() { return i18n.t("common.back", { defaultValue: "Back" }); },
  get fullNameLabel() { return "Full Name"; },
  get fullNamePlaceholder() { return "Enter full name"; },
  get emailLabel() { return i18n.t("auth.email", { defaultValue: "Email" }); },
  get emailPlaceholder() { return i18n.t("auth.emailPlaceholder", { defaultValue: "Enter email address" }); },
  get passwordLabel() { return i18n.t("auth.password", { defaultValue: "Password" }); },
  get passwordPlaceholder() { return i18n.t("auth.passwordPlaceholder", { defaultValue: "Enter password" }); },
  get continueButton() { return i18n.t("common.confirm", { defaultValue: "Continue" }); },
  get termsText() { return i18n.t("welcome.termsAgreement", { defaultValue: "By signing up, you agree to our Terms and Privacy Policy." }); },
};

// OTP View
export const OTP_TEXT = {
  get pageTitle() { return "Verification"; },
  get pageSubtitle() { return "Enter the 4-digit code sent to your device."; },
  get verifyButton() { return "Verify & Create Account"; },
};

// Profile Setup View
export const PROFILE_SETUP_TEXT = {
  get pageTitle() { return "Complete Profile"; },
  get pageSubtitle() { return "Tell us about yourself."; },
  get displayNameLabel() { return "Display Name"; },
  get age() { return "Age"; },
  get Location() { return "Location"; },
  get displayNameDefault() { return "New User"; },
  get interestsLabel() { return "Interests"; },
  interests: [
    "Music",
    "Travel",
    "Movies",
    "Gaming",
    "Fitness",
    "Art",
    "Tech",
    "Food",
  ],
  get languageLabel() { return i18n.t("settings.language", { defaultValue: "Language" }); },
  languages: [
    "English",
    "Spanish",
    "French",
    "German",
    "Portuguese",
    "Hindi",
    "Italian",
    "Chinese",
    "Arabic",
    "Russian",
  ],
  get finishSetup() { return i18n.t("common.done", { defaultValue: "Finish Setup" }); },
};

// Home View
export const HOME_TEXT = {
  get greeting() { return i18n.t("home.title", { defaultValue: "Instant Matching" }); },
  get readyQuestion() { return i18n.t("home.subtitle", { defaultValue: "Ready to meet someone new today?" }); },
  get randomVideoChat() { return i18n.t("home.title", { defaultValue: "Random Video Chat" }); },
  get connectInstantly() { return i18n.t("home.subtitle", { defaultValue: "Connect instantly with people worldwide." }); },
  get startMatching() { return i18n.t("home.startMatching", { defaultValue: "Start Matching" }); },
  get premiumBadge() { return i18n.t("subscription.vipActive", { defaultValue: "PREMIUM" }); },
  get upgradeTooltip() { return i18n.t("subscription.upgradeNow", { defaultValue: "Upgrade to Premium" }); },
  get upgradeSubtitle() { return i18n.t("subscription.subtitle", { defaultValue: "Unlock gender filters and remove ads." }); },
  get viewPlans() { return i18n.t("subscription.title", { defaultValue: "View Plans" }); },
};

// Searching View
export const SEARCHING_TEXT = {
  get searchTitle() { return i18n.t("home.searching", { defaultValue: "Finding a match..." }); },
  get searchSubtitle() { return i18n.t("home.connecting", { defaultValue: "Connecting to global servers" }); },
  get cancelSearch() { return i18n.t("home.stopMatching", { defaultValue: "Cancel Search" }); },
};

// Chat Inbox View
export const CHAT_INBOX_TEXT = {
  get pageTitle() { return i18n.t("chat.title", { defaultValue: "Messages" }); },
  defaultName: "Sarah",
  defaultTime: "2m ago",
  defaultMessage: "Hey! That was a fun chat earlier 😄",
};

// Chat Detail View
export const CHAT_DETAIL_TEXT = {
  defaultName: "Sarah",
  get messagePlaceholder() { return i18n.t("chat.typeMessage", { defaultValue: "Type a message..." }); },
};

// Settings View
export const SETTINGS_TEXT = {
  get pageTitle() { return i18n.t("settings.title", { defaultValue: "Settings" }); },
  get logOut() { return i18n.t("settings.logout", { defaultValue: "Log Out" }); },
  defaultName: "User",
  defaultEmail: "user@example.com",
};

// Subscription View
export const SUBSCRIPTION_TEXT = {
  get pageTitle() { return i18n.t("subscription.title", { defaultValue: "Go Premium" }); },
  get pageSubtitle() { return i18n.t("subscription.subtitle", { defaultValue: "Unlock the ultimate experience." }); },
  get tagline() { return i18n.t("subscription.subtitle", { defaultValue: "Random chat is free. Premium gives you more control over who you meet." }); },
  features: [
    "Unlimited Video Calls",
    "Filter matches by Gender, Age & Location",
    "Unlimited Skips & Rewinds",
    "Global Network Access",
    "Priority VIP Matching",
  ],
  get yearlyPlan() { return i18n.t("subscription.yearly", { defaultValue: "YEARLY" }); },
  yearlyPrice: "$49",
  get yearlyPeriod() { return i18n.t("subscription.perYear", { defaultValue: "/year" }); },
  get yearlyBadge() { return i18n.t("subscription.bestValue", { defaultValue: "BEST VALUE" }); },
  get monthlyPlan() { return i18n.t("subscription.monthly", { defaultValue: "MONTHLY" }); },
  monthlyPrice: "$9",
  get monthlyPeriod() { return i18n.t("subscription.perMonth", { defaultValue: "/month" }); },
  get unlockButton() { return i18n.t("subscription.subscribeBtn", { defaultValue: "Unlock Premium" }); },
};

// Match Filters View
export const MATCH_FILTERS_TEXT = {
  get pageTitle() { return i18n.t("home.matchFilters", { defaultValue: "Match Preferences" }); },
  get filterLabel() { return i18n.t("discovery.filterTitle", { defaultValue: "I want to meet" }); },
  get everyone() { return i18n.t("discovery.all", { defaultValue: "Everyone" }); },
  get male() { return i18n.t("discovery.male", { defaultValue: "Male" }); },
  get female() { return i18n.t("discovery.female", { defaultValue: "Female" }); },
  get findMatch() { return i18n.t("home.startMatching", { defaultValue: "Find Match" }); },
};

// Match Found View
export const MATCH_FOUND_TEXT = {
  get badgeText() { return i18n.t("home.matchFound", { defaultValue: "MATCH FOUND" }); },
  get matchTitle() { return i18n.t("home.matchFound", { defaultValue: "It's a Match!" }); },
  get matchSubtitle() { return i18n.t("home.subtitle", { defaultValue: "Someone wants to chat." }); },
  get onlineText() { return i18n.t("discovery.onlineOnly", { defaultValue: "Online Now" }); },
  autoSkipPrefix: "Auto-skipping in",
  autoSkipSuffix: "s",
  get declineButton() { return i18n.t("home.decline", { defaultValue: "Decline" }); },
  get acceptButton() { return i18n.t("home.accept", { defaultValue: "Accept" }); },
};

// Admin Dashboard
export const ADMIN_DASHBOARD_TEXT = {
  pageTitle: "Admin Dashboard",
  logoutButton: "LOGOUT",
  days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
};

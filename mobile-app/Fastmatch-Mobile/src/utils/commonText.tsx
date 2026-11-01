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
  get sendButton() { return i18n.t("auth.sendResetOtp", { defaultValue: "Send Reset OTP" }); },
  get backLink() { return "← " + i18n.t("common.back", { defaultValue: "Back" }); },
};

export const RESET_PASSWORD_TEXT = {
  get pageTitle() { return i18n.t("auth.resetPasswordTitle", { defaultValue: "Reset Password" }); },
  get pageSubtitle() { return i18n.t("auth.resetPasswordSub", { defaultValue: "Enter your new password below." }); },
  get resetPasswordLabel() { return i18n.t("auth.newPassword", { defaultValue: "New password" }); },
  get resetPasswordPlaceholder() { return i18n.t("auth.newPasswordPlaceholder", { defaultValue: "Enter new password" }); },
  get resetButton() { return i18n.t("auth.resetPasswordBtn", { defaultValue: "Reset Password" }); },
  get backLink() { return "← " + i18n.t("common.back", { defaultValue: "Back" }); },
  get confirmPasswordLabel() { return i18n.t("auth.confirmPassword", { defaultValue: "Confirm Password" }); },
  get confirmPasswordPlaceholder() { return i18n.t("auth.confirmPasswordPlaceholder", { defaultValue: "Enter confirm password" }); }
};

// Signup View
export const SIGNUP_TEXT = {
  get pageTitle() { return i18n.t("auth.signupTitle", { defaultValue: "Create Account" }); },
  get pageSubtitle() { return i18n.t("auth.signupSubtitle", { defaultValue: "Join the exclusive community." }); },
  get backLink() { return i18n.t("common.back", { defaultValue: "Back" }); },
  get fullNameLabel() { return i18n.t("auth.fullName", { defaultValue: "Full Name" }); },
  get fullNamePlaceholder() { return i18n.t("auth.enterFullName", { defaultValue: "Enter full name" }); },
  get emailLabel() { return i18n.t("auth.email", { defaultValue: "Email" }); },
  get emailPlaceholder() { return i18n.t("auth.emailPlaceholder", { defaultValue: "Enter email address" }); },
  get passwordLabel() { return i18n.t("auth.password", { defaultValue: "Password" }); },
  get passwordPlaceholder() { return i18n.t("auth.passwordPlaceholder", { defaultValue: "Enter password" }); },
  get continueButton() { return i18n.t("common.confirm", { defaultValue: "Continue" }); },
  get termsText() { return i18n.t("welcome.termsAgreement", { defaultValue: "By signing up, you agree to our Terms and Privacy Policy." }); },
};

// OTP View
export const OTP_TEXT = {
  get pageTitle() { return i18n.t("auth.verification", { defaultValue: "Verification" }); },
  get pageSubtitle() { return i18n.t("auth.verificationSub", { defaultValue: "Enter the 4-digit code sent to your device." }); },
  get verifyButton() { return i18n.t("auth.verifyBtn", { defaultValue: "Verify & Create Account" }); },
};

// Profile Setup View
export const PROFILE_SETUP_TEXT = {
  get pageTitle() { return i18n.t("auth.completeProfileTitle", { defaultValue: "Complete Profile" }); },
  get pageSubtitle() { return i18n.t("auth.completeProfileSub", { defaultValue: "Tell us about yourself." }); },
  get displayNameLabel() { return i18n.t("auth.displayName", { defaultValue: "Display Name" }); },
  get age() { return i18n.t("auth.age", { defaultValue: "Age" }); },
  get Location() { return i18n.t("auth.location", { defaultValue: "Location" }); },
  get displayNameDefault() { return "New User"; },
  get interestsLabel() { return i18n.t("profile.interestsLabel", { defaultValue: "Interests" }); },
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
  get finishSetup() { return i18n.t("auth.finishSetup", { defaultValue: "Finish Setup" }); },
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
  get viewPlans() { return i18n.t("home.viewPlans", { defaultValue: "View Plans" }); },
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
};

import * as React from "react";

import {
  ChatDetailView,
  ChatInboxView,
  Privacy,
  SettingsView,
  SubscriptionView,
  TermsOfService,
  WalletView,
  FriendsView,
  FavoritesView,
  SupportView,
  MembershipDetailsView,
} from "./src/views/AppViews";
import {
  Alert,
  Dimensions,
  Modal,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity, 
  View,
  Image,
  ScrollView,
  BackHandler,
  ToastAndroid,
} from "react-native";
import { AppView, Gender, User, UserRole } from "./src/types";
import {
  ForgotPasswordView,
  LoginView,
  OTPView,
  ProfileSetupView,
  SignupView,
  WelcomeView,
  ResetPasswordView,
  SplashView,
  EditProfileScreen
} from "./src/views/AuthViews";
import { Header, MobileContainer, RatingModal } from "./src/components/UIComponents";
import {
  HomeView,
  MatchFiltersView,
  MatchFoundView,
  SearchingView,
  VideoChatView,
  ProfileScreen,
  DiscoverView,
  MyGiftsView,
  MonetizationView,
  GlobalDiscoveryView,
  ConnectionRequestsView,
} from "./src/views/CoreViews";
import { IMAGE_URL } from "./src/config/env";
import { Provider, useDispatch, useSelector } from "react-redux";
import {
  completeProfileSelector,
  resetPersistStore,
  setGlobalUser,
  setCompleteProfile,
  tokenSelector,
  userSelector,
} from "./src/redux/slices/persistedSlice";
import { isIOS, popTypes, setDispatch, ShowAlertMessage } from "./src/helpers/commonFunctions";

import { BottomNav } from "./src/components/BottomNav";
import CustomFlash from "./src/components/CustomFlash";
import { DataManager } from "./src/helpers/dataManager";
import FlashMessage from "react-native-flash-message";
import Loader from "./src/components/Loader";
import Orientation from "react-native-orientation-locker";

import SocketConnection from "./src/socket/socketConnection";
import { colors } from "./src/utils/colors";
import { fontFamily } from "./src/assets/fonts/fontFamily";
import { managerApiCall } from "./src/helpers/managerApiCallFn";
import { notificationService } from "./src/helpers/notificationService";
import persistStore from "redux-persist/es/persistStore";
import { persistor } from "./src/redux/store";
import { resetGlobalStore, incomingMatchRequestSelector, clearIncomingMatchRequest } from "./src/redux/slices/globalSlice";
import { socket } from "./src/socket/socket";
import { useState } from "react";
import NetInfo from "@react-native-community/netinfo";
import { useRateMatchMutation, useUpgradePremiumMockMutation, useVerifyPurchaseMutation } from "./src/redux/services/auth";
import { setupIAP, purchaseErrorListener, purchaseUpdatedListener, finishTransaction, closeIAPConnection, subscribeToProduct, restoreActivePurchases } from "./src/utils/iap";
const { width } = Dimensions.get("window");
const App: React.FC = () => {

  const [isConnected, setIsConnected] = useState<boolean | null>(true);
  const token = useSelector(tokenSelector);
  const [upgradePremiumMock] = useUpgradePremiumMockMutation();
  const [verifyPurchaseApi] = useVerifyPurchaseMutation();
  const currentUser = useSelector(userSelector);
  const completeProfile = useSelector(completeProfileSelector);
  const incomingMatchRequest = useSelector(incomingMatchRequestSelector);
  const [user, setUser] = useState<User | null>(currentUser || null);
  const [showSplash, setShowSplash] = useState(true); 
  const wasOffline = React.useRef(false);

  React.useEffect(() => {
    setUser(currentUser);
  }, [currentUser]);
 
 
  const [currentView, setCurrentView] = useState<AppView>(() => {
    if (token) {
      const isComplete = completeProfile && (currentUser?.isProfileComplete ?? false);
      return isComplete ? AppView.HOME : AppView.PROFILE_SETUP;
    }
    return AppView.WELCOME;
  });


  const [showPremiumModal, setShowPremiumModal] = useState(false);

  // ✅ FIX: Keep activeCallParams strictly for VIDEO CALL params only.
  // Chat user state is tracked separately so they never overwrite each other.
  const [activeCallParams, setActiveCallParams] = useState<any>(null);

  // ✅ FIX (from File 2): Chat user state — required for ChatDetailView to work.
  const [selectedChatUserId, setSelectedChatUserId] = useState<string | null>(null);
  const [selectedChatUserName, setSelectedChatUserName] = useState<string | null>(null);
  const [selectedChatUserAvatar, setSelectedChatUserAvatar] = useState<string | null>(null);
  const [selectedChatUnreadCount, setSelectedChatUnreadCount] = useState<number>(0);
  const [selectedChatUser, setSelectedChatUser] = useState<any>(null);

  const [otpContext, setOtpContext] = useState<{
    type?: "signup" | "forgot";
    email?: string;
  }>({});

  const [showRatingModal, setShowRatingModal] = useState(false);
  const [finishedMatchId, setFinishedMatchId] = useState<string | null>(null);
  const [rateMatch] = useRateMatchMutation();

  const dispatch = useDispatch();
  const [showAllInterestsApp, setShowAllInterestsApp] = useState(false); React.useEffect(() => {
  const unsubscribe = NetInfo.addEventListener(state => {
    setIsConnected(state.isConnected);

    if (state.isConnected === false) {
      // User just went offline
      wasOffline.current = true; 
      ShowAlertMessage("Please check your internet connection", popTypes.error);
    } 
    else if (state.isConnected === true && wasOffline.current === true) {
      // User was offline, but is now back online
      wasOffline.current = false;
      ShowAlertMessage("Internet is connected", popTypes.info); // Using success type for green color
    }
  });

  return () => unsubscribe();
}, []); // Empty array so it sets up the listener once for the whole app session
  React.useEffect(() => {
  const timer = setTimeout(() => {
    setShowSplash(false);
  }, 2000); // 2000ms = 2 seconds

  return () => clearTimeout(timer); // Cleanup timer on unmount
}, []);

  const [viewHistory, setViewHistory] = useState<AppView[]>(() => {
    if (token) {
      return completeProfile ? [AppView.HOME] : [AppView.PROFILE_SETUP];
    }
    return [AppView.WELCOME];
  });

  const currentViewRef = React.useRef(currentView);
  currentViewRef.current = currentView;
  const viewHistoryRef = React.useRef(viewHistory);
  viewHistoryRef.current = viewHistory;

  const handleGoBack = React.useCallback(() => {
    // If in active video chat, handled by video chat component
    if (currentViewRef.current === AppView.VIDEO_CHAT) {
      return true;
    }

    // Dismiss rating modal if open
    if (showRatingModal) {
      setShowRatingModal(false);
      return true;
    }

    const current = currentViewRef.current;
    const history = viewHistoryRef.current;

    // Exit confirmation prompt on root HOME or WELCOME screens
    if (current === AppView.HOME || current === AppView.WELCOME || current === AppView.ADMIN_DASHBOARD) {
      Alert.alert(
        "Exit FastMatch",
        "Are you sure you want to exit the app?",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Exit", style: "destructive", onPress: () => BackHandler.exitApp() }
        ]
      );
      return true;
    }

    // If on auth sub-views, go back to WELCOME instead of closing the app
    if (
      current === AppView.LOGIN ||
      current === AppView.SIGNUP ||
      current === AppView.FORGOT_PASSWORD ||
      current === AppView.RESET_PASSWORD ||
      current === AppView.OTP
    ) {
      setCurrentView(AppView.WELCOME);
      setViewHistory([AppView.WELCOME]);
      return true;
    }

    // If profile is incomplete, keep on PROFILE_SETUP
    if (token && (!completeProfile || !user?.isProfileComplete) && current === AppView.PROFILE_SETUP) {
      Alert.alert(
        "Exit FastMatch",
        "Are you sure you want to exit the app?",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Exit", style: "destructive", onPress: () => BackHandler.exitApp() }
        ]
      );
      return true;
    }

    // Pop from history if more than 1 view
    if (history.length > 1) {
      const nextHistory = [...history];
      nextHistory.pop(); // remove current view

      if (token) {
        // Filter out any auth views that shouldn't be reached when logged in
        let prevView = nextHistory[nextHistory.length - 1];
        while (
          nextHistory.length > 0 &&
          (prevView === AppView.WELCOME ||
            prevView === AppView.LOGIN ||
            prevView === AppView.SIGNUP ||
            prevView === AppView.OTP ||
            prevView === AppView.FORGOT_PASSWORD ||
            prevView === AppView.RESET_PASSWORD)
        ) {
          nextHistory.pop();
          prevView = nextHistory[nextHistory.length - 1];
        }

        if (prevView && nextHistory.length > 0) {
          setViewHistory(nextHistory);
          setCurrentView(prevView);
          return true;
        }
      } else {
        const prevView = nextHistory[nextHistory.length - 1];
        if (prevView) {
          setViewHistory(nextHistory);
          setCurrentView(prevView);
          return true;
        }
      }
    }

    // Fallback: If on any inner screen and history is exhausted, navigate safely to HOME or WELCOME
    if (token) {
      setCurrentView(AppView.HOME);
      setViewHistory([AppView.HOME]);
    } else {
      setCurrentView(AppView.WELCOME);
      setViewHistory([AppView.WELCOME]);
    }
    return true;
  }, [token, completeProfile, user, showRatingModal]);

  const handleGoBackRef = React.useRef(handleGoBack);
  handleGoBackRef.current = handleGoBack;

  React.useEffect(() => {
    const onBackPress = () => {
      if (handleGoBackRef.current) {
        return handleGoBackRef.current();
      }
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      onBackPress
    );

    return () => backHandler.remove();
  }, []);

  React.useEffect(() => {
    setDispatch(dispatch);
    notificationService.requestUserPermission();
    notificationService.createNotificationListeners();
  }, []);

  const processingPurchasesRef = React.useRef<Set<string>>(new Set());
  const completedPurchasesRef = React.useRef<Set<string>>(new Set());

  React.useEffect(() => {
    let purchaseUpdateSub: any = null;
    let purchaseErrorSub: any = null;

    try {
      setupIAP().catch((e) => console.warn('setupIAP error:', e));

      purchaseUpdateSub = purchaseUpdatedListener(async (purchase: any) => {
        console.log('purchaseUpdatedListener', purchase);
        const receipt = purchase.transactionReceipt || purchase.purchaseToken;
        const token = purchase.purchaseToken || purchase.transactionId || receipt;
        const productId = purchase.productId || (purchase.productIds && purchase.productIds[0]);
        const isSub = productId?.includes('premium');

        if (!token || !productId) return;

        // Prevent processing the exact same token concurrently or repeatedly in this session
        if (processingPurchasesRef.current.has(token) || completedPurchasesRef.current.has(token)) {
          console.log('[IAP] Purchase already processed or in-flight in session, skipping:', token);
          return;
        }

        processingPurchasesRef.current.add(token);

        try {
          const verifyPayload = {
            productId: productId,
            purchaseToken: token,
            receipt: receipt,
            platform: Platform.OS,
          };
          const res: any = await verifyPurchaseApi(verifyPayload).unwrap();
          if (res?.data) {
            setUser(res.data);
            dispatch(setGlobalUser(res.data));
          }
          await finishTransaction({ purchase, isConsumable: !isSub });
          completedPurchasesRef.current.add(token);

          // Only display success banner if it's not a duplicate/re-verification
          const msg = res?.message || "";
          if (msg && !msg.toLowerCase().includes("already")) {
            ShowAlertMessage(msg, popTypes.success);
          }
        } catch (ackErr: any) {
          console.warn('IAP verification error:', ackErr);
          if (!isSub) {
            try {
              await finishTransaction({ purchase, isConsumable: true });
            } catch (fe) {
              console.warn('Failed to finish consumable transaction:', fe);
            }
          }
          const errMsg = ackErr?.data?.message || "";
          if (errMsg && !errMsg.toLowerCase().includes("already")) {
            ShowAlertMessage(errMsg, popTypes.error);
          }
        } finally {
          processingPurchasesRef.current.delete(token);
        }
      });

      purchaseErrorSub = purchaseErrorListener(async (error: any) => {
        console.warn('purchaseErrorListener', error);
        if (error && error.responseCode !== 2) { // 2 is user cancelled
          const errCode = error?.responseCode;
          const errMsg = (error?.message || error?.debugMessage || '').toLowerCase();
          if (errCode === 7 || errMsg.includes('already') || errMsg.includes('owned')) {
            console.log('[IAP] Item already owned in Google Play. Attempting auto-restore...');
            try {
              const purchases = await restoreActivePurchases();
              let restored = false;
              for (const p of purchases) {
                const prodId = p.productId || (p as any).productIds?.[0];
                const receipt = p.transactionReceipt || p.purchaseToken;
                if (prodId?.includes('premium') && receipt) {
                  const verifyPayload = {
                    productId: prodId,
                    purchaseToken: p.purchaseToken || p.transactionId || receipt,
                    receipt: receipt,
                    platform: Platform.OS,
                  };
                  const res: any = await verifyPurchaseApi(verifyPayload).unwrap();
                  if (res?.data) {
                    setUser(res.data);
                    dispatch(setGlobalUser(res.data));
                    restored = true;
                    completedPurchasesRef.current.add(verifyPayload.purchaseToken);
                  }
                }
              }
              if (restored) {
                ShowAlertMessage("Google Play VIP subscription restored successfully!", popTypes.success);
                setCurrentView(AppView.MEMBERSHIP_DETAILS);
                return;
              }
            } catch (autoErr) {
              console.warn('[IAP] Auto-restore on already_owned error:', autoErr);
            }
            ShowAlertMessage("Google Play: You already have an active FastMatch subscription. Manage it in Google Play.", popTypes.info);
            return;
          }
          ShowAlertMessage(error?.message || "Purchase failed", popTypes.error);
        }
      });
    } catch (iapInitErr) {
      console.warn("IAP listener registration error:", iapInitErr);
    }

    return () => {
      try {
        if (purchaseUpdateSub && typeof purchaseUpdateSub.remove === 'function') {
          purchaseUpdateSub.remove();
        }
        if (purchaseErrorSub && typeof purchaseErrorSub.remove === 'function') {
          purchaseErrorSub.remove();
        }
        closeIAPConnection().catch((e) => console.warn('closeIAP error:', e));
      } catch (cleanupErr) {
        console.warn('IAP cleanup error:', cleanupErr);
      }
    };
  }, []);




  React.useEffect(() => {
    console.log(token, currentUser, "token and CurrentUser");
    if (token) {
      const isComplete = completeProfile && (currentUser?.isProfileComplete ?? user?.isProfileComplete ?? false);
      if (isComplete) {
        setCurrentView(AppView.HOME);
        setViewHistory([AppView.HOME]);
      } else {
        setCurrentView(AppView.PROFILE_SETUP);
        setViewHistory([AppView.PROFILE_SETUP]);
      }
    } else {
      setCurrentView(AppView.WELCOME);
      setViewHistory([AppView.WELCOME]);
    }
  }, [token, completeProfile, currentUser?.isProfileComplete, user?.isProfileComplete]);

  React.useEffect(() => {
    if (
      currentView !== AppView.OTP &&
      currentView !== AppView.FORGOT_PASSWORD &&
      (otpContext.type || otpContext.email)
    ) {
      setOtpContext({});
    }
  }, [currentView, otpContext.type, otpContext.email]);

  // React.useEffect(() => {
  //   Orientation.lockToPortrait();
  // }, []);

  const handleSetView = React.useCallback((view: AppView, params?: any) => {
    if (currentView === AppView.VIDEO_CHAT && view === AppView.HOME) {
      if (activeCallParams?.matchId) {
        setFinishedMatchId(activeCallParams.matchId);
      }
      setShowRatingModal(true);
    }
    
    if (view === AppView.CHAT_DETAIL && params?.userId) {
      setSelectedChatUserId(params.userId);
      setSelectedChatUserName(params.userName || "Unknown User");
      setSelectedChatUserAvatar(params.userAvatar || null);
      setSelectedChatUnreadCount(params.unreadCount || 0);
      setSelectedChatUser(params.item || null);
    } else if (params) {
      setActiveCallParams(params);
    } else {
      setActiveCallParams(null);
    }

    // Enforce profile completion gatekeeping: If logged in but profile incomplete, block navigation
    const isProfileActuallyComplete = completeProfile && (user?.isProfileComplete ?? currentUser?.isProfileComplete ?? false);
    if (token && !isProfileActuallyComplete && view !== AppView.PROFILE_SETUP && view !== AppView.WELCOME && view !== AppView.PRIVACY && view !== AppView.TERMS && view !== AppView.RESET_PASSWORD && view !== AppView.FORGOT_PASSWORD && view !== AppView.OTP && view !== AppView.LOGIN && view !== AppView.SIGNUP) {
      setCurrentView(AppView.PROFILE_SETUP);
      return;
    }

    setViewHistory((prev) => {
      // If navigating to root views, reset stack
      if (view === AppView.HOME) {
        return [AppView.HOME];
      }
      if (view === AppView.WELCOME) {
        return [AppView.WELCOME];
      }
      if (prev[prev.length - 1] === view) {
        return prev;
      }
      return [...prev, view];
    });

    setCurrentView(view);
  }, [currentView, activeCallParams, token, completeProfile, user]);

  const handleLogin = (u: User) => {
    setUser(u);
    if (u.role === UserRole.ADMIN) {
      setCurrentView(AppView.ADMIN_DASHBOARD);
    } else if (u.isProfileComplete) {
      dispatch(setCompleteProfile(true));
      setCurrentView(AppView.HOME);
    } else {
      dispatch(setCompleteProfile(false));
      setCurrentView(AppView.PROFILE_SETUP);
    }
  };

  const handleUpgrade = async (plan: "YEARLY" | "MONTHLY") => {
    try {
      const sku = plan === "YEARLY" ? "com.fastmatch.premium.yearly" : "com.fastmatch.premium.monthly";
      await subscribeToProduct(sku);
    } catch (e: any) {
      console.warn("handleUpgrade error:", e);
      ShowAlertMessage(e?.message || "Subscription could not be initiated.", popTypes.error);
    }
  };

  const renderView = () => {
    switch (currentView) {

      case AppView.WELCOME:
        return <WelcomeView setView={handleSetView} setUser={setUser} />;

      case AppView.LOGIN:
        return (
          <LoginView
            setView={handleSetView}
            login={handleLogin}
            setUser={setUser}
          />
        );

      case AppView.SIGNUP:
        return (
          <SignupView
            setView={handleSetView}
            login={handleLogin}
            setUser={setUser}
          />
        );

      case AppView.OTP:
        return (
          <OTPView
            setView={handleSetView}
            login={handleLogin}
            user={user}
            type={otpContext.type}
            email={otpContext.email}
          />
        );

        

      case AppView.PROFILE_SETUP:
        return (
          <ProfileSetupView
            setView={handleSetView}
            login={handleLogin}
            user={user}
            setUser={setUser}
          />
        );

      case AppView.FORGOT_PASSWORD:
        return (
          <ForgotPasswordView
            setView={handleSetView}
            onOtpRequested={(email) => {
              setOtpContext({ type: "forgot", email });
              handleSetView(AppView.OTP);
            }}
          />
        );

      case AppView.RESET_PASSWORD:
        return (
          <ResetPasswordView
            setView={handleSetView}
            
          />
        );

      case AppView.HOME:
        return (
          <HomeView user={user} setView={handleSetView} setUser={setUser} />
        );

      case AppView.MATCH_FILTERS:
        return user ? (
          <MatchFiltersView
            user={user}
            setView={handleSetView}
            setUser={setUser}
          />
        ) : null;

      case AppView.SEARCHING:
        return (
          <SearchingView
            user={user!}
            setView={handleSetView}
            setUser={setUser}
          />
        );

      case AppView.MATCH_FOUND:
        return (
          <MatchFoundView
            user={user!}
            setView={handleSetView}
            setUser={setUser}
            {...(activeCallParams || {})}
          />
        );

      case AppView.VIDEO_CHAT:
        console.log('video call is firing now')
        // ✅ activeCallParams is now clean — only ever set by video call flows.
        return (
          
          <VideoChatView
            user={user!}
            setView={handleSetView}
            setUser={setUser}
            {...(activeCallParams || {})}
          />
        );

      // ✅ FIX (from File 2): Pass onSelectUser so tapping a chat thread
      // correctly stores the recipient and navigates to CHAT_DETAIL.
      // File 1 was missing this entirely, so chat detail always opened blank.
      case AppView.CHAT_INBOX:
        return (
          <ChatInboxView
            setView={handleSetView}
            onSelectUser={(id, name, avatarUrl, unreadCount, item) =>
              handleSetView(AppView.CHAT_DETAIL, {
                userId: id,
                userName: name,
                userAvatar: avatarUrl,
                unreadCount: unreadCount,
                item: item,
              })
            }
          />
        );

      // ✅ FIX (from File 2): Pass all required props so ChatDetailView
      // knows who the conversation is with and who the current user is.
      // File 1 rendered <ChatDetailView setView={...} /> with no user context.
      case AppView.CHAT_DETAIL:
        return (
          <ChatDetailView
            userId={selectedChatUserId!}
            chatUserName={selectedChatUserName || undefined}
            chatUserAvatar={selectedChatUserAvatar || undefined}
            currentUserId={currentUser?._id}
            unreadCount={selectedChatUnreadCount}
            chatUser={selectedChatUser}
            onBack={handleGoBack}
          />
        );

      case AppView.PRIVACY:
        return (
          <Privacy
            goBack={handleGoBack}
            onAgree={handleGoBack}
          />
        );
        
      case AppView.TERMS:
        return (
          <TermsOfService
            goBack={handleGoBack}
            onAgree={handleGoBack}
          />
        );

      case AppView.SUBSCRIPTION:
        return (
          <SubscriptionView
            setView={handleSetView}
            onUpgrade={handleUpgrade}
            onBack={handleGoBack}
          />
        );

      case AppView.SETTINGS: 
        return (
          <SettingsView
            user={user}
            currentView={currentView}
            setView={handleSetView}
            onLogout={() => {
              setUser(null);
              handleSetView(AppView.WELCOME);
              dispatch(resetPersistStore());
              dispatch(resetGlobalStore());
              DataManager.clearDataManager();
            }}
          />
        );

      case AppView.WALLET:
        return <WalletView setView={handleSetView} onBack={handleGoBack} />;

      case AppView.MEMBERSHIP_DETAILS:
        return <MembershipDetailsView setView={handleSetView} onBack={handleGoBack} />;

      case AppView.MONETIZATION:
        return <MonetizationView setView={handleSetView} />;

      case AppView.FRIENDS:
        return <FriendsView setView={handleSetView} />;

      case AppView.FAVORITES:
        return <FavoritesView setView={handleSetView} />;

      case AppView.GLOBAL_DISCOVERY:
        return <GlobalDiscoveryView setView={handleSetView} />;

      case AppView.CONNECTION_REQUESTS:
        return <ConnectionRequestsView setView={handleSetView} />;

      case AppView.SUPPORT:
        return <SupportView setView={handleSetView} />;

      case AppView.DISCOVER:
        return <DiscoverView setView={handleSetView} />;

      case AppView.MY_GIFTS:
        return <MyGiftsView user={user as User} setView={handleSetView} setUser={setUser} />;

      case AppView.PROFILE:
        return (
          <ProfileScreen
            user={user}
            setCancel={handleGoBack}
            setView={handleSetView}
          />
        );

      default:
        return <Loader />;
    }
  };

  const showNav =
    [
      AppView.HOME,
      AppView.CHAT_INBOX,
      AppView.SETTINGS,
      AppView.FRIENDS,
    ].includes(currentView) && user?.role !== UserRole.ADMIN;

  return (
  <View style={styles.container}>
    {showSplash ? (
      <SplashView />
    ) : (
      <>
        {/* ✅ Render SocketConnection exactly ONCE */}
        <SocketConnection setView={handleSetView} />

        <StatusBar hidden={false} />

        {renderView()}

        {showNav && (
          <BottomNav currentView={currentView} setView={handleSetView} />
        )}

        <FlashMessage
          position="top"
          statusBarHeight={StatusBar.currentHeight || 0}
          style={{ width: "100%", borderRadius: 0 }}
          MessageComponent={({ message }: { message: any }) => (
            <CustomFlash msg={message?.message} color={message?.backgroundColor} />
          )}
        />

        <Loader />

        {/* Global Real-Time Match Request Modal */}
        <Modal
          transparent
          animationType="fade"
          visible={!!incomingMatchRequest && currentView !== AppView.VIDEO_CHAT}
          onRequestClose={() => {
            if (incomingMatchRequest?.matchId) {
              socket.emit("match-response", { matchId: incomingMatchRequest.matchId, response: "declined" });
            }
            dispatch(clearIncomingMatchRequest());
          }}
        >
          <View style={styles.matchRequestOverlay}>
            <View style={styles.matchRequestContainer}>
              <View style={styles.matchRequestHeader}>
                <View style={styles.matchRequestPulseRing} />
                <Text style={styles.matchRequestTitle}>
                  {incomingMatchRequest?.isSuperMatch ? "Super Match Request!" : "Incoming Match Request"}
                </Text>
                <Text style={styles.matchRequestSubtitle}>Someone wants to start a video chat with you right now</Text>
              </View>

              <View style={styles.matchRequestUserCard}>
                <Image
                  source={{
                    uri: incomingMatchRequest?.remoteUser?.profilePicture
                      ? (incomingMatchRequest.remoteUser.profilePicture.includes("http")
                          ? incomingMatchRequest.remoteUser.profilePicture
                          : `${IMAGE_URL}${incomingMatchRequest.remoteUser.profilePicture}`)
                      : "https://picsum.photos/200/200"
                  }}
                  style={styles.matchRequestAvatar}
                />
                <Text style={styles.matchRequestName}>
                  {incomingMatchRequest?.remoteUser?.displayName || incomingMatchRequest?.remoteUser?.fullName || "A User"}
                </Text>
                
                {/* User interests */}
                {incomingMatchRequest?.remoteUser?.interests && incomingMatchRequest.remoteUser.interests.length > 0 && (
                  <View style={styles.matchRequestInterests}>
                    {incomingMatchRequest.remoteUser.interests.slice(0, 3).map((interest: string, index: number) => (
                      <View key={index} style={styles.matchRequestInterestBadge}>
                        <Text style={styles.matchRequestInterestText}>{interest}</Text>
                      </View>
                    ))}
                    {incomingMatchRequest.remoteUser.interests.length > 3 && (
                      <TouchableOpacity 
                        style={styles.matchRequestInterestBadge} 
                        onPress={() => setShowAllInterestsApp(true)}
                      >
                        <Text style={styles.matchRequestInterestText}>+{incomingMatchRequest.remoteUser.interests.length - 3}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>

              <View style={styles.matchRequestFooter}>
                <TouchableOpacity
                  style={[styles.matchRequestButton, styles.matchRequestDeclineBtn]}
                  onPress={() => {
                    if (incomingMatchRequest?.matchId) {
                      socket.emit("match-response", { matchId: incomingMatchRequest.matchId, response: "declined" });
                    }
                    dispatch(clearIncomingMatchRequest());
                  }}
                >
                  <Text style={styles.matchRequestDeclineText}>Reject</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.matchRequestButton, styles.matchRequestAcceptBtn]}
                  onPress={() => {
                    if (incomingMatchRequest?.matchId) {
                      socket.emit("match-response", { matchId: incomingMatchRequest.matchId, response: "accepted" });
                    }
                    dispatch(clearIncomingMatchRequest());
                  }}
                >
                  <Text style={styles.matchRequestAcceptText}>Accept</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* ── Incoming Match Request All Interests Modal ── */}
        <Modal
          visible={showAllInterestsApp}
          transparent
          animationType="fade"
          onRequestClose={() => setShowAllInterestsApp(false)}
        >
          <View style={styles.modalOverlayInt}>
            <View style={styles.interestsModalContainer}>
              <Text style={styles.interestsModalTitle}>All Interests</Text>
              <ScrollView contentContainerStyle={styles.allInterestsScroll}>
                <View style={styles.interestsContainerModal}>
                  {incomingMatchRequest?.remoteUser?.interests?.map((interest: string, index: number) => (
                    <View key={index} style={styles.interestBadgeModal}>
                      <Text style={styles.interestTextModal}>{interest}</Text>
                    </View>
                  ))}
                </View>
              </ScrollView>
              <TouchableOpacity
                style={styles.closeInterestsBtn}
                onPress={() => setShowAllInterestsApp(false)}
              >
                <Text style={styles.closeInterestsText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <Modal transparent animationType="fade" visible={showPremiumModal}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Premium Club</Text>
              <Text style={styles.modalMessage}>Welcome to Premium Club!</Text>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => {
                  setShowPremiumModal(false);
                  setCurrentView(AppView.HOME);
                }}
              >
                <Text style={styles.modalButtonText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <RatingModal
          visible={showRatingModal}
          onClose={() => {
            setShowRatingModal(false);
            setFinishedMatchId(null);
          }}
          onSubmit={(rating) => {
            console.log("User rated the call:", rating, "for match:", finishedMatchId);
            
            if (finishedMatchId) {
              managerApiCall(
                rateMatch,
                {
                  matchId: finishedMatchId,
                  rating: rating
                },
                (res: any) => {
                  console.log("Rating submitted successfully:", res);
                  ShowAlertMessage("Thank you for your feedback!", popTypes.success);
                },
                (err: any) => {
                  console.log("Rating submission failed:", err);
                }
              );
            }

            setShowRatingModal(false);
            setFinishedMatchId(null);
          }}
        />
      </>
    )}
  </View>
);
};



















const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "85%",
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 10,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.black,
    marginBottom: 5,
  },
  modalMessage: {
    fontSize: 16,
    color: colors.black,
    textAlign: "center",
    marginBottom: 8,
  },
  modalButton: {
    paddingVertical: 8,
    paddingHorizontal: 40,
    borderRadius: 14,
  },
  modalButtonText: {
    fontSize: 19,
    fontWeight: "700",
    color: "#7C3AED",
  },
  matchRequestOverlay: {
    flex: 1,
    backgroundColor: "rgba(2, 6, 23, 0.85)", // slate-950 with 85% opacity
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  matchRequestContainer: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: colors.surface, // slate-900 (#0f172a)
    borderRadius: 32,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    padding: 24,
    alignItems: "center",
    elevation: 24,
    shadowColor: colors.primary, // purple glow
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  matchRequestHeader: {
    alignItems: "center",
    marginBottom: 20,
  },
  matchRequestPulseRing: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
    marginBottom: 8,
  },
  matchRequestTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: colors.white,
    textAlign: "center",
  },
  matchRequestSubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: 6,
    lineHeight: 18,
  },
  matchRequestUserCard: {
    width: "100%",
    backgroundColor: colors.surfaceAlt, // slate-800 (#1e293b)
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
    padding: 16,
    alignItems: "center",
    marginBottom: 24,
  },
  matchRequestAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: colors.primary,
  },
  matchRequestName: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.white,
    marginTop: 12,
    textAlign: "center",
  },
  matchRequestInterests: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 6,
    marginTop: 10,
  },
  matchRequestInterestBadge: {
    backgroundColor: "rgba(99, 102, 241, 0.15)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(99, 102, 241, 0.25)",
  },
  matchRequestInterestText: {
    color: "#a5b4fc", // slate-300 light indigo
    fontSize: 11,
    fontWeight: "600",
  },
  matchRequestFooter: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  matchRequestButton: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  matchRequestDeclineBtn: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.2)",
  },
  matchRequestDeclineText: {
    color: "#f87171",
    fontSize: 16,
    fontWeight: "700",
  },
  matchRequestAcceptBtn: {
    backgroundColor: colors.primary, // #6366f1
    elevation: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  matchRequestAcceptText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "700",
  },
  modalOverlayInt: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  interestsModalContainer: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: colors.surface,
    borderRadius: 32,
    padding: 24,
    maxHeight: "60%",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  interestsModalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.white,
    marginBottom: 16,
    textAlign: "center",
  },
  allInterestsScroll: {
    paddingBottom: 20,
  },
  interestsContainerModal: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
  },
  interestBadgeModal: {
    backgroundColor: "rgba(99, 102, 241, 0.15)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(99, 102, 241, 0.25)",
  },
  interestTextModal: {
    color: "#a5b4fc",
    fontSize: 14,
    fontWeight: "600",
  },
  closeInterestsBtn: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 16,
  },
  closeInterestsText: {
    color: colors.white,
    fontWeight: "bold",
    fontSize: 16,
  },
});

export default App;

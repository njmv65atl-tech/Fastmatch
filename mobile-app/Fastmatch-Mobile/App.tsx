
import * as React from "react";

import {
  AdminDashboard,
  ChatDetailView,
  ChatInboxView,
  Privacy,
  SettingsView,
  SubscriptionView,
  TermsOfService,
  WalletView,
  FriendsView,
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
} from "./src/views/CoreViews";
import { IMAGE_URL } from "./src/config/env";
import { Provider, useDispatch, useSelector } from "react-redux";
import {
  completeProfileSelector,
  resetPersistStore,
  setGlobalUser,
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
import { useRateMatchMutation, useUpgradePremiumMockMutation } from "./src/redux/services/auth";
import { setupIAP, purchaseErrorListener, purchaseUpdatedListener, finishTransaction, closeIAPConnection } from "./src/utils/iap";
const { width } = Dimensions.get("window");
const App: React.FC = () => {

  const [isConnected, setIsConnected] = useState<boolean | null>(true);
  const token = useSelector(tokenSelector);
  const [upgradePremiumMock] = useUpgradePremiumMockMutation();
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
    return completeProfile ? AppView.HOME : AppView.PROFILE_SETUP;
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
  const [showAllInterestsApp, setShowAllInterestsApp] = useState(false);
 React.useEffect(() => {
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
}, );

  React.useEffect(() => {
    setDispatch(dispatch);
    notificationService.requestUserPermission();
    notificationService.createNotificationListeners();
  }, []);

  React.useEffect(() => {
    setupIAP();

    const purchaseUpdateSubscription = purchaseUpdatedListener(async (purchase) => {
      console.log('purchaseUpdatedListener', purchase);
      const receipt = purchase.transactionReceipt;
      if (receipt) {
        try {
          // Tell your backend about the purchase here -- backend api hit


          await finishTransaction({ purchase, isConsumable: false });
          ShowAlertMessage("Purchase successful!", popTypes.success);
        } catch (ackErr) {
          console.warn('ackErr', ackErr);
        }
      }
    });

    const purchaseErrorSubscription = purchaseErrorListener((error) => {
      console.warn('purchaseErrorListener', error);
      if (error.responseCode !== 2) { // 2 is user cancelled
        ShowAlertMessage("Purchase failed", popTypes.error);
      }
    });

    return () => {
      purchaseUpdateSubscription.remove();
      purchaseErrorSubscription.remove();
      closeIAPConnection();
    };
  }, []);




  React.useEffect(() => {
    console.log(token, currentUser,"token and CurrentUser");
    if (token) {
      if (completeProfile) {
        setCurrentView(AppView.HOME);
      } else {
        setCurrentView(AppView.PROFILE_SETUP);
      }
    } else {
      setCurrentView(AppView.WELCOME);
    }
  }, [token]);

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

  const handleSetView = (view: AppView, params?: any) => {
    if (currentView === AppView.VIDEO_CHAT && view === AppView.HOME) {
      if (activeCallParams?.matchId) {
        setFinishedMatchId(activeCallParams.matchId);
      }
      setShowRatingModal(true);
    }
    
    if (view === AppView.CHAT_DETAIL && params?.userId) {
      // ✅ FIX: Chat params go into dedicated chat state — NOT into activeCallParams.
      // Previously (File 2), chat params were written into activeCallParams, which
      // would be spread into <VideoChatView> and corrupt video call props.
      setSelectedChatUserId(params.userId);
      setSelectedChatUserName(params.userName || "Unknown User");
      setSelectedChatUserAvatar(params.userAvatar || null);
      setSelectedChatUnreadCount(params.unreadCount || 0);
      setSelectedChatUser(params.item || null);
    } else if (params) {
      // Only non-chat navigations (e.g. VIDEO_CHAT) update activeCallParams.
      setActiveCallParams(params);
    } else {
      setActiveCallParams(null);
    }
    setCurrentView(view);
  };

  const handleLogin = (u: User) => {
    setUser(u);
    if (u.role === UserRole.ADMIN) {
      setCurrentView(AppView.ADMIN_DASHBOARD);
    } else {
      setCurrentView(AppView.HOME);
    }
  };

  const handleUpgrade = async (plan: "YEARLY" | "MONTHLY") => {
    if (user) {
      try {
        const response = await upgradePremiumMock({ plan }).unwrap() as any;
        if (response?.success && response?.data) {
          setUser(response.data);
          dispatch(setGlobalUser(response.data));
          setShowPremiumModal(true);
          setCurrentView(AppView.HOME);
          ShowAlertMessage("Mock Premium Upgrade Successful!", popTypes.success);
        } else {
          ShowAlertMessage("Upgrade failed.", popTypes.error);
        }
      } catch (e: any) {
        console.warn(e);
        ShowAlertMessage(e?.data?.message || "Upgrade failed.", popTypes.error);
      }
    }
  };

  const renderView = () => {
    switch (currentView) {

      case AppView.WELCOME:
        return <WelcomeView setView={setCurrentView} />;

      case AppView.LOGIN:
        return (
          <LoginView
            setView={setCurrentView}
            login={handleLogin}
            setUser={setUser}
          />
        );

      case AppView.SIGNUP:
        return (
          <SignupView
            setView={setCurrentView}
            login={handleLogin}
            setUser={setUser}
          />
        );

      case AppView.OTP:
        return (
          <OTPView
            setView={setCurrentView}
            login={handleLogin}
            user={user}
            type={otpContext.type}
            email={otpContext.email}
          />
        );

        

      case AppView.PROFILE_SETUP:
        return (
          <ProfileSetupView
            setView={setCurrentView}
            login={handleLogin}
            user={user}
            setUser={setUser}
          />
        );

      case AppView.FORGOT_PASSWORD:
        return (
          <ForgotPasswordView
            setView={setCurrentView}
            onOtpRequested={(email) => {
              setOtpContext({ type: "forgot", email });
              setCurrentView(AppView.OTP);
            }}
          />
        );

      case AppView.RESET_PASSWORD:
        return (
          <ResetPasswordView
            setView={setCurrentView}
            
          />
        );

      case AppView.HOME:
        return (
          <HomeView user={user} setView={setCurrentView} setUser={setUser} />
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
            setView={setCurrentView}
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
            setView={(view) => setCurrentView(view)}
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
            onBack={() => setCurrentView(AppView.CHAT_INBOX)}
          />
        );

      case AppView.PRIVACY:
        return (
          <Privacy
            goBack={() => setCurrentView(AppView.SETTINGS)}
            onAgree={() => setCurrentView(AppView.SETTINGS)}
            
          />
        );
        
        case AppView.TERMS:
        return (
          <TermsOfService
            goBack={() => setCurrentView(AppView.SETTINGS)}
            onAgree={() => setCurrentView(AppView.SETTINGS)}
          />
        );

      case AppView.SUBSCRIPTION:
        return (
          <SubscriptionView
            setView={setCurrentView}
            onUpgrade={handleUpgrade}
          />
        );

      case AppView.SETTINGS: 
        return (
          <SettingsView
            user={user}
            currentView={currentView}
            setView={setCurrentView}
            onLogout={() => {

              


              setUser(null);
              setCurrentView(AppView.WELCOME);
              dispatch(resetPersistStore());
              dispatch(resetGlobalStore());
              DataManager.clearDataManager();
            }}
          />
        );

      case AppView.ADMIN_DASHBOARD:
        return <AdminDashboard setView={setCurrentView} />;
      
      case AppView.WALLET:
        return <WalletView setView={setCurrentView} />;

      case AppView.FRIENDS:
        return <FriendsView setView={setCurrentView} />;

      case AppView.DISCOVER:
        return <DiscoverView setView={setCurrentView} />;

      case AppView.MY_GIFTS:
        return <MyGiftsView user={user as User} setView={setCurrentView} setUser={setUser} />;

      case AppView.PROFILE:
        return (
          <ProfileScreen
            user={user}
            setCancel={() => setCurrentView(AppView.SETTINGS)}
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
      AppView.MATCH_FILTERS,
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
          <BottomNav currentView={currentView} setView={setCurrentView} />
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
          visible={!!incomingMatchRequest}
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

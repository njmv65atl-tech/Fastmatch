



import * as React from "react";
import NetInfo from "@react-native-community/netinfo";
import {
  AppLogo,
  Button,
  MobileContainer,
} from "../../components/UIComponents";
import { AppView, User, UserRole } from "../../types";
import { Crown, Video, Zap, AlertTriangle, Globe, Inbox } from "lucide-react-native";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
  Modal,
  Animated,
  Easing,
  AppState,
} from "react-native";


import { HOME_TEXT } from "../../utils/commonText";
import LinearGradient from "react-native-linear-gradient";
import { colors } from "../../utils/colors";
import { fontFamily } from "../../assets/fonts/fontFamily";
import { popTypes, ShowAlertMessage } from "../../helpers/commonFunctions";
import { DailyRewardModal } from "../../components/DailyRewardModal";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useDispatch } from "react-redux";
import { setGlobalUser } from "../../redux/slices/persistedSlice";
import { useClaimDailyRewardMutation, useOnlineCountQuery } from "../../redux/services/auth";





interface CoreProps {
  user: any;
  setView: (view: AppView, params?: any) => void;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

const OnlineCounter = ({ count }: { count: number }) => {
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.8,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  return (
    <View style={styles.onlineRow}>
      <View style={styles.onlineDotWrap}>
        <Animated.View
          style={[
            styles.onlinePulseRing,
            {
              transform: [{ scale: pulseAnim }],
              opacity: pulseAnim.interpolate({
                inputRange: [1, 1.8],
                outputRange: [0.6, 0],
              }),
            },
          ]}
        />
        <View style={styles.onlineDotInner} />
      </View>
      <Text style={styles.onlineText}>
        <Text style={styles.onlineCountBold}>{count.toLocaleString()}</Text>
        {' People Online Now'}
      </Text>
    </View>
  );
};





export const HomeView: React.FC<CoreProps> = ({ user, setView, setUser }) => {

  const [showDailyReward, setShowDailyReward] = React.useState(false);
  const [rewardMessage, setRewardMessage] = React.useState("You earned 10 coins for logging in today.");
  const [claimDailyRewardMutation] = useClaimDailyRewardMutation();
  const { data: onlineData } = useOnlineCountQuery({}, { pollingInterval: 3000 });
  const dispatch = useDispatch();
  
  // Safety Disclaimer State
  const [showSafetyModal, setShowSafetyModal] = React.useState(false);

  React.useEffect(() => {
    const checkDisclaimer = async () => {
      try {
        const hasSeen = await AsyncStorage.getItem('hasSeenSafetyDisclaimer');
        if (!hasSeen) {
          setShowSafetyModal(true);
        }
      } catch (e) {
        console.log("Failed to check disclaimer:", e);
      }
    };
    checkDisclaimer();
  }, []);

  const acknowledgeSafetyDisclaimer = async () => {
    try {
      await AsyncStorage.setItem('hasSeenSafetyDisclaimer', 'true');
      setShowSafetyModal(false);
    } catch (e) {
      console.log("Failed to save disclaimer state:", e);
      setShowSafetyModal(false);
    }
  };

  React.useEffect(() => {
    let isMounted = true;
    const checkDailyReward = async () => {
      try {
        const res = await claimDailyRewardMutation({}).unwrap();
        if (res?.success && isMounted) {
          // Successfully claimed! Show popup with actual amount.
          setRewardMessage(res.message || "You earned your daily coins!");
          if (res.data) setUser(res.data);
          
          // Delay popup slightly so it doesn't conflict with the Login Loader Modal closing (Android bug)
          setTimeout(() => {
            if (isMounted) setShowDailyReward(true);
          }, 1200);
        }
      } catch (e) {
        console.log("Daily reward check skipped/failed", e);
      }
    };
    checkDailyReward();
    
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active") {
        checkDailyReward();
      }
    });

    return () => { 
      isMounted = false; 
      subscription.remove();
    };
  }, []);

  const claimReward = () => {
    // Already claimed in the background, just close the modal.
    setShowDailyReward(false);
  };

  return (
    <View style={{ flex: 1 }}>
      <MobileContainer>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.hero}>
            <View style={styles.heroNav}>
              <View style={{ flexShrink: 1 }}>
                <AppLogo size="sm" />
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {user?.role === UserRole.PREMIUM && (
                <View style={styles.premiumBadge1}>
                  <LinearGradient
                    colors={["#FDE047", "#FACC15", "#F59E0B"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.premiumBadge}
                  >
                    <View style={styles.premiumBadgeInner}>
                      <Crown size={12} strokeWidth={2} color={colors.background} />
                      <Text style={styles.premiumText}>PREMIUM</Text>
                    </View>
                  </LinearGradient>
                </View>
              )}
              </View>
            </View>

            <Text style={styles.heroTitle}>
              {HOME_TEXT.greeting}, {user?.displayName}
            </Text>
            
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
              <Text style={styles.heroSubtitle}>{HOME_TEXT.readyQuestion}</Text>
            </View>
          </View>

          <View style={styles.mainAction}>
            {/* Primary Action */}
            <View style={styles.actionCard}>
              <View style={styles.iconWrap}>
                <Video color={colors.primary} size={40} />
                <View style={styles.zapWrap}>
                  <Zap size={16} color={colors.brown} fill={colors.brown} />
                </View>
              </View>
              <View style={styles.actionDesc}>
                <Text style={styles.actionTitle}>
                  {HOME_TEXT.randomVideoChat}
                </Text>
                <Text style={styles.actionSubtitle}>
                  {HOME_TEXT.connectInstantly}
                </Text>
              </View>
              <View style={{ width: "100%" }}>
                <Button
                  variant="primary"
                  onClick={async () => {
                    const state = await NetInfo.fetch();
                    if (state.isConnected) {
                      setView(AppView.MATCH_FILTERS);
                    } else {
                      ShowAlertMessage("Please check your internet connection", popTypes.error);
                    }
                  }}
                >
                  {HOME_TEXT.startMatching}
                </Button>
              </View>

              {onlineData?.data?.onlineCount !== undefined && (
                <OnlineCounter count={onlineData.data.onlineCount} />
              )}
            </View>

            {/* Secondary Actions Grid */}
            <View style={styles.gridContainer}>
              {/* Super Match Card */}
              <TouchableOpacity 
                style={[styles.gridCard, { backgroundColor: "rgba(245, 158, 11, 0.1)", borderColor: "rgba(245, 158, 11, 0.2)", borderWidth: 1 }]} 
                onPress={async () => {
                  const state = await NetInfo.fetch();
                  if (state.isConnected) {
                    if (user?.isPremium === 'premium') {
                      setView(AppView.DISCOVER);
                    } else {
                      ShowAlertMessage("Super Match is a premium feature. Please upgrade.", popTypes.info);
                      setView(AppView.SUBSCRIPTION);
                    }
                  } else {
                    ShowAlertMessage("Please check your internet connection", popTypes.error);
                  }
                }}
                activeOpacity={0.8}
              >
                <View style={[styles.gridIconWrap, { backgroundColor: "rgba(245, 158, 11, 0.2)" }]}>
                  <Crown color={colors.gold} size={28} />
                </View>
                <Text style={styles.gridTitle}>Super Match</Text>
                <Text style={styles.gridSubtitle}>Find who's online</Text>
              </TouchableOpacity>

              {/* Global Network Card */}
              <TouchableOpacity 
                style={[styles.gridCard, { backgroundColor: "rgba(59, 130, 246, 0.1)", borderColor: "rgba(59, 130, 246, 0.2)", borderWidth: 1 }]} 
                onPress={async () => {
                  const state = await NetInfo.fetch();
                  if (state.isConnected) {
                    setView(AppView.GLOBAL_DISCOVERY);
                  } else {
                    ShowAlertMessage("Please check your internet connection", popTypes.error);
                  }
                }}
                activeOpacity={0.8}
              >
                <View style={[styles.gridIconWrap, { backgroundColor: "rgba(59, 130, 246, 0.2)" }]}>
                  <Globe color="#3b82f6" size={28} />
                </View>
                <Text style={styles.gridTitle}>Global Network</Text>
                <Text style={styles.gridSubtitle}>Browse all users</Text>
              </TouchableOpacity>

              {/* Connection Requests Card */}
              <TouchableOpacity 
                style={[styles.gridCard, { backgroundColor: "rgba(16, 185, 129, 0.1)", borderColor: "rgba(16, 185, 129, 0.2)", borderWidth: 1 }]} 
                onPress={async () => {
                  const state = await NetInfo.fetch();
                  if (state.isConnected) {
                    setView(AppView.CONNECTION_REQUESTS);
                  } else {
                    ShowAlertMessage("Please check your internet connection", popTypes.error);
                  }
                }}
                activeOpacity={0.8}
              >
                <View style={[styles.gridIconWrap, { backgroundColor: "rgba(16, 185, 129, 0.2)" }]}>
                  <Inbox color="#10b981" size={28} />
                </View>
                <Text style={styles.gridTitle}>Requests</Text>
                <Text style={styles.gridSubtitle}>Manage invites</Text>
              </TouchableOpacity>
            </View>
          </View>
          {user?.isPremium !== 'premium' && (
            <View style={styles.upgradeBorderWrapper}>
              <TouchableOpacity style={styles.upgradeCard} activeOpacity={0.9}>
                <View style={styles.upgradeInfo}>
                  <Text style={styles.upgradeTitle}>
                    {HOME_TEXT.upgradeTooltip}
                  </Text>
                  <Text style={styles.upgradeSubtitle}>
                    {HOME_TEXT.upgradeSubtitle}
                  </Text>

                  <TouchableOpacity
                    onPress={() => setView(AppView.SUBSCRIPTION)}
                    style={[styles.button, styles.disabledButton]}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.buttonText}>View Plans</Text>
                  </TouchableOpacity>
                </View>
                <Crown
                  size={160}
                  color={colors.gold}
                  strokeWidth={1}
                  style={styles.upgradeIcon}
                />
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>

        <DailyRewardModal visible={showDailyReward} message={rewardMessage} onClaim={claimReward} />

        {/* ── Safety Disclaimer Modal ── */}
        <Modal
          visible={showSafetyModal}
          transparent
          animationType="slide"
          onRequestClose={() => {}}
        >
          <View style={styles.modalOverlayInt}>
            <View style={styles.interestsModalContainer}>
              <View style={{ alignItems: "center", marginBottom: 16 }}>
                <AlertTriangle color="#f59e0b" size={48} />
              </View>
              <Text style={styles.interestsModalTitle}>Safety First</Text>
              <Text style={{ color: "rgba(255,255,255,0.8)", textAlign: "center", marginBottom: 24, fontSize: 16, lineHeight: 24 }}>
                For your safety, please do not share personal information (like your address, financial details, or phone number) during chats or calls. FastMatch is not responsible for any issues arising from sharing personal information. Stay safe and enjoy!
              </Text>
              
              <TouchableOpacity
                style={[styles.actionBtnInt, { backgroundColor: colors.primary, width: "100%", height: 50 }]}
                onPress={acknowledgeSafetyDisclaimer}
              >
                <Text style={styles.acceptTextInt}>I Understand</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

      </MobileContainer>
    </View>
  );
};







const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 100,
  },
  premiumBadge1: {
    alignSelf: "flex-start",

    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
    elevation: 4,
    marginTop: 8,
    // marginLeft: 100,
    marginLeft: "auto",
  },
  premiumBadge: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 999,
  },
  premiumBadgeInner: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  premiumText: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
    color: "#451A03",
    marginLeft: 4,
  },

  freeBadge: {
    alignSelf: "flex-start",
    marginTop: 4,
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: 6,
    paddingVertical: 5,
    borderRadius: 6,
  },
  freeText: {
    color: colors.textPlaceholder,
    fontSize: 10,
    fontWeight: "bold",
  },
  modalCloseText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "600",
  },
  modalOverlayInt: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  interestsModalContainer: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 24,
    maxHeight: "80%",
  },
  interestsModalTitle: {
    color: colors.white,
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 20,
    textAlign: "center",
  },
  actionBtnInt: {
    height: 52,
    borderRadius: 26,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  acceptTextInt: {
    color: colors.white,
    fontWeight: "700",
    fontSize: 16,
  },
  onlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(76, 175, 80, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.2)',
  },
  onlineDotWrap: {
    width: 12,
    height: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  onlineDotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    position: 'absolute',
  },
  onlinePulseRing: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
    position: 'absolute',
  },
  onlineText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 13,
    fontWeight: '500',
  },
  onlineCountBold: {
    color: '#81C784',
    fontWeight: '800',
    fontSize: 13,
  },
  hero: {
    backgroundColor: colors.surface,
    padding: 24,
    paddingTop: 40,
    paddingBottom: 64,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  heroNav: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },


  premiumBadgeText: {
    fontSize: 10,
    fontWeight: "900",
    color: colors.brown,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: colors.white,
  },
  heroSubtitle: {
    fontSize: 16,
    color: colors.textMuted,
    marginTop: 4,
  },
  mainAction: {
    paddingHorizontal: 24,
    marginTop: -40,
  },
  upgradeBorderWrapper: {
    margin: 24,
    borderRadius: 26,
    padding: 0.1,
    backgroundColor: "rgba(255,255,255,0.08)",
  },

  actionCard: {
    backgroundColor: colors.surface,
    borderRadius: 32,
    padding: 24,
    borderWidth: 0.2,
    borderColor: colors.textMuted,
    alignItems: "center",
  },
  iconWrap: {
    width: 96,
    height: 96,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    position: "relative",
  },
  zapWrap: {
    position: "absolute",
    bottom: -8,
    right: -8,
    backgroundColor: colors.gold,
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: colors.surface,
  },
  actionDesc: {
    alignItems: "center",
    marginBottom: 24,
  },
  actionTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.white,
  },
  actionSubtitle: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 4,
  },
  upgradeCard: {
    margin: 4,
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 24,
    flexDirection: "row",
    overflow: "hidden",

    position: "relative",
  },

  upgradeInfo: {
    flex: 1,
    zIndex: 1,
  },
  upgradeTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.gold,
  },
  upgradeSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginVertical: 8,
  },
  goldBtn: {
    backgroundColor: colors.gold,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: "flex-start",
    marginTop: 8,
  },
  goldBtnText: {
    fontSize: 12,
    fontWeight: "bold",
    color: colors.black,
  },
  upgradeIcon: {
    position: "absolute",
    right: -30,
    bottom: -20,
    opacity: 0.4,
    zIndex: 0,
  },

  button: {
    marginTop: 10,
    width: 120,
    paddingVertical: 10,

    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",

    backgroundColor: "#facc15",
    shadowColor: "#f59e0b",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  buttonText: {
    color: "#78350f",
    fontWeight: "bold",
    fontSize: 12,
    letterSpacing: 1,
  },
  disabledButton: {
    opacity: 1,
  }
});

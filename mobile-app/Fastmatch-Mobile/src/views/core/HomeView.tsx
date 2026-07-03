



import * as React from "react";
import NetInfo from "@react-native-community/netinfo";
import {
  AppLogo,
  Button,
  MobileContainer,
} from "../../components/UIComponents";
import { AppView, User, UserRole } from "../../types";
import { Crown, Video, Zap } from "lucide-react-native";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
  Modal,
} from "react-native";


import { HOME_TEXT } from "../../utils/commonText";
import LinearGradient from "react-native-linear-gradient";
import { colors } from "../../utils/colors";
import { fontFamily } from "../../assets/fonts/fontFamily";
import { popTypes, ShowAlertMessage } from "../../helpers/commonFunctions";
import { DailyRewardModal } from "../../components/DailyRewardModal";
import AsyncStorage from "@react-native-async-storage/async-storage";





interface CoreProps {
  user: any;
  setView: (view: AppView, params?: any) => void;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}





export const HomeView: React.FC<CoreProps> = ({ user, setView, setUser }) => {

  const [showDailyReward, setShowDailyReward] = React.useState(false);

  React.useEffect(() => {
    const checkDailyReward = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        const lastClaimDate = await AsyncStorage.getItem('lastDailyRewardDate');
        if (lastClaimDate !== today) {
          const timer = setTimeout(() => {
            setShowDailyReward(true);
          }, 1500);
          await AsyncStorage.setItem('lastDailyRewardDate', today);
          return () => clearTimeout(timer);
        }
      } catch (e) {
        console.error("Failed to check daily reward", e);
      }
    };
    checkDailyReward();
  }, []);

  const claimReward = () => {
    setShowDailyReward(false);
    ShowAlertMessage("10 Coins claimed!", popTypes.success);
  };

  return (
    <View style={{ flex: 1 }}>
      <MobileContainer>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.hero}>
            <View
              style={{
                flexDirection: "row",
              }}
            >
              <View style={styles.heroNav}>
                <AppLogo size="sm" />
              </View>

              {user?.role === UserRole.PREMIUM && (
                <View style={styles.premiumBadge1}>
                  <LinearGradient
                    colors={["#FDE047", "#FACC15", "#F59E0B"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.premiumBadge}
                  >
                    <View style={styles.premiumBadgeInner}>
                      <Crown
                        size={12}
                        strokeWidth={2}
                        color={colors.background}
                      />
                      <Text style={styles.premiumText}>PREMIUM</Text>
                    </View>
                  </LinearGradient>
                </View>
              )}
            </View>

            <Text style={styles.heroTitle}>
              {HOME_TEXT.greeting}, {user?.displayName}
            </Text>
            <Text style={styles.heroSubtitle}>{HOME_TEXT.readyQuestion}</Text>



          </View>

          <View style={styles.mainAction}>
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
                    const state = await NetInfo.fetch();   // ✅ one-time check, no listener
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
              
              
            </View>

            {/* Discover Card for Super Match */}
            <TouchableOpacity 
              style={[styles.actionCard, { marginTop: 16, backgroundColor: "rgba(245, 158, 11, 0.1)" }]} 
              onPress={async () => {
                const state = await NetInfo.fetch();
                if (state.isConnected) {
                  if (user?.isPremium === 'premium') {
                    setView(AppView.DISCOVER);
                  } else {
                    ShowAlertMessage("Discover Matches is a premium feature. Please upgrade.", popTypes.info);
                    setView(AppView.SUBSCRIPTION);
                  }
                } else {
                  ShowAlertMessage("Please check your internet connection", popTypes.error);
                }
              }}
              activeOpacity={0.8}
            >
              <View style={styles.iconWrap}>
                <Crown color={colors.gold} size={40} />
              </View>
              <View style={styles.actionDesc}>
                <Text style={styles.actionTitle}>Discover Matches</Text>
                <Text style={styles.actionSubtitle}>Find who's online & send Super Requests</Text>
              </View>
            </TouchableOpacity>
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

        <DailyRewardModal visible={showDailyReward} onClaim={claimReward} />

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

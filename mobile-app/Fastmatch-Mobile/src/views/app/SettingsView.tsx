import * as React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Pressable,
  Platform,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { MobileContainer, Header } from "../../components/UIComponents";
import { User, AppView, UserRole } from "../../types";
import { colors } from "../../utils/colors";
import GradientButton from "../../components/GradientButton";

import {
  Crown,
  ChevronRight,
  Settings as SettingsIcon,
  Shield,
  LogOut,
  Settings,
  Info,
  Gift,
} from "lucide-react-native";
import { AppIcon } from "../../assets/icons";
import { getImageUrl, ShowAlertMessage , popTypes  } from "../../helpers/commonFunctions";
import { IMG_URL } from "../../redux/services";
import { useSelector } from "react-redux";
import { userSelector } from "../../redux/slices/persistedSlice";
import { managerApiCall } from "../../helpers/managerApiCallFn";
import { useUserLogoutMutation } from "../../redux/services/auth";


interface SettingsProps {
  user: any;
  currentView: AppView;
  setView: (view: AppView) => void;
  onLogout?: () => void;
}

export const SettingsView: React.FC<SettingsProps> = ({
  
  setView,
  onLogout,
}) => {

  const user = useSelector(userSelector)


  console.log(user);
  const [userLogout] = useUserLogoutMutation();

  const onLogoutHandler = () => {
    console.log("now entering in logoutapi")
    managerApiCall(
      userLogout,
      {},
      (res : any)=>{
        console.log("you are logged out successfully",res);
        ShowAlertMessage("Logged-out successfully" , popTypes.info);
        onLogout && onLogout();
      },
      (err) => {
        console.log("error in logout",err);
        ShowAlertMessage(err.message,popTypes.error);
        onLogout && onLogout(); // Fallback so user isn't stuck if network fails
      }

    )
  }


  return (
    <MobileContainer>
      <Header title="Settings" />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.cardWrapper}>
          <LinearGradient
            colors={["#0F172A", "rgba(15,23,42,0.5)"]} // slate-900 → slate-900/50
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.card}
          >
            <Pressable style={styles.cardInner}
            
            onPress={()=> setView(AppView.PROFILE)}
            
            
            >
              {/* <LinearGradient
                colors={["#6366F1", "#8B5CF6"]} // Indigo 500 → Violet 600
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.avatarWrapper}
              > */}
              <View style={[styles.avatarInner, { marginTop: 4 }]}>
                <Image
                  source={{
                    uri:
                      `${IMG_URL}${user?.profilePicture}` ||
                      "https://picsum.photos/200/200",
                  }}
                  style={styles.avatar}
                />
              </View>
              {/* </LinearGradient> */}
              {/* </View> */}

              <View style={styles.userInfo}>
                <Text style={styles.name}>
                  {user?.displayName || "User Name"}
                </Text>
                <Text style={styles.email}>
                  {user?.email || "user@example.com"}
                </Text>

                {user?.role === UserRole.PREMIUM ? (
                  <View
                    style={{
                      backgroundColor: "#FCD34D", // slate-800
                      paddingHorizontal: 4,
                      borderRadius: 20,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      paddingVertical: 8,
                      gap: 5,

                      shadowColor: "#FCD34D",
                      shadowOffset: { width: 0, height: 5 },
                      shadowOpacity: 0.3,
                      shadowRadius: 7,
                      // Android Shadow
                      elevation: 5,
                    }}
                  >
                    {/* <View style={styles.premiumBadgeInner}> */}
                    <Crown size={10} strokeWidth={3} color="#451A03" />
                    <Text style={styles.premiumText}>PREMIUM MEMBER</Text>
                    {/* </View> */}
                  </View>
                ) : (
                  <View style={styles.freeBadge}>
                    <Text style={styles.freeText}>FREE PLAN</Text>
                  </View>
                )}
              </View>
            </Pressable>
          </LinearGradient>
        </View>
        <View style={{ marginTop: 16 }}>
          <Text style={styles.account}>ACCOUNT</Text>
          <View style={styles.menuSection}>
            {/* Temporarily removing this check */}
            {(!user?.role || user?.role === UserRole.FREE)  && (
              <Pressable
                onPress={() => setView(AppView.SUBSCRIPTION)}
                style={({ pressed }) => [
                  styles.wrapper,
                  pressed && styles.pressed,
                ]}
              >
                <LinearGradient
                  colors={[
                    "rgba(245,158,11,0.10)", // amber-500/10
                    "rgba(245,158,11,0.00)", // transparent
                  ]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.container1}
                >
                  <View
                    style={{
                      padding: 16,
                    }}
                  >
                    <View style={styles.menuItemContent}>
                      <View style={styles.premContent}>
                        <View style={styles.menuIconUpgrade}>
                          <Crown size={20} color="#F59E0B" />
                        </View>

                        <Text style={styles.menuLabelUpgrade}>
                          Upgrade to Premium
                        </Text>
                      </View>
                      <ChevronRight size={18} color="rgba(245,158,11,0.5)" />
                    </View>
                    {/* <View style={styles.menuIconRight}></View> */}
                  </View>
                </LinearGradient>
              </Pressable>
            )}
            {/* Wallet Button */}
            <Pressable
              onPress={() => setView(AppView.WALLET)}
              style={({ pressed }) => [
                styles.menuWrapper,
                pressed && styles.slatePressed,
              ]}
            >
              <View style={styles.slateMenuItem}>
                <View style={styles.leftSection}>
                  <View style={styles.slateIconBox}>
                    <Crown size={20} color="#F59E0B" />
                  </View>
                  <Text style={styles.menuText}>My Wallet</Text>
                </View>

                <ChevronRight size={18} color="#475569" />
              </View>
            </Pressable>

            {/* My Gifts Button */}
            <Pressable
              onPress={() => setView(AppView.MY_GIFTS)}
              style={({ pressed }) => [
                styles.menuWrapper,
                pressed && styles.slatePressed,
              ]}
            >
              <View style={styles.slateMenuItem}>
                <View style={styles.leftSection}>
                  <View style={styles.slateIconBox}>
                    <Gift size={20} color="#EC4899" />
                  </View>
                  <Text style={styles.menuText}>My Gifts</Text>
                </View>

                <ChevronRight size={18} color="#475569" />
              </View>
            </Pressable>

            {/* Privacy Button */}
            <Pressable
              onPress={() => setView(AppView.PRIVACY,)}
              style={({ pressed }) => [
                styles.menuWrapper,
                pressed && styles.slatePressed,
              ]}
            >
              <View style={styles.slateMenuItem}>
                <View style={styles.leftSection}>
                  <View style={styles.slateIconBox}>
                    <Shield size={20} color="#94A3B8" />
                  </View>
                  <Text style={styles.menuText}>Privacy & Safety</Text>
                </View>

                <ChevronRight size={18} color="#475569" />
              </View>
            </Pressable>

          

            <Pressable
              onPress={() => setView(AppView.TERMS)}
              style={({ pressed }) => [
                styles.menuWrapper,
                pressed && styles.slatePressed,
              ]}
            >
              <View style={styles.slateMenuItem}>
                <View style={styles.leftSection}>
                  <View style={styles.slateIconBox}>
                    <Image source={AppIcon.doc} style={{width : 17 , height : 17 , resizeMode : "contain" , tintColor : "#94A3B8"}}/>
                  </View>
                  <Text style={styles.menuText}>Terms of Service</Text>
                </View>

                <ChevronRight size={18} color="#475569" />
              </View>
            </Pressable>
          </View>
        </View>
        <GradientButton
          title="Log Out"
          onPress={() => onLogoutHandler()}
          disabled={false}
        />

      </ScrollView>

    </MobileContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 24,
    paddingBottom: 60,
  },
  menuText: {
    fontWeight: "500",
    color: "#E2E8F0", // slate-200
  },
  menuIconRight: {
    marginRight: 18,
  },

  menuWrapper: {
    marginBottom: 12, // space-y-3
  },
  slatePressed: {
    backgroundColor: "#1E293B",
    borderRadius: 16,
  },
  slateIconBox: {
    padding: 10,
    borderRadius: 12,
    backgroundColor: "#1E293B", // slate-800
    marginRight: 12,
  },

  premContent: {
    flexDirection: "row",
    alignItems: "center",
  },

  menuItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.2)",
  },
  cardWrapper: {
    borderRadius: 24, // rounded-3xl
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)", // border-white/5
    elevation: 8, // shadow (Android)
    overflow: "hidden", // Clips the gradient to the border radius
  },
  card: {
    // Gradient container: No borderRadius, borderWidth, or elevation here
  },
  cardInner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
  },
  container1: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    // padding: 16,
    borderRadius: 16, // rounded-2xl
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.2)", // amber-500/20
  },
  wrapper: {
    width: "100%",
    marginBottom: 12,
  },

  pressed: {
    opacity: 0.85,
  },
  slateMenuItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    backgroundColor: "rgba(15,23,42,0.5)", // slate-900/50
  },

  leftSection: {
    flexDirection: "row",
    alignItems: "center",
  },

  gradientBorder: {
    width: 80, // same as w-20
    height: 80, // same as h-20
    borderRadius: 40, // half width/height for circle
    padding: 2, // the “ring” width
    alignItems: "center",
    justifyContent: "center",
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderColor: colors.surfaceSecondary,
    borderWidth: 0.5,
    marginBottom: 32,
  },
  avatarWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",

    marginRight: Platform.OS === "ios" ? 10 : 20,
  },
  avatarInner: {
    padding: 4,
    // width: "100%",
    // height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 5,
    borderColor: "#8B5CF6", // slate-900
    marginRight: 10,
  },
  userInfo: {
    flex: 1,
  },
  name: {
    color: colors.white,
    fontSize: 20,
    fontWeight: "700",
  },
  email: {
    color: "#64748B",
    fontSize: 14,
    marginBottom: 8,
  },
  premiumBadge: {
    flexDirection: "row",
    alignSelf: "flex-start", // Changed to match freeBadge alignment (left side)
    borderRadius: 999,
    alignItems: "center",
    // iOS shadow
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
    // Android shadow
    elevation: 4,
    // Remove padding from here to fix iOS gradient issues
  },
  premiumBadgeInner: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 4, // Match freeBadge padding
    paddingVertical: 4, // Match freeBadge padding
    gap: 5,
    justifyContent: "center",
  },
  premiumText: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
    color: "#451A03", // amber-950
  },
  freeBadge: {
    backgroundColor: "#1E293B", // slate-800
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  freeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#94A3B8", // slate-400
    textTransform: "uppercase",
  },

  account: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B", // slate-500
    textTransform: "uppercase",
    letterSpacing: 2,
    marginLeft: 8,
    marginBottom: 12,
  },
  menuSection: {
    marginBottom: 18,
  },

  menuItemUpgrade: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.amberSoft,
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,
  },

  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.surfaceSecondary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  menuLabel: {
    color: colors.white,
    fontWeight: "600",
    fontSize: 14,
  },

  logoutBtn: {
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.danger,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.borderDanger,
  },
  logoutText: {
    color: colors.white,
    fontWeight: "bold",
    fontSize: 16,
  },
  menuItemUpgradeGradient: {
    borderRadius: 24,
    marginBottom: 12,
    overflow: "hidden",
  },

  menuItemUpgradeContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    // padding: 16,
    opacity: 0.2,
  },
  menuItemContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  menuIconUpgrade: {
    padding: 10,
    backgroundColor: "rgba(245,158,11,0.2)", // amber-500/20
    borderRadius: 12,
    marginRight: 12,
  },
  menuLabelUpgrade: {
    fontWeight: "700",

    color: "#FBBF24", // amber-400
  },
  logoutBtnGradient: {
    borderRadius: 16,
    overflow: "hidden",
    marginTop: 24,
  },
  logoutBtnContent: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  logoutBtnText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    tintColor: "#FFFFFF",
    fontSize: 16,
  },

  logoutBtnInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8, // space between icon and text
  },
});

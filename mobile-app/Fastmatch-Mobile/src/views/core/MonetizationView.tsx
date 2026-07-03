import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { Crown, Coins, Zap } from "lucide-react-native";
import LinearGradient from "react-native-linear-gradient";
import { userSelector, setGlobalUser } from "../../redux/slices/persistedSlice";
import { AppView } from "../../types";
import { colors } from "../../utils/colors";
import { ShowAlertMessage, popTypes } from "../../helpers/commonFunctions";
import { MobileContainer } from "../../components/UIComponents";

export const MonetizationView = ({ setView }: { setView: (v: AppView) => void }) => {
  const dispatch = useDispatch();
  const user = useSelector(userSelector);
  const [loadingVIP, setLoadingVIP] = React.useState(false);
  const [loadingCoins, setLoadingCoins] = React.useState<number | null>(null);

  const handleStartVIPTrial = async () => {
    setLoadingVIP(true);
    try {
      // Mock endpoint bypass
      const res = await fetch("/api/v1/user/upgrade-premium-mock", { method: "POST" }).catch(() => null);
      
      // Update locally
      dispatch(setGlobalUser({ ...user, role: "PREMIUM" }));
      ShowAlertMessage("VIP Trial Started!", popTypes.success);
    } catch (e) {
      ShowAlertMessage("Error upgrading to VIP", popTypes.error);
    } finally {
      setLoadingVIP(false);
    }
  };

  const handleBuyCoins = async (amount: number) => {
    setLoadingCoins(amount);
    try {
      // Mock endpoint bypass
      const res = await fetch("/api/v1/user/buy-coins-mock", { 
        method: "POST", 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coins: amount })
      }).catch(() => null);

      // Update locally
      const currentCoins = user?.walletBalance || 0;
      dispatch(setGlobalUser({ ...user, walletBalance: currentCoins + amount }));
      ShowAlertMessage(`Successfully bought ${amount} coins!`, popTypes.success);
    } catch (e) {
      ShowAlertMessage("Error buying coins", popTypes.error);
    } finally {
      setLoadingCoins(null);
    }
  };

  return (
    <MobileContainer>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => setView(AppView.PROFILE)}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Store</Text>
        <View style={styles.walletContainer}>
          <Coins size={16} color={colors.gold} />
          <Text style={styles.walletText}>{user?.walletBalance || 0}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* VIP Section */}
        <LinearGradient
          colors={["#451A03", "#78350F", "#B45309"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.vipCard}
        >
          <View style={styles.vipHeader}>
            <Crown size={32} color={colors.gold} />
            <Text style={styles.vipTitle}>Premium VIP</Text>
          </View>
          <Text style={styles.vipDesc}>Get unlimited matches, see who liked you, and more!</Text>
          <TouchableOpacity 
            style={styles.vipButton} 
            onPress={handleStartVIPTrial}
            disabled={user?.role === "PREMIUM" || loadingVIP}
          >
            {loadingVIP ? (
              <ActivityIndicator color="#451A03" />
            ) : (
              <Text style={styles.vipButtonText}>
                {user?.role === "PREMIUM" ? "Already VIP" : "Start VIP Trial"}
              </Text>
            )}
          </TouchableOpacity>
        </LinearGradient>

        <Text style={styles.sectionTitle}>Buy Coins</Text>

        {/* Coins Section */}
        <View style={styles.coinsGrid}>
          {[100, 500, 1000].map((amount) => (
            <TouchableOpacity 
              key={amount} 
              style={styles.coinCard}
              onPress={() => handleBuyCoins(amount)}
              disabled={loadingCoins === amount}
            >
              <View style={styles.coinIconContainer}>
                <Coins size={36} color={colors.gold} />
                {amount >= 500 && (
                  <View style={styles.popularBadge}>
                    <Zap size={10} color="#FFF" />
                    <Text style={styles.popularText}>HOT</Text>
                  </View>
                )}
              </View>
              <Text style={styles.coinAmount}>{amount} Coins</Text>
              <View style={styles.buyBtn}>
                {loadingCoins === amount ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.buyBtnText}>${(amount * 0.01).toFixed(2)}</Text>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </MobileContainer>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: colors.surface,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  backIcon: {
    color: "#FFF",
    fontSize: 20,
    fontWeight: "bold",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFF",
  },
  walletContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(250, 204, 21, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  walletText: {
    color: colors.gold,
    fontWeight: "bold",
    marginLeft: 6,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  vipCard: {
    borderRadius: 24,
    padding: 24,
    marginBottom: 32,
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  vipHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  vipTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: colors.gold,
    marginLeft: 12,
  },
  vipDesc: {
    color: "#FDE047",
    fontSize: 14,
    marginBottom: 20,
    lineHeight: 20,
    opacity: 0.9,
  },
  vipButton: {
    backgroundColor: colors.gold,
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: "center",
  },
  vipButtonText: {
    color: "#451A03",
    fontWeight: "bold",
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFF",
    marginBottom: 16,
  },
  coinsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  coinCard: {
    width: "48%",
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  coinIconContainer: {
    position: "relative",
    marginBottom: 12,
  },
  popularBadge: {
    position: "absolute",
    top: -10,
    right: -20,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  popularText: {
    color: "#FFF",
    fontSize: 8,
    fontWeight: "bold",
    marginLeft: 2,
  },
  coinAmount: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFF",
    marginBottom: 12,
  },
  buyBtn: {
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 16,
    width: "100%",
    alignItems: "center",
  },
  buyBtnText: {
    color: "#FFF",
    fontWeight: "600",
    fontSize: 14,
  },
});

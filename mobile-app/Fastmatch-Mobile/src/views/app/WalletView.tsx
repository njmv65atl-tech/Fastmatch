import * as React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  BackHandler,
  Platform,
  ActivityIndicator,
} from "react-native";
import { MobileContainer, Header } from "../../components/UIComponents";
import { AppView } from "../../types";
import { colors } from "../../utils/colors";
import { Coins, ChevronLeft, TrendingUp, TrendingDown } from "lucide-react-native";
import LinearGradient from "react-native-linear-gradient";
import { useSelector, useDispatch } from "react-redux";
import { userSelector, setGlobalUser } from "../../redux/slices/persistedSlice";
import { ShowAlertMessage, popTypes } from "../../helpers/commonFunctions";
import { useBuyCoinsMockMutation, useWalletHistoryQuery } from "../../redux/services/auth";

interface WalletViewProps {
  setView: (view: AppView) => void;
}

export const WalletView: React.FC<WalletViewProps> = ({ setView }) => {
  const user = useSelector(userSelector);
  const dispatch = useDispatch();
  
  const [buyCoinsMock] = useBuyCoinsMockMutation();
  const { data: historyData, isLoading: isLoadingHistory, refetch: refetchHistory } = useWalletHistoryQuery({});
  
  const coinPackages = [
    { id: "com.fastmatch.coins_100", amount: 100, price: "$0.99", bonus: 0 },
    { id: "com.fastmatch.coins_500", amount: 500, price: "$4.99", bonus: 50 },
    { id: "com.fastmatch.coins_1000", amount: 1000, price: "$9.99", bonus: 200 },
  ];

  const handlePurchase = async (pkg: any) => {
    try {
      const response = await buyCoinsMock({ amount: pkg.amount + pkg.bonus }).unwrap() as any;
      if (response?.success && response?.data) {
        dispatch(setGlobalUser(response.data));
        refetchHistory();
        ShowAlertMessage("Purchase mock successful. Coins added!", popTypes.success);
      } else {
        ShowAlertMessage("Purchase failed.", popTypes.error);
      }
    } catch (e: any) {
      console.warn(e);
      ShowAlertMessage(e?.data?.message || "Purchase failed or cancelled.", popTypes.error);
    }
  };

  React.useEffect(() => {
    if (Platform.OS === 'android') {
      const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
        setView(AppView.HOME);
        return true;
      });
      return () => backHandler.remove();
    }
  }, [setView]);

  return (
    <MobileContainer>
      <Header title="My Wallet" onBack={() => setView(AppView.HOME)} />
      
      <ScrollView contentContainerStyle={styles.container}>
        {/* Balance Card */}
        <View style={[styles.balanceCard, { backgroundColor: "#F59E0B", overflow: 'hidden' }]}>
          <LinearGradient
            colors={["#FDE047", "#F59E0B"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={styles.balanceInner}>
            <Coins size={32} color="#451A03" />
            <View style={styles.balanceTextWrap}>
              <Text style={styles.balanceLabel}>Current Balance</Text>
              <Text style={styles.balanceAmount}>{user?.walletBalance || 0} Coins</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Get More Coins</Text>
        
        {/* Coin Packages */}
        <View style={styles.packagesContainer}>
          {coinPackages.map((pkg) => (
            <TouchableOpacity 
              key={pkg.id} 
              style={styles.packageCard}
              onPress={() => handlePurchase(pkg)}
              activeOpacity={0.8}
            >
              <View style={styles.packageLeft}>
                <View style={styles.coinIconWrap}>
                  <Coins size={24} color="#F59E0B" />
                </View>
                <View>
                  <Text style={styles.packageAmount}>{pkg.amount} Coins</Text>
                  {pkg.bonus > 0 && (
                    <Text style={styles.packageBonus}>+{pkg.bonus} Bonus Coins</Text>
                  )}
                </View>
              </View>
              <View style={styles.priceWrap}>
                <Text style={styles.priceText}>{pkg.price}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.infoText}>
          Coins can be used to send Virtual Gifts during video calls and unlock Super Matches.
        </Text>

        <View style={styles.historyContainer}>
          <Text style={styles.sectionTitle}>Coins History</Text>
          {isLoadingHistory ? (
            <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 20 }} />
          ) : historyData?.data && historyData.data.length > 0 ? (
            historyData.data.map((tx: any) => (
              <View key={tx._id} style={styles.historyCard}>
                <View style={styles.historyIconBox}>
                  {tx.amount > 0 ? (
                    <TrendingUp size={20} color={colors.success} />
                  ) : (
                    <TrendingDown size={20} color={colors.danger} />
                  )}
                </View>
                <View style={styles.historyDetails}>
                  <Text style={styles.historyTitle}>
                    {tx.type === 'daily_reward' ? 'Daily Reward' :
                     tx.type === 'purchase' ? 'Purchased Coins' :
                     tx.type === 'gift_sent' ? 'Sent Gift' :
                     tx.type === 'gift_received' ? 'Received Gift' :
                     tx.type === 'converted_gift' ? 'Converted Gift to Coins' : 'Transaction'}
                  </Text>
                  <Text style={styles.historyDesc}>{tx.description || "N/A"}</Text>
                  <Text style={styles.historyDate}>{new Date(tx.createdAt).toLocaleDateString()} {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                </View>
                <View style={styles.historyAmountWrap}>
                  <Text style={[styles.historyAmount, { color: tx.amount > 0 ? colors.success : colors.white }]}>
                    {tx.amount > 0 ? '+' : ''}{tx.amount}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.noHistoryText}>No transactions yet.</Text>
          )}
        </View>
      </ScrollView>
    </MobileContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 24,
    paddingBottom: 60,
  },
  balanceCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 32,
    shadowColor: "#F59E0B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  balanceInner: {
    flexDirection: "row",
    alignItems: "center",
  },
  balanceTextWrap: {
    marginLeft: 16,
  },
  balanceLabel: {
    fontSize: 14,
    color: "#78350F",
    fontWeight: "600",
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 28,
    color: "#451A03",
    fontWeight: "800",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.white,
    marginBottom: 16,
  },
  packagesContainer: {
    gap: 12,
  },
  packageCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(30, 41, 59, 0.7)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 16,
    padding: 16,
  },
  packageLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  coinIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(245, 158, 11, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  packageAmount: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.white,
  },
  packageBonus: {
    fontSize: 12,
    fontWeight: "600",
    color: "#10B981",
    marginTop: 2,
  },
  priceWrap: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  priceText: {
    color: colors.white,
    fontWeight: "700",
    fontSize: 14,
  },
  infoText: {
    marginTop: 32,
    fontSize: 13,
    color: colors.textPlaceholder,
    textAlign: "center",
    lineHeight: 20,
  },
  historyContainer: {
    marginTop: 10,
    marginBottom: 40,
  },
  historyCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceAlt,
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  historyIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.05)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  historyDetails: {
    flex: 1,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.white,
    marginBottom: 2,
  },
  historyDesc: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 4,
  },
  historyDate: {
    fontSize: 11,
    color: colors.textMuted,
    opacity: 0.6,
  },
  historyAmountWrap: {
    justifyContent: "center",
    alignItems: "flex-end",
  },
  historyAmount: {
    fontSize: 18,
    fontWeight: "800",
  },
  noHistoryText: {
    color: colors.textMuted,
    textAlign: "center",
    marginTop: 20,
    fontStyle: "italic",
  },
});

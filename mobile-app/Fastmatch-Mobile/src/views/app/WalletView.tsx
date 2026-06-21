import * as React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  BackHandler,
  Platform,
} from "react-native";
import { MobileContainer, Header } from "../../components/UIComponents";
import { AppView } from "../../types";
import { colors } from "../../utils/colors";
import { Coins, ChevronLeft } from "lucide-react-native";
import LinearGradient from "react-native-linear-gradient";
import { useSelector } from "react-redux";
import { userSelector } from "../../redux/slices/persistedSlice";
import { subscribeToProduct } from "../../utils/iap";
import { ShowAlertMessage, popTypes } from "../../helpers/commonFunctions";
import { useBuyCoinsMockMutation } from "../../redux/services/auth";
import { useDispatch } from "react-redux";
import { setGlobalUser } from "../../redux/slices/persistedSlice";

interface WalletViewProps {
  setView: (view: AppView) => void;
}

export const WalletView: React.FC<WalletViewProps> = ({ setView }) => {
  const user = useSelector(userSelector);
  
  const coinPackages = [
    { id: "com.fastmatch.coins_100", amount: 100, price: "$0.99", bonus: 0 },
    { id: "com.fastmatch.coins_500", amount: 500, price: "$4.99", bonus: 50 },
    { id: "com.fastmatch.coins_1000", amount: 1000, price: "$9.99", bonus: 200 },
  ];

  const dispatch = useDispatch();
  const [buyCoinsMock] = useBuyCoinsMockMutation();

  const handlePurchase = async (pkg: any) => {
    try {
      const response = await buyCoinsMock({ amount: pkg.amount + pkg.bonus }).unwrap() as any;
      if (response?.success && response?.data) {
        dispatch(setGlobalUser(response.data));
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
        <LinearGradient
          colors={["#FDE047", "#F59E0B"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.balanceCard}
        >
          <View style={styles.balanceInner}>
            <Coins size={32} color="#451A03" />
            <View style={styles.balanceTextWrap}>
              <Text style={styles.balanceLabel}>Current Balance</Text>
              <Text style={styles.balanceAmount}>{user?.walletBalance || 0} Coins</Text>
            </View>
          </View>
        </LinearGradient>

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
});

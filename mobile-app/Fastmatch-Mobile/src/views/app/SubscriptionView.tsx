import * as React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
  BackHandler,
  useWindowDimensions,
} from "react-native";
import { BlurView } from "@react-native-community/blur";
import LinearGradient from "react-native-linear-gradient";
import { MobileContainer, Button } from "../../components/UIComponents";
import { AppView } from "../../types";
import { Check, Crown } from "lucide-react-native";
import { colors } from "../../utils/colors";
import { fetchProducts, fetchSubscriptions, subscribeToProduct, type Product, type Subscription as IAPSubscription } from "../../utils/iap";
import { ShowAlertMessage, popTypes } from "../../helpers/commonFunctions";

const { width, height } = Dimensions.get("window");

type PlanType = "YEARLY" | "MONTHLY";

export const SubscriptionView: React.FC<{
  setView: (v: AppView) => void;
  onUpgrade: (plan: PlanType) => void;
}> = ({ setView, onUpgrade }) => {
  const [selectedPlan, setSelectedPlan] = React.useState<PlanType>("YEARLY");
  const [disabledPlan, setDisabledPlan] = React.useState<PlanType | null>(null);
  const [products, setProducts] = React.useState<Product[]>([]);
  const [subscriptions, setSubscriptions] = React.useState<IAPSubscription[]>([]);
  const [loading, setLoading] = React.useState(true);
  const features = [
    "Filter matches by Gender",
    "Unlimited Skips & Rewinds",
    "Ad-free Experience",
    "Priority Matching",
  ];

  React.useEffect(() => {
    const loadIAP = async () => {
      try {
        const subs = await fetchSubscriptions();
        setSubscriptions(subs);
        // Also fetch products if needed
        // const prods = await fetchProducts();
        // setProducts(prods);
      } catch (err) {
        console.warn("Error loading IAP items:", err);
      } finally {
        setLoading(false);
      }
    };
    loadIAP();
  }, []);

  const getPriceForPlan = (plan: PlanType) => {
    const sku = plan === "YEARLY" ? "com.fastmatch.premium_yearly" : "com.fastmatch.premium_monthly";
    const sub = subscriptions.find(s => s.productId === sku);
    if (sub) {
      return sub.localizedPrice;
    }
    return plan === "YEARLY" ? "$49" : "$9";
  };

  const handlePurchase = async () => {
    // Temporary bypass for testing
    onUpgrade(selectedPlan);
    ShowAlertMessage("Premium Unlocked successfully!", popTypes.success);
    setView(AppView.HOME);
  };

  // Toggle plan with disable functionality
  const togglePlan = (plan: PlanType) => {
    if (disabledPlan === plan) {
      setDisabledPlan(null); // Deselect if already disabled
    } else {
      setSelectedPlan(plan);
      setDisabledPlan(plan); // Disable the selected one
    }
  };

  // Handle Android back button
  React.useEffect(() => {
    if (Platform.OS === 'android') {
      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        () => {
          setView(AppView.HOME);
          return true;
        }
      );
      return () => backHandler.remove();
    }
  }, [setView]);

  const handleBack = React.useCallback(() => {
    setView(AppView.HOME);
  }, [setView]);

  return (
    <MobileContainer>
      <View style={styles.spaceBg} />
      <TouchableOpacity
        onPress={() => setView(AppView.HOME)}
        style={styles.closeBtn}
      >
        <Text style={styles.closeIcon}>✕</Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.crownWrap}>
          <Crown size={40} color="#78350F" fill="#78350F" />
        </View>

        <Text style={styles.title}>Go Premium</Text>
        <Text style={styles.subtitle}>Unlock the ultimate experience.</Text>

        <View style={styles.featuresList}>
          {features.map((feat, i) => (
            <View key={i} style={styles.featureItem}>
              <View style={styles.checkWrap}>
                <Check size={14} color={colors.gold} strokeWidth={3} />
              </View>
              <Text style={styles.featureText}>{feat}</Text>
            </View>
          ))}
        </View>

        <View style={styles.plansRow}>
          {/* YEARLY Plan */}
          <TouchableOpacity
            onPress={() => togglePlan("YEARLY")}
            style={{ flex: 1, marginVertical: 20 }}
            activeOpacity={0.9}
            disabled={disabledPlan === "YEARLY"}
          >
            {selectedPlan === "YEARLY" ? (
              <View style={styles.planCardWrapper}>
                <LinearGradient
                  colors={["rgba(49,46,129,0.4)", "rgba(49,46,129,0.2)"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={styles.planCardActive}
                >
                  <View style={styles.planCardInner}>
                    <Text style={[styles.planName, styles.planNameActive]}>
                      YEARLY
                    </Text>
                    <Text style={styles.planPrice}>{getPriceForPlan("YEARLY")}</Text>
                    <Text style={styles.planPeriod}>/year</Text>
                  </View>
                </LinearGradient>
                <View style={styles.bestBadge}>
                  <Text style={styles.bestBadgeText}>BEST VALUE</Text>
                </View>
              </View>
            ) : disabledPlan === "YEARLY" ? (
              <View style={[styles.planCard, styles.planCardDisabled]}>
                <Text style={styles.planNameDisabled}>YEARLY</Text>
                <Text style={styles.planPriceDisabled}>{getPriceForPlan("YEARLY")}</Text>
                <Text style={styles.planPeriodDisabled}>/year</Text>
              </View>
            ) : (
              <View style={styles.planCard}>
                <Text style={styles.planName}>YEARLY</Text>
                <Text style={styles.planPrice}>{getPriceForPlan("YEARLY")}</Text>
                <Text style={styles.planPeriod}>/year</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* MONTHLY Plan */}
          <TouchableOpacity
            onPress={() => togglePlan("MONTHLY")}
            style={{ flex: 1, marginVertical: 20 }}
            activeOpacity={0.9}
            disabled={disabledPlan === "MONTHLY"}
          >
            {selectedPlan === "MONTHLY" ? (
              <LinearGradient
                colors={["rgba(49,46,129,0.4)", "rgba(49,46,129,0.2)"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.planCardActive}
              >
                <View style={styles.planCardInner}>
                  <Text style={[styles.planName, styles.planNameActive]}>
                    MONTHLY
                  </Text>
                  <Text style={styles.planPrice}>{getPriceForPlan("MONTHLY")}</Text>
                  <Text style={styles.planPeriod}>/month</Text>
                </View>
              </LinearGradient>
            ) : disabledPlan === "MONTHLY" ? (
              <View style={[styles.planCard, styles.planCardDisabled]}>
                <Text style={styles.planNameDisabled}>MONTHLY</Text>
                <Text style={styles.planPriceDisabled}>{getPriceForPlan("MONTHLY")}</Text>
                <Text style={styles.planPeriodDisabled}>/month</Text>
              </View>
            ) : (
              <View style={styles.planCard}>
                <Text style={styles.planName}>MONTHLY</Text>
                <Text style={styles.planPrice}>{getPriceForPlan("MONTHLY")}</Text>
                <Text style={styles.planPeriod}>/month</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View style={{ width: "100%" }}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handlePurchase}
            style={styles.unlockWrapper}
          >
            <LinearGradient
              colors={["#FDE047", "#FACC15", "#F59E0B"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.unlockBtn}
            >
              <View style={styles.unlockBtnInner}>
                <Text style={styles.unlockText}>Unlock Premium</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </MobileContainer>
  );
};

const styles = StyleSheet.create({
  spaceBg: {
    ...StyleSheet.absoluteFillObject,
    pointerEvents: "none",
  },
  closeBtn: {
    position: "absolute",
    top: 16,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
    elevation: 50,
  },
  closeIcon: {
    color: colors.white,
    fontSize: 18,
  },
  content: {
    paddingTop: 40,
    paddingHorizontal: 24,
    paddingBottom: 30,
    alignItems: "center",
  },
  crownWrap: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: "#FCD34D",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    shadowColor: "#F59E0B",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 25,
    elevation: 15,
  },
  title: {
    fontSize: 36,
    fontWeight: "900",
    color: "#FCD34D",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#94A3B8",
    marginBottom: 32,
    textAlign: "center",
  },
  featuresList: {
    width: "100%",
    marginBottom: 32,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginBottom: 12,
  },
  checkWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "rgba(245, 158, 11, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  featureText: {
    color: colors.white,
    fontWeight: "600",
  },
  plansRow: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-between",
    marginBottom: 32,
  },
  planCard: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    padding: 20,
    borderRadius: 28,
    alignItems: "center",
    marginHorizontal: 4,
  },
  planCardDisabled: {
    opacity: 0.4,
  },
  planCardActive: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#6366F1",
    borderRadius: 28,
    alignItems: "center",
    marginHorizontal: 4,
  },
  planCardInner: {
    padding: 20,
    alignItems: "center",
    width: "100%",
  },
  planCardWrapper: {
    position: "relative",
  },
  bestBadge: {
    position: "absolute",
    top: Platform.OS === "ios" ? -10 : -10,
    alignSelf: "center",
    backgroundColor: "#6366F1",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    shadowColor: "#6366F1",
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 5,
  },
  bestBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "bold",
  },
  planName: {
    color: "grey",
    fontWeight: "bold",
    fontSize: 14,
    marginBottom: 4,
  },
  planNameActive: {
    color: "#6366F1",
  },
  planNameDisabled: {
    color: "grey",
    fontWeight: "bold",
    fontSize: 14,
    marginBottom: 4,
  },
  planPrice: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 4,
  },
  planPriceDisabled: {
    color: "#9CA3AF",
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 4,
  },
  planPeriod: {
    fontSize: 12,
    color: "#94A3B8",
  },
  planPeriodDisabled: {
    fontSize: 12,
    color: "#D1D5DB",
  },
  unlockWrapper: {
    width: "100%",
  },
  unlockBtn: {
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 16,
  },
  unlockBtnInner: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  unlockText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#451A03",
    textAlign: "center",
  },
});
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
  TextInput,
  ActivityIndicator,
  useWindowDimensions,
  RefreshControl,
  Linking,
} from "react-native";
import { BlurView } from "@react-native-community/blur";
import LinearGradient from "react-native-linear-gradient";
import { MobileContainer, Button } from "../../components/UIComponents";
import { AppView } from "../../types";
import { Check, Crown, Tag, Sparkles, AlertCircle, RotateCcw } from "lucide-react-native";
import { colors } from "../../utils/colors";
import { fetchProducts, fetchSubscriptions, subscribeToProduct, restoreActivePurchases, type Product, type Subscription as IAPSubscription } from "../../utils/iap";
import { ShowAlertMessage, popTypes } from "../../helpers/commonFunctions";
import { useApplyCouponMutation, useRedeemCouponMutation, useGetPricingQuery, useVerifyPurchaseMutation } from "../../redux/services/auth";
import { useDispatch, useSelector } from "react-redux";
import { setGlobalUser, userSelector } from "../../redux/slices/persistedSlice";

const { width, height } = Dimensions.get("window");

type PlanType = "YEARLY" | "MONTHLY";

export const SubscriptionView: React.FC<{
  setView: (v: AppView) => void;
  onUpgrade: (plan: PlanType) => void;
  onBack?: () => void;
}> = ({ setView, onUpgrade, onBack }) => {
  const [selectedPlan, setSelectedPlan] = React.useState<PlanType>("YEARLY");
  const [disabledPlan, setDisabledPlan] = React.useState<PlanType | null>(null);
  const [products, setProducts] = React.useState<Product[]>([]);
  const [subscriptions, setSubscriptions] = React.useState<IAPSubscription[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Coupon state
  const [couponCode, setCouponCode] = React.useState("");
  const [appliedCoupon, setAppliedCoupon] = React.useState<{ code: string; discountPercent: number } | null>(null);
  const [applyCouponMutation, { isLoading: isApplyingCoupon }] = useApplyCouponMutation();

  // Dynamic pricing from Admin Panel
  const {
    data: pricingData,
    isLoading: isPricingLoading,
    isFetching: isPricingFetching,
    refetch: refetchPricing,
  } = useGetPricingQuery({}, { refetchOnMountOrArgChange: true });

  const onRefresh = React.useCallback(async () => {
    try {
      await refetchPricing();
    } catch (e) {
      console.warn("Pricing refresh error:", e);
    }
  }, [refetchPricing]);

  const features = [
    "Unlimited Video Calls",
    "Filter matches by Gender, Age & Location",
    "Unlimited Skips & Rewinds",
    "Global Network Access",
    "Priority VIP Matching",
  ];

  React.useEffect(() => {
    const loadIAP = async () => {
      try {
        const subs = await fetchSubscriptions();
        setSubscriptions(subs);
      } catch (err) {
        console.warn("Error loading IAP items:", err);
      } finally {
        setLoading(false);
      }
    };
    loadIAP();
  }, []);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      ShowAlertMessage("Please enter a promo code", popTypes.error);
      return;
    }
    try {
      const res: any = await applyCouponMutation({
        code: couponCode.trim(),
        plan: selectedPlan.toLowerCase(),
      }).unwrap();
      if (res?.data) {
        setAppliedCoupon(res.data);
        ShowAlertMessage(res.message || "Promo code applied!", popTypes.success);
      }
    } catch (err: any) {
      console.warn("Coupon error:", err);
      ShowAlertMessage(err?.data?.message || "Invalid or expired promo code", popTypes.error);
    }
  };

  const dispatch = useDispatch();
  const user = useSelector(userSelector);
  const isPremium = user?.isPremium === "premium";
  const [isRestoring, setIsRestoring] = React.useState(false);
  const [redeemCouponMutation, { isLoading: isRedeemingCoupon }] = useRedeemCouponMutation();
  const [verifyPurchaseApi] = useVerifyPurchaseMutation();

  const handleRestorePurchases = async () => {
    setIsRestoring(true);
    try {
      const purchases = await restoreActivePurchases();
      if (!purchases || purchases.length === 0) {
        ShowAlertMessage("No active store purchases found to restore.", popTypes.info);
        setIsRestoring(false);
        return;
      }
      let restored = false;
      for (const p of purchases) {
        const prodId = p.productId || (p as any).productIds?.[0];
        const receipt = p.transactionReceipt || p.purchaseToken;
        if (prodId?.includes("premium") && receipt) {
          const res: any = await verifyPurchaseApi({
            productId: prodId,
            purchaseToken: p.purchaseToken || p.transactionId || receipt,
            receipt: receipt,
            platform: Platform.OS,
          }).unwrap();
          if (res?.data) {
            dispatch(setGlobalUser(res.data));
            restored = true;
          }
        }
      }
      if (restored) {
        ShowAlertMessage("VIP Membership restored successfully!", popTypes.success);
        setView(AppView.MEMBERSHIP_DETAILS);
      } else {
        ShowAlertMessage("Your subscriptions are up to date.", popTypes.info);
      }
    } catch (e: any) {
      console.warn("handleRestorePurchases error:", e);
      ShowAlertMessage("Could not restore purchases.", popTypes.error);
    } finally {
      setIsRestoring(false);
    }
  };

  const getStorePriceForPlan = (plan: PlanType) => {
    const sku = plan === "YEARLY" ? "com.fastmatch.premium.yearly" : "com.fastmatch.premium.monthly";
    const storeSub = subscriptions.find((s) => s.productId === sku);
    if (storeSub?.localizedPrice) {
      return storeSub.localizedPrice;
    }
    const rawYearly = pricingData?.data?.yearlyPrice;
    const rawMonthly = pricingData?.data?.monthlyPrice;
    const basePrice = plan === "YEARLY"
      ? (typeof rawYearly === "number" ? rawYearly : parseFloat(rawYearly) || 90)
      : (typeof rawMonthly === "number" ? rawMonthly : parseFloat(rawMonthly) || 9);
    return `$${basePrice.toFixed(2)}`;
  };

  const getPriceForPlan = (plan: PlanType) => {
    const rawYearly = pricingData?.data?.yearlyPrice;
    const rawMonthly = pricingData?.data?.monthlyPrice;
    const defaultYearly = 90;
    const defaultMonthly = 9;
    const basePrice = plan === "YEARLY"
      ? (typeof rawYearly === "number" ? rawYearly : parseFloat(rawYearly) || defaultYearly)
      : (typeof rawMonthly === "number" ? rawMonthly : parseFloat(rawMonthly) || defaultMonthly);

    if (appliedCoupon) {
      const discounted = (basePrice * (1 - appliedCoupon.discountPercent / 100)).toFixed(2);
      return `$${discounted}`;
    }

    const sku = plan === "YEARLY" ? "com.fastmatch.premium.yearly" : "com.fastmatch.premium.monthly";
    const storeSub = subscriptions.find((s) => s.productId === sku);
    if (storeSub?.localizedPrice) {
      return storeSub.localizedPrice;
    }

    return `$${basePrice.toFixed(2)}`;
  };

  const handlePurchase = async () => {
    if (appliedCoupon?.discountPercent === 100) {
      try {
        const res: any = await redeemCouponMutation({
          code: appliedCoupon.code,
          plan: selectedPlan.toLowerCase(),
        }).unwrap();
        if (res?.data) {
          dispatch(setGlobalUser(res.data));
          ShowAlertMessage(res.message || "VIP Premium activated successfully!", popTypes.success);
          setView(AppView.HOME);
        }
      } catch (err: any) {
        console.warn("Redeem coupon error:", err);
        ShowAlertMessage(err?.data?.message || "Failed to redeem code", popTypes.error);
      }
      return;
    }
    onUpgrade(selectedPlan);
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

  const handleBack = React.useCallback(() => {
    if (onBack) {
      onBack();
    } else {
      setView(AppView.HOME);
    }
  }, [onBack, setView]);

  return (
    <MobileContainer>
      <View style={styles.spaceBg} />
      <TouchableOpacity
        onPress={handleBack}
        style={styles.closeBtn}
      >
        <Text style={styles.closeIcon}>✕</Text>
      </TouchableOpacity>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isPricingFetching}
            onRefresh={onRefresh}
            tintColor={colors.gold || "#E29547"}
            colors={[colors.gold || "#E29547"]}
          />
        }
      >
        <View style={styles.crownWrap}>
          <Crown size={40} color="#78350F" fill="#78350F" />
        </View>

        <Text style={styles.title}>Go Premium</Text>
        <Text style={styles.subtitle}>Random chat is free. Premium gives you more control over who you meet.</Text>

        {isPremium && (
          <TouchableOpacity
            style={styles.alreadyActiveBanner}
            activeOpacity={0.85}
            onPress={() => setView(AppView.MEMBERSHIP_DETAILS)}
          >
            <Crown size={20} color="#F59E0B" />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.alreadyActiveTitle}>Active VIP Member</Text>
              <Text style={styles.alreadyActiveSubtitle}>Tap here to manage membership & renewal details →</Text>
            </View>
          </TouchableOpacity>
        )}

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

        {/* Promo / Coupon Code Section */}
        <View style={styles.couponContainer}>
          <View style={styles.couponHeader}>
            <Tag size={16} color="#F59E0B" />
            <Text style={styles.couponTitle}>Have a Promo Code?</Text>
          </View>
          <View style={styles.couponInputRow}>
            <TextInput
              style={styles.couponInput}
              placeholder="ENTER CODE"
              placeholderTextColor="#64748B"
              value={couponCode}
              onChangeText={(t) => setCouponCode(t.toUpperCase())}
              autoCapitalize="characters"
              maxLength={20}
              editable={!appliedCoupon}
            />
            {appliedCoupon ? (
              <TouchableOpacity
                style={styles.couponRemoveBtn}
                onPress={() => {
                  setAppliedCoupon(null);
                  setCouponCode("");
                }}
              >
                <Text style={styles.couponRemoveText}>Remove</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.couponApplyBtn}
                onPress={handleApplyCoupon}
                disabled={isApplyingCoupon}
              >
                {isApplyingCoupon ? (
                  <ActivityIndicator size="small" color="#0F172A" />
                ) : (
                  <Text style={styles.couponApplyText}>Apply</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
          {appliedCoupon && (
            <View>
              <View style={styles.appliedBadge}>
                <Sparkles size={14} color="#10B981" />
                <Text style={styles.appliedText}>
                  {appliedCoupon.discountPercent === 100
                    ? `100% OFF Free VIP Access with code ${appliedCoupon.code}`
                    : `${appliedCoupon.discountPercent}% promo applied with code ${appliedCoupon.code}`}
                </Text>
              </View>
              {appliedCoupon.discountPercent < 100 && (
                <View style={[styles.appliedBadge, { backgroundColor: "rgba(245, 158, 11, 0.15)", borderColor: "rgba(245, 158, 11, 0.35)", marginTop: 8 }]}>
                  <AlertCircle size={14} color="#F59E0B" />
                  <Text style={[styles.appliedText, { color: "#FDE68A", fontSize: 11 }]}>
                    Store subscriptions are billed by {Platform.OS === 'ios' ? 'Apple' : 'Google Play'}. To apply discounts on {Platform.OS === 'ios' ? 'Apple Pay' : 'Google Pay'}, redeem an official store promo code in {Platform.OS === 'ios' ? 'App Store' : 'Google Play'} during checkout.
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        <View style={{ width: "100%" }}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handlePurchase}
            disabled={isRedeemingCoupon}
            style={styles.unlockWrapper}
          >
            <LinearGradient
              colors={["#FDE047", "#FACC15", "#F59E0B"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.unlockBtn}
            >
              <View style={styles.unlockBtnInner}>
                <Text style={styles.unlockText}>
                  {appliedCoupon?.discountPercent === 100
                    ? (isRedeemingCoupon ? "Activating VIP..." : "🎁 Activate 100% Free VIP Access")
                    : `${Platform.OS === 'ios' ? ' Pay' : 'G Pay'} • ${getStorePriceForPlan(selectedPlan)} (${selectedPlan === "YEARLY" ? "Yearly" : "Monthly"})`}
                </Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleRestorePurchases}
            style={styles.restoreBtn}
            disabled={isRestoring}
          >
            {isRestoring ? (
              <ActivityIndicator size="small" color="#CBD5E1" />
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <RotateCcw size={14} color="#94A3B8" style={{ marginRight: 6 }} />
                <Text style={styles.restoreBtnText}>
                  Already subscribed? Restore Purchases
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Subscription Terms & Legal Disclosures (Apple Review Guideline 3.1.2) */}
          <View style={styles.legalNoticeBox}>
            <Text style={styles.legalNoticeTitle}>Subscription Terms &amp; Auto-Renewal:</Text>
            <Text style={styles.legalNoticeText}>
              • FastMatch VIP Monthly: $9.00/month (auto-renewable every month).
            </Text>
            <Text style={styles.legalNoticeText}>
              • FastMatch VIP Yearly: $90.00/year (auto-renewable every year).
            </Text>
            <Text style={styles.legalNoticeText}>
              • Payment will be charged to your {Platform.OS === 'ios' ? 'Apple ID' : 'Google Play'} account at confirmation of purchase.
            </Text>
            <Text style={styles.legalNoticeText}>
              • Subscription automatically renews unless auto-renew is turned off at least 24 hours before the end of the current billing cycle.
            </Text>
            <Text style={styles.legalNoticeText}>
              • Your account will be charged for renewal within 24 hours prior to the end of the current period at the rate of the selected plan.
            </Text>
            <Text style={styles.legalNoticeText}>
              • You can manage or cancel your subscriptions anytime by going to your {Platform.OS === 'ios' ? 'App Store' : 'Google Play'} Account Settings after purchase.
            </Text>
            <Text style={styles.legalNoticeText}>
              • Any unused portion of a free trial period, if offered, will be forfeited when purchasing a subscription.
            </Text>

            {/* Direct Links to Terms of Use (EULA) and Privacy Policy */}
            <View style={styles.legalLinksRow}>
              <TouchableOpacity
                onPress={() => {
                  Linking.openURL("https://admin.fastmatch.app/terms.html").catch(() => {
                    setView(AppView.TERMS);
                  });
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.legalLinkText}>Terms of Use (EULA)</Text>
              </TouchableOpacity>
              <Text style={styles.legalDivider}>•</Text>
              <TouchableOpacity
                onPress={() => {
                  Linking.openURL("https://admin.fastmatch.app/privacy.html").catch(() => {
                    setView(AppView.PRIVACY);
                  });
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.legalLinkText}>Privacy Policy</Text>
              </TouchableOpacity>
              <Text style={styles.legalDivider}>•</Text>
              <TouchableOpacity
                onPress={handleRestorePurchases}
                activeOpacity={0.7}
              >
                <Text style={styles.legalLinkText}>Restore Purchases</Text>
              </TouchableOpacity>
            </View>
          </View>
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
  couponContainer: {
    width: "100%",
    backgroundColor: "#0F172A",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  couponHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  couponTitle: {
    color: "#E2E8F0",
    fontSize: 13,
    fontWeight: "bold",
    marginLeft: 6,
  },
  couponInputRow: {
    flexDirection: "row",
    gap: 8,
  },
  couponInput: {
    flex: 1,
    backgroundColor: "#1E293B",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: colors.white,
    fontSize: 13,
    fontWeight: "600",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  couponApplyBtn: {
    backgroundColor: "#F59E0B",
    borderRadius: 10,
    paddingHorizontal: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  couponApplyText: {
    color: "#0F172A",
    fontWeight: "bold",
    fontSize: 13,
  },
  couponRemoveBtn: {
    backgroundColor: "rgba(239,68,68,0.2)",
    borderRadius: 10,
    paddingHorizontal: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  couponRemoveText: {
    color: "#EF4444",
    fontWeight: "bold",
    fontSize: 12,
  },
  appliedBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "rgba(16,185,129,0.12)",
    borderRadius: 8,
  },
  appliedText: {
    color: "#10B981",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 6,
  },
  alreadyActiveBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.4)",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 20,
    width: "100%",
  },
  alreadyActiveTitle: {
    color: "#FFD700",
    fontSize: 14,
    fontWeight: "700",
  },
  alreadyActiveSubtitle: {
    color: "#FEF3C7",
    fontSize: 12,
    marginTop: 2,
    opacity: 0.9,
  },
  restoreBtn: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    marginTop: 10,
    marginBottom: 20,
  },
  restoreBtnText: {
    color: "#94A3B8",
    fontSize: 13,
    fontWeight: "600",
  },
  legalNoticeBox: {
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    padding: 14,
    marginTop: 8,
    marginBottom: 24,
    width: "100%",
  },
  legalNoticeTitle: {
    color: "#FCD34D",
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  legalNoticeText: {
    color: "#94A3B8",
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 4,
  },
  legalLinksRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "wrap",
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.06)",
  },
  legalLinkText: {
    color: "#F59E0B",
    fontSize: 11,
    fontWeight: "700",
    textDecorationLine: "underline",
    paddingHorizontal: 4,
  },
  legalDivider: {
    color: "#64748B",
    fontSize: 11,
    marginHorizontal: 4,
  },
});
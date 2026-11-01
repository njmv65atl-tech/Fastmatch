import * as React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Linking,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { MobileContainer, Header } from "../../components/UIComponents";
import { AppView } from "../../types";
import { colors } from "../../utils/colors";
import {
  Crown,
  CheckCircle2,
  ExternalLink,
  RotateCcw,
  Sparkles,
  Calendar,
  ShieldCheck,
  Zap,
  Clock,
  ChevronRight,
} from "lucide-react-native";
import LinearGradient from "react-native-linear-gradient";
import { useSelector, useDispatch } from "react-redux";
import { userSelector, setGlobalUser } from "../../redux/slices/persistedSlice";
import { ShowAlertMessage, popTypes } from "../../helpers/commonFunctions";
import {
  useWalletHistoryQuery,
  useGetUserProfileQuery,
  useVerifyPurchaseMutation,
} from "../../redux/services/auth";
import { restoreActivePurchases } from "../../utils/iap";
import { useTranslation } from "react-i18next";

interface MembershipDetailsViewProps {
  setView: (view: AppView) => void;
  onBack?: () => void;
}

export const MembershipDetailsView: React.FC<MembershipDetailsViewProps> = ({
  setView,
  onBack,
}) => {
  const user = useSelector(userSelector);
  const dispatch = useDispatch();
  const { t } = useTranslation();

  const [refreshing, setRefreshing] = React.useState(false);
  const [isRestoring, setIsRestoring] = React.useState(false);

  const { data: profileData, refetch: refetchProfile } = useGetUserProfileQuery(
    {},
    { refetchOnMountOrArgChange: true }
  );
  const { data: historyData, isLoading: isLoadingHistory, refetch: refetchHistory } =
    useWalletHistoryQuery({});
  const [verifyPurchaseApi] = useVerifyPurchaseMutation();

  const currentUser = profileData?.data || user;
  const isPremium = currentUser?.isPremium === "premium";

  // Sync fresh profile to Redux
  React.useEffect(() => {
    if (profileData?.data) {
      dispatch(setGlobalUser(profileData.data));
    }
  }, [profileData, dispatch]);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      const [newProfile] = await Promise.all([
        refetchProfile(),
        refetchHistory(),
      ]);
      if (newProfile?.data?.data) {
        dispatch(setGlobalUser(newProfile.data.data));
      }
    } catch (e) {
      console.warn("Pull to refresh error:", e);
    } finally {
      setRefreshing(false);
    }
  }, [refetchProfile, refetchHistory, dispatch]);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      setView(AppView.SETTINGS);
    }
  };

  const handleManageInStore = async () => {
    const storeUrl =
      Platform.OS === "ios"
        ? "https://apps.apple.com/account/subscriptions"
        : "https://play.google.com/store/account/subscriptions";

    try {
      const supported = await Linking.canOpenURL(storeUrl);
      if (supported) {
        await Linking.openURL(storeUrl);
      } else {
        await Linking.openURL("https://play.google.com/store/account/subscriptions");
      }
    } catch (err) {
      console.warn("Could not open store subscriptions URL:", err);
      ShowAlertMessage(
        "Open Google Play > Payments & subscriptions to manage.",
        popTypes.info
      );
    }
  };

  const handleRestorePurchases = async () => {
    setIsRestoring(true);
    try {
      const purchases = await restoreActivePurchases();
      if (!purchases || purchases.length === 0) {
        ShowAlertMessage("No active store purchases found to restore.", popTypes.info);
        setIsRestoring(false);
        return;
      }

      let restoredAny = false;
      for (const purchase of purchases) {
        const prodId = purchase.productId || (purchase as any).productIds?.[0];
        const receipt = purchase.transactionReceipt || purchase.purchaseToken;
        if (prodId && receipt) {
          try {
            const verifyPayload = {
              productId: prodId,
              purchaseToken: purchase.purchaseToken || purchase.transactionId || receipt,
              receipt: receipt,
              platform: Platform.OS,
            };
            const res: any = await verifyPurchaseApi(verifyPayload).unwrap();
            if (res?.data) {
              dispatch(setGlobalUser(res.data));
              restoredAny = true;
            }
          } catch (e) {
            console.warn("Error restoring purchase item:", prodId, e);
          }
        }
      }

      await refetchProfile();
      if (restoredAny) {
        ShowAlertMessage("VIP Membership restored successfully!", popTypes.success);
      } else {
        ShowAlertMessage(
          "Your purchases are up to date.",
          popTypes.info
        );
      }
    } catch (err: any) {
      console.warn("Restore purchases error:", err);
      ShowAlertMessage("Could not restore purchases. Please try again.", popTypes.error);
    } finally {
      setIsRestoring(false);
    }
  };

  // Format expiration / renewal date
  const formatExpiryDate = () => {
    if (currentUser?.subscriptionExpiresAt) {
      const expDate = new Date(currentUser.subscriptionExpiresAt);
      if (!isNaN(expDate.getTime())) {
        return expDate.toLocaleDateString(undefined, {
          year: "numeric",
          month: "long",
          day: "numeric",
        });
      }
    }
    return "Auto-renewing via Google Play";
  };

  const getDaysRemaining = () => {
    if (!currentUser?.subscriptionExpiresAt) return null;
    const expDate = new Date(currentUser.subscriptionExpiresAt).getTime();
    const now = Date.now();
    const diffDays = Math.ceil((expDate - now) / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) return t("membership.expiresToday", { defaultValue: "Expires today" });
    return t("membership.daysRemaining", { days: diffDays, defaultValue: `${diffDays} days remaining` });
  };

  const isTrial = isPremium && currentUser?.subscriptionPlan === "trial";

  const planName =
    currentUser?.subscriptionPlan === "yearly"
      ? t("membership.yearlyPlan", { defaultValue: "FastMatch VIP (Yearly)" })
      : currentUser?.subscriptionPlan === "monthly"
      ? t("membership.monthlyPlan", { defaultValue: "FastMatch VIP (Monthly)" })
      : isTrial
      ? t("membership.trialPlan", { defaultValue: "🎁 FastMatch VIP (Free Trial)" })
      : isPremium
      ? t("membership.vipAccess", { defaultValue: "FastMatch VIP Access" })
      : t("membership.freePlan", { defaultValue: "Free Plan" });

  // Filter subscription billing history and deduplicate
  const seenDates = new Set<string>();
  const subscriptionHistory = (historyData?.data || [])
    .filter(
      (tx: any) =>
        tx.type === "subscription" ||
        tx.type === "trial" ||
        tx.description?.toLowerCase().includes("subscription") ||
        tx.description?.toLowerCase().includes("premium") ||
        tx.description?.toLowerCase().includes("trial")
    )
    .filter((tx: any) => {
      const key = tx.purchaseToken || new Date(tx.createdAt).toISOString().split('T')[0];
      if (seenDates.has(key)) return false;
      seenDates.add(key);
      return true;
    });

  return (
    <MobileContainer>
      <Header title={t("membership.title", { defaultValue: "VIP Membership" })} onBack={handleBack} />

      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* VIP Status Card */}
        <View style={styles.vipCard}>
          <LinearGradient
            colors={
              isTrial
                ? ["#7C3AED", "#A855F7", "#4C1D95"]
                : isPremium
                ? ["#F59E0B", "#D97706", "#78350F"]
                : ["#334155", "#1E293B", "#0F172A"]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardGradient}
          >
            <View style={styles.cardHeader}>
              <View style={styles.crownBadge}>
                <Crown size={28} color="#FFD700" />
              </View>
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor: isTrial
                      ? "rgba(245, 158, 11, 0.25)"
                      : isPremium
                      ? "rgba(16, 185, 129, 0.25)"
                      : "rgba(148, 163, 184, 0.2)",
                  },
                ]}
              >
                <View
                  style={[
                    styles.statusDot,
                    {
                      backgroundColor: isTrial
                        ? "#F59E0B"
                        : isPremium
                        ? "#10B981"
                        : "#94A3B8",
                    },
                  ]}
                />
                <Text
                  style={[
                    styles.statusText,
                    {
                      color: isTrial
                        ? "#FDE68A"
                        : isPremium
                        ? "#34D399"
                        : "#CBD5E1",
                    },
                  ]}
                >
                  {isTrial ? t("membership.trial", { defaultValue: "FREE TRIAL" }) : isPremium ? t("membership.active", { defaultValue: "ACTIVE" }) : t("membership.inactive", { defaultValue: "INACTIVE" })}
                </Text>
              </View>
            </View>

            <Text style={styles.planTitle}>{planName}</Text>
            <Text style={styles.planSubtitle}>
              {isTrial
                ? t("membership.trialSubtitle", { defaultValue: "You are currently enjoying the Welcome VIP Free Trial. Upgrade anytime to keep full premium features uninterrupted!" })
                : isPremium
                ? t("membership.activeSubtitle", { defaultValue: "Full unrestricted access to all premium dating & matching features." })
                : t("membership.inactiveSubtitle", { defaultValue: "Upgrade to FastMatch VIP to unlock premium features & filters." })}
            </Text>

            {isPremium && (
              <View style={styles.metaContainer}>
                <View style={styles.metaRow}>
                  <Calendar size={16} color="#FDE68A" />
                  <Text style={styles.metaLabel}>{t("membership.renewalExpiry", { defaultValue: "Renewal / Expiry:" })}</Text>
                  <Text style={styles.metaValue}>{formatExpiryDate()}</Text>
                </View>
                {getDaysRemaining() && (
                  <View style={styles.metaRow}>
                    <Clock size={16} color="#FDE68A" />
                    <Text style={styles.metaLabel}>{t("membership.validity", { defaultValue: "Validity:" })}</Text>
                    <Text style={[styles.metaValue, { color: "#34D399" }]}>
                      {getDaysRemaining()}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </LinearGradient>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsRow}>
          {isTrial ? (
            <TouchableOpacity
              style={[styles.actionBtnPrimary, { backgroundColor: "#F59E0B" }]}
              activeOpacity={0.8}
              onPress={() => setView(AppView.SUBSCRIPTION)}
            >
              <Crown size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.actionBtnTextPrimary}>
                {t("membership.upgradeFullVip", { defaultValue: "Upgrade to Full VIP Plan" })}
              </Text>
            </TouchableOpacity>
          ) : isPremium ? (
            <TouchableOpacity
              style={styles.actionBtnPrimary}
              activeOpacity={0.8}
              onPress={handleManageInStore}
            >
              <ExternalLink size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.actionBtnTextPrimary}>
                {t("membership.manageInStore", { store: Platform.OS === "ios" ? "App Store" : "Google Play", defaultValue: `Manage in ${Platform.OS === "ios" ? "App Store" : "Google Play"}` })}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.actionBtnPrimary}
              activeOpacity={0.8}
              onPress={() => setView(AppView.SUBSCRIPTION)}
            >
              <Zap size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.actionBtnTextPrimary}>
                {t("membership.upgradeVip", { defaultValue: "Upgrade to VIP" })}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.actionBtnSecondary}
            activeOpacity={0.8}
            onPress={handleRestorePurchases}
            disabled={isRestoring}
          >
            {isRestoring ? (
              <ActivityIndicator size="small" color="#CBD5E1" />
            ) : (
              <>
                <RotateCcw size={16} color="#CBD5E1" style={{ marginRight: 8 }} />
                <Text style={styles.actionBtnTextSecondary}>
                  {t("membership.restorePurchases", { defaultValue: "Restore Purchases" })}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* VIP Benefits Overview */}
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionTitle}>
            {t("membership.privilegesTitle", { defaultValue: "Your VIP Privileges" })}
          </Text>
          <View style={styles.benefitsCard}>
            <BenefitRow
              icon={Zap}
              title={t("membership.privilege1Title", { defaultValue: "Unlimited Video Calls & Rewinds" })}
              desc={t("membership.privilege1Desc", { defaultValue: "Meet verified partners with no daily call limits or wait times." })}
              active={isPremium}
            />
            <BenefitRow
              icon={Sparkles}
              title={t("membership.privilege2Title", { defaultValue: "Super Match Search Filters" })}
              desc={t("membership.privilege2Desc", { defaultValue: "Filter matches by country, gender, and preferred age bracket." })}
              active={isPremium}
            />
            <BenefitRow
              icon={ShieldCheck}
              title={t("membership.privilege3Title", { defaultValue: "Zero Ads & Priority Connect" })}
              desc={t("membership.privilege3Desc", { defaultValue: "Enjoy uninterrupted conversations with priority low-latency servers." })}
              active={isPremium}
            />
            <BenefitRow
              icon={Crown}
              title={t("membership.privilege4Title", { defaultValue: "Exclusive Gold VIP Badge" })}
              desc={t("membership.privilege4Desc", { defaultValue: "Stand out with a verified Gold VIP crown on your profile & live video." })}
              active={isPremium}
            />
          </View>
        </View>

        {/* Membership Billing History */}
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionTitle}>
            {t("membership.historyTitle", { defaultValue: "Subscription History" })}
          </Text>
          {isLoadingHistory ? (
            <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 15 }} />
          ) : subscriptionHistory.length > 0 ? (
            subscriptionHistory.map((tx: any) => (
              <View key={tx._id} style={styles.historyCard}>
                <View style={styles.historyLeft}>
                  <View style={styles.historyIconWrap}>
                    <Crown size={20} color="#F59E0B" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.historyTitle}>
                      {tx.description || "FastMatch VIP Subscription"}
                    </Text>
                    <Text style={styles.historyDate}>
                      {new Date(tx.createdAt).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </Text>
                  </View>
                </View>
                <View style={styles.historyStatusPill}>
                  <CheckCircle2 size={12} color="#10B981" />
                  <Text style={styles.historyStatusText}>
                    {t("membership.billed", { defaultValue: "Billed" })}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyHistoryBox}>
              <Text style={styles.emptyHistoryText}>
                {isPremium
                  ? t("membership.activeManaged", { defaultValue: "Active subscription managed securely by Google Play Billing." })
                  : t("membership.emptyHistory", { defaultValue: "No subscription history recorded yet." })}
              </Text>
            </View>
          )}
        </View>

        {/* Management Note */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>
            {t("membership.policyTitle", { defaultValue: "Subscription & Cancellation Policy" })}
          </Text>
          <Text style={styles.infoDesc}>
            {t("membership.policyDesc", { defaultValue: "Subscriptions automatically renew unless canceled in your Google Play Store account at least 24 hours before the end of the current billing cycle. You can change plans or cancel anytime in Google Play without losing access until your current period ends." })}
          </Text>
        </View>
      </ScrollView>
    </MobileContainer>
  );
};

const BenefitRow: React.FC<{
  icon: any;
  title: string;
  desc: string;
  active: boolean;
}> = ({ icon: Icon, title, desc, active }) => (
  <View style={styles.benefitRow}>
    <View style={[styles.benefitIconBox, active && styles.benefitIconActive]}>
      <Icon size={20} color={active ? "#F59E0B" : "#94A3B8"} />
    </View>
    <View style={styles.benefitTextWrap}>
      <Text style={[styles.benefitTitle, active && styles.benefitTitleActive]}>
        {title}
      </Text>
      <Text style={styles.benefitDesc}>{desc}</Text>
    </View>
    {active && <CheckCircle2 size={18} color="#10B981" style={{ marginLeft: 8 }} />}
  </View>
);

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 110,
  },
  vipCard: {
    borderRadius: 24,
    overflow: "hidden",
    marginBottom: 20,
    elevation: 6,
    shadowColor: "#F59E0B",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  cardGradient: {
    padding: 24,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  crownBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(0,0,0,0.25)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,215,0,0.4)",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  planTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 6,
  },
  planSubtitle: {
    fontSize: 14,
    color: "#FEF3C7",
    lineHeight: 20,
    marginBottom: 20,
    opacity: 0.9,
  },
  metaContainer: {
    backgroundColor: "rgba(0,0,0,0.25)",
    borderRadius: 16,
    padding: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  metaLabel: {
    fontSize: 13,
    color: "#FDE68A",
    marginLeft: 8,
    marginRight: 6,
  },
  metaValue: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  actionsRow: {
    flexDirection: "column",
    gap: 12,
    marginBottom: 28,
  },
  actionBtnPrimary: {
    flexDirection: "row",
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  actionBtnTextPrimary: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  actionBtnSecondary: {
    flexDirection: "row",
    backgroundColor: "rgba(30, 41, 59, 0.9)",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  actionBtnTextSecondary: {
    color: "#CBD5E1",
    fontSize: 14,
    fontWeight: "600",
  },
  sectionWrap: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 14,
  },
  benefitsCard: {
    backgroundColor: "rgba(30, 41, 59, 0.6)",
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  benefitRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  benefitIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.05)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  benefitIconActive: {
    backgroundColor: "rgba(245, 158, 11, 0.15)",
  },
  benefitTextWrap: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#94A3B8",
    marginBottom: 2,
  },
  benefitTitleActive: {
    color: "#FFFFFF",
  },
  benefitDesc: {
    fontSize: 12,
    color: "#64748B",
    lineHeight: 16,
  },
  historyCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(30, 41, 59, 0.6)",
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  historyLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  historyIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 2,
  },
  historyDate: {
    fontSize: 12,
    color: "#94A3B8",
  },
  historyStatusPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  historyStatusText: {
    fontSize: 11,
    color: "#34D399",
    fontWeight: "700",
  },
  emptyHistoryBox: {
    backgroundColor: "rgba(30, 41, 59, 0.4)",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  emptyHistoryText: {
    fontSize: 13,
    color: "#94A3B8",
    textAlign: "center",
    lineHeight: 18,
  },
  infoCard: {
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    marginTop: 8,
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#94A3B8",
    marginBottom: 6,
  },
  infoDesc: {
    fontSize: 12,
    color: "#64748B",
    lineHeight: 18,
  },
});

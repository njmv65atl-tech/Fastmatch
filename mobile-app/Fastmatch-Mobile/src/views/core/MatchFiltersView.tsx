import * as React from "react";
import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  Image,
} from "react-native";
import { MobileContainer } from "../../components/UIComponents";
import { AppView, User, Gender } from "../../types";
import {
  Crown,
  MapPin,
  Users,
  Globe,
  SlidersHorizontal,
  ArrowLeft,
  ArrowRight,
  Check,
  Heart,
} from "lucide-react-native";
import LinearGradient from "react-native-linear-gradient";
import { colors } from "../../utils/colors";
import { useBackHandler } from "../../components/BackHandlerWrapper";
import NetInfo from "@react-native-community/netinfo";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { popTypes, ShowAlertMessage } from "../../helpers/commonFunctions";

// ─── Image Avatar Components (Using User's Provided Art) ──────
const BoyAvatar = ({ size = 56 }: { size?: number }) => (
  <View style={[styles.avatarCircleInner, { width: size, height: size, borderRadius: size / 2 }]}>
    <Image
      source={require("../../assets/images/avatar_boy.png")}
      style={{ width: size * 0.96, height: size * 0.96, marginTop: 4 }}
      resizeMode="contain"
    />
  </View>
);

const GirlAvatar = ({ size = 56 }: { size?: number }) => (
  <View style={[styles.avatarCircleInner, { width: size, height: size, borderRadius: size / 2 }]}>
    <Image
      source={require("../../assets/images/avatar_girl.png")}
      style={{ width: size * 0.96, height: size * 0.96, marginTop: 4 }}
      resizeMode="contain"
    />
  </View>
);

const CoupleAvatar = ({ size = 56 }: { size?: number }) => (
  <View style={[styles.avatarCircleInner, { width: size, height: size, borderRadius: size / 2 }]}>
    {/* Boy on Left */}
    <Image
      source={require("../../assets/images/avatar_boy.png")}
      style={{
        width: size * 0.74,
        height: size * 0.74,
        position: "absolute",
        left: 0,
        bottom: -1,
      }}
      resizeMode="contain"
    />
    {/* Girl on Right */}
    <Image
      source={require("../../assets/images/avatar_girl.png")}
      style={{
        width: size * 0.74,
        height: size * 0.74,
        position: "absolute",
        right: 0,
        bottom: -1,
      }}
      resizeMode="contain"
    />
    {/* Floating Heart between them */}
    <View style={styles.coupleHeartWrap}>
      <Heart size={10} color="#FFF" fill="#EC4899" />
    </View>
  </View>
);

interface CoreProps {
  user: User;
  setView: (view: AppView, params?: any) => void;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

export const MatchFiltersView: React.FC<CoreProps> = ({ user, setView }) => {
  const insets = useSafeAreaInsets();
  const [selectedGender, setSelectedGender] = useState<Gender>(Gender.ANY);
  const [selectedLocation, setSelectedLocation] = useState<
    "any" | "my_country"
  >("any");
  const [selectedLanguage, setSelectedLanguage] = useState<
    "any" | "my_language"
  >("any");
  const [selectedAge, setSelectedAge] = useState<
    "any" | "18-24" | "25-34" | "35+"
  >("any");

  const handleBack = React.useCallback(() => {
    setView(AppView.HOME);
  }, [setView]);

  useBackHandler(handleBack);

  const checkPremium = (isFreeFeature: boolean, featureName: string) => {
    if (!isFreeFeature && user?.isPremium !== "premium") {
      ShowAlertMessage(
        `Premium required for ${featureName} preference`,
        popTypes.info
      );
      setView(AppView.SUBSCRIPTION);
      return false;
    }
    return true;
  };

  const handleStartMatching = async () => {
    try {
      const state = await NetInfo.fetch();
      if (state && state.isConnected === false) {
        ShowAlertMessage(
          "Please check your internet connection",
          popTypes.error
        );
        return;
      }
    } catch (e) {
      console.warn("NetInfo fetch error:", e);
    }

    let preference: "everyone" | "male" | "female" = "everyone";
    if (selectedGender === Gender.MALE) preference = "male";
    else if (selectedGender === Gender.FEMALE) preference = "female";

    setView(AppView.MATCH_FOUND, {
      preference,
      locationMode: selectedLocation,
      languageMode: selectedLanguage,
      ageRange: selectedAge,
    });
  };

  // ─── Gender Card (Flex: 1 to guarantee 100% fit inside section) ─────
  const GenderCard = ({
    label,
    subtitle,
    value,
    avatar,
    isFree,
  }: {
    label: string;
    subtitle: string;
    value: Gender;
    avatar: React.ReactNode;
    isFree: boolean;
  }) => {
    const isActive = selectedGender === value;

    return (
      <TouchableOpacity
        onPress={() => {
          if (checkPremium(isFree, "Gender")) {
            setSelectedGender(value);
          }
        }}
        style={[styles.genderCard, isActive && styles.genderCardActive]}
        activeOpacity={0.75}
      >
        {/* Radio Indicator (Top Right - Matches Reference Screen) */}
        <View
          style={[
            styles.genderRadioCircle,
            isActive && styles.genderRadioCircleActive,
          ]}
        >
          {isActive && <Check size={11} color="#FFF" strokeWidth={3} />}
        </View>

        {/* Avatar container */}
        <View style={styles.genderAvatarContainer}>
          {avatar}
        </View>

        {/* Label & Subtitle */}
        <Text
          style={[styles.genderLabel, isActive && styles.genderLabelActive]}
          numberOfLines={1}
        >
          {label}
        </Text>
        <Text style={styles.genderSubLabel} numberOfLines={1}>
          {subtitle}
        </Text>

        {/* Pro badge */}
        {!isFree && user?.isPremium !== "premium" && (
          <LinearGradient
            colors={["#F59E0B", "#D97706"]}
            style={styles.proBadgeSmall}
          >
            <Crown size={8} color="#FFF" />
            <Text style={styles.proBadgeTextSmall}>PRO</Text>
          </LinearGradient>
        )}
      </TouchableOpacity>
    );
  };

  // ─── Age Card (2x2 Grid) ────────────────────────────
  const AgeCard = ({
    label,
    subtitle,
    value,
    isFree,
  }: {
    label: string;
    subtitle: string;
    value: "any" | "18-24" | "25-34" | "35+";
    isFree: boolean;
  }) => {
    const isActive = selectedAge === value;

    return (
      <TouchableOpacity
        onPress={() => {
          if (checkPremium(isFree, "Age Range")) {
            setSelectedAge(value);
          }
        }}
        style={[styles.ageCard, isActive && styles.ageCardActive]}
        activeOpacity={0.75}
      >
        <View style={styles.ageCardContent}>
          <View style={{ flex: 1 }}>
            <Text
              style={[styles.ageLabel, isActive && styles.ageLabelActive]}
              numberOfLines={1}
            >
              {label}
            </Text>
            <Text style={styles.ageSubLabel} numberOfLines={1}>
              {subtitle}
            </Text>
          </View>
          <View
            style={[
              styles.checkCircle,
              isActive && styles.checkCircleActive,
            ]}
          >
            {isActive && <Check size={12} color="#FFF" strokeWidth={3} />}
          </View>
        </View>
        {!isFree && user?.isPremium !== "premium" && (
          <LinearGradient
            colors={["#F59E0B", "#D97706"]}
            style={styles.proBadgeInline}
          >
            <Crown size={8} color="#FFF" />
            <Text style={styles.proBadgeTextSmall}>PRO</Text>
          </LinearGradient>
        )}
      </TouchableOpacity>
    );
  };

  // ─── Simple Option Card (Location / Language) ─────────
  const SimpleOptionCard = ({
    label,
    subtitle,
    value,
    currentValue,
    setValue,
    isFree,
    featureName,
  }: {
    label: string;
    subtitle?: string;
    value: any;
    currentValue: any;
    setValue: (val: any) => void;
    isFree: boolean;
    featureName: string;
  }) => {
    const isActive = currentValue === value;
    return (
      <TouchableOpacity
        onPress={() => {
          if (checkPremium(isFree, featureName)) {
            setValue(value);
          }
        }}
        style={[styles.simpleCard, isActive && styles.simpleCardActive]}
        activeOpacity={0.75}
      >
        <View style={{ flex: 1 }}>
          <Text
            style={[
              styles.simpleLabel,
              isActive && styles.simpleLabelActive,
            ]}
          >
            {label}
          </Text>
          {subtitle && (
            <Text style={styles.simpleSubLabel}>{subtitle}</Text>
          )}
        </View>
        <View
          style={[styles.checkCircle, isActive && styles.checkCircleActive]}
        >
          {isActive && <Check size={12} color="#FFF" strokeWidth={3} />}
        </View>
        {!isFree && user?.isPremium !== "premium" && (
          <LinearGradient
            colors={["#F59E0B", "#D97706"]}
            style={[styles.proBadgeInline, { marginLeft: 8 }]}
          >
            <Crown size={8} color="#FFF" />
            <Text style={styles.proBadgeTextSmall}>PRO</Text>
          </LinearGradient>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <MobileContainer edges={["top"]}>
      <View style={styles.mainContainer}>
        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={handleBack}
            style={styles.backBtn}
            activeOpacity={0.8}
          >
            <ArrowLeft color={colors.textPrimary} size={22} />
          </TouchableOpacity>
          <View style={styles.headerTitleGroup}>
            <Text style={styles.headerTitle}>Match Preferences</Text>
            <Text style={styles.headerSubtitle}>
              Customize who you connect with
            </Text>
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* ── Section: Gender Preference ── */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View
                style={[
                  styles.sectionIconWrap,
                  { backgroundColor: "rgba(99, 102, 241, 0.15)" },
                ]}
              >
                <Users size={14} color="#6366F1" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionTitle}>GENDER PREFERENCE</Text>
                <Text style={styles.sectionSubtitle}>
                  Choose who you'd like to see in your matches.
                </Text>
              </View>
            </View>
            <View style={styles.genderRow}>
              <GenderCard
                label="Everyone"
                subtitle="Men & Women"
                value={Gender.ANY}
                avatar={<CoupleAvatar size={54} />}
                isFree={true}
              />
              <GenderCard
                label="Male Only"
                subtitle="Men"
                value={Gender.MALE}
                avatar={<BoyAvatar size={54} />}
                isFree={false}
              />
              <GenderCard
                label="Female Only"
                subtitle="Women"
                value={Gender.FEMALE}
                avatar={<GirlAvatar size={54} />}
                isFree={false}
              />
            </View>
          </View>

          {/* ── Section: Age Range (2x2 Grid) ── */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View
                style={[
                  styles.sectionIconWrap,
                  { backgroundColor: "rgba(245, 158, 11, 0.15)" },
                ]}
              >
                <SlidersHorizontal size={14} color="#F59E0B" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionTitle}>AGE RANGE</Text>
                <Text style={styles.sectionSubtitle}>
                  Select the age range for your matches.
                </Text>
              </View>
            </View>
            <View style={styles.ageGrid}>
              <AgeCard
                label="Any Age"
                subtitle="All age ranges"
                value="any"
                isFree={true}
              />
              <AgeCard
                label="18 – 24 years"
                subtitle="Late teens to mid 20s"
                value="18-24"
                isFree={false}
              />
              <AgeCard
                label="25 – 34 years"
                subtitle="Mid 20s to early 30s"
                value="25-34"
                isFree={false}
              />
              <AgeCard
                label="35+ years"
                subtitle="35 and older"
                value="35+"
                isFree={false}
              />
            </View>
          </View>

          {/* ── Section: Location ── */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View
                style={[
                  styles.sectionIconWrap,
                  { backgroundColor: "rgba(16, 185, 129, 0.15)" },
                ]}
              >
                <MapPin size={14} color="#10B981" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionTitle}>LOCATION</Text>
                <Text style={styles.sectionSubtitle}>
                  Choose where you'd like to find matches.
                </Text>
              </View>
            </View>
            <View style={styles.simpleList}>
              <SimpleOptionCard
                label="Global (Anywhere)"
                subtitle="Match with people worldwide"
                value="any"
                currentValue={selectedLocation}
                setValue={setSelectedLocation}
                isFree={true}
                featureName="Location"
              />
              <SimpleOptionCard
                label="My Country Only"
                subtitle="Match within your country"
                value="my_country"
                currentValue={selectedLocation}
                setValue={setSelectedLocation}
                isFree={false}
                featureName="Location"
              />
            </View>
          </View>

          {/* ── Section: Language ── */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View
                style={[
                  styles.sectionIconWrap,
                  { backgroundColor: "rgba(59, 130, 246, 0.15)" },
                ]}
              >
                <Globe size={14} color="#3B82F6" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionTitle}>LANGUAGE</Text>
                <Text style={styles.sectionSubtitle}>
                  Prefer matches who speak your language.
                </Text>
              </View>
            </View>
            <View style={styles.simpleList}>
              <SimpleOptionCard
                label="Any Language"
                subtitle="No language preference"
                value="any"
                currentValue={selectedLanguage}
                setValue={setSelectedLanguage}
                isFree={true}
                featureName="Language"
              />
              <SimpleOptionCard
                label="My Language"
                subtitle="Speak the same language"
                value="my_language"
                currentValue={selectedLanguage}
                setValue={setSelectedLanguage}
                isFree={true}
                featureName="Language"
              />
            </View>
          </View>
        </ScrollView>

        {/* ── Fixed Bottom Button ── */}
        <View
          style={[
            styles.fixedBottomBar,
            {
              paddingBottom:
                Math.max(
                  insets.bottom,
                  Platform.OS === "ios" ? 34 : 16
                ) + 12,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.startMatchBtn}
            onPress={handleStartMatching}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={["#7C3AED", "#6366F1"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.startMatchGradient}
            >
              <Text style={styles.startMatchBtnText}>Continue to Explore</Text>
              <ArrowRight size={18} color="#FFF" strokeWidth={2.5} />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </MobileContainer>
  );
};

// ═════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.surfaceAlt,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitleGroup: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.textPlaceholder,
    marginTop: 2,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 20,
    gap: 12,
  },

  // ── Section Card ──
  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 10,
  },
  sectionIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 1,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: "#F59E0B",
    letterSpacing: 1,
  },
  sectionSubtitle: {
    fontSize: 11,
    color: colors.textPlaceholder,
    marginTop: 2,
  },

  // ── Gender Cards ──
  genderRow: {
    flexDirection: "row",
    gap: 8,
  },
  genderCard: {
    flex: 1,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 4,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "transparent",
    position: "relative",
  },
  genderCardActive: {
    borderColor: "#6366F1",
    backgroundColor: "rgba(99, 102, 241, 0.1)",
    shadowColor: "#6366F1",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  genderRadioCircle: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: colors.borderSlate,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
    zIndex: 10,
  },
  genderRadioCircleActive: {
    borderColor: "#6366F1",
    backgroundColor: "#6366F1",
  },
  genderAvatarContainer: {
    marginBottom: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarCircleInner: {
    backgroundColor: "rgba(99, 102, 241, 0.12)",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    position: "relative",
  },
  coupleHeartWrap: {
    position: "absolute",
    top: 2,
    alignSelf: "center",
    backgroundColor: "rgba(236, 72, 153, 0.25)",
    borderRadius: 8,
    padding: 2,
  },
  genderLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textMuted,
    textAlign: "center",
  },
  genderLabelActive: {
    color: "#FFFFFF",
  },
  genderSubLabel: {
    fontSize: 9,
    color: colors.textPlaceholder,
    textAlign: "center",
    marginTop: 1,
  },
  proBadgeSmall: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 5,
    gap: 2,
    marginTop: 4,
  },
  proBadgeTextSmall: {
    color: "#FFF",
    fontSize: 8,
    fontWeight: "800",
  },

  // ── Age Grid ──
  ageGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 8,
  },
  ageCard: {
    width: "48.5%",
    backgroundColor: colors.surfaceAlt,
    borderRadius: 12,
    padding: 10,
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  ageCardActive: {
    borderColor: "#6366F1",
    backgroundColor: "rgba(99, 102, 241, 0.1)",
  },
  ageCardContent: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  ageLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textMuted,
  },
  ageLabelActive: {
    color: "#FFFFFF",
  },
  ageSubLabel: {
    fontSize: 10,
    color: colors.textPlaceholder,
    marginTop: 2,
  },

  // ── Check Circle ──
  checkCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: colors.borderSlate,
    justifyContent: "center",
    alignItems: "center",
  },
  checkCircleActive: {
    borderColor: "#6366F1",
    backgroundColor: "#6366F1",
  },

  // ── Simple Cards (Location / Language) ──
  simpleList: {
    gap: 8,
  },
  simpleCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceAlt,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  simpleCardActive: {
    borderColor: "#6366F1",
    backgroundColor: "rgba(99, 102, 241, 0.1)",
  },
  simpleLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textMuted,
  },
  simpleLabelActive: {
    color: "#FFFFFF",
  },
  simpleSubLabel: {
    fontSize: 10,
    color: colors.textPlaceholder,
    marginTop: 1,
  },

  // ── Pro Badge Inline ──
  proBadgeInline: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 5,
    gap: 2,
  },

  // ── Bottom Bar ──
  fixedBottomBar: {
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  startMatchBtn: {
    borderRadius: 16,
    overflow: "hidden",
    elevation: 10,
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  startMatchGradient: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 15,
    gap: 8,
  },
  startMatchBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 0.3,
  },
});

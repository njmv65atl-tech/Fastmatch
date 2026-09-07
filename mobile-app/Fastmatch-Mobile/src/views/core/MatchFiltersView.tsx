import * as React from "react";
import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  Dimensions,
} from "react-native";
import Svg, { Circle, Path, Rect, Ellipse, G } from "react-native-svg";
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

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ─── SVG Avatar Icons ─────────────────────────────────────────
const MaleAvatar = ({ size = 56 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 64 64">
    {/* Head */}
    <Circle cx="32" cy="24" r="12" fill="#D4A574" />
    {/* Hair - dark */}
    <Path
      d="M20 20 C20 12, 44 12, 44 20 C44 16, 40 13, 32 13 C24 13, 20 16, 20 20Z"
      fill="#2D3748"
    />
    <Path d="M20 20 C19 16, 20 12, 24 11 L22 20Z" fill="#2D3748" />
    <Path d="M44 20 C45 16, 44 12, 40 11 L42 20Z" fill="#2D3748" />
    {/* Eyes */}
    <Circle cx="27" cy="24" r="1.5" fill="#2D3748" />
    <Circle cx="37" cy="24" r="1.5" fill="#2D3748" />
    {/* Smile */}
    <Path
      d="M28 29 Q32 32 36 29"
      stroke="#2D3748"
      strokeWidth="1.2"
      fill="none"
      strokeLinecap="round"
    />
    {/* Body / Shirt */}
    <Path
      d="M18 52 C18 40, 22 36, 32 36 C42 36, 46 40, 46 52Z"
      fill="#6366F1"
    />
    {/* Collar */}
    <Path
      d="M28 36 L32 42 L36 36"
      stroke="#4F46E5"
      strokeWidth="1.5"
      fill="none"
    />
  </Svg>
);

const FemaleAvatar = ({ size = 56 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 64 64">
    {/* Head */}
    <Circle cx="32" cy="24" r="12" fill="#E8B89D" />
    {/* Hair - Blonde */}
    <Path
      d="M18 24 C18 10, 46 10, 46 24 C46 18, 42 13, 32 12 C22 13, 18 18, 18 24Z"
      fill="#F0C75E"
    />
    {/* Side hair strands */}
    <Path
      d="M18 24 C17 28, 17 33, 19 36"
      stroke="#F0C75E"
      strokeWidth="4"
      fill="none"
      strokeLinecap="round"
    />
    <Path
      d="M46 24 C47 28, 47 33, 45 36"
      stroke="#F0C75E"
      strokeWidth="4"
      fill="none"
      strokeLinecap="round"
    />
    {/* Eyes */}
    <Circle cx="27" cy="24" r="1.5" fill="#2D3748" />
    <Circle cx="37" cy="24" r="1.5" fill="#2D3748" />
    {/* Eyelashes */}
    <Path d="M25 22.5 L24 21.5" stroke="#2D3748" strokeWidth="0.8" />
    <Path d="M39 22.5 L40 21.5" stroke="#2D3748" strokeWidth="0.8" />
    {/* Lips */}
    <Path
      d="M28 29 Q32 33 36 29"
      stroke="#E57373"
      strokeWidth="1.3"
      fill="none"
      strokeLinecap="round"
    />
    {/* Body / Dress */}
    <Path
      d="M18 52 C18 40, 22 36, 32 36 C42 36, 46 40, 46 52Z"
      fill="#A855F7"
    />
  </Svg>
);

const CoupleAvatar = ({ size = 56 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 80 64">
    {/* Male - Left */}
    <G transform="translate(-4, 0)">
      {/* Head */}
      <Circle cx="28" cy="22" r="10" fill="#D4A574" />
      {/* Hair */}
      <Path
        d="M18 18 C18 11, 38 11, 38 18 C38 14, 35 12, 28 12 C21 12, 18 14, 18 18Z"
        fill="#2D3748"
      />
      {/* Eyes */}
      <Circle cx="24" cy="22" r="1.2" fill="#2D3748" />
      <Circle cx="32" cy="22" r="1.2" fill="#2D3748" />
      {/* Smile */}
      <Path
        d="M25 26 Q28 28.5 31 26"
        stroke="#2D3748"
        strokeWidth="1"
        fill="none"
        strokeLinecap="round"
      />
      {/* Body */}
      <Path
        d="M16 50 C16 39, 19 34, 28 34 C37 34, 40 39, 40 50Z"
        fill="#6366F1"
      />
    </G>
    {/* Female - Right */}
    <G transform="translate(4, 0)">
      {/* Head */}
      <Circle cx="52" cy="22" r="10" fill="#E8B89D" />
      {/* Hair - Blonde */}
      <Path
        d="M42 22 C42 11, 62 11, 62 22 C62 16, 58 12, 52 12 C46 12, 42 16, 42 22Z"
        fill="#F0C75E"
      />
      <Path
        d="M42 22 C41 26, 41 30, 43 33"
        stroke="#F0C75E"
        strokeWidth="3.5"
        fill="none"
        strokeLinecap="round"
      />
      <Path
        d="M62 22 C63 26, 63 30, 61 33"
        stroke="#F0C75E"
        strokeWidth="3.5"
        fill="none"
        strokeLinecap="round"
      />
      {/* Eyes */}
      <Circle cx="48" cy="22" r="1.2" fill="#2D3748" />
      <Circle cx="56" cy="22" r="1.2" fill="#2D3748" />
      {/* Smile */}
      <Path
        d="M49 26 Q52 28.5 55 26"
        stroke="#2D3748"
        strokeWidth="1"
        fill="none"
        strokeLinecap="round"
      />
      {/* Body */}
      <Path
        d="M40 50 C40 39, 43 34, 52 34 C61 34, 64 39, 64 50Z"
        fill="#A855F7"
      />
    </G>
    {/* Heart between them */}
    <Path
      d="M38 16 C38 14, 40 12, 42 14 C44 12, 46 14, 46 16 C46 19, 42 22, 42 22 C42 22, 38 19, 38 16Z"
      fill="#EF4444"
    />
  </Svg>
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

  // ─── Gender Card ─────────────────────────────────
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
    const cardWidth = (SCREEN_WIDTH - 32 - 16) / 3; // 16px padding each side + 8*2 gap

    return (
      <TouchableOpacity
        onPress={() => {
          if (checkPremium(isFree, "Gender")) {
            setSelectedGender(value);
          }
        }}
        style={[
          styles.genderCard,
          { width: cardWidth },
          isActive && styles.genderCardActive,
        ]}
        activeOpacity={0.75}
      >
        {/* Selection badge: heart with checkmark */}
        {isActive && (
          <View style={styles.genderBadge}>
            <Heart size={16} color="#FFF" fill="#6366F1" />
            <View style={styles.genderBadgeCheck}>
              <Check size={8} color="#FFF" strokeWidth={3} />
            </View>
          </View>
        )}
        {/* Unselected radio circle */}
        {!isActive && <View style={styles.genderRadio} />}

        {/* Avatar circle */}
        <View
          style={[
            styles.genderAvatarCircle,
            isActive && styles.genderAvatarCircleActive,
          ]}
        >
          {avatar}
        </View>

        {/* Label */}
        <Text
          style={[styles.genderLabel, isActive && styles.genderLabelActive]}
          numberOfLines={1}
        >
          {label}
        </Text>
        <Text style={styles.genderSubLabel}>{subtitle}</Text>

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
    const cardWidth = (SCREEN_WIDTH - 32 - 24 - 10) / 2; // padding + section padding + gap

    return (
      <TouchableOpacity
        onPress={() => {
          if (checkPremium(isFree, "Age Range")) {
            setSelectedAge(value);
          }
        }}
        style={[styles.ageCard, { width: cardWidth }, isActive && styles.ageCardActive]}
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
                avatar={<CoupleAvatar size={48} />}
                isFree={true}
              />
              <GenderCard
                label="Male Only"
                subtitle="Men"
                value={Gender.MALE}
                avatar={<MaleAvatar size={48} />}
                isFree={false}
              />
              <GenderCard
                label="Female Only"
                subtitle="Women"
                value={Gender.FEMALE}
                avatar={<FemaleAvatar size={48} />}
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
    justifyContent: "space-between",
    gap: 6,
  },
  genderCard: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 6,
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
  genderBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    zIndex: 10,
  },
  genderBadgeCheck: {
    position: "absolute",
    top: -2,
    right: -4,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#22C55E",
    justifyContent: "center",
    alignItems: "center",
  },
  genderRadio: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: colors.borderSlate,
  },
  genderAvatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(99, 102, 241, 0.12)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
    overflow: "hidden",
  },
  genderAvatarCircleActive: {
    backgroundColor: "rgba(99, 102, 241, 0.2)",
  },
  genderLabel: {
    fontSize: 12,
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
    gap: 8,
  },
  ageCard: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 12,
    padding: 12,
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
    fontSize: 13,
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
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
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

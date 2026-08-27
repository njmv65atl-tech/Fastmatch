import * as React from "react";
import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  FlatList,
  Image,
  TextInput,
  Modal,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { MobileContainer, Button, Header } from "../../components/UIComponents";
import { AppView, UserRole, User, Gender } from "../../types";
import { Crown, MapPin, Users, Globe, Search, SlidersHorizontal, X, ArrowLeft } from "lucide-react-native";
import Svg, { Path } from "react-native-svg";
import { colors } from "../../utils/colors";
import { MATCH_FILTERS_TEXT } from "../../utils/commonText";
import { useBackHandler } from "../../components/BackHandlerWrapper";
import NetInfo from "@react-native-community/netinfo";
import { useSelector } from "react-redux";
import { userSelector } from "../../redux/slices/persistedSlice";
import {
  useGetGlobalUsersQuery,
  useToggleFavoriteMutation,
  useGetFavoritesQuery,
} from "../../redux/services/auth";
import { IMAGE_URL } from "../../config/env";

import { findMatch } from "../../socket/fastMatchSocket";
import { popTypes, ShowAlertMessage } from "../../helpers/commonFunctions";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_GAP = 8;
const HORIZONTAL_PAD = 16;
const CARD_WIDTH = (SCREEN_WIDTH - HORIZONTAL_PAD * 2 - CARD_GAP * 2) / 3;

// ─── Filter types ────────────────────────────────────────────
type SortBy = "recent" | "newest" | "alphabetical";
type GenderFilter = "all" | "male" | "female";
type AgeFilter = "all" | "18-24" | "25-34" | "35-44" | "45+";
type OnlineFilter = "all" | "online";

interface Filters {
  gender: GenderFilter;
  age: AgeFilter;
  online: OnlineFilter;
  sortBy: SortBy;
  country: string;
}

const DEFAULT_FILTERS: Filters = {
  gender: "all",
  age: "all",
  online: "all",
  sortBy: "recent",
  country: "",
};

// ─── Helpers ─────────────────────────────────────────────────
const parseAge = (age: any): number => {
  if (typeof age === "number") return age;
  if (typeof age === "string") return parseInt(age, 10) || 0;
  return 0;
};

const applyFiltersAndSearch = (users: any[], search: string, filters: Filters): any[] => {
  let filtered = [...users];
  if (search.trim()) {
    const q = search.toLowerCase().trim();
    filtered = filtered.filter((u) => (u.displayName || "").toLowerCase().includes(q));
  }
  if (filters.gender !== "all") {
    filtered = filtered.filter((u) => u.gender === filters.gender);
  }
  if (filters.age !== "all") {
    filtered = filtered.filter((u) => {
      const a = parseAge(u.age);
      if (a === 0) return false;
      switch (filters.age) {
        case "18-24": return a >= 18 && a <= 24;
        case "25-34": return a >= 25 && a <= 34;
        case "35-44": return a >= 35 && a <= 44;
        case "45+": return a >= 45;
        default: return true;
      }
    });
  }
  if (filters.online === "online") {
    filtered = filtered.filter((u) => u.isOnline);
  }
  if (filters.country.trim()) {
    const c = filters.country.toLowerCase().trim();
    filtered = filtered.filter((u) => (u.location || "").toLowerCase().includes(c));
  }
  switch (filters.sortBy) {
    case "newest":
      filtered.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      break;
    case "alphabetical":
      filtered.sort((a, b) => (a.displayName || "").localeCompare(b.displayName || ""));
      break;
    default:
      break;
  }
  return filtered;
};

const countActiveFilters = (filters: Filters): number => {
  let c = 0;
  if (filters.gender !== "all") c++;
  if (filters.age !== "all") c++;
  if (filters.online !== "all") c++;
  if (filters.sortBy !== "recent") c++;
  if (filters.country.trim()) c++;
  return c;
};

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

interface CoreProps {
  user: User;
  setView: (view: AppView, params?: any) => void;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

export const MatchFiltersView: React.FC<CoreProps> = ({ user, setView }) => {
  // Match preference state
  const [selectedGender, setSelectedGender] = useState<Gender>(Gender.ANY);
  const [selectedLocation, setSelectedLocation] = useState<'any' | 'my_country'>('any');
  const [selectedLanguage, setSelectedLanguage] = useState<'any' | 'my_language'>('any');
  const [selectedAge, setSelectedAge] = useState<'any' | '18-24' | '25-34' | '35+'>('any');

  // User grid state
  const { data: globalUsersData, isLoading, refetch, isFetching } = useGetGlobalUsersQuery({ page: 1, limit: 50 });
  const { data: favData, refetch: refetchFav } = useGetFavoritesQuery({});
  const [toggleFavorite] = useToggleFavoriteMutation();

  const [searchText, setSearchText] = useState("");
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [tempFilters, setTempFilters] = useState<Filters>(DEFAULT_FILTERS);

  const rawUsers = globalUsersData?.data?.users || [];
  const users = React.useMemo(
    () => applyFiltersAndSearch(rawUsers, searchText, filters),
    [rawUsers, searchText, filters]
  );
  const activeFilterCount = countActiveFilters(filters);

  const handleBack = React.useCallback(() => {
    setView(AppView.HOME);
  }, [setView]);

  useBackHandler(handleBack);

  const checkPremium = (isFreeFeature: boolean, featureName: string) => {
    if (!isFreeFeature && user?.isPremium !== 'premium') {
      ShowAlertMessage(`Premium required for ${featureName} preference`, popTypes.info);
      setView(AppView.SUBSCRIPTION);
      return false;
    }
    return true;
  };

  const openFilterModal = () => {
    setTempFilters({ ...filters });
    setShowFilterModal(true);
  };

  const applyFilterModal = () => {
    setFilters({ ...tempFilters });
    setShowFilterModal(false);
  };

  const resetFilters = () => {
    setTempFilters(DEFAULT_FILTERS);
  };

  // ─── Filter Pill ────────────────────────────────────────────
  const FilterPill = ({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) => (
    <TouchableOpacity
      style={[styles.filterPill, active && styles.filterPillActive]}
      onPress={onPress}
    >
      <Text style={[styles.filterPillText, active && styles.filterPillTextActive]}>{label}</Text>
    </TouchableOpacity>
  );

  // ─── Match Preference Option ────────────────────────────────
  const renderOption = (
    label: string, value: any, currentValue: any, setValue: (val: any) => void,
    isFree: boolean, featureName: string
  ) => {
    const isActive = currentValue === value;
    return (
      <TouchableOpacity
        key={value}
        onPress={() => { if (checkPremium(isFree, featureName)) setValue(value); }}
        style={[styles.optionBtn, isActive && styles.optionBtnActive]}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Text style={[styles.optionText, isActive && styles.optionTextActive]}>{label}</Text>
          {!isFree && user?.isPremium !== 'premium' && (
            <View style={styles.lockBadge}>
              <Crown size={10} color={colors.goldStrong} />
              <Text style={styles.lockBadgeText}>PRO</Text>
            </View>
          )}
        </View>
        <View style={styles.optionRight}>
          <View style={[styles.radio, isActive && styles.radioActive]}>
            {isActive && <View style={styles.radioDot} />}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // ─── Grid Card ──────────────────────────────────────────────
  const renderGridCard = ({ item }: { item: any }) => (
    <View style={styles.gridCard}>
      <View style={styles.gridImageWrap}>
        {item.profilePicture ? (
          <Image
            source={{ uri: `${IMAGE_URL}${item.profilePicture}`, cache: "force-cache" }}
            style={styles.gridImage}
          />
        ) : (
          <View style={[styles.gridImage, styles.fallbackImage]}>
            <Text style={styles.fallbackText}>{item.displayName?.charAt(0)?.toUpperCase()}</Text>
          </View>
        )}
        {item.isOnline && <View style={styles.onlineDot} />}
      </View>
      <View style={styles.gridInfo}>
        <Text style={styles.gridName} numberOfLines={1}>{item.displayName}</Text>
        <Text style={styles.gridSub} numberOfLines={1}>
          {item.age ? `${item.age}` : ""}{item.age && item.gender ? " · " : ""}{item.gender ? item.gender.charAt(0).toUpperCase() : ""}
        </Text>
      </View>
    </View>
  );

  // ═══════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════

  return (
    <View style={{ flex: 1 }}>
      <MobileContainer>
        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setView(AppView.HOME)} style={styles.backBtn}>
            <ArrowLeft color={colors.textPrimary} size={22} />
          </TouchableOpacity>
          <Crown color={colors.gold} size={20} style={{ marginRight: 6 }} />
          <Text style={styles.headerTitle}>Super Match</Text>
        </View>

        {/* ── Search + Filter Bar ── */}
        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Search color={colors.textPlaceholder} size={16} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name..."
              placeholderTextColor={colors.textPlaceholder}
              value={searchText}
              onChangeText={setSearchText}
            />
            {searchText.length > 0 && (
              <TouchableOpacity onPress={() => setSearchText("")}>
                <X color={colors.textMuted} size={14} />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity style={styles.filterBtnIcon} onPress={openFilterModal}>
            <SlidersHorizontal color={colors.white} size={16} />
            {activeFilterCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* ── Results count ── */}
        <Text style={styles.resultCount}>
          {users.length} user{users.length !== 1 ? "s" : ""} found
        </Text>

        {/* ── User Grid ── */}
        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.primary} size="large" />
          </View>
        ) : (
          <FlatList
            data={users}
            keyExtractor={(item) => item._id}
            numColumns={3}
            columnWrapperStyle={styles.gridRow}
            contentContainerStyle={styles.gridContainer}
            refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} />}
            renderItem={renderGridCard}
            ListHeaderComponent={
              /* ── Match Preferences (collapsible section at top) ── */
              <View style={styles.prefSection}>
                <Text style={styles.prefTitle}>Match Preferences</Text>

                {/* Gender */}
                <View style={styles.prefGroup}>
                  <View style={styles.prefHeader}>
                    <Users size={14} color={colors.textMuted} />
                    <Text style={styles.prefLabel}>GENDER</Text>
                  </View>
                  <View style={styles.prefOptions}>
                    {renderOption(MATCH_FILTERS_TEXT.everyone, Gender.ANY, selectedGender, setSelectedGender, true, "Gender")}
                    {renderOption(MATCH_FILTERS_TEXT.male, Gender.MALE, selectedGender, setSelectedGender, false, "Gender")}
                    {renderOption(MATCH_FILTERS_TEXT.female, Gender.FEMALE, selectedGender, setSelectedGender, false, "Gender")}
                  </View>
                </View>

                {/* Age */}
                <View style={styles.prefGroup}>
                  <View style={styles.prefHeader}>
                    <SlidersHorizontal size={14} color={colors.textMuted} />
                    <Text style={styles.prefLabel}>AGE RANGE</Text>
                  </View>
                  <View style={styles.prefOptions}>
                    {renderOption("Any Age", 'any', selectedAge, setSelectedAge, true, "Age Range")}
                    {renderOption("18 - 24", '18-24', selectedAge, setSelectedAge, false, "Age Range")}
                    {renderOption("25 - 34", '25-34', selectedAge, setSelectedAge, false, "Age Range")}
                    {renderOption("35+", '35+', selectedAge, setSelectedAge, false, "Age Range")}
                  </View>
                </View>

                {/* Location */}
                <View style={styles.prefGroup}>
                  <View style={styles.prefHeader}>
                    <MapPin size={14} color={colors.textMuted} />
                    <Text style={styles.prefLabel}>LOCATION</Text>
                  </View>
                  <View style={styles.prefOptions}>
                    {renderOption("Anywhere", 'any', selectedLocation, setSelectedLocation, true, "Location")}
                    {renderOption("My Country", 'my_country', selectedLocation, setSelectedLocation, false, "Location")}
                  </View>
                </View>

                {/* Language */}
                <View style={styles.prefGroup}>
                  <View style={styles.prefHeader}>
                    <Globe size={14} color={colors.textMuted} />
                    <Text style={styles.prefLabel}>LANGUAGE</Text>
                  </View>
                  <View style={styles.prefOptions}>
                    {renderOption("Any Language", 'any', selectedLanguage, setSelectedLanguage, true, "Language")}
                    {renderOption("My Language", 'my_language', selectedLanguage, setSelectedLanguage, true, "Language")}
                  </View>
                </View>

                {/* Find Match Button */}
                <Button
                  variant="primary"
                  onClick={async () => {
                    const state = await NetInfo.fetch();
                    if (state.isConnected) {
                      let preference: 'everyone' | 'male' | 'female' = 'everyone';
                      if (selectedGender === Gender.MALE) preference = 'male';
                      else if (selectedGender === Gender.FEMALE) preference = 'female';
                      findMatch({ preference, locationMode: selectedLocation, languageMode: selectedLanguage, ageRange: selectedAge });
                      setView(AppView.MATCH_FOUND, { preference });
                    } else {
                      ShowAlertMessage("Please check your internet connection", popTypes.error);
                    }
                  }}
                  style={styles.findBtn}
                >
                  {MATCH_FILTERS_TEXT.findMatch}
                </Button>

                {/* Divider + Browse Users label */}
                <View style={styles.divider} />
                <Text style={styles.browseLabel}>Browse Users</Text>
              </View>
            }
            ListEmptyComponent={
              <View style={styles.emptyWrap}>
                <Text style={styles.emptyText}>No users match your filters.</Text>
                {activeFilterCount > 0 && (
                  <TouchableOpacity
                    style={styles.clearFiltersBtn}
                    onPress={() => { setFilters(DEFAULT_FILTERS); setSearchText(""); }}
                  >
                    <Text style={styles.clearFiltersBtnText}>Clear Filters</Text>
                  </TouchableOpacity>
                )}
              </View>
            }
          />
        )}

        {/* ══════════════════════════════════════════════════════
             FILTER MODAL
           ══════════════════════════════════════════════════════ */}
        <Modal visible={showFilterModal} transparent animationType="slide">
          <View style={styles.filterModalOverlay}>
            <View style={styles.filterModalContent}>
              <View style={styles.filterModalHeader}>
                <Text style={styles.filterModalTitle}>Filters</Text>
                <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                  <X color={colors.textPrimary} size={22} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
                {/* Gender */}
                <Text style={styles.filterSectionLabel}>Gender</Text>
                <View style={styles.filterPillRow}>
                  {([["all", "Everyone"], ["male", "Male"], ["female", "Female"]] as [GenderFilter, string][]).map(([val, label]) => (
                    <FilterPill key={val} label={label} active={tempFilters.gender === val} onPress={() => setTempFilters(f => ({ ...f, gender: val }))} />
                  ))}
                </View>

                {/* Age */}
                <Text style={styles.filterSectionLabel}>Age Range</Text>
                <View style={styles.filterPillRow}>
                  {([["all", "Any"], ["18-24", "18-24"], ["25-34", "25-34"], ["35-44", "35-44"], ["45+", "45+"]] as [AgeFilter, string][]).map(([val, label]) => (
                    <FilterPill key={val} label={label} active={tempFilters.age === val} onPress={() => setTempFilters(f => ({ ...f, age: val }))} />
                  ))}
                </View>

                {/* Online Status */}
                <Text style={styles.filterSectionLabel}>Status</Text>
                <View style={styles.filterPillRow}>
                  <FilterPill label="All Users" active={tempFilters.online === "all"} onPress={() => setTempFilters(f => ({ ...f, online: "all" }))} />
                  <FilterPill label="Online Only" active={tempFilters.online === "online"} onPress={() => setTempFilters(f => ({ ...f, online: "online" }))} />
                </View>

                {/* Country */}
                <Text style={styles.filterSectionLabel}>Country / Location</Text>
                <TextInput
                  style={styles.filterInput}
                  placeholder="e.g. India, USA..."
                  placeholderTextColor={colors.textPlaceholder}
                  value={tempFilters.country}
                  onChangeText={(t) => setTempFilters(f => ({ ...f, country: t }))}
                />

                {/* Sort */}
                <Text style={styles.filterSectionLabel}>Sort By</Text>
                <View style={styles.filterPillRow}>
                  {([["recent", "Recently Active"], ["newest", "Newest Members"], ["alphabetical", "A → Z"]] as [SortBy, string][]).map(([val, label]) => (
                    <FilterPill key={val} label={label} active={tempFilters.sortBy === val} onPress={() => setTempFilters(f => ({ ...f, sortBy: val }))} />
                  ))}
                </View>
              </ScrollView>

              {/* Modal footer */}
              <View style={styles.filterModalFooter}>
                <TouchableOpacity style={styles.resetBtn} onPress={resetFilters}>
                  <Text style={styles.resetBtnText}>Reset</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.applyBtn} onPress={applyFilterModal}>
                  <Text style={styles.applyBtnText}>Apply Filters</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </MobileContainer>
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  // ── Header ──
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  backBtn: { padding: 6, marginLeft: -6, marginRight: 6 },
  headerTitle: { fontSize: 20, fontWeight: "bold", color: colors.textPrimary },

  // ── Search + Filter ──
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceAlt,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 40,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 14,
    padding: 0,
  },
  filterBtnIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  filterBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#ef4444",
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  filterBadgeText: { color: "#fff", fontSize: 10, fontWeight: "bold" },

  // ── Result count ──
  resultCount: { color: colors.textPlaceholder, fontSize: 12, marginBottom: 10 },

  // ── Grid (3 column) ──
  gridContainer: { paddingBottom: 100 },
  gridRow: { gap: CARD_GAP, marginBottom: CARD_GAP },
  gridCard: {
    width: CARD_WIDTH,
    backgroundColor: colors.surface,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  gridImageWrap: {
    width: "100%",
    aspectRatio: 0.85,
    position: "relative",
  },
  gridImage: { width: "100%", height: "100%" },
  fallbackImage: {
    backgroundColor: colors.surfaceSecondary,
    justifyContent: "center",
    alignItems: "center",
  },
  fallbackText: { fontSize: 28, fontWeight: "bold", color: colors.textPlaceholder },
  onlineDot: {
    position: "absolute",
    bottom: 4,
    right: 4,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.success,
    borderWidth: 1.5,
    borderColor: colors.surface,
  },
  gridInfo: { padding: 6 },
  gridName: { fontSize: 12, fontWeight: "700", color: colors.textPrimary, marginBottom: 1 },
  gridSub: { fontSize: 10, color: colors.textPlaceholder },

  // ── Preference Section ──
  prefSection: { marginBottom: 12 },
  prefTitle: { fontSize: 16, fontWeight: "bold", color: colors.textPrimary, marginBottom: 12 },
  prefGroup: { marginBottom: 14 },
  prefHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  prefLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textPlaceholder,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  prefOptions: { gap: 6 },

  optionBtn: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.surfaceAlt,
  },
  optionBtnActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySofter,
  },
  optionText: { fontSize: 14, fontWeight: "600", color: colors.textMuted },
  optionTextActive: { color: colors.white },
  optionRight: { flexDirection: "row", alignItems: "center", gap: 12 },
  lockBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.goldSoft,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    gap: 4,
  },
  lockBadgeText: { fontSize: 9, fontWeight: "bold", color: colors.goldStrong },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: colors.borderSlate,
    justifyContent: "center",
    alignItems: "center",
  },
  radioActive: { borderColor: colors.primary },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  findBtn: { marginTop: 4, marginBottom: 10 },
  divider: {
    height: 1,
    backgroundColor: colors.borderSubtle,
    marginVertical: 14,
  },
  browseLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.textPrimary,
    marginBottom: 10,
  },

  // ── Empty ──
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyWrap: { alignItems: "center", marginTop: 40 },
  emptyText: { color: colors.textPlaceholder, textAlign: "center", fontSize: 14 },
  clearFiltersBtn: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.primarySoft,
  },
  clearFiltersBtnText: { color: colors.primary, fontWeight: "600", fontSize: 13 },

  // ── Filter Modal ──
  filterModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  filterModalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    maxHeight: "80%",
  },
  filterModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  filterModalTitle: { fontSize: 20, fontWeight: "bold", color: colors.textPrimary },
  filterSectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textPlaceholder,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginTop: 16,
    marginBottom: 8,
  },
  filterPillRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  filterPillActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  filterPillText: { color: colors.textMuted, fontSize: 13, fontWeight: "600" },
  filterPillTextActive: { color: colors.primary },
  filterInput: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: colors.textPrimary,
    fontSize: 14,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  filterModalFooter: {
    flexDirection: "row",
    gap: 10,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  resetBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: colors.surfaceAlt,
    alignItems: "center",
  },
  resetBtnText: { color: colors.textMuted, fontWeight: "bold", fontSize: 14 },
  applyBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: "center",
  },
  applyBtnText: { color: colors.white, fontWeight: "bold", fontSize: 14 },
});

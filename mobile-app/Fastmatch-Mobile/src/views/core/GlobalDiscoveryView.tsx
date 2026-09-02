import * as React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  Modal,
  TextInput,
  RefreshControl,
  Dimensions,
  ScrollView,
} from "react-native";
import { useSelector } from "react-redux";
import { ArrowLeft, Globe, Search, SlidersHorizontal, X } from "lucide-react-native";
import Svg, { Path } from "react-native-svg";
import { MobileContainer, Button } from "../../components/UIComponents";
import { AppView } from "../../types";
import { colors } from "../../utils/colors";
import { userSelector } from "../../redux/slices/persistedSlice";
import {
  useGetGlobalUsersQuery,
  useSendFriendRequestMutation,
  useToggleFavoriteMutation,
  useGetFavoritesQuery,
} from "../../redux/services/auth";
import { IMAGE_URL } from "../../config/env";
import { ShowAlertMessage, popTypes } from "../../helpers/commonFunctions";
import { UserAvatar } from "../../components/UserAvatar";

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

// ─── Helper: Heart SVG ──────────────────────────────────────
const HeartIcon = ({ filled, size = 20, color = colors.primary }: { filled: boolean; size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
      fill={filled ? color : "none"}
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// ─── Helper: parse age string to number ──────────────────────
const parseAge = (age: any): number => {
  if (typeof age === "number") return age;
  if (typeof age === "string") return parseInt(age, 10) || 0;
  return 0;
};

// ─── Helper: apply filters & search ──────────────────────────
const applyFiltersAndSearch = (users: any[], search: string, filters: Filters): any[] => {
  let filtered = [...users];

  // Search by name
  if (search.trim()) {
    const q = search.toLowerCase().trim();
    filtered = filtered.filter((u) =>
      (u.displayName || "").toLowerCase().includes(q)
    );
  }

  // Gender
  if (filters.gender !== "all") {
    filtered = filtered.filter((u) => u.gender === filters.gender);
  }

  // Age range
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

  // Online only
  if (filters.online === "online") {
    filtered = filtered.filter((u) => u.isOnline);
  }

  // Country
  if (filters.country.trim()) {
    const c = filters.country.toLowerCase().trim();
    filtered = filtered.filter((u) =>
      (u.location || "").toLowerCase().includes(c)
    );
  }

  // Sort
  switch (filters.sortBy) {
    case "newest":
      filtered.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      break;
    case "alphabetical":
      filtered.sort((a, b) => (a.displayName || "").localeCompare(b.displayName || ""));
      break;
    case "recent":
    default:
      // already sorted by isOnline + lastActive from backend
      break;
  }

  return filtered;
};

// ─── Count active filters ────────────────────────────────────
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

export const GlobalDiscoveryView: React.FC<{ setView: (v: AppView) => void }> = ({
  setView,
}) => {
  const user = useSelector(userSelector);

  const [page, setPage] = React.useState(1);
  const { data: globalUsersData, isLoading, refetch: refetchGlobalUsers, isFetching } = useGetGlobalUsersQuery({
    page,
    limit: 100,
  });

  const { data: favData, refetch: refetchFav } = useGetFavoritesQuery({});
  const [sendFriendRequest, { isLoading: isSending }] = useSendFriendRequestMutation();
  const [toggleFavorite] = useToggleFavoriteMutation();

  const [selectedUser, setSelectedUser] = React.useState<any>(null);
  const [message, setMessage] = React.useState("");

  // UI state
  const [searchText, setSearchText] = React.useState("");
  const [filters, setFilters] = React.useState<Filters>(DEFAULT_FILTERS);
  const [showFilterModal, setShowFilterModal] = React.useState(false);
  const [tempFilters, setTempFilters] = React.useState<Filters>(DEFAULT_FILTERS);

  const rawUsers = globalUsersData?.data?.users || [];
  const users = React.useMemo(
    () => applyFiltersAndSearch(rawUsers, searchText, filters),
    [rawUsers, searchText, filters]
  );

  const activeFilterCount = countActiveFilters(filters);

  // ─── Handlers ──────────────────────────────────────────────

  const handleFavoriteToggle = async () => {
    if (!selectedUser) return;
    try {
      await toggleFavorite({ targetUserId: selectedUser._id }).unwrap();
      refetchFav();
    } catch (error) {
      console.log("Failed to toggle favorite", error);
    }
  };

  const handleSendRequest = async () => {
    if (!selectedUser) return;
    try {
      await sendFriendRequest({
        targetUserId: selectedUser._id,
        message: message.trim(),
      }).unwrap();
      ShowAlertMessage("Connection request sent successfully!", popTypes.success);
      setSelectedUser(null);
      setMessage("");
    } catch (error: any) {
      ShowAlertMessage(error?.data?.message || "Failed to send request", popTypes.error);
    }
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

  // ─── Grid Card (3 per row) ────────────────────────────────

  const renderGridCard = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.gridCard}
      activeOpacity={0.8}
      onPress={() => {
        if (user?.isPremium !== "premium") {
          ShowAlertMessage("Premium required to send connection requests.", popTypes.info);
          setView(AppView.SUBSCRIPTION);
          return;
        }
        setSelectedUser(item);
      }}
    >
      <View style={styles.gridImageWrap}>
        <UserAvatar
          uri={item.profilePicture}
          gender={item.gender}
          name={item.displayName}
          size={CARD_WIDTH}
          style={styles.gridImage}
          borderRadius={10}
        />
        {item.isOnline && (
          <View style={styles.onlineDot} />
        )}
      </View>
      <View style={styles.gridInfo}>
        <Text style={styles.gridName} numberOfLines={1}>
          {item.displayName}
        </Text>
        <Text style={styles.gridSub} numberOfLines={1}>
          {item.age ? `${item.age}` : ""}{item.age && item.gender ? " · " : ""}{item.gender ? item.gender.charAt(0).toUpperCase() : ""}
        </Text>
      </View>
    </TouchableOpacity>
  );

  // ─── List Row ──────────────────────────────────────────────

  const renderListItem = ({ item }: { item: any }) => {
    const isFav = favData?.data?.some((f: any) => f._id === item._id);
    return (
      <TouchableOpacity
        style={styles.listRow}
        activeOpacity={0.8}
        onPress={() => {
          if (user?.isPremium !== "premium") {
            ShowAlertMessage("Premium required to send connection requests.", popTypes.info);
            setView(AppView.SUBSCRIPTION);
            return;
          }
          setSelectedUser(item);
        }}
      >
        <View style={styles.listAvatarWrap}>
          {item.profilePicture ? (
            <Image
              source={{ uri: `${IMAGE_URL}${item.profilePicture}`, cache: "force-cache" }}
              style={styles.listAvatar}
            />
          ) : (
            <View style={[styles.listAvatar, styles.fallbackImage]}>
              <Text style={styles.listFallbackText}>
                {item.displayName?.charAt(0)?.toUpperCase()}
              </Text>
            </View>
          )}
          {item.isOnline && <View style={styles.listOnlineDot} />}
        </View>
        <View style={styles.listInfo}>
          <Text style={styles.listName} numberOfLines={1}>{item.displayName}</Text>
          <Text style={styles.listSub} numberOfLines={1}>
            {item.age ? `${item.age} yrs` : ""}{item.age && item.gender ? " · " : ""}{item.gender || ""}{item.location ? ` · ${item.location}` : ""}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.listFavBtn}
          onPress={async () => {
            try {
              await toggleFavorite({ targetUserId: item._id }).unwrap();
              refetchFav();
            } catch (e) {}
          }}
        >
          <HeartIcon filled={isFav} size={18} color={isFav ? "#ef4444" : colors.textMuted} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  // ─── Filter Option Pill ────────────────────────────────────

  const FilterPill = ({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) => (
    <TouchableOpacity
      style={[styles.filterPill, active && styles.filterPillActive]}
      onPress={onPress}
    >
      <Text style={[styles.filterPillText, active && styles.filterPillTextActive]}>{label}</Text>
    </TouchableOpacity>
  );

  // ═══════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════

  return (
    <MobileContainer>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setView(AppView.HOME)} style={styles.backBtn}>
          <ArrowLeft color={colors.textPrimary} size={22} />
        </TouchableOpacity>
        <Globe color={colors.primary} size={20} style={{ marginRight: 6 }} />
        <Text style={styles.headerTitle}>Global Network</Text>
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
        <TouchableOpacity style={styles.filterBtn} onPress={openFilterModal}>
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

      {/* ── User Grid / List ── */}
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
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={isFetching} onRefresh={refetchGlobalUsers} />
          }
          renderItem={renderGridCard}
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

      {/* ══════════════════════════════════════════════════════
           CONNECT / SEND REQUEST MODAL
         ══════════════════════════════════════════════════════ */}
      <Modal visible={!!selectedUser} transparent animationType="slide">
        <View style={styles.connectOverlay}>
          <View style={styles.connectContent}>
            <TouchableOpacity
              style={styles.connectClose}
              onPress={() => { setSelectedUser(null); setMessage(""); }}
            >
              <X color={colors.white} size={18} />
            </TouchableOpacity>

            <View style={{ alignItems: "center", marginBottom: 16 }}>
              <UserAvatar
                uri={selectedUser?.profilePicture}
                gender={selectedUser?.gender}
                name={selectedUser?.displayName}
                size={80}
                borderRadius={40}
              />
            </View>

            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 }}>
              <Text style={styles.connectTitle}>Connect with {selectedUser?.displayName}</Text>
              <TouchableOpacity onPress={handleFavoriteToggle}>
                <HeartIcon
                  filled={favData?.data?.some((f: any) => f._id === selectedUser?._id)}
                  size={22}
                  color={favData?.data?.some((f: any) => f._id === selectedUser?._id) ? "#ef4444" : colors.primary}
                />
              </TouchableOpacity>
            </View>

            {/* User details chips */}
            <View style={styles.connectChips}>
              {selectedUser?.age && (
                <View style={styles.connectChip}>
                  <Text style={styles.connectChipText}>{selectedUser.age} yrs</Text>
                </View>
              )}
              {selectedUser?.gender && (
                <View style={styles.connectChip}>
                  <Text style={styles.connectChipText}>{selectedUser.gender}</Text>
                </View>
              )}
              {selectedUser?.location && (
                <View style={styles.connectChip}>
                  <Text style={styles.connectChipText}>{selectedUser.location}</Text>
                </View>
              )}
              {selectedUser?.isOnline && (
                <View style={[styles.connectChip, { borderColor: "rgba(34,197,94,0.4)" }]}>
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.success, marginRight: 4 }} />
                  <Text style={[styles.connectChipText, { color: colors.success }]}>Online</Text>
                </View>
              )}
            </View>

            {/* Interests */}
            {selectedUser?.interests?.length > 0 && (
              <View style={styles.connectInterests}>
                {selectedUser.interests.slice(0, 4).map((int: string, i: number) => (
                  <View key={i} style={styles.interestChip}>
                    <Text style={styles.interestChipText}>{int}</Text>
                  </View>
                ))}
                {selectedUser.interests.length > 4 && (
                  <View style={styles.interestChip}>
                    <Text style={styles.interestChipText}>+{selectedUser.interests.length - 4}</Text>
                  </View>
                )}
              </View>
            )}

            <Text style={styles.connectSubtitle}>Include a personal message (optional)</Text>

            <TextInput
              style={styles.connectInput}
              placeholder="e.g. Hi! I'd love to connect..."
              placeholderTextColor="rgba(255,255,255,0.4)"
              multiline
              maxLength={200}
              value={message}
              onChangeText={setMessage}
            />

            <Button
              onClick={handleSendRequest}
              disabled={isSending}
              style={{ marginTop: 16 }}
            >
              {isSending ? "Sending..." : "Send Request"}
            </Button>
          </View>
        </View>
      </Modal>
    </MobileContainer>
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
  filterBtn: {
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
  resultCount: {
    color: colors.textPlaceholder,
    fontSize: 12,
    marginBottom: 10,
  },

  // ── Grid (3-column) ──
  listContainer: { paddingBottom: 100 },
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


  // ── Empty ──
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyWrap: { alignItems: "center", marginTop: 60 },
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

  // ── Connect Modal ──
  connectOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  connectContent: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 24,
    position: "relative",
  },
  connectClose: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  connectAvatar: { width: 80, height: 80, borderRadius: 40 },
  connectFallbackText: { fontSize: 32, fontWeight: "bold", color: colors.textPlaceholder },
  connectTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.textPrimary,
    textAlign: "center",
    marginBottom: 4,
  },
  connectChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 6,
    marginTop: 12,
    marginBottom: 8,
  },
  connectChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    backgroundColor: "rgba(255,255,255,0.05)",
    flexDirection: "row",
    alignItems: "center",
  },
  connectChipText: { color: colors.textMuted, fontSize: 12, fontWeight: "600" },
  connectInterests: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 6,
    marginBottom: 12,
  },
  interestChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: "rgba(99,102,241,0.15)",
    borderWidth: 1,
    borderColor: "rgba(99,102,241,0.25)",
  },
  interestChipText: { color: "#a5b4fc", fontSize: 11, fontWeight: "600" },
  connectSubtitle: {
    fontSize: 13,
    color: colors.textPlaceholder,
    textAlign: "center",
    marginBottom: 12,
  },
  connectInput: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    padding: 14,
    color: colors.white,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: "top",
  },
});

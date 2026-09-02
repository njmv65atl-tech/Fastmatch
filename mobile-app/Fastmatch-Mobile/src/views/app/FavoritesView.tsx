import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Modal,
} from "react-native";
import { ChevronLeft } from "lucide-react-native";
import Svg, { Path } from "react-native-svg";
import { colors } from "../../utils/colors";
import { scale, verticalScale, moderateScale } from "../../helpers/metrics";
import { MobileContainer } from "../../components/UIComponents";
import {
  useGetFavoritesQuery,
  useToggleFavoriteMutation
} from "../../redux/services/auth";
import { AppView } from "../../types";
import { popTypes, ShowAlertMessage } from "../../helpers/commonFunctions";
import { UserAvatar } from "../../components/UserAvatar";

interface FavoritesViewProps {
  setView: (view: AppView, params?: any) => void;
}

export const FavoritesView: React.FC<FavoritesViewProps> = ({ setView }) => {
  const { data: favData, isLoading, refetch } = useGetFavoritesQuery({});
  const [toggleFavorite] = useToggleFavoriteMutation();
  const [userToRemove, setUserToRemove] = useState<any | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  const handleRemoveFavorite = async (userId: string) => {
    try {
      setIsRemoving(true);
      await toggleFavorite({ targetUserId: userId }).unwrap();
      ShowAlertMessage("Removed from favorites", popTypes.success);
      refetch();
    } catch (e) {
      console.warn("Failed to remove favorite:", e);
      ShowAlertMessage("Failed to remove favorite", popTypes.error);
    } finally {
      setIsRemoving(false);
      setUserToRemove(null);
    }
  };

  const renderFavoriteItem = (user: any) => {
    return (
      <View key={user._id} style={styles.friendCard}>
        <View style={styles.friendInfo}>
          <View style={styles.avatarContainer}>
            <UserAvatar
              uri={user.profilePicture}
              gender={user.gender}
              name={user.displayName || user.fullName}
              size={moderateScale(50)}
              borderRadius={moderateScale(25)}
            />
            {user.isOnline && <View style={styles.onlineBadge} />}
          </View>
          <View style={styles.friendDetails}>
            <Text style={styles.friendName}>{user.displayName || user.fullName}</Text>
            <Text style={styles.friendSubtext}>
              {user.age ? `${user.age} • ` : ""}{user.gender || "Any"}
            </Text>
          </View>
        </View>

        {/* Pure Red Heart Icon - Transparent background, no square box */}
        <TouchableOpacity 
          style={styles.removeBtn}
          onPress={() => setUserToRemove(user)}
          activeOpacity={0.7}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
            <Path 
              d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" 
              fill="#EF4444" 
              stroke="#EF4444" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
            />
          </Svg>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <MobileContainer>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => setView(AppView.SETTINGS)}>
          <ChevronLeft size={moderateScale(24)} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Favorites</Text>
        <View style={{ width: moderateScale(40) }} />
      </View>

      <ScrollView 
        contentContainerStyle={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
      >
        {isLoading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 50 }} />
        ) : favData?.data?.length > 0 ? (
          favData.data.map((user: any) => renderFavoriteItem(user))
        ) : (
          <View style={styles.emptyState}>
            <Svg width={moderateScale(48)} height={moderateScale(48)} viewBox="0 0 24 24" fill="none">
              <Path 
                d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" 
                stroke={colors.textMuted} 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
              />
            </Svg>
            <Text style={styles.emptyTitle}>No favorites yet</Text>
            <Text style={styles.emptySubtitle}>Users you bookmark will appear here.</Text>
            <TouchableOpacity 
              style={styles.discoverBtn}
              onPress={() => setView(AppView.GLOBAL_DISCOVERY)}
            >
              <Text style={styles.discoverBtnText}>Discover Users</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* ── Confirmation Modal ── */}
      <Modal
        visible={!!userToRemove}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!isRemoving) setUserToRemove(null);
        }}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconWrap}>
              <Svg width={32} height={32} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
                  fill="#EF4444"
                  stroke="#EF4444"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </View>

            <Text style={styles.modalTitle}>Remove from Favorites?</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to remove{" "}
              <Text style={styles.modalHighlight}>
                {userToRemove?.displayName || userToRemove?.fullName || "this user"}
              </Text>{" "}
              from your favorites list?
            </Text>

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setUserToRemove(null)}
                disabled={isRemoving}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.confirmRemoveBtn}
                onPress={() => {
                  if (userToRemove?._id) {
                    handleRemoveFavorite(userToRemove._id);
                  }
                }}
                disabled={isRemoving}
                activeOpacity={0.7}
              >
                {isRemoving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.confirmRemoveBtnText}>Remove</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </MobileContainer>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: scale(15),
    paddingVertical: verticalScale(15),
  },
  backBtn: {
    padding: moderateScale(5),
    backgroundColor: colors.surfaceAlt,
    borderRadius: moderateScale(12),
  },
  headerTitle: {
    fontSize: moderateScale(18),
    fontWeight: "bold",
    color: colors.textPrimary,
  },
  contentContainer: {
    flexGrow: 1,
    paddingHorizontal: scale(15),
    paddingBottom: 100,
  },
  friendCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    padding: moderateScale(15),
    borderRadius: moderateScale(16),
    marginBottom: verticalScale(10),
  },
  friendInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatarContainer: {
    position: "relative",
    marginRight: scale(15),
  },
  avatar: {
    width: moderateScale(50),
    height: moderateScale(50),
    borderRadius: moderateScale(25),
  },
  avatarFallback: {
    width: moderateScale(50),
    height: moderateScale(50),
    borderRadius: moderateScale(25),
    backgroundColor: colors.primary + '20',
    alignItems: "center",
    justifyContent: "center",
  },
  avatarFallbackText: {
    color: colors.primary,
    fontSize: moderateScale(20),
    fontWeight: "bold",
  },
  onlineBadge: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: moderateScale(12),
    height: moderateScale(12),
    borderRadius: moderateScale(6),
    backgroundColor: colors.success,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  friendDetails: {
    flex: 1,
  },
  friendName: {
    fontSize: moderateScale(16),
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: verticalScale(2),
  },
  friendSubtext: {
    fontSize: moderateScale(12),
    color: colors.textMuted,
  },
  removeBtn: {
    padding: moderateScale(8),
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: verticalScale(100),
  },
  emptyTitle: {
    fontSize: moderateScale(18),
    fontWeight: "bold",
    color: colors.textPrimary,
    marginTop: verticalScale(15),
  },
  emptySubtitle: {
    fontSize: moderateScale(14),
    color: colors.textMuted,
    marginTop: verticalScale(5),
    marginBottom: verticalScale(20),
  },
  discoverBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(10),
    borderRadius: moderateScale(20),
  },
  discoverBtnText: {
    color: colors.white,
    fontWeight: "bold",
  },

  // ── Confirmation Modal Styles ──
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: scale(24),
  },
  modalContent: {
    width: "100%",
    backgroundColor: colors.surface,
    borderRadius: moderateScale(20),
    padding: moderateScale(24),
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  modalIconWrap: {
    width: moderateScale(60),
    height: moderateScale(60),
    borderRadius: moderateScale(30),
    backgroundColor: "rgba(239, 68, 68, 0.12)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: verticalScale(16),
  },
  modalTitle: {
    fontSize: moderateScale(18),
    fontWeight: "bold",
    color: colors.textPrimary,
    marginBottom: verticalScale(8),
  },
  modalMessage: {
    fontSize: moderateScale(14),
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: moderateScale(20),
    marginBottom: verticalScale(24),
  },
  modalHighlight: {
    color: colors.textPrimary,
    fontWeight: "600",
  },
  modalBtnRow: {
    flexDirection: "row",
    width: "100%",
    gap: scale(12),
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: verticalScale(12),
    borderRadius: moderateScale(12),
    backgroundColor: colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelBtnText: {
    color: colors.textPrimary,
    fontSize: moderateScale(15),
    fontWeight: "600",
  },
  confirmRemoveBtn: {
    flex: 1,
    paddingVertical: verticalScale(12),
    borderRadius: moderateScale(12),
    backgroundColor: "#EF4444",
    alignItems: "center",
    justifyContent: "center",
  },
  confirmRemoveBtnText: {
    color: "#FFFFFF",
    fontSize: moderateScale(15),
    fontWeight: "bold",
  },
});

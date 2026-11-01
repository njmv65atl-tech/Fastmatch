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
import { useTranslation } from "react-i18next";

interface FavoritesViewProps {
  setView: (view: AppView, params?: any) => void;
}

export const FavoritesView: React.FC<FavoritesViewProps> = ({ setView }) => {
  const { t } = useTranslation();
  const { data: favData, isLoading, refetch } = useGetFavoritesQuery({});
  const [toggleFavorite] = useToggleFavoriteMutation();
  const [userToRemove, setUserToRemove] = useState<any | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  const handleRemoveFavorite = async (userId: string) => {
    try {
      setIsRemoving(true);
      await toggleFavorite({ targetUserId: userId }).unwrap();
      ShowAlertMessage(t("favorites.removedSuccess"), popTypes.success);
      refetch();
    } catch (e) {
      console.warn("Failed to remove favorite:", e);
      ShowAlertMessage(t("favorites.removeFailed"), popTypes.error);
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
        <Text style={styles.headerTitle}>{t("favorites.title")}</Text>
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
            <Text style={styles.emptyTitle}>{t("favorites.emptyTitle")}</Text>
            <Text style={styles.emptySubtitle}>{t("favorites.emptySubtitle")}</Text>
            <TouchableOpacity 
              style={styles.discoverBtn}
              onPress={() => setView(AppView.GLOBAL_DISCOVERY)}
            >
              <Text style={styles.discoverBtnText}>{t("favorites.discoverUsers")}</Text>
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

            <Text style={styles.modalTitle}>{t("favorites.removeTitle")}</Text>
            <Text style={styles.modalMessage}>
              {t("favorites.removeConfirm", {
                name: userToRemove?.displayName || userToRemove?.fullName || "this user"
              })}
            </Text>

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setUserToRemove(null)}
                disabled={isRemoving}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelBtnText}>{t("favorites.cancel")}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.confirmRemoveBtn}
                onPress={() => handleRemoveFavorite(userToRemove?._id)}
                disabled={isRemoving}
                activeOpacity={0.7}
              >
                {isRemoving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.confirmRemoveBtnText}>{t("favorites.remove")}</Text>
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
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(14),
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
  },
  backBtn: {
    padding: moderateScale(4),
  },
  headerTitle: {
    fontSize: moderateScale(18),
    fontWeight: "bold",
    color: colors.textPrimary,
  },
  contentContainer: {
    padding: scale(16),
    flexGrow: 1,
  },
  friendCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: moderateScale(14),
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: moderateScale(16),
    marginBottom: verticalScale(12),
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
  },
  friendInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatarContainer: {
    position: "relative",
  },
  onlineBadge: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#22C55E",
    borderWidth: 2,
    borderColor: "#0F172A",
  },
  friendDetails: {
    marginLeft: scale(14),
    flex: 1,
  },
  friendName: {
    fontSize: moderateScale(16),
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: verticalScale(2),
  },
  friendSubtext: {
    fontSize: moderateScale(13),
    color: colors.textPlaceholder,
  },
  removeBtn: {
    padding: moderateScale(8),
    alignItems: "center",
    justifyContent: "center",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: verticalScale(80),
  },
  emptyTitle: {
    fontSize: moderateScale(18),
    fontWeight: "bold",
    color: colors.textPrimary,
    marginTop: verticalScale(16),
    marginBottom: verticalScale(6),
  },
  emptySubtitle: {
    fontSize: moderateScale(14),
    color: colors.textPlaceholder,
    textAlign: "center",
    marginBottom: verticalScale(24),
    paddingHorizontal: scale(32),
  },
  discoverBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: scale(24),
    paddingVertical: verticalScale(12),
    borderRadius: moderateScale(25),
  },
  discoverBtnText: {
    color: colors.white,
    fontSize: moderateScale(14),
    fontWeight: "600",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "center",
    alignItems: "center",
    padding: scale(20),
  },
  modalContent: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: "#1E293B",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  modalIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(239, 68, 68, 0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 8,
    textAlign: "center",
  },
  modalMessage: {
    fontSize: 14,
    color: "#94A3B8",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
  },
  modalHighlight: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  modalBtnRow: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  cancelBtnText: {
    color: "#94A3B8",
    fontSize: 14,
    fontWeight: "600",
  },
  confirmRemoveBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#EF4444",
    alignItems: "center",
    justifyContent: "center",
  },
  confirmRemoveBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
});

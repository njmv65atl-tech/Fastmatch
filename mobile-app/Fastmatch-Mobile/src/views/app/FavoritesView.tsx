import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet,
  ActivityIndicator,
  RefreshControl
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
import { IMG_URL } from "../../redux/services";

interface FavoritesViewProps {
  setView: (view: AppView, params?: any) => void;
}

export const FavoritesView: React.FC<FavoritesViewProps> = ({ setView }) => {
  const { data: favData, isLoading, refetch } = useGetFavoritesQuery({});
  const [toggleFavorite] = useToggleFavoriteMutation();

  const handleRemoveFavorite = async (userId: string) => {
    try {
      await toggleFavorite({ targetUserId: userId }).unwrap();
      refetch();
    } catch (e) {
      console.warn("Failed to remove favorite:", e);
    }
  };

  const renderFavoriteItem = (user: any) => {
    return (
      <View key={user._id} style={styles.friendCard}>
        <View style={styles.friendInfo}>
          <View style={styles.avatarContainer}>
            {user.profilePicture ? (
              <Image 
                source={{ uri: `${IMG_URL}${user.profilePicture}`, cache: 'force-cache' }} 
                style={styles.avatar} 
              />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarFallbackText}>
                  {user.displayName?.[0]?.toUpperCase() || user.fullName?.[0]?.toUpperCase()}
                </Text>
              </View>
            )}
            {user.isOnline && <View style={styles.onlineBadge} />}
          </View>
          <View style={styles.friendDetails}>
            <Text style={styles.friendName}>{user.displayName || user.fullName}</Text>
            <Text style={styles.friendSubtext}>{user.age ? `${user.age} • ` : ""}{user.gender || "Any"}</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.removeBtn}
          onPress={() => handleRemoveFavorite(user._id)}
        >
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" fill={colors.danger} stroke={colors.danger} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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
            <Svg width={moderateScale(48)} height={moderateScale(48)} viewBox="0 0 24 24" fill="none" stroke={colors.textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <Path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
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
    backgroundColor: colors.danger + '15',
    borderRadius: moderateScale(12),
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
});

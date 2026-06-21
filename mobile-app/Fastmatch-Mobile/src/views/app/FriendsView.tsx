import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet,
  ActivityIndicator
} from "react-native";
import { ChevronLeft, UserCheck, UserPlus, Clock } from "lucide-react-native";
import { colors } from "../../utils/colors";
import { scale, verticalScale, moderateScale } from "../../helpers/metrics";
import { MobileContainer } from "../../components/UIComponents";
import {
  useMyFriendsQuery,
  useFriendRequestsQuery,
  useAcceptFriendRequestMutation
} from "../../redux/services/auth";
import { AppView } from "../../types";

interface FriendsViewProps {
  setView: (view: AppView) => void;
}

export const FriendsView: React.FC<FriendsViewProps> = ({ setView }) => {
  const [activeTab, setActiveTab] = useState<"friends" | "requests">("friends");

  const { data: friendsData, isLoading: isLoadingFriends, refetch: refetchFriends } = useMyFriendsQuery({});
  const { data: requestsData, isLoading: isLoadingReqs, refetch: refetchReqs } = useFriendRequestsQuery({});
  const [acceptFriendRequest, { isLoading: isAccepting }] = useAcceptFriendRequestMutation();

  const handleAccept = async (requestId: string) => {
    try {
      await acceptFriendRequest({ requestId }).unwrap();
      refetchFriends();
      refetchReqs();
    } catch (e) {
      console.warn("Failed to accept friend request:", e);
    }
  };

  const renderFriendItem = (item: any) => {
    // Check if I am requester or recipient
    const friendObj = item.requester?._id ? (item.requester.displayName ? item.requester : item.recipient) : item.recipient;
    if (!friendObj) return null;

    return (
      <View key={item._id} style={styles.userCard}>
        <Image
          source={{ uri: friendObj.profilePicture || "https://i.pravatar.cc/150" }}
          style={styles.avatar}
        />
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{friendObj.displayName || "Unknown"}</Text>
          <Text style={styles.userStatus}>Friends since {new Date(item.createdAt).toLocaleDateString()}</Text>
        </View>
        <View style={styles.actionBtn}>
          <UserCheck color={colors.primary} size={20} />
        </View>
      </View>
    );
  };

  const renderRequestItem = (item: any) => {
    const requester = item.requester;
    if (!requester) return null;

    return (
      <View key={item._id} style={styles.userCard}>
        <Image
          source={{ uri: requester.profilePicture || "https://i.pravatar.cc/150" }}
          style={styles.avatar}
        />
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{requester.displayName || "Unknown"}</Text>
          <Text style={styles.userStatus}>Wants to be friends</Text>
        </View>
        <TouchableOpacity
          style={styles.acceptBtn}
          onPress={() => handleAccept(item._id)}
          disabled={isAccepting}
        >
          <UserPlus color={colors.white} size={18} />
          <Text style={styles.acceptBtnText}>Accept</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <MobileContainer>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setView(AppView.HOME)} style={styles.backBtn}>
          <ChevronLeft color={colors.white} size={moderateScale(28)} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Friends</Text>
        <View style={{ width: moderateScale(40) }} />
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "friends" && styles.activeTab]}
          onPress={() => setActiveTab("friends")}
        >
          <Text style={[styles.tabText, activeTab === "friends" && styles.activeTabText]}>
            My Friends
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "requests" && styles.activeTab]}
          onPress={() => setActiveTab("requests")}
        >
          <Text style={[styles.tabText, activeTab === "requests" && styles.activeTabText]}>
            Requests {(requestsData?.data?.length || 0) > 0 && `(${requestsData.data.length})`}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.contentContainer}>
        {activeTab === "friends" ? (
          isLoadingFriends ? (
            <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
          ) : friendsData?.data?.length > 0 ? (
            friendsData.data.map(renderFriendItem)
          ) : (
            <View style={styles.emptyContainer}>
              <UserCheck color={colors.textMuted} size={48} />
              <Text style={styles.emptyText}>You have no friends yet.</Text>
            </View>
          )
        ) : (
          isLoadingReqs ? (
            <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
          ) : requestsData?.data?.length > 0 ? (
            requestsData.data.map(renderRequestItem)
          ) : (
            <View style={styles.emptyContainer}>
              <Clock color={colors.textMuted} size={48} />
              <Text style={styles.emptyText}>No pending friend requests.</Text>
            </View>
          )
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
    paddingTop: verticalScale(15),
    paddingBottom: verticalScale(10),
  },
  backBtn: {
    padding: scale(5),
  },
  headerTitle: {
    color: colors.white,
    fontSize: moderateScale(20),
    fontWeight: "bold",
  },
  tabContainer: {
    flexDirection: "row",
    paddingHorizontal: scale(15),
    marginBottom: verticalScale(15),
  },
  tab: {
    flex: 1,
    paddingVertical: verticalScale(10),
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeTab: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    color: colors.textMuted,
    fontSize: moderateScale(15),
    fontWeight: "600",
  },
  activeTabText: {
    color: colors.white,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: scale(15),
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    padding: scale(15),
    borderRadius: moderateScale(15),
    marginBottom: verticalScale(10),
  },
  avatar: {
    width: moderateScale(50),
    height: moderateScale(50),
    borderRadius: moderateScale(25),
  },
  userInfo: {
    flex: 1,
    marginLeft: scale(15),
  },
  userName: {
    color: colors.white,
    fontSize: moderateScale(16),
    fontWeight: "bold",
  },
  userStatus: {
    color: colors.textMuted,
    fontSize: moderateScale(12),
    marginTop: verticalScale(2),
  },
  actionBtn: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    backgroundColor: colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  acceptBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary,
    paddingHorizontal: scale(15),
    paddingVertical: verticalScale(8),
    borderRadius: moderateScale(20),
    gap: scale(5),
  },
  acceptBtnText: {
    color: colors.white,
    fontWeight: "bold",
    fontSize: moderateScale(14),
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: verticalScale(50),
    gap: verticalScale(15),
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: moderateScale(16),
  },
});

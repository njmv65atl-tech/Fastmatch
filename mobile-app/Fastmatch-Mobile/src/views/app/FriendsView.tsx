import React, { useState } from "react";
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
import { ChevronLeft, UserCheck, UserPlus, Clock, X, UserMinus } from "lucide-react-native";
import { colors } from "../../utils/colors";
import { scale, verticalScale, moderateScale } from "../../helpers/metrics";
import { MobileContainer } from "../../components/UIComponents";
import {
  useMyFriendsQuery,
  useFriendRequestsQuery,
  useAcceptFriendRequestMutation,
  useSentFriendRequestsQuery,
  useRemoveFriendMutation
} from "../../redux/services/auth";
import { AppView } from "../../types";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import { IMG_URL } from "../../redux/services";
import { UserAvatar } from "../../components/UserAvatar";
import { useTranslation } from "react-i18next";

interface FriendsViewProps {
  setView: (view: AppView, params?: any) => void;
}

export const FriendsView: React.FC<FriendsViewProps> = ({ setView }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<"friends" | "requests">("friends");
  const user = useSelector((state: RootState) => state.persist.user);

  const { data: friendsData, isLoading: isLoadingFriends, refetch: refetchFriends } = useMyFriendsQuery({});
  const { data: requestsData, isLoading: isLoadingReqs, refetch: refetchReqs } = useFriendRequestsQuery({});
  const { data: sentReqsData, isLoading: isLoadingSentReqs, refetch: refetchSentReqs } = useSentFriendRequestsQuery({});
  const [acceptFriendRequest, { isLoading: isAccepting }] = useAcceptFriendRequestMutation();
  const [removeFriend, { isLoading: isRemoving }] = useRemoveFriendMutation();

  const handleDecline = async (userId: string) => {
    try {
      await removeFriend({ targetUserId: userId }).unwrap();
      refetchReqs();
    } catch (e) {
      console.warn("Failed to decline friend request:", e);
    }
  };

  const handleCancel = async (userId: string) => {
    try {
      await removeFriend({ targetUserId: userId }).unwrap();
      refetchSentReqs();
    } catch (e) {
      console.warn("Failed to cancel friend request:", e);
    }
  };

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
    const currentUserId = (user as any)?.id || (user as any)?._id;
    const friendObj = item.requester?._id === currentUserId ? item.recipient : item.requester;
    if (!friendObj) return null;

    return (
      <TouchableOpacity
        key={item._id}
        style={styles.userCard}
        activeOpacity={0.7}
        onPress={() => {
          setView(AppView.CHAT_DETAIL, {
            userId: friendObj._id,
            userName: friendObj.displayName || friendObj.fullName || friendObj.name || "Unknown",
            userAvatar: friendObj.profilePicture,
            item: friendObj
          });
        }}
      >
        <UserAvatar
          uri={friendObj.profilePicture}
          gender={friendObj.gender}
          name={friendObj.displayName || friendObj.fullName || friendObj.name}
          size={moderateScale(50)}
          borderRadius={moderateScale(25)}
        />
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{friendObj.displayName || friendObj.fullName || friendObj.name || "Unknown"}</Text>
          <Text style={styles.userStatus}>
            {t("friends.friendsSince", { date: new Date(item.createdAt).toLocaleDateString() })}
          </Text>
        </View>
        <View style={styles.actionBtn}>
          <UserCheck color={colors.primary} size={20} />
        </View>
      </TouchableOpacity>
    );
  };

  const renderRequestItem = (item: any) => {
    const requester = item.requester;
    if (!requester) return null;

    return (
      <View key={item._id} style={styles.userCard}>
        <UserAvatar
          uri={requester.profilePicture}
          gender={requester.gender}
          name={requester.displayName || requester.fullName || requester.name}
          size={moderateScale(50)}
          borderRadius={moderateScale(25)}
        />
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{requester.displayName || requester.fullName || requester.name || "Unknown"}</Text>
          <Text style={styles.userStatus}>{t("friends.wantsToBeFriends")}</Text>
        </View>
        <View style={{ flexDirection: 'column', gap: 5 }}>
          <TouchableOpacity
            style={styles.acceptBtn}
            onPress={() => handleAccept(item._id)}
            disabled={isAccepting}
          >
            <UserPlus color={colors.white} size={14} />
            <Text style={styles.acceptBtnText}>{t("friends.accept")}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.acceptBtn, { backgroundColor: colors.surfaceAlt }]}
            onPress={() => handleDecline(requester._id)}
            disabled={isRemoving}
          >
            <X color={colors.textMuted} size={14} />
            <Text style={[styles.acceptBtnText, { color: colors.textMuted }]}>{t("friends.decline")}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderSentRequestItem = (item: any) => {
    const recipient = item.recipient;
    if (!recipient) return null;

    return (
      <View key={item._id} style={styles.userCard}>
        <UserAvatar
          uri={recipient.profilePicture}
          gender={recipient.gender}
          name={recipient.displayName || recipient.fullName || recipient.name}
          size={moderateScale(50)}
          borderRadius={moderateScale(25)}
        />
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{recipient.displayName || recipient.fullName || recipient.name || "Unknown"}</Text>
          <Text style={styles.userStatus}>{t("friends.requestSent")}</Text>
        </View>
        <TouchableOpacity
          style={[styles.acceptBtn, { backgroundColor: colors.surfaceAlt }]}
          onPress={() => handleCancel(recipient._id)}
          disabled={isRemoving}
        >
          <UserMinus color={colors.danger} size={14} />
          <Text style={[styles.acceptBtnText, { color: colors.danger }]}>{t("friends.cancel")}</Text>
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
        <Text style={styles.headerTitle}>{t("friends.title")}</Text>
        <View style={{ width: moderateScale(40) }} />
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "friends" && styles.activeTab]}
          onPress={() => setActiveTab("friends")}
        >
          <Text style={[styles.tabText, activeTab === "friends" && styles.activeTabText]}>
            {t("friends.myFriends")}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "requests" && styles.activeTab]}
          onPress={() => setActiveTab("requests")}
        >
          <Text style={[styles.tabText, activeTab === "requests" && styles.activeTabText]}>
            {t("friends.requests")} {((requestsData?.data?.length || 0) + (sentReqsData?.data?.length || 0)) > 0 ? `(${((requestsData?.data?.length || 0) + (sentReqsData?.data?.length || 0))})` : null}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: scale(15), paddingBottom: 130 }}
        refreshControl={
          <RefreshControl
            refreshing={activeTab === 'friends' ? isLoadingFriends : isLoadingReqs}
            onRefresh={() => {
              if (activeTab === 'friends') refetchFriends();
              else {
                refetchReqs();
                refetchSentReqs();
              }
            }}
            tintColor={colors.primary}
          />
        }
      >
        {activeTab === "friends" ? (
          isLoadingFriends ? (
            <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
          ) : friendsData?.data?.length > 0 ? (
            friendsData.data.map(renderFriendItem)
          ) : (
            <View style={styles.emptyContainer}>
              <UserCheck color={colors.textMuted} size={48} />
              <Text style={styles.emptyText}>{t("friends.noFriends")}</Text>
            </View>
          )
        ) : (
          <View style={{ paddingBottom: 20 }}>
            <Text style={{ color: colors.white, fontSize: 16, fontWeight: 'bold', marginBottom: 10, marginTop: 5 }}>
              {t("friends.incomingRequests")}
            </Text>
            {isLoadingReqs ? (
              <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
            ) : requestsData?.data?.length > 0 ? (
              requestsData.data.map(renderRequestItem)
            ) : (
              <View style={[styles.emptyContainer, { marginTop: 20, marginBottom: 20 }]}>
                <Clock color={colors.textMuted} size={32} />
                <Text style={styles.emptyText}>{t("friends.noPendingRequests")}</Text>
              </View>
            )}

            <Text style={{ color: colors.white, fontSize: 16, fontWeight: 'bold', marginBottom: 10, marginTop: 20 }}>
              {t("friends.sentRequests")}
            </Text>
            {isLoadingSentReqs ? (
              <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
            ) : sentReqsData?.data?.length > 0 ? (
              sentReqsData.data.map(renderSentRequestItem)
            ) : (
              <View style={[styles.emptyContainer, { marginTop: 20 }]}>
                <Clock color={colors.textMuted} size={32} />
                <Text style={styles.emptyText}>{t("friends.noSentRequests")}</Text>
              </View>
            )}
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
    paddingVertical: verticalScale(10),
  },
  backBtn: {
    padding: moderateScale(5),
  },
  headerTitle: {
    fontSize: moderateScale(20),
    fontWeight: "bold",
    color: colors.white,
  },
  tabContainer: {
    flexDirection: "row",
    marginHorizontal: scale(15),
    marginVertical: verticalScale(10),
    backgroundColor: colors.surfaceAlt,
    borderRadius: moderateScale(10),
    padding: moderateScale(4),
  },
  tab: {
    flex: 1,
    paddingVertical: verticalScale(8),
    alignItems: "center",
    borderRadius: moderateScale(8),
  },
  activeTab: {
    backgroundColor: colors.primary,
  },
  tabText: {
    color: colors.textMuted,
    fontSize: moderateScale(14),
    fontWeight: "600",
  },
  activeTabText: {
    color: colors.white,
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    padding: moderateScale(12),
    borderRadius: moderateScale(12),
    marginBottom: verticalScale(10),
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  userInfo: {
    flex: 1,
    marginLeft: scale(12),
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
    padding: moderateScale(8),
    borderRadius: moderateScale(20),
    backgroundColor: colors.surfaceAlt,
  },
  acceptBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary,
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(6),
    borderRadius: moderateScale(20),
    gap: scale(4),
  },
  acceptBtnText: {
    color: colors.white,
    fontSize: moderateScale(12),
    fontWeight: "bold",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: verticalScale(40),
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: moderateScale(14),
    marginTop: verticalScale(10),
  },
});

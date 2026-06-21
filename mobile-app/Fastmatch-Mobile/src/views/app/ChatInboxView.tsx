import * as React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  RefreshControl,
  Dimensions,
} from "react-native";
import { MobileContainer, Header } from "../../components/UIComponents";
import { AppView } from "../../types";
import { colors } from "../../utils/colors";
import { useConversationHistoryQuery } from "../../redux/services/auth";
import { IMG_URL } from "../../redux/services";
import { socket } from "../../socket/socket";
import { useDispatch } from "react-redux";
import { setHasUnread } from "../../redux/slices/globalSlice";

const { width, height } = Dimensions.get("window");

const formatChatDate = (dateString: string) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const isToday = date.getDate() === now.getDate() && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  if (isToday) return time;
  
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[date.getMonth()]} ${date.getDate()}, ${time}`;
};

export const ChatInboxView: React.FC<{
  setView: (v: AppView) => void;
  onSelectUser: (id: string, name: string, avatarUrl?: string, unreadCount?: number , item?: any) => void;
}> = ({ setView, onSelectUser }) => {
  const { data, isLoading, error, refetch } = useConversationHistoryQuery({}, {
    refetchOnMountOrArgChange: true
  });
  const dispatch = useDispatch();
  const [refreshing, setRefreshing] = React.useState(false);
  
  // localUpdates stores real-time changes from the socket
  const [localUpdates, setLocalUpdates] = React.useState<{
    [senderId: string]: { unreadCount: number; message?: string; timestamp?: number };
  }>({});

  React.useEffect(() => {
    dispatch(setHasUnread(false));
  }, [dispatch]);

  const matchList = data?.data || [];

  const uniqueMatchList = React.useMemo(() => {
    const byUserId = new Map<string, any>();

    // 1. Group by ID and find latest interaction from API
    for (const item of matchList) {
      const existing = byUserId.get(item._id);
      if (!existing) {
        byUserId.set(item._id, { ...item });
        continue;
      }
      const existingTime = new Date(existing.lastInteractionAt || existing.lastMessage?.createdAt || 0).getTime();
      const nextTime = new Date(item.lastInteractionAt || item.lastMessage?.createdAt || 0).getTime();
      if (nextTime > existingTime) {
        byUserId.set(item._id, { ...item });
      }
    }

    // 2. Merge socket updates into the list
    for (const [senderId, update] of Object.entries(localUpdates)) {
      const existing = byUserId.get(senderId);
      if (existing) {
        existing.unreadCount = update.unreadCount;
        if (update.message) {
          existing.lastMessage = { ...existing.lastMessage, message: update.message };
        }
        if (update.timestamp) {
          // Update the interaction time so sorting picks it up
          existing.lastInteractionAt = new Date(update.timestamp).toISOString();
        }
      }
    }

    const arr = Array.from(byUserId.values());
    
    // 3. DESCENDING SORT (Newest at the top)
    arr.sort((a, b) => {
      const timeA = new Date(a.lastInteractionAt || a.lastMessage?.createdAt || 0).getTime();
      const timeB = new Date(b.lastInteractionAt || b.lastMessage?.createdAt || 0).getTime();
      return timeB - timeA; 
    });

    return arr;
  }, [matchList, localUpdates]);

  // ─── Socket Listener ─────────────────────────────────────────────────────
  React.useEffect(() => {
    const onNewMessageNotification = (payload: {
      senderId: string;
      totalUnreadCount: number;
      message: string;
    }) => {
      if (!payload?.senderId) return;

      setLocalUpdates((prev) => ({
        ...prev,
        [payload.senderId]: {
          unreadCount: payload.totalUnreadCount,
          message: payload.message,
          timestamp: Date.now(), // Capture current time for sorting
        },
      }));
    };

    socket.on("new-message-notification", onNewMessageNotification);
    return () => {
      socket.off("new-message-notification", onNewMessageNotification);
    };
  }, []);

  // ─── Pull-to-refresh ─────────────────────────────────────────────────────
  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
      setLocalUpdates({}); // Clear overrides after fresh API fetch
    } catch (err) {
      console.error("[ChatInbox] Refresh failed:", err);
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  // ─── Helpers ──────────────────────────────────────────────────────────────
  const getUnreadCount = (item: any): number => {
    const update = localUpdates[item._id];
    return update !== undefined ? update.unreadCount : (item.unreadCount || 0);
  };

  const hasUnread = (item: any): boolean => getUnreadCount(item) > 0;

  const handleChatPress = (item: any) => {
    const displayName = item.displayName || item.fullName || "Unknown User";
    const avatarUrl = item.profilePicture
      ? item.profilePicture.startsWith("http") ? item.profilePicture : `${IMG_URL}${item.profilePicture}`
      : undefined;

    const unreadCount = getUnreadCount(item);

    // Optimistically clear the unread count locally
    if (unreadCount > 0) {
      setLocalUpdates((prev) => ({
        ...prev,
        [item._id]: { ...(prev[item._id] || {}), unreadCount: 0 },
      }));
    }

    onSelectUser(item._id, displayName, avatarUrl, unreadCount , item);
  };

  return (
    <MobileContainer>
      <Header title="Chats" />
      <ScrollView
        contentContainerStyle={styles.inboxContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing || isLoading}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {isLoading && !refreshing && (
          <View style={styles.loadingContainer}><Text style={styles.loadingText}>Loading...</Text></View>
        )}

        {!isLoading && uniqueMatchList.length === 0 && (
          <View style={styles.emptyContainer}><Text style={styles.emptyText}>No chats found</Text></View>
        )}

        {uniqueMatchList.map((item: any) => {
          const count = getUnreadCount(item);
          return (
            <TouchableOpacity
              key={item._id}
              onPress={() => {
                console.log("the pressed user item is : ",item)
                handleChatPress(item)}}
              style={[styles.chatRow, count > 0 && styles.chatRowUnread]}
              activeOpacity={0.7}
            >
              <View style={styles.avatarContainer}>
                <Image
                  source={{
                    uri: item.profilePicture
                      ? item.profilePicture.startsWith("http") ? item.profilePicture : `${IMG_URL}${item.profilePicture}`
                      : "https://via.placeholder.com/100",
                  }}
                  style={styles.chatAvatar}
                />
                {count > 0 && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadCount}>{count > 99 ? "99+" : count}</Text>
                  </View>
                )}
              </View>

              <View style={styles.chatInfo}>
                <View style={styles.chatHeader}>
                  <Text style={[styles.chatName, count > 0 && styles.chatNameUnread]} numberOfLines={1}>
                    {item.displayName || item.fullName || "Unknown User"}
                  </Text>
                  <Text style={styles.chatTime}>
                    {item.lastInteractionAt ? formatChatDate(item.lastInteractionAt) : ""}
                  </Text>
                </View>
                <View style={styles.chatPreviewRow}>
                  <Text style={styles.chatPreview} numberOfLines={1}>
                    {item.isBlockedByMe ? "Blocked" : item.amIBlocked ? "Blocked You" : item.isCallsBlockedByMe ? "Calls Blocked" : item.amICallBlocked ? "Your Calls Blocked" : (item.lastMessage?.message || "Start a conversation")}
                  </Text>
                  {item.isBlockedByMe && <View style={styles.blockedBadge}><Text style={styles.blockedBadgeText}>Blocked</Text></View>}
                  {!item.isBlockedByMe && item.isCallsBlockedByMe && <View style={styles.callsBlockedBadge}><Text style={styles.callsBlockedBadgeText}>Calls Off</Text></View>}
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </MobileContainer>
  );
};

const styles = StyleSheet.create({
  inboxContent: { padding: 16, paddingBottom: 100, gap: 12 },
  chatRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    gap: 16,
    marginBottom: 12,
  },
  chatRowUnread: { backgroundColor: colors.surfaceAlt, borderColor: colors.primary, borderWidth: 1.5 },
  avatarContainer: { position: "relative" },
  chatAvatar: { width: 60, height: 60, borderRadius: 30, borderWidth: 2, borderColor: colors.surfaceAlt },
  unreadBadge: {
    position: "absolute", top: -4, right: -4,
    backgroundColor: colors.primary, minWidth: 20, height: 20,
    borderRadius: 10, justifyContent: "center", alignItems: "center",
    borderWidth: 2, borderColor: colors.background, elevation: 3,
  },
  unreadCount: { color: colors.white, fontSize: 10, fontWeight: "bold" },
  chatInfo: { flex: 1 },
  chatHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  chatName: { fontSize: 18, fontWeight: "bold", color: colors.white, flex: 1, marginRight: 8 },
  chatNameUnread: { fontWeight: "900" },
  chatTime: { color: colors.textMuted, fontSize: 12 },
  chatPreviewRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  chatPreview: { color: colors.textMuted, fontSize: 14, flex: 1 },
  blockedBadge: { backgroundColor: colors.danger, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2, marginLeft: 8 },
  blockedBadgeText: { color: colors.white, fontSize: 10, fontWeight: "bold" },
  callsBlockedBadge: { backgroundColor: colors.goldStrong, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2, marginLeft: 8 },
  callsBlockedBadgeText: { color: colors.white, fontSize: 10, fontWeight: "bold" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", minHeight: 200 },
  loadingText: { color: colors.textMuted, fontSize: 16 },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center", minHeight: 400 },
  emptyText: { color: colors.textMuted, fontSize: 16 },
});
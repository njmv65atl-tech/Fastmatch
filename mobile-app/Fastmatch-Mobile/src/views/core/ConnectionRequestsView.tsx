import * as React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
} from "react-native";
import { ArrowLeft, Inbox, Check, X } from "lucide-react-native";
import { MobileContainer, Button } from "../../components/UIComponents";
import { AppView } from "../../types";
import { colors } from "../../utils/colors";
import {
  useFriendRequestsQuery,
  useAcceptFriendRequestMutation,
  useRejectFriendRequestMutation,
} from "../../redux/services/auth";
import { BASE_URL } from "../../redux/services/apiEndpoint";
import { ShowAlertMessage, popTypes } from "../../helpers/commonFunctions";

export const ConnectionRequestsView: React.FC<{ setView: (v: AppView) => void }> = ({
  setView,
}) => {
  const { data, isLoading } = useFriendRequestsQuery({});
  const [acceptRequest, { isLoading: isAccepting }] = useAcceptFriendRequestMutation();
  const [rejectRequest, { isLoading: isRejecting }] = useRejectFriendRequestMutation();

  const requests = data?.data || [];

  const handleAccept = async (requestId: string) => {
    try {
      await acceptRequest({ requestId }).unwrap();
      ShowAlertMessage("Request accepted! You are now connected.", popTypes.success);
      setView(AppView.CHAT_INBOX);
    } catch (error: any) {
      ShowAlertMessage(error?.data?.message || "Failed to accept request", popTypes.error);
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      await rejectRequest({ requestId }).unwrap();
      ShowAlertMessage("Request removed.", popTypes.success);
    } catch (error: any) {
      ShowAlertMessage(error?.data?.message || "Failed to reject request", popTypes.error);
    }
  };

  const renderRequest = ({ item }: { item: any }) => {
    const requester = item.requester;
    if (!requester) return null;
    
    return (
      <View style={styles.card}>
        <View style={styles.headerRow}>
          {requester.profilePicture ? (
            <Image
              source={{ uri: `${BASE_URL}/uploads/${requester.profilePicture}` }}
              style={styles.avatar}
            />
          ) : (
            <View style={[styles.avatar, styles.fallbackImage]}>
              <Text style={styles.fallbackText}>
                {requester.displayName?.charAt(0)?.toUpperCase()}
              </Text>
            </View>
          )}
          <View style={styles.info}>
            <Text style={styles.name}>{requester.displayName}</Text>
            <Text style={styles.subtext}>
              {requester.age ? `${requester.age} yrs • ` : ""}{requester.gender || "Any"}
            </Text>
          </View>
        </View>

        {item.message ? (
          <View style={styles.messageBox}>
            <Text style={styles.messageText}>"{item.message}"</Text>
          </View>
        ) : null}

        <View style={styles.actionsRow}>
          <TouchableOpacity 
            style={[styles.actionBtn, styles.rejectBtn]} 
            onPress={() => handleReject(item._id)}
            disabled={isRejecting || isAccepting}
          >
            <X color={colors.white} size={20} />
            <Text style={styles.btnText}>Decline</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionBtn, styles.acceptBtn]} 
            onPress={() => handleAccept(item._id)}
            disabled={isRejecting || isAccepting}
          >
            <Check color={colors.white} size={20} />
            <Text style={styles.btnText}>Accept</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <MobileContainer>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setView(AppView.HOME)} style={styles.backBtn}>
          <ArrowLeft color={colors.textPrimary} size={24} />
        </TouchableOpacity>
        <Inbox color={colors.primary} size={24} style={{ marginRight: 8 }} />
        <Text style={styles.headerTitle}>Requests</Text>
      </View>

      <Text style={styles.subtitle}>
        People who want to connect with you.
      </Text>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          renderItem={renderRequest}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No pending requests right now.</Text>
          }
        />
      )}
    </MobileContainer>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  backBtn: {
    padding: 8,
    marginLeft: -8,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.textPrimary,
  },
  subtitle: {
    color: colors.textPlaceholder,
    fontSize: 14,
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  list: {
    paddingBottom: 40,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  fallbackImage: {
    backgroundColor: colors.surfaceSecondary,
    justifyContent: "center",
    alignItems: "center",
  },
  fallbackText: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.textPlaceholder,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.textPrimary,
    marginBottom: 4,
  },
  subtext: {
    fontSize: 14,
    color: colors.textPlaceholder,
  },
  messageBox: {
    backgroundColor: "rgba(255,255,255,0.05)",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  messageText: {
    color: colors.textPrimary,
    fontStyle: "italic",
    fontSize: 14,
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  rejectBtn: {
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  acceptBtn: {
    backgroundColor: colors.primary,
  },
  btnText: {
    color: colors.white,
    fontWeight: "bold",
    fontSize: 15,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    color: colors.textPlaceholder,
    textAlign: "center",
    marginTop: 40,
  },
});

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
import { ShowAlertMessage, popTypes } from "../../helpers/commonFunctions";
import { UserAvatar } from "../../components/UserAvatar";
import { useTranslation } from "react-i18next";

export const ConnectionRequestsView: React.FC<{ setView: (v: AppView) => void }> = ({
  setView,
}) => {
  const { t } = useTranslation();
  const { data, isLoading, refetch } = useFriendRequestsQuery({});
  const [acceptRequest, { isLoading: isAccepting }] = useAcceptFriendRequestMutation();
  const [rejectRequest, { isLoading: isRejecting }] = useRejectFriendRequestMutation();

  const requests = data?.data || [];

  React.useEffect(() => {
    refetch();
  }, []);

  const handleAccept = async (requestId: string) => {
    try {
      await acceptRequest({ requestId }).unwrap();
      ShowAlertMessage(t("requests.acceptedSuccess"), popTypes.success);
      setView(AppView.CHAT_INBOX);
    } catch (error: any) {
      ShowAlertMessage(error?.data?.message || t("requests.failedAccept"), popTypes.error);
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      await rejectRequest({ requestId }).unwrap();
      ShowAlertMessage(t("requests.removedSuccess"), popTypes.success);
    } catch (error: any) {
      ShowAlertMessage(error?.data?.message || t("requests.failedReject"), popTypes.error);
    }
  };

  const renderRequest = ({ item }: { item: any }) => {
    const requester = item.requester;
    if (!requester) return null;
    
    return (
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <UserAvatar
            uri={requester.profilePicture}
            gender={requester.gender}
            name={requester.displayName}
            size={48}
            borderRadius={24}
          />
          <View style={styles.info}>
            <Text style={styles.name}>{requester.displayName}</Text>
            <Text style={styles.subtext}>
              {requester.age ? `${requester.age} ${t("discovery.yrs")} • ` : ""}{requester.gender || "Any"}
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
            <Text style={styles.btnText}>{t("requests.decline")}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionBtn, styles.acceptBtn]} 
            onPress={() => handleAccept(item._id)}
            disabled={isRejecting || isAccepting}
          >
            <Check color={colors.white} size={20} />
            <Text style={styles.btnText}>{t("requests.accept")}</Text>
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
        <Text style={styles.headerTitle}>{t("requests.title")}</Text>
      </View>

      <Text style={styles.subtitle}>
        {t("requests.subtitle")}
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
            <Text style={styles.emptyText}>{t("requests.empty")}</Text>
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
    backgroundColor: "rgba(30, 41, 59, 0.7)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  info: {
    marginLeft: 12,
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.textPrimary,
  },
  subtext: {
    fontSize: 13,
    color: colors.textPlaceholder,
    marginTop: 2,
  },
  messageBox: {
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  messageText: {
    color: colors.textPlaceholder,
    fontSize: 14,
    fontStyle: "italic",
    lineHeight: 20,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  rejectBtn: {
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.3)",
  },
  acceptBtn: {
    backgroundColor: colors.primary,
  },
  btnText: {
    color: colors.white,
    fontWeight: "600",
    fontSize: 14,
  },
  emptyText: {
    color: colors.textPlaceholder,
    textAlign: "center",
    marginTop: 40,
    fontSize: 15,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 60,
  },
});

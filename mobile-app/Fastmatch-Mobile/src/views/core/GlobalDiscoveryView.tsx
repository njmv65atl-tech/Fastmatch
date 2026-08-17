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
} from "react-native";
import { useSelector } from "react-redux";
import { ArrowLeft, Globe, Send, AlertTriangle } from "lucide-react-native";
import { MobileContainer, Button } from "../../components/UIComponents";
import { AppView } from "../../types";
import { colors } from "../../utils/colors";
import { RootState } from "../../redux/store";
import {
  useGetGlobalUsersQuery,
  useSendFriendRequestMutation,
} from "../../redux/services/auth";
import { BASE_URL } from "../../redux/services/apiEndpoint";
import { ShowAlertMessage, popTypes } from "../../helpers/commonFunctions";

export const GlobalDiscoveryView: React.FC<{ setView: (v: AppView) => void }> = ({
  setView,
}) => {
  const { user } = useSelector((state: RootState) => state.auth);
  
  const [page, setPage] = React.useState(1);
  const { data, isLoading, isFetching } = useGetGlobalUsersQuery({
    page,
    limit: 30,
  });
  
  const [sendFriendRequest, { isLoading: isSending }] = useSendFriendRequestMutation();

  const [selectedUser, setSelectedUser] = React.useState<any>(null);
  const [message, setMessage] = React.useState("");

  const users = data?.data?.users || [];

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

  const renderUser = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.8}
      onPress={() => {
        if (user?.isPremium !== 'premium') {
          ShowAlertMessage("You must be a premium user to send connection requests.", popTypes.info);
          setView(AppView.SUBSCRIPTION);
          return;
        }
        setSelectedUser(item);
      }}
    >
      <View style={styles.imageContainer}>
        {item.profilePicture ? (
          <Image
            source={{ uri: `${BASE_URL}/uploads/${item.profilePicture}` }}
            style={styles.image}
          />
        ) : (
          <View style={[styles.image, styles.fallbackImage]}>
            <Text style={styles.fallbackText}>
              {item.displayName?.charAt(0)?.toUpperCase()}
            </Text>
          </View>
        )}
        
        {/* Online Indicator */}
        {item.isOnline && (
          <View style={styles.onlineBadge}>
            <View style={styles.onlineDot} />
          </View>
        )}
      </View>
      
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {item.displayName}
        </Text>
        <Text style={styles.subtext}>
          {item.age ? `${item.age} • ` : ""}{item.gender || "Any"}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <MobileContainer>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setView(AppView.HOME)} style={styles.backBtn}>
          <ArrowLeft color={colors.text} size={24} />
        </TouchableOpacity>
        <Globe color={colors.primary} size={24} style={{ marginRight: 8 }} />
        <Text style={styles.headerTitle}>Global Network</Text>
      </View>

      <Text style={styles.subtitle}>
        Browse and connect with registered users globally.
      </Text>

      {/* Grid */}
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item._id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.list}
          renderItem={renderUser}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No users found.</Text>
          }
        />
      )}

      {/* Send Request Modal */}
      <Modal visible={!!selectedUser} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity 
              style={styles.closeBtn} 
              onPress={() => {
                setSelectedUser(null);
                setMessage("");
              }}
            >
              <Text style={{ color: colors.white, fontSize: 16 }}>✕</Text>
            </TouchableOpacity>

            <View style={{ alignItems: "center", marginBottom: 16 }}>
              {selectedUser?.profilePicture ? (
                <Image
                  source={{ uri: `${BASE_URL}/uploads/${selectedUser.profilePicture}` }}
                  style={styles.modalImage}
                />
              ) : (
                <View style={[styles.modalImage, styles.fallbackImage]}>
                  <Text style={styles.fallbackText}>
                    {selectedUser?.displayName?.charAt(0)?.toUpperCase()}
                  </Text>
                </View>
              )}
            </View>
            
            <Text style={styles.modalTitle}>Connect with {selectedUser?.displayName}</Text>
            <Text style={styles.modalSubtitle}>Include a personal message with your request (optional).</Text>
            
            <TextInput
              style={styles.input}
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
    color: colors.text,
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
  row: {
    justifyContent: "space-between",
    marginBottom: 16,
  },
  card: {
    width: "48%",
    backgroundColor: colors.surface,
    borderRadius: 16,
    overflow: "hidden",
  },
  imageContainer: {
    width: "100%",
    aspectRatio: 1,
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  fallbackImage: {
    backgroundColor: colors.surfaceSecondary,
    justifyContent: "center",
    alignItems: "center",
  },
  fallbackText: {
    fontSize: 40,
    fontWeight: "bold",
    color: colors.textPlaceholder,
  },
  onlineBadge: {
    position: "absolute",
    bottom: 8,
    right: 8,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  onlineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.success,
  },
  info: {
    padding: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 4,
  },
  subtext: {
    fontSize: 12,
    color: colors.textPlaceholder,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 24,
    position: "relative",
  },
  closeBtn: {
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
  modalImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.text,
    textAlign: "center",
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: colors.textPlaceholder,
    textAlign: "center",
    marginBottom: 20,
  },
  input: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    padding: 16,
    color: colors.white,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: "top",
  },
});

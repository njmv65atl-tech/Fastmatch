
import * as React from "react";
import {
  BackHandler,
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
  Platform,
  RefreshControl,
  LayoutAnimation,
  KeyboardAvoidingView, // Added
  TouchableWithoutFeedback, // Added
  Keyboard, // Added
  Modal,
  Pressable,
  Alert,
} from "react-native";
import { MobileContainer } from "../../components/UIComponents";
import { colors } from "../../utils/colors";
import { CHAT_DETAIL_TEXT } from "../../utils/commonText";
import { launchImageLibrary } from 'react-native-image-picker';
import { useBlockUserMutation, useChatHistoryQuery, useClearChatMutation, useUnblockUserMutation, useBlockCallsMutation, useUnblockCallsMutation, useDeleteMessagesMutation, useEditMessageMutation, useReportBlockMutation, authApi, useMyFriendsQuery, useFriendRequestsQuery, useSendFriendRequestMutation, useAcceptFriendRequestMutation, useRemoveFriendMutation } from "../../redux/services/auth";
import { useDispatch } from "react-redux";
import { Send, ChevronLeft, MoreVertical, ShieldBan, Trash2, Pencil, Flag, Phone, Image as ImageIcon, UserPlus, UserMinus, Check, X } from "lucide-react-native";
import socketService from "../../helpers/SocketService";
import { moderateScale , scale, verticalScale } from "../../helpers/metrics";
import { managerApiCall } from "../../helpers/managerApiCallFn";
import { NotificationService } from "../../helpers/notificationService";
import { ShowAlertMessage, popTypes } from "../../helpers/commonFunctions";

 
const { width, height } = Dimensions.get("window");

interface ChatDetailProps {
  userId: string;
  chatUserName?: string;
  chatUserAvatar?: string;
  currentUserId: string;
  unreadCount?: number;
  chatUser?: any;
  onBack: () => void;
}

const formatDateHeader = (dateString: string) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
};

// Legacy backward-compatible decrypt for old [E2EE] messages; new messages stored as plaintext
const simulateEncrypt = (text: string) => text;
const simulateDecrypt = (text: string) => {
   if (text?.startsWith('[E2EE] ')) {
       return text.replace('[E2EE] ', '').split('').reverse().join('');
   }
   return text;
};

const toComparableUserId = (value: any) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  return String(value._id || value.id || value.userId || value);
};

const REPORT_REASONS = [
  { id: "inappropriate", label: "Inappropriate behavior", icon: "🚫" },
  { id: "harassment",    label: "Harassment or bullying",  icon: "😠" },
  { id: "spam",          label: "Spam or scam",            icon: "⚠️" },
  { id: "hate_speech",   label: "Hate speech",             icon: "🛑" },
  { id: "nudity",        label: "Nudity or sexual content",icon: "🔞" },
];

interface ReportModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (selected: string[], note: string) => void;
}

const ReportModal: React.FC<ReportModalProps> = ({ visible, onClose, onSubmit }) => {
  const [selected, setSelected] = React.useState<string[]>([]);
  const [note, setNote] = React.useState("");
  

const scrollViewRef = React.useRef<ScrollView>(null);
const [keyboardOpen, setKeyboardOpen] = React.useState(false);

React.useEffect(() => {
  const showSub = Keyboard.addListener('keyboardDidShow', () => {
    setKeyboardOpen(true);

    // ✅ Scroll to bottom when keyboard opens
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100); // small delay to let layout adjust first
  });

  const hideSub = Keyboard.addListener('keyboardDidHide', () => {
    setKeyboardOpen(false);
  });

  return () => {
    showSub.remove();
    hideSub.remove();
  };
}, []);

  const toggleReason = (id: string) => {
    setSelected((prev) => {
      const updated = prev.includes(id)
        ? prev.filter((r) => r !== id)
        : [...prev, id];
      return updated;
    });
  };

  const handleSubmit = () => {
    onSubmit(selected, note.trim());
    setSelected([]);
    setNote("");
  };

  const handleClose = () => {
    setSelected([]);
    setNote("");
    onClose();
  };

  const canSubmit = selected.length > 0 || note.trim().length > 0;

  if (!visible) return null;

  // Using a View overlay instead of Modal for iOS stability
  return (
    <View style={modalStyles.overlayWrapper}>
      <TouchableOpacity
        style={modalStyles.backdrop}
        activeOpacity={1}
        onPress={handleClose}
      />

      <View style={modalStyles.sheet}>
        <View style={modalStyles.handle} />

        <View style={modalStyles.header}>
          <Text style={modalStyles.title}>Report User</Text>
          <Text style={modalStyles.subtitle}>
            Select , or write your own.
          </Text>
        </View>

       <ScrollView
       ref={scrollViewRef} 
  style={modalStyles.scroll}
  contentContainerStyle={{
   paddingBottom: keyboardOpen 
  ? Platform.OS === 'ios' ? 230 : 0   // ← keyboard open (230 + 100 extra)
  : Platform.OS === 'ios' ? 0 : 0              // ← keyboard closed
  }}
  showsVerticalScrollIndicator={false}
  keyboardShouldPersistTaps="handled"
>
          <View style={modalStyles.reasonsGrid}>
            {REPORT_REASONS.map((reason) => {
              const isActive = selected.includes(reason.id);
              return (
                <TouchableOpacity
                  key={reason.id}
                  style={[modalStyles.reasonChip, isActive && modalStyles.reasonChipActive]}
                  onPress={() => toggleReason(reason.id)}
                  activeOpacity={0.75}
                >
                  <Text style={modalStyles.reasonIcon}>{reason.icon}</Text>
                  <Text style={[modalStyles.reasonLabel, isActive && modalStyles.reasonLabelActive]}>
                    {reason.label}
                  </Text>
                  {isActive && (
                    <View style={modalStyles.checkBadge}>
                      <Text style={modalStyles.checkMark}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={modalStyles.divider}>
            <View style={modalStyles.dividerLine} />
            <Text style={modalStyles.dividerText}>or describe</Text>
            <View style={modalStyles.dividerLine} />
          </View>

          <TextInput
            style={modalStyles.input}
            placeholder="Describe the issue in your own words…"
            placeholderTextColor="#555869"
            multiline
            numberOfLines={4}
            maxLength={500}
            value={note}
            onChangeText={setNote}
            textAlignVertical="top"
          />
          <Text style={modalStyles.charCount}>{note.length}/500</Text>
        </ScrollView>

        <View style={modalStyles.actions}>
          <TouchableOpacity style={modalStyles.cancelBtn} onPress={handleClose} activeOpacity={0.8}>
            <Text style={modalStyles.cancelText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[modalStyles.submitBtn, !canSubmit && modalStyles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={!canSubmit}
            activeOpacity={0.85}
          >
            <Text style={[modalStyles.submitText, !canSubmit && modalStyles.submitTextDisabled]}>
              Submit Report
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

// ChatDetailView

export const ChatDetailView: React.FC<ChatDetailProps> = ({
  userId, 
  chatUserName,
  chatUserAvatar,
  currentUserId,
  unreadCount,
  chatUser,
  onBack,
}) => {
  // Sync current chat ID with notification service to suppress toast/notifications
  React.useEffect(() => {
    if (userId) {
      const comparableId = toComparableUserId(userId);
      NotificationService.setCurrentChatId(comparableId);
    }
    return () => {
      NotificationService.setCurrentChatId(null);
    };
  }, [userId]);

  const { data, isLoading, isFetching, refetch } = useChatHistoryQuery(userId, {
    refetchOnMountOrArgChange: true,
  });

  const { data: myFriendsData, refetch: refetchFriends } = useMyFriendsQuery({});
  const { data: friendReqsData, refetch: refetchFriendReqs } = useFriendRequestsQuery({});
  const [sendFriendRequest] = useSendFriendRequestMutation();
  const [acceptFriendRequest] = useAcceptFriendRequestMutation();
  const [removeFriend] = useRemoveFriendMutation();

  const [requestSent, setRequestSent] = React.useState(false);
  const [isFriendLocal, setIsFriendLocal] = React.useState(false);

  // Derive friendship status
  const isFriend = React.useMemo(() => {
    if (isFriendLocal) return true;
    if (!myFriendsData?.data) return false;
    return myFriendsData.data.some((f: any) => 
      f.requester?._id === userId || f.recipient?._id === userId
    );
  }, [myFriendsData, userId, isFriendLocal]);

  // Listen for friend-request-accepted event to update UI instantly for the sender
  React.useEffect(() => {
    const handleFriendAccepted = (data: any) => {
      // If the recipient of our request accepted it, they are the one we are currently chatting with
      if (data?.recipientId === userId || data?.requesterId === userId) {
        setIsFriendLocal(true);
      }
    };
    
    // Using on/off specific handler so we don't accidentally remove global listeners
    socketService.on("friend-request-accepted", handleFriendAccepted);
    return () => {
      socketService.off("friend-request-accepted");
    };
  }, [userId]);

  const requestReceivedId = React.useMemo(() => {
    if (!friendReqsData?.data) return null;
    const req = friendReqsData.data.find((r: any) => r.requester?._id === userId);
    return req ? req._id : null;
  }, [friendReqsData, userId]);

  const [chatMessages, setChatMessages] = React.useState<any[]>([]);
  const [newMessage, setNewMessage] = React.useState("");
  const [refreshing, setRefreshing] = React.useState(false);
  const [expandedMessages, setExpandedMessages] = React.useState<Record<string, boolean>>({});
  const [menuVisible, setMenuVisible] = React.useState(false);
  const [messageActionVisible, setMessageActionVisible] = React.useState(false);
  const [selectedMsg, setSelectedMsg] = React.useState<any>(null);
  const [reportVisible, setReportVisible] = React.useState(false);
  const [translatedMessages, setTranslatedMessages] = React.useState<Record<string, string>>({});
  const [profilePopupVisible, setProfilePopupVisible] = React.useState(false);
  const [icebreakerModalVisible, setIcebreakerModalVisible] = React.useState(false);
  const [imageViewerVisible, setImageViewerVisible] = React.useState(false);
  const [imageViewerUrl, setImageViewerUrl] = React.useState<string | null>(null);
  const [imageViewerMsgId, setImageViewerMsgId] = React.useState<string | null>(null);
  const [isViewOnceMode, setIsViewOnceMode] = React.useState(false);

  // api hooks
  const dispatch = useDispatch<any>();
  const [clearChat] = useClearChatMutation();
  const [blockUser] = useBlockUserMutation();
  const [unblockUser] = useUnblockUserMutation();
  const [blockCalls] = useBlockCallsMutation();
  const [unblockCalls] = useUnblockCallsMutation();
  const [deleteMessages] = useDeleteMessagesMutation();
  const [editMessage] = useEditMessageMutation();
  const [reportBlock] = useReportBlockMutation();

  const [localChatUser, setLocalChatUser] = React.useState(chatUser);
  const [isEditing, setIsEditing] = React.useState(false);
  const [editingMessageId, setEditingMessageId] = React.useState<string | null>(null);

  const [isTyping, setIsTyping] = React.useState(false);
  const typingTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    setLocalChatUser(chatUser);
  }, [chatUser]);

  React.useEffect(() => {
    const handleTyping = (data: any) => {
      if (data.userId === userId) {
        setIsTyping(true);
      }
    };
    const handleStopTyping = (data: any) => {
      if (data.userId === userId) {
        setIsTyping(false);
      }
    };
    socketService.on("typing", handleTyping);
    socketService.on("stopTyping", handleStopTyping);
    return () => {
      socketService.off("typing");
      socketService.off("stopTyping");
    };
  }, [userId]);

  const handleTextChange = (text: string) => {
    setNewMessage(text);
    if (!isEditing && text.trim().length > 0) {
      socketService.emit("typing", { receiverId: userId });
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socketService.emit("stopTyping", { receiverId: userId });
      }, 1500);
    }
  };

  // ─── Refs & State ─────────────────────────────────────────────────────────────
  const scrollRef = React.useRef<ScrollView>(null);
  const isInitialLoad = React.useRef(true);       // first render guard
  const isPullRefresh = React.useRef(false);      // pull-to-refresh guard
  const prevContentHeight = React.useRef(0);      // to restore position after refresh
  const [scrollReady, setScrollReady] = React.useState(false);
  
  const handleRefresh = React.useCallback(() => {
  isPullRefresh.current = true;           // mark that this is a pull-to-refresh
  onRefresh();                            // your existing refresh logic
}, [refreshing]);


  // Android System Back Button Handler
  React.useEffect(() => {
    const handleBackPress = () => {
      onBack();
      return true;
    };

    if (Platform.OS === "android") {
      BackHandler.addEventListener("hardwareBackPress", handleBackPress);
    }

    return () => {
      if (Platform.OS === "android") {
        BackHandler.removeEventListener("hardwareBackPress", handleBackPress);
      }
    };
  }, [onBack]);

  // Freeze the initial unread count on mount so the divider doesn't move when we get new messages
  const [unreadDividerIndex, setUnreadDividerIndex] = React.useState<number | null>(null);
  const hasInitialized = React.useRef(false);

  // ─── Track when a real fetch completes ──────────────────────────────────────
const prevIsFetching = React.useRef(false);

React.useEffect(() => {
  if (!data?.data) return;
  console.log("the data from the api is: ", data)

  const messagesArray = Array.isArray(data.data)
    ? data.data
    : data.data.messages || [];

  const apiUnreadCount =
    typeof data.data.unreadCount === "number" ? data.data.unreadCount : 0;

  const sortedMessages = [...messagesArray].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  setChatMessages((prev) => {
    const localMessages = prev.filter((m) => String(m._id).startsWith("local-"));
    const pendingLocals = localMessages.filter((localMsg) => {
      const isAlreadyInApi = sortedMessages.some((apiMsg) =>
        toComparableUserId(apiMsg.sender) === toComparableUserId(localMsg.sender) &&
        apiMsg.message.trim().toLowerCase() === localMsg.message.trim().toLowerCase()
      );
      return !isAlreadyInApi;
    });
    
    return [...sortedMessages, ...pendingLocals].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  });

  // ✅ Only fires when isFetching just flipped false → meaning fresh data arrived
  const fetchJustCompleted = prevIsFetching.current === true && isFetching === false;
  prevIsFetching.current = isFetching;

  if (fetchJustCompleted && !hasInitialized.current) {
    if (apiUnreadCount > 0 && sortedMessages.length > 0) {
      const calculatedIndex = Math.max(0, sortedMessages.length - apiUnreadCount);
      setUnreadDividerIndex(calculatedIndex);
      console.log(`🔒 [ChatDetail] Divider FIXED at index ${calculatedIndex} (unread: ${apiUnreadCount})`);
    } else {
      setUnreadDividerIndex(null);
      console.log("🔒 [ChatDetail] No unread messages, divider cleared.");
    }
    hasInitialized.current = true;
  }

}, [data, isFetching]);




  // Handle Socket Real-time updates
  React.useEffect(() => {
    if (!currentUserId || !userId) return;

    const currentChatTargetId = toComparableUserId(userId);
    const myId = toComparableUserId(currentUserId);

    const handleIncoming = (payload: any) => {
      const sender = toComparableUserId(payload.sender || payload.senderId || payload.from);
      const receiver = toComparableUserId(payload.receiver || payload.receiverId || payload.to);
      const messageText = payload.message || "";

      const isFromTarget = sender === currentChatTargetId && receiver === myId;
      const isFromMe = sender === myId && receiver === currentChatTargetId;

      if (isFromTarget || isFromMe) {
        // Force a refetch of history to get the real database _id for sent messages
        refetch();

        if (isFromTarget && payload._id) {
          socketService.emit("messageRead", { messageId: payload._id, senderId: sender });
        }

        setChatMessages((prev) => {
          const msgId = payload._id || payload.id;
          
          // If we already have this real ID, don't add it again
          if (msgId && prev.find((m) => m._id === msgId)) return prev;

          // If it's from ME, find the matching local message and replace its temporary ID
          if (isFromMe) {
            const localIndex = prev.findIndex(m => 
              String(m._id).startsWith('local-') && 
              m.message.trim().toLowerCase() === messageText.trim().toLowerCase()
            );
            
            if (localIndex !== -1) {
              const updated = [...prev];
              updated[localIndex] = {
                ...updated[localIndex],
                _id: msgId || updated[localIndex]._id,
                createdAt: payload.createdAt || updated[localIndex].createdAt
              };
              return updated;
            }
          }

          return [
            ...prev,
            {
              _id: msgId || `temp-${Date.now()}`,
              sender,
              receiver,
              message: messageText,
              createdAt: payload.createdAt || new Date().toISOString(),
            },
          ];
        });

        // Tell backend we "saw" the new message by triggering a silent history fetch
        if (isFromTarget) {
          refetch();
        }
      }
    };

    const handleEdited = (payload: any) => {
      console.log("📥 [Socket] handleEdited payload:", payload);
      // Backend says payload is { updatedMessageObject } or just { messageId, newMessage }
      const updatedMsg = payload.updatedMessageObject || payload;
      const msgId = updatedMsg._id || updatedMsg.id || payload.messageId || payload.id;
      let newText = updatedMsg.message || updatedMsg.newMessage || updatedMsg.text || payload.message || payload.newMessage;
      
      // If newText is still an object, try to extract message from it
      if (typeof newText === 'object' && newText !== null) {
        newText = newText.message || newText.text || newText.content || "";
      }

      if (msgId) {
        setChatMessages((prev) =>
          prev.map((m) => 
            String(m._id) === String(msgId) 
              ? { ...m, message: String(newText), isEdited: updatedMsg.isEdited ?? true } 
              : m
          )
        );
      }
    };

    const handleDeleted = (payload: any) => {
      console.log("📥 [Socket] handleDeleted payload:", payload);
      // Payload: { "messageIds": ["id1", "id2"], "deletedBy": "userId" }
      const deletedBy = toComparableUserId(payload.deletedBy);
      const msgIds = payload.messageIds;
      
      if (!msgIds || !Array.isArray(msgIds)) return;

      // Only clear if the deletion happened in this conversation
      if (deletedBy === currentChatTargetId || deletedBy === myId) {
        setChatMessages((prev) =>
          prev.filter((m) => !msgIds.includes(m._id))
        );
      }
    };

    const handleChatCleared = (payload: any) => {
      console.log("🧹 [Socket] handleChatCleared payload:", payload);
      // Payload: { "clearedBy": "userId" }
      const clearedBy = toComparableUserId(payload.clearedBy);
      
      if (clearedBy === currentChatTargetId || clearedBy === myId) {
        setChatMessages([]);
      }
    };

    const handleMessageRead = (payload: any) => {
      setChatMessages(prev => prev.map(m => {
        if (!payload.messageId || m._id === payload.messageId || m.id === payload.messageId) {
          return { ...m, isRead: true };
        }
        return m;
      }));
    };

    socketService.on("receive-message", handleIncoming);
    socketService.on("message-edited", handleEdited);
    socketService.on("messages-deleted", handleDeleted);
    socketService.on("chat-cleared", handleChatCleared);
    socketService.on("messageRead", handleMessageRead);

    return () => {
      socketService.off("receive-message");
      socketService.off("message-edited");
      socketService.off("messages-deleted");
      socketService.off("chat-cleared");
      socketService.off("messageRead");
    };
  }, [currentUserId, userId]);

  // Keep selectedMsg in sync if its ID changes (local- to real-)
  React.useEffect(() => {
    if (selectedMsg && String(selectedMsg._id).startsWith('local-')) {
      const realMsg = chatMessages.find(m => 
        !String(m._id).startsWith('local-') && 
        m.message && selectedMsg.message &&
        m.message.trim().toLowerCase() === selectedMsg.message.trim().toLowerCase() &&
        toComparableUserId(m.sender) === toComparableUserId(selectedMsg.sender)
      );
      if (realMsg) {
        setSelectedMsg(realMsg);
      }
    }
  }, [chatMessages, selectedMsg]);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 200);
    return () => clearTimeout(timer);
  }, [chatMessages]);

  const toggleExpand = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedMessages((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handlePickImage = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.7,
        includeBase64: true, // we need base64 to mock sending over socket
      });

      if (result.didCancel || result.errorCode || !result.assets) return;

      const base64Img = `data:${result.assets[0].type};base64,${result.assets[0].base64}`;
      const payload = {
        receiverId: userId,
        senderId: currentUserId,
        message: `[IMAGE] ${base64Img}`,
      };

      socketService.emit("send-message", payload);
      setUnreadDividerIndex(null);

      setTimeout(() => refetch(), 800);

      setChatMessages((prev) => [
        ...prev,
        {
          _id: `local-${Date.now()}`,
          sender: currentUserId,
          receiver: userId,
          message: `[IMAGE] ${base64Img}`,
          createdAt: new Date().toISOString(),
        },
      ]);
    } catch (e) {
      console.log('Image picker error:', e);
    }
  };

  const handleSend = () => {
    const message = newMessage.trim();
    if (!message) return;

    if (isEditing && editingMessageId) {
      managerApiCall(
        editMessage,
        {
          messageId: editingMessageId,
          newMessage: message,
        },
        (res: any) => {
          console.log("Edit message success:", res);
          setChatMessages((prev) =>
            prev.map((m) =>
              m._id === editingMessageId ? { ...m, message: message, isEdited: true } : m
            )
          );
          setIsEditing(false);
          setEditingMessageId(null);
          setNewMessage("");
        },
        (err: any) => {
          console.log("Edit message failed:", err);
        }
      );
      return;
    }

    const payload = {
      receiverId: userId,
      senderId: currentUserId,
      message: simulateEncrypt(message),
    };

    socketService.emit("send-message", payload);
    setNewMessage("");
    setUnreadDividerIndex(null); // ✅ clear badge on send

    setTimeout(() => {
      refetch();
    }, 800);

    setChatMessages((prev) => [
      ...prev,
      {
        _id: `local-${Date.now()}`,
        sender: currentUserId,
        receiver: userId,
        message: simulateEncrypt(message),
        createdAt: new Date().toISOString(),
      },
    ]);
  };

  return (
    <MobileContainer>
      {/* ─── Dropdown Menu Modal ─── */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setMenuVisible(false)}>
          <View style={styles.menuOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.menuDropdown}>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    setMenuVisible(false);
                    const isBlocked = localChatUser?.isBlockedByMe;

                    Alert.alert(
                      isBlocked ? "Unblock User" : "Block User",
                      `Are you sure you want to ${isBlocked ? "unblock" : "block"} user?`,
                      [
                        { text: "Cancel", style: "cancel", onPress: () => {} },
                        {
                          text: isBlocked ? "Unblock" : "Block",
                          style: isBlocked ? "default" : "destructive",
                          onPress: () => {
                            managerApiCall(
                              isBlocked ? unblockUser : blockUser,
                              { targetUserId: userId },
                              (res: any) => {
                                setLocalChatUser((prev: any) => ({
                                  ...prev,
                                  isBlockedByMe: !isBlocked
                                }));
                                
                                if (isBlocked) {
                                  refetch();
                                }
                              },
                              (err: any) => {
                                console.log(`${isBlocked ? "Unblock" : "Block"} User failed: `, err);
                              }
                            );
                          },
                        },
                      ]
                    );
                  }}
                >
                  <ShieldBan color={localChatUser?.isBlockedByMe ? colors.primary : colors.danger} size={moderateScale(18)} />
                  <Text style={[styles.menuItemText, { color: localChatUser?.isBlockedByMe ? colors.primary : colors.danger }]}>
                    {localChatUser?.isBlockedByMe ? "Unblock User" : "Block User"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    setMenuVisible(false);
                    const isCallsBlocked = localChatUser?.isCallsBlockedByMe;

                    Alert.alert(
                      isCallsBlocked ? "Unblock Calls" : "Block Calls Only",
                      `Are you sure you want to ${isCallsBlocked ? "unblock calls from" : "block calls from"} this user? Chat will remain open.`,
                      [
                        { text: "Cancel", style: "cancel", onPress: () => {} },
                        {
                          text: isCallsBlocked ? "Unblock Calls" : "Block Calls",
                          style: "default",
                          onPress: () => {
                            managerApiCall(
                              isCallsBlocked ? unblockCalls : blockCalls,
                              { targetUserId: userId },
                              (res: any) => {
                                setLocalChatUser((prev: any) => ({
                                  ...prev,
                                  isCallsBlockedByMe: !isCallsBlocked
                                }));
                              },
                              (err: any) => {
                                console.log(`${isCallsBlocked ? "Unblock" : "Block"} Calls failed: `, err);
                              }
                            );
                          },
                        },
                      ]
                    );
                  }}
                >
                  <ShieldBan color={localChatUser?.isCallsBlockedByMe ? colors.primary : colors.textMuted} size={moderateScale(18)} />
                  <Text style={[styles.menuItemText, { color: localChatUser?.isCallsBlockedByMe ? colors.primary : colors.textMuted }]}>
                    {localChatUser?.isCallsBlockedByMe ? "Unblock Calls" : "Block Calls Only"}
                  </Text>
                </TouchableOpacity>

                {isFriend && (
                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => {
                      setMenuVisible(false);
                      Alert.alert(
                        "Unfriend",
                        "Are you sure you want to remove this user from your friends list?",
                        [
                          { text: "Cancel", style: "cancel", onPress: () => {} },
                          {
                            text: "Unfriend",
                            style: "destructive",
                            onPress: () => {
                              removeFriend({ targetUserId: userId }).then(() => {
                                refetchFriends();
                              });
                            },
                          },
                        ]
                      );
                    }}
                  >
                    <UserMinus color={colors.danger} size={moderateScale(18)} />
                    <Text style={[styles.menuItemText, { color: colors.danger }]}>
                      Unfriend
                    </Text>
                  </TouchableOpacity>
                )}

                <View style={styles.menuDivider} />

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    setMenuVisible(false);
                    Alert.alert(
                      "Clear Chat History",
                      "Are you sure you want to clear chat history?",
                      [
                        { text: "Cancel", style: "cancel", onPress: () => {} },
                        {
                          text: "Clear",
                          style: "destructive",
                          onPress: () => {
                            managerApiCall(
                              clearChat,
                              { otherUserId : userId },
                              (res : any) => {
                                setChatMessages([]);
                                dispatch(
                                  authApi.util.updateQueryData("chatHistory", userId, (draft: any) => {
                                    if (draft?.data) {
                                      if (Array.isArray(draft.data)) {
                                        draft.data.length = 0;
                                      } else if (draft.data.messages) {
                                        draft.data.messages = [];
                                        draft.data.unreadCount = 0;
                                      }
                                    }
                                  })
                                );
                              },
                              (err : any) => {
                                console.log("clear chat history failed : ", err);
                              }
                            )
                          },
                        },
                      ]
                    );
                  }}
                >
                  <Trash2 color={colors.textMuted} size={moderateScale(18)} />
                  <Text style={styles.menuItemText}>Clear Chat History</Text>
                </TouchableOpacity>

                <View style={styles.menuDivider} />

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    console.log("[ChatDetail] Report clicked, closing menu...");
                    setMenuVisible(false);
                    // On iOS, we need a small delay to let the menu modal close 
                    // before opening the report modal to avoid conflicts.
                    setTimeout(() => {
                      console.log("[ChatDetail] Triggering reportVisible = true");
                      setReportVisible(true);
                    }, Platform.OS === 'ios' ? 400 : 50);
                  }}
                >
                  <Flag color={colors.textMuted} size={moderateScale(18)} />
                  <Text style={styles.menuItemText}>Report User</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* ─── Message Action Modal (Delete/Edit) ─── */}
      <Modal
        visible={messageActionVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMessageActionVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setMessageActionVisible(false)}>
          <View style={styles.menuOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.messageActionDropdown}>
                 {selectedMsg && 
                  toComparableUserId(selectedMsg.sender) === toComparableUserId(currentUserId) && (
                  <>
                    <TouchableOpacity
                      style={styles.menuItem}
                      onPress={() => {
                        if (selectedMsg._id.toString().startsWith('local-')) {
                          Alert.alert("Pending Sync", "This message is still syncing. Please wait a moment.");
                          setMessageActionVisible(false);
                          return;
                        }
                        setMessageActionVisible(false);
                        setIsEditing(true);
                        setEditingMessageId(selectedMsg._id);
                        setNewMessage(selectedMsg.message);
                      }}
                    >
                      <Pencil color={colors.white} size={moderateScale(18)} />
                      <Text style={styles.menuItemText}>Edit Message</Text>
                    </TouchableOpacity>

                    <View style={styles.menuDivider} />
                  </>
                )}

                {/* Translation Option */}
                {!selectedMsg?.message?.startsWith('[IMAGE') && (
                  <>
                    <TouchableOpacity
                      style={styles.menuItem}
                      onPress={() => {
                        setMessageActionVisible(false);
                        if (selectedMsg) {
                          setTranslatedMessages(prev => ({
                            ...prev,
                            [selectedMsg._id]: "Mock Translation: " + selectedMsg.message
                          }));
                          ShowAlertMessage("Message translated (Mock)", popTypes.success);
                        }
                      }}
                    >
                      <Text style={{ color: colors.white, fontSize: 18 }}>A文</Text>
                      <Text style={styles.menuItemText}>Translate Message</Text>
                    </TouchableOpacity>

                    <View style={styles.menuDivider} />
                  </>
                )}

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    if (!selectedMsg?._id || selectedMsg._id.toString().startsWith('local-')) {
                      Alert.alert("Pending Sync", "This message is still syncing. Please wait a moment.");
                      setMessageActionVisible(false);
                      return;
                    }
                    setMessageActionVisible(false);

                    managerApiCall(
                      deleteMessages,
                      { messageIds: [selectedMsg._id] },
                      (res: any) => {
                        setChatMessages((prev) => prev.filter(m => m._id !== selectedMsg._id));
                        
                        dispatch(
                          authApi.util.updateQueryData("chatHistory", userId, (draft: any) => {
                            if (draft?.data) {
                              if (Array.isArray(draft.data)) {
                                draft.data = draft.data.filter((m: any) => m._id !== selectedMsg._id);
                              } else if (draft.data.messages) {
                                draft.data.messages = draft.data.messages.filter((m: any) => m._id !== selectedMsg._id);
                              }
                            }
                          })
                        );
                        setSelectedMsg(null);
                      },
                      (err: any) => {
                        console.log("Delete message failed:", err);
                      }
                    );
                  }}
                >
                  <Trash2 
                    color={selectedMsg?._id.toString().startsWith('local-') ? colors.textMuted : colors.danger} 
                    size={moderateScale(18)} 
                  />
                  <Text style={[
                    styles.menuItemText, 
                    { color: selectedMsg?._id.toString().startsWith('local-') ? colors.textMuted : colors.danger }
                  ]}>
                    Delete Message
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* ─── Report Modal Overlay (Non-Modal) ─── */}
      <ReportModal
        visible={reportVisible}
        onClose={() => setReportVisible(false)}
        onSubmit={(selected, note) => {
          setReportVisible(false);
          managerApiCall(
            reportBlock,
            {
              reportedUser: userId,
              category: selected,
              message: note,
            },
            (res: any) => {
              Alert.alert("Report Submitted", "Thank you for helping us keep our community safe.");
            },
            (err: any) => {
              console.log("Report failed:", err);
            }
          );
        }}
      />

      <View style={styles.chatDetailWrap}>
        {/* ─── Custom Chat Header ─── */}    
        <View style={styles.chatHeader}>
          <View style={styles.chatHeaderLeft}>
            <TouchableOpacity onPress={onBack} style={styles.chatHeaderBackBtn}>
              <ChevronLeft color={colors.white} size={moderateScale(24)} />
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setProfilePopupVisible(true)}>
              <Image
                source={{ uri: chatUserAvatar || "https://via.placeholder.com/100" }}
                style={styles.chatHeaderAvatar}
              />
            </TouchableOpacity>

            <Text style={styles.chatHeaderName} numberOfLines={1}>
              {chatUserName || CHAT_DETAIL_TEXT.defaultName}
            </Text>
          </View>

          <View style={{ flexDirection: "row", alignItems: "center" }}>
            {isFriend && (
              <TouchableOpacity
                onPress={() => {
                  socketService.emit("super-request", { targetUserId: userId, coinCost: 0 });
                  ShowAlertMessage("Call requested...", popTypes.success);
                }} 
                style={{ marginRight: 15 }}
              >
                <Phone color={colors.white} size={moderateScale(22)} />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={() => setMenuVisible(true)}
              style={styles.chatHeaderMenuBtn}
            >
              <MoreVertical color={colors.white} size={moderateScale(22)} />
            </TouchableOpacity>
          </View>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? 20 : 0} 
          style={{ flex: 1 }}
        >

        {/* Profile Popup Modal */}
        <Modal visible={profilePopupVisible} transparent animationType="fade" onRequestClose={() => setProfilePopupVisible(false)}>
          <View style={styles.menuOverlay}>
            <View style={[styles.menuDropdown, { alignItems: 'center', padding: 20 }]}>
              <Image source={{ uri: chatUserAvatar || "https://via.placeholder.com/100" }} style={{ width: 80, height: 80, borderRadius: 40, marginBottom: 10 }} />
              <Text style={{ color: colors.white, fontSize: 18, fontWeight: 'bold', marginBottom: 5 }}>{chatUserName}</Text>
              <Text style={{ color: colors.textMuted, fontSize: 14, marginBottom: 5 }}>Age: {chatUser?.age || 'N/A'}</Text>
              <Text style={{ color: colors.textMuted, fontSize: 14, marginBottom: 5 }}>Trust Score: {chatUser?.trustScore ?? 100}</Text>
              <Text style={{ color: colors.textMuted, fontSize: 14, marginBottom: 5 }}>Rating: {chatUser?.ratingCount > 0 ? (chatUser?.totalRatingScore / chatUser?.ratingCount).toFixed(1) : 'N/A'}</Text>
              <Text style={{ color: colors.textMuted, fontSize: 14, marginBottom: 15 }}>Gender: {chatUser?.gender || 'N/A'}</Text>
              <TouchableOpacity onPress={() => setProfilePopupVisible(false)} style={{ backgroundColor: colors.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 }}>
                <Text style={{ color: colors.white, fontWeight: 'bold' }}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* AI Icebreaker Modal */}
        <Modal visible={icebreakerModalVisible} transparent animationType="slide" onRequestClose={() => setIcebreakerModalVisible(false)}>
          <View style={modalStyles.overlayWrapper}>
            <TouchableOpacity style={modalStyles.backdrop} activeOpacity={1} onPress={() => setIcebreakerModalVisible(false)} />
            <View style={modalStyles.sheet}>
              <View style={modalStyles.handle} />
              <View style={modalStyles.header}>
                <Text style={modalStyles.title}>AI Icebreakers</Text>
                <Text style={modalStyles.subtitle}>Select a prompt to start the conversation</Text>
              </View>
              <ScrollView style={modalStyles.scroll}>
                {["If you could travel anywhere right now, where would you go?", "What's the best movie you've watched recently?", "What's a hobby you've always wanted to try?"].map((icebreaker, idx) => (
                  <TouchableOpacity key={idx} style={{ padding: 15, backgroundColor: colors.surfaceAlt, borderRadius: 10, marginBottom: 10 }} onPress={() => {
                    setNewMessage(icebreaker);
                    setIcebreakerModalVisible(false);
                  }}>
                    <Text style={{ color: colors.white }}>{icebreaker}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>

          <ScrollView
            ref={scrollRef}
            style={[styles.messagesScroll, { opacity: scrollReady ? 1 : 0 }]}
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={(_, newHeight) => {
              if (isInitialLoad.current) {
                scrollRef.current?.scrollToEnd({ animated: false });
                isInitialLoad.current = false;
                setTimeout(() => setScrollReady(true), 80);
              } else if (isPullRefresh.current) {
                const addedHeight = newHeight - prevContentHeight.current;
                scrollRef.current?.scrollTo({ y: addedHeight, animated: false });
                isPullRefresh.current = false;
              } else {
                scrollRef.current?.scrollToEnd({ animated: true });
              }
              prevContentHeight.current = newHeight;
            }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing || isLoading}
                onRefresh={handleRefresh}
                colors={[colors.primary]}
              />
            }
          >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View style={{ flex: 1 }}>
                {chatMessages.length === 0 && !isLoading && (
                  <View style={styles.emptyStateContainer}>
                    <Text style={styles.noMessagesText}>No messages yet</Text>
                  </View>
                )}

                {chatMessages.map((msg: any, index: number) => {
                  const isMe = toComparableUserId(msg.sender) === toComparableUserId(currentUserId);
                  const isExpanded = expandedMessages[msg._id];
                  
                  const decryptedMessage = simulateDecrypt(msg.message);
                  const isLongMessage = decryptedMessage?.length > 150;

                  const msgDate = new Date(msg.createdAt).toDateString();
                  const prevMsgDate = index > 0 ? new Date(chatMessages[index - 1].createdAt).toDateString() : null;
                  const showDateHeader = msgDate !== prevMsgDate;

                  const isUnreadDivider = unreadDividerIndex !== null && index === unreadDividerIndex;

                  return (
                    <React.Fragment key={msg._id || index}>
                      {showDateHeader && (
                        <View style={styles.dateHeaderBadge}>
                          <Text style={styles.dateHeaderBadgeText}>{formatDateHeader(msg.createdAt)}</Text>
                        </View>
                      )}

                      {isUnreadDivider && (
                        <View style={styles.unreadDividerBadge}>
                          <Text style={styles.unreadDividerBadgeText}>
                            NEW MESSAGES
                          </Text>
                        </View>
                      )}

                      <Pressable 
                        style={isMe ? styles.msgRight : styles.msgLeft}
                        onLongPress={() => {
                          setSelectedMsg({ ...msg, message: decryptedMessage });
                          setMessageActionVisible(true);
                        }}
                      >
                        <View style={isMe ? styles.bubbleRight : styles.bubbleLeft}>
                          {decryptedMessage?.startsWith('[IMAGE] ') ? (
                            <TouchableOpacity onPress={() => {
                              setImageViewerUrl(decryptedMessage.replace('[IMAGE] ', ''));
                              setImageViewerMsgId(msg._id);
                              setImageViewerVisible(true);
                            }}>
                              <Image 
                                source={{ uri: decryptedMessage.replace('[IMAGE] ', '') }} 
                                style={{ width: 200, height: 200, borderRadius: 10 }}
                                resizeMode="cover"
                              />
                            </TouchableOpacity>
                          ) : decryptedMessage?.startsWith('[IMAGE_VIEW_ONCE] ') ? (
                            <TouchableOpacity 
                              style={{ width: 200, height: 200, backgroundColor: colors.surfaceAlt, borderRadius: 10, justifyContent: 'center', alignItems: 'center' }}
                              onPress={() => {
                                setImageViewerUrl(decryptedMessage.replace('[IMAGE_VIEW_ONCE] ', ''));
                                setImageViewerMsgId(msg._id);
                                setIsViewOnceMode(true);
                                setImageViewerVisible(true);
                              }}>
                              <ImageIcon size={40} color={colors.primary} />
                              <Text style={{ color: colors.primary, marginTop: 10, fontWeight: 'bold' }}>View Once</Text>
                              <Text style={{ color: colors.textMuted, fontSize: 12 }}>Tap to view image</Text>
                            </TouchableOpacity>
                          ) : (
                            <Text
                              style={isMe ? styles.msgTextLight : styles.msgText}
                              numberOfLines={isExpanded ? undefined : 5}
                              ellipsizeMode="tail"
                            >
                              {translatedMessages[msg._id] || decryptedMessage}
                            </Text>
                          )}

                          {!isMe && !decryptedMessage?.startsWith('[IMAGE] ') && (
                            <TouchableOpacity 
                              style={{ position: 'absolute', bottom: -5, right: -25, backgroundColor: colors.surfaceAlt, borderRadius: 12, padding: 2 }}
                              onPress={() => {
                                setTranslatedMessages(prev => ({ ...prev, [msg._id]: `[Translated] ${decryptedMessage}` }));
                              }}
                            >
                              <Text style={{ fontSize: 12 }}>🌐</Text>
                            </TouchableOpacity>
                          )}

                          {translatedMessages[msg._id] && !decryptedMessage?.startsWith('[IMAGE] ') && (
                            <Text style={{ color: colors.success, fontSize: 10, marginTop: 4 }}>Translated</Text>
                          )}

                          {isLongMessage && !decryptedMessage?.startsWith('[IMAGE] ') && (
                            <TouchableOpacity onPress={() => toggleExpand(msg._id)}>
                              <Text style={[styles.readMore, isMe && { color: colors.white, opacity: 0.9 }]}>
                                {isExpanded ? "Show Less" : "Read More..."}
                              </Text>
                            </TouchableOpacity>
                          )}

                          <View style={styles.msgFooter}>
                            {msg.isEdited && (
                              <Text style={[styles.editedBadge, isMe && { color: colors.white, opacity: 0.7 }]}>
                                Edited
                              </Text>
                            )}
                            <Text style={[styles.msgTime, isMe && { color: colors.white }]}>
                              {new Date(msg.createdAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </Text>
                          </View>
                        </View>
                      </Pressable>
                    </React.Fragment>
                  );
                })}
              </View>
            </TouchableWithoutFeedback>
          </ScrollView>

          {isTyping && (
            <View style={{ paddingHorizontal: 16, paddingVertical: 4 }}>
              <Text style={{ color: colors.primary, fontStyle: 'italic', fontSize: 12 }}>
                {localChatUser?.name || chatUserName || 'User'} is typing...
              </Text>
            </View>
          )}

          <View style={styles.inputBar}>
            {localChatUser?.amIBlocked ? (
              <View style={styles.blockedInputOverlay}>
                <ShieldBan color={colors.danger} size={moderateScale(16)} />
                <Text style={styles.blockedInputText}>You cannot send messages to this user</Text>
              </View>
            ) : localChatUser?.isBlockedByMe ? (
              <View style={styles.blockedInputOverlay}>
                <ShieldBan color={colors.textMuted} size={moderateScale(16)} />
                <Text style={styles.blockedByMeText}>You blocked this user</Text>
              </View>
            ) : !isFriend ? (
              <View style={[styles.blockedInputOverlay, { flexDirection: 'column', gap: 10 }]}>
                <Text style={{ color: colors.textMuted, fontSize: 13, textAlign: 'center' }}>
                  You must be friends to chat.
                </Text>
                {requestReceivedId ? (
                  <TouchableOpacity 
                    style={{ backgroundColor: colors.primary, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20 }}
                    onPress={() => {
                      acceptFriendRequest({ requestId: requestReceivedId }).then(() => {
                        setIsFriendLocal(true);
                        refetchFriends();
                        refetchFriendReqs();
                      });
                    }}
                  >
                    <Text style={{ color: colors.white, fontWeight: 'bold' }}>Accept Friend Request</Text>
                  </TouchableOpacity>
                ) : requestSent ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                    <Check color={colors.success} size={16} />
                    <Text style={{ color: colors.success, fontWeight: 'bold' }}>Request Pending...</Text>
                  </View>
                ) : (
                  <TouchableOpacity 
                    style={{ backgroundColor: colors.surfaceAlt, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, flexDirection: 'row', gap: 5, alignItems: 'center' }}
                    onPress={() => {
                      sendFriendRequest({ targetUserId: userId }).then((res: any) => {
                        if (res.data?.success) setRequestSent(true);
                      });
                    }}
                  >
                    <UserPlus color={colors.primary} size={18} />
                    <Text style={{ color: colors.primary, fontWeight: 'bold' }}>Add Friend</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <>
                <TextInput
                  value={newMessage}
                  onChangeText={handleTextChange}
                  placeholder={isEditing ? "Edit message..." : CHAT_DETAIL_TEXT.messagePlaceholder}
                  placeholderTextColor={colors.textPlaceholder}
                  style={[styles.chatInput, isEditing && { borderColor: colors.primary }]}
                  multiline={false}
                  blurOnSubmit={false}
                  autoFocus={isEditing}
                />
                {!isEditing && newMessage.length === 0 && (
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TouchableOpacity style={styles.inputAction} onPress={handlePickImage}>
                      <ImageIcon size={24} color={colors.textMuted} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.inputAction} onPress={() => {
                      // Mock sending a view once image
                      const mockUrl = "https://picsum.photos/400/400";
                      const payload = {
                        senderId: currentUserId,
                        receiverId: userId,
                        message: `[IMAGE_VIEW_ONCE] ${mockUrl}`,
                        tempId: Date.now().toString(),
                      };
                      socketService.emit("send-message", payload);
                      setChatMessages((prev) => [...prev, { ...payload, _id: `local-${payload.tempId}`, createdAt: new Date().toISOString() }]);
                    }}>
                      <Text style={{ color: colors.primary, fontSize: 10, fontWeight: 'bold' }}>1x</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={{ padding: 10 }} onPress={() => setIcebreakerModalVisible(true)}>
                      <Text style={{ fontSize: 20 }}>💡</Text>
                    </TouchableOpacity>
                  </View>
                )}
                {isEditing && (
                  <TouchableOpacity 
                    style={{ marginRight: 10 }} 
                    onPress={() => {
                      setIsEditing(false);
                      setEditingMessageId(null);
                      setNewMessage("");
                    }}
                  >
                    <Text style={{ color: colors.danger, fontWeight: "bold" }}>Cancel</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.sendBtn} onPress={handleSend}>
                  <Send size={width * 0.05} color={colors.white} />
                </TouchableOpacity>
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      </View>

      {/* Image Viewer Modal */}
      <Modal visible={imageViewerVisible} transparent={true} animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' }}>
          <TouchableOpacity 
            style={{ position: 'absolute', top: 50, right: 20, zIndex: 10, padding: 10 }}
            onPress={() => {
              setImageViewerVisible(false);
              if (isViewOnceMode && imageViewerMsgId) {
                // Delete the message completely after viewing
                managerApiCall(deleteMessages, { messageIds: [imageViewerMsgId] });
                setChatMessages(prev => prev.filter(m => m._id !== imageViewerMsgId));
                setIsViewOnceMode(false);
              }
            }}
          >
            <X size={30} color={colors.white} />
          </TouchableOpacity>
          {imageViewerUrl && (
            <Image 
              source={{ uri: imageViewerUrl }} 
              style={{ width: '100%', height: '80%' }}
              resizeMode="contain"
            />
          )}
          {!isViewOnceMode && (
            <TouchableOpacity 
              style={{ position: 'absolute', bottom: 50, backgroundColor: colors.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 }}
              onPress={() => {
                ShowAlertMessage("Image saved to gallery!", popTypes.success);
              }}
            >
              <Text style={{ color: colors.white, fontWeight: 'bold' }}>Save Image</Text>
            </TouchableOpacity>
          )}
        </View>
      </Modal>
    </MobileContainer>
  );
};




const styles = StyleSheet.create({
  chatDetailWrap: { flex: 1, backgroundColor: colors.background },
  chatHeader: {
    height: verticalScale(60),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: scale(15),
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderColor: colors.borderSubtle,
  },
  chatHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  chatHeaderBackBtn: {
    padding: scale(5),
    marginRight: scale(5),
  },
  chatHeaderAvatar: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    backgroundColor: colors.surfaceAlt,
  },
  chatHeaderName: {
    color: colors.white,
    fontSize: moderateScale(16),
    fontWeight: "600",
    marginLeft: scale(10),
    flex: 1,
  },
  chatHeaderMenuBtn: {
    padding: scale(5),
  },
  messagesScroll: { flex: 1 },
  messagesContent: { paddingVertical: verticalScale(20), paddingHorizontal: scale(15) },
  emptyStateContainer: { flex: 1, justifyContent: "center", alignItems: "center", marginTop: height * 0.2 },
  noMessagesText: { color: colors.textMuted, fontSize: moderateScale(14) },
  dateHeaderBadge: {
    alignSelf: "center",
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(4),
    borderRadius: moderateScale(12),
    marginVertical: verticalScale(15),
  },
  dateHeaderBadgeText: { color: colors.textMuted, fontSize: moderateScale(12), fontWeight: "600" },
  unreadDividerBadge: {
    alignSelf: "center",
    backgroundColor: colors.primaryBorderSoft,
    paddingHorizontal: scale(15),
    paddingVertical: verticalScale(6),
    borderRadius: moderateScale(4),
    marginVertical: verticalScale(20),
    borderWidth: 1,
    borderColor: colors.primary,
  },
  unreadDividerBadgeText: { color: colors.primary, fontSize: moderateScale(10), fontWeight: "bold", letterSpacing: 1 },
  msgLeft: { alignSelf: "flex-start", marginBottom: verticalScale(10), maxWidth: "80%" },
  msgRight: { alignSelf: "flex-end", marginBottom: verticalScale(10), maxWidth: "80%" },
  bubbleLeft: {
    backgroundColor: colors.surface,
    padding: moderateScale(12),
    borderRadius: moderateScale(18),
    borderBottomLeftRadius: moderateScale(4),
  },
  bubbleRight: {
    backgroundColor: colors.primary,
    padding: moderateScale(12),
    borderRadius: moderateScale(18),
    borderBottomRightRadius: moderateScale(4),
  },
  msgText: { color: colors.white, fontSize: moderateScale(15), lineHeight: verticalScale(20) },
  msgTextLight: { color: colors.white, fontSize: moderateScale(15), lineHeight: verticalScale(20) },
  readMore: { color: colors.primary, marginTop: verticalScale(5), fontSize: moderateScale(13), fontWeight: "600" },
  msgTime: {
    fontSize: moderateScale(10),
    color: colors.textMuted,
    opacity: 0.7,
  },
  msgFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: verticalScale(5),
    gap: scale(5),
  },
  editedBadge: {
    fontSize: moderateScale(10),
    color: colors.textMuted,
    fontStyle: "italic",
    opacity: 0.7,
  },
  inputBar: {
    backgroundColor: colors.surface,
    paddingHorizontal: scale(10),
    paddingTop: verticalScale(13),
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderColor: colors.borderSubtle,
    paddingBottom: Platform.OS === "ios" ? verticalScale(25) : verticalScale(10), 
  },
  chatInput: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: moderateScale(25),
    paddingHorizontal: scale(15),
    height: verticalScale(45),
    color: colors.white,
    marginRight: scale(10),
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  blockedInputOverlay: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: verticalScale(45),
    gap: scale(8),
  },
  blockedInputText: { color: colors.danger, fontSize: moderateScale(13), fontWeight: "500" },
  blockedByMeText: { color: colors.textMuted, fontSize: moderateScale(13) },
  sendBtn: {
    width: scale(45),
    height: scale(45),
    borderRadius: scale(22.5),
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  menuDropdown: {
    width: width * 0.7,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 8,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  messageActionDropdown: {
    width: width * 0.6,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 16,
    padding: 8,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 12,
  },
  menuItemText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "500",
  },
  menuDivider: {
    height: 1,
    backgroundColor: colors.borderSubtle,
    marginHorizontal: 12,
  },
});

const modalStyles = StyleSheet.create({
  overlayWrapper: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.65)",
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#13151A",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 36,
    maxHeight: "85%",
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#2E3140",
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 4,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1E2130",
  },
  title: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  subtitle: {
    color: "#6B7280",
    fontSize: 13,
    marginTop: 4,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  reasonsGrid: { gap: 10 },
  reasonChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1C1E26",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#2A2D3A",
    paddingVertical: 13,
    paddingHorizontal: 16,
    gap: 12,
  },
  reasonChipActive: {
    backgroundColor: "#1A2235",
    borderColor: "#3B82F6",
  },
  reasonIcon: { fontSize: 18, lineHeight: 22 },
  reasonLabel: {
    flex: 1,
    color: "#9CA3AF",
    fontSize: 14,
    fontWeight: "500",
  },
  reasonLabelActive: { color: "#E5E7EB" },
  checkBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#3B82F6",
    justifyContent: "center",
    alignItems: "center",
  },
  checkMark: { color: "#FFFFFF", fontSize: 12, fontWeight: "700" },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 18,
    gap: 10,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: "#1E2130" },
  dividerText: {
    color: "#4B5563",
    fontSize: 12,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  input: {
    backgroundColor: "#1C1E26",
    borderWidth: 1.5,
    borderColor: "#2A2D3A",
    borderRadius: 14,
    color: "#E5E7EB",
    fontSize: 14,
    lineHeight: 21,
    padding: 14,
    minHeight: 100,
  },
  charCount: {
    color: "#4B5563",
    fontSize: 11,
    textAlign: "right",
    marginTop: 6,
    marginBottom: 4,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  cancelBtn: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    backgroundColor: "#1C1E26",
    borderWidth: 1.5,
    borderColor: "#2A2D3A",
    justifyContent: "center",
    alignItems: "center",
  },
  cancelText: { color: "#9CA3AF", fontSize: 15, fontWeight: "600" },
  submitBtn: {
    flex: 2,
    height: 50,
    borderRadius: 14,
    backgroundColor: "#EF4444",
    justifyContent: "center",
    alignItems: "center",
  },
  submitBtnDisabled: { backgroundColor: "#2A2D3A" },
  submitText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  submitTextDisabled: { color: "#4B5563" },
});

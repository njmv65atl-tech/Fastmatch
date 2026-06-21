
import {
  ActivityIndicator,
  BackHandler,
  Modal,
  PermissionsAndroid,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Shield, PhoneOff } from "lucide-react-native";

import { AppView, User } from "../../types";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  StreamVideo,
  StreamVideoClient,
  StreamCall,
  CallContent,
  ToggleAudioPublishingButton,
  ToggleCameraFaceButton,
  ToggleVideoPublishingButton,
  HangUpCallButton,
} from "@stream-io/video-react-native-sdk";

import { useSelector, useDispatch } from "react-redux";
import { tokenSelector, setGlobalUser } from "../../redux/slices/persistedSlice";
import { BASE_URL as API_BASE_URL } from "../../config/env";

import { colors } from "../../utils/colors";
import { socket } from "../../socket/socket";
import { managerApiCall } from "../../helpers/managerApiCallFn";
import { useUserReportMutation } from "../../redux/services/auth";
import { getUser } from "../../utils/storage";
import { popTypes, ShowAlertMessage } from "../../helpers/commonFunctions";

// ─── Icebreaker Prompts ───────────────────────────────────────────────────────

const ICEBREAKERS = [
  "If you could travel anywhere right now, where would you go?",
  "What's the best movie you've watched recently?",
  "What's a hobby you've always wanted to try?",
  "What's your favorite way to spend a weekend?",
  "What's the most interesting place you've visited?",
  "What kind of music have you been into lately?",
  "What's a skill you'd love to learn?",
  "If you could have dinner with anyone, who would it be?",
  "What's your go-to comfort food?",
  "What's the best book you've ever read?",
];

const EMOJIS = ["❤️", "😂", "😍", "🔥", "🎉", "👍", "😮", "😢", "😡", "💀"];

const GIFTS = [
  { id: "rose", name: "Rose", icon: "🌹", cost: 10 },
  { id: "coffee", name: "Coffee", icon: "☕", cost: 25 },
  { id: "crown", name: "Crown", icon: "👑", cost: 100 },
  { id: "diamond", name: "Diamond", icon: "💎", cost: 500 },
];

// ─── Types ────────────────────────────────────────────────────────────────────

interface CoreProps {
  user: User;
  setView: (view: AppView, params?: any) => void;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  callId?: string;
  matchId?: string;
  role?: "caller" | "callee";
  participantName?: string;
  participantImage?: string;
  matchData?: any;
  streamToken?: {
    token: string;
    apiKey: string;
    userId: string;
  };
  remoteUserId?: string;
  preference?: 'everyone' | 'male' | 'female';
}

// ─── Report Reasons ───────────────────────────────────────────────────────────

const REPORT_REASONS = [
  { id: "inappropriate", label: "Inappropriate behavior", icon: "🚫" },
  { id: "harassment",    label: "Harassment or bullying",  icon: "😠" },
  { id: "spam",          label: "Spam or scam",            icon: "⚠️" },
  { id: "hate_speech",   label: "Hate speech",             icon: "🛑" },
  { id: "nudity",        label: "Nudity or sexual content",icon: "🔞" },
];

// ─── Report Modal ─────────────────────────────────────────────────────────────

interface ReportModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (selected: string[], note: string) => void;
}

const ReportModal: React.FC<ReportModalProps> = ({ visible, onClose, onSubmit }) => {
  const [selected, setSelected] = useState<string[]>([]);
  const [note, setNote] = useState("");

  const toggleReason = (id: string) => {
    setSelected((prev) => {
      const updated = prev.includes(id)
        ? prev.filter((r) => r !== id)
        : [...prev, id];
      console.log("[ReportModal] Selected reasons updated:", updated);
      return updated;
    });
  };

  const handleSubmit = () => {
    console.log("[ReportModal] Submitting report — reasons:", selected, "| note:", note.trim());
    onSubmit(selected, note.trim());
    setSelected([]);
    setNote("");
  };

  const handleClose = () => {
    console.log("[ReportModal] Modal closed by user");
    setSelected([]);
    setNote("");
    onClose();
  };

  const canSubmit = selected.length > 0 || note.trim().length > 0;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
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
            Select all that apply, or write your own.
          </Text>
        </View>

        <ScrollView
          style={modalStyles.scroll}
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
    </Modal>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: {
    flex: 1,
    backgroundColor: colors.black,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  topBarOverlay: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  timerBadge: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  timerText: { color: '#FFF', fontWeight: 'bold' },
  vipBadge: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  vipText: { color: '#000', fontWeight: 'bold', fontSize: 12 },
  reportBlockBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E53935',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  reportBlockText: { color: '#FFF', fontWeight: 'bold', fontSize: 12 },
  loadingText: { color: colors.white, fontSize: 16 },
  errorText: {
    color: colors.white,
    fontSize: 16,
    textAlign: "center",
    marginHorizontal: 32,
  },
  controls: {
    position: "absolute",
    bottom: 20,
    left: 10,
    right: 10,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12,
    gap: 12,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 20,
    zIndex: 999,
  },
  reportBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#1C1E22",
    justifyContent: "center",
    alignItems: "center",
  },
  reportIcon: { fontSize: 22, color: "#FFFFFF" },
  controlBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#1C1E22",
    justifyContent: "center",
    alignItems: "center",
  },
  controlBtnLabel: { fontSize: 22 },
  icebreakerToast: {
    position: "absolute",
    top: 60,
    left: 24,
    right: 24,
    backgroundColor: "rgba(15, 23, 42, 0.95)",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(99, 102, 241, 0.4)",
    elevation: 20,
    zIndex: 9999,
  },
  icebreakerToastText: { color: colors.white, fontSize: 15, textAlign: "center", lineHeight: 22 },
  reactionToast: {
    position: "absolute",
    top: "30%",
    alignSelf: "center",
    backgroundColor: "transparent",
    padding: 20,
    elevation: 20,
    zIndex: 9999,
  },
  reactionToastText: {
    fontSize: 80,
  },
  emojiPickerOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    elevation: 20,
    zIndex: 9999,
  },
  emojiPickerBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  emojiPickerContainer: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    width: "85%",
  },
  emojiPickerTitle: { color: colors.white, fontSize: 16, fontWeight: "600", textAlign: "center", marginBottom: 16 },
  emojiGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 8 },
  emojiItem: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.surfaceAlt,
    justifyContent: "center",
    alignItems: "center",
  },
  emojiText: { fontSize: 24 },
  icebreakerOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
    elevation: 20,
    zIndex: 9999,
  },
  icebreakerBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  giftItemCard: {
    width: "45%",
    backgroundColor: "rgba(30, 41, 59, 0.7)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
  },
  giftIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  giftCost: {
    color: "#F59E0B",
    fontWeight: "700",
    fontSize: 14,
  },
  giftAnimationContainer: {
    position: "absolute",
    top: "30%",
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
    elevation: 20,
    zIndex: 9999,
  },
  giftIconLarge: {
    fontSize: 120,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 10,
  },
  giftText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: "800",
    marginTop: 16,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    overflow: "hidden",
  },
  icebreakerContainer: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
    maxHeight: "60%",
  },
  icebreakerTitle: { color: colors.white, fontSize: 17, fontWeight: "700", marginBottom: 16, textAlign: "center" },
  icebreakerList: { flexGrow: 0 },
  icebreakerItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 12,
    marginBottom: 8,
  },
  icebreakerItemText: { color: colors.white, fontSize: 14, lineHeight: 20 },
});

const modalStyles = StyleSheet.create({
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
    paddingBottom: 36,
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

// ─── Main Component ───────────────────────────────────────────────────────────

export const VideoChatView: React.FC<CoreProps> = ({
  user,
  setUser,
  setView,
  matchId,
  callId,
  role,
  participantName,
  participantImage,
  matchData,
  streamToken: streamTokenProp,
  remoteUserId,
  preference = 'everyone',
}) => {
  const clientRef  = useRef<StreamVideoClient | null>(null);
  const callRef    = useRef<any>(null);
  const joinedRef  = useRef(false);
  const hasLeftRef = useRef(false);

  const [call, setCall]                             = useState<any>(null);
  const [isJoining, setIsJoining]                   = useState(true);
  const [error, setError]                           = useState<string | null>(null);
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker]       = useState(false);
  const [showIcebreakers, setShowIcebreakers]       = useState(false);
  const [showGiftPicker, setShowGiftPicker]         = useState(false);
  const [incomingIcebreaker, setIncomingIcebreaker] = useState<string | null>(null);
  const [incomingGift, setIncomingGift]             = useState<any>(null);
  const [myGifts, setMyGifts]                       = useState<any[]>([]);
  const [giftTab, setGiftTab]                       = useState<'store' | 'inventory'>('store');
  const [reportVisible, setReportVisible]           = useState(false);
  const [userReport]                                = useUserReportMutation();
  const [isBlurred, setIsBlurred]                   = useState(true);
  const token = useSelector(tokenSelector);
  const dispatch = useDispatch();
  const [isTranslated, setIsTranslated]             = useState(false);
  const [isFilterActive, setIsFilterActive]         = useState(false);
  const [callDuration, setCallDuration]             = useState(0);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (call && !isJoining) {
      interval = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [call, isJoining]);



  // 60-second Auto-Snapshot for Moderation
  useEffect(() => {
    let snapshotInterval: ReturnType<typeof setInterval>;
    if (call && !isJoining && remoteUserId) {
      snapshotInterval = setInterval(() => {
        console.log("[Moderation] Taking auto-snapshot...");
        // Mocking a base64 dummy string since we can't easily capture Native WebRTC stream
        const mockBase64 = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAAAAAAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCABQAFADASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAf/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAH/xAAVEQEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8An8AABQAAAAAFAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB//Z"; 
        fetch(`${API_BASE_URL}user/moderate-frame`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ imageBase64: mockBase64 })
        })
        .then(res => res.json())
        .then((res: any) => {
            console.log("[Moderation] Frame check result:", res);
            if (res.action === 'block') {
               socket.emit('blockUser', { targetId: remoteUserId });
               handleEndCall();
               ShowAlertMessage("Call ended due to explicit content policy violation.", popTypes.error);
            }
        })
        .catch((err: any) => console.log("[Moderation] Frame check error:", err));
      }, 60000); // every 60 seconds
    }
    return () => clearInterval(snapshotInterval);
  }, [call, isJoining, remoteUserId, token]);

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const fetchMyGifts = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}user/gifts`, {
        method: 'GET',
        headers: {
          'x-access-token': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const json = await res.json();
      if (json.success) {
        setMyGifts(json.data || []);
      } else {
        console.error("Fetch gifts failed", json.message);
      }
    } catch (e) {
      console.error(e);
    }
  }, [token]);

  useEffect(() => {
    // 3-second mandatory blur protection
    const timer = setTimeout(() => setIsBlurred(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  console.log(
    "[VideoChatView] render — callId:", callId,
    "| matchId:", matchId,
    "| role:", role,
    "| isJoining:", isJoining,
    "| permissionsGranted:", permissionsGranted
  );

  // ─── Report handlers ─────────────────────────────

  const handleReport = useCallback(() => {
    console.log("[VideoChatView] 📋 Report button pressed — opening modal");
    setReportVisible(true);
  }, []);

  const handleReportClose = useCallback(() => {
    console.log("[VideoChatView] Report modal dismissed without submitting");
    setReportVisible(false);
  }, []);

  const handleReportSubmit = useCallback(
    async (selected: string[], note: string) => {
      console.log(
        "[VideoChatView] 📤 Report submit — reasons:", selected,
        "| note:", note,
        "| matchId:", matchId,
        "| reportedUser:", matchData?.userId || matchData?.id
      );
      setReportVisible(false);

      try {
        const { _userId } = await getUser();
        console.log("[VideoChatView] Reporting as userId:", _userId);

        await managerApiCall(
          userReport,
          {
            category: selected,
            message: note,
            matchId: matchId,
            reportedUser: matchData?.userId || matchData?.id,
          },
          (res: any) => {
            console.log("[VideoChatView] ✅ Report API success:", JSON.stringify(res, null, 2));
            ShowAlertMessage("Reported successfully" , popTypes.info)
          }
        );
      } catch (err) {
        console.error("[VideoChatView] ❌ Report API error:", err);
      }

      handleEndCall();
    },
    [matchId, matchData]
  );

  // ─── Block hardware back ─────────────────────────

  useEffect(() => {
    console.log("[VideoChatView] Registering hardware back press block");
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      console.log("[VideoChatView] Hardware back press intercepted and blocked");
      return true;
    });
    return () => {
      console.log("[VideoChatView] Removing hardware back press block");
      sub.remove();
    };
  }, []);

  // ─── Permissions ────────────────────────────────

  useEffect(() => {
    const ask = async () => {
      console.log("[VideoChatView] Requesting A/V permissions — platform:", Platform.OS);

      if (Platform.OS === "android") {
        const result = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.CAMERA,
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        ]);

        console.log("[VideoChatView] Android permission results:", JSON.stringify(result, null, 2));

        const cameraOk = result[PermissionsAndroid.PERMISSIONS.CAMERA]       === PermissionsAndroid.RESULTS.GRANTED;
        const micOk    = result[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] === PermissionsAndroid.RESULTS.GRANTED;
        const ok       = cameraOk && micOk;

        console.log("[VideoChatView] Camera granted:", cameraOk, "| Mic granted:", micOk);

        if (!ok) {
          console.warn("[VideoChatView] ⚠️ Permission denied — camera:", cameraOk, "| mic:", micOk);
          setError("Camera & Mic permissions required");
        } else {
          console.log("[VideoChatView] ✅ All Android permissions granted");
        }

        setPermissionsGranted(ok);
      } else {
        console.log("[VideoChatView] iOS — permissions assumed granted");
        setPermissionsGranted(true);
      }
    };

    ask();
  }, []);

  // ─── Init Call ──────────────────────────────────

  useEffect(() => {
    const hasToken  = !!streamTokenProp?.token;
    const hasApiKey = !!streamTokenProp?.apiKey;
    const hasUserId = !!streamTokenProp?.userId;
    const hasCallId = !!callId;

    console.log(
      "[VideoChatView] Init call effect — permissionsGranted:", permissionsGranted,
      "| hasToken:", hasToken,
      "| hasApiKey:", hasApiKey,
      "| hasUserId:", hasUserId,
      "| hasCallId:", hasCallId
    );

    if (!hasToken || !hasApiKey || !hasUserId || !hasCallId) {
      console.error("[VideoChatView] ❌ Missing call credentials — aborting setup");
      setError("Missing call credentials");
      setIsJoining(false);
      return;
    }

    if (!permissionsGranted) {
      console.log("[VideoChatView] Permissions not yet granted — waiting…");
      return;
    }

    const setup = async () => {
      console.log(
        "[VideoChatView] 🔧 Creating StreamVideoClient — apiKey:", streamTokenProp!.apiKey,
        "| userId:", streamTokenProp!.userId
      );

      try {
        const videoClient = StreamVideoClient.getOrCreateInstance({
          apiKey: streamTokenProp!.apiKey,
          user:  { id: streamTokenProp!.userId },
          token: streamTokenProp!.token,
        });

        console.log("[VideoChatView] ✅ StreamVideoClient ready");
        clientRef.current = videoClient;

        console.log("[VideoChatView] 📞 Calling videoClient.call('default',", callId, ")");
        const streamCall = videoClient.call("default", callId!);

        console.log("[VideoChatView] Joining call with create: true…");
        await streamCall.join({ create: true });
        await streamCall.microphone.enable(); // Issue 8 fix: explicitly enable mic

        console.log("[VideoChatView] ✅ Joined call successfully — callId:", callId);
        callRef.current   = streamCall;
        joinedRef.current = true;
        setCall(streamCall);
      } catch (e: any) {
        console.error("[VideoChatView] ❌ Call join failed:", e?.message, "\nFull error:", e);
        setError(e?.message || "Join failed");
      } finally {
        setIsJoining(false);
        console.log("[VideoChatView] isJoining set to false");
      }
    };

    setup();

    return () => {
      console.log(
        "[VideoChatView] Init effect cleanup — hasLeft:", hasLeftRef.current,
        "| joined:", joinedRef.current
      );
      if (!hasLeftRef.current && joinedRef.current) {
        console.log("[VideoChatView] Cleanup: leaving call and disconnecting client");
        callRef.current?.leave().catch((err: any) =>
          console.warn("[VideoChatView] leave() error during cleanup:", err)
        );
        clientRef.current?.disconnectUser().catch((err: any) =>
          console.warn("[VideoChatView] disconnectUser() error during cleanup:", err)
        );
      }
    };
  }, [
    streamTokenProp?.token,
    streamTokenProp?.apiKey,
    streamTokenProp?.userId,
    callId,
    permissionsGranted,
  ]);

  // ─── Event & Participant listeners ────────────────────────

  const handleEndCall = useCallback(async () => {
    console.log("[VideoChatView] 📵 handleEndCall triggered — hasLeft:", hasLeftRef.current);

    if (hasLeftRef.current) {
      console.log("[VideoChatView] Already left — ignoring duplicate end call");
      return;
    }

    hasLeftRef.current = true;

    try {
      await callRef.current?.leave();
      console.log("[VideoChatView] ✅ call.leave() completed");
    } catch (err) {
      console.warn("[VideoChatView] call.leave() threw:", err);
    }

    try {
      await clientRef.current?.disconnectUser();
      console.log("[VideoChatView] ✅ disconnectUser() completed");
    } catch (err) {
      console.warn("[VideoChatView] disconnectUser() threw:", err);
    }

    if (matchId) {
      console.log("[VideoChatView] 📡 Emitting socket end-call — matchId:", matchId);
      socket.emit("end-call", { matchId });
    } else {
      console.warn("[VideoChatView] No matchId — skipping end-call socket emit");
    }

    console.log("[VideoChatView] Navigating to AppView.MATCH_FOUND to search again");
    setView(AppView.MATCH_FOUND, { preference });
  }, [matchId, setView, preference]);

  useEffect(() => {
    if (user.role !== 'PREMIUM' && callDuration >= 120) {
      handleEndCall();
      ShowAlertMessage("Time limit reached. Upgrade to Premium!", popTypes.error);
    }
  }, [callDuration, user.role, handleEndCall]);

  useEffect(() => {
    console.log("[VideoChatView] dY`? Attaching socket event listeners");

    const onCallEndedFallback = (data: any) => {
      console.log("[VideoChatView] 🛑 Socket event received: call-ended/partner-disconnected", data);
      handleEndCall();
    };

    const onIcebreaker = (data: any) => {
      console.log("[VideoChatView] 🧊 Icebreaker received:", data);
      setIncomingIcebreaker(data.message || data);
      setTimeout(() => setIncomingIcebreaker(null), 8000);
    };

    const onReaction = (data: any) => {
      console.log("[VideoChatView] 😀 Reaction received:", data);
      setIncomingReaction({ emoji: data.emoji, id: Date.now() });
    };

    const onGiftReceived = (data: any) => {
      console.log("[VideoChatView] 🎁 Gift received:", data);
      setIncomingGift(data);
      setTimeout(() => setIncomingGift(null), 5000); // Hide after 5s
      fetchMyGifts(); // Fetch new gifts to update inventory
    };

    const onGiftSentSuccess = (data: any) => {
      ShowAlertMessage("Gift sent successfully!", popTypes.success);
      if (data.newBalance !== undefined && setUser) {
         setUser((prev: any) => prev ? { ...prev, walletBalance: data.newBalance } : prev);
         dispatch(setGlobalUser({ ...user, walletBalance: data.newBalance }));
      }
    };

    const onGiftError = (data: any) => {
      ShowAlertMessage(data.message || "Failed to send gift", popTypes.error);
    };

    socket.on("call-ended", onCallEndedFallback);
    socket.on("match-ended", onCallEndedFallback);
    socket.on("user-disconnected", onCallEndedFallback);
    socket.on("partner-disconnected", onCallEndedFallback);
    socket.on("icebreaker-received", onIcebreaker);
    socket.on("reaction-received", onReaction);
    socket.on("gift-received", onGiftReceived);
    socket.on("gift-sent-success", onGiftSentSuccess);
    socket.on("gift-error", onGiftError);

    if (!call) {
      return () => {
        socket.off("call-ended", onCallEndedFallback);
        socket.off("match-ended", onCallEndedFallback);
        socket.off("user-disconnected", onCallEndedFallback);
        socket.off("partner-disconnected", onCallEndedFallback);
        socket.off("icebreaker-received", onIcebreaker);
        socket.off("reaction-received", onReaction);
        socket.off("gift-received", onGiftReceived);
        socket.off("gift-sent-success", onGiftSentSuccess);
        socket.off("gift-error", onGiftError);
      };
    };

    console.log("[VideoChatView] 👀 Attaching Stream participant event listeners — callId:", callId);

    let leaveTimeout: ReturnType<typeof setTimeout> | null = null;

    const onParticipantJoined = (event: any) => {
      console.log("[VideoChatView] 🟢 Participant joined event");
      if (leaveTimeout) {
        clearTimeout(leaveTimeout);
        leaveTimeout = null;
      }
    };

    const onParticipantLeft = (event: any) => {
      console.log("[VideoChatView] 🔴 Participant left event from Stream");
      
      if (leaveTimeout) clearTimeout(leaveTimeout);
      
      // If a participant leaves in a 1-1 app, the call is over.
      leaveTimeout = setTimeout(() => {
        if (!hasLeftRef.current) {
          console.log("[VideoChatView] 🚪 remote user left Stream call — ending call");
          handleEndCall();
        }
      }, 3000);
    };

    call.on("call.session_participant_joined", onParticipantJoined);
    call.on("call.session_participant_left",   onParticipantLeft);

    return () => {
      socket.off("call-ended", onCallEndedFallback);
      socket.off("match-ended", onCallEndedFallback);
      socket.off("user-disconnected", onCallEndedFallback);
      socket.off("partner-disconnected", onCallEndedFallback);
      socket.off("icebreaker-received", onIcebreaker);
      socket.off("reaction-received", onReaction);
      socket.off("gift-received", onGiftReceived);
      socket.off("gift-sent-success", onGiftSentSuccess);
      socket.off("gift-error", onGiftError);

      console.log("[VideoChatView] Detaching participant listeners");
      if (leaveTimeout) clearTimeout(leaveTimeout);
      call.off("call.session_participant_joined", onParticipantJoined);
      call.off("call.session_participant_left",   onParticipantLeft);
    };
  }, [call, handleEndCall]);

  // ─── End call ───────────────────────────────────

  const [incomingReaction, setIncomingReaction] = useState<{ emoji: string; id: number } | null>(null);

  useEffect(() => {
    if (incomingReaction) {
      const timer = setTimeout(() => setIncomingReaction(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [incomingReaction]);

  const sendReaction = useCallback(async (emoji: string) => {
    const receiverId = remoteUserId;
    if (receiverId) {
      socket.emit("send-reaction", { receiverId, emoji });
      // Show it to ourselves too
      setIncomingReaction({ emoji, id: Date.now() });
    }
    setShowEmojiPicker(false);
  }, [remoteUserId]);

  const sendGift = useCallback((gift: any, inventoryGiftId?: string) => {
    const receiverId = remoteUserId;
    if (!receiverId) return;
    socket.emit("send-gift", { receiverId, giftName: gift.name || gift.giftName, coinCost: gift.cost || gift.coinValue, inventoryGiftId });
    setShowGiftPicker(false);
  }, [remoteUserId]);

  React.useEffect(() => {
    if (showGiftPicker) {
      fetchMyGifts();
    }
  }, [showGiftPicker, fetchMyGifts]);

  const sendIcebreaker = useCallback((message: string) => {
    const receiverId = remoteUserId;
    if (!receiverId) return;
    socket.emit("send-icebreaker", { receiverId, message });
    setShowIcebreakers(false);
  }, [remoteUserId]);


  // ─── UI states ──────────────────────────────────

  if (error) {
    console.error("[VideoChatView] Rendering error screen:", error);
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (isJoining || !call || !clientRef.current) {
    console.log(
      "[VideoChatView] Rendering loading screen — isJoining:", isJoining,
      "| call ready:", !!call,
      "| client ready:", !!clientRef.current
    );
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.success} />
        <Text style={styles.loadingText}>Connecting call...</Text>
      </View>
    );
  }

  console.log("[VideoChatView] ✅ Rendering live call UI — callId:", callId);

  // ─── Call UI ────────────────────────────────────

  const CallTimer = () => {
    if (user.role === 'PREMIUM') return null;
    const remaining = 120 - callDuration;
    if (remaining < 0) return null;
    
    const minutes = Math.floor(remaining / 60);
    const seconds = remaining % 60;
    const isUrgent = remaining <= 30;

    return (
      <View style={{
        position: 'absolute',
        top: 60,
        alignSelf: 'center',
        backgroundColor: isUrgent ? 'rgba(239, 68, 68, 0.9)' : 'rgba(0,0,0,0.6)',
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 20,
        zIndex: 100,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8
      }}>
        <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 16 }}>
          Free Limit: {minutes}:{seconds.toString().padStart(2, '0')}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StreamVideo client={clientRef.current}>
        <StreamCall call={call}>
          <View style={StyleSheet.absoluteFill}>
            <CallTimer />
            <CallContent
              onHangupCallHandler={handleEndCall}
              layout="grid"
              CallControls={() => (
                <View style={styles.controls}>
                  {/* @ts-ignore */}
                  <ToggleAudioPublishingButton />
                  {/* @ts-ignore */}
                  <ToggleVideoPublishingButton />
                  {/* @ts-ignore */}
                  <ToggleCameraFaceButton />

                  <TouchableOpacity style={styles.controlBtn} onPress={() => setShowEmojiPicker(true)}>
                    <Text style={styles.controlBtnLabel}>😊</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.controlBtn} onPress={() => setShowGiftPicker(true)}>
                    <Text style={styles.controlBtnLabel}>🎁</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.controlBtn} onPress={() => setShowIcebreakers(true)}>
                    <Text style={styles.controlBtnLabel}>💬</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.controlBtn} onPress={() => {
                    setIsFilterActive(!isFilterActive);
                    ShowAlertMessage(isFilterActive ? "AR Filter Off" : "AR Filter On", popTypes.success);
                  }}>
                    <Text style={[styles.controlBtnLabel, { opacity: isFilterActive ? 1 : 0.5 }]}>🎭</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.reportBtn} onPress={handleReport}>
                    <Text style={styles.reportIcon}>⚑</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={[styles.controlBtn, { backgroundColor: "#EF4444" }]} onPress={handleEndCall}>
                    <PhoneOff size={24} color="#FFF" />
                  </TouchableOpacity>
                </View>
              )}
            />
            {/* Blur Protection Overlay */}
            {isBlurred && (
              <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.95)", justifyContent: "center", alignItems: "center", zIndex: 10 }]}>
                <Shield color="#6366F1" size={48} />
                <Text style={{ color: "#FFF", fontSize: 18, fontWeight: "700", marginTop: 16 }}>Safety Blur Active</Text>
                <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 14, marginTop: 8 }}>Revealing video in 3 seconds...</Text>
              </View>
            )}
          </View>
        </StreamCall>
      </StreamVideo>

      {incomingReaction && (
        <View style={styles.reactionToast}>
          <Text style={styles.reactionToastText}>{incomingReaction.emoji}</Text>
        </View>
      )}

      {incomingIcebreaker && (
        <View style={styles.icebreakerToast}>
          <Text style={styles.icebreakerToastText}>{incomingIcebreaker}</Text>
        </View>
      )}

      {incomingGift && (
        <View style={styles.giftAnimationContainer}>
          <Text style={styles.giftIconLarge}>🎁</Text>
          <Text style={styles.giftText}>{incomingGift.senderName} sent you a {incomingGift.giftName}!</Text>
        </View>
      )}

      {showEmojiPicker && (
        <View style={styles.emojiPickerOverlay}>
          <TouchableOpacity style={styles.emojiPickerBg} onPress={() => setShowEmojiPicker(false)} />
          <View style={styles.emojiPickerContainer}>
            <Text style={styles.emojiPickerTitle}>Send a reaction</Text>
            <View style={styles.emojiGrid}>
              {EMOJIS.map((emoji) => (
                <TouchableOpacity key={emoji} style={styles.emojiItem} onPress={() => sendReaction(emoji)}>
                  <Text style={styles.emojiText}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      )}

      {showIcebreakers && (
        <View style={styles.icebreakerOverlay}>
          <TouchableOpacity style={styles.icebreakerBg} onPress={() => setShowIcebreakers(false)} />
          <View style={styles.icebreakerContainer}>
            <Text style={styles.icebreakerTitle}>Conversation starters</Text>
            <ScrollView style={styles.icebreakerList}>
              {ICEBREAKERS.map((q, i) => (
                <TouchableOpacity key={i} style={styles.icebreakerItem} onPress={() => sendIcebreaker(q)}>
                  <Text style={styles.icebreakerItemText}>{q}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      )}

      {showGiftPicker && (
        <View style={styles.emojiPickerOverlay}>
          <TouchableOpacity style={styles.emojiPickerBg} onPress={() => setShowGiftPicker(false)} />
          <View style={[styles.emojiPickerContainer, { maxHeight: '60%' }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 16, gap: 10 }}>
              <TouchableOpacity onPress={() => setGiftTab('store')} style={{ paddingBottom: 5, borderBottomWidth: giftTab === 'store' ? 2 : 0, borderBottomColor: '#EC4899' }}>
                <Text style={{ color: giftTab === 'store' ? '#EC4899' : colors.white, fontWeight: 'bold' }}>Store</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setGiftTab('inventory')} style={{ paddingBottom: 5, borderBottomWidth: giftTab === 'inventory' ? 2 : 0, borderBottomColor: '#EC4899' }}>
                <Text style={{ color: giftTab === 'inventory' ? '#EC4899' : colors.white, fontWeight: 'bold' }}>My Inventory</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView contentContainerStyle={{ paddingBottom: 10 }}>
              {giftTab === 'store' ? (
                <View style={styles.emojiGrid}>
                  {GIFTS.map((gift) => (
                    <TouchableOpacity key={gift.id} style={styles.giftItemCard} onPress={() => sendGift(gift)}>
                      <Text style={styles.giftIcon}>{gift.icon}</Text>
                      <Text style={styles.giftCost}>{gift.cost} Coins</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <View style={styles.emojiGrid}>
                  {myGifts.length === 0 ? (
                    <Text style={{ color: colors.textMuted, textAlign: 'center', marginTop: 20 }}>No gifts in inventory.</Text>
                  ) : (
                    myGifts.map((gift) => {
                      const iconData = GIFTS.find(g => g.name === gift.giftName)?.icon || 'dYZ?';
                      return (
                        <TouchableOpacity key={gift._id} style={styles.giftItemCard} onPress={() => sendGift(gift, gift._id)}>
                          <Text style={styles.giftIcon}>{iconData}</Text>
                          <Text style={styles.giftCost}>Send Free</Text>
                        </TouchableOpacity>
                      );
                    })
                  )}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      )}

      <ReportModal
        visible={reportVisible}
        onClose={handleReportClose}
        onSubmit={handleReportSubmit}
      />
    </SafeAreaView>
  );
};
import React, { useCallback, useEffect, useRef, useState } from "react";
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
  Animated,
  Dimensions,
  Image,
} from "react-native";
import {
  Shield,
  PhoneOff,
  Sparkles,
  MessageCircle,
  Gift as GiftIcon,
  Smile,
  SwitchCamera,
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  Flag,
  X,
  Check,
  Zap,
  Clock,
  Crown,
  MoreHorizontal,
  ChevronDown,
} from "lucide-react-native";
import LinearGradient from "react-native-linear-gradient";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { UserAvatar } from "../../components/UserAvatar";

import {
  StreamVideo,
  StreamVideoClient,
  StreamCall,
  CallContent,
  ToggleAudioPublishingButton,
  ToggleCameraFaceButton,
  ToggleVideoPublishingButton,
} from "@stream-io/video-react-native-sdk";

import { useSelector, useDispatch } from "react-redux";
import { tokenSelector, setGlobalUser } from "../../redux/slices/persistedSlice";
import { BASE_URL as API_BASE_URL, IMAGE_URL } from "../../config/env";

import { colors } from "../../utils/colors";
import { socket } from "../../socket/socket";
import { managerApiCall } from "../../helpers/managerApiCallFn";
import { useUserReportMutation } from "../../redux/services/auth";
import { getUser } from "../../utils/storage";
import { popTypes, ShowAlertMessage } from "../../helpers/commonFunctions";
import { AppView, User } from "../../types";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// ─── Constants & Data ─────────────────────────────────────────────────────────

const ICEBREAKERS = [
  { id: 1, text: "If you could travel anywhere right now, where would you go?", category: "Travel ✈️" },
  { id: 2, text: "What's the best movie or show you've watched recently?", category: "Fun 🍿" },
  { id: 3, text: "What's a secret talent or hobby you have?", category: "Random 🎯" },
  { id: 4, text: "What's your favorite way to spend a perfect weekend?", category: "Lifestyle ☀️" },
  { id: 5, text: "What kind of music have you been obsessed with lately?", category: "Music 🎵" },
  { id: 6, text: "If you could have dinner with anyone in the world, who would it be?", category: "Deep 💭" },
  { id: 7, text: "What's your absolute go-to comfort food?", category: "Food 🍕" },
  { id: 8, text: "Are you more of an early bird or a night owl?", category: "Lifestyle 🌙" },
  { id: 9, text: "What's the best advice someone has ever given you?", category: "Deep 💡" },
  { id: 10, text: "What's something on your bucket list this year?", category: "Goals 🚀" },
];

const EMOJIS = ["❤️", "🔥", "😍", "😂", "🎉", "👏", "😮", "💖", "✨", "👑"];

const GIFTS = [
  { id: "rose", name: "Rose", icon: "🌹", cost: 10, desc: "A sweet gesture" },
  { id: "coffee", name: "Coffee", icon: "☕", cost: 25, desc: "Warm & cozy" },
  { id: "crown", name: "Crown", icon: "👑", cost: 100, desc: "Royal status" },
  { id: "diamond", name: "Diamond", icon: "💎", cost: 500, desc: "Pure luxury" },
];

const REPORT_REASONS = [
  { id: "inappropriate", label: "Inappropriate behavior", icon: "🚫" },
  { id: "harassment",    label: "Harassment or bullying",  icon: "😠" },
  { id: "spam",          label: "Spam or scam attempt",    icon: "⚠️" },
  { id: "hate_speech",   label: "Hate speech / harassment",icon: "🛑" },
  { id: "nudity",        label: "Nudity or sexual content",icon: "🔞" },
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

// ─── Floating Reaction Bubble Item ────────────────────────────────────────────

interface FloatingReaction {
  id: number;
  emoji: string;
  anim: Animated.Value;
  xOffset: number;
}

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
  const insets = useSafeAreaInsets();
  const clientRef = useRef<StreamVideoClient | null>(null);
  const callRef = useRef<any>(null);
  const joinedRef = useRef(false);
  const hasLeftRef = useRef(false);

  // States
  const [call, setCall]                             = useState<any>(null);
  const [isJoining, setIsJoining]                   = useState(true);
  const [error, setError]                           = useState<string | null>(null);
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  
  // Control Toggles & Sheets
  const [showEmojiPicker, setShowEmojiPicker]       = useState(false);
  const [showIcebreakers, setShowIcebreakers]       = useState(false);
  const [showGiftPicker, setShowGiftPicker]         = useState(false);
  const [showMoreActions, setShowMoreActions]       = useState(false);
  const [reportVisible, setReportVisible]           = useState(false);

  // Interactive Features
  const [incomingIcebreaker, setIncomingIcebreaker] = useState<string | null>(null);
  const [incomingGift, setIncomingGift]             = useState<any>(null);
  const [myGifts, setMyGifts]                       = useState<any[]>([]);
  const [giftTab, setGiftTab]                       = useState<'store' | 'inventory'>('store');
  const [openedGift, setOpenedGift]                 = useState<boolean>(false);
  const giftScale                                   = useRef(new Animated.Value(0)).current;
  const giftOpacity                                 = useRef(new Animated.Value(1)).current;

  // Safety & Timers
  const [isBlurred, setIsBlurred]                   = useState(true);
  const [blurCountdown, setBlurCountdown]           = useState(3);
  const [callDuration, setCallDuration]             = useState(0);
  const [isFilterActive, setIsFilterActive]         = useState(false);

  // Floating Reactions
  const [reactions, setReactions]                   = useState<FloatingReaction[]>([]);

  // Redux & API
  const token = useSelector(tokenSelector);
  const dispatch = useDispatch();
  const [userReport] = useUserReportMutation();

  // ─── Call Duration Counter ──────────────────────────────────────────────────
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (call && !isJoining) {
      interval = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [call, isJoining]);

  // ─── 3-Second Safety Blur Countdown ─────────────────────────────────────────
  useEffect(() => {
    const timer = setInterval(() => {
      setBlurCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsBlurred(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // ─── Fetch Inventory Gifts ──────────────────────────────────────────────────
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
      }
    } catch (e) {
      console.error("[VideoChatView] Fetch gifts failed:", e);
    }
  }, [token]);

  // ─── Trigger Floating Reaction Animation ─────────────────────────────────────
  const triggerFloatingReaction = useCallback((emoji: string) => {
    const anim = new Animated.Value(0);
    const newReaction: FloatingReaction = {
      id: Date.now() + Math.random(),
      emoji,
      anim,
      xOffset: (Math.random() - 0.5) * 60,
    };

    setReactions((prev) => [...prev.slice(-10), newReaction]);

    Animated.timing(anim, {
      toValue: 1,
      duration: 2200,
      useNativeDriver: true,
    }).start(() => {
      setReactions((prev) => prev.filter((r) => r.id !== newReaction.id));
    });
  }, []);

  // ─── Permissions ────────────────────────────────────────────────────────────
  useEffect(() => {
    const askPermissions = async () => {
      if (Platform.OS === "android") {
        const result = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.CAMERA,
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        ]);

        const cameraOk = result[PermissionsAndroid.PERMISSIONS.CAMERA] === PermissionsAndroid.RESULTS.GRANTED;
        const micOk = result[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] === PermissionsAndroid.RESULTS.GRANTED;
        const ok = cameraOk && micOk;

        if (!ok) {
          setError("Camera & Microphone permissions are required to video call.");
        }
        setPermissionsGranted(ok);
      } else {
        try {
          const { request, PERMISSIONS, RESULTS } = require('react-native-permissions');
          const cameraStatus = await request(PERMISSIONS.IOS.CAMERA);
          const micStatus = await request(PERMISSIONS.IOS.MICROPHONE);
          const ok = cameraStatus === RESULTS.GRANTED && micStatus === RESULTS.GRANTED;

          if (!ok) {
            setError("Camera & Microphone permissions are required to video call.");
            setPermissionsGranted(false);
          } else {
            setPermissionsGranted(true);
          }
        } catch (err) {
          setPermissionsGranted(true);
        }
      }
    };

    askPermissions();
  }, []);

  // ─── Prevent Android Back Button During Active Call ──────────────────────────
  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => true);
    return () => sub.remove();
  }, []);

  // ─── Stream Call Setup ──────────────────────────────────────────────────────
  useEffect(() => {
    const hasToken  = !!streamTokenProp?.token;
    const hasApiKey = !!streamTokenProp?.apiKey;
    const hasUserId = !!streamTokenProp?.userId;
    const hasCallId = !!callId;

    if (!hasToken || !hasApiKey || !hasUserId || !hasCallId) {
      setError("Missing call credentials");
      setIsJoining(false);
      return;
    }

    if (!permissionsGranted) return;

    const setup = async () => {
      try {
        const videoClient = StreamVideoClient.getOrCreateInstance({
          apiKey: streamTokenProp!.apiKey,
          user:  { id: streamTokenProp!.userId },
          token: streamTokenProp!.token,
        });

        clientRef.current = videoClient;
        const streamCall = videoClient.call("default", callId!);

        await streamCall.join({ create: true });
        await streamCall.microphone.enable();

        callRef.current = streamCall;
        joinedRef.current = true;
        setCall(streamCall);
      } catch (e: any) {
        setError(e?.message || "Failed to join video call");
      } finally {
        setIsJoining(false);
      }
    };

    setup();

    return () => {
      if (!hasLeftRef.current && joinedRef.current) {
        callRef.current?.leave().catch(() => {});
        clientRef.current?.disconnectUser().catch(() => {});
      }
    };
  }, [
    streamTokenProp?.token,
    streamTokenProp?.apiKey,
    streamTokenProp?.userId,
    callId,
    permissionsGranted,
  ]);

  // ─── End Call Action ─────────────────────────────────────────────────────────
  const handleEndCall = useCallback(async () => {
    if (hasLeftRef.current) return;
    hasLeftRef.current = true;

    try {
      await callRef.current?.leave();
    } catch (err) {}

    try {
      await clientRef.current?.disconnectUser();
    } catch (err) {}

    if (matchId) {
      socket.emit("end-call", { matchId });
    }

    setView(AppView.MATCH_FOUND, {
      preference,
      showRatingModal: true,
      lastMatchId: matchId,
      lastPartnerName:
        (matchData?.user1 as any)?._id === (user as any)?._id
          ? matchData?.user2?.displayName
          : matchData?.user1?.displayName || "your partner",
    });
  }, [matchId, setView, preference, matchData, user]);

  // ─── Free Limit (120s) Enforcement ──────────────────────────────────────────
  useEffect(() => {
    const isAnyPremium =
      user?.isPremium === 'premium' ||
      user?.role === 'premium' ||
      matchData?.user1?.isPremium === 'premium' ||
      matchData?.user2?.isPremium === 'premium';

    if (!isAnyPremium && callDuration >= 120) {
      ShowAlertMessage("Free 2-minute call limit reached. Upgrade to Premium for unlimited calls!", popTypes.error);
      handleEndCall();
    }
  }, [callDuration, user, matchData, handleEndCall]);

  // ─── Socket Event Listeners ──────────────────────────────────────────────────
  useEffect(() => {
    const onCallEndedFallback = () => handleEndCall();

    const onIcebreaker = (data: any) => {
      setIncomingIcebreaker(data.message || data);
      setTimeout(() => setIncomingIcebreaker(null), 8000);
    };

    const onReaction = (data: any) => {
      triggerFloatingReaction(data.emoji);
    };

    const onGiftReceived = (data: any) => {
      setIncomingGift(data);
      setOpenedGift(false);
      giftScale.setValue(0);
      giftOpacity.setValue(1);
      setTimeout(() => setIncomingGift(null), 15000);
      fetchMyGifts();
    };

    const onGiftSentSuccess = (data: any) => {
      ShowAlertMessage("Gift sent successfully! 🎁", popTypes.success);
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

    let leaveTimeout: ReturnType<typeof setTimeout> | null = null;
    if (call) {
      const onParticipantLeft = () => {
        if (leaveTimeout) clearTimeout(leaveTimeout);
        leaveTimeout = setTimeout(() => {
          if (!hasLeftRef.current) {
            handleEndCall();
          }
        }, 3000);
      };
      call.on("call.session_participant_left", onParticipantLeft);
    }

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
      if (leaveTimeout) clearTimeout(leaveTimeout);
      if (call) {
        call.off("call.session_participant_left", () => {});
      }
    };
  }, [call, handleEndCall, triggerFloatingReaction, fetchMyGifts, user, setUser, dispatch]);

  // ─── Interactive Actions ─────────────────────────────────────────────────────
  const sendReaction = (emoji: string) => {
    if (remoteUserId) {
      socket.emit("send-reaction", { receiverId: remoteUserId, emoji });
      triggerFloatingReaction(emoji);
    }
    setShowEmojiPicker(false);
  };

  const sendGift = (gift: any, inventoryGiftId?: string) => {
    if (!remoteUserId) return;
    socket.emit("send-gift", {
      receiverId: remoteUserId,
      giftName: gift.name || gift.giftName,
      coinCost: gift.cost || gift.coinValue,
      inventoryGiftId,
    });
    setShowGiftPicker(false);
  };

  const sendIcebreaker = (message: string) => {
    if (!remoteUserId) return;
    socket.emit("send-icebreaker", { receiverId: remoteUserId, message });
    setShowIcebreakers(false);
    ShowAlertMessage("Icebreaker sent! 💬", popTypes.success);
  };

  // ─── Report & Block ─────────────────────────────────────────────────────────
  const handleReportSubmit = useCallback(
    async (selected: string[], note: string) => {
      setReportVisible(false);
      try {
        await managerApiCall(
          userReport,
          {
            category: selected,
            message: note,
            matchId: matchId,
            reportedUser: matchData?.userId || matchData?.id || remoteUserId,
          },
          () => {
            ShowAlertMessage("Report submitted successfully", popTypes.info);
          }
        );
      } catch (err) {}
      handleEndCall();
    },
    [matchId, matchData, remoteUserId, userReport, handleEndCall]
  );

  const handleBlockUser = useCallback(() => {
    if (remoteUserId) {
      socket.emit('blockUser', { targetId: remoteUserId });
      ShowAlertMessage("User blocked", popTypes.info);
      handleEndCall();
    }
  }, [remoteUserId, handleEndCall]);

  // ─── Loading / Error View ───────────────────────────────────────────────────
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <LinearGradient colors={["#1E1B4B", "#090A0F"]} style={StyleSheet.absoluteFill} />
        <View style={styles.errorCard}>
          <Shield size={48} color="#EF4444" />
          <Text style={styles.errorTitle}>Connection Error</Text>
          <Text style={styles.errorSubtitle}>{error}</Text>
          <TouchableOpacity style={styles.errorBtn} onPress={handleEndCall} activeOpacity={0.8}>
            <Text style={styles.errorBtnText}>Return to Match</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (isJoining || !call || !clientRef.current) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient colors={["#1E1B4B", "#090A0F"]} style={StyleSheet.absoluteFill} />
        <View style={styles.loadingPulseWrap}>
          <View style={styles.loadingPulseOuter} />
          <View style={styles.loadingPulseInner}>
            <ActivityIndicator size="large" color="#6366F1" />
          </View>
        </View>
        <Text style={styles.loadingTitle}>Connecting Video Call...</Text>
        <Text style={styles.loadingSubtitle}>Securing your high-quality connection</Text>
      </View>
    );
  }

  // ─── Timer Calculation ──────────────────────────────────────────────────────
  const isAnyPremium =
    user?.isPremium === 'premium' ||
    user?.role === 'premium' ||
    matchData?.user1?.isPremium === 'premium' ||
    matchData?.user2?.isPremium === 'premium';

  const freeRemaining = Math.max(0, 120 - callDuration);
  const isFreeUrgent = !isAnyPremium && freeRemaining <= 30;

  // ─── Resolve Partner Details (Photo & Name) ─────────────────────────────────
  const getAvatarUri = (img?: string | null) => {
    if (!img) return null;
    if (img.startsWith("http://") || img.startsWith("https://")) return img;
    const cleanPath = img.startsWith("/") ? img.substring(1) : img;
    return `${IMAGE_URL}/${cleanPath}`;
  };

  const partnerRawPhoto =
    participantImage ||
    (matchData?.user1?._id === user?._id
      ? matchData?.user2?.profilePicture
      : matchData?.user1?.profilePicture) ||
    matchData?.remoteUser?.profilePicture;

  const partnerAvatarUri = getAvatarUri(partnerRawPhoto);

  const partnerDisplayName =
    participantName ||
    (matchData?.user1?._id === user?._id
      ? (matchData?.user2?.displayName || matchData?.user2?.fullName)
      : (matchData?.user1?.displayName || matchData?.user1?.fullName)) ||
    matchData?.remoteUser?.displayName ||
    matchData?.remoteUser?.fullName ||
    "Partner";

  const partnerGender =
    (matchData?.user1?._id === user?._id
      ? matchData?.user2?.gender
      : matchData?.user1?.gender) ||
    matchData?.remoteUser?.gender;

  // ─── Render Live Call UI ────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <StreamVideo client={clientRef.current}>
        <StreamCall call={call}>
          <View style={StyleSheet.absoluteFill}>
            {/* ── CallContent (Stream Video Grid) ── */}
            <CallContent
              onHangupCallHandler={handleEndCall}
              layout="grid"
              CallControls={() => null} // Custom bottom dock rendered below
            />

            {/* ── Top Header Bar (Glassmorphic) ── */}
            <View style={[styles.topHeader, { top: insets.top + 8 }]}>
              {/* Partner Info Pill */}
              <View style={styles.partnerInfoPill}>
                <View style={styles.partnerAvatarWrap}>
                  <UserAvatar
                    uri={partnerAvatarUri}
                    gender={partnerGender}
                    name={partnerDisplayName}
                    size={36}
                    borderRadius={18}
                  />
                  <View style={styles.onlineStatusDot} />
                </View>

                <View style={styles.partnerTextGroup}>
                  <View style={styles.partnerNameRow}>
                    <Text style={styles.partnerNameText} numberOfLines={1}>
                      {partnerDisplayName}
                    </Text>
                    {matchData?.isPremium === "premium" && (
                      <LinearGradient colors={["#F59E0B", "#D97706"]} style={styles.vipBadge}>
                        <Crown size={10} color="#FFF" />
                        <Text style={styles.vipBadgeText}>VIP</Text>
                      </LinearGradient>
                    )}
                  </View>
                  <Text style={styles.liveCallStatus}>● Connected</Text>
                </View>
              </View>

              {/* Timer Pill */}
              <View style={[styles.timerPill, isFreeUrgent && styles.timerPillUrgent]}>
                <Clock size={12} color={isFreeUrgent ? "#FFF" : colors.textMuted} />
                <Text style={[styles.timerPillText, isFreeUrgent && styles.timerPillTextUrgent]}>
                  {!isAnyPremium
                    ? `${Math.floor(freeRemaining / 60)}:${(freeRemaining % 60).toString().padStart(2, '0')}`
                    : formatDuration(callDuration)}
                </Text>
              </View>

              {/* Quick Actions (Report/Shield & More) */}
              <View style={styles.topActionGroup}>
                <TouchableOpacity
                  style={styles.topIconBtn}
                  onPress={() => setShowMoreActions(true)}
                  activeOpacity={0.8}
                >
                  <MoreHorizontal size={18} color="#FFF" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.topIconBtn, { backgroundColor: "rgba(239, 68, 68, 0.25)", borderColor: "rgba(239, 68, 68, 0.4)" }]}
                  onPress={() => setReportVisible(true)}
                  activeOpacity={0.8}
                >
                  <Shield size={16} color="#EF4444" />
                </TouchableOpacity>
              </View>
            </View>

            {/* ── Floating Reaction Bubbles ── */}
            <View style={styles.reactionsContainer} pointerEvents="none">
              {reactions.map((r) => {
                const translateY = r.anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -320],
                });
                const opacity = r.anim.interpolate({
                  inputRange: [0, 0.1, 0.75, 1],
                  outputRange: [0, 1, 0.9, 0],
                });
                const scale = r.anim.interpolate({
                  inputRange: [0, 0.2, 0.8, 1],
                  outputRange: [0.4, 1.3, 1, 0.7],
                });

                return (
                  <Animated.View
                    key={r.id}
                    style={[
                      styles.reactionBubble,
                      {
                        transform: [{ translateY }, { translateX: r.xOffset }, { scale }],
                        opacity,
                      },
                    ]}
                  >
                    <Text style={styles.reactionEmojiText}>{r.emoji}</Text>
                  </Animated.View>
                );
              })}
            </View>

            {/* ── Incoming Icebreaker Floating Toast ── */}
            {incomingIcebreaker && (
              <View style={[styles.icebreakerToast, { top: insets.top + 70 }]}>
                <LinearGradient
                  colors={["rgba(99, 102, 241, 0.95)", "rgba(79, 70, 229, 0.95)"]}
                  style={styles.icebreakerToastInner}
                >
                  <View style={styles.icebreakerToastIcon}>
                    <MessageCircle size={18} color="#FFF" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.icebreakerToastHeader}>Conversation Starter</Text>
                    <Text style={styles.icebreakerToastBody}>{incomingIcebreaker}</Text>
                  </View>
                </LinearGradient>
              </View>
            )}

            {/* ── Incoming Gift Unboxing Overlay ── */}
            {incomingGift && (
              <View style={styles.giftAnimationContainer}>
                {!openedGift ? (
                  <TouchableOpacity
                    style={styles.giftUnopenedBox}
                    onPress={() => {
                      setOpenedGift(true);
                      Animated.spring(giftScale, {
                        toValue: 1,
                        friction: 4,
                        useNativeDriver: true,
                      }).start();

                      setTimeout(() => {
                        Animated.timing(giftOpacity, {
                          toValue: 0,
                          duration: 1000,
                          useNativeDriver: true,
                        }).start(() => setIncomingGift(null));
                      }, 3500);
                    }}
                    activeOpacity={0.85}
                  >
                    <LinearGradient
                      colors={["rgba(245, 158, 11, 0.9)", "rgba(217, 119, 6, 0.95)"]}
                      style={styles.giftUnopenedGradient}
                    >
                      <Text style={styles.giftIconLarge}>🎁</Text>
                      <Text style={styles.giftUnopenedTitle}>Gift Received!</Text>
                      <Text style={styles.giftUnopenedSub}>
                        Tap to unwrap gift from {incomingGift.senderName || "partner"}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                ) : (
                  <Animated.View
                    style={[
                      styles.giftOpenedBox,
                      { transform: [{ scale: giftScale }], opacity: giftOpacity },
                    ]}
                  >
                    <LinearGradient
                      colors={["rgba(30, 27, 75, 0.95)", "rgba(15, 23, 42, 0.95)"]}
                      style={styles.giftOpenedGradient}
                    >
                      <Text style={styles.giftOpenedIcon}>
                        {GIFTS.find((g) => g.name === incomingGift.giftName)?.icon || "🎁"}
                      </Text>
                      <Text style={styles.giftOpenedTitle}>{incomingGift.giftName}</Text>
                      <Text style={styles.giftOpenedSender}>
                        Sent by <Text style={{ color: "#F59E0B", fontWeight: "bold" }}>{incomingGift.senderName}</Text>
                      </Text>
                    </LinearGradient>
                  </Animated.View>
                )}
              </View>
            )}

            {/* ── 3-Second Safety Blur Overlay ── */}
            {isBlurred && (
              <View style={styles.safetyBlurOverlay}>
                <LinearGradient
                  colors={["rgba(2, 6, 23, 0.95)", "rgba(15, 23, 42, 0.98)"]}
                  style={StyleSheet.absoluteFill}
                />
                <View style={styles.safetyShieldWrap}>
                  <Shield size={44} color="#6366F1" />
                </View>
                <Text style={styles.safetyBlurTitle}>Safety Blur Active</Text>
                <Text style={styles.safetyBlurSubtitle}>
                  Ensuring a safe & respectful video environment
                </Text>
                <View style={styles.safetyCountdownPill}>
                  <Text style={styles.safetyCountdownText}>Revealing in {blurCountdown}s</Text>
                </View>
              </View>
            )}

            {/* ── Modern Bottom Control Dock (Glassmorphic) ── */}
            <View style={[styles.bottomDockWrapper, { paddingBottom: Math.max(insets.bottom, 16) }]}>
              {/* Secondary floating utility pills */}
              <View style={styles.utilityRow}>
                <TouchableOpacity
                  style={[styles.utilityPill, showGiftPicker && styles.utilityPillActive]}
                  onPress={() => {
                    fetchMyGifts();
                    setShowGiftPicker(true);
                  }}
                  activeOpacity={0.8}
                >
                  <GiftIcon size={16} color={showGiftPicker ? "#EC4899" : "#FFF"} />
                  <Text style={[styles.utilityPillText, showGiftPicker && { color: "#EC4899" }]}>
                    Gift
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.utilityPill, showIcebreakers && styles.utilityPillActive]}
                  onPress={() => setShowIcebreakers(true)}
                  activeOpacity={0.8}
                >
                  <MessageCircle size={16} color={showIcebreakers ? "#6366F1" : "#FFF"} />
                  <Text style={[styles.utilityPillText, showIcebreakers && { color: "#6366F1" }]}>
                    Topic
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.utilityPill, showEmojiPicker && styles.utilityPillActive]}
                  onPress={() => setShowEmojiPicker(true)}
                  activeOpacity={0.8}
                >
                  <Smile size={16} color={showEmojiPicker ? "#F59E0B" : "#FFF"} />
                  <Text style={[styles.utilityPillText, showEmojiPicker && { color: "#F59E0B" }]}>
                    React
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.utilityPill, isFilterActive && styles.utilityPillActive]}
                  onPress={() => {
                    setIsFilterActive(!isFilterActive);
                    ShowAlertMessage(isFilterActive ? "AR Beauty Off" : "AR Beauty On", popTypes.success);
                  }}
                  activeOpacity={0.8}
                >
                  <Sparkles size={16} color={isFilterActive ? "#10B981" : "#FFF"} />
                  <Text style={[styles.utilityPillText, isFilterActive && { color: "#10B981" }]}>
                    Beauty
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Primary Call Action Dock */}
              <View style={styles.mainControlDock}>
                {/* Audio Publish Button */}
                <View style={styles.streamBtnContainer}>
                  {/* @ts-ignore */}
                  <ToggleAudioPublishingButton />
                </View>

                {/* Video Publish Button */}
                <View style={styles.streamBtnContainer}>
                  {/* @ts-ignore */}
                  <ToggleVideoPublishingButton />
                </View>

                {/* Flip Camera Button */}
                <View style={styles.streamBtnContainer}>
                  {/* @ts-ignore */}
                  <ToggleCameraFaceButton />
                </View>

                {/* Prominent End Call Button */}
                <TouchableOpacity
                  style={styles.endCallBtn}
                  onPress={handleEndCall}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={["#EF4444", "#DC2626"]}
                    style={styles.endCallBtnGradient}
                  >
                    <PhoneOff size={22} color="#FFF" />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </StreamCall>
      </StreamVideo>

      {/* ══════════════════════════════════════════════════════════
           MORE ACTIONS MODAL (Glass Sheet)
         ══════════════════════════════════════════════════════════ */}
      <Modal
        visible={showMoreActions}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMoreActions(false)}
      >
        <TouchableOpacity
          style={modalStyles.backdrop}
          activeOpacity={1}
          onPress={() => setShowMoreActions(false)}
        />
        <View style={[modalStyles.sheet, { paddingBottom: Math.max(insets.bottom, 24) }]}>
          <View style={modalStyles.handle} />
          <View style={modalStyles.header}>
            <Text style={modalStyles.title}>Call Options</Text>
            <Text style={modalStyles.subtitle}>Manage your live call experience</Text>
          </View>

          <View style={{ paddingHorizontal: 20, paddingTop: 16, gap: 10 }}>
            <TouchableOpacity
              style={styles.actionSheetItem}
              onPress={() => {
                setShowMoreActions(false);
                setReportVisible(true);
              }}
              activeOpacity={0.75}
            >
              <View style={[styles.actionSheetIconWrap, { backgroundColor: "rgba(239, 68, 68, 0.15)" }]}>
                <Flag size={20} color="#EF4444" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.actionSheetItemTitle}>Report Participant</Text>
                <Text style={styles.actionSheetItemSub}>Report inappropriate behavior or policy violation</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionSheetItem}
              onPress={() => {
                setShowMoreActions(false);
                handleBlockUser();
              }}
              activeOpacity={0.75}
            >
              <View style={[styles.actionSheetIconWrap, { backgroundColor: "rgba(239, 68, 68, 0.15)" }]}>
                <Shield size={20} color="#EF4444" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.actionSheetItemTitle}>Block & Disconnect</Text>
                <Text style={styles.actionSheetItemSub}>Permanently block this user and end call</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionSheetCancelBtn}
              onPress={() => setShowMoreActions(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.actionSheetCancelText}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ══════════════════════════════════════════════════════════
           EMOJI REACTION PICKER MODAL
         ══════════════════════════════════════════════════════════ */}
      <Modal
        visible={showEmojiPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEmojiPicker(false)}
      >
        <TouchableOpacity
          style={modalStyles.backdrop}
          activeOpacity={1}
          onPress={() => setShowEmojiPicker(false)}
        />
        <View style={[styles.floatingPickerSheet, { bottom: 100 + insets.bottom }]}>
          <Text style={styles.pickerSheetTitle}>Send Reaction</Text>
          <View style={styles.emojiGrid}>
            {EMOJIS.map((emoji) => (
              <TouchableOpacity
                key={emoji}
                style={styles.emojiGridBtn}
                onPress={() => sendReaction(emoji)}
                activeOpacity={0.7}
              >
                <Text style={styles.emojiGridText}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      {/* ══════════════════════════════════════════════════════════
           GIFT SHOP & INVENTORY MODAL
         ══════════════════════════════════════════════════════════ */}
      <Modal
        visible={showGiftPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowGiftPicker(false)}
      >
        <TouchableOpacity
          style={modalStyles.backdrop}
          activeOpacity={1}
          onPress={() => setShowGiftPicker(false)}
        />
        <View style={[modalStyles.sheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          <View style={modalStyles.handle} />

          {/* Header with Wallet Balance */}
          <View style={styles.giftSheetHeader}>
            <View>
              <Text style={modalStyles.title}>Send a Gift</Text>
              <Text style={modalStyles.subtitle}>Surprise your call partner</Text>
            </View>

            <View style={styles.walletBalanceBadge}>
              <Text style={styles.walletCoinIcon}>🪙</Text>
              <Text style={styles.walletBalanceText}>{user?.walletBalance ?? 0}</Text>
            </View>
          </View>

          {/* Segment Tabs */}
          <View style={styles.giftTabTrack}>
            <TouchableOpacity
              style={[styles.giftTabBtn, giftTab === "store" && styles.giftTabBtnActive]}
              onPress={() => setGiftTab("store")}
            >
              <Text style={[styles.giftTabText, giftTab === "store" && styles.giftTabTextActive]}>
                Gift Store
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.giftTabBtn, giftTab === "inventory" && styles.giftTabBtnActive]}
              onPress={() => setGiftTab("inventory")}
            >
              <Text style={[styles.giftTabText, giftTab === "inventory" && styles.giftTabTextActive]}>
                My Bag ({myGifts.length})
              </Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 20 }}
          >
            {giftTab === "store" ? (
              <View style={styles.giftCardGrid}>
                {GIFTS.map((g) => (
                  <TouchableOpacity
                    key={g.id}
                    style={styles.giftCard}
                    onPress={() => sendGift(g)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.giftCardEmoji}>{g.icon}</Text>
                    <Text style={styles.giftCardName}>{g.name}</Text>
                    <View style={styles.giftPriceBadge}>
                      <Text style={styles.giftPriceText}>🪙 {g.cost}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={styles.giftCardGrid}>
                {myGifts.length === 0 ? (
                  <View style={styles.emptyInventoryWrap}>
                    <Text style={styles.emptyInventoryIcon}>🎒</Text>
                    <Text style={styles.emptyInventoryTitle}>No gifts in your bag</Text>
                    <Text style={styles.emptyInventorySub}>Gifts you receive or purchase will appear here.</Text>
                  </View>
                ) : (
                  myGifts.map((gift) => {
                    const iconData = GIFTS.find((g) => g.name === gift.giftName)?.icon || "🎁";
                    return (
                      <TouchableOpacity
                        key={gift._id}
                        style={styles.giftCard}
                        onPress={() => sendGift(gift, gift._id)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.giftCardEmoji}>{iconData}</Text>
                        <Text style={styles.giftCardName}>{gift.giftName}</Text>
                        <View style={[styles.giftPriceBadge, { backgroundColor: "rgba(16, 185, 129, 0.15)", borderColor: "rgba(16, 185, 129, 0.3)" }]}>
                          <Text style={[styles.giftPriceText, { color: "#10B981" }]}>Send Free</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })
                )}
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* ══════════════════════════════════════════════════════════
           ICEBREAKER CONVERSATION STARTERS MODAL
         ══════════════════════════════════════════════════════════ */}
      <Modal
        visible={showIcebreakers}
        transparent
        animationType="slide"
        onRequestClose={() => setShowIcebreakers(false)}
      >
        <TouchableOpacity
          style={modalStyles.backdrop}
          activeOpacity={1}
          onPress={() => setShowIcebreakers(false)}
        />
        <View style={[modalStyles.sheet, { maxHeight: "70%", paddingBottom: Math.max(insets.bottom, 20) }]}>
          <View style={modalStyles.handle} />
          <View style={modalStyles.header}>
            <Text style={modalStyles.title}>Conversation Starters</Text>
            <Text style={modalStyles.subtitle}>Pick a fun question to spark the conversation</Text>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20, gap: 10 }}
          >
            {ICEBREAKERS.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.icebreakerCard}
                onPress={() => sendIcebreaker(item.text)}
                activeOpacity={0.75}
              >
                <View style={styles.icebreakerCategoryBadge}>
                  <Text style={styles.icebreakerCategoryText}>{item.category}</Text>
                </View>
                <Text style={styles.icebreakerCardText}>{item.text}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>

      {/* ══════════════════════════════════════════════════════════
           REPORT MODAL
         ══════════════════════════════════════════════════════════ */}
      <ReportModal
        visible={reportVisible}
        onClose={() => setReportVisible(false)}
        onSubmit={handleReportSubmit}
      />
    </View>
  );
};

// ─── Modal Report Component ───────────────────────────────────────────────────

interface ReportModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (selected: string[], note: string) => void;
}

const ReportModal: React.FC<ReportModalProps> = ({ visible, onClose, onSubmit }) => {
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<string[]>([]);
  const [note, setNote] = useState("");

  const toggleReason = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
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

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <TouchableOpacity style={modalStyles.backdrop} activeOpacity={1} onPress={handleClose} />
      <View style={[modalStyles.sheet, { paddingBottom: Math.max(insets.bottom, 24) }]}>
        <View style={modalStyles.handle} />

        <View style={modalStyles.header}>
          <Text style={modalStyles.title}>Report Participant</Text>
          <Text style={modalStyles.subtitle}>Help keep our community safe and respectful.</Text>
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
                      <Check size={12} color="#FFF" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={modalStyles.divider}>
            <View style={modalStyles.dividerLine} />
            <Text style={modalStyles.dividerText}>Additional Details</Text>
            <View style={modalStyles.dividerLine} />
          </View>

          <TextInput
            style={modalStyles.input}
            placeholder="Describe what happened in detail..."
            placeholderTextColor="#64748B"
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
              Submit & Leave
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// ─── Stylesheet ───────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#020617",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#020617",
  },
  loadingPulseWrap: {
    width: 100,
    height: 100,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  loadingPulseOuter: {
    position: "absolute",
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "rgba(99, 102, 241, 0.2)",
  },
  loadingPulseInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(99, 102, 241, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6,
  },
  loadingSubtitle: {
    color: "#94A3B8",
    fontSize: 13,
  },

  // ── Error State ──
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    backgroundColor: "#020617",
  },
  errorCard: {
    width: "100%",
    backgroundColor: "rgba(15, 23, 42, 0.9)",
    borderRadius: 24,
    padding: 28,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.3)",
  },
  errorTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 16,
    marginBottom: 8,
  },
  errorSubtitle: {
    color: "#94A3B8",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  errorBtn: {
    backgroundColor: "#6366F1",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 14,
  },
  errorBtnText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 15,
  },

  // ── Top Header Bar ──
  topHeader: {
    position: "absolute",
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 100,
  },
  partnerInfoPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(15, 23, 42, 0.8)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
    gap: 8,
    maxWidth: "58%",
  },
  partnerAvatarWrap: {
    position: "relative",
  },
  partnerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#1E293B",
  },
  partnerAvatarFallback: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#6366F1",
    justifyContent: "center",
    alignItems: "center",
  },
  partnerAvatarText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 15,
  },
  onlineStatusDot: {
    position: "absolute",
    bottom: -1,
    right: -1,
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: "#22C55E",
    borderWidth: 1.5,
    borderColor: "#0F172A",
  },
  partnerTextGroup: {
    flex: 1,
  },
  partnerNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  partnerNameText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  vipBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 6,
    gap: 2,
  },
  vipBadgeText: {
    color: "#FFFFFF",
    fontSize: 8,
    fontWeight: "800",
  },
  liveCallStatus: {
    color: "#22C55E",
    fontSize: 10,
    fontWeight: "600",
  },

  // ── Timer Pill ──
  timerPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(15, 23, 42, 0.75)",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    gap: 6,
  },
  timerPillUrgent: {
    backgroundColor: "rgba(239, 68, 68, 0.9)",
    borderColor: "#EF4444",
  },
  timerPillText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  timerPillTextUrgent: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },

  // ── Top Action Group ──
  topActionGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  topIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(15, 23, 42, 0.75)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
  },

  // ── Floating Reactions ──
  reactionsContainer: {
    position: "absolute",
    right: 24,
    bottom: 140,
    width: 100,
    height: 350,
    justifyContent: "flex-end",
    alignItems: "center",
    zIndex: 90,
  },
  reactionBubble: {
    position: "absolute",
    backgroundColor: "rgba(15, 23, 42, 0.75)",
    borderRadius: 25,
    padding: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
  },
  reactionEmojiText: {
    fontSize: 32,
  },

  // ── Floating Icebreaker Toast ──
  icebreakerToast: {
    position: "absolute",
    left: 20,
    right: 20,
    zIndex: 110,
  },
  icebreakerToastInner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    gap: 12,
  },
  icebreakerToastIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  icebreakerToastHeader: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  icebreakerToastBody: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 19,
    marginTop: 2,
  },

  // ── Gift Animation Overlays ──
  giftAnimationContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 120,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  giftUnopenedBox: {
    width: "80%",
    borderRadius: 24,
    overflow: "hidden",
    elevation: 20,
  },
  giftUnopenedGradient: {
    padding: 24,
    alignItems: "center",
  },
  giftIconLarge: {
    fontSize: 72,
    marginBottom: 8,
  },
  giftUnopenedTitle: {
    color: "#FFF",
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 4,
  },
  giftUnopenedSub: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 13,
    textAlign: "center",
  },
  giftOpenedBox: {
    width: "80%",
    borderRadius: 24,
    overflow: "hidden",
    elevation: 20,
  },
  giftOpenedGradient: {
    padding: 28,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "rgba(245, 158, 11, 0.5)",
  },
  giftOpenedIcon: {
    fontSize: 80,
    marginBottom: 10,
  },
  giftOpenedTitle: {
    color: "#F59E0B",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
  },
  giftOpenedSender: {
    color: "#E2E8F0",
    fontSize: 14,
  },

  // ── Safety Blur Overlay ──
  safetyBlurOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 95,
    paddingHorizontal: 32,
  },
  safetyShieldWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(99, 102, 241, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(99, 102, 241, 0.3)",
  },
  safetyBlurTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  safetyBlurSubtitle: {
    color: "#94A3B8",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  safetyCountdownPill: {
    backgroundColor: "rgba(99, 102, 241, 0.2)",
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(99, 102, 241, 0.4)",
  },
  safetyCountdownText: {
    color: "#818CF8",
    fontSize: 14,
    fontWeight: "bold",
  },

  // ── Bottom Dock Controls ──
  bottomDockWrapper: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 0,
    zIndex: 100,
  },
  utilityRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginBottom: 12,
  },
  utilityPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(15, 23, 42, 0.8)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    gap: 6,
  },
  utilityPillActive: {
    backgroundColor: "rgba(30, 41, 59, 0.95)",
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  utilityPillText: {
    color: "#E2E8F0",
    fontSize: 12,
    fontWeight: "600",
  },
  mainControlDock: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-evenly",
    backgroundColor: "rgba(15, 23, 42, 0.85)",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
  },
  streamBtnContainer: {
    width: 48,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  endCallBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    overflow: "hidden",
  },
  endCallBtnGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  // ── Floating Picker Sheets ──
  floatingPickerSheet: {
    position: "absolute",
    alignSelf: "center",
    width: SCREEN_WIDTH * 0.88,
    backgroundColor: "#0F172A",
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
    elevation: 25,
  },
  pickerSheetTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 16,
  },
  emojiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 10,
  },
  emojiGridBtn: {
    width: (SCREEN_WIDTH * 0.88 - 40 - 40) / 5,
    height: (SCREEN_WIDTH * 0.88 - 40 - 40) / 5,
    backgroundColor: "#1E293B",
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  emojiGridText: {
    fontSize: 26,
  },

  // ── Gift Shop Sheet ──
  giftSheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  walletBalanceBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.3)",
    gap: 6,
  },
  walletCoinIcon: {
    fontSize: 14,
  },
  walletBalanceText: {
    color: "#F59E0B",
    fontSize: 14,
    fontWeight: "bold",
  },
  giftTabTrack: {
    flexDirection: "row",
    marginHorizontal: 20,
    backgroundColor: "#1E293B",
    borderRadius: 12,
    padding: 3,
    marginBottom: 8,
  },
  giftTabBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: "center",
  },
  giftTabBtnActive: {
    backgroundColor: "#6366F1",
  },
  giftTabText: {
    color: "#94A3B8",
    fontSize: 13,
    fontWeight: "600",
  },
  giftTabTextActive: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  giftCardGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
  giftCard: {
    width: "47%",
    backgroundColor: "#1E293B",
    borderRadius: 18,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  giftCardEmoji: {
    fontSize: 38,
    marginBottom: 8,
  },
  giftCardName: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 6,
  },
  giftPriceBadge: {
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.3)",
  },
  giftPriceText: {
    color: "#F59E0B",
    fontSize: 12,
    fontWeight: "bold",
  },
  emptyInventoryWrap: {
    width: "100%",
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyInventoryIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyInventoryTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  emptyInventorySub: {
    color: "#64748B",
    fontSize: 13,
    textAlign: "center",
  },

  // ── Icebreaker Cards ──
  icebreakerCard: {
    backgroundColor: "#1E293B",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  icebreakerCategoryBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(99, 102, 241, 0.2)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 8,
  },
  icebreakerCategoryText: {
    color: "#818CF8",
    fontSize: 11,
    fontWeight: "700",
  },
  icebreakerCardText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 20,
  },

  // ── More Actions Sheet ──
  actionSheetItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1E293B",
    padding: 16,
    borderRadius: 16,
    gap: 14,
  },
  actionSheetIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  actionSheetItemTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 2,
  },
  actionSheetItemSub: {
    color: "#94A3B8",
    fontSize: 12,
  },
  actionSheetCancelBtn: {
    backgroundColor: "#0F172A",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  actionSheetCancelText: {
    color: "#94A3B8",
    fontSize: 14,
    fontWeight: "700",
  },
});

// ─── Modal Sheet Common Styles ────────────────────────────────────────────────

const modalStyles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#0F172A",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    elevation: 30,
  },
  handle: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#334155",
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 4,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 10,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  subtitle: {
    color: "#94A3B8",
    fontSize: 13,
    marginTop: 3,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  reasonsGrid: {
    gap: 8,
  },
  reasonChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1E293B",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#334155",
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  reasonChipActive: {
    backgroundColor: "rgba(99, 102, 241, 0.15)",
    borderColor: "#6366F1",
  },
  reasonIcon: {
    fontSize: 18,
  },
  reasonLabel: {
    flex: 1,
    color: "#94A3B8",
    fontSize: 14,
    fontWeight: "500",
  },
  reasonLabelActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  checkBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#6366F1",
    justifyContent: "center",
    alignItems: "center",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 16,
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#334155",
  },
  dividerText: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: "#1E293B",
    borderWidth: 1.5,
    borderColor: "#334155",
    borderRadius: 14,
    color: "#FFFFFF",
    fontSize: 14,
    lineHeight: 20,
    padding: 14,
    minHeight: 90,
  },
  charCount: {
    color: "#64748B",
    fontSize: 11,
    textAlign: "right",
    marginTop: 4,
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#1E293B",
    borderWidth: 1,
    borderColor: "#334155",
    justifyContent: "center",
    alignItems: "center",
  },
  cancelText: {
    color: "#94A3B8",
    fontSize: 14,
    fontWeight: "600",
  },
  submitBtn: {
    flex: 2,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#EF4444",
    justifyContent: "center",
    alignItems: "center",
  },
  submitBtnDisabled: {
    backgroundColor: "#334155",
  },
  submitText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  submitTextDisabled: {
    color: "#64748B",
  },
});
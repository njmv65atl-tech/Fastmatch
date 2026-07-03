import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  BackHandler,
  Platform,
} from 'react-native';
import { EditProfileScreen } from '../../screens/EditProfileScreen/editProfileScreen';
import { scale } from '../../helpers/metrics';
import { IMAGE_URL } from '../../config/env';
// import removed
import { ShowAlertMessage, popTypes } from '../../helpers/commonFunctions';

const BASE_URL = IMAGE_URL;

const ProfileScreen = ({ user, setCancel, setView }: { user: any, setCancel: any, setView: any }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [currentUser, setCurrentUser] = useState(user);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Android back button handling
  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const onBackPress = () => {
      setCancel(false);
      return true; // prevent default app exit
    };

    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      onBackPress
    );

    return () => {
      subscription.remove();
    };
  }, [setCancel]);

  const handleVerify = async () => {
    // Mocked verification request for now
    setCurrentUser({ ...currentUser, isVerified: true });
    ShowAlertMessage('Verification request approved!', popTypes.success);
  };

  const avatarUrl = currentUser?.profilePicture
    ? `${BASE_URL}${currentUser.profilePicture}`
    : null;

  const initials = currentUser?.displayName
    ?.split(' ')
    .map((n: any) => n[0])
    .join('')
    .toUpperCase();

  // ✅ NO early return; just render conditionally
  if (isEditing) {
    return (
      <EditProfileScreen
        user={currentUser}
        onCancel={() => setIsEditing(false)}
        onSave={(updatedUser) => {
          setCurrentUser(updatedUser);
          setIsEditing(false);
          setShowSuccessModal(true);
        }}
      />
    );
  }

  // Success popup
  const renderSuccessModal = () => (
    <Modal
      transparent
      visible={showSuccessModal}
      animationType="fade"
      onRequestClose={() => setShowSuccessModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.successModal}>
          <View style={styles.successIcon}>
            <Text style={styles.successCheckmark}>✓</Text>
          </View>
          <Text style={styles.successTitle}>Profile Updated!</Text>
          <Text style={styles.successMessage}>
            Your profile has been successfully updated.
          </Text>
          <TouchableOpacity
            style={styles.successButton}
            onPress={() => setShowSuccessModal(false)}
            activeOpacity={0.8}
          >
            <Text style={styles.successButtonText}>Got it!</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: scale(100) }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setCancel(false)}
          >
            <Text style={styles.closeIcon}>✕</Text>
          </TouchableOpacity>

          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarInitials}>{initials}</Text>
            </View>
          )}

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Text style={styles.displayName}>{currentUser?.displayName}</Text>
            {currentUser?.isVerified && (
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedIcon}>✓</Text>
              </View>
            )}
          </View>
          <Text style={styles.username}>@{currentUser?.fullName}</Text>

          {currentUser?.isOnline && (
            <View style={styles.onlineBadge}>
              <View style={styles.onlineDot} />
              <Text style={styles.onlineText}>Online</Text>
            </View>
          )}

          {!currentUser?.isVerified && (
            <TouchableOpacity style={styles.verifyBtn} onPress={handleVerify}>
              <Text style={styles.verifyText}>Get Verified (Blue Check)</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── Contact Info ── */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Contact</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoKey}>Email</Text>
            <Text style={styles.infoValue}>{currentUser?.email ?? '—'}</Text>
          </View>
        </View>


        {/* ── Gender Info ── */}
        <View style={styles.card}>
          <View style={styles.infoRow}>
            <Text style={styles.infoKey}>GENDER</Text>
            <Text style={styles.infoValue}>
              {currentUser?.gender
                ? currentUser.gender.charAt(0).toUpperCase() + currentUser.gender.slice(1)
                : '—'}
            </Text>
          </View>
        </View>

        {/* ── Age Info ── */}
        <View style={styles.card}>
          {/* <Text style={styles.cardLabel}>Age</Text> */}
          <View style={styles.infoRow}>
            <Text style={styles.infoKey}>AGE</Text>
            <Text style={styles.infoValue}>{currentUser?.age ?? '—'}</Text>
          </View>
        </View>


        {/* ── Location Info ── */}
        <View style={styles.card}>
          {/* <Text style={styles.cardLabel}>Location</Text> */}
          <View style={styles.infoRow}>
            <Text style={styles.infoKey}>LOCATION</Text>
            <Text style={styles.infoValue}>{currentUser?.location ?? '—'}</Text>
          </View>
        </View>

        {/* ── Language Info ── */}
        <View style={styles.card}>
          {/* <Text style={styles.cardLabel}>Language</Text> */}
          <View style={styles.infoRow}>
            <Text style={styles.infoKey}>LANGUAGE</Text>
            <Text style={styles.infoValue}>{currentUser?.language ?? '—'}</Text>
          </View>
        </View>


        {/* ── Interests ── */}
        { currentUser?.interests?.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Interests</Text>
            <View style={styles.interestsRow}>
              {currentUser.interests.map((item: any, index: any) => (
                <TouchableOpacity
                  key={index}
                  style={styles.interestBadge}
                  activeOpacity={0.8}
                  >

                  <Text style={styles.interestText}>{typeof item === 'string' ? item.trim() : item}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
        
        {/* ── Stats ── */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {currentUser?.isVerified ? 'Verified' : 'Unverified'}
            </Text>
            <Text style={styles.statLabel}>Account</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {currentUser?.createdAt
                ? new Date(currentUser.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })
                : '—'}
            </Text>
            <Text style={styles.statLabel}>Joined</Text>
          </View>
        </View>



        {/* ── Edit Button ── */}
        <TouchableOpacity
          style={styles.editButton}
          activeOpacity={0.85}
          onPress={() => setIsEditing(true)}
        >
          <Text style={styles.editButtonIcon}>✎</Text>
          <Text style={styles.editButtonText}>Edit Profile</Text>
        </TouchableOpacity>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Success Modal */}
      {renderSuccessModal()}
    </>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  verifyBtn: {
    marginTop: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.4)',
  },
  verifyText: {
    color: '#3B82F6',
    fontWeight: '700',
    fontSize: 13,
  },
  verifiedBadge: {
    backgroundColor: '#3B82F6',
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifiedIcon: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  closeIcon: {
    fontSize: 14,
    color: '#a0a0c0',
    fontWeight: '600',
  },
  container: { flex: 1, backgroundColor: '#13131f'},
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 28,
    backgroundColor: '#16213e',
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    marginBottom: 14,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  avatarFallback: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#7c4dff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  avatarInitials: { fontSize: 32, fontWeight: '700', color: '#fff' },
  displayName: {
    fontSize: 22,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  username: {
    fontSize: 13,
    color: '#a0a0c0',
    marginBottom: 10,
  },
  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(124,77,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(124,77,255,0.4)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4caf50',
  },
  onlineText: { fontSize: 11, color: '#b39ddb' },
  card: {
    backgroundColor: '#1a1a2e',
    borderRadius: 14,
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
  },
  cardLabel: {
    fontSize: 11,
    color: '#6060a0',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
    fontWeight: '500',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    
    // borderBottomColor: '#2a2a40',
  },
  infoKey: { fontSize: 13, color: '#6060a0' },
  infoValue: {
    fontSize: 13,
    color: '#d0d0f0',
    maxWidth: '65%',
    textAlign: 'right',
  },
  interestsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  interestBadge: {
    backgroundColor: 'rgba(124,77,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(124,77,255,0.3)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 7,
  },
  interestText: {
    color: '#b39ddb',
    fontSize: 13,
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginHorizontal: 16,
    marginTop: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7c4dff',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    color: '#6060a0',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 20,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#7c4dff',
  },
  editButtonIcon: {
    fontSize: 16,
    color: '#fff',
  },
  editButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
    letterSpacing: 0.3,
  },
  bottomSpacer: { height: 36 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  successModal: {
    backgroundColor: '#1a1a2e',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    maxWidth: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  successIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#4caf50',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  successCheckmark: {
    fontSize: 32,
    color: 'white',
    fontWeight: 'bold',
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 16,
    color: '#d0d0f0',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  successButton: {
    backgroundColor: '#7c4dff',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    minWidth: 120,
  },
  successButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export { ProfileScreen };
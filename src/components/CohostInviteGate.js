import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppState, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AuthContext } from '../auth/AuthProvider';
import { navigationRef } from '../navigation/navigationRef';
import { getPendingCohostInviteApi, respondCohostApi } from './Api/liveApi';
import { getAgoraUid } from '../utils/getAgoraUid';
import ChatAvatar from './ChatAvatar';
import NotificationService, { addTokenToBuyer, removeTokenFromBuyer } from '../services/notifications';
import { emit, on } from '../services/notifications/notificationEvents';

const POLL_MS = 5000;

// The latest pending invite, shared with CohostInviteBell (admin home header) through the
// notification event bus: 'cohost_pending' carries it, 'cohost_open' asks the card to show.
let lastPending = null;
export const getPendingCohostInvite = () => lastPending;
const inviteKey = (inv) => (inv ? `${inv.sessionId}|${inv.invitedAt}` : '');

/**
 * Admin app only (mounted by AdminTabNavigator). Shows a co-host invite from a seller who is
 * live: polled every 5 s while the app is open, checked on foreground, and triggered at once by
 * a `cohost_invite` push. Accepting opens the seller's live in co-host mode. "Later" hides the
 * card but keeps the invite under the header bell until it is answered or expires. Also registers
 * the admin's device for push (the server stores admin tokens since migration 041).
 */
const CohostInviteGate = () => {
  const { userInfo } = useContext(AuthContext);
  const uid = userInfo?.uid || userInfo?.id || userInfo?.user?.uid || userInfo?.user?.id || null;
  const [invite, setInvite] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  // Answered invites never come back; "Later" ones stay off screen until the bell is tapped.
  const handledRef = useRef(new Set());
  const laterRef = useRef(new Set());

  const publish = (next) => {
    lastPending = next;
    emit('cohost_pending', next);
  };

  const check = useCallback(async () => {
    const res = await getPendingCohostInviteApi();
    if (!res.success) return;
    const next = res.invite && !handledRef.current.has(inviteKey(res.invite)) ? res.invite : null;
    publish(next);
    setInvite(next && !laterRef.current.has(inviteKey(next)) ? next : null);
  }, []);

  useEffect(() => {
    if (!uid) return undefined;
    NotificationService.requestPermissionAndRegister(uid, {
      writeToken: addTokenToBuyer,
      removeToken: removeTokenFromBuyer,
    }).catch(() => {});

    check();
    let timer = setInterval(check, POLL_MS);
    const appSub = AppState.addEventListener('change', (state) => {
      clearInterval(timer);
      if (state === 'active') {
        check();
        timer = setInterval(check, POLL_MS);
      }
    });
    const offPush = on('cohost_invite', () => check());
    // The header bell: bring a "Later" invite back on screen.
    const offOpen = on('cohost_open', () => {
      if (!lastPending) return;
      laterRef.current.delete(inviteKey(lastPending));
      setInvite(lastPending);
    });
    return () => {
      clearInterval(timer);
      appSub.remove();
      offPush();
      offOpen();
    };
  }, [uid, check]);

  const answer = async (accept) => {
    if (!invite) return;
    const key = `${invite.sessionId}|${invite.invitedAt}`;
    setBusy(true);
    setError(null);
    const res = await respondCohostApi(invite.sessionId, accept, getAgoraUid(uid));
    setBusy(false);
    handledRef.current.add(key);
    publish(null);
    if (!res.success) {
      setError(res.status === 410 ? 'This invite has expired.' : res.error || 'Please try again.');
      return;
    }
    const { sessionId, sellerUid } = invite;
    setInvite(null);
    if (accept && navigationRef.isReady()) {
      navigationRef.navigate('LiveBroadcastScreen', { sessionId, cohost: { sellerUid } });
    }
  };

  const dismissError = () => {
    setError(null);
    setInvite(null);
  };

  const later = () => {
    laterRef.current.add(inviteKey(invite));
    setInvite(null);
  };

  return (
    <Modal transparent animationType="fade" visible={!!invite} onRequestClose={later}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {invite ? (
            <>
              <ChatAvatar uri={invite.sellerPhoto} name={invite.sellerName} style={styles.avatar} />
              <Text style={styles.title}>{invite.sellerName} invited you to co-host</Text>
              {invite.title ? <Text style={styles.live} numberOfLines={2}>{invite.title}</Text> : null}
              {error ? (
                <>
                  <Text style={styles.error}>{error}</Text>
                  <TouchableOpacity style={[styles.btn, styles.decline]} onPress={dismissError}>
                    <Text style={styles.declineText}>Close</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <View style={styles.row}>
                  <TouchableOpacity
                    style={[styles.btn, styles.decline]}
                    disabled={busy}
                    onPress={() => answer(false)}
                    accessibilityRole="button">
                    <Text style={styles.declineText}>Decline</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.btn, styles.accept]}
                    disabled={busy}
                    onPress={() => answer(true)}
                    accessibilityRole="button">
                    <Text style={styles.acceptText}>{busy ? 'Joining…' : 'Accept'}</Text>
                  </TouchableOpacity>
                </View>
              )}
              {!error ? (
                <TouchableOpacity onPress={later} disabled={busy} style={styles.laterBtn} accessibilityRole="button">
                  <Text style={styles.laterText}>Later</Text>
                </TouchableOpacity>
              ) : null}
            </>
          ) : null}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  avatar: { width: 64, height: 64, borderRadius: 32, marginBottom: 12 },
  title: { fontFamily: 'Inter', fontSize: 18, fontWeight: '700', color: '#1A1A1A', textAlign: 'center' },
  live: { fontFamily: 'Inter', fontSize: 14, color: '#6B6B6B', textAlign: 'center', marginTop: 6 },
  error: { fontFamily: 'Inter', fontSize: 14, color: '#C23B1E', textAlign: 'center', marginTop: 16, marginBottom: 12 },
  row: { flexDirection: 'row', gap: 12, marginTop: 20, alignSelf: 'stretch' },
  btn: { flex: 1, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  decline: { borderWidth: 1, borderColor: '#D0D0D0', alignSelf: 'stretch' },
  accept: { backgroundColor: '#2E6B3E' },
  declineText: { fontFamily: 'Inter', fontWeight: '600', color: '#1A1A1A' },
  laterBtn: { marginTop: 14, paddingVertical: 6, paddingHorizontal: 16 },
  laterText: { fontFamily: 'Inter', fontSize: 14, color: '#6B6B6B' },
  acceptText: { fontFamily: 'Inter', fontWeight: '700', color: '#FFFFFF' },
});

export default CohostInviteGate;

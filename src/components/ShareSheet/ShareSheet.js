import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import ActionSheet from '../ActionSheet/ActionSheet';
import {getChatsApi} from '../Api/chatApi';
import {searchUsersApi} from '../Api/searchUsersApi';
import {
  appUserToContact,
  buildRecommendedContacts,
  getOtherParticipant,
  groupChatToContact,
} from '../../utils/shareSheetContacts';
import CopyIcon from '../../assets/icons/greylight/copy-regular.svg';
import ShareIcon from '../../assets/icons/accent/share-regular.svg';
import SearchIcon from '../../assets/iconchat/search.svg';
import CloseIcon from '../../assets/iconchat/close.svg';

/** Default avatar — same asset the messaging modal falls back to. */
const DefaultAvatar = require('../../assets/images/AvatarBig.png');

const RECOMMENDED_LIMIT = 12;
const SEARCH_LIMIT = 20;
const SEARCH_MIN_CHARS = 2;
const SEARCH_DEBOUNCE_MS = 400;
/** How many extra results the strip's "›" pulls in per tap. */
const RECOMMENDED_PAGE_SIZE = 6;

const displayName = (contact) => contact?.name || 'User';

const Avatar = ({uri, size, style}) => (
  <Image
    source={uri ? {uri} : DefaultAvatar}
    defaultSource={DefaultAvatar}
    style={[
      styles.avatar,
      {width: size, height: size, borderRadius: size / 2},
      style,
    ]}
  />
);

/** A url we can actually load — mirrors MessagesScreen's isValidAvatar. */
const isUsableAvatarUrl = (url) =>
  typeof url === 'string' && url.trim().startsWith('http');

/**
 * Two joint avatars for a group, matching the chat list's treatment
 * (MessagesScreen.GroupAvatar): the container is one avatar-sized square and
 * two half-size circles sit bottom-left and top-right, overlapping diagonally
 * with a white ring so they read as a pair.
 *
 * A group has no avatar of its own, so an empty slot falls back to the default.
 */
const GroupAvatar = ({sources, size}) => {
  const urls = (sources || []).filter(isUsableAvatarUrl).slice(0, 2);
  const inner = size / 1.3;
  const slots = [
    {key: 'a', style: {left: 0, bottom: 0, zIndex: 1}},
    {key: 'b', style: {right: 0, top: 0, zIndex: 2}},
  ];

  return (
    <View style={[styles.groupAvatarContainer, {width: size, height: size}]}>
      {slots.map((slot, index) => (
        <Image
          key={slot.key}
          source={urls[index] ? {uri: urls[index]} : DefaultAvatar}
          defaultSource={DefaultAvatar}
          resizeMode="cover"
          style={[
            styles.groupAvatarHalf,
            slot.style,
            {width: inner, height: inner, borderRadius: inner / 2},
          ]}
        />
      ))}
    </View>
  );
};

/** Group renders the joint pair; a person renders a single circle. */
const ContactAvatar = ({contact, size}) =>
  contact?.isGroup ? (
    <GroupAvatar sources={contact.groupAvatars} size={size} />
  ) : (
    <Avatar uri={contact.avatarUrl} size={size} />
  );

/**
 * Plant-detail share sheet.
 *
 * Structure follows the Messenger reference: a Recommended people strip with a
 * search box above it, and a bottom "Share to" row holding the link actions.
 * Styling stays in ileafU's existing light sheet language.
 *
 * Data:
 *   - Recommended = private-chat contacts first, then app users
 *     (`buildRecommendedContacts`), 12 at a time, extendable via the "›" chip.
 *   - Search = `search-user` list/search mode, debounced; role filtering is
 *     enforced server-side.
 *
 * Props:
 *   visible          boolean
 *   onClose          () => void
 *   currentUserInfo  the app's userInfo blob (for the current uid + name/avatar)
 *   onSelectUser     (contact) => Promise<void> | void — send + navigate
 *   onCopyLink       () => Promise<void> | void
 *   onNativeShare    () => void
 */
const ShareSheet = ({
  visible,
  onClose,
  currentUserInfo,
  onSelectUser,
  onCopyLink,
  onNativeShare,
}) => {
  const [contacts, setContacts] = useState([]);
  const [recommendedLimit, setRecommendedLimit] = useState(RECOMMENDED_LIMIT);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  // One busy flag for the whole sheet: two concurrent taps would both see "no
  // private chat yet" and create two chats for the same pair.
  const [busy, setBusy] = useState(false);

  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const currentUid = useMemo(() => {
    const raw =
      currentUserInfo?.data?.uid ||
      currentUserInfo?.user?.uid ||
      currentUserInfo?.uid ||
      '';
    return String(raw || '').trim();
  }, [currentUserInfo]);

  /**
   * The cohort this screen is running as. The server applies the same rule
   * (buyer -> buyers + admins, supplier -> suppliers + admins), and the
   * explicit hint matters because an account can hold both a buyer and a
   * supplier row: without it the server resolves supplier-first and a buyer is
   * served sellers.
   *
   * Mirrors NewMessageModal's precedence — explicit userType first, then the
   * admin role, then supplier-only fields, else buyer.
   */
  const cohortRole = useMemo(() => {
    const explicit = String(
      currentUserInfo?.user?.userType ||
        currentUserInfo?.data?.userType ||
        currentUserInfo?.userType ||
        '',
    ).toLowerCase();
    if (explicit === 'admin' || explicit === 'sub_admin') {
      return 'admin';
    }
    if (explicit === 'buyer' || explicit === 'supplier') {
      return explicit;
    }
    const role = String(
      currentUserInfo?.user?.role ||
        currentUserInfo?.data?.role ||
        currentUserInfo?.role ||
        '',
    ).toLowerCase();
    if (role === 'admin' || role === 'sub_admin') {
      return 'admin';
    }
    // Seller-only marker. Deliberately just the garden/company name: buyers
    // also carry `currency`/`currencySymbol` on their profile, so those are NOT
    // seller indicators and must not be used here.
    const hasSellerFields = Boolean(
      currentUserInfo?.user?.gardenOrCompanyName ||
        currentUserInfo?.data?.gardenOrCompanyName ||
        currentUserInfo?.gardenOrCompanyName,
    );
    return hasSellerFields ? 'supplier' : 'buyer';
  }, [currentUserInfo]);

  /**
   * Load both contact sources in parallel. Each is optional: a failure in one
   * degrades the strip rather than emptying it.
   */
  const loadContacts = useCallback(async () => {
    if (!currentUid) {
      setContacts([]);
      return;
    }
    setLoading(true);
    try {
      const [chatsRes, usersRes] = await Promise.allSettled([
        getChatsApi(),
        searchUsersApi({
          query: '',
          limit: RECOMMENDED_LIMIT * 2,
          offset: 0,
          role: cohortRole,
        }),
      ]);

      if (!mountedRef.current) {
        return;
      }

      if (chatsRes.status === 'rejected') {
        console.log('ShareSheet chats failed:', chatsRes.reason?.message || chatsRes.reason);
      }
      if (usersRes.status === 'rejected') {
        console.log('ShareSheet people failed:', usersRes.reason?.message || usersRes.reason);
      }

      const memberChats =
        chatsRes.status === 'fulfilled' && chatsRes.value?.success
          ? chatsRes.value.memberChats || []
          : [];
      const recentUsers =
        usersRes.status === 'fulfilled' && usersRes.value?.success
          ? usersRes.value?.data?.users || []
          : [];

      // A buyer chats with sellers and vice versa, so chat contacts cannot be
      // trusted to be in the caller's cohort. Ask the server which of them are,
      // using the same rule that governs search — one source of truth, no
      // duplicated role logic on the client.
      //
      // Only *people* are checked: a group has no cohort of its own (it is one
      // I am already a member of), so it is always a valid target.
      const chatUids = [
        ...new Set(
          memberChats
            .map((chat) => getOtherParticipant(chat, currentUid)?.uid)
            .filter((uid) => uid && uid !== currentUid),
        ),
      ];
      let allowedChatUids = null;
      if (chatUids.length > 0) {
        try {
          // The cohort hint MUST be sent here too. Without it the server falls
          // back to role precedence (admin > supplier > buyer), so an account
          // holding both a buyer and a supplier row resolves to "supplier" and
          // this call returns suppliers while the Recommended call above
          // returns buyers — the two are merged into one strip, which is exactly
          // how sellers ended up shown in a buyer's recommended list.
          const allowedRes = await searchUsersApi({
            uids: chatUids,
            limit: 200,
            role: cohortRole,
          });
          if (allowedRes?.success) {
            allowedChatUids = new Set(
              (allowedRes.data?.users || []).map((user) => String(user.uid || user.id)),
            );
          }
        } catch (error) {
          // On failure, drop chat contacts rather than risk showing a
          // cross-cohort person; app users (already cohort-filtered) remain.
          console.log('ShareSheet cohort check failed:', error?.message || error);
          allowedChatUids = new Set();
        }
      }
      if (!mountedRef.current) {
        return;
      }

      const cohortChats =
        allowedChatUids === null
          ? memberChats
          : memberChats.filter((chat) => {
              if (groupChatToContact(chat)) {
                return true;
              }
              const uid = getOtherParticipant(chat, currentUid)?.uid;
              return uid && allowedChatUids.has(String(uid));
            });

      setContacts(
        buildRecommendedContacts({
          memberChats: cohortChats,
          recentUsers,
          currentUid,
          limit: RECOMMENDED_LIMIT,
        }),
      );
    } catch (error) {
      console.log('ShareSheet loadContacts error:', error?.message || error);
      if (mountedRef.current) {
        setContacts([]);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [currentUid, cohortRole]);

  // Reset and (re)load each time the sheet opens.
  useEffect(() => {
    if (!visible) {
      return;
    }
    setQuery('');
    setSearchResults([]);
    setSearching(false);
    setRecommendedLimit(RECOMMENDED_LIMIT);
    setBusy(false);
    loadContacts();
  }, [visible, loadContacts]);

  // Debounced server-side search once the query is long enough.
  useEffect(() => {
    if (!visible) {
      return undefined;
    }
    const trimmed = query.trim();
    if (trimmed.length < SEARCH_MIN_CHARS) {
      setSearchResults([]);
      setSearching(false);
      return undefined;
    }

    let cancelled = false;
    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const res = await searchUsersApi({
          query: trimmed,
          limit: SEARCH_LIMIT,
          offset: 0,
          role: cohortRole,
        });
        if (cancelled || !mountedRef.current) {
          return;
        }
        const rows = res?.success ? res?.data?.users || [] : [];
        setSearchResults(
          rows
            .map(appUserToContact)
            .filter((contact) => contact.uid && contact.uid !== currentUid),
        );
      } catch (error) {
        console.log('ShareSheet search error:', error?.message || error);
        if (!cancelled && mountedRef.current) {
          setSearchResults([]);
        }
      } finally {
        if (!cancelled && mountedRef.current) {
          setSearching(false);
        }
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, visible, currentUid, cohortRole]);

  const isSearchMode = query.trim().length >= SEARCH_MIN_CHARS;

  const runExclusive = useCallback(async (task) => {
    if (busy) {
      return;
    }
    setBusy(true);
    try {
      await task();
    } finally {
      if (mountedRef.current) {
        setBusy(false);
      }
    }
  }, [busy]);

  const handleSelect = (contact) => {
    if (!contact?.uid) {
      return;
    }
    runExclusive(() => onSelectUser?.(contact));
  };

  const handleCopy = () => {
    runExclusive(() => onCopyLink?.());
  };

  const handleNativeShare = () => {
    runExclusive(() => onNativeShare?.());
  };

  const row = (contact, isLast) => (
    <TouchableOpacity
      key={contact.uid}
      style={[styles.row, !isLast && styles.rowBorder, busy && styles.rowDisabled]}
      disabled={busy}
      activeOpacity={0.7}
      onPress={() => handleSelect(contact)}>
      <ContactAvatar contact={contact} size={40} />
      <View style={styles.rowInfo}>
        <Text style={styles.rowName} numberOfLines={1}>
          {displayName(contact)}
        </Text>
        {contact.isGroup ? (
          <Text style={styles.rowMeta} numberOfLines={1}>
            Group chat
          </Text>
        ) : (
          !!contact.source && (
            <Text style={styles.rowMeta} numberOfLines={1}>
              {contact.source === 'chat' ? 'From your chats' : 'In the app'}
            </Text>
          )
        )}
      </View>
      {busy && <ActivityIndicator size="small" color="#539461" />}
    </TouchableOpacity>
  );

  return (
    <ActionSheet
      visible={visible}
      onClose={onClose}
      // Measured content stack: grabber 12 + header 44 + search 44 +
      // "Recommended" label 50 + strip 92 + "Share to" label 50 + icon row 72 +
      // bottom padding 16 ≈ 380pt, plus the home-indicator inset. 52% of an
      // 874pt screen ≈ 455pt holds that with room for Android's taller font
      // metrics instead of leaving dead space above the actions. Search mode
      // needs real height for a scrolling result list.
      heightPercent={isSearchMode ? '72%' : '52%'}>
      <View style={styles.container}>
        <View style={styles.grabber} />

        <View style={styles.header}>
          <Text style={styles.headerTitle}>Share</Text>
          <TouchableOpacity
            onPress={onClose}
            hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
            style={styles.closeButton}>
            <CloseIcon width={20} height={20} />
          </TouchableOpacity>
        </View>

        <View style={styles.searchBox}>
          <SearchIcon width={20} height={20} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search people"
            placeholderTextColor="#7F8D91"
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
        </View>

        {isSearchMode ? (
          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled>
            {searching && searchResults.length === 0 ? (
              <ActivityIndicator style={styles.listSpinner} color="#539461" />
            ) : searchResults.length > 0 ? (
              searchResults.map((contact, index) =>
                row(contact, index === searchResults.length - 1),
              )
            ) : (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>
                  No users found for “{query.trim()}”
                </Text>
              </View>
            )}
          </ScrollView>
        ) : (
          <>
            <Text style={styles.sectionLabel}>Recommended</Text>
            {loading && contacts.length === 0 ? (
              <View style={styles.stripPlaceholder}>
                {Array.from({length: 5}).map((_, i) => (
                  <View key={`skeleton-${i}`} style={styles.stripItem}>
                    <View style={styles.skeletonAvatar} />
                    <View style={styles.skeletonName} />
                  </View>
                ))}
              </View>
            ) : contacts.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.strip}
                contentContainerStyle={styles.stripContent}>
                {contacts.slice(0, recommendedLimit).map((contact) => (
                  <TouchableOpacity
                    key={contact.uid}
                    style={[styles.stripItem, busy && styles.rowDisabled]}
                    disabled={busy}
                    activeOpacity={0.7}
                    onPress={() => handleSelect(contact)}>
                    <ContactAvatar contact={contact} size={56} />
                    <Text style={styles.stripName} numberOfLines={2}>
                      {displayName(contact)}
                    </Text>
                  </TouchableOpacity>
                ))}
                {recommendedLimit < contacts.length && (
                  <TouchableOpacity
                    style={styles.stripItem}
                    activeOpacity={0.7}
                    onPress={() =>
                      setRecommendedLimit((prev) => prev + RECOMMENDED_PAGE_SIZE)
                    }>
                    <View style={styles.moreCircle}>
                      <Text style={styles.moreChevron}>›</Text>
                    </View>
                    <Text style={styles.stripName}>More</Text>
                  </TouchableOpacity>
                )}
              </ScrollView>
            ) : (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>No people to show yet</Text>
              </View>
            )}
            {/* Strip mode has a fixed row set, so its height is driven by the
                sheet itself (STRIP_SHEET_HEIGHT) — no flex spacer here. */}
          </>
        )}

        <Text style={styles.sectionLabel}>Share to</Text>
        <View style={styles.shareToRow}>
          <TouchableOpacity
            style={[styles.shareToItem, busy && styles.rowDisabled]}
            disabled={busy}
            activeOpacity={0.7}
            onPress={handleCopy}>
            <View style={styles.shareToCircle}>
              <CopyIcon width={24} height={24} />
            </View>
            <Text style={styles.shareToLabel}>Copy link</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.shareToItem, busy && styles.rowDisabled]}
            disabled={busy}
            activeOpacity={0.7}
            onPress={handleNativeShare}>
            <View style={styles.shareToCircle}>
              <ShareIcon width={24} height={24} />
            </View>
            <Text style={styles.shareToLabel}>Share…</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ActionSheet>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 16,
  },
  flex: {
    flex: 1,
  },
  grabber: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E5E8EA',
    marginTop: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#202325',
  },
  closeButton: {
    padding: 4,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 44,
    marginHorizontal: 20,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CDD3D4',
    backgroundColor: '#fff',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#202325',
    padding: 0,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#556065',
    marginTop: 20,
    marginBottom: 12,
    marginHorizontal: 20,
  },
  strip: {
    // Without an explicit height a horizontal ScrollView flexes to fill the
    // sheet, which pushed "Share to" to the bottom and left a dead gap above it.
    // One 56px avatar + its 2-line name label is all this row ever holds.
    flexGrow: 0,
    height: 92,
  },
  stripContent: {
    paddingHorizontal: 20,
    gap: 16,
  },
  stripItem: {
    width: 64,
    alignItems: 'center',
    gap: 8,
  },
  stripName: {
    fontSize: 12,
    color: '#556065',
    maxWidth: 64,
    textAlign: 'center',
  },
  groupAvatarContainer: {
    position: 'relative',
  },
  groupAvatarHalf: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: '#FFFFFF',
    backgroundColor: '#F3F3F5',
  },
  stripPlaceholder: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 16,
  },
  skeletonAvatar: {
    width: 56,
    height: 56,
    borderRadius: 24,
    backgroundColor: '#E5E8EA',
  },
  skeletonName: {
    width: 48,
    height: 10,
    borderRadius: 4,
    backgroundColor: '#E5E8EA',
  },
  moreCircle: {
    width: 56,
    height: 56,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#CDD3D4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreChevron: {
    fontSize: 20,
    lineHeight: 24,
    color: '#556065',
  },
  avatar: {
    backgroundColor: '#F3F3F5',
    borderWidth: 1,
    borderColor: '#E5E8EA',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 8,
  },
  listSpinner: {
    marginTop: 24,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E8EA',
  },
  rowDisabled: {
    opacity: 0.5,
  },
  rowInfo: {
    flex: 1,
  },
  rowName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#202325',
  },
  rowMeta: {
    fontSize: 12,
    color: '#7F8D91',
    marginTop: 4,
  },
  emptyBox: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#7F8D91',
    textAlign: 'center',
  },
  shareToRow: {
    flexDirection: 'row',
    gap: 24,
    paddingHorizontal: 20,
  },
  shareToItem: {
    width: 64,
    alignItems: 'center',
    gap: 6,
  },
  shareToCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F3F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareToLabel: {
    fontSize: 12,
    color: '#556065',
    textAlign: 'center',
  },
});

export default ShareSheet;

/**
 * Cohort-rule tests for the share sheet's contact sources.
 *
 * Rule (product decision): a caller may only see their own cohort plus admins.
 *   buyer    -> buyers + admins
 *   supplier -> suppliers + admins
 *   admin    -> everyone
 *
 * These assert the CLIENT half: chat contacts cross cohorts by nature (a buyer
 * legitimately chats with a seller), so they must not reach the strip unless the
 * server's cohort check allowed them.
 */
import {getOtherParticipant} from '../src/utils/shareSheetContacts';

const ME = 'uid-me';

const chatWith = (id, otherUid, otherName) => ({
  id,
  type: 'private',
  participantIds: [ME, otherUid],
  participants: [
    {uid: ME, name: 'Me'},
    {uid: otherUid, name: otherName},
  ],
});

/**
 * Mirrors ShareSheet.loadContacts: chat contacts are kept only when the server
 * confirmed them through the same search-user cohort rule. `null` means the
 * check was not run; a Set (even empty) means it ran and is authoritative.
 */
const filterChatsToCohort = (memberChats, allowedUids) =>
  allowedUids === null
    ? memberChats
    : memberChats.filter((chat) => {
        const uid = getOtherParticipant(chat, ME)?.uid;
        return uid && allowedUids.has(String(uid));
      });

const otherUids = (chats) => chats.map((c) => getOtherParticipant(c, ME)?.uid).sort();

describe('getOtherParticipant (basis of the cohort check)', () => {
  it('returns the non-self participant', () => {
    expect(getOtherParticipant(chatWith('c1', 'seller-1', 'Chonlada'), ME)).toEqual({
      uid: 'seller-1',
      name: 'Chonlada',
      avatarUrl: '',
    });
  });

  it('accepts a JSON-string participantIds column', () => {
    const chat = chatWith('c1', 'admin-1', 'Admin');
    chat.participantIds = JSON.stringify([ME, 'admin-1']);
    expect(getOtherParticipant(chat, ME)?.uid).toBe('admin-1');
  });

  it('returns null for a 1:1 chat that does not include self', () => {
    expect(
      getOtherParticipant(
        {...chatWith('c', 'x', 'X'), participantIds: ['x', 'y']},
        ME,
      ),
    ).toBeNull();
  });

  it('returns null for a group chat', () => {
    expect(
      getOtherParticipant({...chatWith('c', 'x', 'X'), type: 'group'}, ME),
    ).toBeNull();
  });
});

describe('cohort filtering — buyer sees buyer + admin, never a seller', () => {
  const buyerChats = [
    chatWith('c1', 'buyer-friend', 'Plant A Plant'),
    chatWith('c2', 'seller-real', 'Chonlada Gardenhouse'),
    chatWith('c3', 'admin-1', 'Zoom Admin'),
  ];

  it('keeps buyer + admin contacts', () => {
    const kept = filterChatsToCohort(buyerChats, new Set(['buyer-friend', 'admin-1']));
    expect(otherUids(kept)).toEqual(['admin-1', 'buyer-friend']);
  });

  it('NEVER shows a seller contact to a buyer', () => {
    const kept = filterChatsToCohort(buyerChats, new Set(['buyer-friend', 'admin-1']));
    expect(otherUids(kept)).not.toContain('seller-real');
  });
});

describe('cohort filtering — seller sees seller + admin, never a buyer', () => {
  const sellerChats = [
    chatWith('s1', 'seller-friend', 'Toguo.plants'),
    chatWith('s2', 'buyer-real', 'Plant A Plant'),
    chatWith('s3', 'admin-1', 'Zoom Admin'),
  ];

  it('keeps supplier + admin contacts', () => {
    const kept = filterChatsToCohort(sellerChats, new Set(['seller-friend', 'admin-1']));
    expect(otherUids(kept)).toEqual(['admin-1', 'seller-friend']);
  });

  it('NEVER shows a buyer contact to a seller', () => {
    const kept = filterChatsToCohort(sellerChats, new Set(['seller-friend', 'admin-1']));
    expect(otherUids(kept)).not.toContain('buyer-real');
  });
});

describe('cohort filtering — admin and failure modes', () => {
  const all = [
    chatWith('a1', 'buyer-real', 'Buyer'),
    chatWith('a2', 'seller-real', 'Seller'),
    chatWith('a3', 'admin-2', 'Admin Two'),
  ];

  it('admin keeps every cohort', () => {
    expect(filterChatsToCohort(all, new Set(['buyer-real', 'seller-real', 'admin-2']))).toHaveLength(3);
  });

  it('fails CLOSED when the cohort check returns nothing', () => {
    expect(filterChatsToCohort(all, new Set())).toHaveLength(0);
  });

  it('leaves chats untouched when the check was not run', () => {
    expect(filterChatsToCohort(all, null)).toHaveLength(3);
  });
});

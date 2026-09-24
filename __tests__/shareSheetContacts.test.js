/**
 * Unit tests for the share-sheet contact merge (T1 in
 * docs/plans/2026-09-25-plant-detail-share-sheet.md).
 *
 * The helper is pure, so these run without the RN/native layer.
 */
import {
  buildRecommendedContacts,
  getOtherParticipant,
} from '../src/utils/shareSheetContacts';

const ME = 'uid-me';

const chatWith = (id, otherUid, opts = {}) => ({
  id,
  type: opts.type || 'private',
  participantIds: opts.participantIds || [ME, otherUid],
  participants: opts.participants || [
    { uid: ME, name: 'Me' },
    { uid: otherUid, name: opts.name || 'Other', avatarUrl: opts.avatarUrl || '' },
  ],
});

describe('getOtherParticipant', () => {
  it('returns the other member of a private chat', () => {
    expect(getOtherParticipant(chatWith('c1', 'uid-a', {name: 'Ann'}), ME)).toEqual({
      uid: 'uid-a',
      name: 'Ann',
      avatarUrl: '',
    });
  });

  it('skips group chats', () => {
    const group = {
      type: 'group',
      participantIds: [ME, 'uid-a', 'uid-b'],
      participants: [],
    };
    expect(getOtherParticipant(group, ME)).toBeNull();
  });

  it('rejects chats that do not contain exactly two participants including self', () => {
    expect(getOtherParticipant(chatWith('c', 'a', {participantIds: [ME]}), ME)).toBeNull();
    expect(getOtherParticipant(chatWith('c', 'a', {participantIds: ['x', 'y']}), ME)).toBeNull();
    expect(getOtherParticipant(chatWith('c', 'a', {participantIds: [ME, 'a', 'b']}), ME)).toBeNull();
  });

  it('accepts a JSON-string participantIds column', () => {
    const chat = chatWith('c1', 'uid-a', {name: 'Ann'});
    chat.participantIds = JSON.stringify([ME, 'uid-a']);
    expect(getOtherParticipant(chat, ME)?.uid).toBe('uid-a');
  });

  it('tolerates a missing profile entry', () => {
    const chat = chatWith('c1', 'uid-a');
    chat.participants = [];
    expect(getOtherParticipant(chat, ME)).toEqual({
      uid: 'uid-a',
      name: '',
      avatarUrl: '',
    });
  });

  it('does not throw on malformed input', () => {
    expect(getOtherParticipant(null, ME)).toBeNull();
    expect(getOtherParticipant(undefined, ME)).toBeNull();
    expect(getOtherParticipant('nope', ME)).toBeNull();
    expect(getOtherParticipant({}, ME)).toBeNull();
  });
});

describe('buildRecommendedContacts', () => {
  it('puts chat contacts before app users', () => {
    const result = buildRecommendedContacts({
      memberChats: [chatWith('c1', 'uid-chat', {name: 'Chatty'})],
      recentUsers: [{id: 'uid-app', username: 'Appy'}],
      currentUid: ME,
    });
    expect(result.map((c) => c.uid)).toEqual(['uid-chat', 'uid-app']);
    expect(result.map((c) => c.source)).toEqual(['chat', 'app']);
  });

  it('dedupes by uid, keeping the chat entry and filling blank fields from the app user', () => {
    const chat = chatWith('c1', 'uid-a');
    // the chat's own participant record has no name/avatar (a real shape:
    // `participants` is a jsonb blob that can hold blanks)
    chat.participants = [
      {uid: ME, name: 'Me'},
      {uid: 'uid-a', name: '', avatarUrl: ''},
    ];
    const result = buildRecommendedContacts({
      memberChats: [chat],
      recentUsers: [{id: 'uid-a', username: 'FromSearch', profileImage: 'http://img/a.png'}],
      currentUid: ME,
    });
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      uid: 'uid-a',
      name: 'FromSearch',
      avatarUrl: 'http://img/a.png',
      source: 'chat',
    });
  });

  it('keeps the chat name when the chat entry already has one', () => {
    const result = buildRecommendedContacts({
      memberChats: [chatWith('c1', 'uid-a', {name: 'ChatName'})],
      recentUsers: [{id: 'uid-a', username: 'SearchName'}],
      currentUid: ME,
    });
    expect(result[0].name).toBe('ChatName');
  });

  it('never includes the current user', () => {
    const result = buildRecommendedContacts({
      memberChats: [],
      recentUsers: [{id: ME, username: 'Me'}, {id: 'uid-a', username: 'Ann'}],
      currentUid: ME,
    });
    expect(result.map((c) => c.uid)).toEqual(['uid-a']);
  });

  it('includes group chats as share targets, ahead of people', () => {
    const result = buildRecommendedContacts({
      memberChats: [
        {id: 'g1', type: 'group', name: 'Hoya Lovers', participantIds: [ME, 'uid-a', 'uid-b']},
        chatWith('c2', 'uid-c', {name: 'Cee'}),
      ],
      recentUsers: [],
      currentUid: ME,
    });
    expect(result.map((c) => c.uid)).toEqual(['g1', 'uid-c']);
    expect(result[0]).toMatchObject({
      uid: 'g1',
      name: 'Hoya Lovers',
      isGroup: true,
      chatId: 'g1',
    });
    expect(result[1].isGroup).toBeUndefined();
  });

  it('keys groups by chat id so two groups never collapse into one', () => {
    const result = buildRecommendedContacts({
      memberChats: [
        {id: 'g1', type: 'group', name: 'Group One', participantIds: [ME, 'a']},
        {id: 'g2', type: 'group', name: 'Group Two', participantIds: [ME, 'a']},
      ],
      recentUsers: [],
      currentUid: ME,
    });
    expect(result.map((c) => c.uid)).toEqual(['g1', 'g2']);
  });

  it('drops a group with no id rather than inventing a key', () => {
    const result = buildRecommendedContacts({
      memberChats: [{type: 'group', name: 'Nameless'}],
      recentUsers: [],
      currentUid: ME,
    });
    expect(result).toEqual([]);
  });

  it('collects up to two member photos for the joint group avatar', () => {
    const result = buildRecommendedContacts({
      memberChats: [
        {
          id: 'g1',
          type: 'group',
          name: 'Hoya Lovers',
          participants: [
            {uid: 'u1', avatarUrl: 'https://cdn.example/a.jpg'},
            {uid: 'u2', avatarUrl: 'https://cdn.example/b.jpg'},
            {uid: 'u3', avatarUrl: 'https://cdn.example/c.jpg'},
          ],
        },
      ],
      recentUsers: [],
      currentUid: ME,
    });
    expect(result[0].groupAvatars).toEqual([
      'https://cdn.example/a.jpg',
      'https://cdn.example/b.jpg',
    ]);
  });

  it('ignores junk avatar values (the column has held numbers)', () => {
    const result = buildRecommendedContacts({
      memberChats: [
        {
          id: 'g1',
          type: 'group',
          name: 'Mixed',
          participants: [{uid: 'u1', avatarUrl: 36}, {uid: 'u2', avatarUrl: 'https://ok/x.jpg'}],
        },
      ],
      recentUsers: [],
      currentUid: ME,
    });
    expect(result[0].groupAvatars).toEqual(['https://ok/x.jpg']);
  });

  it('caps the list at limit', () => {
    const recentUsers = Array.from({length: 30}, (_, i) => ({
      id: `uid-${i}`,
      username: `User ${i}`,
    }));
    const result = buildRecommendedContacts({
      memberChats: [],
      recentUsers,
      currentUid: ME,
      limit: 12,
    });
    expect(result).toHaveLength(12);
    expect(result[0].uid).toBe('uid-0');
  });

  it('drops entries with no uid', () => {
    const result = buildRecommendedContacts({
      memberChats: [],
      recentUsers: [{username: 'NoId'}, {id: 'uid-a', username: 'Ann'}],
      currentUid: ME,
    });
    expect(result.map((c) => c.uid)).toEqual(['uid-a']);
  });

  it('prefers the app-user name fields in the documented order', () => {
    const result = buildRecommendedContacts({
      memberChats: [],
      recentUsers: [
        {id: 'uid-1', gardenOrCompanyName: 'Garden Co', username: 'uname'},
        {id: 'uid-2', businessName: 'BizName'},
        {id: 'uid-3', companyName: 'CompanyName'},
      ],
      currentUid: ME,
    });
    expect(result.map((c) => c.name)).toEqual(['uname', 'BizName', 'CompanyName']);
  });

  it('returns an empty list without a current uid', () => {
    const result = buildRecommendedContacts({
      memberChats: [],
      recentUsers: [{id: 'uid-a', username: 'Ann'}],
      currentUid: '',
    });
    expect(result).toEqual([]);
  });

  it('returns an empty list for non-positive or invalid limits', () => {
    expect(
      buildRecommendedContacts({recentUsers: [{id: 'a'}], currentUid: ME, limit: 0}),
    ).toEqual([]);
    expect(
      buildRecommendedContacts({recentUsers: [{id: 'a'}], currentUid: ME, limit: NaN}),
    ).toEqual([]);
  });

  it('defaults to an empty list when called with nothing', () => {
    expect(buildRecommendedContacts()).toEqual([]);
  });
});

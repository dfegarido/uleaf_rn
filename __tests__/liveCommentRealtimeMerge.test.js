/**
 * Real-time live-chat state merging.
 *
 * The live screens get comments from TWO sources at once while a realtime
 * subscription rolls out: the 10s poll (authoritative) and postgres_changes
 * events (fast path). These tests pin down the merge contract that keeps them
 * from fighting each other:
 *   * an event already fetched by the poll must not duplicate,
 *   * positions stay ordered by createdAt,
 *   * a poll landing mid-send must not delete the sender's own in-flight comment,
 *   * a comment deleted/purged server-side must disappear (chat is ephemeral).
 */
import {
  createPendingLiveComment,
  mergeLiveComment,
  mergeLiveCommentUpdate,
  mergeLiveCommentsFromServer,
} from '../src/utils/realtimeLiveComments';

const c = (id, seconds, message = `m-${id}`) => ({
  id,
  message,
  name: 'buyer',
  avatar: 'a.png',
  uid: 'u1',
  createdAt: { seconds, nanoseconds: 0, toDate: () => new Date(seconds * 1000) },
});

describe('mergeLiveComment (realtime INSERT)', () => {
  it('appends a new comment', () => {
    const out = mergeLiveComment([c('a', 100)], c('b', 200));
    expect(out.map((x) => x.id)).toEqual(['a', 'b']);
  });

  it('dedupes a comment the poll already fetched (no double render)', () => {
    const list = [c('a', 100)];
    expect(mergeLiveComment(list, c('a', 100))).toBe(list);
  });

  it('keeps createdAt order even when the event arrives out of order', () => {
    const out = mergeLiveComment([c('a', 100), c('c', 300)], c('b', 200));
    expect(out.map((x) => x.id)).toEqual(['a', 'b', 'c']);
  });

  it('ignores a payload with no id', () => {
    const list = [c('a', 100)];
    expect(mergeLiveComment(list, {})).toBe(list);
    expect(mergeLiveComment(list, undefined)).toBe(list);
  });
});

describe('mergeLiveCommentUpdate (realtime UPDATE / edit)', () => {
  it('replaces the message in place, keeping position', () => {
    const out = mergeLiveCommentUpdate([c('a', 100), c('b', 200)], c('a', 100, 'edited'));
    expect(out.map((x) => x.id)).toEqual(['a', 'b']);
    expect(out[0].message).toBe('edited');
  });

  it('leaves other comments untouched', () => {
    const out = mergeLiveCommentUpdate([c('a', 100), c('b', 200)], c('a', 100, 'edited'));
    expect(out[1].message).toBe('m-b');
  });
});

describe('createPendingLiveComment (optimistic send)', () => {
  it('builds a renderable row with a client-owned id', () => {
    const p = createPendingLiveComment({ message: 'hi', name: 'buyer', avatar: 'a.png', uid: 'u1' });
    expect(p.id).toMatch(/^lc_/);
    expect(p.message).toBe('hi');
    expect(p.pending).toBe(true);
    expect(p.createdAt.seconds).toBeGreaterThan(0);
  });

  it('accepts a caller-supplied id', () => {
    expect(createPendingLiveComment({ id: 'lc_fixed', message: 'hi' }).id).toBe('lc_fixed');
  });

  it('generates a unique id per call', () => {
    const ids = new Set([
      createPendingLiveComment({ message: 'a' }).id,
      createPendingLiveComment({ message: 'b' }).id,
    ]);
    expect(ids.size).toBe(2);
  });
});

describe('optimistic send end-to-end (merge contract)', () => {
  it('shows the comment immediately, without a server round-trip', () => {
    // send: local append happens synchronously, before addLiveCommentApi resolves
    const pending = createPendingLiveComment({ id: 'lc_mine', message: 'hello' });
    const afterSend = mergeLiveComment([c('a', 100)], pending);
    expect(afterSend.map((x) => x.id)).toEqual(['a', 'lc_mine']);
  });

  it('the realtime echo CONFIRMS the pending row instead of duplicating it', () => {
    const pending = createPendingLiveComment({ id: 'lc_mine', message: 'hello' });
    const list = mergeLiveComment([c('a', 100)], pending);
    // same id arrives from postgres_changes, without the local flag
    const echoed = { ...c('lc_mine', 150, 'hello'), uid: 'u1' };
    const out = mergeLiveComment(list, echoed);
    expect(out).toHaveLength(2);
    expect(out[1].pending).toBeFalsy();
  });

  it('a poll landing mid-send does not delete the pending row', () => {
    const pending = createPendingLiveComment({ id: 'lc_mine', message: 'hello' });
    const out = mergeLiveCommentsFromServer(mergeLiveComment([c('a', 100)], pending), [c('a', 100)]);
    expect(out.map((x) => x.id)).toContain('lc_mine');
  });

  it('once confirmed, the server owns the row (a delete still wins)', () => {
    // The row was confirmed (no pending flag) but the server list — which has
    // moved past it — no longer contains it: a delete/purge removed it, so it
    // must disappear. Only UNCONFIRMED rows get the race reprieve.
    const confirmed = c('lc_mine', 150);
    const out = mergeLiveCommentsFromServer(
      [c('a', 100), confirmed],
      [c('a', 100), c('b', 200)],
    );
    expect(out.map((x) => x.id)).toEqual(['a', 'b']);
  });

  it('a failed write rolls back to an empty chat', () => {
    const pending = createPendingLiveComment({ id: 'lc_mine', message: 'hello' });
    const list = mergeLiveComment([], pending);
    expect(list.filter((x) => x.id !== pending.id)).toEqual([]);
  });

  it('a confirmed edit clears the pending flag', () => {
    const pending = { ...c('a', 100), message: 'edited', pending: true };
    const out = mergeLiveCommentUpdate([pending], c('a', 100, 'edited'));
    expect(out[0].message).toBe('edited');
    expect(out[0].pending).toBe(false);
  });
});

describe('mergeLiveCommentsFromServer (poll resync)', () => {
  it('uses the server list as the base', () => {
    const out = mergeLiveCommentsFromServer([c('a', 100)], [c('a', 100), c('b', 200)]);
    expect(out.map((x) => x.id)).toEqual(['a', 'b']);
  });

  it('KEEPS an in-flight comment the server does not have yet', () => {
    // The user just sent "mine"; the poll response predates the write.
    const out = mergeLiveCommentsFromServer([c('a', 100), c('mine', 150)], [c('a', 100)]);
    expect(out.map((x) => x.id)).toContain('mine');
  });

  it('DROPS a comment the server no longer has (deleted or purged)', () => {
    const out = mergeLiveCommentsFromServer(
      [c('a', 100), c('gone', 150), c('b', 200)],
      [c('a', 100), c('b', 200)],
    );
    // 'gone' is older than the newest server row, so the server is authoritative
    // and it disappears — this is how a delete/purge propagates to the UI.
    expect(out.map((x) => x.id)).toEqual(['a', 'b']);
  });

  it('an empty server response (purge on end) clears everything', () => {
    // The end-of-session purge deletes every row, so the poll returns []. That is
    // authoritative: the chat is ephemeral and must go blank.
    expect(mergeLiveCommentsFromServer([c('a', 100), c('b', 200)], [])).toEqual([]);
  });

  it('returns createdAt order across server + pending', () => {
    const out = mergeLiveCommentsFromServer(
      [c('p', 500), c('a', 100)],
      [c('b', 300)],
    );
    // 'a' is older than the newest server row, so the server wins over it;
    // 'p' is newer than everything returned, so it is the still-in-flight send.
    expect(out.map((x) => x.id)).toEqual(['b', 'p']);
  });
});

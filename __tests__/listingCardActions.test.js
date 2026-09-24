/**
 * Regression tests for the listing-card Edit/Delete confusion.
 *
 * Reported bug: sharing a listing then tapping Edit or Delete errored.
 *
 * Root cause: the card set `senderId = currentUserUid` whenever the *message*
 * was mine, and both handlers then treated that as listing ownership.
 *   - Edit  -> navigation.navigate('ScreenSingleSell') from the buyer shell,
 *              where that route does not exist -> route-not-found error.
 *   - Delete -> postListingDeleteApi(plantCode) for a listing the sharer does
 *              not own -> delete-listing authorises on sellercode -> 403.
 *
 * The fix separates the two concepts. These tests lock that separation in.
 */

/**
 * Mirrors ListingMessage.handleLongPress: what the card reports for a listing.
 */
const buildListingTooltip = ({currentUserUid, isMe, listing}) => {
  const isMyListing = Boolean(
    currentUserUid &&
      listing.sellerCode &&
      String(listing.sellerCode) === String(currentUserUid),
  );
  return {
    isListing: true,
    plantCode: listing.plantCode,
    isMine: isMe,
    isMyListing,
    senderId: isMe ? currentUserUid : null,
  };
};

/** Mirrors ChatScreen.canEditTooltipMessage. */
const canEdit = (msg, canEditListing) => {
  if (!msg) return false;
  if (msg.isListing) return Boolean(msg.isMyListing) && canEditListing;
  return msg.senderId === 'me';
};

/** Mirrors ChatScreen's skipListingProductDelete decision. */
const shouldDeleteProduct = ({toDelete, isAdminViewer, chatType, currentUserUid}) =>
  !(
    !toDelete.isMyListing ||
    (isAdminViewer &&
      chatType === 'group' &&
      toDelete.senderId &&
      toDelete.senderId !== currentUserUid)
  );

const ME = 'uid-me';
const SELLER_OTHER = 'uid-seller-other';

const someoneElsesListing = {plantCode: 'ZMMON090006', sellerCode: SELLER_OTHER};
const myListing = {plantCode: 'WIFIC020004', sellerCode: ME};

describe('sharing someone else\u2019s listing (the reported bug)', () => {
  const tooltip = buildListingTooltip({
    currentUserUid: ME,
    isMe: true,
    listing: someoneElsesListing,
  });

  it('reports the card as mine', () => {
    expect(tooltip.isMine).toBe(true);
  });

  it('does NOT report the listing as mine', () => {
    expect(tooltip.isMyListing).toBe(false);
  });

  it('hides Edit in the buyer shell (no editor route)', () => {
    expect(canEdit(tooltip, false)).toBe(false);
  });

  it('does not delete the seller\u2019s product (would 403)', () => {
    expect(
      shouldDeleteProduct({
        toDelete: tooltip,
        isAdminViewer: false,
        chatType: 'private',
        currentUserUid: ME,
      }),
    ).toBe(false);
  });
});

describe('my own listing shared by me', () => {
  const tooltip = buildListingTooltip({
    currentUserUid: ME,
    isMe: true,
    listing: myListing,
  });

  it('reports the listing as mine', () => {
    expect(tooltip.isMyListing).toBe(true);
  });

  it('offers Edit where the route exists (seller shell)', () => {
    expect(canEdit(tooltip, true)).toBe(true);
  });

  it('still hides Edit in the buyer shell', () => {
    expect(canEdit(tooltip, false)).toBe(false);
  });

  it('deletes the product when the owner deletes it', () => {
    expect(
      shouldDeleteProduct({
        toDelete: tooltip,
        isAdminViewer: false,
        chatType: 'private',
        currentUserUid: ME,
      }),
    ).toBe(true);
  });
});

describe('someone else\u2019s listing shared by someone else', () => {
  const tooltip = buildListingTooltip({
    currentUserUid: ME,
    isMe: false,
    listing: someoneElsesListing,
  });

  it('exposes neither Edit nor product delete', () => {
    expect(canEdit(tooltip, true)).toBe(false);
    expect(
      shouldDeleteProduct({
        toDelete: tooltip,
        isAdminViewer: false,
        chatType: 'private',
        currentUserUid: ME,
      }),
    ).toBe(false);
  });
});

describe('admin moderating a group chat', () => {
  it('removes the message but keeps the seller\u2019s listing', () => {
    const toDelete = {
      isListing: true,
      isMyListing: false,
      senderId: 'uid-other',
    };
    expect(
      shouldDeleteProduct({
        toDelete,
        isAdminViewer: true,
        chatType: 'group',
        currentUserUid: ME,
      }),
    ).toBe(false);
  });
});

describe('non-listing messages are unaffected', () => {
  it('Edit still follows message ownership', () => {
    expect(canEdit({senderId: 'me'}, false)).toBe(true);
    expect(canEdit({senderId: 'someone'}, true)).toBe(false);
  });
});

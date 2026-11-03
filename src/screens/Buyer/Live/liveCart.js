// Plant codes in the cart as the buyer should see them: the server's cart with in-flight
// optimistic adds (true) and removes (false) applied on top, so the button flips on tap.
export const optimisticCartCodes = (serverItems, overrides) => {
  const codes = new Set(serverItems.map((i) => i.plantCode));
  Object.entries(overrides).forEach(([code, inCart]) => (inCart ? codes.add(code) : codes.delete(code)));
  return codes;
};

// Cart badge count with the same optimistic changes: server rows plus net added plant codes.
export const optimisticCartCount = (serverItems, codes) =>
  serverItems.length + codes.size - new Set(serverItems.map((i) => i.plantCode)).size;

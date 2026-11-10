/**
 * Regression: Single-Plant live listing must attach `sessionId` so it connects to
 * the live stream (matches Grower's Choice). Previously sessionId was only attached
 * when isPurge=true, so live Single-Plant listings had sessionid=null.
 *
 * The RN component imports native modules, so we assert on the payload source.
 */
const fs = require('fs');
const path = require('path');

const read = f => fs.readFileSync(path.join(__dirname, '..', 'src/screens/Seller/Sell', f), 'utf8');
const single = read('ScreenSingleSellLive.js');
const grower = read('ScreenGrowersSellLive.js');

it('Single-Plant payload always attaches sessionId', () => {
  expect(single).toMatch(/sessionId:\s*sessionId\s*\|\|\s*null/);
  expect(single).not.toMatch(/if\s*\(\s*isPurge\s*\)\s*\{\s*data\.sessionId\s*=\s*sessionId/);
});

it('Single-Plant live flow keeps status Live (Purge only when isPurge)', () => {
  expect(single).toMatch(/status:\s*isPurge\s*\?\s*'Purge'\s*:\s*'Live'/);
});

it('Single-Plant reads sessionId from the prop when route is absent (nested live flow)', () => {
  expect(single).toMatch(/sessionId:\s*sessionIdProp/);
  expect(single).toMatch(/sessionId\s*=\s*sessionIdProp\s*\|\|/);
});

it("Grower's Choice baseline attaches sessionId", () => {
  expect(grower).toMatch(/sessionId:\s*sessionId\s*\|\|\s*null/);
});

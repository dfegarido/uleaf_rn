/**
 * Regression test: the seller's active-listing thumb must cross-fade when its photo is
 * replaced, not hard-cut through three blank decodes (local file -> stale remote -> new remote).
 *
 * LiveBroadcastScreen imports native modules and cannot be rendered here, so this asserts on
 * the source, the same approach as liveListingSessionId.test.js.
 */
const fs = require('fs');
const path = require('path');

const src = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'Live', 'LiveBroadcastScreen.js'),
  'utf8',
);

const upload = src.slice(
  src.indexOf('const handleSnapshotUpload'),
  src.indexOf('const captureAndUploadSnapshot'),
);

describe('LiveBroadcastScreen snapshot thumb', () => {
  it('renders the thumb through PlantListingImage with both the remote and local uri', () => {
    expect(src).toMatch(/import PlantListingImage from/);
    expect(src).toMatch(
      /<PlantListingImage[^>]*uri=\{activeListing\.imagePrimary\}[^>]*localUri=\{snapshotPreviewUri\}/s,
    );
  });

  it('does not clear the preview or unlink the file in the upload `finally`', () => {
    expect(upload).not.toMatch(/finally/);
    expect(upload).not.toMatch(/RNFS\.unlink/);
  });

  it('inspects the write result instead of logging success unconditionally', () => {
    expect(upload).toMatch(/const result = await updateListingApi\(/);
    expect(upload).toMatch(/result\?\.success/);
  });

  it('drops the preview only when the poll shows a different imagePrimary', () => {
    expect(src).toMatch(/next\.imagePrimary !== awaiting\.previousImagePrimary/);
  });
});

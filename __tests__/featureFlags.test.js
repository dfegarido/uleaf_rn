/**
 * Leaf Trail hub flag (isLeafTrailHubSpecEnabled) follows ENABLE_TRAIL1_FOR_RECEIVING
 * in .env. Receiving.js drives both the hub UI and Trail 1 intake mode from it.
 */
const fs = require('fs');
const path = require('path');
const flags = require('../src/config/featureFlags');

function expectedFromDotEnv() {
  const envFile = path.join(__dirname, '..', '.env');
  const src = fs.existsSync(envFile) ? fs.readFileSync(envFile, 'utf8') : '';
  const m = src.match(/^\s*ENABLE_TRAIL1_FOR_RECEIVING\s*=\s*(.*)$/m);
  const raw = (m ? m[1] : '').trim().replace(/^['"]|['"]$/g, '').toLowerCase();
  return !['false', '0', 'no'].includes(raw);
}

it('hub flag follows .env (on unless explicitly false/0/no)', () => {
  expect(flags.isLeafTrailHubSpecEnabled()).toBe(expectedFromDotEnv());
});

it('Receiving reads the flag through a function featureFlags exports', () => {
  const src = fs.readFileSync(
    path.join(__dirname, '..', 'src/screens/Admin/LeafTrail/Receiving/Receiving.js'),
    'utf8',
  );
  const used = [...src.matchAll(/\b(is\w+Enabled)\(\)/g)].map(m => m[1]);
  expect(used.length).toBeGreaterThan(0);
  used.forEach(fn => expect(typeof flags[fn]).toBe('function'));
});

it('Trail 1 intake mode is the hub flag, not a separate switch', () => {
  const src = fs.readFileSync(
    path.join(__dirname, '..', 'src/screens/Admin/LeafTrail/Receiving/Receiving.js'),
    'utf8',
  );
  expect(src).toMatch(/const hubSpecEnabled = isLeafTrailHubSpecEnabled\(\);/);
  expect(src).toMatch(/const trail1IntakeMode = hubSpecEnabled;/);
});

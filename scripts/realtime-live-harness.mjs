#!/usr/bin/env node
/**
 * Realtime live-stream harness (local dev tool, read-only except a no-op UPDATE).
 *
 * Why this exists: the buyer "Live" badge kept showing for ended sessions because
 * the Realtime subscription was refused at the websocket handshake — `createClient`
 * passes its 2nd arg through as the Realtime `apikey`, and the bridge JWT is not a
 * valid project key. This harness pins the contract that fixes it, so the behaviour
 * can be re-verified without driving the UI.
 *
 * Run:
 *   node scripts/realtime-live-harness.mjs            # full suite (~2 min)
 *   node scripts/realtime-live-harness.mjs contract   # fast: handshake shapes only
 *
 * Requires ileafu_backend/functions/.env.local (JWT secret + service role key).
 * Prints no secret values.
 *
 * Data safety: the only write is a PATCH of one `live` row to its CURRENT
 * lastheartbeat value (and a fresh timestamp for a row that has none), so it is a
 * no-op on real data. Nothing is deleted or created.
 */
import fs from 'node:fs';
import https from 'node:https';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const APP_ROOT = path.resolve(HERE, '..');
const ENV_FILE =
  process.env.LEAF_BACKEND_ENV ||
  path.resolve(APP_ROOT, '../ileafu_backend/functions/.env.local');

/** Publishable (client-safe) project key — mirrors src/utils/realtimeLive.js. */
const PUBLISHABLE_KEY = 'sb_publishable_q9L2eK2yWvQDjWKJyYUPUA_QospsDls';

const { createClient } = await import(
  path.join(APP_ROOT, 'node_modules/@supabase/supabase-js/dist/index.mjs')
);

function loadEnv() {
  const env = {};
  for (const line of fs.readFileSync(ENV_FILE, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#') || !t.includes('=')) continue;
    const i = t.indexOf('=');
    env[t.slice(0, i).trim()] = t
      .slice(i + 1)
      .trim()
      .replace(/^['"]|['"]$/g, '')
      .replace(/^=/, '');
  }
  return env;
}

const env = loadEnv();
const URL_BASE = env.SUPABASE_URL.replace(/\/$/, '');
const HOST = new URL(URL_BASE).host;
const SECRET = env.CHAT_REALTIME_JWT_SECRET || env.SUPABASE_JWT_SECRET;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
if (!SECRET || !SERVICE_KEY) {
  console.error(`Missing CHAT_REALTIME_JWT_SECRET / SUPABASE_SERVICE_ROLE_KEY in ${ENV_FILE}`);
  process.exit(2);
}

const b64url = (b) =>
  Buffer.from(b).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

/** Same payload shape the chat-realtime-token Edge Function mints. */
function mintBridge(ttlSeconds) {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    aud: 'authenticated',
    role: 'authenticated',
    sub: 'harness',
    firebase_uid: 'harness',
    iat: now,
    exp: now + ttlSeconds,
  };
  const input = `${b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))}.${b64url(JSON.stringify(payload))}`;
  return `${input}.${b64url(crypto.createHmac('sha256', SECRET).update(input).digest())}`;
}

// ---------------------------------------------------------------- handshake probe
function probeApikey(key) {
  return new Promise((resolve) => {
    const req = https.request(
      {
        host: HOST,
        path: `/realtime/v1/websocket?apikey=${encodeURIComponent(key)}&vsn=1.0.0`,
        headers: {
          Connection: 'Upgrade',
          Upgrade: 'websocket',
          'Sec-WebSocket-Version': '13',
          'Sec-WebSocket-Key': 'dGhlIHNhbXBsZSBub25jZQ==',
        },
      },
      (res) => {
        const code = res.headers['sb-error-code'] || '';
        res.resume();
        resolve({ accepted: false, detail: `HTTP ${res.statusCode}${code ? ' ' + code : ''}` });
      },
    );
    req.on('upgrade', (res) => {
      resolve({ accepted: true, detail: `HTTP ${res.statusCode} websocket accepted` });
      req.destroy();
    });
    req.on('error', (e) => resolve({ accepted: false, detail: `ERR ${e.message}` }));
    req.setTimeout(8000, () => {
      req.destroy();
      resolve({ accepted: false, detail: 'TIMEOUT' });
    });
    req.end();
  });
}

// ---------------------------------------------------------------- live row helpers
async function pickRow() {
  const res = await fetch(
    `${URL_BASE}/rest/v1/live?select=id,title,status,lastheartbeat&order=updatedat.desc&limit=1`,
    { headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` } },
  );
  const rows = await res.json();
  if (!rows.length) throw new Error('no rows in `live` to read');
  return rows[0];
}

/** No-op write that still emits a postgres_changes UPDATE. */
async function nudge(row) {
  const res = await fetch(`${URL_BASE}/rest/v1/live?id=eq.${row.id}`, {
    method: 'PATCH',
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({
      lastheartbeat: row.lastheartbeat || new Date().toISOString(),
    }),
  });
  return res.status;
}

const sleep = (s) => new Promise((r) => setTimeout(r, s * 1000));
const results = [];
const check = (name, pass, detail = '') => {
  results.push({ name, pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
};

// ==================================================================== suite
const mode = process.argv[2] || 'all';
const row = await pickRow();
console.log(
  `target row: ${row.id} status=${row.status} title="${row.title}" | host: ${HOST}\n`,
);

if (mode === 'all' || mode === 'contract') {
  console.log('--- 1. websocket apikey contract ---');
  const bridge = mintBridge(600);

  const asClientKey = await probeApikey(bridge);
  check(
    'bridge JWT as client key is REJECTED (the original bug)',
    !asClientKey.accepted,
    asClientKey.detail,
  );

  const publishable = await probeApikey(PUBLISHABLE_KEY);
  check('publishable key accepted as client key', publishable.accepted, publishable.detail);

  if (mode === 'contract') {
    summarize();
    process.exit(0);
  }
}

console.log('\n--- 2. event delivery with the fixed wiring ---');
let events = 0;
const client = createClient(URL_BASE, PUBLISHABLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
  realtime: { params: { eventsPerSecond: 10 } },
});
await client.realtime.setAuth(mintBridge(600));

let channel = client
  .channel('harness-1')
  .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'live' }, () => {
    events += 1;
  })
  .subscribe();

await sleep(3);
await nudge(row);
await sleep(5);
check('receives live UPDATE with publishable key + setAuth(bridge)', events >= 1, `events=${events}`);

console.log('\n--- 3. survives bridge-token expiry (refresh + channel rebuild) ---');
// Short token, short refresh window: mimic the app's 5-min refresh inside a 10-min
// TTL, compressed so it can be observed.
const eventsBeforeExpiryCycle = events;
await client.realtime.setAuth(mintBridge(8));
{
  const previous = channel;
  channel = client
    .channel('harness-2')
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'live' }, () => {
      events += 1;
    })
    .subscribe();
  try {
    await client.removeChannel(previous);
  } catch {
    /* ignore */
  }
}
await sleep(15); // token from the previous cycle is now well expired
const channelState = channel.state;

// app-equivalent refresh: fresh token -> setAuth -> rebuild channel
await client.realtime.setAuth(mintBridge(600));
{
  const previous = channel;
  channel = client
    .channel('harness-3')
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'live' }, () => {
      events += 1;
    })
    .subscribe();
  try {
    await client.removeChannel(previous);
  } catch {
    /* ignore */
  }
}
await sleep(3);
await nudge(row);
await sleep(6);
check(
  'events resume after expiry when setAuth(fresh) is followed by a channel rebuild',
  events > eventsBeforeExpiryCycle,
  `events ${eventsBeforeExpiryCycle} -> ${events}`,
);

summarize();
process.exit(results.every((r) => r.pass) ? 0 : 1);

function summarize() {
  const failed = results.filter((r) => !r.pass);
  console.log(`\n===== ${results.length - failed.length}/${results.length} checks passed =====`);
  if (failed.length) failed.forEach((f) => console.log(`  FAILED: ${f.name} ${f.detail}`));
}

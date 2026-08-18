// fetch-emails.mjs — Re-fetch full HTML/text bodies for Zalando emails.
// Strategy: reuse existing scan for envelope data (id, date, from, subject).
// For any message whose body was truncated OR is missing an order#, re-fetch
// with format=full and store the untruncated HTML + a cleaned text version.
// Then write data/emails.json with structured fields.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'data');
fs.mkdirSync(DATA_DIR, { recursive: true });

const SCAN_FILE = 'C:/Users/dev/.openclaw/zalando-manasa-scan.json';
const CLIENT_FILE = 'C:/Users/dev/.openclaw/gmail-manasa-client.json';
const TOKENS_FILE = 'C:/Users/dev/.openclaw/gmail-manasa-tokens.json';
const OUT_FILE = path.join(DATA_DIR, 'emails.json');
const CACHE_FILE = path.join(DATA_DIR, 'body-cache.json'); // id -> {html, text}

const CONCURRENCY = 10;
const ORDER_RE = /\b\d{14}\b/;
const AMOUNT_RE = /€\s?([0-9]+(?:[.,][0-9]{2}))/;

const client = JSON.parse(fs.readFileSync(CLIENT_FILE, 'utf8')).web;
const tokens = JSON.parse(fs.readFileSync(TOKENS_FILE, 'utf8'));
const scan = JSON.parse(fs.readFileSync(SCAN_FILE, 'utf8'));

let cache = {};
if (fs.existsSync(CACHE_FILE)) {
  try { cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8')); } catch {}
}

async function getAccessToken() {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: client.client_id,
      client_secret: client.client_secret,
      refresh_token: tokens.refresh_token,
      grant_type: 'refresh_token',
    }).toString(),
  });
  const j = await res.json();
  if (!j.access_token) throw new Error('refresh failed: ' + JSON.stringify(j));
  return j.access_token;
}

function decodeB64(s) {
  if (!s) return '';
  return Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
}

function extractBodies(payload) {
  const parts = [];
  (function walk(p) {
    if (!p) return;
    if (p.body?.data) parts.push({ mime: p.mimeType, data: decodeB64(p.body.data) });
    if (p.parts) p.parts.forEach(walk);
  })(payload);
  const html = parts.find(p => p.mime === 'text/html')?.data || '';
  const plain = parts.find(p => p.mime === 'text/plain')?.data || '';
  return { html, plain };
}

// Strip HTML, drop marketing preheader padding, collapse whitespace.
export function cleanText(rawPlain, rawHtml) {
  let text = rawPlain || '';
  if (!text && rawHtml) {
    text = rawHtml
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<[^>]+>/g, ' ');
  }
  // Remove invisible unicode used for preheader padding
  text = text.replace(/[\u200B-\u200F\u202A-\u202E\u2060\uFEFF\u00AD]/g, '');
  // Normalize whitespace
  text = text.replace(/\r/g, '');
  // Skip marketing preheader: everything before the first meaningful marker.
  const markers = [/€/, /\b\d{14}\b/, /Hallo\s+\w/i, /Beste\s+\w/i, /Bedankt/i, /Bestelnummer/i, /Order\s?number/i];
  const lines = text.split('\n');
  let start = 0;
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i].trim();
    if (!l) continue;
    if (markers.some(re => re.test(l))) { start = i; break; }
  }
  return lines.slice(start).join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

function extractOrder(text, subject) {
  const m = (text + ' ' + subject).match(ORDER_RE);
  return m ? m[0] : null;
}
function extractAmount(text) {
  // Prefer amounts near words like "terugbetaald" or "refund" or "totaal"
  const near = text.match(/(?:terugbetaald|refund(?:ed)?|totaal|total|betaald)[^€\n]{0,60}€\s?([0-9]+(?:[.,][0-9]{2}))/i);
  if (near) return parseFloat(near[1].replace(',', '.'));
  const any = text.match(AMOUNT_RE);
  return any ? parseFloat(any[1].replace(',', '.')) : null;
}
function extractProductNames(html) {
  if (!html) return [];
  const alts = [...html.matchAll(/<img[^>]+alt="([^"]{3,80})"/gi)].map(m => m[1]);
  return [...new Set(alts.filter(a => !/logo|zalando|instagram|facebook|banner|arrow|icon/i.test(a)))].slice(0, 8);
}

async function fetchMessage(id, token) {
  const url = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=full`;
  for (let attempt = 0; attempt < 5; attempt++) {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) return await res.json();
    if (res.status === 429 || res.status >= 500) {
      const wait = 500 * Math.pow(2, attempt);
      await new Promise(r => setTimeout(r, wait));
      continue;
    }
    if (res.status === 401) throw new Error('AUTH_EXPIRED');
    throw new Error(`${res.status} ${await res.text()}`);
  }
  throw new Error('exhausted retries for ' + id);
}

async function pool(items, worker, size) {
  const results = new Array(items.length);
  let idx = 0;
  let done = 0;
  const total = items.length;
  async function runOne() {
    while (idx < items.length) {
      const my = idx++;
      try { results[my] = await worker(items[my], my); }
      catch (e) { results[my] = { __err: e.message }; }
      done++;
      if (done % 25 === 0 || done === total) {
        process.stdout.write(`\r  ${done}/${total} fetched`);
      }
    }
  }
  await Promise.all(Array.from({ length: size }, runOne));
  process.stdout.write('\n');
  return results;
}

(async () => {
  console.log(`Scan: ${scan.length} messages.`);
  // Which messages need full re-fetch?
  const needFetch = scan.filter(m => {
    if (cache[m.id]) return false;
    const bodyLen = (m.body || '').length;
    const hasOrder = ORDER_RE.test((m.body || '') + ' ' + m.subject + ' ' + m.snippet);
    return bodyLen >= 3990 || !hasOrder;
  });
  console.log(`Need to re-fetch: ${needFetch.length} (cached: ${Object.keys(cache).length})`);

  if (needFetch.length) {
    console.log('Refreshing access token...');
    let token = await getAccessToken();
    let refetchWithToken = async (ids) => {
      return pool(ids, async (m) => {
        try {
          const msg = await fetchMessage(m.id, token);
          const { html, plain } = extractBodies(msg.payload);
          const text = cleanText(plain, html);
          return { id: m.id, html, text };
        } catch (e) {
          if (e.message === 'AUTH_EXPIRED') {
            token = await getAccessToken();
            const msg = await fetchMessage(m.id, token);
            const { html, plain } = extractBodies(msg.payload);
            const text = cleanText(plain, html);
            return { id: m.id, html, text };
          }
          throw e;
        }
      }, CONCURRENCY);
    };
    const fetched = await refetchWithToken(needFetch);
    let errs = 0;
    for (const r of fetched) {
      if (!r || r.__err) { errs++; continue; }
      cache[r.id] = { html: r.html, text: r.text };
    }
    console.log(`Fetched OK: ${fetched.length - errs}, errors: ${errs}`);
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache));
    console.log(`Body cache saved: ${Object.keys(cache).length} entries`);
  }

  // Build final emails.json — combining envelope from scan + cached body if we have it,
  // otherwise falling back to the pre-existing (possibly truncated) body.
  const emails = scan.map(m => {
    const cached = cache[m.id];
    const html = cached?.html || '';
    let text = cached?.text || cleanText(m.body || '', '');
    if (!text) text = m.snippet || '';
    const orderNumber = extractOrder(text + ' ' + html, m.subject);
    const amount = extractAmount(text);
    const productNames = extractProductNames(html);
    return {
      id: m.id,
      threadId: m.threadId,
      date: m.date,
      dateISO: (() => { const d = new Date(m.date); return isNaN(d) ? null : d.toISOString(); })(),
      from: m.from,
      subject: m.subject,
      snippet: m.snippet,
      orderNumber,
      amount,
      productNames,
      hasHtml: !!html,
      text,
      html,
    };
  });

  // Sort newest first
  emails.sort((a, b) => new Date(b.date) - new Date(a.date));
  fs.writeFileSync(OUT_FILE, JSON.stringify(emails));
  const withOrder = emails.filter(e => e.orderNumber).length;
  console.log(`\n✅ ${OUT_FILE}: ${emails.length} messages, ${withOrder} with orderNumber (${((withOrder/emails.length)*100).toFixed(1)}%)`);
})().catch(e => { console.error(e); process.exit(1); });

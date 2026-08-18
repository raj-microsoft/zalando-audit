// reconcile.mjs — Classify each email, group by orderNumber, derive per-order status.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const EMAILS = path.join(ROOT, 'data', 'emails.json');
const OUT = path.join(ROOT, 'data', 'reconciliation.json');

const emails = JSON.parse(fs.readFileSync(EMAILS, 'utf8'));

// --- classify by subject + text ---
function classify(e) {
  const s = (e.subject || '').toLowerCase();
  const t = ((e.text || '') + ' ' + (e.snippet || '')).toLowerCase();

  // Support threads
  if (/vraag aan zalando|reply to|jouw mening telt|hoe tevreden|customer service|klantenservice|antwoord van zalando/i.test(s)) return 'support';

  // Refund confirmation
  if (/terugbetaald|terugbetaling|refund(ed)?|geld.*terug/.test(s) || /wordt terugbetaald|is terugbetaald|refund has been|money.*refunded/.test(t)) return 'refund';

  // Return lifecycle
  if (/retourzending is goed ontvangen|retour ontvangen|return.*received|we received your return|return.*processed/.test(s + ' ' + t)) return 'return_received';
  if (/retourzending is onderweg|retour.*onderweg|return.*on its way|return.*shipped/.test(s + ' ' + t)) return 'return_transit';
  if (/retourlabel|retour(?:etiket)?|return label|return request|verzendlabel/.test(s)) return 'return_initiated';

  // Cancellation
  if (/is geannuleerd|cancel(?:led|ed)|verkoopbox is geannuleerd|order cancel/.test(s)) return 'cancelled';

  // Payment
  if (/bedankt voor je betaling|payment.*received|betaling ontvangen|betaalherinnering|payment reminder|invoice/.test(s)) {
    if (/herinnering|reminder/.test(s)) return 'reminder';
    return 'payment';
  }

  // Shipment
  if (/is onderweg|is verzonden|shipped|out for delivery|pakket wordt|delivered|geleverd|bezorgd/.test(s)) return 'shipment';

  // Order placed
  if (/bedankt voor je bestelling|thank.*for your order|order confirmation|bestelling.*ontvangen|je bestelling \d/.test(s)) return 'order';

  // Marketing / promo signals
  if (/on sale|afgeprijsd|sale|discount|% off|-\d+%|nu is het|verlanglijst|wishlist|vergeten|complete your order|stock runs out|inspireren|nieuwe collectie|shop de|new arrivals|item alert|notificatie is ingesteld|lounge/i.test(s)) return 'marketing';

  return 'other';
}

// Enrich
for (const e of emails) {
  e.category = classify(e);
  e.ts = e.dateISO ? new Date(e.dateISO).getTime() : new Date(e.date).getTime();
}

// Group by orderNumber
const groups = new Map();
for (const e of emails) {
  const key = e.orderNumber || '__no_order__';
  if (!groups.has(key)) groups.set(key, []);
  groups.get(key).push(e);
}

const orders = [];
for (const [orderNumber, msgs] of groups) {
  msgs.sort((a, b) => a.ts - b.ts);
  const cats = new Set(msgs.map(m => m.category));
  let status = 'no_return';
  if (cats.has('cancelled') && !cats.has('shipment') && !cats.has('return_received')) status = 'cancelled';
  else if (cats.has('refund')) status = 'refunded';
  else if (cats.has('return_received')) status = 'awaiting_refund';
  else if (cats.has('return_transit') || cats.has('return_initiated')) status = 'return_in_transit';
  else if (cats.has('reminder')) status = 'payment_overdue';
  else if (cats.has('order') || cats.has('shipment') || cats.has('payment')) status = 'no_return';
  else status = 'other';

  // Skip synthetic no-order bucket from "orders" tally but still keep for browsing.
  const synthetic = orderNumber === '__no_order__';
  const dates = msgs.map(m => m.ts).filter(Boolean);
  const firstDate = Math.min(...dates);
  const lastDate = Math.max(...dates);

  // Amount: prefer the refund amount if present, else the order/payment amount
  const refundAmt = msgs.find(m => m.category === 'refund')?.amount ?? null;
  const orderAmt = msgs.find(m => ['order', 'payment'].includes(m.category))?.amount ?? null;
  const amount = refundAmt ?? orderAmt ?? msgs.find(m => m.amount != null)?.amount ?? null;

  // Days since return received (for gap detection)
  const returnReceivedTs = msgs.filter(m => m.category === 'return_received').map(m => m.ts).pop();
  const daysSinceReturn = returnReceivedTs ? Math.floor((Date.now() - returnReceivedTs) / 86400000) : null;

  orders.push({
    orderNumber,
    synthetic,
    status,
    firstDate,
    lastDate,
    firstDateISO: new Date(firstDate).toISOString(),
    lastDateISO: new Date(lastDate).toISOString(),
    amount,
    refundAmt,
    orderAmt,
    daysSinceReturn,
    eventCount: msgs.length,
    categories: [...cats],
    hasSupport: cats.has('support'),
    events: msgs.map(m => ({
      id: m.id, date: m.date, dateISO: m.dateISO, category: m.category,
      subject: m.subject, snippet: m.snippet, amount: m.amount,
      hasHtml: m.hasHtml, from: m.from,
    })),
  });
}

// Sort orders by most recent activity
orders.sort((a, b) => b.lastDate - a.lastDate);

// Totals
const real = orders.filter(o => !o.synthetic);
const totals = {
  totalEmails: emails.length,
  totalOrders: real.length,
  refunded: real.filter(o => o.status === 'refunded').length,
  awaitingRefund: real.filter(o => o.status === 'awaiting_refund').length,
  returnInTransit: real.filter(o => o.status === 'return_in_transit').length,
  cancelled: real.filter(o => o.status === 'cancelled').length,
  noReturn: real.filter(o => o.status === 'no_return').length,
  paymentOverdue: real.filter(o => o.status === 'payment_overdue').length,
  reminders: emails.filter(e => e.category === 'reminder').length,
  supportThreads: real.filter(o => o.hasSupport).length,
  awaitingRefundTotalEUR: real
    .filter(o => o.status === 'awaiting_refund')
    .reduce((sum, o) => sum + (o.amount || 0), 0),
  categoryCounts: emails.reduce((acc, e) => { acc[e.category] = (acc[e.category] || 0) + 1; return acc; }, {}),
};

fs.writeFileSync(OUT, JSON.stringify({ generatedAt: new Date().toISOString(), totals, orders }));
console.log(`✅ ${OUT}`);
console.log('Totals:', totals);

// Top-5 most recent awaiting_refund
const topGaps = real.filter(o => o.status === 'awaiting_refund').slice(0, 5);
console.log('\nTop 5 most-recent awaiting_refund:');
for (const o of topGaps) {
  console.log(`  ${o.orderNumber}  last=${o.lastDateISO?.slice(0,10)}  daysSinceReturn=${o.daysSinceReturn}  amt=${o.amount ?? '—'}`);
}

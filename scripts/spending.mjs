// Compute spending totals from 2022 onwards, split by retailer.
// Writes data/spending.json for the /spending page to consume.

import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(new URL('..', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1'));
const IN  = path.join(ROOT, 'data', 'reconciliation.json');
const OUT = path.join(ROOT, 'data', 'spending.json');

const data = JSON.parse(fs.readFileSync(IN, 'utf8'));
const orders = data.orders;

const CUTOFF = new Date('2022-01-01T00:00:00Z').getTime();

function retailerOf(order) {
  // Any event from a *zalando-lounge* address → Lounge
  for (const e of order.events || []) {
    const f = (e.from || '').toLowerCase();
    if (f.includes('zalando-lounge') || f.includes('lounge.zalando')) return 'lounge';
  }
  return 'zalando';
}

const buckets = {
  zalando: { orderCount: 0, orderTotal: 0, refundedCount: 0, refundedTotal: 0, awaitingCount: 0, awaitingTotal: 0, cancelledCount: 0, byYear: {} },
  lounge:  { orderCount: 0, orderTotal: 0, refundedCount: 0, refundedTotal: 0, awaitingCount: 0, awaitingTotal: 0, cancelledCount: 0, byYear: {} },
};

let skippedPre2022 = 0;
let skippedSynthetic = 0;

for (const o of orders) {
  if (o.synthetic) { skippedSynthetic++; continue; }
  const first = new Date(o.firstDateISO || o.firstDate).getTime();
  if (!first || first < CUTOFF) { skippedPre2022++; continue; }

  const r = retailerOf(o);
  const b = buckets[r];
  const year = new Date(first).getUTCFullYear();
  b.byYear[year] ??= { orderCount: 0, orderTotal: 0, refundedTotal: 0, awaitingTotal: 0 };

  // Best-guess order value: orderAmt > amount > refundAmt (last resort)
  const orderValue = o.orderAmt ?? o.amount ?? o.refundAmt ?? 0;
  b.orderCount++;
  b.byYear[year].orderCount++;
  if (orderValue > 0 && o.status !== 'cancelled') {
    b.orderTotal += orderValue;
    b.byYear[year].orderTotal += orderValue;
  }

  if (o.status === 'refunded') {
    const refunded = o.refundAmt ?? orderValue ?? 0;
    b.refundedCount++;
    b.refundedTotal += refunded;
    b.byYear[year].refundedTotal += refunded;
  } else if (o.status === 'awaiting_refund') {
    const owed = o.refundAmt ?? o.amount ?? o.orderAmt ?? 0;
    b.awaitingCount++;
    b.awaitingTotal += owed;
    b.byYear[year].awaitingTotal += owed;
  } else if (o.status === 'cancelled') {
    b.cancelledCount++;
  }
}

// Round
function round(x) { return Math.round(x * 100) / 100; }
for (const r of ['zalando', 'lounge']) {
  const b = buckets[r];
  b.orderTotal = round(b.orderTotal);
  b.refundedTotal = round(b.refundedTotal);
  b.awaitingTotal = round(b.awaitingTotal);
  b.netSpend = round(b.orderTotal - b.refundedTotal);
  for (const y of Object.keys(b.byYear)) {
    b.byYear[y].orderTotal = round(b.byYear[y].orderTotal);
    b.byYear[y].refundedTotal = round(b.byYear[y].refundedTotal);
    b.byYear[y].awaitingTotal = round(b.byYear[y].awaitingTotal);
    b.byYear[y].netSpend = round(b.byYear[y].orderTotal - b.byYear[y].refundedTotal);
  }
}

const combined = {
  orderCount: buckets.zalando.orderCount + buckets.lounge.orderCount,
  orderTotal: round(buckets.zalando.orderTotal + buckets.lounge.orderTotal),
  refundedCount: buckets.zalando.refundedCount + buckets.lounge.refundedCount,
  refundedTotal: round(buckets.zalando.refundedTotal + buckets.lounge.refundedTotal),
  awaitingCount: buckets.zalando.awaitingCount + buckets.lounge.awaitingCount,
  awaitingTotal: round(buckets.zalando.awaitingTotal + buckets.lounge.awaitingTotal),
  cancelledCount: buckets.zalando.cancelledCount + buckets.lounge.cancelledCount,
  netSpend: round(buckets.zalando.netSpend + buckets.lounge.netSpend),
};

const out = {
  generatedAt: new Date().toISOString(),
  cutoff: '2022-01-01',
  meta: { skippedPre2022, skippedSynthetic, totalOrdersInSource: orders.length },
  buckets, combined,
};
fs.writeFileSync(OUT, JSON.stringify(out, null, 2));
console.log('Wrote', OUT);
console.log(JSON.stringify({ combined, zalando: {orderCount:buckets.zalando.orderCount, orderTotal:buckets.zalando.orderTotal, refundedTotal:buckets.zalando.refundedTotal}, lounge: {orderCount:buckets.lounge.orderCount, orderTotal:buckets.lounge.orderTotal, refundedTotal:buckets.lounge.refundedTotal}, meta: out.meta }, null, 2));

import { getReconciliation, getEmails } from "@/lib/data";
import { fmtDate, CATEGORY_CLASS } from "@/lib/format";
import Link from "next/link";

export default function SupportPage() {
  const emails = getEmails();
  const { orders } = getReconciliation();
  const supportEmails = emails.filter(e => {
    const s = (e.subject || "").toLowerCase();
    return /vraag aan zalando|jouw mening|klantenservice|antwoord van zalando|reply to/.test(s);
  });

  // Group by orderNumber (or "no order" bucket)
  const grouped = new Map<string, typeof supportEmails>();
  for (const e of supportEmails) {
    const k = e.orderNumber || "__no_order__";
    if (!grouped.has(k)) grouped.set(k, []);
    grouped.get(k)!.push(e);
  }
  const groups = [...grouped.entries()]
    .map(([orderNumber, msgs]) => {
      msgs.sort((a, b) => +new Date(b.date) - +new Date(a.date));
      return { orderNumber, msgs, order: orders.find(o => o.orderNumber === orderNumber) };
    })
    .sort((a, b) => +new Date(b.msgs[0].date) - +new Date(a.msgs[0].date));

  return (
    <div className="space-y-8">
      <div>
        <div className="text-xs uppercase tracking-widest muted">Support</div>
        <h1 className="mt-1 text-3xl font-serif tracking-tight">
          {supportEmails.length} support messages · {groups.length} threads
        </h1>
        <p className="mt-2 muted text-sm max-w-2xl">
          Every "Je vraag aan Zalando…" thread and customer service reply Manasa has received, grouped by order.
        </p>
      </div>

      <div className="space-y-6">
        {groups.map(g => (
          <div key={g.orderNumber} className="card rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                {g.orderNumber !== "__no_order__" ? (
                  <Link href={`/orders/${g.orderNumber}`} className="font-mono text-sm hover:text-zalando">
                    {g.orderNumber}
                  </Link>
                ) : (
                  <span className="muted text-sm">No order number</span>
                )}
                {g.order && <span className="ml-3 text-xs muted">status: {g.order.status.replace(/_/g," ")}</span>}
              </div>
              <span className="text-xs muted">{g.msgs.length} message{g.msgs.length === 1 ? "" : "s"}</span>
            </div>
            <ul className="space-y-2">
              {g.msgs.map(m => (
                <li key={m.id} className="flex items-start gap-3 text-sm">
                  <span className={`shrink-0 text-[10px] uppercase px-2 py-0.5 rounded ${CATEGORY_CLASS.support}`}>support</span>
                  <div className="flex-1 min-w-0">
                    <div className="truncate">{m.subject}</div>
                    <div className="text-xs muted mt-0.5">{fmtDate(m.dateISO || m.date)} · {m.from}</div>
                    {m.snippet && <p className="text-xs muted mt-1 line-clamp-2">{m.snippet}</p>}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

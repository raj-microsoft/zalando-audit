import { getReconciliation } from "@/lib/data";
import { OrdersTable } from "@/components/orders-table";

export default function OrdersPage() {
  const { orders } = getReconciliation();
  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs uppercase tracking-widest muted">Orders</div>
        <h1 className="mt-1 text-3xl font-serif tracking-tight">All orders</h1>
      </div>
      <OrdersTable orders={orders} />
    </div>
  );
}

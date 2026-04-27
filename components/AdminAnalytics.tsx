"use client";

type AnalyticsOrder = {
  id: string;
  created_at: string;
  pickup_date: string;
  quantity: number;
  flavor: string;
  total_price: number;
  status: string;
  fulfillment_type: string;
  customer_name: string;
  customer_email: string;
};

export default function AdminAnalytics({ orders }: { orders: AnalyticsOrder[] }) {
  const now = new Date();

  const nonCancelled = orders.filter((o) => o.status !== "cancelled");

  const thisMonthOrders = orders.filter((o) => {
    const d = new Date(o.created_at);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const thisMonthRevenue = thisMonthOrders
    .filter((o) => o.status !== "cancelled")
    .reduce((sum, o) => sum + Number(o.total_price), 0);

  const totalRevenue = nonCancelled.reduce((sum, o) => sum + Number(o.total_price), 0);
  const activeOrders = orders.filter((o) => !["delivered", "cancelled"].includes(o.status));
  const totalCupcakes = nonCancelled.reduce((sum, o) => sum + o.quantity, 0);
  const avgOrder = nonCancelled.length > 0 ? totalRevenue / nonCancelled.length : 0;

  // Flavor breakdown
  const flavorCounts = orders.reduce<Record<string, number>>((acc, o) => {
    acc[o.flavor] = (acc[o.flavor] ?? 0) + 1;
    return acc;
  }, {});
  const totalOrders = orders.length || 1;

  // Quantity breakdown
  const qtyCounts = orders.reduce<Record<number, number>>((acc, o) => {
    acc[o.quantity] = (acc[o.quantity] ?? 0) + 1;
    return acc;
  }, {});

  // Status breakdown
  const statusCounts = orders.reduce<Record<string, number>>((acc, o) => {
    acc[o.status] = (acc[o.status] ?? 0) + 1;
    return acc;
  }, {});

  // Fulfillment breakdown
  const deliveryCount = orders.filter((o) => o.fulfillment_type === "delivery").length;
  const pickupCount = orders.filter((o) => o.fulfillment_type === "pickup").length;

  // Last 6 months revenue chart data
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const label = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
    const monthRevenue = nonCancelled
      .filter((o) => {
        const od = new Date(o.created_at);
        return od.getMonth() === d.getMonth() && od.getFullYear() === d.getFullYear();
      })
      .reduce((s, o) => s + Number(o.total_price), 0);
    const count = orders.filter((o) => {
      const od = new Date(o.created_at);
      return (
        od.getMonth() === d.getMonth() &&
        od.getFullYear() === d.getFullYear() &&
        o.status !== "cancelled"
      );
    }).length;
    return { label, revenue: monthRevenue, count };
  });
  const maxRevenue = Math.max(...months.map((m) => m.revenue), 1);

  // Top customers
  const customerMap: Record<string, { name: string; count: number; revenue: number }> = {};
  nonCancelled.forEach((o) => {
    if (!customerMap[o.customer_email]) {
      customerMap[o.customer_email] = { name: o.customer_name, count: 0, revenue: 0 };
    }
    customerMap[o.customer_email].count++;
    customerMap[o.customer_email].revenue += Number(o.total_price);
  });
  const topCustomers = Object.values(customerMap)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="font-cormorant italic text-berry text-4xl font-medium">Analytics</h1>
        <p className="font-im-fell italic text-plum/60 text-sm mt-1">Your bakery at a glance</p>
      </div>

      {/* KPI row 1 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard label="All-time Orders" value={orders.length.toString()} />
        <KPICard label="This Month" value={thisMonthOrders.length.toString()} />
        <KPICard label="All-time Revenue" value={`$${totalRevenue.toLocaleString()}`} />
        <KPICard label="Month Revenue" value={`$${thisMonthRevenue.toLocaleString()}`} />
      </div>

      {/* KPI row 2 */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <KPICard label="Active Orders" value={activeOrders.length.toString()} />
        <KPICard label="Avg Order Value" value={`$${Math.round(avgOrder)}`} />
        <KPICard label="Total Cupcakes Baked" value={totalCupcakes.toLocaleString()} />
      </div>

      {/* Revenue chart */}
      <div className="card">
        <h2 className="font-cormorant italic text-berry text-2xl font-medium mb-6">
          Revenue — last 6 months
        </h2>
        <div className="flex items-end gap-2 md:gap-3 h-40">
          {months.map((m) => (
            <div key={m.label} className="flex-1 flex flex-col items-center gap-1.5">
              <span className="font-im-fell-sc text-plum/50 text-xs text-center leading-tight">
                {m.revenue > 0 ? `$${m.revenue}` : ""}
              </span>
              <div
                className="w-full rounded-t-lg overflow-hidden bg-pink-soft/30"
                style={{ height: `${Math.max((m.revenue / maxRevenue) * 112, 4)}px` }}
              >
                <div className="h-full bg-gradient-to-t from-rose/70 to-rose-light/50 rounded-t-lg" />
              </div>
              <span className="font-im-fell-sc text-plum/40 text-xs text-center">{m.label}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-6 mt-4 pt-4 border-t border-border-pink">
          {months.map((m) => (
            <div key={m.label} className="flex-1 text-center">
              <p className="font-im-fell-sc text-plum/40 text-xs">{m.count} orders</p>
            </div>
          ))}
        </div>
      </div>

      {/* Breakdowns */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Flavors */}
        <div className="card">
          <h3 className="font-cormorant italic text-berry text-xl font-medium mb-4">Flavors</h3>
          <div className="space-y-3">
            {Object.entries(flavorCounts)
              .sort((a, b) => b[1] - a[1])
              .map(([flavor, count]) => (
                <div key={flavor}>
                  <div className="flex justify-between mb-1">
                    <span className="font-im-fell italic text-plum capitalize">{flavor}</span>
                    <span className="font-im-fell-sc text-plum/50 text-xs">
                      {count} ({Math.round((count / totalOrders) * 100)}%)
                    </span>
                  </div>
                  <div className="h-2 bg-border-pink rounded-full overflow-hidden">
                    <div
                      className="h-full bg-rose/60 rounded-full transition-all"
                      style={{ width: `${(count / totalOrders) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Quantities */}
        <div className="card">
          <h3 className="font-cormorant italic text-berry text-xl font-medium mb-4">
            Quantities
          </h3>
          <div className="space-y-3">
            {Object.entries(qtyCounts)
              .sort((a, b) => Number(b[0]) - Number(a[0]))
              .map(([qty, count]) => (
                <div key={qty}>
                  <div className="flex justify-between mb-1">
                    <span className="font-im-fell italic text-plum">{qty} cupcakes</span>
                    <span className="font-im-fell-sc text-plum/50 text-xs">
                      {count} ({Math.round((count / totalOrders) * 100)}%)
                    </span>
                  </div>
                  <div className="h-2 bg-border-pink rounded-full overflow-hidden">
                    <div
                      className="h-full bg-lavender/70 rounded-full transition-all"
                      style={{ width: `${(count / totalOrders) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Status + fulfillment */}
        <div className="card space-y-6">
          <div>
            <h3 className="font-cormorant italic text-berry text-xl font-medium mb-4">
              By Status
            </h3>
            <div className="space-y-2">
              {Object.entries(statusCounts).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <span className="font-im-fell italic text-plum capitalize">
                    {status.replace("_", " ")}
                  </span>
                  <span className="font-im-fell-sc bg-pink-soft/40 text-plum text-xs px-2 py-0.5 rounded-pill">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="pt-4 border-t border-border-pink">
            <h3 className="font-cormorant italic text-berry text-xl font-medium mb-4">
              Fulfillment
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-im-fell italic text-plum">Pickup</span>
                <span className="font-im-fell-sc bg-butter/40 text-amber-800 text-xs px-2 py-0.5 rounded-pill">
                  {pickupCount}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-im-fell italic text-plum">Delivery</span>
                <span className="font-im-fell-sc bg-lavender/40 text-purple-800 text-xs px-2 py-0.5 rounded-pill">
                  {deliveryCount}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top customers */}
      {topCustomers.length > 0 && (
        <div className="card">
          <h2 className="font-cormorant italic text-berry text-2xl font-medium mb-1">
            Top Customers
          </h2>
          <p className="font-im-fell italic text-plum/50 text-sm mb-4">By number of orders</p>
          <div className="divide-y divide-border-pink">
            {topCustomers.map((c, i) => (
              <div key={c.name + i} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <span className="font-cormorant italic text-berry text-2xl font-medium w-7">
                    #{i + 1}
                  </span>
                  <span className="font-im-fell italic text-plum">{c.name}</span>
                </div>
                <div className="text-right">
                  <p className="font-cormorant italic text-berry font-medium">
                    ${c.revenue.toLocaleString()}
                  </p>
                  <p className="font-im-fell-sc text-plum/40 text-xs">
                    {c.count} order{c.count !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function KPICard({ label, value }: { label: string; value: string }) {
  return (
    <div className="card text-center py-5">
      <p className="font-im-fell-sc text-plum/50 text-xs uppercase tracking-widest mb-1">
        {label}
      </p>
      <p className="font-cormorant italic text-berry text-4xl font-medium">{value}</p>
    </div>
  );
}

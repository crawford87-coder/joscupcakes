"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Status =
  | "new"
  | "awaiting_payment"
  | "confirmed"
  | "in_progress"
  | "ready"
  | "delivered"
  | "cancelled";

interface Order {
  id: string;
  reference_number: string;
  created_at: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  pickup_date: string;
  fulfillment_type: string;
  delivery_address: string | null;
  quantity: number;
  flavor: string;
  icing_colors: string[];
  topper: boolean;
  topper_description: string | null;
  sprinkles_or_glitter: string | null;
  notes: string | null;
  total_price: number;
  pickup_time: string | null;
  status: Status;
}

const STATUS_LABELS: Record<Status, string> = {
  new: "New",
  awaiting_payment: "Awaiting Payment",
  confirmed: "Confirmed",
  in_progress: "In Progress",
  ready: "Ready",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const STATUS_COLORS: Record<Status, string> = {
  new: "bg-butter/40 text-amber-800 border-butter",
  awaiting_payment: "bg-orange-100 text-orange-800 border-orange-200",
  confirmed: "bg-mint/40 text-teal-800 border-mint",
  in_progress: "bg-lavender/40 text-purple-800 border-lavender",
  ready: "bg-green-100 text-green-800 border-green-200",
  delivered: "bg-gray-100 text-gray-600 border-gray-200",
  cancelled: "bg-red-50 text-red-600 border-red-200",
};

export default function AdminDashboard({ orders: initialOrders }: { orders: Order[] }) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<Status | "all">("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const router = useRouter();
  const supabase = createClient();

  // This-week stats
  const thisWeek = useMemo(() => {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    return orders.filter((o) => {
      if (o.status === "cancelled") return false;
      const d = new Date(o.pickup_date);
      return d >= weekStart && d <= weekEnd;
    });
  }, [orders]);

  const thisWeekCupcakes = thisWeek.reduce((sum, o) => sum + o.quantity, 0);

  // Filtered orders
  const filtered = useMemo(() => {
    return orders.filter((o) => {
      if (statusFilter !== "all" && o.status !== statusFilter) return false;
      if (dateFrom && o.pickup_date < dateFrom) return false;
      if (dateTo && o.pickup_date > dateTo) return false;
      return true;
    });
  }, [orders, statusFilter, dateFrom, dateTo]);

  async function updateStatus(id: string, status: Status) {
    const res = await fetch(`/api/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setOrders((prev) =>
        prev.map((o) => (o.id === id ? { ...o, status } : o))
      );
    }
  }

  const [sendingPayment, setSendingPayment] = useState<Record<string, boolean>>({});
  const [paymentSent, setPaymentSent] = useState<Record<string, boolean>>({});

  async function sendPaymentRequest(id: string) {
    setSendingPayment((p) => ({ ...p, [id]: true }));
    const res = await fetch(`/api/admin/orders/${id}/payment-link`, {
      method: "POST",
    });
    setSendingPayment((p) => ({ ...p, [id]: false }));
    if (res.ok) {
      setPaymentSent((p) => ({ ...p, [id]: true }));
      setOrders((prev) =>
        prev.map((o) => (o.id === id ? { ...o, status: "awaiting_payment" } : o))
      );
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/admin/login");
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="font-cormorant italic text-berry text-4xl font-medium">
            Orders
          </h1>
          <p className="font-im-fell italic text-plum/60 text-sm mt-1">
            Jo&apos;s Cupcakes — Admin Hub
          </p>
        </div>
        <button
          onClick={handleSignOut}
          className="font-im-fell-sc text-plum/60 text-sm hover:text-rose transition-colors"
        >
          Sign out
        </button>
      </div>

      {/* This week */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="card text-center">
          <p className="font-im-fell-sc text-plum/50 text-xs uppercase tracking-widest mb-1">
            This week — orders
          </p>
          <p className="font-cormorant italic text-berry text-5xl font-medium">
            {thisWeek.length}
          </p>
        </div>
        <div className="card text-center">
          <p className="font-im-fell-sc text-plum/50 text-xs uppercase tracking-widest mb-1">
            This week — cupcakes to bake
          </p>
          <p className="font-cormorant italic text-berry text-5xl font-medium">
            {thisWeekCupcakes}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-6 flex flex-wrap gap-4 items-end">
        <div className="flex flex-wrap gap-2">
          {(["all", "new", "confirmed", "in_progress", "ready", "delivered", "cancelled"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`font-im-fell-sc text-xs px-3 py-1.5 rounded-pill border-2 transition-colors capitalize ${
                statusFilter === s
                  ? "border-rose bg-rose text-white"
                  : "border-border-pink text-plum hover:border-rose-light"
              }`}
            >
              {s === "all" ? "All" : STATUS_LABELS[s as Status]}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-im-fell-sc text-plum text-xs">From</span>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="rounded-lg border-2 border-border-pink px-3 py-1.5 text-sm text-plum font-im-fell italic outline-none focus:border-rose"
          />
          <span className="font-im-fell-sc text-plum text-xs">To</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="rounded-lg border-2 border-border-pink px-3 py-1.5 text-sm text-plum font-im-fell italic outline-none focus:border-rose"
          />
        </div>
      </div>

      {/* Orders — desktop table */}
      <div className="hidden md:block card overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-border-pink">
              {["Ref #", "Customer", "Pickup Date", "Qty", "Total", "Status", "Actions"].map(
                (h) => (
                  <th
                    key={h}
                    className="font-im-fell-sc text-plum/60 text-xs tracking-widest text-left px-4 py-3 uppercase"
                  >
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="font-im-fell italic text-plum/50 text-center py-12">
                  No orders found.
                </td>
              </tr>
            )}
            {filtered.map((order) => (
              <React.Fragment key={order.id}>
                <tr
                  onClick={() =>
                    setExpandedId(expandedId === order.id ? null : order.id)
                  }
                  className="border-b border-border-pink hover:bg-pink-soft/10 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3 font-im-fell-sc text-plum text-xs">
                    {order.reference_number}
                  </td>
                  <td className="px-4 py-3 font-im-fell italic text-plum">
                    {order.customer_name}
                  </td>
                  <td className="px-4 py-3 font-im-fell italic text-plum">
                    {new Date(order.pickup_date + "T12:00:00").toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3 font-cormorant text-berry text-lg font-medium">
                    {order.quantity}
                  </td>
                  <td className="px-4 py-3 font-cormorant text-berry text-lg font-medium">
                    ${order.total_price}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={order.status}
                      onChange={(e) => {
                        e.stopPropagation();
                        updateStatus(order.id, e.target.value as Status);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className={`font-im-fell-sc text-xs px-2 py-1 rounded-lg border-2 outline-none cursor-pointer ${
                        STATUS_COLORS[order.status]
                      }`}
                    >
                      {Object.entries(STATUS_LABELS).map(([val, label]) => (
                        <option key={val} value={val}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    {order.status === "new" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          sendPaymentRequest(order.id);
                        }}
                        disabled={sendingPayment[order.id]}
                        className="font-im-fell-sc text-xs px-3 py-1.5 rounded-pill bg-rose/20 text-rose border-2 border-rose/40 hover:bg-rose/30 transition-colors disabled:opacity-60"
                      >
                        {sendingPayment[order.id] ? "Sending…" : paymentSent[order.id] ? "✓ Sent" : "Send Payment Request"}
                      </button>
                    )}
                    {order.status === "awaiting_payment" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          sendPaymentRequest(order.id);
                        }}
                        disabled={sendingPayment[order.id]}
                        className="font-im-fell-sc text-xs px-3 py-1.5 rounded-pill bg-orange-100 text-orange-800 border-2 border-orange-200 hover:bg-orange-200 transition-colors disabled:opacity-60"
                      >
                        {sendingPayment[order.id] ? "Sending…" : "Resend Link"}
                      </button>
                    )}
                  </td>
                </tr>

                {/* Expanded row */}
                {expandedId === order.id && (
                  <tr key={`${order.id}-detail`} className="bg-pink-soft/5">
                    <td colSpan={7} className="px-6 py-5">
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Detail label="Email" value={order.customer_email} />
                          <Detail label="Phone" value={order.customer_phone} />
                          <Detail label="Flavor" value={order.flavor} />
                          <Detail
                            label="Icing colors"
                            value={order.icing_colors?.join(", ") || "—"}
                          />
                          <Detail
                            label="Topper"
                            value={
                              order.topper
                                ? order.topper_description ?? "Yes"
                                : "No"
                            }
                          />
                          <Detail
                            label="Extras"
                            value={order.sprinkles_or_glitter ?? "None"}
                          />
                        </div>
                        <div className="space-y-2">
                          <Detail label="Fulfillment" value={order.fulfillment_type} />
                          {order.pickup_time && (
                            <Detail label="Preferred time" value={order.pickup_time} />
                          )}
                          {order.delivery_address && (
                            <Detail label="Address" value={order.delivery_address} />
                          )}
                          <Detail
                            label="Notes"
                            value={order.notes || "None"}
                          />
                          <Detail
                            label="Ordered at"
                            value={new Date(order.created_at).toLocaleString("en-US")}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Orders — mobile cards */}
      <div className="md:hidden space-y-4">
        {filtered.length === 0 && (
          <div className="card text-center py-10">
            <p className="font-im-fell italic text-plum/50">No orders found.</p>
          </div>
        )}
        {filtered.map((order) => (
          <div key={order.id} className="card space-y-3">
            {/* Top row */}
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-im-fell italic text-plum font-medium text-lg leading-tight">
                  {order.customer_name}
                </p>
                <p className="font-im-fell-sc text-plum/50 text-xs mt-0.5">
                  {order.reference_number}
                </p>
              </div>
              <span className={`font-im-fell-sc text-xs px-2 py-1 rounded-lg border-2 whitespace-nowrap ${STATUS_COLORS[order.status]}`}>
                {STATUS_LABELS[order.status]}
              </span>
            </div>

            {/* Key details */}
            <div className="flex gap-4 text-center">
              <div>
                <p className="font-cormorant italic text-berry text-2xl font-medium">{order.quantity}</p>
                <p className="font-im-fell-sc text-plum/50 text-xs capitalize">{order.flavor}</p>
              </div>
              <div className="border-l border-border-pink" />
              <div>
                <p className="font-cormorant italic text-berry text-2xl font-medium">${order.total_price}</p>
                <p className="font-im-fell-sc text-plum/50 text-xs">Total</p>
              </div>
              <div className="border-l border-border-pink" />
              <div>
                <p className="font-cormorant italic text-berry text-2xl font-medium">
                  {new Date(order.pickup_date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </p>
                <p className="font-im-fell-sc text-plum/50 text-xs">Pickup</p>
              </div>
            </div>

            {/* Status + actions */}
            <div className="flex items-center gap-3 flex-wrap">
              <select
                value={order.status}
                onChange={(e) => updateStatus(order.id, e.target.value as Status)}
                className={`font-im-fell-sc text-xs px-2 py-1.5 rounded-lg border-2 outline-none flex-1 ${STATUS_COLORS[order.status]}`}
              >
                {Object.entries(STATUS_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
              {order.status === "new" && (
                <button
                  onClick={() => sendPaymentRequest(order.id)}
                  disabled={sendingPayment[order.id]}
                  className="font-im-fell-sc text-xs px-3 py-1.5 rounded-pill bg-rose/20 text-rose border-2 border-rose/40 hover:bg-rose/30 transition-colors disabled:opacity-60"
                >
                  {sendingPayment[order.id] ? "Sending…" : paymentSent[order.id] ? "✓ Sent" : "Send Payment Request"}
                </button>
              )}
              {order.status === "awaiting_payment" && (
                <button
                  onClick={() => sendPaymentRequest(order.id)}
                  disabled={sendingPayment[order.id]}
                  className="font-im-fell-sc text-xs px-3 py-1.5 rounded-pill bg-orange-100 text-orange-800 border-2 border-orange-200 hover:bg-orange-200 transition-colors disabled:opacity-60"
                >
                  {sendingPayment[order.id] ? "Sending…" : "Resend Link"}
                </button>
              )}
            </div>

            {/* Expand toggle */}
            <button
              onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
              className="font-im-fell-sc text-xs text-plum/50 hover:text-rose transition-colors uppercase tracking-widest w-full text-center pt-1"
            >
              {expandedId === order.id ? "▲ Hide details" : "▼ Show details"}
            </button>

            {/* Expanded details */}
            {expandedId === order.id && (
              <div className="border-t border-dashed border-border-pink pt-3 space-y-2">
                <Detail label="Email" value={order.customer_email} />
                <Detail label="Phone" value={order.customer_phone} />
                <Detail label="Icing" value={order.icing_colors?.join(", ") || "—"} />
                <Detail label="Topper" value={order.topper ? (order.topper_description ?? "Yes") : "No"} />
                <Detail label="Extras" value={order.sprinkles_or_glitter ?? "None"} />
                {order.delivery_address && <Detail label="Address" value={order.delivery_address} />}
                <Detail label="Notes" value={order.notes || "None"} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="font-im-fell-sc text-plum/50 text-xs uppercase tracking-wide w-28 shrink-0">
        {label}
      </span>
      <span className="font-im-fell italic text-plum text-sm">{value}</span>
    </div>
  );
}

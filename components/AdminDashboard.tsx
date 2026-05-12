"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import AdminOrderDrawer from "@/components/AdminOrderDrawer";

type Status =
  | "new"
  | "quoting"
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
  quoting: "Quoting",
  awaiting_payment: "Awaiting payment",
  confirmed: "Confirmed",
  in_progress: "In progress",
  ready: "Ready",
  delivered: "Delivered",
  cancelled: "Canceled",
};

const STATUS_COLORS: Record<Status, string> = {
  new: "bg-butter/30 text-amber-700 border-butter",
  quoting: "bg-lavender/30 text-purple-700 border-lavender",
  awaiting_payment: "bg-wc-peach/40 text-orange-700 border-wc-peach",
  confirmed: "bg-mint/30 text-teal-700 border-mint",
  in_progress: "bg-lavender/40 text-purple-800 border-lavender",
  ready: "bg-mint/40 text-teal-800 border-mint",
  delivered: "bg-gray-100 text-gray-500 border-gray-200",
  cancelled: "bg-red-50 text-red-400 border-red-200",
};

const BUCKETS: {
  id: string;
  label: string;
  statuses: Status[];
  defaultOpen: boolean;
  muted?: boolean;
}[] = [
  { id: "new", label: "New", statuses: ["new"], defaultOpen: true },
  { id: "quoting", label: "Quoting", statuses: ["quoting"], defaultOpen: true },
  { id: "awaiting_payment", label: "Awaiting payment", statuses: ["awaiting_payment"], defaultOpen: true },
  { id: "confirmed", label: "Confirmed", statuses: ["confirmed", "in_progress", "ready"], defaultOpen: false },
  { id: "delivered", label: "Delivered", statuses: ["delivered"], defaultOpen: false },
  { id: "cancelled", label: "Canceled", statuses: ["cancelled"], defaultOpen: false, muted: true },
];

export default function AdminDashboard({ orders: initialOrders }: { orders: Order[] }) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [drawerOrderId, setDrawerOrderId] = useState<string | null>(null);
  const [openBuckets, setOpenBuckets] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    BUCKETS.forEach((b) => { init[b.id] = b.defaultOpen; });
    return init;
  });
  const router = useRouter();
  const supabase = createClient();

  const drawerOrder = drawerOrderId
    ? orders.find((o) => o.id === drawerOrderId) ?? null
    : null;

  function toggleBucket(id: string) {
    setOpenBuckets((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function handleDrawerStatusChange(id: string, status: string) {
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status: status as Status } : o))
    );
  }

  async function updateStatus(id: string, status: Status) {
    const res = await fetch(`/api/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
    }
  }

  const [sendingPayment, setSendingPayment] = useState<Record<string, boolean>>({});
  const [paymentSent, setPaymentSent] = useState<Record<string, boolean>>({});

  async function sendPaymentRequest(id: string) {
    setSendingPayment((p) => ({ ...p, [id]: true }));
    const res = await fetch(`/api/admin/orders/${id}/payment-link`, { method: "POST" });
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
    <>
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="font-cormorant italic text-berry text-4xl font-medium">Orders</h1>
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

        {/* Bucket sections */}
        <div className="space-y-3">
          {BUCKETS.map((bucket) => {
            const bucketOrders = [...orders.filter((o) => bucket.statuses.includes(o.status))].sort(
              (a, b) => a.pickup_date.localeCompare(b.pickup_date)
            );
            const isOpen = openBuckets[bucket.id];

            return (
              <section key={bucket.id}>
                {/* Bucket header */}
                <button
                  onClick={() => toggleBucket(bucket.id)}
                  className="w-full flex items-center justify-between px-5 py-3.5 rounded-2xl border transition-colors hover:bg-pink-soft/10"
                  style={{
                    backgroundColor: bucket.muted ? "#F0EBE6" : "#FAF7F2",
                    borderColor: "#E8DDD4",
                  }}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`font-im-fell-sc text-sm uppercase tracking-widest ${
                        bucket.muted ? "text-plum/40" : "text-plum"
                      }`}
                    >
                      {bucket.label}
                    </span>
                    {bucketOrders.length > 0 && (
                      <span
                        className="font-im-fell-sc text-xs rounded-full flex items-center justify-center"
                        style={{
                          minWidth: 20,
                          height: 20,
                          padding: "0 5px",
                          backgroundColor: bucket.muted
                            ? "rgba(107,37,71,0.06)"
                            : "rgba(180,88,140,0.12)",
                          color: bucket.muted ? "#9A7888" : "#B5588C",
                        }}
                      >
                        {bucketOrders.length}
                      </span>
                    )}
                  </div>
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                    aria-hidden="true"
                    style={{
                      transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform 0.2s",
                      color: "rgba(74,48,80,0.35)",
                    }}
                  >
                    <path
                      d="M2 4L6 8L10 4"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>

                {/* Bucket content */}
                {isOpen && (
                  <div className="mt-2">
                    {bucketOrders.length === 0 ? (
                      <p className="font-im-fell italic text-plum/30 text-sm text-center py-5">
                        No orders
                      </p>
                    ) : (
                      <>
                        {/* Desktop table */}
                        <div className="hidden md:block card overflow-x-auto p-0">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b-2 border-border-pink">
                                {["Ref #", "Customer", "Pickup", "Qty", "Total", "Status", "Actions"].map(
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
                              {bucketOrders.map((order) => (
                                <tr
                                  key={order.id}
                                  onClick={() => setDrawerOrderId(order.id)}
                                  className="border-b border-border-pink hover:bg-pink-soft/10 cursor-pointer transition-colors"
                                >
                                  <td className="px-4 py-3 font-im-fell-sc text-plum text-xs">
                                    {order.reference_number}
                                  </td>
                                  <td className="px-4 py-3 font-im-fell italic text-plum">
                                    {order.customer_name}
                                  </td>
                                  <td className="px-4 py-3 font-im-fell italic text-plum">
                                    {new Date(order.pickup_date + "T12:00:00").toLocaleDateString(
                                      "en-US",
                                      { month: "short", day: "numeric" }
                                    )}
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
                                      className={`font-im-fell-sc text-xs px-2 py-1 rounded-lg border-2 outline-none cursor-pointer ${STATUS_COLORS[order.status]}`}
                                    >
                                      {Object.entries(STATUS_LABELS).map(([val, label]) => (
                                        <option key={val} value={val}>
                                          {label}
                                        </option>
                                      ))}
                                    </select>
                                  </td>
                                  <td className="px-4 py-3">
                                    {(order.status === "new" || order.status === "quoting") && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          sendPaymentRequest(order.id);
                                        }}
                                        disabled={sendingPayment[order.id]}
                                        className="font-im-fell-sc text-xs px-3 py-1.5 rounded-pill bg-rose/20 text-rose border-2 border-rose/40 hover:bg-rose/30 transition-colors disabled:opacity-60"
                                      >
                                        {sendingPayment[order.id]
                                          ? "Sending…"
                                          : paymentSent[order.id]
                                          ? "✓ Sent"
                                          : "Send payment request"}
                                      </button>
                                    )}
                                    {order.status === "awaiting_payment" && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          sendPaymentRequest(order.id);
                                        }}
                                        disabled={sendingPayment[order.id]}
                                        className="font-im-fell-sc text-xs px-3 py-1.5 rounded-pill bg-wc-peach/30 text-orange-700 border-2 border-wc-peach hover:bg-wc-peach/50 transition-colors disabled:opacity-60"
                                      >
                                        {sendingPayment[order.id] ? "Sending…" : "Resend link"}
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Mobile cards */}
                        <div className="md:hidden space-y-3">
                          {bucketOrders.map((order) => (
                            <div key={order.id} className="card space-y-3">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <p className="font-im-fell italic text-plum font-medium text-lg leading-tight">
                                    {order.customer_name}
                                  </p>
                                  <p className="font-im-fell-sc text-plum/50 text-xs mt-0.5">
                                    {order.reference_number}
                                  </p>
                                </div>
                                <span
                                  className={`font-im-fell-sc text-xs px-2 py-1 rounded-lg border-2 whitespace-nowrap ${STATUS_COLORS[order.status]}`}
                                >
                                  {STATUS_LABELS[order.status]}
                                </span>
                              </div>
                              <div className="flex gap-4 text-center">
                                <div>
                                  <p className="font-cormorant italic text-berry text-2xl font-medium">
                                    {order.quantity}
                                  </p>
                                  <p className="font-im-fell-sc text-plum/50 text-xs capitalize">
                                    {order.flavor}
                                  </p>
                                </div>
                                <div className="border-l border-border-pink" />
                                <div>
                                  <p className="font-cormorant italic text-berry text-2xl font-medium">
                                    ${order.total_price}
                                  </p>
                                  <p className="font-im-fell-sc text-plum/50 text-xs">Total</p>
                                </div>
                                <div className="border-l border-border-pink" />
                                <div>
                                  <p className="font-cormorant italic text-berry text-2xl font-medium">
                                    {new Date(order.pickup_date + "T12:00:00").toLocaleDateString(
                                      "en-US",
                                      { month: "short", day: "numeric" }
                                    )}
                                  </p>
                                  <p className="font-im-fell-sc text-plum/50 text-xs">Pickup</p>
                                </div>
                              </div>
                              <button
                                onClick={() => setDrawerOrderId(order.id)}
                                className="font-im-fell-sc text-xs text-plum/50 hover:text-rose transition-colors uppercase tracking-widest w-full text-center py-1 border-t border-border-pink"
                              >
                                View details →
                              </button>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      </div>

      {/* Slide-out order drawer */}
      {drawerOrder && (
        <AdminOrderDrawer
          order={drawerOrder}
          onClose={() => setDrawerOrderId(null)}
          onStatusChange={handleDrawerStatusChange}
        />
      )}
    </>
  );
}

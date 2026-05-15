"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import AdminOrderDrawer, { DrawerOrder } from "@/components/AdminOrderDrawer";

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

// ── Bucket config ────────────────────────────────────────────────────────────

interface Bucket {
  label: string;
  statuses: Status[];
  accentBg: string;
  accentBorder: string;
  accentText: string;
  badgeBg: string;
  defaultOpen: boolean;
}

const BUCKETS: Bucket[] = [
  {
    label: "New",
    statuses: ["new"],
    accentBg: "#EEF5FF",
    accentBorder: "#BAD4F7",
    accentText: "#1A4473",
    badgeBg: "#BAD4F7",
    defaultOpen: true,
  },
  {
    label: "Quoting",
    statuses: ["quoting"],
    accentBg: "#F2EEFF",
    accentBorder: "#C8B8F0",
    accentText: "#42227A",
    badgeBg: "#C8B8F0",
    defaultOpen: true,
  },
  {
    label: "Awaiting payment",
    statuses: ["awaiting_payment"],
    accentBg: "#FFFBEE",
    accentBorder: "#EDD898",
    accentText: "#6B4800",
    badgeBg: "#EDD898",
    defaultOpen: true,
  },
  {
    label: "Confirmed",
    statuses: ["confirmed", "in_progress", "ready"],
    accentBg: "#EDFAF3",
    accentBorder: "#9ED8B4",
    accentText: "#1A5C3A",
    badgeBg: "#9ED8B4",
    defaultOpen: false,
  },
  {
    label: "Delivered",
    statuses: ["delivered"],
    accentBg: "#F3F3F3",
    accentBorder: "#CACACA",
    accentText: "#484848",
    badgeBg: "#CACACA",
    defaultOpen: false,
  },
];


function formatPickup(dateStr: string) {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

// ── Main component ───────────────────────────────────────────────────────────

export default function AdminDashboard({ orders: initialOrders }: { orders: Order[] }) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [openBuckets, setOpenBuckets] = useState<Record<string, boolean>>(
    () => Object.fromEntries(BUCKETS.map((b) => [b.label, b.defaultOpen]))
  );
  const [drawerOrder, setDrawerOrder] = useState<Order | null>(null);
  const [sendingPayment, setSendingPayment] = useState<Record<string, boolean>>({});
  const [gmailConnected, setGmailConnected] = useState<boolean | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    fetch("/api/gmail/status")
      .then((r) => r.json())
      .then((d) => setGmailConnected(d.connected as boolean))
      .catch(() => setGmailConnected(false));
  }, []);

  function toggleBucket(label: string) {
    setOpenBuckets((prev) => ({ ...prev, [label]: !prev[label] }));
  }

  function handleStatusChange(id: string, status: string) {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status: status as Status } : o)));
    if (drawerOrder?.id === id) setDrawerOrder((o) => o ? { ...o, status: status as Status } : o);
  }

  async function sendPaymentRequest(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    setSendingPayment((p) => ({ ...p, [id]: true }));
    const res = await fetch(`/api/admin/orders/${id}/payment-link`, { method: "POST" });
    setSendingPayment((p) => ({ ...p, [id]: false }));
    if (res.ok) handleStatusChange(id, "awaiting_payment");
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/admin/login");
  }

  // Cancelled orders (shown separately, collapsed)
  const cancelledOrders = useMemo(() => orders.filter((o) => o.status === "cancelled"), [orders]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-cormorant italic text-berry text-4xl font-medium">Orders</h1>
          <p className="font-sans text-sm mt-1" style={{ color: "#8C7B74" }}>
            Jo&apos;s Cupcakes
          </p>
        </div>
        <button
          onClick={handleSignOut}
          className="font-sans text-sm transition-colors"
          style={{ color: "#A08880" }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "#D4788E")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "#A08880")}
        >
          Sign out
        </button>
      </div>

      {/* Gmail connection banner */}
      {gmailConnected === false && (
        <div
          className="flex items-center justify-between gap-3 rounded-xl px-4 py-3 mb-6"
          style={{ backgroundColor: "#FDF5F7", border: "1px solid #EECAD4" }}
        >
          <p className="font-sans text-sm" style={{ color: "#8B3D52" }}>
            Gmail not connected — you won&apos;t be able to read or reply to customer emails from here.
          </p>
          <a
            href="/api/gmail/auth"
            className="font-sans text-xs px-3 py-1.5 rounded-full flex-shrink-0 transition-colors"
            style={{ borderColor: "#C4607A", color: "#C4607A", border: "1px solid #C4607A" }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.backgroundColor = "#FEF0F4")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.backgroundColor = "")}
          >
            Connect Gmail
          </a>
        </div>
      )}

      {/* Buckets */}
      <div className="space-y-3">
        {BUCKETS.map((bucket) => {
          const bucketOrders = orders.filter((o) => bucket.statuses.includes(o.status as Status));
          const isOpen = openBuckets[bucket.label];

          return (
            <div
              key={bucket.label}
              className="rounded-2xl overflow-hidden"
              style={{ border: `1.5px solid ${bucket.accentBorder}` }}
            >
              {/* Bucket header */}
              <button
                onClick={() => toggleBucket(bucket.label)}
                className="w-full flex items-center justify-between px-5 py-3.5 text-left transition-colors"
                style={{ backgroundColor: isOpen ? bucket.accentBg : "#FDFAF7" }}
              >
                <div className="flex items-center gap-3">
                  {/* Chevron */}
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                    className="flex-shrink-0 transition-transform duration-200"
                    style={{
                      transform: isOpen ? "rotate(90deg)" : "rotate(0deg)",
                      color: bucket.accentText,
                    }}
                  >
                    <path d="M4 2L8 6L4 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="font-cormorant italic font-medium text-xl" style={{ color: bucket.accentText }}>
                    {bucket.label}
                  </span>
                  {/* Count badge */}
                  <span
                    className="font-sans text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{ backgroundColor: bucket.badgeBg, color: bucket.accentText }}
                  >
                    {bucketOrders.length}
                  </span>
                </div>
                {!isOpen && bucketOrders.length > 0 && (
                  <span className="font-sans text-xs hidden sm:block" style={{ color: bucket.accentText, opacity: 0.6 }}>
                    {bucketOrders.map((o) => o.customer_name.split(" ")[0]).slice(0, 3).join(", ")}
                    {bucketOrders.length > 3 ? ` +${bucketOrders.length - 3}` : ""}
                  </span>
                )}
              </button>

              {/* Bucket rows */}
              {isOpen && (
                <div style={{ backgroundColor: "#FDFAF7" }}>
                  {bucketOrders.length === 0 ? (
                    <p className="font-sans text-sm px-5 py-4" style={{ color: "#B0A09A" }}>
                      No orders here.
                    </p>
                  ) : (
                    bucketOrders.map((order, i) => (
                      <div
                        key={order.id}
                        onClick={() => setDrawerOrder(order)}
                        className="flex items-center gap-4 px-5 py-3.5 cursor-pointer transition-colors group"
                        style={{
                          borderTop: i > 0 ? "1px solid #EDE8E3" : `1px solid ${bucket.accentBorder}`,
                        }}
                        onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.backgroundColor = "#FAF7F2")}
                        onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.backgroundColor = "")}
                      >
                        {/* Customer */}
                        <div className="min-w-0 flex-1">
                          <p className="font-cormorant italic text-lg leading-tight truncate" style={{ color: "#3D2B1F" }}>
                            {order.customer_name}
                          </p>
                          <p className="font-sans text-xs mt-0.5" style={{ color: "#A08880" }}>
                            {order.reference_number}
                          </p>
                        </div>

                        {/* Pickup */}
                        <div className="hidden sm:block text-right flex-shrink-0 w-16">
                          <p className="font-sans text-sm" style={{ color: "#5C4A3D" }}>
                            {formatPickup(order.pickup_date)}
                          </p>
                        </div>

                        {/* Qty + flavor */}
                        <div className="hidden md:block text-right flex-shrink-0 w-28">
                          <p className="font-sans text-sm capitalize" style={{ color: "#5C4A3D" }}>
                            {order.quantity} · {order.flavor}
                          </p>
                        </div>

                        {/* Total */}
                        <div className="flex-shrink-0 w-14 text-right">
                          <p className="font-cormorant italic text-lg font-medium" style={{ color: "#3D2B1F" }}>
                            ${order.total_price}
                          </p>
                        </div>

                        {/* Quick action */}
                        <div className="flex-shrink-0 w-36 flex justify-end">
                          {(order.status === "new" || order.status === "quoting") && (
                            <button
                              onClick={(e) => sendPaymentRequest(e, order.id)}
                              disabled={sendingPayment[order.id]}
                              className="font-sans text-xs px-3 py-1.5 rounded-full border transition-colors disabled:opacity-50"
                              style={{ borderColor: "#D4788E", color: "#D4788E", backgroundColor: "transparent" }}
                              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#FEF0F4"; }}
                              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"; }}
                            >
                              {sendingPayment[order.id] ? "Sending…" : "Send payment link"}
                            </button>
                          )}
                          {order.status === "awaiting_payment" && (
                            <button
                              onClick={(e) => sendPaymentRequest(e, order.id)}
                              disabled={sendingPayment[order.id]}
                              className="font-sans text-xs px-3 py-1.5 rounded-full border transition-colors disabled:opacity-50"
                              style={{ borderColor: "#EDD898", color: "#6B4800", backgroundColor: "transparent" }}
                              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#FFFBEE"; }}
                              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"; }}
                            >
                              {sendingPayment[order.id] ? "Sending…" : "Resend link"}
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Cancelled — always collapsed, only shown if any exist */}
        {cancelledOrders.length > 0 && (
          <div className="rounded-2xl overflow-hidden" style={{ border: "1.5px solid #FCA5A5" }}>
            <button
              onClick={() => toggleBucket("Cancelled")}
              className="w-full flex items-center gap-3 px-5 py-3 text-left"
              style={{ backgroundColor: openBuckets["Cancelled"] ? "#FEF2F2" : "#FDFAF7" }}
            >
              <svg
                width="12" height="12" viewBox="0 0 12 12" fill="none"
                className="flex-shrink-0 transition-transform duration-200"
                style={{ transform: openBuckets["Cancelled"] ? "rotate(90deg)" : "rotate(0deg)", color: "#991B1B" }}
              >
                <path d="M4 2L8 6L4 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="font-cormorant italic text-xl" style={{ color: "#991B1B" }}>Cancelled</span>
              <span className="font-sans text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "#FCA5A5", color: "#991B1B" }}>
                {cancelledOrders.length}
              </span>
            </button>
            {openBuckets["Cancelled"] && (
              <div style={{ backgroundColor: "#FDFAF7" }}>
                {cancelledOrders.map((order, i) => (
                  <div
                    key={order.id}
                    onClick={() => setDrawerOrder(order)}
                    className="flex items-center gap-4 px-5 py-3.5 cursor-pointer opacity-60"
                    style={{ borderTop: i > 0 ? "1px solid #EDE8E3" : "1px solid #FCA5A5" }}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-cormorant italic text-lg truncate" style={{ color: "#3D2B1F" }}>{order.customer_name}</p>
                      <p className="font-sans text-xs" style={{ color: "#A08880" }}>{order.reference_number}</p>
                    </div>
                    <p className="font-sans text-sm hidden sm:block" style={{ color: "#5C4A3D" }}>{formatPickup(order.pickup_date)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Order drawer */}
      {drawerOrder && (
        <AdminOrderDrawer
          order={drawerOrder as DrawerOrder}
          onClose={() => setDrawerOrder(null)}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  );
}

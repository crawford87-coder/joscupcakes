"use client";

import { useState, useEffect, useRef } from "react";

export interface DrawerOrder {
  id: string;
  reference_number: string;
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
  status: string;
}

interface GmailMessage {
  id: string;
  from: string;
  date: string;
  body: string;
  isFromJo: boolean;
}

const STATUS_LABELS: Record<string, string> = {
  new: "New",
  quoting: "Quoting",
  awaiting_payment: "Awaiting payment",
  confirmed: "Confirmed",
  in_progress: "In progress",
  ready: "Ready",
  delivered: "Delivered",
  cancelled: "Canceled",
};

const STATUS_COLORS: Record<string, string> = {
  new: "bg-butter/30 text-amber-700 border-butter",
  quoting: "bg-lavender/30 text-purple-700 border-lavender",
  awaiting_payment: "bg-wc-peach/40 text-orange-700 border-wc-peach",
  confirmed: "bg-mint/30 text-teal-700 border-mint",
  in_progress: "bg-lavender/40 text-purple-800 border-lavender",
  ready: "bg-mint/40 text-teal-800 border-mint",
  delivered: "bg-gray-100 text-gray-500 border-gray-200",
  cancelled: "bg-red-50 text-red-400 border-red-200",
};

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) {
      return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    }
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return dateStr;
  }
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-im-fell-sc text-plum/35 text-xs uppercase tracking-wide">{label}</p>
      <p className="font-im-fell italic text-plum text-sm mt-0.5 leading-snug">{value}</p>
    </div>
  );
}

export default function AdminOrderDrawer({
  order: initialOrder,
  onClose,
  onStatusChange,
}: {
  order: DrawerOrder;
  onClose: () => void;
  onStatusChange: (id: string, status: string) => void;
}) {
  const [order, setOrder] = useState(initialOrder);
  const [gmailConnected, setGmailConnected] = useState<boolean | null>(null);
  const [messages, setMessages] = useState<GmailMessage[]>([]);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [loadingThread, setLoadingThread] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [sendingPayment, setSendingPayment] = useState(false);
  const threadEndRef = useRef<HTMLDivElement>(null);

  // Sync if parent updates the order
  useEffect(() => { setOrder(initialOrder); }, [initialOrder]);

  useEffect(() => {
    fetch("/api/gmail/status")
      .then((r) => r.json())
      .then((d) => setGmailConnected(d.connected as boolean));
  }, []);

  useEffect(() => {
    if (!gmailConnected) return;
    setLoadingThread(true);
    fetch(`/api/gmail/thread?orderId=${order.id}`)
      .then((r) => r.json())
      .then((d) => {
        setMessages(d.messages ?? []);
        setThreadId(d.threadId ?? null);
      })
      .finally(() => setLoadingThread(false));
  }, [gmailConnected, order.id]);

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function patchStatus(status: string) {
    await fetch(`/api/orders/${order.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setOrder((o) => ({ ...o, status }));
    onStatusChange(order.id, status);
  }

  async function refreshThread() {
    const res = await fetch(`/api/gmail/thread?orderId=${order.id}`);
    const d = await res.json();
    setMessages(d.messages ?? []);
    setThreadId(d.threadId ?? null);
  }

  async function handleSend() {
    if (!replyText.trim() || sending) return;
    setSending(true);

    const subject = `Re: Your Jo's Cupcakes order ${order.reference_number}`;
    const htmlBody = `<p style="font-family:Georgia,serif;font-size:15px;color:#3D2B1F;line-height:1.7">${replyText.replace(/\n/g, "<br>")}</p>`;

    const res = await fetch("/api/gmail/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderId: order.id,
        to: order.customer_email,
        subject,
        htmlBody,
        threadId: threadId ?? undefined,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      setThreadId(data.threadId);
      setReplyText("");

      // First reply from New → Quoting
      if (order.status === "new") await patchStatus("quoting");

      await refreshThread();
    }

    setSending(false);
  }

  async function handleSendPaymentRequest() {
    setSendingPayment(true);
    const res = await fetch(`/api/admin/orders/${order.id}/payment-link`, {
      method: "POST",
    });
    if (res.ok) {
      setOrder((o) => ({ ...o, status: "awaiting_payment" }));
      onStatusChange(order.id, "awaiting_payment");
    }
    setSendingPayment(false);
  }

  const firstName = order.customer_name.split(" ")[0];
  const pickupFormatted = new Date(order.pickup_date + "T12:00:00").toLocaleDateString(
    "en-US",
    { weekday: "long", month: "long", day: "numeric" }
  );

  const templates = [
    {
      label: "Send quote",
      text: `Hi ${firstName},\n\nThanks so much for reaching out — I'd love to make your cupcakes!\n\nHere's my quote:\n\n${order.quantity} ${order.flavor} cupcakes — $${order.total_price}\nPickup: ${pickupFormatted}${order.pickup_time ? ` around ${order.pickup_time}` : ""}\n\nLet me know if you'd like to go ahead and I'll send over a payment link.\n\nWarm regards,\nJo`,
    },
    {
      label: "Confirm pickup",
      text: `Hi ${firstName},\n\nJust confirming your pickup for ${pickupFormatted}${order.pickup_time ? ` around ${order.pickup_time}` : ""}.\n\nI'll have your ${order.quantity} cupcakes ready and waiting — looking forward to seeing you!\n\nWarm regards,\nJo`,
    },
    {
      label: "Balance reminder",
      text: `Hi ${firstName},\n\nJust a friendly reminder that the remaining balance for your order (${order.reference_number}) will be due soon.\n\nIf you'd like me to resend the payment link, just let me know!\n\nThanks so much,\nJo`,
    },
  ];

  const canSendPayment =
    order.status === "new" || order.status === "quoting" || order.status === "awaiting_payment";
  const paymentButtonLabel =
    order.status === "awaiting_payment" ? "Resend payment link" : "Send payment request";

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-30"
        style={{ backgroundColor: "rgba(61,43,31,0.18)", backdropFilter: "blur(1px)" }}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className="fixed right-0 top-0 h-full w-full max-w-[480px] z-40 flex flex-col"
        style={{ backgroundColor: "#FDFAF7", boxShadow: "-4px 0 40px rgba(61,43,31,0.12)" }}
      >
        {/* ── Header ── */}
        <div
          className="flex items-center justify-between px-5 py-4 flex-shrink-0"
          style={{ borderBottom: "1px solid #E8DDD4" }}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="text-plum/35 hover:text-plum transition-colors p-1 -ml-1"
              aria-label="Close"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M3 3L13 13M13 3L3 13"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>
            <span className="font-im-fell-sc text-plum/50 text-xs tracking-widest uppercase">
              {order.reference_number}
            </span>
          </div>
          <span
            className={`font-im-fell-sc text-xs px-2.5 py-1 rounded-lg border-2 ${
              STATUS_COLORS[order.status] ?? "bg-gray-100 text-gray-600 border-gray-200"
            }`}
          >
            {STATUS_LABELS[order.status] ?? order.status}
          </span>
        </div>

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto">
          {/* Order metadata */}
          <div className="px-5 py-4" style={{ borderBottom: "1px solid #E8DDD4" }}>
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              <MetaItem label="Customer" value={order.customer_name} />
              <MetaItem label="Email" value={order.customer_email} />
              <MetaItem label="Phone" value={order.customer_phone} />
              <MetaItem
                label="Pickup"
                value={new Date(order.pickup_date + "T12:00:00").toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              />
              <MetaItem
                label="Order"
                value={`${order.quantity} ${order.flavor} cupcakes`}
              />
              <MetaItem label="Total" value={`$${order.total_price}`} />
              {order.pickup_time && <MetaItem label="Time" value={order.pickup_time} />}
              {order.fulfillment_type === "delivery" && order.delivery_address && (
                <div className="col-span-2">
                  <MetaItem label="Delivery address" value={order.delivery_address} />
                </div>
              )}
              {order.icing_colors?.length > 0 && (
                <MetaItem label="Icing colors" value={order.icing_colors.join(", ")} />
              )}
              {order.topper_description && (
                <MetaItem label="Topper" value={order.topper_description} />
              )}
              {order.sprinkles_or_glitter && (
                <MetaItem label="Extras" value={order.sprinkles_or_glitter} />
              )}
              {order.notes && (
                <div className="col-span-2">
                  <MetaItem label="Notes" value={order.notes} />
                </div>
              )}
            </div>
          </div>

          {/* Delivered: photo slot */}
          {order.status === "delivered" && (
            <div className="px-5 py-4" style={{ borderBottom: "1px solid #E8DDD4" }}>
              <p className="font-im-fell-sc text-plum/35 text-xs uppercase tracking-widest mb-2">
                Delivery photo
              </p>
              <div
                className="h-28 rounded-xl flex items-center justify-center"
                style={{ border: "2px dashed #E8DDD4" }}
              >
                <p className="font-im-fell italic text-plum/25 text-sm">No photo yet</p>
              </div>
            </div>
          )}

          {/* Quick actions (status transitions) */}
          <div className="px-5 py-3 flex flex-wrap gap-2" style={{ borderBottom: "1px solid #E8DDD4" }}>
            {canSendPayment && (
              <button
                onClick={handleSendPaymentRequest}
                disabled={sendingPayment}
                className="font-im-fell-sc text-xs px-3.5 py-1.5 rounded-pill border-2 border-rose/40 text-rose bg-rose/10 hover:bg-rose/20 transition-colors disabled:opacity-50"
              >
                {sendingPayment ? "Sending…" : paymentButtonLabel}
              </button>
            )}
            {order.status === "confirmed" && (
              <button
                onClick={() => patchStatus("delivered")}
                className="font-im-fell-sc text-xs px-3.5 py-1.5 rounded-pill border-2 border-mint/60 text-teal-700 bg-mint/20 hover:bg-mint/40 transition-colors"
              >
                Mark delivered
              </button>
            )}
          </div>

          {/* Email thread */}
          <div className="px-5 py-4">
            <p className="font-im-fell-sc text-plum/35 text-xs uppercase tracking-widest mb-3">
              Email thread
            </p>

            {gmailConnected === null && (
              <p className="font-im-fell italic text-plum/30 text-sm">Loading…</p>
            )}

            {gmailConnected === false && (
              <div
                className="rounded-xl p-5 text-center"
                style={{ border: "2px dashed #E8DDD4" }}
              >
                <p className="font-im-fell italic text-plum/50 text-sm mb-3">
                  Connect Gmail to read and reply to emails
                </p>
                <a
                  href="/api/gmail/auth"
                  className="font-im-fell-sc text-xs px-4 py-2 rounded-pill bg-rose/15 text-rose border-2 border-rose/30 hover:bg-rose/25 transition-colors inline-block"
                >
                  Connect Gmail
                </a>
              </div>
            )}

            {gmailConnected === true && loadingThread && (
              <p className="font-im-fell italic text-plum/30 text-sm">Loading thread…</p>
            )}

            {gmailConnected === true && !loadingThread && messages.length === 0 && (
              <p className="font-im-fell italic text-plum/30 text-sm">
                No emails found for this order yet.
              </p>
            )}

            {gmailConnected === true && !loadingThread && messages.length > 0 && (
              <div className="space-y-2.5">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className="rounded-xl p-3.5"
                    style={{
                      backgroundColor: msg.isFromJo ? "#F5F0E8" : "#FAF7F2",
                      border: "1px solid #E8DDD4",
                    }}
                  >
                    <div className="flex items-center justify-between mb-1.5 gap-2">
                      <span className="font-im-fell-sc text-xs text-plum/60 truncate">
                        {msg.isFromJo ? "You" : msg.from.replace(/<[^>]+>/g, "").trim()}
                      </span>
                      <span className="font-im-fell-sc text-xs text-plum/30 flex-shrink-0">
                        {formatDate(msg.date)}
                      </span>
                    </div>
                    <p className="font-im-fell italic text-plum text-sm leading-relaxed whitespace-pre-wrap">
                      {msg.body}
                    </p>
                  </div>
                ))}
                <div ref={threadEndRef} />
              </div>
            )}
          </div>
        </div>

        {/* ── Reply area ── */}
        {gmailConnected === true && (
          <div
            className="flex-shrink-0 px-5 py-4 space-y-3"
            style={{ borderTop: "1px solid #E8DDD4", backgroundColor: "#FAF7F2" }}
          >
            {/* Template buttons */}
            <div className="flex flex-wrap gap-1.5">
              {templates.map((t) => (
                <button
                  key={t.label}
                  onClick={() => setReplyText(t.text)}
                  className="font-im-fell-sc text-xs px-3 py-1.5 rounded-pill border-2 border-border-pink text-plum/55 hover:border-rose hover:text-rose transition-colors"
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Compose */}
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSend();
              }}
              placeholder="Write a reply… (⌘↵ to send)"
              rows={4}
              className="w-full font-im-fell italic text-plum text-sm rounded-xl px-3.5 py-2.5 outline-none placeholder:text-plum/25 resize-none"
              style={{ border: "2px solid #E8DDD4", backgroundColor: "#FDFAF7" }}
              onFocus={(e) =>
                (e.currentTarget.style.borderColor = "#B5588C")
              }
              onBlur={(e) =>
                (e.currentTarget.style.borderColor = "#E8DDD4")
              }
            />

            <div className="flex items-center justify-between">
              <span className="font-im-fell-sc text-xs text-plum/30">
                To: {order.customer_email}
              </span>
              <button
                onClick={handleSend}
                disabled={!replyText.trim() || sending}
                className="font-im-fell-sc text-xs px-5 py-2.5 rounded-pill transition-colors disabled:opacity-35"
                style={{ backgroundColor: "#B5588C", color: "#fff" }}
                onMouseEnter={(e) =>
                  !sending && replyText.trim() && ((e.currentTarget as HTMLButtonElement).style.backgroundColor = "#8B3D6B")
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLButtonElement).style.backgroundColor = "#B5588C")
                }
              >
                {sending
                  ? "Sending…"
                  : order.status === "new"
                  ? "Reply → Quoting"
                  : "Send reply"}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

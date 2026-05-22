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
  delivery_photo_url?: string | null;
}

interface EmailMessage {
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
  const [messages, setMessages] = useState<EmailMessage[]>([]);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [sendingPayment, setSendingPayment] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(initialOrder.delivery_photo_url ?? null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const threadEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync if parent updates the order
  useEffect(() => { setOrder(initialOrder); }, [initialOrder]);

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

  async function handleSend() {
    if (!replyText.trim() || sending) return;
    setSending(true);

    const subject = `Re: Your Jo's Cupcakes order ${order.reference_number}`;
    const messageText = replyText.trim();
    const htmlBody = `<p style="font-family:Georgia,serif;font-size:15px;color:#3D2B1F;line-height:1.7">${messageText.replace(/\n/g, "<br>")}</p>`;

    const res = await fetch("/api/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: order.customer_email,
        subject,
        htmlBody,
      }),
    });

    if (res.ok) {
      setReplyText("");
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}`,
          from: "Jo",
          date: new Date().toISOString(),
          body: messageText,
          isFromJo: true,
        },
      ]);

      // First reply from New → Quoting
      if (order.status === "new") await patchStatus("quoting");
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

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    const formData = new FormData();
    formData.append("photo", file);
    const res = await fetch(`/api/admin/orders/${order.id}/photo`, { method: "POST", body: formData });
    if (res.ok) {
      const { url } = await res.json();
      setPhotoUrl(url);
    }
    setUploadingPhoto(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
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
      label: "Send payment request",
      text: `Hi ${firstName},\n\nGreat news — I'm popping a payment link over to you now. Once that's done your order is confirmed!\n\nOrder summary:\n${order.quantity} ${order.flavor} cupcakes — $${order.total_price}\nPickup: ${pickupFormatted}${order.pickup_time ? ` around ${order.pickup_time}` : ""}\n\nLet me know if you have any questions.\n\nWarm regards,\nJo`,
    },
    {
      label: "Confirm pickup time",
      text: `Hi ${firstName},\n\nJust confirming your pickup for ${pickupFormatted}${order.pickup_time ? ` around ${order.pickup_time}` : ""}.\n\nI'll have your ${order.quantity} cupcakes ready and waiting — looking forward to seeing you!\n\nWarm regards,\nJo`,
    },
    {
      label: "Send balance reminder",
      text: `Hi ${firstName},\n\nJust a friendly reminder that the remaining balance for your order (${order.reference_number}) will be due soon.\n\nI'll send the payment link through shortly — please don't hesitate to reach out if you have any questions!\n\nThanks so much,\nJo`,
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
              {photoUrl ? (
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photoUrl}
                    alt="Delivery"
                    className="w-full rounded-xl object-cover max-h-52"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute top-2 right-2 font-im-fell-sc text-xs px-2.5 py-1 rounded-lg transition-colors"
                    style={{ backgroundColor: "rgba(253,250,247,0.9)", color: "#7A4A6E" }}
                  >
                    Replace
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPhoto}
                  className="w-full h-28 rounded-xl flex flex-col items-center justify-center gap-2 transition-colors"
                  style={{ border: "2px dashed #E8DDD4" }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.borderColor = "#C8B0A8")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.borderColor = "#E8DDD4")}
                >
                  {uploadingPhoto ? (
                    <p className="font-im-fell italic text-plum/30 text-sm">Uploading…</p>
                  ) : (
                    <>
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ color: "#C8B0A8" }}>
                        <path d="M10 13V5m0 0L7 8m3-3l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M3 15h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                      <p className="font-im-fell italic text-plum/25 text-sm">Add delivery photo</p>
                    </>
                  )}
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoUpload}
              />
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
            {["confirmed", "in_progress", "ready"].includes(order.status) && (
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

            <p className="font-im-fell italic text-plum/30 text-xs mb-3">
              SMTP mode is active. Incoming mailbox sync is disabled, but you can send replies here.
            </p>

            {messages.length === 0 && (
              <p className="font-im-fell italic text-plum/30 text-sm">
                No messages in this panel yet.
              </p>
            )}

            {messages.length > 0 && (
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
            placeholder="Write a reply... (Ctrl/Cmd+Enter to send)"
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
                ? "Sending..."
                : order.status === "new"
                ? "Reply -> Quoting"
                : "Send reply"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

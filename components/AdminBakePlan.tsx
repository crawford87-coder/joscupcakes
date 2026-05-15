"use client";

import { useState, useEffect, useMemo } from "react";

export interface BakePlanOrder {
  id: string;
  reference_number: string;
  customer_name: string;
  pickup_date: string;
  pickup_time: string | null;
  quantity: number;
  flavor: string;
  status: string;
  icing_colors: string[] | null;
  topper: boolean;
  topper_description: string | null;
}

interface PantryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  lowStockThreshold: number;
}

interface BakeSession {
  key: string;
  date: string;
  orders: BakePlanOrder[];
  totalCupcakes: number;
  flavorBreakdown: Record<string, number>;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const MAX_PER_SESSION = 72;

const CONFIDENCE: Record<string, { color: string; label: string; inBake: boolean }> = {
  confirmed:        { color: "#22A666", label: "Confirmed",        inBake: true  },
  in_progress:      { color: "#22A666", label: "Confirmed",        inBake: true  },
  ready:            { color: "#22A666", label: "Confirmed",        inBake: true  },
  awaiting_payment: { color: "#D4920A", label: "Awaiting payment", inBake: true  },
  quoting:          { color: "#8B5CF6", label: "Quoting",          inBake: true  },
  new:              { color: "#9CA3AF", label: "New (unread)",     inBake: false },
};

const STATUS_PILL: Record<string, { bg: string; text: string; border: string }> = {
  new:              { bg: "#EEF5FF", text: "#1A4473", border: "#BAD4F7" },
  quoting:          { bg: "#F2EEFF", text: "#42227A", border: "#C8B8F0" },
  awaiting_payment: { bg: "#FFFBEE", text: "#6B4800", border: "#EDD898" },
  confirmed:        { bg: "#EDFAF3", text: "#1A5C3A", border: "#9ED8B4" },
  in_progress:      { bg: "#EDFAF3", text: "#1A5C3A", border: "#9ED8B4" },
  ready:            { bg: "#EDFAF3", text: "#1A5C3A", border: "#9ED8B4" },
  delivered:        { bg: "#F3F3F3", text: "#484848", border: "#CACACA" },
  cancelled:        { bg: "#FEF2F2", text: "#991B1B", border: "#FCA5A5" },
};

const STATUS_LABEL: Record<string, string> = {
  new: "New", quoting: "Quoting", awaiting_payment: "Awaiting payment",
  confirmed: "Confirmed", in_progress: "In progress", ready: "Ready",
  delivered: "Delivered", cancelled: "Cancelled",
};

const RECIPE = [
  { key: "flour",         name: "All-purpose flour", perDoz: 1.5,  unit: "cups", category: "Dry"   },
  { key: "sugar",         name: "Sugar",              perDoz: 1,    unit: "cups", category: "Dry"   },
  { key: "baking_powder", name: "Baking powder",      perDoz: 1.5,  unit: "tsp",  category: "Dry"   },
  { key: "salt",          name: "Salt",               perDoz: 0.25, unit: "tsp",  category: "Dry"   },
  { key: "p_sugar",       name: "Powdered sugar",     perDoz: 2,    unit: "cups", category: "Dry"   },
  { key: "vanilla",       name: "Vanilla extract",    perDoz: 1,    unit: "tsp",  category: "Dry"   },
  { key: "butter_batter", name: "Butter (batter)",    perDoz: 0.5,  unit: "cups", category: "Dairy" },
  { key: "butter_frost",  name: "Butter (frosting)",  perDoz: 0.5,  unit: "cups", category: "Dairy" },
  { key: "eggs",          name: "Eggs",               perDoz: 2,    unit: "",     category: "Dairy" },
  { key: "milk",          name: "Milk",               perDoz: 0.5,  unit: "cups", category: "Dairy" },
  { key: "heavy_cream",   name: "Heavy cream",        perDoz: 2,    unit: "tbsp", category: "Dairy" },
];

const DEFAULT_PANTRY: PantryItem[] = RECIPE.map((r) => ({
  id: r.key,
  name: r.name,
  category: r.category,
  quantity: 0,
  unit: r.unit,
  lowStockThreshold: 0,
}));

const PANTRY_CATEGORIES = ["Dry", "Dairy", "Decorations", "Packaging"] as const;

// ── Utilities ─────────────────────────────────────────────────────────────────

const FRACS: [number, string][] = [[0.75, "¾"], [0.5, "½"], [0.25, "¼"]];

function fmtQty(n: number, unit: string): string {
  const r = Math.round(n * 4) / 4;
  const whole = Math.floor(r);
  const frac = FRACS.find(([v]) => Math.abs(v - (r - whole)) < 0.01)?.[1] ?? "";
  const num = whole > 0 ? (frac ? `${whole} ${frac}` : `${whole}`) : (frac || "0");
  return unit ? `${num} ${unit}` : num;
}

function shiftDate(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T12:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function fmtDayLabel(dateStr: string): string {
  const t = todayStr();
  if (dateStr === t) return "Today";
  if (dateStr === shiftDate(t, 1)) return "Tomorrow";
  return new Date(dateStr + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "long", month: "short", day: "numeric",
  });
}

function fmtShort(dateStr: string): string {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ── Bake session auto-generation ─────────────────────────────────────────────

function makeSessions(orders: BakePlanOrder[]): BakeSession[] {
  const t = todayStr();
  const bakeable = orders.filter((o) => CONFIDENCE[o.status]?.inBake);
  const sorted = [...bakeable].sort((a, b) => a.pickup_date.localeCompare(b.pickup_date));

  const byDate: Record<string, BakePlanOrder[]> = {};
  for (const o of sorted) {
    let d = shiftDate(o.pickup_date, -2);
    if (d < t) d = t;
    (byDate[d] ??= []).push(o);
  }

  const sessions: BakeSession[] = [];
  for (const [date, dayOrders] of Object.entries(byDate).sort()) {
    let current: BakePlanOrder[] = [];
    let qty = 0;
    let idx = 0;
    for (const o of dayOrders) {
      if (qty + o.quantity > MAX_PER_SESSION && current.length > 0) {
        sessions.push(buildSession(date, current, idx++));
        current = []; qty = 0;
      }
      current.push(o);
      qty += o.quantity;
    }
    if (current.length > 0) sessions.push(buildSession(date, current, idx));
  }
  return sessions;
}

function buildSession(date: string, orders: BakePlanOrder[], idx: number): BakeSession {
  const totalCupcakes = orders.reduce((s, o) => s + o.quantity, 0);
  const flavorBreakdown: Record<string, number> = {};
  for (const o of orders) flavorBreakdown[o.flavor] = (flavorBreakdown[o.flavor] ?? 0) + o.quantity;
  const key = `${date}_${idx}_${orders.map((o) => o.id).sort().join("")}`;
  return { key, date, orders, totalCupcakes, flavorBreakdown };
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function AdminBakePlan({ orders }: { orders: BakePlanOrder[] }) {
  const [tab, setTab] = useState<"week" | "shopping" | "pantry">("week");
  const [sessionStatuses, setSessionStatuses] = useState<Record<string, "suggested" | "accepted" | "complete">>({});
  const [shopChecked, setShopChecked] = useState<Record<string, boolean>>({});
  const [pantryItems, setPantryItems] = useState<PantryItem[]>([]);
  const [shopDays, setShopDays] = useState(7);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newQty, setNewQty] = useState("");
  const [newUnit, setNewUnit] = useState("");

  useEffect(() => {
    try {
      const ss = localStorage.getItem("jc_sess_statuses");
      if (ss) setSessionStatuses(JSON.parse(ss));
      const sc = localStorage.getItem("jc_shop_v2");
      if (sc) setShopChecked(JSON.parse(sc));
      const p = localStorage.getItem("jc_pantry_v2");
      setPantryItems(p ? JSON.parse(p) : DEFAULT_PANTRY);
    } catch {
      setPantryItems(DEFAULT_PANTRY);
    }
  }, []);

  useEffect(() => { localStorage.setItem("jc_sess_statuses", JSON.stringify(sessionStatuses)); }, [sessionStatuses]);
  useEffect(() => { localStorage.setItem("jc_shop_v2", JSON.stringify(shopChecked)); }, [shopChecked]);
  useEffect(() => { localStorage.setItem("jc_pantry_v2", JSON.stringify(pantryItems)); }, [pantryItems]);

  const bakeSessions = useMemo(() => makeSessions(orders), [orders]);
  const t = todayStr();

  // Urgency: unpaid orders with pickup ≤ 4 days away
  const urgentOrders = orders.filter((o) => {
    if (!["new", "quoting", "awaiting_payment"].includes(o.status)) return false;
    const days = Math.ceil(
      (new Date(o.pickup_date + "T12:00:00").getTime() - Date.now()) / 86400000
    );
    return days >= 0 && days <= 4;
  });

  const newOrders = orders.filter((o) => o.status === "new");

  // 14-day window
  const days = Array.from({ length: 14 }, (_, i) => shiftDate(t, i));

  // Finishing days: orders indexed by (pickup - 1)
  const finishingByDay: Record<string, BakePlanOrder[]> = {};
  for (const o of orders) {
    if (["delivered", "cancelled"].includes(o.status)) continue;
    const fd = shiftDate(o.pickup_date, -1);
    if (days.includes(fd)) (finishingByDay[fd] ??= []).push(o);
  }

  // Bake sessions indexed by date
  const sessionsByDay: Record<string, BakeSession[]> = {};
  for (const s of bakeSessions) {
    if (days.includes(s.date)) (sessionsByDay[s.date] ??= []).push(s);
  }

  // Shopping list
  const shopEnd = shiftDate(t, shopDays);
  const shopOrders = orders.filter(
    (o) => !["delivered", "cancelled"].includes(o.status) && o.pickup_date >= t && o.pickup_date <= shopEnd
  );
  const shopTotal = shopOrders.reduce((s, o) => s + o.quantity, 0);
  const shopIngredients = RECIPE.map((r) => {
    const needed = (r.perDoz / 12) * shopTotal;
    const have = pantryItems.find((p) => p.id === r.key)?.quantity ?? 0;
    return { ...r, needed, have, shortfall: Math.max(0, needed - have) };
  });

  // Pantry low stock
  const lowStock = pantryItems.filter((p) => p.lowStockThreshold > 0 && p.quantity <= p.lowStockThreshold);

  function setSessionStatus(key: string, status: "suggested" | "accepted" | "complete") {
    setSessionStatuses((p) => ({ ...p, [key]: status }));
    if (status === "complete") {
      const s = bakeSessions.find((x) => x.key === key);
      if (s) {
        const cupcakes = s.totalCupcakes;
        setPantryItems((items) =>
          items.map((item) => {
            const r = RECIPE.find((x) => x.key === item.id);
            if (!r) return item;
            return { ...item, quantity: Math.max(0, item.quantity - (r.perDoz / 12) * cupcakes) };
          })
        );
      }
    }
  }

  function addPantryItem() {
    const name = newName.trim();
    if (!name) return;
    setPantryItems((p) => [
      ...p,
      { id: `c_${Date.now()}`, name, category: "Dry", quantity: parseFloat(newQty) || 0, unit: newUnit.trim(), lowStockThreshold: 0 },
    ]);
    setNewName(""); setNewQty(""); setNewUnit("");
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div>
      {/* Sub-tabs */}
      <div className="flex gap-0 mb-6" style={{ borderBottom: "1.5px solid #EDE8E3" }}>
        {(["week", "shopping", "pantry"] as const).map((k) => {
          const label = k === "week" ? "This week" : k === "shopping" ? "Shopping list" : "Pantry";
          const active = tab === k;
          return (
            <button
              key={k}
              onClick={() => setTab(k)}
              className="font-sans text-sm px-5 py-3 border-b-2 -mb-px transition-colors"
              style={{
                borderColor: active ? "#B5588C" : "transparent",
                color: active ? "#B5588C" : "#A08880",
                fontWeight: active ? 500 : 400,
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* ── This week ── */}
      {tab === "week" && (
        <div className="space-y-3">
          {/* Urgency alert */}
          {urgentOrders.length > 0 && (
            <div
              className="rounded-xl px-4 py-3.5 flex items-start gap-3"
              style={{ backgroundColor: "#FEF2F2", border: "1px solid #FCA5A5", borderLeft: "3px solid #DC2626" }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0 mt-0.5" style={{ color: "#DC2626" }}>
                <path d="M8 1.5L14.5 14H1.5L8 1.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                <path d="M8 6V9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <circle cx="8" cy="11.5" r="0.75" fill="currentColor" />
              </svg>
              <div>
                <p className="font-sans text-sm font-medium" style={{ color: "#991B1B" }}>
                  {urgentOrders.length} unpaid order{urgentOrders.length !== 1 ? "s" : ""} — pickup within 4 days
                </p>
                <div className="mt-1.5 space-y-0.5">
                  {urgentOrders.map((o) => (
                    <p key={o.id} className="font-sans text-xs" style={{ color: "#B91C1C" }}>
                      {o.customer_name} · {o.quantity} cupcakes · {fmtShort(o.pickup_date)}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Day sections */}
          {days.map((day, i) => {
            const finishing = finishingByDay[day] ?? [];
            const sessions = sessionsByDay[day] ?? [];
            const label = fmtDayLabel(day);

            if (finishing.length === 0 && sessions.length === 0) {
              if (i >= 7) return null;
              return (
                <div key={day} className="flex items-center gap-4 py-1 px-1 opacity-35">
                  <span className="font-sans text-xs w-24 flex-shrink-0" style={{ color: "#5C4A3D" }}>{label}</span>
                  <span className="font-sans text-xs italic" style={{ color: "#A08880" }}>Free day</span>
                </div>
              );
            }

            return (
              <div key={day} className="space-y-2">
                {/* Finishing section */}
                {finishing.length > 0 && (
                  <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #EDE8E3", borderLeft: "3px solid #E8A5B5" }}>
                    <div className="px-4 py-3 flex items-center gap-2.5" style={{ backgroundColor: "#FDF5F7" }}>
                      {/* Brush icon */}
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ color: "#C4607A", flexShrink: 0 }}>
                        <path d="M9.5 2L12 4.5L4.5 12H2V9.5L9.5 2Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
                        <path d="M7.5 4L10 6.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                      </svg>
                      <span className="font-sans text-sm font-medium" style={{ color: "#8B3D52" }}>Finishing</span>
                      <span className="font-sans text-xs" style={{ color: "#C4607A", opacity: 0.75 }}>{label}</span>
                    </div>
                    <div style={{ backgroundColor: "#FDFAF7" }}>
                      {[...finishing]
                        .sort((a, b) => (a.pickup_time ?? "").localeCompare(b.pickup_time ?? ""))
                        .map((o) => (
                          <div key={o.id} className="px-4 py-3 flex items-start gap-3" style={{ borderTop: "1px solid #EDE8E3" }}>
                            <div className="flex-1 min-w-0">
                              <p className="font-sans text-sm font-medium" style={{ color: "#3D2B1F" }}>{o.customer_name}</p>
                              <div className="flex flex-wrap gap-2 mt-0.5">
                                <span className="font-sans text-xs" style={{ color: "#A08880" }}>
                                  {o.quantity} · {o.flavor}
                                </span>
                                {o.icing_colors && o.icing_colors.length > 0 && (
                                  <span className="font-sans text-xs" style={{ color: "#8B3D52" }}>
                                    {o.icing_colors.join(", ")}
                                  </span>
                                )}
                                {o.topper_description && (
                                  <span className="font-sans text-xs" style={{ color: "#8B3D52" }}>
                                    + {o.topper_description}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              {o.pickup_time && (
                                <p className="font-sans text-xs font-medium" style={{ color: "#5C4A3D" }}>{o.pickup_time}</p>
                              )}
                              <p className="font-sans text-xs" style={{ color: "#A08880" }}>pickup {fmtShort(o.pickup_date)}</p>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Bake sessions */}
                {sessions.map((session) => {
                  const sStatus = sessionStatuses[session.key] ?? "suggested";
                  const isComplete = sStatus === "complete";
                  const isAccepted = sStatus === "accepted";
                  const fillPct = Math.min(100, (session.totalCupcakes / MAX_PER_SESSION) * 100);
                  const overCapacity = session.totalCupcakes > MAX_PER_SESSION * 0.9;

                  return (
                    <div
                      key={session.key}
                      className="rounded-xl overflow-hidden"
                      style={{ border: "1px solid #EDE8E3", borderLeft: "3px solid #C4724A", opacity: isComplete ? 0.6 : 1 }}
                    >
                      {/* Session header */}
                      <div className="px-4 py-3" style={{ backgroundColor: "#FDF8F5" }}>
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2.5">
                            {/* Oven icon */}
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ color: "#C4724A", flexShrink: 0 }}>
                              <rect x="1" y="4" width="12" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
                              <path d="M1 7.5h12" stroke="currentColor" strokeWidth="1.3" />
                              <circle cx="4" cy="2.5" r="1" stroke="currentColor" strokeWidth="1.3" />
                              <circle cx="10" cy="2.5" r="1" stroke="currentColor" strokeWidth="1.3" />
                            </svg>
                            <span className="font-sans text-sm font-medium" style={{ color: "#7A3D1F" }}>
                              Bake day
                            </span>
                            <span
                              className="font-sans text-xs px-2 py-0.5 rounded-full"
                              style={{
                                backgroundColor: isComplete ? "#EDFAF3" : isAccepted ? "#FDF0E8" : "#F5EEE8",
                                color: isComplete ? "#1A5C3A" : isAccepted ? "#7A3D1F" : "#A08880",
                              }}
                            >
                              {isComplete ? "complete" : isAccepted ? "accepted" : "suggested"}
                            </span>
                            <span className="font-sans text-xs" style={{ color: "#C4724A", opacity: 0.75 }}>{label}</span>
                          </div>
                          <span className="font-sans text-xs font-medium" style={{ color: overCapacity ? "#DC2626" : "#7A3D1F" }}>
                            {session.totalCupcakes} / {MAX_PER_SESSION}
                          </span>
                        </div>

                        {/* Capacity bar */}
                        <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "#F0E8E0" }}>
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${fillPct}%`,
                              backgroundColor: overCapacity ? "#DC2626" : "#C4724A",
                            }}
                          />
                        </div>

                        {/* Flavor pills */}
                        <div className="flex flex-wrap gap-1.5 mt-2.5">
                          {Object.entries(session.flavorBreakdown).map(([flavor, qty]) => (
                            <span
                              key={flavor}
                              className="font-sans text-xs px-2 py-0.5 rounded-full capitalize"
                              style={{ backgroundColor: "#F0E8E0", color: "#7A3D1F" }}
                            >
                              {qty} {flavor}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Order rows */}
                      <div style={{ backgroundColor: "#FDFAF7" }}>
                        {session.orders.map((o) => {
                          const conf = CONFIDENCE[o.status] ?? { color: "#9CA3AF" };
                          const pill = STATUS_PILL[o.status] ?? { bg: "#F3F3F3", text: "#484848", border: "#CACACA" };
                          return (
                            <div
                              key={o.id}
                              className="px-4 py-2.5 flex items-center gap-3"
                              style={{ borderTop: "1px solid #EDE8E3" }}
                            >
                              <div
                                className="w-2 h-2 rounded-full flex-shrink-0"
                                style={{ backgroundColor: conf.color }}
                                title={CONFIDENCE[o.status]?.label}
                              />
                              <p className="font-sans text-sm flex-1 truncate" style={{ color: "#3D2B1F" }}>
                                {o.customer_name}
                              </p>
                              <p className="font-sans text-xs hidden sm:block flex-shrink-0" style={{ color: "#A08880" }}>
                                {fmtShort(o.pickup_date)}
                              </p>
                              <p className="font-sans text-xs flex-shrink-0 capitalize" style={{ color: "#5C4A3D" }}>
                                {o.quantity} · {o.flavor}
                              </p>
                              <span
                                className="font-sans text-xs px-2 py-0.5 rounded-full border hidden sm:inline flex-shrink-0"
                                style={{ backgroundColor: pill.bg, color: pill.text, borderColor: pill.border }}
                              >
                                {STATUS_LABEL[o.status] ?? o.status}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Footer: legend + actions */}
                      <div
                        className="px-4 py-2.5 flex items-center gap-3 flex-wrap"
                        style={{ borderTop: "1px solid #EDE8E3", backgroundColor: "#FAF7F2" }}
                      >
                        {/* Legend */}
                        <div className="flex items-center gap-3 mr-auto flex-wrap">
                          {[
                            { color: "#22A666", label: "Confirmed" },
                            { color: "#D4920A", label: "Unpaid" },
                            { color: "#8B5CF6", label: "Quoting" },
                          ].map(({ color, label: l }) => (
                            <span key={l} className="flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: color }} />
                              <span className="font-sans text-xs" style={{ color: "#A08880" }}>{l}</span>
                            </span>
                          ))}
                        </div>

                        {isComplete ? (
                          <span className="font-sans text-xs flex items-center gap-1.5" style={{ color: "#1A5C3A" }}>
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                              <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            Pantry updated
                          </span>
                        ) : !isAccepted ? (
                          <button
                            onClick={() => setSessionStatus(session.key, "accepted")}
                            className="font-sans text-xs px-3 py-1.5 rounded-full border transition-colors"
                            style={{ borderColor: "#C4724A", color: "#C4724A" }}
                            onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.backgroundColor = "#FDF0E8")}
                            onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.backgroundColor = "")}
                          >
                            Accept plan
                          </button>
                        ) : (
                          <button
                            onClick={() => setSessionStatus(session.key, "complete")}
                            className="font-sans text-xs px-3 py-1.5 rounded-full border transition-colors"
                            style={{ borderColor: "#22A666", color: "#22A666" }}
                            onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.backgroundColor = "#EDFAF3")}
                            onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.backgroundColor = "")}
                          >
                            Mark complete
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}

          {/* New orders alert */}
          {newOrders.length > 0 && (
            <div
              className="rounded-xl px-4 py-3.5 flex items-start gap-3"
              style={{ backgroundColor: "#EEF5FF", border: "1px solid #BAD4F7", borderLeft: "3px solid #1A4473" }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="flex-shrink-0 mt-0.5" style={{ color: "#1A4473" }}>
                <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.3" />
                <path d="M7 4.5V7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                <circle cx="7" cy="9.5" r="0.5" fill="currentColor" />
              </svg>
              <p className="font-sans text-sm" style={{ color: "#1A4473" }}>
                {newOrders.length} new order{newOrders.length !== 1 ? "s" : ""} unread.{" "}
                <a href="/admin" className="underline underline-offset-2 hover:opacity-70 transition-opacity">
                  Read &amp; quote
                </a>{" "}
                to lock in capacity.
              </p>
            </div>
          )}

          {/* Empty state */}
          {orders.filter((o) => !["delivered", "cancelled"].includes(o.status)).length === 0 && (
            <p className="font-sans text-sm text-center py-10" style={{ color: "#B0A09A" }}>
              No upcoming orders
            </p>
          )}
        </div>
      )}

      {/* ── Shopping list ── */}
      {tab === "shopping" && (
        <div>
          {/* Range picker */}
          <div className="flex items-center gap-2 mb-6 flex-wrap">
            <span className="font-sans text-sm" style={{ color: "#5C4A3D" }}>Ingredients for next</span>
            {([7, 14, 21] as const).map((n) => (
              <button
                key={n}
                onClick={() => setShopDays(n)}
                className="font-sans text-xs px-3 py-1.5 rounded-full border transition-colors"
                style={
                  shopDays === n
                    ? { borderColor: "#B5588C", color: "#B5588C", backgroundColor: "#FEF0F4" }
                    : { borderColor: "#EDE8E3", color: "#A08880" }
                }
              >
                {n} days
              </button>
            ))}
          </div>

          {shopTotal === 0 ? (
            <p className="font-sans text-sm text-center py-10" style={{ color: "#B0A09A" }}>
              No orders in this range
            </p>
          ) : (
            <>
              <p className="font-sans text-xs mb-5" style={{ color: "#A08880" }}>
                {shopOrders.length} order{shopOrders.length !== 1 ? "s" : ""} · {shopTotal} cupcakes
              </p>

              {(["Dry", "Dairy"] as const).map((cat) => {
                const items = shopIngredients.filter((i) => i.category === cat);
                return (
                  <div key={cat} className="mb-6">
                    <p
                      className="font-sans text-xs uppercase tracking-wider mb-3 font-medium"
                      style={{ color: "#A08880" }}
                    >
                      {cat === "Dry" ? "Dry goods" : "Dairy"}
                    </p>
                    <div className="space-y-2.5">
                      {items.map((item) => {
                        const checked = shopChecked[item.key];
                        const needsBuying = item.shortfall > 0;
                        return (
                          <div key={item.key} className="flex items-center gap-3">
                            <button
                              onClick={() => setShopChecked((p) => ({ ...p, [item.key]: !p[item.key] }))}
                              className="w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors"
                              style={
                                checked
                                  ? { backgroundColor: "#9ED8B4", borderColor: "#9ED8B4" }
                                  : { borderColor: "#C8C0BA" }
                              }
                              aria-label={checked ? "Uncheck" : "Check"}
                            >
                              {checked && (
                                <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                                  <path d="M1.5 4L3 5.5L6.5 2" stroke="#1A5C3A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              )}
                            </button>
                            <span
                              className="font-sans text-sm flex-1"
                              style={{
                                color: checked ? "#C8C0BA" : "#3D2B1F",
                                textDecoration: checked ? "line-through" : "none",
                              }}
                            >
                              {item.name}
                            </span>
                            <div className="text-right">
                              <span
                                className="font-sans text-sm"
                                style={{ color: checked ? "#C8C0BA" : needsBuying ? "#C4724A" : "#9ED8B4" }}
                              >
                                {needsBuying ? fmtQty(item.shortfall, item.unit) : "✓"}
                              </span>
                              {needsBuying && item.have > 0 && !checked && (
                                <p className="font-sans text-xs" style={{ color: "#A08880" }}>
                                  need {fmtQty(item.needed, item.unit)}, have {fmtQty(item.have, item.unit)}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {Object.values(shopChecked).some(Boolean) && (
                <button
                  onClick={() => setShopChecked({})}
                  className="font-sans text-xs mt-1 transition-colors"
                  style={{ color: "#C8C0BA" }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "#D4788E")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "#C8C0BA")}
                >
                  Clear checks
                </button>
              )}
            </>
          )}
        </div>
      )}

      {/* ── Pantry ── */}
      {tab === "pantry" && (
        <div>
          {/* Low stock banner */}
          {lowStock.length > 0 && (
            <div
              className="rounded-xl px-4 py-3 mb-5 flex items-start gap-2.5"
              style={{ backgroundColor: "#FFFBEE", border: "1px solid #EDD898" }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="flex-shrink-0 mt-0.5" style={{ color: "#D4920A" }}>
                <path d="M7 1L13.5 13H0.5L7 1Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
                <path d="M7 5.5V8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                <circle cx="7" cy="10" r="0.5" fill="currentColor" />
              </svg>
              <div>
                <p className="font-sans text-xs font-medium" style={{ color: "#6B4800" }}>Low stock</p>
                <p className="font-sans text-xs mt-0.5" style={{ color: "#92650A" }}>
                  {lowStock.map((i) => i.name).join(", ")}
                </p>
              </div>
            </div>
          )}

          {/* Items by category */}
          {PANTRY_CATEGORIES.map((cat) => {
            const items = pantryItems.filter((p) => p.category === cat);
            if (items.length === 0) return null;
            return (
              <div key={cat} className="mb-6">
                <p className="font-sans text-xs uppercase tracking-wider mb-3 font-medium" style={{ color: "#A08880" }}>
                  {cat === "Dry" ? "Dry goods" : cat}
                </p>
                <div className="space-y-2">
                  {items.map((item) => {
                    const isLow = item.lowStockThreshold > 0 && item.quantity <= item.lowStockThreshold;
                    const isEditing = editingId === item.id;
                    return (
                      <div key={item.id} className="flex items-center gap-3">
                        {isLow && (
                          <svg width="11" height="11" viewBox="0 0 14 14" fill="none" className="flex-shrink-0" style={{ color: "#D4920A" }}>
                            <path d="M7 1L13.5 13H0.5L7 1Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
                          </svg>
                        )}
                        <span
                          className="font-sans text-sm flex-1"
                          style={{ color: isLow ? "#D4920A" : "#3D2B1F" }}
                        >
                          {item.name}
                        </span>
                        {isEditing ? (
                          <input
                            type="number"
                            step="0.25"
                            min="0"
                            defaultValue={item.quantity}
                            autoFocus
                            onBlur={(e) => {
                              const val = parseFloat(e.target.value);
                              setPantryItems((p) =>
                                p.map((x) => x.id === item.id ? { ...x, quantity: isNaN(val) ? 0 : val } : x)
                              );
                              setEditingId(null);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === "Escape") (e.target as HTMLInputElement).blur();
                            }}
                            className="font-sans text-sm w-24 rounded-lg px-2 py-1 text-right outline-none"
                            style={{ border: "2px solid #B5588C", color: "#3D2B1F" }}
                          />
                        ) : (
                          <button
                            onClick={() => setEditingId(item.id)}
                            className="font-sans text-sm rounded-lg px-2 py-1 w-24 text-right transition-colors"
                            style={{ color: "#5C4A3D", border: "1px solid transparent" }}
                            onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.borderColor = "#EDE8E3")}
                            onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.borderColor = "transparent")}
                          >
                            {item.quantity} {item.unit}
                          </button>
                        )}
                        <button
                          onClick={() => setPantryItems((p) => p.filter((x) => x.id !== item.id))}
                          className="font-sans text-xs flex-shrink-0 transition-colors"
                          style={{ color: "#C8C0BA" }}
                          onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "#D4788E")}
                          onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "#C8C0BA")}
                          aria-label="Remove"
                        >
                          ✕
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Custom / uncategorized items */}
          {(() => {
            const others = pantryItems.filter((p) => !(PANTRY_CATEGORIES as readonly string[]).includes(p.category));
            if (others.length === 0) return null;
            return (
              <div className="mb-6">
                <p className="font-sans text-xs uppercase tracking-wider mb-3 font-medium" style={{ color: "#A08880" }}>Other</p>
                <div className="space-y-2">
                  {others.map((item) => (
                    <div key={item.id} className="flex items-center gap-3">
                      <span className="font-sans text-sm flex-1" style={{ color: "#3D2B1F" }}>{item.name}</span>
                      <span className="font-sans text-sm" style={{ color: "#5C4A3D" }}>{item.quantity} {item.unit}</span>
                      <button
                        onClick={() => setPantryItems((p) => p.filter((x) => x.id !== item.id))}
                        className="font-sans text-xs flex-shrink-0 transition-colors"
                        style={{ color: "#C8C0BA" }}
                        onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "#D4788E")}
                        onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "#C8C0BA")}
                        aria-label="Remove"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Add item */}
          <div className="rounded-xl px-4 py-4 mt-2" style={{ border: "1.5px dashed #C8C0BA" }}>
            <p className="font-sans text-xs uppercase tracking-wider mb-3 font-medium" style={{ color: "#A08880" }}>Add item</p>
            <div className="flex gap-2 flex-wrap">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addPantryItem()}
                placeholder="Name"
                className="font-sans text-sm flex-1 min-w-0 rounded-lg px-3 py-1.5 outline-none"
                style={{ border: "1.5px solid #EDE8E3", color: "#3D2B1F" }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#B5588C")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#EDE8E3")}
              />
              <input
                type="text"
                value={newQty}
                onChange={(e) => setNewQty(e.target.value)}
                placeholder="Qty"
                className="font-sans text-sm w-16 rounded-lg px-2 py-1.5 outline-none text-center"
                style={{ border: "1.5px solid #EDE8E3", color: "#3D2B1F" }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#B5588C")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#EDE8E3")}
              />
              <input
                type="text"
                value={newUnit}
                onChange={(e) => setNewUnit(e.target.value)}
                placeholder="Unit"
                className="font-sans text-sm w-20 rounded-lg px-2 py-1.5 outline-none"
                style={{ border: "1.5px solid #EDE8E3", color: "#3D2B1F" }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#B5588C")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#EDE8E3")}
              />
              <button
                onClick={addPantryItem}
                disabled={!newName.trim()}
                className="font-sans text-sm px-4 py-1.5 rounded-lg transition-colors disabled:opacity-40"
                style={{ backgroundColor: "#B5588C", color: "#fff" }}
                onMouseEnter={(e) => {
                  if (newName.trim()) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#8B3D6B";
                }}
                onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.backgroundColor = "#B5588C")}
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

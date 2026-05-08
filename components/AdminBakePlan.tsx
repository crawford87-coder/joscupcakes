"use client";

import { useState, useEffect } from "react";

export interface BakePlanOrder {
  id: string;
  reference_number: string;
  customer_name: string;
  pickup_date: string;
  quantity: number;
  flavor: string;
  status: string;
}

// Ingredients per 12 cupcakes (batter + frosting combined)
const RECIPE_PER_DOZEN = [
  { key: "flour",          name: "All-purpose flour", qty: 1.5,  unit: "cups" },
  { key: "sugar",          name: "Sugar",              qty: 1,    unit: "cups" },
  { key: "butter_batter",  name: "Butter (batter)",   qty: 0.5,  unit: "cups" },
  { key: "eggs",           name: "Eggs",               qty: 2,    unit: ""     },
  { key: "milk",           name: "Milk",               qty: 0.5,  unit: "cups" },
  { key: "vanilla",        name: "Vanilla extract",    qty: 1,    unit: "tsp"  },
  { key: "baking_powder",  name: "Baking powder",      qty: 1.5,  unit: "tsp"  },
  { key: "salt",           name: "Salt",               qty: 0.25, unit: "tsp"  },
  { key: "p_sugar",        name: "Powdered sugar",     qty: 2,    unit: "cups" },
  { key: "butter_frost",   name: "Butter (frosting)",  qty: 0.5,  unit: "cups" },
  { key: "heavy_cream",    name: "Heavy cream",        qty: 2,    unit: "tbsp" },
];

const FRACTIONS: Record<number, string> = { 0.25: "¼", 0.5: "½", 0.75: "¾" };

function formatQty(n: number, unit: string): string {
  const r = Math.round(n * 4) / 4;
  const whole = Math.floor(r);
  const frac = FRACTIONS[r - whole] ?? "";
  const num = [whole > 0 ? `${whole}` : "", frac].filter(Boolean).join("") || "0";
  return unit ? `${num} ${unit}` : num;
}

const CONFIRMED_STATUSES = new Set(["confirmed", "in_progress", "ready"]);

export default function AdminBakePlan({ orders }: { orders: BakePlanOrder[] }) {
  const [tab, setTab] = useState<"week" | "shopping" | "pantry">("week");
  const [baked, setBaked] = useState<Record<string, boolean>>({});
  const [shopChecked, setShopChecked] = useState<Record<string, boolean>>({});
  const [pantry, setPantry] = useState<{ id: string; name: string; qty: string }[]>([]);
  const [newItem, setNewItem] = useState("");

  useEffect(() => {
    try {
      const b = localStorage.getItem("jc_baked");
      if (b) setBaked(JSON.parse(b));
      const c = localStorage.getItem("jc_shop_checked");
      if (c) setShopChecked(JSON.parse(c));
      const p = localStorage.getItem("jc_pantry");
      if (p) setPantry(JSON.parse(p));
    } catch {}
  }, []);

  useEffect(() => { localStorage.setItem("jc_baked", JSON.stringify(baked)); }, [baked]);
  useEffect(() => { localStorage.setItem("jc_shop_checked", JSON.stringify(shopChecked)); }, [shopChecked]);
  useEffect(() => { localStorage.setItem("jc_pantry", JSON.stringify(pantry)); }, [pantry]);

  const totalCupcakes = orders.reduce((s, o) => s + o.quantity, 0);
  const bakedCount = orders.filter((o) => baked[o.id]).reduce((s, o) => s + o.quantity, 0);
  const pendingCupcakes = totalCupcakes - bakedCount;

  // Group by pickup date, sorted ascending
  const byDate = orders.reduce<Record<string, BakePlanOrder[]>>((acc, o) => {
    (acc[o.pickup_date] ??= []).push(o);
    return acc;
  }, {});
  const sortedDates = Object.keys(byDate).sort();

  function addPantryItem() {
    const name = newItem.trim();
    if (!name) return;
    setPantry((prev) => [...prev, { id: `${Date.now()}`, name, qty: "" }]);
    setNewItem("");
  }

  return (
    <div className="mb-8">
      {/* Tab strip */}
      <div className="flex items-center border-b border-border-pink mb-5">
        {(["week", "shopping", "pantry"] as const).map((t) => {
          const label = t === "week" ? "This week" : t === "shopping" ? "Shopping list" : "Pantry";
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`font-im-fell-sc text-xs uppercase tracking-widest px-4 py-2.5 border-b-2 -mb-px transition-colors ${
                tab === t
                  ? "border-rose text-rose"
                  : "border-transparent text-plum/40 hover:text-plum"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* ── This week ── */}
      {tab === "week" && (
        <div>
          {orders.length === 0 ? (
            <p className="font-im-fell italic text-plum/30 text-sm text-center py-8">
              No orders due this week
            </p>
          ) : (
            <div className="space-y-5">
              {/* Summary row */}
              <div className="flex items-center gap-3 flex-wrap">
                <span className="font-im-fell-sc text-xs text-plum/50 uppercase tracking-widest">
                  {orders.length} order{orders.length !== 1 ? "s" : ""} · {totalCupcakes} cupcakes
                </span>
                {bakedCount > 0 && (
                  <span className="font-im-fell-sc text-xs" style={{ color: "#5A9A7A" }}>
                    {bakedCount} baked ✓
                  </span>
                )}
              </div>

              {/* By pickup date */}
              {sortedDates.map((date) => (
                <div key={date}>
                  <p className="font-im-fell-sc text-xs text-plum/35 uppercase tracking-widest mb-2">
                    {new Date(date + "T12:00:00").toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                  <div className="space-y-2">
                    {byDate[date].map((o) => (
                      <div
                        key={o.id}
                        className="card flex items-center justify-between gap-4 py-3 transition-opacity"
                        style={{ opacity: baked[o.id] ? 0.45 : 1 }}
                      >
                        <div className="flex items-center gap-3">
                          {/* Bake toggle */}
                          <button
                            onClick={() => setBaked((p) => ({ ...p, [o.id]: !p[o.id] }))}
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                              baked[o.id]
                                ? "border-mint bg-mint/50"
                                : "border-border-pink hover:border-rose"
                            }`}
                            aria-label={baked[o.id] ? "Mark unbaked" : "Mark baked"}
                          >
                            {baked[o.id] && (
                              <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                                <path
                                  d="M1.5 4.5L3.5 6.5L7.5 2.5"
                                  stroke="#3D7A5A"
                                  strokeWidth="1.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            )}
                          </button>

                          <div>
                            <p
                              className="font-im-fell italic text-plum leading-tight"
                              style={{ textDecoration: baked[o.id] ? "line-through" : "none" }}
                            >
                              {o.customer_name}
                            </p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <p className="font-im-fell-sc text-plum/40 text-xs">
                                {o.reference_number}
                              </p>
                              {!CONFIRMED_STATUSES.has(o.status) && (
                                <span
                                  className="font-im-fell-sc text-xs px-1.5 py-px rounded"
                                  style={{
                                    fontSize: 10,
                                    backgroundColor: "rgba(250,199,117,0.3)",
                                    color: "#8A6A20",
                                  }}
                                >
                                  unconfirmed
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="text-right flex-shrink-0">
                          <p className="font-cormorant italic text-berry text-xl font-medium">
                            {o.quantity}
                          </p>
                          <p className="font-im-fell-sc text-plum/40 text-xs capitalize">
                            {o.flavor}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Shopping list ── */}
      {tab === "shopping" && (
        <div>
          {pendingCupcakes === 0 ? (
            <p className="font-im-fell italic text-plum/30 text-sm text-center py-8">
              {totalCupcakes === 0
                ? "No orders this week"
                : "All batches baked — nothing left to buy"}
            </p>
          ) : (
            <>
              <p className="font-im-fell-sc text-xs text-plum/40 uppercase tracking-widest mb-4">
                For {pendingCupcakes} unbaked cupcake{pendingCupcakes !== 1 ? "s" : ""}
              </p>
              <ul className="space-y-2.5">
                {RECIPE_PER_DOZEN.map(({ key, name, qty, unit }) => {
                  const total = (qty / 12) * pendingCupcakes;
                  const done = shopChecked[key];
                  return (
                    <li key={key} className="flex items-center gap-3">
                      <button
                        onClick={() =>
                          setShopChecked((p) => ({ ...p, [key]: !p[key] }))
                        }
                        className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                          done ? "bg-mint/50 border-mint" : "border-border-pink hover:border-rose"
                        }`}
                        aria-label={done ? "Uncheck" : "Check"}
                      >
                        {done && (
                          <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                            <path
                              d="M1.5 4L3 5.5L6.5 2"
                              stroke="#3D7A5A"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </button>
                      <span
                        className="font-im-fell italic text-plum text-sm flex-1"
                        style={{ opacity: done ? 0.35 : 1, textDecoration: done ? "line-through" : "none" }}
                      >
                        {name}
                      </span>
                      <span
                        className="font-im-fell-sc text-xs tabular-nums"
                        style={{ color: done ? "rgba(74,48,80,0.25)" : "#7A4A6E" }}
                      >
                        {formatQty(total, unit)}
                      </span>
                    </li>
                  );
                })}
              </ul>
              {Object.values(shopChecked).some(Boolean) && (
                <button
                  onClick={() => setShopChecked({})}
                  className="font-im-fell-sc text-xs text-plum/25 hover:text-rose transition-colors uppercase tracking-widest mt-5"
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
          {pantry.length === 0 && (
            <p className="font-im-fell italic text-plum/30 text-sm text-center py-4 mb-2">
              Track what you keep stocked
            </p>
          )}
          <div className="space-y-2 mb-4">
            {pantry.map((item) => (
              <div key={item.id} className="flex items-center gap-3">
                <span className="font-im-fell italic text-plum text-sm flex-1">{item.name}</span>
                <input
                  type="text"
                  value={item.qty}
                  onChange={(e) =>
                    setPantry((p) =>
                      p.map((x) => (x.id === item.id ? { ...x, qty: e.target.value } : x))
                    )
                  }
                  placeholder="qty"
                  className="font-im-fell-sc text-xs text-plum/70 w-20 rounded-lg border-2 border-border-pink px-2 py-1 outline-none focus:border-rose text-center"
                />
                <button
                  onClick={() => setPantry((p) => p.filter((x) => x.id !== item.id))}
                  className="text-plum/20 hover:text-rose transition-colors text-xs leading-none"
                  aria-label="Remove"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addPantryItem()}
              placeholder="Add an item…"
              className="font-im-fell italic text-plum text-sm flex-1 rounded-lg border-2 border-border-pink px-3 py-2 outline-none focus:border-rose placeholder:text-plum/25"
            />
            <button
              onClick={addPantryItem}
              className="font-im-fell-sc text-xs px-4 py-2 rounded-lg bg-rose/15 text-rose border-2 border-rose/30 hover:bg-rose/25 transition-colors"
            >
              Add
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

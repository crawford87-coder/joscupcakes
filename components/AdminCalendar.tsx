"use client";

import { useState } from "react";

type CalendarOrder = {
  id: string;
  reference_number: string;
  customer_name: string;
  pickup_date: string;
  pickup_time: string | null;
  fulfillment_type: string;
  status: string;
  quantity: number;
  total_price: number;
};

const STATUS_BADGE: Record<string, string> = {
  new: "bg-butter/50 text-amber-800",
  confirmed: "bg-mint/50 text-teal-800",
  in_progress: "bg-lavender/50 text-purple-800",
  ready: "bg-green-100 text-green-800",
  delivered: "bg-gray-100 text-gray-600",
};

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function AdminCalendar({ orders }: { orders: CalendarOrder[] }) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Index orders by date string
  const ordersByDate = orders.reduce<Record<string, CalendarOrder[]>>((map, o) => {
    const key = o.pickup_date;
    if (!map[key]) map[key] = [];
    map[key].push(o);
    return map;
  }, {});

  const selectedOrders = selectedDate ? (ordersByDate[selectedDate] ?? []) : [];

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
    setSelectedDate(null);
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
    setSelectedDate(null);
  }

  // Build cells: nulls for empty leading days, then 1..daysInMonth
  const cells: (number | null)[] = [
    ...Array(firstDayOfMonth).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  // Upcoming 7 days
  const weekOut = new Date(today);
  weekOut.setDate(today.getDate() + 7);
  const upcoming = orders
    .filter((o) => {
      const d = new Date(o.pickup_date + "T12:00:00");
      return d >= today && d <= weekOut;
    })
    .sort((a, b) => a.pickup_date.localeCompare(b.pickup_date));

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="font-cormorant italic text-berry text-4xl font-medium">Calendar</h1>
        <p className="font-im-fell italic text-plum/60 text-sm mt-1">Pickup & delivery schedule</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Calendar grid */}
        <div className="lg:col-span-2 card">
          {/* Month nav */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={prevMonth}
              className="font-im-fell-sc text-plum/60 hover:text-rose text-sm px-3 py-1.5 rounded-lg border-2 border-border-pink hover:border-rose-light transition-colors"
            >
              ← Prev
            </button>
            <h2 className="font-cormorant italic text-berry text-2xl font-medium">
              {MONTHS[month]} {year}
            </h2>
            <button
              onClick={nextMonth}
              className="font-im-fell-sc text-plum/60 hover:text-rose text-sm px-3 py-1.5 rounded-lg border-2 border-border-pink hover:border-rose-light transition-colors"
            >
              Next →
            </button>
          </div>

          {/* Day-of-week headers */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {DAYS.map((d) => (
              <div
                key={d}
                className="font-im-fell-sc text-plum/40 text-xs text-center py-1 tracking-widest"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-1">
            {cells.map((day, i) => {
              if (!day) return <div key={`empty-${i}`} />;
              const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const dayOrders = ordersByDate[dateStr] ?? [];
              const isToday =
                today.getFullYear() === year &&
                today.getMonth() === month &&
                today.getDate() === day;
              const isSelected = selectedDate === dateStr;
              const hasOrders = dayOrders.length > 0;

              return (
                <button
                  key={day}
                  onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                  className={`relative p-1.5 rounded-lg text-left min-h-[64px] transition-all border-2 ${
                    isSelected
                      ? "border-rose bg-pink-soft/20"
                      : isToday
                      ? "border-lavender bg-lavender/10"
                      : hasOrders
                      ? "border-border-pink hover:border-rose-light bg-white"
                      : "border-transparent hover:border-border-pink"
                  }`}
                >
                  <span
                    className={`font-im-fell-sc text-xs leading-none ${
                      isToday ? "text-rose" : "text-plum/50"
                    }`}
                  >
                    {day}
                  </span>
                  <div className="mt-1 space-y-0.5">
                    {dayOrders.slice(0, 3).map((o) => (
                      <div
                        key={o.id}
                        className={`text-xs rounded px-1 truncate font-im-fell italic leading-tight ${
                          o.fulfillment_type === "delivery"
                            ? "bg-lavender/40 text-purple-800"
                            : "bg-butter/40 text-amber-800"
                        }`}
                      >
                        {o.customer_name.split(" ")[0]}
                      </div>
                    ))}
                    {dayOrders.length > 3 && (
                      <div className="text-xs text-plum/40 font-im-fell-sc leading-tight">
                        +{dayOrders.length - 3}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex gap-6 mt-4 pt-4 border-t border-border-pink">
            <span className="flex items-center gap-2 font-im-fell-sc text-xs text-plum/50">
              <span className="w-3 h-3 rounded bg-butter/60" /> Pickup
            </span>
            <span className="flex items-center gap-2 font-im-fell-sc text-xs text-plum/50">
              <span className="w-3 h-3 rounded bg-lavender/60" /> Delivery
            </span>
          </div>
        </div>

        {/* Side panel */}
        <div className="space-y-4">
          {/* Selected day detail */}
          {selectedDate ? (
            <div className="card">
              <h3 className="font-cormorant italic text-berry text-xl font-medium mb-4">
                {new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </h3>
              {selectedOrders.length === 0 ? (
                <p className="font-im-fell italic text-plum/50">No orders on this date.</p>
              ) : (
                <div className="space-y-3">
                  {selectedOrders.map((o) => (
                    <div
                      key={o.id}
                      className="rounded-xl border-2 border-border-pink p-3 space-y-1.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-im-fell italic text-plum font-medium leading-tight">
                          {o.customer_name}
                        </p>
                        <span
                          className={`font-im-fell-sc text-xs px-2 py-0.5 rounded-lg whitespace-nowrap ${
                            o.fulfillment_type === "delivery"
                              ? "bg-lavender/40 text-purple-800"
                              : "bg-butter/40 text-amber-800"
                          }`}
                        >
                          {o.fulfillment_type}
                        </span>
                      </div>
                      <p className="font-im-fell-sc text-plum/40 text-xs">
                        {o.reference_number}
                      </p>
                      <div className="flex items-center gap-3">
                        <span className="font-cormorant text-berry font-medium">
                          {o.quantity} cupcakes
                        </span>
                        {o.pickup_time && (
                          <span className="font-im-fell italic text-plum/60 text-sm">
                            {o.pickup_time}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-cormorant text-berry font-medium">
                          ${o.total_price}
                        </span>
                        <span
                          className={`font-im-fell-sc text-xs px-2 py-0.5 rounded-lg capitalize ${
                            STATUS_BADGE[o.status] ?? "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {o.status.replace("_", " ")}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="card text-center py-10">
              <p className="font-im-fell italic text-plum/40 text-lg">
                Click a date to see its orders
              </p>
            </div>
          )}

          {/* Upcoming 7 days */}
          <div className="card">
            <h3 className="font-cormorant italic text-berry text-xl font-medium mb-4">
              Next 7 days
            </h3>
            {upcoming.length === 0 ? (
              <p className="font-im-fell italic text-plum/50 text-sm">Nothing scheduled.</p>
            ) : (
              <div className="divide-y divide-border-pink">
                {upcoming.map((o) => (
                  <div key={o.id} className="flex items-center justify-between py-2.5">
                    <div>
                      <p className="font-im-fell italic text-plum text-sm leading-tight">
                        {o.customer_name}
                      </p>
                      <p className="font-im-fell-sc text-plum/40 text-xs">
                        {new Date(o.pickup_date + "T12:00:00").toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                        {o.pickup_time ? ` · ${o.pickup_time}` : ""}
                      </p>
                    </div>
                    <span className="font-cormorant text-berry font-medium text-lg">
                      {o.quantity}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

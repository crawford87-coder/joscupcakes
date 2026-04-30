"use client";

import { useState, useMemo, useCallback } from "react";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

type CustomerOrder = {
  id: string;
  reference_number: string;
  created_at: string;
  pickup_date: string;
  quantity: number;
  flavor: string;
  total_price: number;
  status: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  fulfillment_type?: string;
  delivery_address?: string;
  topper_description?: string;
  notes?: string;
};

export type CustomerNote = {
  email: string;
  notes: string | null;
  address: string | null;
  child_name: string | null;
  birthday_month: number | null;
  reminder_sent_at: string | null;
};

interface Customer {
  name: string;
  email: string;
  phone: string;
  orderCount: number;
  totalSpent: number;
  firstOrderAt: string;
  lastOrderAt: string;
  orders: CustomerOrder[];
  inferredAddress: string | null;
  annualMonth: number | null;
  suggestedChildName: string | null;
}

function extractChildName(text: string): string | null {
  const match = text.match(/([A-Z][a-z]{1,14})'s\s+(?:birthday|bday|party)/i);
  return match ? match[1] : null;
}

function detectAnnualMonth(orders: CustomerOrder[]): number | null {
  const byMonth: Record<number, Set<number>> = {};
  orders.forEach((o) => {
    const d = new Date(o.pickup_date + "T12:00:00");
    const month = d.getMonth() + 1;
    const year = d.getFullYear();
    if (!byMonth[month]) byMonth[month] = new Set();
    byMonth[month].add(year);
  });
  for (const [month, years] of Object.entries(byMonth)) {
    if (years.size >= 2) return Number(month);
  }
  return null;
}

export default function AdminCustomers({
  orders,
  initialNotes,
}: {
  orders: CustomerOrder[];
  initialNotes: CustomerNote[];
}) {
  const [expandedEmail, setExpandedEmail] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [notesMap, setNotesMap] = useState<Record<string, CustomerNote>>(() => {
    const m: Record<string, CustomerNote> = {};
    initialNotes.forEach((n) => { m[n.email] = n; });
    return m;
  });
  const [savingMap, setSavingMap] = useState<Record<string, boolean>>({});
  const [sendingMap, setSendingMap] = useState<Record<string, boolean>>({});
  const [sentMap, setSentMap] = useState<Record<string, boolean>>({});

  const customers = useMemo<Customer[]>(() => {
    const map: Record<string, Customer> = {};
    orders.forEach((o) => {
      if (!map[o.customer_email]) {
        map[o.customer_email] = {
          name: o.customer_name,
          email: o.customer_email,
          phone: o.customer_phone,
          orderCount: 0,
          totalSpent: 0,
          firstOrderAt: o.created_at,
          lastOrderAt: o.created_at,
          orders: [],
          inferredAddress: null,
          annualMonth: null,
          suggestedChildName: null,
        };
      }
      const c = map[o.customer_email];
      c.orderCount++;
      if (o.status !== "cancelled") c.totalSpent += Number(o.total_price);
      if (o.created_at < c.firstOrderAt) c.firstOrderAt = o.created_at;
      if (o.created_at > c.lastOrderAt) c.lastOrderAt = o.created_at;
      c.orders.push(o);
      if (o.fulfillment_type === "delivery" && o.delivery_address && o.created_at >= c.lastOrderAt) {
        c.inferredAddress = o.delivery_address;
      }
    });
    Object.values(map).forEach((c) => {
      c.annualMonth = detectAnnualMonth(c.orders);
      for (const o of c.orders) {
        const text = [o.topper_description, o.notes].filter(Boolean).join(" ");
        if (text) {
          const found = extractChildName(text);
          if (found) { c.suggestedChildName = found; break; }
        }
      }
    });
    return Object.values(map).sort((a, b) => b.orderCount - a.orderCount);
  }, [orders]);

  const filtered = useMemo(() => {
    if (!search.trim()) return customers;
    const q = search.toLowerCase();
    return customers.filter(
      (c) => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.phone.includes(q)
    );
  }, [customers, search]);

  const getNotes = useCallback((email: string): CustomerNote => {
    return notesMap[email] ?? { email, notes: null, address: null, child_name: null, birthday_month: null, reminder_sent_at: null };
  }, [notesMap]);

  const updateNotes = useCallback((email: string, patch: Partial<CustomerNote>) => {
    setNotesMap((prev) => ({
      ...prev,
      [email]: { ...(prev[email] ?? { email, notes: null, address: null, child_name: null, birthday_month: null, reminder_sent_at: null }), ...patch },
    }));
  }, []);

  async function saveNotes(email: string) {
    setSavingMap((p) => ({ ...p, [email]: true }));
    const n = getNotes(email);
    await fetch("/api/admin/customers/notes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, notes: n.notes, address: n.address, child_name: n.child_name, birthday_month: n.birthday_month }),
    });
    setSavingMap((p) => ({ ...p, [email]: false }));
  }

  async function sendReminder(customer: Customer) {
    const email = customer.email;
    setSendingMap((p) => ({ ...p, [email]: true }));
    const n = getNotes(email);
    const lastOrder = customer.orders
      .filter((o) => o.status !== "cancelled")
      .sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
    await fetch("/api/admin/customers/reminder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        customerName: customer.name,
        childName: n.child_name ?? customer.suggestedChildName,
        birthdayMonth: n.birthday_month ?? customer.annualMonth,
        lastOrderYear: lastOrder ? new Date(lastOrder.created_at).getFullYear() : new Date().getFullYear() - 1,
        lastOrderFlavor: lastOrder?.flavor ?? "vanilla",
        lastOrderQuantity: lastOrder?.quantity ?? 12,
      }),
    });
    setSendingMap((p) => ({ ...p, [email]: false }));
    setSentMap((p) => ({ ...p, [email]: true }));
    updateNotes(email, { reminder_sent_at: new Date().toISOString() });
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="font-cormorant italic text-berry text-4xl font-medium">Customers</h1>
        <p className="font-im-fell italic text-plum/60 text-sm mt-1">
          {customers.length} customers · {orders.length} orders total
        </p>
      </div>

      <div className="card mb-6">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, or phone…"
          className="w-full rounded-xl border-2 border-border-pink px-4 py-2.5 font-im-fell italic text-plum outline-none focus:border-rose"
        />
      </div>

      {/* Desktop table */}
      <div className="hidden md:block card overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-border-pink">
              {["Customer", "Email", "Phone", "Orders", "Total Spent", "First Order", "Last Order"].map((h) => (
                <th key={h} className="font-im-fell-sc text-plum/60 text-xs tracking-widest text-left px-4 py-3 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="font-im-fell italic text-plum/50 text-center py-12">No customers found.</td></tr>
            )}
            {filtered.map((c) => (
              <>
                <tr
                  key={c.email}
                  onClick={() => setExpandedEmail(expandedEmail === c.email ? null : c.email)}
                  className="border-b border-border-pink hover:bg-pink-soft/10 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3 font-im-fell italic text-plum font-medium">
                    <div className="flex items-center gap-2">
                      {c.name}
                      {(c.annualMonth || getNotes(c.email).birthday_month) && (
                        <span className="text-xs bg-rose/10 text-rose px-2 py-0.5 rounded-full font-im-fell-sc">
                          🎂 {MONTH_NAMES[(getNotes(c.email).birthday_month ?? c.annualMonth ?? 1) - 1]}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-im-fell italic text-plum/70 text-xs">{c.email}</td>
                  <td className="px-4 py-3 font-im-fell italic text-plum/70">{c.phone}</td>
                  <td className="px-4 py-3 font-cormorant text-berry text-xl font-medium">{c.orderCount}</td>
                  <td className="px-4 py-3 font-cormorant text-berry text-xl font-medium">${c.totalSpent.toLocaleString()}</td>
                  <td className="px-4 py-3 font-im-fell italic text-plum/50 text-xs">{new Date(c.firstOrderAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</td>
                  <td className="px-4 py-3 font-im-fell italic text-plum/50 text-xs">{new Date(c.lastOrderAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</td>
                </tr>
                {expandedEmail === c.email && (
                  <tr key={`${c.email}-detail`} className="bg-pink-soft/5">
                    <td colSpan={7} className="px-6 py-5">
                      <CustomerDetail
                        customer={c}
                        notes={getNotes(c.email)}
                        saving={savingMap[c.email] ?? false}
                        sending={sendingMap[c.email] ?? false}
                        sent={sentMap[c.email] ?? false}
                        onUpdateNotes={(patch) => updateNotes(c.email, patch)}
                        onSaveNotes={() => saveNotes(c.email)}
                        onSendReminder={() => sendReminder(c)}
                      />
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-4">
        {filtered.length === 0 && (
          <div className="card text-center py-10">
            <p className="font-im-fell italic text-plum/50">No customers found.</p>
          </div>
        )}
        {filtered.map((c) => (
          <div key={c.email} className="card">
            <div className="flex items-start justify-between cursor-pointer" onClick={() => setExpandedEmail(expandedEmail === c.email ? null : c.email)}>
              <div>
                <p className="font-im-fell italic text-plum font-medium text-xl leading-tight">{c.name}</p>
                <p className="font-im-fell italic text-plum/60 text-sm mt-0.5">{c.email}</p>
                <p className="font-im-fell italic text-plum/60 text-sm">{c.phone}</p>
                {(c.annualMonth || getNotes(c.email).birthday_month) && (
                  <span className="mt-1 inline-block text-xs bg-rose/10 text-rose px-2 py-0.5 rounded-full font-im-fell-sc">
                    🎂 {MONTH_NAMES[(getNotes(c.email).birthday_month ?? c.annualMonth ?? 1) - 1]}
                  </span>
                )}
              </div>
              <div className="text-right shrink-0 ml-3">
                <p className="font-cormorant italic text-berry text-4xl font-medium leading-none">{c.orderCount}</p>
                <p className="font-im-fell-sc text-plum/40 text-xs">order{c.orderCount !== 1 ? "s" : ""}</p>
                <p className="font-cormorant italic text-berry font-medium mt-1">${c.totalSpent.toLocaleString()}</p>
              </div>
            </div>
            {expandedEmail === c.email && (
              <div className="mt-4 pt-4 border-t border-border-pink">
                <CustomerDetail
                  customer={c}
                  notes={getNotes(c.email)}
                  saving={savingMap[c.email] ?? false}
                  sending={sendingMap[c.email] ?? false}
                  sent={sentMap[c.email] ?? false}
                  onUpdateNotes={(patch) => updateNotes(c.email, patch)}
                  onSaveNotes={() => saveNotes(c.email)}
                  onSendReminder={() => sendReminder(c)}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function CustomerDetail({
  customer, notes, saving, sending, sent,
  onUpdateNotes, onSaveNotes, onSendReminder,
}: {
  customer: Customer;
  notes: CustomerNote;
  saving: boolean;
  sending: boolean;
  sent: boolean;
  onUpdateNotes: (patch: Partial<CustomerNote>) => void;
  onSaveNotes: () => void;
  onSendReminder: () => void;
}) {
  const reminderMonth = notes.birthday_month ?? customer.annualMonth;
  const childName = notes.child_name ?? customer.suggestedChildName;
  const address = notes.address ?? customer.inferredAddress ?? "";

  return (
    <div className="space-y-6">
      {/* Reminder opportunity banner */}
      {reminderMonth && !sent && (
        <div className="rounded-2xl border-2 border-rose/30 bg-rose/5 p-4 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <p className="font-im-fell-sc text-rose text-xs uppercase tracking-widest mb-1">Reminder opportunity ✦</p>
            <p className="font-im-fell italic text-plum text-sm">
              {customer.name} has ordered in <strong>{MONTH_NAMES[reminderMonth - 1]}</strong> before
              {childName ? ` — likely for ${childName}'s birthday` : ""}.
              {notes.reminder_sent_at
                ? ` Last reminder sent ${new Date(notes.reminder_sent_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}.`
                : " No reminder sent yet."}
            </p>
          </div>
          <button
            onClick={onSendReminder}
            disabled={sending}
            className="btn-primary shrink-0 text-sm px-5 py-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {sending ? "Sending…" : `✉ Send ${MONTH_NAMES[reminderMonth - 1]} reminder`}
          </button>
        </div>
      )}
      {sent && (
        <div className="rounded-2xl border-2 border-mint/50 bg-mint/10 px-4 py-3">
          <p className="font-im-fell italic text-plum text-sm">✓ Reminder sent to {customer.email}</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Address */}
        <div className="space-y-1.5">
          <label className="font-im-fell-sc text-plum/50 text-xs uppercase tracking-widest block">Address</label>
          <input
            type="text"
            value={address}
            onChange={(e) => onUpdateNotes({ address: e.target.value || null })}
            onBlur={onSaveNotes}
            placeholder={customer.inferredAddress ?? "No address on file"}
            className="w-full rounded-xl border-2 border-border-pink px-3 py-2 font-im-fell italic text-plum text-sm bg-white outline-none focus:border-rose"
          />
          {customer.inferredAddress && !notes.address && (
            <p className="font-im-fell italic text-plum/40 text-xs">Auto-filled from last delivery</p>
          )}
        </div>

        {/* Child's name */}
        <div className="space-y-1.5">
          <label className="font-im-fell-sc text-plum/50 text-xs uppercase tracking-widest block">Child&apos;s name</label>
          <input
            type="text"
            value={notes.child_name ?? ""}
            onChange={(e) => onUpdateNotes({ child_name: e.target.value || null })}
            onBlur={onSaveNotes}
            placeholder={customer.suggestedChildName ?? "e.g. Max"}
            className="w-full rounded-xl border-2 border-border-pink px-3 py-2 font-im-fell italic text-plum text-sm bg-white outline-none focus:border-rose"
          />
          {customer.suggestedChildName && !notes.child_name && (
            <p className="font-im-fell italic text-plum/40 text-xs">Suggested from order notes</p>
          )}
        </div>

        {/* Birthday month */}
        <div className="space-y-1.5">
          <label className="font-im-fell-sc text-plum/50 text-xs uppercase tracking-widest block">Birthday month</label>
          <select
            value={notes.birthday_month ?? customer.annualMonth ?? ""}
            onChange={(e) => onUpdateNotes({ birthday_month: e.target.value ? Number(e.target.value) : null })}
            onBlur={onSaveNotes}
            className="w-full rounded-xl border-2 border-border-pink px-3 py-2 font-im-fell italic text-plum text-sm bg-white outline-none focus:border-rose"
          >
            <option value="">— not set —</option>
            {MONTH_NAMES.map((m, i) => (
              <option key={m} value={i + 1}>{m}</option>
            ))}
          </select>
          {customer.annualMonth && !notes.birthday_month && (
            <p className="font-im-fell italic text-plum/40 text-xs">Detected from order patterns</p>
          )}
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-1.5">
        <label className="font-im-fell-sc text-plum/50 text-xs uppercase tracking-widest block">Notes</label>
        <textarea
          value={notes.notes ?? ""}
          onChange={(e) => onUpdateNotes({ notes: e.target.value || null })}
          onBlur={onSaveNotes}
          rows={3}
          placeholder="Allergies, preferences, sibling names, anything useful…"
          className="w-full rounded-xl border-2 border-border-pink px-3 py-2.5 font-im-fell italic text-plum text-sm bg-white outline-none focus:border-rose resize-none"
        />
        <div className="flex justify-between items-center">
          <p className="font-im-fell italic text-plum/40 text-xs">Saved automatically when you click away</p>
          {saving && <p className="font-im-fell italic text-plum/40 text-xs">Saving…</p>}
        </div>
      </div>

      {/* Order history */}
      <div>
        <p className="font-im-fell-sc text-plum/40 text-xs uppercase tracking-widest mb-3">Order History</p>
        <div className="space-y-2">
          {customer.orders
            .slice()
            .sort((a, b) => b.created_at.localeCompare(a.created_at))
            .map((o) => (
              <div key={o.id} className="flex items-center gap-4 text-sm rounded-xl bg-white border border-border-pink px-4 py-2.5 flex-wrap">
                <span className="font-im-fell-sc text-plum/40 text-xs w-24 shrink-0">{o.reference_number}</span>
                <span className="font-im-fell italic text-plum">
                  {new Date(o.pickup_date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </span>
                <span className="font-cormorant text-berry font-medium">{o.quantity} cupcakes</span>
                <span className="font-im-fell italic text-plum/60 capitalize">{o.flavor}</span>
                <span className="font-cormorant text-berry font-medium">${o.total_price}</span>
                <span className="font-im-fell-sc text-xs px-2 py-0.5 rounded-lg bg-pink-soft/40 text-plum capitalize ml-auto">
                  {o.status.replace("_", " ")}
                </span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

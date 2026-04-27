"use client";

import { useState, useMemo } from "react";

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
}

export default function AdminCustomers({ orders }: { orders: CustomerOrder[] }) {
  const [expandedEmail, setExpandedEmail] = useState<string | null>(null);
  const [search, setSearch] = useState("");

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
        };
      }
      const c = map[o.customer_email];
      c.orderCount++;
      if (o.status !== "cancelled") c.totalSpent += Number(o.total_price);
      if (o.created_at < c.firstOrderAt) c.firstOrderAt = o.created_at;
      if (o.created_at > c.lastOrderAt) c.lastOrderAt = o.created_at;
      c.orders.push(o);
    });
    return Object.values(map).sort((a, b) => b.orderCount - a.orderCount);
  }, [orders]);

  const filtered = useMemo(() => {
    if (!search.trim()) return customers;
    const q = search.toLowerCase();
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phone.includes(q)
    );
  }, [customers, search]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="font-cormorant italic text-berry text-4xl font-medium">Customers</h1>
        <p className="font-im-fell italic text-plum/60 text-sm mt-1">
          {customers.length} customers · {orders.length} orders total
        </p>
      </div>

      {/* Search */}
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
              {[
                "Customer",
                "Email",
                "Phone",
                "Orders",
                "Total Spent",
                "First Order",
                "Last Order",
              ].map((h) => (
                <th
                  key={h}
                  className="font-im-fell-sc text-plum/60 text-xs tracking-widest text-left px-4 py-3 uppercase"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="font-im-fell italic text-plum/50 text-center py-12"
                >
                  No customers found.
                </td>
              </tr>
            )}
            {filtered.map((c) => (
              <>
                <tr
                  key={c.email}
                  onClick={() =>
                    setExpandedEmail(expandedEmail === c.email ? null : c.email)
                  }
                  className="border-b border-border-pink hover:bg-pink-soft/10 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3 font-im-fell italic text-plum font-medium">
                    {c.name}
                  </td>
                  <td className="px-4 py-3 font-im-fell italic text-plum/70 text-xs">
                    {c.email}
                  </td>
                  <td className="px-4 py-3 font-im-fell italic text-plum/70">{c.phone}</td>
                  <td className="px-4 py-3 font-cormorant text-berry text-xl font-medium">
                    {c.orderCount}
                  </td>
                  <td className="px-4 py-3 font-cormorant text-berry text-xl font-medium">
                    ${c.totalSpent.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 font-im-fell italic text-plum/50 text-xs">
                    {new Date(c.firstOrderAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3 font-im-fell italic text-plum/50 text-xs">
                    {new Date(c.lastOrderAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                </tr>

                {/* Expanded order history */}
                {expandedEmail === c.email && (
                  <tr key={`${c.email}-detail`} className="bg-pink-soft/5">
                    <td colSpan={7} className="px-6 py-4">
                      <p className="font-im-fell-sc text-plum/40 text-xs uppercase tracking-widest mb-3">
                        Order History
                      </p>
                      <div className="space-y-2">
                        {c.orders
                          .slice()
                          .sort((a, b) => b.created_at.localeCompare(a.created_at))
                          .map((o) => (
                            <div
                              key={o.id}
                              className="flex items-center gap-4 text-sm rounded-xl bg-white border border-border-pink px-4 py-2.5 flex-wrap"
                            >
                              <span className="font-im-fell-sc text-plum/40 text-xs w-24 shrink-0">
                                {o.reference_number}
                              </span>
                              <span className="font-im-fell italic text-plum">
                                {new Date(o.pickup_date + "T12:00:00").toLocaleDateString(
                                  "en-US",
                                  { month: "short", day: "numeric", year: "numeric" }
                                )}
                              </span>
                              <span className="font-cormorant text-berry font-medium">
                                {o.quantity} cupcakes
                              </span>
                              <span className="font-im-fell italic text-plum/60 capitalize">
                                {o.flavor}
                              </span>
                              <span className="font-cormorant text-berry font-medium">
                                ${o.total_price}
                              </span>
                              <span className="font-im-fell-sc text-xs px-2 py-0.5 rounded-lg bg-pink-soft/40 text-plum capitalize ml-auto">
                                {o.status.replace("_", " ")}
                              </span>
                            </div>
                          ))}
                      </div>
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
            <div
              className="flex items-start justify-between cursor-pointer"
              onClick={() =>
                setExpandedEmail(expandedEmail === c.email ? null : c.email)
              }
            >
              <div>
                <p className="font-im-fell italic text-plum font-medium text-xl leading-tight">
                  {c.name}
                </p>
                <p className="font-im-fell italic text-plum/60 text-sm mt-0.5">{c.email}</p>
                <p className="font-im-fell italic text-plum/60 text-sm">{c.phone}</p>
              </div>
              <div className="text-right shrink-0 ml-3">
                <p className="font-cormorant italic text-berry text-4xl font-medium leading-none">
                  {c.orderCount}
                </p>
                <p className="font-im-fell-sc text-plum/40 text-xs">
                  order{c.orderCount !== 1 ? "s" : ""}
                </p>
                <p className="font-cormorant italic text-berry font-medium mt-1">
                  ${c.totalSpent.toLocaleString()}
                </p>
              </div>
            </div>

            {expandedEmail === c.email && (
              <div className="mt-4 pt-4 border-t border-border-pink space-y-2">
                <p className="font-im-fell-sc text-plum/40 text-xs uppercase tracking-widest">
                  Order History
                </p>
                {c.orders
                  .slice()
                  .sort((a, b) => b.created_at.localeCompare(a.created_at))
                  .map((o) => (
                    <div
                      key={o.id}
                      className="rounded-xl bg-pink-soft/10 px-3 py-2.5 text-sm"
                    >
                      <div className="flex justify-between items-center mb-0.5">
                        <span className="font-im-fell-sc text-plum/40 text-xs">
                          {o.reference_number}
                        </span>
                        <span className="font-im-fell-sc text-xs px-1.5 py-0.5 rounded bg-pink-soft/50 text-plum capitalize">
                          {o.status.replace("_", " ")}
                        </span>
                      </div>
                      <p className="font-im-fell italic text-plum">
                        {new Date(o.pickup_date + "T12:00:00").toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}{" "}
                        · {o.quantity} {o.flavor} cupcakes · ${o.total_price}
                      </p>
                    </div>
                  ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

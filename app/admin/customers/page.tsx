export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminCustomers, { type CustomerNote } from "@/components/AdminCustomers";

export const metadata = { title: "Customers — Jo's Cupcakes Admin" };

export default async function CustomersPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) redirect("/admin/login");

  const [ordersResult, notesResult] = await Promise.all([
    supabase
      .from("orders")
      .select(
        "id, reference_number, created_at, pickup_date, quantity, flavor, total_price, status, customer_name, customer_email, customer_phone, fulfillment_type, delivery_address, topper_description, notes"
      )
      .order("created_at", { ascending: false }),
    supabase
      .from("customer_notes")
      .select("email, notes, address, child_name, birthday_month, reminder_sent_at"),
  ]);

  if (ordersResult.error) {
    return (
      <div className="p-8 text-center font-im-fell italic text-plum">
        Failed to load customers.
      </div>
    );
  }

  return (
    <AdminCustomers
      orders={ordersResult.data ?? []}
      initialNotes={(notesResult.data ?? []) as CustomerNote[]}
    />
  );
}

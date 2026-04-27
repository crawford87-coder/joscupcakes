export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminCustomers from "@/components/AdminCustomers";

export const metadata = { title: "Customers — Jo's Cupcakes Admin" };

export default async function CustomersPage() {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) redirect("/admin/login");

  const { data: orders, error } = await supabase
    .from("orders")
    .select(
      "id, reference_number, created_at, pickup_date, quantity, flavor, total_price, status, customer_name, customer_email, customer_phone"
    )
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="p-8 text-center font-im-fell italic text-plum">
        Failed to load customers.
      </div>
    );
  }

  return <AdminCustomers orders={orders ?? []} />;
}

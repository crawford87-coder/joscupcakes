export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminDashboard from "@/components/AdminDashboard";

export const metadata = {
  title: "Admin — Jo's Cupcakes",
};

export default async function AdminPage() {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) redirect("/admin/login");

  // Fetch orders sorted by pickup date ascending
  const { data: orders, error } = await supabase
    .from("orders")
    .select("*")
    .order("pickup_date", { ascending: true });

  if (error) {
    return (
      <div className="p-8 text-center font-im-fell italic text-plum">
        Failed to load orders.
      </div>
    );
  }

  return <AdminDashboard orders={orders ?? []} />;
}

export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminAnalytics from "@/components/AdminAnalytics";

export const metadata = { title: "Analytics — Jo's Cupcakes Admin" };

export default async function AnalyticsPage() {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) redirect("/admin/login");

  const { data: orders, error } = await supabase
    .from("orders")
    .select(
      "id, created_at, pickup_date, quantity, flavor, total_price, status, fulfillment_type, customer_name, customer_email"
    )
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="p-8 text-center font-im-fell italic text-plum">
        Failed to load analytics.
      </div>
    );
  }

  return <AdminAnalytics orders={orders ?? []} />;
}

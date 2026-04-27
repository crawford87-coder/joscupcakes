export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminCalendar from "@/components/AdminCalendar";

export const metadata = { title: "Calendar — Jo's Cupcakes Admin" };

export default async function CalendarPage() {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) redirect("/admin/login");

  const { data: orders, error } = await supabase
    .from("orders")
    .select(
      "id, reference_number, customer_name, pickup_date, pickup_time, fulfillment_type, status, quantity, total_price"
    )
    .neq("status", "cancelled")
    .order("pickup_date", { ascending: true });

  if (error) {
    return (
      <div className="p-8 text-center font-im-fell italic text-plum">
        Failed to load calendar.
      </div>
    );
  }

  return <AdminCalendar orders={orders ?? []} />;
}

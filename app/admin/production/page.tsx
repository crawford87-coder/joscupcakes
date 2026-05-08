export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminBakePlan from "@/components/AdminBakePlan";

export const metadata = { title: "Production — Jo's Cupcakes Admin" };

export default async function ProductionPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) redirect("/admin/login");

  const { data: orders } = await supabase
    .from("orders")
    .select("id, reference_number, customer_name, pickup_date, quantity, flavor, status")
    .neq("status", "cancelled")
    .order("pickup_date", { ascending: true });

  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  const weekStartStr = weekStart.toISOString().slice(0, 10);
  const weekEndStr = weekEnd.toISOString().slice(0, 10);

  const thisWeek = (orders ?? []).filter(
    (o) => o.pickup_date >= weekStartStr && o.pickup_date <= weekEndStr
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="font-cormorant italic text-berry text-4xl font-medium">Production</h1>
        <p className="font-im-fell italic text-plum/60 text-sm mt-1">
          Jo&apos;s Cupcakes — Bakery ops
        </p>
      </div>
      <AdminBakePlan orders={thisWeek} />
    </div>
  );
}

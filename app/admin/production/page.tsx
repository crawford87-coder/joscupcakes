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

  const threeWeeksOut = new Date();
  threeWeeksOut.setDate(threeWeeksOut.getDate() + 21);

  const { data: orders } = await supabase
    .from("orders")
    .select(
      "id, reference_number, customer_name, pickup_date, pickup_time, quantity, flavor, status, icing_colors, topper, topper_description"
    )
    .not("status", "in", '("delivered","cancelled")')
    .lte("pickup_date", threeWeeksOut.toISOString().slice(0, 10))
    .order("pickup_date", { ascending: true });

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="font-cormorant italic text-berry text-4xl font-medium">Production</h1>
          <p className="font-sans text-sm mt-1" style={{ color: "#8C7B74" }}>
            Jo&apos;s Cupcakes
          </p>
        </div>
        <AdminBakePlan orders={orders ?? []} />
    </div>
  );
}

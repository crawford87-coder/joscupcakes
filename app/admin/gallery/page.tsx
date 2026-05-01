export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminGallery from "@/components/AdminGallery";

export const metadata = {
  title: "Gallery — Jo's Cupcakes Admin",
};

export default async function AdminGalleryPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) redirect("/admin/login");

  const { data: images, error } = await supabase
    .from("gallery_images")
    .select("*")
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Gallery fetch error:", error);
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="font-cormorant italic text-3xl font-medium mb-1" style={{ color: "#3D2B1F" }}>
          Gallery
        </h1>
        <p className="font-im-fell italic text-sm opacity-60" style={{ color: "#6B5C52" }}>
          Photos visible on the public gallery page. Upload, caption, or delete.
        </p>
      </div>
      <AdminGallery initialImages={images ?? []} />
    </div>
  );
}

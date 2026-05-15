import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

// Requires: Supabase storage bucket named "order-photos" with public access,
// and a nullable "delivery_photo_url" column on the orders table.

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("photo") as File | null;
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const allowed = ["jpg", "jpeg", "png", "webp", "heic", "heif"];
  if (!allowed.includes(ext)) {
    return NextResponse.json({ error: "File type not allowed" }, { status: 400 });
  }

  const path = `delivery/${id}_${Date.now()}.${ext}`;
  const buffer = await file.arrayBuffer();

  const service = createServiceClient();

  const { error: uploadError } = await service.storage
    .from("order-photos")
    .upload(path, buffer, { contentType: file.type, upsert: true });

  if (uploadError) {
    console.error("Photo upload error:", uploadError);
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const {
    data: { publicUrl },
  } = service.storage.from("order-photos").getPublicUrl(path);

  await service
    .from("orders")
    .update({ delivery_photo_url: publicUrl })
    .eq("id", id);

  return NextResponse.json({ url: publicUrl });
}

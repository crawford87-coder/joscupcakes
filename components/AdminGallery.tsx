"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

interface GalleryImage {
  id: string;
  url: string;
  caption: string | null;
  display_order: number;
  created_at: string;
}

interface Props {
  initialImages: GalleryImage[];
}

export default function AdminGallery({ initialImages }: Props) {
  const [images, setImages] = useState<GalleryImage[]>(initialImages);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [editingCaption, setEditingCaption] = useState<string | null>(null); // image id
  const [captionDraft, setCaptionDraft] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null); // image id
  const fileInputRef = useRef<HTMLInputElement>(null);

  const supabase = createClient();

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploadError(null);
    setUploading(true);
    try {
      for (const file of files) {
        if (!file.type.startsWith("image/")) continue;
        if (file.size > 20 * 1024 * 1024) {
          setUploadError(`${file.name} is over 20 MB — skipped.`);
          continue;
        }
        const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
        const fileName = `gallery-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("gallery")
          .upload(fileName, file, { cacheControl: "3600", upsert: false });
        if (upErr) throw upErr;
        const { data: urlData } = supabase.storage.from("gallery").getPublicUrl(fileName);
        const { data: row, error: dbErr } = await supabase
          .from("gallery_images")
          .insert({ url: urlData.publicUrl, caption: null, display_order: 0 })
          .select()
          .single();
        if (dbErr) throw dbErr;
        setImages((prev) => [row, ...prev]);
      }
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleDelete(img: GalleryImage) {
    if (!confirm(`Delete this image? This cannot be undone.`)) return;
    setDeleting(img.id);
    try {
      // Extract storage path from URL
      const urlPath = new URL(img.url).pathname;
      const storagePath = urlPath.split("/storage/v1/object/public/gallery/")[1];
      if (storagePath) {
        await supabase.storage.from("gallery").remove([storagePath]);
      }
      await supabase.from("gallery_images").delete().eq("id", img.id);
      setImages((prev) => prev.filter((i) => i.id !== img.id));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Delete failed.");
    } finally {
      setDeleting(null);
    }
  }

  const startEditCaption = useCallback((img: GalleryImage) => {
    setEditingCaption(img.id);
    setCaptionDraft(img.caption ?? "");
  }, []);

  async function saveCaption(img: GalleryImage) {
    const { error } = await supabase
      .from("gallery_images")
      .update({ caption: captionDraft.trim() || null })
      .eq("id", img.id);
    if (error) { alert(error.message); return; }
    setImages((prev) =>
      prev.map((i) => i.id === img.id ? { ...i, caption: captionDraft.trim() || null } : i)
    );
    setEditingCaption(null);
  }

  return (
    <div className="space-y-6">
      {/* Upload button */}
      <div className="flex items-center gap-4 flex-wrap">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-pill font-caveat text-base transition-all"
          style={{ backgroundColor: "#D4788E", color: "white", opacity: uploading ? 0.6 : 1 }}
        >
          {uploading ? "Uploading…" : "✦ Upload photos"}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleUpload}
        />
        <span className="font-im-fell italic text-sm opacity-50" style={{ color: "#6B5C52" }}>
          JPG, PNG, WebP · up to 20 MB each · multiple allowed
        </span>
      </div>

      {uploadError && (
        <p className="font-im-fell italic text-sm" style={{ color: "#C0392B" }}>{uploadError}</p>
      )}

      {/* Gallery grid */}
      {images.length === 0 ? (
        <div className="rounded-2xl py-20 text-center" style={{ border: "2px dashed #E8DDD4" }}>
          <p className="font-caveat text-lg opacity-40" style={{ color: "#6B5C52" }}>No photos yet — upload your first one above ↑</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((img) => (
            <div
              key={img.id}
              className="group relative rounded-2xl overflow-hidden"
              style={{ border: "1.5px solid #E8DDD4", backgroundColor: "#F5F0E8" }}
            >
              <div className="relative aspect-square w-full">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.url}
                  alt={img.caption ?? "Gallery photo"}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                {deleting === img.id && (
                  <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: "rgba(250,247,242,0.85)" }}>
                    <span className="font-caveat text-sm" style={{ color: "#D4788E" }}>Deleting…</span>
                  </div>
                )}
                {/* Hover overlay */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3"
                  style={{ backgroundColor: "rgba(61,43,31,0.45)" }}>
                  <button
                    type="button"
                    onClick={() => startEditCaption(img)}
                    className="w-9 h-9 rounded-full flex items-center justify-center text-sm"
                    style={{ backgroundColor: "white", color: "#3D2B1F" }}
                    title="Edit caption"
                  >✎</button>
                  <button
                    type="button"
                    onClick={() => handleDelete(img)}
                    className="w-9 h-9 rounded-full flex items-center justify-center text-sm"
                    style={{ backgroundColor: "#D4788E", color: "white" }}
                    title="Delete"
                  >✕</button>
                </div>
              </div>

              {/* Caption display / edit */}
              <div className="px-3 py-2">
                {editingCaption === img.id ? (
                  <div className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={captionDraft}
                      onChange={(e) => setCaptionDraft(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") saveCaption(img); if (e.key === "Escape") setEditingCaption(null); }}
                      placeholder="Add a caption…"
                      autoFocus
                      className="flex-1 min-w-0 text-xs rounded-lg px-2 py-1 outline-none font-im-fell italic"
                      style={{ border: "1.5px solid #C4AED8", backgroundColor: "white", color: "#3D2B1F" }}
                    />
                    <button type="button" onClick={() => saveCaption(img)} className="font-caveat text-xs" style={{ color: "#D4788E" }}>Save</button>
                    <button type="button" onClick={() => setEditingCaption(null)} className="font-caveat text-xs opacity-40" style={{ color: "#6B5C52" }}>✕</button>
                  </div>
                ) : (
                  <p
                    className="font-im-fell italic text-xs truncate cursor-pointer"
                    style={{ color: img.caption ? "#3D2B1F" : "#C0B8B0" }}
                    onClick={() => startEditCaption(img)}
                    title={img.caption ?? "Click to add caption"}
                  >
                    {img.caption ?? "Add caption…"}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

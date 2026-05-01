import { createClient } from "@/lib/supabase/server";
import AdminNavTabs from "@/components/AdminNavTabs";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return (
    <>
      {session && <AdminNavTabs />}
      {children}
    </>
  );
}

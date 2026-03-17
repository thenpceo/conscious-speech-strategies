import { createServerSupabaseClient } from "@/lib/supabase/server";
import AdminShell from "@/components/admin/AdminShell";
import type { Role } from "@/lib/supabase/types";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  let role: Role = "staff";

  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      if (profile?.role) {
        role = profile.role as Role;
      }
    }
  } catch {
    // On login page or unauthenticated — default to staff (most restrictive)
  }

  return <AdminShell role={role}>{children}</AdminShell>;
}

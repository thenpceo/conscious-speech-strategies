"use client";

import { createContext, useContext } from "react";
import type { Role } from "@/lib/supabase/types";

const AdminContext = createContext<{ role: Role }>({ role: "staff" });

export function AdminProvider({ role, children }: { role: Role; children: React.ReactNode }) {
  return <AdminContext.Provider value={{ role }}>{children}</AdminContext.Provider>;
}

export function useAdmin() {
  return useContext(AdminContext);
}

import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { supabase } from "./supabase";
import type { Session } from "@supabase/supabase-js";
import type { Permissions } from "./types";
import type { ReactNode } from "react";

export const DEFAULT_PERMISSIONS: Permissions = {
  dashboard: false,
  pos: true,
  orders: false,
  products: false,
  categories: false,
  customers: false,
  staff: false,
};

export const ADMIN_PERMISSIONS: Permissions = {
  dashboard: true,
  pos: true,
  orders: true,
  products: true,
  categories: true,
  customers: true,
  staff: true,
};

interface AuthState {
  session: Session | null;
  permissions: Permissions | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [permissions, setPermissions] = useState<Permissions | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  async function fetchPermissions(userId: string) {
    const { data, error } = await supabase
      .from("staff")
      .select("permissions, role")
      .eq("id", userId)
      .single();

    if (error || !data) {
      setPermissions(DEFAULT_PERMISSIONS);
      return;
    }

    setPermissions(
      data.role === "Admin" ? ADMIN_PERMISSIONS : (data.permissions ?? DEFAULT_PERMISSIONS)
    );
  }

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(async ({ data: { session: s } }) => {
      if (!mounted) return;
      setSession(s);
      if (s?.user) await fetchPermissions(s.user.id);
      if (mounted) setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, s) => {
      if (!mounted) return;

      if (event === "SIGNED_OUT") {
        setSession(null);
        setPermissions(null);
        navigate("/login");
        return;
      }

      setSession(s);
      if (s?.user) await fetchPermissions(s.user.id);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, permissions, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

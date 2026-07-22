import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export function useSession() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(({ data }) => {
      if (mounted) { setUser(data.user ?? null); setLoading(false); }
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setUser(s?.user ?? null);
    });
    return () => { mounted = false; sub.subscription.unsubscribe(); };
  }, []);
  return { user, loading };
}

export type ProfileRow = {
  id: string; username: string; public_id: string;
  full_name: string | null; age: number | null; height_cm: number | null;
  weight_kg: number | null; blood_type: string | null; allergies: string | null;
  avatar_url: string | null; role: string;
};

export function useProfile() {
  const { user } = useSession();
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!user) { setProfile(null); setLoading(false); return; }
    setLoading(true);
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle().then(({ data }) => {
      setProfile((data as ProfileRow | null) ?? null); setLoading(false);
    });
    const ch = supabase.channel(`profile-${user.id}`).on("postgres_changes",
      { event: "UPDATE", schema: "public", table: "profiles", filter: `id=eq.${user.id}` },
      (payload) => setProfile(payload.new as ProfileRow)).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);
  return { user, profile, loading, refetch: async () => {
    if (!user) return;
    const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
    setProfile((data as ProfileRow | null) ?? null);
  }};
}

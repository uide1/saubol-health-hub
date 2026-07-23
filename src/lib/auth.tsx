import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);
  return { session, user: session?.user ?? null as User | null, loading };
}

export type ProfileRow = {
  id: string;
  username: string | null;
  public_id: string | null;
  full_name: string | null;
  avatar_url: string | null;
  role: string | null;
};

export function useMyProfile() {
  const { user, loading } = useSession();
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  useEffect(() => {
    if (!user) { setProfile(null); return; }
    supabase.from("profiles").select("id,username,public_id,full_name,avatar_url,role").eq("id", user.id).maybeSingle()
      .then(({ data }) => setProfile(data as ProfileRow | null));
  }, [user?.id]);
  return { user, profile, loading };
}

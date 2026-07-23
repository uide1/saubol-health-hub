import { useCallback, useEffect, useState } from "react";
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
  first_name: string | null;
  last_name: string | null;
  age: number | null;
  height_cm: number | null;
  weight_kg: number | null;
  blood_type: string | null;
  allergies: string | null;
  avatar_url: string | null;
  role: string | null;
};

const COLS = "id,username,public_id,full_name,first_name,last_name,age,height_cm,weight_kg,blood_type,allergies,avatar_url,role";

export function useMyProfile() {
  const { user, loading } = useSession();
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const refetch = useCallback(async () => {
    if (!user) { setProfile(null); return; }
    setProfileLoading(true);
    const { data } = await supabase.from("profiles").select(COLS).eq("id", user.id).maybeSingle();
    setProfile(data as ProfileRow | null);
    setProfileLoading(false);
  }, [user?.id]);

  useEffect(() => { refetch(); }, [refetch]);
  return { user, profile, loading: loading || profileLoading, refetch };
}

/** Resolve avatar_url (which may be a storage path or a full URL) to a displayable URL. */
export async function resolveAvatarUrl(value: string | null | undefined): Promise<string | null> {
  if (!value) return null;
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  const { data } = await supabase.storage.from("avatars").createSignedUrl(value, 60 * 60 * 24 * 7);
  return data?.signedUrl ?? null;
}

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const InputSchema = z.object({
  query: z.string().trim().min(1).max(64),
});

export type FoundUser = {
  id: string;
  username: string | null;
  public_id: string | null;
  full_name: string | null;
  avatar_url: string | null;
  role: string | null;
};

export const findUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => InputSchema.parse(data))
  .handler(async ({ data, context }): Promise<FoundUser[]> => {
    const q = data.query;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("profiles")
      .select("id,username,public_id,full_name,avatar_url,role")
      .or(`public_id.eq.${q.toUpperCase()},username.eq.${q.toLowerCase()}`)
      .limit(5);
    if (error) throw new Error(error.message);
    return (rows ?? []).filter((r) => r.id !== context.userId) as FoundUser[];
  });
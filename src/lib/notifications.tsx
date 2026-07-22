import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "./use-session";

export type NotificationRow = {
  id: string;
  user_id: string;
  kind: string; // 'med_reminder' | 'friend_request' | 'info'
  title: string;
  body: string | null;
  read: boolean;
  created_at: string;
  meta: Record<string, unknown> | null;
};

type Ctx = {
  items: NotificationRow[];
  unread: number;
  markAllRead: () => Promise<void>;
  remove: (id: string) => Promise<void>;
  push: (n: Omit<NotificationRow, "id" | "user_id" | "created_at" | "read"> & { read?: boolean }) => Promise<void>;
};

const NotificationsCtx = createContext<Ctx | null>(null);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { user } = useSession();
  const [items, setItems] = useState<NotificationRow[]>([]);

  useEffect(() => {
    if (!user) { setItems([]); return; }
    supabase.from("notifications").select("*").eq("user_id", user.id)
      .order("created_at", { ascending: false }).limit(50)
      .then(({ data }) => setItems((data as NotificationRow[]) ?? []));
    const ch = supabase.channel(`notif-${user.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        (p) => setItems((s) => [p.new as NotificationRow, ...s]))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);

  const push: Ctx["push"] = async (n) => {
    if (!user) return;
    await supabase.from("notifications").insert({ user_id: user.id, kind: n.kind, title: n.title, body: n.body ?? null, meta: n.meta ?? null, read: n.read ?? false });
  };
  const markAllRead = async () => {
    if (!user) return;
    await supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false);
    setItems((s) => s.map((r) => ({ ...r, read: true })));
  };
  const remove = async (id: string) => {
    await supabase.from("notifications").delete().eq("id", id);
    setItems((s) => s.filter((r) => r.id !== id));
  };
  const unread = items.filter((i) => !i.read).length;

  return <NotificationsCtx.Provider value={{ items, unread, markAllRead, remove, push }}>{children}</NotificationsCtx.Provider>;
}

export function useNotifications() {
  const c = useContext(NotificationsCtx);
  if (!c) throw new Error("NotificationsProvider missing");
  return c;
}

export function NotificationsBell() {
  const { items, unread, markAllRead, remove } = useNotifications();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => { setOpen((o) => !o); if (!open) void markAllRead(); }}
        aria-label="notifications"
        className="relative grid h-8 w-8 place-items-center rounded-full border border-border bg-surface text-[13px] text-foreground"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
        {unread > 0 && <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-[color:var(--mint)] px-1 text-[9px] font-bold text-background">{unread}</span>}
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} className="fixed inset-0 z-40" />
          <div className="absolute right-0 top-10 z-50 max-h-[70vh] w-80 overflow-auto rounded-2xl border border-border bg-card p-2 shadow-2xl">
            <div className="flex items-center justify-between px-2 py-1.5">
              <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Notifications</div>
              <div className="text-[10px] text-muted-foreground">{items.length}</div>
            </div>
            {items.length === 0 && (
              <div className="p-6 text-center text-[12px] text-muted-foreground">No notifications</div>
            )}
            <div className="space-y-1">
              {items.map((n) => (
                <div key={n.id} className={`group rounded-xl border p-2.5 ${n.read ? "border-border bg-surface" : "border-[color:var(--mint)]/30 bg-[color:var(--mint-soft)]"}`}>
                  <div className="flex items-start gap-2">
                    <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-background text-[13px]">
                      {n.kind === "med_reminder" ? "💊" : n.kind === "friend_request" ? "👥" : "•"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[12px] font-medium text-foreground">{n.title}</div>
                      {n.body && <div className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">{n.body}</div>}
                      <div className="mt-1 font-mono text-[9px] uppercase text-muted-foreground">{new Date(n.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                    </div>
                    <button onClick={() => remove(n.id)} className="text-muted-foreground opacity-0 transition hover:text-foreground group-hover:opacity-100">×</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

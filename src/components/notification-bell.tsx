import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useL, L } from "@/lib/i18n";
import { toast } from "sonner";

type Notif = {
  id: string;
  user_id: string;
  kind: string;
  title: string;
  body: string | null;
  read: boolean;
  meta: any;
  created_at: string;
};

export function NotificationBell() {
  const [userId, setUserId] = useState<string | null>(null);
  const [items, setItems] = useState<Notif[]>([]);
  const [open, setOpen] = useState(false);
  const L1 = useL();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setUserId(s?.user?.id ?? null));
    return () => sub.subscription.unsubscribe();
  }, []);

  const load = async () => {
    if (!userId) return;
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(30);
    setItems((data ?? []) as Notif[]);
  };

  useEffect(() => {
    if (!userId) { setItems([]); return; }
    load();
    const ch = supabase
      .channel(`notif:${userId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` }, (payload) => {
        const n = payload.new as Notif;
        setItems((prev) => [n, ...prev]);
        toast(n.title, { description: n.body ?? undefined });
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` }, (payload) => {
        const n = payload.new as Notif;
        setItems((prev) => prev.map((x) => (x.id === n.id ? n : x)));
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` }, (payload) => {
        const n = payload.old as Notif;
        setItems((prev) => prev.filter((x) => x.id !== n.id));
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [userId]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const unread = items.filter((n) => !n.read).length;

  const markAllRead = async () => {
    if (!userId || unread === 0) return;
    await supabase.from("notifications").update({ read: true }).eq("user_id", userId).eq("read", false);
  };

  const accept = async (n: Notif) => {
    const fromId = n.meta?.from_user_id as string | undefined;
    if (!fromId) return;
    if (n.kind === "friend_request") {
      const { error } = await supabase.from("friendships").update({ status: "accepted" }).match({ user_id: fromId, friend_id: userId });
      if (error) { toast.error(error.message); return; }
      await supabase.from("notifications").insert({
        user_id: fromId,
        kind: "friend_accepted",
        title: L1({ kk: "Дос сұранысы қабылданды", ru: "Запрос в друзья принят", en: "Friend request accepted" }),
        body: null,
        meta: { from_user_id: userId },
      });
    } else if (n.kind === "family_request") {
      const { error } = await supabase.from("family_links").update({ status: "accepted" }).match({ parent_id: fromId, child_id: userId });
      if (error) { toast.error(error.message); return; }
      await supabase.from("notifications").insert({
        user_id: fromId,
        kind: "family_accepted",
        title: L1({ kk: "Отбасы сұранысы қабылданды", ru: "Запрос в семью принят", en: "Family request accepted" }),
        body: null,
        meta: { from_user_id: userId },
      });
    }
    await supabase.from("notifications").delete().eq("id", n.id);
    toast.success(L1({ kk: "Қабылданды", ru: "Принято", en: "Accepted" }));
  };

  const decline = async (n: Notif) => {
    const fromId = n.meta?.from_user_id as string | undefined;
    if (!fromId || !userId) return;
    if (n.kind === "friend_request") {
      await supabase.from("friendships").delete().match({ user_id: fromId, friend_id: userId });
    } else if (n.kind === "family_request") {
      await supabase.from("family_links").delete().match({ parent_id: fromId, child_id: userId });
    }
    await supabase.from("notifications").delete().eq("id", n.id);
  };

  const dismiss = async (n: Notif) => {
    await supabase.from("notifications").delete().eq("id", n.id);
  };

  if (!userId) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => { setOpen((v) => !v); if (!open) markAllRead(); }}
        aria-label="Notifications"
        className="relative grid h-8 w-8 place-items-center rounded-full border border-border bg-surface text-[13px] text-foreground transition hover:border-white/20"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-[color:var(--mint)] px-1 text-[9px] font-bold text-background">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-11 z-50 w-[340px] overflow-hidden rounded-2xl border border-border bg-background/95 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
              <L kk="Хабарламалар" ru="Уведомления" en="Notifications" />
            </span>
            <span className="rounded-full border border-border bg-surface px-2 py-0.5 font-mono text-[10px] text-muted-foreground">{items.length}</span>
          </div>
          <div className="max-h-[420px] overflow-y-auto">
            {items.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted-foreground">
                <L kk="Хабарламалар жоқ" ru="Уведомлений нет" en="No notifications" />
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {items.map((n) => {
                  const isRequest = n.kind === "friend_request" || n.kind === "family_request";
                  return (
                    <li key={n.id} className={`p-3 ${!n.read ? "bg-surface/40" : ""}`}>
                      <div className="flex items-start gap-2">
                        <div className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-surface text-sm">
                          {n.kind.startsWith("family") ? "👨‍👩‍👧" : n.kind.startsWith("friend") ? "🤝" : "🔔"}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-[13px] font-medium text-foreground">{n.title}</div>
                          {n.body && <div className="mt-0.5 text-[11px] text-muted-foreground">{n.body}</div>}
                          <div className="mt-2 flex gap-1.5">
                            {isRequest ? (
                              <>
                                <button onClick={() => accept(n)} className="rounded-full bg-foreground px-3 py-1 text-[11px] font-medium text-background">
                                  <L kk="Қабылдау" ru="Принять" en="Accept" />
                                </button>
                                <button onClick={() => decline(n)} className="rounded-full border border-border px-3 py-1 text-[11px] text-muted-foreground hover:text-foreground">
                                  <L kk="Бас тарту" ru="Отклонить" en="Decline" />
                                </button>
                              </>
                            ) : (
                              <button onClick={() => dismiss(n)} className="rounded-full border border-border px-3 py-1 text-[11px] text-muted-foreground hover:text-foreground">
                                <L kk="Жабу" ru="Закрыть" en="Dismiss" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
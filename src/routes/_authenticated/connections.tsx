import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useMyProfile } from "@/lib/auth";
import { UserAvatar } from "@/components/user-avatar";
import { PageHeader } from "@/components/ui-kit";
import { L, useL } from "@/lib/i18n";
import { useServerFn } from "@tanstack/react-start";
import { findUser } from "@/lib/find-user.functions";

export const Route = createFileRoute("/_authenticated/connections")({
  head: () => ({
    meta: [
      { title: "Байланыстар · SauBol" },
      { name: "description", content: "Add family members and friends to your SauBol network." },
    ],
  }),
  component: ConnectionsPage,
});

type Row = {
  id: string;
  full_name: string | null;
  username: string | null;
  public_id: string | null;
  avatar_url: string | null;
};
type LinkRow = { kind: "family" | "friend"; role: "parent" | "child" | "friend"; status: string; iRequested: boolean; other: Row };

function ConnectionsPage() {
  const { user, profile } = useMyProfile();
  const L1 = useL();
  const findUserFn = useServerFn(findUser);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Row[]>([]);
  const [links, setLinks] = useState<LinkRow[]>([]);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    const [f, fam] = await Promise.all([
      supabase.from("friendships").select("status,user_id,friend_id").or(`user_id.eq.${user.id},friend_id.eq.${user.id}`),
      supabase.from("family_links").select("status,parent_id,child_id").or(`parent_id.eq.${user.id},child_id.eq.${user.id}`),
    ]);
    const otherIds = new Set<string>();
    (f.data ?? []).forEach((r: any) => otherIds.add(r.user_id === user.id ? r.friend_id : r.user_id));
    (fam.data ?? []).forEach((r: any) => otherIds.add(r.parent_id === user.id ? r.child_id : r.parent_id));
    if (otherIds.size === 0) { setLinks([]); return; }
    const { data: profs } = await supabase.from("profiles")
      .select("id,full_name,username,public_id,avatar_url")
      .in("id", Array.from(otherIds));
    const byId = new Map<string, Row>((profs ?? []).map((p: any) => [p.id, p]));
    const out: LinkRow[] = [];
    (f.data ?? []).forEach((r: any) => {
      const oid = r.user_id === user.id ? r.friend_id : r.user_id;
      const other = byId.get(oid);
      if (other) out.push({ kind: "friend", role: "friend", status: r.status, iRequested: r.user_id === user.id, other });
    });
    (fam.data ?? []).forEach((r: any) => {
      const iAmParent = r.parent_id === user.id;
      const oid = iAmParent ? r.child_id : r.parent_id;
      const other = byId.get(oid);
      if (other) out.push({ kind: "family", role: iAmParent ? "child" : "parent", status: r.status, iRequested: iAmParent, other });
    });
    setLinks(out);
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  const search = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setBusy(true);
    let data: any[] = [];
    try {
      data = await findUserFn({ data: { query: query.trim() } });
    } catch (err: any) {
      setBusy(false);
      toast.error(err?.message ?? "Search failed");
      return;
    }
    setBusy(false);
    const filtered = (data ?? []).filter((r: any) => r.id !== user?.id);
    setResults(filtered);
    if (filtered.length === 0) toast(L1({ kk: "Ешкім табылмады", ru: "Никого не найдено", en: "No users found" }));
  };

  const addFriend = async (other: Row) => {
    if (!user) return;
    const { error } = await supabase.from("friendships").insert({ user_id: user.id, friend_id: other.id, status: "pending" });
    if (error) { toast.error(error.message); return; }
    await supabase.from("notifications").insert({
      user_id: other.id,
      kind: "friend_request",
      title: L1({ kk: "Жаңа дос сұранысы", ru: "Новый запрос в друзья", en: "New friend request" }),
      body: (profile?.full_name ?? profile?.username ?? "Someone") + (L1({ kk: " сізге дос болғысы келеді", ru: " хочет добавить вас в друзья", en: " wants to be your friend" })),
      meta: { from_user_id: user.id },
    });
    toast.success(L1({ kk: "Сұраныс жіберілді", ru: "Запрос отправлен", en: "Request sent" }));
    setResults(results.filter((r) => r.id !== other.id));
    load();
  };
  const addChild = async (other: Row) => {
    if (!user) return;
    if ((profile?.age ?? 0) > 0 && (profile?.age ?? 0) < 18) {
      toast.error(L1({
        kk: "18 жасқа толмаған қолданушы бала қоса алмайды",
        ru: "Пользователи младше 18 не могут добавлять детей",
        en: "Users under 18 cannot add a child",
      }));
      return;
    }
    if (!profile?.age) {
      toast.error(L1({
        kk: "Профильде жасыңызды көрсетіңіз",
        ru: "Укажите возраст в профиле",
        en: "Set your age in profile first",
      }));
      return;
    }
    const { error } = await supabase.from("family_links").insert({ parent_id: user.id, child_id: other.id, status: "pending" });
    if (error) { toast.error(error.message); return; }
    await supabase.from("notifications").insert({
      user_id: other.id,
      kind: "family_request",
      title: L1({ kk: "Отбасы шақыруы", ru: "Приглашение в семью", en: "Family invitation" }),
      body: (profile?.full_name ?? profile?.username ?? "Someone") + (L1({ kk: " сізді отбасына қосқысы келеді", ru: " хочет добавить вас в семью", en: " wants to add you to family" })),
      meta: { from_user_id: user.id },
    });
    toast.success(L1({ kk: "Сұраныс жіберілді", ru: "Запрос отправлен", en: "Request sent" }));
    setResults(results.filter((r) => r.id !== other.id));
    load();
  };
  const accept = async (l: LinkRow) => {
    if (!user) return;
    const tbl = l.kind === "family" ? "family_links" : "friendships";
    const filter = l.kind === "family"
      ? { parent_id: l.other.id, child_id: user.id }
      : { user_id: l.other.id, friend_id: user.id };
    const { error } = await supabase.from(tbl).update({ status: "accepted" }).match(filter as any);
    if (error) toast.error(error.message);
    else {
      await supabase.from("notifications").insert({
        user_id: l.other.id,
        kind: l.kind === "family" ? "family_accepted" : "friend_accepted",
        title: L1({ kk: "Сұраныс қабылданды", ru: "Запрос принят", en: "Request accepted" }),
        body: (profile?.full_name ?? profile?.username ?? "") + (L1({ kk: " сіздің сұранысыңызды қабылдады", ru: " принял(а) ваш запрос", en: " accepted your request" })),
        meta: { from_user_id: user.id },
      });
      toast.success(L1({ kk: "Қабылданды", ru: "Принято", en: "Accepted" }));
      load();
    }
  };
  const remove = async (l: LinkRow) => {
    if (!user) return;
    const tbl = l.kind === "family" ? "family_links" : "friendships";
    if (l.kind === "family") {
      await supabase.from(tbl).delete().or(`and(parent_id.eq.${user.id},child_id.eq.${l.other.id}),and(parent_id.eq.${l.other.id},child_id.eq.${user.id})`);
    } else {
      await supabase.from(tbl).delete().or(`and(user_id.eq.${user.id},friend_id.eq.${l.other.id}),and(user_id.eq.${l.other.id},friend_id.eq.${user.id})`);
    }
    load();
  };

  const family = links.filter((l) => l.kind === "family");
  const friends = links.filter((l) => l.kind === "friend");
  const incoming = links.filter((l) => l.status === "pending" && (
    (l.kind === "family" && l.role === "parent") || false
  ));
  // pending requests where I need to accept: for friends the other party sent invite (l with pending, where user is friend_id) — we need to detect based on stored rows. Simpler: show accept on any pending row here — accept endpoint is safe (RLS).
  const pending = links.filter((l) => l.status === "pending");

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={<L kk="Байланыстар" ru="Связи" en="Connections" />}
        title={<L kk="Отбасы және достар" ru="Семья и друзья" en="Family & friends" />}
        description={<L kk="Public ID немесе username бойынша қосыңыз" ru="Добавляйте по Public ID или username" en="Add by Public ID or username" />}
        actions={profile?.public_id ? (
          <button onClick={() => { navigator.clipboard.writeText(profile.public_id!); toast.success("Copied"); }} className="rounded-full border border-border bg-surface px-4 py-2 text-xs">
            <span className="text-muted-foreground"><L kk="Сіздің ID" ru="Ваш ID" en="Your ID" />:</span>
            <span className="ml-2 font-mono font-medium text-foreground">{profile.public_id}</span>
          </button>
        ) : null}
      />

      {/* Search hero */}
      <div className="noise relative overflow-hidden rounded-3xl border border-border bg-card p-6">
        <div className="aurora opacity-25" />
        <div className="relative">
          <div className="mb-3 text-[10px] uppercase tracking-widest text-muted-foreground">
            <L kk="Адамды табу" ru="Найти человека" en="Find someone" />
          </div>
          <form onSubmit={search} className="flex flex-wrap gap-2">
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={L1({ kk: "SB-XXXXXX немесе username", ru: "SB-XXXXXX или username", en: "SB-XXXXXX or username" })} className="min-w-[240px] flex-1 rounded-full border border-border bg-surface px-5 py-2.5 text-sm text-foreground outline-none focus:border-white/20" />
            <button disabled={busy} className="rounded-full bg-foreground px-6 py-2.5 text-sm font-medium text-background disabled:opacity-50">
              {busy ? "…" : <L kk="Іздеу" ru="Найти" en="Search" />}
            </button>
          </form>
          {results.length > 0 && (
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {results.map((r) => (
                <div key={r.id} className="flex items-center gap-3 rounded-2xl border border-border bg-surface/80 p-3 backdrop-blur">
                  <Avatar row={r} size={40} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-foreground">{r.full_name ?? r.username}</div>
                    <div className="truncate text-[11px] text-muted-foreground">@{r.username} · <span className="font-mono">{r.public_id}</span></div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <button onClick={() => addFriend(r)} className="rounded-full bg-foreground px-3 py-1 text-[11px] font-medium text-background">
                      <L kk="+ Дос" ru="+ Друг" en="+ Friend" />
                    </button>
                    <button onClick={() => addChild(r)} className="rounded-full border border-border px-3 py-1 text-[11px] text-foreground hover:border-white/20">
                      <L kk="+ Бала" ru="+ Ребёнок" en="+ Child" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {pending.length > 0 && (
        <div>
          <div className="mb-3 text-[10px] uppercase tracking-widest text-muted-foreground">
            <L kk="Күтіп тұр" ru="Ожидают" en="Pending" />
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {pending.map((l, i) => (
              <PersonCard key={i} link={l} onAccept={l.iRequested ? undefined : accept} onRemove={remove} />
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Section
          title={L1({ kk: "Отбасы", ru: "Семья", en: "Family" })}
          icon="👨‍👩‍👧"
          items={family.filter((l) => l.status === "accepted")}
          empty={L1({ kk: "Балаңызды/ата-анаңызды жоғарыдан қосыңыз", ru: "Добавьте ребёнка/родителя выше", en: "Add a child or parent above" })}
          onRemove={remove}
        />
        <Section
          title={L1({ kk: "Достар", ru: "Друзья", en: "Friends" })}
          icon="🤝"
          items={friends.filter((l) => l.status === "accepted")}
          empty={L1({ kk: "Достарыңызды жоғарыдан қосыңыз", ru: "Добавьте друзей выше", en: "Add friends above" })}
          onRemove={remove}
        />
      </div>
    </div>
  );
}

function Section({ title, icon, items, empty, onRemove }: {
  title: string; icon: string; items: LinkRow[]; empty: string; onRemove: (l: LinkRow) => void;
}) {
  return (
    <div className="rounded-3xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center gap-2">
        <span className="text-lg">{icon}</span>
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{title}</span>
        <span className="ml-auto rounded-full border border-border bg-surface px-2 py-0.5 font-mono text-[10px] text-muted-foreground">{items.length}</span>
      </div>
      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">{empty}</div>
      ) : (
        <div className="space-y-2">
          {items.map((l, i) => (
            <PersonCard key={i} link={l} onRemove={onRemove} />
          ))}
        </div>
      )}
    </div>
  );
}

function PersonCard({ link, onAccept, onRemove }: {
  link: LinkRow; onAccept?: (l: LinkRow) => void; onRemove: (l: LinkRow) => void;
}) {
  const roleLabel = link.kind === "family"
    ? (link.role === "child" ? "👶 Child" : "👤 Parent")
    : "🤝 Friend";
  return (
    <div className="group flex items-center gap-3 rounded-2xl border border-border bg-surface p-3 transition hover:border-white/20">
      <UserAvatar url={link.other.avatar_url} name={link.other.full_name ?? link.other.username} size={40} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-foreground">{link.other.full_name ?? link.other.username}</div>
        <div className="truncate text-[11px] text-muted-foreground">
          {roleLabel} · <span className="font-mono">{link.other.public_id}</span>
          {link.status === "pending" && <span className="ml-1 text-amber-400">· pending</span>}
        </div>
      </div>
      <div className="flex gap-1 opacity-70 transition group-hover:opacity-100">
        {link.status === "pending" && onAccept && (
          <button onClick={() => onAccept(link)} className="rounded-full bg-[color:var(--mint)] px-3 py-1 text-[11px] font-medium text-background">✓</button>
        )}
        <button onClick={() => onRemove(link)} className="grid h-7 w-7 place-items-center rounded-full border border-border text-muted-foreground hover:text-foreground" title="Remove">✕</button>
      </div>
    </div>
  );
}

function Avatar({ row, size = 40 }: { row: Row; size?: number }) {
  return <UserAvatar url={row.avatar_url} name={row.full_name ?? row.username} size={size} />;
}

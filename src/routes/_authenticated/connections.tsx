import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useMyProfile } from "@/lib/auth";
import { PageHeader } from "@/components/ui-kit";
import { L, useL } from "@/lib/i18n";

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
type LinkRow = { kind: "family" | "friend"; role: "parent" | "child" | "friend"; status: string; other: Row };

function ConnectionsPage() {
  const { user, profile } = useMyProfile();
  const L1 = useL();
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
      if (other) out.push({ kind: "friend", role: "friend", status: r.status, other });
    });
    (fam.data ?? []).forEach((r: any) => {
      const iAmParent = r.parent_id === user.id;
      const oid = iAmParent ? r.child_id : r.parent_id;
      const other = byId.get(oid);
      if (other) out.push({ kind: "family", role: iAmParent ? "child" : "parent", status: r.status, other });
    });
    setLinks(out);
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  const search = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setBusy(true);
    const { data, error } = await supabase.rpc("find_user", { _query: query.trim() });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    const filtered = (data ?? []).filter((r: any) => r.id !== user?.id);
    setResults(filtered);
    if (filtered.length === 0) toast(L1({ kk: "Ешкім табылмады", ru: "Никого не найдено", en: "No users found" }));
  };

  const addFriend = async (other: Row) => {
    if (!user) return;
    const { error } = await supabase.from("friendships").insert({ user_id: user.id, friend_id: other.id, status: "pending" });
    if (error) { toast.error(error.message); return; }
    toast.success(L1({ kk: "Сұраныс жіберілді", ru: "Запрос отправлен", en: "Request sent" }));
    load();
  };
  const addChild = async (other: Row) => {
    if (!user) return;
    const { error } = await supabase.from("family_links").insert({ parent_id: user.id, child_id: other.id, status: "pending" });
    if (error) { toast.error(error.message); return; }
    toast.success(L1({ kk: "Сұраныс жіберілді", ru: "Запрос отправлен", en: "Request sent" }));
    load();
  };
  const accept = async (l: LinkRow) => {
    if (!user) return;
    const tbl = l.kind === "family" ? "family_links" : "friendships";
    const filter = l.kind === "family"
      ? { parent_id: l.role === "child" ? user.id : l.other.id, child_id: l.role === "child" ? l.other.id : user.id }
      : { user_id: l.other.id, friend_id: user.id };
    const { error } = await supabase.from(tbl).update({ status: "accepted" }).match(filter as any);
    if (error) toast.error(error.message); else load();
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

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={<L kk="Байланыстар" ru="Связи" en="Connections" />}
        title={<L kk="Отбасы және достар" ru="Семья и друзья" en="Family & friends" />}
        description={<L kk="Public ID немесе username бойынша қосыңыз" ru="Добавляйте по Public ID или username" en="Add by Public ID or username" />}
        actions={profile?.public_id ? (
          <div className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs">
            <span className="text-muted-foreground"><L kk="Сіздің ID" ru="Ваш ID" en="Your ID" />: </span>
            <button onClick={() => { navigator.clipboard.writeText(profile.public_id!); toast.success("Copied"); }} className="font-mono font-medium text-foreground">{profile.public_id}</button>
          </div>
        ) : null}
      />

      <div className="rounded-3xl border border-border bg-card p-5">
        <form onSubmit={search} className="flex gap-2">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={L1({ kk: "SB-XXXXXX немесе username", ru: "SB-XXXXXX или username", en: "SB-XXXXXX or username" })} className="flex-1 rounded-full border border-border bg-surface px-4 py-2 text-sm text-foreground outline-none focus:border-white/20" />
          <button disabled={busy} className="rounded-full bg-foreground px-5 text-sm font-medium text-background disabled:opacity-50"><L kk="Іздеу" ru="Найти" en="Search" /></button>
        </form>
        {results.length > 0 && (
          <div className="mt-4 space-y-2">
            {results.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-2xl border border-border bg-surface px-4 py-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-foreground">{r.full_name ?? r.username}</div>
                  <div className="text-[11px] text-muted-foreground">@{r.username} · <span className="font-mono">{r.public_id}</span></div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => addFriend(r)} className="rounded-full border border-border px-3 py-1 text-xs text-foreground hover:border-white/20"><L kk="+ Дос" ru="+ Друг" en="+ Friend" /></button>
                  <button onClick={() => addChild(r)} className="rounded-full border border-border px-3 py-1 text-xs text-foreground hover:border-white/20"><L kk="+ Бала" ru="+ Ребёнок" en="+ Child" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Panel title={L1({ kk: "Отбасы", ru: "Семья", en: "Family" })} items={family} onAccept={accept} onRemove={remove} emptyText={L1({ kk: "Әлі отбасы жоқ", ru: "Пока нет семьи", en: "No family yet" })} me={user?.id ?? ""} />
        <Panel title={L1({ kk: "Достар", ru: "Друзья", en: "Friends" })} items={friends} onAccept={accept} onRemove={remove} emptyText={L1({ kk: "Әлі достар жоқ", ru: "Пока нет друзей", en: "No friends yet" })} me={user?.id ?? ""} />
      </div>
    </div>
  );
}

function Panel({ title, items, onAccept, onRemove, emptyText, me }: {
  title: string; items: LinkRow[]; onAccept: (l: LinkRow) => void; onRemove: (l: LinkRow) => void; emptyText: string; me: string;
}) {
  return (
    <div className="rounded-3xl border border-border bg-card p-5">
      <div className="mb-3 text-[10px] uppercase tracking-widest text-muted-foreground">{title}</div>
      {items.length === 0 && <div className="text-sm text-muted-foreground">{emptyText}</div>}
      <div className="space-y-2">
        {items.map((l, i) => (
          <div key={i} className="flex items-center justify-between rounded-2xl border border-border bg-surface px-4 py-3">
            <div className="min-w-0">
              <div className="truncate text-sm font-medium text-foreground">{l.other.full_name ?? l.other.username}</div>
              <div className="text-[11px] text-muted-foreground">
                {l.kind === "family" ? (l.role === "child" ? "👶 Child" : "👤 Parent") : "🤝 Friend"} · {l.status}
              </div>
            </div>
            <div className="flex gap-2">
              {l.status === "pending" && <button onClick={() => onAccept(l)} className="rounded-full bg-[color:var(--mint)] px-3 py-1 text-xs font-medium text-background">Accept</button>}
              <button onClick={() => onRemove(l)} className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground hover:text-foreground">✕</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

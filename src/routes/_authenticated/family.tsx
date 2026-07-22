import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bento, Badge, SectionEyebrow, Bar } from "@/components/ui-kit";
import { supabase } from "@/integrations/supabase/client";
import { useProfile, type ProfileRow } from "@/lib/use-session";
import { L, useL } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/family")({
  head: () => ({
    meta: [
      { title: "Отбасы · SauBol AI" },
      { name: "description", content: "Балалардың тамағы, дəрі-дəрмегі жəне ескертулері нақты уақытта." },
      { property: "og:title", content: "Family Mode · SauBol" },
      { property: "og:description", content: "Ата-ана балаларының денсаулығын бір экраннан бақылайды." },
    ],
  }),
  component: FamilyPage,
});

type Kid = ProfileRow;
type Food = { id: string; user_id: string; name: string; calories: number; warning: string | null; created_at: string };
type Med = { id: string; user_id: string; name: string; scheduled_time: string | null; taken: boolean; created_at: string };

function FamilyPage() {
  const { profile } = useProfile();
  const [kids, setKids] = useState<Kid[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [foods, setFoods] = useState<Food[]>([]);
  const [meds, setMeds] = useState<Med[]>([]);
  const L1 = useL();

  useEffect(() => {
    if (!profile) return;
    supabase.from("family_links").select("child_id, status").eq("parent_id", profile.id).eq("status", "accepted")
      .then(async ({ data }) => {
        if (!data?.length) { setKids([]); return; }
        const { data: profs } = await supabase.from("profiles").select("*").in("id", data.map(d => d.child_id));
        setKids((profs as Kid[]) ?? []);
        if (profs?.[0] && !active) setActive(profs[0].id);
      });
  }, [profile, active]);

  useEffect(() => {
    if (!active) return;
    const since = new Date(); since.setHours(0,0,0,0);
    supabase.from("food_logs").select("*").eq("user_id", active).gte("created_at", since.toISOString()).order("created_at", { ascending: false })
      .then(({ data }) => setFoods((data as Food[]) ?? []));
    supabase.from("medication_logs").select("*").eq("user_id", active).gte("created_at", new Date(Date.now() - 24*3600*1000).toISOString()).order("scheduled_time")
      .then(({ data }) => setMeds((data as Med[]) ?? []));
    const ch = supabase.channel(`kid-${active}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "food_logs", filter: `user_id=eq.${active}` }, (p) => {
        if (p.eventType === "INSERT") setFoods(s => [p.new as Food, ...s]);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "medication_logs", filter: `user_id=eq.${active}` }, (p) => {
        if (p.eventType === "INSERT") setMeds(s => [...s, p.new as Med]);
        if (p.eventType === "UPDATE") setMeds(s => s.map(m => m.id === (p.new as Med).id ? p.new as Med : m));
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [active]);

  const kid = kids.find(k => k.id === active);
  const totalCal = foods.reduce((a, f) => a + Number(f.calories), 0);
  const takenMeds = meds.filter(m => m.taken).length;

  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-6">
        <SectionEyebrow>Family Mode</SectionEyebrow>
        <h1 className="mt-2 font-serif text-4xl leading-[1.05] tracking-tight text-foreground md:text-5xl">
          <L
            kk={<>Отбасы <span className="italic text-[color:var(--mint)]">аман</span>. {kids.length} бала.</>}
            ru={<>Семья <span className="italic text-[color:var(--mint)]">в безопасности</span>. {kids.length} детей.</>}
            en={<>Family is <span className="italic text-[color:var(--mint)]">safe</span>. {kids.length} kids.</>}
          />
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          <L kk="Балалардың тіркеген тамағы жəне дəрі-дəрмегі осы жерде нақты уақытта көрсетіледі." ru="Всё, что дети записывают, отображается здесь в реальном времени." en="Everything your kids log shows here in real time." />
        </p>
      </div>

      {kids.length === 0 ? (
        <Bento className="text-center">
          <div className="text-5xl">👨‍👩‍👧</div>
          <div className="mt-4 font-serif text-2xl text-foreground"><L kk="Отбасыда бала жоқ" ru="В семье нет детей" en="No kids linked yet" /></div>
          <p className="mt-2 text-sm text-muted-foreground">
            <L kk="Профиль бетінен баланың Public ID арқылы шақырыңыз." ru="Пригласите ребёнка по Public ID со страницы профиля." en="Invite a child by Public ID from the profile page." />
          </p>
        </Bento>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {kids.map(k => {
              const isActive = k.id === active;
              return (
                <button key={k.id} onClick={()=>setActive(k.id)} className={`rounded-2xl border p-5 text-left transition ${isActive?"border-[color:var(--mint)]/50 bg-[color:var(--mint-soft)]":"border-border bg-card"}`}>
                  <div className="flex items-center gap-3">
                    <div className="grid h-12 w-12 place-items-center rounded-full bg-secondary text-2xl">{k.role === "child" ? "🧒" : "👤"}</div>
                    <div>
                      <div className="font-serif text-xl text-foreground">{k.full_name ?? k.username}</div>
                      <div className="text-[11px] text-muted-foreground">@{k.username} · {k.age ?? "?"} y.o.</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {kid && (
            <>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
                <Bento>
                  <div className="flex items-baseline justify-between">
                    <div>
                      <SectionEyebrow><L kk="Бүгін" ru="Сегодня" en="Today" /> · {kid.username}</SectionEyebrow>
                      <div className="font-serif text-2xl text-foreground"><L kk="Тамақ журналы" ru="Журнал питания" en="Food log" /></div>
                    </div>
                    <Badge tone="mint">{Math.round(totalCal)} kcal</Badge>
                  </div>
                  <div className="mt-4"><Bar value={Math.min(100, (totalCal / 1600) * 100)} tone="mint" /></div>
                  <div className="mt-4 space-y-2">
                    {foods.length === 0 && <div className="text-[12px] text-muted-foreground"><L kk="Әлі ешнәрсе жоқ." ru="Пока пусто." en="Nothing yet." /></div>}
                    {foods.slice(0, 8).map(f => (
                      <div key={f.id} className="flex items-center gap-3 rounded-lg border border-border bg-surface px-3 py-2">
                        <div className="flex-1 text-[12px] text-foreground">{f.name}</div>
                        <div className="font-mono text-[11px] text-muted-foreground">{Math.round(f.calories)} kcal</div>
                        {f.warning && <Badge tone="warning">⚠</Badge>}
                      </div>
                    ))}
                  </div>
                </Bento>

                <Bento>
                  <div className="flex items-baseline justify-between">
                    <SectionEyebrow><L kk="Дәрі-дәрмек" ru="Лекарства" en="Meds" /></SectionEyebrow>
                    <span className="text-[11px] text-muted-foreground">{takenMeds}/{meds.length}</span>
                  </div>
                  <div className="mt-3 space-y-2">
                    {meds.length === 0 && <div className="text-[12px] text-muted-foreground"><L kk="Тағайындалған дəрі жоқ." ru="Нет назначений." en="No meds scheduled." /></div>}
                    {meds.map(m => (
                      <div key={m.id} className="flex items-center gap-3 rounded-lg border border-border bg-surface px-3 py-2">
                        <div className={`h-2 w-2 rounded-full ${m.taken?"bg-[color:var(--mint)]":"bg-muted-foreground"}`} />
                        <div className="font-mono text-[11px] text-muted-foreground">{m.scheduled_time ?? "—"}</div>
                        <div className="flex-1 text-[12px] text-foreground">{m.name}</div>
                        {m.taken ? <Badge tone="mint">✓</Badge> : <Badge tone="warning">{L1({kk:"Күтуде",ru:"Ожидание",en:"Pending"})}</Badge>}
                      </div>
                    ))}
                  </div>
                </Bento>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

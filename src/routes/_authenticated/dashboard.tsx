import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bento, Badge, Chip, SectionEyebrow } from "@/components/ui-kit";
import { HealthOrb } from "@/components/health-orb";
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/lib/use-session";
import { toast } from "sonner";
import { L, useL } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Дашборд · SauBol AI" },
      { name: "description", content: "Жеке денсаулық дашборды: индекс, апталық тренд, дәрі-дәрмек кестесі." },
      { property: "og:title", content: "Дашборд · SauBol AI" },
      { property: "og:description", content: "Күнделікті денсаулық көрсеткіштерін бір экраннан бақылаңыз." },
    ],
  }),
  component: Dashboard,
});

const TREND = [68, 71, 69, 74, 76, 72, 78].map((v, i) => ({ d: ["Дс","Сс","Ср","Бс","Жм","Сб","Жс"][i], score: v }));

type MedLog = { id: string; name: string; scheduled_time: string | null; taken: boolean };

function Dashboard() {
  const { profile } = useProfile();
  const [meds, setMeds] = useState<MedLog[]>([]);
  const [range, setRange] = useState<"7"|"30">("7");
  const L1 = useL();

  useEffect(() => {
    if (!profile) return;
    supabase.from("medication_logs").select("id,name,scheduled_time,taken")
      .eq("user_id", profile.id)
      .gte("created_at", new Date(Date.now() - 24*3600*1000).toISOString())
      .order("scheduled_time", { ascending: true })
      .then(({ data }) => setMeds((data as MedLog[]) ?? []));
  }, [profile]);

  const toggleMed = async (m: MedLog) => {
    const next = !m.taken;
    setMeds(s => s.map(x => x.id === m.id ? { ...x, taken: next } : x));
    await supabase.from("medication_logs").update({ taken: next }).eq("id", m.id);
    toast(next ? `✓ ${m.name}` : m.name);
  };

  const taken = meds.filter(m => m.taken).length;
  const trend = range === "7" ? TREND : Array.from({ length: 30 }, (_, i) => ({ d: `${i+1}`, score: 60 + Math.round(Math.sin(i/3)*8 + i*0.4) }));

  return (
    <div className="space-y-6">
      <Bento className="noise grid gap-8 p-10 md:grid-cols-[1.4fr_320px] md:items-center">
        <div>
          <SectionEyebrow>SauBol AI · {L1({kk:"Бүгін",ru:"Сегодня",en:"Today"})}</SectionEyebrow>
          <h1 className="mt-2 font-serif text-4xl leading-[1.05] tracking-tight text-foreground md:text-5xl">
            <L
              kk={<>Сәлем, <span className="italic text-[color:var(--mint)]">{profile?.full_name ?? profile?.username ?? "..."}</span></>}
              ru={<>Привет, <span className="italic text-[color:var(--mint)]">{profile?.full_name ?? profile?.username ?? "..."}</span></>}
              en={<>Hello, <span className="italic text-[color:var(--mint)]">{profile?.full_name ?? profile?.username ?? "..."}</span></>}
            />
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            <L kk="Денсаулық индексіңіз тұрақты. Дəрі кестесін ұмытпаңыз." ru="Индекс здоровья стабильный. Не забудьте про лекарства." en="Your health index is steady. Don't forget your meds." />
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge tone="mint">ID · {profile?.public_id ?? "..."}</Badge>
            {profile?.blood_type && <Badge tone="muted">{profile.blood_type}</Badge>}
            {profile?.allergies && <Badge tone="warning">⚠ {profile.allergies}</Badge>}
          </div>
        </div>
        <div className="flex justify-center"><HealthOrb value={78} /></div>
      </Bento>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Bento>
          <div className="flex items-baseline justify-between">
            <SectionEyebrow><L kk="Апталық тренд" ru="Недельный тренд" en="Weekly trend" /></SectionEyebrow>
            <div className="flex gap-1">
              {(["7","30"] as const).map(r => (
                <button key={r} onClick={()=>setRange(r)} className={`rounded-full px-3 py-1 text-[10px] ${range===r?"bg-foreground text-background":"bg-surface text-muted-foreground"}`}>{r}d</button>
              ))}
            </div>
          </div>
          <div className="mt-3 h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--mint)" stopOpacity={0.6}/>
                    <stop offset="100%" stopColor="var(--mint)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="d" stroke="var(--muted-foreground)" fontSize={10} />
                <YAxis stroke="var(--muted-foreground)" fontSize={10} />
                <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 11 }} />
                <Area type="monotone" dataKey="score" stroke="var(--mint)" strokeWidth={2} fill="url(#g)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Bento>

        <Bento>
          <div className="flex items-baseline justify-between">
            <SectionEyebrow><L kk="Бүгінгі дәрілер" ru="Лекарства сегодня" en="Today's meds" /></SectionEyebrow>
            <span className="text-[11px] text-muted-foreground">{taken}/{meds.length}</span>
          </div>
          <div className="mt-3 space-y-2">
            {meds.length === 0 && <div className="rounded-xl border border-dashed border-border p-4 text-center text-[12px] text-muted-foreground"><L kk="Дәрі жоқ. Дәрілер бетінен қосыңыз." ru="Пусто. Добавьте в разделе Лекарства." en="No meds. Add via Meds page." /></div>}
            {meds.map(m => (
              <button key={m.id} onClick={()=>toggleMed(m)} className="flex w-full items-center gap-3 rounded-lg border border-border bg-surface px-3 py-2.5 text-left">
                <div className={`h-2 w-2 rounded-full ${m.taken?"bg-[color:var(--mint)]":"bg-muted-foreground"}`} />
                <div className="font-mono text-[11px] text-muted-foreground">{m.scheduled_time ?? "—"}</div>
                <div className="flex-1 text-[12px] text-foreground">{m.name}</div>
                {m.taken ? <Badge tone="mint">✓</Badge> : <Chip>{L1({kk:"Күтуде",ru:"Ожидание",en:"Pending"})}</Chip>}
              </button>
            ))}
          </div>
        </Bento>
      </div>
    </div>
  );
}

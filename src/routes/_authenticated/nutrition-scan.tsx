import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useRef, type ReactNode } from "react";
import { toast } from "sonner";
import { Bento, Badge, SectionEyebrow, Bar } from "@/components/ui-kit";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/lib/use-session";
import { analyzeFoodPhoto, analyzeBarcode, type FoodResult } from "@/lib/nutrition.functions";
import { L, useL } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/nutrition-scan")({
  head: () => ({
    meta: [
      { title: "Тамақ · SmartNutri — SauBol AI" },
      { name: "description", content: "Photo & barcode nutrition scanning with AI. Auto-log macros." },
      { property: "og:title", content: "SmartNutri · SauBol" },
      { property: "og:description", content: "Тамақты фотоға түсіріп КБЖУ-ды AI анықтайды." },
    ],
  }),
  component: NutritionPage,
});

const GOALS = { calories: 2357, carbs: 295, protein: 88, fat: 79 };

type FoodLog = {
  id: string; name: string; calories: number; carbs_g: number; protein_g: number; fat_g: number;
  warning: string | null; created_at: string; source: string;
};

function CalorieRing({ consumed, burned, goal }: { consumed: number; burned: number; goal: number }) {
  const left = Math.max(0, goal + burned - consumed);
  const pct = Math.min(1, consumed / Math.max(1, goal + burned));
  const R = 88, C = Math.PI * R;
  const dash = C * pct;
  return (
    <div className="grid grid-cols-3 items-center gap-2">
      <div className="text-center">
        <div className="font-mono text-2xl text-foreground">{consumed}</div>
        <div className="text-[10px] uppercase text-muted-foreground"><L kk="Жеді" ru="Съедено" en="Consumed" /></div>
      </div>
      <div className="relative">
        <svg viewBox="0 0 200 120" className="w-full">
          <path d={`M 12 108 A ${R} ${R} 0 0 1 188 108`} stroke="var(--border)" strokeWidth="12" fill="none" strokeLinecap="round" />
          <path d={`M 12 108 A ${R} ${R} 0 0 1 188 108`} stroke="var(--mint)" strokeWidth="12" fill="none" strokeLinecap="round"
            strokeDasharray={`${dash} ${C}`} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-2">
          <div className="font-serif text-3xl text-foreground">{left}</div>
          <div className="text-[10px] uppercase text-muted-foreground"><L kk="Қалды" ru="Осталось" en="Left" /></div>
        </div>
      </div>
      <div className="text-center">
        <div className="font-mono text-2xl text-foreground">{burned}</div>
        <div className="text-[10px] uppercase text-muted-foreground"><L kk="Жанды" ru="Сожжено" en="Burned" /></div>
      </div>
    </div>
  );
}

function SquareBlock({ title, icon, tone, children }: { title: ReactNode; icon: ReactNode; tone: "mint"|"amber"|"violet"|"sky"; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const toneMap = {
    mint:   "from-[color:var(--mint-soft)] to-transparent border-[color:var(--mint)]/25 text-[color:var(--mint)]",
    amber:  "from-amber-500/10 to-transparent border-amber-500/25 text-amber-400",
    violet: "from-violet-500/10 to-transparent border-violet-500/25 text-violet-300",
    sky:    "from-sky-500/10 to-transparent border-sky-500/25 text-sky-300",
  }[tone];
  return (
    <>
      <button
        onClick={()=>setOpen(true)}
        className={`group relative aspect-square overflow-hidden rounded-2xl border bg-card p-4 text-left transition hover:-translate-y-0.5 hover:border-white/25 ${toneMap.split(" ").slice(-2).join(" ")}`}
      >
        <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br opacity-70 ${toneMap.split(" ").slice(0,2).join(" ")}`} />
        <div className="relative flex h-full flex-col">
          <div className={`text-3xl leading-none ${toneMap.split(" ").pop()}`}>{icon}</div>
          <div className="mt-auto">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-foreground">{title}</div>
            <div className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
              <L kk="ашу" ru="открыть" en="open" />
              <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 17L17 7M17 7H8M17 7V16"/></svg>
            </div>
          </div>
        </div>
      </button>
      {open && (
        <div onClick={()=>setOpen(false)} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur">
          <div onClick={e=>e.stopPropagation()} className="max-h-[80vh] w-full max-w-lg overflow-auto rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center gap-3">
              <div className={`grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br ${toneMap.split(" ").slice(0,2).join(" ")} ${toneMap.split(" ").pop()} text-xl`}>{icon}</div>
              <div className="font-serif text-2xl text-foreground">{title}</div>
              <button onClick={()=>setOpen(false)} className="ml-auto rounded-full border border-border bg-surface px-3 py-1 text-xs">✕</button>
            </div>
            <div className="mt-4">{children}</div>
          </div>
        </div>
      )}
    </>
  );
}

function NutritionPage() {
  const { profile } = useProfile();
  const [logs, setLogs] = useState<FoodLog[]>([]);
  const [scanning, setScanning] = useState(false);
  const [barcode, setBarcode] = useState("");
  const [lastWarn, setLastWarn] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const L1 = useL();

  useEffect(() => {
    if (!profile) return;
    const since = new Date(); since.setHours(0,0,0,0);
    supabase.from("food_logs").select("*").eq("user_id", profile.id).gte("created_at", since.toISOString()).order("created_at", { ascending: false })
      .then(({ data }) => setLogs((data as FoodLog[]) ?? []));
    const ch = supabase.channel(`food-${profile.id}`).on("postgres_changes",
      { event: "INSERT", schema: "public", table: "food_logs", filter: `user_id=eq.${profile.id}` },
      (payload) => setLogs(s => [payload.new as FoodLog, ...s])).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [profile]);

  const totals = logs.reduce((a, l) => ({
    calories: a.calories + Number(l.calories),
    carbs: a.carbs + Number(l.carbs_g),
    protein: a.protein + Number(l.protein_g),
    fat: a.fat + Number(l.fat_g),
  }), { calories: 0, carbs: 0, protein: 0, fat: 0 });

  const saveResult = async (r: FoodResult, source: "photo"|"barcode", photoPath?: string) => {
    if (!profile) return;
    const { error } = await supabase.from("food_logs").insert({
      user_id: profile.id, name: r.name, calories: r.calories, carbs_g: r.carbs_g,
      protein_g: r.protein_g, fat_g: r.fat_g, warning: r.warning, source, photo_path: photoPath ?? null,
    });
    if (error) { toast.error(error.message); return; }
    toast.success(`+ ${r.name} · ${r.calories} kcal`);
    setLastWarn(r.warning ?? null);
  };

  const scanPhoto = async (file: File) => {
    if (!profile) return;
    setScanning(true);
    try {
      const reader = new FileReader();
      const dataUrl = await new Promise<string>((res, rej) => {
        reader.onload = () => res(reader.result as string);
        reader.onerror = rej; reader.readAsDataURL(file);
      });
      const path = `${profile.id}/${Date.now()}-${file.name}`;
      await supabase.storage.from("food-photos").upload(path, file);
      const r = await analyzeFoodPhoto({ data: { imageDataUrl: dataUrl, allergies: profile.allergies ?? undefined } });
      await saveResult(r, "photo", path);
    } catch (e) { toast.error(e instanceof Error ? e.message : "Scan failed"); }
    finally { setScanning(false); }
  };

  const scanBarcode = async () => {
    if (!profile || !barcode.trim()) return;
    setScanning(true);
    try {
      const r = await analyzeBarcode({ data: { barcode: barcode.trim(), allergies: profile.allergies ?? undefined } });
      await saveResult(r, "barcode");
      setBarcode("");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Scan failed"); }
    finally { setScanning(false); }
  };

  const last = logs[0];
  const macroPct = last ? {
    protein: Math.min(100, Math.round((last.protein_g * 4 / Math.max(1, last.calories)) * 100)),
    carbs: Math.min(100, Math.round((last.carbs_g * 4 / Math.max(1, last.calories)) * 100)),
    fat: Math.min(100, Math.round((last.fat_g * 9 / Math.max(1, last.calories)) * 100)),
  } : { protein: 25, carbs: 50, fat: 25 };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 border-b border-border pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <SectionEyebrow>SmartNutri · {L1({kk:"Бүгін",ru:"Сегодня",en:"Today"})}</SectionEyebrow>
          <h1 className="mt-2 font-serif text-4xl leading-[1.05] tracking-tight text-foreground md:text-5xl">
            <L kk={<>Тамақ <span className="italic text-[color:var(--mint)]">аман</span></>} ru={<>Питание <span className="italic text-[color:var(--mint)]">под контролем</span></>} en={<>Nutrition, <span className="italic text-[color:var(--mint)]">balanced</span></>} />
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_280px]">
        <Bento>
          <SectionEyebrow><L kk="Қорытынды" ru="Сводка" en="Summary" /></SectionEyebrow>
          <div className="mt-4">
            <CalorieRing consumed={Math.round(totals.calories)} burned={162} goal={GOALS.calories} />
          </div>
          <div className="mt-6 space-y-3">
            {[
              { l: L1({kk:"Көмірсулар",ru:"Углеводы",en:"Carbs"}), v: totals.carbs, g: GOALS.carbs },
              { l: L1({kk:"Ақуыз",ru:"Белки",en:"Protein"}), v: totals.protein, g: GOALS.protein },
              { l: L1({kk:"Май",ru:"Жиры",en:"Fat"}), v: totals.fat, g: GOALS.fat },
            ].map((r) => (
              <div key={r.l}>
                <div className="mb-1 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>{r.l}</span><span className="font-mono">{Math.round(r.v)} / {r.g} г</span>
                </div>
                <Bar value={Math.min(100, (r.v / r.g) * 100)} tone="mint" />
              </div>
            ))}
          </div>
          {lastWarn && (
            <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-[12px] text-foreground">
              ⚠ {lastWarn}
            </div>
          )}
        </Bento>

        <div className="flex flex-col gap-4">
          <Bento className="flex flex-col items-start gap-3">
            <div className="text-3xl">📷</div>
            <div>
              <div className="font-serif text-lg text-foreground"><L kk="Тамақ фотосы" ru="Фото еды" en="Food photo" /></div>
              <div className="text-[11px] text-muted-foreground"><L kk="AI КБЖУ анықтайды" ru="AI определит КБЖУ" en="AI detects macros" /></div>
            </div>
            <input ref={fileRef} type="file" accept="image/*" capture="environment" hidden onChange={(e)=>{ const f = e.target.files?.[0]; if (f) scanPhoto(f); e.target.value = ""; }} />
            <button disabled={scanning} onClick={()=>fileRef.current?.click()} className="w-full rounded-full bg-foreground py-2 text-xs font-medium text-background disabled:opacity-50">
              {scanning ? "..." : L1({kk:"Түсіру / Жүктеу",ru:"Снять / Загрузить",en:"Capture / Upload"})}
            </button>
          </Bento>
          <Bento className="flex flex-col items-start gap-3">
            <div className="text-3xl">🔲</div>
            <div>
              <div className="font-serif text-lg text-foreground"><L kk="Штрих-код" ru="Штрих-код" en="Barcode" /></div>
              <div className="text-[11px] text-muted-foreground"><L kk="Кодты енгізіңіз" ru="Введите код" en="Enter code" /></div>
            </div>
            <input value={barcode} onChange={(e)=>setBarcode(e.target.value)} placeholder="4870...." className="w-full rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-foreground" />
            <button disabled={scanning || !barcode.trim()} onClick={scanBarcode} className="w-full rounded-full bg-foreground py-2 text-xs font-medium text-background disabled:opacity-50">
              {scanning ? "..." : L1({kk:"Анықтау",ru:"Найти",en:"Look up"})}
            </button>
          </Bento>
        </div>
      </div>

      <Bento>
        <div className="flex items-baseline justify-between">
          <SectionEyebrow><L kk="Бүгін жегендер" ru="Съедено сегодня" en="Today's log" /></SectionEyebrow>
          <span className="text-[11px] text-muted-foreground">{logs.length}</span>
        </div>
        <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
          {logs.length === 0 && <div className="text-[12px] text-muted-foreground"><L kk="Әлі ешнәрсе жоқ. Жоғарыдағы сканермен қосыңыз." ru="Пока пусто. Добавьте через сканеры выше." en="Nothing yet. Use scanners above." /></div>}
          {logs.map(l => (
            <div key={l.id} className="flex items-center gap-3 rounded-lg border border-border bg-surface px-3 py-2">
              <div className="text-lg">{l.source === "photo" ? "📷" : "🔲"}</div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[12px] text-foreground">{l.name}</div>
                <div className="font-mono text-[10px] text-muted-foreground">{Math.round(l.calories)} kcal · C{Math.round(l.carbs_g)} P{Math.round(l.protein_g)} F{Math.round(l.fat_g)}</div>
              </div>
              {l.warning && <Badge tone="warning">⚠</Badge>}
            </div>
          ))}
        </div>
      </Bento>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <SquareBlock tone="sky" icon="🧪" title={<L kk="Ингредиенттер" ru="Ингредиенты" en="Ingredients" />}>
          <ul className="space-y-2 text-[13px] text-foreground">
            <li className="flex justify-between rounded-lg border border-border bg-surface px-3 py-2"><span>Refined wheat flour</span><span className="text-muted-foreground">carb</span></li>
            <li className="flex justify-between rounded-lg border border-border bg-surface px-3 py-2"><span>Palm oil</span><span className="text-muted-foreground">sat. fat</span></li>
            <li className="flex justify-between rounded-lg border border-border bg-surface px-3 py-2"><span>Sodium 1,240 mg</span><span className="text-amber-400">62% RDI</span></li>
            <li className="flex justify-between rounded-lg border border-border bg-surface px-3 py-2"><span>E211 · E621</span><span className="text-muted-foreground">preservatives</span></li>
          </ul>
        </SquareBlock>
        <SquareBlock tone="amber" icon="⚠" title={<L kk="Қауіп матрицасы" ru="Матрица рисков" en="Contraindications" />}>
          <div className="space-y-2 text-[13px]">
            {[["Type 2 Diabetes","Glycemic spike expected","high"],["Hypertension","Sodium exceeds ceiling","high"],["GERD","Fried — may trigger reflux","med"]].map(([c,d,l])=>(
              <div key={c} className="rounded-lg border border-border bg-surface p-3">
                <div className="flex items-center justify-between"><span className="font-medium text-foreground">{c}</span><Badge tone={l==="high"?"warning":"muted"}>{l}</Badge></div>
                <div className="mt-0.5 text-[11px] text-muted-foreground">{d}</div>
              </div>
            ))}
          </div>
        </SquareBlock>
        <SquareBlock tone="violet" icon="🥦" title={<L kk="Аллергендер" ru="Аллергены" en="Allergens" />}>
          <div className="flex flex-wrap gap-2">
            {[["Wheat gluten","high"],["Soy lecithin","trace"],["Sesame","possible"]].map(([n,l])=>(
              <div key={n} className="rounded-full border border-border bg-surface px-3 py-1.5 text-[12px] text-foreground">
                {n} · <span className="text-muted-foreground">{l}</span>
              </div>
            ))}
          </div>
        </SquareBlock>
        <SquareBlock tone="mint" icon="📊" title={<L kk="Макро тарату" ru="Макро" en="Macros" />}>
          <div className="space-y-3 text-[13px]">
            {[
              { l: "Protein", pct: macroPct.protein, color: "var(--mint)" },
              { l: "Carbs", pct: macroPct.carbs, color: "#7dd3fc" },
              { l: "Fat", pct: macroPct.fat, color: "#fbbf24" },
            ].map(r => (
              <div key={r.l}>
                <div className="mb-1 flex justify-between text-[11px] text-muted-foreground"><span>{r.l}</span><span className="font-mono">{r.pct}%</span></div>
                <div className="h-2 overflow-hidden rounded-full bg-border"><div style={{ width: `${r.pct}%`, background: r.color }} className="h-full" /></div>
              </div>
            ))}
          </div>
        </SquareBlock>
      </div>
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { LineChart, Line, ResponsiveContainer, YAxis, XAxis, CartesianGrid } from "recharts";
import { Bento, Badge, SectionEyebrow, Chip } from "@/components/ui-kit";
import { L, useL } from "@/lib/i18n";
import { useMyProfile } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/scanner")({
  head: () => ({
    meta: [
      { title: "SauBol AI — WiFi Сканер" },
      { name: "description", content: "WiFi-сканер присутствия и жизненных показателей — демо визуализация." },
      { property: "og:title", content: "SauBol AI — WiFi Сканер" },
      { property: "og:description", content: "Демо WiFi-сенсинга: пульс, дыхание, детекция обморока." },
    ],
  }),
  component: ScannerPage,
});

type Scenario = "one" | "two" | "crisis";
const MAX_POINTS = 60;

type Point = { t: number; resp: number; hr: number };

function makeInitial(): Point[] {
  const now = Date.now();
  return Array.from({ length: MAX_POINTS }, (_, i) => ({
    t: now - (MAX_POINTS - i) * 1000,
    resp: 50 + Math.sin(i / 3) * 20,
    hr: 72,
  }));
}

function PresenceOrb({ color = "var(--mint)", label, sub }: { color?: string; label: string; sub?: string }) {
  return (
    <div className="relative grid place-items-center" style={{ width: 180, height: 180 }}>
      <div className="absolute inset-0 rounded-full blur-2xl" style={{ background: `radial-gradient(circle,${color}33,transparent 65%)` }} />
      <div className="orb-rotate absolute inset-1 rounded-full border" style={{ borderColor: `${color}33`, borderStyle: "dashed" }} />
      <div className="absolute inset-6 rounded-full border" style={{ borderColor: `${color}22` }} />
      <div className="absolute inset-12 rounded-full border" style={{ borderColor: `${color}18` }} />
      <div
        className="orb-float relative grid h-20 w-20 place-items-center rounded-full text-3xl"
        style={{
          background: `radial-gradient(circle at 32% 28%, color-mix(in oklab, ${color} 60%, white), ${color} 45%, color-mix(in oklab, ${color} 40%, black))`,
          boxShadow: `inset -10px -18px 30px rgba(0,0,0,.55), 0 20px 40px -15px ${color}88`,
        }}
      >
        <span>👤</span>
      </div>
      <div className="absolute -bottom-1 rounded-full border px-3 py-1 text-[10px] font-medium uppercase tracking-widest backdrop-blur"
        style={{ borderColor: `${color}55`, color, background: `${color}14` }}>
        {label}
      </div>
      {sub && <div className="absolute -bottom-8 text-[10px] text-muted-foreground">{sub}</div>}
    </div>
  );
}

function ScannerPage() {
  const L1 = useL();
  const { user } = useMyProfile();
  const [scenario, setScenario] = useState<Scenario>("one");
  const [data, setData] = useState<Point[]>(makeInitial);
  const [hr, setHr] = useState(72);
  const [resp, setResp] = useState(15);
  const [alertId, setAlertId] = useState<string | null>(null);
  const [alertStatus, setAlertStatus] = useState<"pending" | "ok" | "help" | "escalated" | null>(null);
  const [countdown, setCountdown] = useState(30);
  const phaseRef = useRef(0);
  const crisisStartRef = useRef<number | null>(null);

  // reset when scenario changes
  useEffect(() => {
    phaseRef.current = 0;
    crisisStartRef.current = scenario === "crisis" ? Date.now() : null;
    setData(makeInitial());
    setHr(72);
    setResp(15);
    setAlertId(null);
    setAlertStatus(null);
    setCountdown(30);
  }, [scenario]);

  // tick
  useEffect(() => {
    const iv = setInterval(() => {
      phaseRef.current += 1;
      const p = phaseRef.current;
      const now = Date.now();

      setData((prev) => {
        let hrVal: number;
        let respVal: number;
        if (scenario === "crisis") {
          const elapsed = (now - (crisisStartRef.current ?? now)) / 1000;
          // drop hr from ~75 to 0 over ~5s
          const t = Math.min(1, elapsed / 5);
          hrVal = Math.max(0, 75 * (1 - t) + (Math.random() - 0.5) * (t < 1 ? 6 : 0.5));
          respVal = Math.max(0, 50 * (1 - t) + Math.sin(p / 3) * 10 * (1 - t));
        } else {
          hrVal = 72 + Math.sin(p / 4) * 6 + (Math.random() - 0.5) * 4;
          respVal = 50 + Math.sin(p / 3) * 22 + (Math.random() - 0.5) * 4;
        }
        setHr(Math.round(hrVal));
        // respiration rate 12-18 rpm
        setResp(scenario === "crisis" ? Math.max(0, Math.round(15 * Math.max(0, 1 - (now - (crisisStartRef.current ?? now)) / 5000))) : 12 + Math.round(Math.random() * 6));
        const next = [...prev.slice(1), { t: now, resp: respVal, hr: hrVal }];
        return next;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [scenario]);

  // create alert after 2.5s in crisis
  useEffect(() => {
    if (scenario !== "crisis" || !user || alertId) return;
    const to = setTimeout(async () => {
      const { data, error } = await supabase
        .from("fall_alerts")
        .insert({ user_id: user.id, status: "pending" })
        .select()
        .maybeSingle();
      if (error) { toast.error(error.message); return; }
      if (data) {
        setAlertId(data.id);
        setAlertStatus("pending");
      }
    }, 2500);
    return () => clearTimeout(to);
  }, [scenario, user?.id, alertId]);

  // countdown + realtime subscription
  useEffect(() => {
    if (!alertId) return;
    const iv = setInterval(() => setCountdown((c) => Math.max(0, c - 1)), 1000);
    const ch = supabase
      .channel(`fall_alerts:${alertId}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "fall_alerts", filter: `id=eq.${alertId}` }, (payload) => {
        const s = (payload.new as any)?.status;
        if (s) setAlertStatus(s);
      })
      .subscribe();
    return () => { clearInterval(iv); supabase.removeChannel(ch); };
  }, [alertId]);

  const crisis = scenario === "crisis";
  const color = crisis ? "var(--danger)" : "var(--mint)";

  const statusText = crisis
    ? { kk: "Дабыл!", ru: "Критично", en: "Critical" }
    : { kk: "Барлығы жақсы", ru: "Всё в порядке", en: "All good" };

  return (
    <div className="space-y-6">
      <Bento className="relative overflow-hidden p-6">
        <div className="aurora" />
        <div className="relative flex flex-wrap items-baseline justify-between gap-3">
          <div>
            <SectionEyebrow>WiFi DensePose · Demo</SectionEyebrow>
            <h1 className="font-serif text-3xl text-foreground md:text-4xl">
              <L kk="Сканер" ru="Сканер" en="Scanner" />{" "}
              <span className="italic text-[color:var(--mint)]">присутствия</span>
            </h1>
            <p className="mt-1 max-w-xl text-sm text-muted-foreground">
              <L
                kk="WiFi сигналдары арқылы тыныс алу мен пульсті анықтау демосы. Нақты сенсор жоқ, барлық деректер имитацияланған."
                ru="Демо детекции дыхания и пульса через микро-вариации WiFi. Реального сенсора нет, все данные симулированы."
                en="Demo of respiration and pulse detection via WiFi micro-variations. No real sensor, all data simulated."
              />
            </p>
          </div>
          <Badge tone={crisis ? "warning" : "mint"}>● DEMO</Badge>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {([
            ["one", { kk: "1 адам үйде", ru: "1 человек дома", en: "1 person home" }],
            ["two", { kk: "2 адам үйде", ru: "2 человека дома", en: "2 people home" }],
            ["crisis", { kk: "Есінен тану / жүрек тоқтауы", ru: "Обморок / остановка сердца", en: "Fainting / cardiac arrest" }],
          ] as const).map(([id, tr]) => (
            <button key={id} onClick={() => setScenario(id)}>
              <Chip active={scenario === id}>{L1(tr)}</Chip>
            </button>
          ))}
        </div>
      </Bento>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1.4fr]">
        <Bento className="relative overflow-hidden">
          <SectionEyebrow>
            <L kk="Қатысу" ru="Присутствие" en="Presence" />
          </SectionEyebrow>
          <div className="mt-4 flex flex-wrap items-center justify-around gap-6 py-6">
            {scenario === "two" ? (
              <>
                <PresenceOrb color="var(--mint)" label={L1({ kk: "Адам 1", ru: "Персона 1", en: "Person 1" })} />
                <PresenceOrb color="var(--mint)" label={L1({ kk: "Адам 2", ru: "Персона 2", en: "Person 2" })} />
              </>
            ) : (
              <PresenceOrb color={color} label={L1({ kk: "Адам", ru: "Персона", en: "Person" })} />
            )}
          </div>
          <div className="mt-2 flex items-center justify-center gap-2">
            <span className={`h-2 w-2 rounded-full ${crisis ? "bg-[color:var(--danger)]" : "bg-[color:var(--mint)]"} live-dot`} />
            <span className={`text-sm font-medium ${crisis ? "text-[color:var(--danger)]" : "text-[color:var(--mint)]"}`}>
              {L1(statusText)}
            </span>
          </div>
        </Bento>

        <Bento className="relative overflow-hidden">
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-border bg-surface p-3">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                <L kk="Пульс" ru="Пульс" en="Heart rate" />
              </div>
              <div className="font-serif text-3xl tabular-nums" style={{ color }}>
                {hr}<span className="ml-1 text-xs text-muted-foreground">BPM</span>
              </div>
            </div>
            <div className="rounded-xl border border-border bg-surface p-3">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                <L kk="Тыныс алу" ru="Дыхание" en="Respiration" />
              </div>
              <div className="font-serif text-3xl tabular-nums text-foreground">
                {resp}<span className="ml-1 text-xs text-muted-foreground">RPM</span>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <div className="mb-1 text-[10px] uppercase tracking-widest text-muted-foreground">
              <L kk="Пульс графигі" ru="График пульса" en="Heart rate signal" />
            </div>
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                  <CartesianGrid stroke="var(--border)" strokeDasharray="2 4" vertical={false} />
                  <XAxis dataKey="t" hide />
                  <YAxis hide domain={[0, 120]} />
                  <Line type="monotone" dataKey="hr" stroke={color} strokeWidth={2} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-2">
            <div className="mb-1 text-[10px] uppercase tracking-widest text-muted-foreground">
              <L kk="Тыныс алу толқыны" ru="Волна дыхания" en="Respiration wave" />
            </div>
            <div className="h-24">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                  <XAxis dataKey="t" hide />
                  <YAxis hide domain={[-10, 110]} />
                  <Line type="monotone" dataKey="resp" stroke="var(--mint)" strokeWidth={2} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Bento>
      </div>

      {crisis && (
        <Bento className="border-[color:var(--danger)]/40 bg-[color:var(--danger)]/5">
          {alertStatus === "ok" || alertStatus === "help" ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  <L kk="Жауап" ru="Ответ" en="Response" />
                </div>
                <div className="font-serif text-2xl text-foreground">
                  {alertStatus === "ok"
                    ? L1({ kk: "✅ Пайдаланушы: бәрі жақсы", ru: "✅ Пользователь ответил: всё хорошо", en: "✅ User replied: I'm okay" })
                    : L1({ kk: "🚨 Пайдаланушы көмек сұрайды", ru: "🚨 Пользователь просит помощи", en: "🚨 User requested help" })}
                </div>
              </div>
              <button onClick={() => setScenario("one")} className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background">
                <L kk="Сценарийді қалпына келтіру" ru="Сбросить сценарий" en="Reset scenario" />
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-[color:var(--danger)]">
                  <L kk="Дабыл жіберілді" ru="Отправлен алерт" en="Alert sent" />
                </div>
                <div className="font-serif text-2xl text-foreground">
                  {countdown > 0 ? (
                    <>
                      <span className="tabular-nums text-[color:var(--danger)]">{countdown}s</span>{" "}
                      <span className="text-base text-muted-foreground">
                        <L
                          kk="— Telegram-ға жіберілді, жауапты күтудеміз..."
                          ru="— отправлен в Telegram, ожидание ответа..."
                          en="— sent to Telegram, awaiting response..."
                        />
                      </span>
                    </>
                  ) : (
                    <L
                      kk="Жауап күтудеміз... туыстарға эскалация бір минут ішінде болады"
                      ru="Ожидаем ответ... эскалация родственнику произойдёт в течение минуты"
                      en="Awaiting response... escalation to a relative within a minute"
                    />
                  )}
                </div>
                {alertId && <div className="mt-1 font-mono text-[10px] text-muted-foreground">alert #{alertId.slice(0, 8)} · {alertStatus}</div>}
              </div>
              <button onClick={() => setScenario("one")} className="rounded-full border border-border px-4 py-2 text-sm text-foreground">
                <L kk="Сценарийді қалпына келтіру" ru="Сбросить сценарий" en="Reset scenario" />
              </button>
            </div>
          )}
        </Bento>
      )}
    </div>
  );
}

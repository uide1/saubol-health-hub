import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Card, Badge, PageHeader, SectionEyebrow } from "@/components/ui-kit";
import { useL, L } from "@/lib/i18n";


export const Route = createFileRoute("/prescription-rx")({
  head: () => ({
    meta: [
      { title: "Дәрілер — RxClarify · SauBol" },
      { name: "description", content: "Prescription OCR, daily schedule, and drug reminders." },
    ],
  }),
  component: PrescriptionRx,
});

type Slot = { id: string; time: string; drug: string; note: string; tone: "success" | "warning" | "muted"; taken: boolean };

const INITIAL_SCHEDULE: Slot[] = [
  { id: "1", time: "08:00", drug: "Paracetamol 500 mg", note: "After breakfast", tone: "muted", taken: true },
  { id: "2", time: "09:00", drug: "Ferrous bisglycinate 25 mg", note: "With vitamin C", tone: "success", taken: true },
  { id: "3", time: "13:00", drug: "Amoxicillin 500 mg", note: "With meal", tone: "muted", taken: false },
  { id: "4", time: "15:00", drug: "Omeprazole 20 mg", note: "Before lunch", tone: "warning", taken: false },
  { id: "5", time: "19:00", drug: "Amoxicillin 500 mg", note: "With meal", tone: "muted", taken: false },
  { id: "6", time: "21:00", drug: "Vitamin D3 4000 IU", note: "With fats", tone: "success", taken: false },
  { id: "7", time: "22:30", drug: "Melatonin 3 mg", note: "Before sleep", tone: "muted", taken: false },
];

function PrescriptionRx() {
  const [schedule, setSchedule] = useState<Slot[]>(INITIAL_SCHEDULE);
  const [synced, setSynced] = useState(false);
  const [remindersOn, setRemindersOn] = useState(false);
  const remindedRef = useRef<Set<string>>(new Set());
  const L1 = useL();


  // Reminder engine — checks every 30s whether any dose is due within 5 min
  useEffect(() => {
    if (!remindersOn) return;
    const tick = () => {
      const now = new Date();
      schedule.forEach((s) => {
        if (s.taken || remindedRef.current.has(s.id)) return;
        const [h, m] = s.time.split(":").map(Number);
        const target = new Date(); target.setHours(h, m, 0, 0);
        const diff = (target.getTime() - now.getTime()) / 60000;
        if (diff <= 5 && diff >= -1) {
          remindedRef.current.add(s.id);
          toast(`⏰ Дәрі уақыты — ${s.drug}`, { description: `${s.time} · ${s.note}`, duration: 8000 });
          if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
            new Notification("SauBol · Дәрі-дәрмек ескертпесі", { body: `${s.time} — ${s.drug}\n${s.note}` });
          }
        }
      });
    };
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, [remindersOn, schedule]);

  const enableReminders = async () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        await Notification.requestPermission();
      }
    }
    setRemindersOn(true);
    remindedRef.current.clear();
    toast.success("🔔 Ескертпелер қосылды", { description: "Дәрі уақыты жақындағанда хабарлама келеді" });
  };

  const toggleTaken = (id: string) => {
    setSchedule((s) => s.map((r) => r.id === id ? { ...r, taken: !r.taken } : r));
  };

  const addSlot = () => {
    const drug = window.prompt(L1({ kk: "Дәрі атауы (мыс.: Losartan 50 mg)", ru: "Название препарата (напр.: Losartan 50 mg)", en: "Drug name (e.g. Losartan 50 mg)" }));
    if (!drug) return;
    const time = window.prompt(L1({ kk: "Уақыты (HH:MM)", ru: "Время (HH:MM)", en: "Time (HH:MM)" }), "08:00");
    if (!time || !/^\d{2}:\d{2}$/.test(time)) { toast.error(L1({ kk: "Уақыт форматы дұрыс емес", ru: "Неверный формат времени", en: "Invalid time format" })); return; }
    const note = window.prompt(L1({ kk: "Ескерту (мыс.: Тамақтан кейін)", ru: "Заметка (напр.: После еды)", en: "Note (e.g. After meal)" }), L1({ kk: "Тамақтан кейін", ru: "После еды", en: "After meal" })) ?? "";
    const id = Math.random().toString(36).slice(2, 8);
    setSchedule((s) => [...s, { id, time, drug: drug.trim(), note: note.trim(), tone: "muted" as const, taken: false }].sort((a, b) => a.time.localeCompare(b.time)));
    toast.success(`+ ${drug} ${L1({ kk: "кестеге қосылды", ru: "добавлен в расписание", en: "added to schedule" })}`, { description: `${time}` });
  };

  const removeSlot = (id: string) => {
    setSchedule((s) => s.filter((r) => r.id !== id));
    toast(L1({ kk: "Кестеден алынды", ru: "Удалено из расписания", en: "Removed from schedule" }));
  };


  const takenCount = schedule.filter(s => s.taken).length;

  return (
    <div>
      <PageHeader
        eyebrow={<L kk="RxClarify · Рецепт № 2026-0472" ru="RxClarify · Рецепт № 2026-0472" en="RxClarify · Rx № 2026-0472" />}
        title={<L kk="Рецепт декодері және қауіпсіздік" ru="Декодер рецептов и безопасность" en="Prescription Decoder & Safety" />}
        description={<L kk="Қолжазба танылды · фармацевт-расталған кесте · ақылды ескертпелер" ru="Почерк распознан · график, проверенный фармацевтом · умные напоминания" en="Handwriting decoded · pharmacist-verified schedule · smart reminders" />}
        actions={
          <>
            <button onClick={() => toast.info(L1({ kk: "📸 Рецепт суретін жүктеңіз", ru: "📸 Загрузите фото рецепта", en: "📸 Upload prescription photo" }), { description: L1({ kk: "OCR модельі жазуды тануға дайын", ru: "OCR готов распознать текст", en: "OCR model ready to decode" }) })} className="rounded-md border border-border bg-surface px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground">
              <L kk="Фото жүктеу" ru="Загрузить фото" en="Upload photo" />
            </button>
            <button onClick={remindersOn ? () => { setRemindersOn(false); toast(L1({ kk: "🔕 Ескертпелер өшірілді", ru: "🔕 Напоминания выключены", en: "🔕 Reminders off" })); } : enableReminders} className={`rounded-md px-3 py-1.5 text-xs font-medium ${remindersOn ? "bg-[color:var(--mint)] text-background" : "border border-border bg-surface text-foreground"}`}>
              {remindersOn ? <>🔔 <L kk="Ескертпелер қосулы" ru="Напоминания вкл" en="Reminders ON" /></> : <>🔕 <L kk="Ескертпелерді қосу" ru="Включить напоминания" en="Enable reminders" /></>}
            </button>
            <button onClick={() => { setSynced(true); toast.success(synced ? L1({ kk: "Apple Health-пен қайта синхрондалды", ru: "Пересинхронизировано с Apple Health", en: "Re-synced with Apple Health" }) : L1({ kk: "✓ Apple Health-ке синхрондалды", ru: "✓ Синхронизировано с Apple Health", en: "✓ Synced to Apple Health" }), { description: `${schedule.length} ${L1({ kk: "дәрі-дәрмек экспортталды", ru: "препаратов экспортировано", en: "meds exported" })}` }); }} className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground">{synced ? <>Synced ✓</> : <L kk="Apple Health-ке синхрондау" ru="Синхронизировать с Apple Health" en="Sync to Apple Health" />}</button>
          </>
        }
      />

      {/* BIG timetable — full width, hero */}
      <div className="mb-6 rounded-2xl border border-border bg-card p-6">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
          <div>
            <SectionEyebrow><L kk="Күнделікті кесте · Asia/Almaty" ru="Дневное расписание · Asia/Almaty" en="Daily schedule · Asia/Almaty" /></SectionEyebrow>
            <div className="font-serif text-3xl text-foreground">
              {takenCount} <span className="text-muted-foreground">/ {schedule.length} <L kk="қабылданды" ru="принято" en="taken" /></span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-[11px] text-muted-foreground"><L kk="Ұстанымдылық 92% · апта" ru="Приверженность 92% · неделя" en="Adherence 92% · week" /></div>
            <button onClick={addSlot} className="rounded-full bg-foreground px-4 py-2 text-xs font-medium text-background">+ <L kk="Дәрі қосу" ru="Добавить препарат" en="Add drug" /></button>
          </div>
        </div>


        {/* 24-hour timeline */}
        <div className="relative mb-6">
          <div className="grid text-[9px] text-muted-foreground" style={{ gridTemplateColumns: "repeat(24, minmax(0, 1fr))" }}>
            {Array.from({ length: 24 }).map((_, h) => (
              <div key={h} className="border-l border-border pl-1 pb-1">{h.toString().padStart(2, "0")}</div>
            ))}
          </div>
          <div className="relative mt-1 h-24 rounded-lg border border-border bg-gradient-to-b from-surface to-background overflow-hidden">
            {/* meal windows */}
            {[[7,9],[12,14],[18,20]].map(([a,b], i) => (
              <div key={i} className="absolute top-0 h-full bg-[color:var(--mint)]/5" style={{ left: `${(a/24)*100}%`, width: `${((b-a)/24)*100}%` }} />
            ))}
            {schedule.map((s) => {
              const [hh, mm] = s.time.split(":").map(Number);
              const left = ((hh + mm / 60) / 24) * 100;
              const color = s.taken ? "bg-[color:var(--mint)]" : s.tone === "warning" ? "bg-amber-400" : "bg-foreground";
              return (
                <div key={s.id} className="absolute top-0 h-full group" style={{ left: `${left}%` }}>
                  <div className={`h-full w-[3px] ${color} opacity-90`} />
                  <div className={`absolute top-1 -translate-x-1/2 rounded-full ${color} h-2.5 w-2.5 border-2 border-card`} />
                  <div className="pointer-events-none absolute top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md border border-border bg-card px-2 py-1 text-[10px] text-foreground opacity-0 shadow-lg transition group-hover:opacity-100">
                    {s.time} · {s.drug}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Slot cards */}
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          {schedule.map((s) => (
            <div key={s.id} className={`group flex items-center gap-3 rounded-xl border p-3 transition ${s.taken ? "border-[color:var(--mint)]/30 bg-[color:var(--mint-soft)]" : "border-border bg-surface hover:border-white/15"}`}>
              <button onClick={() => toggleTaken(s.id)} className={`grid h-10 w-10 shrink-0 place-items-center rounded-full border-2 transition ${s.taken ? "border-[color:var(--mint)] bg-[color:var(--mint)] text-background" : "border-border bg-background text-muted-foreground hover:border-[color:var(--mint)]/50"}`}>
                {s.taken ? "✓" : "○"}
              </button>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <div className="font-mono text-sm font-semibold text-foreground tabular-nums">{s.time}</div>
                  <Badge tone={s.tone}>{s.tone === "success" ? "Safe" : s.tone === "warning" ? "Watch" : "Ok"}</Badge>
                </div>
                <div className="truncate text-[13px] font-medium text-foreground">{s.drug}</div>
                <div className="truncate text-[11px] text-muted-foreground">{s.note}</div>
              </div>
              <button onClick={() => removeSlot(s.id)} className="text-muted-foreground opacity-0 transition hover:text-rose-400 group-hover:opacity-100">×</button>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.15fr_1fr]">
        <Card title="Deciphered Prescription" subtitle="Dr. Nurlan T. · Polyclinic №3 · handwriting confidence 96.2%">
          <div className="grid grid-cols-[140px_1fr] gap-4">
            <div className="grid-bg grid h-40 place-items-center rounded-md border border-border bg-surface text-xs text-muted-foreground">
              Rx image
            </div>
            <div className="space-y-2">
              {[
                ["Paracetamol", "500 mg · 1 tab · 3× daily · after meals · 5 days"],
                ["Amoxicillin", "500 mg · 1 cap · 2× daily · with food · 7 days"],
                ["Omeprazole", "20 mg · 1 cap · once daily · morning · 14 days"],
                ["Ferrous bisglycinate", "25 mg · 2× daily · with vit C · 8 weeks"],
                ["Vitamin D3", "4000 IU · 1× daily · with fats"],
                ["Melatonin", "3 mg · at bedtime · as needed"],
              ].map(([n, d]) => (
                <div key={n} className="flex items-center justify-between rounded-md border border-border bg-surface px-3 py-2 text-[12px]">
                  <div>
                    <div className="font-medium text-foreground">{n}</div>
                    <div className="text-[11px] text-muted-foreground">{d}</div>
                  </div>
                  <Badge tone="success">Verified</Badge>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card title="Refill & Cost" subtitle="Nearest pharmacy · Europharma Taldykorgan">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-md border border-border bg-surface p-3">
              <div className="text-[10px] uppercase text-muted-foreground">Refill in</div>
              <div className="mt-1 text-sm font-semibold text-foreground">4 days</div>
            </div>
            <div className="rounded-md border border-border bg-surface p-3">
              <div className="text-[10px] uppercase text-muted-foreground">Est. cost</div>
              <div className="mt-1 text-sm font-semibold text-foreground">₸ 8,420</div>
            </div>
            <div className="rounded-md border border-border bg-surface p-3">
              <div className="text-[10px] uppercase text-muted-foreground">Coverage</div>
              <div className="mt-1 text-sm font-semibold text-emerald-400">72%</div>
            </div>
          </div>
          <button onClick={() => toast.success("📦 Дәріхана тапсырысы жіберілді", { description: "Europharma · ETA 45 min" })} className="mt-4 w-full rounded-md bg-foreground py-2 text-xs font-medium text-background">
            Order refill →
          </button>
        </Card>
      </div>
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Bento, Badge, SectionEyebrow } from "@/components/ui-kit";
import { useL, L } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/lib/use-session";
import { useNotifications } from "@/lib/notifications";

export const Route = createFileRoute("/_authenticated/prescription-rx")({
  head: () => ({
    meta: [
      { title: "Дәрілер — RxClarify · SauBol" },
      { name: "description", content: "Personal medication schedule with smart reminders." },
      { property: "og:title", content: "RxClarify · SauBol" },
      { property: "og:description", content: "Дәрі-дәрмек кестесі мен ескертпелер." },
    ],
  }),
  component: PrescriptionRx,
});

type Slot = { id: string; time: string; name: string; note: string | null; taken: boolean };

function PrescriptionRx() {
  const { profile } = useProfile();
  const { push } = useNotifications();
  const [schedule, setSchedule] = useState<Slot[]>([]);
  const [remindersOn, setRemindersOn] = useState(false);
  const [adding, setAdding] = useState(false);
  const remindedRef = useRef<Set<string>>(new Set());
  const L1 = useL();

  useEffect(() => {
    if (!profile) return;
    supabase.from("medication_schedules").select("*").eq("user_id", profile.id).order("time")
      .then(({ data }) => setSchedule((data as Slot[]) ?? []));
    const ch = supabase.channel(`meds-${profile.id}`).on("postgres_changes",
      { event: "*", schema: "public", table: "medication_schedules", filter: `user_id=eq.${profile.id}` },
      () => supabase.from("medication_schedules").select("*").eq("user_id", profile.id).order("time")
        .then(({ data }) => setSchedule((data as Slot[]) ?? []))
    ).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [profile]);

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
          toast(`⏰ ${s.name}`, { description: `${s.time} · ${s.note ?? ""}`, duration: 8000 });
          void push({ kind: "med_reminder", title: `${s.name}`, body: `${s.time} · ${s.note ?? ""}`, meta: { slot_id: s.id } });
          if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
            new Notification("SauBol · Дәрі-дәрмек", { body: `${s.time} — ${s.name}` });
          }
        }
      });
    };
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, [remindersOn, schedule, push]);

  const enableReminders = async () => {
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
      await Notification.requestPermission();
    }
    setRemindersOn(true);
    remindedRef.current.clear();
    toast.success(L1({kk:"🔔 Ескертпелер қосылды",ru:"🔔 Напоминания включены",en:"🔔 Reminders on"}));
  };

  const toggleTaken = async (id: string, taken: boolean) => {
    setSchedule((s) => s.map((r) => r.id === id ? { ...r, taken: !taken } : r));
    await supabase.from("medication_schedules").update({ taken: !taken }).eq("id", id);
  };

  const removeSlot = async (id: string) => {
    setSchedule((s) => s.filter((r) => r.id !== id));
    await supabase.from("medication_schedules").delete().eq("id", id);
  };

  const addSlot = async (name: string, time: string, note: string) => {
    if (!profile) return;
    const { data, error } = await supabase.from("medication_schedules").insert({
      user_id: profile.id, name, time, note: note || null, taken: false,
    }).select().single();
    if (error) { toast.error(error.message); return; }
    setSchedule((s) => [...s, data as Slot].sort((a,b)=>a.time.localeCompare(b.time)));
    toast.success(`+ ${name} · ${time}`);
  };

  const takenCount = schedule.filter(s => s.taken).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 border-b border-border pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <SectionEyebrow>RxClarify · {L1({kk:"Дәрі кестесі",ru:"Расписание лекарств",en:"Medication schedule"})}</SectionEyebrow>
          <h1 className="mt-2 font-serif text-4xl leading-[1.05] tracking-tight text-foreground md:text-5xl">
            <L kk={<>Дәрі-дәрмек <span className="italic text-[color:var(--mint)]">уақытында</span></>} ru={<>Лекарства <span className="italic text-[color:var(--mint)]">вовремя</span></>} en={<>Meds, <span className="italic text-[color:var(--mint)]">on time</span></>} />
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={remindersOn ? () => { setRemindersOn(false); toast(L1({kk:"🔕 Өшірілді",ru:"🔕 Выключено",en:"🔕 Off"})); } : enableReminders}
            className={`rounded-full px-4 py-2 text-xs font-medium ${remindersOn ? "bg-[color:var(--mint)] text-background" : "border border-border bg-surface text-foreground"}`}>
            {remindersOn ? <>🔔 <L kk="Қосулы" ru="Вкл" en="On" /></> : <>🔕 <L kk="Ескертпелер" ru="Напоминания" en="Reminders" /></>}
          </button>
          <button onClick={()=>setAdding(true)} className="rounded-full bg-foreground px-4 py-2 text-xs font-medium text-background">
            + <L kk="Дәрі қосу" ru="Добавить" en="Add drug" />
          </button>
        </div>
      </div>

      <Bento>
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <div>
            <SectionEyebrow><L kk="Күнделікті кесте" ru="Дневное расписание" en="Daily schedule" /> · Asia/Almaty</SectionEyebrow>
            <div className="mt-1 font-serif text-3xl text-foreground">
              {takenCount} <span className="text-muted-foreground">/ {schedule.length} <L kk="қабылданды" ru="принято" en="taken" /></span>
            </div>
          </div>
        </div>

        <div className="relative mt-5">
          <div className="grid text-[9px] text-muted-foreground" style={{ gridTemplateColumns: "repeat(24, minmax(0, 1fr))" }}>
            {Array.from({ length: 24 }).map((_, h) => (
              <div key={h} className="border-l border-border pl-1 pb-1">{h.toString().padStart(2, "0")}</div>
            ))}
          </div>
          <div className="relative mt-1 h-24 rounded-lg border border-border bg-gradient-to-b from-surface to-background overflow-hidden">
            {[[7,9],[12,14],[18,20]].map(([a,b], i) => (
              <div key={i} className="absolute top-0 h-full bg-[color:var(--mint)]/5" style={{ left: `${(a/24)*100}%`, width: `${((b-a)/24)*100}%` }} />
            ))}
            {schedule.map((s) => {
              const [hh, mm] = s.time.split(":").map(Number);
              const left = ((hh + mm / 60) / 24) * 100;
              const color = s.taken ? "bg-[color:var(--mint)]" : "bg-foreground";
              return (
                <div key={s.id} className="absolute top-0 h-full group" style={{ left: `${left}%` }}>
                  <div className={`h-full w-[3px] ${color} opacity-90`} />
                  <div className={`absolute top-1 -translate-x-1/2 rounded-full ${color} h-2.5 w-2.5 border-2 border-card`} />
                  <div className="pointer-events-none absolute top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md border border-border bg-card px-2 py-1 text-[10px] text-foreground opacity-0 shadow-lg transition group-hover:opacity-100">
                    {s.time} · {s.name}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-2 md:grid-cols-2">
          {schedule.length === 0 && (
            <div className="col-span-full rounded-xl border border-dashed border-border bg-surface p-8 text-center text-[13px] text-muted-foreground">
              <div className="text-3xl">💊</div>
              <div className="mt-2"><L kk="Кесте бос. «Дәрі қосу» батырмасын басыңыз." ru="Расписание пусто. Нажмите «Добавить»." en="Empty schedule. Add a drug to begin." /></div>
            </div>
          )}
          {schedule.map((s) => (
            <div key={s.id} className={`group flex items-center gap-3 rounded-xl border p-3 transition ${s.taken ? "border-[color:var(--mint)]/30 bg-[color:var(--mint-soft)]" : "border-border bg-surface hover:border-white/15"}`}>
              <button onClick={() => toggleTaken(s.id, s.taken)} className={`grid h-10 w-10 shrink-0 place-items-center rounded-full border-2 transition ${s.taken ? "border-[color:var(--mint)] bg-[color:var(--mint)] text-background" : "border-border bg-background text-muted-foreground hover:border-[color:var(--mint)]/50"}`}>
                {s.taken ? "✓" : "○"}
              </button>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <div className="font-mono text-sm font-semibold text-foreground tabular-nums">{s.time}</div>
                  <Badge tone={s.taken ? "success" : "muted"}>{s.taken ? "Taken" : "Due"}</Badge>
                </div>
                <div className="truncate text-[13px] font-medium text-foreground">{s.name}</div>
                {s.note && <div className="truncate text-[11px] text-muted-foreground">{s.note}</div>}
              </div>
              <button onClick={() => removeSlot(s.id)} className="text-muted-foreground opacity-0 transition hover:text-rose-400 group-hover:opacity-100">×</button>
            </div>
          ))}
        </div>
      </Bento>

      {adding && <AddDrugModal onClose={()=>setAdding(false)} onSave={async (n,t,note)=>{ await addSlot(n,t,note); setAdding(false); }} />}
    </div>
  );
}

function AddDrugModal({ onClose, onSave }: { onClose: () => void; onSave: (name: string, time: string, note: string) => Promise<void> }) {
  const L1 = useL();
  const [name, setName] = useState("");
  const [time, setTime] = useState("08:00");
  const [note, setNote] = useState("");
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { toast.error(L1({kk:"Атын енгізіңіз",ru:"Введите название",en:"Enter name"})); return; }
    await onSave(name.trim(), time, note.trim());
  };
  return (
    <div onClick={onClose} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur">
      <form onSubmit={submit} onClick={(e)=>e.stopPropagation()} className="w-full max-w-md rounded-2xl border border-border bg-card p-6">
        <div className="mb-4 font-serif text-2xl text-foreground"><L kk="Дәрі қосу" ru="Добавить препарат" en="Add drug" /></div>
        <div className="space-y-3">
          <input autoFocus value={name} onChange={(e)=>setName(e.target.value)} placeholder={L1({kk:"Атауы (Losartan 50 mg)",ru:"Название (Losartan 50 mg)",en:"Name (Losartan 50 mg)"})} className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground" />
          <div>
            <div className="mb-1 text-[10px] uppercase text-muted-foreground"><L kk="Уақыты" ru="Время" en="Time" /></div>
            <input type="time" value={time} onChange={(e)=>setTime(e.target.value)} className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground" />
          </div>
          <input value={note} onChange={(e)=>setNote(e.target.value)} placeholder={L1({kk:"Ескерту (Тамақтан кейін)",ru:"Заметка (После еды)",en:"Note (After meal)"})} className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground" />
        </div>
        <div className="mt-4 flex gap-2">
          <button type="button" onClick={onClose} className="flex-1 rounded-full border border-border bg-surface py-2 text-xs"><L kk="Болдырмау" ru="Отмена" en="Cancel" /></button>
          <button type="submit" className="flex-1 rounded-full bg-foreground py-2 text-xs text-background"><L kk="Қосу" ru="Добавить" en="Add" /></button>
        </div>
      </form>
    </div>
  );
}

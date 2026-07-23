import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Badge, PageHeader, SectionEyebrow } from "@/components/ui-kit";
import { useL, L } from "@/lib/i18n";
import { useMyProfile } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { scanPrescriptionPhoto } from "@/lib/meds-scan.functions";


export const Route = createFileRoute("/_authenticated/prescription-rx")({
  head: () => ({
    meta: [
      { title: "Дәрілер — RxClarify · SauBol" },
      { name: "description", content: "Prescription OCR, daily schedule, and drug reminders." },
    ],
  }),
  component: PrescriptionRx,
});

type Slot = { id: string; time: string; name: string; note: string | null; taken: boolean };
type Person = { id: string; name: string; emoji: string; role: string; isMe: boolean };

function PrescriptionRx() {
  const L1 = useL();
  const { user, profile } = useMyProfile();
  const [people, setPeople] = useState<Person[]>([]);
  const [activePerson, setActivePerson] = useState<string>("");
  const [slots, setSlots] = useState<Slot[]>([]);
  const [remindersOn, setRemindersOn] = useState(false);
  const remindedRef = useRef<Set<string>>(new Set());

  // Load family (self + accepted children)
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: links } = await supabase
        .from("family_links")
        .select("child_id,parent_id,status")
        .eq("status", "accepted")
        .or(`parent_id.eq.${user.id},child_id.eq.${user.id}`);
      const relIds = new Set<string>();
      (links ?? []).forEach((l: any) => {
        if (l.parent_id === user.id) relIds.add(l.child_id);
        else relIds.add(l.parent_id);
      });
      const otherIds = Array.from(relIds);
      let others: any[] = [];
      if (otherIds.length) {
        const { data } = await supabase
          .from("profiles").select("id,first_name,full_name,username,age")
          .in("id", otherIds);
        others = data ?? [];
      }
      const emojis = ["🧒","👧","🧑","👦","👶"];
      const meP: Person = {
        id: user.id,
        name: profile?.first_name || profile?.username || L1({ kk: "Мен", ru: "Я", en: "Me" }),
        emoji: "👤",
        role: L1({ kk: "Мен", ru: "Я", en: "Me" }),
        isMe: true,
      };
      const parentIds = new Set((links ?? []).filter((l: any) => l.child_id === user.id).map((l: any) => l.parent_id));
      const list: Person[] = [meP, ...others.map((p: any, i: number) => ({
        id: p.id,
        name: p.first_name || p.full_name || p.username || "—",
        emoji: parentIds.has(p.id) ? "👤" : emojis[i % emojis.length],
        role: parentIds.has(p.id)
          ? L1({ kk: "ата-ана", ru: "родитель", en: "parent" })
          : (p.age ? `${p.age} ${L1({ kk: "жас", ru: "лет", en: "y.o." })}` : L1({ kk: "бала", ru: "ребёнок", en: "child" })),
        isMe: false,
      }))];
      setPeople(list);
      if (!activePerson) setActivePerson(user.id);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, profile?.first_name]);

  // Load meds for active person
  const loadSlots = useCallback(async () => {
    if (!activePerson) return;
    const { data, error } = await supabase
      .from("medication_schedules")
      .select("id,name,time,note,taken")
      .eq("user_id", activePerson)
      .order("time", { ascending: true });
    if (error) { toast.error(error.message); return; }
    setSlots((data ?? []) as Slot[]);
  }, [activePerson]);
  useEffect(() => { loadSlots(); }, [loadSlots]);

  // Realtime updates for the currently viewed person
  useEffect(() => {
    if (!activePerson) return;
    const ch = supabase
      .channel(`meds-${activePerson}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "medication_schedules", filter: `user_id=eq.${activePerson}` }, () => loadSlots())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [activePerson, loadSlots]);

  const activePersonMeta = useMemo(() => people.find((p) => p.id === activePerson), [people, activePerson]);
  const isChildOfMine = activePersonMeta && !activePersonMeta.isMe && activePersonMeta.role !== L1({ kk: "ата-ана", ru: "родитель", en: "parent" });
  const canEdit = !!activePersonMeta && (activePersonMeta.isMe || isChildOfMine);

  // Reminders
  useEffect(() => {
    if (!remindersOn) return;
    const tick = () => {
      const now = new Date();
      slots.forEach((s) => {
        if (s.taken || remindedRef.current.has(s.id)) return;
        const [h, m] = s.time.split(":").map(Number);
        const target = new Date(); target.setHours(h, m, 0, 0);
        const diff = (target.getTime() - now.getTime()) / 60000;
        if (diff <= 5 && diff >= -1) {
          remindedRef.current.add(s.id);
          toast(`⏰ ${activePersonMeta?.name} · ${s.name}`, { description: `${s.time} · ${s.note ?? ""}`, duration: 8000 });
          if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
            new Notification(`SauBol · ${activePersonMeta?.name}`, { body: `${s.time} — ${s.name}\n${s.note ?? ""}` });
          }
        }
      });
    };
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, [remindersOn, slots, activePersonMeta]);

  const enableReminders = async () => {
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
      await Notification.requestPermission();
    }
    setRemindersOn(true);
    remindedRef.current.clear();
    toast.success("🔔 " + L1({ kk: "Ескертпелер қосылды", ru: "Напоминания включены", en: "Reminders on" }));
  };

  const toggleTaken = async (s: Slot) => {
    setSlots((all) => all.map((r) => r.id === s.id ? { ...r, taken: !r.taken } : r));
    const { error } = await supabase.from("medication_schedules").update({ taken: !s.taken }).eq("id", s.id);
    if (error) { toast.error(error.message); loadSlots(); }
  };

  const addSlot = async () => {
    if (!canEdit || !activePerson) return;
    const name = window.prompt(L1({ kk: "Дәрі атауы", ru: "Название препарата", en: "Drug name" }));
    if (!name) return;
    const time = window.prompt(L1({ kk: "Уақыты (HH:MM)", ru: "Время (HH:MM)", en: "Time (HH:MM)" }), "08:00");
    if (!time || !/^\d{2}:\d{2}$/.test(time)) { toast.error(L1({ kk: "Уақыт форматы дұрыс емес", ru: "Неверный формат", en: "Invalid time" })); return; }
    const note = window.prompt(L1({ kk: "Ескерту", ru: "Заметка", en: "Note" }), "") ?? "";
    const { error } = await supabase.from("medication_schedules").insert({
      user_id: activePerson, name: name.trim(), time, note: note.trim() || null, taken: false,
    });
    if (error) { toast.error(error.message); return; }
    toast.success(`+ ${name} · ${activePersonMeta?.name}`, { description: time });
    loadSlots();
  };

  const removeSlot = async (s: Slot) => {
    if (!canEdit) return;
    const { error } = await supabase.from("medication_schedules").delete().eq("id", s.id);
    if (error) { toast.error(error.message); return; }
    toast(L1({ kk: "Кестеден алынды", ru: "Удалено", en: "Removed" }));
    loadSlots();
  };

  const takenCount = slots.filter(s => s.taken).length;

  return (
    <div>
      <PageHeader
        eyebrow={<L kk="RxClarify" ru="RxClarify" en="RxClarify" />}
        title={<L kk="Дәрі-дәрмек кестесі" ru="График лекарств" en="Medication schedule" />}
        description={<L kk="Отбасы · ортақ кесте · ақылды ескертпелер" ru="Семья · общий график · умные напоминания" en="Family · shared schedule · smart reminders" />}
        actions={
          <>
            <button onClick={remindersOn ? () => { setRemindersOn(false); toast(L1({ kk: "🔕 Өшірілді", ru: "🔕 Выключено", en: "🔕 Off" })); } : enableReminders} className={`rounded-md px-3 py-1.5 text-xs font-medium ${remindersOn ? "bg-[color:var(--mint)] text-background" : "border border-border bg-surface text-foreground"}`}>
              {remindersOn ? <>🔔 <L kk="Ескертпелер қосулы" ru="Напоминания вкл" en="Reminders ON" /></> : <>🔕 <L kk="Ескертпелерді қосу" ru="Включить напоминания" en="Enable reminders" /></>}
            </button>
          </>
        }
      />

      {/* Person selector */}
      <div className="mb-4 rounded-2xl border border-border bg-card p-3">
        <div className="mb-2 flex items-baseline justify-between px-1">
          <SectionEyebrow><L kk="Кестені кімге көрсету" ru="Чей график" en="Whose schedule" /></SectionEyebrow>
          <span className="text-[10px] text-muted-foreground">{people.length} · {L1({ kk: "профиль", ru: "профилей", en: "profiles" })}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {people.map((p) => {
            const active = p.id === activePerson;
            return (
              <button
                key={p.id}
                onClick={() => setActivePerson(p.id)}
                className={`flex items-center gap-3 rounded-2xl border px-3 py-2 text-left transition ${active ? "border-[color:var(--mint)]/50 bg-[color:var(--mint-soft)]" : "border-border bg-surface hover:border-white/15"}`}
              >
                <div className="grid h-9 w-9 place-items-center rounded-full bg-secondary text-lg">{p.emoji}</div>
                <div>
                  <div className="text-[13px] font-medium text-foreground leading-tight">{p.name}</div>
                  <div className="text-[10px] text-muted-foreground">{p.role}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* BIG timetable */}
      <div className="mb-6 rounded-2xl border border-border bg-card p-6">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
          <div>
            <SectionEyebrow><L kk="Күнделікті кесте" ru="Дневное расписание" en="Daily schedule" /> · <span className="text-foreground">{activePersonMeta?.emoji} {activePersonMeta?.name}</span></SectionEyebrow>
            <div className="font-serif text-3xl text-foreground">
              {takenCount} <span className="text-muted-foreground">/ {slots.length} <L kk="қабылданды" ru="принято" en="taken" /></span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {canEdit ? (
              <button onClick={addSlot} className="rounded-full bg-foreground px-4 py-2 text-xs font-medium text-background">+ <L kk="Дәрі қосу" ru="Добавить" en="Add drug" /></button>
            ) : (
              <span className="text-[11px] text-muted-foreground"><L kk="Тек көру" ru="Только просмотр" en="View only" /></span>
            )}
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
            {[[7,9],[12,14],[18,20]].map(([a,b], i) => (
              <div key={i} className="absolute top-0 h-full bg-[color:var(--mint)]/5" style={{ left: `${(a/24)*100}%`, width: `${((b-a)/24)*100}%` }} />
            ))}
            {slots.map((s) => {
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

        {/* Slot cards */}
        {slots.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-8 text-center text-xs text-muted-foreground">
            <L kk="Кесте бос. Дәрі қосыңыз." ru="Расписание пусто. Добавьте препарат." en="Schedule empty. Add a drug." />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {slots.map((s) => (
              <div key={s.id} className={`group flex items-center gap-3 rounded-xl border p-3 transition ${s.taken ? "border-[color:var(--mint)]/30 bg-[color:var(--mint-soft)]" : "border-border bg-surface hover:border-white/15"}`}>
                <button onClick={() => canEdit && toggleTaken(s)} disabled={!canEdit} className={`grid h-10 w-10 shrink-0 place-items-center rounded-full border-2 transition ${s.taken ? "border-[color:var(--mint)] bg-[color:var(--mint)] text-background" : "border-border bg-background text-muted-foreground hover:border-[color:var(--mint)]/50"} disabled:opacity-40`}>
                  {s.taken ? "✓" : "○"}
                </button>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <div className="font-mono text-sm font-semibold text-foreground tabular-nums">{s.time}</div>
                    <Badge tone={s.taken ? "mint" : "muted"}>{s.taken ? "✓" : "Ok"}</Badge>
                  </div>
                  <div className="truncate text-[13px] font-medium text-foreground">{s.name}</div>
                  {s.note && <div className="truncate text-[11px] text-muted-foreground">{s.note}</div>}
                </div>
                {canEdit && (
                  <button onClick={() => removeSlot(s)} className="text-muted-foreground opacity-0 transition hover:text-rose-400 group-hover:opacity-100">×</button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

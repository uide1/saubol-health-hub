import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import { Bento, Badge, SectionEyebrow, Gauge } from "@/components/ui-kit";
import { supabase } from "@/integrations/supabase/client";
import { useProfile, type ProfileRow } from "@/lib/use-session";
import { useNotifications } from "@/lib/notifications";
import { L, useL } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Профиль · SauBol AI" },
      { name: "description", content: "Медициналық профиль, отбасы шақыру, достар." },
      { property: "og:title", content: "Профиль · SauBol AI" },
      { property: "og:description", content: "Сіздің денсаулық журналыңыз бір орында." },
    ],
  }),
  component: ProfilePage,
});

type FamilyRow = { id: string; child_id: string; status: string; profiles: ProfileRow };

function ProfilePage() {
  const { profile, refetch } = useProfile();
  const { push } = useNotifications();
  const [editing, setEditing] = useState(false);
  const [family, setFamily] = useState<FamilyRow[]>([]);
  const [inviteId, setInviteId] = useState("");
  const [friendUser, setFriendUser] = useState("");
  const [friends, setFriends] = useState<ProfileRow[]>([]);
  const L1 = useL();

  useEffect(() => {
    if (!profile) return;
    supabase.from("family_links").select("id, child_id, status").eq("parent_id", profile.id)
      .then(async ({ data }) => {
        if (!data?.length) { setFamily([]); return; }
        const ids = data.map(r => r.child_id);
        const { data: profs } = await supabase.from("profiles").select("*").in("id", ids);
        const map = new Map((profs ?? []).map(p => [p.id, p as ProfileRow]));
        setFamily(data.map(r => ({ ...r, profiles: map.get(r.child_id)! })).filter(r => r.profiles) as FamilyRow[]);
      });
    supabase.from("friendships").select("friend_id, user_id, status").or(`user_id.eq.${profile.id},friend_id.eq.${profile.id}`).eq("status", "accepted")
      .then(async ({ data }) => {
        if (!data?.length) { setFriends([]); return; }
        const ids = data.map(r => r.user_id === profile.id ? r.friend_id : r.user_id);
        const { data: profs } = await supabase.from("profiles").select("*").in("id", ids);
        setFriends((profs as ProfileRow[]) ?? []);
      });
  }, [profile]);

  const copyId = () => {
    if (!profile) return;
    navigator.clipboard.writeText(profile.public_id);
    toast.success(`${profile.public_id} · copied`);
  };

  const inviteChild = async () => {
    if (!profile || !inviteId.trim()) return;
    const { data: child } = await supabase.from("profiles").select("id, username").eq("public_id", inviteId.trim().toUpperCase()).maybeSingle();
    if (!child) { toast.error(L1({kk:"ID табылмады",ru:"ID не найден",en:"ID not found"})); return; }
    if (child.id === profile.id) { toast.error(L1({kk:"Өзіңізді шақыра алмайсыз",ru:"Нельзя пригласить себя",en:"Can't invite yourself"})); return; }
    const { error } = await supabase.from("family_links").insert({ parent_id: profile.id, child_id: child.id, status: "accepted" });
    if (error) { toast.error(error.message); return; }
    toast.success(`+ ${child.username}`);
    setInviteId("");
    const { data: full } = await supabase.from("profiles").select("*").eq("id", child.id).maybeSingle();
    if (full) setFamily(s => [...s, { id: crypto.randomUUID(), child_id: child.id, status: "accepted", profiles: full as ProfileRow }]);
  };

  const addFriend = async () => {
    if (!profile || !friendUser.trim()) return;
    const { data: f } = await supabase.from("profiles").select("*").eq("username", friendUser.trim()).maybeSingle();
    if (!f) { toast.error(L1({kk:"Username табылмады",ru:"Не найден",en:"Not found"})); return; }
    if (f.id === profile.id) { toast.error("=("); return; }
    const { error } = await supabase.from("friendships").insert({ user_id: profile.id, friend_id: f.id, status: "accepted" });
    if (error) { toast.error(error.message); return; }
    toast.success(`+ @${f.username}`);
    setFriendUser("");
    setFriends(s => [...s, f as ProfileRow]);
    void push({ kind: "friend_request", title: L1({kk:"Жаңа дос",ru:"Новый друг",en:"New friend"}), body: `@${f.username}` });
  };

  if (!profile) return <div className="text-sm text-muted-foreground">Loading...</div>;

  const bmi = profile.height_cm && profile.weight_kg ? (Number(profile.weight_kg) / Math.pow(profile.height_cm/100, 2)) : null;

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
        <Bento className="noise flex items-center gap-6 p-8">
          <Avatar profile={profile} onChanged={refetch} />
          <div className="flex-1">
            <SectionEyebrow>SauBol · {profile.public_id}</SectionEyebrow>
            <h1 className="font-serif text-4xl leading-tight tracking-tight text-foreground">{profile.full_name ?? profile.username}</h1>
            <p className="mt-1 text-sm text-muted-foreground">@{profile.username} · {profile.role}{profile.age ? ` · ${profile.age} ${L1({kk:"жас",ru:"лет",en:"y.o."})}` : ""}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {profile.blood_type && <Badge tone="mint">{profile.blood_type}</Badge>}
              {profile.allergies && <Badge tone="warning">⚠ {profile.allergies}</Badge>}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <button onClick={()=>setEditing(true)} className="rounded-full border border-border bg-surface px-4 py-2 text-xs text-foreground"><L kk="Өңдеу" ru="Изменить" en="Edit" /></button>
            <button onClick={copyId} className="rounded-full bg-foreground px-4 py-2 text-xs text-background"><L kk="ID көшіру" ru="Копировать ID" en="Copy ID" /></button>
          </div>
        </Bento>
        <Bento className="flex items-center gap-4">
          <Gauge value={78} label="Index" size={120} />
          <div className="flex-1 space-y-1.5 text-[11px]">
            <div className="flex justify-between"><span className="text-muted-foreground"><L kk="Бой" ru="Рост" en="Height" /></span><span className="font-mono text-foreground">{profile.height_cm ?? "—"} см</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground"><L kk="Салмақ" ru="Вес" en="Weight" /></span><span className="font-mono text-foreground">{profile.weight_kg ?? "—"} кг</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">BMI</span><span className="font-mono text-foreground">{bmi ? bmi.toFixed(1) : "—"}</span></div>
          </div>
        </Bento>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label={L1({kk:"Жасы",ru:"Возраст",en:"Age"})} value={profile.age ? `${profile.age}` : "—"} unit={L1({kk:"жас",ru:"лет",en:"y.o."})} icon="🎂" />
        <StatCard label={L1({kk:"Бой",ru:"Рост",en:"Height"})} value={profile.height_cm ? `${profile.height_cm}` : "—"} unit="см" icon="📏" />
        <StatCard label={L1({kk:"Салмақ",ru:"Вес",en:"Weight"})} value={profile.weight_kg ? `${profile.weight_kg}` : "—"} unit="кг" icon="⚖" />
        <StatCard label={L1({kk:"Қан тобы",ru:"Группа крови",en:"Blood"})} value={profile.blood_type ?? "—"} unit="" icon="🩸" />
      </div>

      {/* Family + Friends */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Bento>
          <SectionEyebrow><L kk="Отбасы мүшелері" ru="Семья" en="Family" /></SectionEyebrow>
          <div className="mt-3 flex gap-2">
            <input value={inviteId} onChange={(e)=>setInviteId(e.target.value.toUpperCase())} placeholder="SB-XXXXXX" className="flex-1 rounded-lg border border-border bg-surface px-3 py-1.5 text-[12px] text-foreground" />
            <button onClick={inviteChild} className="rounded-full bg-foreground px-4 py-1.5 text-[11px] font-medium text-background"><L kk="Шақыру" ru="Пригласить" en="Invite" /></button>
          </div>
          <div className="mt-3 space-y-2">
            {family.length === 0 && <div className="text-[12px] text-muted-foreground"><L kk="Бос. Баланың Public ID-і арқылы шақырыңыз." ru="Пусто. Пригласите по Public ID." en="Empty. Invite by Public ID." /></div>}
            {family.map(f => (
              <div key={f.id} className="flex items-center gap-3 rounded-lg border border-border bg-surface px-3 py-2">
                <div className="grid h-8 w-8 place-items-center rounded-full bg-secondary text-sm">{f.profiles.username?.[0]?.toUpperCase() ?? "?"}</div>
                <div className="flex-1 text-[12px] text-foreground">@{f.profiles.username}</div>
                <Badge tone="mint">{f.status}</Badge>
              </div>
            ))}
          </div>
        </Bento>
        <Bento>
          <SectionEyebrow><L kk="Достар" ru="Друзья" en="Friends" /></SectionEyebrow>
          <div className="mt-3 flex gap-2">
            <input value={friendUser} onChange={(e)=>setFriendUser(e.target.value)} placeholder="username" className="flex-1 rounded-lg border border-border bg-surface px-3 py-1.5 text-[12px] text-foreground" />
            <button onClick={addFriend} className="rounded-full bg-foreground px-4 py-1.5 text-[11px] font-medium text-background"><L kk="Қосу" ru="Добавить" en="Add" /></button>
          </div>
          <div className="mt-3 space-y-2">
            {friends.length === 0 && <div className="text-[12px] text-muted-foreground"><L kk="Бос. Username бойынша қосыңыз." ru="Пусто. Добавьте по username." en="Empty. Add by username." /></div>}
            {friends.map(f => (
              <div key={f.id} className="flex items-center gap-3 rounded-lg border border-border bg-surface px-3 py-2">
                <div className="grid h-8 w-8 place-items-center rounded-full bg-secondary text-sm">{f.username?.[0]?.toUpperCase()}</div>
                <div className="flex-1 text-[12px] text-foreground">@{f.username}</div>
              </div>
            ))}
          </div>
        </Bento>
      </div>

      {editing && <EditModal profile={profile} onClose={()=>setEditing(false)} onSaved={()=>{ setEditing(false); refetch(); }} />}
    </div>
  );
}

function StatCard({ label, value, unit, icon }: { label: string; value: string; unit: string; icon: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="text-lg">{icon}</div>
      </div>
      <div className="mt-2 flex items-baseline gap-1">
        <div className="font-serif text-3xl text-foreground">{value}</div>
        {unit && <div className="text-[11px] text-muted-foreground">{unit}</div>}
      </div>
    </div>
  );
}

function Avatar({ profile, onChanged }: { profile: ProfileRow; onChanged: () => void }) {
  const ref = useRef<HTMLInputElement | null>(null);
  const [signed, setSigned] = useState<string | null>(null);
  useEffect(() => {
    if (!profile.avatar_url) return;
    supabase.storage.from("avatars").createSignedUrl(profile.avatar_url, 3600).then(({ data }) => setSigned(data?.signedUrl ?? null));
  }, [profile.avatar_url]);
  const upload = async (f: File) => {
    const path = `${profile.id}/avatar-${Date.now()}.${f.name.split(".").pop()}`;
    const { error } = await supabase.storage.from("avatars").upload(path, f, { upsert: true });
    if (error) { toast.error(error.message); return; }
    await supabase.from("profiles").update({ avatar_url: path }).eq("id", profile.id);
    toast.success("Avatar updated"); onChanged();
  };
  return (
    <button onClick={()=>ref.current?.click()} className="grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-[color:var(--mint)] to-emerald-800 font-serif text-3xl text-background">
      {signed ? <img src={signed} alt="" className="h-full w-full object-cover" /> : (profile.username?.[0]?.toUpperCase() ?? "?")}
      <input ref={ref} type="file" accept="image/*" hidden onChange={(e)=>{ const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ""; }} />
    </button>
  );
}

function EditModal({ profile, onClose, onSaved }: { profile: ProfileRow; onClose: () => void; onSaved: () => void }) {
  const L1 = useL();
  const [form, setForm] = useState({
    full_name: profile.full_name ?? "",
    age: profile.age ?? "",
    height_cm: profile.height_cm ?? "",
    weight_kg: profile.weight_kg ?? "",
    blood_type: profile.blood_type ?? "",
    allergies: profile.allergies ?? "",
  });
  const save = async () => {
    const { error } = await supabase.from("profiles").update({
      full_name: form.full_name || null,
      age: form.age === "" ? null : Number(form.age),
      height_cm: form.height_cm === "" ? null : Number(form.height_cm),
      weight_kg: form.weight_kg === "" ? null : Number(form.weight_kg),
      blood_type: form.blood_type || null,
      allergies: form.allergies || null,
    }).eq("id", profile.id);
    if (error) { toast.error(error.message); return; }
    toast.success(L1({kk:"Сақталды",ru:"Сохранено",en:"Saved"}));
    onSaved();
  };
  return (
    <div onClick={onClose} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur">
      <div onClick={e=>e.stopPropagation()} className="w-full max-w-md rounded-2xl border border-border bg-card p-6">
        <div className="mb-4 font-serif text-2xl text-foreground"><L kk="Профильді өңдеу" ru="Редактировать профиль" en="Edit profile" /></div>
        <div className="space-y-3">
          {[
            { k: "full_name", ph: L1({kk:"Толық аты",ru:"Полное имя",en:"Full name"}) },
            { k: "age", ph: L1({kk:"Жасы",ru:"Возраст",en:"Age"}), type: "number" },
            { k: "height_cm", ph: L1({kk:"Бой (см)",ru:"Рост (см)",en:"Height (cm)"}), type: "number" },
            { k: "weight_kg", ph: L1({kk:"Салмақ (кг)",ru:"Вес (кг)",en:"Weight (kg)"}), type: "number" },
            { k: "blood_type", ph: L1({kk:"Қан тобы",ru:"Группа крови",en:"Blood type"}) },
            { k: "allergies", ph: L1({kk:"Аллергия",ru:"Аллергия",en:"Allergies"}) },
          ].map(f => (
            <input key={f.k} type={f.type ?? "text"} placeholder={f.ph} value={(form as Record<string,string|number>)[f.k] as string} onChange={(e)=>setForm(s=>({...s, [f.k]: e.target.value}))} className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground" />
          ))}
        </div>
        <div className="mt-4 flex gap-2">
          <button onClick={onClose} className="flex-1 rounded-full border border-border bg-surface py-2 text-xs"><L kk="Болдырмау" ru="Отмена" en="Cancel" /></button>
          <button onClick={save} className="flex-1 rounded-full bg-foreground py-2 text-xs text-background"><L kk="Сақтау" ru="Сохранить" en="Save" /></button>
        </div>
      </div>
    </div>
  );
}

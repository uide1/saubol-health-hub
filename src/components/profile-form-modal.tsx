import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useMyProfile, type ProfileRow, resolveAvatarUrl } from "@/lib/auth";
import { L, useL } from "@/lib/i18n";

type Mode = "onboarding" | "edit";

export function ProfileFormModal({
  mode,
  open,
  onClose,
  onSaved,
  profile,
}: {
  mode: Mode;
  open: boolean;
  onClose?: () => void;
  onSaved?: () => void;
  profile: ProfileRow | null;
}) {
  const L1 = useL();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [age, setAge] = useState<string>("");
  const [heightCm, setHeightCm] = useState<string>("");
  const [weightKg, setWeightKg] = useState<string>("");
  const [bloodType, setBloodType] = useState("");
  const [allergies, setAllergies] = useState("");
  const [avatarPath, setAvatarPath] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setFirstName(profile.first_name ?? "");
    setLastName(profile.last_name ?? "");
    setUsername(profile.username ?? "");
    setAge(profile.age?.toString() ?? "");
    setHeightCm(profile.height_cm?.toString() ?? "");
    setWeightKg(profile.weight_kg?.toString() ?? "");
    setBloodType(profile.blood_type ?? "");
    setAllergies(profile.allergies ?? "");
    setAvatarPath(profile.avatar_url ?? null);
    resolveAvatarUrl(profile.avatar_url).then(setAvatarPreview);
  }, [profile?.id, open]);

  if (!open) return null;

  const uploadAvatar = async (file: File) => {
    if (!profile) return;
    if (file.size > 3 * 1024 * 1024) {
      toast.error(L1({ kk: "Файл 3МБ-дан аспау керек", ru: "Файл до 3МБ", en: "Max 3MB" }));
      return;
    }
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${profile.id}/avatar-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true, contentType: file.type });
    if (error) { toast.error(error.message); return; }
    setAvatarPath(path);
    const url = await resolveAvatarUrl(path);
    setAvatarPreview(url);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    if (!firstName.trim() || !lastName.trim()) {
      toast.error(L1({ kk: "Аты-жөнін толтырыңыз", ru: "Заполните имя и фамилию", en: "Fill in name" }));
      return;
    }
    if (!age || Number(age) < 1 || Number(age) > 120) {
      toast.error(L1({ kk: "Жасты дұрыс енгізіңіз", ru: "Введите корректный возраст", en: "Enter valid age" }));
      return;
    }
    setBusy(true);
    const uname = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, "_");
    const patch = {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      full_name: `${firstName.trim()} ${lastName.trim()}`.trim(),
      username: uname || profile.username || profile.id,
      age: Number(age),
      height_cm: heightCm ? Number(heightCm) : null,
      weight_kg: weightKg ? Number(weightKg) : null,
      blood_type: bloodType || null,
      allergies: allergies.trim() || null,
      avatar_url: avatarPath,
    };
    const { error } = await supabase.from("profiles").update(patch).eq("id", profile.id);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success(L1({ kk: "Сақталды", ru: "Сохранено", en: "Saved" }));
    onSaved?.();
    onClose?.();
  };

  const initials = ((firstName || profile?.username || "?").slice(0, 1) + (lastName.slice(0, 1))).toUpperCase();

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 p-4 backdrop-blur-md">
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-2xl">
        <div className="aurora opacity-20" />
        <div className="relative">
          <div className="mb-1 text-[10px] uppercase tracking-widest text-muted-foreground">
            {mode === "onboarding"
              ? <L kk="Профильді толтырыңыз" ru="Заполните профиль" en="Complete your profile" />
              : <L kk="Профильді өңдеу" ru="Редактировать профиль" en="Edit profile" />}
          </div>
          <h2 className="font-serif text-2xl text-foreground">
            {mode === "onboarding"
              ? <L kk="Өзіңіз туралы айтыңыз" ru="Расскажите о себе" en="Tell us about you" />
              : <L kk="Профиль" ru="Профиль" en="Profile" />}
          </h2>

          <form onSubmit={save} className="mt-5 space-y-3">
            <div className="flex items-center gap-4">
              <label className="group relative grid h-20 w-20 shrink-0 cursor-pointer place-items-center overflow-hidden rounded-full border border-border bg-surface text-lg font-semibold text-foreground">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span>{initials}</span>
                )}
                <span className="absolute inset-0 grid place-items-center bg-black/50 text-[10px] uppercase tracking-widest text-white opacity-0 transition group-hover:opacity-100">
                  <L kk="Өзгерту" ru="Сменить" en="Change" />
                </span>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadAvatar(e.target.files[0])} />
              </label>
              <div className="min-w-0 flex-1">
                <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="username" className="w-full rounded-full border border-border bg-surface px-4 py-2 text-sm text-foreground outline-none focus:border-white/20" />
                {profile?.public_id && <div className="mt-1 pl-2 text-[10px] text-muted-foreground">ID: <span className="font-mono text-foreground">{profile.public_id}</span></div>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <input required value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder={L1({ kk: "Аты*", ru: "Имя*", en: "First name*" })} className="rounded-2xl border border-border bg-surface px-4 py-2 text-sm text-foreground outline-none focus:border-white/20" />
              <input required value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder={L1({ kk: "Тегі*", ru: "Фамилия*", en: "Last name*" })} className="rounded-2xl border border-border bg-surface px-4 py-2 text-sm text-foreground outline-none focus:border-white/20" />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <input required type="number" min={1} max={120} value={age} onChange={(e) => setAge(e.target.value)} placeholder={L1({ kk: "Жас*", ru: "Возраст*", en: "Age*" })} className="rounded-2xl border border-border bg-surface px-4 py-2 text-sm text-foreground outline-none focus:border-white/20" />
              <input type="number" min={30} max={250} value={heightCm} onChange={(e) => setHeightCm(e.target.value)} placeholder={L1({ kk: "Бой (см)", ru: "Рост (см)", en: "Height (cm)" })} className="rounded-2xl border border-border bg-surface px-4 py-2 text-sm text-foreground outline-none focus:border-white/20" />
              <input type="number" min={2} max={400} step="0.1" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} placeholder={L1({ kk: "Салмақ (кг)", ru: "Вес (кг)", en: "Weight (kg)" })} className="rounded-2xl border border-border bg-surface px-4 py-2 text-sm text-foreground outline-none focus:border-white/20" />
            </div>

            <div className="grid grid-cols-[120px_1fr] gap-2">
              <select value={bloodType} onChange={(e) => setBloodType(e.target.value)} className="rounded-2xl border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-white/20">
                <option value="">{L1({ kk: "Қан тобы", ru: "Группа крови", en: "Blood type" })}</option>
                {["O+","O-","A+","A-","B+","B-","AB+","AB-"].map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
              <input value={allergies} onChange={(e) => setAllergies(e.target.value)} placeholder={L1({ kk: "Аллергия (мысалы, пенициллин)", ru: "Аллергии (например, пенициллин)", en: "Allergies (e.g. penicillin)" })} className="rounded-2xl border border-border bg-surface px-4 py-2 text-sm text-foreground outline-none focus:border-white/20" />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              {mode === "edit" && (
                <button type="button" onClick={onClose} className="rounded-full border border-border bg-surface px-4 py-2 text-xs text-foreground">
                  <L kk="Болдырмау" ru="Отмена" en="Cancel" />
                </button>
              )}
              <button disabled={busy} type="submit" className="rounded-full bg-foreground px-5 py-2 text-xs font-medium text-background disabled:opacity-50">
                {busy ? "..." : mode === "onboarding" ? <L kk="Дайын" ru="Готово" en="Continue" /> : <L kk="Сақтау" ru="Сохранить" en="Save" />}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

/** Gate that shows onboarding modal when profile is incomplete. */
export function OnboardingGate() {
  const { profile, refetch } = useMyProfile();
  const needs = profile && (!profile.first_name || !profile.last_name || !profile.age);
  if (!needs) return null;
  return <ProfileFormModal mode="onboarding" open={true} profile={profile} onSaved={refetch} />;
}

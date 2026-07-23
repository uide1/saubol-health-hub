import { useEffect, useState } from "react";
import { resolveAvatarUrl } from "@/lib/auth";

const cache = new Map<string, string>();

/** Displays a user's avatar image (or fallback initials/emoji) at any size. */
export function UserAvatar({
  url,
  name,
  emoji,
  size = 40,
  className = "",
  ring,
}: {
  url?: string | null;
  name?: string | null;
  emoji?: string;
  size?: number;
  className?: string;
  ring?: string;
}) {
  const [resolved, setResolved] = useState<string | null>(url && cache.get(url) ? cache.get(url)! : null);

  useEffect(() => {
    let cancel = false;
    if (!url) { setResolved(null); return; }
    if (cache.has(url)) { setResolved(cache.get(url)!); return; }
    resolveAvatarUrl(url).then((u) => {
      if (cancel) return;
      if (u) { cache.set(url, u); setResolved(u); }
    });
    return () => { cancel = true; };
  }, [url]);

  const initials = (name ?? "").trim().slice(0, 2).toUpperCase();
  return (
    <div
      style={{ width: size, height: size }}
      className={`grid shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-[color:var(--mint)]/60 to-emerald-900 text-[11px] font-semibold text-background ${ring ?? ""} ${className}`}
    >
      {resolved ? (
        <img src={resolved} alt={name ?? ""} className="h-full w-full object-cover" />
      ) : (
        <span>{emoji ?? (initials || "?")}</span>
      )}
    </div>
  );
}
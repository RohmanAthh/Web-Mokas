"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { MAX_COMPARE, setCompare, toggleCompare, toggleFavorite, useList } from "@/lib/garage";
import { Icon } from "./Icon";

export function FavButton({ id, className = "", withLabel = false }: { id: number; className?: string; withLabel?: boolean }) {
  const favs = useList("fav");
  const on = favs.includes(id);
  return (
    <button
      type="button"
      onClick={() => toggleFavorite(id)}
      aria-pressed={on}
      aria-label={on ? "Hapus dari favorit" : "Simpan ke favorit"}
      title={on ? "Hapus dari favorit" : "Simpan ke favorit"}
      className={`inline-flex items-center justify-center gap-1.5 border-2 border-ink font-bold uppercase transition hover:-translate-y-px ${on ? "bg-nb-pink" : "bg-white"} ${className}`}
    >
      <span aria-hidden="true" className="text-base leading-none">{on ? "♥" : "♡"}</span>
      {withLabel && <span className="text-xs">{on ? "Tersimpan" : "Simpan"}</span>}
    </button>
  );
}

export function CompareButton({ id, className = "", withLabel = false }: { id: number; className?: string; withLabel?: boolean }) {
  const list = useList("compare");
  const [full, setFull] = useState(false);
  const on = list.includes(id);
  return (
    <button
      type="button"
      onClick={() => {
        const ok = toggleCompare(id);
        setFull(!ok);
        if (!ok) setTimeout(() => setFull(false), 2000);
      }}
      aria-pressed={on}
      title={full ? `Maksimal ${MAX_COMPARE} mobil` : on ? "Batal bandingkan" : "Bandingkan"}
      className={`relative inline-flex items-center justify-center gap-1.5 border-2 border-ink font-mono text-xs font-bold uppercase transition hover:-translate-y-px ${on ? "bg-ink text-nb-yellow" : "bg-white"} ${className}`}
    >
      <span aria-hidden="true">{on ? "☑" : "☐"}</span>
      {withLabel ? (full ? `Maks ${MAX_COMPARE}` : on ? "Dibandingkan" : "Bandingkan") : <span className="sr-only">Bandingkan</span>}
      {full && !withLabel && (
        <span className="absolute top-full right-0 z-20 mt-1 bg-ink px-2 py-1 whitespace-nowrap text-nb-yellow">Maks {MAX_COMPARE} mobil</span>
      )}
    </button>
  );
}

/** Tombol ♡ di header dengan jumlah favorit. */
export function HeaderFavLink({ onClick }: { onClick?: () => void }) {
  const favs = useList("fav");
  return (
    <Link href="/favorit" onClick={onClick} aria-label={`Favorit (${favs.length})`} className="relative flex h-10 w-10 items-center justify-center border-2 border-ink bg-white text-lg shadow-[2px_2px_0_0_var(--color-ink)] hover:bg-nb-pink">
      ♡
      {favs.length > 0 && (
        <span className="absolute -top-2 -right-2 flex h-5 min-w-5 items-center justify-center border-2 border-ink bg-nb-pink px-1 font-mono text-[10px] font-bold">{favs.length}</span>
      )}
    </Link>
  );
}

/** Bar mengambang saat ada mobil di daftar bandingkan. */
export function CompareTray() {
  const list = useList("compare");
  const pathname = usePathname();
  if (list.length === 0 || pathname.startsWith("/bandingkan")) return null;
  return (
    <div className="fixed inset-x-0 bottom-16 z-40 flex justify-center px-4 lg:bottom-6">
      <div className="flex items-center gap-2 border-2 border-ink bg-ink p-2 pl-4 text-white shadow-[4px_4px_0_0_var(--color-nb-yellow)]">
        <span className="font-mono text-xs font-bold uppercase">
          ☑ {list.length}/{MAX_COMPARE} dipilih
        </span>
        <button type="button" onClick={() => setCompare([])} className="px-2 font-mono text-xs text-white/60 uppercase hover:text-white">
          Reset
        </button>
        <Link href={`/bandingkan?ids=${list.join(",")}`} className="flex items-center gap-1 border-2 border-white bg-nb-yellow px-3 py-1.5 text-sm font-bold text-ink uppercase">
          Bandingkan <Icon name="chevronRight" className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

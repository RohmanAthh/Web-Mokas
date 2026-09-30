"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { setCompare, useList } from "@/lib/garage";

/**
 * Tanpa ?ids= → ambil dari daftar bandingkan di browser.
 * Dengan ?ids= (mis. link dibagikan) → jadikan daftar bandingkan browser ini.
 */
export function CompareSync({ ids }: { ids: number[] }) {
  const stored = useList("compare");
  const router = useRouter();
  const key = ids.join(",");
  const storedKey = stored.join(",");

  useEffect(() => {
    if (!key && storedKey) router.replace(`/bandingkan?ids=${storedKey}`);
    else if (key && key !== storedKey) setCompare(key.split(",").map(Number));
    // storedKey sengaja tidak memicu ulang saat key sudah ada (hindari loop)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, !!storedKey]);

  return null;
}

export function RemoveFromCompare({ id, ids }: { id: number; ids: number[] }) {
  const router = useRouter();
  return (
    <button
      type="button"
      className="font-mono text-[11px] font-bold uppercase underline underline-offset-2 hover:bg-ink hover:text-nb-yellow"
      onClick={() => {
        const next = ids.filter((x) => x !== id);
        setCompare(next);
        router.replace(next.length ? `/bandingkan?ids=${next.join(",")}` : "/bandingkan");
      }}
    >
      ✕ hapus
    </button>
  );
}

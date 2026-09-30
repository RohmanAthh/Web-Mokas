"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getPublicCars } from "@/app/actions";
import { CarCard } from "@/components/CarCard";
import type { Car } from "@/lib/car-utils";
import { setCompare, useList } from "@/lib/garage";

export function FavoritesList() {
  const ids = useList("fav");
  const [cars, setCars] = useState<Car[] | null>(null);
  const key = ids.join(",");

  useEffect(() => {
    let cancelled = false;
    getPublicCars(key ? key.split(",").map(Number) : []).then((c) => {
      if (!cancelled) setCars(c);
    });
    return () => {
      cancelled = true;
    };
  }, [key]);

  if (cars === null) {
    return <p className="font-mono text-sm">Memuat garasi_</p>;
  }
  // Urutkan sesuai urutan favorit terbaru; sembunyikan yang sudah dihapus dari favorit
  const shown = ids.map((id) => cars.find((c) => c.id === id)).filter((c): c is Car => Boolean(c));

  if (shown.length === 0) {
    return (
      <div className="nb-box flex flex-col items-center bg-nb-pink p-10 text-center">
        <p className="text-6xl">♡</p>
        <p className="mt-4 text-2xl font-bold uppercase">Garasimu masih kosong</p>
        <p className="mt-2 max-w-sm font-mono text-sm">Tekan ♡ di kartu mobil untuk menyimpannya di sini. Tersimpan di browser ini, tanpa perlu daftar akun.</p>
        <Link href="/mobil" className="nb-btn mt-5 bg-white">Cari mobil →</Link>
      </div>
    );
  }

  const available = shown.filter((c) => c.status !== "sold");
  return (
    <>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <span className="nb-sticker bg-white">{shown.length} tersimpan</span>
        {available.length >= 2 && (
          <Link href={`/bandingkan?ids=${available.slice(0, 3).map((c) => c.id).join(",")}`} onClick={() => setCompare(available.slice(0, 3).map((c) => c.id))} className="nb-btn bg-nb-yellow">
            Bandingkan {Math.min(3, available.length)} teratas →
          </Link>
        )}
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {shown.map((c, i) => <CarCard key={c.id} car={c} index={i} />)}
      </div>
    </>
  );
}

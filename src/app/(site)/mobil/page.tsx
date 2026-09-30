import type { Metadata } from "next";
import Link from "next/link";
import { AutoSubmitForm } from "@/components/AutoSubmitForm";
import { CarCard } from "@/components/CarCard";
import { Icon } from "@/components/Icon";
import { brands, listCars, SORT_OPTIONS, type CarFilters } from "@/lib/cars";
import { BODY_TYPES, FUELS, TRANSMISSIONS } from "@/lib/site";

export const metadata: Metadata = { title: "Beli Mobil Bekas" };

type SP = Record<string, string | string[] | undefined>;
const str = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)?.trim() || undefined;
const num = (v: string | string[] | undefined) => {
  const n = Number(str(v));
  return Number.isFinite(n) && n > 0 ? n : undefined;
};

function parseFilters(sp: SP): CarFilters {
  const f: CarFilters = {
    q: str(sp.q),
    brand: str(sp.brand),
    body: str(sp.body),
    transmission: str(sp.transmission),
    fuel: str(sp.fuel),
    minPrice: num(sp.minPrice),
    maxPrice: num(sp.maxPrice),
    minYear: num(sp.minYear),
    maxMileage: num(sp.maxMileage),
    deals: str(sp.deals) === "1" || undefined,
    sort: str(sp.sort),
    page: num(sp.page),
  };
  // Rentang harga ringkas: "min-max"
  const price = str(sp.price);
  if (price) {
    const [min, max] = price.split("-").map(Number);
    f.minPrice ??= min || undefined;
    f.maxPrice ??= max || undefined;
  }
  return f;
}

const PRICE_STEPS = [100, 150, 200, 250, 300, 400, 500, 750].map((n) => n * 1_000_000);
const YEAR_NOW = new Date().getFullYear();
const BODY_COLORS = ["bg-nb-cyan", "bg-nb-pink", "bg-nb-violet", "bg-nb-orange", "bg-nb-lemon"];

export default async function CatalogPage({ searchParams }: PageProps<"/mobil">) {
  const f = parseFilters(await searchParams);
  const { cars, total, page, pages } = listCars(f);
  const brandList = brands();

  const hrefWith = (patch: Partial<Record<keyof CarFilters, string | number | undefined>>) => {
    const params = new URLSearchParams();
    const merged: Record<string, unknown> = { ...f, deals: f.deals ? 1 : undefined, page: undefined, ...patch };
    for (const [k, v] of Object.entries(merged)) if (v !== undefined && v !== "") params.set(k, String(v));
    const qs = params.toString();
    return qs ? `/mobil?${qs}` : "/mobil";
  };

  // Chip filter aktif yang bisa dihapus satu per satu
  const chips: [string, Partial<Record<keyof CarFilters, undefined>>][] = [];
  if (f.deals) chips.push(["↓ Turun harga", { deals: undefined }]);
  if (f.q) chips.push([`"${f.q}"`, { q: undefined }]);
  if (f.brand) chips.push([f.brand, { brand: undefined }]);
  if (f.body) chips.push([f.body, { body: undefined }]);
  if (f.transmission) chips.push([f.transmission, { transmission: undefined }]);
  if (f.fuel) chips.push([f.fuel, { fuel: undefined }]);
  if (f.minPrice) chips.push([`≥ ${f.minPrice / 1_000_000} jt`, { minPrice: undefined }]);
  if (f.maxPrice) chips.push([`≤ ${f.maxPrice / 1_000_000} jt`, { maxPrice: undefined }]);
  if (f.minYear) chips.push([`≥ ${f.minYear}`, { minYear: undefined }]);
  if (f.maxMileage) chips.push([`≤ ${f.maxMileage / 1000}rb km`, { maxMileage: undefined }]);

  return (
    <div className="container-page py-8">
      {/* Judul + pencarian */}
      <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <span className="nb-sticker bg-white">{total} hasil</span>
          <h1 className="mt-3 text-5xl leading-[0.9] font-bold tracking-tighter uppercase sm:text-6xl">
            {f.body ?? "Semua"} <span className="text-ink/30">/</span> {f.brand ?? "mobil"}
          </h1>
        </div>
      </div>

      <AutoSubmitForm action="/mobil" className="mt-6">
        <div className="flex border-2 border-ink bg-white shadow-[4px_4px_0_0_var(--color-ink)]">
          <span className="flex items-center bg-ink px-3 font-mono text-sm font-bold text-nb-yellow">CARI&gt;</span>
          <input name="q" defaultValue={f.q} aria-label="Kata kunci" className="min-w-0 flex-1 bg-transparent px-3 py-3 font-mono text-sm outline-none placeholder:text-ink/40" placeholder="merek / model / tahun_" />
          <button className="border-l-2 border-ink bg-nb-yellow px-5 font-bold uppercase hover:bg-ink hover:text-nb-yellow">Go</button>
        </div>

        {/* Tipe bodi sebagai tombol stiker */}
        <div className="mt-4 flex flex-wrap gap-2">
          {["", ...BODY_TYPES].map((b, i) => (
            <label key={b || "all"} className="cursor-pointer">
              <input type="radio" name="body" value={b} defaultChecked={(f.body ?? "") === b} className="peer sr-only" />
              <span className={`inline-block border-2 border-ink px-3 py-1.5 text-sm font-bold uppercase transition peer-checked:bg-ink peer-checked:text-nb-yellow peer-checked:shadow-none peer-focus-visible:outline-2 hover:-translate-y-0.5 ${i === 0 ? "bg-white" : BODY_COLORS[i - 1]} shadow-[2px_2px_0_0_var(--color-ink)]`}>
                {b || "Semua"}
              </span>
            </label>
          ))}
          <label className="cursor-pointer sm:ml-auto">
            <input type="checkbox" name="deals" value="1" defaultChecked={f.deals} className="peer sr-only" />
            <span className="inline-block -rotate-1 border-2 border-ink bg-nb-pink px-3 py-1.5 text-sm font-bold uppercase shadow-[2px_2px_0_0_var(--color-ink)] transition peer-checked:bg-ink peer-checked:text-nb-pink peer-checked:shadow-none peer-focus-visible:outline-2 hover:-translate-y-0.5">
              ↓ Turun harga
            </span>
          </label>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[260px_1fr]">
          {/* Filter */}
          <aside className="nb-box self-start bg-white lg:sticky lg:top-32">
            <input id="filter-toggle" type="checkbox" className="peer sr-only" />
            <label htmlFor="filter-toggle" className="flex cursor-pointer items-center justify-between border-b-2 border-ink bg-nb-lemon px-4 py-3 font-bold uppercase lg:cursor-default">
              <span>Filter {chips.length > 0 && <span className="ml-1 bg-ink px-1.5 font-mono text-xs text-nb-yellow">{chips.length}</span>}</span>
              <span className="font-mono lg:hidden">[+]</span>
            </label>
            <div className="hidden space-y-4 p-4 peer-checked:block lg:block">
              <div>
                <label className="nb-label" htmlFor="brand">Merek_</label>
                <select id="brand" name="brand" defaultValue={f.brand ?? ""} className="nb-input">
                  <option value="">Semua merek</option>
                  {brandList.map((b) => <option key={b.brand} value={b.brand}>{b.brand} ({b.n})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="nb-label" htmlFor="minPrice">Min_</label>
                  <select id="minPrice" name="minPrice" defaultValue={f.minPrice ?? ""} className="nb-input px-2">
                    <option value="">Rp —</option>
                    {PRICE_STEPS.map((p) => <option key={p} value={p}>{p / 1_000_000} jt</option>)}
                  </select>
                </div>
                <div>
                  <label className="nb-label" htmlFor="maxPrice">Maks_</label>
                  <select id="maxPrice" name="maxPrice" defaultValue={f.maxPrice ?? ""} className="nb-input px-2">
                    <option value="">Rp —</option>
                    {PRICE_STEPS.map((p) => <option key={p} value={p}>{p / 1_000_000} jt</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="nb-label" htmlFor="minYear">Tahun ≥_</label>
                  <select id="minYear" name="minYear" defaultValue={f.minYear ?? ""} className="nb-input px-2">
                    <option value="">—</option>
                    {Array.from({ length: 12 }, (_, i) => YEAR_NOW - i).map((y) => <option key={y}>{y}</option>)}
                  </select>
                </div>
                <div>
                  <label className="nb-label" htmlFor="maxMileage">Km ≤_</label>
                  <select id="maxMileage" name="maxMileage" defaultValue={f.maxMileage ?? ""} className="nb-input px-2">
                    <option value="">—</option>
                    {[20, 50, 80, 100].map((k) => <option key={k} value={k * 1000}>{k}rb</option>)}
                  </select>
                </div>
              </div>
              <fieldset>
                <legend className="nb-label">Transmisi_</legend>
                <div className="grid grid-cols-3 border-2 border-ink">
                  {["", ...TRANSMISSIONS].map((t, i) => (
                    <label key={t || "all"} className={`cursor-pointer ${i > 0 ? "border-l-2 border-ink" : ""}`}>
                      <input type="radio" name="transmission" value={t} defaultChecked={(f.transmission ?? "") === t} className="peer sr-only" />
                      <span className="block py-2 text-center font-mono text-[11px] font-bold uppercase peer-checked:bg-ink peer-checked:text-nb-yellow">{t === "Otomatis" ? "Matic" : t || "All"}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <div>
                <label className="nb-label" htmlFor="fuel">Bahan bakar_</label>
                <select id="fuel" name="fuel" defaultValue={f.fuel ?? ""} className="nb-input">
                  <option value="">Semua</option>
                  {FUELS.map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="nb-label" htmlFor="sort">Urutkan_</label>
                <select id="sort" name="sort" defaultValue={f.sort ?? "terbaru"} className="nb-input">
                  {SORT_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <button className="nb-btn w-full bg-nb-yellow">Terapkan</button>
            </div>
          </aside>

          {/* Hasil */}
          <section>
            {chips.length > 0 && (
              <div className="mb-4 flex flex-wrap items-center gap-2">
                {chips.map(([label, patch]) => (
                  <Link key={label} href={hrefWith(patch)} className="inline-flex items-center gap-1.5 border-2 border-ink bg-ink px-2 py-0.5 font-mono text-xs font-bold text-nb-yellow uppercase hover:bg-nb-pink hover:text-ink">
                    {label} <span aria-label="hapus filter">✕</span>
                  </Link>
                ))}
                <Link href="/mobil" className="font-mono text-xs font-bold uppercase underline underline-offset-2">Reset semua</Link>
              </div>
            )}

            {cars.length === 0 ? (
              <div className="nb-box flex flex-col items-center bg-nb-pink p-10 text-center">
                <p className="text-6xl font-bold">¯\_(ツ)_/¯</p>
                <p className="mt-4 text-2xl font-bold uppercase">Belum ada yang cocok</p>
                <p className="mt-2 max-w-sm font-mono text-sm">Longgarkan filter, atau kabari kami mobil incaranmu — kami bantu carikan.</p>
                <div className="mt-5 flex gap-3">
                  <Link href="/mobil" className="nb-btn bg-white">Reset filter</Link>
                  <Link href="/kontak" className="nb-btn bg-nb-yellow">Carikan saya</Link>
                </div>
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {cars.map((c, i) => <CarCard key={c.id} car={c} index={i} />)}
              </div>
            )}

            {pages > 1 && (
              <nav className="mt-10 flex flex-wrap items-center justify-center gap-2" aria-label="Halaman">
                {page > 1 && <Link href={hrefWith({ page: page - 1 })} className="nb-btn bg-white px-3"><Icon name="chevronLeft" className="h-4 w-4" /></Link>}
                {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
                  <Link key={p} href={hrefWith({ page: p > 1 ? p : undefined })} aria-current={p === page ? "page" : undefined} className={`nb-btn min-w-11 px-3 ${p === page ? "bg-ink text-nb-yellow" : "bg-white"}`}>
                    {p}
                  </Link>
                ))}
                {page < pages && <Link href={hrefWith({ page: page + 1 })} className="nb-btn bg-white px-3"><Icon name="chevronRight" className="h-4 w-4" /></Link>}
              </nav>
            )}
          </section>
        </div>
      </AutoSubmitForm>
    </div>
  );
}

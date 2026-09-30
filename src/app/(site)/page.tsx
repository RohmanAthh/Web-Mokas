import Link from "next/link";
import { CarCard, monthlyFrom } from "@/components/CarCard";
import { Icon } from "@/components/Icon";
import { brands, dealCount, featuredCars, inventoryStats, listCars, mediaUrl } from "@/lib/cars";
import { dealerJsonLd } from "@/lib/seo";
import { rupiahShort } from "@/lib/format";
import { BODY_TYPES, site, waLink } from "@/lib/site";

export const dynamic = "force-dynamic";

const BODY_NOTE: Record<string, string> = { MPV: "7 kursi", SUV: "Tinggi & tangguh", Sedan: "Nyaman", Hatchback: "Lincah", Pickup: "Buat usaha" };

const REASONS = [
  ["01", "Inspeksi 150 titik", "Mesin, kaki-kaki, kelistrikan, riwayat banjir & tabrakan dicek teknisi.", "bg-nb-cyan"],
  ["02", "Surat dijamin", "BPKB, STNK, faktur dicek keabsahannya. Bermasalah? Uang kembali.", "bg-nb-pink"],
  ["03", "Kredit DP ringan", "DP mulai 20%, tenor sampai 5 tahun, proses dibantu sampai beres.", "bg-nb-green"],
  ["04", "Tukar tambah", "Bawa mobil lama, pulang bawa mobil baru. Harga ditaksir di tempat.", "bg-nb-violet"],
] as const;

export default function HomePage() {
  const featured = featuredCars(8);
  const hero = featured[0];
  const brandList = brands();
  const stats = inventoryStats();
  const cheapest = listCars({ sort: "harga-terendah" }).cars[0];
  const deals = dealCount() > 0 ? listCars({ deals: true, sort: "turun-harga", pageSize: 4 }).cars : [];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(dealerJsonLd()).replace(/</g, "\\u003c") }} />
      {/* ---------- Bento hero ---------- */}
      <section className="container-page py-6 sm:py-10">
        <div className="grid gap-4 lg:grid-cols-4 lg:grid-rows-[auto_auto_auto]">
          {/* Headline + search */}
          <div className="nb-box flex flex-col bg-nb-yellow p-6 sm:p-8 lg:col-span-2 lg:row-span-2">
            <span className="nb-sticker self-start bg-white">● {stats.available} unit ready</span>
            <h1 className="mt-5 text-5xl leading-[0.9] font-bold tracking-tighter uppercase sm:text-7xl">
              Mobil bekas<br />tanpa <span className="bg-ink px-2 text-nb-yellow">drama.</span>
            </h1>
            <p className="mt-5 max-w-md font-mono text-sm">{site.description}</p>
            <form action="/mobil" className="mt-auto pt-8">
              <label htmlFor="hero-q" className="nb-label">Cari mobil_</label>
              <div className="flex border-2 border-ink bg-white shadow-[4px_4px_0_0_var(--color-ink)]">
                <span className="flex items-center bg-ink px-3 font-mono text-sm font-bold text-nb-yellow">&gt;</span>
                <input id="hero-q" name="q" className="min-w-0 flex-1 bg-transparent px-3 py-3 font-mono text-sm outline-none placeholder:text-ink/40" placeholder="avanza, brio, fortuner..." />
                <button className="border-l-2 border-ink bg-nb-pink px-5 font-bold uppercase hover:bg-ink hover:text-nb-pink">Go</button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {brandList.slice(0, 6).map((b) => (
                  <Link key={b.brand} href={`/mobil?brand=${b.brand}`} className="border-2 border-ink bg-white px-2 py-0.5 font-mono text-[11px] font-bold uppercase hover:bg-ink hover:text-white">
                    {b.brand} ({b.n})
                  </Link>
                ))}
              </div>
            </form>
          </div>

          {/* Unit sorotan */}
          {hero && (
            <Link href={`/mobil/${hero.slug}`} className="group nb-box nb-box-hover grid overflow-hidden bg-nb-cyan sm:grid-cols-[1.2fr_1fr] lg:col-span-2">
              <div className="relative aspect-[4/3] border-b-2 border-ink bg-white sm:aspect-auto sm:border-r-2 sm:border-b-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {hero.cover && <img src={mediaUrl(hero.cover)!} alt="" className="absolute inset-0 h-full w-full object-cover" />}
                <span className="nb-sticker absolute top-3 left-3 -rotate-3 bg-nb-yellow">Sorotan minggu ini</span>
              </div>
              <div className="flex flex-col p-5">
                <p className="font-mono text-xs font-bold uppercase">{hero.year} · {Math.round(hero.mileage / 1000)}rb km</p>
                <p className="mt-1 text-2xl leading-tight font-bold uppercase">{hero.brand} {hero.model}</p>
                <p className="font-mono text-xs">{hero.variant}</p>
                <p className="mt-auto pt-4 text-3xl font-bold tracking-tight">{rupiahShort(hero.price)}</p>
                <p className="mt-1 text-sm font-bold uppercase group-hover:underline">Lihat unit →</p>
              </div>
            </Link>
          )}

          {/* Cicilan termurah */}
          {cheapest && (
            <div className="nb-box flex flex-col justify-between bg-white p-5">
              <p className="nb-label">Cicilan mulai_</p>
              <p className="text-4xl leading-none font-bold tracking-tighter">{rupiahShort(monthlyFrom(cheapest.price))}</p>
              <p className="mt-2 font-mono text-xs">/bulan · {cheapest.brand} {cheapest.model} · DP 30%</p>
            </div>
          )}

          {/* Jual */}
          <Link href="/jual-mobil" className="group nb-box nb-box-hover flex flex-col justify-between bg-nb-green p-5">
            <Icon name="swap" className="h-8 w-8" />
            <p className="mt-6 text-3xl leading-none font-bold tracking-tight uppercase">Jual<br />mobilmu →</p>
            <p className="mt-2 font-mono text-xs">Penawaran 1×24 jam, inspeksi gratis.</p>
          </Link>

          {/* Tipe bodi */}
          <div className="nb-box bg-white p-5 lg:col-span-3">
            <p className="nb-label">Pilih tipe_</p>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-5">
              {BODY_TYPES.map((b, i) => (
                <Link
                  key={b}
                  href={`/mobil?body=${b}`}
                  className={`border-2 border-ink px-3 py-3 transition hover:-translate-y-0.5 hover:shadow-[3px_3px_0_0_var(--color-ink)] ${["bg-nb-cyan", "bg-nb-pink", "bg-nb-violet", "bg-nb-orange", "bg-nb-lemon"][i]}`}
                >
                  <span className="block text-lg leading-none font-bold uppercase">{b}</span>
                  <span className="mt-1 block font-mono text-[11px]">{BODY_NOTE[b]}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Kuis */}
          <Link href="/cari-cocok" className="group nb-box nb-box-hover flex flex-col justify-between bg-ink p-5 text-white">
            <span className="nb-sticker self-start border-white bg-nb-pink text-ink">Kuis 30 detik</span>
            <p className="mt-6 text-2xl leading-none font-bold uppercase">Bingung<br />pilih? Jawab<br />3 pertanyaan.</p>
            <p className="mt-3 font-mono text-xs text-nb-yellow">Cari yang cocok →</p>
          </Link>
        </div>
      </section>

      {/* ---------- Unit pilihan ---------- */}
      <section className="container-page pb-14">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3 border-b-2 border-ink pb-3">
          <h2 className="text-4xl leading-none font-bold tracking-tighter uppercase sm:text-5xl">Unit pilihan</h2>
          <Link href="/mobil" className="nb-btn bg-white">Semua mobil →</Link>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((c, i) => <CarCard key={c.id} car={c} index={i} />)}
        </div>
      </section>

      {/* ---------- Turun harga ---------- */}
      {deals.length > 0 && (
        <section className="border-y-2 border-ink bg-nb-pink py-14">
          <div className="container-page">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-3 border-b-2 border-ink pb-3">
              <h2 className="text-4xl leading-none font-bold tracking-tighter uppercase sm:text-5xl">↓ Baru turun harga</h2>
              <Link href="/mobil?deals=1" className="nb-btn bg-white">Semua promo →</Link>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {deals.map((c, i) => <CarCard key={c.id} car={c} index={i + 1} />)}
            </div>
          </div>
        </section>
      )}

      {/* ---------- Kenapa kami ---------- */}
      <section className="border-y-2 border-ink bg-white py-14">
        <div className="container-page">
          <h2 className="text-4xl leading-none font-bold tracking-tighter uppercase sm:text-5xl">Kenapa<br className="sm:hidden" /> di sini?</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {REASONS.map(([n, title, text, color]) => (
              <div key={n} className={`nb-box p-5 ${color}`}>
                <p className="font-mono text-4xl font-bold">{n}</p>
                <h3 className="mt-3 text-lg font-bold uppercase">{title}</h3>
                <p className="mt-2 text-sm">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- CTA ---------- */}
      <section className="container-page py-14">
        <div className="nb-box grid items-center gap-6 bg-nb-pink p-6 sm:p-10 lg:grid-cols-[1fr_auto]">
          <div>
            <p className="text-3xl leading-none font-bold tracking-tighter uppercase sm:text-5xl">Belum nemu yang cocok?</p>
            <p className="mt-3 max-w-xl font-mono text-sm">Kasih tahu mobil incaranmu & budget-nya. Kami carikan dari jaringan dealer kami, gratis.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/kontak" className="nb-btn bg-white">Kirim pesan</Link>
            <a href={waLink("Halo, tolong carikan mobil untuk saya.")} target="_blank" rel="noopener" className="nb-btn bg-nb-green"><Icon name="whatsapp" className="h-4 w-4" /> WhatsApp</a>
          </div>
        </div>
      </section>
    </>
  );
}

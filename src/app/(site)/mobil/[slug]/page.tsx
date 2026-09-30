import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CarCard } from "@/components/CarCard";
import { CreditSimulator } from "@/components/CreditSimulator";
import { Gallery } from "@/components/Gallery";
import { CompareButton, FavButton } from "@/components/GarageButtons";
import { InspectionReport } from "@/components/InspectionReport";
import { Icon } from "@/components/Icon";
import { LeadForm } from "@/components/LeadForm";
import { tileColor } from "@/components/nb";
import { carImages, carTitle, getCarBySlug, incrementViews, mediaUrl, priceDrop, similarCars } from "@/lib/cars";
import { rupiah, rupiahShort, tanggal } from "@/lib/format";
import { inspectionScore } from "@/lib/inspection";
import { carJsonLd } from "@/lib/seo";
import { CAR_STATUSES, site, waLink } from "@/lib/site";

export async function generateMetadata({ params }: PageProps<"/mobil/[slug]">): Promise<Metadata> {
  const car = getCarBySlug((await params).slug);
  if (!car) return {};
  return {
    title: `${carTitle(car)} — ${rupiah(car.price)}`,
    description: car.description.slice(0, 160),
    alternates: { canonical: `/mobil/${car.slug}` },
    // Gambar Open Graph dibuat oleh ./opengraph-image.tsx
  };
}

export default async function CarDetailPage({ params }: PageProps<"/mobil/[slug]">) {
  const car = getCarBySlug((await params).slug);
  if (!car) notFound();
  incrementViews(car.id);

  const images = carImages(car.id).map((i) => mediaUrl(i.path)!);
  const title = carTitle(car);
  const similar = similarCars(car);
  const sold = car.status === "sold";
  const drop = priceDrop(car);
  const score = inspectionScore(car.inspection).total;
  // Spesifikasi utama sebagai kotak bento angka besar
  const bigSpecs: [string, string][] = [
    ["Tahun", String(car.year)],
    ["Kilometer", `${Math.round(car.mileage / 1000)}rb`],
    ["Transmisi", car.transmission === "Otomatis" ? "Matic" : "Manual"],
    ["Mesin", car.engine_cc ? `${(car.engine_cc / 1000).toFixed(1)}L` : "EV"],
  ];
  const specs: [string, string][] = [
    ["Bahan bakar", car.fuel],
    ["Tipe bodi", car.body_type],
    ["Kapasitas", `${car.seats} orang`],
    ["Warna", car.color || "-"],
    ["Plat", car.plate || "-"],
    ["Pajak s/d", tanggal(car.tax_until)],
    ["Kilometer", `${car.mileage.toLocaleString("id-ID")} km`],
    ["Mesin", car.engine_cc ? `${car.engine_cc.toLocaleString("id-ID")} cc` : "Motor listrik"],
  ];
  const wa = waLink(`Halo ${site.name}, saya tertarik dengan ${title} (${rupiah(car.price)}). Apakah masih tersedia?\n${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/mobil/${car.slug}`);

  return (
    <div className="container-page py-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(carJsonLd(car, images)).replace(/</g, "\\u003c") }} />
      <nav className="mb-5 flex flex-wrap items-center gap-1 font-mono text-xs font-bold uppercase" aria-label="Breadcrumb">
        <Link href="/mobil" className="hover:underline">Mobil</Link>
        <span>/</span>
        <Link href={`/mobil?brand=${car.brand}`} className="hover:underline">{car.brand}</Link>
        <span>/</span>
        <span className="bg-ink px-1 text-nb-yellow">{car.model}</span>
      </nav>

      {/* ---------- Bento atas ---------- */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 lg:row-span-2">
          <Gallery images={images} alt={title} />
        </div>

        {/* Harga & CTA */}
        <div className="nb-box flex flex-col bg-nb-yellow p-5">
          <div className="flex flex-wrap gap-2">
            <span className={`nb-sticker ${car.status === "available" ? "bg-nb-green" : car.status === "booked" ? "bg-nb-orange" : "bg-ink text-nb-yellow"}`}>
              ● {CAR_STATUSES[car.status].label}
            </span>
            <span className="nb-sticker bg-white"><Icon name="eye" className="h-3 w-3" /> {car.views}×</span>
            <div className="ml-auto flex gap-1.5">
              <FavButton id={car.id} className="h-8 w-8" />
              <CompareButton id={car.id} className="h-8 px-2" withLabel />
            </div>
          </div>
          <h1 className="mt-4 text-3xl leading-[0.95] font-bold tracking-tighter uppercase sm:text-4xl">{car.brand} {car.model}</h1>
          <p className="mt-1 font-mono text-sm">{car.variant} · {car.year}</p>
          {drop > 0 && car.previous_price && (
            <p className="mt-5 flex flex-wrap items-center gap-2 font-mono text-sm">
              <span className="line-through decoration-2">{rupiah(car.previous_price)}</span>
              <span className="nb-sticker -rotate-2 bg-nb-pink">↓ Hemat {rupiahShort(drop)}</span>
            </p>
          )}
          <p className={`${drop > 0 ? "mt-1" : "mt-5"} text-4xl font-bold tracking-tighter`}>{rupiah(car.price)}</p>
          {sold ? (
            <div className="mt-5 border-2 border-ink bg-white p-3 font-mono text-sm">
              Unit ini sudah laku. <Link href={`/mobil?body=${car.body_type}`} className="font-bold underline">Lihat {car.body_type} lain →</Link>
            </div>
          ) : (
            <div className="mt-5 grid gap-2">
              <a href={wa} target="_blank" rel="noopener" className="nb-btn bg-nb-green"><Icon name="whatsapp" className="h-4 w-4" /> Tanya via WhatsApp</a>
              <div className="grid grid-cols-2 gap-2">
                <a href="#test-drive" className="nb-btn bg-white">Test drive</a>
                <a href="#kredit" className="nb-btn bg-white">Cicilan</a>
              </div>
            </div>
          )}
        </div>

        {/* Skor inspeksi + garansi */}
        <a href="#inspeksi" className="nb-box nb-box-hover flex items-center gap-4 bg-ink p-5 text-white">
          {score !== null ? (
            <span className="flex h-16 w-16 shrink-0 flex-col items-center justify-center border-2 border-white bg-nb-green text-ink">
              <span className="text-2xl leading-none font-bold">{score}</span>
              <span className="font-mono text-[9px] font-bold">/100</span>
            </span>
          ) : (
            <Icon name="shield" className="h-8 w-8 shrink-0 text-nb-green" />
          )}
          <div>
            <p className="font-bold uppercase">{score !== null ? "Skor inspeksi" : "Garansi mesin & transmisi 1 tahun"}</p>
            <p className="mt-1 font-mono text-xs text-white/70">
              {score !== null ? "Lihat laporan lengkap & temuan →" : "Bebas banjir & tabrak · surat asli"}
            </p>
          </div>
        </a>
      </div>

      {/* ---------- Spesifikasi angka besar ---------- */}
      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {bigSpecs.map(([label, value], i) => (
          <div key={label} className={`nb-box p-4 ${tileColor(i)}`}>
            <p className="nb-label mb-0">{label}_</p>
            <p className="mt-1 text-3xl leading-none font-bold tracking-tighter uppercase sm:text-4xl">{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {/* Deskripsi + fitur */}
          <section className="nb-box bg-white">
            <h2 className="border-b-2 border-ink bg-nb-lemon px-5 py-3 font-bold uppercase">Catatan unit</h2>
            <div className="p-5">
              <p className="text-[15px] leading-relaxed whitespace-pre-line">{car.description}</p>
              {car.features.length > 0 && (
                <div className="mt-5 flex flex-wrap gap-2">
                  {car.features.map((f) => (
                    <span key={f} className="border-2 border-ink bg-paper px-2 py-1 font-mono text-xs font-bold">✓ {f}</span>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className="nb-box scroll-mt-32 bg-white" id="inspeksi">
            <h2 className="border-b-2 border-ink bg-nb-green px-5 py-3 font-bold uppercase">Laporan inspeksi</h2>
            <div className="p-5">
              <InspectionReport inspection={car.inspection} />
            </div>
          </section>

          {/* Tabel spesifikasi */}
          <section className="nb-box bg-white">
            <h2 className="border-b-2 border-ink bg-nb-cyan px-5 py-3 font-bold uppercase">Spesifikasi lengkap</h2>
            {/* gap 2px di atas latar hitam = garis grid tebal */}
            <dl className="grid gap-[2px] bg-ink sm:grid-cols-2">
              {specs.map(([label, value]) => (
                <div key={label} className="flex justify-between gap-3 bg-white px-5 py-3 font-mono text-sm">
                  <dt className="text-ink/60 uppercase">{label}</dt>
                  <dd className="text-right font-bold">{value}</dd>
                </div>
              ))}
            </dl>
          </section>

          {!sold && (
            <section className="nb-box scroll-mt-32 bg-white" id="kredit">
              <h2 className="border-b-2 border-ink bg-nb-violet px-5 py-3 font-bold uppercase">Hitung cicilan</h2>
              <div className="p-5">
                <CreditSimulator carId={car.id} price={car.price} />
              </div>
            </section>
          )}
        </div>

        {!sold && (
          <aside className="lg:sticky lg:top-32 lg:self-start">
            <section className="nb-box scroll-mt-32 bg-white" id="test-drive">
              <h2 className="border-b-2 border-ink bg-nb-pink px-5 py-3 font-bold uppercase">Test drive gratis</h2>
              <div className="p-5">
                <LeadForm carId={car.id} />
              </div>
            </section>
          </aside>
        )}
      </div>

      {similar.length > 0 && (
        <section className="mt-14">
          <h2 className="mb-6 border-b-2 border-ink pb-3 text-4xl leading-none font-bold tracking-tighter uppercase">Mirip-mirip</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {similar.map((c, i) => <CarCard key={c.id} car={c} index={i + 2} />)}
          </div>
        </section>
      )}

      {/* CTA menempel di bawah (mobile) */}
      {!sold && (
        <>
          <div className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-2 border-t-2 border-ink lg:hidden">
            <a href="#test-drive" className="bg-nb-pink py-4 text-center font-bold uppercase">Test drive</a>
            <a href={wa} target="_blank" rel="noopener" className="flex items-center justify-center gap-2 border-l-2 border-ink bg-nb-green py-4 font-bold uppercase">
              <Icon name="whatsapp" className="h-4 w-4" /> WhatsApp
            </a>
          </div>
          <div className="h-14 lg:hidden" />
        </>
      )}
    </div>
  );
}

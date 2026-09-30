import Link from "next/link";
import { carTitle, isNewArrival, mediaUrl, monthlyFrom, priceDrop, type Car } from "@/lib/car-utils";
import { rupiah, rupiahShort } from "@/lib/format";
import { inspectionScore } from "@/lib/inspection";
import { CAR_STATUSES } from "@/lib/site";
import { CompareButton, FavButton } from "./GarageButtons";
import { Icon } from "./Icon";
import { tileColor } from "./nb";

export { monthlyFrom };

/** Aman dirender di server maupun client (tidak mengakses DB). */
export function CarCard({ car, index = 0 }: { car: Car; index?: number }) {
  const cover = mediaUrl(car.cover);
  const drop = priceDrop(car);
  const fresh = isNewArrival(car);
  const score = inspectionScore(car.inspection).total;

  return (
    <article className="group nb-box nb-box-hover relative flex flex-col">
      <div className="relative aspect-[4/3] overflow-hidden border-b-2 border-ink bg-white">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt={carTitle(car)} loading="lazy" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
        ) : (
          <div className="flex h-full items-center justify-center"><Icon name="car" className="h-14 w-14" /></div>
        )}
        <div className="absolute top-2.5 left-2.5 flex flex-col items-start gap-1.5">
          <span className="nb-sticker bg-white">{car.year}</span>
          {drop > 0 && <span className="nb-sticker -rotate-3 bg-nb-pink">↓ Turun {rupiahShort(drop).replace("Rp ", "")}</span>}
          {fresh && drop === 0 && <span className="nb-sticker -rotate-3 bg-nb-green">Baru masuk</span>}
        </div>
        <div className="absolute top-2.5 right-2.5 z-10 flex gap-1.5">
          <FavButton id={car.id} className="h-9 w-9 shadow-[2px_2px_0_0_var(--color-ink)]" />
          <CompareButton id={car.id} className="h-9 w-9 shadow-[2px_2px_0_0_var(--color-ink)]" />
        </div>
        {car.status !== "available" ? (
          <span className="nb-sticker absolute right-2.5 bottom-2.5 rotate-3 bg-ink text-nb-yellow">{CAR_STATUSES[car.status].label}</span>
        ) : car.featured ? (
          <span className="nb-sticker absolute right-2.5 bottom-2.5 rotate-3 bg-nb-yellow">★ Pilihan</span>
        ) : null}
      </div>

      <div className={`flex flex-1 flex-col p-4 ${tileColor(index)}`}>
        <h3 className="line-clamp-1 text-lg leading-tight font-bold uppercase">
          {/* Link "stretched": seluruh kartu bisa diklik, tombol ♡/☐ tetap terpisah */}
          <Link href={`/mobil/${car.slug}`} className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none">
            {car.brand} {car.model}
          </Link>
        </h3>
        <p className="line-clamp-1 font-mono text-xs">{car.variant || " "}</p>
        <div className="mt-3 flex flex-wrap gap-1.5 font-mono text-[11px] font-bold uppercase">
          <span className="border-2 border-ink bg-white px-1.5">{Math.round(car.mileage / 1000)}rb km</span>
          <span className="border-2 border-ink bg-white px-1.5">{car.transmission === "Otomatis" ? "Matic" : "Manual"}</span>
          <span className="border-2 border-ink bg-white px-1.5">{car.fuel}</span>
          {score !== null && <span className="border-2 border-ink bg-ink px-1.5 text-nb-yellow" title="Skor inspeksi">✓ {score}</span>}
        </div>
        <div className="mt-auto flex items-end justify-between gap-2 pt-4">
          <div>
            {drop > 0 && car.previous_price && (
              <p className="font-mono text-xs line-through decoration-2">{rupiahShort(car.previous_price)}</p>
            )}
            <p className="text-2xl leading-none font-bold tracking-tight">{rupiahShort(car.price)}</p>
            <p className="mt-1 font-mono text-[11px]">± {rupiah(monthlyFrom(car.price))}/bln</p>
          </div>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center border-2 border-ink bg-white transition group-hover:bg-ink group-hover:text-nb-yellow" aria-hidden="true">
            <Icon name="chevronRight" className="h-5 w-5" />
          </span>
        </div>
      </div>
    </article>
  );
}

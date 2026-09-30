import Link from "next/link";
import { BODY_TYPES, site, waLink } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t-2 border-ink bg-ink text-white">
      <div className="container-page grid gap-8 py-12 md:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
        <div>
          <p className="text-4xl leading-none font-bold tracking-tighter text-nb-yellow uppercase sm:text-5xl">{site.name}</p>
          <p className="mt-4 max-w-xs font-mono text-xs leading-relaxed text-white/60">{site.description}</p>
        </div>
        <div>
          <p className="nb-sticker border-white bg-nb-cyan text-ink">Tipe</p>
          <ul className="mt-4 space-y-1.5 text-sm font-bold uppercase">
            {BODY_TYPES.map((b) => (
              <li key={b}><Link href={`/mobil?body=${b}`} className="hover:text-nb-yellow">{b} →</Link></li>
            ))}
          </ul>
        </div>
        <div>
          <p className="nb-sticker border-white bg-nb-pink text-ink">Layanan</p>
          <ul className="mt-4 space-y-1.5 text-sm font-bold uppercase">
            <li><Link href="/mobil" className="hover:text-nb-yellow">Beli mobil →</Link></li>
            <li><Link href="/jual-mobil" className="hover:text-nb-yellow">Jual / tukar tambah →</Link></li>
            <li><Link href="/kontak" className="hover:text-nb-yellow">Test drive →</Link></li>
          </ul>
        </div>
        <div>
          <p className="nb-sticker border-white bg-nb-green text-ink">Mampir</p>
          <ul className="mt-4 space-y-2 font-mono text-xs text-white/80">
            <li>{site.address}</li>
            <li>{site.hours}</li>
            <li>{site.phone}</li>
          </ul>
          <a href={waLink(`Halo ${site.name}`)} target="_blank" rel="noopener" className="nb-btn mt-4 border-white bg-nb-green text-ink shadow-[3px_3px_0_0_#fff] hover:shadow-[5px_5px_0_0_#fff]">
            WhatsApp →
          </a>
        </div>
      </div>
      <div className="border-t-2 border-white/20">
        <div className="container-page flex flex-col gap-2 py-4 font-mono text-[11px] text-white/50 uppercase sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} {site.name} — mobil bekas tanpa drama</p>
          <span className="flex gap-4">
            <Link href="/kebijakan-privasi" className="hover:text-white">Kebijakan privasi</Link>
            <Link href="/syarat-ketentuan" className="hover:text-white">Syarat & ketentuan</Link>
            <Link href="/admin" className="hover:text-white">Login staf</Link>
          </span>
        </div>
      </div>
    </footer>
  );
}

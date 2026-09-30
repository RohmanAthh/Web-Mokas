"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { site, waLink } from "@/lib/site";
import { HeaderFavLink } from "./GarageButtons";
import { Icon } from "./Icon";

const NAV = [
  { href: "/mobil", label: "Beli" },
  { href: "/cari-cocok", label: "Cocokkan" },
  { href: "/jual-mobil", label: "Jual" },
  { href: "/kontak", label: "Kontak" },
];

const TICKER = ["Inspeksi 150 titik", "DP mulai 20%", "Bebas banjir & tabrak", "Garansi mesin 1 tahun", "Tukar tambah OK", "Surat dijamin asli"];

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const active = (href: string) => pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-40">
      {/* Ticker berjalan */}
      <div className="overflow-hidden border-b-2 border-ink bg-ink py-1.5 font-mono text-[11px] font-bold tracking-widest text-nb-yellow uppercase" aria-hidden="true">
        <div className="flex w-max animate-marquee gap-8 whitespace-nowrap motion-reduce:animate-none">
          {[...TICKER, ...TICKER, ...TICKER, ...TICKER].map((t, i) => (
            <span key={i}>✦ {t}</span>
          ))}
        </div>
      </div>

      <div className="border-b-2 border-ink bg-white">
        <div className="container-page flex h-16 items-center gap-3">
          <Link href="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
            <span className="flex h-10 w-10 -rotate-6 items-center justify-center border-2 border-ink bg-nb-yellow shadow-[2px_2px_0_0_var(--color-ink)]">
              <Icon name="car" className="h-5 w-5" />
            </span>
            <span className="text-xl leading-none font-bold tracking-tighter uppercase">{site.name}</span>
          </Link>

          <nav className="ml-auto hidden items-center gap-2 md:flex">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className={`border-2 px-4 py-1.5 text-sm font-bold uppercase transition ${active(n.href) ? "border-ink bg-ink text-nb-yellow" : "border-transparent hover:border-ink"}`}
              >
                {n.label}
              </Link>
            ))}
            <span className="ml-2"><HeaderFavLink /></span>
            <a href={waLink(`Halo ${site.name}, saya ingin bertanya.`)} target="_blank" rel="noopener" className="nb-btn ml-2 bg-nb-green">
              <Icon name="whatsapp" className="h-4 w-4" /> Chat
            </a>
          </nav>

          <span className="ml-auto md:hidden"><HeaderFavLink onClick={() => setOpen(false)} /></span>
          <button
            type="button"
            className="border-2 border-ink bg-nb-yellow p-2 shadow-[2px_2px_0_0_var(--color-ink)] md:hidden"
            onClick={() => setOpen(!open)}
            aria-label="Menu"
            aria-expanded={open}
          >
            <Icon name={open ? "x" : "menu"} className="h-5 w-5" />
          </button>
        </div>
      </div>

      {open && (
        <nav className="border-b-2 border-ink bg-nb-yellow md:hidden">
          <div className="container-page flex flex-col gap-2 py-4">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                onClick={() => setOpen(false)}
                className={`nb-box px-4 py-3 text-lg font-bold uppercase ${active(n.href) ? "bg-ink text-nb-yellow" : ""}`}
              >
                {n.label} →
              </Link>
            ))}
            <a href={waLink(`Halo ${site.name}, saya ingin bertanya.`)} target="_blank" rel="noopener" className="nb-btn mt-1 bg-nb-green">
              <Icon name="whatsapp" className="h-4 w-4" /> Chat WhatsApp
            </a>
          </div>
        </nav>
      )}
    </header>
  );
}

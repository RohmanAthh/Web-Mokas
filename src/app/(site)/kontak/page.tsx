import type { Metadata } from "next";
import { Icon } from "@/components/Icon";
import { LeadForm } from "@/components/LeadForm";
import { site, waLink } from "@/lib/site";

export const metadata: Metadata = { title: "Kontak & Lokasi" };

export default function ContactPage() {
  const items = [
    ["pin", "Alamat", site.address, "bg-nb-cyan"],
    ["clock", "Jam buka", site.hours, "bg-nb-violet"],
    ["phone", "Telepon", site.phone, "bg-nb-orange"],
    ["mail", "Email", site.email, "bg-nb-lemon"],
  ] as const;
  return (
    <div className="container-page py-8 sm:py-12">
      <h1 className="text-5xl leading-[0.9] font-bold tracking-tighter uppercase sm:text-7xl">Mampir<br />atau <span className="bg-nb-pink px-2">chat.</span></h1>

      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        <div className="grid gap-4 sm:grid-cols-2 lg:col-span-2">
          {items.map(([icon, label, value, color]) => (
            <div key={label} className={`nb-box p-5 ${color}`}>
              <Icon name={icon} className="h-6 w-6" />
              <p className="nb-label mt-4 mb-0">{label}_</p>
              <p className="mt-1 font-bold">{value}</p>
            </div>
          ))}
          <a href={waLink(`Halo ${site.name}`)} target="_blank" rel="noopener" className="nb-box nb-box-hover flex items-center justify-between gap-3 bg-nb-green p-5 sm:col-span-2">
            <span className="text-2xl font-bold uppercase sm:text-3xl">Chat WhatsApp sekarang</span>
            <Icon name="whatsapp" className="h-10 w-10 shrink-0" />
          </a>
          <div className="nb-box overflow-hidden bg-white sm:col-span-2">
            <iframe
              title="Peta lokasi showroom"
              src={site.mapsEmbed}
              className="aspect-[16/9] w-full grayscale"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
        <div className="nb-box self-start bg-white">
          <p className="border-b-2 border-ink bg-ink px-5 py-3 font-mono text-sm font-bold text-nb-yellow uppercase">&gt; kirim_pesan</p>
          <div className="p-5">
            <p className="mb-4 font-mono text-xs">Tanya unit, harga, atau minta dicarikan mobil yang belum ada di katalog.</p>
            <LeadForm defaultMode="inquiry" />
          </div>
        </div>
      </div>
    </div>
  );
}

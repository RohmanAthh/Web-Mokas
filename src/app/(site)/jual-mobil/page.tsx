import type { Metadata } from "next";
import { SellForm } from "@/components/SellForm";

export const metadata: Metadata = { title: "Jual Mobil Anda" };

const STEPS = [
  ["Isi data", "Merek, tahun, km. 2 menit.", "bg-nb-cyan"],
  ["Kami telepon", "Penawaran awal 1×24 jam.", "bg-nb-pink"],
  ["Inspeksi", "Gratis, di rumahmu.", "bg-nb-violet"],
  ["Cair", "Transfer hari itu juga.", "bg-nb-green"],
] as const;

export default function SellPage() {
  return (
    <div className="container-page py-8 sm:py-12">
      <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
        <div>
          <span className="nb-sticker -rotate-2 bg-nb-green">Jual / tukar tambah</span>
          <h1 className="mt-4 text-5xl leading-[0.9] font-bold tracking-tighter uppercase sm:text-7xl">
            Jual<br />mobilmu.<br /><span className="bg-nb-yellow px-2">Hari ini.</span>
          </h1>
          <p className="mt-5 max-w-md font-mono text-sm">Tanpa iklan, tanpa ditawar calo, tanpa ribet. Kami beli langsung atau tukar tambah dengan unit di showroom.</p>
          <ol className="mt-8 grid grid-cols-2 gap-3">
            {STEPS.map(([title, text, color], i) => (
              <li key={title} className={`nb-box p-4 ${color}`}>
                <p className="font-mono text-2xl font-bold">0{i + 1}</p>
                <p className="mt-1 font-bold uppercase">{title}</p>
                <p className="font-mono text-xs">{text}</p>
              </li>
            ))}
          </ol>
        </div>
        <div className="nb-box self-start bg-white">
          <p className="border-b-2 border-ink bg-ink px-5 py-3 font-mono text-sm font-bold text-nb-yellow uppercase">&gt; form_penawaran.exe</p>
          <SellForm />
        </div>
      </div>
    </div>
  );
}

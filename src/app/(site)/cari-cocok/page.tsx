import type { Metadata } from "next";
import { Quiz } from "./Quiz";

export const metadata: Metadata = {
  title: "Cari Mobil yang Cocok",
  description: "Jawab 3 pertanyaan singkat, kami rekomendasikan mobil bekas yang pas dengan kebutuhan dan budget Anda.",
};

export default function QuizPage() {
  return (
    <div className="container-page py-8 sm:py-12">
      <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
        <div>
          <span className="nb-sticker -rotate-2 bg-nb-green">30 detik</span>
          <h1 className="mt-4 text-5xl leading-[0.9] font-bold tracking-tighter uppercase sm:text-7xl">
            Bingung<br />pilih? <span className="bg-nb-yellow px-2">Kami bantu.</span>
          </h1>
          <p className="mt-5 max-w-md font-mono text-sm">Jawab 3 pertanyaan. Kami cocokkan dengan semua unit di showroom lalu tunjukkan yang paling pas, lengkap dengan alasannya.</p>
        </div>
        <Quiz />
      </div>
    </div>
  );
}

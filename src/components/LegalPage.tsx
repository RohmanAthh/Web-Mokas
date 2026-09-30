import { tanggal } from "@/lib/format";
import { site } from "@/lib/site";

/** Kerangka halaman legal: judul besar + daftar isi + bagian bernomor. */
export function LegalPage({ title, intro, sections }: { title: string; intro: React.ReactNode; sections: { id: string; title: string; body: React.ReactNode }[] }) {
  return (
    <div className="container-page py-8 sm:py-12">
      <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
        <aside className="lg:sticky lg:top-32 lg:self-start">
          <p className="nb-label">Isi_</p>
          <ol className="nb-box divide-y-2 divide-ink bg-white text-sm">
            {sections.map((s, i) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="flex gap-2 px-3 py-2 hover:bg-nb-lemon">
                  <span className="font-mono text-xs font-bold">{String(i + 1).padStart(2, "0")}</span> {s.title}
                </a>
              </li>
            ))}
          </ol>
        </aside>
        <article className="max-w-3xl">
          <h1 className="text-4xl leading-[0.95] font-bold tracking-tighter uppercase sm:text-6xl">{title}</h1>
          <p className="mt-3 font-mono text-xs">Berlaku sejak {tanggal(site.legal.updatedAt)} · {site.legal.entity} (&quot;{site.name}&quot;)</p>
          <div className="mt-6 text-[15px] leading-relaxed">{intro}</div>
          {sections.map((s, i) => (
            <section key={s.id} id={s.id} className="mt-10 scroll-mt-32">
              <h2 className="flex items-baseline gap-3 border-b-2 border-ink pb-2 text-xl font-bold uppercase">
                <span className="bg-ink px-1.5 font-mono text-sm text-nb-yellow">{String(i + 1).padStart(2, "0")}</span>
                {s.title}
              </h2>
              <div className="mt-4 space-y-3 text-[15px] leading-relaxed [&_li]:ml-5 [&_li]:list-disc [&_ul]:space-y-1.5">{s.body}</div>
            </section>
          ))}
        </article>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Icon } from "./Icon";

export function Gallery({ images, alt }: { images: string[]; alt: string }) {
  const [i, setI] = useState(0);
  if (images.length === 0) {
    return (
      <div className="nb-box flex aspect-[16/10] items-center justify-center bg-white">
        <Icon name="car" className="h-20 w-20" />
      </div>
    );
  }
  const go = (d: number) => setI((i + d + images.length) % images.length);
  return (
    <div className="nb-box overflow-hidden bg-white">
      <div className="relative aspect-[16/10] border-b-2 border-ink">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={images[i]} alt={`${alt} — foto ${i + 1}`} className="h-full w-full object-cover" />
        <span className="nb-sticker absolute top-3 left-3 bg-white">{String(i + 1).padStart(2, "0")} / {String(images.length).padStart(2, "0")}</span>
        {images.length > 1 && (
          <div className="absolute right-3 bottom-3 flex">
            <button type="button" onClick={() => go(-1)} aria-label="Foto sebelumnya" className="border-2 border-ink bg-nb-yellow p-2 hover:bg-ink hover:text-nb-yellow">
              <Icon name="chevronLeft" />
            </button>
            <button type="button" onClick={() => go(1)} aria-label="Foto berikutnya" className="-ml-0.5 border-2 border-ink bg-nb-yellow p-2 hover:bg-ink hover:text-nb-yellow">
              <Icon name="chevronRight" />
            </button>
          </div>
        )}
      </div>
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto bg-paper p-2">
          {images.map((src, idx) => (
            <button
              key={src}
              type="button"
              onClick={() => setI(idx)}
              aria-label={`Foto ${idx + 1}`}
              className={`h-14 w-20 shrink-0 overflow-hidden border-2 border-ink ${idx === i ? "shadow-[3px_3px_0_0_var(--color-ink)] outline-2 outline-offset-1 outline-nb-pink" : "opacity-60 hover:opacity-100"}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

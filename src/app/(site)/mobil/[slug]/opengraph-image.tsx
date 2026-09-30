import fs from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { carTitle, getCarBySlug, priceDrop } from "@/lib/cars";
import { UPLOAD_DIR } from "@/lib/db";
import { rupiah } from "@/lib/format";
import { toPngDataUrl } from "@/lib/images";
import { site } from "@/lib/site";

export const alt = "Foto dan harga mobil";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Kartu gaya neo-brutalist untuk preview link di WhatsApp/Facebook/X.
export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const car = getCarBySlug((await params).slug);
  let photo: string | null = null;
  if (car?.cover) {
    try {
      photo = await toPngDataUrl(await fs.readFile(path.join(UPLOAD_DIR, path.basename(car.cover))), 640, 510);
    } catch {}
  }
  const drop = car ? priceDrop(car) : 0;

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#fde047", padding: 40, fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", width: "100%", height: "100%", border: "6px solid #0a0a0a", background: "#fff", boxShadow: "14px 14px 0 #0a0a0a" }}>
          <div style={{ display: "flex", width: 640, height: "100%", borderRight: "6px solid #0a0a0a", background: "#a5f3fc" }}>
            {photo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photo} width={640} height={538} style={{ objectFit: "cover" }} alt="" />
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", flex: 1, padding: 36 }}>
            <div style={{ display: "flex", fontSize: 24, fontWeight: 700, letterSpacing: 2 }}>{site.name.toUpperCase()}</div>
            <div style={{ display: "flex", marginTop: 28, fontSize: 52, fontWeight: 800, lineHeight: 1, textTransform: "uppercase" }}>
              {car ? `${car.brand} ${car.model}` : "Mobil bekas"}
            </div>
            <div style={{ display: "flex", marginTop: 12, fontSize: 26 }}>{car ? `${car.variant} · ${car.year} · ${Math.round(car.mileage / 1000)}rb km` : ""}</div>
            <div style={{ display: "flex", flex: 1 }} />
            {drop > 0 && (
              <div style={{ display: "flex", alignSelf: "flex-start", background: "#fda4af", border: "4px solid #0a0a0a", padding: "4px 12px", fontSize: 24, fontWeight: 700 }}>
                TURUN {rupiah(drop)}
              </div>
            )}
            <div style={{ display: "flex", marginTop: 12, fontSize: 50, fontWeight: 800, whiteSpace: "nowrap" }}>{car ? rupiah(car.price) : ""}</div>
            <div style={{ display: "flex", marginTop: 8, fontSize: 22, color: "#444" }}>{car ? carTitle(car) : site.tagline}</div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}

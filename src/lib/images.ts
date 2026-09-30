import "server-only";
import sharp from "sharp";
import { site } from "./site";

const MAX_W = 1600;
const MAX_H = 1200;

function escapeXml(s: string) {
  return s.replace(/[<>&"']/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" })[c]!);
}

/** Label watermark gaya stiker (kotak kuning, border hitam) di pojok kanan bawah. */
function watermarkSvg(imgWidth: number) {
  const text = escapeXml(site.watermark.toUpperCase());
  const fontSize = Math.max(14, Math.round(imgWidth / 45));
  const padX = Math.round(fontSize * 0.7);
  const w = Math.round(text.length * fontSize * 0.68) + padX * 2;
  const h = Math.round(fontSize * 1.9);
  const b = Math.max(2, Math.round(fontSize / 8));
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w + b * 2}" height="${h + b * 2}">
      <rect x="${b * 2}" y="${b * 2}" width="${w - b}" height="${h - b}" fill="#0a0a0a"/>
      <rect x="${b / 2}" y="${b / 2}" width="${w - b}" height="${h - b}" fill="#fde047" fill-opacity="0.92" stroke="#0a0a0a" stroke-width="${b}"/>
      <text x="${padX}" y="${h / 2 + fontSize * 0.34}" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="${fontSize}" fill="#0a0a0a" letter-spacing="1">${text}</text>
    </svg>`,
  );
}

/**
 * Normalisasi foto upload: putar sesuai EXIF, perkecil ke maks 1600×1200,
 * tambah watermark, simpan WebP kualitas 80 (biasanya 5–10× lebih kecil dari JPG kamera HP).
 */
export async function processCarPhoto(input: Buffer) {
  const resized = await sharp(input, { failOn: "error" })
    .rotate()
    .resize({ width: MAX_W, height: MAX_H, fit: "inside", withoutEnlargement: true })
    .toBuffer({ resolveWithObject: true });

  let img = sharp(resized.data);
  if (site.watermark) {
    const margin = Math.round(resized.info.width / 60);
    const mark = watermarkSvg(resized.info.width);
    const meta = await sharp(mark).metadata();
    img = img.composite([
      {
        input: mark,
        left: Math.max(0, resized.info.width - (meta.width ?? 0) - margin),
        top: Math.max(0, resized.info.height - (meta.height ?? 0) - margin),
      },
    ]);
  }
  return img.webp({ quality: 80 }).toBuffer();
}

/** Rasterisasi foto (termasuk SVG ilustrasi) ke PNG data URL untuk gambar Open Graph. */
export async function toPngDataUrl(input: Buffer, width: number, height: number) {
  const png = await sharp(input).resize(width, height, { fit: "cover" }).png().toBuffer();
  return `data:image/png;base64,${png.toString("base64")}`;
}

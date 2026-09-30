export function rupiah(n: number) {
  return "Rp " + Math.round(n).toLocaleString("id-ID");
}

/** "Rp 185 jt" / "Rp 1,2 M" untuk kartu katalog. */
export function rupiahShort(n: number) {
  if (n >= 1_000_000_000) return `Rp ${(n / 1_000_000_000).toLocaleString("id-ID", { maximumFractionDigits: 2 })} M`;
  if (n >= 1_000_000) return `Rp ${(n / 1_000_000).toLocaleString("id-ID", { maximumFractionDigits: 1 })} jt`;
  return rupiah(n);
}

export function km(n: number) {
  return n.toLocaleString("id-ID") + " km";
}

export function tanggal(d: string | null | undefined) {
  if (!d) return "-";
  const date = new Date(d.length === 10 ? d + "T00:00:00" : d.replace(" ", "T") + "Z");
  return date.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

export function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Cicilan bulanan dengan bunga flat (umum dipakai leasing mobil bekas). */
export function flatInstallment(price: number, dp: number, tenorMonths: number, flatRatePerYear: number) {
  const principal = Math.max(price - dp, 0);
  const interest = principal * (flatRatePerYear / 100) * (tenorMonths / 12);
  return (principal + interest) / tenorMonths;
}

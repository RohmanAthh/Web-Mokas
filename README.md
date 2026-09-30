# Garasi Prima — Website Showroom Mobil Bekas

Next.js 16 (App Router, Server Actions) + Tailwind 4 + SQLite bawaan Node (`node:sqlite`, tanpa server database).

## Menjalankan

```bash
npm install
npm run seed      # isi data demo (lihat akun demo di bawah)
npm run dev       # http://localhost:3000
```

Production: lihat **[DEPLOY-AAPANEL.md](DEPLOY-AAPANEL.md)** (VPS + aaPanel + PM2 + Nginx + SSL). Ringkasnya: isi `.env.local` (`SESSION_SECRET`, `NEXT_PUBLIC_SITE_URL`), `npm ci && npm run build`, `npm run create-owner -- --email ...`, `pm2 start ecosystem.config.cjs`.
Opsional: `DATABASE_PATH` (default `data/showroom.db`), `NEXT_PUBLIC_SITE_URL` (dipakai di pesan WhatsApp).

### Akun demo
Password semua akun demo: `password` — **wajib diganti saat login pertama**.

| Email | Peran | Akses |
| --- | --- | --- |
| admin@garasiprima.test | Owner | Semua, termasuk modal/margin, laporan, pengguna, backup |
| sales@garasiprima.test | Sales | Leads, jadwal test drive, ubah status unit |
| stok@garasiprima.test | Admin stok | Tambah/edit mobil, foto, inspeksi |

Sebelum online: hapus/nonaktifkan akun demo yang tidak dipakai lewat menu **Pengguna**, dan buat akun untuk tiap staf.

## Fitur

**Situs publik** (gaya neo-brutalist)
- Beranda bento: pencarian, unit sorotan, cicilan termurah, unit **baru turun harga**, kuis
- `/mobil` — katalog + filter (merek, tipe, harga, tahun, km, transmisi, BBM, **turun harga**), chip filter aktif
- `/mobil/[slug]` — galeri, **laporan inspeksi** (skor per kategori + temuan), simulasi kredit, **booking test drive per slot jam**, ♡ favorit, bandingkan, JSON-LD & gambar Open Graph otomatis
- `/favorit` ♡ dan `/bandingkan` (maks. 3 mobil, penanda ★ terbaik) — disimpan di browser, tanpa akun
- `/cari-cocok` — kuis 3 langkah → rekomendasi dengan % kecocokan dan alasannya
- `/jual-mobil`, `/kontak`, `sitemap.xml`, `robots.txt`

**Panel admin** (`/admin`)
- Dashboard: follow-up hari ini/terlambat, test drive hari ini & besok, stok > 60 hari
- Stok mobil: CRUD, harga modal + biaya rekondisi → margin, harga terjual; turunkan harga → label "Turun harga" otomatis 30 hari
- Foto: diperkecil ke 1600px, dikompres WebP, diberi watermark (`site.watermark`)
- Laporan inspeksi per unit (31 poin, status Baik / Catatan kecil / Perlu perhatian)
- Leads: papan pipeline Baru → Dihubungi → Negosiasi → Deal/Batal, catatan, jadwal follow-up, balas WA
- Jadwal test drive: kalender mingguan
- Laporan: penjualan & omzet 6 bulan, margin kotor, umur stok + saran, konversi leads

**Keamanan & operasional**
- Peran Owner / Sales / Admin stok (matriks di `src/lib/roles.ts`); menu **Pengguna** untuk tambah akun (password sementara ditampilkan sekali), ganti peran, reset password, nonaktifkan
- Password min. 10 karakter + huruf & angka; ganti password / nonaktif / ganti peran langsung mencabut sesi lama; login dibatasi 5 percobaan / 10 menit
- **Backup** otomatis setiap hari (default 02.00, simpan 14 snapshot) + tombol "Backup sekarang" & unduh di menu Backup; manual: `npm run backup`
- **Privasi (UU PDP)**: halaman `/kebijakan-privasi` & `/syarat-ketentuan`, centang persetujuan wajib di semua form (dicatat `consent_at`), data pribadi lead dianonimkan otomatis setelah 24 bulan

**Notifikasi lead baru** — isi salah satu di `.env.local` (lihat `.env.example`): Telegram, email SMTP, WhatsApp (Fonnte), atau webhook. Tanpa konfigurasi hanya dicatat di log server.

## Struktur

| Lokasi | Isi |
| --- | --- |
| `src/lib/site.ts` | Nama showroom, nomor WA, alamat, jam buka — **ubah di sini** |
| `src/lib/credit.ts` | Asumsi simulasi kredit (bunga, DP minimum, tenor) |
| `src/lib/slots.ts` | Jam slot test drive per hari (WIB) |
| `src/lib/inspection.ts` | Checklist & skor inspeksi |
| `src/lib/recommend.ts` | Bobot skor kuis rekomendasi |
| `src/lib/notify.ts` | Channel notifikasi lead |
| `src/lib/schema.sql`, `migrate.mjs` | Skema database + migrasi kolom untuk DB lama |
| `src/lib/cars.ts`, `leads.ts` | Query data |
| `src/lib/auth.ts`, `roles.ts` | Login (scrypt + cookie HMAC berversi) & hak akses per peran |
| `src/lib/backup-core.mjs` | Backup (VACUUM INTO + salin foto) & anonimisasi lead lama |
| `src/app/(site)/kebijakan-privasi` | Teks kebijakan privasi — **template, sesuaikan & minta tinjauan hukum** |
| `src/app/actions.ts` | Server Action form publik (validasi zod) |
| `src/app/admin/actions.ts`, `account-actions.ts` | Server Action admin (semua memanggil `requireUser(izin)`) |
| `src/app/media/[file]` | Menyajikan foto dari `data/uploads` |
| `scripts/seed.mjs` | Data demo (foto ilustrasi SVG) |

Data & foto upload tersimpan di folder `data/` (tidak masuk git) — backup folder ini di server production.
Hosting perlu server Node yang persisten (VPS, Railway, dsb.), bukan serverless, karena memakai file SQLite & upload lokal.

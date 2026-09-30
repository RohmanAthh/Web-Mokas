# Deploy ke VPS dengan aaPanel

Panduan ini untuk VPS Linux (Ubuntu 22.04/24.04 disarankan) yang sudah terpasang **aaPanel**.
Nama menu aaPanel bisa sedikit berbeda antar versi — cari yang paling mirip.

Arsitektur akhirnya:

```
Pengunjung ──HTTPS──▶ Nginx (aaPanel, SSL Let's Encrypt) ──▶ 127.0.0.1:3000 Next.js (PM2, 1 proses)
                                                              └─ data/ (SQLite + foto)  ──▶ backup harian
```

---

## 0. Persiapan

| Kebutuhan | Keterangan |
| --- | --- |
| VPS | Min. 1 vCPU, **2 GB RAM** (1 GB bisa, tapi tambahkan swap 2 GB untuk proses build) |
| Domain | Record **A** `@` dan `www` mengarah ke IP VPS |
| Port terbuka | 22 (SSH), 80, 443, port panel aaPanel. **Jangan buka port 3000.** |

Sebelum upload, ubah dulu identitas showroom di `src/lib/site.ts` (nama, nomor WhatsApp, alamat, jam buka, `legal`) —
nilai ini ikut di-build.

## 1. Pasang software di aaPanel

1. **App Store** → pasang **Nginx** (versi stabil terbaru).
2. **App Store** → pasang **Node.js version manager** → install **Node v24** (minimal v22.13 — app memakai `node:sqlite`).
3. Buka **Terminal** aaPanel (atau SSH) dan cek:
   ```bash
   node -v    # harus v22.13+ / v24.x
   npm -v
   npm i -g pm2
   ```
   > Bila `node` tidak ditemukan, set versi default di Node.js version manager ("Set as command line version") lalu buka ulang terminal.

## 2. Upload kode

**Opsi A — lewat Git (disarankan, update jadi 1 perintah)**
Simpan proyek di repository **private** (GitHub/GitLab), lalu di server:
```bash
cd /www/wwwroot
git clone https://github.com/AKUN/REPO.git garasiprima
cd garasiprima
```

**Opsi B — upload ZIP**
Zip folder proyek **tanpa** `node_modules`, `.next`, dan `data`, upload lewat **Files** ke `/www/wwwroot/garasiprima`, lalu **Extract**.

## 3. Buat file konfigurasi `.env.local`

```bash
cd /www/wwwroot/garasiprima
cp .env.example .env.local
openssl rand -hex 32        # salin hasilnya untuk SESSION_SECRET
nano .env.local
```

Isi minimal:
```ini
SESSION_SECRET=hasil_openssl_di_atas
NEXT_PUBLIC_SITE_URL=https://domainanda.com
BACKUP_DIR=/www/backup/garasiprima
```
Opsional: notifikasi lead (Telegram/email/WhatsApp/webhook), `BACKUP_HOUR`, `LEAD_RETENTION_MONTHS` — lihat komentar di `.env.example`.

```bash
chmod 600 .env.local
mkdir -p /www/backup/garasiprima
```

## 4. Install & build

```bash
npm ci
npm run build
```
> `NEXT_PUBLIC_SITE_URL` harus sudah benar **sebelum** build. Kalau diubah, build ulang.
> Jangan menyalin `node_modules` dari Windows — `sharp` (pemroses foto) butuh versi Linux, `npm ci` di server yang mengurusnya.

## 5. Buat akun Owner

Server production **tidak memakai data demo**. Buat akun pemilik:
```bash
npm run create-owner -- --email pemilik@domainanda.com --name "Nama Pemilik"
```
Catat password sementara yang muncul — Anda wajib menggantinya saat login pertama.

> ⚠️ Jangan jalankan `npm run seed` di server: perintah itu menghapus semua data (sudah diberi pengaman, tapi tetap hindari).

## 6. Jalankan dengan PM2

```bash
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup          # jalankan perintah yang ditampilkannya, agar app hidup lagi setelah server reboot
curl http://127.0.0.1:3000/api/health     # → {"ok":true,...}
```

Konfigurasi di `ecosystem.config.cjs` sudah mengatur: 1 proses (jangan ubah ke cluster — SQLite & penjadwal backup harus tunggal),
hanya mendengarkan `127.0.0.1:3000`, zona waktu WIB, log di folder `logs/`.

> Alternatif: menu **Website → Node project** di aaPanel juga bisa dipakai (folder proyek, perintah `npm run start`, port 3000).
> Pastikan hanya **1 instance**. Pilih salah satu — jangan jalankan PM2 manual dan Node project bersamaan.

## 7. Domain, SSL, dan reverse proxy

1. **Website → Add site**: isi domain (`domainanda.com` + `www.domainanda.com`), Database: *tidak*, PHP: *Static / tanpa PHP*.
2. Buka pengaturan situs → **SSL** → **Let's Encrypt** → centang kedua domain → Apply. Aktifkan **Force HTTPS**.
   > SSL wajib: cookie login admin hanya dikirim lewat HTTPS, jadi tanpa SSL login akan gagal.
3. Pengaturan situs → **Reverse proxy** → Add: target `http://127.0.0.1:3000`, *Send domain* `$host`.
4. Pengaturan situs → **Config file** → tambahkan isi `deploy/nginx-aapanel.conf` (terutama `client_max_body_size 50m;` —
   tanpa ini upload foto gagal dengan error 413). Simpan; aaPanel akan me-reload Nginx.

## 8. Cek setelah online

- [ ] `https://domainanda.com` terbuka, gembok SSL hijau
- [ ] `https://domainanda.com/api/health` → `{"ok":true}`
- [ ] Login `/admin`, ganti password, buat akun untuk staf (menu **Pengguna**)
- [ ] Tambah 1 mobil + upload foto dari HP → foto tampil dengan watermark
- [ ] Kirim form test drive dari HP → masuk ke **Leads** (dan notifikasi, bila dikonfigurasi)
- [ ] Menu **Backup** → *Backup sekarang* → file muncul di `/www/backup/garasiprima`
- [ ] `https://domainanda.com/sitemap.xml` → daftarkan ke Google Search Console

## 9. Backup ke luar server (sangat disarankan)

Backup harian otomatis tersimpan di `BACKUP_DIR` **di VPS yang sama** — belum aman bila VPS rusak/terhapus. Salin ke luar:

- **Cara aaPanel**: **Cron** → tambah tugas *Backup directory* untuk `/www/backup/garasiprima` ke penyimpanan cloud
  (pasang plugin penyimpanan dari App Store, mis. Google Drive / S3 / FTP), jalankan harian **setelah** jam backup app (mis. 03.00).
- **Cara rclone**: `curl https://rclone.org/install.sh | sudo bash`, `rclone config` (Google Drive/S3), lalu **Cron → Shell script** harian:
  ```bash
  rclone sync /www/backup/garasiprima remote:garasiprima-backup
  ```

File backup berisi data pribadi pembeli — simpan di akun cloud yang aman (aktifkan 2FA).

## 10. Update aplikasi

Setelah ada perubahan kode (Opsi A — Git):
```bash
cd /www/wwwroot/garasiprima
bash deploy/update.sh
```
Skrip ini: backup → `git pull` → `npm ci` → build → reload PM2 → cek health.

## 11. Keamanan server

- Ganti port & URL panel aaPanel dari default, pakai password panel yang kuat, aktifkan 2FA panel bila tersedia.
- **Security / Firewall**: hanya izinkan 22, 80, 443, dan port panel. Port 3000 **tertutup**.
- Login SSH pakai key, nonaktifkan login password root bila memungkinkan.
- Rutin update sistem (`apt update && apt upgrade`) dan aaPanel.

## 12. Masalah umum

| Gejala | Penyebab & solusi |
| --- | --- |
| **502 Bad Gateway** | App mati → `pm2 status`, `pm2 logs garasi-prima --lines 100` |
| Login admin selalu kembali ke halaman login | Situs belum HTTPS, atau `SESSION_SECRET` berubah → aktifkan SSL, jangan ganti secret |
| Upload foto gagal / error **413** | `client_max_body_size 50m;` belum ditambahkan ke config Nginx |
| `No such built-in module: node:sqlite` | Node terlalu lama → pakai v22.13+ / v24 |
| Error `sharp` saat upload | `node_modules` tersalin dari Windows → hapus lalu `npm ci` di server |
| Jam backup / tanggal meleset | Pastikan `TZ: "Asia/Jakarta"` di `ecosystem.config.cjs`, lalu `pm2 reload ecosystem.config.cjs --update-env` |
| Owner lupa password / terkunci | `npm run create-owner -- --email emailowner@domain.com` → password direset |

### Restore dari backup
```bash
pm2 stop garasi-prima
cp /www/backup/garasiprima/showroom-YYYYMMDD-HHMMSS.db data/showroom.db
rm -f data/showroom.db-wal data/showroom.db-shm
cp -rn /www/backup/garasiprima/uploads/. data/uploads/
pm2 start garasi-prima
```

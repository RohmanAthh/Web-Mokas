// Konfigurasi PM2 (dipakai aaPanel / `pm2 start ecosystem.config.cjs`).
// PENTING: tetap 1 instance, mode fork. Database SQLite, penjadwal backup harian,
// dan pembatas percobaan login berjalan di dalam proses — cluster akan menggandakannya.
module.exports = {
  apps: [
    {
      name: "garasi-prima",
      cwd: __dirname,
      script: "node_modules/next/dist/bin/next",
      args: "start -H 127.0.0.1 -p 3000", // hanya bisa diakses lewat Nginx
      exec_mode: "fork",
      instances: 1,
      autorestart: true,
      max_memory_restart: "700M",
      env: {
        NODE_ENV: "production",
        TZ: "Asia/Jakarta", // jam backup & tanggal mengikuti WIB
      },
      out_file: "./logs/out.log",
      error_file: "./logs/error.log",
      time: true,
    },
  ],
};

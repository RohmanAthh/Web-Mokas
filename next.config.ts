import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  // Aktif hanya bila situs diakses lewat HTTPS
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  experimental: {
    // Upload foto mobil lewat Server Action (maks 8 foto × ~5 MB).
    serverActions: { bodySizeLimit: "45mb" },
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      { source: "/admin/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] },
    ];
  },
  turbopack: {
    ignoreIssue: [
      // Folder backup sengaja dinamis (env BACKUP_DIR). Aplikasi dijalankan dengan `next start`
      // dari folder proyek, jadi tracing file (hanya relevan untuk output standalone) tidak berpengaruh.
      { path: "**/src/lib/backup-core.mjs", title: /Dynamic filesystem access/ },
    ],
  },
};

export default nextConfig;

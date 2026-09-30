// Peran pengguna panel admin & hak aksesnya. Aman dipakai di server & client.

export const ROLES = {
  owner: { label: "Owner", description: "Akses penuh: modal & margin, laporan, pengguna, backup." },
  sales: { label: "Sales", description: "Leads, jadwal test drive, ubah status unit. Tidak melihat modal/margin." },
  stok: { label: "Admin stok", description: "Tambah/edit mobil, foto, laporan inspeksi. Tidak melihat modal/margin & leads." },
} as const;
export type Role = keyof typeof ROLES;

const MATRIX = {
  "cars.view": ["owner", "sales", "stok"],
  "cars.edit": ["owner", "stok"],
  "cars.status": ["owner", "sales", "stok"],
  "cars.cost": ["owner"], // harga modal, rekondisi, margin, harga terjual
  leads: ["owner", "sales"],
  reports: ["owner"],
  users: ["owner"],
  backup: ["owner"],
} as const satisfies Record<string, readonly Role[]>;
export type Permission = keyof typeof MATRIX;

export function can(role: string | undefined, perm: Permission) {
  return !!role && (MATRIX[perm] as readonly string[]).includes(role);
}

export const isRole = (r: unknown): r is Role => typeof r === "string" && r in ROLES;

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/Icon";
import { can, type Permission, type Role } from "@/lib/roles";
import { logout } from "../actions";

const ITEMS: { href: string; label: string; icon: string; perm?: Permission; exact?: boolean; badge?: boolean }[] = [
  { href: "/admin", label: "Dashboard", icon: "home", exact: true },
  { href: "/admin/mobil", label: "Stok mobil", icon: "car", perm: "cars.view" },
  { href: "/admin/leads", label: "Leads & pesan", icon: "inbox", perm: "leads", badge: true },
  { href: "/admin/jadwal", label: "Jadwal test drive", icon: "calendar", perm: "leads" },
  { href: "/admin/laporan", label: "Laporan", icon: "wallet", perm: "reports" },
  { href: "/admin/pengguna", label: "Pengguna", icon: "seat", perm: "users" },
  { href: "/admin/backup", label: "Backup", icon: "shield", perm: "backup" },
  { href: "/admin/akun", label: "Akun saya", icon: "gear" },
];

export function AdminNav({ newLeads, role }: { newLeads: number; role: Role }) {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:overflow-visible">
      {ITEMS.filter((i) => !i.perm || can(role, i.perm)).map((i) => {
        const active = i.exact ? pathname === i.href : pathname.startsWith(i.href);
        return (
          <Link
            key={i.href}
            href={i.href}
            className={`flex shrink-0 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium ${active ? "bg-slate-800 text-white" : "hover:bg-slate-800/60 hover:text-white"}`}
          >
            <Icon name={i.icon} className="h-4 w-4" />
            {i.label}
            {i.badge && newLeads > 0 && <span className="badge ml-auto bg-accent-400 text-slate-900">{newLeads}</span>}
          </Link>
        );
      })}
      <form action={logout} className="lg:hidden">
        <button className="flex shrink-0 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-slate-800/60">
          <Icon name="logout" className="h-4 w-4" /> Keluar
        </button>
      </form>
    </nav>
  );
}

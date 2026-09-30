import Link from "next/link";
import { Icon } from "@/components/Icon";
import { requireUser } from "@/lib/auth";
import { leadCounts } from "@/lib/leads";
import { can, ROLES } from "@/lib/roles";
import { site } from "@/lib/site";
import { logout } from "../actions";
import { AdminNav } from "./AdminNav";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const user = await requireUser(undefined, { allowPasswordChange: true });
  const newLeads = can(user.role, "leads") ? leadCounts().new : 0;

  return (
    <div className="flex min-h-full flex-1 flex-col bg-slate-100 lg:flex-row">
      <aside className="flex shrink-0 flex-col bg-slate-900 text-slate-300 lg:w-60">
        <div className="flex items-center justify-between gap-2 px-5 py-4">
          <Link href="/admin" className="flex items-center gap-2 font-extrabold text-white">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600"><Icon name="car" className="h-4 w-4" /></span>
            {site.name}
          </Link>
        </div>
        <AdminNav newLeads={newLeads} role={user.role} />
        <div className="mt-auto hidden border-t border-slate-800 p-4 text-sm lg:block">
          <p className="font-medium text-white">{user.name}</p>
          <p className="truncate text-xs text-slate-500">{user.email} · {ROLES[user.role].label}</p>
          <div className="mt-3 flex gap-2">
            <Link href="/" target="_blank" className="btn-sm btn border border-slate-700 text-slate-300 hover:bg-slate-800">
              <Icon name="external" className="h-3.5 w-3.5" /> Situs
            </Link>
            <form action={logout}>
              <button className="btn-sm btn border border-slate-700 text-slate-300 hover:bg-slate-800">
                <Icon name="logout" className="h-3.5 w-3.5" /> Keluar
              </button>
            </form>
          </div>
        </div>
      </aside>
      <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/roles";
import { CarForm } from "../CarForm";

export const metadata: Metadata = { title: "Tambah Mobil" };

export default async function NewCarPage() {
  const user = await requireUser("cars.edit");
  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <Link href="/admin/mobil" className="text-sm text-slate-500 hover:text-slate-900">← Stok mobil</Link>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">Tambah mobil</h1>
      </div>
      <CarForm canCost={can(user.role, "cars.cost")} />
    </div>
  );
}

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Icon } from "@/components/Icon";
import { currentUser } from "@/lib/auth";
import { site } from "@/lib/site";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Login Admin" };

export default async function LoginPage() {
  if (await currentUser()) redirect("/admin");
  return (
    <div className="flex flex-1 items-center justify-center bg-slate-100 p-4">
      <div className="card w-full max-w-sm p-8">
        <div className="mb-6 flex items-center gap-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-600 text-white"><Icon name="car" /></span>
          <div>
            <p className="font-extrabold">{site.name}</p>
            <p className="text-xs text-slate-500">Panel admin showroom</p>
          </div>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}

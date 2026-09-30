import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-page flex flex-col items-center py-20 text-center">
      <p className="nb-box -rotate-3 bg-nb-pink px-6 py-2 font-mono text-7xl font-bold sm:text-9xl">404</p>
      <h1 className="mt-10 text-3xl font-bold uppercase sm:text-4xl">Mobilnya udah jalan duluan.</h1>
      <p className="mt-2 font-mono text-sm">Unit ini mungkin sudah laku, atau tautannya salah ketik.</p>
      <Link href="/mobil" className="nb-btn mt-8 bg-nb-yellow">Lihat yang masih ada →</Link>
    </div>
  );
}

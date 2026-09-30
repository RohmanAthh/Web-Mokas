import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/Icon";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/roles";
import { carImages, carTitle, daysInStock, getCarById, mediaUrl, priceDrop } from "@/lib/cars";
import { rupiah } from "@/lib/format";
import { inspectionScore } from "@/lib/inspection";
import { deleteCar, deleteImage, makeCover } from "../../../actions";
import { CarForm } from "../CarForm";
import { InspectionForm } from "../InspectionForm";
import { ConfirmButton } from "../../ConfirmButton";

export const metadata: Metadata = { title: "Edit Mobil" };

export default async function EditCarPage({ params, searchParams }: PageProps<"/admin/mobil/[id]">) {
  const user = await requireUser("cars.edit");
  const car = getCarById(Number((await params).id));
  if (!car) notFound();
  const sp = await searchParams;
  const images = carImages(car.id);

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link href="/admin/mobil" className="text-sm text-slate-500 hover:text-slate-900">← Stok mobil</Link>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">{carTitle(car)}</h1>
          <p className="mt-1 flex flex-wrap gap-2 text-xs text-slate-500">
            <span className="badge bg-slate-100 text-slate-700">{daysInStock(car)} hari di stok</span>
            <span className="badge bg-slate-100 text-slate-700">{car.views} dilihat</span>
            <span className="badge bg-slate-100 text-slate-700">Inspeksi: {inspectionScore(car.inspection).total ?? "belum"}</span>
            {priceDrop(car) > 0 && <span className="badge bg-rose-100 text-rose-700">Label turun harga aktif (dari {rupiah(car.previous_price!)})</span>}
          </p>
        </div>
        <Link href={`/mobil/${car.slug}`} target="_blank" className="btn-secondary"><Icon name="external" className="h-4 w-4" /> Lihat di situs</Link>
      </div>

      {sp.created && <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">Mobil berhasil ditambahkan dan sudah tampil di katalog.</p>}
      {typeof sp.upload_error === "string" && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">Mobil tersimpan, tetapi foto gagal diunggah: {sp.upload_error}</p>
      )}

      <section className="card p-6">
        <h2 className="font-semibold">Foto ({images.length})</h2>
        {images.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">Belum ada foto. Unggah lewat form di bawah.</p>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {images.map((img, idx) => (
              <div key={img.id} className="group relative overflow-hidden rounded-lg border border-slate-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={mediaUrl(img.path)!} alt="" className="aspect-[4/3] w-full object-cover" />
                {idx === 0 && <span className="badge absolute top-2 left-2 bg-accent-400 text-slate-900">Sampul</span>}
                <div className="flex justify-between gap-1 bg-white p-2">
                  {idx > 0 ? (
                    <form action={makeCover}>
                      <input type="hidden" name="imageId" value={img.id} />
                      <button className="text-xs font-medium text-brand-600 hover:underline">Jadikan sampul</button>
                    </form>
                  ) : <span />}
                  <form action={deleteImage}>
                    <input type="hidden" name="imageId" value={img.id} />
                    <ConfirmButton message="Hapus foto ini?" className="text-xs font-medium text-red-600 hover:underline">Hapus</ConfirmButton>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <CarForm car={car} canCost={can(user.role, "cars.cost")} />

      <section className="card p-6" id="inspeksi">
        <div className="mb-4">
          <h2 className="font-semibold">Laporan inspeksi</h2>
          <p className="text-sm text-slate-500">Skor dan temuan tampil di halaman mobil. Item berstatus &quot;Catatan kecil&quot;/&quot;Perlu perhatian&quot; beserta catatannya terlihat oleh pembeli.</p>
        </div>
        <InspectionForm carId={car.id} inspection={car.inspection} />
      </section>

      <section className="card border-red-200 p-6">
        <h2 className="font-semibold text-red-700">Hapus mobil</h2>
        <p className="mt-1 text-sm text-slate-500">Data dan semua foto akan dihapus permanen. Untuk unit yang sudah laku, sebaiknya ubah status menjadi &quot;Terjual&quot;.</p>
        <form action={deleteCar} className="mt-4">
          <input type="hidden" name="id" value={car.id} />
          <ConfirmButton message={`Hapus ${carTitle(car)} secara permanen?`} className="btn-danger"><Icon name="trash" className="h-4 w-4" /> Hapus mobil</ConfirmButton>
        </form>
      </section>
    </div>
  );
}

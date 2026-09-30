import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/LegalPage";
import { CREDIT } from "@/lib/credit";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Syarat & Ketentuan" };

// Template — sesuaikan dengan kebijakan penjualan showroom Anda dan mintalah tinjauan konsultan hukum.
export default function TermsPage() {
  return (
    <LegalPage
      title="Syarat & Ketentuan"
      intro={<p>Dengan menggunakan situs {site.name}, Anda menyetujui ketentuan berikut. Mohon dibaca sebelum melakukan booking atau pembelian.</p>}
      sections={[
        {
          id: "informasi",
          title: "Informasi unit",
          body: (
            <ul>
              <li>Kami berupaya menampilkan foto, spesifikasi, dan harga seakurat mungkin. Kesalahan penulisan dapat terjadi; data yang berlaku adalah yang tercantum dalam perjanjian jual beli.</li>
              <li>Harga dan ketersediaan unit dapat berubah sewaktu-waktu sebelum ada tanda jadi.</li>
              <li>Foto bertanda &quot;ilustrasi&quot; bukan foto unit sebenarnya.</li>
              <li>Laporan inspeksi menggambarkan kondisi unit pada tanggal pemeriksaan. Kami menganjurkan Anda memeriksa unit langsung atau membawa mekanik sendiri.</li>
            </ul>
          ),
        },
        {
          id: "kredit",
          title: "Simulasi & pengajuan kredit",
          body: (
            <ul>
              <li>Simulasi cicilan di situs adalah <b>estimasi</b> (bunga flat {CREDIT.flatRate}%/tahun, belum termasuk asuransi, biaya administrasi, dan provisi).</li>
              <li>Persetujuan kredit, besaran bunga, dan uang muka final ditentukan oleh mitra pembiayaan berdasarkan hasil survei.</li>
            </ul>
          ),
        },
        {
          id: "test-drive",
          title: "Booking test drive",
          body: (
            <ul>
              <li>Jadwal yang Anda pilih akan kami konfirmasi via WhatsApp. Mohon membawa SIM A yang masih berlaku.</li>
              <li>Test drive gratis dan tidak mewajibkan pembelian. Rute dan durasi mengikuti arahan staf kami.</li>
              <li>Bila berhalangan, kabari kami agar slot dapat diberikan ke pengunjung lain.</li>
            </ul>
          ),
        },
        {
          id: "pembelian",
          title: "Tanda jadi & pembelian",
          body: (
            <ul>
              <li>Transaksi pembelian, tanda jadi, dan tukar tambah dilakukan di showroom atau melalui perjanjian tertulis (SPK) yang ditandatangani kedua pihak.</li>
              <li>Ketentuan pengembalian tanda jadi, garansi, dan serah terima mengikuti isi SPK.</li>
              <li>Waspada penipuan: kami tidak pernah meminta transfer ke rekening pribadi. Pembayaran hanya ke rekening atas nama {site.legal.entity}.</li>
            </ul>
          ),
        },
        {
          id: "jual",
          title: "Jual / tukar tambah mobil Anda",
          body: <p>Penawaran harga awal bersifat perkiraan dan dapat berubah setelah inspeksi fisik serta pengecekan dokumen. Kami berhak menolak unit dengan dokumen yang tidak lengkap atau tidak sah.</p>,
        },
        {
          id: "konten",
          title: "Konten & penggunaan situs",
          body: <p>Seluruh foto, teks, dan desain situs ini milik {site.legal.entity} kecuali disebutkan lain. Dilarang menyalin untuk tujuan komersial, melakukan scraping, atau mengirim data palsu melalui form.</p>,
        },
        {
          id: "privasi",
          title: "Privasi",
          body: <p>Pengelolaan data pribadi Anda dijelaskan dalam <Link href="/kebijakan-privasi" className="font-bold underline">Kebijakan Privasi</Link>.</p>,
        },
        {
          id: "hukum",
          title: "Hukum yang berlaku",
          body: <p>Ketentuan ini tunduk pada hukum Republik Indonesia. Perselisihan diupayakan diselesaikan secara musyawarah; bila tidak tercapai, melalui pengadilan negeri di wilayah {site.legal.city}.</p>,
        },
      ]}
    />
  );
}

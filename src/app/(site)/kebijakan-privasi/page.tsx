import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Kebijakan Privasi" };

// Template mengacu pada UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi.
// Sesuaikan dengan praktik bisnis Anda dan mintalah tinjauan konsultan hukum sebelum dipublikasikan.
export default function PrivacyPage() {
  const retention = process.env.LEAD_RETENTION_MONTHS ?? "24";
  const mail = <a href={`mailto:${site.legal.privacyEmail}`} className="font-bold underline">{site.legal.privacyEmail}</a>;
  return (
    <LegalPage
      title="Kebijakan Privasi"
      intro={
        <p>
          Kami menghargai privasi Anda. Halaman ini menjelaskan data pribadi apa yang kami kumpulkan saat Anda menggunakan situs {site.name},
          untuk apa data itu dipakai, berapa lama disimpan, dan hak-hak Anda sesuai Undang-Undang No. 27 Tahun 2022 tentang Pelindungan Data Pribadi (UU PDP).
        </p>
      }
      sections={[
        {
          id: "pengendali",
          title: "Siapa kami",
          body: <p>Pengendali data pribadi adalah {site.legal.entity}, beralamat di {site.address}. Pertanyaan seputar privasi dapat dikirim ke {mail}.</p>,
        },
        {
          id: "data",
          title: "Data yang kami kumpulkan",
          body: (
            <>
              <p><b>Yang Anda isi sendiri</b> melalui form test drive, pertanyaan, pengajuan kredit, atau jual mobil:</p>
              <ul>
                <li>Nama, nomor WhatsApp, dan email (opsional)</li>
                <li>Isi pesan, jadwal kunjungan, unit yang diminati</li>
                <li>Simulasi kredit (uang muka, tenor) bila Anda mengajukan kredit</li>
                <li>Data mobil yang ingin Anda jual (merek, tahun, kilometer, harga harapan, kota)</li>
              </ul>
              <p><b>Yang tercatat otomatis:</b> jumlah kunjungan per halaman mobil (tanpa identitas Anda) dan log teknis server (alamat IP, waktu akses) untuk keamanan.</p>
              <p><b>Yang tetap di perangkat Anda:</b> daftar favorit ♡ dan perbandingan mobil disimpan di browser Anda (localStorage) dan tidak dikirim ke server kami. Kami tidak memakai cookie iklan atau pelacak pihak ketiga; cookie hanya dipakai untuk login staf.</p>
            </>
          ),
        },
        {
          id: "tujuan",
          title: "Tujuan & dasar pemrosesan",
          body: (
            <>
              <p>Kami memproses data berdasarkan <b>persetujuan</b> yang Anda berikan saat mencentang kotak persetujuan di form, untuk:</p>
              <ul>
                <li>Menghubungi Anda terkait unit, harga, dan pertanyaan Anda</li>
                <li>Menjadwalkan dan mengonfirmasi test drive</li>
                <li>Memberi penawaran atas mobil yang ingin Anda jual / tukar tambah</li>
                <li>Memproses pengajuan kredit bersama mitra pembiayaan (lihat bagian berikut)</li>
              </ul>
              <p>Kami tidak menggunakan data Anda untuk promosi massal tanpa persetujuan terpisah, dan tidak menjual data Anda kepada siapa pun.</p>
            </>
          ),
        },
        {
          id: "berbagi",
          title: "Pihak yang dapat mengakses",
          body: (
            <ul>
              <li><b>Staf kami</b> sesuai tugasnya — misalnya tim sales untuk menindaklanjuti permintaan Anda. Akses dibatasi per peran.</li>
              <li><b>Mitra pembiayaan (leasing)</b> — hanya bila Anda mengajukan kredit, dan setelah kami konfirmasi dengan Anda.</li>
              <li><b>Penyedia layanan teknis</b> yang membantu kami (hosting, pengiriman notifikasi internal), terikat kewajiban kerahasiaan.</li>
              <li><b>Instansi berwenang</b> bila diwajibkan oleh hukum.</li>
            </ul>
          ),
        },
        {
          id: "retensi",
          title: "Berapa lama data disimpan",
          body: (
            <p>
              Data permintaan Anda kami simpan paling lama <b>{retention} bulan</b> sejak dikirim. Setelah itu data pribadi (nama, nomor, email, pesan)
              dihapus secara otomatis dan hanya tersisa catatan statistik tanpa identitas. Salinan cadangan (backup) dihapus bergulir dalam
              beberapa minggu. Anda juga dapat meminta penghapusan lebih awal.
            </p>
          ),
        },
        {
          id: "keamanan",
          title: "Keamanan",
          body: (
            <ul>
              <li>Koneksi terenkripsi (HTTPS) dan panel staf yang dilindungi password dengan hash kriptografis</li>
              <li>Hak akses per peran — misalnya staf stok tidak dapat melihat data calon pembeli</li>
              <li>Backup berkala yang disimpan terbatas</li>
            </ul>
          ),
        },
        {
          id: "hak",
          title: "Hak Anda",
          body: (
            <>
              <p>Sesuai UU PDP, Anda berhak untuk:</p>
              <ul>
                <li>Mendapat informasi dan salinan data pribadi Anda yang kami simpan</li>
                <li>Memperbaiki data yang tidak akurat</li>
                <li>Meminta penghapusan data</li>
                <li>Menarik kembali persetujuan kapan saja (tidak memengaruhi pemrosesan sebelumnya)</li>
                <li>Mengajukan keberatan atas pemrosesan tertentu</li>
              </ul>
              <p>Kirim permintaan ke {mail} atau WhatsApp {site.phone} dengan menyebut nama dan nomor yang pernah Anda gunakan. Kami akan memverifikasi permintaan dan menindaklanjutinya dalam tenggat waktu yang ditetapkan UU PDP.</p>
            </>
          ),
        },
        {
          id: "insiden",
          title: "Bila terjadi kebocoran data",
          body: <p>Jika terjadi kegagalan pelindungan data pribadi, kami akan memberi tahu Anda dan lembaga yang berwenang paling lambat 3 × 24 jam sesuai UU PDP, beserta langkah penanganannya.</p>,
        },
        {
          id: "perubahan",
          title: "Perubahan kebijakan",
          body: <p>Kebijakan ini dapat diperbarui sewaktu-waktu. Tanggal berlaku di bagian atas halaman akan diperbarui; perubahan penting akan kami sampaikan di situs ini.</p>,
        },
      ]}
    />
  );
}

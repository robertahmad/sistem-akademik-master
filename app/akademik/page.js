import Link from "next/link";
import prisma from "../../lib/prisma";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Akademik & Fasilitas - Sekolah Master Demo",
  description: "Informasi tentang Fasilitas Penunjang Belajar dan Kegiatan Ekstrakurikuler di Sekolah Master Demo.",
};

export default async function Akademik() {
  const school = await prisma.school.findFirst({ where: { id: 1 } });

  return (
    <>
      {/* PAGE HEADER */}
      <section className="page-header">
        <div className="container">
          <h1 className="page-header-title">Akademik & Fasilitas</h1>
          <div className="page-header-breadcrumbs">
            <Link href="/">Beranda</Link>
            <span className="breadcrumb-separator">/</span>
            <span>Akademik</span>
          </div>
        </div>
      </section>

      {/* RINGKASAN AKADEMIK DINAMIS */}
      <section className="section section-white" style={{ paddingBottom: 0 }}>
        <div className="container">
          <div className="section-title-wrapper">
            <h2 className="section-title">Kurikulum & Jam Belajar</h2>
            <p className="section-subtitle">{school?.akademikText || "Sekolah Master Demo menerapkan Kurikulum Merdeka yang dikolaborasikan secara dinamis dengan kurikulum pesantren."}</p>
          </div>
          
          <div className="grid grid-3" style={{ gap: "1.5rem" }}>
            <div className="card" style={{ borderLeft: "4px solid var(--primary)", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", color: "var(--primary-dark)" }}>
                <svg className="svg-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                </svg>
                <h4 style={{ fontWeight: 800, margin: 0 }}>Sistem Kurikulum</h4>
              </div>
              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: 1.5, marginTop: "0.25rem" }}>{school?.kurikulumDetail || "Kurikulum Merdeka & Bimbingan Kepesantrenan"}</p>
            </div>
            <div className="card" style={{ borderLeft: "4px solid var(--secondary)", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", color: "var(--secondary-dark)" }}>
                <svg className="svg-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <h4 style={{ fontWeight: 800, margin: 0 }}>Jam Pembelajaran</h4>
              </div>
              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: 1.5, marginTop: "0.25rem" }}>{school?.jamBelajar || "Senin - Sabtu, Jam 07:00 - 13:30 WIB"}</p>
            </div>
            <div className="card" style={{ borderLeft: "4px solid var(--primary-dark)", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", color: "var(--primary-dark)" }}>
                <svg className="svg-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
                  <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                  <path d="M6 12v5c0 2 2.7 3.5 6 3.5s6-1.5 6-3.5v-5" />
                </svg>
                <h4 style={{ fontWeight: 800, margin: 0 }}>Kriteria Kelulusan</h4>
              </div>
              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: 1.5, marginTop: "0.25rem" }}>{school?.kriteriaLulus || "Kehadiran minimal 90%, Menyelesaikan seluruh program pembelajaran, Berkelakuan baik dengan nilai kepribadian minimal Baik, Mengikuti ujian sekolah tulis dan praktik."}</p>
            </div>
          </div>
        </div>
      </section>

      {/* FASILITAS UTAMA */}
      <section className="section section-white">
        <div className="container">
          <div className="section-title-wrapper">
            <h2 className="section-title">Fasilitas Penunjang Belajar</h2>
            <p className="section-subtitle">Penyediaan infrastruktur modern untuk memastikan siswa mendapatkan pengalaman praktikum dan kenyamanan belajar terbaik.</p>
          </div>

          <div className="facility-grid">
            {/* Fasilitas 1 */}
            <div className="facility-card">
              <div className="facility-image-wrapper">
                <img src="/facility_computer.jpg" alt="Laboratorium Komputer" className="facility-image" />
              </div>
              <div className="facility-info">
                <h3 className="facility-title">Laboratorium Komputer</h3>
                <p className="facility-description">Ruang komputer ber-AC dengan koneksi internet cepat untuk mendukung ujian berbasis komputer, kelas TIK, dan pemrograman dasar.</p>
              </div>
            </div>

            {/* Fasilitas 2 */}
            <div className="facility-card">
              <div className="facility-image-wrapper">
                <img src="/hero_school.jpg" alt="Perpustakaan Digital" className="facility-image" />
              </div>
              <div className="facility-info">
                <h3 className="facility-title">Perpustakaan & Ruang Baca</h3>
                <p className="facility-description">Koleksi buku kurikulum lengkap, ensiklopedia, novel edukasi, serta fasilitas komputer mini untuk akses e-book sekolah.</p>
              </div>
            </div>

            {/* Fasilitas 3 */}
            <div className="facility-card">
              <div className="facility-image-wrapper">
                <img src="/news_ramadhan.jpg" alt="Masjid Master Demo" className="facility-image" />
              </div>
              <div className="facility-info">
                <h3 className="facility-title">Masjid Master Demo</h3>
                <p className="facility-description">Masjid yang luas di lingkungan sekolah sebagai pusat pembiasaan shalat berjamaah, dhuha bersama, tadarus, dan kajian keagamaan.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* EKSTRAKURIKULER */}
      <section className="section section-alt">
        <div className="container">
          <div className="section-title-wrapper">
            <h2 className="section-title">Kegiatan Ekstrakurikuler</h2>
            <p className="section-subtitle">Wadah pengembangan minat, bakat, serta kepemimpinan siswa di luar kegiatan belajar mengajar.</p>
          </div>

          <div className="extra-grid">
            {/* Ekstra 1 */}
            <div className="extra-card">
              <div className="extra-image-wrapper">
                <img src="/extracurricular_scout.jpg" alt="Ekstrakurikuler Pramuka" className="extra-image" />
              </div>
              <div className="extra-info">
                <h3 className="extra-title">Gerakan Pramuka</h3>
                <p className="extra-description">Ekstrakurikuler wajib untuk melatih kedisiplinan, jiwa kepemimpinan, kepedulian sosial, serta keterampilan bertahan hidup di alam bebas.</p>
              </div>
            </div>

            {/* Ekstra 2 */}
            <div className="extra-card">
              <div className="extra-image-wrapper">
                <img src="/news_silat.jpg" alt="Ekstrakurikuler Pencak Silat" className="extra-image" />
              </div>
              <div className="extra-info">
                <h3 className="extra-title">Pencak Silat Pagar Nusa</h3>
                <p className="extra-description">Seni bela diri tradisional untuk melatih kesehatan fisik, mental spiritual, pertahanan diri, serta meraih prestasi di berbagai ajang perlombaan.</p>
              </div>
            </div>

            {/* Ekstra 3 */}
            <div className="extra-card">
              <div className="extra-image-wrapper">
                <img src="/news_ramadhan.jpg" alt="Hadroh / Rebana" className="extra-image" />
              </div>
              <div className="extra-info">
                <h3 className="extra-title">Seni Hadroh & Rebana</h3>
                <p className="extra-description">Mengembangkan kecintaan pada shalawat nabi dan seni musik rebana modern, sering tampil di acara hari besar Islam sekolah.</p>
              </div>
            </div>

            {/* Ekstra 4 */}
            <div className="extra-card">
              <div className="extra-image-wrapper">
                <img src="/facility_computer.jpg" alt="English Club" className="extra-image" />
              </div>
              <div className="extra-info">
                <h3 className="extra-title">English Club</h3>
                <p className="extra-description">Wadah bagi siswa untuk memperdalam kemampuan berbahasa Inggris lewat permainan, drama, dan simulasi pidato/debat sederhana.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

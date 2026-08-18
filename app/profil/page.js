import Link from "next/link";
import prisma from "../../lib/prisma";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Profil Sekolah - Sekolah Master Demo",
  description: "Ketahui lebih dalam mengenai Sejarah, Visi, Misi, serta Struktur Organisasi Sekolah Master Demo, Magelang.",
};

export default async function Profil() {
  const school = await prisma.school.findFirst({ where: { id: 1 } });
  
  const misiItems = school?.misiText
    ? school.misiText.split(";").filter(Boolean)
    : [
        "Menyelenggarakan proses pembelajaran yang mengintegrasikan nilai-nilai Islam dengan kurikulum nasional.",
        "Membina karakter siswa melalui pembiasaan ibadah, budi pekerti, dan kepemimpinan Islami.",
        "Mengembangkan potensi akademik dan non-akademik siswa secara maksimal melalui bimbingan intensif dan ekstrakurikuler.",
        "Menyediakan sarana prasarana penunjang pembelajaran yang memadai berbasis teknologi informasi.",
        "Mewujudkan lingkungan sekolah yang bersih, sehat, ramah anak, dan peduli terhadap kelestarian alam."
      ];

  return (
    <>
      {/* PAGE HEADER */}
      <section className="page-header">
        <div className="container">
          <h1 className="page-header-title">Profil Sekolah</h1>
          <div className="page-header-breadcrumbs">
            <Link href="/">Beranda</Link>
            <span className="breadcrumb-separator">/</span>
            <span>Profil</span>
          </div>
        </div>
      </section>

      {/* SEJARAH SINGKAT */}
      <section className="section section-white">
        <div className="container history-speech">
          <div className="history-text">
            <span style={{ fontWeight: 700, color: "var(--secondary)", textTransform: "uppercase", fontSize: "0.85rem", letterSpacing: "0.05em" }}>
              Sejarah Singkat
            </span>
            <h2 style={{ fontSize: "2rem", color: "var(--primary-dark)", fontWeight: 800, marginBottom: "1.5rem", letterSpacing: "-0.02em" }}>
              {school?.sejarahTitle || "Perjalanan Sekolah Master Demo"}
            </h2>
            <div style={{ whiteSpace: "pre-line", fontSize: "0.95rem", color: "var(--text-main)", lineHeight: 1.7 }}>
              {school?.sejarahText || `Sekolah Master Demo didirikan dengan cita-cita luhur untuk menyediakan sarana pendidikan tingkat menengah yang berkualitas, terjangkau, dan sarat akan pembinaan moral keagamaan bagi masyarakat di kawasan lereng Gunung Sumbing, Kota Demo, Magelang.

Bermula dari sebuah gagasan para tokoh agama dan masyarakat setempat, sekolah ini secara resmi mulai beroperasi pada tahun 2012 di bawah naungan Yayasan Master Demo. Dengan tekad yang kuat, sarana dan prasarana belajar terus dikembangkan secara bertahap hingga menjadi seperti sekarang ini.

Hingga kini, Sekolah Master Demo telah meluluskan ratusan alumni yang telah berkiprah di berbagai jenjang pendidikan lanjutan, baik sekolah menengah atas favorit, pondok pesantren, maupun dunia kerja profesional, dengan tetap memegang teguh karakter luhur Islami yang diajarkan selama masa sekolah.`}
            </div>
          </div>
          <div className="hero-image-wrapper">
            <img src="/hero_school.jpg" alt="Gedung Sekolah Master Demo" style={{ height: "350px", objectFit: "cover" }} />
          </div>
        </div>
      </section>

      {/* VISI & MISI */}
      <section className="section section-alt">
        <div className="container">
          <div className="section-title-wrapper">
            <h2 className="section-title">Visi & Misi Sekolah</h2>
            <p className="section-subtitle">Arah langkah dan komitmen kami dalam mendidik generasi penerus bangsa.</p>
          </div>
          
          <div className="vision-mission-grid">
            {/* Visi */}
            <div className="vision-box">
              <span style={{ fontWeight: 700, textTransform: "uppercase", fontSize: "0.85rem", letterSpacing: "0.05em", color: "var(--primary-light)", marginBottom: "0.5rem", display: "block" }}>
                Visi Kami
              </span>
              <h3 className="vision-title">Visi Sekolah</h3>
              <p className="vision-text">"{school?.visiText || "Terwujudnya insan yang bertakwa, berakhlak mulia, berprestasi tinggi, menguasai ilmu pengetahuan teknologi, dan berwawasan lingkungan."}"</p>
            </div>
            
            {/* Misi */}
            <div className="mission-box">
              <h3 className="mission-title">Misi Kami</h3>
              <div className="mission-list">
                {misiItems.map((misi, index) => (
                  <div className="mission-item" key={index}>
                    <div className="mission-number">{index + 1}</div>
                    <div className="mission-text">{misi}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STRUKTUR ORGANISASI */}
      <section className="section section-white">
        <div className="container">
          <div className="section-title-wrapper">
            <h2 className="section-title">Struktur Organisasi</h2>
            <p className="section-subtitle">Sinergi jajaran pimpinan dan tenaga pendidik dalam mengelola sekolah.</p>
          </div>

          <div style={{ maxWidth: "900px", margin: "0 auto" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "2rem", alignItems: "center" }}>
              {/* Tingkat 1 (Yayasan) */}
              <div style={{ backgroundColor: "var(--primary-dark)", color: "white", padding: "1.25rem 2.5rem", borderRadius: "var(--radius-md)", textAlign: "center", boxShadow: "var(--shadow-sm)", minWidth: "250px" }}>
                <div style={{ fontWeight: 700, fontSize: "1.1rem", color: "var(--secondary)" }}>{school?.yayasan || "Yayasan Master Demo"}</div>
                <div style={{ fontSize: "0.85rem", opacity: 0.8, marginTop: "0.25rem" }}>Pembina & Penyokong Sekolah</div>
              </div>

              {/* Jalur Penghubung */}
              <div style={{ width: "2px", height: "30px", backgroundColor: "var(--primary)", display: "block" }}></div>

              {/* Tingkat 2 (Kepala Sekolah) */}
              <div style={{ backgroundColor: "var(--primary)", color: "white", padding: "1.25rem 2.5rem", borderRadius: "var(--radius-md)", textAlign: "center", boxShadow: "var(--shadow-md)", minWidth: "250px", position: "relative" }}>
                <div style={{ fontWeight: 700, fontSize: "1.15rem" }}>{school?.kepsek || "KH. Ahmad Qodir, M.Pd.I."}</div>
                <div style={{ fontSize: "0.85rem", color: "var(--secondary-light)", marginTop: "0.25rem", fontWeight: 600 }}>Kepala Sekolah</div>
              </div>

              {/* Jalur Penghubung */}
              <div style={{ width: "2px", height: "30px", backgroundColor: "var(--primary)", display: "block" }}></div>

              {/* Tingkat 3 (Komite & Tata Usaha) */}
              <div style={{ display: "flex", gap: "4rem", justifyContent: "center", width: "100%", flexWrap: "wrap" }}>
                <div style={{ backgroundColor: "white", border: "1px solid var(--border-color)", color: "var(--text-main)", padding: "1rem 2rem", borderRadius: "var(--radius-md)", textAlign: "center", boxShadow: "var(--shadow-sm)", minWidth: "220px" }}>
                  <div style={{ fontWeight: 700, color: "var(--primary-dark)" }}>{school?.komite || "H. Suyanto, S.Pd."}</div>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>Komite Sekolah</div>
                </div>
                
                <div style={{ backgroundColor: "white", border: "1px solid var(--border-color)", color: "var(--text-main)", padding: "1rem 2rem", borderRadius: "var(--radius-md)", textAlign: "center", boxShadow: "var(--shadow-sm)", minWidth: "220px" }}>
                  <div style={{ fontWeight: 700, color: "var(--primary-dark)" }}>{school?.kepalaTu || "Budi Santoso, S.Kom."}</div>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>Kepala Tata Usaha</div>
                </div>
              </div>

              {/* Jalur Penghubung */}
              <div style={{ width: "2px", height: "30px", backgroundColor: "var(--primary)", display: "block" }}></div>

              {/* Tingkat 4 (Wakil Kepala Sekolah) */}
              <div style={{ display: "flex", gap: "2rem", justifyContent: "center", width: "100%", flexWrap: "wrap" }}>
                <div style={{ backgroundColor: "var(--bg-alt)", border: "2px dashed var(--primary)", color: "var(--text-main)", padding: "1rem 1.5rem", borderRadius: "var(--radius-md)", textAlign: "center", minWidth: "200px" }}>
                  <div style={{ fontWeight: 700, color: "var(--primary-dark)" }}>{school?.wakaKur || "Siti Rahma, S.Pd."}</div>
                  <div style={{ fontSize: "0.8rem", color: "var(--primary)", fontWeight: 600, marginTop: "0.25rem" }}>Waka Kurikulum</div>
                </div>

                <div style={{ backgroundColor: "var(--bg-alt)", border: "2px dashed var(--primary)", color: "var(--text-main)", padding: "1rem 1.5rem", borderRadius: "var(--radius-md)", textAlign: "center", minWidth: "200px" }}>
                  <div style={{ fontWeight: 700, color: "var(--primary-dark)" }}>{school?.wakaSis || "Aris Munandar, S.Or."}</div>
                  <div style={{ fontSize: "0.8rem", color: "var(--primary)", fontWeight: 600, marginTop: "0.25rem" }}>Waka Kesiswaan</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

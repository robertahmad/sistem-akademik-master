"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSchoolProfilePublic } from "./actions/admin";

export default function Home() {
  const [counts, setCounts] = useState({ siswa: 0, guru: 0, ekskul: 0, kelulusan: 0 });
  const [school, setSchool] = useState(null);
  const [isPortalOpen, setIsPortalOpen] = useState(false);

  useEffect(() => {
    async function loadSchool() {
      const res = await getSchoolProfilePublic();
      if (res.success) {
        setSchool(res.school);
      }
    }
    loadSchool();

    // Animasi angka statistik
    const targets = { siswa: 250, guru: 22, ekskul: 12, kelulusan: 98 };
    const duration = 1500;
    const intervalTime = 30;
    const steps = duration / intervalTime;

    let step = 0;
    const timer = setInterval(() => {
      step++;
      setCounts({
        siswa: Math.min(targets.siswa, Math.round((targets.siswa / steps) * step)),
        guru: Math.min(targets.guru, Math.round((targets.guru / steps) * step)),
        ekskul: Math.min(targets.ekskul, Math.round((targets.ekskul / steps) * step)),
        kelulusan: Math.min(targets.kelulusan, Math.round((targets.kelulusan / steps) * step)),
      });

      if (step >= steps) {
        clearInterval(timer);
      }
    }, intervalTime);

    return () => clearInterval(timer);
  }, []);

  return (
    <>
      <style jsx global>{`
        body { margin: 0; padding: 0; }
        .hero-full {
          position: relative;
          width: 100%;
          min-height: 100vh;
          background-image: url('/image/bg-hero-jpg.png');
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          display: flex;
          flex-direction: column;
          align-items: center;
          color: white;
          overflow: hidden;
        }
        .hero-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.6) 100%);
          z-index: 1;
          pointer-events: none;
        }
        .hero-navbar {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          padding: 1.5rem 4rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          z-index: 50;
        }
        .nav-logo {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .nav-logo img {
          width: 50px;
          height: 50px;
          object-fit: contain;
          mix-blend-mode: multiply;
          filter: contrast(1.1) brightness(1.1);
        }
        .nav-logo-text {
          display: flex;
          flex-direction: column;
          font-weight: 800;
          letter-spacing: 0.05em;
        }
        .nav-logo-text .smp { font-size: 1.2rem; color: white; margin: 0; line-height: 1.2; }
        .nav-logo-text .al-mumtaz { font-size: 0.95rem; color: #FBBF24; margin: 0; line-height: 1; }
        .nav-menu {
          display: flex;
          gap: 2.5rem;
          font-weight: 600;
          font-size: 0.95rem;
        }
        .nav-menu a {
          color: white;
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 0.3rem;
          transition: 0.3s;
        }
        .nav-menu a:hover, .nav-menu a.active {
          color: #FBBF24;
        }
        .btn-glass {
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.4);
          color: white;
          padding: 0.6rem 2rem;
          border-radius: 50px;
          font-weight: 600;
          cursor: pointer;
          transition: 0.3s;
          text-decoration: none;
        }
        .btn-glass:hover {
          background: rgba(255, 255, 255, 0.25);
        }
        .hero-center {
          position: relative;
          z-index: 10;
          margin-top: 15vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          width: 100%;
        }
        .logo-center {
          width: 110px;
          height: 110px;
          object-fit: contain;
          margin-bottom: 1.5rem;
          mix-blend-mode: multiply;
          filter: contrast(1.1) brightness(1.1);
        }
        .badge-generasi {
          background: #10B981;
          color: white;
          padding: 0.5rem 1.5rem;
          border-radius: 50px;
          font-size: 0.85rem;
          font-weight: 800;
          letter-spacing: 0.12em;
          margin-bottom: 1.5rem;
          box-shadow: 0 4px 10px rgba(16, 185, 129, 0.4);
        }
        .title-huge {
          font-size: 4.8rem;
          font-weight: 900;
          line-height: 1.05;
          margin: 0;
          text-shadow: 2px 2px 12px rgba(0,0,0,0.4);
          letter-spacing: -0.02em;
        }
        .title-huge .white { color: white; display: block; }
        .title-huge .gold { color: #FBBF24; display: block; }
        .title-sub {
          font-size: 1.5rem;
          font-weight: 700;
          color: white;
          letter-spacing: 0.2em;
          margin-top: 1rem;
          text-shadow: 1px 1px 5px rgba(0,0,0,0.5);
        }
        .subtitle-hero {
          margin-top: 1.8rem;
          font-size: 1.05rem;
          font-weight: 400;
          max-width: 800px;
          line-height: 1.6;
          color: #f1f5f9;
          text-shadow: 1px 1px 4px rgba(0,0,0,0.9), 0 0 10px rgba(0,0,0,0.8);
        }
        .subtitle-hero .highlight {
          color: #FBBF24;
          font-weight: 700;
        }
        .btn-group {
          margin-top: 2.5rem;
          display: flex;
          gap: 1.5rem;
        }
        .btn-green {
          background: #10B981;
          color: white;
          padding: 0.9rem 2.2rem;
          border-radius: 50px;
          font-weight: 700;
          text-decoration: none;
          transition: 0.3s;
          box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4);
        }
        .btn-green:hover {
          background: #059669;
          transform: translateY(-2px);
        }
        .btn-glass-outline {
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.6);
          color: white;
          padding: 0.9rem 2.2rem;
          border-radius: 50px;
          font-weight: 600;
          text-decoration: none;
          transition: 0.3s;
        }
        .btn-glass-outline:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: white;
        }
        .watermark {
          position: absolute;
          bottom: -8vh;
          left: 50%;
          transform: translateX(-50%);
          font-size: 38vw;
          font-weight: 900;
          color: rgba(255, 255, 255, 0.05);
          z-index: 2;
          pointer-events: none;
          white-space: nowrap;
          line-height: 1;
        }
        .portal-dropdown-wrapper {
          position: relative;
          display: inline-block;
        }
        .portal-dropdown {
          position: absolute;
          top: 100%;
          right: 0;
          min-width: 180px;
          z-index: 100;
        }
        .portal-link {
          color: white;
          padding: 0.8rem 1rem;
          text-decoration: none;
          font-weight: 600;
          font-size: 0.9rem;
          border-radius: 8px;
          transition: 0.2s;
        }
        .portal-link:hover {
          background: rgba(255, 255, 255, 0.1);
          color: #FBBF24;
        }

        /* MOBILE RESPONSIVE HERO */
        @media (max-width: 768px) {
          .hero-navbar {
            padding: 1rem;
            flex-direction: column;
            gap: 0.8rem;
          }
          .nav-logo {
            display: none;
          }
          .nav-menu {
            flex-wrap: wrap;
            justify-content: center;
            gap: 0.6rem;
            font-size: 0.8rem;
          }
          .btn-glass {
            padding: 0.6rem 1.5rem;
            font-size: 0.95rem;
            background: #FBBF24;
            color: #0f172a;
            border: none;
            font-weight: 800;
            box-shadow: 0 4px 10px rgba(251, 191, 36, 0.3);
          }
          .hero-center {
            margin-top: 12vh;
          }
          .logo-center {
            width: 80px;
            height: 80px;
            margin-bottom: 1rem;
          }
          .badge-generasi {
            font-size: 0.7rem;
            padding: 0.4rem 1rem;
            margin-bottom: 1rem;
          }
          .title-huge {
            font-size: 2.2rem;
            line-height: 1.2;
            margin-bottom: 0.5rem;
          }
          .title-sub {
            font-size: 0.85rem;
            letter-spacing: 0.05em;
            margin-top: 0.5rem;
            margin-bottom: 1.5rem;
            text-align: center;
          }
          .subtitle-hero {
            font-size: 0.85rem;
            padding: 0 1rem;
            margin-bottom: 2rem;
            line-height: 1.5;
          }
          .btn-group {
            flex-direction: column;
            gap: 1rem;
            width: 100%;
            padding: 0 2rem;
            margin-top: 2rem;
          }
          .btn-green, .btn-glass-outline {
            width: 100%;
            text-align: center;
            padding: 0.8rem 1rem;
          }
          .watermark {
            font-size: 35vw;
            bottom: 2vh;
            opacity: 0.03;
          }
        }
      `}</style>

      {/* HERO SECTION BARU */}
      <section className="hero-full">
        <div className="hero-overlay"></div>
        
        <div className="watermark">2026</div>

        <nav className="hero-navbar">
          <div className="nav-logo">
            <img src="/logo-generic.svg" alt="Logo SMK" />
            <div className="nav-logo-text">
              <p className="smp">SEKOLAH MASTER DEMO</p>
              <p className="al-mumtaz">KOTA DEMO</p>
            </div>
          </div>
          
          <div className="nav-menu">
            <Link href="/" className="active">Beranda</Link>
            <Link href="/profil">Profil</Link>
            <Link href="/akademik">Akademik</Link>
            <Link href="/galeri">Galeri</Link>
            <Link href="/kontak">Kontak</Link>
          </div>

          <Link href="/portal" className="btn-glass" style={{ position: 'relative', zIndex: 1001, pointerEvents: 'auto' }}>
            Portal Login
          </Link>
        </nav>

        <div className="hero-center">
          <img src="/logo-generic.svg" alt="Logo Tengah" className="logo-center" />
          <div className="badge-generasi">GENERASI MASTER DEMO</div>
          
          <h1 className="title-huge">
            <span className="white">SEKOLAH MASTER DEMO</span>
            <span className="gold">KOTA DEMO</span>
          </h1>
          <div className="title-sub">YAYASAN EDUKASI MASTER</div>

          <p className="subtitle-hero">
            Menjadi Lembaga Pendidikan Islam Unggulan Yang Melahirkan Generasi Penerus Yang <span className="highlight">Beriman</span>, 
            <br/><span className="highlight">Berilmu</span>, dan <span className="highlight">Berakhlak Mulia</span>
          </p>

          <div className="btn-group">
            <Link href="/kontak" className="btn-green">Hubungi Kami</Link>
            <Link href="/profil" className="btn-glass-outline">◎ Profil Sekolah</Link>
          </div>
        </div>
      </section>

      {/* SAMBUTAN KEPALA SEKOLAH (Desain Lama) */}
      <section className="section section-white">
        <div className="container welcome-speech">
          <div className="principal-photo-wrapper">
            <img src={school?.logo && school.logo.startsWith("data:image/") ? school.logo : "/logo-generic.svg"} alt="Logo Sekolah" className="principal-photo" style={{ objectFit: "contain", padding: "1.5rem" }} />
          </div>
          <div className="speech-content">
            <span style={{ fontWeight: 700, color: "var(--secondary)", textTransform: "uppercase", fontSize: "0.85rem", letterSpacing: "0.05em" }}>
              Sambutan Kepala Sekolah
            </span>
            <h2 style={{ fontSize: "2rem", color: "var(--primary-dark)", fontWeight: 800, marginBottom: "1.5rem", letterSpacing: "-0.02em" }}>
              {school?.sambutanTitle || "Selamat Datang di Sekolah Master Demo"}
            </h2>
            <blockquote style={{ whiteSpace: "pre-line" }}>
              "{school?.sambutanText || "Pendidikan bukanlah sekadar mengisi wadah yang kosong, melainkan menyalakan api karakter dan ilmu. Di Sekolah Master Demo, kami berkomitmen untuk melahirkan insan-insan cerdas yang tidak hanya unggul secara akademis, namun juga memiliki kedalaman akhlak yang berlandaskan nilai-nilai Al-Qur'an dan Sunnah."}"
            </blockquote>
            <div className="speech-author">{school?.sambutanAuthor || "KH. Ahmad Qodir, M.Pd.I."}</div>
            <div className="speech-title">Kepala Sekolah {school?.nama || "Sekolah Master Demo"}</div>
          </div>
        </div>
      </section>

      {/* COUNTER STATISTIK */}
      <section className="stat-section">
        <div className="container stat-grid">
          <div className="stat-item">
            <div className="stat-number">{counts.siswa}+</div>
            <div className="stat-label">Siswa Aktif</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">{counts.guru}+</div>
            <div className="stat-label">Guru Profesional</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">{counts.ekskul}+</div>
            <div className="stat-label">Ekstrakurikuler</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">{counts.kelulusan}%</div>
            <div className="stat-label">Tingkat Kelulusan</div>
          </div>
        </div>
      </section>

      {/* KEUNGGULAN SEKOLAH */}
      <section className="section section-alt">
        <div className="container">
          <div className="section-title-wrapper">
            <h2 className="section-title">Mengapa Memilih Kami?</h2>
            <p className="section-subtitle">Komitmen kami untuk memberikan lingkungan belajar terbaik demi tumbuh kembang optimal para siswa.</p>
          </div>
          <div className="grid grid-3">
            {/* Keunggulan 1 */}
            <div className="card">
              <div className="feature-icon-box">
                <svg className="svg-icon" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                  <path d="M12 7v14" />
                  <path d="M9 7h3" />
                  <path d="M12 11h3" />
                </svg>
              </div>
              <h3 className="feature-title">Karakter Islami</h3>
              <p className="feature-description">Pembiasaan ibadah harian, tahfidz Al-Qur'an, dan bimbingan akhlakul karimah secara intensif.</p>
            </div>
            {/* Keunggulan 2 */}
            <div className="card">
              <div className="feature-icon-box">
                <svg className="svg-icon" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                  <line x1="8" y1="21" x2="16" y2="21" />
                  <line x1="12" y1="17" x2="12" y2="21" />
                </svg>
              </div>
              <h3 className="feature-title">Fasilitas Modern</h3>
              <p className="feature-description">Laboratorium komputer lengkap, perpustakaan nyaman, lapangan olahraga, serta lingkungan belajar yang asri.</p>
            </div>
            {/* Keunggulan 3 */}
            <div className="card">
              <div className="feature-icon-box">
                <svg className="svg-icon" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
                  <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                  <path d="M6 12v5c0 2 2.7 3.5 6 3.5s6-1.5 6-3.5v-5" />
                </svg>
              </div>
              <h3 className="feature-title">Guru Berdedikasi</h3>
              <p className="feature-description">Didukung oleh jajaran pendidik lulusan perguruan tinggi ternama yang kompeten dan ramah anak.</p>
            </div>
          </div>
        </div>
      </section>

    </>
  );
}

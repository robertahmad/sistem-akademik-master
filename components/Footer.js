"use client";

import { useState, useEffect } from "react";
import { getSchoolProfilePublic } from "../app/actions/admin";

export default function Footer() {
  const [school, setSchool] = useState(null);

  useEffect(() => {
    async function loadSchool() {
      const res = await getSchoolProfilePublic();
      if (res.success) {
        setSchool(res.school);
      }
    }
    loadSchool();
  }, []);

  const schoolName = school?.nama || "SEKOLAH MASTER DEMO WINDUSARI";
  const schoolAddress = school?.alamat || "Jegedeh Wahyurejo, Candisari, Windusari, Magelang";
  const schoolPhone = school?.telepon || "085228476578, 08587399500";
  const schoolEmail = school?.email || "smpalqodiriyah@gmail.com";

  return (
    <footer className="main-footer" id="main-footer">
      <div className="container footer-grid">
        <div className="footer-info">
          <div className="logo-wrapper" style={{ marginBottom: "1rem" }}>
            <img src="/logo-smk.png" alt="Logo Sekolah Master Demo" className="logo-icon" style={{ objectFit: "contain", padding: "0.2rem", backgroundColor: "white" }} />
            <div className="logo-text">
              <span className="logo-title" style={{ color: "white" }}>SEKOLAH MASTER DEMO</span>
              <span className="logo-subtitle" style={{ color: "var(--text-muted-light)" }}>Magelang Jawa Tengah</span>
            </div>
          </div>
          <p style={{ color: "var(--text-muted-light)", fontSize: "0.9rem", lineHeight: "1.6" }}>
            Membentuk generasi unggul yang berakhlak mulia, cerdas secara akademik, mandiri, dan berjiwa kepemimpinan islami berlandaskan nilai luhur pondok pesantren.
          </p>
        </div>
        
        <div>
          <h4 className="footer-title">Peta Situs</h4>
          <ul className="footer-links">
            <li><a href="/" style={{ color: "var(--text-muted-light)" }}>Beranda</a></li>
            <li><a href="/profil" style={{ color: "var(--text-muted-light)" }}>Profil Sekolah</a></li>
            <li><a href="/akademik" style={{ color: "var(--text-muted-light)" }}>Program Akademik</a></li>
            <li><a href="/galeri" style={{ color: "var(--text-muted-light)" }}>Galeri Foto</a></li>
            <li><a href="/kontak" style={{ color: "var(--text-muted-light)" }}>Hubungi Kami</a></li>
          </ul>
        </div>
        
        <div>
          <h4 className="footer-title">Kontak Sekolah</h4>
          <ul className="footer-links" style={{ color: "var(--text-muted-light)", fontSize: "0.9rem", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            <li style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--secondary)", flexShrink: 0, marginTop: "0.25rem", display: "block" }}>
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <span>{schoolAddress}</span>
            </li>
            <li style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--secondary)", flexShrink: 0, marginTop: "0.25rem", display: "block" }}>
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              <span>{schoolPhone}</span>
            </li>
            <li style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--secondary)", flexShrink: 0, marginTop: "0.25rem", display: "block" }}>
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
              <a href={`mailto:${schoolEmail}`} style={{ color: "var(--text-muted-light)", textDecoration: "none" }}>{schoolEmail}</a>
            </li>
            <li style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--secondary)", flexShrink: 0, marginTop: "0.25rem", display: "block" }}>
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
              <a href="https://smpalqodiriyah.sch.id" target="_blank" rel="noreferrer" style={{ color: "var(--text-muted-light)", textDecoration: "none" }}>smpalqodiriyah.sch.id</a>
            </li>
          </ul>
        </div>
      </div>
      
      <div className="footer-bottom">
        <div className="container" style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
          <span>© {new Date().getFullYear()} {schoolName}. Hak Cipta Dilindungi.</span>
          <span>Program Unggulan Tahfidz & Kepemimpinan Islami</span>
        </div>
      </div>
    </footer>
  );
}

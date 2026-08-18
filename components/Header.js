"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Header({ logo = "/logo-smk.png" }) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const portalRoutes = ["/portal/siswa", "/portal/guru", "/portal/admin", "/portal/kepsek"];
  if (pathname === "/" || portalRoutes.some(r => pathname.startsWith(r))) {
    return null;
  }

  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      // Tunggu load event untuk performa maksimal
      const registerSW = () => {
        navigator.serviceWorker.register("/sw.js").then(
          (reg) => console.log("PresenAl-Q PWA SW registered, scope:", reg.scope),
          (err) => console.log("PresenAl-Q PWA SW registration failed:", err)
        );
      };
      if (document.readyState === "complete") {
        registerSW();
      } else {
        window.addEventListener("load", registerSW);
      }
    }
  }, []);

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  const isActive = (path) => pathname === path;

  return (
    <header className="header" id="main-header">
      <div className="container header-container">
        <Link href="/" className="logo-wrapper" onClick={closeMenu}>
          <img src={logo} alt="Logo Sekolah Master Demo" style={{ width: "3.2rem", height: "3.2rem", objectFit: "contain", flexShrink: 0 }} />
          <div className="logo-text">
            <span className="logo-title">SMK AL QODIRIYAH</span>
            <span className="logo-subtitle">Windusari</span>
          </div>
        </Link>
        
        <nav className={`nav ${isOpen ? "active" : ""}`} id="nav-menu">
          <Link href="/" className={`nav-link ${isActive("/") ? "active" : ""}`} onClick={closeMenu}>
            Beranda
          </Link>
          <Link href="/profil" className={`nav-link ${isActive("/profil") ? "active" : ""}`} onClick={closeMenu}>
            Profil
          </Link>
          <Link href="/akademik" className={`nav-link ${isActive("/akademik") ? "active" : ""}`} onClick={closeMenu}>
            Akademik
          </Link>
          <Link href="/galeri" className={`nav-link ${isActive("/galeri") ? "active" : ""}`} onClick={closeMenu}>
            Galeri
          </Link>
          <Link href="/kontak" className={`nav-link ${isActive("/kontak") ? "active" : ""}`} onClick={closeMenu}>
            Kontak
          </Link>
        </nav>
        
        <button className="menu-toggle" id="menu-toggle" onClick={toggleMenu} aria-label="Buka Menu">
          {isOpen ? "✕" : "☰"}
        </button>
      </div>
    </header>
  );
}

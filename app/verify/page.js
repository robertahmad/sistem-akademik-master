import React, { Suspense } from "react";
import Link from "next/link";
import VerifyContent from "./VerifyContent";

export const metadata = {
  title: 'Verifikasi Dokumen TTE | Sekolah Master Demo',
};

export default function VerifyPage() {
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc", display: "flex", flexDirection: "column", alignItems: "center", padding: "2rem 1rem", fontFamily: "sans-serif" }}>
      <div style={{ maxWidth: "600px", width: "100%", backgroundColor: "white", padding: "2rem", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)" }}>
        
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>✅</div>
          <h1 style={{ color: "#0f172a", fontSize: "1.5rem", fontWeight: "bold", margin: "0 0 0.5rem 0" }}>Verifikasi Tanda Tangan Elektronik</h1>
          <p style={{ color: "#64748b", margin: 0, fontSize: "0.95rem" }}>
            Dokumen ini telah ditandatangani secara sah menggunakan Sertifikat Elektronik Resmi.
          </p>
        </div>

        <Suspense fallback={<div style={{ textAlign: "center", padding: "2rem", color: "#64748b" }}>Memeriksa keaslian dokumen...</div>}>
          <VerifyContent />
        </Suspense>

        <div style={{ marginTop: "2rem", paddingTop: "1.5rem", borderTop: "1px solid #e2e8f0", textAlign: "center" }}>
          <p style={{ fontSize: "0.85rem", color: "#94a3b8", margin: "0 0 1rem 0" }}>Sistem Informasi Sekolah Master Demo</p>
          <Link href="/" style={{ color: "#2563eb", textDecoration: "none", fontWeight: "500", fontSize: "0.9rem" }}>
            &larr; Kembali ke Beranda
          </Link>
        </div>

      </div>
    </div>
  );
}

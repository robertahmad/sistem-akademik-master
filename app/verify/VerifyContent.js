"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function VerifyContent() {
  const searchParams = useSearchParams();
  const tteId = searchParams.get("id");
  const provider = searchParams.get("provider");
  
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    // Simulasi pemanggilan API verifikasi ke Provider TTE Resmi
    // Di dunia nyata, ini akan memanggil endpoint backend yang terhubung ke API BSrE / PrivyID
    if (!tteId) {
      setStatus("invalid");
      return;
    }

    const timer = setTimeout(() => {
      setStatus("valid");
    }, 1500);

    return () => clearTimeout(timer);
  }, [tteId, provider]);

  if (status === "loading") {
    return (
      <div style={{ textAlign: "center", padding: "2rem", color: "#64748b" }}>
        <div style={{ marginBottom: "1rem" }}>⏳ Memverifikasi Sertifikat Elektronik...</div>
        <div style={{ fontSize: "0.85rem", opacity: 0.8 }}>Terhubung ke server {provider || "Penyedia"}...</div>
      </div>
    );
  }

  if (status === "invalid") {
    return (
      <div style={{ textAlign: "center", padding: "2rem", background: "#fef2f2", borderRadius: "8px", border: "1px solid #fecaca" }}>
        <h3 style={{ color: "#ef4444", margin: "0 0 0.5rem 0" }}>Dokumen Tidak Dikenali</h3>
        <p style={{ color: "#7f1d1d", margin: 0, fontSize: "0.9rem" }}>Sertifikat elektronik tidak valid atau tidak ditemukan dalam database.</p>
      </div>
    );
  }

  return (
    <div style={{ background: "#f0fdf4", padding: "1.5rem", borderRadius: "8px", border: "1px solid #bbf7d0" }}>
      <h3 style={{ color: "#166534", margin: "0 0 1rem 0", borderBottom: "1px solid #dcfce7", paddingBottom: "0.5rem" }}>Detail Sertifikat</h3>
      
      <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: "0.5rem 1rem", fontSize: "0.9rem" }}>
        <div style={{ color: "#166534", fontWeight: "bold" }}>Penerbit</div>
        <div style={{ color: "#14532d" }}>{provider || "BSrE (BSSN)"}</div>

        <div style={{ color: "#166534", fontWeight: "bold" }}>ID Sertifikat</div>
        <div style={{ color: "#14532d", wordBreak: "break-all" }}>{tteId}</div>

        <div style={{ color: "#166534", fontWeight: "bold" }}>Instansi</div>
        <div style={{ color: "#14532d" }}>Sekolah Master Demo</div>

        <div style={{ color: "#166534", fontWeight: "bold" }}>Status</div>
        <div style={{ color: "#15803d", fontWeight: "bold", display: "flex", alignItems: "center", gap: "0.25rem" }}>
          <span>✓</span> Terverifikasi Asli
        </div>
      </div>
    </div>
  );
}

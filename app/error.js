"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    // Log error ke sistem pelaporan (bisa ditambahkan nanti)
    console.error("Terjadi error di aplikasi:", error);
  }, [error]);

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "2rem",
      backgroundColor: "var(--bg-alt, #f8fafc)",
      textAlign: "center",
      fontFamily: "inherit"
    }}>
      <div style={{
        backgroundColor: "white",
        padding: "3rem 2.5rem",
        borderRadius: "var(--radius-xl, 20px)",
        boxShadow: "var(--shadow-md, 0 10px 25px rgba(0,0,0,0.1))",
        maxWidth: "500px",
        width: "100%",
        borderTop: "5px solid var(--primary, #d97706)"
      }}>
        <div style={{
          width: "80px",
          height: "80px",
          backgroundColor: "#fef3c7",
          color: "#d97706",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 1.5rem auto"
        }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
        </div>
        
        <h2 style={{
          fontSize: "1.75rem",
          fontWeight: "800",
          color: "var(--primary-dark, #1e293b)",
          marginBottom: "1rem"
        }}>
          Sedang Menyiapkan Data
        </h2>
        
        <p style={{
          color: "var(--secondary, #64748b)",
          fontSize: "1rem",
          lineHeight: "1.6",
          marginBottom: "1rem"
        }}>
          Wah, sepertinya server membutuhkan waktu lebih lama dari biasanya (Timeout). 
          Hal ini biasanya terjadi karena sistem baru saja bangun dari mode tidur. 
          Silakan coba muat ulang halaman ini.
        </p>

        <div style={{ padding: "1rem", backgroundColor: "#fee2e2", color: "#991b1b", borderRadius: "8px", marginBottom: "2rem", fontSize: "0.85rem", wordBreak: "break-all", textAlign: "left" }}>
          <strong>Pesan Error (Debug):</strong> {error?.message || "Unknown error"}
        </div>

        <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
          <button 
            onClick={() => reset()} 
            style={{
              padding: "0.8rem 1.5rem",
              backgroundColor: "var(--primary, #d97706)",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.2s"
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = "var(--primary-hover, #b45309)"}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = "var(--primary, #d97706)"}
          >
            Muat Ulang Halaman
          </button>

          <button 
            onClick={() => window.location.href = '/'}
            style={{
              padding: "0.8rem 1.5rem",
              backgroundColor: "white",
              color: "var(--primary-dark, #1e293b)",
              border: "1px solid #cbd5e1",
              borderRadius: "8px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.2s"
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#f1f5f9"}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = "white"}
          >
            Kembali ke Beranda
          </button>
        </div>
      </div>
    </div>
  );
}

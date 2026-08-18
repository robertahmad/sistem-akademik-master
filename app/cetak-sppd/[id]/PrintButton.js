"use client";
import { useEffect } from "react";

export default function PrintButton() {
  useEffect(() => {
    const timer = setTimeout(() => {
      window.print();
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <button 
      className="no-print"
      style={{ position: "fixed", bottom: "2rem", right: "2rem", padding: "1rem 2rem", background: "#000", color: "#fff", border: "none", borderRadius: "8px", fontSize: "1.2rem", cursor: "pointer", boxShadow: "0 4px 6px rgba(0,0,0,0.2)" }}
      onClick={() => window.print()}
    >
      Cetak SPPD
    </button>
  );
}

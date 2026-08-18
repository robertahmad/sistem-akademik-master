"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginAlumni } from "@/app/actions/alumni";

export default function AlumniLogin() {
  const router = useRouter();
  const [nisn, setNisn] = useState("");
  const [tanggalLahir, setTanggalLahir] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await loginAlumni(nisn, tanggalLahir);
    if (res.success) {
      router.push("/portal/alumni");
    } else {
      setError(res.error || "Gagal login.");
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc" }}>
      <div style={{ background: "#fff", padding: "2rem", borderRadius: "10px", boxShadow: "0 4px 6px rgba(0,0,0,0.1)", width: "100%", maxWidth: "400px" }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <h2 style={{ margin: "0 0 0.5rem 0", color: "#1e293b" }}>Portal Alumni</h2>
          <p style={{ margin: 0, color: "#64748b", fontSize: "0.9rem" }}>Pusat Layanan Dokumen Lulusan</p>
        </div>

        {error && (
          <div style={{ padding: "0.75rem", background: "#fee2e2", color: "#991b1b", borderRadius: "6px", marginBottom: "1rem", fontSize: "0.85rem", border: "1px solid #f87171" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem", color: "#334155", fontWeight: 500 }}>NISN</label>
            <input 
              type="text" 
              value={nisn}
              onChange={(e) => setNisn(e.target.value)}
              placeholder="Masukkan NISN Anda"
              required
              style={{ width: "100%", padding: "0.75rem", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "1rem", outline: "none", boxSizing: "border-box" }}
            />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem", color: "#334155", fontWeight: 500 }}>Tanggal Lahir</label>
            <input 
              type="text" 
              value={tanggalLahir}
              onChange={(e) => setTanggalLahir(e.target.value)}
              placeholder="Contoh: 15 Agustus 2005"
              required
              style={{ width: "100%", padding: "0.75rem", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "1rem", outline: "none", boxSizing: "border-box" }}
            />
            <small style={{ display: "block", marginTop: "0.25rem", color: "#94a3b8", fontSize: "0.75rem" }}>Format tulisan menyesuaikan dengan ijazah / buku induk.</small>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            style={{ 
              marginTop: "0.5rem", width: "100%", padding: "0.75rem", background: "#0f172a", color: "#fff", 
              border: "none", borderRadius: "6px", fontSize: "1rem", fontWeight: 600, cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? "Memeriksa Data..." : "Masuk"}
          </button>
        </form>
        
        <div style={{ marginTop: "2rem", textAlign: "center" }}>
          <a href="/" style={{ color: "#3b82f6", textDecoration: "none", fontSize: "0.85rem" }}>&larr; Kembali ke Beranda</a>
        </div>
      </div>
    </div>
  );
}

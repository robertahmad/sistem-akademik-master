"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAlumniSession, submitTracerStudy, logoutAlumni } from "@/app/actions/alumni";

export default function AlumniDashboard() {
  const router = useRouter();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showTracerForm, setShowTracerForm] = useState(false);

  // Tracer Form State
  const [status, setStatus] = useState("BEKERJA");
  const [instansi, setInstansi] = useState("");
  const [jabatan, setJabatan] = useState("");
  const [tahunLulus, setTahunLulus] = useState("");
  const [savingTracer, setSavingTracer] = useState(false);

  useEffect(() => {
    async function loadSession() {
      const data = await getAlumniSession();
      if (!data) {
        router.push("/portal/alumni/login");
        return;
      }
      setStudent(data);
      
      // Jika belum mengisi tracer study, wajib isi dulu
      if (!data.tracerStudy) {
        setShowTracerForm(true);
      }
      setLoading(false);
    }
    loadSession();
  }, [router]);

  const handleTracerSubmit = async (e) => {
    e.preventDefault();
    setSavingTracer(true);
    const res = await submitTracerStudy({ status, instansi, jabatan, tahunLulus });
    if (res.success) {
      alert("Terima kasih telah mengisi Tracer Study!");
      setShowTracerForm(false);
      const data = await getAlumniSession(); // Reload data
      setStudent(data);
    } else {
      alert(res.error || "Gagal menyimpan tracer study.");
    }
    setSavingTracer(false);
  };

  const handleLogout = async () => {
    await logoutAlumni();
  };

  if (loading) {
    return <div style={{ padding: "2rem", textAlign: "center" }}>Memuat data alumni...</div>;
  }

  // --- KOMPONEN TRACER STUDY (WAJIB ISI) ---
  if (showTracerForm) {
    return (
      <div style={{ minHeight: "100vh", background: "#f8fafc", padding: "2rem" }}>
        <div style={{ maxWidth: "500px", margin: "0 auto", background: "#fff", padding: "2rem", borderRadius: "10px", boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }}>
          <h2 style={{ margin: "0 0 1rem 0", color: "#1e293b", textAlign: "center" }}>Tracer Study Alumni</h2>
          <div style={{ background: "#fef3c7", color: "#92400e", padding: "1rem", borderRadius: "6px", marginBottom: "1.5rem", fontSize: "0.85rem", border: "1px solid #fcd34d" }}>
            <strong>Mohon Perhatian:</strong> Anda wajib mengisi data penelusuran alumni ini untuk membantu proses Akreditasi Sekolah sebelum dapat mengunduh dokumen legal.
          </div>
          
          <form onSubmit={handleTracerSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem", fontWeight: 500 }}>Tahun Lulus</label>
              <input type="text" required value={tahunLulus} onChange={e => setTahunLulus(e.target.value)} placeholder="Contoh: 2026" style={inputStyle} />
            </div>
            
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem", fontWeight: 500 }}>Status Saat Ini</label>
              <select required value={status} onChange={e => setStatus(e.target.value)} style={inputStyle}>
                <option value="BEKERJA">Bekerja</option>
                <option value="KULIAH">Melanjutkan Kuliah</option>
                <option value="WIRAUSAHA">Berwirausaha</option>
                <option value="MENCARI_KERJA">Belum / Sedang Mencari Kerja</option>
              </select>
            </div>

            {status !== "MENCARI_KERJA" && (
              <>
                <div>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem", fontWeight: 500 }}>
                    {status === "KULIAH" ? "Nama Perguruan Tinggi" : status === "WIRAUSAHA" ? "Nama Usaha" : "Nama Perusahaan / Tempat Kerja"}
                  </label>
                  <input type="text" required value={instansi} onChange={e => setInstansi(e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem", fontWeight: 500 }}>
                    {status === "KULIAH" ? "Jurusan / Program Studi" : status === "WIRAUSAHA" ? "Bidang Usaha" : "Jabatan / Posisi"}
                  </label>
                  <input type="text" required value={jabatan} onChange={e => setJabatan(e.target.value)} style={inputStyle} />
                </div>
              </>
            )}

            <button type="submit" disabled={savingTracer} style={{ ...btnStyle, background: "#0f172a", marginTop: "1rem" }}>
              {savingTracer ? "Menyimpan..." : "Simpan Data & Lanjutkan"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- KOMPONEN DASBOR ALUMNI (DOKUMEN) ---
  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
      {/* Header */}
      <header style={{ background: "#fff", padding: "1rem 2rem", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e2e8f0" }}>
        <h2 style={{ margin: 0, color: "#1e293b", fontSize: "1.25rem" }}>Portal Layanan Alumni</h2>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <span style={{ fontSize: "0.9rem", color: "#64748b", fontWeight: 500 }}>Hi, {student.name}</span>
          <button onClick={handleLogout} style={{ padding: "0.5rem 1rem", background: "#fee2e2", color: "#991b1b", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: 600, fontSize: "0.85rem" }}>Keluar</button>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: "900px", margin: "2rem auto", padding: "0 1rem" }}>
        
        <div style={{ background: "#fff", padding: "2rem", borderRadius: "10px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", marginBottom: "2rem" }}>
          <h3 style={{ margin: "0 0 1rem 0", color: "#0f172a" }}>Pusat Unduh Dokumen Legal</h3>
          <p style={{ color: "#64748b", marginBottom: "1.5rem", fontSize: "0.95rem", lineHeight: "1.5" }}>
            Seluruh dokumen di bawah ini adalah salinan digital resmi yang dihasilkan dari basis data sekolah. Dokumen dilengkapi dengan <strong>Tanda Tangan Elektronik (QR Code)</strong> dari Kepala Sekolah yang dapat dipindai untuk memverifikasi keasliannya.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
            <DocumentCard 
              title="Buku Induk Siswa" 
              desc="Berisi biodata lengkap selama menjadi siswa."
              link={`/cetak-alumni/buku-induk/${student.nisn}`}
              icon="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
            />
            <DocumentCard 
              title="Transkrip Nilai" 
              desc="Rangkuman nilai akhir dari Semester 1 hingga 6."
              link={`/cetak-alumni/transkrip/${student.nisn}`}
              icon="M9 17v1a3 3 0 106 0v-1m-6 0a3 3 0 006 0m-6 0h6m-6-4h.01M9 10h.01M15 13h.01M15 10h.01M12 21a9 9 0 110-18 9 9 0 010 18z"
            />
            <DocumentCard 
              title="Surat Keterangan Lulus (SKL)" 
              desc="Surat pernyataan kelulusan resmi sementara."
              link={`/cetak-alumni/skl/${student.nisn}`}
              icon="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
            <DocumentCard 
              title="Surat Keterangan Nilai Rapor" 
              desc="Dokumen pendamping ijazah (SKNR)."
              link={`/cetak-alumni/sknr/${student.nisn}`}
              icon="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
            />
          </div>
        </div>

      </main>
    </div>
  );
}

const inputStyle = { width: "100%", padding: "0.75rem", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.95rem", outline: "none", boxSizing: "border-box" };
const btnStyle = { width: "100%", padding: "0.75rem", color: "#fff", border: "none", borderRadius: "6px", fontSize: "1rem", fontWeight: 600, cursor: "pointer" };

function DocumentCard({ title, desc, link, icon }) {
  return (
    <div style={{ border: "1px solid #e2e8f0", borderRadius: "8px", padding: "1.25rem", display: "flex", flexDirection: "column", gap: "0.75rem", background: "#f8fafc" }}>
      <svg width="28" height="28" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <path d={icon}></path>
      </svg>
      <h4 style={{ margin: 0, color: "#1e293b", fontSize: "1rem" }}>{title}</h4>
      <p style={{ margin: 0, color: "#64748b", fontSize: "0.85rem", lineHeight: "1.4", flexGrow: 1 }}>{desc}</p>
      <a href={link} target="_blank" style={{ display: "inline-block", textAlign: "center", padding: "0.5rem", background: "#e0e7ff", color: "#4f46e5", textDecoration: "none", borderRadius: "6px", fontWeight: 600, fontSize: "0.85rem", marginTop: "0.5rem" }}>
        Cetak Dokumen
      </a>
    </div>
  );
}

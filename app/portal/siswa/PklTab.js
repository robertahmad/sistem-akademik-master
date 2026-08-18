"use client";

import React, { useState, useEffect, useRef } from "react";
import { getStudentPlacement, saveStudentJournal } from "../../actions/pkl";
import { getSchoolProfile } from "../../actions/settings";
import { QRCodeSVG } from "qrcode.react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export default function PklTab({ session }) {
  const [placement, setPlacement] = useState(null);
  const [school, setSchool] = useState(null);
  const [loading, setLoading] = useState(true);

  // Form State
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [activity, setActivity] = useState("");
  const [image, setImage] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const certRef = useRef(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [resPlacement, resSchool] = await Promise.all([
      getStudentPlacement(),
      getSchoolProfile()
    ]);
    if (resPlacement.success && resPlacement.placement) setPlacement(resPlacement.placement);
    if (resSchool.success) setSchool(resSchool.school);
    setLoading(false);
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!image) {
      alert("Harap unggah foto bukti kegiatan PKL Anda!");
      return;
    }
    setSubmitting(true);
    
    const formData = new FormData();
    formData.append("placementId", placement.id);
    formData.append("date", date);
    formData.append("activity", activity);
    formData.append("image", image);

    const res = await saveStudentJournal(formData);
    if (res.success) {
      alert("Jurnal harian berhasil disimpan! Menunggu validasi dari Guru.");
      setActivity("");
      setImage(null);
      fetchData(); // Refresh data
    } else {
      alert("Gagal menyimpan jurnal: " + res.error);
    }
    setSubmitting(false);
  };

  const handleDownloadPDF = async () => {
    if (!certRef.current) return;
    
    setDownloading(true);
    try {
      certRef.current.style.display = "block"; // temporarily show it to render
      
      const canvas = await html2canvas(certRef.current, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL("image/png");
      
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4" // 297 x 210 mm
      });
      
      pdf.addImage(imgData, "PNG", 0, 0, 297, 210);
      pdf.save(`Sertifikat_PKL_${session.name.replace(/\s+/g, "_")}.pdf`);
      
    } catch (error) {
      console.error(error);
      alert("Gagal membuat PDF.");
    } finally {
      certRef.current.style.display = "none";
      setDownloading(false);
    }
  };

  if (loading) return <p>Loading data PKL...</p>;

  if (!placement) {
    return (
      <div style={{ padding: "2rem", textAlign: "center", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
        <span style={{ fontSize: "3rem", display: "block", marginBottom: "1rem" }}>🏢</span>
        <h2 style={{ fontSize: "1.5rem", color: "#1e293b", marginBottom: "0.5rem" }}>Belum Ada Penempatan PKL</h2>
        <p style={{ color: "#64748b" }}>Anda belum terdaftar atau belum di-plotting ke tempat Prakerin (PKL) manapun. Silakan hubungi Guru Pembimbing atau pihak Hubin sekolah.</p>
      </div>
    );
  }

  const isLulus = placement.grade && placement.grade.finalScore >= 70;
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const verifyUrl = `${baseUrl}/verify/pkl/${placement.id}`;

  return (
    <div style={{ padding: "1rem" }}>
      <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#1e293b", marginBottom: "1rem" }}>E-Jurnal PKL</h2>
      
      {/* Informasi Penempatan */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "1.5rem", background: "linear-gradient(to right, #2563eb, #1d4ed8)", padding: "1.5rem", borderRadius: "12px", color: "white", marginBottom: "2rem", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}>
        <div style={{ flex: 1, minWidth: "200px" }}>
          <p style={{ margin: 0, fontSize: "0.85rem", opacity: 0.9 }}>Tempat PKL</p>
          <h3 style={{ margin: "0.2rem 0", fontSize: "1.3rem" }}>{placement.dudi?.name}</h3>
          <p style={{ margin: 0, fontSize: "0.85rem", opacity: 0.8 }}>{placement.dudi?.address}</p>
        </div>
        <div style={{ flex: 1, minWidth: "200px", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
           <div>
             <p style={{ margin: 0, fontSize: "0.75rem", opacity: 0.9 }}>Guru Pembimbing</p>
             <div style={{ fontWeight: "bold" }}>{placement.teacherName}</div>
           </div>
           <div>
             <p style={{ margin: 0, fontSize: "0.75rem", opacity: 0.9 }}>Pembimbing Industri</p>
             <div style={{ fontWeight: "bold" }}>{placement.dudi?.mentorName || "-"}</div>
           </div>
        </div>
        <div style={{ flex: 1, minWidth: "200px", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
           <div>
             <p style={{ margin: 0, fontSize: "0.75rem", opacity: 0.9 }}>Nilai Akhir</p>
             {placement.grade ? (
               <div style={{ fontWeight: "bold", fontSize: "1.2rem", color: isLulus ? "#4ade80" : "#facc15" }}>
                 {placement.grade.finalScore} / 100
               </div>
             ) : (
               <div style={{ fontSize: "0.85rem", fontStyle: "italic" }}>Belum Dinilai</div>
             )}
           </div>
           <div>
             <p style={{ margin: 0, fontSize: "0.75rem", opacity: 0.9 }}>Periode</p>
             <div style={{ fontWeight: "bold", fontSize: "0.9rem" }}>{new Date(placement.startDate).toLocaleDateString()} - {new Date(placement.endDate).toLocaleDateString()}</div>
           </div>
        </div>
        
        {isLulus && (
          <div style={{ flex: 1, minWidth: "200px", display: "flex", alignItems: "center" }}>
            <button 
              onClick={handleDownloadPDF}
              disabled={downloading}
              style={{ width: "100%", background: "white", color: "#1d4ed8", padding: "0.75rem", borderRadius: "6px", fontWeight: "bold", border: "none", cursor: downloading ? "not-allowed" : "pointer" }}
            >
              {downloading ? "Menyiapkan PDF..." : "📄 Unduh E-Sertifikat PKL"}
            </button>
          </div>
        )}
      </div>

      {/* HIDDEN CERTIFICATE COMPONENT */}
      {isLulus && school && (
        <div 
          ref={certRef}
          style={{
            display: "none", // Hidden from screen
            width: "1122px", // A4 Landscape pixels at 96 DPI
            height: "794px", 
            background: "white",
            position: "absolute",
            left: "-9999px",
            top: 0,
            padding: "40px",
            boxSizing: "border-box",
            fontFamily: "Arial, sans-serif"
          }}
        >
          {/* Modern Minimalist Design Frame */}
          <div style={{
            width: "100%", height: "100%", border: "2px solid #e2e8f0", position: "relative",
            background: "radial-gradient(circle at top right, #f8fafc, white)"
          }}>
            {/* Decorations */}
            <div style={{ position: "absolute", top: 0, left: 0, width: "150px", height: "150px", background: "#f1f5f9", clipPath: "polygon(0 0, 100% 0, 0 100%)" }} />
            <div style={{ position: "absolute", bottom: 0, right: 0, width: "200px", height: "200px", background: "#f1f5f9", clipPath: "polygon(100% 100%, 0 100%, 100% 0)" }} />
            
            <div style={{ padding: "60px 80px", textAlign: "center", position: "relative", zIndex: 10 }}>
              <h1 style={{ fontSize: "2.5rem", color: "#0f172a", margin: "0 0 10px 0", letterSpacing: "2px", textTransform: "uppercase" }}>Sertifikat Praktik Kerja Lapangan</h1>
              <p style={{ fontSize: "1.1rem", color: "#64748b", margin: 0, textTransform: "uppercase", letterSpacing: "1px" }}>Nomor: {placement.id.split('-')[0].toUpperCase()}/PKL/SMK-AQ/{new Date(placement.endDate).getFullYear()}</p>
              
              <div style={{ margin: "50px 0" }}>
                <p style={{ fontSize: "1.2rem", color: "#475569", marginBottom: "15px" }}>Diberikan kepada:</p>
                <h2 style={{ fontSize: "3rem", color: "#1e293b", margin: 0, borderBottom: "2px solid #cbd5e1", display: "inline-block", paddingBottom: "10px" }}>{session.name}</h2>
                <p style={{ fontSize: "1.2rem", color: "#475569", marginTop: "15px" }}>NISN: {session.nisn}</p>
              </div>
              
              <p style={{ fontSize: "1.2rem", color: "#475569", lineHeight: "1.6", maxWidth: "800px", margin: "0 auto" }}>
                Telah menyelesaikan program Praktik Kerja Lapangan (PKL) di <strong>{placement.dudi.name}</strong> 
                <br/>sejak tanggal {new Date(placement.startDate).toLocaleDateString("id-ID")} sampai dengan {new Date(placement.endDate).toLocaleDateString("id-ID")} dan dinyatakan:
              </p>
              
              <h3 style={{ fontSize: "2.5rem", color: "#16a34a", margin: "30px 0" }}>"LULUS"</h3>
              
              {/* Tanda Tangan */}
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "60px", padding: "0 50px" }}>
                <div style={{ textAlign: "center", width: "250px" }}>
                  <p style={{ margin: "0 0 10px 0", color: "#475569" }}>Kepala Sekolah</p>
                  {school.kepsekSignature ? (
                     <img src={school.kepsekSignature} alt="Tanda Tangan Kepsek" style={{ height: "80px", objectFit: "contain", margin: "10px 0" }} crossOrigin="anonymous" />
                  ) : (
                     <div style={{ height: "80px" }}></div>
                  )}
                  <p style={{ margin: "0", fontWeight: "bold", borderBottom: "1px solid #cbd5e1", paddingBottom: "5px" }}>{school.kepsek}</p>
                  <p style={{ margin: "5px 0 0 0", fontSize: "0.9rem", color: "#64748b" }}>NIP. {school.kepsekNip}</p>
                </div>
                
                {/* QR Code */}
                <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <QRCodeSVG value={verifyUrl} size={100} />
                  <p style={{ margin: "10px 0 0 0", fontSize: "0.8rem", color: "#94a3b8" }}>Scan untuk Verifikasi</p>
                </div>
                
                <div style={{ textAlign: "center", width: "250px" }}>
                  <p style={{ margin: "0 0 10px 0", color: "#475569" }}>Pimpinan Industri</p>
                  {placement.dudi.signature ? (
                     <img src={placement.dudi.signature} alt="Tanda Tangan DUDI" style={{ height: "80px", objectFit: "contain", margin: "10px 0" }} crossOrigin="anonymous" />
                  ) : (
                     <div style={{ height: "80px" }}></div>
                  )}
                  <p style={{ margin: "0", fontWeight: "bold", borderBottom: "1px solid #cbd5e1", paddingBottom: "5px" }}>{placement.dudi.leaderName || placement.dudi.mentorName || "-"}</p>
                  <p style={{ margin: "5px 0 0 0", fontSize: "0.9rem", color: "#64748b" }}>{placement.dudi.name}</p>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "2rem" }}>
        
        {/* Form Isi Jurnal */}
        <div style={{ background: "#fff", padding: "1.5rem", borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)", height: "fit-content" }}>
          <h3 style={{ marginBottom: "1.5rem", color: "#0f172a", fontSize: "1.1rem", borderBottom: "1px solid #e2e8f0", paddingBottom: "0.75rem" }}>Buat Laporan Baru</h3>
          
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold", fontSize: "0.9rem", color: "#334155" }}>Tanggal Kegiatan</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className="form-input" style={{ width: "100%", padding: "0.6rem", borderRadius: "6px", border: "1px solid #cbd5e1" }} required />
            </div>
            
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold", fontSize: "0.9rem", color: "#334155" }}>Uraian Pekerjaan / Kegiatan</label>
              <textarea 
                value={activity} 
                onChange={e => setActivity(e.target.value)} 
                className="form-input" 
                rows="4" 
                placeholder="Contoh: Merakit komputer server di lab industri, menyambungkan kabel UTP, dll..." 
                style={{ width: "100%", padding: "0.6rem", borderRadius: "6px", border: "1px solid #cbd5e1", resize: "vertical" }} 
                required 
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold", fontSize: "0.9rem", color: "#334155" }}>Foto Bukti (Wajib)</label>
              <input type="file" accept="image/*" onChange={handleImageChange} style={{ width: "100%", padding: "0.5rem", background: "#f8fafc", border: "1px dashed #cbd5e1", borderRadius: "6px" }} required />
              <p style={{ margin: "0.5rem 0 0 0", fontSize: "0.75rem", color: "#64748b" }}>Unggah foto Anda saat sedang bekerja di tempat PKL.</p>
            </div>

            <button type="submit" disabled={submitting} style={{ background: "#2563eb", color: "white", padding: "0.75rem", borderRadius: "6px", fontWeight: "bold", border: "none", cursor: submitting ? "not-allowed" : "pointer", marginTop: "0.5rem" }}>
              {submitting ? "Menyimpan..." : "Kirim Jurnal Harian"}
            </button>
          </form>
        </div>

        {/* Riwayat Jurnal */}
        <div>
          <h3 style={{ marginBottom: "1.5rem", color: "#0f172a", fontSize: "1.1rem" }}>Riwayat Jurnal Harian Anda</h3>
          
          {placement.journals.length === 0 ? (
            <div style={{ padding: "2rem", textAlign: "center", background: "#f8fafc", borderRadius: "8px", border: "1px dashed #cbd5e1", color: "#64748b" }}>
              Anda belum membuat jurnal harian apapun.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {placement.journals.map((j) => (
                <div key={j.id} style={{ display: "flex", gap: "1rem", background: "#fff", padding: "1rem", borderRadius: "8px", border: "1px solid #e2e8f0", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                  {j.imagePath ? (
                    <img src={j.imagePath} alt="Bukti Jurnal" style={{ width: "100px", height: "100px", objectFit: "cover", borderRadius: "6px", border: "1px solid #e2e8f0" }} />
                  ) : (
                    <div style={{ width: "100px", height: "100px", background: "#f1f5f9", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", fontSize: "0.8rem", textAlign: "center" }}>Tanpa Foto</div>
                  )}
                  
                  <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                      <span style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: "500" }}>{j.date}</span>
                      <span style={{ 
                        fontSize: "0.75rem", 
                        fontWeight: "bold", 
                        padding: "0.2rem 0.6rem", 
                        borderRadius: "50px", 
                        background: j.status === 'APPROVED' ? '#dcfce7' : j.status === 'REJECTED' ? '#fee2e2' : '#fef9c3',
                        color: j.status === 'APPROVED' ? '#16a34a' : j.status === 'REJECTED' ? '#ef4444' : '#a16207'
                      }}>
                        {j.status}
                      </span>
                    </div>
                    <p style={{ margin: 0, color: "#334155", fontSize: "0.95rem", lineHeight: "1.4", flex: 1 }}>{j.activity}</p>
                    
                    {j.feedback && (
                      <div style={{ marginTop: "0.75rem", background: "#f8fafc", padding: "0.6rem", borderRadius: "6px", borderLeft: "3px solid #3b82f6", fontSize: "0.85rem" }}>
                        <strong style={{ color: "#1d4ed8" }}>Catatan Guru:</strong> {j.feedback}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

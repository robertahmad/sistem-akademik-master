"use client";
import React, { useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export default function PklCertificateModal({ placement, school, onClose }) {
  const certRef = useRef(null);
  const [downloading, setDownloading] = useState(false);
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const verifyUrl = `${baseUrl}/verify/pkl/${placement.id}`;
  const logoSrc = (school?.logo && school.logo !== "??" && school.logo !== "") ? school.logo : "/logo-generic.svg";

  const handleDownloadPDF = async () => {
    if (!certRef.current) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(certRef.current, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      pdf.addImage(imgData, "PNG", 0, 0, 297, 210);
      pdf.save(`Sertifikat_PKL_${placement.student.name.replace(/\s+/g, "_")}.pdf`);
    } catch (error) {
      console.error(error);
      alert("Gagal membuat PDF.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.7)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999, padding: "2rem" }}>
      <div style={{ background: "white", borderRadius: "8px", overflow: "hidden", display: "flex", flexDirection: "column", maxHeight: "100%", maxWidth: "100%" }}>
        
        {/* Header Modal */}
        <div style={{ padding: "1rem", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc" }}>
           <h3 style={{ margin: 0 }}>Preview Sertifikat PKL - {placement.student.name}</h3>
           <div style={{ display: "flex", gap: "1rem" }}>
             <button onClick={handleDownloadPDF} disabled={downloading} style={{ background: "#2563eb", color: "white", padding: "0.5rem 1rem", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>
               {downloading ? "Memproses..." : "Unduh PDF"}
             </button>
             <button onClick={onClose} style={{ background: "#ef4444", color: "white", padding: "0.5rem 1rem", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>Tutup</button>
           </div>
        </div>

        {/* Scaled Preview Container */}
        <div style={{ padding: "2rem", overflow: "auto", background: "#cbd5e1", flex: 1, display: "flex", justifyContent: "center", alignItems: "flex-start" }}>
           <div 
             ref={certRef}
             style={{
                width: "1122px", height: "794px", background: "white",
                padding: "40px", boxSizing: "border-box", fontFamily: "Arial, sans-serif",
                transform: "scale(0.7)", transformOrigin: "top center",
                boxShadow: "0 10px 25px rgba(0,0,0,0.2)"
             }}
           >
              {/* Modern Minimalist Design Frame */}
              <div style={{ width: "100%", height: "100%", border: "2px solid #e2e8f0", position: "relative", background: "radial-gradient(circle at top right, #f8fafc, white)", overflow: "hidden" }}>
                 {/* Geometric Ornaments */}
                 <div style={{ position: "absolute", top: 0, left: 0, width: "150px", height: "150px", background: "#f1f5f9", clipPath: "polygon(0 0, 100% 0, 0 100%)", zIndex: 1 }} />
                 <div style={{ position: "absolute", bottom: 0, right: 0, width: "200px", height: "200px", background: "#f1f5f9", clipPath: "polygon(100% 100%, 0 100%, 100% 0)", zIndex: 1 }} />
                 
                 {/* Latar Belakang Teks Watermark Berulang (Padat) */}
                 <div style={{ position: "absolute", top: "-50%", left: "-50%", width: "200%", height: "200%", backgroundImage: `url("data:image/svg+xml,%3Csvg width='410' height='30' xmlns='http://www.w3.org/2000/svg'%3E%3Ctext x='0' y='22' font-family='Times New Roman, serif' font-size='24' font-weight='bold' fill='rgba(0,0,0,0.03)'%3ESEKOLAH MASTER DEMO KOTA DEMO%26%23160%3B%26%23160%3B%3C/text%3E%3C/svg%3E")`, backgroundRepeat: "repeat", transform: "rotate(-35deg)", pointerEvents: "none", zIndex: 1 }} />
                 
                 {/* Watermark Logo */}
                 <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "450px", height: "450px", backgroundImage: `url('${logoSrc}')`, backgroundRepeat: "no-repeat", backgroundPosition: "center", backgroundSize: "contain", opacity: 0.05, pointerEvents: "none", zIndex: 2 }} />
                 
                 <div style={{ padding: "50px 80px", textAlign: "center", position: "relative", zIndex: 10 }}>
                    <h1 style={{ fontSize: "2.5rem", color: "#0f172a", margin: "0 0 10px 0", letterSpacing: "2px", textTransform: "uppercase" }}>Sertifikat Praktik Kerja Lapangan</h1>
                    <p style={{ fontSize: "1.1rem", color: "#64748b", margin: 0, textTransform: "uppercase", letterSpacing: "1px" }}>Nomor: {placement.id.split('-')[0].toUpperCase()}/PKL/SMK-AQ/{new Date(placement.endDate).getFullYear()}</p>
                    
                    <div style={{ margin: "30px 0" }}>
                      <p style={{ fontSize: "1.2rem", color: "#475569", marginBottom: "15px" }}>Diberikan kepada:</p>
                      <h2 style={{ fontSize: "3rem", color: "#1e293b", margin: 0, borderBottom: "2px solid #cbd5e1", display: "inline-block", paddingBottom: "10px" }}>{placement.student.name}</h2>
                      <p style={{ fontSize: "1.2rem", color: "#475569", marginTop: "15px" }}>NISN: {placement.student.nisn}</p>
                    </div>
                    
                    <p style={{ fontSize: "1.2rem", color: "#475569", lineHeight: "1.6", maxWidth: "800px", margin: "0 auto" }}>
                      Telah menyelesaikan program Praktik Kerja Lapangan (PKL) di <strong>{placement.dudi.name}</strong> 
                      <br/>sejak tanggal {new Date(placement.startDate).toLocaleDateString("id-ID")} sampai dengan {new Date(placement.endDate).toLocaleDateString("id-ID")} dan dinyatakan:
                    </p>
                    
                    <h3 style={{ fontSize: "2.5rem", color: "#16a34a", margin: "20px 0" }}>"LULUS"</h3>
                    
                    {/* Tanda Tangan */}
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: "35px", padding: "0 50px" }}>
                      <div style={{ textAlign: "center", width: "250px" }}>
                        <p style={{ margin: "0 0 10px 0", color: "#475569" }}>Kepala Sekolah</p>
                        {school?.kepsekSignature ? (
                           <img src={school.kepsekSignature} alt="TTD Kepsek" style={{ height: "80px", objectFit: "contain", margin: "10px 0" }} crossOrigin="anonymous" />
                        ) : <div style={{ height: "80px" }}></div>}
                        <p style={{ margin: "0", fontWeight: "bold", borderBottom: "1px solid #cbd5e1", paddingBottom: "5px" }}>{school?.kepsek}</p>
                        <p style={{ margin: "5px 0 0 0", fontSize: "0.9rem", color: "#64748b" }}>NIP. {school?.kepsekNip}</p>
                      </div>
                      
                      <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
                        <QRCodeSVG value={verifyUrl} size={100} />
                        <p style={{ margin: "10px 0 0 0", fontSize: "0.8rem", color: "#94a3b8" }}>Scan untuk Verifikasi</p>
                      </div>
                      
                      <div style={{ textAlign: "center", width: "250px" }}>
                        <p style={{ margin: "0 0 10px 0", color: "#475569" }}>Pimpinan Industri</p>
                        {placement.dudi.signature ? (
                           <img src={placement.dudi.signature} alt="TTD DUDI" style={{ height: "80px", objectFit: "contain", margin: "10px 0" }} crossOrigin="anonymous" />
                        ) : <div style={{ height: "80px" }}></div>}
                        <p style={{ margin: "0", fontWeight: "bold", borderBottom: "1px solid #cbd5e1", paddingBottom: "5px" }}>{placement.dudi.leaderName || placement.dudi.mentorName || "-"}</p>
                        <p style={{ margin: "5px 0 0 0", fontSize: "0.9rem", color: "#64748b" }}>{placement.dudi.name}</p>
                      </div>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

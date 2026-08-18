"use client";

import React, { useState, useEffect, useRef } from "react";
import { getStudentUkkExams } from "../../actions/ukk";
import { getSchoolProfile } from "../../actions/settings";
import { QRCodeSVG } from "qrcode.react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export default function UkkTab({ session }) {
  const [exams, setExams] = useState([]);
  const [school, setSchool] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);

  const certRefs = useRef({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [resExams, resSchool] = await Promise.all([
      getStudentUkkExams(),
      getSchoolProfile()
    ]);
    if (resExams.success) setExams(resExams.exams);
    if (resSchool.success) setSchool(resSchool.school);
    setLoading(false);
  };

  const handleDownloadPDF = async (examId, title) => {
    const certElement = certRefs.current[examId];
    if (!certElement) return;
    
    setDownloadingId(examId);
    try {
      certElement.style.display = "block"; // temporarily show it to render
      
      const canvas = await html2canvas(certElement, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL("image/png");
      
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4" // 297 x 210 mm
      });
      
      pdf.addImage(imgData, "PNG", 0, 0, 297, 210);
      pdf.save(`Sertifikat_UKK_${title.replace(/\s+/g, "_")}.pdf`);
      
    } catch (error) {
      console.error(error);
      alert("Gagal membuat PDF.");
    } finally {
      certElement.style.display = "none";
      setDownloadingId(null);
    }
  };

  if (loading) return <p>Loading data UKK...</p>;

  if (exams.length === 0) {
    return (
      <div style={{ padding: "2rem", textAlign: "center", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
        <span style={{ fontSize: "3rem", display: "block", marginBottom: "1rem" }}>🎓</span>
        <h2 style={{ fontSize: "1.5rem", color: "#1e293b", marginBottom: "0.5rem" }}>Belum Ada Jadwal UKK</h2>
        <p style={{ color: "#64748b" }}>Anda belum dijadwalkan untuk mengikuti Uji Kompetensi Keahlian (Sertifikasi).</p>
      </div>
    );
  }

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

  return (
    <div style={{ padding: "1rem" }}>
      <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#1e293b", marginBottom: "1rem" }}>Sertifikasi & Uji Kompetensi Keahlian (UKK)</h2>
      <p style={{ color: "#64748b", marginBottom: "2rem" }}>Berikut adalah daftar skema sertifikasi yang Anda ikuti beserta hasil penilaian praktik dari asesor.</p>
      
      <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
        {exams.map(exam => {
          const isLulus = exam.status === "DINILAI" && exam.finalScore >= 70;
          const verifyUrl = `${baseUrl}/verify/ukk/${exam.id}`;

          return (
          <div key={exam.id} style={{ background: "white", borderRadius: "12px", border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }}>
             
             {/* HEADER */}
             <div style={{ background: "linear-gradient(to right, #0f172a, #1e293b)", padding: "1.5rem", color: "white", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
                <div>
                  <h3 style={{ margin: "0 0 0.5rem 0", fontSize: "1.5rem" }}>{exam.scheme.title}</h3>
                  <p style={{ margin: 0, fontSize: "0.95rem", opacity: 0.8 }}>Jurusan: {exam.scheme.jurusan}</p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span style={{ display: "block", fontSize: "0.85rem", opacity: 0.8, marginBottom: "0.25rem" }}>Tanggal Ujian Praktik</span>
                  <strong style={{ fontSize: "1.1rem" }}>{new Date(exam.examDate).toLocaleDateString("id-ID", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong>
                </div>
             </div>

             {/* BODY */}
             <div style={{ padding: "1.5rem" }}>
                <div style={{ display: "flex", gap: "2rem", marginBottom: "2rem", flexWrap: "wrap" }}>
                   <div style={{ flex: 1, minWidth: "200px" }}>
                      <span style={{ display: "block", fontSize: "0.85rem", color: "#64748b", marginBottom: "0.25rem" }}>Asesor / Penguji</span>
                      <strong style={{ fontSize: "1.1rem", color: "#0f172a" }}>{exam.assessor?.name || "Asesor Internal"}</strong>
                      {exam.assessor?.company && <span style={{ display: "block", fontSize: "0.85rem", color: "#64748b" }}>{exam.assessor.company}</span>}
                   </div>
                   
                   <div style={{ flex: 1, minWidth: "200px", background: exam.status === "DINILAI" ? "#f0fdf4" : "#fffbeb", padding: "1rem", borderRadius: "8px", border: `1px solid ${exam.status === "DINILAI" ? "#bbf7d0" : "#fef08a"}`, textAlign: "center" }}>
                      <span style={{ display: "block", fontSize: "0.85rem", color: exam.status === "DINILAI" ? "#16a34a" : "#b45309", marginBottom: "0.25rem", fontWeight: "bold" }}>Status Ujian</span>
                      {exam.status === "DINILAI" ? (
                        <>
                          <h4 style={{ margin: 0, fontSize: "1.5rem", color: "#15803d" }}>{exam.predikat}</h4>
                          <span style={{ display: "block", marginTop: "0.25rem", fontSize: "0.9rem", color: "#16a34a" }}>Skor Akhir: <strong>{exam.finalScore} / 100</strong></span>
                        </>
                      ) : (
                        <h4 style={{ margin: 0, fontSize: "1.2rem", color: "#d97706" }}>Menunggu Penilaian</h4>
                      )}
                   </div>
                   
                   {/* TOMBOL UNDUH */}
                   {isLulus && (
                     <div style={{ flex: 1, minWidth: "200px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <button 
                          onClick={() => handleDownloadPDF(exam.id, exam.scheme.title)}
                          disabled={downloadingId === exam.id}
                          style={{ background: "#2563eb", color: "white", padding: "1rem 2rem", borderRadius: "8px", fontWeight: "bold", border: "none", cursor: downloadingId === exam.id ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: "0.5rem" }}
                        >
                          {downloadingId === exam.id ? "Menyiapkan PDF..." : "📄 Unduh E-Sertifikat"}
                        </button>
                     </div>
                   )}
                </div>

                {/* HIDDEN CERTIFICATE COMPONENT FOR PDF GENERATION */}
                {isLulus && school && (
                  <div 
                    ref={el => certRefs.current[exam.id] = el}
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
                        <h1 style={{ fontSize: "2.5rem", color: "#0f172a", margin: "0 0 10px 0", letterSpacing: "2px", textTransform: "uppercase" }}>Sertifikat Kompetensi</h1>
                        <p style={{ fontSize: "1.1rem", color: "#64748b", margin: 0, textTransform: "uppercase", letterSpacing: "1px" }}>Nomor: {exam.id.split('-')[0].toUpperCase()}/UKK/SMK-AQ/{new Date(exam.examDate).getFullYear()}</p>
                        
                        <div style={{ margin: "50px 0" }}>
                          <p style={{ fontSize: "1.2rem", color: "#475569", marginBottom: "15px" }}>Diberikan kepada:</p>
                          <h2 style={{ fontSize: "3rem", color: "#1e293b", margin: 0, borderBottom: "2px solid #cbd5e1", display: "inline-block", paddingBottom: "10px" }}>{exam.student.name}</h2>
                          <p style={{ fontSize: "1.2rem", color: "#475569", marginTop: "15px" }}>NISN: {exam.student.nisn}</p>
                        </div>
                        
                        <p style={{ fontSize: "1.2rem", color: "#475569", lineHeight: "1.6", maxWidth: "800px", margin: "0 auto" }}>
                          Telah mengikuti Uji Kompetensi Keahlian (UKK) pada skema <strong>{exam.scheme.title}</strong> dan dinyatakan memenuhi syarat kompetensi dengan predikat:
                        </p>
                        
                        <h3 style={{ fontSize: "2.5rem", color: "#16a34a", margin: "30px 0" }}>"{exam.predikat}"</h3>
                        
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
                            <p style={{ margin: "0 0 10px 0", color: "#475569" }}>Asesor Penguji</p>
                            {exam.assessor?.signature ? (
                               <img src={exam.assessor.signature} alt="Tanda Tangan Asesor" style={{ height: "80px", objectFit: "contain", margin: "10px 0" }} crossOrigin="anonymous" />
                            ) : (
                               <div style={{ height: "80px" }}></div>
                            )}
                            <p style={{ margin: "0", fontWeight: "bold", borderBottom: "1px solid #cbd5e1", paddingBottom: "5px" }}>{exam.assessor?.name || "Asesor Internal"}</p>
                            <p style={{ margin: "5px 0 0 0", fontSize: "0.9rem", color: "#64748b" }}>{exam.assessor?.company || "Sekolah Master Demo"}</p>
                          </div>
                        </div>

                      </div>
                    </div>
                  </div>
                )}
                {/* END CERTIFICATE */}

                {/* RUBRIK DETAIL */}
                <h4 style={{ fontSize: "1.1rem", color: "#1e293b", marginBottom: "1rem", borderBottom: "2px solid #f1f5f9", paddingBottom: "0.5rem" }}>Detail Penilaian Rubrik</h4>
                
                {exam.status === "DINILAI" ? (
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "#f8fafc", textAlign: "left" }}>
                         <th style={{ padding: "0.75rem", borderBottom: "1px solid #e2e8f0", color: "#475569" }}>No</th>
                         <th style={{ padding: "0.75rem", borderBottom: "1px solid #e2e8f0", color: "#475569" }}>Komponen yang Dinilai</th>
                         <th style={{ padding: "0.75rem", borderBottom: "1px solid #e2e8f0", color: "#475569" }}>Bobot</th>
                         <th style={{ padding: "0.75rem", borderBottom: "1px solid #e2e8f0", color: "#475569" }}>Capaian Predikat</th>
                      </tr>
                    </thead>
                    <tbody>
                      {exam.scheme.components.map((comp, idx) => {
                        const scoreData = exam.scores.find(s => s.componentId === comp.id);
                        return (
                          <tr key={comp.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                            <td style={{ padding: "0.75rem", color: "#64748b" }}>{idx + 1}</td>
                            <td style={{ padding: "0.75rem" }}>
                               <strong style={{ color: "#1e293b", display: "block" }}>{comp.name}</strong>
                               <span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>{comp.criteria}</span>
                            </td>
                            <td style={{ padding: "0.75rem", fontWeight: "bold", color: "#2563eb" }}>{comp.weight}%</td>
                            <td style={{ padding: "0.75rem" }}>
                               {scoreData ? (
                                 <span style={{ 
                                   background: scoreData.predicateValue === 'SANGAT_KOMPETEN' ? '#dcfce7' : scoreData.predicateValue === 'KOMPETEN' ? '#dbeafe' : scoreData.predicateValue === 'CUKUP' ? '#fef9c3' : '#fee2e2',
                                   color: scoreData.predicateValue === 'SANGAT_KOMPETEN' ? '#16a34a' : scoreData.predicateValue === 'KOMPETEN' ? '#2563eb' : scoreData.predicateValue === 'CUKUP' ? '#ca8a04' : '#dc2626',
                                   padding: "0.3rem 0.6rem", borderRadius: "50px", fontSize: "0.8rem", fontWeight: "bold"
                                 }}>
                                   {scoreData.predicateValue.replace("_", " ")}
                                 </span>
                               ) : "-"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ) : (
                  <div style={{ padding: "2rem", textAlign: "center", background: "#f8fafc", borderRadius: "8px", border: "1px dashed #cbd5e1", color: "#64748b" }}>
                    Nilai praktik akan muncul di sini setelah Anda selesai diuji oleh Asesor.
                  </div>
                )}
             </div>
          </div>
        )})}
      </div>
    </div>
  );
}

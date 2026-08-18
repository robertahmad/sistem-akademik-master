"use server";

import prisma from "../../../../lib/prisma";
import Link from "next/link";

export default async function VerifyPklPage({ params }) {
  const { placementId } = params;

  const placement = await prisma.pklPlacement.findUnique({
    where: { id: placementId },
    include: {
      student: true,
      dudi: true,
      grade: true
    }
  });

  if (!placement) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", background: "#f8fafc", padding: "1rem" }}>
         <div style={{ background: "white", padding: "2rem", borderRadius: "12px", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)", textAlign: "center", maxWidth: "400px" }}>
            <span style={{ fontSize: "4rem" }}>❌</span>
            <h1 style={{ color: "#ef4444", margin: "1rem 0" }}>Tidak Ditemukan</h1>
            <p style={{ color: "#64748b" }}>Data sertifikat PKL dengan nomor referensi ini tidak ditemukan atau tidak valid.</p>
         </div>
      </div>
    );
  }

  const isLulus = placement.grade && placement.grade.finalScore >= 70;

  return (
    <div style={{ minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", background: "#f1f5f9", padding: "1rem" }}>
      <div style={{ background: "white", padding: "2.5rem", borderRadius: "16px", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)", maxWidth: "500px", width: "100%" }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
           <span style={{ fontSize: "4rem" }}>{isLulus ? "✅" : "⚠️"}</span>
           <h1 style={{ color: isLulus ? "#16a34a" : "#ca8a04", margin: "1rem 0 0.5rem 0", fontSize: "1.8rem" }}>Sertifikat Valid</h1>
           <p style={{ color: "#64748b", margin: 0, fontSize: "0.95rem" }}>Telah diverifikasi oleh Sistem Akademik Sekolah Master Demo</p>
        </div>

        <div style={{ background: "#f8fafc", borderRadius: "8px", padding: "1.5rem", border: "1px solid #e2e8f0" }}>
           <table style={{ width: "100%", borderCollapse: "collapse" }}>
             <tbody>
               <tr>
                 <td style={{ padding: "0.5rem 0", color: "#64748b", fontSize: "0.9rem", width: "40%" }}>Nama Siswa</td>
                 <td style={{ padding: "0.5rem 0", fontWeight: "bold", color: "#1e293b" }}>{placement.student.name}</td>
               </tr>
               <tr>
                 <td style={{ padding: "0.5rem 0", color: "#64748b", fontSize: "0.9rem" }}>NISN</td>
                 <td style={{ padding: "0.5rem 0", fontWeight: "bold", color: "#1e293b" }}>{placement.student.nisn}</td>
               </tr>
               <tr>
                 <td style={{ padding: "0.5rem 0", color: "#64748b", fontSize: "0.9rem" }}>Tempat Magang</td>
                 <td style={{ padding: "0.5rem 0", fontWeight: "bold", color: "#1e293b" }}>{placement.dudi.name}</td>
               </tr>
               <tr>
                 <td style={{ padding: "0.5rem 0", color: "#64748b", fontSize: "0.9rem" }}>Pimpinan/Instruktur</td>
                 <td style={{ padding: "0.5rem 0", fontWeight: "bold", color: "#1e293b" }}>{placement.dudi.leaderName || placement.dudi.mentorName || "-"}</td>
               </tr>
               <tr>
                 <td style={{ padding: "0.5rem 0", color: "#64748b", fontSize: "0.9rem" }}>Masa PKL</td>
                 <td style={{ padding: "0.5rem 0", fontWeight: "bold", color: "#1e293b" }}>{new Date(placement.startDate).toLocaleDateString()} - {new Date(placement.endDate).toLocaleDateString()}</td>
               </tr>
               <tr style={{ borderTop: "1px solid #cbd5e1" }}>
                 <td style={{ padding: "1rem 0 0 0", color: "#64748b", fontSize: "0.9rem" }}>Status Magang</td>
                 <td style={{ padding: "1rem 0 0 0", fontWeight: "bold", color: isLulus ? "#16a34a" : "#dc2626", fontSize: "1.2rem" }}>{isLulus ? "LULUS" : "TIDAK LULUS"}</td>
               </tr>
             </tbody>
           </table>
        </div>
        
        <div style={{ marginTop: "2rem", textAlign: "center" }}>
           <Link href="/" style={{ color: "#2563eb", textDecoration: "none", fontWeight: "bold", fontSize: "0.9rem" }}>Kembali ke Beranda SMK</Link>
        </div>
      </div>
    </div>
  );
}

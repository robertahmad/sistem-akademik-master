"use client";

import { useState, useEffect } from "react";

export default function SiswaPenugasanTab({ student }) {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/assignments/siswa?kelas=${student.kelas}&studentNisn=${student.nisn}`);
      const data = await res.json();
      setAssignments(data || []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (student) {
      fetchAssignments();
    }
  }, [student]);

  const handleSubmitLink = async (assignmentId, linkVal) => {
    setUploading(true);

    try {
      const submitRes = await fetch("/api/assignments/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignmentId,
          studentNisn: student.nisn,
          fileUrl: linkVal
        })
      });
      
      const submitData = await submitRes.json();
      if (submitData.success) {
        alert("Link tugas berhasil dikirim!");
        fetchAssignments();
      } else {
        alert("Gagal merekam pengumpulan: " + submitData.error);
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan jaringan saat mengirim data.");
    }
    setUploading(false);
  };

  if (!student) return null;

  return (
    <div className="penugasan-container" style={{ animation: "fadeIn 0.4s ease-out" }}>
      <style jsx>{`
        .card-list { display: flex; flex-direction: column; gap: 1rem; }
        .assignment-card { background: white; border: 1px solid #e2e8f0; padding: 1.25rem; border-radius: 8px; }
        .assignment-card h4 { margin: 0 0 0.5rem 0; font-size: 1.1rem; color: #0f172a; }
        .badge { display: inline-block; padding: 0.2rem 0.6rem; border-radius: 99px; font-size: 0.75rem; font-weight: 600; margin-right: 0.5rem; }
        .badge.individu { background: #dbeafe; color: #1e40af; }
        .badge.kelompok { background: #fef08a; color: #854d0e; }
        .badge.done { background: #dcfce7; color: #166534; }
        .btn-upload { background: #3b82f6; color: white; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; border: none; font-weight: 500; }
        .btn-upload:disabled { background: #94a3b8; cursor: not-allowed; }
      `}</style>

      <div className="card" style={{ backgroundColor: "white", border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)", padding: "1.25rem", marginBottom: "2rem", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
        <div style={{ marginBottom: "1rem", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <span style={{ fontSize: "0.85rem", textTransform: "uppercase", fontWeight: 700, color: "var(--secondary)" }}>Tugas Harian</span>
            <h2 style={{ margin: "0.2rem 0 0 0", fontSize: "1.2rem", color: "var(--primary-dark)", fontWeight: "800" }}>Daftar Tugas Anda</h2>
          </div>
          <button 
            className="btn btn-secondary" 
            style={{ padding: "0.4rem 0.8rem", borderRadius: "6px", cursor: "pointer", border: "1px solid #cbd5e1", background: "white", fontWeight: "bold", fontSize: "0.8rem" }}
            onClick={fetchAssignments}
          >
            🔄 Refresh
          </button>
        </div>

        {loading ? <p>Memuat tugas...</p> : (
          assignments.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem", background: "#f8fafc", borderRadius: "8px" }}>
              <span style={{ fontSize: "2rem" }}>🎓</span>
              <p style={{ color: "#64748b", marginTop: "1rem" }}>Belum ada tugas untuk mata pelajaran ini.</p>
            </div>
          ) : (
            <div className="card-list">
              {assignments.map(a => {
                const isSubmitted = a.submissions?.some(s => s.studentNisn === student.nisn || (s.groupId && a.groups?.find(g => g.id === s.groupId)?.members?.some(m => m.studentNisn === student.nisn)));
                const mySubmission = isSubmitted ? a.submissions.find(s => s.studentNisn === student.nisn || (s.groupId && a.groups?.find(g => g.id === s.groupId)?.members?.some(m => m.studentNisn === student.nisn))) : null;

                return (
                  <div key={a.id} className="assignment-card">
                    <h4>{a.title}</h4>
                    <div style={{ marginBottom: "0.5rem" }}>
                      <span className={`badge ${a.type.toLowerCase()}`}>{a.type}</span>
                      {isSubmitted && <span className="badge done">✓ Selesai</span>}
                    </div>
                    <p style={{ fontSize: "0.9rem", color: "#475569", marginBottom: "0.5rem" }}>Tenggat: {new Date(a.deadline).toLocaleString('id-ID')}</p>
                    <p style={{ fontSize: "0.9rem", marginBottom: "1rem", whiteSpace: "pre-wrap" }}>{a.description}</p>
                    
                    {isSubmitted ? (
                      <div style={{ background: "#f1f5f9", padding: "1rem", borderRadius: "6px" }}>
                        <p style={{ margin: "0 0 0.5rem 0", fontWeight: "bold" }}>Tugas Anda telah dikumpulkan.</p>
                        {mySubmission?.fileUrl && <a href={mySubmission.fileUrl} target="_blank" rel="noreferrer" style={{ color: "#2563eb", textDecoration: "underline" }}>Lihat File Anda</a>}
                        {mySubmission?.score !== null && (
                          <div style={{ marginTop: "0.5rem" }}>
                            <p style={{ margin: "0" }}>Nilai: <strong>{mySubmission.score}</strong></p>
                            {mySubmission.feedback && <p style={{ margin: "0", fontStyle: "italic", color: "#475569" }}>Catatan Guru: {mySubmission.feedback}</p>}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div style={{ marginTop: "1rem" }}>
                        <input 
                          type="url" 
                          id={`link-${a.id}`} 
                          placeholder="Masukkan Link Google Drive / Tugas Anda di sini..."
                          style={{ width: "100%", padding: "0.75rem", borderRadius: "6px", border: "1px solid #cbd5e1", marginBottom: "0.5rem" }}
                        />
                        <button 
                          className="btn-upload" 
                          disabled={uploading}
                          onClick={() => {
                            const linkVal = document.getElementById(`link-${a.id}`).value;
                            if (!linkVal) { alert("Harap masukkan link tugas!"); return; }
                            handleSubmitLink(a.id, linkVal);
                          }}
                        >
                          {uploading ? "Mengirim..." : "Kirim Link Tugas"}
                        </button>
                        <p style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: "0.5rem", margin: 0 }}>Pastikan link bisa diakses oleh guru (ubah akses link menjadi 'Siapa saja yang memiliki link').</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>
    </div>
  );
}

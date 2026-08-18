"use client";

import { useState, useEffect } from "react";
import { createAssignment, createGroups, submitAssignment, gradeSubmission } from "@/app/actions/assignment";

export default function PenugasanTab({ teacher, activeSubject, school }) {
  const [view, setView] = useState("list"); // list, create, detail
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Create Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [type, setType] = useState("INDIVIDU");
  const [kelas, setKelas] = useState("Semua Kelas");

  const fetchAssignments = async () => {
    // In a real app we fetch from an API
    // Let's use fetch API
    setLoading(true);
    try {
      const res = await fetch(`/api/assignments?teacherId=${teacher.id}&subjectName=${encodeURIComponent(activeSubject?.name || "")}`);
      const data = await res.json();
      setAssignments(data || []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (activeSubject) {
      fetchAssignments();
    }
  }, [activeSubject]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!activeSubject) return alert("Pilih mata pelajaran terlebih dahulu!");
    
    setLoading(true);
    const res = await createAssignment({
      title, description, deadline, type, kelas, 
      subjectName: activeSubject.name, teacherId: teacher.id, unit: teacher.unit
    });
    
    if (res.success) {
      setMessage("Tugas berhasil dibuat!");
      setView("list");
      fetchAssignments();
      // Reset form
      setTitle(""); setDescription(""); setDeadline(""); setType("INDIVIDU"); setKelas("Semua Kelas");
    } else {
      alert("Gagal membuat tugas: " + res.error);
    }
    setLoading(false);
  };

  const handleGrade = async (submissionId, score, feedback) => {
    setLoading(true);
    const res = await gradeSubmission(submissionId, score, feedback);
    if (res.success) {
      alert("Berhasil menilai!");
      fetchAssignments();
    } else {
      alert("Gagal menilai: " + res.error);
    }
    setLoading(false);
  };

  const [activeAssignment, setActiveAssignment] = useState(null);

  if (!activeSubject) {
    return (
      <div className="card">
        <h3>Modul Penugasan</h3>
        <p>Silakan pilih Mata Pelajaran di menu sidebar kiri terlebih dahulu.</p>
      </div>
    );
  }

  return (
    <div className="penugasan-container" style={{ animation: "fadeIn 0.4s ease-out" }}>
      <style jsx>{`
        .header-actions { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
        .btn-primary { background: var(--primary); color: white; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; border: none; font-weight: 500; }
        .btn-secondary { background: #e2e8f0; color: #1e293b; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; border: none; font-weight: 500; margin-right: 0.5rem; }
        .card-list { display: flex; flex-direction: column; gap: 1rem; }
        .assignment-card { background: white; border: 1px solid #e2e8f0; padding: 1.25rem; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
        .assignment-card h4 { margin: 0 0 0.5rem 0; font-size: 1.1rem; color: #0f172a; }
        .assignment-card p { margin: 0 0 0.25rem 0; font-size: 0.9rem; color: #64748b; }
        .badge { display: inline-block; padding: 0.2rem 0.6rem; border-radius: 99px; font-size: 0.75rem; font-weight: 600; margin-right: 0.5rem; }
        .badge.individu { background: #dbeafe; color: #1e40af; }
        .badge.kelompok { background: #fef08a; color: #854d0e; }
        .form-group { margin-bottom: 1rem; }
        .form-group label { display: block; margin-bottom: 0.5rem; font-weight: 500; font-size: 0.9rem; }
        .form-control { width: 100%; padding: 0.75rem; border: 1px solid #cbd5e1; border-radius: 6px; font-family: inherit; }
        .submission-item { padding: 1rem; border: 1px solid #e2e8f0; border-radius: 6px; margin-bottom: 1rem; background: #f8fafc; }
      `}</style>

      <div className="card">
        <div className="header-actions">
          <div>
            <span style={{ fontSize: "0.85rem", textTransform: "uppercase", fontWeight: 700, color: "var(--secondary)" }}>Modul Penugasan</span>
            <h2 style={{ margin: "0.2rem 0 0 0", fontSize: "1.5rem", color: "var(--foreground)" }}>{activeSubject.name}</h2>
          </div>
          {view === "list" && (
            <button className="btn-primary" onClick={() => setView("create")}>+ Buat Tugas Baru</button>
          )}
          {view === "detail" && (
            <button className="btn-secondary" onClick={() => setView("list")}>← Kembali</button>
          )}
        </div>

        {message && <div style={{ padding: "0.75rem", background: "#dcfce7", color: "#166534", borderRadius: "6px", marginBottom: "1rem" }}>{message}</div>}

        {view === "list" && (
          <div>
            {loading ? <p>Memuat tugas...</p> : (
              assignments.length === 0 ? (
                <div style={{ textAlign: "center", padding: "3rem", background: "#f8fafc", borderRadius: "8px" }}>
                  <span style={{ fontSize: "2rem" }}>📝</span>
                  <p style={{ color: "#64748b", marginTop: "1rem" }}>Belum ada tugas untuk mata pelajaran ini.</p>
                </div>
              ) : (
                <div className="card-list">
                  {assignments.map(a => (
                    <div key={a.id} className="assignment-card">
                      <h4>{a.title}</h4>
                      <div style={{ marginBottom: "0.5rem" }}>
                        <span className={`badge ${a.type.toLowerCase()}`}>{a.type}</span>
                        <span className="badge" style={{ background: "#f1f5f9", color: "#475569" }}>Kelas: {a.kelas}</span>
                      </div>
                      <p>Tenggat: {new Date(a.deadline).toLocaleString('id-ID')}</p>
                      <button className="btn-secondary" style={{ marginTop: "0.5rem", fontSize: "0.85rem" }} onClick={() => { setActiveAssignment(a); setView("detail"); }}>Lihat Pengumpulan ({a.submissions?.length || 0})</button>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        )}

        {view === "detail" && activeAssignment && (
          <div>
            <h3 style={{ marginTop: 0 }}>{activeAssignment.title}</h3>
            <p style={{ color: "#64748b", marginBottom: "1.5rem" }}>{activeAssignment.description}</p>
            
            <h4>Daftar Pengumpulan</h4>
            {activeAssignment.submissions?.length === 0 ? (
              <p>Belum ada siswa yang mengumpulkan.</p>
            ) : (
              activeAssignment.submissions.map(sub => (
                <div key={sub.id} className="submission-item">
                  <p><strong>Pengirim:</strong> {sub.student ? `${sub.student.name} (NISN: ${sub.studentNisn})` : (sub.studentNisn || "Kelompok ID " + sub.groupId)}</p>
                  <p><strong>Waktu:</strong> {new Date(sub.submittedAt).toLocaleString('id-ID')}</p>
                  {sub.fileUrl && <a href={sub.fileUrl} target="_blank" rel="noreferrer" style={{ color: "#2563eb", textDecoration: "underline", display: "inline-block", marginBottom: "1rem" }}>Lihat File Tugas</a>}
                  
                  <div style={{ display: "flex", gap: "1rem", alignItems: "flex-end" }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: "block", fontSize: "0.8rem", marginBottom: "0.2rem" }}>Nilai (0-100)</label>
                      <input type="number" id={`score-${sub.id}`} className="form-control" defaultValue={sub.score || ""} style={{ width: "100px" }} />
                    </div>
                    <div style={{ flex: 3 }}>
                      <label style={{ display: "block", fontSize: "0.8rem", marginBottom: "0.2rem" }}>Catatan Guru</label>
                      <input type="text" id={`feedback-${sub.id}`} className="form-control" defaultValue={sub.feedback || ""} placeholder="Kerja bagus!" />
                    </div>
                    <div>
                      <button className="btn-primary" onClick={() => {
                        const score = document.getElementById(`score-${sub.id}`).value;
                        const feedback = document.getElementById(`feedback-${sub.id}`).value;
                        handleGrade(sub.id, score, feedback);
                      }}>Simpan Nilai</button>
                    </div>
                  </div>
                  {sub.score !== null && <p style={{ marginTop: "0.5rem", fontSize: "0.85rem", color: "#16a34a" }}>✓ Telah dinilai ({sub.score}). Nilai ini otomatis masuk ke kolom Tugas Rapor.</p>}
                </div>
              ))
            )}
          </div>
        )}

        {view === "create" && (
          <form onSubmit={handleCreate}>
            <div className="form-group">
              <label>Judul Tugas</label>
              <input type="text" className="form-control" value={title} onChange={e => setTitle(e.target.value)} required placeholder="Misal: Makalah Sejarah Kemerdekaan" />
            </div>
            <div className="form-group">
              <label>Deskripsi & Instruksi</label>
              <textarea className="form-control" rows="4" value={description} onChange={e => setDescription(e.target.value)} required placeholder="Jelaskan instruksi tugas di sini..."></textarea>
            </div>
            <div className="form-group">
              <label>Tipe Tugas</label>
              <select className="form-control" value={type} onChange={e => setType(e.target.value)}>
                <option value="INDIVIDU">Individu (Setiap Siswa Mengumpulkan)</option>
                <option value="KELOMPOK">Kelompok (Perwakilan Mengumpulkan)</option>
              </select>
            </div>
            <div className="form-group">
              <label>Untuk Kelas</label>
              <input type="text" className="form-control" value={kelas} onChange={e => setKelas(e.target.value)} placeholder="Misal: X TKJ 1, atau Semua Kelas" />
            </div>
            <div className="form-group">
              <label>Tenggat Waktu (Deadline)</label>
              <input type="datetime-local" className="form-control" value={deadline} onChange={e => setDeadline(e.target.value)} required />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "1.5rem" }}>
              <button type="button" className="btn-secondary" onClick={() => setView("list")}>Batal</button>
              <button type="submit" className="btn-primary" disabled={loading}>{loading ? "Menyimpan..." : "Simpan Tugas"}</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

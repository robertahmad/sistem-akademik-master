"use client";

import React, { useState, useEffect } from "react";
import { loginAssessor, getUkkExamsForAssessor, submitUkkScore, updateAssessorSignature } from "../../actions/ukk";

export default function AsesorPortal() {
  const [assessor, setAssessor] = useState(null);
  
  // Login State
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loading, setLoading] = useState(true);

  // App State
  const [exams, setExams] = useState([]);
  const [activeExam, setActiveExam] = useState(null);
  
  // Scoring State
  // { componentId: { predicate, notes } }
  const [scores, setScores] = useState({});

  useEffect(() => {
    const saved = localStorage.getItem("smk_assessor");
    if (saved) {
      setAssessor(JSON.parse(saved));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (assessor) fetchExams();
  }, [assessor]);

  const fetchExams = async () => {
    setLoading(true);
    const res = await getUkkExamsForAssessor(assessor.id);
    if (res.success) {
      setExams(res.exams);
    }
    setLoading(false);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError("");
    setLoading(true);
    const res = await loginAssessor(username, password);
    if (res.success) {
      setAssessor(res.assessor);
      localStorage.setItem("smk_assessor", JSON.stringify(res.assessor));
    } else {
      setLoginError(res.error);
    }
    setLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("smk_assessor");
    setAssessor(null);
  };

  const handleUploadSignature = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLoading(true);
    const formData = new FormData();
    formData.append("signature", file);
    const res = await updateAssessorSignature(assessor.id, formData);
    if(res.success) {
      alert("Tanda tangan berhasil diunggah!");
      // Update local storage and state
      const updatedAssessor = { ...assessor, signature: res.signature };
      setAssessor(updatedAssessor);
      localStorage.setItem("smk_assessor", JSON.stringify(updatedAssessor));
    } else {
      alert("Gagal mengunggah tanda tangan: " + res.error);
    }
    setLoading(false);
  };

  const openScoring = (exam) => {
    setActiveExam(exam);
    // Init scores state
    const initialScores = {};
    if (exam.scores && exam.scores.length > 0) {
      exam.scores.forEach(s => {
        initialScores[s.componentId] = { predicate: s.predicateValue, notes: s.notes };
      });
    } else {
      exam.scheme.components.forEach(c => {
        initialScores[c.id] = { predicate: "", notes: "" };
      });
    }
    setScores(initialScores);
  };

  const handleScoreChange = (componentId, field, value) => {
    setScores(prev => ({
      ...prev,
      [componentId]: {
        ...prev[componentId],
        [field]: value
      }
    }));
  };

  const handleSubmitScore = async () => {
    // Validasi apakah semua komponen sudah dinilai
    const components = activeExam.scheme.components;
    for (const c of components) {
      if (!scores[c.id]?.predicate) {
        alert(`Komponen "${c.name}" belum diberi nilai predikat!`);
        return;
      }
    }

    setLoading(true);
    const scoresArray = Object.keys(scores).map(componentId => ({
      componentId,
      predicate: scores[componentId].predicate,
      notes: scores[componentId].notes
    }));

    const res = await submitUkkScore(activeExam.id, assessor.id, scoresArray);
    if (res.success) {
      alert("Nilai UKK berhasil disimpan!");
      setActiveExam(null);
      fetchExams();
    } else {
      alert("Gagal menyimpan nilai: " + res.error);
    }
    setLoading(false);
  };

  if (loading && !assessor) return <div style={{ padding: "2rem", textAlign: "center" }}>Loading...</div>;

  // LOGIN SCREEN
  if (!assessor) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f1f5f9" }}>
        <div style={{ background: "white", padding: "2.5rem", borderRadius: "12px", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)", width: "100%", maxWidth: "400px" }}>
          <div style={{ textAlign: "center", marginBottom: "2rem" }}>
            <span style={{ fontSize: "3rem", display: "block", marginBottom: "0.5rem" }}>📋</span>
            <h1 style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#0f172a", margin: 0 }}>Portal Asesor UKK</h1>
            <p style={{ color: "#64748b", margin: "0.5rem 0 0 0", fontSize: "0.9rem" }}>Uji Kompetensi Keahlian Sekolah Master Demo</p>
          </div>

          {loginError && <div style={{ background: "#fee2e2", color: "#ef4444", padding: "0.75rem", borderRadius: "6px", marginBottom: "1rem", fontSize: "0.9rem", textAlign: "center" }}>{loginError}</div>}

          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem", fontWeight: "600", color: "#334155" }}>Username</label>
              <input type="text" value={username} onChange={e => setUsername(e.target.value)} required style={{ width: "100%", padding: "0.75rem", border: "1px solid #cbd5e1", borderRadius: "6px" }} />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem", fontWeight: "600", color: "#334155" }}>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required style={{ width: "100%", padding: "0.75rem", border: "1px solid #cbd5e1", borderRadius: "6px" }} />
            </div>
            <button type="submit" disabled={loading} style={{ background: "#2563eb", color: "white", padding: "0.75rem", borderRadius: "6px", border: "none", fontWeight: "bold", cursor: "pointer", marginTop: "0.5rem" }}>
              {loading ? "Memproses..." : "Masuk sebagai Asesor"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // MAIN DASHBOARD
  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
      {/* Navbar */}
      <nav style={{ background: "white", padding: "1rem 2rem", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e2e8f0", position: "sticky", top: 0, zIndex: 10 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "1.25rem", color: "#0f172a" }}>Portal Asesor UKK</h1>
          <p style={{ margin: 0, fontSize: "0.85rem", color: "#64748b" }}>Sekolah Master Demo</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{ textAlign: "right" }}>
            <strong style={{ display: "block", color: "#1e293b", fontSize: "0.9rem" }}>{assessor.name}</strong>
            <span style={{ fontSize: "0.75rem", color: "#64748b" }}>{assessor.company || "Asesor Internal"}</span>
          </div>
          <div style={{ borderLeft: "1px solid #e2e8f0", paddingLeft: "1rem", display: "flex", alignItems: "center", gap: "1rem" }}>
            {assessor.signature ? (
              <img src={assessor.signature} alt="TTD" style={{ height: "35px", objectFit: "contain", borderRadius: "4px" }} />
            ) : (
              <span style={{ fontSize: "0.8rem", color: "#ef4444" }}>TTD Belum Ada</span>
            )}
            <label style={{ cursor: "pointer", fontSize: "0.85rem", color: "#2563eb", fontWeight: "bold", background: "#eff6ff", padding: "0.4rem 0.8rem", borderRadius: "4px", border: "1px solid #bfdbfe" }}>
              {loading ? "..." : "Upload TTD"}
              <input type="file" accept="image/png, image/jpeg" style={{ display: "none" }} onChange={handleUploadSignature} disabled={loading} />
            </label>
          </div>
          <button onClick={handleLogout} style={{ padding: "0.5rem 1rem", border: "1px solid #e2e8f0", background: "white", borderRadius: "6px", cursor: "pointer", fontSize: "0.85rem", fontWeight: "bold", color: "#ef4444", marginLeft: "1rem" }}>Keluar</button>
        </div>
      </nav>

      <main style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
        
        {activeExam ? (
          // SCORING INTERFACE (DIGITAL RUBRIC)
          <div>
             <button onClick={() => setActiveExam(null)} style={{ background: "none", border: "none", color: "#2563eb", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.5rem", fontWeight: "bold" }}>
                ← Kembali ke Daftar Ujian
             </button>

             <div style={{ background: "white", padding: "1.5rem", borderRadius: "12px", border: "1px solid #e2e8f0", marginBottom: "2rem" }}>
                <h2 style={{ margin: "0 0 0.5rem 0", fontSize: "1.5rem" }}>Lembar Penilaian UKK (Digital Rubric)</h2>
                <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap", marginTop: "1rem", padding: "1rem", background: "#f1f5f9", borderRadius: "8px" }}>
                   <div>
                     <span style={{ fontSize: "0.85rem", color: "#64748b", display: "block" }}>Nama Asesi (Siswa)</span>
                     <strong style={{ fontSize: "1.1rem" }}>{activeExam.student.name} ({activeExam.student.kelas})</strong>
                   </div>
                   <div>
                     <span style={{ fontSize: "0.85rem", color: "#64748b", display: "block" }}>Skema Sertifikasi</span>
                     <strong>{activeExam.scheme.title}</strong>
                   </div>
                   <div>
                     <span style={{ fontSize: "0.85rem", color: "#64748b", display: "block" }}>Status Saat Ini</span>
                     <strong style={{ color: activeExam.status === 'DINILAI' ? '#16a34a' : '#eab308' }}>{activeExam.status}</strong>
                   </div>
                </div>
             </div>

             <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                {activeExam.scheme.components.map((comp, idx) => (
                  <div key={comp.id} style={{ background: "white", padding: "1.5rem", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                     <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                        <div>
                          <h3 style={{ margin: 0, fontSize: "1.1rem", color: "#0f172a" }}>{idx + 1}. {comp.name}</h3>
                          <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.9rem", color: "#64748b" }}>{comp.criteria}</p>
                        </div>
                        <span style={{ background: "#dbeafe", color: "#1d4ed8", padding: "0.3rem 0.8rem", borderRadius: "50px", fontSize: "0.8rem", fontWeight: "bold" }}>Bobot: {comp.weight}%</span>
                     </div>

                     <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
                        {/* Checklists */}
                        {[
                          { label: "Sangat Kompeten", value: "SANGAT_KOMPETEN", color: "#16a34a", bg: "#dcfce7" },
                          { label: "Kompeten", value: "KOMPETEN", color: "#2563eb", bg: "#dbeafe" },
                          { label: "Cukup", value: "CUKUP", color: "#ca8a04", bg: "#fef9c3" },
                          { label: "Belum Kompeten", value: "BELUM_KOMPETEN", color: "#dc2626", bg: "#fee2e2" }
                        ].map(opt => {
                          const isSelected = scores[comp.id]?.predicate === opt.value;
                          return (
                            <button
                              key={opt.value}
                              onClick={() => handleScoreChange(comp.id, "predicate", opt.value)}
                              style={{
                                padding: "1rem",
                                borderRadius: "8px",
                                border: isSelected ? `2px solid ${opt.color}` : "1px solid #e2e8f0",
                                background: isSelected ? opt.bg : "white",
                                color: isSelected ? opt.color : "#475569",
                                fontWeight: "bold",
                                cursor: "pointer",
                                transition: "all 0.2s"
                              }}
                            >
                              {opt.label}
                            </button>
                          )
                        })}
                     </div>

                     <div>
                        <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", fontWeight: "600", color: "#64748b" }}>Catatan Tambahan / Feedback (Opsional)</label>
                        <input 
                          type="text" 
                          value={scores[comp.id]?.notes || ""} 
                          onChange={(e) => handleScoreChange(comp.id, "notes", e.target.value)}
                          placeholder="Misal: Kurang teliti di bagian X..." 
                          style={{ width: "100%", padding: "0.75rem", border: "1px solid #cbd5e1", borderRadius: "6px" }} 
                        />
                     </div>
                  </div>
                ))}
             </div>

             <div style={{ marginTop: "2rem", padding: "1.5rem", background: "white", borderRadius: "12px", border: "1px solid #e2e8f0", display: "flex", justifyContent: "flex-end" }}>
                <button 
                  onClick={handleSubmitScore} 
                  disabled={loading}
                  style={{ background: "#16a34a", color: "white", padding: "1rem 2rem", borderRadius: "8px", fontSize: "1.1rem", fontWeight: "bold", border: "none", cursor: loading ? "not-allowed" : "pointer" }}
                >
                  {loading ? "Menyimpan..." : "Simpan & Rekap Nilai"}
                </button>
             </div>
          </div>
        ) : (
          // EXAM LIST
          <div>
            <h2 style={{ fontSize: "1.5rem", color: "#0f172a", marginBottom: "1.5rem" }}>Daftar Asesi (Peserta Ujian)</h2>
            
            {loading ? <p>Memuat data peserta...</p> : exams.length === 0 ? (
              <div style={{ background: "white", padding: "3rem", borderRadius: "12px", textAlign: "center", border: "1px dashed #cbd5e1", color: "#64748b" }}>
                 <span style={{ fontSize: "2rem", display: "block", marginBottom: "1rem" }}>📭</span>
                 Belum ada peserta ujian yang di-plotting kepada Anda.
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: "1.5rem" }}>
                {exams.map(exam => (
                  <div key={exam.id} style={{ background: "white", padding: "1.5rem", borderRadius: "12px", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                       <span style={{ background: exam.status === "DINILAI" ? "#dcfce7" : "#f1f5f9", color: exam.status === "DINILAI" ? "#16a34a" : "#64748b", padding: "0.3rem 0.8rem", borderRadius: "50px", fontSize: "0.8rem", fontWeight: "bold" }}>
                         {exam.status}
                       </span>
                       <span style={{ fontSize: "0.85rem", color: "#64748b" }}>{new Date(exam.examDate).toLocaleDateString()}</span>
                    </div>
                    
                    <h3 style={{ margin: "0 0 0.5rem 0", fontSize: "1.2rem", color: "#0f172a" }}>{exam.student.name}</h3>
                    <p style={{ margin: "0 0 1.5rem 0", fontSize: "0.9rem", color: "#64748b" }}>Kelas: {exam.student.kelas} • NISN: {exam.student.nisn}</p>

                    <div style={{ background: "#f8fafc", padding: "1rem", borderRadius: "8px", marginBottom: "1.5rem", flex: 1 }}>
                       <strong style={{ display: "block", fontSize: "0.85rem", color: "#334155", marginBottom: "0.25rem" }}>Skema:</strong>
                       <span style={{ fontSize: "0.95rem" }}>{exam.scheme.title}</span>
                    </div>

                    <button 
                      onClick={() => openScoring(exam)}
                      style={{ 
                        width: "100%", padding: "0.75rem", borderRadius: "8px", border: "none", fontWeight: "bold", cursor: "pointer",
                        background: exam.status === "DINILAI" ? "#f1f5f9" : "#2563eb",
                        color: exam.status === "DINILAI" ? "#334155" : "white",
                      }}
                    >
                      {exam.status === "DINILAI" ? "Lihat / Edit Penilaian" : "Mulai Penilaian Praktik"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

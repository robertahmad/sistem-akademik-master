"use client";

import React, { useState, useEffect } from "react";
import { 
  getUkkSchemes, createUkkScheme, deleteUkkScheme,
  addUkkComponent, deleteUkkComponent,
  getUkkExams, createUkkExam, deleteUkkExam,
  getAssessors, createAssessor, deleteAssessor, updateAssessorSignature
} from "../../actions/ukk";
import { getTeacherDashboard } from "../../actions/guru";
import { getSchoolProfile } from "../../actions/settings";
import UkkCertificateModal from "../../../components/UkkCertificateModal"; // Assuming we can reuse this for student list

export default function UkkTab({ session, isAdmin, adminStudents, adminTeachers }) {
  const [activeSubTab, setActiveSubTab] = useState("scheme"); 
  const [loading, setLoading] = useState(false);
  const [selectedClass, setSelectedClass] = useState(""); // Filter Kelas

  // Data
  const [schemes, setSchemes] = useState([]);
  const [exams, setExams] = useState([]);
  const [assessors, setAssessors] = useState([]);
  const [students, setStudents] = useState([]);
  const [school, setSchool] = useState(null);
  const [previewExam, setPreviewExam] = useState(null);

  // Forms
  const [schemeForm, setSchemeForm] = useState({ title: "", jurusan: "", description: "" });
  const [compForm, setCompForm] = useState({ schemeId: "", name: "", weight: "", criteria: "", order: "" });
  const [assessorForm, setAssessorForm] = useState({ name: "", username: "", password: "", company: "" });
  const [examForm, setExamForm] = useState({ schemeId: "", studentNisn: "", assessorId: "", examDate: "" });

  const fetchData = async () => {
    setLoading(true);
    if (activeSubTab === "scheme") {
      const res = await getUkkSchemes();
      if (res.success) setSchemes(res.schemes);
    } else if (activeSubTab === "assessor") {
      const res = await getAssessors();
      if (res.success) setAssessors(res.assessors);
    } else if (activeSubTab === "exam") {
      const resEx = await getUkkExams();
      if (resEx.success) setExams(resEx.exams);
      const resSch = await getUkkSchemes();
      if (resSch.success) setSchemes(resSch.schemes);
      const resAss = await getAssessors();
      if (resAss.success) setAssessors(resAss.assessors);
      const resSchool = await getSchoolProfile();
      if (resSchool.success) setSchool(resSchool.school);

      // Try fetching students (assuming getTeacherDashboard is available from guru actions)
      try {
        const resStu = await getTeacherDashboard();
        if (resStu) setStudents(resStu);
      } catch (e) {
        console.error(e);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [activeSubTab]);

  // --- SCHEMES & COMPONENTS ---
  const handleSaveScheme = async (e) => {
    e.preventDefault();
    setLoading(true);
    await createUkkScheme(schemeForm);
    setSchemeForm({ title: "", jurusan: "", description: "" });
    fetchData();
  };

  const handleSaveComponent = async (e) => {
    e.preventDefault();
    setLoading(true);
    await addUkkComponent(compForm.schemeId, compForm);
    setCompForm({ schemeId: "", name: "", weight: "", criteria: "", order: "" });
    fetchData();
  };

  // --- ASSESSOR ---
  
  const handleUploadSignature = async (id, e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("signature", file);
    const res = await updateAssessorSignature(id, formData);
    if(res.success) {
      alert("Tanda tangan berhasil diunggah!");
      fetchData();
    } else {
      alert("Gagal: " + res.error);
    }
  };

  const handleSaveAssessor = async (e) => {
    e.preventDefault();
    setLoading(true);
    await createAssessor(assessorForm);
    setAssessorForm({ name: "", username: "", password: "", company: "" });
    fetchData();
  };

  // --- EXAMS (PLOTTING) ---
  const handleSaveExam = async (e) => {
    e.preventDefault();
    setLoading(true);
    await createUkkExam(examForm);
    setExamForm({ schemeId: "", studentNisn: "", assessorId: "", examDate: "" });
    fetchData();
  };

  return (
    <div style={{ padding: "1rem" }}>
      <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#1e293b", marginBottom: "1rem" }}>Manajemen UKK (Sertifikasi)</h2>
      
      <div style={{ display: "flex", gap: "1rem", marginBottom: "2rem", borderBottom: "1px solid #e2e8f0", paddingBottom: "1rem" }}>
        <button onClick={() => setActiveSubTab("scheme")} style={{ fontWeight: activeSubTab === "scheme" ? "bold" : "normal", color: activeSubTab === "scheme" ? "#2563eb" : "#64748b", background: "none", border: "none", cursor: "pointer", fontSize: "1.1rem" }}>Skema & Rubrik</button>
        <button onClick={() => setActiveSubTab("assessor")} style={{ fontWeight: activeSubTab === "assessor" ? "bold" : "normal", color: activeSubTab === "assessor" ? "#2563eb" : "#64748b", background: "none", border: "none", cursor: "pointer", fontSize: "1.1rem" }}>Data Asesor Eksternal</button>
        <button onClick={() => setActiveSubTab("exam")} style={{ fontWeight: activeSubTab === "exam" ? "bold" : "normal", color: activeSubTab === "exam" ? "#2563eb" : "#64748b", background: "none", border: "none", cursor: "pointer", fontSize: "1.1rem" }}>Jadwal & Plotting Siswa</button>
      </div>

      {loading && <p>Loading...</p>}

      {/* SCHEME TAB */}
      {activeSubTab === "scheme" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: "2rem" }}>
          <div>
            {isAdmin && (
            <div style={{ background: "#f8fafc", padding: "1.5rem", borderRadius: "8px", border: "1px solid #e2e8f0", marginBottom: "2rem" }}>
              <h3 style={{ marginBottom: "1rem" }}>Buat Skema UKK Baru</h3>
              <form onSubmit={handleSaveScheme} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <input type="text" placeholder="Judul Skema (Misal: Web Development)" value={schemeForm.title} onChange={e => setSchemeForm({...schemeForm, title: e.target.value})} className="form-input" required style={{ width: "100%", padding: "0.5rem" }}/>
                <input type="text" placeholder="Jurusan (RPL/TKJ)" value={schemeForm.jurusan} onChange={e => setSchemeForm({...schemeForm, jurusan: e.target.value})} className="form-input" required style={{ width: "100%", padding: "0.5rem" }}/>
                <input type="text" placeholder="Deskripsi Singkat" value={schemeForm.description} onChange={e => setSchemeForm({...schemeForm, description: e.target.value})} className="form-input" style={{ gridColumn: "1 / -1", width: "100%", padding: "0.5rem" }}/>
                <button type="submit" style={{ gridColumn: "1 / -1", padding: "0.75rem", background: "#2563eb", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>Simpan Skema</button>
              </form>
            </div>
          )}

            {isAdmin && (
              <div style={{ background: "#f8fafc", padding: "1.5rem", borderRadius: "8px", border: "1px solid #e2e8f0", marginTop: "2rem" }}>
                <h3 style={{ marginBottom: "1rem" }}>Tambah Komponen Penilaian</h3>
                <form onSubmit={handleSaveComponent} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
                  <select value={compForm.schemeId} onChange={e => setCompForm({...compForm, schemeId: e.target.value})} className="form-input" required style={{ width: "100%", padding: "0.5rem", gridColumn: "1 / -1" }}>
                    <option value="">-- Pilih Skema --</option>
                    {schemes.map(s => <option key={s.id} value={s.id}>{s.title} ({s.jurusan})</option>)}
                  </select>
                  <input type="text" placeholder="Nama Komponen (Misal: UI/UX)" value={compForm.name} onChange={e => setCompForm({...compForm, name: e.target.value})} className="form-input" required style={{ width: "100%", padding: "0.5rem", gridColumn: "1 / 3" }}/>
                  <input type="number" placeholder="Bobot (%)" value={compForm.weight} onChange={e => setCompForm({...compForm, weight: e.target.value})} className="form-input" required style={{ width: "100%", padding: "0.5rem" }}/>
                  <input type="text" placeholder="Kriteria Penilaian" value={compForm.criteria} onChange={e => setCompForm({...compForm, criteria: e.target.value})} className="form-input" style={{ gridColumn: "1 / -1", width: "100%", padding: "0.5rem" }}/>
                  <button type="submit" style={{ gridColumn: "1 / -1", padding: "0.75rem", background: "#2563eb", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>Simpan Komponen</button>
                </form>
              </div>
            )}
          </div>

          <div>
             <h3 style={{ fontSize: "1.2rem", marginBottom: "1rem" }}>Daftar Skema Ujian & Rubrik</h3>
             {schemes.map(s => (
               <div key={s.id} style={{ background: "white", padding: "1.5rem", borderRadius: "8px", border: "1px solid #e2e8f0", marginBottom: "1rem" }}>
                 <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: "1.1rem", color: "#0f172a" }}>{s.title}</h4>
                      <p style={{ margin: 0, fontSize: "0.85rem", color: "#64748b" }}>{s.jurusan} - {s.description}</p>
                    </div>
                    {isAdmin && <button onClick={() => {if(confirm("Hapus Skema ini?")) { deleteUkkScheme(s.id); fetchData(); }}} style={{ background: "none", color: "#ef4444", border: "none", cursor: "pointer" }}>Hapus</button>}
                 </div>

                 {s.components.length > 0 ? (
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
                      <thead>
                        <tr style={{ background: "#f1f5f9", textAlign: "left" }}>
                           <th style={{ padding: "0.5rem" }}>Urutan</th>
                           <th style={{ padding: "0.5rem" }}>Komponen</th>
                           <th style={{ padding: "0.5rem" }}>Bobot</th>
                           <th style={{ padding: "0.5rem" }}>Kriteria</th>
                           <th style={{ padding: "0.5rem" }}></th>
                        </tr>
                      </thead>
                      <tbody>
                         {s.components.map(c => (
                            <tr key={c.id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                               <td style={{ padding: "0.5rem" }}>{c.order}</td>
                               <td style={{ padding: "0.5rem", fontWeight: "bold" }}>{c.name}</td>
                               <td style={{ padding: "0.5rem", color: "#2563eb", fontWeight: "bold" }}>{c.weight}%</td>
                               <td style={{ padding: "0.5rem", fontSize: "0.8rem", color: "#64748b" }}>{c.criteria}</td>
                               <td style={{ padding: "0.5rem", textAlign: "right" }}>
                                  {isAdmin && <button onClick={() => {if(confirm("Hapus komponen ini?")) { deleteUkkComponent(c.id); fetchData(); }}} style={{ color: "#ef4444", background: "none", border: "none", cursor: "pointer" }}>X</button>}
                               </td>
                            </tr>
                         ))}
                      </tbody>
                    </table>
                 ) : (
                    <p style={{ fontSize: "0.85rem", fontStyle: "italic", color: "#94a3b8" }}>Belum ada komponen/rubrik.</p>
                 )}
               </div>
             ))}
          </div>
        </div>
      )}

      {/* ASSESSOR TAB */}
      {activeSubTab === "assessor" && (
        <div>
           {isAdmin && (
            <div style={{ background: "#f8fafc", padding: "1.5rem", borderRadius: "8px", border: "1px solid #e2e8f0", marginBottom: "2rem" }}>
              <h3 style={{ marginBottom: "1rem" }}>Tambah Asesor Baru</h3>
              <form onSubmit={handleSaveAssessor} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <input type="text" placeholder="Nama Lengkap Asesor" value={assessorForm.name} onChange={e => setAssessorForm({...assessorForm, name: e.target.value})} className="form-input" required style={{ width: "100%", padding: "0.5rem" }}/>
                <input type="text" placeholder="Perusahaan/Instansi" value={assessorForm.company} onChange={e => setAssessorForm({...assessorForm, company: e.target.value})} className="form-input" style={{ width: "100%", padding: "0.5rem" }}/>
                <input type="text" placeholder="Username Login" value={assessorForm.username} onChange={e => setAssessorForm({...assessorForm, username: e.target.value})} className="form-input" required style={{ width: "100%", padding: "0.5rem" }}/>
                <input type="password" placeholder="Password Login" value={assessorForm.password} onChange={e => setAssessorForm({...assessorForm, password: e.target.value})} className="form-input" required style={{ width: "100%", padding: "0.5rem" }}/>
                <button type="submit" style={{ gridColumn: "1 / -1", padding: "0.75rem", background: "#2563eb", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>Simpan Asesor</button>
              </form>
            </div>
          )}

          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#e2e8f0", textAlign: "left" }}>
                <th style={{ padding: "0.75rem" }}>Nama Asesor</th>
                <th style={{ padding: "0.75rem" }}>Instansi</th>
                <th style={{ padding: "0.75rem" }}>Tanda Tangan</th>
                <th style={{ padding: "0.75rem" }}>Username Login</th>
                <th style={{ padding: "0.75rem" }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {assessors.map(a => (
                <tr key={a.id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                  <td style={{ padding: "0.75rem", fontWeight: "bold" }}>{a.name}</td>
                  <td style={{ padding: "0.75rem" }}>{a.company}</td>
                  <td style={{ padding: "0.75rem" }}>
                    {a.signature ? (
                       <img src={a.signature} alt="TTD" style={{ height: "30px", objectFit: "contain", marginBottom: "0.25rem" }} />
                    ) : <span style={{ fontSize: "0.8rem", color: "#ef4444" }}>Belum Ada</span>}
                    <label style={{ display: "block", fontSize: "0.8rem", cursor: "pointer", color: "#2563eb", fontWeight: "bold" }}>
                      Upload
                      <input type="file" accept="image/png, image/jpeg" style={{ display: "none" }} onChange={(e) => handleUploadSignature(a.id, e)} />
                    </label>
                  </td>
                  <td style={{ padding: "0.75rem", fontFamily: "monospace" }}>{a.username}</td>
                  <td style={{ padding: "0.75rem" }}>
                    {isAdmin && <button onClick={() => {if(confirm("Hapus asesor ini?")) { deleteAssessor(a.id); fetchData(); }}} style={{ padding: "0.4rem 0.8rem", fontSize: "0.85rem", background: "#ef4444", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>Hapus</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* EXAM / PLOTTING TAB */}
      {activeSubTab === "exam" && (
        <div>
          <div style={{ background: "#f8fafc", padding: "1.5rem", borderRadius: "8px", border: "1px solid #e2e8f0", marginBottom: "2rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3 style={{ margin: 0, fontSize: "1.1rem" }}>Plotting Siswa ke Ujian UKK</h3>
              {isAdmin && (
                <button 
                  onClick={() => setPreviewExam({
                    id: "dummy-exam-123",
                    examDate: new Date().toISOString(),
                    student: { name: "NAMA SISWA CONTOH", kelas: "XII JURUSAN CONTOH", nisn: "1234567890" },
                    studentNisn: "1234567890",
                    subject: { name: "NAMA MATA UJI CONTOH" },
                    scheme: { title: "SKEMA KOMPETENSI CONTOH" },
                    dudi: { name: "PT. ASESOR EKSTERNAL", leaderName: "Bpk. Asesor Eksternal" },
                    assessor: { name: "Bpk. Asesor", company: "PT. ASESOR EKSTERNAL", signature: "" },
                    finalScore: 92,
                    predikat: "Sangat Kompeten"
                  })}
                  style={{ padding: "0.5rem 1rem", fontSize: "0.85rem", background: "#8b5cf6", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold", display: "flex", alignItems: "center", gap: "0.4rem" }}
                  title="Pratinjau Layout Sertifikat UKK (Data Dummy)"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                  Contoh Sertifikat
                </button>
              )}
            </div>
            <div style={{ marginBottom: "1rem" }}>
              <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} className="form-input" style={{ width: "100%", padding: "0.5rem" }}>
                <option value="">-- Tampilkan Semua Kelas --</option>
                {isAdmin ? (
                  Array.from(new Set(adminStudents?.map(s => s.kelas))).filter(Boolean).sort().map(k => (
                    <option key={k} value={k}>Kelas {k}</option>
                  ))
                ) : (
                  Array.from(new Set(students?.map(s => s.kelas))).filter(Boolean).sort().map(k => (
                    <option key={k} value={k}>Kelas {k}</option>
                  ))
                )}
              </select>
            </div>
            <form onSubmit={handleSaveExam} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <select value={examForm.studentNisn} onChange={e => setExamForm({...examForm, studentNisn: e.target.value})} className="form-input" required style={{ width: "100%", padding: "0.5rem", gridColumn: "1 / -1" }}>
                <option value="">-- Pilih Siswa --</option>
                {isAdmin ? (
                  adminStudents && adminStudents.filter(s => selectedClass ? s.kelas === selectedClass : true).map(s => <option key={s.nisn} value={s.nisn}>{s.name} ({s.nisn}) - {s.kelas}</option>)
                ) : (
                  Array.isArray(students) && students.filter(s => selectedClass ? s.kelas === selectedClass : true).map(s => <option key={s.nisn} value={s.nisn}>{s.name} - {s.kelas}</option>)
                )}
              </select>
              <select value={examForm.schemeId} onChange={e => setExamForm({...examForm, schemeId: e.target.value})} required style={{ width: "100%", padding: "0.5rem" }}>
                 <option value="">Pilih Skema Ujian...</option>
                 {schemes.map(s => <option key={s.id} value={s.id}>{s.title} ({s.jurusan})</option>)}
              </select>
              <select value={examForm.assessorId} onChange={e => setExamForm({...examForm, assessorId: e.target.value})} required style={{ width: "100%", padding: "0.5rem" }}>
                 <option value="">Pilih Asesor Penguji...</option>
                 {assessors.map(a => <option key={a.id} value={a.id}>{a.name} ({a.company})</option>)}
              </select>
              <input type="date" value={examForm.examDate} onChange={e => setExamForm({...examForm, examDate: e.target.value})} required style={{ width: "100%", padding: "0.5rem" }}/>
              <button type="submit" style={{ gridColumn: "1 / -1", padding: "0.75rem", background: "#2563eb", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>Plot Siswa & Buat Jadwal</button>
            </form>
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#e2e8f0", textAlign: "left" }}>
                <th style={{ padding: "0.75rem" }}>Peserta</th>
                <th style={{ padding: "0.75rem" }}>Skema UKK</th>
                <th style={{ padding: "0.75rem" }}>Asesor Eksternal</th>
                <th style={{ padding: "0.75rem" }}>Tanggal</th>
                <th style={{ padding: "0.75rem" }}>Status Nilai</th>
                <th style={{ padding: "0.75rem" }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {exams.map(ex => (
                <tr key={ex.id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                  <td style={{ padding: "0.75rem" }}><strong>{ex.student?.name || "Siswa Tidak Ditemukan"}</strong><br/><span style={{ fontSize: "0.85rem", color: "#64748b" }}>{ex.student?.nisn || "-"}</span></td>
                  <td style={{ padding: "0.75rem" }}>{ex.scheme?.title || "Skema Terhapus"}</td>
                  <td style={{ padding: "0.75rem" }}>{ex.assessor?.name || "-"}</td>
                  <td style={{ padding: "0.75rem" }}>{new Date(ex.examDate).toLocaleDateString()}</td>
                  <td style={{ padding: "0.75rem" }}>
                     {ex.status === "DINILAI" ? (
                       <span style={{ color: "#16a34a", fontWeight: "bold" }}>{ex.predikat} ({ex.finalScore})</span>
                     ) : (
                       <span style={{ background: "#fef9c3", color: "#a16207", padding: "0.2rem 0.6rem", borderRadius: "4px", fontSize: "0.8rem" }}>{ex.status}</span>
                     )}
                  </td>
                  <td style={{ padding: "0.75rem" }}>
                    {isAdmin && <button onClick={() => {if(confirm("Batalkan ujian ini?")) { deleteUkkExam(ex.id); fetchData(); }}} style={{ padding: "0.4rem 0.8rem", fontSize: "0.85rem", background: "#ef4444", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", marginRight: "0.5rem" }}>Hapus</button>}
                    {ex.status === "DINILAI" && ex.finalScore >= 70 && (<button onClick={() => setPreviewExam(ex)} style={{ padding: "0.4rem 0.8rem", fontSize: "0.85rem", background: "#22c55e", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>Lihat Sertifikat</button>)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {previewExam && (
        <UkkCertificateModal exam={previewExam} school={school} onClose={() => setPreviewExam(null)} />
      )}
    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import { 
  getDudis, saveDudi, deleteDudi, updateDudiSignature, 
  getPlacements, savePlacement, deletePlacement, 
  getJournalsForTeacher, updateJournalStatus, savePklGrade 
} from "../../actions/pkl";
import { getSchoolProfile } from "../../actions/settings";
import PklCertificateModal from "../../../components/PklCertificateModal";

export default function PklTab({ session, isAdmin, adminStudents, adminTeachers }) {
  const [activeSubTab, setActiveSubTab] = useState("dudi"); 
  
  // Data
  const [dudis, setDudis] = useState([]);
  const [placements, setPlacements] = useState([]);
  const [mentorPlacements, setMentorPlacements] = useState([]);
  const [school, setSchool] = useState(null);
  const [previewPlacement, setPreviewPlacement] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedClass, setSelectedClass] = useState("");

  // Forms
  const [dudiForm, setDudiForm] = useState({ name: "", address: "", field: "", leaderName: "", mentorName: "", quota: 0 });
  const [placementForm, setPlacementForm] = useState({ studentNisn: "", dudiId: "", teacherUsername: "", startDate: "", endDate: "" });
  
  useEffect(() => {
    fetchData();
  }, [activeSubTab]);

  const fetchData = async () => {
    setLoading(true);
    if (activeSubTab === "dudi") {
      const res = await getDudis();
      if (res.success) setDudis(res.dudis);
    } else if (activeSubTab === "placement") {
      const res = await getPlacements();
      if (res.success) setPlacements(res.placements);
      const resDudi = await getDudis();
      const resSchool = await getSchoolProfile();
      if(resSchool.success) setSchool(resSchool.school);
      if (resDudi.success) setDudis(resDudi.dudis);
    } else if (activeSubTab === "journal" || activeSubTab === "grade") {
      const res = await getJournalsForTeacher();
      if (res.success) setMentorPlacements(res.placements);
    }
    setLoading(false);
  };

  
  const handleUploadDudiSignature = async (id, e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("signature", file);
    const res = await updateDudiSignature(id, formData);
    if(res.success) {
      alert("Tanda tangan DUDI berhasil diunggah!");
      fetchData();
    } else {
      alert("Gagal: " + res.error);
    }
  };

  const handleSaveDudi = async (e) => {
    e.preventDefault();
    setLoading(true);
    await saveDudi(dudiForm);
    setDudiForm({ name: "", address: "", field: "", leaderName: "", mentorName: "", quota: 0 });
    fetchData();
  };

  const handleDeleteDudi = async (id) => {
    if (!confirm("Hapus DUDI ini?")) return;
    await deleteDudi(id);
    fetchData();
  };

  const handleSavePlacement = async (e) => {
    e.preventDefault();
    setLoading(true);
    await savePlacement(placementForm.studentNisn, placementForm.dudiId, placementForm.teacherUsername, placementForm.startDate, placementForm.endDate);
    setPlacementForm({ studentNisn: "", dudiId: "", teacherUsername: "", startDate: "", endDate: "" });
    fetchData();
  };

  const handleDeletePlacement = async (id) => {
    if (!confirm("Hapus penempatan ini?")) return;
    await deletePlacement(id);
    fetchData();
  };

  const handleApproveJournal = async (journalId, status) => {
    await updateJournalStatus(journalId, status, "");
    fetchData();
  };

  const submitGrade = async (e, placementId) => {
    e.preventDefault();
    const tScore = e.target.tScore.value;
    const ntScore = e.target.ntScore.value;
    const sScore = e.target.sScore.value;
    const notes = e.target.notes.value;
    await savePklGrade(placementId, tScore, ntScore, sScore, notes);
    alert("Nilai PKL berhasil disimpan!");
    fetchData();
  };

  return (
    <div style={{ padding: "1rem" }}>
      <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#1e293b", marginBottom: "1rem" }}>Manajemen PKL & Hubin</h2>
      
      <div style={{ display: "flex", gap: "1rem", marginBottom: "2rem", borderBottom: "1px solid #e2e8f0", paddingBottom: "1rem" }}>
        <button onClick={() => setActiveSubTab("dudi")} style={{ fontWeight: activeSubTab === "dudi" ? "bold" : "normal", color: activeSubTab === "dudi" ? "#2563eb" : "#64748b", background: "none", border: "none", cursor: "pointer", fontSize: "1.1rem" }}>Mitra Industri (DUDI)</button>
        <button onClick={() => setActiveSubTab("placement")} style={{ fontWeight: activeSubTab === "placement" ? "bold" : "normal", color: activeSubTab === "placement" ? "#2563eb" : "#64748b", background: "none", border: "none", cursor: "pointer", fontSize: "1.1rem" }}>Penempatan Siswa</button>
        <button onClick={() => setActiveSubTab("journal")} style={{ fontWeight: activeSubTab === "journal" ? "bold" : "normal", color: activeSubTab === "journal" ? "#2563eb" : "#64748b", background: "none", border: "none", cursor: "pointer", fontSize: "1.1rem" }}>Monitoring Jurnal</button>
        <button onClick={() => setActiveSubTab("grade")} style={{ fontWeight: activeSubTab === "grade" ? "bold" : "normal", color: activeSubTab === "grade" ? "#2563eb" : "#64748b", background: "none", border: "none", cursor: "pointer", fontSize: "1.1rem" }}>Input Nilai Akhir</button>
      </div>

      {loading && <p>Loading data...</p>}

      {/* DUDI */}
      {activeSubTab === "dudi" && (
        <div>
          {isAdmin && (
            <div style={{ background: "#f8fafc", padding: "1.5rem", borderRadius: "8px", border: "1px solid #e2e8f0", marginBottom: "2rem" }}>
              <h3 style={{ marginBottom: "1rem" }}>Tambah DUDI Baru</h3>
              <form onSubmit={handleSaveDudi} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <input type="text" placeholder="Nama Perusahaan" value={dudiForm.name} onChange={e => setDudiForm({...dudiForm, name: e.target.value})} className="form-input" required style={{ width: "100%", padding: "0.5rem" }}/>
                <input type="text" placeholder="Bidang Usaha" value={dudiForm.field} onChange={e => setDudiForm({...dudiForm, field: e.target.value})} className="form-input" style={{ width: "100%", padding: "0.5rem" }}/>
                <input type="text" placeholder="Alamat Lengkap" value={dudiForm.address} onChange={e => setDudiForm({...dudiForm, address: e.target.value})} className="form-input" style={{ gridColumn: "1 / -1", width: "100%", padding: "0.5rem" }} required />
                <input type="text" placeholder="Nama Pimpinan" value={dudiForm.leaderName} onChange={e => setDudiForm({...dudiForm, leaderName: e.target.value})} className="form-input" style={{ width: "100%", padding: "0.5rem" }}/>
                <input type="text" placeholder="Nama Pembimbing Industri" value={dudiForm.mentorName} onChange={e => setDudiForm({...dudiForm, mentorName: e.target.value})} className="form-input" style={{ width: "100%", padding: "0.5rem" }}/>
                <input type="number" placeholder="Kuota Siswa" value={dudiForm.quota} onChange={e => setDudiForm({...dudiForm, quota: e.target.value})} className="form-input" required style={{ width: "100%", padding: "0.5rem" }}/>
                <button type="submit" style={{ gridColumn: "1 / -1", padding: "0.75rem", background: "#2563eb", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>Simpan DUDI</button>
              </form>
            </div>
          )}

          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#e2e8f0", textAlign: "left" }}>
                <th style={{ padding: "0.75rem" }}>Nama Perusahaan</th>
                <th style={{ padding: "0.75rem" }}>Bidang</th>
                <th style={{ padding: "0.75rem" }}>Pembimbing (Industri)</th>
                <th style={{ padding: "0.75rem" }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {dudis.map(d => (
                <tr key={d.id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                  <td style={{ padding: "0.75rem" }}><strong>{d.name}</strong><br/><span style={{ fontSize: "0.85rem", color: "#64748b" }}>{d.address}</span></td>
                  <td style={{ padding: "0.75rem" }}>{d.field}</td>
                  <td style={{ padding: "0.75rem" }}>{d.mentorName}</td>
                  <td style={{ padding: "0.75rem" }}>
                    {d.signature ? (
                       <img src={d.signature} alt="TTD" style={{ height: "30px", objectFit: "contain", marginBottom: "0.25rem" }} />
                    ) : <span style={{ fontSize: "0.8rem", color: "#ef4444" }}>Belum Ada</span>}
                    <label style={{ display: "block", fontSize: "0.8rem", cursor: "pointer", color: "#2563eb", fontWeight: "bold" }}>
                      Upload TTD
                      <input type="file" accept="image/png, image/jpeg" style={{ display: "none" }} onChange={(e) => handleUploadDudiSignature(d.id, e)} />
                    </label>
                  </td>
                  <td style={{ padding: "0.75rem" }}>
                    <button onClick={() => handleDeleteDudi(d.id)} style={{ padding: "0.4rem 0.8rem", fontSize: "0.85rem", background: "#ef4444", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>Hapus</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* PLACEMENT */}
      {activeSubTab === "placement" && (
        <div>
          {!isAdmin && (
            <div style={{ background: "#fef3c7", padding: "1.5rem", borderRadius: "8px", border: "1px solid #fde68a", marginBottom: "2rem" }}>
               <p style={{ color: "#92400e", fontWeight: "bold", margin: 0 }}>⚠️ Plotting Siswa saat ini dilakukan melalui Sistem Admin Utama. Fitur ini hanya untuk monitoring Guru.</p>
            </div>
          )}

          {isAdmin && (
            <div style={{ background: "#f8fafc", padding: "1.5rem", borderRadius: "8px", border: "1px solid #e2e8f0", marginBottom: "2rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <h3 style={{ margin: 0 }}>Tambah Penempatan Siswa Baru</h3>
                <button 
                  onClick={() => setPreviewPlacement({
                    id: "dummy-placement-123",
                    student: { name: "NAMA SISWA CONTOH", kelas: "XII JURUSAN CONTOH", nisn: "1234567890" },
                    studentNisn: "1234567890",
                    dudi: { name: "PT. PERUSAHAAN CONTOH", leaderName: "Bpk. Pimpinan Contoh", signature: "" },
                    teacherName: "Nama Guru Pembimbing",
                    startDate: new Date().toISOString(),
                    endDate: new Date().toISOString(),
                    grade: { finalScore: 95, predicate: "Sangat Baik" }
                  })}
                  style={{ padding: "0.5rem 1rem", fontSize: "0.85rem", background: "#8b5cf6", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold", display: "flex", alignItems: "center", gap: "0.4rem" }}
                  title="Pratinjau Layout Sertifikat (Data Dummy)"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                  Contoh Sertifikat
                </button>
              </div>
              <div style={{ marginBottom: "1rem" }}>
                <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} className="form-input" style={{ width: "100%", padding: "0.5rem" }}>
                  <option value="">-- Tampilkan Semua Kelas --</option>
                  {Array.from(new Set(adminStudents?.map(s => s.kelas))).filter(Boolean).sort().map(k => (
                    <option key={k} value={k}>Kelas {k}</option>
                  ))}
                </select>
              </div>
              <form onSubmit={handleSavePlacement} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <select value={placementForm.studentNisn} onChange={e => setPlacementForm({...placementForm, studentNisn: e.target.value})} className="form-input" required style={{ width: "100%", padding: "0.5rem" }}>
                  <option value="">-- Pilih Siswa --</option>
                  {adminStudents && adminStudents.filter(s => selectedClass ? s.kelas === selectedClass : true).map(s => <option key={s.nisn} value={s.nisn}>{s.name} ({s.nisn}) - {s.kelas}</option>)}
                </select>
                <select value={placementForm.dudiId} onChange={e => setPlacementForm({...placementForm, dudiId: e.target.value})} className="form-input" required style={{ width: "100%", padding: "0.5rem" }}>
                  <option value="">-- Pilih DUDI --</option>
                  {dudis.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
                <select value={placementForm.teacherUsername} onChange={e => setPlacementForm({...placementForm, teacherUsername: e.target.value})} className="form-input" required style={{ width: "100%", padding: "0.5rem", gridColumn: "1 / -1" }}>
                  <option value="">-- Pilih Guru Pembimbing --</option>
                  {adminTeachers && adminTeachers.map(t => <option key={t.username} value={t.username}>{t.name}</option>)}
                </select>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "bold", marginBottom: "0.3rem" }}>Tanggal Mulai</label>
                  <input type="date" value={placementForm.startDate} onChange={e => setPlacementForm({...placementForm, startDate: e.target.value})} className="form-input" required style={{ width: "100%", padding: "0.5rem" }}/>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "bold", marginBottom: "0.3rem" }}>Tanggal Selesai</label>
                  <input type="date" value={placementForm.endDate} onChange={e => setPlacementForm({...placementForm, endDate: e.target.value})} className="form-input" required style={{ width: "100%", padding: "0.5rem" }}/>
                </div>
                <button type="submit" style={{ gridColumn: "1 / -1", padding: "0.75rem", background: "#2563eb", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>Simpan Penempatan</button>
              </form>
            </div>
          )}

          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#e2e8f0", textAlign: "left" }}>
                <th style={{ padding: "0.75rem" }}>Siswa</th>
                <th style={{ padding: "0.75rem" }}>Penempatan DUDI</th>
                <th style={{ padding: "0.75rem" }}>Guru Pembimbing</th>
                <th style={{ padding: "0.75rem" }}>Periode</th>
                <th style={{ padding: "0.75rem" }}>Status</th>
                <th style={{ padding: "0.75rem" }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {placements.map(p => (
                <tr key={p.id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                  <td style={{ padding: "0.75rem" }}><strong>{p.student?.name}</strong><br/><span style={{ fontSize: "0.85rem", color: "#64748b" }}>{p.studentNisn}</span></td>
                  <td style={{ padding: "0.75rem" }}>{p.dudi?.name}</td>
                  <td style={{ padding: "0.75rem" }}>{p.teacherName}</td>
                  <td style={{ padding: "0.75rem", fontSize: "0.85rem" }}>{new Date(p.startDate).toLocaleDateString()} - {new Date(p.endDate).toLocaleDateString()}</td>
                  <td style={{ padding: "0.75rem" }}>
                    <span style={{ background: p.status === "AKTIF" ? "#dcfce7" : "#f1f5f9", color: p.status === "AKTIF" ? "#16a34a" : "#475569", padding: "0.3rem 0.6rem", borderRadius: "4px", fontSize: "0.8rem", fontWeight: "bold" }}>{p.status}</span>
                  </td>
                  <td style={{ padding: "0.75rem" }}>
                    {isAdmin && (
                      <button onClick={() => handleDeletePlacement(p.id)} style={{ padding: "0.4rem 0.8rem", fontSize: "0.85rem", background: "#ef4444", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", marginRight: "0.5rem" }}>Hapus</button>
                    )}
                    {p.grade && p.grade.finalScore >= 70 && (
                      <button onClick={() => setPreviewPlacement(p)} style={{ padding: "0.4rem 0.8rem", fontSize: "0.85rem", background: "#22c55e", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>Sertifikat</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* JOURNAL MONITORING */}
      {activeSubTab === "journal" && (
        <div>
          <p style={{ marginBottom: "1rem", color: "#64748b" }}>Menampilkan jurnal harian dari siswa yang Anda bimbing.</p>
          {mentorPlacements.map(p => (
            <div key={p.id} style={{ background: "#fff", padding: "1.5rem", borderRadius: "8px", border: "1px solid #e2e8f0", marginBottom: "1.5rem" }}>
              <h3 style={{ margin: "0 0 1rem 0", color: "#0f172a" }}>{p.student?.name} <span style={{ fontSize: "0.9rem", color: "#64748b", fontWeight: "normal" }}>di {p.dudi?.name}</span></h3>
              
              {p.journals.length === 0 ? <p style={{ fontStyle: "italic", color: "#94a3b8" }}>Belum ada entri jurnal.</p> : (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {p.journals.map(j => (
                    <div key={j.id} style={{ display: "flex", gap: "1.5rem", borderLeft: `4px solid ${j.status === 'APPROVED' ? '#22c55e' : j.status === 'REJECTED' ? '#ef4444' : '#eab308'}`, padding: "1rem", background: "#f8fafc", borderRadius: "4px" }}>
                      {j.imagePath && <img src={j.imagePath} alt="Bukti" style={{ width: "120px", height: "120px", objectFit: "cover", borderRadius: "8px" }} />}
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: "0.5rem" }}>{j.date}</div>
                        <p style={{ margin: "0 0 1rem 0", color: "#334155" }}>{j.activity}</p>
                        
                        {j.status === "PENDING" ? (
                          <div style={{ display: "flex", gap: "0.5rem" }}>
                            <button onClick={() => handleApproveJournal(j.id, "APPROVED")} style={{ background: "#22c55e", color: "white", padding: "0.4rem 1rem", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>Approve</button>
                            <button onClick={() => handleApproveJournal(j.id, "REJECTED")} style={{ background: "#ef4444", color: "white", padding: "0.4rem 1rem", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>Tolak</button>
                          </div>
                        ) : (
                          <span style={{ fontWeight: "bold", color: j.status === "APPROVED" ? "#16a34a" : "#dc2626" }}>{j.status}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* GRADING */}
      {activeSubTab === "grade" && (
        <div>
           <p style={{ marginBottom: "1rem", color: "#64748b" }}>Input nilai akhir magang yang diberikan oleh pihak Perusahaan (Sertifikat) ke dalam sistem.</p>
           {mentorPlacements.map(p => (
            <div key={p.id} style={{ background: "#fff", padding: "1.5rem", borderRadius: "8px", border: "1px solid #e2e8f0", marginBottom: "1.5rem" }}>
              <h3 style={{ margin: "0 0 1rem 0", color: "#0f172a" }}>{p.student?.name} <span style={{ fontSize: "0.9rem", color: "#64748b", fontWeight: "normal" }}>- {p.dudi?.name}</span></h3>
              <form onSubmit={(e) => submitGrade(e, p.id)} style={{ display: "flex", gap: "1rem", alignItems: "flex-end" }}>
                 <div style={{ flex: 1 }}>
                    <label style={{ fontSize: "0.85rem", fontWeight: "bold", display: "block", marginBottom: "0.5rem" }}>Nilai Teknis (Industri)</label>
                    <input type="number" name="tScore" className="form-input" placeholder="0-100" required style={{ width: "100%", padding: "0.5rem" }}/>
                 </div>
                 <div style={{ flex: 1 }}>
                    <label style={{ fontSize: "0.85rem", fontWeight: "bold", display: "block", marginBottom: "0.5rem" }}>Nilai Sikap (Industri)</label>
                    <input type="number" name="ntScore" className="form-input" placeholder="0-100" required style={{ width: "100%", padding: "0.5rem" }}/>
                 </div>
                 <div style={{ flex: 1 }}>
                    <label style={{ fontSize: "0.85rem", fontWeight: "bold", display: "block", marginBottom: "0.5rem" }}>Nilai Jurnal (Sekolah)</label>
                    <input type="number" name="sScore" className="form-input" placeholder="0-100" required style={{ width: "100%", padding: "0.5rem" }}/>
                 </div>
                 <div style={{ flex: 2 }}>
                    <label style={{ fontSize: "0.85rem", fontWeight: "bold", display: "block", marginBottom: "0.5rem" }}>Catatan / Predikat</label>
                    <input type="text" name="notes" className="form-input" placeholder="Sangat Memuaskan..." style={{ width: "100%", padding: "0.5rem" }}/>
                 </div>
                 <button type="submit" style={{ padding: "0.65rem 1.5rem", background: "#2563eb", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>Simpan Nilai</button>
              </form>
            </div>
           ))}
        </div>
      )}
      {previewPlacement && (
        <PklCertificateModal placement={previewPlacement} school={school} onClose={() => setPreviewPlacement(null)} />
      )}
    </div>
  );
}

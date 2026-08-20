"use client";

import React, { useState, useEffect } from "react";
import { 
  saveExamSchedule, 
  deleteExamSchedule, 
  toggleForceOpen,
  resetStudentExam,
  getAdminDashboardData
} from "../../actions/admin";

export default function PengawasTab() {
  const [examSchedules, setExamSchedules] = useState([]);
  const [newJadwal, setNewJadwal] = useState({
    subjectName: "",
    category: "UTS",
    semester: "1",
    startTime: "",
    endTime: "",
    forceOpen: false
  });
  const [jadwalMessage, setJadwalMessage] = useState("");
  const [subjects, setSubjects] = useState([]);

  // Fetch schedules manually by hitting admin dashboard data or a specific endpoint
  const loadData = async () => {
    const res = await getAdminDashboardData();
    if (res.success) {
      setExamSchedules(res.examSchedules || []);
      setSubjects(res.subjects || []);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveJadwal = async (e) => {
    e.preventDefault();
    setJadwalMessage("");
    if (!newJadwal.subjectName) {
      setJadwalMessage("Gagal: Silakan pilih mata pelajaran.");
      return;
    }
    const res = await saveExamSchedule(newJadwal);
    if (res.success) {
      setJadwalMessage("Sukses: Jadwal ujian berhasil disimpan.");
      setNewJadwal({
        subjectName: "",
        category: "UTS",
        semester: "1",
        startTime: "",
        endTime: "",
        forceOpen: false
      });
      loadData();
    } else {
      setJadwalMessage("Error: " + (res.error || "Terjadi kesalahan."));
    }
  };

  const handleDeleteJadwal = async (id, subject, category, semester) => {
    if (confirm(`Apakah Anda yakin ingin menghapus jadwal ujian ${category} ${subject} Smt ${semester}?`)) {
      const res = await deleteExamSchedule(id);
      if (res.success) {
        loadData();
      } else {
        alert("Gagal menghapus jadwal ujian.");
      }
    }
  };

  const handleToggleForceOpen = async (id, currentValue) => {
    if (confirm(currentValue ? "Tutup ujian paksa (Kembali ke jadwal otomatis)?" : "Buka ujian secara paksa (Abaikan jadwal)?")) {
      const res = await toggleForceOpen(id, !currentValue);
      if (res.success) {
        loadData();
      } else {
        alert("Gagal mengubah status ujian.");
      }
    }
  };

  const handleResetStudent = async (nisn, subjectName, category) => {
      const targetNisn = prompt("Masukkan NISN siswa yang ingin direset sesi ujiannya (hapus nilai & status):", nisn || "");
      if (!targetNisn) return;
      const res = await resetStudentExam(targetNisn, subjectName, category);
      if (res.success) {
          alert(`Sukses mereset ujian siswa dengan NISN ${targetNisn}`);
          loadData();
      } else {
          alert("Gagal mereset ujian: " + res.error);
      }
  };

  return (
    <div className="no-print">
      <span style={{ fontSize: "0.85rem", textTransform: "uppercase", fontWeight: 700, color: "var(--secondary)" }}>Ujian CBT</span>
      <h2 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--primary-dark)", marginBottom: "1.5rem" }}>
        Manajemen & Pengawasan Ujian
      </h2>

      <div className="grid grid-2" style={{ gap: "2rem" }}>
        {/* Sisi Kiri: Tambah/Atur Jadwal */}
        <div>
          <div className="card" style={{ padding: "1.5rem", borderTop: "3px solid var(--primary)" }}>
            <h3 style={{ fontWeight: 700, color: "var(--primary-dark)", marginBottom: "1rem" }}>Atur Jadwal & Sesi</h3>
            {jadwalMessage && (
              <div style={{ padding: "0.75rem", marginBottom: "1rem", backgroundColor: jadwalMessage.startsWith("Sukses") ? "#dcfce7" : "#fee2e2", color: jadwalMessage.startsWith("Sukses") ? "#166534" : "#991b1b", borderRadius: "var(--radius-sm)", fontSize: "0.9rem" }}>
                {jadwalMessage}
              </div>
            )}
            <form onSubmit={handleSaveJadwal}>
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem", fontWeight: 600 }}>Mata Pelajaran</label>
                <select className="input" value={newJadwal.subjectName} onChange={e => setNewJadwal({...newJadwal, subjectName: e.target.value})} required>
                  <option value="">-- Pilih Mata Pelajaran --</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.name}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-2" style={{ gap: "1rem", marginBottom: "1rem" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem", fontWeight: 600 }}>Kategori</label>
                  <select className="input" value={newJadwal.category} onChange={e => setNewJadwal({...newJadwal, category: e.target.value})}>
                    <option value="UTS">UTS</option>
                    <option value="UAS">UAS</option>
                    <option value="PAJ">PAJ (Akhir Jenjang)</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem", fontWeight: 600 }}>Semester</label>
                  <select className="input" value={newJadwal.semester} onChange={e => setNewJadwal({...newJadwal, semester: e.target.value})}>
                    <option value="1">1 (Ganjil)</option>
                    <option value="2">2 (Genap)</option>
                    <option value="3">3 (Ganjil)</option>
                    <option value="4">4 (Genap)</option>
                    <option value="5">5 (Ganjil)</option>
                    <option value="6">6 (Genap)</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-2" style={{ gap: "1rem", marginBottom: "1.5rem" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem", fontWeight: 600 }}>Waktu Mulai</label>
                  <input type="datetime-local" className="input" value={newJadwal.startTime} onChange={e => setNewJadwal({...newJadwal, startTime: e.target.value})} required />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem", fontWeight: 600 }}>Waktu Selesai</label>
                  <input type="datetime-local" className="input" value={newJadwal.endTime} onChange={e => setNewJadwal({...newJadwal, endTime: e.target.value})} required />
                </div>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }}>
                Simpan Jadwal Ujian
              </button>
            </form>
          </div>
        </div>

        {/* Sisi Kanan: Daftar Jadwal */}
        <div>
          <h3 style={{ fontWeight: 700, color: "var(--primary-dark)", marginBottom: "1rem" }}>Jadwal Ujian Aktif</h3>
          
          <div className="portal-table-container">
            <table className="portal-table">
              <thead>
                <tr>
                  <th>Ujian</th>
                  <th>Waktu</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {examSchedules.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: "center", fontStyle: "italic", color: "var(--text-muted)", padding: "1.5rem" }}>
                      Belum ada jadwal ujian yang dibuat.
                    </td>
                  </tr>
                ) : (
                  examSchedules.map(sch => {
                    const startStr = new Date(sch.startTime).toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
                    const endStr = new Date(sch.endTime).toLocaleString("id-ID", { hour: "2-digit", minute: "2-digit" });
                    const isPassed = new Date() > new Date(sch.endTime);
                    const isActive = new Date() >= new Date(sch.startTime) && new Date() <= new Date(sch.endTime);
                    
                    return (
                      <tr key={sch.id}>
                        <td>
                          <strong>{sch.subjectName}</strong><br/>
                          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{sch.category} - Smt {sch.semester}</span>
                        </td>
                        <td style={{ fontSize: "0.85rem" }}>
                          {startStr} s/d {endStr}
                        </td>
                        <td>
                          {sch.forceOpen ? (
                            <span className="badge" style={{ backgroundColor: "#dcfce7", color: "#166534" }}>Buka Paksa</span>
                          ) : isActive ? (
                            <span className="badge" style={{ backgroundColor: "#dbeafe", color: "#1e40af" }}>Sedang Aktif</span>
                          ) : isPassed ? (
                            <span className="badge" style={{ backgroundColor: "#f3f4f6", color: "#4b5563" }}>Berakhir</span>
                          ) : (
                            <span className="badge" style={{ backgroundColor: "#fef3c7", color: "#92400e" }}>Menunggu</span>
                          )}
                        </td>
                        <td>
                          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                            <button 
                              className="btn btn-outline" 
                              style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem", backgroundColor: sch.forceOpen ? "#fef2f2" : "#f0fdf4", color: sch.forceOpen ? "#ef4444" : "#166534", borderColor: sch.forceOpen ? "#fca5a5" : "#86efac" }}
                              onClick={() => handleToggleForceOpen(sch.id, sch.forceOpen)}
                            >
                              {sch.forceOpen ? "Kunci" : "Buka Paksa"}
                            </button>
                            <button 
                              className="btn btn-outline" 
                              style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem", backgroundColor: "#fef2f2", color: "#ef4444", borderColor: "#fca5a5" }}
                              onClick={() => handleResetStudent("", sch.subjectName, sch.category)}
                            >
                              Reset Siswa
                            </button>
                            <button 
                              className="btn btn-outline" 
                              style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem", color: "#ef4444", borderColor: "#fca5a5" }}
                              onClick={() => handleDeleteJadwal(sch.id, sch.subjectName, sch.category, sch.semester)}
                            >
                              Hapus
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

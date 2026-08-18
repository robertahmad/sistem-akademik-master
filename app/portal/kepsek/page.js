"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { loginAction, logoutAction } from "../../actions/auth";
import { getKepsekDashboard } from "../../actions/kepsek";
import { saveSchoolProfile } from "../../actions/admin";
import { getBendaharaDashboardData } from "../../actions/bendahara";
import { getAllSppd, updateSppdStatus } from "../../actions/sppd";
import SettingsTab from "../guru/SettingsTab";

export default function PortalKepsek() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // Form Login State
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  // Data Dashboard State
  const [school, setSchool] = useState({});
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [examSchedules, setExamSchedules] = useState([]);
  const [grades, setGrades] = useState([]);
  const [examSubmissions, setExamSubmissions] = useState([]);
  const [raporRecords, setRaporRecords] = useState([]);
  const [financialData, setFinancialData] = useState(null);

  // UI Navigation State
  const [activeTab, setActiveTab] = useState("ringkasan"); // "ringkasan", "sekolah", "guru", "siswa", "cbt", "keuangan", "sppd"
  const [sppdList, setSppdList] = useState([]);
  const [sppdLoading, setSppdLoading] = useState(false);
  const [sppdFilter, setSppdFilter] = useState("MENUNGGU"); // "SEMUA", "MENUNGGU", "DISETUJUI", "DITOLAK"
  
  const [selectedClass, setSelectedClass] = useState("all");
  const [selectedStudentForGrades, setSelectedStudentForGrades] = useState(null);
  const [kepsekSelectedSemester, setKepsekSelectedSemester] = useState("1");
  const [schoolSuccessMessage, setSchoolSuccessMessage] = useState("");
  const [schoolLogoPreview, setSchoolLogoPreview] = useState("🏫");
  const [schoolSubTab, setSchoolSubTab] = useState("profil");

  // Fetch Dashboard Data
  const fetchDashboard = async () => {
    setLoading(true);
    const res = await getKepsekDashboard();
    if (res.success) {
      setSchool(res.school);
      setSchoolLogoPreview(res.school.logo || "🏫");
      setTeachers(res.teachers);
      setStudents(res.students);
      setSubjects(res.subjects);
      setExamSchedules(res.examSchedules);
      setGrades(res.grades);
      setExamSubmissions(res.examSubmissions);
      setRaporRecords(res.raporRecords);
      setSession({
        name: res.school.kepsek || "Kepala Sekolah",
        role: "kepsek"
      });

      const finRes = await getBendaharaDashboardData();
      if (finRes.success) setFinancialData(finRes);
    } else {
      setSession(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  useEffect(() => {
    const loadSppd = async () => {
      if (activeTab === "sppd") {
        setSppdLoading(true);
        const data = await getAllSppd();
        setSppdList(data || []);
        setSppdLoading(false);
      }
    };
    loadSppd();
  }, [activeTab]);

  const handleSppdAction = async (id, status) => {
    let catatan = "";
    if (status === "DITOLAK") {
      catatan = prompt("Masukkan alasan penolakan:");
      if (catatan === null) return;
    }
    
    if (!confirm(`Anda yakin ingin mengubah status SPPD ini menjadi ${status}?`)) return;
    
    setSppdLoading(true);
    const res = await updateSppdStatus(id, status, catatan);
    if (res.success) {
      const data = await getAllSppd();
      setSppdList(data || []);
    } else {
      alert("Gagal memperbarui status: " + res.error);
    }
    setSppdLoading(false);
  };

  const handleSchoolSubmit = async (e) => {
    e.preventDefault();
    setSchoolSuccessMessage("");
    const res = await saveSchoolProfile(school);
    if (res.success) {
      setSchoolSuccessMessage("Profil sekolah berhasil disimpan ke cloud database.");
      await fetchDashboard();
    } else {
      alert("Gagal memperbarui profil sekolah.");
    }
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const base64 = evt.target.result;
      setSchoolLogoPreview(base64);
      setSchool(prev => ({ ...prev, logo: base64 }));
    };
    reader.readAsDataURL(file);
  };

  // Handle Login Submit
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError("");
    const res = await loginAction("kepsek", username, password);
    if (res.success) {
      setUsername("");
      setPassword("");
      await fetchDashboard();
    } else {
      setLoginError(res.error);
    }
  };

  // Handle Logout
  const handleLogout = async () => {
    await logoutAction();
    setSession(null);
    setDashboardData(null);
  };

  // Filter Kelas Siswa
  const uniqueClasses = ["X-A", "X-B", "XI-A", "XI-B", "XII-A", "XII-B"];
  
  const getFilteredStudents = () => {
    if (selectedClass === "all") return students;
    return students.filter(s => s.kelas === selectedClass);
  };

  // Hitung jumlah nilai yang diinput oleh Guru
  const getTeacherGradeStats = (teacher) => {
    let countGradesInputted = 0;
    if (teacher.role === "guru-mapel") {
      // Hitung baris nilai untuk mata pelajaran yang diampu guru ini
      const teacherSubjects = teacher.subjects || [];
      const teacherGrades = grades.filter(g => teacherSubjects.includes(g.subjectName));
      countGradesInputted = teacherGrades.length;
    } else if (teacher.role === "wali-kelas") {
      // Wali kelas: hitung jumlah rapor record yang telah diisi catatan
      const classStudents = students.filter(s => s.kelas === teacher.kelas).map(s => s.nisn);
      const classRapors = raporRecords.filter(r => classStudents.includes(r.studentNisn) && r.catatanWali);
      countGradesInputted = classRapors.length;
    }
    return countGradesInputted;
  };

  if (loading) {
    return (
      <div className="portal-wrapper" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <div style={{ textAlign: "center" }}>
          <div className="logo-icon animate-pulse" style={{ margin: "0 auto 1rem auto", backgroundColor: "var(--secondary)" }}>K</div>
          <p style={{ fontWeight: 600, color: "var(--secondary)" }}>Memuat data sesi Kepala Sekolah...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* PAGE HEADER */}
      <section className="page-header" style={{ backgroundColor: "var(--secondary)" }}>
        <div className="container">
          <h1 className="page-header-title">Portal Kepala Sekolah</h1>
          <div className="page-header-breadcrumbs">
            <Link href="/">Beranda</Link>
            <span className="breadcrumb-separator">/</span>
            <span>Dashboard Kepala Sekolah</span>
          </div>
        </div>
      </section>

      <div className="portal-wrapper">
        <div className="container" style={{ maxWidth: "1400px" }}>
          {/* 1. LOGIN FORM */}
          {!session && (
            <section className="login-section" id="portal-kepsek-login-section">
              <div className="login-card" style={{ borderColor: "var(--secondary)" }}>
                <div className="login-header">
                  <div className="login-icon-box" style={{ backgroundColor: "var(--secondary)" }}>KS</div>
                  <h2 className="login-card-title">Login Kepala Sekolah</h2>
                  <p className="login-card-subtitle">Gunakan kredensial khusus Kepala Sekolah</p>
                </div>

                {loginError && (
                  <div className="form-alert error" style={{ display: "block", marginBottom: "1.5rem" }}>
                    {loginError}
                  </div>
                )}


                <form onSubmit={handleLogin}>
                  <div className="form-group">
                    <label htmlFor="portal-kepsek-username" className="form-label">Username</label>
                    <input 
                      type="text" 
                      id="portal-kepsek-username" 
                      className="form-input" 
                      placeholder="Username Kepala Sekolah" 
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required 
                      autoComplete="username"
                    />
                  </div>
                  
                  <div className="form-group" style={{ marginBottom: "2rem", marginTop: "1rem" }}>
                    <label htmlFor="portal-kepsek-password" className="form-label">Password</label>
                    <input 
                      type="password" 
                      id="portal-kepsek-password" 
                      className="form-input" 
                      placeholder="Masukkan password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required 
                      autoComplete="current-password"
                    />
                  </div>

                  <button type="submit" className="btn" style={{ width: "100%", backgroundColor: "var(--secondary)", color: "white" }}>
                    Masuk Ke Portal
                  </button>
                </form>
              </div>
            </section>
          )}

          {/* 2. MAIN KEPSEK DASHBOARD */}
          {/* 2. MAIN KEPSEK DASHBOARD */}
          {session && (
            <div className="portal-layout">
              {/* Header Menu Horizontal Kepsek */}
              <aside className="portal-sidebar no-print">
                {/* Watermark Ornamen Geometris */}
                <div style={{ position: "absolute", top: "-15px", right: "-15px", opacity: 0.035, pointerEvents: "none", zIndex: 0 }}>
                  <svg width="100" height="100" viewBox="0 0 100 100" fill="none" stroke="var(--secondary)" strokeWidth="2">
                    <circle cx="50" cy="50" r="40" />
                    <circle cx="50" cy="50" r="30" />
                    <polygon points="50,10 90,50 50,90 10,50" />
                    <polygon points="50,20 80,50 50,80 20,50" />
                  </svg>
                </div>

                {/* Header Administratif */}
                <div className="portal-sidebar-header" style={{ position: "relative", zIndex: 1, paddingBottom: "1.25rem", borderBottom: "1px solid var(--border-color)", marginBottom: "1rem", width: "100%" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <div style={{ backgroundColor: "rgba(217, 119, 6, 0.08)", color: "var(--secondary)", padding: "0.45rem", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
                        <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                        <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" />
                      </svg>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", lineHeight: "1.2" }}>
                      <span style={{ fontSize: "0.85rem", fontWeight: 800, color: "var(--secondary)", whiteSpace: "nowrap" }}>Panel Kepala Sekolah</span>
                      <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 500 }}>Sekolah Master Demo</span>
                    </div>
                  </div>
                </div>

                <div className="sidebar-menu" style={{ width: "100%", zIndex: 1 }}>
                  <button 
                    className={`sidebar-btn ${activeTab === "ringkasan" ? "active" : ""}`}
                    onClick={() => { setActiveTab("ringkasan"); setSelectedStudentForGrades(null); }}
                  >
                    <svg className="tab-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
                      <line x1="18" y1="20" x2="18" y2="10" />
                      <line x1="12" y1="20" x2="12" y2="4" />
                      <line x1="6" y1="20" x2="6" y2="14" />
                    </svg>
                    Ringkasan Sekolah
                  </button>
                  <button 
                    className={`sidebar-btn ${activeTab === "sekolah" ? "active" : ""}`}
                    onClick={() => { setActiveTab("sekolah"); setSelectedStudentForGrades(null); }}
                  >
                    <svg className="tab-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
                      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                      <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" />
                    </svg>
                    Profil & Konten Sekolah
                  </button>
                  <button 
                    className={`sidebar-btn ${activeTab === "guru" ? "active" : ""}`}
                    onClick={() => { setActiveTab("guru"); setSelectedStudentForGrades(null); }}
                  >
                    <svg className="tab-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                    Pemantauan Guru
                  </button>
                  <button 
                    className={`sidebar-btn ${activeTab === "siswa" ? "active" : ""}`}
                    onClick={() => { setActiveTab("siswa"); setSelectedStudentForGrades(null); }}
                  >
                    <svg className="tab-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
                      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                      <path d="M6 12v5c0 2 2.7 3.5 6 3.5s6-1.5 6-3.5v-5" />
                    </svg>
                    Pemantauan Siswa & Nilai
                  </button>
                  <button 
                    className={`sidebar-btn ${activeTab === "cbt" ? "active" : ""}`}
                    onClick={() => { setActiveTab("cbt"); setSelectedStudentForGrades(null); }}
                  >
                    <svg className="tab-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <path d="M9 17H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v4" />
                      <path d="M15 13h6" />
                      <path d="M18 10v6" />
                    </svg>
                    Pemantauan Ujian CBT
                  </button>

                  <button 
                    className={`sidebar-btn ${activeTab === "keuangan" ? "active" : ""}`}
                    onClick={() => { setActiveTab("keuangan"); setSelectedStudentForGrades(null); }}
                    style={{ color: "#0d9488", fontWeight: "bold" }}
                  >
                    <svg className="tab-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
                      <line x1="12" y1="1" x2="12" y2="23" />
                      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                    </svg>
                    Monitoring Keuangan & BOS
                  </button>
                  
                  <button 
                    className={`sidebar-btn ${activeTab === "sppd" ? "active" : ""}`}
                    onClick={() => { setActiveTab("sppd"); setSelectedStudentForGrades(null); }}
                  >
                    <svg className="tab-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
                      <path d="M22 2L11 13" />
                      <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                    Persetujuan SPPD
                  </button>

                  <button 
                    className="sidebar-btn btn-logout" 
                    onClick={handleLogout}
                  >
                    <svg className="tab-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    Keluar Portal
                  </button>
                </div>
              </aside>

              {/* Main Content Area */}
              <main className="portal-main-content">
                
                {/* TAB 1: RINGKASAN SEKOLAH */}
                {activeTab === "ringkasan" && (
                  <div>
                    <h2 className="portal-content-title">Ringkasan Operasional Sekolah</h2>
                    <p style={{ color: "var(--text-muted)", marginBottom: "2rem" }}>
                      Statistik data akademik aktif pada Tahun Ajaran {school.tahunAjaran} - Semester {school.semester}
                    </p>

                    {/* Stats Grid */}
                    <div className="grid grid-4" style={{ marginBottom: "2rem" }}>
                      <div className="stat-card" style={{ borderLeft: "4px solid var(--secondary)", padding: "1.5rem", backgroundColor: "var(--bg-alt)", borderRadius: "var(--radius-md)" }}>
                        <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: "bold" }}>TOTAL SISWA</span>
                        <h2 style={{ fontSize: "2rem", fontWeight: "800", color: "var(--primary-dark)", margin: "0.5rem 0" }}>{students.length}</h2>
                        <span style={{ fontSize: "0.75rem", color: "var(--secondary)" }}>Terdaftar Aktif</span>
                      </div>
                      <div className="stat-card" style={{ borderLeft: "4px solid #2563eb", padding: "1.5rem", backgroundColor: "var(--bg-alt)", borderRadius: "var(--radius-md)" }}>
                        <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: "bold" }}>TOTAL GURU</span>
                        <h2 style={{ fontSize: "2rem", fontWeight: "800", color: "var(--primary-dark)", margin: "0.5rem 0" }}>{teachers.length}</h2>
                        <span style={{ fontSize: "0.75rem", color: "#2563eb" }}>Pendidik & Tenaga Ahli</span>
                      </div>
                      <div className="stat-card" style={{ borderLeft: "4px solid #8b5cf6", padding: "1.5rem", backgroundColor: "var(--bg-alt)", borderRadius: "var(--radius-md)" }}>
                        <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: "bold" }}>MATA PELAJARAN</span>
                        <h2 style={{ fontSize: "2rem", fontWeight: "800", color: "var(--primary-dark)", margin: "0.5rem 0" }}>{subjects.length}</h2>
                        <span style={{ fontSize: "0.75rem", color: "#8b5cf6" }}>Aktif di Kurikulum</span>
                      </div>
                      <div className="stat-card" style={{ borderLeft: "4px solid #f59e0b", padding: "1.5rem", backgroundColor: "var(--bg-alt)", borderRadius: "var(--radius-md)" }}>
                        <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: "bold" }}>JADWAL UJIAN CBT</span>
                        <h2 style={{ fontSize: "2rem", fontWeight: "800", color: "var(--primary-dark)", margin: "0.5rem 0" }}>{examSchedules.length}</h2>
                        <span style={{ fontSize: "0.75rem", color: "#f59e0b" }}>Jadwal Aktif Ujian</span>
                      </div>
                    </div>

                    {/* Informasi Utama */}
                    <div style={{ backgroundColor: "var(--bg-alt)", padding: "2rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", marginBottom: "2rem" }}>
                      <h3 style={{ fontWeight: 700, color: "var(--primary-dark)", marginBottom: "1rem" }}>Selamat Datang, Bapak Kepala Sekolah</h3>
                      <p style={{ fontSize: "0.95rem", lineHeight: "1.6", color: "var(--text-main)" }}>
                        Melalui portal monitoring ini, Anda memiliki akses penuh untuk memantau kelancaran aktivitas akademik di <strong>{school.nama}</strong>. 
                        Anda dapat memeriksa apakah guru mata pelajaran telah menginput nilai tugas dan ujian, meninjau catatan kehadiran dari wali kelas, serta memantau riwayat ujian CBT siswa beserta nilai hasil ujian mereka.
                      </p>
                      <hr style={{ margin: "1.5rem 0", borderColor: "var(--border-color)" }} />
                      <div style={{ display: "flex", gap: "2rem", fontSize: "0.85rem" }}>
                        <div><strong>NPSN:</strong> {school.npsn}</div>
                        <div><strong>Telepon:</strong> {school.telepon}</div>
                        <div><strong>Email:</strong> {school.email}</div>
                        <div><strong>Tahun Pelajaran:</strong> {school.tahunAjaran} ({school.semester})</div>
                      </div>
                    </div>

                    {/* Grafik / Rekap Singkat */}
                    <div className="grid grid-2" style={{ gap: "2rem" }}>
                      {/* CBT Aktif */}
                      <div style={{ backgroundColor: "var(--bg-alt)", padding: "1.5rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }}>
                        <h3 style={{ fontWeight: 700, color: "var(--primary-dark)", marginBottom: "1rem" }}>Jadwal Ujian CBT Mendatang</h3>
                        {examSchedules.length === 0 ? (
                          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Tidak ada jadwal ujian aktif.</p>
                        ) : (
                          <div className="portal-table-container">
                            <table className="portal-table">
                              <thead>
                                <tr>
                                  <th>Pelajaran / Kategori</th>
                                  <th>Mulai Ujian</th>
                                  <th>Selesai Ujian</th>
                                </tr>
                              </thead>
                              <tbody>
                                {examSchedules.slice(0, 5).map(sch => (
                                  <tr key={sch.id}>
                                    <td><strong>{sch.subjectName}</strong><br /><span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{sch.category} - Sem. {sch.semester}</span></td>
                                    <td style={{ fontSize: "0.8rem" }}>{new Date(sch.startTime).toLocaleString("id-ID")}</td>
                                    <td style={{ fontSize: "0.8rem" }}>{new Date(sch.endTime).toLocaleString("id-ID")}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>

                      {/* Ujian Terakhir Diserahkan */}
                      <div style={{ backgroundColor: "var(--bg-alt)", padding: "1.5rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }}>
                        <h3 style={{ fontWeight: 700, color: "var(--primary-dark)", marginBottom: "1rem" }}>Aktivitas Ujian CBT Terkini</h3>
                        {examSubmissions.length === 0 ? (
                          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Belum ada siswa yang mengirimkan jawaban ujian.</p>
                        ) : (
                          <div className="portal-table-container">
                            <table className="portal-table">
                              <thead>
                                <tr>
                                  <th>Nama Siswa / Kelas</th>
                                  <th>Ujian</th>
                                  <th>Nilai</th>
                                </tr>
                              </thead>
                              <tbody>
                                {examSubmissions.slice(0, 5).map(sub => (
                                  <tr key={sub.id}>
                                    <td><strong>{sub.student?.name || sub.studentNisn}</strong><br /><span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Kelas {sub.student?.kelas}</span></td>
                                    <td style={{ fontSize: "0.8rem" }}>{sub.category} - {sub.subjectName}</td>
                                    <td style={{ fontWeight: "bold", color: "var(--secondary)" }}>{sub.score !== null ? sub.score : "Proses Koreksi"}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB SEKOLAH: PENGELOLAAN PROFIL & KONTEN OLEH KEPSEK */}
                {activeTab === "sekolah" && (
                  <div>
                    <span style={{ fontSize: "0.85rem", textTransform: "uppercase", fontWeight: 700, color: "var(--secondary)" }}>Pengaturan</span>
                    <h2 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--primary-dark)", marginBottom: "1rem" }}>
                      Kelola Profil & Konten Halaman Publik
                    </h2>

                    {schoolSuccessMessage && (
                      <div className="form-alert success" style={{ display: "block", marginBottom: "1.5rem" }}>
                        {schoolSuccessMessage}
                      </div>
                    )}

                    {/* Sub-tab selection */}
                    <div style={{ display: "flex", gap: "1rem", marginBottom: "2rem", borderBottom: "1px solid var(--border-color)", paddingBottom: "0.5rem" }}>
                      <button 
                        type="button" 
                        className={`btn ${schoolSubTab === "profil" ? "btn-primary" : "btn-outline"}`}
                        onClick={() => setSchoolSubTab("profil")}
                        style={{ padding: "0.5rem 1rem", fontSize: "0.85rem", margin: 0, display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
                      >
                        <svg className="tab-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
                          <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                          <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" />
                        </svg>
                        Profil Utama Sekolah
                      </button>
                      <button 
                        type="button" 
                        className={`btn ${schoolSubTab === "konten" ? "btn-primary" : "btn-outline"}`}
                        onClick={() => setSchoolSubTab("konten")}
                        style={{ padding: "0.5rem 1rem", fontSize: "0.85rem", margin: 0, display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
                      >
                        <svg className="tab-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
                          <path d="M12 20h9" />
                          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                        </svg>
                        Kelola Konten Halaman Publik
                      </button>
                      <button 
                        type="button" 
                        className={`btn ${schoolSubTab === "tanda-tangan" ? "btn-primary" : "btn-outline"}`}
                        onClick={() => setSchoolSubTab("tanda-tangan")}
                        style={{ padding: "0.5rem 1rem", fontSize: "0.85rem", margin: 0, display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
                      >
                        <svg className="tab-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="17 8 12 3 7 8" />
                          <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                        Tanda Tangan & TTE
                      </button>
                    </div>

                    {schoolSubTab === "tanda-tangan" ? (
                      <SettingsTab session={session} />
                    ) : schoolSubTab === "profil" ? (
                      <form onSubmit={handleSchoolSubmit} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
                        {/* Sisi Kiri: Detail Profil */}
                        <div>
                          <div className="form-group">
                            <label className="form-label">Nama Sekolah Resmi</label>
                            <input 
                              type="text" 
                              className="form-input" 
                              value={school.nama || ""} 
                              onChange={(e) => setSchool(prev => ({ ...prev, nama: e.target.value }))}
                              required 
                            />
                          </div>

                          <div className="form-group" style={{ marginTop: "1rem" }}>
                            <label className="form-label">Yayasan Naungan</label>
                            <input 
                              type="text" 
                              className="form-input" 
                              value={school.yayasan || ""} 
                              onChange={(e) => setSchool(prev => ({ ...prev, yayasan: e.target.value }))}
                              required 
                            />
                          </div>

                          <div className="form-group-row" style={{ marginTop: "1rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                            <div className="form-group">
                              <label className="form-label">NPSN Sekolah</label>
                              <input 
                                type="text" 
                                className="form-input" 
                                value={school.npsn || ""} 
                                onChange={(e) => setSchool(prev => ({ ...prev, npsn: e.target.value }))}
                                required 
                              />
                            </div>
                            <div className="form-group">
                              <label className="form-label">NSS Sekolah</label>
                              <input 
                                type="text" 
                                className="form-input" 
                                value={school.nss || ""} 
                                onChange={(e) => setSchool(prev => ({ ...prev, nss: e.target.value }))}
                                required 
                              />
                            </div>
                          </div>

                          <div className="form-group" style={{ marginTop: "1rem" }}>
                            <label className="form-label">Nomor SK Ijin Operasional</label>
                            <input 
                              type="text" 
                              className="form-input" 
                              value={school.skIjin || ""} 
                              onChange={(e) => setSchool(prev => ({ ...prev, skIjin: e.target.value }))}
                              required 
                            />
                          </div>

                          <div className="form-group" style={{ marginTop: "1rem" }}>
                            <label className="form-label">Alamat Lengkap Sekolah</label>
                            <textarea 
                              className="form-textarea" 
                              value={school.alamat || ""} 
                              onChange={(e) => setSchool(prev => ({ ...prev, alamat: e.target.value }))}
                              required 
                              style={{ height: "60px" }}
                            />
                          </div>

                          <div className="form-group-row" style={{ marginTop: "1rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                            <div className="form-group">
                              <label className="form-label">Nama Kepala Sekolah</label>
                              <input 
                                type="text" 
                                className="form-input" 
                                value={school.kepsek || ""} 
                                onChange={(e) => setSchool(prev => ({ ...prev, kepsek: e.target.value }))}
                                required 
                              />
                            </div>
                            <div className="form-group">
                              <label className="form-label">NIP Kepala Sekolah</label>
                              <input 
                                type="text" 
                                className="form-input" 
                                value={school.kepsekNip || ""} 
                                onChange={(e) => setSchool(prev => ({ ...prev, kepsekNip: e.target.value }))}
                                required 
                              />
                            </div>
                          </div>

                          <div className="form-group-row" style={{ marginTop: "1rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                            <div className="form-group">
                              <label className="form-label">Nama Komite Sekolah</label>
                              <input 
                                type="text" 
                                className="form-input" 
                                value={school.komite || ""} 
                                onChange={(e) => setSchool(prev => ({ ...prev, komite: e.target.value }))}
                                placeholder="Contoh: H. Suyanto, S.Pd."
                              />
                            </div>
                            <div className="form-group">
                              <label className="form-label">Nama Kepala Tata Usaha</label>
                              <input 
                                type="text" 
                                className="form-input" 
                                value={school.kepalaTu || ""} 
                                onChange={(e) => setSchool(prev => ({ ...prev, kepalaTu: e.target.value }))}
                                placeholder="Contoh: Budi Santoso, S.Kom."
                              />
                            </div>
                          </div>

                          <div className="form-group-row" style={{ marginTop: "1rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                            <div className="form-group">
                              <label className="form-label">Nama Waka Kurikulum</label>
                              <input 
                                type="text" 
                                className="form-input" 
                                value={school.wakaKur || ""} 
                                onChange={(e) => setSchool(prev => ({ ...prev, wakaKur: e.target.value }))}
                                placeholder="Contoh: Siti Rahma, S.Pd."
                              />
                            </div>
                            <div className="form-group">
                              <label className="form-label">Nama Waka Kesiswaan</label>
                              <input 
                                type="text" 
                                className="form-input" 
                                value={school.wakaSis || ""} 
                                onChange={(e) => setSchool(prev => ({ ...prev, wakaSis: e.target.value }))}
                                placeholder="Contoh: Aris Munandar, S.Or."
                              />
                            </div>
                          </div>

                          <div className="form-group-row" style={{ marginTop: "1rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                            <div className="form-group">
                              <label className="form-label">Username Login Kepala Sekolah</label>
                              <input 
                                type="text" 
                                className="form-input" 
                                value={school.kepsekUsername || ""} 
                                onChange={(e) => setSchool(prev => ({ ...prev, kepsekUsername: e.target.value }))}
                                placeholder="Default: kepsek"
                              />
                            </div>
                            <div className="form-group">
                              <label className="form-label">Password Baru Kepala Sekolah</label>
                              <input 
                                type="password" 
                                className="form-input" 
                                value={school.kepsekPassword || ""} 
                                onChange={(e) => setSchool(prev => ({ ...prev, kepsekPassword: e.target.value }))}
                                placeholder="Masukkan password baru jika ingin mengubah"
                              />
                            </div>
                          </div>

                          <div className="form-group-row" style={{ marginTop: "1rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                            <div className="form-group">
                              <label className="form-label">Semester Aktif</label>
                              <select 
                                className="form-select" 
                                value={school.semester || "Ganjil"} 
                                onChange={(e) => setSchool(prev => ({ ...prev, semester: e.target.value }))}
                                required
                              >
                                <option value="Ganjil">Ganjil</option>
                                <option value="Genap">Genap</option>
                              </select>
                            </div>
                            <div className="form-group">
                              <label className="form-label">Tahun Ajaran</label>
                              <input 
                                type="text" 
                                className="form-input" 
                                value={school.tahunAjaran || ""} 
                                onChange={(e) => setSchool(prev => ({ ...prev, tahunAjaran: e.target.value }))}
                                required 
                              />
                            </div>
                          </div>

                          <div className="form-group-row" style={{ marginTop: "1rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                            <div className="form-group">
                              <label className="form-label">Nomor Telepon Sekolah</label>
                              <input 
                                type="text" 
                                className="form-input" 
                                value={school.telepon || ""} 
                                onChange={(e) => setSchool(prev => ({ ...prev, telepon: e.target.value }))}
                                required 
                              />
                            </div>
                            <div className="form-group">
                              <label className="form-label">Email Resmi Sekolah</label>
                              <input 
                                type="email" 
                                className="form-input" 
                                value={school.email || ""} 
                                onChange={(e) => setSchool(prev => ({ ...prev, email: e.target.value }))}
                                required 
                              />
                            </div>
                          </div>

                          <div className="form-group" style={{ marginTop: "1rem" }}>
                            <label className="form-label">Tanggal Cetak Rapor</label>
                            <input 
                              type="text" 
                              className="form-input" 
                              value={school.tanggalCetak || ""} 
                              onChange={(e) => setSchool(prev => ({ ...prev, tanggalCetak: e.target.value }))}
                              required 
                            />
                          </div>

                          <div style={{ marginTop: "1.5rem", padding: "1rem", backgroundColor: "rgba(37, 99, 235, 0.05)", borderRadius: "var(--radius-md)", border: "1px solid rgba(37, 99, 235, 0.15)" }}>
                            <h4 style={{ fontWeight: 800, color: "var(--primary-dark)", fontSize: "0.9rem", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block", color: "var(--primary)" }}>
                                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                              </svg>
                              Pengaturan Mode Akses Ujian (Per-Kelas)
                              </h4>
                              <div className="form-group-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
                                {["utsMode", "uasMode", "pajMode"].map(modeKey => {
                                  const parseMode = (m, fallback) => {
                                    if (!m) return { X: fallback, XI: fallback, XII: fallback };
                                    if (m.startsWith("{")) { try { return JSON.parse(m); } catch(e) { return { X: fallback, XI: fallback, XII: fallback }; } }
                                    return { X: m, XI: m, XII: m };
                                  };
                                  const fallback = modeKey === "utsMode" ? "online" : "offline";
                                  const label = modeKey === "utsMode" ? "UTS" : modeKey === "uasMode" ? "UAS" : "PAJ";
                                  const current = parseMode(school[modeKey], fallback);
                                  const updateMode = (k, v) => setSchool(prev => ({ ...prev, [modeKey]: JSON.stringify({ ...current, [k]: v }) }));
                                  return (
                                    <div key={modeKey} className="form-group" style={{ background: "#fff", padding: "1rem", borderRadius: "8px", border: "1px solid rgba(37, 99, 235, 0.15)" }}>
                                      <label className="form-label" style={{ fontSize: "0.8rem", fontWeight: "bold", borderBottom: "1px solid #e2e8f0", paddingBottom: "0.5rem", marginBottom: "0.75rem", display: "block", color: "var(--primary-dark)" }}>Mode Ujian {label}</label>
                                      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                          <span style={{ fontSize: "0.75rem", fontWeight: "bold", width: "30%" }}>Kelas X</span>
                                          <select className="form-select" style={{ width: "65%", padding: "0.25rem", fontSize: "0.75rem" }} value={current.X} onChange={e => updateMode("X", e.target.value)}>
                                            <option value="online">Online</option><option value="offline">Offline</option>
                                          </select>
                                        </div>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                          <span style={{ fontSize: "0.75rem", fontWeight: "bold", width: "30%" }}>Kelas XI</span>
                                          <select className="form-select" style={{ width: "65%", padding: "0.25rem", fontSize: "0.75rem" }} value={current.XI} onChange={e => updateMode("XI", e.target.value)}>
                                            <option value="online">Online</option><option value="offline">Offline</option>
                                          </select>
                                        </div>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                          <span style={{ fontSize: "0.75rem", fontWeight: "bold", width: "30%" }}>Kelas XII</span>
                                          <select className="form-select" style={{ width: "65%", padding: "0.25rem", fontSize: "0.75rem" }} value={current.XII} onChange={e => updateMode("XII", e.target.value)}>
                                            <option value="online">Online</option><option value="offline">Offline</option>
                                          </select>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                          </div>

                          <button type="submit" className="btn btn-primary" style={{ marginTop: "2rem", width: "100%" }}>
                            Simpan Pengaturan Profil
                          </button>
                        </div>

                        {/* Sisi Kanan: Upload Logo Sekolah */}
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", border: "2px dashed var(--border-color)", borderRadius: "var(--radius-md)", padding: "2rem", backgroundColor: "var(--bg-alt)" }}>
                          <h4 style={{ fontWeight: 700, color: "var(--primary-dark)", marginBottom: "1.5rem" }}>Logo Sekolah & Watermark</h4>
                          
                          <div style={{ width: "150px", height: "150px", border: "1px solid var(--border-color)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "white", fontSize: "4rem", marginBottom: "1.5rem", overflow: "hidden", position: "relative" }}>
                            {schoolLogoPreview && schoolLogoPreview.startsWith("data:image/") ? (
                              <img src={schoolLogoPreview} alt="Logo" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                            ) : (
                              schoolLogoPreview
                            )}
                          </div>

                          <div className="form-group" style={{ textAlign: "center" }}>
                            <label className="btn btn-outline" style={{ display: "inline-block", cursor: "pointer" }}>
                              📤 Pilih File Gambar Logo
                              <input 
                                type="file" 
                                accept="image/*" 
                                onChange={handleLogoUpload} 
                                style={{ display: "none" }} 
                              />
                            </label>
                            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>Format (.png / .jpg / .jpeg) - Logo ini akan otomatis menjadi watermark rapor.</p>
                          </div>
                        </div>
                      </form>
                    ) : (
                      <form onSubmit={handleSchoolSubmit} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
                        {/* Sisi Kiri: Beranda & Profil */}
                        <div>
                          <h3 style={{ fontWeight: 800, color: "var(--primary-dark)", fontSize: "1.1rem", borderBottom: "2px solid var(--border-color)", paddingBottom: "0.25rem", marginBottom: "1rem" }}>🌐 Halaman Beranda (Home)</h3>
                          
                          <div className="form-group">
                            <label className="form-label">Judul Utama Hero (Beranda)</label>
                            <input 
                              type="text" 
                              className="form-input" 
                              value={school.heroTitle || ""} 
                              onChange={(e) => setSchool(prev => ({ ...prev, heroTitle: e.target.value }))}
                              placeholder="Gunakan tanda & untuk mewarnai kata berikutnya"
                            />
                          </div>

                          <div className="form-group" style={{ marginTop: "1rem" }}>
                            <label className="form-label">Subjudul Hero (Beranda)</label>
                            <textarea 
                              className="form-textarea" 
                              value={school.heroSubtitle || ""} 
                              onChange={(e) => setSchool(prev => ({ ...prev, heroSubtitle: e.target.value }))}
                              style={{ height: "60px" }}
                            />
                          </div>

                          <div className="form-group" style={{ marginTop: "1rem" }}>
                            <label className="form-label">Judul Sambutan Kepala Sekolah</label>
                            <input 
                              type="text" 
                              className="form-input" 
                              value={school.sambutanTitle || ""} 
                              onChange={(e) => setSchool(prev => ({ ...prev, sambutanTitle: e.target.value }))}
                            />
                          </div>

                          <div className="form-group" style={{ marginTop: "1rem" }}>
                            <label className="form-label">Isi Teks Sambutan</label>
                            <textarea 
                              className="form-textarea" 
                              value={school.sambutanText || ""} 
                              onChange={(e) => setSchool(prev => ({ ...prev, sambutanText: e.target.value }))}
                              style={{ height: "120px" }}
                            />
                          </div>

                          <div className="form-group" style={{ marginTop: "1rem" }}>
                            <label className="form-label">Nama Kepala Sekolah (Penulis Sambutan)</label>
                            <input 
                              type="text" 
                              className="form-input" 
                              value={school.sambutanAuthor || ""} 
                              onChange={(e) => setSchool(prev => ({ ...prev, sambutanAuthor: e.target.value }))}
                            />
                          </div>

                          <h3 style={{ fontWeight: 800, color: "var(--primary-dark)", fontSize: "1.1rem", borderBottom: "2px solid var(--border-color)", paddingBottom: "0.25rem", marginTop: "2rem", marginBottom: "1rem" }}>🏫 Halaman Profil</h3>
                          
                          <div className="form-group">
                            <label className="form-label">Judul Sejarah Sekolah</label>
                            <input 
                              type="text" 
                              className="form-input" 
                              value={school.sejarahTitle || ""} 
                              onChange={(e) => setSchool(prev => ({ ...prev, sejarahTitle: e.target.value }))}
                            />
                          </div>

                          <div className="form-group" style={{ marginTop: "1rem" }}>
                            <label className="form-label">Isi Teks Sejarah</label>
                            <textarea 
                              className="form-textarea" 
                              value={school.sejarahText || ""} 
                              onChange={(e) => setSchool(prev => ({ ...prev, sejarahText: e.target.value }))}
                              style={{ height: "120px" }}
                            />
                          </div>

                          <div className="form-group" style={{ marginTop: "1rem" }}>
                            <label className="form-label">Teks Visi Sekolah</label>
                            <textarea 
                              className="form-textarea" 
                              value={school.visiText || ""} 
                              onChange={(e) => setSchool(prev => ({ ...prev, visiText: e.target.value }))}
                              style={{ height: "60px" }}
                            />
                          </div>

                          <div className="form-group" style={{ marginTop: "1rem" }}>
                            <label className="form-label">Misi Sekolah (Pisahkan dengan titik koma ";")</label>
                            <textarea 
                              className="form-textarea" 
                              value={school.misiText || ""} 
                              onChange={(e) => setSchool(prev => ({ ...prev, misiText: e.target.value }))}
                              style={{ height: "100px" }}
                              placeholder="Misi 1; Misi 2; Misi 3"
                            />
                          </div>
                        </div>

                        {/* Sisi Kanan: Akademik, Galeri & Kontak */}
                        <div>
                          <h3 style={{ fontWeight: 800, color: "var(--primary-dark)", fontSize: "1.1rem", borderBottom: "2px solid var(--border-color)", paddingBottom: "0.25rem", marginBottom: "1rem" }}>🎓 Halaman Akademik</h3>
                          
                          <div className="form-group">
                            <label className="form-label">Teks Pengantar Akademik</label>
                            <textarea 
                              className="form-textarea" 
                              value={school.akademikText || ""} 
                              onChange={(e) => setSchool(prev => ({ ...prev, akademikText: e.target.value }))}
                              style={{ height: "60px" }}
                            />
                          </div>

                          <div className="form-group" style={{ marginTop: "1rem" }}>
                            <label className="form-label">Detail Sistem Kurikulum</label>
                            <input 
                              type="text" 
                              className="form-input" 
                              value={school.kurikulumDetail || ""} 
                              onChange={(e) => setSchool(prev => ({ ...prev, kurikulumDetail: e.target.value }))}
                            />
                          </div>

                          <div className="form-group" style={{ marginTop: "1rem" }}>
                            <label className="form-label">Jam Pembelajaran Sekolah</label>
                            <input 
                              type="text" 
                              className="form-input" 
                              value={school.jamBelajar || ""} 
                              onChange={(e) => setSchool(prev => ({ ...prev, jamBelajar: e.target.value }))}
                            />
                          </div>

                          <div className="form-group" style={{ marginTop: "1rem" }}>
                            <label className="form-label">Kriteria Kelulusan Siswa</label>
                            <textarea 
                              className="form-textarea" 
                              value={school.kriteriaLulus || ""} 
                              onChange={(e) => setSchool(prev => ({ ...prev, kriteriaLulus: e.target.value }))}
                              style={{ height: "60px" }}
                            />
                          </div>

                          <h3 style={{ fontWeight: 800, color: "var(--primary-dark)", fontSize: "1.1rem", borderBottom: "2px solid var(--border-color)", paddingBottom: "0.25rem", marginTop: "2rem", marginBottom: "1rem" }}>🖼️ Halaman Galeri</h3>
                          
                          <div className="form-group">
                            <label className="form-label">Daftar Link/Path Gambar Galeri (Pisahkan dengan titik koma ";")</label>
                            <textarea 
                              className="form-textarea" 
                              value={school.galeriImages || ""} 
                              onChange={(e) => setSchool(prev => ({ ...prev, galeriImages: e.target.value }))}
                              style={{ height: "80px" }}
                              placeholder="/hero_school.jpg; /facility_computer.jpg"
                            />
                          </div>

                          <h3 style={{ fontWeight: 800, color: "var(--primary-dark)", fontSize: "1.1rem", borderBottom: "2px solid var(--border-color)", paddingBottom: "0.25rem", marginTop: "2rem", marginBottom: "1rem" }}>📞 Halaman Kontak</h3>

                          <div className="form-group">
                            <label className="form-label">Jam Pelayanan Informasi (PPDB Offline)</label>
                            <input 
                              type="text" 
                              className="form-input" 
                              value={school.jamPelayanan || ""} 
                              onChange={(e) => setSchool(prev => ({ ...prev, jamPelayanan: e.target.value }))}
                            />
                          </div>

                          <div className="form-group" style={{ marginTop: "1rem" }}>
                            <label className="form-label">URL Embed Google Maps Iframe</label>
                            <textarea 
                              className="form-textarea" 
                              value={school.googleMapsUrl || ""} 
                              onChange={(e) => setSchool(prev => ({ ...prev, googleMapsUrl: e.target.value }))}
                              style={{ height: "80px" }}
                            />
                          </div>

                          <button type="submit" className="btn btn-primary" style={{ marginTop: "2.5rem", width: "100%" }}>
                            💾 Simpan Seluruh Konten Publik
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                )}

                {/* TAB 2: PEMANTAUAN GURU */}
                {activeTab === "guru" && (
                  <div>
                    <h2 className="portal-content-title">Pemantauan Kinerja & Tugas Pendidik</h2>
                    <p style={{ color: "var(--text-muted)", marginBottom: "2rem" }}>
                      Memantau tugas mengajar mata pelajaran, pembagian wali kelas, dan status pengisian nilai akademik siswa.
                    </p>

                    <div className="portal-table-container">
                      <table className="portal-table">
                        <thead>
                          <tr>
                            <th>Nama Lengkap Guru / NIP</th>
                            <th>Peran Pendidik</th>
                            <th>Mata Pelajaran yang Diampu / Kelas</th>
                            <th style={{ textAlign: "center" }}>Status Pengisian Nilai / Rapor</th>
                          </tr>
                        </thead>
                        <tbody>
                          {teachers.length === 0 ? (
                            <tr>
                              <td colSpan="4" style={{ textAlign: "center", color: "var(--text-muted)" }}>Belum ada data guru terdaftar.</td>
                            </tr>
                          ) : (
                            teachers.map(t => {
                              const gradeCount = getTeacherGradeStats(t);
                              return (
                                <tr key={t.id}>
                                  <td>
                                    <strong>{t.name}</strong>
                                    <br />
                                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>NIP: {t.nip}</span>
                                  </td>
                                  <td>
                                    <span className={t.role === "wali-kelas" ? "badge-info" : "badge-success"} style={{ backgroundColor: t.role === "wali-kelas" ? "var(--secondary)" : "var(--primary)", color: "white" }}>
                                      {t.role === "wali-kelas" ? "Wali Kelas" : "Guru Mapel"}
                                    </span>
                                  </td>
                                  <td>
                                    {t.role === "wali-kelas" ? (
                                      <span>Membimbing Kelas <strong>{t.kelas}</strong></span>
                                    ) : (
                                      <div style={{ display: "flex", gap: "0.25rem", flexWrap: "wrap" }}>
                                        {t.subjects && t.subjects.length > 0 ? (
                                          t.subjects.map((sub, sIdx) => (
                                            <span key={sIdx} style={{ fontSize: "0.75rem", padding: "0.1rem 0.4rem", backgroundColor: "#e2e8f0", borderRadius: "4px", color: "var(--primary-dark)" }}>
                                              {sub}
                                            </span>
                                          ))
                                        ) : (
                                          <span style={{ fontStyle: "italic", color: "var(--text-muted)" }}>Belum ditugaskan mapel</span>
                                        )}
                                      </div>
                                    )}
                                  </td>
                                  <td style={{ textAlign: "center" }}>
                                    {t.role === "guru-mapel" ? (
                                      <div>
                                        <strong style={{ color: gradeCount > 0 ? "var(--secondary)" : "#f59e0b" }}>{gradeCount}</strong> Baris Nilai Siswa
                                        <br />
                                        <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Tugas 1, Tugas 2, UTS, UAS</span>
                                      </div>
                                    ) : (
                                      <div>
                                        <strong style={{ color: gradeCount > 0 ? "var(--secondary)" : "#f59e0b" }}>{gradeCount}</strong> Lembar Rapor Catatan Wali
                                        <br />
                                        <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Kehadiran & Catatan Karakter</span>
                                      </div>
                                    )}
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* TAB 3: PEMANTAUAN SISWA & NILAI */}
                {activeTab === "siswa" && (
                  <div>
                    <h2 className="portal-content-title">Pemantauan Hasil Belajar & Rekap Nilai Siswa</h2>
                    <p style={{ color: "var(--text-muted)", marginBottom: "2rem" }}>
                      Meninjau daftar nama siswa aktif per tingkat kelas beserta rekapitulasi nilai tugas, UTS, UAS, dan Ekskul.
                    </p>

                    {/* Filter dan Header */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
                      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                        <label className="form-label" style={{ margin: 0, fontWeight: "bold" }}>Pilih Tingkat Kelas:</label>
                        <select 
                          className="form-select" 
                          value={selectedClass} 
                          onChange={(e) => { setSelectedClass(e.target.value); setSelectedStudentForGrades(null); }}
                          style={{ minWidth: "160px", height: "38px" }}
                        >
                          <option value="all">Semua Kelas</option>
                          {uniqueClasses.map((cl, cIdx) => (
                            <option value={cl} key={cIdx}>{cl}</option>
                          ))}
                        </select>
                      </div>

                      {selectedStudentForGrades && (
                        <button 
                          className="btn btn-outline"
                          onClick={() => setSelectedStudentForGrades(null)}
                          style={{ height: "38px", fontSize: "0.85rem" }}
                        >
                          ⬅️ Kembali ke Daftar Siswa
                        </button>
                      )}
                    </div>

                    {/* Jika Kepala Sekolah sedang memantau detail nilai salah satu siswa */}
                    {selectedStudentForGrades ? (
                      <div style={{ backgroundColor: "var(--bg-alt)", padding: "2rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem", borderBottom: "2px solid var(--border-color)", paddingBottom: "1rem" }}>
                          <div>
                            <span style={{ fontSize: "0.8rem", color: "var(--secondary)", fontWeight: "bold", textTransform: "uppercase" }}>REKAPITULASI HASIL BELAJAR SISWA</span>
                            <h3 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--primary-dark)", margin: "0.25rem 0" }}>{selectedStudentForGrades.name}</h3>
                            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                              NISN: {selectedStudentForGrades.nisn} / Kelas: {selectedStudentForGrades.kelas}
                            </p>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Tahun Ajaran</span>
                            <h4 style={{ margin: 0 }}>{school.tahunAjaran}</h4>
                            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Semester {school.semester}</span>
                          </div>
                        </div>

                        {/* Selector Semester Pemantauan */}
                        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem", padding: "0.75rem 1rem", backgroundColor: "rgba(37, 99, 235, 0.05)", borderRadius: "var(--radius-md)" }}>
                          <span style={{ fontWeight: "bold", fontSize: "0.85rem", color: "var(--primary-dark)" }}>📅 Pilih Semester untuk Dipantau:</span>
                          <select 
                            className="form-select" 
                            value={kepsekSelectedSemester} 
                            onChange={(e) => setKepsekSelectedSemester(e.target.value)}
                            style={{ maxWidth: "250px", margin: 0 }}
                          >
                            <option value="1">Semester 1 (X Ganjil)</option>
                            <option value="2">Semester 2 (X Genap)</option>
                            <option value="3">Semester 3 (XI Ganjil)</option>
                            <option value="4">Semester 4 (XI Genap)</option>
                            <option value="5">Semester 5 (XII Ganjil)</option>
                            <option value="6">Semester 6 (XII Genap)</option>
                          </select>
                        </div>

                        {/* Tabel Nilai Mapel */}
                        <h4 style={{ fontWeight: 700, color: "var(--primary-dark)", marginBottom: "0.75rem" }}>Nilai Mata Pelajaran (Kurikulum Merdeka)</h4>
                        <div className="portal-table-container" style={{ marginBottom: "2rem" }}>
                          <table className="portal-table">
                            <thead>
                              <tr>
                                <th>Mata Pelajaran</th>
                                <th style={{ textAlign: "center" }}>KKM</th>
                                <th style={{ textAlign: "center" }}>Tugas 1</th>
                                <th style={{ textAlign: "center" }}>Tugas 2</th>
                                <th style={{ textAlign: "center" }}>Nilai UTS</th>
                                <th style={{ textAlign: "center" }}>Nilai UAS</th>
                                {kepsekSelectedSemester === "6" && <th style={{ textAlign: "center" }}>Nilai PAJ</th>}
                                <th style={{ textAlign: "center" }}>Nilai Akhir (Rata-rata)</th>
                                <th style={{ textAlign: "center" }}>Status Kelulusan Mapel</th>
                              </tr>
                            </thead>
                            <tbody>
                              {subjects.length === 0 ? (
                                <tr>
                                  <td colSpan={kepsekSelectedSemester === "6" ? "9" : "8"} style={{ textAlign: "center", color: "var(--text-muted)" }}>Belum ada data mata pelajaran.</td>
                                </tr>
                              ) : (
                                subjects.map(sub => {
                                  // Cari nilai mapel untuk siswa ini
                                  const score = grades.find(g => g.studentNisn === selectedStudentForGrades.nisn && g.subjectName === sub.name && g.semester === kepsekSelectedSemester);
                                  const t1 = score ? score.tugas1 : 0;
                                  const t2 = score ? score.tugas2 : 0;
                                  const uts = score && score.uts !== null ? score.uts : "-";
                                  const uas = score && score.uas !== null ? score.uas : "-";
                                  const paj = score && score.paj !== null ? score.paj : "-";
                                  
                                  // Hitung rata-rata nilai akhir
                                  let totalComp = 2; // Tugas 1 & Tugas 2
                                  let sum = t1 + t2;
                                  if (typeof uts === "number") { sum += uts; totalComp++; }
                                  if (typeof uas === "number") { sum += uas; totalComp++; }
                                  if (kepsekSelectedSemester === "6" && typeof paj === "number") { sum += paj; totalComp++; }
                                  const avg = Math.round(sum / totalComp);

                                  const pass = avg >= sub.kkm;

                                  return (
                                    <tr key={sub.id}>
                                      <td><strong>{sub.name}</strong></td>
                                      <td style={{ textAlign: "center", fontWeight: "bold" }}>{sub.kkm}</td>
                                      <td style={{ textAlign: "center" }}>{t1}</td>
                                      <td style={{ textAlign: "center" }}>{t2}</td>
                                      <td style={{ textAlign: "center" }}>{uts}</td>
                                      <td style={{ textAlign: "center" }}>{uas}</td>
                                      {kepsekSelectedSemester === "6" && <td style={{ textAlign: "center" }}>{paj}</td>}
                                      <td style={{ textAlign: "center", fontWeight: "bold", color: avg >= sub.kkm ? "var(--secondary)" : "#ef4444" }}>{avg}</td>
                                      <td style={{ textAlign: "center" }}>
                                        <span className={pass ? "badge-success" : "badge-danger"} style={{ backgroundColor: pass ? "#22c55e" : "#ef4444", color: "white" }}>
                                          {pass ? "Tuntas" : "Di Bawah KKM"}
                                        </span>
                                      </td>
                                    </tr>
                                  );
                                })
                              )}
                            </tbody>
                          </table>
                        </div>

                        <div className="grid grid-2" style={{ gap: "2rem" }}>
                          {/* Nilai Ekskul */}
                          <div>
                            <h4 style={{ fontWeight: 700, color: "var(--primary-dark)", marginBottom: "0.75rem" }}>Nilai Kegiatan Ekstrakurikuler</h4>
                            <div className="portal-table-container">
                              <table className="portal-table">
                                <thead>
                                  <tr>
                                    <th>Nama Ekstrakurikuler</th>
                                    <th style={{ textAlign: "center" }}>Predikat</th>
                                    <th>Deskripsi / Catatan Penilaian</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {(() => {
                                    const studentEkskulGrades = extracurricularGradesCustom(selectedStudentForGrades.nisn);
                                    if (studentEkskulGrades.length === 0) {
                                      return (
                                        <tr>
                                          <td colSpan="3" style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "0.8rem" }}>Tidak mengikuti ekstrakurikuler semester ini.</td>
                                        </tr>
                                      );
                                    }
                                    return studentEkskulGrades.map((eg, egIdx) => (
                                      <tr key={egIdx}>
                                        <td><strong>{eg.ekskulName}</strong></td>
                                        <td style={{ textAlign: "center", fontWeight: "bold", color: "var(--secondary)" }}>{eg.nilai}</td>
                                        <td style={{ fontSize: "0.8rem" }}>{eg.deskripsi}</td>
                                      </tr>
                                    ));
                                  })()}
                                </tbody>
                              </table>
                            </div>
                          </div>

                          {/* Kehadiran & Catatan Rapor */}
                          <div>
                            <h4 style={{ fontWeight: 700, color: "var(--primary-dark)", marginBottom: "0.75rem" }}>Catatan Kehadiran & Rapor (Wali Kelas)</h4>
                            {(() => {
                              const record = raporRecords.find(r => r.studentNisn === selectedStudentForGrades.nisn && r.semester === "1"); // semester 1 default
                              return (
                                <div style={{ backgroundColor: "#f8fafc", padding: "1.25rem", borderRadius: "6px", border: "1px solid var(--border-color)", fontSize: "0.85rem" }}>
                                  <table style={{ width: "100%", marginBottom: "1rem" }}>
                                    <tbody>
                                      <tr>
                                        <td style={{ width: "40%", fontWeight: "bold" }}>Sakit</td>
                                        <td style={{ width: "5%" }}>:</td>
                                        <td>{record ? record.sakit : 0} Hari</td>
                                      </tr>
                                      <tr>
                                        <td style={{ fontWeight: "bold" }}>Izin</td>
                                        <td>:</td>
                                        <td>{record ? record.izin : 0} Hari</td>
                                      </tr>
                                      <tr>
                                        <td style={{ fontWeight: "bold" }}>Tanpa Keterangan (Alfa)</td>
                                        <td>:</td>
                                        <td>{record ? record.alfa : 0} Hari</td>
                                      </tr>
                                      <tr>
                                        <td style={{ fontWeight: "bold" }}>Rekomendasi Wali Kelas</td>
                                        <td>:</td>
                                        <td>
                                          {record && record.naikKelas !== null ? (
                                            <span style={{ fontWeight: "bold", color: record.naikKelas ? "var(--secondary)" : "#ef4444" }}>
                                              {record.naikKelas ? "Naik Kelas / Lulus" : "Tinggal Kelas / Tidak Lulus"}
                                            </span>
                                          ) : (
                                            <span style={{ fontStyle: "italic", color: "var(--text-muted)" }}>Belum Ditentukan</span>
                                          )}
                                        </td>
                                      </tr>
                                    </tbody>
                                  </table>
                                  <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "0.75rem" }}>
                                    <strong>Catatan Karakter Wali Kelas:</strong>
                                    <p style={{ fontStyle: "italic", marginTop: "0.25rem", color: "#334155" }}>
                                      {record && record.catatanWali ? `"${record.catatanWali}"` : "Belum diisi catatan oleh Wali Kelas."}
                                    </p>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Tabel Siswa */
                      <div className="portal-table-container">
                        <table className="portal-table">
                          <thead>
                            <tr>
                              <th>Nama Lengkap Siswa</th>
                              <th>NISN / NIS</th>
                              <th>Kelas Tingkat</th>
                              <th style={{ textAlign: "center" }}>Aksi Tinjauan</th>
                            </tr>
                          </thead>
                          <tbody>
                            {getFilteredStudents().length === 0 ? (
                              <tr>
                                <td colSpan="4" style={{ textAlign: "center", color: "var(--text-muted)" }}>Tidak ada data siswa pada filter kelas ini.</td>
                              </tr>
                            ) : (
                              getFilteredStudents().map(s => (
                                <tr key={s.id}>
                                  <td><strong>{s.name}</strong></td>
                                  <td>NISN: {s.nisn} / NIS: {s.nis || "-"}</td>
                                  <td><span className="badge-info" style={{ backgroundColor: "var(--secondary)", color: "white" }}>{s.kelas}</span></td>
                                  <td style={{ textAlign: "center" }}>
                                    <button
                                      onClick={() => setSelectedStudentForGrades(s)}
                                      className="btn btn-outline"
                                      style={{ padding: "0.25rem 0.75rem", fontSize: "0.8rem", borderColor: "var(--secondary)", color: "var(--secondary)" }}
                                    >
                                      👁️ Pantau Nilai Tugas & Rapor
                                    </button>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 4: PEMANTAUAN CBT & HASIL UJIAN */}
                {activeTab === "cbt" && (
                  <div>
                    <h2 className="portal-content-title">Hasil Pelaksanaan Ujian CBT Online</h2>
                    <p style={{ color: "var(--text-muted)", marginBottom: "2rem" }}>
                      Meninjau riwayat pengerjaan tes, nilai ujian CBT, dan status kelulusan passing-grade siswa secara real-time.
                    </p>

                    <div className="portal-table-container">
                      <table className="portal-table">
                        <thead>
                          <tr>
                            <th>Nama Siswa / Kelas</th>
                            <th>Mata Pelajaran</th>
                            <th style={{ textAlign: "center" }}>Kategori Tes</th>
                            <th style={{ textAlign: "center" }}>Tanggal Pengerjaan</th>
                            <th style={{ textAlign: "center" }}>Nilai Skor CBT</th>
                          </tr>
                        </thead>
                        <tbody>
                          {examSubmissions.length === 0 ? (
                            <tr>
                              <td colSpan="5" style={{ textAlign: "center", color: "var(--text-muted)" }}>Belum ada riwayat pengerjaan ujian siswa.</td>
                            </tr>
                          ) : (
                            examSubmissions.map(sub => (
                              <tr key={sub.id}>
                                <td>
                                  <strong>{sub.student?.name || sub.studentNisn}</strong>
                                  <br />
                                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>NISN: {sub.studentNisn}</span>
                                </td>
                                <td><strong>{sub.subjectName}</strong><br /><span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Semester {sub.semester}</span></td>
                                <td style={{ textAlign: "center" }}>
                                  <span className="badge-info" style={{ backgroundColor: "var(--primary-dark)", color: "white" }}>
                                    {sub.category}
                                  </span>
                                </td>
                                 <td style={{ textAlign: "center", fontSize: "0.8rem" }}>
                                   {new Date(sub.createdAt).toLocaleString("id-ID")}
                                 </td>
                                <td style={{ textAlign: "center", fontWeight: "bold", fontSize: "1.1rem", color: sub.score !== null && sub.score >= 75 ? "var(--secondary)" : "#ef4444" }}>
                                  {sub.score !== null ? sub.score : "Sedang dikoreksi"}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* TAB 6: MONITORING KEUANGAN & DANA BOS */}
                {activeTab === "keuangan" && (
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                        <div>
                          <span style={{ fontSize: "0.85rem", textTransform: "uppercase", fontWeight: 700, color: "var(--secondary)" }}>Pengawasan Manajerial</span>
                          <h2 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--primary-dark)", margin: 0 }}>
                            Monitoring Keuangan & Dana BOS
                          </h2>
                        </div>
                        <button className="btn btn-primary" onClick={() => window.print()}>🖨️ Cetak Laporan Supervisi</button>
                      </div>

                      {/* Summary Cards */}
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
                        <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "1.25rem", borderRadius: "12px" }}>
                          <span style={{ fontSize: "0.78rem", color: "#166534", fontWeight: "bold", textTransform: "uppercase" }}>SALDO KAS SWADAYA</span>
                          <h3 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#15803d", margin: "0.25rem 0 0 0" }}>
                            Rp {(financialData?.saldoSwadaya || 0).toLocaleString("id-ID")}
                          </h3>
                        </div>
                        <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", padding: "1.25rem", borderRadius: "12px" }}>
                          <span style={{ fontSize: "0.78rem", color: "#1e40af", fontWeight: "bold", textTransform: "uppercase" }}>SALDO KAS DANA BOS</span>
                          <h3 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#1d4ed8", margin: "0.25rem 0 0 0" }}>
                            Rp {(financialData?.saldoBos || 0).toLocaleString("id-ID")}
                          </h3>
                        </div>
                        <div style={{ background: "#fefce8", border: "1px solid #fef08a", padding: "1.25rem", borderRadius: "12px" }}>
                          <span style={{ fontSize: "0.78rem", color: "#854d0e", fontWeight: "bold", textTransform: "uppercase" }}>TOTAL KAS SEKOLAH</span>
                          <h3 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#a16207", margin: "0.25rem 0 0 0" }}>
                            Rp {((financialData?.saldoSwadaya || 0) + (financialData?.saldoBos || 0)).toLocaleString("id-ID")}
                          </h3>
                        </div>
                        <div style={{ background: "#fdf2f8", border: "1px solid #fbcfe8", padding: "1.25rem", borderRadius: "12px" }}>
                          <span style={{ fontSize: "0.78rem", color: "#9d174d", fontWeight: "bold", textTransform: "uppercase" }}>PEMASUKAN SISWA (THN)</span>
                          <h3 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#be185d", margin: "0.25rem 0 0 0" }}>
                            Rp {(financialData?.totalStudentIncomeYearly || 0).toLocaleString("id-ID")}
                          </h3>
                        </div>
                      </div>

                      {/* Detail Transaksi BOS & Swadaya */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "1.5rem" }}>
                        <div className="portal-table-container">
                          <h4 style={{ fontWeight: 800, color: "var(--primary)", marginBottom: "0.75rem" }}>Pencairan Dana BOS</h4>
                          <table className="portal-table">
                            <thead>
                              <tr>
                                <th>Tahap</th>
                                <th>Tanggal</th>
                                <th style={{ textAlign: "right" }}>Nominal (Rp)</th>
                              </tr>
                            </thead>
                            <tbody>
                              {!financialData?.yearlyBosDisbursements || financialData.yearlyBosDisbursements.length === 0 ? (
                                <tr><td colSpan="3" style={{ textAlign: "center", color: "#94a3b8", padding: "1rem" }}>Belum ada pencairan BOS tahun ini.</td></tr>
                              ) : (
                                financialData.yearlyBosDisbursements.map(b => (
                                  <tr key={b.id}>
                                    <td><strong>{b.tahap}</strong></td>
                                    <td>{b.receivedDate}</td>
                                    <td style={{ textAlign: "right", fontWeight: "bold", color: "#16a34a" }}>Rp {b.amount.toLocaleString("id-ID")}</td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>

                        <div className="portal-table-container">
                          <h4 style={{ fontWeight: 800, color: "#b45309", marginBottom: "0.75rem" }}>Belanja BOS per Komponen ARKAS</h4>
                          <table className="portal-table">
                            <thead>
                              <tr>
                                <th>Komponen</th>
                                <th>Uraian</th>
                                <th style={{ textAlign: "right" }}>Jumlah (Rp)</th>
                              </tr>
                            </thead>
                            <tbody>
                              {!financialData?.allExpenses?.filter(e => e.source === "KAS_BOS")?.length ? (
                                <tr><td colSpan="3" style={{ textAlign: "center", color: "#94a3b8", padding: "1rem" }}>Belum ada pengeluaran BOS.</td></tr>
                              ) : (
                                financialData.allExpenses.filter(e => e.source === "KAS_BOS").slice(0, 5).map(e => (
                                  <tr key={e.id}>
                                    <td><span style={{ background: "#e0f2fe", color: "#0369a1", padding: "2px 6px", borderRadius: "4px", fontSize: "0.72rem", fontWeight: "bold" }}>{e.category}</span></td>
                                    <td>{e.title}</td>
                                    <td style={{ textAlign: "right", fontWeight: "bold", color: "#dc2626" }}>Rp {e.amount.toLocaleString("id-ID")}</td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Buku Kas Umum Overview */}
                      <div className="portal-table-container">
                        <h4 style={{ fontWeight: 800, color: "var(--primary)", marginBottom: "0.75rem" }}>Jurnal Buku Kas Umum (BKU) Terkini</h4>
                        <table className="portal-table">
                          <thead>
                            <tr>
                              <th>Tanggal</th>
                              <th>Sumber Kas</th>
                              <th>Uraian</th>
                              <th>Kategori</th>
                              <th style={{ textAlign: "right", color: "#16a34a" }}>Pemasukan</th>
                              <th style={{ textAlign: "right", color: "#dc2626" }}>Pengeluaran</th>
                            </tr>
                          </thead>
                          <tbody>
                            {financialData?.monthlyStudentPayments?.slice(0, 5).map(p => (
                              <tr key={`p-${p.id}`}>
                                <td>{p.paidAt}</td>
                                <td><span style={{ background: "#dcfce7", color: "#15803d", padding: "2px 6px", borderRadius: "4px", fontSize: "0.72rem", fontWeight: "bold" }}>KAS SWADAYA</span></td>
                                <td>{p.feeName} - {p.student?.name} ({p.student?.kelas})</td>
                                <td>Pembayaran Siswa</td>
                                <td style={{ textAlign: "right", color: "#16a34a", fontWeight: "bold" }}>+ Rp {p.paidAmount.toLocaleString("id-ID")}</td>
                                <td style={{ textAlign: "right", color: "#94a3b8" }}>-</td>
                              </tr>
                            ))}
                            {financialData?.allExpenses?.slice(0, 5).map(e => (
                              <tr key={`e-${e.id}`}>
                                <td>{e.date}</td>
                                <td>
                                  <span style={{ background: e.source === "KAS_BOS" ? "#dbeafe" : "#fef3c7", color: e.source === "KAS_BOS" ? "#1e40af" : "#b45309", padding: "2px 6px", borderRadius: "4px", fontSize: "0.72rem", fontWeight: "bold" }}>
                                    {e.source === "KAS_BOS" ? "KAS DANA BOS" : "KAS SWADAYA"}
                                  </span>
                                </td>
                                <td>{e.title}</td>
                                <td>{e.category}</td>
                                <td style={{ textAlign: "right", color: "#94a3b8" }}>-</td>
                                <td style={{ textAlign: "right", color: "#dc2626", fontWeight: "bold" }}>- Rp {e.amount.toLocaleString("id-ID")}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                {/* TAB SPPD (PERSETUJUAN SURAT PERJALANAN DINAS) */}
                {activeTab === "sppd" && (
                  <div>
                    <h2 className="portal-content-title">Persetujuan SPPD Pendidik</h2>
                    <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem" }}>
                      Tinjau dan setujui permohonan Surat Perintah Perjalanan Dinas (SPPD) dari guru.
                    </p>

                    <div style={{ marginBottom: "1.5rem" }}>
                      <select className="form-input" style={{ maxWidth: "250px" }} value={sppdFilter} onChange={e => setSppdFilter(e.target.value)}>
                        <option value="SEMUA">Semua Status</option>
                        <option value="MENUNGGU">Menunggu Persetujuan</option>
                        <option value="DISETUJUI">Disetujui</option>
                        <option value="DITOLAK">Ditolak</option>
                      </select>
                    </div>

                    <div className="card">
                      {sppdLoading ? <p>Memuat data...</p> : (
                        <div className="table-responsive">
                          <table className="table">
                            <thead>
                              <tr>
                                <th>Guru</th>
                                <th>Keperluan & Tujuan</th>
                                <th>Jadwal</th>
                                <th>Status</th>
                                <th style={{ textAlign: "right" }}>Aksi</th>
                              </tr>
                            </thead>
                            <tbody>
                              {sppdList.filter(s => sppdFilter === "SEMUA" || s.status === sppdFilter).length === 0 ? (
                                <tr><td colSpan="5" style={{ textAlign: "center", padding: "2rem" }}>Tidak ada SPPD {sppdFilter !== "SEMUA" ? "dengan status " + sppdFilter : ""}</td></tr>
                              ) : sppdList.filter(s => sppdFilter === "SEMUA" || s.status === sppdFilter).map((sppd) => (
                                <tr key={sppd.id}>
                                  <td>
                                    <strong>{sppd.teacher?.name}</strong><br/>
                                    <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>NIP: {sppd.teacher?.nip}</span>
                                  </td>
                                  <td>
                                    <strong>{sppd.tujuan}</strong><br/>
                                    <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>{sppd.keperluan}</span>
                                  </td>
                                  <td>
                                    <span style={{ fontSize: "0.85rem", whiteSpace: "nowrap" }}>{new Date(sppd.tanggalBerangkat).toLocaleDateString("id-ID")} - {new Date(sppd.tanggalKembali).toLocaleDateString("id-ID")}</span><br/>
                                    <span style={{ fontSize: "0.75rem", color: "var(--primary)" }}>{sppd.transportasi}</span>
                                  </td>
                                  <td>
                                    <span style={{ 
                                      padding: "0.3rem 0.6rem", borderRadius: "20px", fontSize: "0.75rem", fontWeight: "bold",
                                      backgroundColor: sppd.status === "DISETUJUI" ? "#dcfce7" : sppd.status === "DITOLAK" ? "#fee2e2" : "#fef3c7",
                                      color: sppd.status === "DISETUJUI" ? "#166534" : sppd.status === "DITOLAK" ? "#991b1b" : "#92400e"
                                    }}>
                                      {sppd.status}
                                    </span>
                                    {sppd.status === "DISETUJUI" && sppd.nomorSurat && (
                                      <div style={{ fontSize: "0.7rem", marginTop: "0.3rem", fontFamily: "monospace" }}>{sppd.nomorSurat}</div>
                                    )}
                                  </td>
                                  <td style={{ textAlign: "right", display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                                    {sppd.status === "MENUNGGU" && (
                                      <>
                                        <button 
                                          className="btn btn-primary" 
                                          style={{ padding: "0.4rem 0.75rem", fontSize: "0.8rem", height: "auto" }}
                                          onClick={() => handleSppdAction(sppd.id, "DISETUJUI")}
                                        >
                                          Setujui
                                        </button>
                                        <button 
                                          className="btn btn-danger" 
                                          style={{ padding: "0.4rem 0.75rem", fontSize: "0.8rem", height: "auto" }}
                                          onClick={() => handleSppdAction(sppd.id, "DITOLAK")}
                                        >
                                          Tolak
                                        </button>
                                      </>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                </main>
            </div>
          )}
        </div>
      </div>
    </>
  );

  // Helper local function untuk memfilter ekskul
  function extracurricularGradesCustom(studentNisn) {
    return raporRecords
      .filter(r => r.studentNisn === studentNisn)
      .flatMap(r => {
        const matches = [];
        grades.forEach(g => {
          if (g.studentNisn === studentNisn && g.subjectName.toLowerCase().includes("ekskul")) {
            matches.push({
              ekskulName: g.subjectName,
              nilai: g.tugas1 >= 85 ? "A" : g.tugas1 >= 75 ? "B" : "C",
              deskripsi: `Sangat berpartisipasi aktif dalam kegiatan ${g.subjectName}`
            });
          }
        });
        
        if (matches.length === 0) {
          matches.push({
            ekskulName: "Pramuka Wajib",
            nilai: "A",
            deskripsi: "Sangat baik dan aktif dalam kedisiplinan serta kepemimpinan kepramukaan."
          });
          matches.push({
            ekskulName: "Pencak Silat",
            nilai: "B",
            deskripsi: "Baik dalam penguasaan teknik dasar bela diri pencak silat."
          });
        }
        return matches;
      });
  }
}

"use client";
import PklTab from "../guru/PklTab";
import UkkTab from "../guru/UkkTab";
import SettingsTab from "../guru/SettingsTab";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import * as XLSX from "xlsx";
import { loginAction, logoutAction } from "../../actions/auth";
import AdminPerpustakaan from "./AdminPerpustakaan";
import { 
  getAdminDashboard, 
  saveSchoolProfile, 
  addTeacher, 
  deleteTeacher, 
  addStudent, 
  deleteStudent, 
  importStudentsExcel,
  addSubject,
  deleteSubject,
  editSubject,
  addExtracurricular,
  deleteExtracurricular,
  updateTeacherPassword,
  updateStudentPassword,
  saveExamSchedule,
  deleteExamSchedule,
  updateStudent,
  updateTeacher,
  uploadSchoolLogo,
  updateSubjectSemesters
} from "../../actions/admin";
import { 

  saveSchoolIp, 
  assignTreasurer, 
  assignSpecialRole,
  updateTeacherLoad, 
  scanStudentQR, 
  getStudentAttendanceList, 
  getTeacherAttendanceList, 
  recordStudentAttendanceBulk,
  getTreasurerReport,
  getClientIp,
  recordTeacherAttendanceBulk,
  getStudentAttendanceRecap
} from "../../actions/absensi";

export default function PortalAdmin() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // Form login admin
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  // Dashboard Data
  const [school, setSchool] = useState({
    nama: "SMP & SMK MASTER DEMO KOTA DEMO (TERPADU)",
    npsn: "69901347",
    alamat: "Jegedeh Wahyurejo, Candisari, Kota Demo, Magelang",
    logo: "🏫",
    kepsek: "KH. Ahmad Qodir, M.Pd.I.",
    kepsekNip: "197508172005011002",
    semester: "Ganjil",
    tahunAjaran: "2026/2027",
    tanggalCetak: "4 Juli 2026",
    yayasan: "YAYASAN MASTER DEMO HASAN IBRAHIM",
    skIjin: "188.4/61081/20.2b/2015",
    nss: "202030816051",
    telepon: "085228476578, 08587399500",
    email: "smpalqodiriyah@gmail.com"
  });
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [extracurriculars, setExtracurriculars] = useState([]);
  const [examSchedules, setExamSchedules] = useState([]);
  const [printableStudents, setPrintableStudents] = useState([]);
  const [printType, setPrintType] = useState("exam"); // "exam" or "attendance"

  // UI State
  const [activeTab, setActiveTab] = useState("sekolah"); // "sekolah", "guru", "siswa", "jurusan"
  const [filterClass, setFilterClass] = useState("all");
  // Unit filter dihapus - portal ini khusus SMP

  // Master Jurusan dihapus - portal khusus SMP

  // Absensi States
  const [schoolIp, setSchoolIp] = useState("");
  const [ipSuccess, setIpSuccess] = useState("");
  const [scanNisn, setScanNisn] = useState("");
  const [scanStatus, setScanStatus] = useState("HADIR");
  const [scanNotes, setScanNotes] = useState("");
  const [scanMessage, setScanMessage] = useState("");
  const [scanSuccess, setScanSuccess] = useState(false);
  const [manualWaktuHadir, setManualWaktuHadir] = useState("");
  const [absenDate, setAbsenDate] = useState(new Date().toLocaleDateString("sv-SE"));
  const [dailyStudentAtt, setDailyStudentAtt] = useState([]);
  const [selectedClassCards, setSelectedClassCards] = useState("all");
  const [absenDateGuru, setAbsenDateGuru] = useState(new Date().toLocaleDateString("sv-SE"));
  const [dailyTeacherAtt, setDailyTeacherAtt] = useState([]);
  const [filterClassGuru, setFilterClassGuru] = useState("all");

  // Rekap Absensi Siswa States
  const [rekapKelas, setRekapKelas] = useState("");
  const [rekapBulan, setRekapBulan] = useState(String(new Date().getMonth() + 1));
  const [rekapTahun, setRekapTahun] = useState(String(new Date().getFullYear()));
  const [rekapData, setRekapData] = useState(null);
  const [rekapLoading, setRekapLoading] = useState(false);

  // Form States
  // 1. Profil Sekolah
  const [schoolSuccessMessage, setSchoolSuccessMessage] = useState("");
  const [schoolLogoPreview, setSchoolLogoPreview] = useState("🏫");
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [schoolSubTab, setSchoolSubTab] = useState("profil");

  // 2. Tambah Guru
  const [newGuru, setNewGuru] = useState({
    name: "",
    nip: "",
    subjects: [],
    extracurriculars: [],
    role: "guru-mapel",
    kelas: "",
    username: "",
    password: "",
    jabatan: "-",
    tunjangan: 0,
    customInsentif: ""
  });
  const [guruMessage, setGuruMessage] = useState("");
  const [editingGuru, setEditingGuru] = useState(null);

  // 3. Tambah/Atur Jadwal Ujian
  const [newJadwal, setNewJadwal] = useState({
    subjectName: "",
    category: "UTS",
    semester: "1",
    startTime: "",
    endTime: "",
    forceOpen: false
  });
  const [jadwalMessage, setJadwalMessage] = useState("");

  const handleSubjectCheckboxChange = (subjectName, isChecked) => {
    setNewGuru(prev => {
      const currentSubjects = prev.subjects || [];
      const updatedSubjects = isChecked 
        ? [...currentSubjects, subjectName] 
        : currentSubjects.filter(s => s !== subjectName);
      return { ...prev, subjects: updatedSubjects };
    });
  };

  const handleEkskulCheckboxChange = (ekskulName, isChecked) => {
    setNewGuru(prev => {
      const currentEkskuls = prev.extracurriculars || [];
      const updatedEkskuls = isChecked 
        ? [...currentEkskuls, ekskulName] 
        : currentEkskuls.filter(e => e !== ekskulName);
      return { ...prev, extracurriculars: updatedEkskuls };
    });
  };

  const handleEditGuruSubjectCheckboxChange = (subjectName, isChecked) => {
    if (!editingGuru) return;
    setEditingGuru(prev => {
      const currentSubjects = prev.subjects || [];
      const updatedSubjects = isChecked 
        ? [...currentSubjects, subjectName] 
        : currentSubjects.filter(s => s !== subjectName);
      return { ...prev, subjects: updatedSubjects };
    });
  };

  const handleEditGuruEkskulCheckboxChange = (ekskulName, isChecked) => {
    if (!editingGuru) return;
    setEditingGuru(prev => {
      const currentEkskuls = prev.extracurriculars || [];
      const updatedEkskuls = isChecked 
        ? [...currentEkskuls, ekskulName] 
        : currentEkskuls.filter(e => e !== ekskulName);
      return { ...prev, extracurriculars: updatedEkskuls };
    });
  };

  // 3. Tambah Siswa Manual
  const [newSiswa, setNewSiswa] = useState({
    name: "",
    nis: "",
    nisn: "",
    jenisKelamin: "Laki-laki", // default
    tempatLahir: "",
    tanggalLahir: "",
    namaOrangTua: "",
    namaAyah: "",
    namaIbu: "",
    pekerjaanAyah: "",
    pekerjaanIbu: "",
    asalSekolah: "",
    tanggalMasuk: "",
    kelas: "X DKV",
    alamat: "",
    username: "",
    password: ""
  });
  const [siswaMessage, setSiswaMessage] = useState("");
  const [selectedSiswaForDetail, setSelectedSiswaForDetail] = useState(null);
  const [editingSiswa, setEditingSiswa] = useState(null);

  // 4. Tambah Mata Pelajaran
  const [editingMapelId, setEditingMapelId] = useState(null);
  const [newMapel, setNewMapel] = useState({
    name: "",
    kelompok: "A",
    untuk_kelas: "Semua",
    untuk_semester: "Semua",
    kkm: 75,
    cps: {
      "1": { cpA: "", cpB: "", cpC: "", cpD: "" },
      "2": { cpA: "", cpB: "", cpC: "", cpD: "" },
      "3": { cpA: "", cpB: "", cpC: "", cpD: "" },
      "4": { cpA: "", cpB: "", cpC: "", cpD: "" },
      "5": { cpA: "", cpB: "", cpC: "", cpD: "" },
      "6": { cpA: "", cpB: "", cpC: "", cpD: "" }
    }
  });
  const [selectedSemesterCP, setSelectedSemesterCP] = useState("1");
  const [mapelMessage, setMapelMessage] = useState("");

  
  const handleMapelSubmit = async (e) => {
    e.preventDefault();
    setMapelMessage("");
    const mapelToSend = { ...newMapel, unit: "SMK" };
    
    let res;
    if (editingMapelId) {
      res = await editSubject(editingMapelId, mapelToSend);
    } else {
      res = await addSubject(mapelToSend);
    }
    
    if (res.success) {
      setMapelMessage(`Sukses! Mata pelajaran ${newMapel.name} berhasil ${editingMapelId ? 'diperbarui' : 'ditambahkan'}.`);
      setNewMapel({
        name: "",
        kelompok: "A",
        untuk_kelas: "Semua",
        untuk_semester: "Semua",
        kkm: 75,
        cps: {
          "1": { cpA: "", cpB: "", cpC: "", cpD: "" },
          "2": { cpA: "", cpB: "", cpC: "", cpD: "" },
          "3": { cpA: "", cpB: "", cpC: "", cpD: "" },
          "4": { cpA: "", cpB: "", cpC: "", cpD: "" },
          "5": { cpA: "", cpB: "", cpC: "", cpD: "" },
          "6": { cpA: "", cpB: "", cpC: "", cpD: "" }
        },
        unit: "SMK",
        jurusan: ""
      });
      setEditingMapelId(null);
      setSelectedSemesterCP("1");
      await fetchDashboard();
    } else {
      setMapelMessage(`Gagal: ${res.error}`);
    }
  };

  const handleEditMapelClick = (subject) => {
    setEditingMapelId(subject.id);
    setNewMapel({
      name: subject.name,
      kelompok: subject.kelompok || "A",
      untuk_kelas: subject.untuk_kelas || "Semua",
      untuk_semester: subject.untuk_semester || "Semua",
      kkm: subject.kkm || 75,
      cps: subject.cps || {
        "1": { cpA: "", cpB: "", cpC: "", cpD: "" },
        "2": { cpA: "", cpB: "", cpC: "", cpD: "" },
        "3": { cpA: "", cpB: "", cpC: "", cpD: "" },
        "4": { cpA: "", cpB: "", cpC: "", cpD: "" },
        "5": { cpA: "", cpB: "", cpC: "", cpD: "" },
        "6": { cpA: "", cpB: "", cpC: "", cpD: "" }
      },
      unit: subject.unit || "SMK",
      jurusan: subject.jurusan || ""
    });
    setMapelMessage("");
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const handleCancelEditMapel = () => {
    setEditingMapelId(null);
    setNewMapel({
      name: "",
      kelompok: "A",
      untuk_kelas: "Semua",
      untuk_semester: "Semua",
      kkm: 75,
      cps: {
        "1": { cpA: "", cpB: "", cpC: "", cpD: "" },
        "2": { cpA: "", cpB: "", cpC: "", cpD: "" },
        "3": { cpA: "", cpB: "", cpC: "", cpD: "" },
        "4": { cpA: "", cpB: "", cpC: "", cpD: "" },
        "5": { cpA: "", cpB: "", cpC: "", cpD: "" },
        "6": { cpA: "", cpB: "", cpC: "", cpD: "" }
      },
      unit: "SMK",
      jurusan: ""
    });
    setMapelMessage("");
  };


  const handleDeleteSubject = async (id, name) => {
    if (confirm(`Apakah Anda yakin ingin menghapus mata pelajaran ${name}? Semua relasi nilai untuk mapel ini akan terpengaruh.`)) {
      const res = await deleteSubject(id);
      if (res.success) {
        alert("Mata pelajaran berhasil dihapus.");
        await fetchDashboard();
      } else {
        alert(`Gagal menghapus: ${res.error}`);
      }
    }
  };

  const [expandedSubjectGroups, setExpandedSubjectGroups] = useState({});

  const toggleSubjectGroup = (groupName) => {
    setExpandedSubjectGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
  };

  const handleUpdateSemester = async (subjectId, semesterStr, isChecked, currentSemesters) => {
    let currentArray = currentSemesters === "Semua" || !currentSemesters ? ["1", "2", "3", "4", "5", "6"] : currentSemesters.split(",");
    
    if (isChecked) {
      if (!currentArray.includes(semesterStr)) currentArray.push(semesterStr);
    } else {
      currentArray = currentArray.filter(s => s !== semesterStr);
    }
    
    currentArray.sort(); // sort '1', '2', '3' etc.
    const newSemestersStr = currentArray.length === 6 ? "Semua" : currentArray.join(",");
    
    // Optimistic UI update
    setSubjects(prevSubjects => prevSubjects.map(s => 
      s.id === subjectId ? { ...s, untuk_semester: newSemestersStr } : s
    ));
    
    // API Call
    const res = await updateSubjectSemesters(subjectId, newSemestersStr);
    if (!res.success) {
      alert("Gagal mengupdate semester: " + res.error);
      await fetchDashboard(); // revert if failed
    }
  };

  // 5. Tambah Ekstrakurikuler
  const [newEkskul, setNewEkskul] = useState("");
  const [ekskulMessage, setEkskulMessage] = useState("");

  const handleEkskulSubmit = async (e) => {
    e.preventDefault();
    setEkskulMessage("");
    if (!newEkskul.trim()) return;
    const res = await addExtracurricular(newEkskul.trim());
    if (res.success) {
      setEkskulMessage(`Sukses! Ekstrakurikuler ${newEkskul} berhasil ditambahkan.`);
      setNewEkskul("");
      await fetchDashboard();
    } else {
      setEkskulMessage(`Gagal: ${res.error}`);
    }
  };

  const handleDeleteEkskul = async (id, name) => {
    if (confirm(`Apakah Anda yakin ingin menghapus ekstrakurikuler ${name}? Data nilai ekskul siswa yang berelasi akan terpengaruh.`)) {
      const res = await deleteExtracurricular(id);
      if (res.success) {
        await fetchDashboard();
      } else {
        alert("Gagal menghapus ekstrakurikuler.");
      }
    }
  };

  // Helper normalisasi kelas
  const normalizeClass = (str) => {
    if (!str) return "";
    return String(str)
      .replace(/kelas/gi, "")
      .replace(/[^a-zA-Z0-9]/g, "")
      .toLowerCase()
      .trim();
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    setLoading(true);
    const res = await getAdminDashboard();
    if (res.success) {
      setSession({ username: "admin", role: "admin" });
      if (res.school) {
        setSchool(res.school);
        setSchoolLogoPreview(res.school.logo);
        setSchoolIp(res.school.schoolIp || "");
      }
      setTeachers(res.teachers);
      setStudents(res.students);
      setSubjects(res.subjects);
      setExtracurriculars(res.extracurriculars || []);
      setExamSchedules(res.examSchedules || []);
      
      setNewGuru(prev => ({
        ...prev,
        subjects: prev.subjects || [],
        extracurriculars: prev.extracurriculars || []
      }));
    } else {
      setSession(null);
      if (res.error && res.error !== "Unauthorized") {
        alert("Gagal memuat data: " + res.error);
      }
    }
    setLoading(false);
  };

  const loadDailyStudentAttendance = async (targetDate = absenDate) => {
    const res = await getStudentAttendanceList(targetDate);
    if (res.success) {
      setDailyStudentAtt(res.attendances || []);
    }
  };

  const loadDailyTeacherAttendance = async (targetDate = absenDateGuru) => {
    const res = await getTeacherAttendanceList(targetDate);
    if (res.success) {
      setDailyTeacherAtt(res.attendances || []);
    }
  };

  const handleSaveSchoolIp = async () => {
    setIpSuccess("");
    const res = await saveSchoolIp(schoolIp);
    if (res.success) {
      setIpSuccess("IP Wi-Fi Sekolah berhasil diperbarui!");
      fetchDashboard();
    } else {
      alert("Gagal menyimpan IP: " + res.error);
    }
  };

  const handleDetectMyIp = async () => {
    try {
      const ip = await getClientIp();
      setSchoolIp(ip);
      setIpSuccess("Deteksi IP Sukses! Silakan klik 'Simpan IP Wi-Fi' untuk menyimpannya.");
    } catch (e) {
      alert("Gagal mendeteksi IP: " + e.message);
    }
  };

  const handleAssignTreasurer = async (teacherId, currentVal) => {
    const res = await assignTreasurer(teacherId, !currentVal);
    if (res.success) {
      alert("Peran Bendahara Sekolah berhasil diperbarui!");
      fetchDashboard();
    } else {
      alert("Gagal mengubah peran bendahara: " + res.error);
    }
  };

  const handleAssignSpecialRole = async (teacherId, roleField, currentVal) => {
    const res = await assignSpecialRole(teacherId, roleField, !currentVal);
    if (res.success) {
      alert(`Peran ${roleField.replace("is", "")} berhasil diperbarui!`);
      fetchDashboard();
    } else {
      alert("Gagal mengubah peran: " + res.error);
    }
  };

  const handleUpdateTeacherLoad = async (teacherId, loadHours) => {
    const res = await updateTeacherLoad(teacherId, loadHours);
    if (res.success) {
      alert("Beban jam mengajar berhasil diperbarui!");
      fetchDashboard();
    } else {
      alert("Gagal menyimpan beban jam mengajar: " + res.error);
    }
  };

  const handleScanStudentQR = async (e) => {
    if (e) e.preventDefault();
    setScanMessage("");
    setScanSuccess(false);

    if (!scanNisn) {
      setScanMessage("NISN tidak boleh kosong.");
      return;
    }

    const res = await scanStudentQR(scanNisn, scanStatus, scanNotes);
    if (res.success) {
      setScanSuccess(true);
      setScanMessage(`Berhasil Absen! ${res.studentName} (${res.className}) tercatat ${scanStatus}.`);
      setScanNisn("");
      setScanNotes("");
      loadDailyStudentAttendance(absenDate);
    } else {
      setScanMessage("Gagal Absen: " + res.error);
    }
  };

  const handleStudentAttendanceBulkSave = async (studentId, status, notes = "") => {
    const defaultTime = new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
    const waktuHadir = manualWaktuHadir || defaultTime;
    
    const res = await recordStudentAttendanceBulk([{
      studentId,
      date: absenDate,
      status,
      notes,
      waktuHadir
    }]);
    if (res.success) {
      loadDailyStudentAttendance(absenDate);
    } else {
      alert("Gagal menyimpan absensi: " + res.error);
    }
  };

  const handleTeacherAttendanceBulkSave = async (teacherId, status, notes = "", jp = 0) => {
    const defaultTime = new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
    const waktuHadir = manualWaktuHadir || defaultTime;

    const res = await recordTeacherAttendanceBulk([{
      teacherId,
      date: absenDateGuru,
      status,
      notes,
      jp,
      waktuHadir
    }]);
    if (res.success) {
      loadDailyTeacherAttendance(absenDateGuru);
    } else {
      alert("Gagal menyimpan absensi guru: " + res.error);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError("");
    const res = await loginAction("admin", username, password);
    if (res.success) {
      setUsername("");
      setPassword("");
      await fetchDashboard();
    } else {
      setLoginError(res.error);
    }
  };

  const handleLogout = async () => {
    await logoutAction();
    setSession(null);
    setDashboardData(null);
  };

  // Profil Sekolah Submit
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

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check size max 5MB
    if (file.size > 5 * 1024 * 1024) {
      alert("Ukuran logo maksimal 5MB.");
      return;
    }

    setIsUploadingLogo(true);
    
    // Preview local while uploading
    const reader = new FileReader();
    reader.onload = (evt) => {
      setSchoolLogoPreview(evt.target.result);
    };
    reader.readAsDataURL(file);

    try {
      const formData = new FormData();
      formData.append("photo", file);
      
      const res = await uploadSchoolLogo(formData);
      if (res.success) {
        setSchool(prev => ({ ...prev, logo: res.photoUrl }));
        setSchoolLogoPreview(res.photoUrl);
      } else {
        alert(res.error || "Gagal mengunggah logo ke server.");
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan saat mengunggah logo.");
    } finally {
      setIsUploadingLogo(false);
    }
  };

  // Tambah Guru Submit
  const handleGuruSubmit = async (e) => {
    e.preventDefault();
    setGuruMessage("");
    if (!newGuru.subjects || newGuru.subjects.length === 0) {
      setGuruMessage("Gagal: Anda harus memilih minimal satu mata pelajaran.");
      return;
    }
    const res = await addTeacher(newGuru);
    if (res.success) {
      setGuruMessage(`Sukses! Guru ${newGuru.name} berhasil didaftarkan.`);
      setNewGuru({
        name: "",
        nip: "",
        subjects: [],
        role: "guru-mapel",
        kelas: "",
        username: "",
        password: "",
        jabatan: "-",
        tunjangan: 0
      });
      await fetchDashboard();
    } else {
      setGuruMessage(`Gagal: ${res.error}`);
    }
  };

  // Edit Guru Submit
  const handleEditGuruSubmit = async (e) => {
    e.preventDefault();
    if (!editingGuru) return;
    if (!editingGuru.subjects || editingGuru.subjects.length === 0) {
      alert("Gagal: Anda harus memilih minimal satu mata pelajaran.");
      return;
    }
    const res = await updateTeacher(editingGuru.id, editingGuru);
    if (res.success) {
      setGuruMessage(`Sukses! Data guru ${editingGuru.name} berhasil diperbarui.`);
      setEditingGuru(null);
      await fetchDashboard();
    } else {
      alert(`Gagal memperbarui data guru: ${res.error}`);
    }
  };

  // Hapus Guru
  const handleDeleteTeacher = async (id, name) => {
    if (confirm(`Apakah Anda yakin ingin menghapus guru ${name}?`)) {
      const res = await deleteTeacher(id);
      if (res.success) {
        await fetchDashboard();
      } else {
        alert("Gagal menghapus guru.");
      }
    }
  };

  // Tambah Siswa Manual Submit
  const handleSiswaSubmit = async (e) => {
    e.preventDefault();
    setSiswaMessage("");
    const res = await addStudent(newSiswa);
    if (res.success) {
      setSiswaMessage(`Sukses! Siswa ${newSiswa.name} berhasil didaftarkan.`);
      setNewSiswa({
        name: "",
        nis: "",
        nisn: "",
        jenisKelamin: "Laki-laki",
        tempatLahir: "",
        tanggalLahir: "",
        namaOrangTua: "",
        namaAyah: "",
        namaIbu: "",
        pekerjaanAyah: "",
        pekerjaanIbu: "",
        asalSekolah: "",
        tanggalMasuk: "",
        kelas: "X DKV",
        alamat: "",
        username: "",
        password: ""
      });
      await fetchDashboard();
    } else {
      setSiswaMessage(`Gagal: ${res.error}`);
    }
  };

  // Edit Siswa Submit
  const handleEditSiswaSubmit = async (e) => {
    e.preventDefault();
    if (!editingSiswa) return;
    const res = await updateStudent(editingSiswa.id, editingSiswa);
    if (res.success) {
      setSiswaMessage(`Sukses! Data siswa ${editingSiswa.name} berhasil diperbarui.`);
      setEditingSiswa(null);
      await fetchDashboard();
    } else {
      alert(`Gagal memperbarui data siswa: ${res.error}`);
    }
  };

  // Hapus Siswa
  const handleDeleteStudent = async (id, name) => {
    if (confirm(`Apakah Anda yakin ingin menghapus siswa ${name}?`)) {
      const res = await deleteStudent(id);
      if (res.success) {
        await fetchDashboard();
      } else {
        alert("Gagal menghapus siswa.");
      }
    }
  };

  // Perbarui Password Guru
  const handleUpdateTeacherPassword = async (teacherId, teacherName) => {
    const newPass = prompt(`Masukkan password baru untuk guru: ${teacherName}`);
    if (newPass === null) return; // Batal
    if (newPass.trim().length < 3) {
      alert("Password minimal harus 3 karakter!");
      return;
    }
    const res = await updateTeacherPassword(teacherId, newPass);
    if (res.success) {
      alert(`Sukses! Password untuk guru ${teacherName} berhasil diperbarui.`);
      await fetchDashboard();
    } else {
      alert(`Gagal: ${res.error}`);
    }
  };

  // Perbarui Password Siswa
  const handleUpdateStudentPassword = async (studentId, studentName) => {
    const newPass = prompt(`Masukkan password baru untuk siswa: ${studentName}`);
    if (newPass === null) return; // Batal
    if (newPass.trim().length < 3) {
      alert("Password minimal harus 3 karakter!");
      return;
    }
    const res = await updateStudentPassword(studentId, newPass);
    if (res.success) {
      alert(`Sukses! Password untuk siswa ${studentName} berhasil diperbarui.`);
      await fetchDashboard();
    } else {
      alert(`Gagal: ${res.error}`);
    }
  };

  // Simpan Jadwal Ujian
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
      await fetchDashboard();
    } else {
      setJadwalMessage(`Gagal: ${res.error}`);
    }
  };

  // Hapus Jadwal Ujian
  const handleDeleteJadwal = async (id, subject, category, semester) => {
    if (confirm(`Apakah Anda yakin ingin menghapus jadwal ujian ${category} ${subject} Smt ${semester}?`)) {
      const res = await deleteExamSchedule(id);
      if (res.success) {
        await fetchDashboard();
      } else {
        alert("Gagal menghapus jadwal ujian.");
      }
    }
  };

  // Toggle Force Open (Buka Manual oleh Admin)
  const handleToggleForceOpen = async (schedule) => {
    const updatedForce = !schedule.forceOpen;
    const res = await saveExamSchedule({
      subjectName: schedule.subjectName,
      category: schedule.category,
      semester: schedule.semester,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      forceOpen: updatedForce
    });
    if (res.success) {
      await fetchDashboard();
    } else {
      alert("Gagal mengubah status akses manual: " + res.error);
    }
  };

  // Pemicu Cetak Kartu Peserta Ujian / Absensi dengan Preloader
  const handlePrintCards = (studentsToPrint, type = "exam") => {
    if (!studentsToPrint || studentsToPrint.length === 0) {
      alert("Tidak ada data siswa untuk dicetak!");
      return;
    }
    setPrintType(type);
    setPrintableStudents(studentsToPrint);
    
    if (type === "attendance") {
      // Tampilkan indikator memuat jika cetak dalam jumlah banyak
      const promises = studentsToPrint.map(stud => {
        return new Promise((resolve) => {
          const img = new Image();
          img.src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${stud.nisn}`;
          img.onload = () => resolve();
          img.onerror = () => resolve();
        });
      });

      Promise.all(promises).then(() => {
        setTimeout(() => {
          document.body.classList.add("printing-cards");
          window.print();
          document.body.classList.remove("printing-cards");
          setPrintableStudents([]);
        }, 300);
      });
    } else {
      // Tunggu agar state merender DOM area cetak
      setTimeout(() => {
        document.body.classList.add("printing-cards");
        window.print();
        document.body.classList.remove("printing-cards");
        setPrintableStudents([]);
      }, 150);
    }
  };

  // Unduh Template Excel Siswa
  const unduhTemplateExcel = () => {
    const headers = [
      ["Nama Lengkap", "NIS", "NISN", "Jenis Kelamin", "Tempat Lahir", "Tanggal Lahir (YYYY-MM-DD)", "Nama Orang Tua / Wali", "Nama Ayah", "Nama Ibu", "Pekerjaan Ayah", "Pekerjaan Ibu", "Asal Sekolah", "Tanggal Masuk Sekolah (YYYY-MM-DD)", "Kelas", "Alamat Siswa", "Username Login", "Password"]
    ];
    const sampleData = [
      ["Rani Wijaya", "24001", "0081234567", "Perempuan", "Magelang", "2011-05-12", "Slamet Wijaya", "Slamet Wijaya", "Sumarni", "Wiraswasta", "Ibu Rumah Tangga", "SD N 1 Kota Demo", "2024-07-15", "X DKV", "Dusun Ngablak RT 02", "rani", "123"],
      ["Diki Hermawan", "24002", "0087654321", "Laki-laki", "Magelang", "2011-08-20", "Budi Hermawan", "Budi Hermawan", "Siti Aminah", "Petani", "Petani", "MI Master Demo", "2024-07-15", "XI DKV", "Dusun Ngabean RT 03", "diki", "123"]
    ];

    const wsData = headers.concat(sampleData);
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data Siswa");
    XLSX.writeFile(wb, "template_siswa_smk_alqodiriyah.xlsx");
  };

  // Impor Excel Siswa
  const handleExcelImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Helper formatter tanggal Excel (serial number, Date object, atau String)
    const formatExcelDate = (val) => {
      if (!val) return "";
      if (val instanceof Date) {
        const y = val.getFullYear();
        const m = String(val.getMonth() + 1).padStart(2, "0");
        const d = String(val.getDate()).padStart(2, "0");
        return `${y}-${m}-${d}`;
      }
      if (typeof val === "number") {
        const date = new Date(Math.round((val - 25569) * 86400 * 1000));
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, "0");
        const d = String(date.getDate()).padStart(2, "0");
        return `${y}-${m}-${d}`;
      }
      return String(val).trim();
    };

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: "array", cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        
        // Konversi ke JSON objek
        const jsonRows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
        if (jsonRows.length === 0) {
          alert("Gagal mengurai file! File Excel kosong atau kolom tidak ditemukan.");
          return;
        }

        const parsedStudents = [];

        jsonRows.forEach(row => {
          const getValueByHeader = (headersList) => {
            for (let key in row) {
              if (headersList.some(h => key.trim().toLowerCase() === h.trim().toLowerCase())) {
                return row[key];
              }
            }
            return "";
          };

          const name = String(getValueByHeader(["Nama Lengkap", "Nama"])).trim();
          if (!name) return; // skip baris kosong tanpa nama

          const nis = String(getValueByHeader(["NIS", "Nomor Induk Siswa"])).trim();
          const nisn = String(getValueByHeader(["NISN", "Nomor Induk Siswa Nasional"])).trim();
          const rawJk = String(getValueByHeader(["Jenis Kelamin", "JK", "Gender", "L/P", "L/P (L/P)"])).trim().toLowerCase();
          let jenisKelamin = "Laki-laki";
          if (rawJk.startsWith("p") || rawJk.includes("perempuan") || rawJk === "f") {
            jenisKelamin = "Perempuan";
          } else if (rawJk.startsWith("l") || rawJk.includes("laki") || rawJk === "m") {
            jenisKelamin = "Laki-laki";
          }
          
          const tempatLahir = String(getValueByHeader(["Tempat Lahir"])).trim();
          
          const rawTglLahir = getValueByHeader(["Tanggal Lahir (YYYY-MM-DD)", "Tanggal Lahir", "Tgl Lahir"]);
          const tanggalLahir = formatExcelDate(rawTglLahir);

          const namaOrangTua = String(getValueByHeader(["Nama Orang Tua / Wali", "Nama Orang Tua", "Nama Wali", "Orang Tua"])).trim();
          const namaAyah = String(getValueByHeader(["Nama Ayah", "Ayah"])).trim();
          const namaIbu = String(getValueByHeader(["Nama Ibu", "Ibu"])).trim();
          const pekerjaanAyah = String(getValueByHeader(["Pekerjaan Ayah"])).trim();
          const pekerjaanIbu = String(getValueByHeader(["Pekerjaan Ibu"])).trim();
          const asalSekolah = String(getValueByHeader(["Asal Sekolah", "Sekolah Asal"])).trim();
          
          const rawTglMasuk = getValueByHeader(["Tanggal Masuk Sekolah (YYYY-MM-DD)", "Tanggal Masuk", "Tgl Masuk"]);
          const tanggalMasuk = formatExcelDate(rawTglMasuk);

          const kelas = String(getValueByHeader(["Kelas", "Tingkat Kelas"])).trim() || "X DKV";
          const alamat = String(getValueByHeader(["Alamat Siswa", "Alamat"])).trim();
          
          let username = String(getValueByHeader(["Username Login", "Username"])).trim();
          let password = String(getValueByHeader(["Password", "Kata Sandi"])).trim();

          if (!username) {
            username = "siswa_" + (nisn || Math.random().toString(36).substring(2, 7));
          }
          if (!password) {
            password = "123";
          }

          parsedStudents.push({
            name,
            nis,
            nisn,
            jenisKelamin,
            tempatLahir,
            tanggalLahir,
            namaOrangTua,
            namaAyah,
            namaIbu,
            pekerjaanAyah,
            pekerjaanIbu,
            asalSekolah,
            tanggalMasuk,
            kelas,
            alamat,
            username,
            password
          });
        });

        if (parsedStudents.length === 0) {
          alert("Tidak ada data siswa valid ditemukan untuk diimpor.");
          return;
        }

        // Jalankan Server Action untuk menyimpan secara massal
        const res = await importStudentsExcel(parsedStudents);
        if (res.success) {
          alert(`Sukses! Berhasil mengimpor ${res.count} siswa baru dari file Excel ke database cloud.`);
          await fetchDashboard();
        } else {
          alert(`Gagal impor: ${res.error}`);
        }
      } catch (err) {
        console.error(err);
        alert("Gagal membaca file Excel! Pastikan file tidak rusak dan formatnya benar.");
      }
    };
    reader.readAsArrayBuffer(file);
  };



  const getFilteredStudents = () => {
    let result = students;
    if (filterClass !== "all") {
      result = result.filter(s => normalizeClass(s.kelas) === normalizeClass(filterClass));
    }
    return result;
  };

  const getFilteredTeachers = () => {
    let result = teachers;
    if (filterClassGuru !== "all") {
      result = result.filter(t => normalizeClass(t.kelas) === normalizeClass(filterClassGuru));
    }
    return result;
  };

  const getFilteredSubjects = () => subjects;

  if (loading) {
    return (
      <div className="portal-wrapper" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh" }}>
        <div style={{ textAlign: "center" }}>
          <div className="logo-icon animate-pulse" style={{ margin: "0 auto 1rem auto" }}>Q</div>
          <p style={{ fontWeight: 600, color: "var(--primary)" }}>Memuat data sesi portal...</p>
        </div>
      </div>
    );
  }

  const uniqueStudentClasses = [...new Set(students.map(s => s.kelas).filter(Boolean))].sort();
  const uniqueTeacherClasses = [...new Set(teachers.map(t => t.kelas).filter(Boolean))].sort();

  return (
    <>
      {/* PAGE HEADER */}
      <section className="page-header">
        <div className="container">
          <h1 className="page-header-title">Portal Administrasi</h1>
          <div className="page-header-breadcrumbs">
            <Link href="/">Beranda</Link>
            <span className="breadcrumb-separator">/</span>
            <span>Portal Admin</span>
          </div>
        </div>
      </section>

      <div className="portal-wrapper">
        <div className="container">
          {/* 1. LOGIN FORM */}
          {!session && (
            <section className="login-section" id="portal-admin-login-section">
              <div className="login-card">
                <div className="login-header">
                  <div className="login-icon-box" style={{ backgroundColor: "var(--primary-dark)" }}>A</div>
                  <h2 className="login-card-title">Login Admin</h2>
                  <p className="login-card-subtitle">Gunakan kredensial administrator sekolah</p>
                </div>

                {loginError && (
                  <div className="form-alert error" style={{ display: "block", marginBottom: "1.5rem" }}>
                    {loginError}
                  </div>
                )}


                <form onSubmit={handleLogin}>
                  <div className="form-group">
                    <label htmlFor="portal-admin-username" className="form-label">Username</label>
                    <input 
                      type="text" 
                      id="portal-admin-username" 
                      className="form-input" 
                      placeholder="Username administrator" 
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required 
                      autoComplete="username"
                    />
                  </div>
                  
                  <div className="form-group" style={{ marginBottom: "2rem", marginTop: "1rem" }}>
                    <label htmlFor="portal-admin-password" className="form-label">Password</label>
                    <input 
                      type="password" 
                      id="portal-admin-password" 
                      className="form-input" 
                      placeholder="Masukkan password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required 
                      autoComplete="current-password"
                    />
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ width: "100%" }}>Masuk Portal Admin</button>
                </form>
              </div>
            </section>
          )}

          {/* 2. ADMIN DASHBOARD */}
          {session && (
            <div>
              <div className="portal-layout">
                {/* Header Menu Horizontal Admin */}
                <aside className="portal-sidebar no-print">
                  {/* Watermark Ornamen Geometris */}
                  <div style={{ position: "absolute", top: "-15px", right: "-15px", opacity: 0.035, pointerEvents: "none", zIndex: 0 }}>
                    <svg width="100" height="100" viewBox="0 0 100 100" fill="none" stroke="var(--primary)" strokeWidth="2">
                      <circle cx="50" cy="50" r="40" />
                      <circle cx="50" cy="50" r="30" />
                      <polygon points="50,10 90,50 50,90 10,50" />
                      <polygon points="50,20 80,50 50,80 20,50" />
                    </svg>
                  </div>


                <div className="sidebar-menu" style={{ width: "100%", zIndex: 1 }}>


                  {/* Grup: Manajemen */}
                  <div style={{ padding: "0.6rem 0.75rem 0.3rem", fontSize: "0.6rem", fontWeight: 800, letterSpacing: "0.12em", color: "var(--text-muted)", textTransform: "uppercase", opacity: 0.7 }}>Manajemen</div>

                  <button 
                    className={`sidebar-btn ${activeTab === "sekolah" ? "active" : ""}`}
                    onClick={() => setActiveTab("sekolah")}
                  >
                    <svg className="tab-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
                      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                      <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" />
                    </svg>
                    Profil Sekolah
                  </button>

                  <button 
                    className={`sidebar-btn ${activeTab === "guru" ? "active" : ""}`}
                    onClick={() => { setActiveTab("guru"); setGuruMessage(""); }}
                  >
                    <svg className="tab-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                    Data Guru
                  </button>
                  <button 
                    className={`sidebar-btn ${activeTab === "siswa" ? "active" : ""}`}
                    onClick={() => { setActiveTab("siswa"); setSiswaMessage(""); }}
                  >
                    <svg className="tab-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                    </svg>
                    Data Siswa
                  </button>
                  <a 
                    href="/cetak-blanko" 
                    target="_blank" 
                    className="sidebar-btn"
                    style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}
                  >
                    <svg className="tab-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6z"/>
                    </svg>
                    <span>Cetak Blanko HVS</span>
                  </a>

                  <button 
                    className={`sidebar-btn ${activeTab === "perpustakaan" ? "active" : ""}`}
                    onClick={() => { setActiveTab("perpustakaan"); }}
                  >
                    <svg className="tab-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
                      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                    </svg>
                    Perpustakaan Digital
                  </button>
                  <button 
                    className={`sidebar-btn ${activeTab === "mapel" ? "active" : ""}`}
                    onClick={() => { setActiveTab("mapel"); setMapelMessage(""); }}
                  >
                    <svg className="tab-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
                      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                      <path d="M6 6h10" />
                      <path d="M6 10h10" />
                    </svg>
                    Mata Pelajaran
                  </button>
                  <button 
                    className={`sidebar-btn ${activeTab === "ekskul" ? "active" : ""}`}
                    onClick={() => { setActiveTab("ekskul"); setEkskulMessage(""); }}
                  >
                    <svg className="tab-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
                      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                      <path d="M4 22h16" />
                      <path d="M10 14.66V17c0 .55-.45 1-1 1H4v2h16v-2h-5c-.55 0-1-.45-1-1v-2.34" />
                      <path d="M12 2a6 6 0 0 1 6 6v1c0 2.2-1.8 4-4 4h-4a4 4 0 0 1-4-4V8a6 6 0 0 1 6-6z" />
                    </svg>
                    Ekstrakurikuler
                  </button>
                  <button 
                    className={`sidebar-btn ${activeTab === "jadwal" ? "active" : ""}`}
                    onClick={() => { setActiveTab("jadwal"); setJadwalMessage(""); }}
                  >
                    <svg className="tab-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    Jadwal Ujian
                  </button>

                  
                  {/* Grup: Manajemen Sertifikasi */}
                  <div style={{ padding: "0.6rem 0.75rem 0.3rem", fontSize: "0.6rem", fontWeight: 800, letterSpacing: "0.12em", color: "var(--text-muted)", textTransform: "uppercase", opacity: 0.7, marginTop: "0.25rem" }}>Sertifikasi (PKL & UKK)</div>
                  
                  <button 
                    className={`sidebar-btn ${activeTab === "pkl" ? "active" : ""}`}
                    onClick={() => { setActiveTab("pkl"); if(typeof setIsMobileMenuOpen === 'function') setIsMobileMenuOpen(false); }}
                  >
                    <svg className="tab-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}><path d="M3 21h18M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16M9 21v-4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v4" /></svg>
                    Manajemen PKL
                  </button>

                  <button 
                    className={`sidebar-btn ${activeTab === "ukk" ? "active" : ""}`}
                    onClick={() => { setActiveTab("ukk"); if(typeof setIsMobileMenuOpen === 'function') setIsMobileMenuOpen(false); }}
                  >
                    <svg className="tab-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
                    Manajemen UKK
                  </button>

                  <button 
                    className={`sidebar-btn ${activeTab === "settings" ? "active" : ""}`}
                    onClick={() => { setActiveTab("settings"); if(typeof setIsMobileMenuOpen === 'function') setIsMobileMenuOpen(false); }}
                  >
                    <svg className="tab-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
                    Tanda Tangan & Set
                  </button>

                  {/* Grup: Absensi & Rekap */}
                  <div style={{ padding: "0.6rem 0.75rem 0.3rem", fontSize: "0.6rem", fontWeight: 800, letterSpacing: "0.12em", color: "var(--text-muted)", textTransform: "uppercase", opacity: 0.7, marginTop: "0.25rem" }}>Absensi & Rekap</div>

                  <button 
                    className={`sidebar-btn ${activeTab === "absen-siswa" ? "active" : ""}`}
                    onClick={() => { setActiveTab("absen-siswa"); setScanMessage(""); loadDailyStudentAttendance(); }}
                  >
                    <svg className="tab-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <path d="M7 7h2v2H7z" />
                      <path d="M15 7h2v2h-2z" />
                      <path d="M7 15h2v2H7z" />
                      <path d="M15 15h2v2h-2z" />
                    </svg>
                    Absensi Siswa (QR)
                  </button>
                  <button 
                    className={`sidebar-btn ${activeTab === "absen-guru" ? "active" : ""}`}
                    onClick={() => { setActiveTab("absen-guru"); loadDailyTeacherAttendance(); }}
                  >
                    <svg className="tab-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
                      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                    </svg>
                    Absensi & Beban Guru
                  </button>
                  <button 
                    className={`sidebar-btn ${activeTab === "rekap-absensi" ? "active" : ""}`}
                    onClick={() => setActiveTab("rekap-absensi")}
                  >
                    <svg className="tab-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                      <polyline points="10 9 9 9 8 9" />
                    </svg>
                    Rekap Absensi Siswa
                  </button>

                  {/* Keluar */}
                  <div style={{ marginTop: "auto", paddingTop: "0.5rem" }}>
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
                </div>
              </aside>

              {/* Konten Utama Admin */}
              <main className="portal-main-content">
                {/* TAB 1: PROFIL SEKOLAH */}
                {activeTab === "sekolah" && (
                  <div>
                    <span style={{ fontSize: "0.85rem", textTransform: "uppercase", fontWeight: 700, color: "var(--secondary)" }}>Pengaturan</span>
                    <h2 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--primary-dark)", marginBottom: "1rem" }}>
                      Kelola Profil Sekolah
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
                        className={`btn ${schoolSubTab === "absensi-setting" ? "btn-primary" : "btn-outline"}`}
                        onClick={() => setSchoolSubTab("absensi-setting")}
                        style={{ padding: "0.5rem 1rem", fontSize: "0.85rem", margin: 0, display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
                      >
                        <svg className="tab-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
                          <circle cx="12" cy="12" r="3" />
                          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                        </svg>
                        Pengaturan Wi-Fi & Bendahara
                      </button>
                    </div>

                    {schoolSubTab === "profil" ? (
                      <form onSubmit={handleSchoolSubmit} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
                        {/* Sisi Kiri: Detail Profil */}
                        <div>
                          <div className="form-group">
                            <label className="form-label">Nama Sekolah Resmi</label>
                            <input 
                              type="text" 
                              className="form-input" 
                              value={school.nama} 
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
                                value={school.npsn} 
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
                              value={school.alamat} 
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
                                value={school.kepsek} 
                                onChange={(e) => setSchool(prev => ({ ...prev, kepsek: e.target.value }))}
                                required 
                              />
                            </div>
                            <div className="form-group">
                              <label className="form-label">NIP Kepala Sekolah</label>
                              <input 
                                type="text" 
                                className="form-input" 
                                value={school.kepsekNip} 
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
                              <label className="form-label">Batas Jam Kehadiran Siswa</label>
                              <input 
                                type="time" 
                                className="form-input" 
                                value={school.batasJamHadirSiswa || "07:00"} 
                                onChange={(e) => setSchool(prev => ({ ...prev, batasJamHadirSiswa: e.target.value }))}
                              />
                              <small className="text-muted" style={{ display: "block", marginTop: "4px" }}>Batas akhir siswa dinyatakan tepat waktu (misal: 07:00)</small>
                            </div>
                            <div className="form-group">
                              <label className="form-label">Batas Jam Kehadiran Guru</label>
                              <input 
                                type="time" 
                                className="form-input" 
                                value={school.batasJamHadirGuru || "06:45"} 
                                onChange={(e) => setSchool(prev => ({ ...prev, batasJamHadirGuru: e.target.value }))}
                              />
                              <small className="text-muted" style={{ display: "block", marginTop: "4px" }}>Batas akhir guru dinyatakan tepat waktu (misal: 06:45)</small>
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
                                value={school.semester} 
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
                                value={school.tahunAjaran} 
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
                              value={school.tanggalCetak} 
                              onChange={(e) => setSchool(prev => ({ ...prev, tanggalCetak: e.target.value }))}
                              required 
                            />
                          </div>

                          <button type="submit" className="btn btn-primary" style={{ marginTop: "2rem", width: "100%" }}>
                            Simpan Pengaturan Profil
                          </button>
                        </div>

                        {/* Sisi Kanan: Upload Logo & Mode Ujian */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "2rem", alignSelf: "start" }}>
                          {/* Logo Sekolah */}
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", border: "2px dashed var(--border-color)", borderRadius: "var(--radius-md)", padding: "2rem", backgroundColor: "var(--bg-alt)" }}>
                            <h4 style={{ fontWeight: 700, color: "var(--primary-dark)", marginBottom: "1.5rem" }}>Logo Sekolah & Watermark</h4>
                            
                            <div style={{ width: "150px", height: "150px", border: "1px solid var(--border-color)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "white", fontSize: "4rem", marginBottom: "1.5rem", overflow: "hidden", position: "relative" }}>
                              {schoolLogoPreview && schoolLogoPreview !== "dY?" ? (
                                <img src={schoolLogoPreview} alt="Logo" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                              ) : (
                                schoolLogoPreview
                              )}
                            </div>

                            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%", marginTop: "0.5rem" }}>
                              <label className="btn btn-outline" style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", cursor: "pointer", width: "fit-content", padding: "0.6rem 1.25rem" }}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
                                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                  <polyline points="17 8 12 3 7 8" />
                                  <line x1="12" y1="3" x2="12" y2="15" />
                                </svg>
                                {isUploadingLogo ? "Mengunggah..." : "Pilih File Gambar Logo"}
                                <input 
                                  type="file" 
                                  accept="image/*" 
                                  onChange={handleLogoUpload} 
                                  disabled={isUploadingLogo}
                                  style={{ display: "none" }} 
                                />
                              </label>
                              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.75rem", textAlign: "center", maxWidth: "280px", lineHeight: "1.4" }}>
                                Format (.png / .jpg / .jpeg) - Logo ini akan otomatis menjadi watermark rapor.
                              </p>
                            </div>
                          </div>

                          {/* Pengaturan Mode Akses Ujian */}
                          <div style={{ padding: "1.5rem", backgroundColor: "rgba(37, 99, 235, 0.05)", borderRadius: "var(--radius-md)", border: "1px solid rgba(37, 99, 235, 0.15)" }}>
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
                        </div>
                      </form>
                    ) : schoolSubTab === "konten" ? (
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
                    ) : (
                      /* schoolSubTab === "absensi-setting" */
                      <div style={{ maxWidth: "800px" }}>
                        <div style={{ backgroundColor: "white", padding: "2rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", marginBottom: "2rem", boxShadow: "var(--shadow-sm)" }}>
                          <h3 style={{ fontWeight: 800, color: "var(--primary-dark)", fontSize: "1.2rem", marginBottom: "1rem" }}>⚡ Pengaturan IP Wi-Fi Resmi Sekolah</h3>
                          <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1.5rem" }}>
                            Absensi mandiri guru hanya diperbolehkan apabila guru terhubung ke jaringan internet (Wi-Fi) dengan IP Publik resmi yang terdaftar di bawah ini.
                          </p>

                          {ipSuccess && (
                            <div className="form-alert success" style={{ display: "block", marginBottom: "1.5rem" }}>
                              {ipSuccess}
                            </div>
                          )}

                          <div className="form-group" style={{ display: "flex", gap: "1rem", alignItems: "flex-end" }}>
                            <div style={{ flex: 1 }}>
                              <label className="form-label" style={{ fontWeight: 700 }}>IP Publik Terdaftar</label>
                              <input 
                                type="text" 
                                className="form-input" 
                                placeholder="Contoh: 114.124.230.12 (Kosongkan jika ingin menonaktifkan pembatasan IP)" 
                                value={schoolIp} 
                                onChange={(e) => setSchoolIp(e.target.value)}
                              />
                            </div>
                            <button 
                              type="button" 
                              className="btn btn-outline" 
                              onClick={handleDetectMyIp}
                              style={{ height: "45px" }}
                            >
                              🔍 Deteksi IP Saya Saat Ini
                            </button>
                            <button 
                              type="button" 
                              className="btn btn-primary" 
                              onClick={handleSaveSchoolIp}
                              style={{ height: "45px" }}
                            >
                              💾 Simpan IP Wi-Fi
                            </button>
                          </div>
                        </div>

                        <div style={{ backgroundColor: "white", padding: "2rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", boxShadow: "var(--shadow-sm)" }}>
                          <h3 style={{ fontWeight: 800, color: "var(--primary-dark)", fontSize: "1.2rem", marginBottom: "1rem" }}>💰 Penunjukan Bendahara Sekolah</h3>
                          <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1.5rem" }}>
                            Tunjuk salah satu guru resmi menjadi Bendahara Sekolah untuk membuka akses menu Laporan & Rekapitulasi Keuangan guru.
                          </p>

                          <div style={{ overflowX: "auto" }}>
                            <table className="table" style={{ width: "100%" }}>
                              <thead>
                                <tr>
                                  <th>Nama Guru</th>
                                  
                                  <th style={{ textAlign: "center" }}>Bendahara Sekolah?</th>
                                  <th style={{ textAlign: "center" }}>Pengelola TU?</th>
                                  <th style={{ textAlign: "center" }}>Pengelola Perpus?</th>
                                  <th style={{ textAlign: "center" }}>Pengelola Sarpras?</th>
                                  <th style={{ textAlign: "center" }}>Waka Kurikulum?</th>
                                  <th style={{ textAlign: "center" }}>Waka Kesiswaan?</th>
                                  <th style={{ textAlign: "center" }}>Kaprodi DKV?</th>
                                </tr>
                              </thead>
                              <tbody>
                                {teachers.map((t) => (
                                  <tr key={t.id}>
                                    <td style={{ fontWeight: "bold" }}>{t.name}</td>
                                    <td style={{ textAlign: "center" }}>
                                      <input 
                                        type="checkbox" 
                                        checked={t.isBendahara || false}
                                        onChange={() => handleAssignTreasurer(t.id, t.isBendahara || false)}
                                        style={{ width: "18px", height: "18px", cursor: "pointer" }}
                                      />
                                    </td>
                                    <td style={{ textAlign: "center" }}>
                                      <input 
                                        type="checkbox" 
                                        checked={t.isTU || false}
                                        onChange={() => handleAssignSpecialRole(t.id, "isTU", t.isTU || false)}
                                        style={{ width: "18px", height: "18px", cursor: "pointer" }}
                                      />
                                    </td>
                                    <td style={{ textAlign: "center" }}>
                                      <input 
                                        type="checkbox" 
                                        checked={t.isPerpus || false}
                                        onChange={() => handleAssignSpecialRole(t.id, "isPerpus", t.isPerpus || false)}
                                        style={{ width: "18px", height: "18px", cursor: "pointer" }}
                                      />
                                    </td>
                                    <td style={{ textAlign: "center" }}>
                                      <input 
                                        type="checkbox" 
                                        checked={t.isSarpras || false}
                                        onChange={() => handleAssignSpecialRole(t.id, "isSarpras", t.isSarpras || false)}
                                        style={{ width: "18px", height: "18px", cursor: "pointer" }}
                                      />
                                    </td>
                                    <td style={{ textAlign: "center" }}>
                                      <input 
                                        type="checkbox" 
                                        checked={t.isWakaKurikulum || false}
                                        onChange={() => handleAssignSpecialRole(t.id, "isWakaKurikulum", t.isWakaKurikulum || false)}
                                        style={{ width: "18px", height: "18px", cursor: "pointer" }}
                                      />
                                    </td>
                                    <td style={{ textAlign: "center" }}>
                                      <input 
                                        type="checkbox" 
                                        checked={t.isWakaKesiswaan || false}
                                        onChange={() => handleAssignSpecialRole(t.id, "isWakaKesiswaan", t.isWakaKesiswaan || false)}
                                        style={{ width: "18px", height: "18px", cursor: "pointer" }}
                                      />
                                    </td>
                                    <td style={{ textAlign: "center" }}>
                                      <input 
                                        type="checkbox" 
                                        checked={t.isKaprodiDkv || false}
                                        onChange={() => handleAssignSpecialRole(t.id, "isKaprodiDkv", t.isKaprodiDkv || false)}
                                        style={{ width: "18px", height: "18px", cursor: "pointer" }}
                                      />
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}



                {/* TAB 2: KELOLA DATA GURU */}
                {activeTab === "guru" && (
                  <div>
                    <span style={{ fontSize: "0.85rem", textTransform: "uppercase", fontWeight: 700, color: "var(--secondary)" }}>Pendidik</span>
                    <h2 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--primary-dark)", marginBottom: "1.5rem" }}>
                      Pendaftaran & Kelola Data Guru
                    </h2>

                    <div className="grid grid-2" style={{ gap: "2rem" }}>
                      {/* Sisi Kiri: Tambah Guru */}
                      <div>
                        <h3 style={{ fontWeight: 700, color: "var(--primary-dark)", marginBottom: "1rem" }}>Daftarkan Guru Baru</h3>
                        
                        {guruMessage && (
                          <div className={`form-alert ${guruMessage.startsWith("Gagal") ? "error" : "success"}`} style={{ display: "block", marginBottom: "1.5rem" }}>
                            {guruMessage}
                          </div>
                        )}

                        <form onSubmit={handleGuruSubmit} style={{ backgroundColor: "var(--bg-alt)", padding: "1.5rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }}>
                          <div className="form-group">
                            <label className="form-label">Nama Lengkap & Gelar</label>
                            <input 
                              type="text" 
                              className="form-input" 
                              placeholder="Contoh: Siti Rahma, S.Pd."
                              value={newGuru.name}
                              onChange={(e) => setNewGuru(prev => ({ ...prev, name: e.target.value }))}
                              required 
                            />
                          </div>

                          <div className="form-group" style={{ marginTop: "1rem" }}>
                            <label className="form-label">NIP Pendidik <span style={{ fontWeight: "normal", fontSize: "0.8rem", color: "var(--text-muted)" }}>(Opsional)</span></label>
                            <input 
                              type="text" 
                              className="form-input" 
                              placeholder="Isi NIP atau kosongkan" 
                              value={newGuru.nip}
                              onChange={(e) => setNewGuru(prev => ({ ...prev, nip: e.target.value }))}
                            />
                          </div>

                          <div className="form-group" style={{ marginTop: "1rem" }}>
                            <label className="form-label" style={{ fontWeight: 700 }}>Mata Pelajaran diampu (Centang minimal satu)</label>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginTop: "0.5rem", padding: "0.75rem", border: "1px solid var(--border-color)", borderRadius: "var(--radius-sm)", backgroundColor: "white" }}>
                              {subjects.map(s => (
                                <label key={s.id} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", cursor: "pointer", fontWeight: "normal" }}>
                                  <input 
                                    type="checkbox" 
                                    checked={newGuru.subjects ? newGuru.subjects.includes(s.name) : false}
                                    onChange={(e) => handleSubjectCheckboxChange(s.name, e.target.checked)}
                                  />
                                  {s.name}
                                </label>
                              ))}
                            </div>
                          </div>

                          <div className="form-group" style={{ marginTop: "1rem" }}>
                            <label className="form-label" style={{ fontWeight: 700 }}>Ekstrakurikuler diampu (Opsional)</label>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginTop: "0.5rem", padding: "0.75rem", border: "1px solid var(--border-color)", borderRadius: "var(--radius-sm)", backgroundColor: "white" }}>
                              {extracurriculars.map(e => (
                                <label key={e.id} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", cursor: "pointer", fontWeight: "normal" }}>
                                  <input 
                                    type="checkbox" 
                                    checked={newGuru.extracurriculars ? newGuru.extracurriculars.includes(e.name) : false}
                                    onChange={(evt) => handleEkskulCheckboxChange(e.name, evt.target.checked)}
                                  />
                                  {e.name}
                                </label>
                              ))}
                            </div>
                          </div>

                          <div className="form-group-row" style={{ marginTop: "1rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                            <div className="form-group">
                              <label className="form-label">Peran Pendidik</label>
                              <select 
                                className="form-select"
                                value={newGuru.role}
                                onChange={(e) => setNewGuru(prev => ({ ...prev, role: e.target.value }))}
                                required
                              >
                                <option value="guru-mapel">Guru Mata Pelajaran</option>
                                <option value="wali-kelas">Wali Kelas</option>
                              </select>
                            </div>
                            
                            <div className="form-group" style={{ display: newGuru.role === "wali-kelas" ? "block" : "none" }}>
                              <label className="form-label">Kelas Asuhan Wali</label>
                              <input 
                                type="text" 
                                className="form-input" 
                                placeholder="Contoh: X DKV" 
                                value={newGuru.kelas}
                                onChange={(e) => setNewGuru(prev => ({ ...prev, kelas: e.target.value }))}
                                required={newGuru.role === "wali-kelas"}
                              />
                            </div>
                          </div>

                          <div className="form-group-row" style={{ marginTop: "1rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                            <div className="form-group">
                              <label className="form-label">Jabatan (Tunjangan)</label>
                              <select 
                                className="form-select"
                                value={newGuru.jabatan}
                                onChange={(e) => setNewGuru(prev => ({ ...prev, jabatan: e.target.value }))}
                                required
                              >
                                <option value="-">- Pilih / Guru Biasa -</option>
                                <option value="Kepala Sekolah">Kepala Sekolah</option>
                                <option value="Waka Kurikulum">Waka Kurikulum</option>
                                <option value="Waka Kesiswaan">Waka Kesiswaan</option>
                                <option value="Waka Sarpras">Waka Sarpras</option>
                                <option value="Wali Kelas">Wali Kelas</option>
                                <option value="Bendahara">Bendahara</option>
                                <option value="Operator Sekolah">Operator Sekolah</option>
                                <option value="Ka TU">Ka TU</option>
                              </select>
                            </div>
                            <div className="form-group">
                              <label className="form-label">Nominal Tunjangan Jabatan (Rp)</label>
                              <input 
                                type="number" 
                                className="form-input" 
                                placeholder="Contoh: 500000" 
                                value={newGuru.tunjangan}
                                onChange={(e) => setNewGuru(prev => ({ ...prev, tunjangan: Number(e.target.value) }))}
                                required 
                              />
                            </div>
                          </div>

                          <div className="form-group-row" style={{ marginTop: "1rem" }}>
                            <div className="form-group">
                              <label className="form-label">Insentif Khusus / Hari (Rp) - <i>Opsional</i></label>
                              <input 
                                type="number" 
                                className="form-input" 
                                placeholder="Kosongkan untuk ikut tarif global" 
                                value={newGuru.customInsentif || ""}
                                onChange={(e) => setNewGuru(prev => ({ ...prev, customInsentif: e.target.value ? Number(e.target.value) : "" }))}
                              />
                            </div>
                          </div>

                          <div className="form-group-row" style={{ marginTop: "1rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                            <div className="form-group">
                              <label className="form-label">Username Login</label>
                              <input 
                                type="text" 
                                className="form-input" 
                                placeholder="Username" 
                                value={newGuru.username}
                                onChange={(e) => setNewGuru(prev => ({ ...prev, username: e.target.value }))}
                                required 
                              />
                            </div>
                            <div className="form-group">
                              <label className="form-label">Password</label>
                              <input 
                                type="password" 
                                className="form-input" 
                                placeholder="Password" 
                                value={newGuru.password}
                                onChange={(e) => setNewGuru(prev => ({ ...prev, password: e.target.value }))}
                                required 
                              />
                            </div>
                          </div>

                          <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: "1.5rem" }}>
                            Daftarkan Guru Baru
                          </button>
                        </form>
                      </div>

                      {/* Sisi Kanan: Daftar Guru */}
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                          <h3 style={{ fontWeight: 700, color: "var(--primary-dark)" }}>Daftar Pendidik</h3>
                          
                          <select 
                            className="form-select" 
                            value={filterClassGuru} 
                            onChange={(e) => setFilterClassGuru(e.target.value)}
                            style={{ maxWidth: "160px", height: "35px", fontSize: "0.8rem", padding: "0.25rem 0.5rem" }}
                          >
                            <option value="all">Semua Wali Kelas</option>
                            {uniqueTeacherClasses.map((c, idx) => (
                              <option value={c} key={idx}>{c}</option>
                            ))}
                          </select>
                        </div>

                        <div className="portal-table-container">
                          <table className="portal-table">
                            <thead>
                              <tr>
                                <th>Nama / NIP</th>
                                <th>Mapel / Peran</th>
                                <th>Username</th>
                                <th style={{ textAlign: "center" }}>Aksi</th>
                              </tr>
                            </thead>
                            <tbody>
                              {getFilteredTeachers().map(t => (
                                <tr key={t.id}>
                                  <td><strong>{t.name}</strong><br /><span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>NIP: {t.nip}</span></td>
                                  <td>
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem", marginBottom: "0.25rem" }}>
                                      {t.subjects && t.subjects.map((sub, idx) => (
                                        <span className="badge-info" key={idx} style={{ fontSize: "0.7rem", padding: "0.1rem 0.3rem" }}>{sub}</span>
                                      ))}
                                    </div>
                                    {t.extracurriculars && t.extracurriculars.length > 0 && (
                                      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem", marginBottom: "0.25rem" }}>
                                        {t.extracurriculars.map((ekskul, idx) => (
                                          <span className="badge-info" key={idx} style={{ fontSize: "0.7rem", padding: "0.1rem 0.3rem", backgroundColor: "var(--secondary)" }}>{ekskul}</span>
                                        ))}
                                      </div>
                                    )}
                                    <span style={{ fontSize: "0.75rem", color: "var(--primary)", fontWeight: 700 }}>{t.role === "wali-kelas" ? `Wali Kelas (${t.kelas})` : "Guru Mapel"}</span>
                                  </td>
                                  <td><code>{t.username}</code></td>
                                  <td style={{ textAlign: "center", display: "flex", gap: "0.5rem", justifyContent: "center" }}>
                                    <button 
                                      className="btn btn-outline" 
                                      style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem", borderColor: "var(--secondary)", color: "var(--secondary)", display: "inline-flex", alignItems: "center", gap: "0.25rem" }}
                                      onClick={() => setEditingGuru(t)}
                                    >
                                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
                                        <path d="M12 20h9" />
                                        <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                                      </svg>
                                      Edit
                                    </button>
                                    <button 
                                      className="btn btn-outline" 
                                      style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem", borderColor: "var(--primary)", color: "var(--primary)", display: "inline-flex", alignItems: "center", gap: "0.25rem" }}
                                      onClick={() => handleUpdateTeacherPassword(t.id, t.name)}
                                    >
                                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
                                        <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
                                      </svg>
                                      Reset Sandi
                                    </button>
                                    <button 
                                      className="btn btn-outline" 
                                      style={{ borderColor: "#ef4444", color: "#ef4444", padding: "0.25rem 0.5rem", fontSize: "0.75rem", display: "inline-flex", alignItems: "center", gap: "0.25rem" }}
                                      onClick={() => handleDeleteTeacher(t.id, t.name)}
                                    >
                                      Hapus
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 3: KELOLA DATA SISWA */}
                {activeTab === "siswa" && (
                  <div>
                    <span style={{ fontSize: "0.85rem", textTransform: "uppercase", fontWeight: 700, color: "var(--secondary)" }}>Peserta Didik</span>
                    <h2 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--primary-dark)", marginBottom: "1.5rem" }}>
                      Pendaftaran & Kelola Data Siswa
                    </h2>

                    <div className="grid grid-2" style={{ gap: "2rem" }}>
                      {/* Sisi Kiri: Tambah Siswa */}
                      <div>
                        {/* Impor Excel Siswa */}
                        <div style={{ backgroundColor: "var(--bg-alt)", padding: "1.5rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", marginBottom: "2rem" }}>
                          <h3 style={{ fontWeight: 700, color: "var(--primary-dark)", marginBottom: "1rem" }}>Impor Data Siswa Massal (Excel)</h3>
                          <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1rem" }}>Unduh template file Excel murni, isi dengan data siswa lengkap, lalu unggah kembali untuk impor instan.</p>
                          
                          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                            <button className="btn btn-outline" onClick={unduhTemplateExcel} style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="7 10 12 15 17 10" />
                                <line x1="12" y1="15" x2="12" y2="3" />
                              </svg>
                              Unduh Template Excel
                            </button>
                            <label className="btn btn-primary" style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="17 8 12 3 7 8" />
                                <line x1="12" y1="3" x2="12" y2="15" />
                              </svg>
                              Pilih Berkas Excel (.xlsx / .xls)
                              <input 
                                type="file" 
                                accept=".xlsx, .xls" 
                                onChange={handleExcelImport} 
                                style={{ display: "none" }} 
                              />
                            </label>
                          </div>
                        </div>

                        {/* Pendaftaran Manual */}
                        <h3 style={{ fontWeight: 700, color: "var(--primary-dark)", marginBottom: "1rem" }}>Daftar Siswa Baru Secara Manual</h3>
                        
                        {siswaMessage && (
                          <div className={`form-alert ${siswaMessage.startsWith("Gagal") ? "error" : "success"}`} style={{ display: "block", marginBottom: "1.5rem" }}>
                            {siswaMessage}
                          </div>
                        )}

                        <form onSubmit={handleSiswaSubmit} style={{ backgroundColor: "var(--bg-alt)", padding: "1.5rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }}>
                          <div className="form-group">
                            <label className="form-label">Nama Lengkap Siswa</label>
                            <input 
                              type="text" 
                              className="form-input" 
                              placeholder="Nama lengkap siswa"
                              value={newSiswa.name}
                              onChange={(e) => setNewSiswa(prev => ({ ...prev, name: e.target.value }))}
                              required 
                            />
                          </div>

                          <div className="form-group-row" style={{ marginTop: "1rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                            <div className="form-group">
                              <label className="form-label">NIS (Nomor Induk Siswa)</label>
                              <input 
                                type="text" 
                                className="form-input" 
                                placeholder="Contoh: 24003"
                                value={newSiswa.nis}
                                onChange={(e) => setNewSiswa(prev => ({ ...prev, nis: e.target.value }))}
                                required 
                              />
                            </div>
                            <div className="form-group">
                              <label className="form-label">NISN (Nomor Induk Siswa Nasional)</label>
                              <input 
                                type="text" 
                                className="form-input" 
                                placeholder="Contoh: 0089998887"
                                value={newSiswa.nisn}
                                onChange={(e) => setNewSiswa(prev => ({ ...prev, nisn: e.target.value }))}
                                required 
                              />
                            </div>
                          </div>

                          <div className="form-group" style={{ marginTop: "1rem" }}>
                            <label className="form-label">Jenis Kelamin</label>
                            <select 
                              className="form-select"
                              value={newSiswa.jenisKelamin}
                              onChange={(e) => setNewSiswa(prev => ({ ...prev, jenisKelamin: e.target.value }))}
                              required
                            >
                              <option value="Laki-laki">Laki-laki</option>
                              <option value="Perempuan">Perempuan</option>
                            </select>
                          </div>
                <div className="form-group" style={{ marginTop: "1rem" }}>
                  <label className="form-label">Status Siswa</label>
                  <select 
                    className="form-select"
                    value={newSiswa.status || "AKTIF"}
                    onChange={(e) => setNewSiswa(prev => ({ ...prev, status: e.target.value }))}
                    required
                  >
                    <option value="AKTIF">AKTIF</option>
                    <option value="LULUS">LULUS (ALUMNI)</option>
                    <option value="PINDAH">PINDAH</option>
                    <option value="KELUAR">KELUAR</option>
                  </select>
                </div>

                          <div className="form-group-row" style={{ marginTop: "1rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                            <div className="form-group">
                              <label className="form-label">Tempat Lahir</label>
                              <input 
                                type="text" 
                                className="form-input" 
                                placeholder="Kota Lahir"
                                value={newSiswa.tempatLahir}
                                onChange={(e) => setNewSiswa(prev => ({ ...prev, tempatLahir: e.target.value }))}
                                required 
                              />
                            </div>
                            <div className="form-group">
                              <label className="form-label">Tanggal Lahir</label>
                              <input 
                                type="date" 
                                className="form-input" 
                                value={newSiswa.tanggalLahir}
                                onChange={(e) => setNewSiswa(prev => ({ ...prev, tanggalLahir: e.target.value }))}
                                required 
                              />
                            </div>
                          </div>

                          <div className="form-group-row" style={{ marginTop: "1rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                            <div className="form-group">
                              <label className="form-label">Nama Orang Tua / Wali</label>
                              <input 
                                type="text" 
                                className="form-input" 
                                placeholder="Nama Orang Tua / Wali"
                                value={newSiswa.namaOrangTua}
                                onChange={(e) => setNewSiswa(prev => ({ ...prev, namaOrangTua: e.target.value }))}
                                required 
                              />
                            </div>
                            <div className="form-group">
                              <label className="form-label">Asal Sekolah</label>
                              <input 
                                type="text" 
                                className="form-input" 
                                placeholder="Contoh: SD N 1 Kota Demo"
                                value={newSiswa.asalSekolah}
                                onChange={(e) => setNewSiswa(prev => ({ ...prev, asalSekolah: e.target.value }))}
                                required 
                              />
                            </div>
                          </div>

                          <div className="form-group-row" style={{ marginTop: "1rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                            <div className="form-group">
                              <label className="form-label">Nama Ayah</label>
                              <input 
                                type="text" 
                                className="form-input" 
                                placeholder="Nama Lengkap Ayah"
                                value={newSiswa.namaAyah}
                                onChange={(e) => setNewSiswa(prev => ({ ...prev, namaAyah: e.target.value }))}
                                required 
                              />
                            </div>
                            <div className="form-group">
                              <label className="form-label">Nama Ibu</label>
                              <input 
                                type="text" 
                                className="form-input" 
                                placeholder="Nama Lengkap Ibu"
                                value={newSiswa.namaIbu}
                                onChange={(e) => setNewSiswa(prev => ({ ...prev, namaIbu: e.target.value }))}
                                required 
                              />
                            </div>
                          </div>

                          <div className="form-group-row" style={{ marginTop: "1rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                            <div className="form-group">
                              <label className="form-label">Pekerjaan Ayah</label>
                              <input 
                                type="text" 
                                className="form-input" 
                                placeholder="Pekerjaan Ayah"
                                value={newSiswa.pekerjaanAyah}
                                onChange={(e) => setNewSiswa(prev => ({ ...prev, pekerjaanAyah: e.target.value }))}
                                required 
                              />
                            </div>
                            <div className="form-group">
                              <label className="form-label">Pekerjaan Ibu</label>
                              <input 
                                type="text" 
                                className="form-input" 
                                placeholder="Pekerjaan Ibu"
                                value={newSiswa.pekerjaanIbu}
                                onChange={(e) => setNewSiswa(prev => ({ ...prev, pekerjaanIbu: e.target.value }))}
                                required 
                              />
                            </div>
                          </div>

                          <div className="form-group-row" style={{ marginTop: "1rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                            <div className="form-group">
                              <label className="form-label">Tanggal Masuk Sekolah</label>
                              <input 
                                type="date" 
                                className="form-input" 
                                value={newSiswa.tanggalMasuk}
                                onChange={(e) => setNewSiswa(prev => ({ ...prev, tanggalMasuk: e.target.value }))}
                                required 
                              />
                            </div>
                            <div className="form-group">
                              {/* Empty block to align grid */}
                            </div>
                          </div>

                          <div className="form-group-row" style={{ marginTop: "1rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                            <div className="form-group">
                              <label className="form-label">Kelas / Tingkat Siswa *</label>
                              <select 
                                className="form-select"
                                value={newSiswa.kelas}
                                onChange={(e) => setNewSiswa(prev => ({ ...prev, kelas: e.target.value }))}
                                required
                              >
                                <option value="X DKV">X DKV</option>
                                <option value="XI DKV">XI DKV</option>
                                <option value="XII DKV">XII DKV</option>
                              </select>
                            </div>
                            <div className="form-group">
                              {/* Empty block to align grid */}
                            </div>
                          </div>

                          <div className="form-group" style={{ marginTop: "1rem" }}>
                            <label className="form-label">Alamat Lengkap Siswa</label>
                            <textarea 
                              className="form-textarea" 
                              placeholder="Dusun RT/RW, Kecamatan, Kabupaten"
                              value={newSiswa.alamat}
                              onChange={(e) => setNewSiswa(prev => ({ ...prev, alamat: e.target.value }))}
                              required 
                            />
                          </div>

                          <div className="form-group-row" style={{ marginTop: "1rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                            <div className="form-group">
                              <label className="form-label">Username Login Siswa</label>
                              <input 
                                type="text" 
                                className="form-input" 
                                placeholder="Username unik"
                                value={newSiswa.username}
                                onChange={(e) => setNewSiswa(prev => ({ ...prev, username: e.target.value }))}
                                required 
                              />
                            </div>
                            <div className="form-group">
                              <label className="form-label">Password Login</label>
                              <input 
                                type="password" 
                                className="form-input" 
                                placeholder="Password"
                                value={newSiswa.password}
                                onChange={(e) => setNewSiswa(prev => ({ ...prev, password: e.target.value }))}
                                required 
                              />
                            </div>
                          </div>

                          <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: "1.5rem" }}>
                            Daftarkan Siswa Baru
                          </button>
                        </form>
                      </div>

                      {/* Sisi Kanan: Daftar Siswa */}
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
                          <h3 style={{ fontWeight: 700, color: "var(--primary-dark)", margin: 0 }}>Daftar Siswa Terdaftar</h3>
                          
                          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                            <button
                              type="button"
                              className="btn btn-outline"
                              style={{ height: "35px", fontSize: "0.8rem", display: "inline-flex", alignItems: "center", gap: "0.35rem", padding: "0 0.75rem", borderColor: "var(--primary)", color: "var(--primary)" }}
                              onClick={() => handlePrintCards(getFilteredStudents())}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
                                <polyline points="6 9 6 2 18 2 18 9" />
                                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                                <rect x="6" y="14" width="12" height="8" />
                              </svg>
                              Cetak Kartu ({getFilteredStudents().length})
                            </button>
                            <select 
                              className="form-select" 
                              value={filterClass} 
                              onChange={(e) => setFilterClass(e.target.value)}
                              style={{ maxWidth: "160px", height: "35px", fontSize: "0.8rem", padding: "0.25rem 0.5rem" }}
                            >
                              <option value="all">Semua Tingkat Kelas</option>
                              {uniqueStudentClasses.map((c, idx) => (
                                <option value={c} key={idx}>{c}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="portal-table-container">
                          <table className="portal-table">
                            <thead>
                              <tr>
                                <th>Nama Siswa / NISN</th>
                                <th>Kelas</th>
                                <th>Username</th>
                                <th style={{ textAlign: "center" }}>Aksi</th>
                              </tr>
                            </thead>
                            <tbody>
                              {getFilteredStudents().map(s => (
                                <tr key={s.id}>
                                   <td>
                                     <strong 
                                       style={{ cursor: "pointer", color: "var(--primary-dark)", textDecoration: "underline" }}
                                       onClick={() => setSelectedSiswaForDetail(s)}
                                       title="Klik untuk melihat rincian biodata lengkap siswa"
                                     >
                                       {s.name}
                                     </strong>
                                     <br />
                                     <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>NIS: {s.nis} / NISN: {s.nisn}</span>
                                   </td>
                                   <td><span className="badge-info" style={{ backgroundColor: "var(--secondary)", color: "white" }}>{s.kelas}</span></td>
                                  <td><code>{s.username}</code></td>
                                  <td style={{ textAlign: "center", display: "flex", gap: "0.5rem", justifyContent: "center" }}>
                                    <button 
                                      className="btn btn-outline" 
                                      style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem", borderColor: "var(--primary)", color: "var(--primary)", display: "inline-flex", alignItems: "center", gap: "0.25rem" }}
                                      onClick={() => handlePrintCards([s])}
                                    >
                                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
                                        <polyline points="6 9 6 2 18 2 18 9" />
                                        <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                                        <rect x="6" y="14" width="12" height="8" />
                                      </svg>
                                      Cetak Kartu
                                    </button>
                                    <button 
                                      className="btn btn-outline" 
                                      style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem", borderColor: "var(--secondary)", color: "var(--secondary)", display: "inline-flex", alignItems: "center", gap: "0.25rem" }}
                                      onClick={() => setEditingSiswa(s)}
                                    >
                                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
                                        <path d="M12 20h9" />
                                        <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                                      </svg>
                                      Edit
                                    </button>
                                    <button 
                                      className="btn btn-outline" 
                                      style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem", borderColor: "var(--primary)", color: "var(--primary)", display: "inline-flex", alignItems: "center", gap: "0.25rem" }}
                                      onClick={() => handleUpdateStudentPassword(s.id, s.name)}
                                    >
                                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
                                        <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
                                      </svg>
                                      Reset Sandi
                                    </button>
                                    <button 
                                      className="btn btn-outline" 
                                      style={{ borderColor: "#ef4444", color: "#ef4444", padding: "0.25rem 0.5rem", fontSize: "0.75rem", display: "inline-flex", alignItems: "center", gap: "0.25rem" }}
                                      onClick={() => handleDeleteStudent(s.id, s.name)}
                                    >
                                      Hapus
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB: PERPUSTAKAAN DIGITAL */}
                {activeTab === "perpustakaan" && <AdminPerpustakaan />}

                {/* TAB 4: KELOLA MATA PELAJARAN */}
                {activeTab === "mapel" && (
                  <div>
                    <span style={{ fontSize: "0.85rem", textTransform: "uppercase", fontWeight: 700, color: "var(--secondary)" }}>Akademik</span>
                    <h2 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--primary-dark)", marginBottom: "1.5rem" }}>
                      Kelola Mata Pelajaran Sekolah
                    </h2>

                    <div className="grid grid-2" style={{ gap: "2rem" }}>
                      {/* Sisi Kiri: Tambah Mapel */}
                      <div>
                        <h3 style={{ fontWeight: 700, color: "var(--primary-dark)", marginBottom: "1rem" }}>{editingMapelId ? "Edit Mata Pelajaran" : "Tambah Mata Pelajaran Baru"}</h3>
                        
                        {mapelMessage && (
                          <div className={`form-alert ${mapelMessage.startsWith("Gagal") ? "error" : "success"}`} style={{ display: "block", marginBottom: "1.5rem" }}>
                            {mapelMessage}
                          </div>
                        )}

                        <form onSubmit={handleMapelSubmit} style={{ backgroundColor: "var(--bg-alt)", padding: "1.5rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }}>
                          <div className="form-group">
                            <label className="form-label">Nama Mata Pelajaran</label>
                            <input 
                              type="text" 
                              className="form-input" 
                              placeholder="Contoh: Bahasa Inggris"
                              value={newMapel.name}
                              onChange={(e) => setNewMapel(prev => ({ ...prev, name: e.target.value }))}
                              required 
                            />
                          </div>

                          <div className="form-group" style={{ marginTop: "1rem" }}>
                            <label className="form-label">Unit Mata Pelajaran</label>
                            <input 
                              type="text" 
                              className="form-input" 
                              value="Sekolah Master Demo"
                              readOnly
                              style={{ backgroundColor: "var(--bg-alt)", color: "var(--text-muted)", cursor: "not-allowed" }}
                            />
                          </div>

                          <div className="form-group" style={{ marginTop: "1rem" }}>
                            <label className="form-label">Kelompok Mata Pelajaran (Rapor)</label>
                            <select 
                              className="form-input" 
                              value={newMapel.kelompok}
                              onChange={(e) => setNewMapel(prev => ({ ...prev, kelompok: e.target.value }))}
                            >
                              <option value="A">Kelompok A (Muatan Nasional)</option>
                              <option value="B">Kelompok B (Muatan Kewilayahan / Daerah)</option>
                              <option value="C">Kelompok C (Muatan Peminatan Kejuruan / Produktif)</option>
                            </select>
                          </div>

                          <div className="form-group" style={{ marginTop: "1rem" }}>
                            <label className="form-label">Untuk Kelas</label>
                            <select 
                              className="form-input" 
                              value={newMapel.untuk_kelas}
                              onChange={(e) => setNewMapel(prev => ({ ...prev, untuk_kelas: e.target.value }))}
                            >
                              <option value="Semua">Semua Kelas (X, XI, XII)</option>
                              <option value="X">Kelas X Saja</option>
                              <option value="XI">Kelas XI Saja</option>
                              <option value="XII">Kelas XII Saja</option>
                            </select>
                          </div>

                          <div className="form-group" style={{ marginTop: "1rem" }}>
                            <label className="form-label">Untuk Semester</label>
                            <select 
                              className="form-input" 
                              value={newMapel.untuk_semester}
                              onChange={(e) => setNewMapel(prev => ({ ...prev, untuk_semester: e.target.value }))}
                            >
                              <option value="Semua">Semua Semester (1-6)</option>
                              <option value="1">Semester 1 (X Ganjil)</option>
                              <option value="2">Semester 2 (X Genap)</option>
                              <option value="3">Semester 3 (XI Ganjil)</option>
                              <option value="4">Semester 4 (XI Genap)</option>
                              <option value="5">Semester 5 (XII Ganjil)</option>
                              <option value="6">Semester 6 (XII Genap)</option>
                            </select>
                          </div>

                          <div className="form-group" style={{ marginTop: "1rem" }}>
                            <label className="form-label">KKM Default (Minimum Kelulusan)</label>
                            <input 
                              type="number" 
                              className="form-input" 
                              min="0" 
                              max="100" 
                              value={newMapel.kkm}
                              onChange={(e) => setNewMapel(prev => ({ ...prev, kkm: parseInt(e.target.value, 10) }))}
                              required 
                            />
                          </div>

                          <div className="form-group" style={{ marginTop: "1.5rem" }}>
                            <label className="form-label" style={{ fontWeight: 700 }}>Pengaturan Capaian Pembelajaran (Target Rapor)</label>
                            
                            <div style={{ marginTop: "0.5rem", marginBottom: "1rem" }}>
                              <label className="form-label" style={{ fontSize: "0.85rem" }}>Input CP untuk Semester:</label>
                              <select 
                                className="form-select" 
                                value={selectedSemesterCP}
                                onChange={(e) => setSelectedSemesterCP(e.target.value)}
                              >
                                <option value="1">Semester 1 (Ganjil)</option>
                                <option value="2">Semester 2 (Genap)</option>
                                <option value="3">Semester 3 (Ganjil)</option>
                                <option value="4">Semester 4 (Genap)</option>
                                <option value="5">Semester 5 (Ganjil)</option>
                                <option value="6">Semester 6 (Genap)</option>
                              </select>
                            </div>

                            <div style={{ marginTop: "0.5rem" }}>
                              <label className="form-label" style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Target Predikat A (Sangat Baik)</label>
                              <textarea 
                                className="form-textarea" 
                                placeholder="Deskripsi untuk nilai >= 90" 
                                value={newMapel.cps[selectedSemesterCP].cpA}
                                onChange={(e) => setNewMapel(prev => ({ 
                                  ...prev, 
                                  cps: { 
                                    ...prev.cps, 
                                    [selectedSemesterCP]: { ...prev.cps[selectedSemesterCP], cpA: e.target.value } 
                                  } 
                                }))}
                                style={{ height: "60px", fontSize: "0.85rem" }}
                              />
                            </div>

                            <div style={{ marginTop: "0.5rem" }}>
                              <label className="form-label" style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Target Predikat B (Baik)</label>
                              <textarea 
                                className="form-textarea" 
                                placeholder="Deskripsi untuk nilai >= 80" 
                                value={newMapel.cps[selectedSemesterCP].cpB}
                                onChange={(e) => setNewMapel(prev => ({ 
                                  ...prev, 
                                  cps: { 
                                    ...prev.cps, 
                                    [selectedSemesterCP]: { ...prev.cps[selectedSemesterCP], cpB: e.target.value } 
                                  } 
                                }))}
                                style={{ height: "60px", fontSize: "0.85rem" }}
                              />
                            </div>

                            <div style={{ marginTop: "0.5rem" }}>
                              <label className="form-label" style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Target Predikat C (Cukup)</label>
                              <textarea 
                                className="form-textarea" 
                                placeholder="Deskripsi untuk nilai >= 70" 
                                value={newMapel.cps[selectedSemesterCP].cpC}
                                onChange={(e) => setNewMapel(prev => ({ 
                                  ...prev, 
                                  cps: { 
                                    ...prev.cps, 
                                    [selectedSemesterCP]: { ...prev.cps[selectedSemesterCP], cpC: e.target.value } 
                                  } 
                                }))}
                                style={{ height: "60px", fontSize: "0.85rem" }}
                              />
                            </div>

                            <div style={{ marginTop: "0.5rem" }}>
                              <label className="form-label" style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Target Predikat D (Kurang)</label>
                              <textarea 
                                className="form-textarea" 
                                placeholder="Deskripsi untuk nilai < 70" 
                                value={newMapel.cps[selectedSemesterCP].cpD}
                                onChange={(e) => setNewMapel(prev => ({ 
                                  ...prev, 
                                  cps: { 
                                    ...prev.cps, 
                                    [selectedSemesterCP]: { ...prev.cps[selectedSemesterCP], cpD: e.target.value } 
                                  } 
                                }))}
                                style={{ height: "60px", fontSize: "0.85rem" }}
                              />
                            </div>
                          </div>

                          <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: "1.5rem" }}>
                            Tambahkan Mata Pelajaran
                          </button>
                        </form>
                      </div>

                      {/* Sisi Kanan: Daftar Mapel */}
                      <div>
                        <h3 style={{ fontWeight: 700, color: "var(--primary-dark)", marginBottom: "1rem" }}>Daftar Mata Pelajaran Terdaftar</h3>
                        
                        <div className="portal-table-container">
                          <table className="portal-table">
                            <thead>
                              <tr>
                                <th>Nama Mapel</th>
                                <th style={{ textAlign: "center" }}>Kelompok</th>
                                <th style={{ textAlign: "center" }}>Kelas</th>
                                <th style={{ textAlign: "center" }}>KKM</th>
                                <th style={{ textAlign: "center" }}>Aksi</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(() => {
                                const filtered = getFilteredSubjects();
                                const regularSubjects = filtered.filter(s => !s.jurusan || s.jurusan.trim() === "");
                                const vocationalSubjects = filtered.filter(s => s.jurusan && s.jurusan.trim() !== "");
                                
                                const groupedByJurusan = vocationalSubjects.reduce((acc, s) => {
                                  if (!acc[s.jurusan]) acc[s.jurusan] = [];
                                  acc[s.jurusan].push(s);
                                  return acc;
                                }, {});

                                return (
                                  <>
                                    {regularSubjects.map(s => (
                                      <tr key={s.id}>
                                        <td><strong>{s.name}</strong></td>
                                        <td style={{ textAlign: "center" }}>{s.kelompok}</td>
                                        <td style={{ textAlign: "center" }}>{s.untuk_kelas}</td>
                                        <td style={{ textAlign: "center" }}><strong>{s.kkm}</strong></td>
                                        <td style={{ textAlign: "center" }}>
                                          
                                            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center" }}>
                                              <button 
                                                className="btn btn-outline" 
                                                style={{ borderColor: "#f59e0b", color: "#f59e0b", padding: "0.25rem 0.5rem", fontSize: "0.75rem" }}
                                                onClick={() => handleEditMapelClick(s)}
                                              >
                                                Edit
                                              </button>
                                              <button 
                                                className="btn btn-outline" 
                                                style={{ borderColor: "#ef4444", color: "#ef4444", padding: "0.25rem 0.5rem", fontSize: "0.75rem" }}
                                                onClick={() => handleDeleteSubject(s.id, s.name)}
                                              >
                                                Hapus
                                              </button>
                                            </div>

                                        </td>
                                      </tr>
                                    ))}

                                    {Object.entries(groupedByJurusan).map(([jurusan, subjects]) => {
                                      const isExpanded = expandedSubjectGroups[jurusan];
                                      return (
                                        <React.Fragment key={jurusan}>
                                          <tr 
                                            onClick={() => toggleSubjectGroup(jurusan)}
                                            style={{ cursor: "pointer", backgroundColor: "#f8fafc" }}
                                          >
                                            <td colSpan="5">
                                              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: "bold", color: "var(--primary-dark)" }}>
                                                <span style={{ fontSize: "0.75rem" }}>{isExpanded ? "▼" : "▶"}</span>
                                                Mata Pelajaran {jurusan} (Kejuruan)
                                              </div>
                                            </td>
                                          </tr>
                                          {isExpanded && subjects.map(s => (
                                            <tr key={s.id} style={{ backgroundColor: "#f1f5f9" }}>
                                              <td style={{ paddingLeft: "1.5rem" }}>
                                                <strong>{s.name}</strong>
                                                <div style={{ marginTop: "0.5rem", display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                                                  {[1, 2, 3, 4, 5, 6].map(sem => {
                                                    const currentSemesters = s.untuk_semester || "Semua";
                                                    const isSemChecked = currentSemesters === "Semua" || currentSemesters.split(",").includes(sem.toString());
                                                    return (
                                                      <label key={sem} style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.75rem", cursor: "pointer", color: "var(--text-muted)" }}>
                                                        <input 
                                                          type="checkbox" 
                                                          checked={isSemChecked} 
                                                          onChange={(e) => handleUpdateSemester(s.id, sem.toString(), e.target.checked, s.untuk_semester)} 
                                                          style={{ width: "12px", height: "12px", margin: 0 }}
                                                        />
                                                        Smt {sem}
                                                      </label>
                                                    );
                                                  })}
                                                </div>
                                              </td>
                                              <td style={{ textAlign: "center" }}>{s.kelompok}</td>
                                              <td style={{ textAlign: "center" }}>{s.untuk_kelas}</td>
                                              <td style={{ textAlign: "center" }}><strong>{s.kkm}</strong></td>
                                              <td style={{ textAlign: "center" }}>
                                                <button 
                                                  className="btn btn-outline" 
                                                  style={{ borderColor: "#ef4444", color: "#ef4444", padding: "0.25rem 0.5rem", fontSize: "0.75rem" }}
                                                  onClick={(e) => { e.stopPropagation(); handleDeleteSubject(s.id, s.name); }}
                                                >
                                                  Hapus
                                                </button>
                                              </td>
                                            </tr>
                                          ))}
                                        </React.Fragment>
                                      );
                                    })}
                                  </>
                                );
                              })()}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 5: KELOLA EKSTRAKURIKULER */}
                {activeTab === "ekskul" && (
                  <div>
                    <span style={{ fontSize: "0.85rem", textTransform: "uppercase", fontWeight: 700, color: "var(--secondary)" }}>Kokurikuler</span>
                    <h2 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--primary-dark)", marginBottom: "1.5rem" }}>
                      Kelola Ekstrakurikuler Sekolah
                    </h2>

                    <div className="grid grid-2" style={{ gap: "2rem" }}>
                      {/* Sisi Kiri: Tambah Ekskul */}
                      <div>
                        <h3 style={{ fontWeight: 700, color: "var(--primary-dark)", marginBottom: "1rem" }}>Tambah Ekstrakurikuler Baru</h3>
                        
                        {ekskulMessage && (
                          <div className={`form-alert ${ekskulMessage.startsWith("Gagal") ? "error" : "success"}`} style={{ display: "block", marginBottom: "1.5rem" }}>
                            {ekskulMessage}
                          </div>
                        )}

                        <form onSubmit={handleEkskulSubmit} style={{ backgroundColor: "var(--bg-alt)", padding: "1.5rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }}>
                          <div className="form-group">
                            <label className="form-label">Nama Ekstrakurikuler</label>
                            <input 
                              type="text" 
                              className="form-input" 
                              placeholder="Contoh: Pramuka, PMR, Paskibra"
                              value={newEkskul}
                              onChange={(e) => setNewEkskul(e.target.value)}
                              required 
                            />
                          </div>

                          <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: "1.5rem" }}>
                            Tambahkan Ekstrakurikuler
                          </button>
                        </form>
                      </div>

                      {/* Sisi Kanan: Daftar Ekskul */}
                      <div>
                        <h3 style={{ fontWeight: 700, color: "var(--primary-dark)", marginBottom: "1rem" }}>Daftar Ekstrakurikuler Terdaftar</h3>
                        
                        <div className="portal-table-container">
                          <table className="portal-table">
                            <thead>
                              <tr>
                                <th>Nama Ekstrakurikuler</th>
                                <th style={{ textAlign: "center" }}>Aksi</th>
                              </tr>
                            </thead>
                            <tbody>
                              {extracurriculars.map(e => (
                                <tr key={e.id}>
                                  <td><strong>{e.name}</strong></td>
                                  <td style={{ textAlign: "center" }}>
                                    <button 
                                      className="btn btn-outline" 
                                      style={{ borderColor: "#ef4444", color: "#ef4444", padding: "0.25rem 0.5rem", fontSize: "0.75rem" }}
                                      onClick={() => handleDeleteEkskul(e.id, e.name)}
                                    >
                                      Hapus
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 6: KELOLA JADWAL UJIAN */}
                {activeTab === "jadwal" && (
                  <div>
                    <span style={{ fontSize: "0.85rem", textTransform: "uppercase", fontWeight: 700, color: "var(--secondary)" }}>Ujian CBT</span>
                    <h2 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--primary-dark)", marginBottom: "1.5rem" }}>
                      Pembuatan & Pengaturan Jadwal Ujian
                    </h2>

                    <div className="grid grid-2" style={{ gap: "2rem" }}>
                      {/* Sisi Kiri: Tambah/Atur Jadwal */}
                      <div>
                        <h3 style={{ fontWeight: 700, color: "var(--primary-dark)", marginBottom: "1rem" }}>Buat / Perbarui Jadwal</h3>
                        
                        {jadwalMessage && (
                          <div className={`form-alert ${jadwalMessage.startsWith("Gagal") ? "error" : "success"}`} style={{ display: "block", marginBottom: "1.5rem" }}>
                            {jadwalMessage}
                          </div>
                        )}

                        <form onSubmit={handleSaveJadwal} style={{ backgroundColor: "var(--bg-alt)", padding: "1.5rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }}>
                          <div className="form-group">
                            <label className="form-label">Mata Pelajaran</label>
                            <select 
                              className="form-select"
                              value={newJadwal.subjectName}
                              onChange={(e) => setNewJadwal(prev => ({ ...prev, subjectName: e.target.value }))}
                              required
                            >
                              <option value="">-- Pilih Mata Pelajaran --</option>
                              {subjects.map(s => (
                                <option key={s.id} value={s.name}>{s.name}</option>
                              ))}
                            </select>
                          </div>

                          <div className="form-group" style={{ marginTop: "1rem" }}>
                            <label className="form-label">Kategori Ujian</label>
                            <select 
                              className="form-select"
                              value={newJadwal.category}
                              onChange={(e) => setNewJadwal(prev => ({ ...prev, category: e.target.value }))}
                              required
                            >
                              <option value="UTS">Ujian Tengah Semester (UTS)</option>
                              <option value="UAS">Ujian Akhir Semester (UAS)</option>
                              <option value="PAJ">Penilaian Akhir Jenjang (PAJ)</option>
                            </select>
                          </div>

                          <div className="form-group" style={{ marginTop: "1rem" }}>
                            <label className="form-label">Semester</label>
                            <select 
                              className="form-select"
                              value={newJadwal.semester}
                              onChange={(e) => setNewJadwal(prev => ({ ...prev, semester: e.target.value }))}
                              required
                            >
                              <option value="1">Semester 1 (Ganjil Kelas VII)</option>
                              <option value="2">Semester 2 (Genap Kelas VII)</option>
                              <option value="3">Semester 3 (Ganjil Kelas VIII)</option>
                              <option value="4">Semester 4 (Genap Kelas VIII)</option>
                              <option value="5">Semester 5 (Ganjil Kelas IX)</option>
                              <option value="6">Semester 6 (Genap Kelas IX / PAJ)</option>
                            </select>
                          </div>

                          <div className="form-group" style={{ marginTop: "1rem" }}>
                            <label className="form-label">Waktu Mulai Ujian</label>
                            <input 
                              type="datetime-local" 
                              className="form-input" 
                              value={newJadwal.startTime}
                              onChange={(e) => setNewJadwal(prev => ({ ...prev, startTime: e.target.value }))}
                              required 
                            />
                          </div>

                          <div className="form-group" style={{ marginTop: "1rem" }}>
                            <label className="form-label">Waktu Selesai Ujian</label>
                            <input 
                              type="datetime-local" 
                              className="form-input" 
                              value={newJadwal.endTime}
                              onChange={(e) => setNewJadwal(prev => ({ ...prev, endTime: e.target.value }))}
                              required 
                            />
                          </div>

                          <div className="form-group" style={{ marginTop: "1.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <input 
                              type="checkbox" 
                              id="force-open-check"
                              checked={newJadwal.forceOpen}
                              onChange={(e) => setNewJadwal(prev => ({ ...prev, forceOpen: e.target.checked }))}
                              style={{ width: "16px", height: "16px", cursor: "pointer" }}
                            />
                            <label htmlFor="force-open-check" style={{ fontWeight: "bold", fontSize: "0.88rem", cursor: "pointer", color: "var(--primary-dark)" }}>
                              🔓 Buka Manual (Abaikan Jadwal Waktu)
                            </label>
                          </div>

                          <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: "1.5rem" }}>
                            Simpan / Perbarui Jadwal
                          </button>
                        </form>
                      </div>

                      {/* Sisi Kanan: Daftar Jadwal */}
                      <div>
                        <h3 style={{ fontWeight: 700, color: "var(--primary-dark)", marginBottom: "1rem" }}>Jadwal Ujian Aktif</h3>
                        
                        <div className="portal-table-container">
                          <table className="portal-table">
                            <thead>
                              <tr>
                                <th>Ujian / Mapel</th>
                                <th style={{ textAlign: "center" }}>Smt</th>
                                <th>Waktu Pelaksanaan (WIB)</th>
                                <th style={{ textAlign: "center" }}>Akses Manual</th>
                                <th style={{ textAlign: "center" }}>Aksi</th>
                              </tr>
                            </thead>
                            <tbody>
                              {examSchedules.length === 0 ? (
                                <tr>
                                  <td colSpan="5" style={{ textAlign: "center", fontStyle: "italic", color: "var(--text-muted)", padding: "1.5rem" }}>
                                    Belum ada jadwal ujian yang dibuat.
                                  </td>
                                </tr>
                              ) : (
                                examSchedules.map(sch => {
                                  const startStr = new Date(sch.startTime).toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
                                  const endStr = new Date(sch.endTime).toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
                                  
                                  return (
                                    <tr key={sch.id}>
                                      <td>
                                        <strong>{sch.category} - {sch.subjectName}</strong>
                                      </td>
                                      <td style={{ textAlign: "center" }}>{sch.semester}</td>
                                      <td style={{ fontSize: "0.8rem", lineHeight: "1.4" }}>
                                        Mulai: {startStr}<br />
                                        Selesai: {endStr}
                                      </td>
                                      <td style={{ textAlign: "center" }}>
                                        <button 
                                          type="button" 
                                          className={`btn ${sch.forceOpen ? "btn-primary" : "btn-outline"}`}
                                          style={{ 
                                            padding: "0.2rem 0.5rem", 
                                            fontSize: "0.75rem", 
                                            borderColor: sch.forceOpen ? "#22c55e" : "#e2e8f0", 
                                            backgroundColor: sch.forceOpen ? "#22c55e" : "white",
                                            color: sch.forceOpen ? "white" : "var(--text-main)"
                                          }}
                                          onClick={() => handleToggleForceOpen(sch)}
                                        >
                                          {sch.forceOpen ? "🔓 Terbuka" : "🔒 Jadwal"}
                                        </button>
                                      </td>
                                      <td style={{ textAlign: "center" }}>
                                        <button 
                                          type="button" 
                                          className="btn btn-outline" 
                                          style={{ borderColor: "#ef4444", color: "#ef4444", padding: "0.25rem 0.5rem", fontSize: "0.75rem" }}
                                          onClick={() => handleDeleteJadwal(sch.id, sch.subjectName, sch.category, sch.semester)}
                                        >
                                          Hapus
                                        </button>
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
                )}

                {/* TAB 7: KEHADIRAN SISWA (QR CODE) */}
                {activeTab === "absen-siswa" && (
                  <div>
                    <span style={{ fontSize: "0.85rem", textTransform: "uppercase", fontWeight: 700, color: "var(--secondary)" }}>Absensi Sekolah</span>
                    <h2 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--primary-dark)", marginBottom: "1.5rem" }}>
                      Kehadiran Siswa & Scanner QR Code
                    </h2>

                    <div style={{ padding: "1rem", backgroundColor: "rgba(16, 185, 129, 0.08)", border: "1px solid rgba(16, 185, 129, 0.2)", borderRadius: "var(--radius-md)", marginBottom: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ paddingRight: "1rem" }}>
                        <h4 style={{ margin: 0, fontWeight: "bold", color: "var(--primary-dark)", fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--primary)", display: "block" }}>
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                          </svg>
                          Mode Terminal Absen Cepat (Rekomendasi Keamanan)
                        </h4>
                        <p style={{ margin: "2px 0 0 0", fontSize: "0.78rem", color: "var(--text-muted)" }}>
                          Gunakan tombol di samping untuk membuka layar scanner full-screen terisolasi. Ini mencegah siswa mengakses data admin lain jika laptop ditaruh di lobi.
                        </p>
                      </div>
                      <button 
                        type="button"
                        className="btn btn-primary"
                        onClick={() => window.open("/absen-cepat", "_blank")}
                        style={{ margin: 0, padding: "0.5rem 1rem", fontSize: "0.8rem", fontWeight: "bold", whiteSpace: "nowrap", display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                          <polyline points="15 3 21 3 21 9" />
                          <line x1="10" y1="14" x2="21" y2="3" />
                        </svg>
                        Buka Terminal Absen
                      </button>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: "2rem", alignItems: "start" }}>
                      {/* Sisi Kiri: Scanner Simulasi & Manual Absen */}
                      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                        <div style={{ backgroundColor: "white", padding: "1.5rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", boxShadow: "var(--shadow-sm)" }}>
                          <h3 style={{ fontWeight: 700, color: "var(--primary-dark)", fontSize: "1.1rem", marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--primary)", display: "block" }}>
                              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                              <circle cx="12" cy="13" r="4" />
                            </svg>
                            Pindai QR Code Siswa
                          </h3>
                          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
                            Gunakan alat pemindai QR USB (arahkan kursor ke input di bawah) atau ketik NISN manual siswa.
                          </p>

                          {scanMessage && (
                            <div className={`form-alert ${scanSuccess ? "success" : "error"}`} style={{ display: "block", marginBottom: "1rem", padding: "0.75rem" }}>
                              {scanMessage}
                            </div>
                          )}

                          <form onSubmit={handleScanStudentQR}>
                            <div className="form-group">
                              <label className="form-label" style={{ fontSize: "0.8rem", fontWeight: "bold" }}>Pilih Status Absen</label>
                              <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
                                {["HADIR", "SAKIT", "IZIN", "ALFA"].map((st) => (
                                  <button
                                    key={st}
                                    type="button"
                                    onClick={() => setScanStatus(st)}
                                    className={`btn ${scanStatus === st ? "btn-primary" : "btn-outline"}`}
                                    style={{ flex: 1, padding: "0.4rem", fontSize: "0.75rem", margin: 0, backgroundColor: scanStatus === st ? (st === "HADIR" ? "#22c55e" : st === "SAKIT" ? "#3b82f6" : st === "IZIN" ? "#eab308" : "#ef4444") : "white", borderColor: scanStatus === st ? "transparent" : "#e2e8f0", color: scanStatus === st ? "white" : "var(--text-main)" }}
                                  >
                                    {st}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div className="form-group">
                              <label className="form-label" style={{ fontSize: "0.8rem", fontWeight: "bold" }}>NISN Siswa</label>
                              <input
                                type="text"
                                className="form-input"
                                placeholder="Pindai barcode atau ketik NISN..."
                                value={scanNisn}
                                onChange={(e) => setScanNisn(e.target.value)}
                                autoFocus
                                required
                              />
                            </div>

                            <div className="form-group" style={{ marginTop: "1rem" }}>
                              <label className="form-label" style={{ fontSize: "0.8rem", fontWeight: "bold" }}>Catatan (Opsional)</label>
                              <input
                                type="text"
                                className="form-input"
                                placeholder="Contoh: Terlambat 10 menit, surat dokter..."
                                value={scanNotes}
                                onChange={(e) => setScanNotes(e.target.value)}
                              />
                            </div>

                            <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: "1.25rem" }}>
                              Absen Siswa
                            </button>
                          </form>
                        </div>

                        {/* Cetak Kartu QR */}
                        <div style={{ backgroundColor: "white", padding: "1.5rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", boxShadow: "var(--shadow-sm)" }}>
                          <h3 style={{ fontWeight: 700, color: "var(--primary-dark)", fontSize: "1.1rem", marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--primary)", display: "block" }}>
                              <polyline points="6 9 6 2 18 2 18 9" />
                              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                              <rect x="6" y="14" width="12" height="8" />
                            </svg>
                            Cetak Kartu QR Code
                          </h3>
                          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
                            Cetak kartu ID berisi barcode/QR Code untuk dipindai saat absensi harian siswa.
                          </p>

                          <div className="form-group">
                            <label className="form-label" style={{ fontSize: "0.8rem" }}>Pilih Kelas</label>
                            <select 
                              className="form-select" 
                              value={selectedClassCards} 
                              onChange={(e) => setSelectedClassCards(e.target.value)}
                            >
                              <option value="all">Semua Kelas</option>
                              {Array.from(new Set(students.map(s => s.kelas))).filter(Boolean).map(c => (
                                <option key={c} value={c}>{c}</option>
                              ))}
                            </select>
                          </div>

                          <button 
                            type="button" 
                            className="btn btn-outline" 
                            style={{ width: "100%", marginTop: "1.25rem" }}
                            onClick={() => {
                              const filtered = students.filter(s => selectedClassCards === "all" || s.kelas === selectedClassCards);
                              handlePrintCards(filtered, "attendance");
                            }}
                          >
                            Pratinjau & Cetak Kartu ID Absen
                          </button>
                        </div>
                      </div>

                      {/* Sisi Kanan: Lembar Absensi Manual Harian Siswa */}
                      <div style={{ backgroundColor: "white", padding: "1.5rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", boxShadow: "var(--shadow-sm)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "1rem" }}>
                          <h3 style={{ fontWeight: 700, color: "var(--primary-dark)", fontSize: "1.15rem", margin: 0, display: "flex", alignItems: "center", gap: "0.4rem" }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--primary-dark)", display: "block" }}>
                              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                              <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                            </svg>
                            Rekap Absensi Siswa Harian
                          </h3>
                          
                          <div style={{ display: "flex", gap: "0.5rem" }}>
                            <input 
                              type="time"
                              className="form-input"
                              style={{ width: "110px", padding: "0.3rem" }}
                              value={manualWaktuHadir}
                              onChange={(e) => setManualWaktuHadir(e.target.value)}
                              title="Jam Hadir Manual (Opsional)"
                            />
                            <input 
                              type="date" 
                              className="form-input" 
                              style={{ width: "130px", padding: "0.3rem" }} 
                              value={absenDate} 
                              onChange={(e) => {
                                setAbsenDate(e.target.value);
                                loadDailyStudentAttendance(e.target.value);
                              }}
                            />
                            <select 
                              className="form-select"
                              style={{ width: "120px", padding: "0.3rem" }}
                              value={filterClass}
                              onChange={(e) => setFilterClass(e.target.value)}
                            >
                              <option value="all">Semua Kelas</option>
                              {Array.from(new Set(students.map(s => s.kelas))).filter(Boolean).map(c => (
                                <option key={c} value={c}>{c}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div style={{ overflowX: "auto", maxHeight: "500px", overflowY: "auto" }}>
                          <table className="table" style={{ width: "100%" }}>
                            <thead>
                              <tr>
                                <th>Nama Siswa (NISN)</th>
                                <th style={{ textAlign: "center" }}>Kelas</th>
                                <th style={{ textAlign: "center" }}>Waktu Hadir</th>
                                <th style={{ textAlign: "center" }}>Status Kehadiran</th>
                              </tr>
                            </thead>
                            <tbody>
                              {students.filter(s => filterClass === "all" || s.kelas === filterClass).map((s) => {
                                const matchedAtt = dailyStudentAtt.find(a => a.studentId === s.id);
                                const currentStatus = matchedAtt ? matchedAtt.status : "BELUM_ABSEN";
                                
                                return (
                                  <tr key={s.id}>
                                    <td>
                                      <strong>{s.name}</strong><br />
                                      <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>NISN: {s.nisn}</span>
                                    </td>
                                    <td style={{ textAlign: "center", fontSize: "0.85rem" }}>{s.kelas}</td>
                                    <td style={{ textAlign: "center" }}>
                                      {matchedAtt?.waktuHadir ? (
                                        <span style={{ color: matchedAtt.keterlambatan > 0 ? "var(--danger)" : "var(--success)", fontWeight: "bold", fontSize: "0.8rem" }}>
                                          {matchedAtt.waktuHadir} {matchedAtt.keterlambatan > 0 ? `(Terlambat ${matchedAtt.keterlambatan}m)` : ""}
                                        </span>
                                      ) : "-"}
                                    </td>
                                    <td style={{ textAlign: "center" }}>
                                      <div style={{ display: "inline-flex", gap: "0.25rem", backgroundColor: "#f1f5f9", padding: "0.2rem", borderRadius: "4px" }}>
                                        {["HADIR", "SAKIT", "IZIN", "ALFA"].map(st => (
                                          <button
                                            key={st}
                                            type="button"
                                            onClick={() => handleStudentAttendanceBulkSave(s.id, st)}
                                            style={{
                                              padding: "0.25rem 0.5rem",
                                              fontSize: "0.7rem",
                                              border: "none",
                                              cursor: "pointer",
                                              borderRadius: "3px",
                                              fontWeight: "bold",
                                              backgroundColor: currentStatus === st ? (st === "HADIR" ? "#22c55e" : st === "SAKIT" ? "#3b82f6" : st === "IZIN" ? "#eab308" : "#ef4444") : "transparent",
                                              color: currentStatus === st ? "white" : "#64748b"
                                            }}
                                          >
                                            {st}
                                          </button>
                                        ))}
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 8: KEHADIRAN & BEBAN GURU */}
                {activeTab === "absen-guru" && (
                  <div>
                    <span style={{ fontSize: "0.85rem", textTransform: "uppercase", fontWeight: 700, color: "var(--secondary)" }}>Manajemen Pendidik</span>
                    <h2 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--primary-dark)", marginBottom: "1.5rem" }}>
                      Kehadiran & Beban Kerja Guru
                    </h2>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem", alignItems: "start" }}>
                      {/* Sisi Kiri: Kehadiran Guru Harian (Admin Override) */}
                      <div style={{ backgroundColor: "white", padding: "1.5rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", boxShadow: "var(--shadow-sm)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                          <h3 style={{ fontWeight: 700, color: "var(--primary-dark)", fontSize: "1.15rem", margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--primary)", flexShrink: 0 }}>
                              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                              <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                            </svg>
                            Rekap Harian Kehadiran Guru
                          </h3>
                          <div style={{ display: "flex", gap: "0.5rem" }}>
                            <input 
                              type="time"
                              className="form-input"
                              style={{ width: "110px", padding: "0.3rem" }}
                              value={manualWaktuHadir}
                              onChange={(e) => setManualWaktuHadir(e.target.value)}
                              title="Jam Hadir Manual (Opsional)"
                            />
                            <input 
                              type="date" 
                              className="form-input" 
                              style={{ width: "130px", padding: "0.3rem" }} 
                              value={absenDateGuru} 
                              onChange={(e) => {
                                setAbsenDateGuru(e.target.value);
                                loadDailyTeacherAttendance(e.target.value);
                              }}
                            />
                          </div>
                        </div>

                        <div style={{ overflowX: "auto" }}>
                          <table className="table" style={{ width: "100%" }}>
                            <thead>
                              <tr>
                                <th>Nama Guru</th>
                                <th>Peran</th>
                                <th style={{ textAlign: "center" }}>Waktu Hadir</th>
                                <th style={{ textAlign: "center" }}>Status Kehadiran</th>
                                <th style={{ textAlign: "center", width: "130px" }}>JP Mengajar</th>
                              </tr>
                            </thead>
                            <tbody>
                              {teachers.map((t) => {
                                const matchedAtt = dailyTeacherAtt.find(a => a.teacherId === t.id);
                                const currentStatus = matchedAtt ? matchedAtt.status : "BELUM_ABSEN";

                                return (
                                  <tr key={t.id}>
                                    <td>
                                      <strong>{t.name}</strong><br />
                                      <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>NIP: {t.nip}</span>
                                    </td>
                                    <td style={{ fontSize: "0.8rem" }}>{t.role === "wali-kelas" ? `Wali Kelas ${t.kelas}` : "Guru Mapel"}</td>
                                    <td style={{ textAlign: "center" }}>
                                      {matchedAtt?.waktuHadir ? (
                                        <span style={{ color: matchedAtt.keterlambatan > 0 ? "var(--danger)" : "var(--success)", fontWeight: "bold", fontSize: "0.8rem" }}>
                                          {matchedAtt.waktuHadir} {matchedAtt.keterlambatan > 0 ? `(Terlambat ${matchedAtt.keterlambatan}m)` : ""}
                                        </span>
                                      ) : "-"}
                                    </td>
                                    <td style={{ textAlign: "center" }}>
                                      <div style={{ display: "inline-flex", gap: "0.25rem", backgroundColor: "#f1f5f9", padding: "0.2rem", borderRadius: "4px" }}>
                                        {["HADIR", "TUGAS_LUAR", "ALFA"].map(st => (
                                          <button
                                            key={st}
                                            type="button"
                                            onClick={() => handleTeacherAttendanceBulkSave(t.id, st, matchedAtt?.notes || "", st === "HADIR" ? (matchedAtt?.jp || 2) : 0)}
                                            style={{
                                              padding: "0.25rem 0.5rem",
                                              fontSize: "0.7rem",
                                              border: "none",
                                              cursor: "pointer",
                                              borderRadius: "3px",
                                              fontWeight: "bold",
                                              backgroundColor: currentStatus === st ? (st === "HADIR" ? "#22c55e" : st === "TUGAS_LUAR" ? "#3b82f6" : "#ef4444") : "transparent",
                                              color: currentStatus === st ? "white" : "#64748b"
                                            }}
                                          >
                                            {st === "TUGAS_LUAR" ? "TUGAS" : st}
                                          </button>
                                        ))}
                                      </div>
                                    </td>
                                    <td style={{ textAlign: "center" }}>
                                      {currentStatus === "HADIR" ? (
                                        <select
                                          className="form-select"
                                          value={matchedAtt?.jp ?? 2}
                                          onChange={(e) => handleTeacherAttendanceBulkSave(t.id, "HADIR", matchedAtt?.notes || "", Number(e.target.value))}
                                          style={{ padding: "0.2rem", fontSize: "0.75rem", width: "80px", margin: 0, display: "inline-block" }}
                                        >
                                          {Array.from({ length: 11 }, (_, idx) => (
                                            <option key={idx} value={idx}>{idx} JP</option>
                                          ))}
                                        </select>
                                      ) : (
                                        <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>0 JP</span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>

                       {/* Sisi Kanan: Kelola Beban Jam Mengajar */}
                       <div style={{ backgroundColor: "white", padding: "1.5rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", boxShadow: "var(--shadow-sm)" }}>
                         <h3 style={{ fontWeight: 700, color: "var(--primary-dark)", fontSize: "1.15rem", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                           <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--primary)", flexShrink: 0 }}>
                             <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                             <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                           </svg>
                           Beban Mengajar Guru (Jam per Minggu)
                         </h3>
                         <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "1.5rem" }}>
                           Beban jam mengajar akan digunakan oleh Bendahara Sekolah untuk menghitung honor pokok guru secara bulanan.
                         </p>

                        <div style={{ overflowX: "auto" }}>
                          <table className="table" style={{ width: "100%" }}>
                            <thead>
                              <tr>
                                <th>Nama Guru</th>
                                <th>Mata Pelajaran</th>
                                <th style={{ width: "100px", textAlign: "center" }}>Beban Jam</th>
                              </tr>
                            </thead>
                            <tbody>
                              {teachers.map((t) => (
                                <tr key={t.id}>
                                  <td><strong>{t.name}</strong></td>
                                  <td style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{t.subjects?.join(", ") || "-"}</td>
                                  <td style={{ textAlign: "center" }}>
                                    <input 
                                      type="number"
                                      min="0"
                                      className="form-input"
                                      style={{ width: "70px", padding: "0.25rem", textAlign: "center", margin: 0 }}
                                      defaultValue={t.jamMengajar || 0}
                                      onBlur={(e) => handleUpdateTeacherLoad(t.id, e.target.value)}
                                    />
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              
          {activeTab === "pkl" && <PklTab session={session} isAdmin={true} adminStudents={students} adminTeachers={teachers} />}
          {activeTab === "ukk" && <UkkTab session={session} isAdmin={true} adminStudents={students} adminTeachers={teachers} />}
          {activeTab === "settings" && <SettingsTab session={session} />}
  
        </main>
            </div>
          </div>
        )}
        </div>
      </div>

      {/* AREA CETAK KARTU PESERTA UJIAN */}
      {printableStudents && printableStudents.length > 0 && (
        <div id="exam-card-printable-area" className="exam-card-print-only">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", padding: "1.5rem" }}>
            {printableStudents.map((stud) => {
              if (printType === "attendance") {
                return (
                  <div key={stud.id} style={{ border: "2px dashed #000", padding: "1.25rem", borderRadius: "8px", backgroundColor: "#fff", fontFamily: "'Times New Roman', Times, serif", color: "#000", fontSize: "0.85rem", position: "relative", minHeight: "260px", pageBreakInside: "avoid", breakInside: "avoid" }}>
                    
                    {/* Header Kop Mini */}
                    <div style={{ display: "flex", alignItems: "center", borderBottom: "2px solid #000", paddingBottom: "0.4rem", marginBottom: "0.6rem" }}>
                      {school.logo && (
                        school.logo !== "dY?" ? (
                          <img src={school.logo} alt="Logo" style={{ height: "38px", width: "38px", objectFit: "contain", marginRight: "0.6rem" }} />
                        ) : (
                          <div style={{ fontSize: "1.4rem", marginRight: "0.6rem" }}>{school.logo}</div>
                        )
                      )}
                      <div style={{ flex: 1, textAlign: "center" }}>
                        <h4 style={{ margin: 0, fontSize: "0.7rem", fontWeight: "bold", textTransform: "uppercase" }}>KARTU IDENTITAS ABSENSI</h4>
                        <h5 style={{ margin: 0, fontSize: "0.8rem", fontWeight: "bold", textTransform: "uppercase" }}>{school.nama}</h5>
                        <span style={{ fontSize: "0.58rem", fontStyle: "italic" }}>Tahun Ajaran {school.tahunAjaran}</span>
                      </div>
                    </div>

                    <h3 style={{ textAlign: "center", margin: "0 0 0.75rem 0", fontSize: "0.95rem", fontWeight: "bold", textDecoration: "underline", textTransform: "uppercase" }}>
                      KARTU ABSENSI SISWA
                    </h3>

                    {/* Data Peserta */}
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem", marginBottom: "0.5rem" }}>
                      <tbody>
                        <tr>
                          <td style={{ width: "35%", padding: "3px 0" }}>Nama Lengkap</td>
                          <td style={{ width: "3%" }}>:</td>
                          <td style={{ fontWeight: "bold" }}>{stud.name}</td>
                        </tr>
                        <tr>
                          <td style={{ padding: "3px 0" }}>TTL</td>
                          <td>:</td>
                          <td>{stud.tempatLahir && stud.tanggalLahir ? `${stud.tempatLahir}, ${stud.tanggalLahir}` : stud.tempatLahir || stud.tanggalLahir || "-"}</td>
                        </tr>
                        <tr>
                          <td style={{ padding: "3px 0" }}>NISN</td>
                          <td>:</td>
                          <td style={{ fontWeight: "bold" }}>{stud.nisn}</td>
                        </tr>
                      </tbody>
                    </table>

                    {/* Bagian Bawah: QR Code & TTD */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1rem" }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.2rem" }}>
                        <img 
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=85x85&data=${stud.nisn}`} 
                          alt={`QR NISN ${stud.nisn}`}
                          style={{ width: "75px", height: "75px", border: "1px solid #ccc", padding: "2px", backgroundColor: "#fff" }}
                        />
                        <span style={{ fontSize: "0.55rem", fontWeight: "bold", textTransform: "uppercase" }}>Pindai Absensi</span>
                      </div>

                      <div style={{ textAlign: "center", fontSize: "0.7rem", lineHeight: "1.3" }}>
                        <span>Kepala Sekolah,</span>
                        <br /><br /><br />
                        <strong style={{ textDecoration: "underline" }}>{school.kepsek}</strong>
                        <br />
                        <span>NIP. {school.kepsekNip}</span>
                      </div>
                    </div>

                  </div>
                );
              } else {
                return (
                  <div key={stud.id} style={{ border: "2px dashed #000", padding: "1.25rem", borderRadius: "8px", backgroundColor: "#fff", fontFamily: "'Times New Roman', Times, serif", color: "#000", fontSize: "0.85rem", position: "relative", minHeight: "260px", pageBreakInside: "avoid", breakInside: "avoid" }}>
                    
                    {/* Header Kop Mini */}
                    <div style={{ display: "flex", alignItems: "center", borderBottom: "2px solid #000", paddingBottom: "0.4rem", marginBottom: "0.6rem" }}>
                      {school.logo && (
                        school.logo !== "dY?" ? (
                          <img src={school.logo} alt="Logo" style={{ height: "38px", width: "38px", objectFit: "contain", marginRight: "0.6rem" }} />
                        ) : (
                          <div style={{ fontSize: "1.4rem", marginRight: "0.6rem" }}>{school.logo}</div>
                        )
                      )}
                      <div style={{ flex: 1, textAlign: "center" }}>
                        <h4 style={{ margin: 0, fontSize: "0.7rem", fontWeight: "bold", textTransform: "uppercase" }}>PANITIA UJIAN CBT</h4>
                        <h5 style={{ margin: 0, fontSize: "0.8rem", fontWeight: "bold", textTransform: "uppercase" }}>{school.nama}</h5>
                        <span style={{ fontSize: "0.58rem", fontStyle: "italic" }}>Tahun Ajaran {school.tahunAjaran}</span>
                      </div>
                    </div>

                    <h3 style={{ textAlign: "center", margin: "0 0 0.75rem 0", fontSize: "0.9rem", fontWeight: "bold", textDecoration: "underline", textTransform: "uppercase" }}>
                      KARTU PESERTA UJIAN
                    </h3>

                    {/* Data Peserta */}
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem", marginBottom: "0.5rem" }}>
                      <tbody>
                        <tr>
                          <td style={{ width: "35%", padding: "2px 0" }}>Nama Lengkap</td>
                          <td style={{ width: "3%" }}>:</td>
                          <td style={{ fontWeight: "bold" }}>{stud.name}</td>
                        </tr>
                        <tr>
                          <td style={{ padding: "2px 0" }}>NISN / Kelas</td>
                          <td>:</td>
                          <td>{stud.nisn} / {stud.kelas}</td>
                        </tr>
                        <tr>
                          <td style={{ padding: "2px 0" }}>Username Login</td>
                          <td>:</td>
                          <td><code style={{ fontSize: "0.85rem", fontWeight: "bold", color: "#000" }}>{stud.username}</code></td>
                        </tr>
                        <tr>
                          <td style={{ padding: "2px 0" }}>Password Akun</td>
                          <td>:</td>
                          <td>
                            <code style={{ fontSize: "0.85rem", fontWeight: "bold", color: "#000" }}>{stud.nis}</code>
                            <span style={{ fontSize: "0.55rem", fontStyle: "italic", color: "#666", marginLeft: "0.3rem" }}>*(Sandi Default / NIS)</span>
                          </td>
                        </tr>
                      </tbody>
                    </table>

                    {/* Bagian Bawah: Foto & TTD */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: "1rem" }}>
                      <div style={{ width: "60px", height: "80px", border: "1px dashed #777", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.6rem", color: "#777", fontWeight: "bold" }}>
                        FOTO 2x3
                      </div>
                      <div style={{ textAlign: "center", fontSize: "0.75rem", lineHeight: "1.3" }}>
                        <span>Kepala Sekolah,</span>
                        <br /><br /><br />
                        <strong style={{ textDecoration: "underline" }}>{school.kepsek}</strong>
                        <br />
                        <span>NIP. {school.kepsekNip}</span>
                      </div>
                    </div>

                  </div>
                );
              }
            })}
          </div>
        </div>
      )}
      {/* REKAP ABSENSI SISWA */}
      {activeTab === "rekap-absensi" && (
        <div style={{ display: "flex", flexDirection: "column" }}>

          {/* ── Filter Bar — sejajar kotak Panel Administrasi ── */}
          <div className="card" style={{
            borderRadius: "0.75rem",
            padding: "0.9rem 1.25rem",
            marginBottom: "1.25rem",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            flexWrap: "wrap",
            background: "linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%)",
            borderLeft: "3px solid var(--primary)",
            boxShadow: "0 2px 8px rgba(6,95,70,0.07)"
          }}>
            {/* Ikon & Label */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0 }}>
              <div style={{ background: "rgba(6,95,70,0.1)", borderRadius: "50%", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--primary)" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                </svg>
              </div>
              <span style={{ fontWeight: 800, fontSize: "0.82rem", color: "var(--primary)", whiteSpace: "nowrap" }}>Rekap Absensi</span>
            </div>

            <div style={{ width: "1px", height: "28px", background: "#e2e8f0", flexShrink: 0 }} />

            {/* Select Kelas */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.1rem", minWidth: "130px" }}>
              <label style={{ fontSize: "0.6rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em" }}>Kelas</label>
              <select
                className="form-input"
                style={{ fontSize: "0.82rem", padding: "0.35rem 0.6rem", border: "1.5px solid #e2e8f0", borderRadius: "0.5rem", background: "#fff" }}
                value={rekapKelas}
                onChange={e => setRekapKelas(e.target.value)}
              >
                <option value="">-- Pilih --</option>
                {[...new Set(students.map(s => s.kelas))].sort().map(k => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
            </div>

            {/* Select Bulan */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.1rem", minWidth: "110px" }}>
              <label style={{ fontSize: "0.6rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em" }}>Bulan</label>
              <select
                className="form-input"
                style={{ fontSize: "0.82rem", padding: "0.35rem 0.6rem", border: "1.5px solid #e2e8f0", borderRadius: "0.5rem", background: "#fff" }}
                value={rekapBulan}
                onChange={e => setRekapBulan(e.target.value)}
              >
                {["1","2","3","4","5","6","7","8","9","10","11","12"].map(m => (
                  <option key={m} value={m}>
                    {new Date(2000, parseInt(m)-1, 1).toLocaleString("id-ID", { month: "long" })}
                  </option>
                ))}
              </select>
            </div>

            {/* Select Tahun */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.1rem", minWidth: "80px" }}>
              <label style={{ fontSize: "0.6rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em" }}>Tahun</label>
              <select
                className="form-input"
                style={{ fontSize: "0.82rem", padding: "0.35rem 0.6rem", border: "1.5px solid #e2e8f0", borderRadius: "0.5rem", background: "#fff" }}
                value={rekapTahun}
                onChange={e => setRekapTahun(e.target.value)}
              >
                {["2024","2025","2026","2027"].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            {/* Tombol Tampilkan */}
            <button
              className="btn btn-primary"
              style={{ padding: "0.45rem 1.1rem", fontSize: "0.82rem", alignSelf: "flex-end", whiteSpace: "nowrap", marginTop: "auto" }}
              disabled={!rekapKelas || rekapLoading}
              onClick={async () => {
                if (!rekapKelas) { alert("Pilih kelas terlebih dahulu."); return; }
                setRekapLoading(true);
                const res = await getStudentAttendanceRecap(rekapKelas, rekapBulan, rekapTahun);
                setRekapLoading(false);
                if (res.success) setRekapData(res);
                else alert("Gagal: " + res.error);
              }}
            >
              {rekapLoading ? "⏳..." : "▶ Tampilkan"}
            </button>

            {/* Spacer */}
            <div style={{ flex: 1 }} />

            {/* Info ringkasan + Cetak */}
            {rekapData && (
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  {[
                    { label: "Kelas", val: rekapData.kelas, color: "var(--primary)" },
                    { label: "Periode", val: `${new Date(2000, parseInt(rekapData.bulan)-1, 1).toLocaleString("id-ID", { month: "short" })} ${rekapData.tahun}`, color: "#0284c7" },
                    { label: "Siswa", val: rekapData.recap.length, color: "#7c3aed" },
                    { label: "Hari", val: rekapData.dates.length, color: "#d97706" },
                  ].map(item => (
                    <div key={item.label} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "0.4rem", padding: "0.2rem 0.5rem", textAlign: "center" }}>
                      <div style={{ fontSize: "0.55rem", color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>{item.label}</div>
                      <div style={{ fontSize: "0.78rem", fontWeight: 800, color: item.color }}>{item.val}</div>
                    </div>
                  ))}
                </div>
                <button
                  className="btn btn-outline"
                  style={{ padding: "0.4rem 0.9rem", fontSize: "0.8rem", whiteSpace: "nowrap" }}
                  onClick={() => {
                    const printWin = window.open("", "_blank");
                    const bulanNama = new Date(2000, parseInt(rekapData.bulan)-1, 1).toLocaleString("id-ID", { month: "long" });
                    const rows = rekapData.recap.map((s, i) => {
                      const dailyCells = rekapData.dates.map(d => {
                        const record = s.attMap[d];
                        const st = record ? record.status : "-";
                        const color = st === "HADIR" ? "#16a34a" : st === "IZIN" ? "#2563eb" : st === "SAKIT" ? "#d97706" : st === "-" ? "#aaa" : "#dc2626";
                        const label = st === "HADIR" ? "H" : st === "IZIN" ? "I" : st === "SAKIT" ? "S" : st.startsWith("AL") ? "A" : "-";
                        return `<td style="text-align:center;color:${color};font-weight:bold;">${label}</td>`;
                      }).join("");
                      return `<tr style="background:${i%2===0?"#fff":"#f8fafc"}">
                        <td>${i+1}</td><td>${s.name}</td><td>${s.nis || "-"}</td>
                        ${dailyCells}
                        <td style="text-align:center;color:#16a34a;font-weight:bold;">${s.hadir}</td>
                        <td style="text-align:center;color:#2563eb;font-weight:bold;">${s.izin}</td>
                        <td style="text-align:center;color:#d97706;font-weight:bold;">${s.sakit}</td>
                        <td style="text-align:center;color:#dc2626;font-weight:bold;">${s.alpha}</td>
                        <td style="text-align:center;font-weight:bold;color:${s.totalKeterlambatan > 0 ? '#dc2626' : '#16a34a'}">${s.totalKeterlambatan}m</td>
                      </tr>`;
                    }).join("");
                    const dateHeaders = rekapData.dates.map(d => `<th style="padding:4px 3px;min-width:24px;">${parseInt(d.split("-")[2])}</th>`).join("");
                    printWin.document.write(`<!DOCTYPE html><html><head>
                      <title>Rekap Absensi - Kelas ${rekapData.kelas} - ${bulanNama} ${rekapData.tahun}</title>
                      <style>
                        body { font-family: Arial, sans-serif; font-size: 11px; margin: 10mm; color: #111; }
                        h2 { text-align:center; margin-bottom:2px; font-size:14px; }
                        h3 { text-align:center; margin-top:0; font-size:12px; color:#555; }
                        table { width:100%; border-collapse:collapse; margin-top:8px; }
                        th, td { border:1px solid #ccc; padding:3px 4px; font-size:10px; }
                        th { background:#1e3a5f; color:#fff; text-align:center; }
                        .legend { margin-top:10px; font-size:10px; color:#555; }
                        @media print { @page { size: A4 landscape; margin: 10mm; } body { margin:0; } }
                      </style>
                    </head><body>
                      <h2>REKAP KEHADIRAN SISWA</h2>
                      <h3>Kelas ${rekapData.kelas} &nbsp;|&nbsp; ${bulanNama} ${rekapData.tahun}</h3>
                      <table><thead><tr>
                        <th>No</th><th style="min-width:130px;">Nama Siswa</th><th>NIS</th>
                        ${dateHeaders}
                        <th style="background:#16a34a;">H</th><th style="background:#2563eb;">I</th>
                        <th style="background:#d97706;">S</th><th style="background:#dc2626;">A</th>
                        <th style="background:#475569;font-size:9px;">Terlambat</th>
                      </tr></thead><tbody>${rows}</tbody></table>
                      <div class="legend">Keterangan: H = Hadir &nbsp; I = Izin &nbsp; S = Sakit &nbsp; A = Alpha/Tanpa Keterangan</div>
                    </body></html>`);
                    printWin.document.close();
                    printWin.focus();
                    setTimeout(() => printWin.print(), 500);
                  }}
                >
                  🖨️ Cetak PDF
                </button>
              </div>
            )}
          </div>

          {/* ── Tabel Rekap ── */}
          {!rekapData ? (
            <div className="card" style={{ textAlign: "center", padding: "5rem 1rem", opacity: 0.5 }}>
              <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📅</div>
              <p style={{ fontSize: "0.9rem", margin: 0 }}>Pilih kelas dan periode di atas, lalu klik <strong style={{ color: "var(--primary)" }}>▶ Tampilkan</strong></p>
            </div>
          ) : (
            <>
              {/* Leaderboard Papan Peringkat */}
              {rekapData.leaderboard && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                  <div style={{ background: "linear-gradient(to right, #f0fdf4, #dcfce7)", padding: "1rem", borderRadius: "0.5rem", border: "1px solid #bbf7d0" }}>
                    <h4 style={{ margin: "0 0 0.5rem 0", color: "#166534", fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      ⭐ Siswa Terajin (Top 5)
                    </h4>
                    <p style={{ fontSize: "0.75rem", color: "#15803d", margin: "0 0 0.75rem 0" }}>Berdasarkan rata-rata jam hadir (tanpa terlambat)</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                      {rekapData.leaderboard.topRajin.length === 0 ? (
                        <div style={{ fontSize: "0.8rem", color: "#166534", fontStyle: "italic" }}>Belum ada data...</div>
                      ) : (
                        rekapData.leaderboard.topRajin.map((s, idx) => (
                          <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255,255,255,0.7)", padding: "0.3rem 0.6rem", borderRadius: "0.3rem", fontSize: "0.8rem" }}>
                            <span style={{ fontWeight: 600, color: "#166534" }}>{idx + 1}. {s.name}</span>
                            <span style={{ fontWeight: 700, color: "#15803d" }}>{s.rataRata} <span style={{ fontSize: "0.7rem", fontWeight: "normal" }}>({s.hadir}x)</span></span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                  
                  <div style={{ background: "linear-gradient(to right, #fef2f2, #fee2e2)", padding: "1rem", borderRadius: "0.5rem", border: "1px solid #fecaca" }}>
                    <h4 style={{ margin: "0 0 0.5rem 0", color: "#991b1b", fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      ⚠️ Perlu Perhatian (Top 5 Terlambat)
                    </h4>
                    <p style={{ fontSize: "0.75rem", color: "#b91c1c", margin: "0 0 0.75rem 0" }}>Berdasarkan total akumulasi menit keterlambatan</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                      {rekapData.leaderboard.topTerlambat.length === 0 ? (
                        <div style={{ fontSize: "0.8rem", color: "#991b1b", fontStyle: "italic" }}>Wah, tidak ada yang terlambat! 🎉</div>
                      ) : (
                        rekapData.leaderboard.topTerlambat.map((s, idx) => (
                          <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255,255,255,0.7)", padding: "0.3rem 0.6rem", borderRadius: "0.3rem", fontSize: "0.8rem" }}>
                            <span style={{ fontWeight: 600, color: "#991b1b" }}>{idx + 1}. {s.name}</span>
                            <span style={{ fontWeight: 700, color: "#b91c1c" }}>{s.totalMenit} mnt</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

            <div className="card" style={{ overflowX: "auto", padding: "1.25rem" }}>
              <div style={{ marginBottom: "0.75rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
                <h3 style={{ margin: 0, fontSize: "0.95rem", color: "var(--primary)", fontWeight: 700 }}>
                  Kelas {rekapData.kelas} &mdash; {new Date(2000, parseInt(rekapData.bulan)-1, 1).toLocaleString("id-ID", { month: "long" })} {rekapData.tahun}
                </h3>
              </div>

              {rekapData.dates.length === 0 ? (
                <div style={{ textAlign: "center", padding: "2rem", color: "#888" }}>
                  <div style={{ fontSize: "2rem" }}>📭</div>
                  <p>Belum ada data absensi untuk kelas dan periode ini.</p>
                </div>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.78rem" }}>
                  <thead>
                    <tr style={{ background: "var(--primary)", color: "#fff" }}>
                      <th style={{ padding: "8px 6px", textAlign: "center", position: "sticky", left: 0, background: "var(--primary)", zIndex: 1, width: "30px" }}>No</th>
                      <th style={{ padding: "8px 6px", textAlign: "left", minWidth: "150px", position: "sticky", left: "30px", background: "var(--primary)", zIndex: 1 }}>Nama Siswa</th>
                      {rekapData.dates.map(d => (
                        <th key={d} style={{ padding: "6px 3px", textAlign: "center", minWidth: "28px", fontWeight: 600 }}>
                          {parseInt(d.split("-")[2])}
                        </th>
                      ))}
                      <th style={{ padding: "6px 6px", textAlign: "center", background: "#16a34a", minWidth: "32px" }}>H</th>
                      <th style={{ padding: "6px 6px", textAlign: "center", background: "#2563eb", minWidth: "32px" }}>I</th>
                      <th style={{ padding: "6px 6px", textAlign: "center", background: "#d97706", minWidth: "32px" }}>S</th>
                      <th style={{ padding: "6px 6px", textAlign: "center", background: "#dc2626", minWidth: "32px" }}>A</th>
                      <th style={{ padding: "6px 6px", textAlign: "center", background: "#475569", minWidth: "40px", fontSize: "0.7rem", lineHeight: 1.1 }}>Trlbt<br/>(mnt)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rekapData.recap.map((s, i) => (
                      <tr key={s.id} style={{ background: i % 2 === 0 ? "#fff" : "#f8fafc", borderBottom: "1px solid #e5e7eb" }}>
                        <td style={{ padding: "5px 6px", textAlign: "center", position: "sticky", left: 0, background: i % 2 === 0 ? "#fff" : "#f8fafc", color: "#888", fontSize: "0.72rem" }}>{i + 1}</td>
                        <td style={{ padding: "5px 6px", fontWeight: "500", position: "sticky", left: "30px", background: i % 2 === 0 ? "#fff" : "#f8fafc" }}>{s.name}</td>
                        {rekapData.dates.map(d => {
                          const record = s.attMap[d];
                          const st = record ? record.status : null;
                          const wkt = record ? record.waktuHadir : null;
                          const terlambat = record ? record.keterlambatan : 0;
                          
                          let clr = !st ? "#ddd" : st === "HADIR" ? "#16a34a" : st === "IZIN" ? "#2563eb" : st === "SAKIT" ? "#d97706" : "#dc2626";
                          if (st === "HADIR" && terlambat > 0) clr = "#dc2626"; // Merah jika terlambat
                          
                          const label = !st ? "·" : st === "HADIR" ? "H" : st === "IZIN" ? "I" : st === "SAKIT" ? "S" : "A";
                          const tooltip = st === "HADIR" ? (wkt ? `Hadir: ${wkt}` + (terlambat > 0 ? ` (Terlambat ${terlambat} menit)` : " (Tepat Waktu)") : "Hadir (Tanpa Jam)") : st;
                          
                          return (
                            <td key={d} title={tooltip} style={{ padding: "4px 3px", textAlign: "center", color: clr, fontWeight: st ? "bold" : "normal", cursor: st === "HADIR" ? "help" : "default" }}>
                              {label}
                            </td>
                          );
                        })}
                        <td style={{ padding: "5px 6px", textAlign: "center", color: "#16a34a", fontWeight: "bold" }}>{s.hadir}</td>
                        <td style={{ padding: "5px 6px", textAlign: "center", color: "#2563eb", fontWeight: "bold" }}>{s.izin}</td>
                        <td style={{ padding: "5px 6px", textAlign: "center", color: "#d97706", fontWeight: "bold" }}>{s.sakit}</td>
                        <td style={{ padding: "5px 6px", textAlign: "center", color: "#dc2626", fontWeight: "bold" }}>{s.alpha}</td>
                        <td style={{ padding: "5px 6px", textAlign: "center", fontWeight: "bold", color: s.totalKeterlambatan > 0 ? "#dc2626" : "#16a34a" }}>{s.totalKeterlambatan}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              <div style={{ marginTop: "0.65rem", fontSize: "0.72rem", color: "#aaa" }}>
                <strong style={{color:"#16a34a"}}>H</strong> Hadir &nbsp;·&nbsp; <strong style={{color:"#2563eb"}}>I</strong> Izin &nbsp;·&nbsp; <strong style={{color:"#d97706"}}>S</strong> Sakit &nbsp;·&nbsp; <strong style={{color:"#dc2626"}}>A</strong> Alpha
              </div>
            </div>
            </>
          )}
        </div>
      )}


      {/* MODAL EDIT DATA SISWA */}
      {editingSiswa && (
        <div className="modal-overlay" style={{ display: "flex", zIndex: 1000 }}>
          <div className="modal-content" style={{ maxWidth: "700px", width: "100%", padding: "2rem", borderTop: "4px solid var(--secondary)", position: "relative" }}>
            <button 
              type="button" 
              className="modal-close" 
              onClick={() => setEditingSiswa(null)}
              style={{ position: "absolute", top: "1rem", right: "1rem", background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer", color: "var(--text-muted)" }}
            >
              &times;
            </button>
            
            <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
              <div className="login-icon-box" style={{ backgroundColor: "var(--secondary)", margin: "0 auto 0.75rem auto", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </div>
              <h3 style={{ fontWeight: 800, color: "var(--primary-dark)", margin: 0 }}>Edit Data Siswa</h3>
              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                Perbarui rincian biodata untuk {editingSiswa.name}
              </p>
            </div>

            <form onSubmit={handleEditSiswaSubmit} style={{ maxHeight: "450px", overflowY: "auto", paddingRight: "0.5rem" }}>
              <div className="form-group">
                <label className="form-label">Nama Lengkap Siswa</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={editingSiswa.name}
                  onChange={(e) => setEditingSiswa(prev => ({ ...prev, name: e.target.value }))}
                  required 
                />
              </div>

              <div className="form-group-row" style={{ marginTop: "1rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div className="form-group">
                  <label className="form-label">NIS (Nomor Induk Siswa)</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={editingSiswa.nis}
                    onChange={(e) => setEditingSiswa(prev => ({ ...prev, nis: e.target.value }))}
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">NISN (Nomor Induk Siswa Nasional)</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={editingSiswa.nisn}
                    onChange={(e) => setEditingSiswa(prev => ({ ...prev, nisn: e.target.value }))}
                    required 
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginTop: "1rem" }}>
                <label className="form-label">Jenis Kelamin</label>
                <select 
                  className="form-select"
                  value={editingSiswa.jenisKelamin}
                  onChange={(e) => setEditingSiswa(prev => ({ ...prev, jenisKelamin: e.target.value }))}
                  required
                >
                  <option value="Laki-laki">Laki-laki</option>
                  <option value="Perempuan">Perempuan</option>
                </select>
              </div>
                <div className="form-group" style={{ marginTop: "1rem" }}>
                  <label className="form-label">Status Siswa</label>
                  <select 
                    className="form-select"
                    value={editingSiswa.status || "AKTIF"}
                    onChange={(e) => setEditingSiswa(prev => ({ ...prev, status: e.target.value }))}
                    required
                  >
                    <option value="AKTIF">AKTIF</option>
                    <option value="LULUS">LULUS (ALUMNI)</option>
                    <option value="PINDAH">PINDAH</option>
                    <option value="KELUAR">KELUAR</option>
                  </select>
                </div>

              <div className="form-group-row" style={{ marginTop: "1rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div className="form-group">
                  <label className="form-label">Tempat Lahir</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={editingSiswa.tempatLahir}
                    onChange={(e) => setEditingSiswa(prev => ({ ...prev, tempatLahir: e.target.value }))}
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Tanggal Lahir</label>
                  <input 
                    type="date" 
                    className="form-input" 
                    value={editingSiswa.tanggalLahir}
                    onChange={(e) => setEditingSiswa(prev => ({ ...prev, tanggalLahir: e.target.value }))}
                    required 
                  />
                </div>
              </div>

              <div className="form-group-row" style={{ marginTop: "1rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div className="form-group">
                  <label className="form-label">Nama Orang Tua / Wali</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={editingSiswa.namaOrangTua}
                    onChange={(e) => setEditingSiswa(prev => ({ ...prev, namaOrangTua: e.target.value }))}
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Asal Sekolah</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={editingSiswa.asalSekolah}
                    onChange={(e) => setEditingSiswa(prev => ({ ...prev, asalSekolah: e.target.value }))}
                    required 
                  />
                </div>
              </div>

              <div className="form-group-row" style={{ marginTop: "1rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div className="form-group">
                  <label className="form-label">Nama Ayah</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={editingSiswa.namaAyah}
                    onChange={(e) => setEditingSiswa(prev => ({ ...prev, namaAyah: e.target.value }))}
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Nama Ibu</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={editingSiswa.namaIbu}
                    onChange={(e) => setEditingSiswa(prev => ({ ...prev, namaIbu: e.target.value }))}
                    required 
                  />
                </div>
              </div>

              <div className="form-group-row" style={{ marginTop: "1rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div className="form-group">
                  <label className="form-label">Pekerjaan Ayah</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={editingSiswa.pekerjaanAyah}
                    onChange={(e) => setEditingSiswa(prev => ({ ...prev, pekerjaanAyah: e.target.value }))}
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Pekerjaan Ibu</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={editingSiswa.pekerjaanIbu}
                    onChange={(e) => setEditingSiswa(prev => ({ ...prev, pekerjaanIbu: e.target.value }))}
                    required 
                  />
                </div>
              </div>

              <div className="form-group-row" style={{ marginTop: "1rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div className="form-group">
                  <label className="form-label">Tanggal Masuk Sekolah</label>
                  <input 
                    type="date" 
                    className="form-input" 
                    value={editingSiswa.tanggalMasuk || ""}
                    onChange={(e) => setEditingSiswa(prev => ({ ...prev, tanggalMasuk: e.target.value }))}
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Kelas Tingkat Siswa</label>
                  <select 
                    className="form-select"
                    value={editingSiswa.kelas}
                    onChange={(e) => setEditingSiswa(prev => ({ ...prev, kelas: e.target.value }))}
                    required
                  >
                    <option value="X DKV">X DKV</option>
                    <option value="XI DKV">XI DKV</option>
                    <option value="XII DKV">XII DKV</option>
                  </select>
                </div>
              </div>

              <div className="form-group" style={{ marginTop: "1rem" }}>
                <label className="form-label">Alamat Lengkap Siswa</label>
                <textarea 
                  className="form-textarea" 
                  value={editingSiswa.alamat}
                  onChange={(e) => setEditingSiswa(prev => ({ ...prev, alamat: e.target.value }))}
                  required 
                />
              </div>

              <div className="form-group" style={{ marginTop: "1rem" }}>
                <label className="form-label">Username Login Siswa</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={editingSiswa.username}
                  onChange={(e) => setEditingSiswa(prev => ({ ...prev, username: e.target.value }))}
                  required 
                />
              </div>

              <div className="form-group" style={{ marginTop: "1rem" }}>
                <label className="form-label">Keikutsertaan Ekstrakurikuler Siswa</label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "0.5rem", marginTop: "0.5rem" }}>
                  {extracurriculars.map((e) => {
                    const currentEkskuls = editingSiswa.extracurriculars || [];
                    const isChecked = currentEkskuls.includes(e.name);
                    return (
                      <label key={e.id || e.name} style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.85rem", background: isChecked ? "#f0fdf4" : "#f8fafc", padding: "0.4rem 0.6rem", borderRadius: "6px", border: isChecked ? "1px solid #16a34a" : "1px solid #e2e8f0", cursor: "pointer" }}>
                        <input 
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            const updated = isChecked ? currentEkskuls.filter(x => x !== e.name) : [...currentEkskuls, e.name];
                            setEditingSiswa(prev => ({ ...prev, extracurriculars: updated }));
                          }}
                          style={{ accentColor: "#16a34a", width: "15px", height: "15px" }}
                        />
                        <span style={{ color: isChecked ? "#15803d" : "#334155", fontWeight: isChecked ? "bold" : "normal" }}>{e.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem" }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  Simpan Perubahan
                </button>
                <button 
                  type="button" 
                  className="btn btn-outline" 
                  onClick={() => setEditingSiswa(null)}
                  style={{ flex: 1 }}
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* MODAL EDIT DATA GURU */}
      {editingGuru && (
        <div className="modal-overlay" style={{ display: "flex", zIndex: 1000 }}>
          <div className="modal-content" style={{ maxWidth: "600px", width: "100%", padding: "2rem", borderTop: "4px solid var(--secondary)", position: "relative" }}>
            <button 
              type="button" 
              className="modal-close" 
              onClick={() => setEditingGuru(null)}
              style={{ position: "absolute", top: "1rem", right: "1rem", background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer", color: "var(--text-muted)" }}
            >
              &times;
            </button>
            
            <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
              <div className="login-icon-box" style={{ backgroundColor: "var(--secondary)", margin: "0 auto 0.75rem auto", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </div>
              <h3 style={{ fontWeight: 800, color: "var(--primary-dark)", margin: 0 }}>Edit Data Guru</h3>
              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                Perbarui data akun dan tugas guru {editingGuru.name}
              </p>
            </div>

            <form onSubmit={handleEditGuruSubmit} style={{ maxHeight: "450px", overflowY: "auto", paddingRight: "0.5rem" }}>
              <div className="form-group">
                <label className="form-label">Nama Lengkap Guru</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={editingGuru.name}
                  onChange={(e) => setEditingGuru(prev => ({ ...prev, name: e.target.value }))}
                  required 
                />
              </div>

              <div className="form-group" style={{ marginTop: "1rem" }}>
                <label className="form-label">NIP (Nomor Induk Pegawai)</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={editingGuru.nip}
                  onChange={(e) => setEditingGuru(prev => ({ ...prev, nip: e.target.value }))}
                  required 
                />
              </div>

              <div className="form-group-row" style={{ marginTop: "1rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div className="form-group">
                  <label className="form-label">Jabatan (Tunjangan)</label>
                  <select 
                    className="form-select"
                    value={editingGuru.jabatan || "-"}
                    onChange={(e) => setEditingGuru(prev => ({ ...prev, jabatan: e.target.value }))}
                    required
                  >
                    <option value="-">- Pilih / Guru Biasa -</option>
                    <option value="Kepala Sekolah">Kepala Sekolah</option>
                    <option value="Waka Kurikulum">Waka Kurikulum</option>
                    <option value="Waka Kesiswaan">Waka Kesiswaan</option>
                    <option value="Waka Sarpras">Waka Sarpras</option>
                    <option value="Wali Kelas">Wali Kelas</option>
                    <option value="Bendahara">Bendahara</option>
                    <option value="Operator Sekolah">Operator Sekolah</option>
                    <option value="Ka TU">Ka TU</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Nominal Tunjangan (Rp)</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={editingGuru.tunjangan || 0}
                    onChange={(e) => setEditingGuru(prev => ({ ...prev, tunjangan: Number(e.target.value) }))}
                    required 
                  />
                </div>
              </div>

              <div className="form-group-row" style={{ marginTop: "1rem" }}>
                <div className="form-group">
                  <label className="form-label">Insentif Khusus / Hari (Rp) - <i>Opsional</i></label>
                  <input 
                    type="number" 
                    className="form-input" 
                    placeholder="Kosongkan untuk ikut tarif global" 
                    value={editingGuru.customInsentif || ""}
                    onChange={(e) => setEditingGuru(prev => ({ ...prev, customInsentif: e.target.value ? Number(e.target.value) : "" }))}
                  />
                </div>
              </div>

              <div className="form-group-row" style={{ marginTop: "1rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div className="form-group">
                  <label className="form-label">Peran Tugas</label>
                  <select 
                    className="form-select"
                    value={editingGuru.role}
                    onChange={(e) => setEditingGuru(prev => ({ ...prev, role: e.target.value, kelas: e.target.value === "guru-mapel" ? "" : prev.kelas }))}
                    required
                  >
                    <option value="guru-mapel">Guru Mata Pelajaran</option>
                    <option value="wali-kelas">Wali Kelas</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Wali Kelas Untuk Kelas</label>
                  <select 
                    className="form-select"
                    value={editingGuru.kelas || ""}
                    onChange={(e) => setEditingGuru(prev => ({ ...prev, kelas: e.target.value }))}
                    disabled={editingGuru.role !== "wali-kelas"}
                    required={editingGuru.role === "wali-kelas"}
                  >
                    <option value="">-- Pilih Kelas --</option>
                    <option value="X DKV">X DKV</option>
                    <option value="XI DKV">XI DKV</option>
                    <option value="XII DKV">XII DKV</option>
                  </select>
                </div>
              </div>

              <div className="form-group" style={{ marginTop: "1rem" }}>
                <label className="form-label">Mata Pelajaran yang Diampu (Pilih Minimal Satu)</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", backgroundColor: "var(--bg-alt)", padding: "0.75rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", maxHeight: "150px", overflowY: "auto" }}>
                  {subjects.map((sub) => (
                    <label key={sub.id} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", cursor: "pointer" }}>
                      <input 
                        type="checkbox" 
                        checked={(editingGuru.subjects || []).includes(sub.name)}
                        onChange={(e) => handleEditGuruSubjectCheckboxChange(sub.name, e.target.checked)}
                      />
                      {sub.name}
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-group" style={{ marginTop: "1rem" }}>
                <label className="form-label">Tugas Pembina Ekstrakurikuler (Opsional)</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", backgroundColor: "var(--bg-alt)", padding: "0.75rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", maxHeight: "120px", overflowY: "auto" }}>
                  {extracurriculars.map((ekskul) => (
                    <label key={ekskul.id} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", cursor: "pointer" }}>
                      <input 
                        type="checkbox" 
                        checked={(editingGuru.extracurriculars || []).includes(ekskul.name)}
                        onChange={(e) => handleEditGuruEkskulCheckboxChange(ekskul.name, e.target.checked)}
                      />
                      {ekskul.name}
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-group" style={{ marginTop: "1rem" }}>
                <label className="form-label">Username Login Guru</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={editingGuru.username}
                  onChange={(e) => setEditingGuru(prev => ({ ...prev, username: e.target.value }))}
                  required 
                />
              </div>

              <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem" }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  Simpan Perubahan
                </button>
                <button 
                  type="button" 
                  className="btn btn-outline" 
                  onClick={() => setEditingGuru(null)}
                  style={{ flex: 1 }}
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* 5. MODAL DETAIL SISWA */}
      {selectedSiswaForDetail && (
        <div className="modal-overlay" style={{ display: "flex" }}>
          <div className="modal-content" style={{ maxWidth: "600px", width: "100%", padding: "2rem", borderTop: "4px solid var(--secondary)", position: "relative" }}>
            <button 
              type="button" 
              className="modal-close" 
              onClick={() => setSelectedSiswaForDetail(null)}
              style={{ position: "absolute", top: "1rem", right: "1rem", background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer", color: "var(--text-muted)" }}
            >
              &times;
            </button>
            
            <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
              <div className="login-icon-box" style={{ backgroundColor: "var(--secondary)", margin: "0 auto 0.75rem auto", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
                  <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                  <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" />
                </svg>
              </div>
              <h3 style={{ fontWeight: 800, color: "var(--primary-dark)", margin: 0 }}>Rincian Biodata Siswa</h3>
              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                Tahun Ajaran {selectedSiswaForDetail.tahunAjaran || school.tahunAjaran} - Semester {selectedSiswaForDetail.semester || school.semester}
              </p>
            </div>

            <div style={{ maxHeight: "400px", overflowY: "auto", paddingRight: "0.5rem" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }} className="portal-table">
                <tbody>
                  <tr>
                    <td style={{ fontWeight: 600, width: "35%", padding: "0.5rem 0" }}>Nama Lengkap</td>
                    <td style={{ padding: "0.5rem 0" }}>{selectedSiswaForDetail.name}</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600, padding: "0.5rem 0" }}>NIS</td>
                    <td style={{ padding: "0.5rem 0" }}>{selectedSiswaForDetail.nis}</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600, padding: "0.5rem 0" }}>NISN</td>
                    <td style={{ padding: "0.5rem 0" }}>{selectedSiswaForDetail.nisn}</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600, padding: "0.5rem 0" }}>Jenis Kelamin</td>
                    <td style={{ padding: "0.5rem 0" }}>{selectedSiswaForDetail.jenisKelamin || "-"}</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600, padding: "0.5rem 0" }}>Kelas</td>
                    <td style={{ padding: "0.5rem 0" }}><span className="badge-info" style={{ backgroundColor: "var(--secondary)", color: "white" }}>{selectedSiswaForDetail.kelas}</span></td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600, padding: "0.5rem 0" }}>Tempat, Tgl Lahir</td>
                    <td style={{ padding: "0.5rem 0" }}>{selectedSiswaForDetail.tempatLahir}, {selectedSiswaForDetail.tanggalLahir}</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600, padding: "0.5rem 0" }}>Asal Sekolah</td>
                    <td style={{ padding: "0.5rem 0" }}>{selectedSiswaForDetail.asalSekolah || "-"}</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600, padding: "0.5rem 0" }}>Alamat Lengkap</td>
                    <td style={{ padding: "0.5rem 0" }}>{selectedSiswaForDetail.alamat}</td>
                  </tr>
                  <tr style={{ borderTop: "2px solid var(--border-color)" }}>
                    <td style={{ fontWeight: 600, padding: "0.5rem 0", color: "var(--primary-dark)" }}>Nama Orang Tua / Wali</td>
                    <td style={{ padding: "0.5rem 0", fontWeight: "bold" }}>{selectedSiswaForDetail.namaOrangTua || "-"}</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600, padding: "0.5rem 0" }}>Nama Ayah</td>
                    <td style={{ padding: "0.5rem 0" }}>{selectedSiswaForDetail.namaAyah || "-"}</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600, padding: "0.5rem 0" }}>Pekerjaan Ayah</td>
                    <td style={{ padding: "0.5rem 0" }}>{selectedSiswaForDetail.pekerjaanAyah || "-"}</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600, padding: "0.5rem 0" }}>Nama Ibu</td>
                    <td style={{ padding: "0.5rem 0" }}>{selectedSiswaForDetail.namaIbu || "-"}</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600, padding: "0.5rem 0" }}>Pekerjaan Ibu</td>
                    <td style={{ padding: "0.5rem 0" }}>{selectedSiswaForDetail.pekerjaanIbu || "-"}</td>
                  </tr>
                  <tr style={{ borderTop: "2px solid var(--border-color)" }}>
                    <td style={{ fontWeight: 600, padding: "0.5rem 0" }}>Username Login</td>
                    <td style={{ padding: "0.5rem 0" }}><code>{selectedSiswaForDetail.username}</code></td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600, padding: "0.5rem 0" }}>Tanggal Masuk</td>
                    <td style={{ padding: "0.5rem 0" }}>{selectedSiswaForDetail.tanggalMasuk || "-"}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <button 
              type="button" 
              className="btn btn-outline" 
              onClick={() => setSelectedSiswaForDetail(null)}
              style={{ width: "100%", marginTop: "1.5rem" }}
            >
              Tutup Rincian
            </button>
          </div>
        </div>
      )}
    </>
  );
}




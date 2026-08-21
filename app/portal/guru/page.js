"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import PenugasanTab from "./PenugasanTab";
import PklTab from "./PklTab";
import UkkTab from "./UkkTab";
import SettingsTab from "./SettingsTab";
import PengawasTab from "./PengawasTab";
import DigitalLibraryViewer from "../../components/DigitalLibraryViewer";
import { loginAction, logoutAction } from "../../actions/auth";
import * as XLSX from "xlsx";
import { QRCodeSVG } from 'qrcode.react';
import { 
  getTeacherDashboard, 
  saveTeacherKkmAndCp, 
  addQuestion, 
  deleteQuestion, 
  updateQuestion,
  uploadQuestionImage,
  saveStudentGrade,
  saveStudentEkskulGrade,
  saveStudentRaporRecord,
  getExamSubmissions,
  overrideExamScore,
  uploadExamAttachment,
  getExamAttachment,
  saveEssayScore,
  uploadTeacherFoto,
  saveBulkStudentGrades,
  saveTeachingJournal,
  getTeachingJournals,
  deleteTeachingJournal,
  gradePortfolio,
  getJournalGradesAverage,
  getTeachingJournalRecap,
  saveEkskulSession,
  getEkskulSessions,
  deleteEkskulSession,
  getEkskulFullRecap,
  updateStudentExtracurriculars
} from "../../actions/guru";
import { checkInTeacher, getTreasurerReport, updateFinancialRates, getTeacherAttendanceRecap } from "../../actions/absensi";
import {
  getFeeMasters,
  saveFeeMaster,
  deleteFeeMaster,
  recordStudentPayment,
  getStudentPayments,
  deleteStudentPayment,
  recordBosDisbursement,
  getBosDisbursements,
  deleteBosDisbursement,
  recordExpense,
  getExpenses,
  deleteExpense,
  recordTeacherPayroll,
  getBendaharaDashboardData
} from "../../actions/bendahara";
import {
  getSchoolLetters,
  createSchoolLetter,
  deleteSchoolLetter,
  getLibraryData,
  saveLibraryBook,
  deleteLibraryBook,
  borrowBook,
  returnBook,
  getInventoryItems,
  saveInventoryItem,
  deleteInventoryItem
} from "../../actions/tu";
import { getMajors, saveMajor, deleteMajor, updateTeacherCustomInsentif } from "../../actions/admin";
import { uploadKtsp, getKtspList, deleteKtsp } from "../../actions/ktsp";
import { createSppd, getSppdByTeacher, deleteSppd } from "../../actions/sppd";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "20px", background: "#fef2f2", border: "1px solid #ef4444", borderRadius: "8px", margin: "20px" }}>
          <h2 style={{ color: "#b91c1c", marginTop: 0 }}>Telah Terjadi Error (Crash) di Lembar Ini</h2>
          <p>Tolong screenshot kotak merah ini dengan jelas dan kirimkan ke developer agar bisa langsung diperbaiki:</p>
          <pre style={{ background: "#fff", padding: "10px", overflowX: "auto", fontSize: "13px", border: "1px solid #fca5a5", whiteSpace: "pre-wrap" }}>
            {this.state.error && this.state.error.toString()}
          </pre>
          <pre style={{ background: "#fff", padding: "10px", overflowX: "auto", fontSize: "12px", border: "1px solid #fca5a5", marginTop: "10px", color: "#666" }}>
            {this.state.errorInfo && this.state.errorInfo.componentStack}
          </pre>
          <button onClick={() => this.setState({ hasError: false })} style={{ marginTop: "15px", padding: "8px 16px", background: "#ef4444", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }}>Coba Render Ulang</button>
        </div>
      );
    }
    return this.props.children;
  }
}

function getStudentActiveSemester(kelas, schoolSemester) {
  const normKelas = (kelas || "").trim().toLowerCase();
  let level = 10; // Default SMK: kelas X

  // Deteksi XII dulu sebelum XI, dan XI sebelum X
  if (
    normKelas.startsWith("xii") ||
    normKelas.includes("kelas xii") || normKelas.includes("kelas 12") ||
    normKelas.startsWith("12")
  ) {
    level = 12;
  } else if (
    normKelas.startsWith("xi ") || normKelas === "xi" ||
    normKelas.includes("kelas xi") || normKelas.includes("kelas 11") ||
    normKelas.startsWith("11")
  ) {
    level = 11;
  } else if (
    normKelas.startsWith("x ") || normKelas === "x" ||
    normKelas.includes("kelas x") || normKelas.includes("kelas 10") ||
    normKelas.startsWith("10")
  ) {
    level = 10;
  }

  const isGanjil = (schoolSemester || "Ganjil").toLowerCase().trim() === "ganjil";

  // SMK: X=sem1-2, XI=sem3-4, XII=sem5-6
  if (level === 10) return isGanjil ? "1" : "2";
  if (level === 11) return isGanjil ? "3" : "4";
  return isGanjil ? "5" : "6"; // level 12
}

function getKelasLevel(kelas) {
  const norm = (kelas || "").trim().toLowerCase();
  if (norm.startsWith("xii") || norm.includes("kelas xii") || norm.includes("kelas 12") || norm.startsWith("12")) return 12;
  if ((norm.startsWith("xi ") || norm === "xi") || norm.includes("kelas xi") || norm.includes("kelas 11") || norm.startsWith("11")) return 11;
  return 10; // default X
}

function getTahunAjaranForSemester(currentKelas, schoolTahunAjaran, targetSemester) {
  const parts = (schoolTahunAjaran || "").split("/");
  const currentStartYear = parseInt(parts[0], 10) || 2026;

  const currentLevel = getKelasLevel(currentKelas);

  const targetSemNum = parseInt(targetSemester, 10) || 1;
  // SMK: sem1-2=X(10), sem3-4=XI(11), sem5-6=XII(12)
  let targetLevel = 10;
  if (targetSemNum === 3 || targetSemNum === 4) targetLevel = 11;
  else if (targetSemNum === 5 || targetSemNum === 6) targetLevel = 12;

  const yearDiff = currentLevel - targetLevel;
  const targetStartYear = currentStartYear - yearDiff;
  const targetEndYear = targetStartYear + 1;

  return `${targetStartYear}/${targetEndYear}`;
}

function getTanggalCetakForSemester(currentKelas, schoolTahunAjaran, targetSemester, defaultTanggalCetak) {
  const parts = (schoolTahunAjaran || "").split("/");
  const currentStartYear = parseInt(parts[0], 10) || 2026;

  const currentLevel = getKelasLevel(currentKelas);

  const targetSemNum = parseInt(targetSemester, 10) || 1;
  let targetLevel = 10;
  if (targetSemNum === 3 || targetSemNum === 4) targetLevel = 11;
  else if (targetSemNum === 5 || targetSemNum === 6) targetLevel = 12;

  const yearDiff = currentLevel - targetLevel;
  const targetStartYear = currentStartYear - yearDiff;

  const isOdd = targetSemNum % 2 !== 0;
  if (isOdd) {
    return `20 Desember ${targetStartYear}`;
  } else {
    return `20 Juni ${targetStartYear + 1}`;
  }
}

function getKelasForSemester(currentKelas, targetSemester) {
  const norm = (currentKelas || "").trim().toUpperCase();
  let prefix = norm;
  let suffix = "";

  if (norm.includes("-")) {
    const parts = norm.split("-");
    prefix = parts[0].trim();
    suffix = parts.slice(1).join("-");
  } else if (norm.includes(" ")) {
    const parts = norm.split(" ");
    prefix = parts[0].trim();
    suffix = parts.slice(1).join(" ");
  } else {
    // Cek XII dulu sebelum XI dan X
    if (norm.startsWith("XII")) { prefix = "XII"; suffix = norm.slice(3); }
    else if (norm.startsWith("XI")) { prefix = "XI"; suffix = norm.slice(2); }
    else if (norm.startsWith("X")) { prefix = "X"; suffix = norm.slice(1); }
  }

  const targetSemNum = parseInt(targetSemester, 10) || 1;
  let levelRomawi = "X";
  if (targetSemNum === 3 || targetSemNum === 4) levelRomawi = "XI";
  else if (targetSemNum === 5 || targetSemNum === 6) levelRomawi = "XII";

  if (!suffix) return levelRomawi;
  return `${levelRomawi}-${suffix}`;
}



// Helper untuk mengecek mode akses ujian
const checkIsOnline = (modeStr, kelasRaw, fallback) => {
  if (!modeStr) return fallback === "online";
  let kelasPrefix = "X";
  if (kelasRaw && typeof kelasRaw === "string") {
    if (kelasRaw.startsWith("XII")) kelasPrefix = "XII";
    else if (kelasRaw.startsWith("XI")) kelasPrefix = "XI";
  }
  try {
    if (modeStr.startsWith("{")) {
      const parsed = JSON.parse(modeStr);
      return parsed[kelasPrefix] === "online";
    }
    return modeStr === "online";
  } catch(e) {
    return fallback === "online";
  }
};

export default function PortalGuru() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // Folder States untuk Bank Soal
  const [folderKelas, setFolderKelas] = useState(null);
  const [folderSemester, setFolderSemester] = useState(null);
  const [folderKategori, setFolderKategori] = useState(null);

  // Form login
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginRole, setLoginRole] = useState("guru-mapel");
  const [loginError, setLoginError] = useState("");

  // Dashboard Data
  const [school, setSchool] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [activeSubject, setActiveSubject] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [extracurriculars, setExtracurriculars] = useState([]);

  // UI State
  const [activeTab, setActiveTab] = useState("beranda");

  // Form States
  // 1. Grade Form
  const [filterClass, setFilterClass] = useState("");
  const [selectedStudentNisn, setSelectedStudentNisn] = useState("");
  const [tugas1, setTugas1] = useState(0);
  const [tugas2, setTugas2] = useState(0);
  const [uts, setUts] = useState("");
  const [uas, setUas] = useState("");
  const [paj, setPaj] = useState("");
  const [portofolio, setPortofolio] = useState(0);
  const [selectedSemester, setSelectedSemester] = useState("1");
  const [gradeMessage, setGradeMessage] = useState("");

  // 1.a Portofolio Grading Form
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [selectedPortfolioForGrade, setSelectedPortfolioForGrade] = useState(null);
  const [gradeForm, setGradeForm] = useState({
    kreativitas: 0,
    teknik: 0,
    kesesuaian: 0,
    catatan: "",
    subjectName: "",
    semester: "1"
  });
  const [gradePortfolioMessage, setGradePortfolioMessage] = useState("");

  // 1.b Ekskul Form
  const [selectedEkskulStudentNisn, setSelectedEkskulStudentNisn] = useState("");
  const [selectedEkskulName, setSelectedEkskulName] = useState("");
  const [ekskulNilai, setEkskulNilai] = useState("A");
  const [ekskulDeskripsi, setEkskulDeskripsi] = useState("");
  const [ekskulMessage, setEkskulMessage] = useState("");
  // Ekskul Absensi States
  const [ekskulSessions, setEkskulSessions] = useState([]);
  const [ekskulSessionDate, setEkskulSessionDate] = useState(new Date().toISOString().substring(0, 10));
  const [ekskulSessionKet, setEkskulSessionKet] = useState("");
  const [ekskulAttMap, setEkskulAttMap] = useState({}); // { nisn: "HADIR"|"TIDAK_HADIR"|"IZIN"|"SAKIT" }
  const [ekskulSessionLoading, setEkskulSessionLoading] = useState(false);
  const [ekskulSessionMsg, setEkskulSessionMsg] = useState("");
  // Ekskul Rekap States
  const [ekskulRekapData, setEkskulRekapData] = useState(null);
  const [ekskulRekapBulan, setEkskulRekapBulan] = useState(String(new Date().getMonth() + 1));
  const [ekskulRekapTahun, setEkskulRekapTahun] = useState(String(new Date().getFullYear()));
  const [ekskulRekapLoading, setEkskulRekapLoading] = useState(false);
  // Ekskul Member Management States (Opsi 3)
  const [manageEkskulStudentNisn, setManageEkskulStudentNisn] = useState("");
  const [manageStudentEkskuls, setManageStudentEkskuls] = useState([]);
  const [manageEkskulMsg, setManageEkskulMsg] = useState("");
  const [manageEkskulLoading, setManageEkskulLoading] = useState(false);

  // 1.c Catatan & Absensi Form
  const [selectedCatatanStudentNisn, setSelectedCatatanStudentNisn] = useState("");
  const [catatanWali, setCatatanWali] = useState("");
  const [sakit, setSakit] = useState(0);
  const [izin, setIzin] = useState(0);
  const [alfa, setAlfa] = useState(0);
  const [naikKelas, setNaikKelas] = useState(""); // "", "true", "false"
  const [catatanMessage, setCatatanMessage] = useState("");
 
  // Jurnal Mengajar States
  const [jurnalList, setJurnalList] = useState([]);
  const [jurnalMessage, setJurnalMessage] = useState("");
  const [isJurnalModalOpen, setIsJurnalModalOpen] = useState(false);
  // Rekap Jurnal States
  const [jurnalRekapData, setJurnalRekapData] = useState(null);
  const [jurnalRekapBulan, setJurnalRekapBulan] = useState(String(new Date().getMonth() + 1));
  const [jurnalRekapTahun, setJurnalRekapTahun] = useState(String(new Date().getFullYear()));
  const [jurnalRekapLoading, setJurnalRekapLoading] = useState(false);
  const [editingJournalId, setEditingJournalId] = useState(null);
  const [journalDate, setJournalDate] = useState(new Date().toISOString().substring(0, 10));
  const [journalKelas, setJournalKelas] = useState("");
  const [journalJamKe, setJournalJamKe] = useState("1-2");
  const [journalMateri, setJournalMateri] = useState("");
  const [journalTujuan, setJournalTujuan] = useState("");
  const [journalAktivitas, setJournalAktivitas] = useState("");
  const [journalKarakter, setJournalKarakter] = useState("");
  const [journalAttendances, setJournalAttendances] = useState({});
  const [journalGrades, setJournalGrades] = useState({});

  // 2. KKM & CP Form
  const [kkm, setKkm] = useState(75);
  const [cpA, setCpA] = useState("");
  const [cpB, setCpB] = useState("");
  const [cpC, setCpC] = useState("");
  const [cpD, setCpD] = useState("");
  const [selectedSemesterCP, setSelectedSemesterCP] = useState("1");

  useEffect(() => {
    if (activeSubject) {
      const semesterCp = activeSubject.cps?.[selectedSemesterCP];
      setCpA(semesterCp?.cpA || activeSubject.cpA || "");
      setCpB(semesterCp?.cpB || activeSubject.cpB || "");
      setCpC(semesterCp?.cpC || activeSubject.cpC || "");
      setCpD(semesterCp?.cpD || activeSubject.cpD || "");
    }
  }, [activeSubject, selectedSemesterCP]);

  const [kkmMessage, setKkmMessage] = useState("");

  // 3. Question Form
  const [newQuestion, setNewQuestion] = useState("");
  const [questionImage, setQuestionImage] = useState("");
  const [choiceA, setChoiceA] = useState("");
  const [choiceAImage, setChoiceAImage] = useState("");
  const [choiceB, setChoiceB] = useState("");
  const [choiceBImage, setChoiceBImage] = useState("");
  const [choiceC, setChoiceC] = useState("");
  const [choiceCImage, setChoiceCImage] = useState("");
  const [choiceD, setChoiceD] = useState("");
  const [choiceDImage, setChoiceDImage] = useState("");
  const [correct, setCorrect] = useState(0);
  const [soalType, setSoalType] = useState("PG"); // PG, PGK, MENJODOHKAN, ISIAN, ESSAY
  const [soalCategory, setSoalCategory] = useState("UTS"); // UTS, UAS, PAJ
  const [soalSemester, setSoalSemester] = useState("1"); // 1 s.d. 6
  const [soalKelas, setSoalKelas] = useState("X"); // X, XI, XII
  const [correctChoices, setCorrectChoices] = useState([]); // array indeks benar untuk PGK
  const [correctAnswer, setCorrectAnswer] = useState(""); // jawaban singkat isian
  const [matchLeft1, setMatchLeft1] = useState("");
  const [matchLeft1Image, setMatchLeft1Image] = useState("");
  const [matchRight1, setMatchRight1] = useState("");
  const [matchRight1Image, setMatchRight1Image] = useState("");
  const [matchLeft2, setMatchLeft2] = useState("");
  const [matchLeft2Image, setMatchLeft2Image] = useState("");
  const [matchRight2, setMatchRight2] = useState("");
  const [matchRight2Image, setMatchRight2Image] = useState("");
  const [matchLeft3, setMatchLeft3] = useState("");
  const [matchLeft3Image, setMatchLeft3Image] = useState("");
  const [matchRight3, setMatchRight3] = useState("");
  const [matchRight3Image, setMatchRight3Image] = useState("");
  const [matchLeft4, setMatchLeft4] = useState("");
  const [matchLeft4Image, setMatchLeft4Image] = useState("");
  const [matchRight4, setMatchRight4] = useState("");
  const [matchRight4Image, setMatchRight4Image] = useState("");
  const [matchLeft5, setMatchLeft5] = useState("");
  const [matchLeft5Image, setMatchLeft5Image] = useState("");
  const [matchRight5, setMatchRight5] = useState("");
  const [matchRight5Image, setMatchRight5Image] = useState("");
  const [soalMessage, setSoalMessage] = useState("");
  const [editingQuestionId, setEditingQuestionId] = useState(null);
  const [previewQuestion, setPreviewQuestion] = useState(null);
  const [previewAnswers, setPreviewAnswers] = useState({});
  const [examAttachment, setExamAttachment] = useState(null);
  const [uploadFile, setUploadFile] = useState(null);

  // 3.b Hasil Ujian Tab
  const [submissions, setSubmissions] = useState([]);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [hasilCategory, setHasilCategory] = useState("UTS");
  const [hasilSemester, setHasilSemester] = useState("1");
  const [overrideScoreInput, setOverrideScoreInput] = useState("");

  // 4. Rapor Preview
  const [raporStudentNisn, setRaporStudentNisn] = useState("");
  const [showWatermarkPreview, setShowWatermarkPreview] = useState(false);
  const [raporSemester, setRaporSemester] = useState("");
  const [viewMode, setViewMode] = useState("rapor");

  // SPPD State
  const [sppdList, setSppdList] = useState([]);
  const [sppdLoading, setSppdLoading] = useState(false);
  const [sppdForm, setSppdForm] = useState({ keperluan: "", tujuan: "", tanggalBerangkat: "", tanggalKembali: "", transportasi: "Kendaraan Pribadi" });
  const [showSppdForm, setShowSppdForm] = useState(false);

  // State Soal Grup (Stimulus Bacaan / Gambar Acuan)
  const [isGroupQuestion, setIsGroupQuestion] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState(""); // "" berarti "Buat Baru"
  const [newGroupText, setNewGroupText] = useState("");
  const [newGroupImagePath, setNewGroupImagePath] = useState("");

  // State & Handler Foto Profil
  const [uploadingFoto, setUploadingFoto] = useState(false);
  const [fotoMessage, setFotoMessage] = useState("");

  // State Absensi Guru & Bendahara
  const [absenLoading, setAbsenLoading] = useState(false);
  const [absenSuccess, setAbsenSuccess] = useState(false);
  const [absenMessage, setAbsenMessage] = useState("");
  const [checkInJp, setCheckInJp] = useState(2);
  const [treasurerMonth, setTreasurerMonth] = useState(String(new Date().getMonth() + 1)); 
  const [treasurerYear, setTreasurerYear] = useState(String(new Date().getFullYear()));
  const [treasurerReport, setTreasurerReport] = useState([]);
  const [treasurerMessage, setTreasurerMessage] = useState("");
  const [loadingReport, setLoadingReport] = useState(false);
  const [rateHonorPokok, setRateHonorPokok] = useState(25000);
  const [rateTransport, setRateTransport] = useState(50000);
  const [rateInsentif, setRateInsentif] = useState(15000);
  const [isSavingRates, setIsSavingRates] = useState(false);

  // State Modul Bendahara Komprehensif (Multi-Kas: SPP, BOS, Pengeluaran & Payroll)
  const [bendaharaSubTab, setBendaharaSubTab] = useState("kasir"); // "kasir", "bos", "pengeluaran", "payroll", "bku", "tarif"
  const [bendaharaData, setBendaharaData] = useState(null);
  const [bendaharaLoading, setBendaharaLoading] = useState(false);

  // State Payment Form
  const [payStudentNisn, setPayStudentNisn] = useState("");
  const [payFeeName, setPayFeeName] = useState("SPP Bulanan");
  const [payBulan, setPayBulan] = useState(String(new Date().getMonth() + 1));
  const [payTahun, setPayTahun] = useState(String(new Date().getFullYear()));
  const [payAmount, setPayAmount] = useState(150000);
  const [payPaidAmount, setPayPaidAmount] = useState(150000);
  const [payMsg, setPayMsg] = useState("");
  const [payLoading, setPayLoading] = useState(false);

  // State BOS Form
  const [bosTahap, setBosTahap] = useState("Tahap I");
  const [bosTahun, setBosTahun] = useState(String(new Date().getFullYear()));
  const [bosAmount, setBosAmount] = useState("");
  const [bosDate, setBosDate] = useState(new Date().toISOString().substring(0, 10));
  const [bosKet, setBosKet] = useState("");
  const [bosMsg, setBosMsg] = useState("");
  const [bosLoading, setBosLoading] = useState(false);

  // State Expense Form
  const [expSource, setExpSource] = useState("KAS_SWADAYA");
  const [expCategory, setExpCategory] = useState("ATK");
  const [expTitle, setExpTitle] = useState("");
  const [expAmount, setExpAmount] = useState("");
  const [expDate, setExpDate] = useState(new Date().toISOString().substring(0, 10));
  const [expReceiptNo, setExpReceiptNo] = useState("");
  const [expProofImage, setExpProofImage] = useState("");
  const [expMsg, setExpMsg] = useState("");
  const [expLoading, setExpLoading] = useState(false);

  // State Fee Master Form
  const [feeNameInput, setFeeNameInput] = useState("");
  const [feeNominalInput, setFeeNominalInput] = useState("");
  const [feeTipeInput, setFeeTipeInput] = useState("BULANAN");
  const [feeMsg, setFeeMsg] = useState("");
  const [feeLoading, setFeeLoading] = useState(false);

  // State Rekap Absensi Guru (Bendahara)
  const [bendaharaAbsenGuruBulan, setBendaharaAbsenGuruBulan] = useState(String(new Date().getMonth() + 1));
  const [bendaharaAbsenGuruTahun, setBendaharaAbsenGuruTahun] = useState(String(new Date().getFullYear()));
  const [bendaharaAbsenGuruData, setBendaharaAbsenGuruData] = useState(null);
  const [bendaharaAbsenGuruLoading, setBendaharaAbsenGuruLoading] = useState(false);

  // State Modul Tata Usaha (TU), Perpustakaan, & Sarpras
  const [tuSubTab, setTuSubTab] = useState("letter"); // "letter", "perpus", "sarpras"
  const [tuLetters, setTuLetters] = useState([]);
  const [tuLetterMsg, setTuLetterMsg] = useState("");
  const [tuLetterLoading, setTuLetterLoading] = useState(false);
  const [letType, setLetType] = useState("SURAT_KETERANGAN_SISWA");
  const [letStudentNisn, setLetStudentNisn] = useState("");
  const [letTitle, setLetTitle] = useState("Surat Keterangan Siswa Aktif");
  const [letRecipient, setLetRecipient] = useState("");
  const [letSender, setLetSender] = useState("Kepala Sekolah Master Demo");
  const [letDate, setLetDate] = useState(new Date().toISOString().substring(0, 10));
  const [letKet, setLetKet] = useState("");

  // Perpus State
  const [libBooks, setLibBooks] = useState([]);
  const [libLoans, setLibLoans] = useState([]);
  const [libMsg, setLibMsg] = useState("");
  const [libLoading, setLibLoading] = useState(false);
  const [bookTitle, setBookTitle] = useState("");
  const [bookAuthor, setBookAuthor] = useState("");
  const [bookPublisher, setBookPublisher] = useState("");
  const [bookCategory, setBookCategory] = useState("Pelajaran");
  const [bookStock, setBookStock] = useState(5);
  const [bookLocation, setBookLocation] = useState("Rak A1");
  // Borrow State
  const [borrowBookId, setBorrowBookId] = useState("");
  const [borrowStudentNisn, setBorrowStudentNisn] = useState("");
  const [borrowDueDate, setBorrowDueDate] = useState(new Date(Date.now() + 7 * 86400000).toISOString().substring(0, 10));

  // Sarpras State
  const [invItems, setInvItems] = useState([]);
  const [invMsg, setInvMsg] = useState("");
  const [invLoading, setInvLoading] = useState(false);

  // Waka Kurikulum State (KTSP)
  const [ktspDocs, setKtspDocs] = useState([]);
  const [ktspLoading, setKtspLoading] = useState(false);
  const [wakaKurikulumMessage, setWakaKurikulumMessage] = useState("");
  
  // Waka Kesiswaan State
  const [wakaKesiswaanMessage, setWakaKesiswaanMessage] = useState("");
  const [invName, setInvName] = useState("");
  const [invCategory, setInvCategory] = useState("Elektronik");
  const [invLocation, setInvLocation] = useState("Ruang Lab Komputer");
  const [invQty, setInvQty] = useState(1);
  const [invCondition, setInvCondition] = useState("BAIK");
  const [invYear, setInvYear] = useState("2026");
  const [invKet, setInvKet] = useState("");

  // Master Jurusan SMK State
  const [majorsList, setMajorsList] = useState([]);
  const [majorCodeInput, setMajorCodeInput] = useState("");
  const [majorNameInput, setMajorNameInput] = useState("");
  const [majorUnitInput, setMajorUnitInput] = useState("SMK");
  const [majorMsg, setMajorMsg] = useState("");
  const [majorLoading, setMajorLoading] = useState(false);

  const loadMajorsData = async () => {
    setMajorLoading(true);
    const res = await getMajors();
    setMajorLoading(false);
    if (res.success) {
      setMajorsList(res.majors || []);
    }
  };

  const loadTuData = async () => {
    const res = await getSchoolLetters();
    if (res.success) setTuLetters(res.letters);
  };

  const loadLibraryData = async () => {
    const res = await getLibraryData();
    if (res.success) {
      setLibBooks(res.books);
      setLibLoans(res.loans);
    }
  };

  const loadInventoryData = async () => {
    const res = await getInventoryItems();
    if (res.success) setInvItems(res.items);
  };

  // KTSP Functions
  const loadKtspData = async () => {
    setKtspLoading(true);
    const docs = await getKtspList();
    setKtspDocs(docs || []);
    setKtspLoading(false);
  };

  const handleUploadKtsp = async (e) => {
    e.preventDefault();
    setKtspLoading(true);
    setWakaKurikulumMessage("");
    
    const formData = new FormData(e.target);
    const data = {
      title: formData.get("title"),
      tahunAjaran: formData.get("tahunAjaran"),
      fileUrl: formData.get("fileUrl"),
      keterangan: formData.get("keterangan"),
    };
    
    const res = await uploadKtsp(data);
    if (res.success) {
      setWakaKurikulumMessage("Dokumen KTSP berhasil diunggah.");
      e.target.reset();
      loadKtspData();
    } else {
      setWakaKurikulumMessage("Error: " + (res.error || "Gagal mengunggah dokumen"));
    }
    setKtspLoading(false);
  };

  const handleDeleteKtsp = async (id) => {
    if (!confirm("Apakah Anda yakin ingin menghapus dokumen KTSP ini?")) return;
    setKtspLoading(true);
    const res = await deleteKtsp(id);
    if (res.success) {
      setWakaKurikulumMessage("Dokumen berhasil dihapus.");
      loadKtspData();
    } else {
      setWakaKurikulumMessage("Error: " + (res.error || "Gagal menghapus dokumen"));
    }
    setKtspLoading(false);
  };

  const fetchDashboard = async () => {
    setLoading(true);
    const res = await getTeacherDashboard();
    if (res.success) {
      setSession(res.teacher);
      setSchool(res.school);
      setSubjects(res.subjects || []);
      setQuestions(res.questions);
      setStudents(res.students);
      setTeachers(res.teachers);
      setExtracurriculars(res.extracurriculars || []);

      // Seed KKM & CP Form values
      if (res.subjects && res.subjects.length > 0 && res.teacher.subjects) {
        const allowed = res.subjects.filter(s => res.teacher.subjects.includes(s.name));
        if (allowed.length > 0) {
          const defaultSub = allowed[0];
          setActiveSubject(defaultSub);
          setKkm(defaultSub.kkm);
        }
      }
    } else {
      setSession(null);
    }
    setLoading(false);
  };

  const handleFotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingFoto(true);
    setFotoMessage("");

    const formData = new FormData();
    formData.append("file", file);

    const res = await uploadTeacherFoto(formData);
    setUploadingFoto(false);
    if (res.success) {
      setFotoMessage("Foto profil sukses diperbarui!");
      setSession(prev => ({
        ...prev,
        foto: res.filePath
      }));
      await fetchDashboard();
    } else {
      setFotoMessage(res.error || "Gagal mengunggah foto profil.");
    }
  };

  const handleTeacherCheckIn = async (status, jp = 0) => {
    setAbsenLoading(true);
    setAbsenMessage("");
    setAbsenSuccess(false);
 
    const res = await checkInTeacher(status, "", jp);
    setAbsenLoading(false);
    if (res.success) {
      setAbsenSuccess(true);
      setAbsenMessage(`Absensi Berhasil! Anda tercatat ${status === "HADIR" ? `Hadir di sekolah dengan beban ${jp} JP` : "Tugas Luar"}. (IP: ${res.ip})`);
    } else {
      setAbsenMessage(res.error);
    }
  };

  const loadBendaharaData = async () => {
    setBendaharaLoading(true);
    const res = await getBendaharaDashboardData(treasurerMonth, treasurerYear);
    setBendaharaLoading(false);
    if (res.success) {
      setBendaharaData(res);
    }
  };

  const loadTreasurerReport = async () => {
    setLoadingReport(true);
    setTreasurerMessage("");
    const res = await getTreasurerReport(treasurerMonth, treasurerYear);
    setLoadingReport(false);
    if (res.success) {
      setTreasurerReport(res.reportData || []);
      if (res.rates) {
        setRateHonorPokok(res.rates.rHonor);
        setRateTransport(res.rates.rTransport);
        setRateInsentif(res.rates.rInsentif);
      }
    } else {
      setTreasurerMessage(res.error);
    }
    await loadBendaharaData();
  };

  const printStudentReceipt = (p) => {
    const printWin = window.open("", "_blank");
    if (!printWin) return;
    const bulanNama = p.bulan !== "-" ? ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"][parseInt(p.bulan) - 1] : "";
    
    printWin.document.write(`<!DOCTYPE html><html><head>
      <title>Kwitansi Pembayaran - ${p.receiptNo}</title>
      <style>
        body { font-family: 'Times New Roman', serif; margin: 10mm; color: #111; font-size: 12px; }
        .box { border: 2px solid #111; padding: 15px; border-radius: 6px; width: 100%; max-width: 650px; margin: 0 auto; }
        .header { display: flex; align-items: center; border-bottom: 2px double #111; padding-bottom: 8px; margin-bottom: 12px; }
        .title { text-align: center; font-size: 15px; font-weight: bold; text-decoration: underline; margin: 10px 0; }
        .row { display: flex; margin-bottom: 6px; }
        .label { width: 160px; font-weight: bold; }
        .val { flex: 1; }
        .amount-box { background: #f1f5f9; border: 1px solid #94a3b8; font-size: 16px; font-weight: bold; padding: 8px 12px; display: inline-block; margin-top: 10px; }
        .sign-grid { display: flex; justify-content: space-between; margin-top: 30px; }
        .sign-box { text-align: center; width: 200px; }
        .sign-line { border-bottom: 1px solid #111; margin-top: 45px; }
        @media print { @page { size: A5 landscape; margin: 5mm; } }
      </style>
    </head><body>
      <div class="box">
        <div class="header" style="display:flex;align-items:center;justify-content:center;border-bottom:2px double #111;padding-bottom:8px;margin-bottom:12px">
          ${school?.logo && (school.logo.startsWith("data:") || school.logo.startsWith("http") || school.logo.startsWith("/")) ? `<img src="${school.logo}" alt="Logo" style="height:45px;width:45px;object-fit:contain;margin-right:12px" />` : `<div style="font-size:28px;margin-right:10px">${school?.logo || '🏫'}</div>`}
          <div style="flex:1; text-align:center">
            <div style="font-size:14px; font-weight:bold">${school?.yayasan || "YAYASAN MASTER DEMO"}</div>
            <div style="font-size:16px; font-weight:bold">${school?.nama || "SEKOLAH MASTER DEMO"}</div>
            <div style="font-size:10px">${school?.alamat || ""} | Telp: ${school?.telepon || ""}</div>
          </div>
        </div>
        <div style="display:flex; justify-between; font-size:10px; font-weight:bold; margin-bottom:5px">
          <div>NO: ${p.receiptNo}</div>
          <div>TGL: ${p.paidAt}</div>
        </div>
        <div class="title">KWITANSI BUKTI PEMBAYARAN</div>
        <div className="row"><div class="label">Telah Terima Dari</div><div class="val">: <strong>${p.student?.name || p.studentNisn}</strong> (NISN: ${p.studentNisn} - Kelas ${p.student?.kelas || "-"})</div></div>
        <div className="row"><div class="label">Untuk Pembayaran</div><div class="val">: ${p.feeName} ${bulanNama ? `Bulan ${bulanNama}` : ""} ${p.tahun}</div></div>
        <div className="row"><div class="label">Status Pembayaran</div><div class="val">: <strong style="color:${p.status === 'LUNAS' ? 'green' : 'orange'}">${p.status}</strong></div></div>
        <div class="amount-box">Rp ${p.paidAmount.toLocaleString("id-ID")} ,-</div>
        <div class="sign-grid">
          <div class="sign-box">Penyetor / Siswa<div class="sign-line"></div>(${p.student?.name || "Siswa"})</div>
          <div class="sign-box">Bendahara Sekolah<div class="sign-line"></div>(${session?.name || "Bendahara"})</div>
        </div>
      </div>
    </body></html>`);
    printWin.document.close();
    printWin.focus();
    setTimeout(() => printWin.print(), 500);
  };

  const printTeacherPaySlip = (r) => {
    const printWin = window.open("", "_blank");
    if (!printWin) return;
    const bulanNama = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"][parseInt(treasurerMonth) - 1];

    printWin.document.write(`<!DOCTYPE html><html><head>
      <title>Slip Gaji - ${r.name} - ${bulanNama} ${treasurerYear}</title>
      <style>
        body { font-family: 'Times New Roman', serif; margin: 10mm; color: #111; font-size: 12px; }
        .box { border: 2px solid #111; padding: 15px; border-radius: 6px; width: 100%; max-width: 650px; margin: 0 auto; }
        .header { text-align: center; border-bottom: 2px double #111; padding-bottom: 8px; margin-bottom: 12px; }
        .title { text-align: center; font-size: 14px; font-weight: bold; text-decoration: underline; margin: 10px 0; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { border: 1px solid #111; padding: 6px 8px; font-size: 11px; }
        th { background: #f1f5f9; text-align: left; }
        .sign-grid { display: flex; justify-content: space-between; margin-top: 30px; }
        .sign-box { text-align: center; width: 200px; }
        .sign-line { border-bottom: 1px solid #111; margin-top: 45px; }
        @media print { @page { size: A5 landscape; margin: 5mm; } }
      </style>
    </head><body>
      <div class="box">
        <div class="header" style="display:flex;align-items:center;justify-content:center;border-bottom:2px double #111;padding-bottom:8px;margin-bottom:12px">
          ${school?.logo && (school.logo.startsWith("data:") || school.logo.startsWith("http") || school.logo.startsWith("/")) ? `<img src="${school.logo}" alt="Logo" style="height:45px;width:45px;object-fit:contain;margin-right:12px" />` : `<div style="font-size:28px;margin-right:10px">${school?.logo || '🏫'}</div>`}
          <div style="flex:1; text-align:center">
            <div style="font-size:14px; font-weight:bold">${school?.yayasan || "YAYASAN MASTER DEMO"}</div>
            <div style="font-size:16px; font-weight:bold">${school?.nama || "SEKOLAH MASTER DEMO"}</div>
            <div style="font-size:10px">${school?.alamat || ""}</div>
          </div>
        </div>
        <div class="title">SLIP GAJI & HONORARIUM PENDIDIK</div>
        <div style="margin-bottom:10px; font-size:11px">
          <strong>Nama:</strong> ${r.name} &nbsp;|&nbsp; <strong>NIP:</strong> ${r.nip} &nbsp;|&nbsp; <strong>Periode:</strong> ${bulanNama} ${treasurerYear}
        </div>
        <table>
          <thead>
            <tr><th>Rincian Pendapatan</th><th style="text-align:center">Beban / Hadir</th><th style="text-align:right">Jumlah (Rp)</th></tr>
          </thead>
          <tbody>
            <tr><td>Honor Pokok Mengajar</td><td style="text-align:center">${r.jamMengajar} JP</td><td style="text-align:right">Rp ${r.honorPokok.toLocaleString("id-ID")}</td></tr>
            <tr><td>Tunjangan Jabatan (${r.jabatan || "-"})</td><td style="text-align:center">1 Bulan</td><td style="text-align:right">Rp ${r.tunjanganJabatan.toLocaleString("id-ID")}</td></tr>
            <tr><td>Transport Tugas Luar</td><td style="text-align:center">${r.tugasLuarCount} Hari</td><td style="text-align:right">Rp ${r.transportTugasLuar.toLocaleString("id-ID")}</td></tr>
            <tr><td>Insentif Kehadiran Harian</td><td style="text-align:center">${r.hadirCount} Hari</td><td style="text-align:right">Rp ${r.insentifKehadiran.toLocaleString("id-ID")}</td></tr>
            <tr style="font-weight:bold; background:#f8fafc"><td colSpan="2">TOTAL GAJI / HONOR DITERIMA</td><td style="text-align:right">Rp ${r.totalHonor.toLocaleString("id-ID")}</td></tr>
          </tbody>
        </table>
        <div class="sign-grid">
          <div class="sign-box">Penerima,<div class="sign-line"></div>(${r.name})</div>
          <div class="sign-box">Bendahara Sekolah,<div class="sign-line"></div>(${session?.name || "Bendahara"})</div>
        </div>
      </div>
    </body></html>`);
    printWin.document.close();
    printWin.focus();
    setTimeout(() => printWin.print(), 500);
  };

  const handleSaveRates = async (e) => {
    e.preventDefault();
    setIsSavingRates(true);
    setTreasurerMessage("");
    const res = await updateFinancialRates(rateHonorPokok, rateTransport, rateInsentif);
    setIsSavingRates(false);
    if (res.success) {
      alert("Sukses! Besaran tarif honorarium & insentif berhasil diperbarui.");
      await loadTreasurerReport();
    } else {
      setTreasurerMessage(res.error);
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

  const getExistingGroups = () => {
    const groups = {};
    questions.forEach(q => {
      if (q.groupId && q.subject === activeSubject?.name && q.category === soalCategory && String(q.semester) === String(soalSemester)) {
        groups[q.groupId] = {
          groupId: q.groupId,
          groupText: q.groupText || "",
          groupImagePath: q.groupImagePath || ""
        };
      }
    });
    return Object.values(groups);
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  useEffect(() => {
    if (folderKelas && folderSemester && folderKategori) {
      setSoalKelas(folderKelas);
      setSoalSemester(String(folderSemester));
      setSoalCategory(folderKategori);
    }
  }, [folderKelas, folderSemester, folderKategori]);

  const handleActiveSubjectChange = (subjectName) => {
    const selectedSub = subjects.find(s => s.name === subjectName);
    if (selectedSub) {
      setActiveSubject(selectedSub);
      setKkm(selectedSub.kkm);
      
      // Update form fields for current selected student if any
      if (selectedStudentNisn) {
        const student = students.find(s => s.nisn === selectedStudentNisn);
        if (student) {
          const grade = student.grades?.find(g => g.subjectName === selectedSub.name && g.semester === selectedSemester);
          setTugas1(grade ? grade.tugas1 : 0);
          setTugas2(grade ? grade.tugas2 : 0);
          setUts(grade && grade.uts !== null ? grade.uts : "");
          setUas(grade && grade.uas !== null ? grade.uas : "");
          setPaj(grade && grade.paj !== null ? grade.paj : "");
        }
      }
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError("");
    const res = await loginAction(loginRole, username, password);
    if (res.success) {
      setUsername("");
      setPassword("");
      window.location.reload();
    } else {
      setLoginError(res.error);
    }
  };

  const handleLogout = async () => {
    await logoutAction();
    window.location.reload();
  };

  // Grade Portfolio Submit
  const handleGradePortfolioSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPortfolioForGrade) return;
    
    const data = {
      kreativitas: gradeForm.kreativitas,
      teknik: gradeForm.teknik,
      kesesuaian: gradeForm.kesesuaian,
      catatan: gradeForm.catatan,
      subjectName: gradeForm.subjectName || activeSubject?.name || "",
      semester: gradeForm.semester,
      teacherName: session?.name || "Guru"
    };

    const res = await gradePortfolio(selectedPortfolioForGrade.id, data);
    if (res.success) {
      setGradePortfolioMessage("Nilai berhasil disimpan!");
      setTimeout(() => {
        setShowGradeModal(false);
        setGradePortfolioMessage("");
        fetchDashboard();
      }, 1500);
    } else {
      alert("Gagal menyimpan nilai portofolio: " + res.error);
    }
  };

  // Grade Input Submit
  const handleGradeSubmit = async (e) => {
    e.preventDefault();
    setGradeMessage("");
    if (!selectedStudentNisn) {
      alert("Harap pilih siswa terlebih dahulu.");
      return;
    }

    const student = students.find(s => s.nisn === selectedStudentNisn);
    if (!student) return;

    let finalUts = uts;
    let finalUas = uas;
    let finalPaj = paj;

    const res = await saveStudentGrade(
      selectedStudentNisn,
      activeSubject?.name,
      tugas1,
      tugas2,
      finalUts,
      finalUas,
      finalPaj,
      selectedSemester,
      portofolio
    );
    if (res.success) {
      setGradeMessage("Sukses! Nilai rapor siswa berhasil disimpan ke database cloud.");
      await fetchDashboard();
    } else {
      alert("Gagal menyimpan nilai: " + res.error);
    }
  };

  const handleEkskulStudentSelect = (nisn, ekskul) => {
    setSelectedEkskulStudentNisn(nisn);
    setSelectedEkskulName(ekskul);
    if (nisn && ekskul) {
      const student = students.find(s => s.nisn === nisn);
      const activeSem = getStudentActiveSemester(student?.kelas, school?.semester);
      const grade = student?.extracurricularGrades.find(g => g.ekskulName === ekskul && g.semester === activeSem);
      setEkskulNilai(grade ? grade.nilai : "A");
      setEkskulDeskripsi(grade ? grade.deskripsi : "");
    }
  };

  const handleCatatanStudentSelect = (nisn) => {
    setSelectedCatatanStudentNisn(nisn);
    if (nisn) {
      const student = students.find(s => s.nisn === nisn);
      const activeSem = getStudentActiveSemester(student?.kelas, school?.semester);
      const record = student?.raporRecords.find(r => r.semester === activeSem);
      setCatatanWali(record ? record.catatanWali : "");
      setSakit(record ? record.sakit : 0);
      setIzin(record ? record.izin : 0);
      setAlfa(record ? record.alfa : 0);
      setNaikKelas(record && record.naikKelas !== null ? String(record.naikKelas) : "");
    }
  };

  const handlePgkCheckboxChange = (idx) => {
    if (correctChoices.includes(idx)) {
      setCorrectChoices(correctChoices.filter(c => c !== idx));
    } else {
      setCorrectChoices([...correctChoices, idx]);
    }
  };

  const handleEkskulSubmit = async (e) => {
    e.preventDefault();
    setEkskulMessage("");
    if (!selectedEkskulStudentNisn || !selectedEkskulName) {
      alert("Harap pilih siswa dan ekstrakurikuler terlebih dahulu.");
      return;
    }
    const res = await saveStudentEkskulGrade(selectedEkskulStudentNisn, selectedEkskulName, ekskulNilai, ekskulDeskripsi);
    if (res.success) {
      setEkskulMessage("Sukses! Nilai ekstrakurikuler siswa berhasil disimpan.");
      await fetchDashboard();
    } else {
      alert("Gagal menyimpan nilai ekstrakurikuler.");
    }
  };

  const handleCatatanSubmit = async (e) => {
    e.preventDefault();
    setCatatanMessage("");
    if (!selectedCatatanStudentNisn) {
      alert("Harap pilih siswa terlebih dahulu.");
      return;
    }
    const res = await saveStudentRaporRecord(
      selectedCatatanStudentNisn, 
      catatanWali, 
      sakit, 
      izin, 
      alfa, 
      naikKelas === "" ? null : (naikKelas === "true")
    );
    if (res.success) {
      setCatatanMessage("Sukses! Catatan rapor dan absensi siswa berhasil disimpan.");
      await fetchDashboard();
    } else {
      alert("Gagal menyimpan catatan rapor.");
    }
  };

  // KKM & CP Submit
  const handleKkmSubmit = async (e) => {
    e.preventDefault();
    setKkmMessage("");
    const res = await saveTeacherKkmAndCp(activeSubject?.name, selectedSemesterCP, kkm, cpA, cpB, cpC, cpD);
    if (res.success) {
      setKkmMessage("Sukses! KKM dan deskripsi Capaian Pembelajaran berhasil disimpan.");
      await fetchDashboard();
    } else {
      alert("Gagal menyimpan pengaturan KKM/CP.");
    }
  };

  // Load question details to form for editing
  const handleLoadEditQuestion = (q) => {
    setEditingQuestionId(q.id);
    setSoalType(q.type);
    setSoalCategory(q.category);
    setSoalSemester(q.semester);
    setSoalKelas(q.kelas || "X");
    setNewQuestion(q.question);
    setQuestionImage(q.imagePath || "");
    
    if (q.type === "PG" || q.type === "PGK") {
      setChoiceA(q.choices?.[0] || "");
      setChoiceAImage(q.choicesImages?.[0] || "");
      setChoiceB(q.choices?.[1] || "");
      setChoiceBImage(q.choicesImages?.[1] || "");
      setChoiceC(q.choices?.[2] || "");
      setChoiceCImage(q.choicesImages?.[2] || "");
      setChoiceD(q.choices?.[3] || "");
      setChoiceDImage(q.choicesImages?.[3] || "");
      
      setCorrect(q.correct || 0);
      setCorrectChoices(q.correctChoices || []);
    } else {
      setChoiceA(""); setChoiceAImage("");
      setChoiceB(""); setChoiceBImage("");
      setChoiceC(""); setChoiceCImage("");
      setChoiceD(""); setChoiceDImage("");
      setCorrect(0);
      setCorrectChoices([]);
    }

    if (q.type === "MENJODOHKAN") {
      setMatchLeft1(q.matchingLeft?.[0] || "");
      setMatchLeft1Image(q.matchingLeftImages?.[0] || "");
      setMatchRight1(q.matchingRight?.[0] || "");
      setMatchRight1Image(q.matchingRightImages?.[0] || "");

      setMatchLeft2(q.matchingLeft?.[1] || "");
      setMatchLeft2Image(q.matchingLeftImages?.[1] || "");
      setMatchRight2(q.matchingRight?.[1] || "");
      setMatchRight2Image(q.matchingRightImages?.[1] || "");

      setMatchLeft3(q.matchingLeft?.[2] || "");
      setMatchLeft3Image(q.matchingLeftImages?.[2] || "");
      setMatchRight3(q.matchingRight?.[2] || "");
      setMatchRight3Image(q.matchingRightImages?.[2] || "");

      setMatchLeft4(q.matchingLeft?.[3] || "");
      setMatchLeft4Image(q.matchingLeftImages?.[3] || "");
      setMatchRight4(q.matchingRight?.[3] || "");
      setMatchRight4Image(q.matchingRightImages?.[3] || "");

      setMatchLeft5(q.matchingLeft?.[4] || "");
      setMatchLeft5Image(q.matchingLeftImages?.[4] || "");
      setMatchRight5(q.matchingRight?.[4] || "");
      setMatchRight5Image(q.matchingRightImages?.[4] || "");

      setCorrectAnswer(q.correctAnswer || "");
    } else if (q.type === "ISIAN" || q.type === "ESSAY") {
      setCorrectAnswer(q.correctAnswer || "");
    } else {
      setCorrectAnswer("");
    }

    if (q.groupId) {
      setIsGroupQuestion(true);
      setSelectedGroupId(q.groupId);
      setNewGroupText(q.groupText || "");
      setNewGroupImagePath(q.groupImagePath || "");
    } else {
      setIsGroupQuestion(false);
      setSelectedGroupId("");
      setNewGroupText("");
      setNewGroupImagePath("");
    }
    
    const formElement = document.getElementById("question-form-container");
    if (formElement) {
      formElement.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleCancelEdit = () => {
    setEditingQuestionId(null);
    setNewQuestion("");
    setQuestionImage("");
    setChoiceA("");
    setChoiceAImage("");
    setChoiceB("");
    setChoiceBImage("");
    setChoiceC("");
    setChoiceCImage("");
    setChoiceD("");
    setChoiceDImage("");
    setCorrect(0);
    setCorrectChoices([]);
    setCorrectAnswer("");
    setMatchLeft1("");
    setMatchLeft1Image("");
    setMatchRight1("");
    setMatchRight1Image("");
    setMatchLeft2("");
    setMatchLeft2Image("");
    setMatchRight2("");
    setMatchRight2Image("");
    setMatchLeft3("");
    setMatchLeft3Image("");
    setMatchRight3("");
    setMatchRight3Image("");
    setMatchLeft4("");
    setMatchLeft4Image("");
    setMatchRight4("");
    setMatchRight4Image("");
    setMatchLeft5("");
    setMatchLeft5Image("");
    setMatchRight5("");
    setMatchRight5Image("");

    // Reset ke nilai folder aktif
    if (folderKelas && folderSemester && folderKategori) {
      setSoalKelas(folderKelas);
      setSoalSemester(String(folderSemester));
      setSoalCategory(folderKategori);
    }
    setIsGroupQuestion(false);
    setSelectedGroupId("");
    setNewGroupText("");
    setNewGroupImagePath("");
  };

  const handleSelectPreviewPg = (choiceIdx) => {
    setPreviewAnswers(prev => ({ ...prev, pg: choiceIdx }));
  };

  const handleTogglePreviewPgk = (choiceIdx) => {
    const current = previewAnswers.pgk || [];
    if (current.includes(choiceIdx)) {
      setPreviewAnswers(prev => ({ ...prev, pgk: current.filter(c => c !== choiceIdx) }));
    } else {
      setPreviewAnswers(prev => ({ ...prev, pgk: [...current, choiceIdx] }));
    }
  };

  const handleSelectPreviewMatching = (leftIdx, rightIdx) => {
    const current = previewAnswers.matching || {};
    setPreviewAnswers(prev => ({
      ...prev,
      matching: { ...current, [leftIdx]: rightIdx }
    }));
  };

  const renderPreviewQuestionLayout = (q) => {
    if (!q) return null;
    return (
      <div style={{ padding: "1.5rem", border: "1px solid var(--border-color)", borderRadius: "var(--radius-lg)", backgroundColor: "#ffffff" }}>
        
        {/* Wacana / Stimulus Grup */}
        {q.groupId && (q.groupText || q.groupImagePath) && (
          <div style={{ backgroundColor: "#f8fafc", borderLeft: "4px solid var(--secondary)", padding: "1rem", borderRadius: "var(--radius-md)", marginBottom: "1.5rem", fontSize: "0.9rem", color: "#475569", lineHeight: "1.5" }}>
            <strong style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.5rem", color: "var(--secondary-dark)" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <line x1="10" y1="9" x2="9" y2="9" />
              </svg>
              Teks / Gambar Acuan Grup:
            </strong>
            {q.groupImagePath && (
              <img src={q.groupImagePath} alt="Stimulus" style={{ maxWidth: "100%", maxHeight: "150px", objectFit: "contain", display: "block", marginTop: "0.5rem", marginBottom: "0.5rem", borderRadius: "4px", border: "1px solid #e2e8f0" }} />
            )}
            {q.groupText && (
              <p style={{ margin: 0, whiteSpace: "pre-wrap", fontStyle: "italic", maxHeight: "150px", overflowY: "auto" }}>
                {q.groupText}
              </p>
            )}
          </div>
        )}

        <div style={{ fontWeight: "bold", fontSize: "1.15rem", marginBottom: "1.5rem", color: "var(--primary-dark)", lineHeight: "1.5", whiteSpace: "pre-wrap" }}>
          {q.question}
        </div>

        {q.imagePath && (
          <div style={{ marginBottom: "1.5rem", textAlign: "center" }}>
            <img src={q.imagePath} alt="Ilustrasi Soal" style={{ maxWidth: "100%", maxHeight: "300px", objectFit: "contain", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }} />
          </div>
        )}

        <div style={{ minHeight: "100px" }}>
          {q.type === "PG" && q.choices && (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {q.choices.map((c, cIdx) => {
                const isSelected = previewAnswers.pg === cIdx;
                return (
                  <label 
                    key={cIdx} 
                    style={{ 
                      display: "flex", 
                      alignItems: "center", 
                      gap: "0.75rem", 
                      padding: "0.75rem 1rem", 
                      border: isSelected ? "2px solid var(--primary)" : "1px solid var(--border-color)", 
                      borderRadius: "var(--radius-md)", 
                      backgroundColor: isSelected ? "var(--primary-light)" : "white", 
                      cursor: "pointer", 
                      transition: "var(--transition)" 
                    }} 
                    onClick={() => handleSelectPreviewPg(cIdx)}
                  >
                    <input 
                      type="radio" 
                      name="preview-pg" 
                      checked={isSelected}
                      onChange={() => handleSelectPreviewPg(cIdx)}
                      style={{ cursor: "pointer" }}
                    />
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                      <span style={{ fontWeight: isSelected ? "600" : "500" }}>{String.fromCharCode(65 + cIdx)}. {c}</span>
                      {q.choicesImages && q.choicesImages[cIdx] && (
                        <img src={q.choicesImages[cIdx]} style={{ maxWidth: "200px", maxHeight: "100px", objectFit: "contain", borderRadius: "4px", border: "1px solid #e2e8f0", marginTop: "0.25rem" }} alt={`Opsi ${String.fromCharCode(65 + cIdx)}`} />
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
          )}

          {q.type === "PGK" && q.choices && (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {q.choices.map((c, cIdx) => {
                const isSelected = (previewAnswers.pgk || []).includes(cIdx);
                return (
                  <label 
                    key={cIdx} 
                    style={{ 
                      display: "flex", 
                      alignItems: "center", 
                      gap: "0.75rem", 
                      padding: "0.75rem 1rem", 
                      border: isSelected ? "2px solid var(--primary)" : "1px solid var(--border-color)", 
                      borderRadius: "var(--radius-md)", 
                      backgroundColor: isSelected ? "var(--primary-light)" : "white", 
                      cursor: "pointer", 
                      transition: "var(--transition)" 
                    }} 
                    onClick={() => handleTogglePreviewPgk(cIdx)}
                  >
                    <input 
                      type="checkbox" 
                      name="preview-pgk" 
                      checked={isSelected}
                      onChange={() => handleTogglePreviewPgk(cIdx)}
                      style={{ cursor: "pointer" }}
                    />
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                      <span style={{ fontWeight: isSelected ? "600" : "500" }}>{String.fromCharCode(65 + cIdx)}. {c}</span>
                      {q.choicesImages && q.choicesImages[cIdx] && (
                        <img src={q.choicesImages[cIdx]} style={{ maxWidth: "200px", maxHeight: "100px", objectFit: "contain", borderRadius: "4px", border: "1px solid #e2e8f0", marginTop: "0.25rem" }} alt={`Opsi ${String.fromCharCode(65 + cIdx)}`} />
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
          )}

          {q.type === "MENJODOHKAN" && q.matchingLeft && q.matchingLeft.length > 0 && (() => {
            // Build options pool including correct answers and decoy matching answers
            const optionsPool = [];
            if (q.matchingRight) {
              q.matchingRight.forEach((text, idx) => {
                if (text && !optionsPool.some(item => item.text === text)) {
                  optionsPool.push({ text, value: idx });
                }
              });
            }
            
            let decoyIdx = 0;
            questions.forEach(otherQ => {
              if (
                otherQ.type === "MENJODOHKAN" &&
                otherQ.subject === q.subject &&
                otherQ.category === q.category &&
                String(otherQ.semester) === String(q.semester)
              ) {
                if (otherQ.matchingRight) {
                  otherQ.matchingRight.forEach(text => {
                    if (text && !optionsPool.some(item => item.text === text)) {
                      optionsPool.push({ text, value: -100 - decoyIdx });
                      decoyIdx++;
                    }
                  });
                }
              }
            });
            
            optionsPool.sort((a, b) => a.text.localeCompare(b.text));

            return (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem", backgroundColor: "#f9fafb", padding: "1.25rem", borderRadius: "var(--radius-md)" }}>
                
                {/* 1. Baris Pertanyaan Menjodohkan (DI ATAS) */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {q.matchingLeft.map((leftVal, lIdx) => {
                    const selectedRightIdx = (previewAnswers.matching || {})[lIdx];
                    return (
                      <div key={lIdx} style={{ display: "grid", gridTemplateColumns: "1.2fr auto 1.2fr", alignItems: "center", gap: "1rem", borderBottom: "1px dashed #e2e8f0", paddingBottom: "0.75rem" }}>
                        <div style={{ fontWeight: "600", fontSize: "0.95rem", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                          <span>{leftVal}</span>
                          {q.matchingLeftImages && q.matchingLeftImages[lIdx] && (
                            <img src={q.matchingLeftImages[lIdx]} style={{ maxWidth: "120px", maxHeight: "80px", objectFit: "contain", borderRadius: "4px", border: "1px solid #e2e8f0", marginTop: "0.25rem" }} alt="Opsi Kiri" />
                          )}
                        </div>
                        <div style={{ color: "var(--primary)", display: "flex", alignItems: "center" }}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
                            <line x1="5" y1="12" x2="19" y2="12" />
                            <polyline points="12 5 19 12 12 19" />
                          </svg>
                        </div>
                        <select 
                          className="form-select" 
                          style={{ padding: "0.5rem" }}
                          value={selectedRightIdx !== undefined ? selectedRightIdx : ""}
                          onChange={(e) => handleSelectPreviewMatching(lIdx, e.target.value === "" ? "" : parseInt(e.target.value, 10))}
                        >
                          <option value="">-- Pilih Jawaban --</option>
                          {optionsPool.map((item, rIdx) => {
                            const isAlreadySelected = Object.entries(previewAnswers.matching || {}).some(
                              ([rowIdxStr, val]) => parseInt(rowIdxStr, 10) !== lIdx && val === item.value
                            );
                            return (
                              <option 
                                key={rIdx} 
                                value={item.value}
                                disabled={isAlreadySelected}
                                style={{ color: isAlreadySelected ? "#9ca3af" : "inherit" }}
                              >
                                Opsi {String.fromCharCode(65 + rIdx)}: {item.text} {isAlreadySelected ? " (Sudah terpilih)" : ""}
                              </option>
                            );
                          })}
                        </select>
                      </div>
                    );
                  })}
                </div>

                {/* 2. Daftar Pilihan Jawaban (DI BAWAH, DIPERKECIL & SCROLLABLE) */}
                <div style={{ borderTop: "1px solid var(--border-color)", marginTop: "0.5rem", paddingTop: "0.75rem" }}>
                  <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: "0 0 0.5rem 0", fontStyle: "italic" }}>
                    Daftar pilihan jawaban untuk dicocokkan (scroll di sebelah kanan jika tertutup):
                  </p>

                  <div style={{ 
                    maxHeight: "140px", 
                    overflowY: "auto", 
                    paddingRight: "0.5rem", 
                    border: "1px solid var(--border-color)", 
                    borderRadius: "var(--radius-sm)", 
                    backgroundColor: "white" 
                  }}>
                    <div style={{ 
                      display: "grid", 
                      gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", 
                      gap: "0.5rem", 
                      padding: "0.5rem" 
                    }}>
                      {optionsPool.map((item, rIdx) => {
                        let imgPath = null;
                        if (item.value >= 0 && q.matchingRightImages) {
                          imgPath = q.matchingRightImages[item.value];
                        }
                        return (
                          <div key={rIdx} style={{ 
                            display: "flex", 
                            flexDirection: "row", 
                            alignItems: "center", 
                            gap: "0.5rem", 
                            padding: "0.35rem 0.5rem", 
                            border: "1px solid #f3f4f6", 
                            borderRadius: "4px",
                            backgroundColor: "#f9fafb"
                          }}>
                            <span style={{ 
                              fontWeight: "bold", 
                              fontSize: "0.8rem", 
                              color: "white", 
                              backgroundColor: "var(--primary)", 
                              padding: "0.15rem 0.35rem", 
                              borderRadius: "3px", 
                              minWidth: "20px", 
                              textAlign: "center" 
                            }}>
                              {String.fromCharCode(65 + rIdx)}
                            </span>
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.1rem" }}>
                              <span style={{ fontSize: "0.8rem", fontWeight: "500", color: "var(--text-color)" }}>{item.text}</span>
                              {imgPath && (
                                <img src={imgPath} style={{ maxWidth: "80px", maxHeight: "40px", objectFit: "contain", borderRadius: "2px", border: "1px solid #e2e8f0" }} alt={`Opsi ${String.fromCharCode(65 + rIdx)}`} />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

              </div>
            );
          })()}

          {q.type === "ISIAN" && (
            <div className="form-group" style={{ margin: 0 }}>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Ketikkan jawaban singkat Anda di sini..." 
                value={previewAnswers.isian || ""}
                onChange={(e) => setPreviewAnswers(prev => ({ ...prev, isian: e.target.value }))}
              />
            </div>
          )}

          {q.type === "ESSAY" && (
            <div className="form-group" style={{ margin: 0 }}>
              <textarea 
                className="form-textarea" 
                placeholder="Tuliskan penjelasan/uraian jawaban lengkap Anda di sini..." 
                value={previewAnswers.essay || ""}
                onChange={(e) => setPreviewAnswers(prev => ({ ...prev, essay: e.target.value }))}
                style={{ minHeight: "120px" }}
              />
            </div>
          )}
        </div>
      </div>
    );
  };

  // Question Submit
  const handleQuestionSubmit = async (e) => {
    e.preventDefault();
    setSoalMessage("");

    if (!editingQuestionId) {
      // Cek alokasi kuota soal saat ini
      const curQs = questions.filter(q => q.subject === activeSubject?.name && q.category === soalCategory && q.semester === soalSemester);
      const pgCount = curQs.filter(q => q.type === "PG").length;
      const pgkCount = curQs.filter(q => q.type === "PGK").length;
      const matchCount = curQs.filter(q => q.type === "MENJODOHKAN").length;
      const isianCount = curQs.filter(q => q.type === "ISIAN").length;
      const essayCount = curQs.filter(q => q.type === "ESSAY").length;

      if (soalCategory === "PAJ") {
        if (soalType === "PG" && pgCount >= 45) {
          alert("Batas Maksimum Tercapai: Anda sudah membuat 45 soal Pilihan Ganda (PG) untuk ujian PAJ ini.");
          return;
        }
        if (soalType === "ESSAY" && essayCount >= 5) {
          alert("Batas Maksimum Tercapai: Anda sudah membuat 5 soal Essay untuk ujian PAJ ini.");
          return;
        }
        if (soalType !== "PG" && soalType !== "ESSAY") {
          alert("Tipe Soal Tidak Valid: Ujian PAJ hanya mendukung tipe Pilihan Ganda (PG) dan Essay.");
          return;
        }
      } else { // UTS / UAS
        if (soalType === "PG" && pgCount >= 20) {
          alert("Batas Maksimum Tercapai: Anda sudah membuat 20 soal Pilihan Ganda (PG) untuk ujian ini.");
          return;
        }
        if (soalType === "PGK" && pgkCount >= 5) {
          alert("Batas Maksimum Tercapai: Anda sudah membuat 5 soal PG Kompleks (PGK) untuk ujian ini.");
          return;
        }
        if (soalType === "MENJODOHKAN" && matchCount >= 10) {
          alert("Batas Maksimum Tercapai: Anda sudah membuat 10 soal Menjodohkan untuk ujian ini.");
          return;
        }
        if (soalType === "ISIAN" && isianCount >= 10) {
          alert("Batas Maksimum Tercapai: Anda sudah membuat 10 soal Isian Singkat untuk ujian ini.");
          return;
        }
        if (soalType === "ESSAY" && essayCount >= 5) {
          alert("Batas Maksimum Tercapai: Anda sudah membuat 5 soal Essay untuk ujian ini.");
          return;
        }
      }
    }

    // Siapkan list pasangan Menjodohkan
    const matchingLeft = [];
    const matchingRight = [];
    const matchingLeftImages = [];
    const matchingRightImages = [];
    if (matchLeft1 && matchRight1) { 
      matchingLeft.push(matchLeft1); matchingRight.push(matchRight1);
      matchingLeftImages.push(matchLeft1Image); matchingRightImages.push(matchRight1Image);
    }
    if (matchLeft2 && matchRight2) { 
      matchingLeft.push(matchLeft2); matchingRight.push(matchRight2);
      matchingLeftImages.push(matchLeft2Image); matchingRightImages.push(matchRight2Image);
    }
    if (matchLeft3 && matchRight3) { 
      matchingLeft.push(matchLeft3); matchingRight.push(matchRight3);
      matchingLeftImages.push(matchLeft3Image); matchingRightImages.push(matchRight3Image);
    }
    if (matchLeft4 && matchRight4) { 
      matchingLeft.push(matchLeft4); matchingRight.push(matchRight4);
      matchingLeftImages.push(matchLeft4Image); matchingRightImages.push(matchRight4Image);
    }
    if (matchLeft5 && matchRight5) { 
      matchingLeft.push(matchLeft5); matchingRight.push(matchRight5);
      matchingLeftImages.push(matchLeft5Image); matchingRightImages.push(matchRight5Image);
    }

    let finalGroupId = null;
    let finalGroupText = null;
    let finalGroupImagePath = null;

    if (isGroupQuestion) {
      if (selectedGroupId) {
        // Cari wacana dari grup yang sudah ada
        const existingGroup = questions.find(q => q.groupId === selectedGroupId);
        if (existingGroup) {
          finalGroupId = selectedGroupId;
          finalGroupText = existingGroup.groupText;
          finalGroupImagePath = existingGroup.groupImagePath;
        }
      } else {
        // Buat grup baru
        finalGroupId = `group_${Date.now()}`;
        finalGroupText = newGroupText;
        finalGroupImagePath = newGroupImagePath;
      }
    }

    const questionData = {
      subject: activeSubject?.name,
      question: newQuestion,
      imagePath: questionImage || null,
      type: soalType,
      category: soalCategory,
      semester: soalSemester,
      kelas: soalKelas,
      choices: (soalType === "PG" || soalType === "PGK") ? [choiceA, choiceB, choiceC, choiceD] : [],
      choicesImages: (soalType === "PG" || soalType === "PGK") ? [choiceAImage, choiceBImage, choiceCImage, choiceDImage] : [],
      correct: parseInt(correct, 10),
      correctChoices: soalType === "PGK" ? correctChoices.map(Number) : [],
      correctAnswer: (soalType === "ISIAN" || soalType === "MENJODOHKAN") ? correctAnswer : "",
      matchingLeft,
      matchingLeftImages,
      matchingRight,
      matchingRightImages,
      groupId: finalGroupId,
      groupText: finalGroupText,
      groupImagePath: finalGroupImagePath
    };

    let res;
    if (editingQuestionId) {
      res = await updateQuestion(editingQuestionId, questionData);
    } else {
      res = await addQuestion(questionData);
    }

    if (res.success) {
      if (editingQuestionId) {
        setSoalMessage("Sukses! Soal berhasil diperbarui di bank soal.");
        setEditingQuestionId(null);
      } else {
        setSoalMessage("Sukses! Soal baru berhasil disimpan ke bank soal.");
      }
      setNewQuestion("");
      setQuestionImage("");
      setChoiceA("");
      setChoiceAImage("");
      setChoiceB("");
      setChoiceBImage("");
      setChoiceC("");
      setChoiceCImage("");
      setChoiceD("");
      setChoiceDImage("");
      setCorrect(0);
      setCorrectChoices([]);
      setCorrectAnswer("");
      setMatchLeft1("");
      setMatchLeft1Image("");
      setMatchRight1("");
      setMatchRight1Image("");
      setMatchLeft2("");
      setMatchLeft2Image("");
      setMatchRight2("");
      setMatchRight2Image("");
      setMatchLeft3("");
      setMatchLeft3Image("");
      setMatchRight3("");
      setMatchRight3Image("");
      setMatchLeft4("");
      setMatchLeft4Image("");
      setMatchRight4("");
      setMatchRight4Image("");
      setMatchLeft5("");
      setMatchLeft5Image("");
      setMatchRight5("");
      setMatchRight5Image("");
      setIsGroupQuestion(false);
      setSelectedGroupId("");
      setNewGroupText("");
      setNewGroupImagePath("");
      await fetchDashboard();
    } else {
      alert(editingQuestionId ? "Gagal memperbarui soal." : "Gagal menyimpan soal baru.");
    }
  };

  const handleImageUpload = async (file, setter) => {
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    const res = await uploadQuestionImage(formData);
    if (res.success) {
      setter(res.filePath);
    } else {
      alert("Gagal mengunggah gambar: " + res.error);
    }
  };

  const handleUploadChoiceImage = async (e, setter) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await handleImageUpload(file, setter);
  };

  const handleUploadQuestionImageFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await handleImageUpload(file, setQuestionImage);
  };

  const handleUploadGroupImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await handleImageUpload(file, setNewGroupImagePath);
  };
  const handleChangeCustomInsentif = async (teacherId, teacherName, currentRate) => {
    const input = prompt(`Masukkan tarif insentif khusus (per hari) untuk ${teacherName}.\nKosongkan atau isi 0 untuk kembali menggunakan tarif global.`, currentRate || "");
    if (input === null) return; // dibatalkan
    const res = await updateTeacherCustomInsentif(teacherId, input);
    if (res.success) {
      alert("Berhasil menyimpan insentif khusus.");
      handleShowTreasurerReport(new Event("submit")); // Reload laporan
    } else {
      alert(res.error || "Gagal menyimpan insentif khusus.");
    }
  };

  // Question Delete
  const handleDeleteQuestion = async (id) => {
    if (confirm("Apakah Anda yakin ingin menghapus soal ujian ini?")) {
      const res = await deleteQuestion(id);
      if (res.success) {
        await fetchDashboard();
      } else {
        alert("Gagal menghapus soal.");
      }
    }
  };

  // Unduh Template Excel Bank Soal
  const unduhTemplateExcelSoal = () => {
    const headers = [
      [
        "Pertanyaan", 
        "Tipe Soal (PG/PGK/MENJODOHKAN/ISIAN/ESSAY)", 
        "Pilihan A", 
        "Pilihan B", 
        "Pilihan C", 
        "Pilihan D", 
        "Kunci PG (A/B/C/D)", 
        "Kunci PGK (Contoh: A, C)", 
        "Menjodohkan Kiri (Pisah Koma)", 
        "Menjodohkan Kanan (Pisah Koma)", 
        "Kunci Jawaban Singkat / Uraian",
        "Kategori (UTS/UAS/PAJ)",
        "Semester (1-6)",
        "Target Kelas (X/XI/XII)"
      ]
    ];
    const sampleData = [
      [
        "Apakah ibu kota negara Indonesia?", 
        "PG", 
        "Jakarta", 
        "Surabaya", 
        "Bandung", 
        "Medan", 
        "A", 
        "", 
        "", 
        "", 
        "", 
        "UTS", 
        "5",
        "XII"
      ],
      [
        "Manakah yang merupakan organ pernapasan manusia? (Pilih 2 jawaban benar)", 
        "PGK", 
        "Paru-paru", 
        "Jantung", 
        "Hidung", 
        "Lambung", 
        "", 
        "A, C", 
        "", 
        "", 
        "", 
        "UTS", 
        "5",
        "XII"
      ],
      [
        "Cocokkan negara dengan nama ibu kotanya:", 
        "MENJODOHKAN", 
        "", 
        "", 
        "", 
        "", 
        "", 
        "", 
        "Indonesia, Jepang, Perancis", 
        "Jakarta, Tokyo, Paris", 
        "Pasangkan dengan benar", 
        "UTS", 
        "5",
        "XII"
      ],
      [
        "Hasil dari 15 ditambah 20 adalah...", 
        "ISIAN", 
        "", 
        "", 
        "", 
        "", 
        "", 
        "", 
        "", 
        "", 
        "35", 
        "UTS", 
        "5",
        "XII"
      ],
      [
        "Jelaskan proses terjadinya siklus air secara singkat dan jelas!", 
        "ESSAY", 
        "", 
        "", 
        "", 
        "", 
        "", 
        "", 
        "", 
        "", 
        "Siklus air terjadi melalui penguapan (evaporasi), pengembunan (kondensasi), dan hujan (presipitasi).", 
        "UTS", 
        "5",
        "XII"
      ]
    ];

    const worksheetData = headers.concat(sampleData);
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(worksheetData);
    XLSX.utils.book_append_sheet(wb, ws, "Template Soal Ujian");
    XLSX.writeFile(wb, `template_soal_${activeSubject?.name || "ujian"}.xlsx`);
  };

  // Impor Excel Bank Soal
  const handleExcelImportSoal = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!activeSubject) {
      alert("Harap pilih mata pelajaran aktif terlebih dahulu.");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        
        const jsonRows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
        if (jsonRows.length === 0) {
          alert("Gagal mengurai file! File Excel kosong.");
          return;
        }

        const parsedQuestions = [];

        jsonRows.forEach(row => {
          const getValueByHeader = (headersList) => {
            for (let key in row) {
              if (headersList.some(h => key.trim().toLowerCase() === h.trim().toLowerCase())) {
                return row[key];
              }
            }
            return "";
          };

          const question = getValueByHeader(["Pertanyaan", "soal", "question"]);
          const type = String(getValueByHeader(["Tipe Soal (PG/PGK/MENJODOHKAN/ISIAN/ESSAY)", "Tipe Soal", "type"])).toUpperCase().trim();
          const pA = String(getValueByHeader(["Pilihan A", "Opsi A"]));
          const pB = String(getValueByHeader(["Pilihan B", "Opsi B"]));
          const pC = String(getValueByHeader(["Pilihan C", "Opsi C"]));
          const pD = String(getValueByHeader(["Pilihan D", "Opsi D"]));
          const keyPg = String(getValueByHeader(["Kunci PG (A/B/C/D)", "Kunci PG"])).toUpperCase().trim();
          const keyPgk = String(getValueByHeader(["Kunci PGK (Contoh: A, C)", "Kunci PGK", "Kunci Kompleks"]));
          const matchLeftRaw = String(getValueByHeader(["Menjodohkan Kiri (Pisah Koma)", "Menjodohkan Kiri", "Kiri"]));
          const matchRightRaw = String(getValueByHeader(["Menjodohkan Kanan (Pisah Koma)", "Menjodohkan Kanan", "Kanan"]));
          const answerText = String(getValueByHeader(["Kunci Jawaban Singkat / Uraian", "Kunci Jawaban", "Kunci"]));
          const category = String(getValueByHeader(["Kategori (UTS/UAS/PAJ)", "Kategori"])).toUpperCase().trim();
          const semester = String(getValueByHeader(["Semester (1-6)", "Semester"])).trim();
          const kelas = String(getValueByHeader(["Target Kelas (X/XI/XII)", "Target Kelas", "Kelas", "kelas"])).trim().toUpperCase();

          if (!question) return;

          let correct = 0;
          if (keyPg === "B") correct = 1;
          else if (keyPg === "C") correct = 2;
          else if (keyPg === "D") correct = 3;

          const correctChoices = [];
          if (keyPgk) {
            keyPgk.split(",").forEach(item => {
              const opt = item.trim().toUpperCase();
              if (opt === "A") correctChoices.push(0);
              else if (opt === "B") correctChoices.push(1);
              else if (opt === "C") correctChoices.push(2);
              else if (opt === "D") correctChoices.push(3);
            });
          }

          const matchingLeft = matchLeftRaw ? matchLeftRaw.split(",").map(i => i.trim()) : [];
          const matchingRight = matchRightRaw ? matchRightRaw.split(",").map(i => i.trim()) : [];

          // Logika Penentuan Kelas otomatis berdasarkan Semester jika kolom Kelas kosong
          let finalKelas = kelas;
          if (!["X", "XI", "XII"].includes(finalKelas)) {
            const semNum = parseInt(semester, 10);
            if (semNum === 1 || semNum === 2) {
              finalKelas = "X";
            } else if (semNum === 3 || semNum === 4) {
              finalKelas = "XI";
            } else if (semNum === 5 || semNum === 6) {
              finalKelas = "XII";
            } else {
              finalKelas = folderKelas || "X";
            }
          }

          parsedQuestions.push({
            question,
            type: ["PG", "PGK", "MENJODOHKAN", "ISIAN", "ESSAY"].includes(type) ? type : "PG",
            choices: [pA, pB, pC, pD].filter(c => c !== ""),
            correct,
            correctChoices,
            matchingLeft,
            matchingRight,
            correctAnswer: answerText,
            category: ["UTS", "UAS", "PAJ"].includes(category) ? category : "UTS",
            semester: semester || "1",
            kelas: finalKelas
          });
        });

        if (parsedQuestions.length === 0) {
          alert("Tidak ada soal valid untuk diimpor.");
          return;
        }

        let successCount = 0;
        let failCount = 0;
        
        for (let qData of parsedQuestions) {
          const res = await addQuestion({
            subject: activeSubject.name,
            ...qData
          });
          if (res.success) {
            successCount++;
          } else {
            failCount++;
          }
        }

        alert(`Impor selesai! Berhasil menyimpan ${successCount} soal. Gagal: ${failCount} soal.`);
        await fetchDashboard();
      } catch (err) {
        console.error(err);
        alert("Gagal membaca file Excel! Pastikan format file sesuai.");
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = "";
  };

  // Download Template Nilai Excel Dinamis (dengan Nama Siswa & Nilai Existing)
  const handleDownloadTemplateNilai = () => {
    if (!filterClass) {
      alert("Harap pilih kelas terlebih dahulu.");
      return;
    }
    if (!activeSubject) {
      alert("Harap pilih mata pelajaran terlebih dahulu.");
      return;
    }

    const filteredStudents = getStudentsByFilterClass();
    if (filteredStudents.length === 0) {
      alert("Tidak ada siswa di kelas ini.");
      return;
    }

    // Header untuk Excel
    const headers = ["NISN", "Nama Siswa", "Nilai Tugas 1", "Nilai Tugas 2", "Nilai UTS", "Nilai UAS", "Nilai PAJ"];
    const rows = [headers];

    // Isi baris data siswa beserta nilai existing (jika ada)
    filteredStudents.forEach(student => {
      const existingGrade = student.grades?.find(
        g => g.subjectName === activeSubject.name && g.semester === selectedSemester
      );
      
      // Dapatkan nilai ujian online jika mode ujian diatur ke online
      let finalUtsValue = existingGrade && existingGrade.uts !== null ? existingGrade.uts : "";
      let finalUasValue = existingGrade && existingGrade.uas !== null ? existingGrade.uas : "";
      let finalPajValue = existingGrade && existingGrade.paj !== null ? existingGrade.paj : "";

      rows.push([
        student.nisn,
        student.name,
        existingGrade ? existingGrade.tugas1 : 0,
        existingGrade ? existingGrade.tugas2 : 0,
        finalUtsValue,
        finalUasValue,
        finalPajValue
      ]);
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(rows);
    
    // Set column widths for better readability
    ws["!cols"] = [
      { wch: 15 }, // NISN
      { wch: 25 }, // Nama Siswa
      { wch: 15 }, // Tugas 1
      { wch: 15 }, // Tugas 2
      { wch: 12 }, // UTS
      { wch: 12 }, // UAS
      { wch: 12 }  // PAJ
    ];

    XLSX.utils.book_append_sheet(wb, ws, "Daftar Nilai Siswa");
    XLSX.writeFile(wb, `Template_Nilai_${filterClass}_${activeSubject.name.replace(/\s+/g, "_")}_Sem_${selectedSemester}.xlsx`);
  };

  // Upload & Simpan Nilai Excel Massal
  const handleUploadTemplateNilai = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!activeSubject) {
      alert("Harap pilih mata pelajaran terlebih dahulu.");
      return;
    }

    setGradeMessage("Sedang mengunggah dan memproses berkas Excel...");

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        
        const jsonRows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
        if (jsonRows.length === 0) {
          setGradeMessage("");
          alert("Gagal mengurai file! File Excel kosong.");
          return;
        }

        const gradesArray = [];
        let parsingError = null;

        // Map columns
        for (let i = 0; i < jsonRows.length; i++) {
          const row = jsonRows[i];
          const getValueByHeader = (headersList) => {
            for (let key in row) {
              if (headersList.some(h => key.trim().toLowerCase() === h.trim().toLowerCase())) {
                return row[key];
              }
            }
            return "";
          };

          const nisn = String(getValueByHeader(["NISN", "nis", "id siswa"])).trim();
          const name = String(getValueByHeader(["Nama Siswa", "nama", "student name"])).trim();
          const t1Raw = getValueByHeader(["Nilai Tugas 1", "tugas 1", "tugas1"]);
          const t2Raw = getValueByHeader(["Nilai Tugas 2", "tugas 2", "tugas2"]);
          const utsRaw = getValueByHeader(["Nilai UTS", "uts", "nilaiuts"]);
          const uasRaw = getValueByHeader(["Nilai UAS", "uas", "nilaiuas"]);
          const pajRaw = getValueByHeader(["Nilai PAJ", "paj", "nilaipaj"]);

          if (!nisn) {
            parsingError = `Baris ${i + 2}: NISN kosong.`;
            break;
          }

          // Validate student exists in current loaded list (safety check)
          const studentExists = students.some(s => s.nisn === nisn);
          if (!studentExists) {
            parsingError = `Baris ${i + 2}: Siswa dengan NISN ${nisn} tidak ditemukan di sistem.`;
            break;
          }

          // Helper to validate and parse score
          const parseScore = (val, fieldName) => {
            if (val === "" || val === null || val === undefined) return "";
            const num = Number(val);
            if (isNaN(num) || num < 0 || num > 100) {
              throw new Error(`Baris ${i + 2} (${name}): ${fieldName} harus berupa angka antara 0-100.`);
            }
            return num;
          };

          try {
            const studentData = students.find(s => s.nisn === nisn);
            
            let finalUts = parseScore(utsRaw, "Nilai UTS");
            let finalUas = parseScore(uasRaw, "Nilai UAS");
            let finalPaj = parseScore(pajRaw, "Nilai PAJ");

            gradesArray.push({
              studentNisn: nisn,
              tugas1: parseScore(t1Raw, "Nilai Tugas 1"),
              tugas2: parseScore(t2Raw, "Nilai Tugas 2"),
              uts: finalUts,
              uas: finalUas,
              paj: finalPaj
            });
          } catch (valErr) {
            parsingError = valErr.message;
            break;
          }
        }

        if (parsingError) {
          setGradeMessage("");
          alert(`Kesalahan penguraian Excel:\n${parsingError}`);
          return;
        }

        // Call Server Action to save bulk grades
        const res = await saveBulkStudentGrades(gradesArray, activeSubject.name, selectedSemester);
        if (res.success) {
          setGradeMessage(`Sukses! Berhasil mengunggah & memperbarui ${res.count} data nilai siswa.`);
          await fetchDashboard();
        } else {
          setGradeMessage("");
          alert(`Gagal menyimpan nilai massal: ${res.error}`);
        }
      } catch (err) {
        console.error(err);
        setGradeMessage("");
        alert("Gagal membaca file Excel! Pastikan file valid.");
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = ""; // Clear file input
  };

  const fetchSubmissions = async (subj = activeSubject?.name, cat = hasilCategory, sem = hasilSemester) => {
    if (!subj) return;
    const res = await getExamSubmissions(subj, cat, sem);
    if (res.success) {
      setSubmissions(res.submissions);
    }
  };

  const handleSaveEssayScore = async (questionId, scoreStr) => {
    const scoreVal = parseInt(scoreStr, 10);
    if (isNaN(scoreVal) || scoreVal < 0 || scoreVal > 100) {
      alert("Masukkan skor antara 0 hingga 100");
      return;
    }
    const res = await saveEssayScore(selectedSubmission.id, questionId, scoreVal);
    if (res.success) {
      setSelectedSubmission({
        ...selectedSubmission,
        score: res.newScore,
        essayScores: res.essayScores
      });
      setOverrideScoreInput(String(res.newScore));
      alert("Skor essay berhasil disimpan dan nilai akhir diperbarui.");
      fetchSubmissions();
    } else {
      alert("Gagal menyimpan skor essay: " + res.error);
    }
  };

  const handleOverrideScoreSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSubmission) return;
    const res = await overrideExamScore(selectedSubmission.id, overrideScoreInput);
    if (res.success) {
      alert("Sukses! Skor ujian siswa berhasil diperbarui.");
      setSelectedSubmission({ ...selectedSubmission, score: Number(overrideScoreInput) });
      await fetchSubmissions(activeSubject?.name, hasilCategory, hasilSemester);
      await fetchDashboard();
    } else {
      alert("Gagal memperbarui skor ujian.");
    }
  };

  useEffect(() => {
    if (activeTab === "hasil" && activeSubject) {
      fetchSubmissions(activeSubject.name, hasilCategory, hasilSemester);
    }
  }, [activeTab, activeSubject, hasilCategory, hasilSemester]);

  useEffect(() => {
    if (activeTab === "bendahara") {
      loadTreasurerReport();
    }
  }, [activeTab, treasurerMonth, treasurerYear]);

  const fetchJournals = async () => {
    if (!activeSubject) return;
    const res = await getTeachingJournals(activeSubject.name, journalKelas);
    if (res.success) {
      setJurnalList(res.journals);
    } else {
      console.error(res.error);
    }
  };

  useEffect(() => {
    if (activeTab === "jurnal" && activeSubject) {
      fetchJournals();
    }
  }, [activeTab, activeSubject, journalKelas]);

  const handleOpenJurnalModal = (journal = null) => {
    if (journal) {
      setEditingJournalId(journal.id);
      setJournalDate(journal.date);
      setJournalKelas(journal.kelas);
      setJournalJamKe(journal.jamKe);
      setJournalMateri(journal.materi);
      setJournalTujuan(journal.tujuanPembelajaran || "");
      setJournalAktivitas(journal.catatanAktivitas || "");
      setJournalKarakter(journal.catatanKarakter || "");

      const attMap = {};
      (journal.attendances || []).forEach(a => {
        attMap[a.studentId] = a.status;
      });
      setJournalAttendances(attMap);

      const gdMap = {};
      (journal.grades || []).forEach(g => {
        gdMap[g.studentId] = g.score;
      });
      setJournalGrades(gdMap);
    } else {
      setEditingJournalId(null);
      setJournalDate(new Date().toISOString().substring(0, 10));
      setJournalKelas(filterClass || uniqueClasses[0] || "");
      setJournalJamKe("1-2");
      setJournalMateri("");
      setJournalTujuan("");
      setJournalAktivitas("");
      setJournalKarakter("");

      const attMap = {};
      const activeClassStudents = students.filter(s => normalizeClass(s.kelas) === normalizeClass(filterClass || uniqueClasses[0]));
      activeClassStudents.forEach(s => {
        attMap[s.id] = "HADIR";
      });
      setJournalAttendances(attMap);
      setJournalGrades({});
    }
    setJurnalMessage("");
    setIsJurnalModalOpen(true);
  };

  const handleModalClassChange = (selectedClass) => {
    setJournalKelas(selectedClass);
    const attMap = {};
    const activeClassStudents = students.filter(s => normalizeClass(s.kelas) === normalizeClass(selectedClass));
    activeClassStudents.forEach(s => {
      attMap[s.id] = "HADIR";
    });
    setJournalAttendances(attMap);
    setJournalGrades({});
  };

  const handleSaveJournal = async (e) => {
    e.preventDefault();
    if (!activeSubject) return;
    if (!journalKelas) {
      alert("Harap pilih kelas target!");
      return;
    }

    const activeClassStudents = students.filter(s => normalizeClass(s.kelas) === normalizeClass(journalKelas));

    const attList = activeClassStudents.map(s => ({
      studentId: s.id,
      status: journalAttendances[s.id] || "HADIR",
      notes: null
    }));

    const gdList = activeClassStudents
      .filter(s => journalGrades[s.id] !== undefined && journalGrades[s.id] !== "")
      .map(s => ({
        studentId: s.id,
        score: parseInt(journalGrades[s.id], 10),
        notes: null
      }));

    const payload = {
      id: editingJournalId,
      date: journalDate,
      kelas: journalKelas,
      subjectName: activeSubject.name,
      jamKe: journalJamKe,
      materi: journalMateri,
      tujuanPembelajaran: journalTujuan,
      catatanAktivitas: journalAktivitas,
      catatanKarakter: journalKarakter,
      attendances: attList,
      grades: gdList
    };

    const res = await saveTeachingJournal(payload);
    if (res.success) {
      setIsJurnalModalOpen(false);
      alert(editingJournalId ? "Sukses memperbarui jurnal mengajar!" : "Sukses menyimpan jurnal mengajar baru!");
      await fetchJournals();
    } else {
      setJurnalMessage("Gagal menyimpan jurnal: " + res.error);
    }
  };

  const handleDeleteJournal = async (id) => {
    if (confirm("Apakah Anda yakin ingin menghapus jurnal mengajar ini?")) {
      const res = await deleteTeachingJournal(id);
      if (res.success) {
        alert("Jurnal mengajar berhasil dihapus.");
        await fetchJournals();
      } else {
        alert("Gagal menghapus jurnal: " + res.error);
      }
    }
  };

  const handleAttachmentUpload = async (e) => {
    e.preventDefault();
    if (!uploadFile || !activeSubject) return;
    const formData = new FormData();
    formData.append('file', uploadFile);
    formData.append('subjectName', activeSubject.name);
    formData.append('category', soalCategory);
    formData.append('semester', soalSemester);

    const res = await uploadExamAttachment(formData);
    if (res.success) {
      alert("Sukses mengunggah lampiran dokumen ujian!");
      setExamAttachment({ filePath: res.filePath, fileName: res.fileName });
      setUploadFile(null);
    } else {
      alert("Gagal mengunggah: " + res.error);
    }
  };

  useEffect(() => {
    const fetchAttachment = async () => {
      if (activeTab === "soal" && activeSubject) {
        const res = await getExamAttachment(activeSubject.name, soalCategory, soalSemester);
        if (res.success) {
          setExamAttachment(res.attachment);
        } else {
          setExamAttachment(null);
        }
      }
    };
    fetchAttachment();
  }, [activeTab, activeSubject, soalCategory, soalSemester]);

  useEffect(() => {
    const loadSppd = async () => {
      if (activeTab === "sppd" && session?.id) {
        setSppdLoading(true);
        const data = await getSppdByTeacher(session.id);
        setSppdList(data || []);
        setSppdLoading(false);
      }
    };
    loadSppd();
  }, [activeTab, session]);

  const handleSubmitSppd = async (e) => {
    e.preventDefault();
    if (!sppdForm.keperluan || !sppdForm.tujuan || !sppdForm.tanggalBerangkat || !sppdForm.tanggalKembali) {
      alert("Harap lengkapi semua isian SPPD!");
      return;
    }
    setSppdLoading(true);
    const res = await createSppd({ ...sppdForm, teacherId: session.id });
    if (res.success) {
      alert("Pengajuan SPPD berhasil dikirim.");
      setShowSppdForm(false);
      setSppdForm({ keperluan: "", tujuan: "", tanggalBerangkat: "", tanggalKembali: "", transportasi: "Kendaraan Pribadi" });
      const data = await getSppdByTeacher(session.id);
      setSppdList(data || []);
    } else {
      alert(res.error || "Gagal mengajukan SPPD");
    }
    setSppdLoading(false);
  };

  const handleDeleteSppd = async (id) => {
    if (!confirm("Hapus pengajuan SPPD ini?")) return;
    setSppdLoading(true);
    const res = await deleteSppd(id);
    if (res.success) {
      const data = await getSppdByTeacher(session.id);
      setSppdList(data || []);
    } else {
      alert("Gagal menghapus SPPD.");
    }
    setSppdLoading(false);
  };

  // Print Rapor (Iframe Method untuk mencegah Webkit Flex Bug)
  const triggerPrintRapor = () => {
    const printArea = document.getElementById("rapor-printable-area");
    if (!printArea) {
      window.print();
      return;
    }
    
    // Buat iframe tak terlihat
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.cssText = 'position:fixed;left:-9999px;top:0;width:794px;height:1123px;border:none;visibility:hidden;';
    document.body.appendChild(iframe);

    // Ambil HTML dan data watermark
    const content = printArea.innerHTML;
    const origin = window.location.origin;
    
    // Perbaiki logoPath: tangani URL http, URL relatif (/uploads/...), dan base64
    let logoPath = `${origin}/logo-generic.svg`; // fallback default
    if (school && school.logo && school.logo.trim() !== "" && school.logo !== "🏫") {
      if (school.logo.startsWith("http") || school.logo.startsWith("data:")) {
        logoPath = school.logo;
      } else {
        logoPath = `${origin}${school.logo.startsWith("/") ? "" : "/"}${school.logo}`;
      }
    }

    // Judul dokumen = Nama Siswa / NISN (tampil sebagai header cetak di Chrome)
    const selectedStudent = students.find(s => s.nisn === raporStudentNisn);
    const docTitle = selectedStudent
      ? `${selectedStudent.name} / ${selectedStudent.nisn}`
      : "Rapor Sekolah Master Demo";

    const wmText = `<svg xmlns='http://www.w3.org/2000/svg' width='410' height='120'><text x='5' y='55' font-family='Times New Roman,serif' font-size='18' font-weight='bold' fill='rgba(0,0,0,0.045)' transform='rotate(-30,205,60)'>SEKOLAH MASTER DEMO KOTA DEMO</text><text x='5' y='105' font-family='Times New Roman,serif' font-size='18' font-weight='bold' fill='rgba(0,0,0,0.045)' transform='rotate(-30,205,110)'>SEKOLAH MASTER DEMO KOTA DEMO</text></svg>`;
    const wmTextB64 = `data:image/svg+xml;base64,${btoa(wmText)}`;

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>${docTitle}</title>
  <style>
    @page { size: A4 portrait; margin: 1.5cm; }
    
    * {
      overflow: visible !important;
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    
    body {
      font-family: 'Times New Roman', Times, serif;
      margin: 0; padding: 0;
      background: #fff;
      color: #000;
      width: 100%;
      position: relative;
    }

    /* === WATERMARK === */
    /* Layer 1: Teks berulang miring (di setiap halaman via @page pseudo) */
    body::before {
      content: "";
      position: fixed;
      top: -50%; left: -50%;
      width: 200%; height: 200%;
      background-image: url("${wmTextB64}");
      background-repeat: repeat;
      background-size: 410px 120px;
      opacity: 1;
      pointer-events: none;
      z-index: 0;
    }

    /* Layer 2: Logo tengah */
    body::after {
      content: "";
      position: fixed;
      top: 50%; left: 50%;
      transform: translate(-50%, -50%);
      width: 320px; height: 320px;
      background-image: url("${logoPath}");
      background-repeat: no-repeat;
      background-position: center;
      background-size: contain;
      opacity: 0.06;
      pointer-events: none;
      z-index: 0;
    }
    
    /* === KONTEN RAPOR === */
    .rapor-print-container {
      position: relative;
      z-index: 1;
      padding: 0 !important;
      margin: 0 0 2rem 0 !important;
      border: none !important;
      box-shadow: none !important;
      background: transparent !important;
    }
    
    /* Sembunyikan div watermark lama dari React */
    div[style*="rotate(-35deg)"],
    div[style*="opacity: 0.06"],
    div[style*="opacity: 0.05"] { display: none !important; }

    table { width: 100% !important; border-collapse: collapse; }
    tr { page-break-inside: avoid; }
    thead { display: table-header-group; }
    .page-break { page-break-after: always; break-after: page; }
  </style>
</head>
<body>
  ${content}
</body>
</html>`;

    // Tulis ke iframe & cetak setelah load
    iframe.onload = () => {
      setTimeout(() => {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
        setTimeout(() => { 
          if (document.body.contains(iframe)) document.body.removeChild(iframe);
        }, 3000);
      }, 500);
    };

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(html);
    doc.close();
  };

  // Filter siswa berdasarkan peran Wali Kelas
  const getFilteredStudentsForRapor = () => {
    if (session?.role === "wali-kelas") {
      return students.filter(s => normalizeClass(s.kelas) === normalizeClass(session.kelas));
    }
    return students;
  };

  // Filter siswa untuk dropdown input nilai
  const getStudentsByFilterClass = () => {
    if (!filterClass) return [];
    return students.filter(s => normalizeClass(s.kelas) === normalizeClass(filterClass));
  };

  // Load selected student grade form values
  const handleStudentSelectForGrade = (nisn, semesterOverride) => {
    const sem = semesterOverride || selectedSemester;
    setSelectedStudentNisn(nisn);
    if (!nisn) return;
    const student = students.find(s => s.nisn === nisn);
    if (student) {
      const grade = student.grades?.find(g => g.subjectName === activeSubject?.name && g.semester === sem);
      setTugas1(grade ? grade.tugas1 : 0);
      setTugas2(grade ? grade.tugas2 : 0);
      setUts(grade && grade.uts !== null ? grade.uts : "");
      setUas(grade && grade.uas !== null ? grade.uas : "");
      setPaj(grade && grade.paj !== null ? grade.paj : "");
    }
  };

  const handleSemesterChange = (newSemester) => {
    setSelectedSemester(newSemester);
    if (selectedStudentNisn) {
      handleStudentSelectForGrade(selectedStudentNisn, newSemester);
    }
  };

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

  // Cari daftar kelas unik dari data siswa untuk dropdown input nilai
  const uniqueClasses = [...new Set(students.map(s => s.kelas).filter(Boolean))]
    .filter(c => c.match(/^(X|XI|XII|7|8|9)/i))
    .sort();

  return (
    <>
      {/* PAGE HEADER */}
      <section className="page-header no-print">
        <div className="container">
          <h1 className="page-header-title">Portal Pendidik</h1>
          <div className="page-header-breadcrumbs">
            <Link href="/">Beranda</Link>
            <span className="breadcrumb-separator">/</span>
            <span>Portal Guru</span>
          </div>
        </div>
      </section>

      <div className="portal-wrapper">
        <div className="container">
          {/* 1. LOGIN FORM */}
          {!session && (
            <section className="login-section no-print" id="portal-guru-login-section">
              <div className="login-card">
                <div className="login-header">
                  <div className="login-icon-box" style={{ backgroundColor: "var(--secondary)" }}>T</div>
                  <h2 className="login-card-title">Login Guru & Wali Kelas</h2>
                  <p className="login-card-subtitle">Pilih Peran dan gunakan akun Pendidik Anda</p>
                </div>

                {loginError && (
                  <div className="form-alert error" style={{ display: "block", marginBottom: "1.5rem" }}>
                    {loginError}
                  </div>
                )}


                <form onSubmit={handleLogin}>
                  <div className="form-group">
                    <label htmlFor="portal-guru-role" className="form-label">Masuk Sebagai Peran</label>
                    <select 
                      id="portal-guru-role" 
                      className="form-select" 
                      value={loginRole} 
                      onChange={(e) => setLoginRole(e.target.value)}
                      required
                    >
                      <option value="guru-mapel">Guru Mata Pelajaran</option>
                      <option value="wali-kelas">Wali Kelas</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ marginTop: "1rem" }}>
                    <label htmlFor="portal-guru-username" className="form-label">Username</label>
                    <input 
                      type="text" 
                      id="portal-guru-username" 
                      className="form-input" 
                      placeholder="Username pendidik" 
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required 
                      autoComplete="username"
                    />
                  </div>
                  
                  <div className="form-group" style={{ marginBottom: "2rem", marginTop: "1rem" }}>
                    <label htmlFor="portal-guru-password" className="form-label">Password</label>
                    <input 
                      type="password" 
                      id="portal-guru-password" 
                      className="form-input" 
                      placeholder="Masukkan password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required 
                      autoComplete="current-password"
                    />
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ width: "100%" }}>Masuk Portal Pendidik</button>
                </form>
              </div>
            </section>
          )}

          {/* 2. TEACHER DASHBOARD AREA */}
          {session && (
            <div className="portal-layout">
              {/* Sidebar Pendidik */}
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

                <div className="portal-sidebar-header" style={{ position: "relative", zIndex: 1 }}>
                  {session.foto ? (
                    <img 
                      src={session.foto} 
                      alt="Foto Profil" 
                      style={{ width: "42px", height: "42px", borderRadius: "50%", objectFit: "cover", marginRight: "0.75rem", border: "2px solid var(--primary-light)" }} 
                    />
                  ) : (
                    <div className="portal-sidebar-avatar">{session.name ? session.name.charAt(0) : "T"}</div>
                  )}
                  <div>
                    <h4 style={{ fontWeight: 800, fontSize: "0.95rem", color: "var(--primary-dark)" }}>{session.name}</h4>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block" }}>
                      NIP: {session.nip !== "-" ? session.nip : "Belum Ada NIP"}
                    </span>
                  </div>
                </div>



                {subjects && session?.subjects && subjects.filter(s => session.subjects.includes(s.name)).length > 1 && (
                  <div style={{ padding: "0 1.25rem 1rem 1.25rem", borderBottom: "1px dashed #e2e8f0", marginBottom: "0.5rem" }}>
                    <label className="form-label" style={{ fontSize: "0.72rem", fontWeight: 800, color: "var(--text-muted)", display: "block", marginBottom: "0.25rem", letterSpacing: "0.5px" }}>MATA PELAJARAN AKTIF</label>
                    <select 
                      className="form-select" 
                      style={{ fontSize: "0.8rem", padding: "0.25rem 0.5rem", height: "35px" }}
                      value={activeSubject?.name || ""}
                      onChange={(e) => handleActiveSubjectChange(e.target.value)}
                    >
                      {subjects.filter(s => session.subjects.includes(s.name)).map((sub, idx) => (
                        <option key={idx} value={sub.name}>{sub.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {subjects && session?.subjects && subjects.filter(s => session.subjects.includes(s.name)).length === 1 && (
                  <div style={{ padding: "0 1.25rem 1rem 1.25rem", borderBottom: "1px dashed #e2e8f0", marginBottom: "0.5rem" }}>
                    <label className="form-label" style={{ fontSize: "0.72rem", fontWeight: 800, color: "var(--text-muted)", display: "block", marginBottom: "0.25rem", letterSpacing: "0.5px" }}>MATA PELAJARAN AKTIF</label>
                    <span style={{ fontSize: "0.82rem", fontWeight: 800, color: "var(--primary)", display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                      <svg className="tab-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                        <path d="M6 6h10" />
                        <path d="M6 10h10" />
                      </svg>
                      {subjects.filter(s => session.subjects.includes(s.name))[0].name}
                    </span>
                  </div>
                )}

                <div className="portal-sidebar-menu">

                  {/* Grup: Beranda */}
                  <button 
                    className={`sidebar-btn ${activeTab === "beranda" ? "active" : ""}`}
                    onClick={() => setActiveTab("beranda")}
                  >
                    <svg className="tab-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                      <polyline points="9 22 9 12 15 12 15 22" />
                    </svg>
                    Beranda Pendidik
                  </button>

                  {/* Grup: Pembelajaran */}
                  <div style={{ padding: "0.6rem 0.75rem 0.3rem", fontSize: "0.6rem", fontWeight: 800, letterSpacing: "0.12em", color: "var(--text-muted)", textTransform: "uppercase", opacity: 0.7, marginTop: "0.15rem" }}>Pembelajaran</div>

                  <button 
                    className={`sidebar-btn ${activeTab === "penugasan" ? "active" : ""}`}
                    onClick={() => setActiveTab("penugasan")}
                  >
                    <svg className="tab-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                      <polyline points="10 9 9 9 8 9" />
                    </svg>
                    Penugasan {activeSubject?.name}
                  </button>

                  <button 
                    className={`sidebar-btn ${activeTab === "nilai" ? "active" : ""}`}
                    onClick={() => { setActiveTab("nilai"); setSelectedStudentNisn(""); setGradeMessage(""); }}
                  >
                    <svg className="tab-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                    Input Nilai {activeSubject?.name}
                  </button>
                  <button 
                    className={`sidebar-btn ${activeTab === "kkm" ? "active" : ""}`}
                    onClick={() => { setActiveTab("kkm"); setKkmMessage(""); }}
                  >
                    <svg className="tab-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                      <circle cx="12" cy="12" r="3" />
                      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                    </svg>
                    KKM & CP {activeSubject?.name}
                  </button>
                  <button 
                    className={`sidebar-btn ${activeTab === "jurnal" ? "active" : ""}`}
                    onClick={() => { setActiveTab("jurnal"); setJurnalMessage(""); }}
                  >
                    <svg className="tab-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                      <polyline points="10 9 9 9 8 9" />
                    </svg>
                    Jurnal Mengajar {activeSubject?.name}
                  </button>
                  <button 
                    className={`sidebar-btn ${activeTab === "soal" ? "active" : ""}`}
                    onClick={() => { setActiveTab("soal"); setSoalMessage(""); }}
                  >
                    <svg className="tab-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                      <path d="M6 6h10" />
                      <path d="M6 10h10" />
                    </svg>
                    Bank Soal {activeSubject?.name}
                  </button>
                  <button 
                    className={`sidebar-btn`}
                    onClick={() => { window.location.href = "/portal/guru/tryout"; }}
                    style={{ backgroundColor: "var(--primary-light)", color: "var(--primary-dark)", borderColor: "var(--primary)" }}
                  >
                    <svg className="tab-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                      <line x1="10" y1="9" x2="8" y2="9" />
                    </svg>
                    Paket Ujian (UCO)
                  </button>
                  <button 
                    className={`sidebar-btn ${activeTab === "hasil" ? "active" : ""}`}
                    onClick={() => { setActiveTab("hasil"); setSelectedSubmission(null); }}
                  >
                    <svg className="tab-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                      <line x1="18" y1="20" x2="18" y2="10" />
                      <line x1="12" y1="20" x2="12" y2="4" />
                      <line x1="6" y1="20" x2="6" y2="14" />
                    </svg>
                    Hasil Ujian Siswa
                  </button>
                  <button 
                    className={`sidebar-btn ${activeTab === "portofolio" ? "active" : ""}`}
                    onClick={() => { setActiveTab("portofolio"); }}
                  >
                    <svg className="tab-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                    Portofolio Siswa (DKV)
                  </button>
                  <button 
                    className={`sidebar-btn ${activeTab === "digital-library" ? "active" : ""}`}
                    onClick={() => { setActiveTab("digital-library"); }}
                  >
                    <svg className="tab-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                    </svg>
                    Perpustakaan Digital
                  </button>
                  
                                      {/* PENGAWAS UJIAN CBT */}
                    {session.isPengawas && (
                      <button 
                        className={`sidebar-btn ${activeTab === "pengawas" ? "active" : ""}`} 
                        onClick={() => setActiveTab("pengawas")}
                        style={{ color: "#d97706", fontWeight: "bold" }}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
                          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline>
                        </svg>
                        Pengawas Ujian CBT
                      </button>
                    )}
                    
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
                  {session.role === "wali-kelas" && (
                    <>
                      <div style={{ padding: "0.6rem 0.75rem 0.3rem", fontSize: "0.6rem", fontWeight: 800, letterSpacing: "0.12em", color: "var(--text-muted)", textTransform: "uppercase", opacity: 0.7, marginTop: "0.15rem" }}>Absensi & Rekap</div>
                      <button 
                        className={`sidebar-btn ${activeTab === "catatan" ? "active" : ""}`}
                        onClick={() => { setActiveTab("catatan"); setSelectedCatatanStudentNisn(""); setCatatanMessage(""); }}
                      >
                        <svg className="tab-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                          <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                        </svg>
                        Absensi & Catatan
                      </button>
                      <button 
                        className={`sidebar-btn ${activeTab === "rapor" ? "active" : ""}`}
                        onClick={() => { setActiveTab("rapor"); setRaporStudentNisn(""); }}
                      >
                        <svg className="tab-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                          <line x1="16" y1="13" x2="8" y2="13" />
                          <line x1="16" y1="17" x2="8" y2="17" />
                          <polyline points="10 9 9 9 8 9" />
                        </svg>
                        Rapor Siswa {session.kelas}
                      </button>
                    </>
                  )}

                  {/* Grup: Lainnya */}
                  <div style={{ padding: "0.6rem 0.75rem 0.3rem", fontSize: "0.6rem", fontWeight: 800, letterSpacing: "0.12em", color: "var(--text-muted)", textTransform: "uppercase", opacity: 0.7, marginTop: "0.15rem" }}>Lainnya</div>

                  {(session.role === "wali-kelas" || (session.extracurriculars && session.extracurriculars.length > 0)) && (
                    <button 
                      className={`sidebar-btn ${activeTab === "ekskul" ? "active" : ""}`}
                      onClick={() => { setActiveTab("ekskul"); setSelectedEkskulStudentNisn(""); setSelectedEkskulName(""); setEkskulMessage(""); }}
                    >
                      <svg className="tab-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                        <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                        <path d="M4 22h16" />
                        <path d="M10 14.66V17c0 .55-.45 1-1 1H4v2h16v-2h-5c-.55 0-1-.45-1-1v-2.34" />
                        <path d="M12 2a6 6 0 0 1 6 6v1c0 2.2-1.8 4-4 4h-4a4 4 0 0 1-4-4V8a6 6 0 0 1 6-6z" />
                      </svg>
                      Input Nilai Ekskul
                    </button>
                  )}

                  <button 
                    className={`sidebar-btn ${activeTab === "sppd" ? "active" : ""}`}
                    onClick={() => { setActiveTab("sppd"); }}
                  >
                    <svg className="tab-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                      <path d="M22 2L11 13" />
                      <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                    Surat Perjalanan Dinas
                  </button>

                  {session.isBendahara && (
                    <button 
                      className={`sidebar-btn ${activeTab === "bendahara" ? "active" : ""}`}
                      onClick={() => { setActiveTab("bendahara"); setTreasurerMessage(""); }}
                      style={{ color: "#0d9488", fontWeight: "bold" }}
                    >
                      <svg className="tab-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                        <line x1="12" y1="1" x2="12" y2="23" />
                        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                      </svg>
                      Modul Bendahara
                    </button>
                  )}

                  {session.isTU && (
                    <button 
                      className={`sidebar-btn ${activeTab === "tu" ? "active" : ""}`}
                      onClick={() => { setActiveTab("tu"); loadTuData(); }}
                      style={{ color: "#2563eb", fontWeight: "bold" }}
                    >
                      <svg className="tab-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                        <line x1="10" y1="9" x2="9" y2="9" />
                      </svg>
                      Tata Usaha
                    </button>
                  )}

                  {session.isPerpus && (
                    <button 
                      className={`sidebar-btn ${activeTab === "perpus" ? "active" : ""}`}
                      onClick={() => { setActiveTab("perpus"); loadLibraryData(); }}
                      style={{ color: "#0d9488", fontWeight: "bold" }}
                    >
                      <svg className="tab-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                      </svg>
                      Perpustakaan
                    </button>
                  )}

                  {session.isSarpras && (
                    <button 
                      className={`sidebar-btn ${activeTab === "sarpras" ? "active" : ""}`}
                      onClick={() => { setActiveTab("sarpras"); loadInventoryData(); }}
                      style={{ color: "#d97706", fontWeight: "bold" }}
                    >
                      <svg className="tab-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                      </svg>
                      Sarpras
                    </button>
                  )}

                  {session.isWakaKurikulum && (
                    <button 
                      className={`sidebar-btn ${activeTab === "wakaKurikulum" ? "active" : ""}`}
                      onClick={() => { setActiveTab("wakaKurikulum"); setWakaKurikulumMessage(""); loadKtspData(); }}
                      style={{ color: "#7c3aed", fontWeight: "bold" }}
                    >
                      <svg className="tab-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                        <line x1="10" y1="9" x2="9" y2="9" />
                      </svg>
                      Waka Kurikulum
                    </button>
                  )}

                  {session.isWakaKesiswaan && (
                    <button 
                      className={`sidebar-btn ${activeTab === "wakaKesiswaan" ? "active" : ""}`}
                      onClick={() => { setActiveTab("wakaKesiswaan"); setWakaKesiswaanMessage(""); }}
                      style={{ color: "#e11d48", fontWeight: "bold" }}
                    >
                      <svg className="tab-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                      </svg>
                      Waka Kesiswaan
                    </button>
                  )}

                  <button 
                    className="sidebar-btn" 
                    onClick={() => window.open("/absen-cepat", "_blank")}
                    style={{ margin: 0, padding: "0.6rem 1rem", fontSize: "0.85rem", height: "auto", display: "inline-flex", alignItems: "center", gap: "0.3rem", color: "#10b981", border: "none", borderRadius: "var(--radius-md)" }}
                  >
                    <svg className="tab-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                    </svg>
                    Terminal Absen Cepat
                  </button>
                  
                  <button 
                    className="sidebar-btn" 
                    style={{ color: "#ef4444", marginTop: "2rem", borderTop: "1px dashed #e2e8f0", paddingTop: "1rem" }}
                    onClick={handleLogout}
                  >
                    <svg className="tab-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    Keluar Portal
                  </button>
                </div>
              </aside>

              {/* Konten Utama Rute */}
              <main className="portal-main-content">
                {/* TAB 1: BERANDA */}
                {activeTab === "penugasan" && (
                  <PenugasanTab teacher={session} activeSubject={activeSubject} school={school} />
                )}

                {activeTab === "beranda" && (
                  <div className="no-print">
                    <span style={{ fontSize: "0.85rem", textTransform: "uppercase", fontWeight: 700, color: "var(--secondary)" }}>Beranda Pendidik</span>
                    <h2 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--primary-dark)", marginBottom: "1rem" }}>
                      Selamat Datang, {session.name}
                    </h2>

                    <div className="dash-card-premium" style={{ display: "flex", gap: "1.5rem", alignItems: "center", marginBottom: "2rem", padding: "1.5rem", border: "1px solid #e2e8f0" }}>
                      <div style={{ position: "relative", width: "90px", height: "90px", flexShrink: 0 }}>
                        {session.foto ? (
                          <img 
                            src={session.foto} 
                            alt="Foto Profil" 
                            style={{ width: "90px", height: "90px", borderRadius: "50%", objectFit: "cover", border: "3px solid var(--primary-light)" }} 
                          />
                        ) : (
                          <div style={{ width: "90px", height: "90px", borderRadius: "50%", backgroundColor: "var(--primary-light)", color: "var(--primary-dark)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem", fontWeight: "bold" }}>
                            {session.name ? session.name.charAt(0) : "T"}
                          </div>
                        )}
                        <label 
                          htmlFor="upload-foto-profil" 
                          style={{ position: "absolute", bottom: 0, right: 0, backgroundColor: "var(--primary)", color: "#fff", width: "28px", height: "28px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", border: "2px solid #fff", boxShadow: "0 2px 4px rgba(0,0,0,0.15)", fontSize: "0.8rem" }}
                          title="Unggah Foto Profil"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
                            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                            <circle cx="12" cy="13" r="4" />
                          </svg>
                        </label>
                        <input 
                          type="file" 
                          id="upload-foto-profil" 
                          accept="image/*" 
                          style={{ display: "none" }} 
                          onChange={handleFotoUpload} 
                        />
                      </div>
                      <div>
                        <span style={{ fontSize: "0.8rem", textTransform: "uppercase", fontWeight: 700, color: "var(--secondary)", display: "block", marginBottom: "0.25rem" }}>Profil Pendidik</span>
                        <h3 style={{ fontSize: "1.35rem", fontWeight: 800, color: "var(--primary-dark)", margin: 0 }}>{session.name}</h3>
                        <p style={{ margin: "0.25rem 0 0.5rem 0", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                          NIP: {session.nip !== "-" ? session.nip : "Belum Ada NIP"} &bull; Kelas Asuhan: {session.kelas || "-"}
                        </p>
                        {uploadingFoto && <span style={{ fontSize: "0.75rem", color: "var(--primary)", display: "block" }}>Mengunggah foto...</span>}
                        {fotoMessage && <span style={{ fontSize: "0.75rem", color: "var(--primary)", fontWeight: "bold", display: "block" }}>{fotoMessage}</span>}
                      </div>
                    </div>
                    
                    <div className="login-help-box" style={{ marginBottom: "2rem", display: "block" }}>
                      {session.role === "wali-kelas" ? (
                        <p>
                          Anda masuk sebagai <strong>Wali Kelas {session.kelas}</strong> (Mengampu: <strong>{session.subjects ? session.subjects.join(", ") : ""}</strong>). 
                          Anda memiliki hak akses penuh untuk menginput nilai harian, mengelola target KKM/Capaian Pembelajaran, 
                          mengelola bank soal ujian, serta mencetak lembar Rapor Siswa asuhan kelas Anda.
                        </p>
                      ) : (
                        <p>
                          Anda masuk sebagai <strong>Guru Mata Pelajaran {session.subjects ? session.subjects.join(", ") : ""}</strong>. 
                          Anda memiliki hak akses khusus untuk menginput nilai tugas dan ujian akhir siswa sekolah, 
                          serta mengelola target KKM dan bank soal ujian online.
                        </p>
                      )}
                    </div>

                    {/* WIDGET ABSENSI MANDIRI GURU */}
                    <div style={{ backgroundColor: "#f8fafc", padding: "1.5rem", borderRadius: "var(--radius-md)", border: "1px solid #e2e8f0", marginBottom: "2rem" }}>
                      <h4 style={{ fontWeight: 800, color: "var(--primary-dark)", fontSize: "1.05rem", margin: "0 0 0.5rem 0", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <svg className="tab-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--primary-dark)", display: "block" }}>
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12 6 12 12 16 14" />
                        </svg>
                        Absensi Mandiri Pendidik Harian
                      </h4>
                      <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: "0 0 1.25rem 0" }}>
                        Lakukan absensi mandiri kehadiran Anda hari ini. Perangkat Anda harus terhubung ke jaringan internet Wi-Fi resmi sekolah.
                      </p>

                      {absenMessage && (
                        <div className={`form-alert ${absenSuccess ? "success" : "error"}`} style={{ display: "block", marginBottom: "1rem", padding: "0.75rem", fontSize: "0.85rem" }}>
                          {absenMessage}
                        </div>
                      )}

                      <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", marginBottom: "1.25rem", maxWidth: "320px" }}>
                        <label style={{ fontSize: "0.82rem", fontWeight: "bold", color: "var(--primary-dark)" }}>
                          Jumlah Jam Pelajaran (JP) Diajar Hari Ini:
                        </label>
                        <select 
                          className="form-select"
                          value={checkInJp}
                          onChange={(e) => setCheckInJp(Number(e.target.value))}
                          style={{ padding: "0.4rem 0.75rem", fontSize: "0.85rem" }}
                        >
                          <option value={0}>0 JP (Tidak mengajar/piket)</option>
                          <option value={1}>1 JP</option>
                          <option value={2}>2 JP</option>
                          <option value={3}>3 JP</option>
                          <option value={4}>4 JP</option>
                          <option value={5}>5 JP</option>
                          <option value={6}>6 JP</option>
                          <option value={7}>7 JP</option>
                          <option value={8}>8 JP</option>
                          <option value={9}>9 JP</option>
                          <option value={10}>10 JP</option>
                        </select>
                      </div>

                      <div style={{ display: "flex", gap: "1rem" }}>
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={() => handleTeacherCheckIn("HADIR", checkInJp)}
                          disabled={absenLoading}
                          style={{ margin: 0, backgroundColor: "#22c55e", borderColor: "transparent", color: "white", display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
                        >
                          {absenLoading ? (
                            "Memproses..."
                          ) : (
                            <>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                <polyline points="22 4 12 14.01 9 11.01" />
                              </svg>
                              Absen Hadir di Sekolah
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline"
                          onClick={() => setActiveTab("sppd")}
                          style={{ margin: 0, color: "#3b82f6", borderColor: "#3b82f6", display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
                            <path d="M22 2L11 13" />
                            <polygon points="22 2 15 22 11 13 2 9 22 2" />
                          </svg>
                          Ajukan SPPD / Tugas Luar
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-3" style={{ gap: "1.5rem", marginBottom: "2.5rem" }}>
                      <div className="dash-card-premium">
                        <span style={{ fontSize: "0.8rem", textTransform: "uppercase", fontWeight: 700, color: "var(--text-muted)" }}>Peran Pendidik</span>
                        <h3 style={{ fontSize: "1.35rem", fontWeight: 800, color: "var(--primary-dark)", margin: "0.5rem 0 0 0" }}>
                          {session.role === "wali-kelas" ? `Wali Kelas ${session.kelas}` : "Guru Mapel"}
                        </h3>
                        <span style={{ fontSize: "0.85rem", color: "var(--primary)", marginTop: "0.5rem", fontWeight: "bold" }}>Akses Administrasi Penuh</span>
                      </div>

                      <div className="dash-card-premium accent">
                        <span style={{ fontSize: "0.8rem", textTransform: "uppercase", fontWeight: 700, color: "var(--text-muted)" }}>Mata Pelajaran</span>
                        <h3 style={{ fontSize: "1.35rem", fontWeight: 800, color: "#1d4ed8", margin: "0.5rem 0 0 0" }}>
                          {session.subjects ? session.subjects.length : 0} Bidang
                        </h3>
                        <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "0.5rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {session.subjects ? session.subjects.join(", ") : "-"}
                        </span>
                      </div>

                      <div className="dash-card-premium secondary">
                        <span style={{ fontSize: "0.8rem", textTransform: "uppercase", fontWeight: 700, color: "var(--text-muted)" }}>Siswa Asuhan</span>
                        <h3 style={{ fontSize: "1.35rem", fontWeight: 800, color: "var(--secondary-dark)", margin: "0.5rem 0 0 0" }}>
                          {session.role === "wali-kelas" ? `${students.length} Siswa` : "Multi Kelas"}
                        </h3>
                        <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>Kelas Aktif: {session.kelas || "Semua"}</span>
                      </div>
                    </div>

                    <h3 style={{ fontWeight: 700, color: "var(--primary-dark)", marginBottom: "1rem" }}>Daftar Pendidik Lainnya</h3>
                    <div className="portal-table-container">
                      <table className="portal-table">
                        <thead>
                          <tr>
                            <th>Nama Guru</th>
                            <th>Mata Pelajaran</th>
                            <th>Peran / Kelas Asuhan</th>
                          </tr>
                        </thead>
                        <tbody>
                          {teachers.map((t, idx) => (
                            <tr key={idx}>
                              <td><strong>{t.name}</strong><br /><span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>NIP: {t.nip}</span></td>
                              <td><span className="badge-info">{t.subject}</span></td>
                              <td>
                                <span style={{ fontWeight: 700, color: "var(--primary)" }}>
                                  {t.role === "wali-kelas" ? `Wali Kelas ${t.kelas}` : "Guru Mata Pelajaran"}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* TAB 2: INPUT NILAI */}
                {activeTab === "nilai" && (
                  <div className="no-print">
                    <span style={{ fontSize: "0.85rem", textTransform: "uppercase", fontWeight: 700, color: "var(--secondary)" }}>Input Nilai</span>
                    <h2 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--primary-dark)", marginBottom: "1rem" }}>
                      Input Nilai Mata Pelajaran: {activeSubject?.name}
                    </h2>

                    <div className="grid grid-3" style={{ maxWidth: "900px", gap: "1.5rem", marginBottom: "1.5rem" }}>
                      <div className="form-group">
                        <label className="form-label" style={{ fontWeight: 700 }}>1. Pilih Kelas</label>
                        <select 
                          className="form-select" 
                          value={filterClass}
                          onChange={(e) => { setFilterClass(e.target.value); setSelectedStudentNisn(""); setGradeMessage(""); }}
                        >
                          <option value="">-- Pilih Kelas --</option>
                          {uniqueClasses.map((c, idx) => (
                            <option value={c} key={idx}>{c}</option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group">
                        <label className="form-label" style={{ fontWeight: 700 }}>2. Pilih Semester</label>
                        <select 
                          className="form-select" 
                          value={selectedSemester}
                          onChange={(e) => handleSemesterChange(e.target.value)}
                        >
                          <option value="1">Semester 1 (X Ganjil)</option>
                          <option value="2">Semester 2 (X Genap)</option>
                          <option value="3">Semester 3 (XI Ganjil)</option>
                          <option value="4">Semester 4 (XI Genap)</option>
                          <option value="5">Semester 5 (XII Ganjil)</option>
                          <option value="6">Semester 6 (XII Genap)</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label className="form-label" style={{ fontWeight: 700 }}>3. Pilih Siswa</label>
                        <select 
                          className="form-select" 
                          value={selectedStudentNisn}
                          onChange={(e) => handleStudentSelectForGrade(e.target.value)}
                          disabled={!filterClass}
                        >
                          <option value="">-- Pilih Siswa --</option>
                          {getStudentsByFilterClass().map(s => (
                            <option value={s.nisn} key={s.nisn}>{s.name} (NISN: {s.nisn})</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Panel Bulk Input Excel (Hanya tampil jika Kelas sudah dipilih) */}
                    {filterClass && (
                      <div style={{
                        maxWidth: "900px",
                        backgroundColor: "#ecfdf5",
                        border: "1px solid #a7f3d0",
                        borderRadius: "var(--radius-md)",
                        padding: "1.25rem",
                        marginBottom: "1.5rem",
                        display: "flex",
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: "1.5rem",
                        color: "#065f46"
                      }}>
                        <div style={{ flex: 1 }}>
                          <h4 style={{ margin: 0, fontWeight: "bold", fontSize: "0.95rem", display: "flex", alignItems: "center", gap: "0.4rem", color: "#047857" }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                              <polyline points="14 2 14 8 20 8" />
                              <line x1="16" y1="13" x2="8" y2="13" />
                              <line x1="16" y1="17" x2="8" y2="17" />
                              <line x1="10" y1="9" x2="9" y2="9" />
                            </svg>
                            Input & Edit Nilai Massal via Excel (Kelas {filterClass})
                          </h4>
                          <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.8rem", color: "#065f46", opacity: 0.95 }}>
                            Unduh template Excel yang sudah memuat daftar siswa dan nilai yang ada, edit/isi nilainya secara offline, lalu unggah kembali berkas tersebut untuk disimpan sekaligus.
                          </p>
                        </div>
                        <div style={{ display: "flex", gap: "0.75rem", flexShrink: 0 }}>
                          <button 
                            type="button"
                            className="btn btn-secondary" 
                            style={{ 
                              display: "inline-flex", 
                              alignItems: "center", 
                              gap: "0.4rem", 
                              backgroundColor: "#ffffff", 
                              color: "#0f766e", 
                              border: "1px solid #0f766e",
                              fontWeight: 600,
                              fontSize: "0.85rem",
                              padding: "0.5rem 1rem",
                              borderRadius: "var(--radius-sm)",
                              cursor: "pointer"
                            }}
                            onClick={handleDownloadTemplateNilai}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                              <polyline points="7 10 12 15 17 10" />
                              <line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                            Unduh Template
                          </button>

                          <label 
                            className="btn btn-primary" 
                            style={{ 
                              display: "inline-flex", 
                              alignItems: "center", 
                              gap: "0.4rem", 
                              backgroundColor: "#d97706", 
                              borderColor: "#d97706",
                              color: "white",
                              fontWeight: 600,
                              fontSize: "0.85rem",
                              padding: "0.5rem 1rem",
                              borderRadius: "var(--radius-sm)",
                              cursor: "pointer",
                              margin: 0
                            }}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                              <polyline points="17 8 12 3 7 8" />
                              <line x1="12" y1="3" x2="12" y2="15" />
                            </svg>
                            Unggah Nilai Excel
                            <input 
                              type="file" 
                              accept=".xlsx, .xls" 
                              onChange={handleUploadTemplateNilai} 
                              style={{ display: "none" }} 
                            />
                          </label>
                        </div>
                      </div>
                    )}

                    {gradeMessage && (
                       <div className="form-alert success" style={{ display: "block", marginBottom: "1.5rem", maxWidth: "900px" }}>
                         {gradeMessage}
                       </div>
                     )}

                    {selectedStudentNisn && (
                      <form id="guru-input-nilai-form" style={{ maxWidth: "500px", backgroundColor: "var(--bg-alt)", padding: "2rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }} onSubmit={handleGradeSubmit}>
                        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "0.75rem" }}>
                          <button
                            type="button"
                            className="btn btn-outline"
                            style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem", display: "inline-flex", alignItems: "center", gap: "0.2rem", cursor: "pointer", borderColor: "var(--primary)", color: "var(--primary)" }}
                            onClick={async () => {
                              if (!selectedStudentNisn || !activeSubject || !filterClass) return;
                              const student = students.find(s => s.nisn === selectedStudentNisn);
                              if (!student) return;
                              const res = await getJournalGradesAverage(activeSubject.name, selectedSemester, filterClass);
                              if (res.success && res.averages && res.averages[student.id] !== undefined) {
                                const avg = res.averages[student.id];
                                setTugas1(avg);
                                setTugas2(avg);
                                alert(`Rata-rata nilai formatif harian ditemukan: ${avg}. Nilai Tugas 1 & 2 telah diupdate!`);
                              } else {
                                alert("Tidak ditemukan nilai formatif harian di jurnal untuk siswa ini.");
                              }
                            }}
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
                              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                            </svg>
                            Tarik Rata-rata Jurnal
                          </button>
                        </div>
                        <div className="form-group-row">
                          <div className="form-group">
                            <label htmlFor="input-tugas1" className="form-label">Nilai Tugas 1</label>
                            <input 
                              type="number" 
                              id="input-tugas1" 
                              className="form-input" 
                              min="0" 
                              max="100" 
                              value={tugas1} 
                              onChange={(e) => setTugas1(parseInt(e.target.value, 10))}
                              required 
                            />
                          </div>
                          
                          <div className="form-group" style={{ marginLeft: "1rem" }}>
                            <label htmlFor="input-tugas2" className="form-label">Nilai Tugas 2</label>
                            <input 
                              type="number" 
                              id="input-tugas2" 
                              className="form-input" 
                              min="0" 
                              max="100" 
                              value={tugas2} 
                              onChange={(e) => setTugas2(parseInt(e.target.value, 10))}
                              required 
                            />
                          </div>
                        </div>
                        
                        <div className="form-group-row" style={{ marginTop: "1rem" }}>
                          {checkIsOnline(school?.utsMode, students.find(s => s.nisn === selectedStudentNisn)?.kelas, "online") ? (
                            <div className="form-group">
                              <label className="form-label">Nilai UTS (Ujian Online)</label>
                              <input 
                                type="text" 
                                className="form-input" 
                                value={
                                  students.find(s => s.nisn === selectedStudentNisn)
                                    ?.grades?.find(g => g.subjectName === activeSubject?.name && g.semester === selectedSemester)
                                    ?.uts ?? "Belum Ujian"
                                } 
                                disabled 
                                style={{ backgroundColor: "#e2e8f0", fontWeight: "bold" }} 
                              />
                            </div>
                          ) : (
                            <div className="form-group">
                              <label htmlFor="input-uts" className="form-label">Nilai UTS</label>
                              <input 
                                type="number" 
                                id="input-uts" 
                                className="form-input" 
                                min="0" 
                                max="100" 
                                value={uts} 
                                onChange={(e) => setUts(e.target.value)}
                                placeholder="Belum UTS" 
                              />
                            </div>
                          )}

                          {checkIsOnline(school?.uasMode, students.find(s => s.nisn === selectedStudentNisn)?.kelas, "offline") ? (
                            <div className="form-group" style={{ marginLeft: "1rem" }}>
                              <label className="form-label">Nilai UAS (Ujian Online)</label>
                              <input 
                                type="text" 
                                className="form-input" 
                                value={
                                  students.find(s => s.nisn === selectedStudentNisn)
                                    ?.grades?.find(g => g.subjectName === activeSubject?.name && g.semester === selectedSemester)
                                    ?.uas ?? "Belum Ujian"
                                } 
                                disabled 
                                style={{ backgroundColor: "#e2e8f0", fontWeight: "bold" }} 
                              />
                            </div>
                          ) : (
                            <div className="form-group" style={{ marginLeft: "1rem" }}>
                              <label htmlFor="input-uas" className="form-label">Nilai UAS</label>
                              <input 
                                type="number" 
                                id="input-uas" 
                                className="form-input" 
                                min="0" 
                                max="100" 
                                value={uas} 
                                onChange={(e) => setUas(e.target.value)}
                                placeholder="Belum UAS" 
                              />
                            </div>
                          )}
                        </div>

                        {selectedSemester === "6" && (
                          <div className="form-group-row" style={{ marginTop: "1rem" }}>
                            {checkIsOnline(school?.pajMode, students.find(s => s.nisn === selectedStudentNisn)?.kelas, "offline") ? (
                              <div className="form-group" style={{ width: "100%" }}>
                                <label className="form-label">Nilai PAJ (Ujian Online)</label>
                                <input 
                                  type="text" 
                                  className="form-input" 
                                  value={
                                    students.find(s => s.nisn === selectedStudentNisn)
                                      ?.examSubmissions?.find(es => es.subjectName === activeSubject?.name && es.category === "PAJ" && es.semester === selectedSemester)
                                      ?.score ?? "Belum Ujian"
                                  } 
                                  disabled 
                                  style={{ backgroundColor: "#e2e8f0", fontWeight: "bold" }} 
                                />
                              </div>
                            ) : (
                              <div className="form-group" style={{ width: "100%" }}>
                                <label htmlFor="input-paj" className="form-label">Nilai PAJ</label>
                                <input 
                                  type="number" 
                                  id="input-paj" 
                                  className="form-input" 
                                  min="0" 
                                  max="100" 
                                  value={paj} 
                                  onChange={(e) => setPaj(e.target.value)}
                                  placeholder="Belum PAJ" 
                                />
                              </div>
                            )}
                          </div>
                        )}

                        <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: "1.5rem" }}>
                          Simpan Perubahan Nilai
                        </button>
                      </form>
                    )}
                  </div>
                )}

                {/* TAB 3: KKM & CP */}
                {activeTab === "kkm" && (
                  <div className="no-print" style={{ maxWidth: "700px" }}>
                    <span style={{ fontSize: "0.85rem", textTransform: "uppercase", fontWeight: 700, color: "var(--secondary)" }}>Target KKM & CP</span>
                    <h2 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--primary-dark)", marginBottom: "1rem" }}>
                      Kelola KKM & Capaian Pembelajaran ({activeSubject?.name})
                    </h2>

                    {kkmMessage && (
                      <div className="form-alert success" style={{ display: "block", marginBottom: "1.5rem" }}>
                        {kkmMessage}
                      </div>
                    )}

                    <form onSubmit={handleKkmSubmit}>
                      <div className="form-group" style={{ maxWidth: "200px" }}>
                        <label className="form-label">Nilai KKM Minimum</label>
                        <input 
                          type="number" 
                          className="form-input" 
                          min="0" 
                          max="100" 
                          value={kkm} 
                          onChange={(e) => setKkm(e.target.value)}
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
                      </div>

                      <div className="form-group" style={{ marginTop: "1rem" }}>
                        <label className="form-label">Capaian Nilai A (Amat Baik)</label>
                        <textarea 
                          className="form-textarea" 
                          value={cpA} 
                          onChange={(e) => setCpA(e.target.value)}
                          required
                        />
                      </div>

                      <div className="form-group" style={{ marginTop: "1rem" }}>
                        <label className="form-label">Capaian Nilai B (Baik)</label>
                        <textarea 
                          className="form-textarea" 
                          value={cpB} 
                          onChange={(e) => setCpB(e.target.value)}
                          required
                        />
                      </div>

                      <div className="form-group" style={{ marginTop: "1rem" }}>
                        <label className="form-label">Capaian Nilai C (Cukup)</label>
                        <textarea 
                          className="form-textarea" 
                          value={cpC} 
                          onChange={(e) => setCpC(e.target.value)}
                          required
                        />
                      </div>

                      <div className="form-group" style={{ marginTop: "1rem" }}>
                        <label className="form-label">Capaian Nilai D (Kurang)</label>
                        <textarea 
                          className="form-textarea" 
                          value={cpD} 
                          onChange={(e) => setCpD(e.target.value)}
                          required
                        />
                      </div>

                      <button type="submit" className="btn btn-primary" style={{ marginTop: "1.5rem" }}>
                        Simpan Target KKM & CP
                      </button>
                    </form>
                  </div>
                )}

                {/* TAB 4: BANK SOAL */}
                {activeTab === "soal" && (
                  <div className="no-print">
                    <span style={{ fontSize: "0.85rem", textTransform: "uppercase", fontWeight: 700, color: "var(--secondary)" }}>Bank Soal Ujian</span>
                    <h2 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--primary-dark)", marginBottom: "1rem" }}>
                      Kelola Soal Ujian Online: {activeSubject?.name}
                    </h2>

                    {/* BREADCRUMBS NAVIGASI FOLDER */}
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.5rem", fontSize: "0.9rem", color: "var(--text-muted)", flexWrap: "wrap", backgroundColor: "#f8fafc", padding: "0.75rem 1rem", borderRadius: "var(--radius-sm)", border: "1px solid #e2e8f0" }}>
                      <button 
                        type="button" 
                        onClick={() => { setFolderKelas(null); setFolderSemester(null); setFolderKategori(null); setEditingQuestionId(null); }}
                        style={{ background: "none", border: "none", color: folderKelas === null ? "var(--primary)" : "var(--text-muted)", fontWeight: folderKelas === null ? 700 : 500, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "0.3rem", padding: 0 }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
                          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                        </svg>
                        Bank Soal
                      </button>
                      
                      {folderKelas && (
                        <>
                          <span style={{ color: "#94a3b8" }}>➔</span>
                          <button 
                            type="button" 
                            onClick={() => { setFolderSemester(null); setFolderKategori(null); setEditingQuestionId(null); }}
                            style={{ background: "none", border: "none", color: folderSemester === null ? "var(--primary)" : "var(--text-muted)", fontWeight: folderSemester === null ? 700 : 500, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "0.3rem", padding: 0 }}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
                              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                            </svg>
                            Kelas {folderKelas}
                          </button>
                        </>
                      )}
                      
                      {folderSemester && (
                        <>
                          <span style={{ color: "#94a3b8" }}>➔</span>
                          <button 
                            type="button" 
                            onClick={() => { setFolderKategori(null); setEditingQuestionId(null); }}
                            style={{ background: "none", border: "none", color: folderKategori === null ? "var(--primary)" : "var(--text-muted)", fontWeight: folderKategori === null ? 700 : 500, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "0.3rem", padding: 0 }}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
                              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                            </svg>
                            Semester {folderSemester} ({[1, 3, 5].includes(Number(folderSemester)) ? "Ganjil" : "Genap"})
                          </button>
                        </>
                      )}
                      
                      {folderKategori && (
                        <>
                          <span style={{ color: "#94a3b8" }}>➔</span>
                          <span style={{ color: "var(--primary-dark)", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                              <polyline points="14 2 14 8 20 8" />
                              <line x1="16" y1="13" x2="8" y2="13" />
                              <line x1="16" y1="17" x2="8" y2="17" />
                              <line x1="10" y1="9" x2="9" y2="9" />
                            </svg>
                            {folderKategori}
                          </span>
                        </>
                      )}
                    </div>

                    {(folderKelas === null || folderSemester === null || folderKategori === null) ? (
                      <div style={{ animation: "fadeIn 0.3s ease" }}>
                        {folderKelas === null && (
                          <div>
                            <h3 style={{ fontWeight: 700, color: "var(--primary-dark)", marginBottom: "1rem" }}>Pilih Jenjang Kelas</h3>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1.25rem" }}>
                              {[
                                { id: "X", name: "kelas x", desc: "Kelola soal ujian siswa kelas x" },
                                { id: "XI", name: "kelas xi", desc: "Kelola soal ujian siswa kelas xi" },
                                { id: "XII", name: "kelas xii", desc: "Kelola soal ujian siswa kelas xii" }
                              ].map(c => (
                                <div 
                                  key={c.id} 
                                  onClick={() => setFolderKelas(c.id)}
                                  style={{ border: "1px solid var(--border-color)", padding: "1.5rem", borderRadius: "var(--radius-md)", backgroundColor: "white", cursor: "pointer", display: "flex", alignItems: "center", gap: "1rem", transition: "all 0.25s", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}
                                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--primary)"; e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.05)"; }}
                                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border-color)"; e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.02)"; }}
                                >
                                  <div style={{ color: "#d97706", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <svg width="36" height="36" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
                                      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                                    </svg>
                                  </div>
                                  <div>
                                    <h4 style={{ margin: 0, fontWeight: 700, fontSize: "1.05rem", color: "var(--primary-dark)" }}>{c.name}</h4>
                                    <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{c.desc}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {folderKelas !== null && folderSemester === null && (
                          <div>
                            <h3 style={{ fontWeight: 700, color: "var(--primary-dark)", marginBottom: "1rem" }}>Pilih Semester (Kelas {folderKelas})</h3>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1.25rem" }}>
                              {(folderKelas === "X" ? [
                                { id: "1", name: "Semester 1", desc: "Semester Ganjil kelas x" },
                                { id: "2", name: "Semester 2", desc: "Semester Genap kelas x" }
                              ] : folderKelas === "XI" ? [
                                { id: "3", name: "Semester 3", desc: "Semester Ganjil kelas xi" },
                                { id: "4", name: "Semester 4", desc: "Semester Genap kelas xi" }
                              ] : [
                                { id: "5", name: "Semester 5", desc: "Semester Ganjil kelas xii" },
                                { id: "6", name: "Semester 6", desc: "Semester Genap kelas xii" }
                              ]).map(s => (
                                <div 
                                  key={s.id} 
                                  onClick={() => setFolderSemester(s.id)}
                                  style={{ border: "1px solid var(--border-color)", padding: "1.5rem", borderRadius: "var(--radius-md)", backgroundColor: "white", cursor: "pointer", display: "flex", alignItems: "center", gap: "1rem", transition: "all 0.25s", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}
                                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--primary)"; e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.05)"; }}
                                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border-color)"; e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.02)"; }}
                                >
                                  <div style={{ color: "#d97706", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <svg width="36" height="36" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
                                      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                                    </svg>
                                  </div>
                                  <div>
                                    <h4 style={{ margin: 0, fontWeight: 700, fontSize: "1.05rem", color: "var(--primary-dark)" }}>{s.name}</h4>
                                    <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{s.desc}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {folderKelas !== null && folderSemester !== null && folderKategori === null && (
                          <div>
                            <h3 style={{ fontWeight: 700, color: "var(--primary-dark)", marginBottom: "1rem" }}>Pilih Jenis Ujian (Semester {folderSemester})</h3>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1.25rem" }}>
                              {[
                                { id: "UTS", name: "UTS", desc: "Ujian Tengah Semester" },
                                { id: "UAS", name: "UAS", desc: "Ujian Akhir Semester" },
                                ...(String(folderSemester) === "6" ? [{ id: "PAJ", name: "PAJ", desc: "Penilaian Akhir Jenjang" }] : [])
                              ].map(c => (
                                <div 
                                  key={c.id} 
                                  onClick={() => setFolderKategori(c.id)}
                                  style={{ border: "1px solid var(--border-color)", padding: "1.5rem", borderRadius: "var(--radius-md)", backgroundColor: "white", cursor: "pointer", display: "flex", alignItems: "center", gap: "1rem", transition: "all 0.25s", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}
                                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--primary)"; e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.05)"; }}
                                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border-color)"; e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.02)"; }}
                                >
                                  <div style={{ color: c.id === "PAJ" ? "var(--primary)" : "#d97706", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <svg width="36" height="36" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
                                      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                                    </svg>
                                  </div>
                                  <div>
                                    <h4 style={{ margin: 0, fontWeight: 700, fontSize: "1.05rem", color: "var(--primary-dark)" }}>{c.name}</h4>
                                    <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{c.desc}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div style={{ animation: "fadeIn 0.3s ease" }}>
                        {/* Impor Soal Massal */}
                        <div style={{ display: "flex", gap: "1rem", marginBottom: "2rem", backgroundColor: "white", padding: "1rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", alignItems: "center" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--primary)", display: "block" }}>
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                              <polyline points="17 8 12 3 7 8" />
                              <line x1="12" y1="3" x2="12" y2="15" />
                            </svg>
                            <div>
                              <h4 style={{ margin: 0, fontWeight: 700, color: "var(--primary-dark)", fontSize: "0.95rem" }}>Impor Soal Massal (Excel)</h4>
                              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Gunakan berkas Excel untuk mengunggah soal langsung ke folder aktif ini.</span>
                            </div>
                          </div>
                          
                          <div style={{ marginLeft: "auto", display: "flex", gap: "0.75rem" }}>
                            <button className="btn btn-outline" style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }} onClick={unduhTemplateExcelSoal}>
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
                              Unggah File Excel (.xlsx)
                              <input 
                                type="file" 
                                accept=".xlsx, .xls" 
                                onChange={handleExcelImportSoal} 
                                style={{ display: "none" }} 
                              />
                            </label>
                          </div>
                        </div>

                        <div className="grid grid-2" style={{ gap: "2rem", alignItems: "start" }}>
                          {/* Sisi Kiri: Tambah Soal */}
                          <div>
                            <h3 style={{ fontWeight: 700, color: "var(--primary-dark)", marginBottom: "1rem" }}>Form Tambah Soal Baru</h3>
                            
                            {/* Target Alokasi Ujian Info Card */}
                            <div style={{ backgroundColor: "white", border: "1px solid var(--border-color)", padding: "1rem", borderRadius: "var(--radius-md)", marginBottom: "1.5rem" }}>
                              <h4 style={{ margin: "0 0 0.5rem 0", fontWeight: 800, color: "var(--primary-dark)", fontSize: "0.95rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                <svg className="tab-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--primary)", display: "block" }}>
                                  <circle cx="12" cy="12" r="10" />
                                  <circle cx="12" cy="12" r="6" />
                                  <circle cx="12" cy="12" r="2" />
                                </svg>
                                Target Alokasi Ujian: Kelas {folderKelas} &gt; Semester {folderSemester} &gt; {folderKategori}
                              </h4>
                              {(() => {
                                const curQs = questions.filter(q => q.subject === activeSubject?.name && q.kelas === folderKelas && q.category === soalCategory && q.semester === soalSemester);
                                const pg = curQs.filter(q => q.type === "PG").length;
                                const pgk = curQs.filter(q => q.type === "PGK").length;
                                const match = curQs.filter(q => q.type === "MENJODOHKAN").length;
                                const isian = curQs.filter(q => q.type === "ISIAN").length;
                                const essay = curQs.filter(q => q.type === "ESSAY").length;
                                const total = curQs.length;

                                if (soalCategory === "PAJ") {
                                  return (
                                    <div style={{ fontSize: "0.85rem", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                                        <span>Pilihan Ganda (PG):</span>
                                        <strong style={{ color: pg === 45 ? "#22c55e" : "inherit" }}>{pg} / 45 Soal</strong>
                                      </div>
                                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                                        <span>Essay / Uraian:</span>
                                        <strong style={{ color: essay === 5 ? "#22c55e" : "inherit" }}>{essay} / 5 Soal</strong>
                                      </div>
                                      <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "0.25rem", marginTop: "0.25rem", display: "flex", justifyContent: "space-between", fontWeight: "bold", color: total === 50 ? "#22c55e" : "var(--primary)" }}>
                                        <span>Total Soal:</span>
                                        <span>{total} / 50 Soal</span>
                                      </div>
                                    </div>
                                  );
                                } else {
                                  return (
                                    <div style={{ fontSize: "0.85rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                                        <span>Pilihan Ganda (PG):</span>
                                        <strong>{pg} Soal</strong>
                                      </div>
                                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                                        <span>PG Kompleks (PGK):</span>
                                        <strong>{pgk} Soal</strong>
                                      </div>
                                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                                        <span>Menjodohkan:</span>
                                        <strong>{match} Soal</strong>
                                      </div>
                                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                                        <span>Isian Singkat:</span>
                                        <strong>{isian} Soal</strong>
                                      </div>
                                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                                        <span>Essay / Uraian:</span>
                                        <strong>{essay} Soal</strong>
                                      </div>
                                      <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", color: "var(--primary)" }}>
                                        <span>Total Soal:</span>
                                        <span>{total} Soal</span>
                                      </div>
                                    </div>
                                  );
                                }
                              })()}
                            </div>

                            {soalMessage && (
                              <div className="form-alert success" style={{ display: "block", marginBottom: "1.5rem" }}>
                                {soalMessage}
                              </div>
                            )}

                            <form id="question-form-container" onSubmit={handleQuestionSubmit} style={{ backgroundColor: "var(--bg-alt)", padding: "1.5rem", borderRadius: "var(--radius-md)", border: editingQuestionId ? "2px solid var(--secondary)" : "1px solid var(--border-color)", display: "flex", flexDirection: "column", gap: "1rem", transition: "var(--transition)" }}>
                              {editingQuestionId && (
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "var(--secondary-light)", padding: "0.75rem 1rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--secondary)", color: "var(--secondary-dark)" }}>
                                  <span style={{ fontWeight: "bold", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                                    ⚠️ MODE EDIT SOAL AKTIF
                                  </span>
                                  <button type="button" onClick={handleCancelEdit} className="btn btn-outline" style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem", borderColor: "var(--secondary-dark)", color: "var(--secondary-dark)", cursor: "pointer", background: "white" }}>
                                    Batal Edit
                                  </button>
                                </div>
                              )}
                              
                              {/* Pengaturan Kategori & Tipe */}
                              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                                <div className="form-group">
                                  <label className="form-label" style={{ fontWeight: 700 }}>Kategori Ujian</label>
                                  <select 
                                    className="form-select" 
                                    value={soalCategory} 
                                    disabled={true}
                                  >
                                    <option value="UTS">UTS (Tengah Semester)</option>
                                    <option value="UAS">UAS (Akhir Semester)</option>
                                    <option value="PAJ">PAJ (Penilaian Akhir Jenjang)</option>
                                  </select>
                                </div>
                                <div className="form-group">
                                  <label className="form-label" style={{ fontWeight: 700 }}>Tipe Soal</label>
                                  <select className="form-select" value={soalType} onChange={(e) => setSoalType(e.target.value)}>
                                    <option value="PG">Pilihan Ganda (Single)</option>
                                    {soalCategory !== "PAJ" && <option value="PGK">Pilihan Ganda Kompleks (Multi)</option>}
                                    {soalCategory !== "PAJ" && <option value="MENJODOHKAN">Menjodohkan</option>}
                                    {soalCategory !== "PAJ" && <option value="ISIAN">Isian Singkat</option>}
                                    <option value="ESSAY">Essay / Uraian</option>
                                  </select>
                                </div>
                              </div>

                              {/* Stimulus Soal (Grup) */}
                              <div style={{ border: "1px dashed var(--border-color)", padding: "1rem", borderRadius: "var(--radius-sm)", backgroundColor: "white" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                                  <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--primary-dark)" }}>Acuan Teks/Gambar (Opsional)</span>
                                  <label className="switch" style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                                    <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Gunakan Stimulus Grup</span>
                                    <input 
                                      type="checkbox" 
                                      checked={isGroupQuestion} 
                                      onChange={(e) => {
                                        setIsGroupQuestion(e.target.checked);
                                        if (e.target.checked) {
                                          setSelectedGroupId("new");
                                        } else {
                                          setSelectedGroupId("");
                                        }
                                      }}
                                    />
                                  </label>
                                </div>

                                {isGroupQuestion && (
                                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginTop: "0.75rem" }}>
                                    <div className="form-group">
                                      <label className="form-label" style={{ fontSize: "0.8rem" }}>Pilih Grup Acuan</label>
                                      <select 
                                        className="form-select" 
                                        value={selectedGroupId} 
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          setSelectedGroupId(val);
                                          if (val !== "new" && val !== "") {
                                            const matchGroup = questions.find(q => q.groupId === val);
                                            if (matchGroup) {
                                              setNewGroupText(matchGroup.groupText || "");
                                              setNewGroupImagePath(matchGroup.groupImagePath || "");
                                            }
                                          } else {
                                            setNewGroupText("");
                                            setNewGroupImagePath("");
                                          }
                                        }}
                                      >
                                        <option value="new">+ Buat Acuan Stimulus Baru</option>
                                        {Object.values(
                                          questions.reduce((groups, q) => {
                                            if (q.groupId && q.subject === activeSubject?.name && q.kelas === folderKelas && q.category === soalCategory && String(q.semester) === String(soalSemester)) {
                                              groups[q.groupId] = {
                                                groupId: q.groupId,
                                                groupText: q.groupText || "",
                                                groupImagePath: q.groupImagePath || ""
                                              };
                                            }
                                            return groups;
                                          }, {})
                                        ).map(g => (
                                          <option key={g.groupId} value={g.groupId}>
                                            {g.groupText ? g.groupText.substring(0, 40) + "..." : "Grup Gambar (" + g.groupId + ")"}
                                          </option>
                                        ))}
                                      </select>
                                    </div>

                                    {selectedGroupId === "new" ? (
                                      <>
                                        <div className="form-group">
                                          <label className="form-label" style={{ fontSize: "0.8rem" }}>Teks Stimulus Baru</label>
                                          <textarea 
                                            className="form-control" 
                                            rows="3" 
                                            placeholder="Masukkan wacana/stimulus cerita acuan..." 
                                            value={newGroupText} 
                                            onChange={(e) => setNewGroupText(e.target.value)} 
                                            style={{ fontSize: "0.85rem" }}
                                          />
                                        </div>
                                        <div className="form-group">
                                          <label className="form-label" style={{ fontSize: "0.8rem" }}>Gambar Stimulus Baru</label>
                                          <div style={{ display: "flex", gap: "0.5rem" }}>
                                            <input 
                                              type="file" 
                                              accept="image/*" 
                                              onChange={handleUploadGroupImage} 
                                              style={{ fontSize: "0.85rem" }}
                                            />
                                          </div>
                                          {newGroupImagePath && (
                                            <img src={newGroupImagePath} style={{ maxHeight: "80px", marginTop: "0.5rem", display: "block", borderRadius: "4px" }} alt="Acuan" />
                                          )}
                                        </div>
                                      </>
                                    ) : (
                                      <div style={{ backgroundColor: "#f1f5f9", padding: "0.75rem", borderRadius: "4px", fontSize: "0.85rem", color: "#475569" }}>
                                        <strong>Wacana Aktif:</strong>
                                        <p style={{ margin: "0.25rem 0 0 0", whiteSpace: "pre-wrap", maxHeight: "100px", overflowY: "auto" }}>
                                          {newGroupText || "(Hanya gambar acuan)"}
                                        </p>
                                        {newGroupImagePath && (
                                          <img src={newGroupImagePath} style={{ maxHeight: "80px", marginTop: "0.5rem", display: "block", borderRadius: "4px" }} alt="Acuan" />
                                        )}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>

                              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                                <div className="form-group">
                                  <label className="form-label" style={{ fontWeight: 700 }}>Target Semester</label>
                                  <select 
                                    className="form-select" 
                                    value={soalSemester} 
                                    disabled={true}
                                  >
                                    <option value="1">Semester 1 (kelas x Ganjil)</option>
                                    <option value="2">Semester 2 (kelas x Genap)</option>
                                    <option value="3">Semester 3 (kelas xi Ganjil)</option>
                                    <option value="4">Semester 4 (kelas xi Genap)</option>
                                    <option value="5">Semester 5 (kelas xii Ganjil)</option>
                                    <option value="6">Semester 6 (kelas xii Genap)</option>
                                  </select>
                                </div>
                                <div className="form-group">
                                  <label className="form-label" style={{ fontWeight: 700 }}>Target Kelas</label>
                                  <select 
                                    className="form-select" 
                                    value={soalKelas} 
                                    disabled={true}
                                  >
                                    <option value="X">kelas x</option>
                                    <option value="XI">kelas xi</option>
                                    <option value="XII">kelas xii</option>
                                  </select>
                                </div>
                              </div>

                              {/* Pertanyaan */}
                              <div className="form-group">
                                <label className="form-label" style={{ fontWeight: 700 }}>Pertanyaan Soal</label>
                                <textarea 
                                  className="form-control" 
                                  rows="3" 
                                  placeholder="Tuliskan isi pertanyaan soal..." 
                                  value={newQuestion} 
                                  onChange={(e) => setNewQuestion(e.target.value)} 
                                  required
                                />
                              </div>

                              <div className="form-group">
                                <label className="form-label" style={{ fontWeight: 700 }}>Gambar Pendukung (Opsional)</label>
                                <input type="file" accept="image/*" onChange={handleUploadQuestionImageFile} />
                                {questionImage && (
                                  <div style={{ marginTop: "0.5rem", position: "relative", display: "inline-block" }}>
                                    <img src={questionImage} alt="Soal" style={{ maxHeight: "100px", borderRadius: "4px" }} />
                                    <button type="button" onClick={() => setQuestionImage("")} style={{ position: "absolute", top: "-5px", right: "-5px", backgroundColor: "#ef4444", color: "white", border: "none", borderRadius: "50%", width: "18px", height: "18px", fontSize: "10px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                                  </div>
                                )}
                              </div>

                              {/* Tipe: Pilihan Ganda (PG) */}
                              {soalType === "PG" && (
                                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", borderTop: "1px solid var(--border-color)", paddingTop: "1rem" }}>
                                  <span style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--primary-dark)" }}>Pilihan Ganda & Kunci Jawaban</span>
                                  {["A", "B", "C", "D"].map((opt, idx) => {
                                    const val = [choiceA, choiceB, choiceC, choiceD][idx];
                                    const imgVal = [choiceAImage, choiceBImage, choiceCImage, choiceDImage][idx];
                                    const setVal = [setChoiceA, setChoiceB, setChoiceC, setChoiceD][idx];
                                    const setImgVal = [setChoiceAImage, setChoiceBImage, setChoiceCImage, setChoiceDImage][idx];
                                    return (
                                      <div key={opt} style={{ display: "flex", flexDirection: "column", gap: "0.4rem", padding: "0.75rem", backgroundColor: "white", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                          <input 
                                            type="radio" 
                                            name="correct-choice" 
                                            checked={correct === idx} 
                                            onChange={() => setCorrect(idx)} 
                                            required
                                          />
                                          <strong style={{ minWidth: "15px" }}>{opt}.</strong>
                                          <input 
                                            type="text" 
                                            className="form-control" 
                                            placeholder={`Teks pilihan ${opt}...`} 
                                            value={val} 
                                            onChange={(e) => setVal(e.target.value)} 
                                            required
                                          />
                                        </div>
                                        <div style={{ paddingLeft: "1.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Gambar Opsi:</span>
                                          <input 
                                            type="file" 
                                            accept="image/*" 
                                            style={{ fontSize: "0.75rem" }} 
                                            onChange={(e) => handleUploadChoiceImage(e, setImgVal)} 
                                          />
                                          {imgVal && (
                                            <div style={{ position: "relative" }}>
                                              <img src={imgVal} style={{ height: "30px", borderRadius: "2px" }} alt="Opsi" />
                                              <button type="button" onClick={() => setImgVal("")} style={{ position: "absolute", top: "-5px", right: "-5px", backgroundColor: "#ef4444", color: "white", border: "none", borderRadius: "50%", width: "12px", height: "12px", fontSize: "8px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}

                              {/* Tipe: Pilihan Ganda Kompleks (PGK) */}
                              {soalType === "PGK" && (
                                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", borderTop: "1px solid var(--border-color)", paddingTop: "1rem" }}>
                                  <span style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--primary-dark)" }}>Pilihan Ganda Kompleks (Bisa Pilih lebih dari 1 Jawaban Benar)</span>
                                  {["A", "B", "C", "D"].map((opt, idx) => {
                                    const val = [choiceA, choiceB, choiceC, choiceD][idx];
                                    const imgVal = [choiceAImage, choiceBImage, choiceCImage, choiceDImage][idx];
                                    const setVal = [setChoiceA, setChoiceB, setChoiceC, setChoiceD][idx];
                                    const setImgVal = [setChoiceAImage, setChoiceBImage, setChoiceCImage, setChoiceDImage][idx];
                                    const isChecked = correctChoices.includes(idx);
                                    return (
                                      <div key={opt} style={{ display: "flex", flexDirection: "column", gap: "0.4rem", padding: "0.75rem", backgroundColor: "white", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                          <input 
                                            type="checkbox" 
                                            checked={isChecked} 
                                            onChange={(e) => {
                                              if (e.target.checked) {
                                                setCorrectChoices([...correctChoices, idx]);
                                              } else {
                                                setCorrectChoices(correctChoices.filter(c => c !== idx));
                                              }
                                            }}
                                          />
                                          <strong style={{ minWidth: "15px" }}>{opt}.</strong>
                                          <input 
                                            type="text" 
                                            className="form-control" 
                                            placeholder={`Teks pilihan ${opt}...`} 
                                            value={val} 
                                            onChange={(e) => setVal(e.target.value)} 
                                            required
                                          />
                                        </div>
                                        <div style={{ paddingLeft: "1.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Gambar Opsi:</span>
                                          <input 
                                            type="file" 
                                            accept="image/*" 
                                            style={{ fontSize: "0.75rem" }} 
                                            onChange={(e) => handleUploadChoiceImage(e, setImgVal)} 
                                          />
                                          {imgVal && (
                                            <div style={{ position: "relative" }}>
                                              <img src={imgVal} style={{ height: "30px", borderRadius: "2px" }} alt="Opsi" />
                                              <button type="button" onClick={() => setImgVal("")} style={{ position: "absolute", top: "-5px", right: "-5px", backgroundColor: "#ef4444", color: "white", border: "none", borderRadius: "50%", width: "12px", height: "12px", fontSize: "8px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}

                              {/* Tipe: Menjodohkan */}
                              {soalType === "MENJODOHKAN" && (
                                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", borderTop: "1px solid var(--border-color)", paddingTop: "1rem" }}>
                                  <span style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--primary-dark)" }}>Pasangan Soal Menjodohkan</span>
                                  {[1, 2, 3, 4].map((num) => {
                                    const left = [matchLeft1, matchLeft2, matchLeft3, matchLeft4][num-1];
                                    const leftImg = [matchLeft1Image, matchLeft2Image, matchLeft3Image, matchLeft4Image][num-1];
                                    const right = [matchRight1, matchRight2, matchRight3, matchRight4][num-1];
                                    const rightImg = [matchRight1Image, matchRight2Image, matchRight3Image, matchRight4Image][num-1];

                                    const setLeft = [setMatchLeft1, setMatchLeft2, setMatchLeft3, setMatchLeft4][num-1];
                                    const setLeftImg = [setMatchLeft1Image, setMatchLeft2Image, setMatchLeft3Image, setMatchLeft4Image][num-1];
                                    const setRight = [setMatchRight1, setMatchRight2, setMatchRight3, setMatchRight4][num-1];
                                    const setRightImg = [setMatchRight1Image, setMatchRight2Image, setMatchRight3Image, setMatchRight4Image][num-1];

                                    return (
                                      <div key={num} style={{ display: "flex", flexDirection: "column", gap: "0.75rem", padding: "1rem", backgroundColor: "white", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)" }}>
                                        <span style={{ fontWeight: "bold", fontSize: "0.8rem", color: "var(--secondary-dark)" }}>Pasangan #{num}</span>
                                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                                          {/* Sisi Kiri (Soal) */}
                                          <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                                            <input 
                                              type="text" 
                                              className="form-control" 
                                              placeholder={`Soal kiri #${num}...`} 
                                              value={left} 
                                              onChange={(e) => setLeft(e.target.value)} 
                                              required={num === 1}
                                            />
                                            <input 
                                              type="file" 
                                              accept="image/*" 
                                              style={{ fontSize: "0.7rem" }} 
                                              onChange={(e) => handleUploadChoiceImage(e, setLeftImg)} 
                                            />
                                            {leftImg && (
                                              <div style={{ position: "relative", display: "inline-block" }}>
                                                <img src={leftImg} style={{ height: "30px", borderRadius: "2px" }} alt="Left" />
                                                <button type="button" onClick={() => setLeftImg("")} style={{ position: "absolute", top: "-5px", right: "-5px", backgroundColor: "#ef4444", color: "white", border: "none", borderRadius: "50%", width: "12px", height: "12px", fontSize: "8px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                                              </div>
                                            )}
                                          </div>
                                          {/* Sisi Kanan (Jawaban) */}
                                          <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                                            <input 
                                              type="text" 
                                              className="form-control" 
                                              placeholder={`Pasangan kanan #${num}...`} 
                                              value={right} 
                                              onChange={(e) => setRight(e.target.value)} 
                                              required={num === 1}
                                            />
                                            <input 
                                              type="file" 
                                              accept="image/*" 
                                              style={{ fontSize: "0.7rem" }} 
                                              onChange={(e) => handleUploadChoiceImage(e, setRightImg)} 
                                            />
                                            {rightImg && (
                                              <div style={{ position: "relative", display: "inline-block" }}>
                                                <img src={rightImg} style={{ height: "30px", borderRadius: "2px" }} alt="Right" />
                                                <button type="button" onClick={() => setRightImg("")} style={{ position: "absolute", top: "-5px", right: "-5px", backgroundColor: "#ef4444", color: "white", border: "none", borderRadius: "50%", width: "12px", height: "12px", fontSize: "8px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                  <div className="form-group">
                                    <label className="form-label" style={{ fontSize: "0.8rem", fontWeight: 700 }}>Petunjuk Pengerjaan Pasangan Soal</label>
                                    <input 
                                      type="text" 
                                      className="form-control" 
                                      placeholder="Contoh: Hubungkan dengan menarik garis..." 
                                      value={correctAnswer} 
                                      onChange={(e) => setCorrectAnswer(e.target.value)} 
                                    />
                                  </div>
                                </div>
                              )}

                              {/* Tipe: Isian Singkat */}
                              {soalType === "ISIAN" && (
                                <div className="form-group" style={{ borderTop: "1px solid var(--border-color)", paddingTop: "1rem" }}>
                                  <label className="form-label" style={{ fontWeight: 700 }}>Kunci Jawaban Singkat</label>
                                  <input 
                                    type="text" 
                                    className="form-control" 
                                    placeholder="Tulis kunci jawaban singkat yang tepat..." 
                                    value={correctAnswer} 
                                    onChange={(e) => setCorrectAnswer(e.target.value)} 
                                    required
                                  />
                                </div>
                              )}

                              {/* Tipe: Essay / Uraian */}
                              {soalType === "ESSAY" && (
                                <div className="form-group" style={{ borderTop: "1px solid var(--border-color)", paddingTop: "1rem" }}>
                                  <label className="form-label" style={{ fontWeight: 700 }}>Pedoman Penskoran / Kunci Essay</label>
                                  <textarea 
                                    className="form-control" 
                                    rows="2" 
                                    placeholder="Tulis kriteria jawaban atau pedoman penskoran..." 
                                    value={correctAnswer} 
                                    onChange={(e) => setCorrectAnswer(e.target.value)} 
                                    required
                                  />
                                </div>
                              )}

                              <button type="submit" className="btn btn-primary" style={{ marginTop: "1rem" }}>
                                {editingQuestionId ? "Simpan Perubahan Soal" : "Simpan Soal Baru"}
                              </button>
                            </form>
                          </div>

                          {/* Sisi Kanan: Daftar Soal Terpilih */}
                          <div>
                            <h3 style={{ fontWeight: 700, color: "var(--primary-dark)", marginBottom: "1rem" }}>
                              Bank Soal {activeSubject?.name} Aktif
                            </h3>
                            
                            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                              {questions.filter(q => q.subject === activeSubject?.name && q.kelas === folderKelas && String(q.semester) === String(folderSemester) && q.category === folderKategori).length === 0 ? (
                                <p style={{ fontStyle: "italic", color: "var(--text-muted)" }}>Belum ada soal ujian {activeSubject?.name} di bank soal untuk folder ini.</p>
                              ) : (
                                questions.filter(q => q.subject === activeSubject?.name && q.kelas === folderKelas && String(q.semester) === String(folderSemester) && q.category === folderKategori).map((q, idx) => (
                                  <div key={q.id} style={{ border: "1px solid var(--border-color)", padding: "1rem", borderRadius: "var(--radius-md)", backgroundColor: "white", position: "relative", animation: "fadeIn 0.2s ease" }}>
                                    <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap", marginBottom: "0.5rem" }}>
                                      <span className="badge-info" style={{ fontSize: "0.7rem", backgroundColor: "var(--primary-light)", color: "var(--primary-dark)" }}>
                                        {q.category || "UTS"}
                                      </span>
                                      <span className="badge-info" style={{ fontSize: "0.7rem", backgroundColor: "#f3f4f6", color: "#374151" }}>
                                        Semester {q.semester || "1"}
                                      </span>
                                      <span className="badge-info" style={{ fontSize: "0.7rem", backgroundColor: q.type === "PG" ? "#e0f2fe" : q.type === "PGK" ? "#dcfce7" : q.type === "MENJODOHKAN" ? "#fef3c7" : q.type === "ISIAN" ? "#ecfdf5" : "#e0e7ff", color: q.type === "PG" ? "#0369a1" : q.type === "PGK" ? "#15803d" : q.type === "MENJODOHKAN" ? "#b45309" : q.type === "ISIAN" ? "#047857" : "#4338ca" }}>
                                        {q.type === "PG" ? "Pilihan Ganda" : q.type === "PGK" ? "PG Kompleks" : q.type === "MENJODOHKAN" ? "Menjodohkan" : q.type === "ISIAN" ? "Isian Singkat" : "Essay"}
                                      </span>
                                    </div>

                                    {q.groupId && (q.groupText || q.groupImagePath) && (
                                      <div style={{ backgroundColor: "#f8fafc", borderLeft: "4px solid var(--secondary)", padding: "0.75rem 1rem", borderRadius: "4px", marginBottom: "0.75rem", fontSize: "0.85rem", color: "#475569" }}>
                                        <strong style={{ display: "flex", alignItems: "center", gap: "0.25rem", marginBottom: "0.25rem", color: "var(--secondary-dark)" }}>
                                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
                                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                            <polyline points="14 2 14 8 20 8" />
                                            <line x1="16" y1="13" x2="8" y2="13" />
                                            <line x1="16" y1="17" x2="8" y2="17" />
                                            <line x1="10" y1="9" x2="9" y2="9" />
                                          </svg>
                                          Teks / Gambar Acuan Grup:
                                        </strong>
                                        {q.groupImagePath && (
                                          <img src={q.groupImagePath} alt="Stimulus" style={{ maxHeight: "80px", display: "block", marginTop: "0.5rem", marginBottom: "0.5rem", borderRadius: "4px", border: "1px solid #e2e8f0" }} />
                                        )}
                                        {q.groupText && (
                                          <p style={{ margin: 0, whiteSpace: "pre-wrap", fontStyle: "italic", maxHeight: "100px", overflowY: "auto", lineHeight: "1.4" }}>
                                            {q.groupText}
                                          </p>
                                        )}
                                      </div>
                                    )}

                                    <div style={{ fontWeight: 700, color: "var(--primary-dark)", paddingRight: "3.5rem", fontSize: "0.95rem", lineHeight: "1.4", whiteSpace: "pre-wrap" }}>
                                      {idx + 1}. {q.question}
                                    </div>

                                    {q.imagePath && (
                                      <div style={{ marginTop: "0.5rem" }}>
                                        <img src={q.imagePath} alt="Soal" style={{ maxWidth: "250px", maxHeight: "150px", objectFit: "contain", borderRadius: "4px", border: "1px solid var(--border-color)" }} />
                                      </div>
                                    )}

                                    {/* Penayangan detail jawaban berdasarkan Tipe Soal */}
                                    {(q.type === "PG" || q.type === "PGK") && q.choices && q.choices.length > 0 && (
                                      <div style={{ fontSize: "0.85rem", marginTop: "0.5rem" }}>
                                        <ul style={{ paddingLeft: "1.2rem", listStyleType: "upper-alpha", color: "var(--text-muted)", margin: 0 }}>
                                          {q.choices.map((c, cIdx) => {
                                            const isCorrectPG = q.type === "PG" && q.correct === cIdx;
                                            const isCorrectPGK = q.type === "PGK" && q.correctChoices && q.correctChoices.includes(cIdx);
                                            const highlight = isCorrectPG || isCorrectPGK;
                                            return (
                                              <li key={cIdx} style={{ fontWeight: highlight ? "bold" : "normal", color: highlight ? "var(--primary)" : "var(--text-muted)", marginBottom: "0.5rem" }}>
                                                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.5rem" }}>
                                                  <span>{c} {highlight && "✓"}</span>
                                                  {q.choicesImages && q.choicesImages[cIdx] && (
                                                    <img src={q.choicesImages[cIdx]} style={{ height: "40px", objectFit: "contain", borderRadius: "4px", border: "1px solid #e2e8f0" }} alt={`Opsi ${["A","B","C","D"][cIdx]}`} />
                                                  )}
                                                </div>
                                              </li>
                                            );
                                          })}
                                        </ul>
                                      </div>
                                    )}

                                    {q.type === "MENJODOHKAN" && q.matchingLeft && q.matchingLeft.length > 0 && (
                                      <div style={{ fontSize: "0.8rem", marginTop: "0.5rem", backgroundColor: "#f9fafb", padding: "0.5rem", borderRadius: "4px" }}>
                                        <strong>Pasangan Jodoh:</strong>
                                        <ul style={{ margin: 0, paddingLeft: "1rem", color: "var(--text-muted)", listStyleType: "square" }}>
                                          {q.matchingLeft.map((l, lIdx) => (
                                            <li key={lIdx} style={{ marginBottom: "0.4rem" }}>
                                              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.5rem" }}>
                                                <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                                                  <strong>{l}</strong>
                                                  {q.matchingLeftImages && q.matchingLeftImages[lIdx] && (
                                                    <img src={q.matchingLeftImages[lIdx]} style={{ height: "30px", objectFit: "contain", borderRadius: "2px", border: "1px solid #e2e8f0" }} alt="Kiri" />
                                                  )}
                                                </span>
                                                <span>➔</span>
                                                <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                                                  <strong>{q.matchingRight?.[lIdx]}</strong>
                                                  {q.matchingRightImages && q.matchingRightImages[lIdx] && (
                                                    <img src={q.matchingRightImages[lIdx]} style={{ height: "30px", objectFit: "contain", borderRadius: "2px", border: "1px solid #e2e8f0" }} alt="Kanan" />
                                                  )}
                                                </span>
                                              </div>
                                            </li>
                                          ))}
                                        </ul>
                                        {q.correctAnswer && <div style={{ marginTop: "0.25rem", fontSize: "0.75rem", fontStyle: "italic" }}>Petunjuk: {q.correctAnswer}</div>}
                                      </div>
                                    )}

                                    {q.type === "ISIAN" && q.correctAnswer && (
                                      <div style={{ fontSize: "0.8rem", marginTop: "0.5rem", color: "#10b981", fontWeight: "bold" }}>
                                        Kunci Jawaban: {q.correctAnswer}
                                      </div>
                                    )}

                                    {q.type === "ESSAY" && q.correctAnswer && (
                                      <div style={{ fontSize: "0.8rem", marginTop: "0.5rem", backgroundColor: "#faf5ff", padding: "0.5rem", borderRadius: "4px", border: "1px dashed #d8b4fe" }}>
                                        <strong>Pedoman Skor:</strong> {q.correctAnswer}
                                      </div>
                                    )}

                                    <div style={{ position: "absolute", top: "0.5rem", right: "0.5rem", display: "flex", gap: "0.25rem" }}>
                                      <button 
                                        type="button"
                                        className="btn btn-outline" 
                                        style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem", borderColor: "var(--primary)", color: "var(--primary)", display: "inline-flex", alignItems: "center", gap: "0.2rem", background: "white", cursor: "pointer" }}
                                        onClick={() => {
                                          setPreviewQuestion(q);
                                          setPreviewAnswers({});
                                        }}
                                        title="Lihat tataletak soal di portal siswa"
                                      >
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
                                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                          <circle cx="12" cy="12" r="3" />
                                        </svg>
                                        Pratinjau
                                      </button>

                                      <button 
                                        type="button"
                                        className="btn btn-outline" 
                                        style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem", borderColor: "var(--secondary)", color: "var(--secondary)", display: "inline-flex", alignItems: "center", gap: "0.2rem", background: "white", cursor: "pointer" }}
                                        onClick={() => handleLoadEditQuestion(q)}
                                        title="Edit soal ini"
                                      >
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
                                          <path d="M12 20h9" />
                                          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                                        </svg>
                                        Edit
                                      </button>

                                      <button 
                                        type="button"
                                        className="btn btn-outline" 
                                        style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem", borderColor: "#ef4444", color: "#ef4444", display: "inline-flex", alignItems: "center", gap: "0.2rem", background: "white", cursor: "pointer" }}
                                        onClick={() => handleDeleteQuestion(q.id)}
                                        title="Hapus soal ini"
                                      >
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
                                          <polyline points="3 6 5 6 21 6" />
                                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                        </svg>
                                        Hapus
                                      </button>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                  </div>
                )}

                {/* TAB 3.b: JURNAL MENGAJAR */}
                {activeTab === "jurnal" && (
                  <div className="no-print">
                    <span style={{ fontSize: "0.85rem", textTransform: "uppercase", fontWeight: 700, color: "var(--secondary)" }}>Jurnal Mengajar</span>
                    <h2 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--primary-dark)", marginBottom: "1rem" }}>
                      Jurnal Mengajar Harian: {activeSubject?.name}
                    </h2>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
                      <div className="form-group" style={{ margin: 0, minWidth: "200px" }}>
                        <label className="form-label" style={{ fontWeight: 700, fontSize: "0.8rem", marginBottom: "0.25rem" }}>Filter Kelas</label>
                        <select 
                          className="form-select" 
                          value={journalKelas}
                          onChange={(e) => setJournalKelas(e.target.value)}
                          style={{ padding: "0.4rem 0.75rem", fontSize: "0.85rem" }}
                        >
                          <option value="">Semua Kelas</option>
                          {uniqueClasses.map((c, idx) => (
                            <option value={c} key={idx}>{c}</option>
                          ))}
                        </select>
                      </div>

                      <button 
                        className="btn btn-primary" 
                        onClick={() => handleOpenJurnalModal(null)}
                        style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: "0.5rem 1rem", fontSize: "0.85rem" }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
                          <line x1="12" y1="5" x2="12" y2="19" />
                          <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        Buat Jurnal Baru
                      </button>
                    </div>

                    {jurnalList.length === 0 ? (
                      <div style={{ textAlign: "center", padding: "3rem 1rem", backgroundColor: "white", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", color: "var(--text-muted)" }}>
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: "0 auto 1rem", color: "#cbd5e1", display: "block" }}>
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                          <line x1="16" y1="13" x2="8" y2="13" />
                          <line x1="16" y1="17" x2="8" y2="17" />
                          <polyline points="10 9 9 9 8 9" />
                        </svg>
                        <p style={{ fontWeight: 600, fontSize: "0.95rem", margin: 0 }}>Belum ada jurnal mengajar</p>
                        <p style={{ fontSize: "0.8rem", marginTop: "0.25rem" }}>Silakan klik tombol "Buat Jurnal Baru" untuk mencatat agenda pembelajaran hari ini.</p>
                      </div>
                    ) : (
                      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1rem" }}>
                        {jurnalList.map((journal) => (
                          <div 
                            key={journal.id} 
                            style={{ backgroundColor: "white", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", padding: "1.25rem", position: "relative", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}
                          >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem", flexWrap: "wrap", gap: "0.5rem" }}>
                              <div>
                                <span style={{ backgroundColor: "var(--primary-light)", color: "var(--primary)", fontSize: "0.75rem", fontWeight: 700, padding: "0.25rem 0.5rem", borderRadius: "4px", marginRight: "0.5rem" }}>
                                  Kelas {journal.kelas}
                                </span>
                                <span style={{ backgroundColor: "#f1f5f9", color: "#475569", fontSize: "0.75rem", fontWeight: 600, padding: "0.25rem 0.5rem", borderRadius: "4px" }}>
                                  Jam Ke-{journal.jamKe}
                                </span>
                                <h3 style={{ margin: "0.5rem 0 0.25rem", fontSize: "1.1rem", fontWeight: 700, color: "var(--primary-dark)" }}>
                                  {journal.materi}
                                </h3>
                                <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 500 }}>
                                  📅 {journal.date}
                                </p>
                              </div>

                              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                                <button 
                                  className="btn btn-outline" 
                                  onClick={() => {
                                    // Cetak per pertemuan
                                    const printWin = window.open("", "_blank");
                                    const hadirList = journal.attendances.filter(a => a.status === "HADIR");
                                    const tidakList = journal.attendances.filter(a => a.status !== "HADIR");
                                    const allAtt = [...journal.attendances].sort((a,b) => (a.student?.name || a.studentName || '').localeCompare(b.student?.name || b.studentName || ''));
                                    const attRows = allAtt.map((a, i) => {
                                      const stColor = a.status === "HADIR" ? "#16a34a" : a.status === "SAKIT" ? "#d97706" : a.status === "IZIN" ? "#2563eb" : "#dc2626";
                                      return `<tr style="background:${i%2===0?"#fff":"#f8fafc"}"><td>${i+1}</td><td>${a.student?.name || a.studentName || '-'}</td><td style="color:${stColor};font-weight:bold;text-align:center">${a.status}</td><td style="text-align:center">${journal.grades.find(g=>g.studentId===a.studentId)?.score ?? '-'}</td></tr>`;
                                    }).join("");
                                    printWin.document.write(`<!DOCTYPE html><html><head>
                                      <title>Jurnal Mengajar - ${journal.date}</title>
                                      <style>
                                        body{font-family:Arial,sans-serif;font-size:11px;margin:15mm;color:#111}
                                        h2{text-align:center;font-size:14px;margin-bottom:2px}
                                        h3{text-align:center;font-size:11px;color:#555;margin-top:0}
                                        .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:4px 16px;margin:8px 0 12px;font-size:10px}
                                        .info-grid .label{color:#888;font-weight:600}
                                        table{width:100%;border-collapse:collapse;margin-top:8px}
                                        th,td{border:1px solid #ccc;padding:3px 5px;font-size:10px}
                                        th{background:#1e3a5f;color:#fff;text-align:center}
                                        .sign{margin-top:30px;display:grid;grid-template-columns:1fr 1fr;gap:20px}
                                        .sign-box{text-align:center;font-size:10px}
                                        .sign-line{border-bottom:1px solid #333;height:40px;margin-bottom:4px}
                                        @media print{@page{size:A4 portrait;margin:15mm}body{margin:0}}
                                      </style>
                                    </head><body>
                                      <h2>JURNAL MENGAJAR HARIAN</h2>
                                      <h3>Sekolah Master Demo</h3>
                                      <div class="info-grid">
                                        <div><span class="label">Mata Pelajaran:</span> ${journal.subjectName || activeSubject?.name || '-'}</div>
                                        <div><span class="label">Kelas:</span> ${journal.kelas}</div>
                                        <div><span class="label">Tanggal:</span> ${new Date(journal.date).toLocaleDateString('id-ID',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</div>
                                        <div><span class="label">Jam Ke:</span> ${journal.jamKe}</div>
                                        <div><span class="label">Guru:</span> ${session?.name || '-'}</div>
                                        <div><span class="label">Hadir / Total:</span> ${hadirList.length} / ${journal.attendances.length} siswa</div>
                                      </div>
                                      <div style="margin:6px 0"><strong>Materi:</strong> ${journal.materi || '-'}</div>
                                      <div style="margin:4px 0"><strong>KD / Kompetensi:</strong> ${journal.kompetensiDasar || '-'}</div>
                                      <div style="margin:4px 0"><strong>Metode:</strong> ${journal.metode || '-'}</div>
                                      ${journal.catatan ? `<div style="margin:4px 0"><strong>Catatan:</strong> ${journal.catatan}</div>` : ''}
                                      <table>
                                        <thead><tr><th>No</th><th style="min-width:140px">Nama Siswa</th><th>Status</th><th>Nilai Harian</th></tr></thead>
                                        <tbody>${attRows}</tbody>
                                      </table>
                                      <div class="sign">
                                        <div class="sign-box"><div class="sign-line"></div>Guru Mata Pelajaran<br><strong>${session?.name || '__________'}</strong></div>
                                        <div class="sign-box"><div class="sign-line"></div>Mengetahui<br>Kepala Sekolah</div>
                                      </div>
                                    </body></html>`);
                                    printWin.document.close();
                                    printWin.focus();
                                    setTimeout(() => printWin.print(), 500);
                                  }}
                                  style={{ padding: "0.3rem 0.6rem", fontSize: "0.75rem", borderColor: "#0284c7", color: "#0284c7", background: "white", cursor: "pointer" }}
                                >
                                  🖨️ Cetak
                                </button>
                                <button 
                                  className="btn btn-outline" 
                                  onClick={() => handleOpenJurnalModal(journal)}
                                  style={{ padding: "0.3rem 0.6rem", fontSize: "0.75rem", borderColor: "var(--secondary)", color: "var(--secondary)", background: "white", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "0.25rem" }}
                                >
                                  Edit
                                </button>
                                <button 
                                  className="btn btn-outline" 
                                  onClick={() => handleDeleteJournal(journal.id)}
                                  style={{ padding: "0.3rem 0.6rem", fontSize: "0.75rem", borderColor: "#ef4444", color: "#ef4444", background: "white", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "0.25rem" }}
                                >
                                  Hapus
                                </button>
                              </div>
                            </div>

                            {journal.tujuanPembelajaran && (
                              <div style={{ marginBottom: "0.5rem", fontSize: "0.85rem", color: "#334155" }}>
                                <strong>Tujuan Pembelajaran (TP):</strong>
                                <p style={{ margin: "0.1rem 0 0 0", color: "#475569" }}>{journal.tujuanPembelajaran}</p>
                              </div>
                            )}

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginTop: "1rem", borderTop: "1px solid #f1f5f9", paddingTop: "0.75rem", fontSize: "0.8rem" }}>
                              <div>
                                <strong>Ringkasan Kehadiran:</strong>
                                <div style={{ display: "flex", gap: "1rem", marginTop: "0.25rem" }}>
                                  <span style={{ color: "#10b981", fontWeight: 600 }}>Hadir: {journal.attendances.filter(a => a.status === "HADIR").length}</span>
                                  <span style={{ color: "#3b82f6", fontWeight: 600 }}>Sakit: {journal.attendances.filter(a => a.status === "SAKIT").length}</span>
                                  <span style={{ color: "#f59e0b", fontWeight: 600 }}>Izin: {journal.attendances.filter(a => a.status === "IZIN").length}</span>
                                  <span style={{ color: "#ef4444", fontWeight: 600 }}>Alfa: {journal.attendances.filter(a => a.status === "ALFA").length}</span>
                                </div>
                              </div>

                              <div>
                                <strong>Nilai Formatif:</strong>
                                <p style={{ margin: "0.25rem 0 0 0", color: "var(--text-muted)" }}>
                                  {journal.grades.length === 0 ? "Tidak ada pengambilan nilai harian" : `Diinput untuk ${journal.grades.length} siswa`}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ─── REKAP JURNAL BULANAN ─── */}
                {activeTab === "jurnal" && activeSubject && (
                  <div className="card" style={{ marginTop: "2rem", padding: "1.25rem", borderTop: "3px solid var(--secondary)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem", flexWrap: "wrap" }}>
                      <div style={{ background: "rgba(6,95,70,0.1)", borderRadius: "50%", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--primary)", flexShrink: 0 }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                      </div>
                      <span style={{ fontWeight: 800, fontSize: "0.9rem", color: "var(--primary)" }}>Rekap Jurnal Bulanan</span>
                      <div style={{ flex: 1 }} />
                      {/* Filter */}
                      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
                        <select className="form-input" style={{ fontSize: "0.82rem", padding: "0.35rem 0.6rem", minWidth: "110px" }}
                          value={jurnalRekapBulan} onChange={e => setJurnalRekapBulan(e.target.value)}>
                          {["1","2","3","4","5","6","7","8","9","10","11","12"].map(m => (
                            <option key={m} value={m}>{new Date(2000,parseInt(m)-1,1).toLocaleString("id-ID",{month:"long"})}</option>
                          ))}
                        </select>
                        <select className="form-input" style={{ fontSize: "0.82rem", padding: "0.35rem 0.6rem", minWidth: "80px" }}
                          value={jurnalRekapTahun} onChange={e => setJurnalRekapTahun(e.target.value)}>
                          {["2024","2025","2026","2027"].map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                        <button className="btn btn-primary" style={{ fontSize: "0.82rem", padding: "0.4rem 1rem" }}
                          disabled={jurnalRekapLoading}
                          onClick={async () => {
                            setJurnalRekapLoading(true);
                            const res = await getTeachingJournalRecap(activeSubject.name, journalKelas || null, jurnalRekapBulan, jurnalRekapTahun);
                            setJurnalRekapLoading(false);
                            if (res.success) setJurnalRekapData(res);
                            else alert("Gagal: " + res.error);
                          }}>
                          {jurnalRekapLoading ? "⏳..." : "▶ Tampilkan"}
                        </button>
                        {jurnalRekapData && (
                          <button className="btn btn-outline" style={{ fontSize: "0.82rem", padding: "0.4rem 0.9rem" }}
                            onClick={() => {
                              const printWin = window.open("", "_blank");
                              const bulanNama = new Date(2000, parseInt(jurnalRekapData.bulan)-1, 1).toLocaleString("id-ID", { month: "long" });
                              const rows = jurnalRekapData.recap.map(j => `
                                <tr>
                                  <td style="text-align:center">${j.no}</td>
                                  <td style="text-align:center">${new Date(j.date).toLocaleDateString('id-ID',{day:'2-digit',month:'2-digit',year:'numeric'})}</td>
                                  <td style="text-align:center">${j.jamKe}</td>
                                  <td>${j.materi}</td>
                                  <td>${j.kompetensiDasar}</td>
                                  <td>${j.metode}</td>
                                  <td style="text-align:center;color:#16a34a;font-weight:bold">${j.hadir}</td>
                                  <td style="text-align:center;color:#dc2626;font-weight:bold">${j.tidak}</td>
                                  <td>${j.catatan}</td>
                                </tr>`).join("");
                              printWin.document.write(`<!DOCTYPE html><html><head>
                                <title>Rekap Jurnal - ${jurnalRekapData.subjectName} - ${bulanNama} ${jurnalRekapData.tahun}</title>
                                <style>
                                  body{font-family:Arial,sans-serif;font-size:10px;margin:10mm;color:#111}
                                  h2{text-align:center;font-size:13px;margin-bottom:2px}
                                  h3{text-align:center;font-size:10px;color:#555;margin:0 0 8px}
                                  .info{margin-bottom:8px;font-size:10px}
                                  table{width:100%;border-collapse:collapse}
                                  th,td{border:1px solid #ccc;padding:3px 4px;font-size:9px;vertical-align:top}
                                  th{background:#1e3a5f;color:#fff;text-align:center}
                                  .sign{margin-top:24px;display:grid;grid-template-columns:1fr 1fr;gap:20px}
                                  .sign-box{text-align:center;font-size:9px}
                                  .sign-line{border-bottom:1px solid #333;height:36px;margin-bottom:4px}
                                  @media print{@page{size:A4 landscape;margin:10mm}body{margin:0}}
                                </style>
                              </head><body>
                                <h2>REKAP JURNAL MENGAJAR BULANAN</h2>
                                <h3>Sekolah Master Demo</h3>
                                <div class="info">
                                  <strong>Mata Pelajaran:</strong> ${jurnalRekapData.subjectName} &nbsp;|&nbsp;
                                  <strong>Kelas:</strong> ${jurnalRekapData.kelas || 'Semua'} &nbsp;|&nbsp;
                                  <strong>Periode:</strong> ${bulanNama} ${jurnalRekapData.tahun} &nbsp;|&nbsp;
                                  <strong>Guru:</strong> ${jurnalRekapData.teacherName}
                                </div>
                                <table>
                                  <thead><tr>
                                    <th style="width:24px">No</th>
                                    <th style="width:70px">Tanggal</th>
                                    <th style="width:30px">Jam</th>
                                    <th style="min-width:120px">Materi Pembelajaran</th>
                                    <th style="min-width:100px">KD / Kompetensi</th>
                                    <th style="width:70px">Metode</th>
                                    <th style="width:35px">Hadir</th>
                                    <th style="width:35px">Tidak</th>
                                    <th>Catatan</th>
                                  </tr></thead>
                                  <tbody>${rows}</tbody>
                                </table>
                                <div style="margin-top:6px;font-size:9px;color:#555">
                                  Total Pertemuan: <strong>${jurnalRekapData.totalPertemuan}</strong>
                                </div>
                                <div class="sign">
                                  <div class="sign-box"><div class="sign-line"></div>Guru Mata Pelajaran<br><strong>${jurnalRekapData.teacherName}</strong></div>
                                  <div class="sign-box"><div class="sign-line"></div>Mengetahui<br>Kepala Sekolah</div>
                                </div>
                              </body></html>`);
                              printWin.document.close();
                              printWin.focus();
                              setTimeout(() => printWin.print(), 500);
                            }}>
                            🖨️ Cetak PDF
                          </button>
                        )}
                      </div>
                    </div>

                    {!jurnalRekapData ? (
                      <div style={{ textAlign: "center", padding: "2rem", color: "#bbb" }}>
                        <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>📅</div>
                        <p style={{ fontSize: "0.85rem", margin: 0 }}>Pilih bulan & tahun, lalu klik <strong style={{ color: "var(--primary)" }}>▶ Tampilkan</strong></p>
                      </div>
                    ) : jurnalRekapData.recap.length === 0 ? (
                      <div style={{ textAlign: "center", padding: "1.5rem", color: "#aaa" }}>
                        <div style={{ fontSize: "2rem" }}>📭</div>
                        <p>Tidak ada jurnal pada periode ini.</p>
                      </div>
                    ) : (
                      <div style={{ overflowX: "auto" }}>
                        <div style={{ marginBottom: "0.5rem", fontSize: "0.78rem", color: "#888" }}>
                          <strong style={{ color: "var(--primary)" }}>{jurnalRekapData.totalPertemuan}</strong> pertemuan &bull;
                          <strong style={{ color: "var(--primary)" }}> {new Date(2000, parseInt(jurnalRekapData.bulan)-1, 1).toLocaleString("id-ID", { month: "long" })}</strong> {jurnalRekapData.tahun}
                        </div>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.78rem" }}>
                          <thead>
                            <tr style={{ background: "var(--primary)", color: "#fff" }}>
                              <th style={{ padding: "7px 5px", textAlign: "center", width: "30px" }}>No</th>
                              <th style={{ padding: "7px 5px", textAlign: "center", minWidth: "90px" }}>Tanggal</th>
                              <th style={{ padding: "7px 5px", textAlign: "center", width: "35px" }}>Jam</th>
                              <th style={{ padding: "7px 8px", textAlign: "left", minWidth: "150px" }}>Materi Pembelajaran</th>
                              <th style={{ padding: "7px 8px", textAlign: "left", minWidth: "120px" }}>KD / Kompetensi</th>
                              <th style={{ padding: "7px 6px", textAlign: "center", width: "70px" }}>Metode</th>
                              <th style={{ padding: "7px 5px", textAlign: "center", background: "#16a34a", width: "45px" }}>Hadir</th>
                              <th style={{ padding: "7px 5px", textAlign: "center", background: "#dc2626", width: "45px" }}>Tidak</th>
                              <th style={{ padding: "7px 6px", textAlign: "left", minWidth: "80px" }}>Catatan</th>
                            </tr>
                          </thead>
                          <tbody>
                            {jurnalRekapData.recap.map((j, i) => (
                              <tr key={j.id} style={{ background: i % 2 === 0 ? "#fff" : "#f8fafc", borderBottom: "1px solid #e5e7eb" }}>
                                <td style={{ padding: "5px", textAlign: "center", color: "#888" }}>{j.no}</td>
                                <td style={{ padding: "5px", textAlign: "center" }}>
                                  {new Date(j.date).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
                                </td>
                                <td style={{ padding: "5px", textAlign: "center", color: "#64748b" }}>{j.jamKe}</td>
                                <td style={{ padding: "5px 8px", fontWeight: 500 }}>{j.materi}</td>
                                <td style={{ padding: "5px 8px", color: "#475569" }}>{j.kompetensiDasar}</td>
                                <td style={{ padding: "5px", textAlign: "center", color: "#64748b", fontSize: "0.72rem" }}>{j.metode}</td>
                                <td style={{ padding: "5px", textAlign: "center", color: "#16a34a", fontWeight: "bold" }}>{j.hadir}</td>
                                <td style={{ padding: "5px", textAlign: "center", color: "#dc2626", fontWeight: "bold" }}>{j.tidak}</td>
                                <td style={{ padding: "5px 8px", color: "#94a3b8", fontSize: "0.72rem" }}>{j.catatan || "-"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <div style={{ marginTop: "0.5rem", fontSize: "0.72rem", color: "#aaa", textAlign: "right" }}>
                          Total: {jurnalRekapData.totalPertemuan} pertemuan
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 4.b: INPUT NILAI & ABSENSI EKSKUL */}
                {activeTab === "ekskul" && (() => {
                  const myEkskuls = session.extracurriculars || [];
                  const isPengampu = myEkskuls.length > 0;
                  const availableEkskuls = isPengampu ? extracurriculars.filter(e => myEkskuls.includes(e.name)) : extracurriculars;

                  return (
                    <div>
                      <span style={{ fontSize: "0.85rem", textTransform: "uppercase", fontWeight: 700, color: "var(--secondary)" }}>Kokurikuler</span>
                      <h2 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--primary-dark)", marginBottom: "1.5rem" }}>
                        Manajemen & Rekapitulasi Ekstrakurikuler
                      </h2>

                      {!isPengampu && (
                        <div className="form-alert" style={{ display: "flex", alignItems: "center", gap: "0.75rem", backgroundColor: "#eff6ff", color: "#1e40af", borderColor: "#bfdbfe", padding: "1rem 1.25rem", borderRadius: "8px", marginBottom: "1.5rem" }}>
                          <span style={{ fontSize: "1.3rem" }}>ℹ️</span>
                          <div>
                            <strong>Informasi Hak Akses Ekskul:</strong>
                            <p style={{ margin: "0.2rem 0 0 0", fontSize: "0.82rem" }}>
                              Anda tidak terdaftar sebagai Guru Pengampu Ekstrakurikuler. Input Nilai dan Absensi Sesi Ekskul hanya dapat dilakukan oleh Guru Pengampu Ekskul yang ditugaskan oleh Sekolah. Sebagai Wali Kelas, Anda dapat memantau Rekap Bulanan dan Nilai Rapor siswa di bawah ini.
                            </p>
                          </div>
                        </div>
                      )}

                      {/* HANYA GURU PENGAMPU EKSKUL YANG BISA INPUT NILAI */}
                      {isPengampu && (
                        <div className="grid grid-2" style={{ gap: "2rem" }}>
                          {/* Sisi Kiri: Form Input Nilai Ekskul */}
                          <div>
                            {ekskulMessage && (
                              <div className={`form-alert ${ekskulMessage.startsWith("Gagal") ? "error" : "success"}`} style={{ display: "block", marginBottom: "1.5rem" }}>
                                {ekskulMessage}
                              </div>
                            )}

                            <form onSubmit={handleEkskulSubmit} style={{ backgroundColor: "var(--bg-alt)", padding: "1.5rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }}>
                              <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--primary)", marginTop: 0, marginBottom: "1rem" }}>
                                Form Input Nilai Ekskul
                              </h3>

                              <div className="form-group">
                                <label className="form-label">Pilih Ekstrakurikuler yang Diampu</label>
                                <select 
                                  className="form-select" 
                                  value={selectedEkskulName}
                                  onChange={(e) => handleEkskulStudentSelect(selectedEkskulStudentNisn, e.target.value)}
                                  required
                                >
                                  <option value="">-- Pilih Ekskul --</option>
                                  {availableEkskuls.map(e => (
                                    <option key={e.id || e.name} value={e.name}>{e.name}</option>
                                  ))}
                                </select>
                              </div>

                              <div className="form-group" style={{ marginTop: "1rem" }}>
                                <label className="form-label">Pilih Siswa (Peserta Terdaftar)</label>
                                <select 
                                  className="form-select" 
                                  value={selectedEkskulStudentNisn}
                                  onChange={(e) => handleEkskulStudentSelect(e.target.value, selectedEkskulName)}
                                  required
                                >
                                  <option value="">-- Pilih Siswa --</option>
                                  {students
                                    .filter(s => selectedEkskulName ? (s.extracurriculars && s.extracurriculars.includes(selectedEkskulName)) || (s.extracurricularGrades && s.extracurricularGrades.some(g => g.ekskulName === selectedEkskulName)) : true)
                                    .map(s => (
                                      <option key={s.nisn} value={s.nisn}>{s.name} ({s.kelas})</option>
                                    ))}
                                </select>
                                {selectedEkskulName && students.filter(s => s.extracurriculars && s.extracurriculars.includes(selectedEkskulName)).length === 0 && (
                                  <div style={{ fontSize: "0.75rem", color: "#d97706", marginTop: "0.35rem" }}>
                                    ⚠️ Belum ada siswa yang mendaftar di ekskul {selectedEkskulName}. Siswa dapat memilih ekskul melalui Portal Siswa.
                                  </div>
                                )}
                              </div>

                              <div className="form-group" style={{ marginTop: "1rem" }}>
                                <label className="form-label">Nilai Predikat</label>
                                <select 
                                  className="form-select" 
                                  value={ekskulNilai}
                                  onChange={(e) => setEkskulNilai(e.target.value)}
                                  required
                                >
                                  <option value="A">A (Sangat Baik)</option>
                                  <option value="B">B (Baik)</option>
                                  <option value="C">C (Cukup)</option>
                                  <option value="D">D (Kurang)</option>
                                </select>
                              </div>

                              <div className="form-group" style={{ marginTop: "1rem" }}>
                                <label className="form-label">Deskripsi Penilaian</label>
                                <textarea 
                                  className="form-textarea" 
                                  placeholder="Deskripsikan keikutsertaan dan pencapaian siswa dalam ekskul ini..."
                                  value={ekskulDeskripsi}
                                  onChange={(e) => setEkskulDeskripsi(e.target.value)}
                                  required
                                  style={{ height: "100px" }}
                                />
                              </div>

                              <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: "1.5rem" }}>
                                Simpan Nilai Ekskul
                              </button>
                            </form>
                          </div>

                          {/* Sisi Kanan: Daftar Nilai Ekskul Terinput */}
                          <div>
                            <h3 style={{ fontWeight: 700, color: "var(--primary-dark)", marginBottom: "1rem" }}>Penilaian Ekskul Terkini ({school?.semester} Semester)</h3>
                            <div className="portal-table-container">
                              <table className="portal-table">
                                <thead>
                                  <tr>
                                    <th>Siswa</th>
                                    <th>Ekskul</th>
                                    <th style={{ textAlign: "center" }}>Nilai</th>
                                    <th>Keterangan</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {students
                                    .filter(s => session.role === "wali-kelas" ? s.kelas === session.kelas : (isPengampu ? (s.extracurriculars && s.extracurriculars.some(e => myEkskuls.includes(e))) : true))
                                    .map(s => {
                                      const activeSem = getStudentActiveSemester(s.kelas, school?.semester);
                                      return s.extracurricularGrades
                                        .filter(g => g.semester === activeSem && (isPengampu ? myEkskuls.includes(g.ekskulName) : true))
                                        .map((eg, idx) => (
                                          <tr key={`${s.nisn}-${eg.ekskulName}-${idx}`}>
                                            <td><strong>{s.name}</strong><br /><span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{s.kelas}</span></td>
                                            <td>{eg.ekskulName}</td>
                                            <td style={{ textAlign: "center" }}><strong>{eg.nilai}</strong></td>
                                            <td style={{ fontSize: "0.85rem" }}>{eg.deskripsi}</td>
                                          </tr>
                                        ));
                                    })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* ─── PANEL KELOLA PESERTA EKSKUL SISWA (WALI KELAS & GURU) ─── */}
                {activeTab === "ekskul" && (
                  <div className="card" style={{ marginTop: "2rem", padding: "1.25rem", borderTop: "3px solid var(--secondary)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem" }}>
                      <div style={{ background: "linear-gradient(135deg, #10b981, #047857)", borderRadius: "50%", width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", color: "#ffffff", boxShadow: "0 2px 5px rgba(16,185,129,0.3)", flexShrink: 0 }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><polyline points="17 11 19 13 23 9"/></svg>
                      </div>
                      <div>
                        <span style={{ fontWeight: 800, fontSize: "0.95rem", color: "var(--primary)" }}>Pengaturan Keikutsertaan Ekskul Siswa (Opsi Wali Kelas & Admin)</span>
                        <p style={{ margin: 0, fontSize: "0.78rem", color: "#64748b" }}>Wali Kelas dan Guru dapat mendaftarkan atau merubah daftar ekskul yang diikuti oleh siswa.</p>
                      </div>
                    </div>

                    <div style={{ background: "var(--bg-alt)", padding: "1.25rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "1.5rem", alignItems: "start" }}>
                        <div>
                          <label className="form-label" style={{ fontWeight: 700 }}>Pilih Siswa</label>
                          <select 
                            className="form-select" 
                            value={manageEkskulStudentNisn}
                            onChange={e => {
                              const nisn = e.target.value;
                              setManageEkskulStudentNisn(nisn);
                              setManageEkskulMsg("");
                              const st = students.find(s => s.nisn === nisn);
                              setManageStudentEkskuls(st ? (st.extracurriculars || []) : []);
                            }}
                          >
                            <option value="">-- Pilih Siswa --</option>
                            {students
                              .filter(s => session.role === "wali-kelas" ? s.kelas === session.kelas : true)
                              .map(s => (
                                <option key={s.nisn} value={s.nisn}>{s.name} ({s.kelas})</option>
                              ))}
                          </select>
                        </div>

                        <div>
                          <label className="form-label" style={{ fontWeight: 700 }}>Pilih Kegiatan Ekstrakurikuler Diikuti</label>
                          {manageEkskulStudentNisn ? (
                            <div>
                              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "0.5rem", marginBottom: "1rem" }}>
                                {extracurriculars.map(e => {
                                  const isChecked = manageStudentEkskuls.includes(e.name);
                                  return (
                                    <label key={e.name} style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: isChecked ? "#f0fdf4" : "white", padding: "0.5rem 0.75rem", borderRadius: "6px", border: isChecked ? "1px solid #16a34a" : "1px solid #e5e7eb", cursor: "pointer", fontSize: "0.85rem" }}>
                                      <input 
                                        type="checkbox" 
                                        checked={isChecked}
                                        onChange={() => {
                                          setManageStudentEkskuls(prev => 
                                            prev.includes(e.name) ? prev.filter(x => x !== e.name) : [...prev, e.name]
                                          );
                                        }}
                                        style={{ accentColor: "#16a34a", width: "16px", height: "16px" }}
                                      />
                                      <span style={{ fontWeight: isChecked ? "bold" : "normal", color: isChecked ? "#15803d" : "#334155" }}>{e.name}</span>
                                    </label>
                                  );
                                })}
                              </div>

                              {manageEkskulMsg && (
                                <div className={`form-alert ${manageEkskulMsg.startsWith("Gagal") ? "error" : "success"}`} style={{ display: "block", marginBottom: "0.75rem" }}>
                                  {manageEkskulMsg}
                                </div>
                              )}

                              <button 
                                type="button" 
                                className="btn btn-primary" 
                                disabled={manageEkskulLoading}
                                onClick={async () => {
                                  setManageEkskulLoading(true);
                                  setManageEkskulMsg("");
                                  const res = await updateStudentExtracurriculars(manageEkskulStudentNisn, manageStudentEkskuls);
                                  setManageEkskulLoading(false);
                                  if (res.success) {
                                    setManageEkskulMsg("✓ Berhasil memperbarui daftar ekskul siswa!");
                                    setStudents(prev => prev.map(st => st.nisn === manageEkskulStudentNisn ? { ...st, extracurriculars: manageStudentEkskuls } : st));
                                  } else {
                                    setManageEkskulMsg("Gagal: " + res.error);
                                  }
                                }}
                              >
                                {manageEkskulLoading ? "⏳ Menyimpan..." : "💾 Simpan Pilihan Ekskul Siswa"}
                              </button>
                            </div>
                          ) : (
                            <div style={{ color: "#94a3b8", fontSize: "0.85rem", fontStyle: "italic", paddingTop: "0.5rem" }}>
                              Pilih siswa di sebelah kiri untuk mengatur keikutsertaan ekskulnya.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ─── PANEL ABSENSI EKSKUL (HANYA UNTUK GURU PENGAMPU EKSKUL) ─── */}
                {activeTab === "ekskul" && (session.extracurriculars || []).length > 0 && (
                  <div className="card" style={{ marginTop: "2rem", padding: "1.25rem", borderTop: "3px solid var(--primary)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem" }}>
                      <div style={{ background: "linear-gradient(135deg, #0284c7, #0369a1)", borderRadius: "50%", width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", color: "#ffffff", boxShadow: "0 2px 5px rgba(2,132,199,0.3)", flexShrink: 0 }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/><path d="M9 14l2 2 4-4"/></svg>
                      </div>
                      <span style={{ fontWeight: 800, fontSize: "0.95rem", color: "var(--primary)" }}>Absensi Ekskul per Pertemuan (Khusus Pengampu)</span>
                    </div>

                    {/* Form Input Sesi */}
                    <div style={{ background: "var(--bg-alt)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", padding: "1.25rem", marginBottom: "1.25rem" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: "0.75rem", alignItems: "end", flexWrap: "wrap", marginBottom: "1rem" }}>
                        <div>
                          <label className="form-label" style={{ fontSize: "0.78rem" }}>Ekskul yang Diampu</label>
                          <select className="form-select" value={selectedEkskulName}
                            onChange={async e => {
                              setSelectedEkskulName(e.target.value);
                              setEkskulAttMap({});
                              setEkskulRekapData(null);
                              if (e.target.value) {
                                const res = await getEkskulSessions(e.target.value);
                                if (res.success) setEkskulSessions(res.sessions);
                              } else setEkskulSessions([]);
                            }}>
                            <option value="">-- Pilih Ekskul --</option>
                            {(session.extracurriculars || []).map(eName => (
                              <option key={eName} value={eName}>{eName}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="form-label" style={{ fontSize: "0.78rem" }}>Tanggal Pertemuan</label>
                          <input type="date" className="form-input" value={ekskulSessionDate}
                            onChange={e => setEkskulSessionDate(e.target.value)} />
                        </div>
                        <div style={{ gridColumn: "1 / -1" }}>
                          <label className="form-label" style={{ fontSize: "0.78rem" }}>Keterangan / Materi Pertemuan</label>
                          <input type="text" className="form-input" placeholder="Contoh: Latihan rutin, Teori dasar, Evaluasi teknik..."
                            value={ekskulSessionKet} onChange={e => setEkskulSessionKet(e.target.value)} />
                        </div>
                      </div>

                      {/* Daftar Siswa Checklist */}
                      {selectedEkskulName && (() => {
                        const ekskulStudents = students.filter(s =>
                          (s.extracurriculars && s.extracurriculars.includes(selectedEkskulName)) ||
                          (s.ekskulAttendances && s.ekskulAttendances.some(a => a.session?.ekskulName === selectedEkskulName))
                        ).sort((a,b) => a.kelas.localeCompare(b.kelas) || a.name.localeCompare(b.name));
                        
                        const statusOptions = ["HADIR", "IZIN", "SAKIT", "TIDAK_HADIR"];
                        const statusColor = { HADIR: "#16a34a", IZIN: "#2563eb", SAKIT: "#d97706", TIDAK_HADIR: "#dc2626" };
                        const statusLabel = { HADIR: "Hadir", IZIN: "Izin", SAKIT: "Sakit", TIDAK_HADIR: "Alfa" };
                        
                        if (ekskulStudents.length === 0) {
                          return (
                            <div style={{ padding: "1.5rem", textAlign: "center", color: "#b45309", background: "#fef3c7", borderRadius: "8px" }}>
                              ⚠️ Belum ada siswa yang tercatat/terdaftar sebagai peserta ekskul <strong>{selectedEkskulName}</strong>. Siswa dapat mendaftar dari Portal Siswa.
                            </div>
                          );
                        }

                        return (
                          <div>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                              <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--primary)" }}>
                                Peserta Terdaftar Ekskul {selectedEkskulName} ({ekskulStudents.length} siswa)
                              </span>
                              <div style={{ display: "flex", gap: "0.4rem" }}>
                                <button type="button" className="btn btn-outline" style={{ fontSize: "0.72rem", padding: "0.25rem 0.65rem" }}
                                  onClick={() => {
                                    const m = {};
                                    ekskulStudents.forEach(s => { m[s.nisn] = "HADIR"; });
                                    setEkskulAttMap(m);
                                  }}>✓ Semua Hadir</button>
                              </div>
                            </div>
                            <div style={{ maxHeight: "300px", overflowY: "auto", border: "1px solid #e5e7eb", borderRadius: "8px" }}>
                              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem" }}>
                                <thead>
                                  <tr style={{ background: "var(--primary)", color: "#fff", position: "sticky", top: 0, zIndex: 1 }}>
                                    <th style={{ padding: "7px 10px", textAlign: "left" }}>Nama Siswa</th>
                                    <th style={{ padding: "7px 6px", textAlign: "center", width: "40px" }}>Kelas</th>
                                    {statusOptions.map(s => (
                                      <th key={s} style={{ padding: "7px 4px", textAlign: "center", width: "64px", background: statusColor[s] }}>
                                        {statusLabel[s]}
                                      </th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {ekskulStudents.map((s, i) => (
                                    <tr key={s.nisn} style={{ background: i % 2 === 0 ? "#fff" : "#f8fafc", borderBottom: "1px solid #f1f5f9" }}>
                                      <td style={{ padding: "6px 10px", fontWeight: 500 }}>{s.name}</td>
                                      <td style={{ padding: "6px", textAlign: "center", color: "#64748b", fontSize: "0.75rem" }}>{s.kelas}</td>
                                      {statusOptions.map(st => (
                                        <td key={st} style={{ padding: "6px 4px", textAlign: "center" }}>
                                          <input type="radio" name={`att-${s.nisn}`}
                                            checked={ekskulAttMap[s.nisn] === st}
                                            onChange={() => setEkskulAttMap(prev => ({ ...prev, [s.nisn]: st }))}
                                            style={{ accentColor: statusColor[st], width: "16px", height: "16px", cursor: "pointer" }} />
                                        </td>
                                      ))}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                            {ekskulSessionMsg && (
                              <div className={`form-alert ${ekskulSessionMsg.startsWith("Gagal") ? "error" : "success"}`} style={{ display: "block", marginTop: "0.75rem" }}>
                                {ekskulSessionMsg}
                              </div>
                            )}
                            <div style={{ marginTop: "0.75rem", display: "flex", justifyContent: "flex-end" }}>
                              <button className="btn btn-primary" style={{ padding: "0.5rem 1.5rem", fontSize: "0.85rem" }}
                                disabled={ekskulSessionLoading || !ekskulSessionDate}
                                onClick={async () => {
                                  const attList = ekskulStudents
                                    .filter(s => ekskulAttMap[s.nisn])
                                    .map(s => ({ studentNisn: s.nisn, status: ekskulAttMap[s.nisn] }));
                                  if (attList.length === 0) { setEkskulSessionMsg("Isi kehadiran minimal 1 siswa."); return; }
                                  setEkskulSessionLoading(true);
                                  const res = await saveEkskulSession(selectedEkskulName, ekskulSessionDate, ekskulSessionKet, attList);
                                  setEkskulSessionLoading(false);
                                  if (res.success) {
                                    setEkskulSessionMsg("✓ Absensi berhasil disimpan!");
                                    setEkskulAttMap({});
                                    setEkskulSessionKet("");
                                    const r2 = await getEkskulSessions(selectedEkskulName);
                                    if (r2.success) setEkskulSessions(r2.sessions);
                                  } else setEkskulSessionMsg("Gagal: " + res.error);
                                }}>
                                {ekskulSessionLoading ? "⏳ Menyimpan..." : "💾 Simpan Absensi"}
                              </button>
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Riwayat Sesi */}
                    {ekskulSessions.length > 0 && (
                      <div>
                        <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "0.5rem" }}>
                          Riwayat Pertemuan ({ekskulSessions.length})
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxHeight: "260px", overflowY: "auto" }}>
                          {ekskulSessions.map(s => {
                            const hadir = s.attendances.filter(a => a.status === "HADIR").length;
                            const total = s.attendances.length;
                            return (
                              <div key={s.id} style={{ display: "flex", alignItems: "center", gap: "0.75rem", background: "#f8fafc", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "0.65rem 0.9rem" }}>
                                <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--primary)", minWidth: "80px" }}>
                                  {new Date(s.date).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
                                </div>
                                <div style={{ flex: 1, fontSize: "0.78rem", color: "#475569" }}>{s.keterangan || "-"}</div>
                                <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#16a34a" }}>{hadir}/{total} hadir</div>
                                <button type="button" style={{ background: "none", border: "none", color: "#dc2626", cursor: "pointer", fontSize: "0.75rem", padding: "2px 6px" }}
                                  onClick={async () => {
                                    if (!confirm("Hapus sesi ini?")) return;
                                    const res = await deleteEkskulSession(s.id);
                                    if (res.success) setEkskulSessions(prev => prev.filter(x => x.id !== s.id));
                                    else alert("Gagal: " + res.error);
                                  }}>🗑</button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ─── REKAP BULANAN EKSKUL ─── */}
                {activeTab === "ekskul" && (
                  <div className="card" style={{ marginTop: "1.5rem", padding: "1.25rem", borderTop: "3px solid var(--secondary)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem", flexWrap: "wrap" }}>
                      <div style={{ background: "linear-gradient(135deg, #f59e0b, #b45309)", borderRadius: "50%", width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", color: "#ffffff", boxShadow: "0 2px 5px rgba(245,158,11,0.3)", flexShrink: 0 }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M8 14h4"/><path d="M8 18h8"/></svg>
                      </div>
                      <span style={{ fontWeight: 800, fontSize: "0.9rem", color: "var(--primary)" }}>Rekap Bulanan Ekskul</span>
                      <div style={{ flex: 1 }} />
                      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
                        <select className="form-input" style={{ fontSize: "0.82rem", padding: "0.35rem 0.6rem", minWidth: "110px" }}
                          value={ekskulRekapBulan} onChange={e => setEkskulRekapBulan(e.target.value)}>
                          {["1","2","3","4","5","6","7","8","9","10","11","12"].map(m => (
                            <option key={m} value={m}>{new Date(2000,parseInt(m)-1,1).toLocaleString("id-ID",{month:"long"})}</option>
                          ))}
                        </select>
                        <select className="form-input" style={{ fontSize: "0.82rem", padding: "0.35rem 0.6rem", minWidth: "80px" }}
                          value={ekskulRekapTahun} onChange={e => setEkskulRekapTahun(e.target.value)}>
                          {["2024","2025","2026","2027"].map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                        <button className="btn btn-primary" style={{ fontSize: "0.82rem", padding: "0.4rem 1rem" }}
                          disabled={ekskulRekapLoading || !selectedEkskulName}
                          onClick={async () => {
                            if (!selectedEkskulName) { alert("Pilih ekskul terlebih dahulu."); return; }
                            setEkskulRekapLoading(true);
                            const res = await getEkskulFullRecap(selectedEkskulName, ekskulRekapBulan, ekskulRekapTahun);
                            setEkskulRekapLoading(false);
                            if (res.success) setEkskulRekapData(res);
                            else alert("Gagal: " + res.error);
                          }}>
                          {ekskulRekapLoading ? "⏳..." : "▶ Tampilkan"}
                        </button>
                        {ekskulRekapData && ekskulRekapData.recap.length > 0 && (
                          <button className="btn btn-outline" style={{ fontSize: "0.82rem", padding: "0.4rem 0.9rem" }}
                            onClick={() => {
                              const printWin = window.open("", "_blank");
                              const bulanNama = new Date(2000, parseInt(ekskulRekapData.bulan)-1, 1).toLocaleString("id-ID", { month: "long" });
                              const dateHeaders = ekskulRekapData.dates.map(d => `<th style="min-width:28px;padding:3px 2px">${parseInt(d.split("-")[2])}</th>`).join("");
                              const rows = ekskulRekapData.recap.map(s => {
                                const dailyCells = ekskulRekapData.dates.map(d => {
                                  const st = s.perSesi[d];
                                  const clr = !st ? "#ccc" : st === "HADIR" ? "#16a34a" : st === "IZIN" ? "#2563eb" : st === "SAKIT" ? "#d97706" : "#dc2626";
                                  const lbl = !st ? "·" : st === "HADIR" ? "H" : st === "IZIN" ? "I" : st === "SAKIT" ? "S" : "A";
                                  return `<td style="text-align:center;color:${clr};font-weight:bold">${lbl}</td>`;
                                }).join("");
                                return `<tr><td style="text-align:center">${s.no}</td><td>${s.name}</td><td style="text-align:center">${s.kelas}</td>${dailyCells}<td style="text-align:center;color:#16a34a;font-weight:bold">${s.hadir}</td><td style="text-align:center;color:#dc2626;font-weight:bold">${s.tidakHadir + s.izin + s.sakit}</td><td style="text-align:center;font-weight:bold">${s.pctHadir}%</td><td style="text-align:center;font-weight:bold">${s.nilai}</td><td>${s.predikat}</td></tr>`;
                              }).join("");
                              printWin.document.write(`<!DOCTYPE html><html><head>
                                <title>Rekap Ekskul - ${ekskulRekapData.ekskulName} - ${bulanNama} ${ekskulRekapData.tahun}</title>
                                <style>
                                  body{font-family:Arial,sans-serif;font-size:10px;margin:10mm;color:#111}
                                  h2{text-align:center;font-size:13px;margin-bottom:2px}
                                  h3{text-align:center;font-size:10px;color:#555;margin:0 0 8px}
                                  .info{margin-bottom:8px;font-size:10px}
                                  table{width:100%;border-collapse:collapse}
                                  th,td{border:1px solid #ccc;padding:3px 4px;font-size:9px;vertical-align:middle}
                                  th{background:#1e3a5f;color:#fff;text-align:center}
                                  .sign{margin-top:24px;display:grid;grid-template-columns:1fr 1fr;gap:20px}
                                  .sign-box{text-align:center;font-size:9px}
                                  .sign-line{border-bottom:1px solid #333;height:36px;margin-bottom:4px}
                                  @media print{@page{size:A4 landscape;margin:10mm}body{margin:0}}
                                </style>
                              </head><body>
                                <h2>REKAP KEHADIRAN & NILAI EKSTRAKURIKULER</h2>
                                <h3>Sekolah Master Demo</h3>
                                <div class="info">
                                  <strong>Ekskul:</strong> ${ekskulRekapData.ekskulName} &nbsp;|&nbsp;
                                  <strong>Periode:</strong> ${bulanNama} ${ekskulRekapData.tahun} &nbsp;|&nbsp;
                                  <strong>Pembina:</strong> ${ekskulRekapData.teacherName} &nbsp;|&nbsp;
                                  <strong>Total Pertemuan:</strong> ${ekskulRekapData.totalPertemuan}
                                </div>
                                <table>
                                  <thead><tr>
                                    <th style="width:24px">No</th>
                                    <th style="min-width:130px">Nama Siswa</th>
                                    <th style="width:40px">Kelas</th>
                                    ${dateHeaders}
                                    <th style="background:#16a34a;width:35px">H</th>
                                    <th style="background:#dc2626;width:35px">TH</th>
                                    <th style="width:40px">%Hadir</th>
                                    <th style="width:40px">Nilai</th>
                                    <th style="min-width:100px">Predikat</th>
                                  </tr></thead>
                                  <tbody>${rows}</tbody>
                                </table>
                                <div style="margin-top:6px;font-size:9px;color:#555">Keterangan: H=Hadir, I=Izin, S=Sakit, A=Alpha/Tidak Hadir</div>
                                <div class="sign">
                                  <div class="sign-box"><div class="sign-line"></div>Pembina Ekskul<br><strong>${ekskulRekapData.teacherName}</strong></div>
                                  <div class="sign-box"><div class="sign-line"></div>Mengetahui<br>Kepala Sekolah</div>
                                </div>
                              </body></html>`);
                              printWin.document.close();
                              printWin.focus();
                              setTimeout(() => printWin.print(), 500);
                            }}>
                            🖨️ Cetak PDF
                          </button>
                        )}
                      </div>
                    </div>

                    {!ekskulRekapData ? (
                      <div style={{ textAlign: "center", padding: "2.5rem 1rem", color: "#64748b" }}>
                        <div style={{ width: "52px", height: "52px", borderRadius: "50%", background: "rgba(6,95,70,0.08)", color: "var(--primary)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: "0.75rem" }}>
                          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                        </div>
                        <p style={{ fontSize: "0.88rem", margin: 0, fontWeight: 500 }}>Pilih ekskul di atas, lalu tentukan bulan & klik <strong style={{ color: "var(--primary)" }}>▶ Tampilkan</strong></p>
                      </div>
                    ) : ekskulRekapData.recap.length === 0 ? (
                      <div style={{ textAlign: "center", padding: "1.5rem", color: "#aaa" }}>
                        <div style={{ fontSize: "2rem" }}>📭</div>
                        <p>Belum ada data absensi ekskul pada periode ini.</p>
                      </div>
                    ) : (
                      <div style={{ overflowX: "auto" }}>
                        <div style={{ marginBottom: "0.5rem", fontSize: "0.78rem", color: "#888" }}>
                          <strong style={{ color: "var(--primary)" }}>{ekskulRekapData.recap.length}</strong> siswa &bull;
                          <strong style={{ color: "var(--primary)" }}> {ekskulRekapData.totalPertemuan}</strong> pertemuan &bull;
                          <strong style={{ color: "var(--primary)" }}> {new Date(2000, parseInt(ekskulRekapData.bulan)-1, 1).toLocaleString("id-ID", { month: "long" })}</strong> {ekskulRekapData.tahun}
                        </div>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.76rem" }}>
                          <thead>
                            <tr style={{ background: "var(--primary)", color: "#fff" }}>
                              <th style={{ padding: "7px 5px", textAlign: "center", width: "30px" }}>No</th>
                              <th style={{ padding: "7px 8px", textAlign: "left", minWidth: "140px" }}>Nama Siswa</th>
                              <th style={{ padding: "7px 5px", textAlign: "center", width: "45px" }}>Kelas</th>
                              {ekskulRekapData.dates.map(d => (
                                <th key={d} style={{ padding: "5px 3px", textAlign: "center", minWidth: "28px", fontWeight: 600 }}>
                                  {parseInt(d.split("-")[2])}
                                </th>
                              ))}
                              <th style={{ padding: "7px 5px", textAlign: "center", background: "#16a34a", width: "38px" }}>H</th>
                              <th style={{ padding: "7px 5px", textAlign: "center", background: "#dc2626", width: "38px" }}>TH</th>
                              <th style={{ padding: "7px 5px", textAlign: "center", width: "50px" }}>%Hadir</th>
                              <th style={{ padding: "7px 5px", textAlign: "center", width: "50px" }}>Nilai</th>
                              <th style={{ padding: "7px 8px", textAlign: "left", minWidth: "100px" }}>Predikat</th>
                            </tr>
                          </thead>
                          <tbody>
                            {ekskulRekapData.recap.map((s, i) => (
                              <tr key={s.nisn} style={{ background: i % 2 === 0 ? "#fff" : "#f8fafc", borderBottom: "1px solid #e5e7eb" }}>
                                <td style={{ padding: "5px", textAlign: "center", color: "#888" }}>{s.no}</td>
                                <td style={{ padding: "5px 8px", fontWeight: 500 }}>{s.name}</td>
                                <td style={{ padding: "5px", textAlign: "center", color: "#64748b", fontSize: "0.72rem" }}>{s.kelas}</td>
                                {ekskulRekapData.dates.map(d => {
                                  const st = s.perSesi[d];
                                  const clr = !st ? "#ddd" : st === "HADIR" ? "#16a34a" : st === "IZIN" ? "#2563eb" : st === "SAKIT" ? "#d97706" : "#dc2626";
                                  const lbl = !st ? "·" : st === "HADIR" ? "H" : st === "IZIN" ? "I" : st === "SAKIT" ? "S" : "A";
                                  return <td key={d} style={{ padding: "4px 3px", textAlign: "center", color: clr, fontWeight: st ? "bold" : "normal" }}>{lbl}</td>;
                                })}
                                <td style={{ padding: "5px", textAlign: "center", color: "#16a34a", fontWeight: "bold" }}>{s.hadir}</td>
                                <td style={{ padding: "5px", textAlign: "center", color: "#dc2626", fontWeight: "bold" }}>{s.tidakHadir + s.izin + s.sakit}</td>
                                <td style={{ padding: "5px", textAlign: "center", fontWeight: "bold", color: s.pctHadir >= 75 ? "#16a34a" : "#dc2626" }}>{s.pctHadir}%</td>
                                <td style={{ padding: "5px", textAlign: "center", fontWeight: "bold", color: "var(--primary)" }}>{s.nilai}</td>
                                <td style={{ padding: "5px 8px", color: "#475569", fontSize: "0.72rem" }}>{s.predikat}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <div style={{ marginTop: "0.5rem", fontSize: "0.72rem", color: "#aaa" }}>
                          <strong style={{color:"#16a34a"}}>H</strong> Hadir &nbsp;·&nbsp; <strong style={{color:"#2563eb"}}>I</strong> Izin &nbsp;·&nbsp; <strong style={{color:"#d97706"}}>S</strong> Sakit &nbsp;·&nbsp; <strong style={{color:"#dc2626"}}>A</strong> Alfa/Tidak Hadir &nbsp;·&nbsp; % merah = di bawah 75%
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 4.c: ABSENSI & CATATAN WALI KELAS */}
                {activeTab === "catatan" && session.role === "wali-kelas" && (
                  <div>
                    <span style={{ fontSize: "0.85rem", textTransform: "uppercase", fontWeight: 700, color: "var(--secondary)" }}>Catatan Rapor</span>
                    <h2 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--primary-dark)", marginBottom: "1.5rem" }}>
                      Absensi & Catatan Wali Kelas
                    </h2>

                    <div className="grid grid-2" style={{ gap: "2rem" }}>
                      {/* Sisi Kiri: Form Input Catatan & Absensi */}
                      <div>
                        {catatanMessage && (
                          <div className={`form-alert ${catatanMessage.startsWith("Gagal") ? "error" : "success"}`} style={{ display: "block", marginBottom: "1.5rem" }}>
                            {catatanMessage}
                          </div>
                        )}

                        <form onSubmit={handleCatatanSubmit} style={{ backgroundColor: "var(--bg-alt)", padding: "1.5rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }}>
                          <div className="form-group">
                            <label className="form-label">Pilih Siswa</label>
                            <select 
                              className="form-select" 
                              value={selectedCatatanStudentNisn}
                              onChange={(e) => handleCatatanStudentSelect(e.target.value)}
                              required
                            >
                              <option value="">-- Pilih Siswa --</option>
                              {students
                                .filter(s => s.kelas === session.kelas)
                                .map(s => (
                                  <option key={s.nisn} value={s.nisn}>{s.name}</option>
                                ))}
                            </select>
                          </div>

                          <div className="form-group" style={{ marginTop: "1rem" }}>
                            <label className="form-label">Catatan Wali Kelas</label>
                            <textarea 
                              className="form-textarea" 
                              placeholder="Tuliskan perkembangan belajar siswa, nasihat, dan motivasi untuk lembar rapor..."
                              value={catatanWali}
                              onChange={(e) => setCatatanWali(e.target.value)}
                              required
                              style={{ height: "120px" }}
                            />
                          </div>

                          <div style={{ marginTop: "1.5rem", borderTop: "1px solid var(--border-color)", paddingTop: "1rem" }}>
                            <h4 style={{ fontWeight: 700, marginBottom: "1rem" }}>Ketidakhadiran (Absensi)</h4>
                            <div className="grid grid-3" style={{ gap: "1rem" }}>
                              <div className="form-group">
                                <label className="form-label">Sakit (Hari)</label>
                                <input 
                                  type="number" 
                                  className="form-input" 
                                  min="0"
                                  value={sakit}
                                  onChange={(e) => setSakit(parseInt(e.target.value, 10) || 0)}
                                  required 
                                />
                              </div>
                              <div className="form-group">
                                <label className="form-label">Izin (Hari)</label>
                                <input 
                                  type="number" 
                                  className="form-input" 
                                  min="0"
                                  value={izin}
                                  onChange={(e) => setIzin(parseInt(e.target.value, 10) || 0)}
                                  required 
                                />
                              </div>
                              <div className="form-group">
                                <label className="form-label">Tanpa Keterangan (Hari)</label>
                                <input 
                                  type="number" 
                                  className="form-input" 
                                  min="0"
                                  value={alfa}
                                  onChange={(e) => setAlfa(parseInt(e.target.value, 10) || 0)}
                                  required 
                                />
                              </div>
                            </div>
                          </div>

                          {/* Pengaturan Kenaikan Kelas / Kelulusan (Hanya Genap) */}
                          {school?.semester === "Genap" && (
                            <div style={{ marginTop: "1.5rem", borderTop: "1px solid var(--border-color)", paddingTop: "1rem" }}>
                              <h4 style={{ fontWeight: 700, marginBottom: "1rem" }}>Keputusan Akhir Tahun Ajaran</h4>
                              <div className="form-group">
                                <label className="form-label">Status Kenaikan / Kelulusan</label>
                                <select 
                                  className="form-select"
                                  value={naikKelas}
                                  onChange={(e) => setNaikKelas(e.target.value)}
                                  required
                                >
                                  <option value="">-- Pilih Keputusan --</option>
                                  {session.kelas.startsWith("XII") ? (
                                    <>
                                      <option value="true">LULUS</option>
                                      <option value="false">TIDAK LULUS</option>
                                    </>
                                  ) : (
                                    <>
                                      <option value="true">NAIK KELAS</option>
                                      <option value="false">TINGGAL KELAS</option>
                                    </>
                                  )}
                                </select>
                              </div>
                            </div>
                          )}

                          <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: "1.5rem" }}>
                            Simpan Catatan & Absensi
                          </button>
                        </form>
                      </div>

                      {/* Sisi Kanan: Ringkasan Catatan & Absensi Terinput */}
                      <div>
                        <h3 style={{ fontWeight: 700, color: "var(--primary-dark)", marginBottom: "1rem" }}>Absensi & Catatan Rapor Terinput</h3>
                        <div className="portal-table-container">
                          <table className="portal-table">
                            <thead>
                              <tr>
                                <th>Siswa</th>
                                <th style={{ textAlign: "center" }}>S / I / A</th>
                                <th>Catatan Wali</th>
                                {school?.semester === "Genap" && <th style={{ textAlign: "center" }}>Status</th>}
                              </tr>
                            </thead>
                            <tbody>
                              {students
                                .filter(s => s.kelas === session.kelas)
                                .map(s => {
                                  const activeSem = getStudentActiveSemester(s.kelas, school?.semester);
                                  const rec = s.raporRecords.find(r => r.semester === activeSem);
                                  return (
                                    <tr key={s.nisn}>
                                      <td><strong>{s.name}</strong></td>
                                      <td style={{ textAlign: "center" }}>{rec ? `${rec.sakit} / ${rec.izin} / ${rec.alfa}` : "0 / 0 / 0"}</td>
                                      <td style={{ fontSize: "0.85rem", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                        {rec ? rec.catatanWali : "-"}
                                      </td>
                                      {school?.semester === "Genap" && (
                                        <td style={{ textAlign: "center" }}>
                                          {rec && rec.naikKelas !== null ? (
                                            rec.naikKelas ? (
                                              <span className="badge-info" style={{ backgroundColor: "#22c55e", color: "white" }}>
                                                {session.kelas.startsWith("XII") ? "Lulus" : "Naik"}
                                              </span>
                                            ) : (
                                              <span className="badge-info" style={{ backgroundColor: "#ef4444", color: "white" }}>
                                                {session.kelas.startsWith("XII") ? "Tidak Lulus" : "Tinggal"}
                                              </span>
                                            )
                                          ) : (
                                            <span style={{ color: "var(--text-muted)" }}>-</span>
                                          )}
                                        </td>
                                      )}
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

                {/* TAB: PERPUSTAKAAN DIGITAL */}
                {activeTab === "digital-library" && (
                  <DigitalLibraryViewer />
                )}

                {/* TAB BARU: PORTOFOLIO DKV */}
                {activeTab === "portofolio" && (
                  <div className="no-print">
                    <span style={{ fontSize: "0.85rem", textTransform: "uppercase", fontWeight: 700, color: "var(--secondary)" }}>Portofolio Siswa</span>
                    <h2 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--primary-dark)", marginBottom: "1.5rem" }}>
                      Galeri Karya Portofolio DKV
                    </h2>

                    <div style={{ display: "flex", gap: "1rem", alignItems: "center", marginBottom: "2rem", backgroundColor: "var(--bg-alt)", padding: "1rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }}>
                      <div className="form-group" style={{ minWidth: "150px", margin: 0 }}>
                        <label className="form-label" style={{ fontWeight: 700 }}>Filter Kelas</label>
                        <select className="form-select" value={filterClass} onChange={(e) => setFilterClass(e.target.value)}>
                          <option value="">Semua Kelas</option>
                          {[...new Set(students.map(s => s.kelas).filter(Boolean))].sort().map(k => (
                            <option key={k} value={k}>{k}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1.5rem" }}>
                      {students.filter(s => !filterClass || s.kelas === filterClass).map(student => (
                        (student.portfolios || []).map(port => (
                          <div key={port.id} style={{ backgroundColor: "white", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", overflow: "hidden", boxShadow: "var(--shadow-sm)", display: "flex", flexDirection: "column" }}>
                            <div style={{ padding: "1.25rem", borderBottom: "1px solid var(--border-color)", flex: 1 }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                                <span style={{ display: "inline-block", fontSize: "0.7rem", backgroundColor: "var(--bg-alt)", padding: "0.2rem 0.5rem", borderRadius: "4px", fontWeight: "bold" }}>{port.kategori}</span>
                                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: "bold" }}>{student.kelas}</span>
                              </div>
                              <h4 style={{ margin: "0 0 0.5rem 0", color: "var(--primary-dark)" }}>{port.judul}</h4>
                              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: "0 0 1rem 0" }}>{port.deskripsi || "-"}</p>
                              <div style={{ borderTop: "1px dashed var(--border-color)", paddingTop: "0.5rem", fontSize: "0.8rem" }}>
                                <strong>Siswa:</strong> {student.name} <br/>
                                <span style={{ color: "var(--text-muted)" }}>NISN: {student.nisn}</span>
                              </div>
                            </div>
                            <div style={{ padding: "1rem", backgroundColor: "var(--bg-alt)", textAlign: "center", display: "flex", gap: "0.5rem" }}>
                              <a href={port.fileUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ flex: 1, padding: "0.4rem 0.5rem", fontSize: "0.8rem", textAlign: "center" }}>Lihat File</a>
                              <button 
                                onClick={() => { 
                                  setSelectedPortfolioForGrade(port); 
                                  setShowGradeModal(true); 
                                  setGradeForm({ 
                                    kreativitas: port.nilaiKreativitas || 0, 
                                    teknik: port.nilaiTeknik || 0, 
                                    kesesuaian: port.nilaiKesesuaian || 0, 
                                    catatan: port.catatanGuru || "", 
                                    subjectName: activeSubject?.name || "", 
                                    semester: selectedSemester || "1" 
                                  }); 
                                  setGradePortfolioMessage(""); 
                                }} 
                                className="btn btn-warning" 
                                style={{ flex: 1, padding: "0.4rem 0.5rem", fontSize: "0.8rem", textAlign: "center", color: "white", backgroundColor: "var(--secondary)", border: "none" }}
                              >
                                {port.nilaiKreativitas ? "Edit Nilai" : "Beri Nilai"}
                              </button>
                            </div>
                          </div>
                        ))
                      ))}
                      {students.filter(s => !filterClass || s.kelas === filterClass).every(s => !s.portfolios || s.portfolios.length === 0) && (
                        <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "3rem 1.5rem", backgroundColor: "var(--bg-alt)", borderRadius: "var(--radius-md)", border: "1px dashed var(--border-color)", color: "var(--text-muted)" }}>
                          <p style={{ margin: 0, fontStyle: "italic" }}>Belum ada karya portofolio yang diunggah oleh siswa di kelas ini.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 4.c: HASIL UJIAN SISWA */}
                    {activeTab === "hasil" && (
                      <div className="no-print">
                        <span style={{ fontSize: "0.85rem", textTransform: "uppercase", fontWeight: 700, color: "var(--secondary)" }}>Hasil Ujian</span>
                        <h2 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--primary-dark)", marginBottom: "1rem" }}>
                          Analisis & Nilai Hasil Ujian Siswa
                        </h2>

                        <div style={{ display: "flex", gap: "1rem", alignItems: "center", marginBottom: "2rem", backgroundColor: "var(--bg-alt)", padding: "1rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }}>
                          <div className="form-group" style={{ minWidth: "150px", margin: 0 }}>
                            <label className="form-label" style={{ fontWeight: 700 }}>Kategori</label>
                            <select className="form-select" value={hasilCategory} onChange={(e) => { setHasilCategory(e.target.value); setSelectedSubmission(null); }}>
                              <option value="UTS">UTS</option>
                              <option value="UAS">UAS</option>
                              <option value="PAJ">PAJ (Akhir Jenjang)</option>
                            </select>
                          </div>

                          <div className="form-group" style={{ minWidth: "150px", margin: 0 }}>
                            <label className="form-label" style={{ fontWeight: 700 }}>Semester</label>
                            <select className="form-select" value={hasilSemester} onChange={(e) => { setHasilSemester(e.target.value); setSelectedSubmission(null); }}>
                              <option value="1">Semester 1</option>
                              <option value="2">Semester 2</option>
                              <option value="3">Semester 3</option>
                              <option value="4">Semester 4</option>
                              <option value="5">Semester 5</option>
                              <option value="6">Semester 6</option>
                            </select>
                          </div>

                          <div style={{ marginLeft: "auto", fontSize: "0.9rem", color: "var(--text-muted)" }}>
                            Mata Pelajaran: <strong>{activeSubject?.name}</strong>
                          </div>
                        </div>

                        <div className="grid grid-2" style={{ gap: "2rem", alignItems: "start" }}>
                          {/* Sisi Kiri: Daftar Siswa & Status Ujian */}
                          <div>
                            <h3 style={{ fontWeight: 700, color: "var(--primary-dark)", marginBottom: "1rem" }}>Status Ujian Kelas {session.kelas || "Semua"}</h3>
                            <div className="portal-table-container">
                              <table className="portal-table">
                                <thead>
                                  <tr>
                                    <th>Nama Siswa</th>
                                    <th>Status</th>
                                    <th style={{ textAlign: "center" }}>Skor</th>
                                    <th style={{ textAlign: "center" }}>Aksi</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {students
                                    .filter(s => !session.kelas || normalizeClass(s.kelas) === normalizeClass(session.kelas))
                                    .map((s) => {
                                      const sub = submissions.find(sub => sub.studentNisn === s.nisn);
                                      return (
                                        <tr key={s.nisn} style={{ backgroundColor: selectedSubmission?.id === sub?.id ? "var(--primary-light)" : "transparent" }}>
                                          <td>
                                            <strong>{s.name}</strong>
                                            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>NISN: {s.nisn}</div>
                                          </td>
                                          <td>
                                            {sub ? (
                                              <span className="badge-info" style={{ backgroundColor: "#22c55e", color: "white" }}>Selesai</span>
                                            ) : (
                                              <span className="badge-info" style={{ backgroundColor: "#ef4444", color: "white" }}>Belum Ujian</span>
                                            )}
                                          </td>
                                          <td style={{ textAlign: "center", fontWeight: "bold", fontSize: "1.1rem" }}>
                                            {sub ? sub.score : "-"}
                                          </td>
                                          <td style={{ textAlign: "center" }}>
                                            {sub ? (
                                              <button 
                                                className="btn btn-primary" 
                                                style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem" }}
                                                onClick={() => {
                                                  setSelectedSubmission(sub);
                                                  setOverrideScoreInput(String(sub.score));
                                                }}
                                              >
                                                🔍 Periksa
                                              </button>
                                            ) : (
                                              <button className="btn btn-outline" disabled style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem", opacity: 0.5 }}>-</button>
                                            )}
                                          </td>
                                        </tr>
                                      );
                                    })}
                                </tbody>
                              </table>
                            </div>
                          </div>

                          {/* Sisi Kanan: Detail Jawaban & Override Skor */}
                          <div>
                            {selectedSubmission ? (
                              <div style={{ backgroundColor: "var(--bg-alt)", border: "1px solid var(--border-color)", padding: "1.5rem", borderRadius: "var(--radius-md)" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", borderBottom: "1px solid var(--border-color)", paddingBottom: "0.75rem" }}>
                                  <div>
                                    <h3 style={{ margin: 0, fontWeight: 800, color: "var(--primary-dark)" }}>Lembar Jawaban Siswa</h3>
                                    <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Nama: <strong>{selectedSubmission.student.name}</strong></span>
                                  </div>
                                  <button className="btn btn-outline" style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem" }} onClick={() => setSelectedSubmission(null)}>Tutup</button>
                                </div>

                                {/* Form Override Nilai */}
                                <form onSubmit={handleOverrideScoreSubmit} style={{ display: "flex", gap: "0.5rem", alignItems: "center", backgroundColor: "white", padding: "1rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)", marginBottom: "1.5rem" }}>
                                  <div style={{ flex: 1 }}>
                                    <label className="form-label" style={{ fontWeight: "bold", fontSize: "0.8", marginBottom: "0.25rem" }}>Skor Ujian (Dapat Dinilai Manual / Diubah)</label>
                                    <input 
                                      type="number" 
                                      className="form-input" 
                                      value={overrideScoreInput} 
                                      onChange={(e) => setOverrideScoreInput(e.target.value)} 
                                      min="0" 
                                      max="100" 
                                      required 
                                    />
                                  </div>
                                  <button type="submit" className="btn btn-primary" style={{ alignSelf: "flex-end", height: "42px" }}>
                                    💾 Simpan Nilai Baru
                                  </button>
                                </form>

                                {/* Tautan Berkas Jawaban Siswa (jika ada) */}
                                {selectedSubmission.filePath && (
                                  <div style={{ backgroundColor: "#fef3c7", border: "1px solid #f59e0b", padding: "1rem", borderRadius: "var(--radius-sm)", marginBottom: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <div>
                                      <span style={{ fontSize: "0.85rem", fontWeight: "bold", color: "#b45309" }}>📂 Lembar Jawaban Dokumen Siswa</span>
                                      <div style={{ fontSize: "0.75rem", color: "#b45309" }}>Siswa melampirkan berkas jawaban mandiri.</div>
                                    </div>
                                    <a href={selectedSubmission.filePath} target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ backgroundColor: "#d97706", borderColor: "#d97706", padding: "0.4rem 0.8rem", fontSize: "0.8rem" }}>
                                      📥 Unduh Jawaban
                                    </a>
                                  </div>
                                )}

                                {/* Rincian Jawaban Soal per Soal */}
                                <h4 style={{ fontWeight: 700, color: "var(--primary-dark)", marginBottom: "0.75rem" }}>Analisis Butir Soal:</h4>
                                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                                  {(() => {
                                    const examQuestions = questions.filter(q => q.subject === activeSubject?.name && q.category === hasilCategory && q.semester === hasilSemester);
                                    if (examQuestions.length === 0) return <p style={{ fontStyle: "italic", color: "var(--text-muted)" }}>Soal tidak ditemukan untuk kategori ujian ini.</p>;

                                    return examQuestions.map((q, idx) => {
                                      const studentAns = selectedSubmission.answers?.[q.id];
                                      let isCorrect = false;
                                      
                                      if (q.type === "PG") {
                                        isCorrect = studentAns !== undefined && Number(studentAns) === q.correct;
                                      } else if (q.type === "PGK") {
                                        isCorrect = Array.isArray(studentAns) && q.correctChoices &&
                                                    studentAns.length === q.correctChoices.length &&
                                                    studentAns.every(v => q.correctChoices.includes(Number(v)));
                                      } else if (q.type === "MENJODOHKAN") {
                                        isCorrect = studentAns && typeof studentAns === "object" && q.matchingLeft && q.matchingRight &&
                                                    q.matchingLeft.every((_, lIdx) => {
                                                      const chosenRightIdx = studentAns[lIdx];
                                                      return chosenRightIdx !== undefined && q.matchingRight?.[chosenRightIdx] === q.matchingRight?.[lIdx];
                                                    });
                                      } else if (q.type === "ISIAN") {
                                        isCorrect = studentAns && typeof studentAns === "string" && 
                                                    studentAns.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();
                                      }

                                      return (
                                        <div key={q.id} style={{ padding: "1rem", borderRadius: "var(--radius-sm)", backgroundColor: "white", border: "1px solid var(--border-color)", borderLeft: q.type === "ESSAY" ? "4px solid #6366f1" : isCorrect ? "4px solid #22c55e" : "4px solid #ef4444" }}>
                                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.25rem" }}>
                                            <span style={{ fontSize: "0.75rem", fontWeight: "bold", color: "var(--text-muted)" }}>Soal {idx + 1} ({q.type})</span>
                                            {q.type !== "ESSAY" ? (
                                              isCorrect ? (
                                                <span style={{ color: "#22c55e", fontWeight: "bold" }}>✓ Benar</span>
                                              ) : (
                                                <span style={{ color: "#ef4444", fontWeight: "bold" }}>✗ Salah</span>
                                              )
                                            ) : (
                                              <span style={{ color: "#6366f1", fontWeight: "bold" }}>📝 Uraian</span>
                                            )}
                                          </div>
                                          
                                          <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--primary-dark)", marginBottom: "0.5rem" }}>{q.question}</div>

                                          {/* Tampilkan Jawaban Siswa & Kunci */}
                                          <div style={{ fontSize: "0.8rem", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                                            {q.type === "PG" && (
                                              <>
                                                <div>Jawaban Siswa: <strong style={{ color: isCorrect ? "#22c55e" : "#ef4444" }}>{studentAns !== undefined ? `${["A", "B", "C", "D"][studentAns]}. ${q.choices?.[studentAns]}` : "Tidak Dijawab"}</strong></div>
                                                <div>Kunci Jawaban: <strong>{["A", "B", "C", "D"][q.correct]}. {q.choices?.[q.correct]}</strong></div>
                                              </>
                                            )}

                                            {q.type === "PGK" && (
                                              <>
                                                <div>Jawaban Siswa: <strong style={{ color: isCorrect ? "#22c55e" : "#ef4444" }}>{Array.isArray(studentAns) && studentAns.length > 0 ? studentAns.map(idx => ["A", "B", "C", "D"][idx]).join(", ") : "Tidak Dijawab"}</strong></div>
                                                <div>Kunci Jawaban: <strong>{q.correctChoices ? q.correctChoices.map(idx => ["A", "B", "C", "D"][idx]).join(", ") : ""}</strong></div>
                                              </>
                                            )}

                                            {q.type === "MENJODOHKAN" && q.matchingLeft && q.matchingRight && (
                                              <>
                                                <div>Jawaban Siswa:</div>
                                                <ul style={{ margin: 0, paddingLeft: "1.2rem" }}>
                                                  {q.matchingLeft.map((leftVal, lIdx) => {
                                                    const matchedIdx = studentAns?.[lIdx];
                                                    const isPairCorrect = matchedIdx !== undefined && q.matchingRight?.[matchedIdx] === q.matchingRight?.[lIdx];
                                                    return (
                                                      <li key={lIdx} style={{ color: isPairCorrect ? "#22c55e" : "#ef4444" }}>
                                                        {leftVal} ➔ {matchedIdx !== undefined ? q.matchingRight?.[matchedIdx] : "Tidak Dijawab"} {isPairCorrect ? "✓" : "✗"}
                                                      </li>
                                                    );
                                                  })}
                                                </ul>
                                              </>
                                            )}

                                            
                                            {q.type === "ISIAN" && (
                                              <>
                                                <div>Jawaban Siswa: <strong style={{ color: isCorrect ? "#22c55e" : "#ef4444" }}>{studentAns || "Tidak Dijawab"}</strong></div>
                                                <div>Kunci Jawaban: <strong>{q.correctAnswer}</strong></div>
                                                <div style={{ marginTop: "1rem", display: "flex", gap: "0.5rem", alignItems: "center", backgroundColor: "#fff7ed", padding: "0.5rem", borderRadius: "4px" }}>
                                                  <label style={{ fontSize: "0.8rem", fontWeight: "bold", color: "#c2410c" }}>Koreksi Manual Isian (0-10):</label>
                                                  <input 
                                                    type="number" 
                                                    className="form-input" 
                                                    style={{ width: "80px", padding: "0.25rem", fontSize: "0.8rem" }}
                                                    defaultValue={selectedSubmission.essayScores?.[q.id] ?? (isCorrect ? "10" : "0")}
                                                    id={`isian-score-${q.id}`}
                                                    min="0" max="10"
                                                  />
                                                  <button 
                                                    type="button" 
                                                    className="btn btn-primary"
                                                    style={{ padding: "0.25rem 0.75rem", fontSize: "0.8rem", backgroundColor: "#ea580c", borderColor: "#ea580c" }}
                                                    onClick={() => {
                                                      const val = document.getElementById(`isian-score-${q.id}`).value;
                                                      if(val !== "") {
                                                        const num = parseInt(val, 10);
                                                        if (num >= 0 && num <= 10) {
                                                          handleSaveEssayScore(q.id, val);
                                                        } else {
                                                          alert("Nilai isian maksimal adalah 10");
                                                        }
                                                      }
                                                      else alert("Nilai tidak boleh kosong");
                                                    }}
                                                  >
                                                    Simpan Override
                                                  </button>
                                                </div>
                                              </>
                                            )}


                                            {q.type === "ESSAY" && (
                                              <>
                                                <div>Jawaban Siswa:</div>
                                                <div style={{ backgroundColor: "#f9fafb", padding: "0.5rem", borderRadius: "4px", border: "1px solid var(--border-color)", fontWeight: "bold", whiteSpace: "pre-wrap" }}>
                                                  {studentAns || "Tidak Dijawab"}
                                                </div>
                                                {q.correctAnswer && <div style={{ marginTop: "0.25rem" }}>Pedoman Penskoran: <strong>{q.correctAnswer}</strong></div>}
                                                <div style={{ marginTop: "1rem", display: "flex", gap: "0.5rem", alignItems: "center", backgroundColor: "#e0e7ff", padding: "0.5rem", borderRadius: "4px" }}>
                                                  <label style={{ fontSize: "0.8rem", fontWeight: "bold", color: "#3730a3" }}>Beri Nilai Uraian (0-100):</label>
                                                  <input 
                                                    type="number" 
                                                    className="form-input" 
                                                    style={{ width: "80px", padding: "0.25rem", fontSize: "0.8rem" }}
                                                    defaultValue={selectedSubmission.essayScores?.[q.id] ?? ""}
                                                    id={`essay-score-${q.id}`}
                                                    min="0" max="100"
                                                  />
                                                  <button 
                                                    type="button" 
                                                    className="btn btn-primary"
                                                    style={{ padding: "0.25rem 0.75rem", fontSize: "0.8rem", backgroundColor: "#4f46e5", borderColor: "#4f46e5" }}
                                                    onClick={() => {
                                                      const val = document.getElementById(`essay-score-${q.id}`).value;
                                                      if(val !== "") handleSaveEssayScore(q.id, val);
                                                      else alert("Nilai tidak boleh kosong");
                                                    }}
                                                  >
                                                    Simpan Skor Uraian
                                                  </button>
                                                </div>
                                              </>
                                            )}
                                          </div>
                                        </div>
                                      );
                                    });
                                  })()}
                                </div>

                              </div>
                            ) : (
                              <div style={{ textAlign: "center", padding: "3rem", backgroundColor: "var(--bg-alt)", border: "1px dashed var(--border-color)", borderRadius: "var(--radius-md)", color: "var(--text-muted)" }}>
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--primary)", opacity: 0.6, margin: "0 auto 0.75rem auto", display: "block" }}>
                                  <line x1="18" y1="20" x2="18" y2="10" />
                                  <line x1="12" y1="20" x2="12" y2="4" />
                                  <line x1="6" y1="20" x2="6" y2="14" />
                                </svg>
                                <p style={{ margin: "0.5rem 0 0 0", fontStyle: "italic" }}>Pilih siswa di sebelah kiri dan klik "Periksa" untuk melihat detail jawaban lengkap mereka.</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* TAB 5: RAPOR SISWA */}
                    {activeTab === "rapor" && session.role === "wali-kelas" && (
                  <div>
                    <div className="no-print">
                      <span style={{ fontSize: "0.85rem", textTransform: "uppercase", fontWeight: 700, color: "var(--secondary)" }}>Rapor Siswa</span>
                      <h2 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--primary-dark)", marginBottom: "1rem" }}>
                        Cetak Rapor Siswa Kelas: {session.kelas}
                      </h2>

                      <div style={{ display: "flex", gap: "1rem", alignItems: "center", marginBottom: "2rem" }}>
                        <div className="form-group" style={{ minWidth: "300px" }}>
                          <label className="form-label" style={{ fontWeight: 700 }}>Pilih Siswa</label>
                          <select 
                            className="form-select" 
                            value={raporStudentNisn} 
                            onChange={(e) => {
                              const nisn = e.target.value;
                              setRaporStudentNisn(nisn);
                              if (nisn === "__ledger__") {
                                setViewMode("ledger");
                                const norm = (session.kelas || "").trim().toLowerCase();
                                let baseSem = "1";
                                if (norm.startsWith("ix") || norm.includes("kelas xii") || norm.includes("kelas 9") || norm.startsWith("9")) {
                                  baseSem = school?.semester === "Ganjil" ? "5" : "6";
                                } else if (norm.startsWith("viii") || norm.includes("kelas xi") || norm.includes("kelas 8") || norm.startsWith("8")) {
                                  baseSem = school?.semester === "Ganjil" ? "3" : "4";
                                } else {
                                  baseSem = school?.semester === "Ganjil" ? "1" : "2";
                                }
                                setRaporSemester(baseSem);
                              } else if (nisn) {
                                if (viewMode === "ledger") setViewMode("rapor");
                                const stud = students.find(s => s.nisn === nisn);
                                if (stud) {
                                  const activeSem = getStudentActiveSemester(stud.kelas, school?.semester);
                                  setRaporSemester(activeSem);
                                }
                              } else {
                                setRaporSemester("");
                              }
                            }}
                          >
                            <option value="">-- Pilih Siswa --</option>
                            <option value="__ledger__" style={{ fontWeight: "bold", color: "var(--primary)" }}>📂 LEDGER NILAI KOLEKTIF KELAS</option>
                            {getFilteredStudentsForRapor().map(s => (
                              <option value={s.nisn} key={s.nisn}>{s.name} (NIS: {s.nis || "-"})</option>
                            ))}
                          </select>
                        </div>

                        {raporStudentNisn && (
                          <div className="form-group" style={{ minWidth: "180px" }}>
                            <label className="form-label" style={{ fontWeight: 700 }}>Pilih Semester Rapor</label>
                            <select 
                              className="form-select" 
                              value={raporSemester} 
                              disabled={viewMode === "sknr"}
                              onChange={(e) => setRaporSemester(e.target.value)}
                            >
                              {(() => {
                                const stud = raporStudentNisn === "__ledger__" ? null : students.find(s => s.nisn === raporStudentNisn);
                                let maxSem = 6;
                                if (stud) {
                                  const norm = (stud.kelas || "").trim().toLowerCase();
                                  if (norm.startsWith("ix") || norm.includes("kelas xii") || norm.includes("kelas 9") || norm.startsWith("9")) maxSem = 6;
                                  else if (norm.startsWith("viii") || norm.includes("kelas xi") || norm.includes("kelas 8") || norm.startsWith("8")) maxSem = 4;
                                } else {
                                  const norm = (session.kelas || "").trim().toLowerCase();
                                  if (norm.startsWith("ix") || norm.includes("kelas xii") || norm.includes("kelas 9") || norm.startsWith("9")) maxSem = 6;
                                  else if (norm.startsWith("viii") || norm.includes("kelas xi") || norm.includes("kelas 8") || norm.startsWith("8")) maxSem = 4;
                                }
                                
                                const sems = [];
                                for (let i = 1; i <= maxSem; i++) {
                                  sems.push(String(i));
                                }
                                return sems;
                              })().map(sem => (
                                <option value={sem} key={sem}>Semester {sem}</option>
                              ))}
                            </select>
                          </div>
                        )}

                        {raporStudentNisn && (
                          <div style={{ display: "flex", gap: "0.5rem", alignSelf: "flex-end", flexWrap: "wrap" }}>
                            {raporStudentNisn !== "__ledger__" ? (
                              <>
                                <button 
                                  className={`btn ${viewMode === "sampul" ? "btn-primary" : "btn-outline"}`} 
                                  style={{ height: "42px", display: "inline-flex", alignItems: "center", gap: "0.4rem", whiteSpace: "nowrap" }} 
                                  onClick={() => setViewMode("sampul")}
                                >
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
                                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                                  </svg>
                                  Mode Sampul
                                </button>
                                <button 
                                  className={`btn ${viewMode === "rapor" ? "btn-primary" : "btn-outline"}`} 
                                  style={{ height: "42px", display: "inline-flex", alignItems: "center", gap: "0.4rem", whiteSpace: "nowrap" }} 
                                  onClick={() => setViewMode("rapor")}
                                >
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                    <polyline points="14 2 14 8 20 8" />
                                    <line x1="16" y1="13" x2="8" y2="13" />
                                    <line x1="16" y1="17" x2="8" y2="17" />
                                  </svg>
                                  Mode Rapor
                                </button>
                                <button 
                                  className={`btn ${viewMode === "sknr" ? "btn-primary" : "btn-outline"}`} 
                                  style={{ height: "42px", display: "inline-flex", alignItems: "center", gap: "0.4rem", whiteSpace: "nowrap" }} 
                                  onClick={() => setViewMode("sknr")}
                                >
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                    <polyline points="14 2 14 8 20 8" />
                                    <line x1="16" y1="13" x2="8" y2="13" />
                                    <line x1="16" y1="17" x2="8" y2="17" />
                                    <line x1="10" y1="9" x2="9" y2="9" />
                                  </svg>
                                  Mode SKNR
                                </button>
                                <button 
                                  className={`btn ${viewMode === "transkrip" ? "btn-primary" : "btn-outline"}`} 
                                  style={{ height: "42px", display: "inline-flex", alignItems: "center", gap: "0.4rem", whiteSpace: "nowrap" }} 
                                  onClick={() => setViewMode("transkrip")}
                                >
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
                                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                  </svg>
                                  Mode Transkrip
                                </button>
                              </>
                            ) : (
                              <button 
                                className={`btn ${viewMode === "ledger" ? "btn-primary" : "btn-outline"}`} 
                                style={{ height: "42px", display: "inline-flex", alignItems: "center", gap: "0.4rem", whiteSpace: "nowrap" }} 
                                onClick={() => setViewMode("ledger")}
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
                                  <line x1="18" y1="20" x2="18" y2="10" />
                                  <line x1="12" y1="20" x2="12" y2="4" />
                                  <line x1="6" y1="20" x2="6" y2="14" />
                                </svg>
                                Mode Ledger Kelas
                              </button>
                            )}
                            <button 
                              className="btn btn-primary" 
                              style={{ height: "42px", backgroundColor: "#22c55e", borderColor: "#22c55e", display: "inline-flex", alignItems: "center", gap: "0.4rem", whiteSpace: "nowrap" }} 
                              onClick={triggerPrintRapor}
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
                                <polyline points="6 9 6 2 18 2 18 9" />
                                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                                <rect x="6" y="14" width="12" height="8" />
                              </svg>
                              Cetak {viewMode === "rapor" ? "Rapor" : viewMode === "sknr" ? "SKNR" : viewMode === "transkrip" ? "Transkrip / SKL" : viewMode === "sampul" ? "Sampul" : "Ledger"} (PDF)
                            </button>
                            <button
                              style={{ height: "42px", backgroundColor: "#7c3aed", color: "#fff", border: "none", borderRadius: "6px", display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: "0 1rem", cursor: "pointer", whiteSpace: "nowrap", fontWeight: 600, fontSize: "0.85rem" }}
                              onClick={() => setShowWatermarkPreview(true)}
                              title="Lihat tampilan watermark seperti di hasil cetak"
                            >
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                <circle cx="12" cy="12" r="3"/>
                              </svg>
                              Preview Watermark
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div id="rapor-printable-area">
                      {/* PRATINJAU LEMBAR SAMPUL RAPOR KERTAS (Times New Roman Style) */}
                      {raporStudentNisn && viewMode === "sampul" && (
                        <ErrorBoundary>
                          <SampulSheet 
                            student={students.find(s => s.nisn === raporStudentNisn)} 
                            school={school} 
                          />
                        </ErrorBoundary>
                      )}

                      {/* PRATINJAU LEMBAR RAPOR KERTAS (Times New Roman Style) */}
                      {raporStudentNisn && viewMode === "rapor" && (
                        <ErrorBoundary>
                          <RaporSheet 
                            student={students.find(s => s.nisn === raporStudentNisn)} 
                            school={school} 
                            teachers={teachers} 
                            loggedInTeacher={session}
                            subjects={subjects}
                            semester={raporSemester}
                          />
                        </ErrorBoundary>
                      )}

                      {/* PRATINJAU LEMBAR SKNR KERTAS (Times New Roman Style) */}
                      {raporStudentNisn && viewMode === "sknr" && (
                        <ErrorBoundary>
                          <SknrSheet 
                            student={students.find(s => s.nisn === raporStudentNisn)} 
                            school={school} 
                            subjects={subjects}
                          />
                        </ErrorBoundary>
                      )}

                      {/* PRATINJAU LEMBAR TRANSKRIP / SKL KERTAS (Times New Roman Style) */}
                      {raporStudentNisn && viewMode === "transkrip" && (
                        <ErrorBoundary>
                          <TranskripSheet 
                            student={students.find(s => s.nisn === raporStudentNisn)} 
                            school={school} 
                            subjects={subjects}
                          />
                        </ErrorBoundary>
                      )}

                      {/* PRATINJAU LEMBAR LEDGER NILAI KELAS (Times New Roman Style) */}
                      {raporStudentNisn === "__ledger__" && viewMode === "ledger" && (
                        <ErrorBoundary>
                          <LedgerSheet 
                            students={getFilteredStudentsForRapor()} 
                            school={school} 
                            teachers={teachers} 
                            loggedInTeacher={session}
                            subjects={subjects}
                            semester={raporSemester}
                          />
                        </ErrorBoundary>
                      )}
                    </div>
                  </div>
                )}
                {/* TAB SPPD (SURAT PERINTAH PERJALANAN DINAS) */}
                {activeTab === "sppd" && (
                  <div className="no-print">
                    <span style={{ fontSize: "0.85rem", textTransform: "uppercase", fontWeight: 700, color: "var(--secondary)" }}>Layanan Kepegawaian</span>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                      <h2 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--primary-dark)", margin: 0 }}>
                        Surat Perjalanan Dinas (SPPD)
                      </h2>
                      <button 
                        className="btn btn-primary"
                        onClick={() => {
                          setSppdForm({ keperluan: "", tujuan: "", tanggalBerangkat: "", tanggalKembali: "", transportasi: "Kendaraan Pribadi" });
                          setShowSppdForm(!showSppdForm);
                        }}
                      >
                        {showSppdForm ? "Tutup Form" : "+ Buat Pengajuan"}
                      </button>
                    </div>

                    {showSppdForm && (
                      <div className="card" style={{ marginBottom: "2rem", borderTop: "4px solid var(--secondary)" }}>
                        <h3 style={{ marginTop: 0, marginBottom: "1.5rem", color: "var(--primary-dark)" }}>Form Pengajuan SPPD</h3>
                        <form onSubmit={handleSubmitSppd} className="grid grid-2" style={{ gap: "1rem" }}>
                          <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                            <label className="form-label">Keperluan / Tujuan Tugas</label>
                            <input 
                              type="text" className="form-input" required 
                              placeholder="Contoh: Mengikuti Rapat MKKS SMK"
                              value={sppdForm.keperluan} onChange={e => setSppdForm({...sppdForm, keperluan: e.target.value})}
                            />
                          </div>
                          <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                            <label className="form-label">Tujuan (Instansi / Tempat)</label>
                            <input 
                              type="text" className="form-input" required 
                              placeholder="Contoh: Cabang Dinas Pendidikan Wilayah VIII"
                              value={sppdForm.tujuan} onChange={e => setSppdForm({...sppdForm, tujuan: e.target.value})}
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Tanggal Berangkat</label>
                            <input 
                              type="date" className="form-input" required 
                              value={sppdForm.tanggalBerangkat} onChange={e => setSppdForm({...sppdForm, tanggalBerangkat: e.target.value})}
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Tanggal Kembali</label>
                            <input 
                              type="date" className="form-input" required 
                              value={sppdForm.tanggalKembali} onChange={e => setSppdForm({...sppdForm, tanggalKembali: e.target.value})}
                            />
                          </div>
                          <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                            <label className="form-label">Alat Transportasi</label>
                            <select 
                              className="form-input" required 
                              value={sppdForm.transportasi} onChange={e => setSppdForm({...sppdForm, transportasi: e.target.value})}
                            >
                              <option value="Kendaraan Pribadi">Kendaraan Pribadi</option>
                              <option value="Kendaraan Dinas">Kendaraan Dinas</option>
                              <option value="Kendaraan Umum">Kendaraan Umum</option>
                            </select>
                          </div>
                          <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end", gap: "1rem", marginTop: "1rem" }}>
                            <button type="button" className="btn btn-outline" onClick={() => setShowSppdForm(false)}>Batal</button>
                            <button type="submit" className="btn btn-primary" disabled={sppdLoading}>
                              {sppdLoading ? "Menyimpan..." : "Kirim Pengajuan"}
                            </button>
                          </div>
                        </form>
                      </div>
                    )}

                    <div className="card">
                      <h3 style={{ marginTop: 0, marginBottom: "1rem" }}>Riwayat SPPD Anda</h3>
                      {sppdLoading && !showSppdForm ? <p>Memuat data...</p> : (
                        <div className="table-responsive">
                          <table className="table">
                            <thead>
                              <tr>
                                <th>Tanggal Pengajuan</th>
                                <th>Tujuan & Keperluan</th>
                                <th>Jadwal Tugas</th>
                                <th>Status</th>
                                <th style={{ textAlign: "right" }}>Aksi</th>
                              </tr>
                            </thead>
                            <tbody>
                              {sppdList.length === 0 ? (
                                <tr><td colSpan="5" style={{ textAlign: "center", padding: "2rem" }}>Belum ada pengajuan SPPD.</td></tr>
                              ) : sppdList.map((sppd) => (
                                <tr key={sppd.id}>
                                  <td>{new Date(sppd.createdAt).toLocaleDateString("id-ID")}</td>
                                  <td>
                                    <strong>{sppd.tujuan}</strong><br/>
                                    <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>{sppd.keperluan}</span>
                                  </td>
                                  <td>
                                    {new Date(sppd.tanggalBerangkat).toLocaleDateString("id-ID")} - {new Date(sppd.tanggalKembali).toLocaleDateString("id-ID")}
                                  </td>
                                  <td>
                                    <span style={{ 
                                      padding: "0.3rem 0.6rem", borderRadius: "20px", fontSize: "0.75rem", fontWeight: "bold",
                                      backgroundColor: sppd.status === "DISETUJUI" ? "#dcfce7" : sppd.status === "DITOLAK" ? "#fee2e2" : "#fef3c7",
                                      color: sppd.status === "DISETUJUI" ? "#166534" : sppd.status === "DITOLAK" ? "#991b1b" : "#92400e"
                                    }}>
                                      {sppd.status}
                                    </span>
                                    {sppd.catatanKepsek && <div style={{ fontSize: "0.75rem", color: "var(--danger)", marginTop: "0.3rem" }}>Note: {sppd.catatanKepsek}</div>}
                                  </td>
                                  <td style={{ textAlign: "right", display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                                    {sppd.status === "DISETUJUI" && (
                                                                              <a 
                                          href={`/cetak-sppd/${sppd.id}`} target="_blank"
                                          className="btn btn-primary" 
                                          style={{ padding: "0.4rem 0.75rem", fontSize: "0.8rem", height: "auto", textDecoration: "none", display: "inline-block" }}
                                        >
                                          Cetak
                                        </a>
                                    )}
                                    {sppd.status === "MENUNGGU" && (
                                      <button 
                                        className="btn btn-danger" 
                                        style={{ padding: "0.4rem 0.75rem", fontSize: "0.8rem", height: "auto" }}
                                        onClick={() => handleDeleteSppd(sppd.id)}
                                      >
                                        Batal
                                      </button>
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

                {activeTab === "bendahara" && session.isBendahara && (
                  <div className="no-print">
                    <span style={{ fontSize: "0.85rem", textTransform: "uppercase", fontWeight: 700, color: "var(--secondary)" }}>Bendahara Sekolah</span>
                    <h2 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--primary-dark)", marginBottom: "0.5rem" }}>
                      Modul Keuangan Terpadu & Dana BOS
                    </h2>
                    <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1.5rem" }}>
                      Kelola Pemasukan Siswa (SPP & Uang Gedung), Dana BOS (Pencairan & Belanja Komponen), Pengeluaran Swadaya, serta Payroll Honor Guru.
                    </p>

                    {/* Sub-Tabs Navigation */}
                    <div style={{ display: "flex", gap: "0.5rem", borderBottom: "2px solid #e2e8f0", marginBottom: "1.5rem", flexWrap: "wrap" }}>
                      {[
                        { 
                          id: "kasir", 
                          label: "Kasir Pembayaran Siswa",
                          icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                        },
                        { 
                          id: "bos", 
                          label: "Dana BOS (Pencairan & Belanja)",
                          icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><line x1="3" y1="21" x2="21" y2="21"/><line x1="6" y1="18" x2="6" y2="11"/><line x1="10" y1="18" x2="10" y2="11"/><line x1="14" y1="18" x2="14" y2="11"/><line x1="18" y1="18" x2="18" y2="11"/><polygon points="12 2 20 7 4 7 12 2"/></svg>
                        },
                        { 
                          id: "pengeluaran", 
                          label: "Pengeluaran Swadaya",
                          icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4z"/></svg>
                        },
                        { 
                          id: "payroll", 
                          label: "Gaji & Honor Guru",
                          icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                        },
                        { 
                          id: "rekap-absen-guru", 
                          label: "Rekap Absensi Guru",
                          icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                        },
                        { 
                          id: "bku", 
                          label: "Buku Kas Umum (BKU)",
                          icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
                        },
                        { 
                          id: "tarif", 
                          label: "Master Tarif Tagihan",
                          icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                        }
                      ].map(tab => (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setBendaharaSubTab(tab.id)}
                          style={{
                            padding: "0.6rem 1rem",
                            fontWeight: "bold",
                            fontSize: "0.85rem",
                            borderRadius: "8px 8px 0 0",
                            border: "none",
                            borderBottom: bendaharaSubTab === tab.id ? "3px solid #0d9488" : "3px solid transparent",
                            color: bendaharaSubTab === tab.id ? "#0d9488" : "#64748b",
                            background: bendaharaSubTab === tab.id ? "#f0fdfa" : "transparent",
                            cursor: "pointer",
                            transition: "all 0.2s",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.45rem"
                          }}
                        >
                          {tab.icon}
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    {/* ─── SUB-TAB 1: KASIR PEMBAYARAN SISWA (SPP & TAGIHAN) ─── */}
                    {bendaharaSubTab === "kasir" && (
                      <div>
                        {/* Summary Cards */}
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
                          <div style={{ background: "linear-gradient(135deg, #0d9488, #0f766e)", color: "#fff", padding: "1.25rem", borderRadius: "12px", boxShadow: "0 4px 6px rgba(13,148,136,0.2)" }}>
                            <span style={{ fontSize: "0.78rem", opacity: 0.9, textTransform: "uppercase" }}>Pemasukan Siswa Bulan Ini</span>
                            <h3 style={{ fontSize: "1.5rem", fontWeight: 800, margin: "0.25rem 0 0 0" }}>
                              Rp {(bendaharaData?.totalStudentIncomeMonthly || 0).toLocaleString("id-ID")}
                            </h3>
                          </div>
                          <div style={{ background: "linear-gradient(135deg, #0284c7, #0369a1)", color: "#fff", padding: "1.25rem", borderRadius: "12px", boxShadow: "0 4px 6px rgba(2,132,199,0.2)" }}>
                            <span style={{ fontSize: "0.78rem", opacity: 0.9, textTransform: "uppercase" }}>Pemasukan Siswa Tahun Ini</span>
                            <h3 style={{ fontSize: "1.5rem", fontWeight: 800, margin: "0.25rem 0 0 0" }}>
                              Rp {(bendaharaData?.totalStudentIncomeYearly || 0).toLocaleString("id-ID")}
                            </h3>
                          </div>
                          <div style={{ background: "linear-gradient(135deg, #16a34a, #15803d)", color: "#fff", padding: "1.25rem", borderRadius: "12px", boxShadow: "0 4px 6px rgba(22,163,74,0.2)" }}>
                            <span style={{ fontSize: "0.78rem", opacity: 0.9, textTransform: "uppercase" }}>Saldo Kas Swadaya</span>
                            <h3 style={{ fontSize: "1.5rem", fontWeight: 800, margin: "0.25rem 0 0 0" }}>
                              Rp {(bendaharaData?.saldoSwadaya || 0).toLocaleString("id-ID")}
                            </h3>
                          </div>
                        </div>

                        {/* Form Input Pembayaran */}
                        <div style={{ background: "#f8fafc", padding: "1.5rem", borderRadius: "var(--radius-md)", border: "1px solid #e2e8f0", marginBottom: "1.5rem" }}>
                          <h4 style={{ margin: "0 0 1rem 0", fontWeight: 800, color: "var(--primary-dark)", fontSize: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <div style={{ background: "linear-gradient(135deg, #0d9488, #0f766e)", borderRadius: "50%", width: "28px", height: "28px", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#fff", flexShrink: 0 }}>
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                            </div>
                            Form Pembayaran & Kasir Siswa
                          </h4>
                          {payMsg && (
                            <div className={`form-alert ${payMsg.startsWith("Gagal") ? "error" : "success"}`} style={{ display: "block", marginBottom: "1rem" }}>
                              {payMsg}
                            </div>
                          )}
                          <form onSubmit={async (e) => {
                            e.preventDefault();
                            if (!payStudentNisn) { setPayMsg("Pilih siswa terlebih dahulu."); return; }
                            setPayLoading(true);
                            setPayMsg("");
                            const res = await recordStudentPayment({
                              studentNisn: payStudentNisn,
                              feeName: payFeeName,
                              bulan: payBulan,
                              tahun: payTahun,
                              amount: payAmount,
                              paidAmount: payPaidAmount,
                              paidAt: new Date().toISOString().substring(0, 10)
                            });
                            setPayLoading(false);
                            if (res.success) {
                              setPayMsg("✓ Pembayaran berhasil dicatat!");
                              setPayPaidAmount(payAmount);
                              await loadBendaharaData();
                              printStudentReceipt(res.payment);
                            } else {
                              setPayMsg("Gagal: " + res.error);
                            }
                          }}>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "1rem" }}>
                              <div>
                                <label className="form-label" style={{ fontWeight: 700 }}>Pilih Siswa *</label>
                                <select className="form-select" value={payStudentNisn} onChange={e => setPayStudentNisn(e.target.value)} required>
                                  <option value="">-- Pilih Siswa --</option>
                                  {students.map(s => (
                                    <option key={s.nisn} value={s.nisn}>{s.name} ({s.kelas}) - NISN: {s.nisn}</option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="form-label" style={{ fontWeight: 700 }}>Jenis Tagihan *</label>
                                <select className="form-select" value={payFeeName} onChange={e => {
                                  setPayFeeName(e.target.value);
                                  const feeM = bendaharaData?.feeMasters?.find(f => f.name === e.target.value);
                                  if (feeM) {
                                    setPayAmount(feeM.nominal);
                                    setPayPaidAmount(feeM.nominal);
                                  }
                                }} required>
                                  {bendaharaData?.feeMasters?.length > 0 ? (
                                    bendaharaData.feeMasters.map(f => (
                                      <option key={f.id} value={f.name}>{f.name} (Rp {f.nominal.toLocaleString("id-ID")})</option>
                                    ))
                                  ) : (
                                    <>
                                      <option value="SPP Bulanan">SPP Bulanan</option>
                                      <option value="Uang Gedung / Bangunan">Uang Gedung / Bangunan</option>
                                      <option value="Seragam Sekolah">Seragam Sekolah</option>
                                      <option value="Biaya Kegiatan / Ujian">Biaya Kegiatan / Ujian</option>
                                    </>
                                  )}
                                </select>
                              </div>
                              <div>
                                <label className="form-label" style={{ fontWeight: 700 }}>Bulan (Jika Bulanan)</label>
                                <select className="form-select" value={payBulan} onChange={e => setPayBulan(e.target.value)}>
                                  <option value="-">Sekali Bayar / Incidental (-)</option>
                                  {["1","2","3","4","5","6","7","8","9","10","11","12"].map(m => (
                                    <option key={m} value={m}>{new Date(2000, parseInt(m)-1, 1).toLocaleString("id-ID", { month: "long" })}</option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="form-label" style={{ fontWeight: 700 }}>Tahun</label>
                                <select className="form-select" value={payTahun} onChange={e => setPayTahun(e.target.value)}>
                                  {["2024","2025","2026","2027"].map(y => <option key={y} value={y}>{y}</option>)}
                                </select>
                              </div>
                              <div>
                                <label className="form-label" style={{ fontWeight: 700 }}>Nominal Tagihan (Rp)</label>
                                <input type="number" className="form-input" value={payAmount} onChange={e => setPayAmount(Number(e.target.value))} required />
                              </div>
                              <div>
                                <label className="form-label" style={{ fontWeight: 700 }}>Nominal Dibayar (Rp)</label>
                                <input type="number" className="form-input" value={payPaidAmount} onChange={e => setPayPaidAmount(Number(e.target.value))} required />
                              </div>
                            </div>
                            <button type="submit" className="btn btn-primary" disabled={payLoading} style={{ padding: "0.6rem 1.5rem", display: "inline-flex", alignItems: "center", gap: "0.45rem" }}>
                              {payLoading ? "Menyimpan..." : (
                                <>
                                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                                  Simpan Pembayaran & Cetak Kwitansi
                                </>
                              )}
                            </button>
                          </form>
                        </div>

                        {/* Tabel Riwayat Transaksi Pembayaran Siswa */}
                        <div className="portal-table-container">
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                            <h4 style={{ fontWeight: 800, color: "var(--primary)", margin: 0 }}>Riwayat Transaksi Pembayaran Siswa ({bendaharaData?.allStudentPayments?.length || 0})</h4>
                          </div>
                          <table className="portal-table">
                            <thead>
                              <tr>
                                <th>No Kwitansi</th>
                                <th>Tanggal</th>
                                <th>Siswa</th>
                                <th>Tagihan</th>
                                <th>Periode</th>
                                <th style={{ textAlign: "right" }}>Nominal Dibayar</th>
                                <th style={{ textAlign: "center" }}>Status</th>
                                <th style={{ textAlign: "center" }}>Aksi</th>
                              </tr>
                            </thead>
                            <tbody>
                              {!bendaharaData?.allStudentPayments || bendaharaData.allStudentPayments.length === 0 ? (
                                <tr><td colSpan="8" style={{ textAlign: "center", color: "#94a3b8", padding: "1.5rem" }}>Belum ada transaksi pembayaran siswa.</td></tr>
                              ) : (
                                bendaharaData.allStudentPayments.map(p => (
                                  <tr key={p.id}>
                                    <td style={{ fontWeight: "bold", fontSize: "0.8rem", color: "var(--primary)" }}>{p.receiptNo}</td>
                                    <td>{p.paidAt}</td>
                                    <td><strong>{p.student?.name}</strong><br/><span style={{ fontSize: "0.75rem", color: "#64748b" }}>NISN: {p.studentNisn} ({p.student?.kelas})</span></td>
                                    <td>{p.feeName}</td>
                                    <td>{p.bulan !== "-" ? `${new Date(2000, parseInt(p.bulan)-1, 1).toLocaleString("id-ID", { month: "short" })} ${p.tahun}` : p.tahun}</td>
                                    <td style={{ textAlign: "right", fontWeight: "bold", color: "#16a34a" }}>Rp {(p.paidAmount || 0).toLocaleString("id-ID")}</td>
                                    <td style={{ textAlign: "center" }}>
                                      <span style={{ background: p.status === "LUNAS" ? "#dcfce7" : "#fef3c7", color: p.status === "LUNAS" ? "#15803d" : "#b45309", padding: "3px 8px", borderRadius: "12px", fontSize: "0.72rem", fontWeight: "bold" }}>{p.status}</span>
                                    </td>
                                    <td style={{ textAlign: "center" }}>
                                      <div style={{ display: "flex", gap: "0.3rem", justifyContent: "center" }}>
                                        <button className="btn btn-outline" style={{ fontSize: "0.72rem", padding: "3px 7px", display: "inline-flex", alignItems: "center", gap: "0.3rem" }} onClick={() => printStudentReceipt(p)}>
                                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                                          Kwitansi
                                        </button>
                                        <button className="btn btn-outline" style={{ fontSize: "0.72rem", padding: "3px 7px", borderColor: "#ef4444", color: "#ef4444", display: "inline-flex", alignItems: "center" }} title="Hapus" onClick={async () => {
                                          if (confirm("Hapus transaksi pembayaran ini?")) {
                                            await deleteStudentPayment(p.id);
                                            await loadBendaharaData();
                                          }
                                        }}>
                                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* ─── SUB-TAB 2: DANA BOS (PENCAIRAN & BELANJA ARKAS) ─── */}
                    {bendaharaSubTab === "bos" && (
                      <div>
                        {/* Summary Cards BOS */}
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
                          <div style={{ background: "linear-gradient(135deg, #1e3a8a, #1d4ed8)", color: "#fff", padding: "1.25rem", borderRadius: "12px", boxShadow: "0 4px 6px rgba(30,58,138,0.2)" }}>
                            <span style={{ fontSize: "0.78rem", opacity: 0.9, textTransform: "uppercase" }}>Total BOS Masuk ({treasurerYear})</span>
                            <h3 style={{ fontSize: "1.5rem", fontWeight: 800, margin: "0.25rem 0 0 0" }}>
                              Rp {(bendaharaData?.totalBosIncomeYearly || 0).toLocaleString("id-ID")}
                            </h3>
                          </div>
                          <div style={{ background: "linear-gradient(135deg, #b45309, #d97706)", color: "#fff", padding: "1.25rem", borderRadius: "12px", boxShadow: "0 4px 6px rgba(180,83,9,0.2)" }}>
                            <span style={{ fontSize: "0.78rem", opacity: 0.9, textTransform: "uppercase" }}>Total Belanja BOS ({treasurerYear})</span>
                            <h3 style={{ fontSize: "1.5rem", fontWeight: 800, margin: "0.25rem 0 0 0" }}>
                              Rp {(bendaharaData?.yearlyExpensesBos || 0).toLocaleString("id-ID")}
                            </h3>
                          </div>
                          <div style={{ background: "linear-gradient(135deg, #059669, #10b981)", color: "#fff", padding: "1.25rem", borderRadius: "12px", boxShadow: "0 4px 6px rgba(5,150,105,0.2)" }}>
                            <span style={{ fontSize: "0.78rem", opacity: 0.9, textTransform: "uppercase" }}>Sisa Saldo Dana BOS</span>
                            <h3 style={{ fontSize: "1.5rem", fontWeight: 800, margin: "0.25rem 0 0 0" }}>
                              Rp {(bendaharaData?.saldoBos || 0).toLocaleString("id-ID")}
                            </h3>
                          </div>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "1.5rem" }}>
                          {/* Form Input Pencairan BOS */}
                          <div style={{ background: "#f8fafc", padding: "1.25rem", borderRadius: "var(--radius-md)", border: "1px solid #e2e8f0" }}>
                            <h4 style={{ margin: "0 0 1rem 0", fontWeight: 800, color: "var(--primary)", fontSize: "0.95rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                              <div style={{ background: "linear-gradient(135deg, #1d4ed8, #1e3a8a)", borderRadius: "50%", width: "28px", height: "28px", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#fff", flexShrink: 0 }}>
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="21" x2="21" y2="21"/><line x1="6" y1="18" x2="6" y2="11"/><line x1="10" y1="18" x2="10" y2="11"/><line x1="14" y1="18" x2="14" y2="11"/><line x1="18" y1="18" x2="18" y2="11"/><polygon points="12 2 20 7 4 7 12 2"/></svg>
                              </div>
                              Form Pencairan Dana BOS
                            </h4>
                            {bosMsg && <div className={`form-alert ${bosMsg.startsWith("Gagal") ? "error" : "success"}`} style={{ display: "block", marginBottom: "0.75rem" }}>{bosMsg}</div>}
                            <form onSubmit={async (e) => {
                              e.preventDefault();
                              setBosLoading(true);
                              setBosMsg("");
                              const res = await recordBosDisbursement({ tahap: bosTahap, tahun: bosTahun, amount: bosAmount, receivedDate: bosDate, keterangan: bosKet });
                              setBosLoading(false);
                              if (res.success) {
                                setBosMsg("✓ Pencairan BOS berhasil dicatat!");
                                setBosAmount("");
                                setBosKet("");
                                await loadBendaharaData();
                              } else setBosMsg("Gagal: " + res.error);
                            }}>
                              <div className="form-group">
                                <label className="form-label">Tahap Pencairan</label>
                                <select className="form-select" value={bosTahap} onChange={e => setBosTahap(e.target.value)}>
                                  <option value="Tahap I">Tahap I (Januari - Juni)</option>
                                  <option value="Tahap II">Tahap II (Juli - Desember)</option>
                                  <option value="BOS Kinerja / Afirmasi">BOS Kinerja / Afirmasi</option>
                                </select>
                              </div>
                              <div className="form-group" style={{ marginTop: "0.5rem" }}>
                                <label className="form-label">Tahun Anggaran</label>
                                <select className="form-select" value={bosTahun} onChange={e => setBosTahun(e.target.value)}>
                                  {["2024","2025","2026","2027"].map(y => <option key={y} value={y}>{y}</option>)}
                                </select>
                              </div>
                              <div className="form-group" style={{ marginTop: "0.5rem" }}>
                                <label className="form-label">Nominal Pencairan (Rp)</label>
                                <input type="number" className="form-input" placeholder="Contoh: 45000000" value={bosAmount} onChange={e => setBosAmount(e.target.value)} required />
                              </div>
                              <div className="form-group" style={{ marginTop: "0.5rem" }}>
                                <label className="form-label">Tanggal Cair</label>
                                <input type="date" className="form-input" value={bosDate} onChange={e => setBosDate(e.target.value)} required />
                              </div>
                              <div className="form-group" style={{ marginTop: "0.5rem" }}>
                                <label className="form-label">Keterangan / Catatan</label>
                                <input type="text" className="form-input" placeholder="Contoh: SK Alokasi BOS Tahap 1 2026" value={bosKet} onChange={e => setBosKet(e.target.value)} />
                              </div>
                              <button type="submit" className="btn btn-primary" disabled={bosLoading} style={{ marginTop: "1rem", width: "100%", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "0.45rem" }}>
                                {bosLoading ? "Menyimpan..." : (
                                  <>
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                                    Simpan Dana BOS Masuk
                                  </>
                                )}
                              </button>
                            </form>
                          </div>

                          {/* Form Input Belanja Dana BOS (Komponen ARKAS) */}
                          <div style={{ background: "#f8fafc", padding: "1.25rem", borderRadius: "var(--radius-md)", border: "1px solid #e2e8f0" }}>
                            <h4 style={{ margin: "0 0 1rem 0", fontWeight: 800, color: "#b45309", fontSize: "0.95rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                              <div style={{ background: "linear-gradient(135deg, #f59e0b, #b45309)", borderRadius: "50%", width: "28px", height: "28px", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#fff", flexShrink: 0 }}>
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4z"/></svg>
                              </div>
                              Form Belanja Dana BOS (Komponen ARKAS)
                            </h4>
                            {expMsg && <div className={`form-alert ${expMsg.startsWith("Gagal") ? "error" : "success"}`} style={{ display: "block", marginBottom: "0.75rem" }}>{expMsg}</div>}
                            <form onSubmit={async (e) => {
                              e.preventDefault();
                              setExpLoading(true);
                              setExpMsg("");
                              const res = await recordExpense({
                                source: "KAS_BOS",
                                category: expCategory,
                                title: expTitle,
                                amount: expAmount,
                                date: expDate,
                                receiptNo: expReceiptNo,
                                proofImage: expProofImage
                              });
                              setExpLoading(false);
                              if (res.success) {
                                setExpMsg("✓ Pengeluaran BOS berhasil dicatat!");
                                setExpTitle("");
                                setExpAmount("");
                                setExpReceiptNo("");
                                setExpProofImage("");
                                await loadBendaharaData();
                              } else setExpMsg("Gagal: " + res.error);
                            }}>
                              <div className="form-group">
                                <label className="form-label">Komponen BOS (ARKAS)</label>
                                <select className="form-select" value={expCategory} onChange={e => setExpCategory(e.target.value)}>
                                  <option value="PPDB">1. Penerimaan Peserta Didik Baru (PPDB)</option>
                                  <option value="PERPUSTAKAAN">2. Pengembangan Perpustakaan</option>
                                  <option value="PEMBELAJARAN">3. Kegiatan Pembelajaran & Ekstrakurikuler</option>
                                  <option value="EVALUASI">4. Asesmen & Evaluasi Pembelajaran (Ujian)</option>
                                  <option value="ATK">5. Administrasi / ATK Kegiatan Sekolah</option>
                                  <option value="DAYA_JASA">6. Langganan Daya & Jasa (Listrik/Internet)</option>
                                  <option value="SARPRAS">7. Pemeliharaan Sarana & Prasarana</option>
                                  <option value="HONOR">8. Honorarium Guru / Staf Non-ASN</option>
                                </select>
                              </div>
                              <div className="form-group" style={{ marginTop: "0.5rem" }}>
                                <label className="form-label">Uraian Belanja / Transaksi</label>
                                <input type="text" className="form-input" placeholder="Contoh: Beli Kertas HVS & Tinta Printer" value={expTitle} onChange={e => setExpTitle(e.target.value)} required />
                              </div>
                              <div className="form-group" style={{ marginTop: "0.5rem" }}>
                                <label className="form-label">Nominal Pengeluaran (Rp)</label>
                                <input type="number" className="form-input" placeholder="Contoh: 1250000" value={expAmount} onChange={e => setExpAmount(e.target.value)} required />
                              </div>
                              <div className="form-group" style={{ marginTop: "0.5rem" }}>
                                <label className="form-label">Tanggal Transaksi & No. Kwitansi / Nota</label>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                                  <input type="date" className="form-input" value={expDate} onChange={e => setExpDate(e.target.value)} required />
                                  <input type="text" className="form-input" placeholder="No. Nota / Faktur" value={expReceiptNo} onChange={e => setExpReceiptNo(e.target.value)} />
                                </div>
                              </div>
                              <button type="submit" className="btn btn-primary" disabled={expLoading} style={{ marginTop: "1rem", width: "100%", backgroundColor: "#b45309", borderColor: "#b45309", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "0.45rem" }}>
                                {expLoading ? "Menyimpan..." : (
                                  <>
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                                    Simpan Belanja BOS
                                  </>
                                )}
                              </button>
                            </form>
                          </div>
                        </div>

                        {/* Tabel Belanja BOS Terkini */}
                        <div className="portal-table-container">
                          <h4 style={{ fontWeight: 800, color: "var(--primary)", marginBottom: "0.75rem" }}>Daftar Belanja Dana BOS ({bendaharaData?.allExpenses?.filter(e => e.source === "KAS_BOS")?.length || 0})</h4>
                          <table className="portal-table">
                            <thead>
                              <tr>
                                <th>Tanggal</th>
                                <th>Komponen ARKAS</th>
                                <th>Uraian Belanja</th>
                                <th>No. Nota</th>
                                <th style={{ textAlign: "right" }}>Jumlah (Rp)</th>
                                <th style={{ textAlign: "center" }}>Aksi</th>
                              </tr>
                            </thead>
                            <tbody>
                              {!bendaharaData?.allExpenses?.filter(e => e.source === "KAS_BOS")?.length ? (
                                <tr><td colSpan="6" style={{ textAlign: "center", color: "#94a3b8", padding: "1.5rem" }}>Belum ada pengeluaran dana BOS.</td></tr>
                              ) : (
                                bendaharaData.allExpenses.filter(e => e.source === "KAS_BOS").map(item => (
                                  <tr key={item.id}>
                                    <td>{item.date}</td>
                                    <td><span style={{ background: "#e0f2fe", color: "#0369a1", padding: "2px 6px", borderRadius: "4px", fontSize: "0.72rem", fontWeight: "bold" }}>{item.category}</span></td>
                                    <td><strong>{item.title}</strong></td>
                                    <td>{item.receiptNo || "-"}</td>
                                    <td style={{ textAlign: "right", fontWeight: "bold", color: "#dc2626" }}>- Rp {item.amount.toLocaleString("id-ID")}</td>
                                    <td style={{ textAlign: "center" }}>
                                      <button className="btn btn-outline" style={{ fontSize: "0.72rem", padding: "3px 7px", borderColor: "#ef4444", color: "#ef4444", display: "inline-flex", alignItems: "center" }} title="Hapus" onClick={async () => {
                                        if (confirm("Hapus catatan belanja BOS ini?")) {
                                          await deleteExpense(item.id);
                                          await loadBendaharaData();
                                        }
                                      }}>
                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                                      </button>
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* ─── SUB-TAB 3: PENGELUARAN KAS SWADAYA ─── */}
                    {bendaharaSubTab === "pengeluaran" && (
                      <div>
                        <div style={{ background: "#f8fafc", padding: "1.25rem", borderRadius: "var(--radius-md)", border: "1px solid #e2e8f0", marginBottom: "1.5rem" }}>
                          <h4 style={{ margin: "0 0 1rem 0", fontWeight: 800, color: "var(--primary-dark)", fontSize: "0.95rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <div style={{ background: "linear-gradient(135deg, #16a34a, #15803d)", borderRadius: "50%", width: "28px", height: "28px", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#fff", flexShrink: 0 }}>
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4z"/></svg>
                            </div>
                            Form Pengeluaran Kas Swadaya Sekolah
                          </h4>
                          {expMsg && <div className={`form-alert ${expMsg.startsWith("Gagal") ? "error" : "success"}`} style={{ display: "block", marginBottom: "0.75rem" }}>{expMsg}</div>}
                          <form onSubmit={async (e) => {
                            e.preventDefault();
                            setExpLoading(true);
                            setExpMsg("");
                            const res = await recordExpense({
                              source: "KAS_SWADAYA",
                              category: expCategory,
                              title: expTitle,
                              amount: expAmount,
                              date: expDate,
                              receiptNo: expReceiptNo
                            });
                            setExpLoading(false);
                            if (res.success) {
                              setExpMsg("✓ Pengeluaran Swadaya berhasil dicatat!");
                              setExpTitle("");
                              setExpAmount("");
                              setExpReceiptNo("");
                              await loadBendaharaData();
                            } else setExpMsg("Gagal: " + res.error);
                          }}>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
                              <div>
                                <label className="form-label">Uraian Pengeluaran *</label>
                                <input type="text" className="form-input" placeholder="Contoh: Konsumsi Rapat Guru" value={expTitle} onChange={e => setExpTitle(e.target.value)} required />
                              </div>
                              <div>
                                <label className="form-label">Nominal (Rp) *</label>
                                <input type="number" className="form-input" placeholder="Contoh: 350000" value={expAmount} onChange={e => setExpAmount(e.target.value)} required />
                              </div>
                              <div>
                                <label className="form-label">Tanggal Transaksi</label>
                                <input type="date" className="form-input" value={expDate} onChange={e => setExpDate(e.target.value)} required />
                              </div>
                              <div>
                                <label className="form-label">No. Nota / Kuitansi</label>
                                <input type="text" className="form-input" placeholder="Optional" value={expReceiptNo} onChange={e => setExpReceiptNo(e.target.value)} />
                              </div>
                            </div>
                            <button type="submit" className="btn btn-primary" disabled={expLoading} style={{ marginTop: "1rem", padding: "0.6rem 1.5rem", display: "inline-flex", alignItems: "center", gap: "0.45rem" }}>
                              {expLoading ? "Menyimpan..." : (
                                <>
                                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                                  Simpan Pengeluaran Swadaya
                                </>
                              )}
                            </button>
                          </form>
                        </div>

                        <div className="portal-table-container">
                          <h4 style={{ fontWeight: 800, color: "var(--primary)", marginBottom: "0.75rem" }}>Riwayat Pengeluaran Kas Swadaya ({bendaharaData?.allExpenses?.filter(e => e.source === "KAS_SWADAYA")?.length || 0})</h4>
                          <table className="portal-table">
                            <thead>
                              <tr>
                                <th>Tanggal</th>
                                <th>Uraian Pengeluaran</th>
                                <th>No. Nota</th>
                                <th style={{ textAlign: "right" }}>Jumlah (Rp)</th>
                                <th style={{ textAlign: "center" }}>Aksi</th>
                              </tr>
                            </thead>
                            <tbody>
                              {!bendaharaData?.allExpenses?.filter(e => e.source === "KAS_SWADAYA")?.length ? (
                                <tr><td colSpan="5" style={{ textAlign: "center", color: "#94a3b8", padding: "1.5rem" }}>Belum ada pengeluaran kas swadaya.</td></tr>
                              ) : (
                                bendaharaData.allExpenses.filter(e => e.source === "KAS_SWADAYA").map(item => (
                                  <tr key={item.id}>
                                    <td>{item.date}</td>
                                    <td><strong>{item.title}</strong></td>
                                    <td>{item.receiptNo || "-"}</td>
                                    <td style={{ textAlign: "right", fontWeight: "bold", color: "#dc2626" }}>- Rp {item.amount.toLocaleString("id-ID")}</td>
                                    <td style={{ textAlign: "center" }}>
                                      <button className="btn btn-outline" style={{ fontSize: "0.72rem", padding: "3px 7px", borderColor: "#ef4444", color: "#ef4444", display: "inline-flex", alignItems: "center" }} title="Hapus" onClick={async () => {
                                        if (confirm("Hapus pengeluaran ini?")) {
                                          await deleteExpense(item.id);
                                          await loadBendaharaData();
                                        }
                                      }}>
                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                                      </button>
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* ─── SUB-TAB 4: GAJI & HONOR GURU (PAYROLL) ─── */}
                    {bendaharaSubTab === "payroll" && (
                      <div>
                        {/* CARD PENGATURAN TARIF KEUANGAN */}
                        <div style={{ backgroundColor: "#f0fdfa", padding: "1.5rem", borderRadius: "var(--radius-md)", border: "1px solid #99f6e4", marginBottom: "2rem", boxShadow: "var(--shadow-sm)" }}>
                          <h4 style={{ fontWeight: 800, color: "#0d9488", fontSize: "1.05rem", margin: "0 0 0.5rem 0", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <svg className="tab-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#0d9488", display: "block" }}>
                              <circle cx="12" cy="12" r="3" />
                              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                            </svg>
                            Pengaturan Besaran Tarif Keuangan (Honor & Insentif)
                          </h4>
                          <form onSubmit={handleSaveRates} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: "1rem", alignItems: "flex-end" }}>
                            <div className="form-group" style={{ margin: 0 }}>
                              <label className="form-label" style={{ fontSize: "0.75rem", fontWeight: "bold", color: "#0f766e" }}>Honor Jam Mengajar (Rp / Jam)</label>
                              <input type="number" min="0" className="form-input" value={rateHonorPokok} onChange={(e) => setRateHonorPokok(Number(e.target.value))} required />
                            </div>
                            <div className="form-group" style={{ margin: 0 }}>
                              <label className="form-label" style={{ fontSize: "0.75rem", fontWeight: "bold", color: "#0f766e" }}>Transport Tugas Luar (Rp / Tugas)</label>
                              <input type="number" min="0" className="form-input" value={rateTransport} onChange={(e) => setRateTransport(Number(e.target.value))} required />
                            </div>
                            <div className="form-group" style={{ margin: 0 }}>
                              <label className="form-label" style={{ fontSize: "0.75rem", fontWeight: "bold", color: "#0f766e" }}>Insentif Kehadiran Harian (Rp / Hari)</label>
                              <input type="number" min="0" className="form-input" value={rateInsentif} onChange={(e) => setRateInsentif(Number(e.target.value))} required />
                            </div>
                            <button type="submit" className="btn btn-primary" disabled={isSavingRates} style={{ margin: 0, height: "42px", backgroundColor: "#0d9488", borderColor: "#0d9488" }}>
                              {isSavingRates ? "Menyimpan..." : "Simpan Tarif"}
                            </button>
                          </form>
                        </div>

                        {/* Filter Periode */}
                        <div style={{ backgroundColor: "#f8fafc", padding: "1.25rem", borderRadius: "var(--radius-md)", border: "1px solid #e2e8f0", marginBottom: "1.5rem", display: "flex", gap: "1rem", alignItems: "flex-end", flexWrap: "wrap" }}>
                          <div className="form-group" style={{ margin: 0, minWidth: "150px" }}>
                            <label className="form-label" style={{ fontWeight: 700, fontSize: "0.8rem" }}>Pilih Bulan</label>
                            <select className="form-select" value={treasurerMonth} onChange={(e) => setTreasurerMonth(e.target.value)}>
                              {["1","2","3","4","5","6","7","8","9","10","11","12"].map(m => (
                                <option key={m} value={m}>{new Date(2000, parseInt(m)-1, 1).toLocaleString("id-ID", { month: "long" })}</option>
                              ))}
                            </select>
                          </div>
                          <div className="form-group" style={{ margin: 0, minWidth: "120px" }}>
                            <label className="form-label" style={{ fontWeight: 700, fontSize: "0.8rem" }}>Pilih Tahun</label>
                            <select className="form-select" value={treasurerYear} onChange={(e) => setTreasurerYear(e.target.value)}>
                              {["2024","2025","2026","2027"].map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                          </div>
                          <button type="button" className="btn btn-primary" onClick={loadTreasurerReport} disabled={loadingReport}>
                            {loadingReport ? "Memuat..." : "Tampilkan Rekap Gaji"}
                          </button>
                          <button 
                            type="button" 
                            className="btn btn-outline" 
                            onClick={() => {
                              if (!treasurerReport || treasurerReport.length === 0) {
                                alert("Tampilkan Rekap Gaji terlebih dahulu sebelum mencetak.");
                                return;
                              }
                              const printWin = window.open("", "_blank");
                              const monthName = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"][parseInt(treasurerMonth, 10) - 1];
                              const yearStr = treasurerYear;

                              let rows = treasurerReport.map((r, idx) => `
                                <tr>
                                  <td style="text-align:center">${idx + 1}</td>
                                  <td><strong>${r.name}</strong><br/><span style="font-size:9px;color:#555">NIP: ${r.nip}</span></td>
                                  <td>${r.jabatan || '-'}</td>
                                  <td style="text-align:center">${r.jamMengajar} JP</td>
                                  <td style="text-align:center">${r.hadirCount} Hari</td>
                                  <td style="text-align:right">Rp ${r.honorPokok.toLocaleString('id-ID')}</td>
                                  <td style="text-align:right">Rp ${r.tunjanganJabatan.toLocaleString('id-ID')}</td>
                                  <td style="text-align:right">Rp ${r.transportTugasLuar.toLocaleString('id-ID')}</td>
                                  <td style="text-align:right">Rp ${r.insentifKehadiran.toLocaleString('id-ID')}</td>
                                  <td style="text-align:right;font-weight:bold;color:#1e3a5f">Rp ${r.totalHonor.toLocaleString('id-ID')}</td>
                                  <td style="height:35px;width:110px;vertical-align:top;padding:4px;text-align:${(idx + 1) % 2 === 1 ? 'left' : 'right'}">
                                    <span style="font-size:9px;color:#666">${idx + 1}. .........</span>
                                  </td>
                                </tr>
                              `).join('');

                              const totalHonorAll = treasurerReport.reduce((acc, curr) => acc + curr.totalHonor, 0);

                              printWin.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>Rekapitulasi Gaji & Honor Guru - ${monthName} ${yearStr}</title>
  <style>
    body { font-family: 'Times New Roman', Times, serif; font-size: 11px; margin: 12mm 8mm; color: #111; }
    .header { text-align: center; border-bottom: 3px double #000; padding-bottom: 8px; margin-bottom: 15px; }
    .header h2 { margin: 0; font-size: 16px; font-weight: bold; text-transform: uppercase; }
    .header h3 { margin: 2px 0; font-size: 13px; font-weight: bold; text-transform: uppercase; }
    .header p { margin: 0; font-size: 10px; font-style: italic; }
    .title-box { text-align: center; margin-bottom: 15px; }
    .title-box h3 { margin: 0; font-size: 14px; font-weight: bold; text-decoration: underline; text-transform: uppercase; }
    .title-box p { margin: 3px 0 0 0; font-size: 11px; font-weight: bold; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    th, td { border: 1px solid #333; padding: 5px 6px; font-size: 10px; vertical-align: middle; }
    th { background: #e5e7eb; text-align: center; font-weight: bold; }
    .sign-section { margin-top: 30px; display: flex; justify-content: space-between; page-break-inside: avoid; }
    .sign-box { text-align: center; width: 220px; font-size: 11px; }
    .sign-space { height: 50px; }
    @media print { @page { size: A4 landscape; margin: 8mm; } body { margin: 0; } }
  </style>
</head>
<body>
  <div class="header" style="display:flex;align-items:center;justify-content:center;border-bottom:3px double #000;padding-bottom:8px;margin-bottom:15px">
    ${school?.logo && (school.logo.startsWith("data:") || school.logo.startsWith("http") || school.logo.startsWith("/")) ? `<img src="${school.logo}" alt="Logo" style="height:55px;width:55px;object-fit:contain;margin-right:15px" />` : `<div style="font-size:36px;margin-right:15px">${school?.logo || '🏫'}</div>`}
    <div style="text-align:center">
      <h3 style="margin:0;font-size:13px;font-weight:bold;text-transform:uppercase">${school?.yayasan || 'YAYASAN MASTER DEMO'}</h3>
      <h2 style="margin:2px 0;font-size:16px;font-weight:bold;text-transform:uppercase">${school?.nama || 'SEKOLAH MASTER DEMO'}</h2>
      <p style="margin:0;font-size:10px;font-style:italic">Alamat: ${school?.alamat || 'Jegedeh Wahyurejo, Candisari, Kota Demo, Magelang'} | Telepon: ${school?.telepon || '-'} | Email: ${school?.email || '-'}</p>
    </div>
  </div>

  <div class="title-box">
    <h3>DAFTAR PENERIMAAN HONORARIUM & TUNJANGAN GURU</h3>
    <p>Periode Bulan: ${monthName} ${yearStr}</p>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width:25px">No</th>
        <th>Nama Guru / NIP</th>
        <th style="width:110px">Jabatan</th>
        <th style="width:45px">Jam</th>
        <th style="width:45px">Hadir</th>
        <th style="width:80px;text-align:right">Honor Pokok</th>
        <th style="width:80px;text-align:right">Tunjangan</th>
        <th style="width:80px;text-align:right">Transport</th>
        <th style="width:80px;text-align:right">Insentif</th>
        <th style="width:95px;text-align:right">Total Gaji (Rp)</th>
        <th style="width:110px;text-align:center">Tanda Tangan / Paraf</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
    <tfoot>
      <tr style="background:#f3f4f6;font-weight:bold">
        <td colSpan="9" style="text-align:right;padding:6px">TOTAL ANGGARAN PAYROLL BULAN INI:</td>
        <td style="text-align:right;color:#1e3a5f">Rp ${totalHonorAll.toLocaleString('id-ID')}</td>
        <td></td>
      </tr>
    </tfoot>
  </table>

  <div class="sign-section">
    <div class="sign-box">
      <div>Mengetahui,</div>
      <div>Kepala Sekolah</div>
      <div class="sign-space"></div>
      <div><strong>${school?.kepsek || 'H. Ahmad Syafi\'i, S.Pd.I'}</strong></div>
      <div>NIP: ${school?.kepsekNip || '-'}</div>
    </div>
    <div class="sign-box">
      <div>Magelang, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
      <div>Bendahara Sekolah</div>
      <div class="sign-space"></div>
      <div><strong>${session?.name || 'Bendahara Sekolah'}</strong></div>
      <div>NIP: ${session?.nip || '-'}</div>
    </div>
  </div>
</body>
</html>`);
                              printWin.document.close();
                              printWin.focus();
                              setTimeout(() => printWin.print(), 500);
                            }}
                            style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="6 9 6 2 18 2 18 9"/>
                              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
                              <rect x="6" y="14" width="12" height="8"/>
                            </svg>
                            Cetak Rekap Honor (PDF/A4)
                          </button>
                        </div>

                        {/* Tabel Payroll */}
                        <div className="portal-table-container">
                          <table className="portal-table">
                            <thead>
                              <tr>
                                <th>Nama Guru / NIP</th>
                                <th>Jabatan</th>
                                <th style={{ textAlign: "center" }}>Beban Jam</th>
                                <th style={{ textAlign: "center" }}>Hadir</th>
                                <th style={{ textAlign: "right" }}>Honor Pokok</th>
                                <th style={{ textAlign: "right" }}>Tunjangan</th>
                                <th style={{ textAlign: "right" }}>Transport</th>
                                <th style={{ textAlign: "right" }}>Insentif</th>
                                <th style={{ textAlign: "right", fontWeight: "bold" }}>Total Honor</th>
                                <th style={{ textAlign: "center" }}>Cetak Slip</th>
                              </tr>
                            </thead>
                            <tbody>
                              {treasurerReport.length === 0 ? (
                                <tr><td colSpan="10" style={{ textAlign: "center", color: "#94a3b8", padding: "1.5rem" }}>Silakan klik 'Tampilkan Rekap Gaji'.</td></tr>
                              ) : (
                                treasurerReport.map(r => (
                                  <tr key={r.id}>
                                    <td><strong>{r.name}</strong><br/><span style={{ fontSize: "0.75rem", color: "#64748b" }}>NIP: {r.nip}</span></td>
                                    <td>{r.jabatan || "-"}</td>
                                    <td style={{ textAlign: "center" }}>{r.jamMengajar} jam</td>
                                    <td style={{ textAlign: "center", color: "#16a34a", fontWeight: "bold" }}>{r.hadirCount} hari</td>
                                    <td style={{ textAlign: "right" }}>Rp {r.honorPokok.toLocaleString("id-ID")}</td>
                                    <td style={{ textAlign: "right" }}>Rp {r.tunjanganJabatan.toLocaleString("id-ID")}</td>
                                    <td style={{ textAlign: "right" }}>Rp {r.transportTugasLuar.toLocaleString("id-ID")}</td>
                                    <td style={{ textAlign: "right", cursor: "pointer", color: r.tarifInsentifAktif !== rateInsentif ? "var(--secondary)" : "inherit" }} title="Klik untuk mengubah insentif khusus" onClick={() => handleChangeCustomInsentif(r.id, r.name, r.tarifInsentifAktif)}>
                                      Rp {r.insentifKehadiran.toLocaleString("id-ID")}
                                      {r.tarifInsentifAktif !== rateInsentif && <span style={{ fontSize: "10px", display: "block", color: "var(--secondary)" }}>(Khusus)</span>}
                                    </td>
                                    <td style={{ textAlign: "right", fontWeight: "bold", color: "var(--primary)" }}>Rp {r.totalHonor.toLocaleString("id-ID")}</td>
                                    <td style={{ textAlign: "center" }}>
                                      <button className="btn btn-outline" style={{ fontSize: "0.72rem", padding: "3px 7px", display: "inline-flex", alignItems: "center", gap: "0.3rem" }} onClick={() => printTeacherPaySlip(r)}>
                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                                        Slip A5
                                      </button>
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* ─── SUB-TAB 5: BUKU KAS UMUM (BKU) & LAPORAN MULTI-KAS ─── */}
                    {/* ─── SUB-TAB BARU: REKAP ABSENSI GURU (BENDAHARA) ─── */}
                    {bendaharaSubTab === "rekap-absen-guru" && (
                      <div className="card-ui">
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
                          <div>
                            <h2 style={{ fontSize: "1.2rem", fontWeight: "bold", margin: "0 0 0.2rem 0", color: "var(--primary-dark)" }}>Rekapitulasi Kehadiran Guru</h2>
                            <p style={{ margin: 0, fontSize: "0.85rem", color: "#64748b" }}>Data kehadiran ini dibaca dari modul Presensi Pendidik secara *real-time*.</p>
                          </div>
                          
                          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                            <div className="input-group">
                              <select 
                                className="input-field" 
                                value={bendaharaAbsenGuruBulan} 
                                onChange={(e) => setBendaharaAbsenGuruBulan(e.target.value)}
                                style={{ padding: "0.4rem 0.8rem", borderRadius: "6px" }}
                              >
                                {Array.from({length: 12}, (_, i) => i + 1).map(m => (
                                  <option key={m} value={m}>{new Date(2000, m - 1).toLocaleString('id-ID', { month: 'long' })}</option>
                                ))}
                              </select>
                            </div>
                            <div className="input-group">
                              <select 
                                className="input-field" 
                                value={bendaharaAbsenGuruTahun} 
                                onChange={(e) => setBendaharaAbsenGuruTahun(e.target.value)}
                                style={{ padding: "0.4rem 0.8rem", borderRadius: "6px" }}
                              >
                                {[...Array(5)].map((_, i) => {
                                  const year = new Date().getFullYear() - 2 + i;
                                  return <option key={year} value={year}>{year}</option>;
                                })}
                              </select>
                            </div>
                            <button 
                              className="btn btn-primary"
                              onClick={async () => {
                                setBendaharaAbsenGuruLoading(true);
                                const res = await getTeacherAttendanceRecap(bendaharaAbsenGuruBulan, bendaharaAbsenGuruTahun);
                                setBendaharaAbsenGuruLoading(false);
                                if (res.success) setBendaharaAbsenGuruData(res);
                                else alert("Gagal mengambil data: " + res.error);
                              }}
                              disabled={bendaharaAbsenGuruLoading}
                              style={{ padding: "0.4rem 1rem", borderRadius: "6px" }}
                            >
                              {bendaharaAbsenGuruLoading ? "Memuat..." : "Tampilkan"}
                            </button>
                          </div>
                        </div>

                        {bendaharaAbsenGuruLoading ? (
                          <div style={{ padding: "3rem", textAlign: "center", color: "#64748b" }}>
                            Memuat data rekapitulasi kehadiran...
                          </div>
                        ) : !bendaharaAbsenGuruData ? (
                          <div style={{ padding: "3rem", textAlign: "center", color: "#64748b", background: "#f8fafc", borderRadius: "8px" }}>
                            Silakan pilih bulan dan tahun, lalu klik "Tampilkan".
                          </div>
                        ) : (
                          <div>
                            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "1rem" }}>
                              <button 
                                className="btn btn-outline"
                                style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.4rem 1rem", fontSize: "0.85rem" }}
                                onClick={() => {
                                  const printWin = window.open('', '', 'width=1200,height=800');
                                  if (!printWin) { alert("Pop-up diblokir. Izinkan pop-up untuk mencetak."); return; }

                                  const bulanNama = new Date(2000, parseInt(bendaharaAbsenGuruBulan) - 1).toLocaleString('id-ID', { month: 'long' });
                                  
                                  const dateHeaders = bendaharaAbsenGuruData.dates.map(d => `<th style="padding:4px;width:20px;">${parseInt(d.split("-")[2])}</th>`).join("");
                                  
                                  const rows = bendaharaAbsenGuruData.recap.map((t, i) => {
                                    const cells = bendaharaAbsenGuruData.dates.map(d => {
                                      const st = t.attMap[d] ? t.attMap[d].status : null;
                                      let v = "";
                                      if(st === "HADIR") v = "H";
                                      else if(st === "SAKIT") v = "S";
                                      else if(st === "IZIN") v = "I";
                                      else if(st === "ALPA") v = "A";
                                      else if(st === "TUGAS_LUAR") v = "TL";
                                      return `<td style="text-align:center;padding:4px;">${v}</td>`;
                                    }).join("");

                                    return `
                                      <tr>
                                        <td style="text-align:center;">${i+1}</td>
                                        <td style="padding:4px;">${t.name}</td>
                                        ${cells}
                                        <td style="text-align:center;font-weight:bold;">${t.hadir}</td>
                                        <td style="text-align:center;">${t.sakit}</td>
                                        <td style="text-align:center;">${t.izin}</td>
                                        <td style="text-align:center;">${t.alpa}</td>
                                        <td style="text-align:center;">${t.tugasLuar || 0}</td>
                                      </tr>
                                    `;
                                  }).join("");

                                  printWin.document.write(`<!DOCTYPE html><html><head>
                                    <title>Rekap Absensi Guru - ${bulanNama} ${bendaharaAbsenGuruTahun}</title>
                                    <style>
                                      body { font-family: Arial, sans-serif; font-size: 11px; margin: 10mm; color: #111; }
                                      table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                                      th, td { border: 1px solid #000; }
                                      th { background-color: #f2f2f2; }
                                      @media print { @page { size: landscape; } }
                                    </style>
                                  </head><body onload="window.print()">
                                    <div style="text-align:center;margin-bottom:20px;">
                                      <h2 style="margin:0;padding:0;">REKAP KEHADIRAN GURU (PENDIDIK)</h2>
                                      <h3 style="margin:5px 0 0 0;">Bulan: ${bulanNama} ${bendaharaAbsenGuruTahun}</h3>
                                    </div>
                                    <table>
                                      <thead>
                                        <tr>
                                          <th rowspan="2" style="width:25px;">No</th>
                                          <th rowspan="2" style="min-width:130px;">Nama Guru</th>
                                          <th colspan="${bendaharaAbsenGuruData.dates.length}">Tanggal</th>
                                          <th colspan="5">Total</th>
                                        </tr>
                                        <tr>
                                          ${dateHeaders}
                                          <th style="width:25px;">H</th>
                                          <th style="width:25px;">S</th>
                                          <th style="width:25px;">I</th>
                                          <th style="width:25px;">A</th>
                                          <th style="width:25px;">TL</th>
                                        </tr>
                                      </thead>
                                      <tbody>${rows}</tbody>
                                    </table>
                                  </body></html>`);
                                  printWin.document.close();
                                }}
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg> Cetak
                              </button>
                            </div>
                            
                            {bendaharaAbsenGuruData.dates.length === 0 ? (
                              <div style={{ textAlign: "center", padding: "2rem", color: "#888" }}>
                                <div style={{ fontSize: "2rem" }}>🗓️</div>
                                <p>Belum ada data absensi guru pada bulan ini.</p>
                              </div>
                            ) : (
                              <div style={{ overflowX: "auto", padding: "1rem" }}>
                                <table className="table" style={{ width: "100%", fontSize: "0.8rem", whiteSpace: "nowrap" }}>
                                  <thead>
                                    <tr>
                                      <th rowSpan="2" style={{ textAlign: "center", width: "40px", backgroundColor: "#f1f5f9" }}>No</th>
                                      <th rowSpan="2" style={{ minWidth: "200px", backgroundColor: "#f1f5f9" }}>Nama Guru</th>
                                      <th colSpan={bendaharaAbsenGuruData.dates.length} style={{ textAlign: "center", backgroundColor: "#e0f2fe", color: "#0369a1" }}>Tanggal</th>
                                      <th colSpan="5" style={{ textAlign: "center", backgroundColor: "#fef3c7", color: "#b45309" }}>Total</th>
                                    </tr>
                                    <tr>
                                      {bendaharaAbsenGuruData.dates.map(d => (
                                        <th key={d} style={{ padding: "6px 3px", textAlign: "center", minWidth: "28px", fontWeight: 600, backgroundColor: "#f0f9ff" }}>
                                          {parseInt(d.split("-")[2])}
                                        </th>
                                      ))}
                                      <th style={{ backgroundColor: "#ecfdf5", color: "#065f46" }}>H</th>
                                      <th style={{ backgroundColor: "#fffbeb", color: "#92400e" }}>S</th>
                                      <th style={{ backgroundColor: "#f0f9ff", color: "#075985" }}>I</th>
                                      <th style={{ backgroundColor: "#fef2f2", color: "#991b1b" }}>A</th>
                                      <th style={{ backgroundColor: "#faf5ff", color: "#6b21a8" }}>TL</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {bendaharaAbsenGuruData.recap.map((t, i) => (
                                      <tr key={t.id} style={{ background: i % 2 === 0 ? "#fff" : "#f8fafc" }}>
                                        <td style={{ textAlign: "center", color: "#888" }}>{i + 1}</td>
                                        <td>
                                          <div style={{ fontWeight: 600, color: "var(--primary-dark)" }}>{t.name}</div>
                                          <div style={{ fontSize: "0.7rem", color: "#64748b" }}>{t.jabatan || "Guru"}</div>
                                        </td>
                                        {bendaharaAbsenGuruData.dates.map(d => {
                                          const record = t.attMap[d];
                                          const st = record ? record.status : null;
                                          return (
                                            <td key={d} style={{ textAlign: "center", padding: "4px" }}>
                                              {st === "HADIR" && <div style={{ background: "#dcfce7", color: "#166534", padding: "2px", borderRadius: "4px", fontWeight: "bold" }}>H</div>}
                                              {st === "SAKIT" && <div style={{ background: "#fef3c7", color: "#b45309", padding: "2px", borderRadius: "4px", fontWeight: "bold" }}>S</div>}
                                              {st === "IZIN" && <div style={{ background: "#e0f2fe", color: "#0369a1", padding: "2px", borderRadius: "4px", fontWeight: "bold" }}>I</div>}
                                              {st === "ALPA" && <div style={{ background: "#fee2e2", color: "#991b1b", padding: "2px", borderRadius: "4px", fontWeight: "bold" }}>A</div>}
                                              {st === "TUGAS_LUAR" && <div style={{ background: "#f3e8ff", color: "#7e22ce", padding: "2px", borderRadius: "4px", fontWeight: "bold" }}>TL</div>}
                                              {!st && <div style={{ color: "#cbd5e1" }}>-</div>}
                                            </td>
                                          );
                                        })}
                                        <td style={{ textAlign: "center", fontWeight: "bold", color: "#16a34a", backgroundColor: "#f8fafc" }}>{t.hadir}</td>
                                        <td style={{ textAlign: "center", color: "#d97706", backgroundColor: "#f8fafc" }}>{t.sakit}</td>
                                        <td style={{ textAlign: "center", color: "#0284c7", backgroundColor: "#f8fafc" }}>{t.izin}</td>
                                        <td style={{ textAlign: "center", color: "#dc2626", backgroundColor: "#f8fafc" }}>{t.alpa}</td>
                                        <td style={{ textAlign: "center", fontWeight: "bold", color: "#7e22ce", backgroundColor: "#f8fafc" }}>{t.tugasLuar || 0}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {bendaharaSubTab === "bku" && (
                      <div>
                        {/* Summary BKU */}
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
                          <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "1.25rem", borderRadius: "12px" }}>
                            <span style={{ fontSize: "0.78rem", color: "#166534", fontWeight: "bold", textTransform: "uppercase" }}>SALDO KAS SWADAYA</span>
                            <h3 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#15803d", margin: "0.25rem 0 0 0" }}>
                              Rp {(bendaharaData?.saldoSwadaya || 0).toLocaleString("id-ID")}
                            </h3>
                          </div>
                          <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", padding: "1.25rem", borderRadius: "12px" }}>
                            <span style={{ fontSize: "0.78rem", color: "#1e40af", fontWeight: "bold", textTransform: "uppercase" }}>SALDO KAS DANA BOS</span>
                            <h3 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#1d4ed8", margin: "0.25rem 0 0 0" }}>
                              Rp {(bendaharaData?.saldoBos || 0).toLocaleString("id-ID")}
                            </h3>
                          </div>
                          <div style={{ background: "#fefce8", border: "1px solid #fef08a", padding: "1.25rem", borderRadius: "12px" }}>
                            <span style={{ fontSize: "0.78rem", color: "#854d0e", fontWeight: "bold", textTransform: "uppercase" }}>TOTAL KAS SEKOLAH</span>
                            <h3 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#a16207", margin: "0.25rem 0 0 0" }}>
                              Rp {((bendaharaData?.saldoSwadaya || 0) + (bendaharaData?.saldoBos || 0)).toLocaleString("id-ID")}
                            </h3>
                          </div>
                        </div>

                        {/* Export & Print Bar */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                          <h4 style={{ fontWeight: 800, color: "var(--primary)", margin: 0 }}>Jurnal Buku Kas Umum (BKU)</h4>
                          <button className="btn btn-primary" style={{ fontSize: "0.82rem", display: "inline-flex", alignItems: "center", gap: "0.4rem" }} onClick={() => {
                            const printWin = window.open("", "_blank");
                            const monthName = bendaharaData?.selectedBulan 
                              ? new Date(2000, parseInt(bendaharaData.selectedBulan) - 1, 1).toLocaleString("id-ID", { month: "long" }) 
                              : "Semua";
                            const yearStr = bendaharaData?.selectedTahun || new Date().getFullYear();

                            let studentRows = (bendaharaData?.monthlyStudentPayments || []).map((p, idx) => `
                              <tr>
                                <td style="text-align:center">${idx + 1}</td>
                                <td style="text-align:center">${p.paidAt}</td>
                                <td style="text-align:center"><span style="color:#15803d;font-weight:bold">KAS SWADAYA</span></td>
                                <td>Pemasukan ${p.feeName} - ${p.student?.name || 'Siswa'} (${p.student?.kelas || '-'}) [Nota: ${p.receiptNo}]</td>
                                <td>Pembayaran Siswa</td>
                                <td style="text-align:right;color:#16a34a;font-weight:bold">+ Rp ${p.paidAmount.toLocaleString('id-ID')}</td>
                                <td style="text-align:right;color:#94a3b8">-</td>
                              </tr>
                            `).join('');

                            let startIdx = (bendaharaData?.monthlyStudentPayments || []).length;
                            let expenseRows = (bendaharaData?.allExpenses || []).map((e, idx) => `
                              <tr>
                                <td style="text-align:center">${startIdx + idx + 1}</td>
                                <td style="text-align:center">${e.date}</td>
                                <td style="text-align:center"><span style="color:${e.source === 'KAS_BOS' ? '#1e40af' : '#b45309'};font-weight:bold">${e.source === 'KAS_BOS' ? 'KAS DANA BOS' : 'KAS SWADAYA'}</span></td>
                                <td>${e.title} ${e.receiptNo ? `(Nota: ${e.receiptNo})` : ''}</td>
                                <td>${e.category}</td>
                                <td style="text-align:right;color:#94a3b8">-</td>
                                <td style="text-align:right;color:#dc2626;font-weight:bold">- Rp ${e.amount.toLocaleString('id-ID')}</td>
                              </tr>
                            `).join('');

                            const totalMasuk = (bendaharaData?.monthlyStudentPayments || []).reduce((a, b) => a + b.paidAmount, 0);
                            const totalKeluar = (bendaharaData?.allExpenses || []).reduce((a, b) => a + b.amount, 0);
                            const saldoSwadaya = bendaharaData?.saldoSwadaya || 0;
                            const saldoBos = bendaharaData?.saldoBos || 0;
                            const totalKas = saldoSwadaya + saldoBos;

                            printWin.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>Buku Kas Umum (BKU) - Sekolah Master Demo - ${monthName} ${yearStr}</title>
  <style>
    body { font-family: 'Times New Roman', Times, serif; font-size: 11px; margin: 15mm 10mm; color: #111; }
    .header { text-align: center; border-bottom: 3px double #000; padding-bottom: 8px; margin-bottom: 15px; }
    .header h2 { margin: 0; font-size: 16px; font-weight: bold; text-transform: uppercase; }
    .header h3 { margin: 2px 0; font-size: 13px; font-weight: bold; text-transform: uppercase; }
    .header p { margin: 0; font-size: 10px; font-style: italic; }
    .title-box { text-align: center; margin-bottom: 15px; }
    .title-box h3 { margin: 0; font-size: 14px; font-weight: bold; text-decoration: underline; text-transform: uppercase; }
    .title-box p { margin: 3px 0 0 0; font-size: 11px; font-weight: bold; }
    .summary-grid { display: flex; justify-content: space-between; margin-bottom: 15px; font-size: 11px; border: 1px solid #333; padding: 8px 12px; background: #fcfcfc; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    th, td { border: 1px solid #333; padding: 5px 6px; font-size: 10px; vertical-align: middle; }
    th { background: #e5e7eb; text-align: center; font-weight: bold; }
    .sign-section { margin-top: 30px; display: flex; justify-content: space-between; page-break-inside: avoid; }
    .sign-box { text-align: center; width: 220px; font-size: 11px; }
    .sign-space { height: 50px; }
    @media print { @page { size: A4 portrait; margin: 10mm; } body { margin: 0; } }
  </style>
</head>
<body>
  <div class="header" style="display:flex;align-items:center;justify-content:center;border-bottom:3px double #000;padding-bottom:8px;margin-bottom:15px">
    ${school?.logo && (school.logo.startsWith("data:") || school.logo.startsWith("http") || school.logo.startsWith("/")) ? `<img src="${school.logo}" alt="Logo" style="height:55px;width:55px;object-fit:contain;margin-right:15px" />` : `<div style="font-size:36px;margin-right:15px">${school?.logo || '🏫'}</div>`}
    <div style="text-align:center">
      <h3 style="margin:0;font-size:13px;font-weight:bold;text-transform:uppercase">${school?.yayasan || 'YAYASAN MASTER DEMO'}</h3>
      <h2 style="margin:2px 0;font-size:16px;font-weight:bold;text-transform:uppercase">${school?.nama || 'SEKOLAH MASTER DEMO'}</h2>
      <p style="margin:0;font-size:10px;font-style:italic">Alamat: ${school?.alamat || 'Jegedeh Wahyurejo, Candisari, Kota Demo, Magelang'} | Telepon: ${school?.telepon || '-'} | Email: ${school?.email || '-'}</p>
    </div>
  </div>

  <div class="title-box">
    <h3>BUKU KAS UMUM (BKU) SEKOLAH</h3>
    <p>Periode Bulan: ${monthName} ${yearStr}</p>
  </div>

  <div class="summary-grid">
    <div><strong>Saldo Kas Swadaya:</strong> Rp ${saldoSwadaya.toLocaleString('id-ID')}</div>
    <div><strong>Saldo Kas BOS:</strong> Rp ${saldoBos.toLocaleString('id-ID')}</div>
    <div><strong>TOTAL SALDO KAS:</strong> Rp ${totalKas.toLocaleString('id-ID')}</div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width:25px">No</th>
        <th style="width:75px">Tanggal</th>
        <th style="width:110px">Sumber Kas</th>
        <th>Uraian Transaksi</th>
        <th style="width:100px">Kategori</th>
        <th style="width:105px;text-align:right">Pemasukan (Debit)</th>
        <th style="width:105px;text-align:right">Pengeluaran (Kredit)</th>
      </tr>
    </thead>
    <tbody>
      ${studentRows}
      ${expenseRows}
      ${(studentRows === '' && expenseRows === '') ? '<tr><td colSpan="7" style="text-align:center;padding:15px;color:#777">Belum ada catatan jurnal transaksi pada periode ini.</td></tr>' : ''}
    </tbody>
    <tfoot>
      <tr style="background:#f3f4f6;font-weight:bold">
        <td colSpan="5" style="text-align:right;padding:6px">TOTAL MUTASI PERIODE INI:</td>
        <td style="text-align:right;color:#16a34a">+ Rp ${totalMasuk.toLocaleString('id-ID')}</td>
        <td style="text-align:right;color:#dc2626">- Rp ${totalKeluar.toLocaleString('id-ID')}</td>
      </tr>
    </tfoot>
  </table>

  <div class="sign-section">
    <div class="sign-box">
      <div>Mengetahui,</div>
      <div>Kepala Sekolah</div>
      <div class="sign-space"></div>
      <div><strong>${school?.kepsek || 'H. Ahmad Syafi\'i, S.Pd.I'}</strong></div>
      <div>NIP: ${school?.kepsekNip || '-'}</div>
    </div>
    <div class="sign-box">
      <div>Magelang, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
      <div>Bendahara Sekolah</div>
      <div class="sign-space"></div>
      <div><strong>${session?.name || 'Bendahara Sekolah'}</strong></div>
      <div>NIP: ${session?.nip || '-'}</div>
    </div>
  </div>
</body>
</html>`);
                            printWin.document.close();
                            printWin.focus();
                            setTimeout(() => printWin.print(), 500);
                          }}>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                            Cetak PDF BKU
                          </button>
                        </div>

                        <div className="portal-table-container">
                          <table className="portal-table">
                            <thead>
                              <tr>
                                <th>Tanggal</th>
                                <th>Sumber Kas</th>
                                <th>Uraian Transaksi</th>
                                <th>Kategori</th>
                                <th style={{ textAlign: "right", color: "#16a34a" }}>Pemasukan (Debit)</th>
                                <th style={{ textAlign: "right", color: "#dc2626" }}>Pengeluaran (Kredit)</th>
                              </tr>
                            </thead>
                            <tbody>
                              {/* Pembayaran Siswa Bulan Ini */}
                              {bendaharaData?.monthlyStudentPayments?.map(p => (
                                <tr key={`p-${p.id}`}>
                                  <td>{p.paidAt}</td>
                                  <td><span style={{ background: "#dcfce7", color: "#15803d", padding: "2px 6px", borderRadius: "4px", fontSize: "0.72rem", fontWeight: "bold" }}>KAS SWADAYA</span></td>
                                  <td>Pemasukan {p.feeName} - {p.student?.name} ({p.student?.kelas})</td>
                                  <td>Pembayaran Siswa</td>
                                  <td style={{ textAlign: "right", color: "#16a34a", fontWeight: "bold" }}>+ Rp {p.paidAmount.toLocaleString("id-ID")}</td>
                                  <td style={{ textAlign: "right", color: "#94a3b8" }}>-</td>
                                </tr>
                              ))}
                              {/* Pengeluaran Swadaya & BOS */}
                              {bendaharaData?.allExpenses?.map(e => (
                                <tr key={`e-${e.id}`}>
                                  <td>{e.date}</td>
                                  <td>
                                    <span style={{ background: e.source === "KAS_BOS" ? "#dbeafe" : "#fef3c7", color: e.source === "KAS_BOS" ? "#1e40af" : "#b45309", padding: "2px 6px", borderRadius: "4px", fontSize: "0.72rem", fontWeight: "bold" }}>
                                      {e.source === "KAS_BOS" ? "KAS DANA BOS" : "KAS SWADAYA"}
                                    </span>
                                  </td>
                                  <td>{e.title} {e.receiptNo ? `(Nota: ${e.receiptNo})` : ""}</td>
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

                    {/* ─── SUB-TAB 6: MASTER TARIF TAGIHAN ─── */}
                    {bendaharaSubTab === "tarif" && (
                      <div>
                        <div style={{ background: "#f8fafc", padding: "1.25rem", borderRadius: "var(--radius-md)", border: "1px solid #e2e8f0", marginBottom: "1.5rem" }}>
                          <h4 style={{ margin: "0 0 1rem 0", fontWeight: 800, color: "var(--primary-dark)", fontSize: "0.95rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <div style={{ background: "linear-gradient(135deg, #0d9488, #0f766e)", borderRadius: "50%", width: "28px", height: "28px", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#fff", flexShrink: 0 }}>
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2-2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                            </div>
                            Form Tambah / Update Tarif Tagihan Siswa
                          </h4>
                          {feeMsg && <div className={`form-alert ${feeMsg.startsWith("Gagal") ? "error" : "success"}`} style={{ display: "block", marginBottom: "0.75rem" }}>{feeMsg}</div>}
                          <form onSubmit={async (e) => {
                            e.preventDefault();
                            setFeeLoading(true);
                            setFeeMsg("");
                            const res = await saveFeeMaster({ name: feeNameInput, nominal: feeNominalInput, tipe: feeTipeInput, tahunAjaran: school?.tahunAjaran || "2026/2027" });
                            setFeeLoading(false);
                            if (res.success) {
                              setFeeMsg("✓ Tarif tagihan berhasil disimpan!");
                              setFeeNameInput("");
                              setFeeNominalInput("");
                              await loadBendaharaData();
                            } else setFeeMsg("Gagal: " + res.error);
                          }}>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
                              <div>
                                <label className="form-label">Nama Tagihan *</label>
                                <input type="text" className="form-input" placeholder="Contoh: SPP Bulanan, Uang Gedung, Seragam" value={feeNameInput} onChange={e => setFeeNameInput(e.target.value)} required />
                              </div>
                              <div>
                                <label className="form-label">Nominal (Rp) *</label>
                                <input type="number" className="form-input" placeholder="Contoh: 150000" value={feeNominalInput} onChange={e => setFeeNominalInput(e.target.value)} required />
                              </div>
                              <div>
                                <label className="form-label">Tipe Tagihan</label>
                                <select className="form-select" value={feeTipeInput} onChange={e => setFeeTipeInput(e.target.value)}>
                                  <option value="BULANAN">Bulanan (SPP)</option>
                                  <option value="SEKALI_BAYAR">Sekali Bayar (Gedung/Seragam)</option>
                                </select>
                              </div>
                            </div>
                            <button type="submit" className="btn btn-primary" disabled={feeLoading} style={{ marginTop: "1rem", padding: "0.6rem 1.5rem", display: "inline-flex", alignItems: "center", gap: "0.45rem" }}>
                              {feeLoading ? "Menyimpan..." : (
                                <>
                                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                                  Simpan Tarif Tagihan
                                </>
                              )}
                            </button>
                          </form>
                        </div>

                        <div className="portal-table-container">
                          <h4 style={{ fontWeight: 800, color: "var(--primary)", marginBottom: "0.75rem" }}>Master Tarif Tagihan Terdaftar ({bendaharaData?.feeMasters?.length || 0})</h4>
                          <table className="portal-table">
                            <thead>
                              <tr>
                                <th>Nama Tagihan</th>
                                <th>Tipe Tagihan</th>
                                <th>Tahun Ajaran</th>
                                <th style={{ textAlign: "right" }}>Nominal (Rp)</th>
                                <th style={{ textAlign: "center" }}>Aksi</th>
                              </tr>
                            </thead>
                            <tbody>
                              {!bendaharaData?.feeMasters || bendaharaData.feeMasters.length === 0 ? (
                                <tr><td colSpan="5" style={{ textAlign: "center", color: "#94a3b8", padding: "1.5rem" }}>Belum ada master tarif tagihan.</td></tr>
                              ) : (
                                bendaharaData.feeMasters.map(item => (
                                  <tr key={item.id}>
                                    <td><strong>{item.name}</strong></td>
                                    <td><span style={{ background: item.tipe === "BULANAN" ? "#e0f2fe" : "#fef3c7", color: item.tipe === "BULANAN" ? "#0369a1" : "#b45309", padding: "2px 6px", borderRadius: "4px", fontSize: "0.72rem", fontWeight: "bold" }}>{item.tipe}</span></td>
                                    <td>{item.tahunAjaran}</td>
                                    <td style={{ textAlign: "right", fontWeight: "bold", color: "#16a34a" }}>Rp {item.nominal.toLocaleString("id-ID")}</td>
                                    <td style={{ textAlign: "center" }}>
                                      <button className="btn btn-outline" style={{ fontSize: "0.72rem", padding: "3px 7px", borderColor: "#ef4444", color: "#ef4444", display: "inline-flex", alignItems: "center" }} title="Hapus" onClick={async () => {
                                        if (confirm(`Hapus master tarif ${item.name}?`)) {
                                          await deleteFeeMaster(item.id);
                                          await loadBendaharaData();
                                        }
                                      }}>
                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                                      </button>
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 10: TATA USAHA (TU) */}
                {activeTab === "tu" && session.isTU && (
                  <div className="no-print">
                    <span style={{ fontSize: "0.85rem", textTransform: "uppercase", fontWeight: 700, color: "var(--secondary)" }}>Administrasi Lanjutan</span>
                    <h2 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--primary-dark)", marginBottom: "0.5rem" }}>
                      Modul Tata Usaha (TU), E-Perpus & Inventaris Sarpras
                    </h2>
                    <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1.5rem" }}>
                      Pengelolaan E-Arsip Persuratan Sekolah (Surat Ket. Siswa Aktif A4), Sirkulasi Perpustakaan, dan Inventaris Aset Sekolah.
                    </p>

                    {/* Sub-Tab Navigation Bar */}
                    <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", borderBottom: "1px solid #e2e8f0", paddingBottom: "0.75rem", flexWrap: "wrap" }}>
                      <button 
                        className={`btn ${tuSubTab === "letter" ? "btn-primary" : "btn-outline"}`}
                        onClick={() => { setTuSubTab("letter"); loadTuData(); }}
                        style={{ fontSize: "0.82rem", display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                        Persuratan & E-Arsip TU
                      </button>
                      <button 
                        className={`btn ${tuSubTab === "jurusan" ? "btn-primary" : "btn-outline"}`}
                        onClick={() => { setTuSubTab("jurusan"); loadMajorsData(); }}
                        style={{ fontSize: "0.82rem", display: "inline-flex", alignItems: "center", gap: "0.4rem", borderColor: "#0d9488", color: tuSubTab === "jurusan" ? "#fff" : "#0d9488" }}
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
                        Master Jurusan SMK
                      </button>

                    </div>

                    {/* SUB-TAB 1: PERSURATAN TU & E-ARSIP */}
                    {tuSubTab === "letter" && (
                      <div>
                        <div style={{ background: "#f8fafc", padding: "1.25rem", borderRadius: "var(--radius-md)", border: "1px solid #e2e8f0", marginBottom: "1.5rem" }}>
                          <h4 style={{ margin: "0 0 1rem 0", fontWeight: 800, color: "var(--primary-dark)", fontSize: "0.95rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <div style={{ background: "linear-gradient(135deg, #2563eb, #1d4ed8)", borderRadius: "50%", width: "28px", height: "28px", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#fff", flexShrink: 0 }}>
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                            </div>
                            Form Penerbitan Surat & Agenda Persuratan
                          </h4>
                          {tuLetterMsg && <div className={`form-alert ${tuLetterMsg.startsWith("Gagal") ? "error" : "success"}`} style={{ display: "block", marginBottom: "0.75rem" }}>{tuLetterMsg}</div>}
                          <form onSubmit={async (e) => {
                            e.preventDefault();
                            setTuLetterLoading(true);
                            setTuLetterMsg("");
                            const res = await createSchoolLetter({
                              letterType: letType,
                              studentNisn: letStudentNisn,
                              title: letTitle,
                              recipient: letRecipient,
                              sender: letSender,
                              date: letDate,
                              keterangan: letKet
                            });
                            setTuLetterLoading(false);
                            if (res.success) {
                              setTuLetterMsg("✓ Surat berhasil diterbitkan!");
                              setLetTitle("");
                              setLetRecipient("");
                              setLetKet("");
                              await loadTuData();
                            } else setTuLetterMsg("Gagal: " + res.error);
                          }}>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
                              <div>
                                <label className="form-label">Jenis Surat *</label>
                                <select className="form-select" value={letType} onChange={e => {
                                  setLetType(e.target.value);
                                  if (e.target.value === "SURAT_KETERANGAN_SISWA") setLetTitle("Surat Keterangan Siswa Aktif");
                                  else if (e.target.value === "SURAT_PINDAH") setLetTitle("Surat Keterangan Pindah Sekolah");
                                  else setLetTitle("Surat Masuk / Keluar");
                                }}>
                                  <option value="SURAT_KETERANGAN_SISWA">Surat Keterangan Siswa Aktif (Format A4 Resmi)</option>
                                  <option value="SURAT_PINDAH">Surat Keterangan Pindah Sekolah</option>
                                  <option value="SURAT_MASUK">Agenda Surat Masuk</option>
                                  <option value="SURAT_KELUAR">Agenda Surat Keluar</option>
                                </select>
                              </div>
                              {letType === "SURAT_KETERANGAN_SISWA" && (
                                <div>
                                  <label className="form-label">Pilih Siswa *</label>
                                  <select className="form-select" value={letStudentNisn} onChange={e => setLetStudentNisn(e.target.value)} required>
                                    <option value="">-- Pilih Siswa --</option>
                                    {students.map(s => (
                                      <option key={s.nisn} value={s.nisn}>{s.name} ({s.kelas}) - NISN: {s.nisn}</option>
                                    ))}
                                  </select>
                                </div>
                              )}
                              <div>
                                <label className="form-label">Perihal / Judul Surat *</label>
                                <input type="text" className="form-input" value={letTitle} onChange={e => setLetTitle(e.target.value)} required />
                              </div>
                              <div>
                                <label className="form-label">Tanggal Surat</label>
                                <input type="date" className="form-input" value={letDate} onChange={e => setLetDate(e.target.value)} required />
                              </div>
                              <div>
                                <label className="form-label">Tujuan / Penerima</label>
                                <input type="text" className="form-input" placeholder="Contoh: Orang Tua / Dinas" value={letRecipient} onChange={e => setLetRecipient(e.target.value)} />
                              </div>
                            </div>
                            <button type="submit" className="btn btn-primary" disabled={tuLetterLoading} style={{ marginTop: "1rem", padding: "0.6rem 1.5rem", display: "inline-flex", alignItems: "center", gap: "0.45rem" }}>
                              {tuLetterLoading ? "Menerbitkan..." : (
                                <>
                                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                                  Terbit & Simpan Surat
                                </>
                              )}
                            </button>
                          </form>
                        </div>

                        {/* Tabel E-Arsip Persuratan */}
                        <div className="portal-table-container">
                          <h4 style={{ fontWeight: 800, color: "var(--primary)", marginBottom: "0.75rem" }}>E-Arsip Persuratan Terdaftar ({tuLetters.length})</h4>
                          <table className="portal-table">
                            <thead>
                              <tr>
                                <th>No. Surat</th>
                                <th>Tanggal</th>
                                <th>Jenis</th>
                                <th>Perihal</th>
                                <th>Penerima/Siswa</th>
                                <th style={{ textAlign: "center" }}>Aksi</th>
                              </tr>
                            </thead>
                            <tbody>
                              {tuLetters.length === 0 ? (
                                <tr><td colSpan="6" style={{ textAlign: "center", color: "#94a3b8", padding: "1.5rem" }}>Belum ada arsip surat terdaftar.</td></tr>
                              ) : (
                                tuLetters.map(l => {
                                  const st = students.find(s => s.nisn === l.studentNisn);
                                  return (
                                    <tr key={l.id}>
                                      <td style={{ fontWeight: "bold", fontSize: "0.8rem", color: "#2563eb" }}>{l.letterNo}</td>
                                      <td>{l.date}</td>
                                      <td><span style={{ background: "#dbeafe", color: "#1e40af", padding: "2px 6px", borderRadius: "4px", fontSize: "0.72rem", fontWeight: "bold" }}>{l.letterType}</span></td>
                                      <td><strong>{l.title}</strong></td>
                                      <td>{st ? `${st.name} (${st.kelas})` : l.recipient || "-"}</td>
                                      <td style={{ textAlign: "center" }}>
                                        <div style={{ display: "flex", gap: "0.3rem", justifyContent: "center" }}>
                                          {l.letterType === "SURAT_KETERANGAN_SISWA" && (
                                            <button className="btn btn-outline" style={{ fontSize: "0.72rem", padding: "3px 7px", display: "inline-flex", alignItems: "center", gap: "0.3rem" }} onClick={() => {
                                              const printWin = window.open("", "_blank");
                                              printWin.document.write(`<!DOCTYPE html><html><head><title>${l.title} - ${st?.name || ''}</title><style>body{font-family:'Times New Roman',serif;padding:30px;line-height:1.6;font-size:12pt}.kop{border-bottom:3px double #000;padding-bottom:10px;text-align:center;margin-bottom:25px}.title{text-align:center;font-weight:bold;text-decoration:underline;font-size:14pt;margin-bottom:5px}.no{text-align:center;font-size:11pt;margin-bottom:25px}</style></head><body><div class="kop"><h2 style="margin:0">${school?.name || 'SEKOLAH MASTER DEMO'}</h2><p style="margin:0;font-size:10pt">${school?.address || ''} | Email: smpalqodiriyah@gmail.com</p></div><div class="title">SURAT KETERANGAN SISWA AKTIF</div><div class="no">Nomor: ${l.letterNo}</div><p>Yang bertanda tangan di bawah ini Kepala Sekolah Sekolah Master Demo menerangkan bahwa:</p><table style="margin-left:20px;margin-bottom:20px"><tr><td>Nama Siswa</td><td>: <strong>${st?.name || '-'}</strong></td></tr><tr><td>NISN</td><td>: ${st?.nisn || '-'}</td></tr><tr><td>Kelas</td><td>: ${st?.kelas || '-'}</td></tr><tr><td>Tempat/Tgl Lahir</td><td>: ${st?.tempatLahir || '-'}, ${st?.tanggalLahir || '-'}</td></tr></table><p>Adalah benar-benar siswa aktif terdaftar pada Sekolah Master Demo Tahun Ajaran ${school?.tahunAjaran || '2026/2027'}.</p><p>Demikian surat keterangan ini dibuat untuk dipergunakan sebagaimana mestinya.</p><div style="float:right;text-align:center;margin-top:40px"><p>Magelang, ${l.date}</p><p>Kepala Sekolah,</p><br/><br/><br/><p><strong>${school?.headmaster || 'H. Ahmad Syafi\'i, S.Pd.I'}</strong></p></div></body></html>`);
                                              printWin.document.close();
                                              printWin.focus();
                                              setTimeout(() => printWin.print(), 500);
                                            }}>
                                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                                              Cetak A4
                                            </button>
                                          )}
                                          <button className="btn btn-outline" style={{ fontSize: "0.72rem", padding: "3px 7px", borderColor: "#ef4444", color: "#ef4444", display: "inline-flex", alignItems: "center" }} title="Hapus" onClick={async () => {
                                            if (confirm("Hapus arsip surat ini?")) {
                                              await deleteSchoolLetter(l.id);
                                              await loadTuData();
                                            }
                                          }}>
                                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
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
                    )}

                    {/* SUB-TAB: MASTER JURUSAN SMK */}
                    {tuSubTab === "jurusan" && (
                      <div>
                        <div style={{ background: "#f0fdfa", padding: "1.25rem", borderRadius: "var(--radius-md)", border: "1px solid #99f6e4", marginBottom: "1.5rem" }}>
                          <h4 style={{ margin: "0 0 1rem 0", fontWeight: 800, color: "#0f766e", fontSize: "0.95rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <div style={{ background: "linear-gradient(135deg, #0d9488, #0f766e)", borderRadius: "50%", width: "28px", height: "28px", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#fff", flexShrink: 0 }}>
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
                            </div>
                            Form Tambah / Kelola Master Jurusan SMK
                          </h4>
                          {majorMsg && <div className={`form-alert ${majorMsg.startsWith("Gagal") ? "error" : "success"}`} style={{ display: "block", marginBottom: "0.75rem" }}>{majorMsg}</div>}
                          <form onSubmit={async (e) => {
                            e.preventDefault();
                            if (!majorCodeInput || !majorNameInput) { setMajorMsg("Kode dan Nama Jurusan wajib diisi."); return; }
                            setMajorLoading(true);
                            setMajorMsg("");
                            const res = await saveMajor({ code: majorCodeInput, name: majorNameInput, unit: majorUnitInput });
                            setMajorLoading(false);
                            if (res.success) {
                              setMajorMsg("✓ Berhasil menyimpan Jurusan SMK!");
                              setMajorCodeInput("");
                              setMajorNameInput("");
                              await loadMajorsData();
                            } else setMajorMsg("Gagal: " + res.error);
                          }}>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
                              <div>
                                <label className="form-label">Kode Jurusan (Singkatan) *</label>
                                <input type="text" className="form-input" placeholder="Contoh: DKV, TKJ, AKL, TBO" value={majorCodeInput} onChange={e => setMajorCodeInput(e.target.value.toUpperCase())} required />
                              </div>
                              <div>
                                <label className="form-label">Nama Lengkap Program Keahlian *</label>
                                <input type="text" className="form-input" placeholder="Contoh: Desain Komunikasi Visual" value={majorNameInput} onChange={e => setMajorNameInput(e.target.value)} required />
                              </div>
                              <div>
                                <label className="form-label">Unit Sekolah</label>
                                <select className="form-select" value={majorUnitInput} onChange={e => setMajorUnitInput(e.target.value)}>
                                  <option value="SMK">🏢 Sekolah Master Demo</option>
                                  <option value="SMP">📘 Sekolah Master Demo</option>
                                </select>
                              </div>
                            </div>
                            <button type="submit" className="btn btn-primary" disabled={majorLoading} style={{ marginTop: "1rem", background: "#0d9488", borderColor: "#0d9488" }}>
                              {majorLoading ? "Menyimpan..." : "Simpan Jurusan Baru"}
                            </button>
                          </form>
                        </div>

                        {/* Tabel Daftar Jurusan SMK */}
                        <div style={{ background: "#fff", borderRadius: "var(--radius-md)", border: "1px solid #e2e8f0", padding: "1.25rem" }}>
                          <h4 style={{ margin: "0 0 1rem 0", fontWeight: 800, color: "var(--primary-dark)", fontSize: "0.95rem" }}>
                            Daftar Program Keahlian / Jurusan Resmi Terdaftar ({majorsList.length})
                          </h4>
                          <table className="table" style={{ width: "100%", fontSize: "0.85rem" }}>
                            <thead>
                              <tr style={{ background: "#f8fafc" }}>
                                <th>No</th>
                                <th>Kode Jurusan</th>
                                <th>Nama Program Keahlian / Jurusan</th>
                                <th>Unit</th>
                                <th style={{ textAlign: "center" }}>Aksi</th>
                              </tr>
                            </thead>
                            <tbody>
                              {majorsList.length === 0 ? (
                                <tr><td colSpan="5" style={{ textAlign: "center", color: "#94a3b8", padding: "1.5rem" }}>Belum ada data jurusan terdaftar. Sila tambah di form atas.</td></tr>
                              ) : (
                                majorsList.map((m, idx) => (
                                  <tr key={m.id}>
                                    <td>{idx + 1}</td>
                                    <td><strong style={{ color: "#0d9488", fontSize: "0.9rem" }}>{m.code}</strong></td>
                                    <td><strong>{m.name}</strong></td>
                                    <td><span style={{ background: "#ccfbf1", color: "#0f766e", padding: "2px 8px", borderRadius: "4px", fontSize: "0.72rem", fontWeight: "bold" }}>{m.unit}</span></td>
                                    <td style={{ textAlign: "center" }}>
                                      <button className="btn btn-outline" style={{ fontSize: "0.72rem", padding: "3px 7px", borderColor: "#ef4444", color: "#ef4444" }} title="Hapus Jurusan" onClick={async () => {
                                        if (confirm(`Hapus jurusan ${m.code} - ${m.name}?`)) {
                                          await deleteMajor(m.id);
                                          await loadMajorsData();
                                        }
                                      }}>
                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                                      </button>
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                  </div>
                )}

                {/* TAB 11: PERPUSTAKAAN (E-PERPUS) */}
                {activeTab === "perpus" && session.isPerpus && (
                  <div className="no-print">
                    <span style={{ fontSize: "0.85rem", textTransform: "uppercase", fontWeight: 700, color: "var(--secondary)" }}>Perpustakaan</span>
                    <h2 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--primary-dark)", marginBottom: "1.5rem" }}>
                      Modul E-Perpustakaan
                    </h2>
                      <div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "1.5rem" }}>
                          {/* Form Input Buku Perpustakaan */}
                          <div style={{ background: "#f8fafc", padding: "1.25rem", borderRadius: "var(--radius-md)", border: "1px solid #e2e8f0" }}>
                            <h4 style={{ margin: "0 0 1rem 0", fontWeight: 800, color: "var(--primary-dark)", fontSize: "0.95rem" }}>📚 Form Input Buku Perpustakaan</h4>
                            <form onSubmit={async (e) => {
                              e.preventDefault();
                              const res = await saveLibraryBook({ title: bookTitle, author: bookAuthor, publisher: bookPublisher, category: bookCategory, stock: bookStock, location: bookLocation });
                              if (res.success) {
                                setBookTitle("");
                                setBookAuthor("");
                                await loadLibraryData();
                              }
                            }}>
                              <div className="form-group">
                                <label className="form-label">Judul Buku *</label>
                                <input type="text" className="form-input" placeholder="Contoh: IPS Terpadu kelas x" value={bookTitle} onChange={e => setBookTitle(e.target.value)} required />
                              </div>
                              <div className="form-group" style={{ marginTop: "0.5rem" }}>
                                <label className="form-label">Penulis & Penerbit</label>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                                  <input type="text" className="form-input" placeholder="Penulis" value={bookAuthor} onChange={e => setBookAuthor(e.target.value)} />
                                  <input type="text" className="form-input" placeholder="Penerbit" value={bookPublisher} onChange={e => setBookPublisher(e.target.value)} />
                                </div>
                              </div>
                              <div className="form-group" style={{ marginTop: "0.5rem" }}>
                                <label className="form-label">Kategori & Stok</label>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem" }}>
                                  <select className="form-select" value={bookCategory} onChange={e => setBookCategory(e.target.value)}>
                                    <option value="Pelajaran">Pelajaran</option>
                                    <option value="Agama">Agama / Pesantren</option>
                                    <option value="Referensi">Referensi / Kamus</option>
                                    <option value="Fiksi">Fiksi / Novel</option>
                                  </select>
                                  <input type="number" className="form-input" placeholder="Stok" value={bookStock} onChange={e => setBookStock(e.target.value)} required />
                                  <input type="text" className="form-input" placeholder="Lokasi Rak" value={bookLocation} onChange={e => setBookLocation(e.target.value)} />
                                </div>
                              </div>
                              <button type="submit" className="btn btn-primary" style={{ marginTop: "1rem", width: "100%" }}>+ Simpan Katalog Buku</button>
                            </form>
                          </div>

                          {/* Form Transaksi Pinjam Buku Siswa */}
                          <div style={{ background: "#f8fafc", padding: "1.25rem", borderRadius: "var(--radius-md)", border: "1px solid #e2e8f0" }}>
                            <h4 style={{ margin: "0 0 1rem 0", fontWeight: 800, color: "#15803d", fontSize: "0.95rem" }}>📖 Form Transaksi Pinjam Buku Siswa</h4>
                            <form onSubmit={async (e) => {
                              e.preventDefault();
                              if (!borrowBookId || !borrowStudentNisn) { alert("Pilih buku dan siswa terlebih dahulu."); return; }
                              const res = await borrowBook({ bookId: borrowBookId, studentNisn: borrowStudentNisn, dueDate: borrowDueDate });
                              if (res.success) {
                                alert("✓ Peminjaman buku berhasil dicatat!");
                                await loadLibraryData();
                              } else alert("Gagal: " + res.error);
                            }}>
                              <div className="form-group">
                                <label className="form-label">Pilih Buku *</label>
                                <select className="form-select" value={borrowBookId} onChange={e => setBorrowBookId(e.target.value)} required>
                                  <option value="">-- Pilih Buku Tersedia --</option>
                                  {libBooks.filter(b => b.availableStock > 0).map(b => (
                                    <option key={b.id} value={b.id}>{b.title} (Stok: {b.availableStock}) - {b.bookCode}</option>
                                  ))}
                                </select>
                              </div>
                              <div className="form-group" style={{ marginTop: "0.5rem" }}>
                                <label className="form-label">Pilih Siswa Peminjam *</label>
                                <select className="form-select" value={borrowStudentNisn} onChange={e => setBorrowStudentNisn(e.target.value)} required>
                                  <option value="">-- Pilih Siswa --</option>
                                  {students.map(s => (
                                    <option key={s.nisn} value={s.nisn}>{s.name} ({s.kelas}) - NISN: {s.nisn}</option>
                                  ))}
                                </select>
                              </div>
                              <div className="form-group" style={{ marginTop: "0.5rem" }}>
                                <label className="form-label">Tgl Harus Kembali</label>
                                <input type="date" className="form-input" value={borrowDueDate} onChange={e => setBorrowDueDate(e.target.value)} required />
                              </div>
                              <button type="submit" className="btn btn-primary" style={{ marginTop: "1rem", width: "100%", backgroundColor: "#15803d", borderColor: "#15803d" }}>Catat Peminjaman Buku</button>
                            </form>
                          </div>
                        </div>

                        {/* Tabel Transaksi Pinjam Buku */}
                        <div className="portal-table-container">
                          <h4 style={{ fontWeight: 800, color: "var(--primary)", marginBottom: "0.75rem" }}>Daftar Transaksi Peminjaman Buku ({libLoans.length})</h4>
                          <table className="portal-table">
                            <thead>
                              <tr>
                                <th>Kode Buku</th>
                                <th>Judul Buku</th>
                                <th>Siswa Peminjam</th>
                                <th>Tgl Pinjam</th>
                                <th>Tgl Kembali Target</th>
                                <th style={{ textAlign: "center" }}>Status</th>
                                <th style={{ textAlign: "center" }}>Aksi</th>
                              </tr>
                            </thead>
                            <tbody>
                              {libLoans.length === 0 ? (
                                <tr><td colSpan="7" style={{ textAlign: "center", color: "#94a3b8", padding: "1.5rem" }}>Belum ada sirkulasi peminjaman buku.</td></tr>
                              ) : (
                                libLoans.map(l => (
                                  <tr key={l.id}>
                                    <td><span style={{ background: "#f1f5f9", padding: "2px 6px", borderRadius: "4px", fontSize: "0.72rem", fontWeight: "bold" }}>{l.book?.bookCode}</span></td>
                                    <td><strong>{l.book?.title}</strong></td>
                                    <td><strong>{l.student?.name}</strong><br/><span style={{ fontSize: "0.75rem", color: "#64748b" }}>NISN: {l.studentNisn} ({l.student?.kelas})</span></td>
                                    <td>{l.borrowDate}</td>
                                    <td>{l.dueDate}</td>
                                    <td style={{ textAlign: "center" }}>
                                      <span style={{ background: l.status === "DIKEMBALIKAN" ? "#dcfce7" : "#fef3c7", color: l.status === "DIKEMBALIKAN" ? "#15803d" : "#b45309", padding: "3px 8px", borderRadius: "12px", fontSize: "0.72rem", fontWeight: "bold" }}>{l.status}</span>
                                    </td>
                                    <td style={{ textAlign: "center" }}>
                                      {l.status === "DIPINJAM" && (
                                        <button className="btn btn-outline" style={{ fontSize: "0.72rem", padding: "3px 7px", borderColor: "#16a34a", color: "#16a34a" }} onClick={async () => {
                                          await returnBook(l.id);
                                          await loadLibraryData();
                                        }}>✓ Kembalikan</button>
                                      )}
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                  </div>
                )}


                {/* TAB 12: SARPRAS & INVENTARIS ASET */}
                {activeTab === "sarpras" && session.isSarpras && (
                  <div className="no-print">
                    <span style={{ fontSize: "0.85rem", textTransform: "uppercase", fontWeight: 700, color: "var(--secondary)" }}>Inventaris</span>
                    <h2 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--primary-dark)", marginBottom: "1.5rem" }}>
                      Modul Sarpras & Inventaris Aset
                    </h2>
                      <div>
                        <div style={{ background: "#f8fafc", padding: "1.25rem", borderRadius: "var(--radius-md)", border: "1px solid #e2e8f0", marginBottom: "1.5rem" }}>
                          <h4 style={{ margin: "0 0 1rem 0", fontWeight: 800, color: "var(--primary-dark)", fontSize: "0.95rem" }}>📦 Form Pendataan Inventaris & Aset Sekolah</h4>
                          <form onSubmit={async (e) => {
                            e.preventDefault();
                            const res = await saveInventoryItem({ name: invName, category: invCategory, location: invLocation, quantity: invQty, condition: invCondition, purchaseYear: invYear, keterangan: invKet });
                            if (res.success) {
                              setInvName("");
                              setInvKet("");
                              await loadInventoryData();
                            }
                          }}>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem" }}>
                              <div>
                                <label className="form-label">Nama Barang / Aset *</label>
                                <input type="text" className="form-input" placeholder="Contoh: Laptop HP Core i5, Proyektor" value={invName} onChange={e => setInvName(e.target.value)} required />
                              </div>
                              <div>
                                <label className="form-label">Kategori Aset</label>
                                <select className="form-select" value={invCategory} onChange={e => setInvCategory(e.target.value)}>
                                  <option value="Elektronik">Elektronik & IT</option>
                                  <option value="Mebel">Mebel (Meja/Kursi/Lemari)</option>
                                  <option value="Lab">Alat Laboratorium</option>
                                  <option value="Olahraga">Alat Olahraga & Kebersihan</option>
                                </select>
                              </div>
                              <div>
                                <label className="form-label">Lokasi Penempatan</label>
                                <input type="text" className="form-input" placeholder="Contoh: Ruang Lab Komputer, kelas x" value={invLocation} onChange={e => setInvLocation(e.target.value)} required />
                              </div>
                              <div>
                                <label className="form-label">Jumlah & Kondisi</label>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                                  <input type="number" className="form-input" placeholder="Qty" value={invQty} onChange={e => setInvQty(e.target.value)} required />
                                  <select className="form-select" value={invCondition} onChange={e => setInvCondition(e.target.value)}>
                                    <option value="BAIK">Baik</option>
                                    <option value="RUSAK_RINGAN">Rusak Ringan</option>
                                    <option value="RUSAK_BERAT">Rusak Berat</option>
                                  </select>
                                </div>
                              </div>
                            </div>
                            <button type="submit" className="btn btn-primary" style={{ marginTop: "1rem", padding: "0.6rem 1.5rem" }}>+ Simpan Barang Inventaris</button>
                          </form>
                        </div>

                        {/* Tabel Inventaris Aset Sekolah */}
                        <div className="portal-table-container">
                          <h4 style={{ fontWeight: 800, color: "var(--primary)", marginBottom: "0.75rem" }}>Daftar Inventaris Aset Sekolah ({invItems.length})</h4>
                          <table className="portal-table">
                            <thead>
                              <tr>
                                <th>Kode Aset</th>
                                <th>Nama Barang</th>
                                <th>Kategori</th>
                                <th>Lokasi Penempatan</th>
                                <th style={{ textAlign: "center" }}>Jumlah</th>
                                <th style={{ textAlign: "center" }}>Kondisi</th>
                                <th style={{ textAlign: "center" }}>Aksi</th>
                              </tr>
                            </thead>
                            <tbody>
                              {invItems.length === 0 ? (
                                <tr><td colSpan="7" style={{ textAlign: "center", color: "#94a3b8", padding: "1.5rem" }}>Belum ada inventaris aset terdaftar.</td></tr>
                              ) : (
                                invItems.map(item => (
                                  <tr key={item.id}>
                                    <td><span style={{ background: "#f1f5f9", padding: "2px 6px", borderRadius: "4px", fontSize: "0.72rem", fontWeight: "bold" }}>{item.itemCode}</span></td>
                                    <td><strong>{item.name}</strong></td>
                                    <td>{item.category}</td>
                                    <td>{item.location}</td>
                                    <td style={{ textAlign: "center", fontWeight: "bold" }}>{item.quantity} Unit</td>
                                    <td style={{ textAlign: "center" }}>
                                      <span style={{ background: item.condition === "BAIK" ? "#dcfce7" : "#fee2e2", color: item.condition === "BAIK" ? "#15803d" : "#ef4444", padding: "3px 8px", borderRadius: "12px", fontSize: "0.72rem", fontWeight: "bold" }}>{item.condition}</span>
                                    </td>
                                    <td style={{ textAlign: "center" }}>
                                      <button className="btn btn-outline" style={{ fontSize: "0.72rem", padding: "3px 7px", borderColor: "#ef4444", color: "#ef4444", display: "inline-flex", alignItems: "center" }} title="Hapus" onClick={async () => {
                                        if (confirm(`Hapus barang inventaris ${item.name}?`)) {
                                          await deleteInventoryItem(item.id);
                                          await loadInventoryData();
                                        }
                                      }}>
                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                                      </button>
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                  </div>
                )}
                {/* TAB 13: WAKA KURIKULUM */}
                {activeTab === "wakaKurikulum" && session.isWakaKurikulum && (
                  <div className="no-print">
                    <span style={{ fontSize: "0.85rem", textTransform: "uppercase", fontWeight: 700, color: "var(--secondary)" }}>Waka Kurikulum</span>
                    <h2 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--primary-dark)", marginBottom: "1.5rem" }}>
                      Manajemen Dokumen KTSP/KOSP
                    </h2>

                    {wakaKurikulumMessage && (
                      <div style={{ padding: "1rem", background: wakaKurikulumMessage.startsWith("Error") ? "#fee2e2" : "#d1fae5", color: wakaKurikulumMessage.startsWith("Error") ? "#b91c1c" : "#047857", borderRadius: "var(--radius-md)", marginBottom: "1rem", fontWeight: "bold" }}>
                        {wakaKurikulumMessage}
                      </div>
                    )}

                    <div style={{ background: "#f8fafc", padding: "1.25rem", borderRadius: "var(--radius-md)", border: "1px solid #e2e8f0", marginBottom: "1.5rem" }}>
                      <h4 style={{ margin: "0 0 1rem 0", fontWeight: 800, color: "var(--primary-dark)", fontSize: "0.95rem" }}>📄 Upload Dokumen KTSP Baru</h4>
                      <form onSubmit={handleUploadKtsp}>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "1rem" }}>
                          <div>
                            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-light)", marginBottom: "0.3rem" }}>Judul Dokumen</label>
                            <input name="title" type="text" className="form-input" required placeholder="Contoh: KTSP 2024 Lengkap" />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-light)", marginBottom: "0.3rem" }}>Tahun Ajaran</label>
                            <input name="tahunAjaran" type="text" className="form-input" required placeholder="Contoh: 2024/2025" />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-light)", marginBottom: "0.3rem" }}>Link Google Drive</label>
                            <input name="fileUrl" type="url" className="form-input" required placeholder="https://drive.google.com/..." />
                          </div>
                        </div>
                        <div style={{ marginBottom: "1rem" }}>
                          <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-light)", marginBottom: "0.3rem" }}>Keterangan Singkat</label>
                          <input name="keterangan" type="text" className="form-input" placeholder="Opsional" />
                        </div>
                        <button type="submit" disabled={ktspLoading} className="btn-primary" style={{ width: "100%" }}>
                          {ktspLoading ? "Mengunggah..." : "Simpan Dokumen"}
                        </button>
                      </form>
                    </div>

                    <div style={{ background: "#fff", padding: "1.5rem", borderRadius: "var(--radius-lg)", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}>
                      <h3 style={{ margin: "0 0 1.5rem 0", fontWeight: 800, color: "var(--primary-dark)" }}>Daftar Dokumen KTSP</h3>
                      <div className="table-responsive">
                        <table className="grade-table" style={{ width: "100%", borderCollapse: "collapse" }}>
                          <thead>
                            <tr style={{ background: "#f1f5f9" }}>
                              <th style={{ padding: "0.75rem", textAlign: "left", fontSize: "0.85rem", color: "var(--text-light)", borderBottom: "2px solid #cbd5e1" }}>No</th>
                              <th style={{ padding: "0.75rem", textAlign: "left", fontSize: "0.85rem", color: "var(--text-light)", borderBottom: "2px solid #cbd5e1" }}>Tahun Ajaran</th>
                              <th style={{ padding: "0.75rem", textAlign: "left", fontSize: "0.85rem", color: "var(--text-light)", borderBottom: "2px solid #cbd5e1" }}>Judul Dokumen</th>
                              <th style={{ padding: "0.75rem", textAlign: "left", fontSize: "0.85rem", color: "var(--text-light)", borderBottom: "2px solid #cbd5e1" }}>Keterangan</th>
                              <th style={{ padding: "0.75rem", textAlign: "center", fontSize: "0.85rem", color: "var(--text-light)", borderBottom: "2px solid #cbd5e1" }}>Aksi</th>
                            </tr>
                          </thead>
                          <tbody>
                            {ktspLoading && ktspDocs.length === 0 ? (
                              <tr>
                                <td colSpan="5" style={{ textAlign: "center", padding: "2rem", color: "var(--text-light)" }}>Memuat dokumen...</td>
                              </tr>
                            ) : ktspDocs.length === 0 ? (
                              <tr>
                                <td colSpan="5" style={{ textAlign: "center", padding: "2rem", color: "var(--text-light)" }}>Belum ada dokumen KTSP.</td>
                              </tr>
                            ) : (
                              ktspDocs.map((doc, idx) => (
                                <tr key={doc.id} style={{ borderBottom: "1px solid #e2e8f0", transition: "background-color 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f8fafc"} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}>
                                  <td style={{ padding: "0.75rem", fontSize: "0.9rem", color: "var(--text-main)" }}>{idx + 1}</td>
                                  <td style={{ padding: "0.75rem", fontSize: "0.9rem", color: "var(--text-main)", fontWeight: 600 }}>{doc.tahunAjaran}</td>
                                  <td style={{ padding: "0.75rem", fontSize: "0.9rem", color: "var(--text-main)" }}>{doc.title}</td>
                                  <td style={{ padding: "0.75rem", fontSize: "0.9rem", color: "var(--text-main)" }}>{doc.keterangan || "-"}</td>
                                  <td style={{ padding: "0.75rem", textAlign: "center" }}>
                                    <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center" }}>
                                      <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" style={{ display: "inline-block", padding: "0.3rem 0.6rem", background: "#3b82f6", color: "white", borderRadius: "var(--radius-sm)", fontSize: "0.75rem", textDecoration: "none", fontWeight: 600 }}>Buka Link</a>
                                      <button onClick={() => handleDeleteKtsp(doc.id)} style={{ padding: "0.3rem 0.6rem", background: "#ef4444", color: "white", borderRadius: "var(--radius-sm)", border: "none", fontSize: "0.75rem", cursor: "pointer", fontWeight: 600 }}>Hapus</button>
                                    </div>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 14: WAKA KESISWAAN */}
                
                {/* PKL & HUBIN */}
                {activeTab === "pkl" && (
                  <PklTab session={session} />
                )}

                
                {/* UKK */}
                
                {/* SETTINGS */}
                {activeTab === "settings" && (
                  <SettingsTab session={session} />
                )}

                {activeTab === "ukk" && (
                  <UkkTab session={session} />
                )}

                {activeTab === "wakaKesiswaan" && session.isWakaKesiswaan && (
                  <div className="no-print">
                    <span style={{ fontSize: "0.85rem", textTransform: "uppercase", fontWeight: 700, color: "var(--secondary)" }}>Waka Kesiswaan</span>
                    <h2 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--primary-dark)", marginBottom: "1.5rem" }}>
                      Panel Waka Kesiswaan
                    </h2>

                    {wakaKesiswaanMessage && (
                      <div style={{ padding: "1rem", background: wakaKesiswaanMessage.startsWith("Error") ? "#fee2e2" : "#d1fae5", color: wakaKesiswaanMessage.startsWith("Error") ? "#b91c1c" : "#047857", borderRadius: "var(--radius-md)", marginBottom: "1rem", fontWeight: "bold" }}>
                        {wakaKesiswaanMessage}
                      </div>
                    )}

                    <div style={{ background: "#fff", padding: "2rem", borderRadius: "var(--radius-lg)", border: "1px solid #e2e8f0", textAlign: "center" }}>
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#e11d48" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: "0 auto 1rem auto", display: "block" }}>
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                      </svg>
                      <h3 style={{ color: "var(--text-main)", marginBottom: "0.5rem" }}>Fitur Sedang Dalam Pengembangan</h3>
                      <p style={{ color: "var(--text-light)", maxWidth: "400px", margin: "0 auto" }}>Modul manajemen kesiswaan (Poin pelanggaran, prestasi, dll) akan segera tersedia di pembaruan berikutnya.</p>
                    </div>
                  </div>
                )}
              </main>
            </div>
          )}
        </div>
      </div>

      {/* AREA CETAK LAPORAN KEUANGAN BULANAN (Hanya Tampil Saat Print) */}
      {school && treasurerReport && treasurerReport.length > 0 && (
        <div className="finance-report-print-only" style={{ fontFamily: "'Times New Roman', Times, serif", color: "#000", fontSize: "0.9rem", lineHeight: "1.4" }}>
          
          {/* Header Kop Surat */}
          <div style={{ display: "flex", alignItems: "center", borderBottom: "3px double #000", paddingBottom: "0.5rem", marginBottom: "1.5rem" }}>
            {school.logo && (
              school.logo !== "dY?" ? (
                <img src={school.logo} alt="Logo" style={{ height: "60px", width: "60px", objectFit: "contain", marginRight: "1rem" }} />
              ) : (
                <div style={{ fontSize: "2.5rem", marginRight: "1rem" }}>{school.logo}</div>
              )
            )}
            <div style={{ flex: 1, textAlign: "center" }}>
              <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: "bold", textTransform: "uppercase" }}>{school.yayasan}</h3>
              <h2 style={{ margin: "2px 0", fontSize: "1.3rem", fontWeight: "bold", textTransform: "uppercase" }}>{school.nama}</h2>
              <span style={{ fontSize: "0.75rem", fontStyle: "italic" }}>Alamat: {school.alamat}</span>
              <br />
              <span style={{ fontSize: "0.7rem" }}>Hubungi: {school.telepon} | Email: {school.email}</span>
            </div>
          </div>

          {/* Judul Laporan */}
          <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
            <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "bold", textDecoration: "underline", textTransform: "uppercase" }}>
              REKAPITULASI HONORARIUM & TUNJANGAN GURU
            </h3>
            <span style={{ fontSize: "0.85rem", fontWeight: "bold" }}>
              Bulan: {["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"][parseInt(treasurerMonth, 10) - 1]} {treasurerYear}
            </span>
          </div>

          {/* Tabel Laporan */}
          <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #000", fontSize: "0.8rem", marginBottom: "2rem" }}>
            <thead>
              <tr style={{ backgroundColor: "#f2f2f2" }}>
                <th style={{ border: "1px solid #000", padding: "6px 4px", textAlign: "center", width: "4%" }}>No</th>
                <th style={{ border: "1px solid #000", padding: "6px 4px", textAlign: "left" }}>Nama Lengkap / NIP</th>
                <th style={{ border: "1px solid #000", padding: "6px 4px", textAlign: "left", width: "15%" }}>Jabatan</th>
                <th style={{ border: "1px solid #000", padding: "6px 4px", textAlign: "center", width: "8%" }}>Jam</th>
                <th style={{ border: "1px solid #000", padding: "6px 4px", textAlign: "right", width: "11%" }}>Honor Pokok</th>
                <th style={{ border: "1px solid #000", padding: "6px 4px", textAlign: "right", width: "11%" }}>Tunjangan</th>
                <th style={{ border: "1px solid #000", padding: "6px 4px", textAlign: "right", width: "11%" }}>Trans. Tugas</th>
                <th style={{ border: "1px solid #000", padding: "6px 4px", textAlign: "right", width: "11%" }}>Ins. Hadir</th>
                <th style={{ border: "1px solid #000", padding: "6px 4px", textAlign: "right", width: "12%", fontWeight: "bold" }}>Total (Rp)</th>
              </tr>
            </thead>
            <tbody>
              {treasurerReport.map((r, idx) => (
                <tr key={r.id}>
                  <td style={{ border: "1px solid #000", padding: "5px 4px", textAlign: "center" }}>{idx + 1}</td>
                  <td style={{ border: "1px solid #000", padding: "5px 4px" }}>
                    <strong>{r.name}</strong>
                    <div style={{ fontSize: "0.68rem", color: "#444" }}>NIP: {r.nip}</div>
                  </td>
                  <td style={{ border: "1px solid #000", padding: "5px 4px" }}>{r.jabatan}</td>
                  <td style={{ border: "1px solid #000", padding: "5px 4px", textAlign: "center" }}>{r.jamMengajar} jam</td>
                  <td style={{ border: "1px solid #000", padding: "5px 4px", textAlign: "right" }}>Rp {r.honorPokok.toLocaleString("id-ID")}</td>
                  <td style={{ border: "1px solid #000", padding: "5px 4px", textAlign: "right" }}>Rp {r.tunjanganJabatan.toLocaleString("id-ID")}</td>
                  <td style={{ border: "1px solid #000", padding: "5px 4px", textAlign: "right" }}>Rp {r.transportTugasLuar.toLocaleString("id-ID")}</td>
                  <td style={{ border: "1px solid #000", padding: "5px 4px", textAlign: "right" }}>Rp {r.insentifKehadiran.toLocaleString("id-ID")}</td>
                  <td style={{ border: "1px solid #000", padding: "5px 4px", textAlign: "right", fontWeight: "bold" }}>Rp {r.totalHonor.toLocaleString("id-ID")}</td>
                </tr>
              ))}
              {/* Row Total Seluruhnya */}
              <tr style={{ backgroundColor: "#f2f2f2", fontWeight: "bold" }}>
                <td colSpan="4" style={{ border: "1px solid #000", padding: "6px 4px", textAlign: "center" }}>TOTAL KESELURUHAN</td>
                <td style={{ border: "1px solid #000", padding: "6px 4px", textAlign: "right" }}>
                  Rp {treasurerReport.reduce((acc, curr) => acc + (curr.honorPokok || 0), 0).toLocaleString("id-ID")}
                </td>
                <td style={{ border: "1px solid #000", padding: "6px 4px", textAlign: "right" }}>
                  Rp {treasurerReport.reduce((acc, curr) => acc + (curr.tunjanganJabatan || 0), 0).toLocaleString("id-ID")}
                </td>
                <td style={{ border: "1px solid #000", padding: "6px 4px", textAlign: "right" }}>
                  Rp {treasurerReport.reduce((acc, curr) => acc + (curr.transportTugasLuar || 0), 0).toLocaleString("id-ID")}
                </td>
                <td style={{ border: "1px solid #000", padding: "6px 4px", textAlign: "right" }}>
                  Rp {treasurerReport.reduce((acc, curr) => acc + (curr.insentifKehadiran || 0), 0).toLocaleString("id-ID")}
                </td>
                <td style={{ border: "1px solid #000", padding: "6px 4px", textAlign: "right" }}>
                  Rp {treasurerReport.reduce((acc, curr) => acc + (curr.totalHonor || 0), 0).toLocaleString("id-ID")}
                </td>
              </tr>
            </tbody>
                          </table>

          {/* Tanda Tangan */}
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "3rem", pageBreakInside: "avoid", breakInside: "avoid" }}>
            <div style={{ textAlign: "center", width: "220px" }}>
              <div style={{ height: "18px" }}>&nbsp;</div>
              <div>Bendahara Sekolah,</div>
              <SignatureBox 
                title="" 
                name={session?.name || "-"} 
                nip="-" 
                signatureImage={session?.signature || null} 
                tteEnabled={false} 
                tteProvider="" 
                tteId="" 
                width="220px"
              />
            </div>

            <div style={{ textAlign: "center" }}>
              <div>Kota Demo, {school.tanggalCetak}</div>
              <SignatureBox 
                title="Mengetahui, Kepala Sekolah" 
                name={school.kepsek} 
                nip={school.kepsekNip} 
                signatureImage={school.kepsekSignature} 
                tteEnabled={school.tteEnabled} 
                tteProvider={school.tteProvider} 
                tteId={school.tteId} 
              />
            </div>
          </div>

        </div>
      )}

      {/* MODAL PREVIEW WATERMARK */}
      {showWatermarkPreview && (() => {
        const origin = typeof window !== "undefined" ? window.location.origin : "";
        let previewLogo = `${origin}/logo-generic.svg`;
        if (school && school.logo && school.logo.trim() !== "" && school.logo !== "🏫") {
          if (school.logo.startsWith("http") || school.logo.startsWith("data:")) {
            previewLogo = school.logo;
          } else {
            previewLogo = `${origin}${school.logo.startsWith("/") ? "" : "/"}${school.logo}`;
          }
        }
        return (
          <div
            onClick={() => setShowWatermarkPreview(false)}
            style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.75)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}
          >
            <div
              onClick={e => e.stopPropagation()}
              style={{ position: "relative", width: "min(595px, 90vw)", aspectRatio: "1 / 1.414", backgroundColor: "#fff", boxShadow: "0 20px 60px rgba(0,0,0,0.5)", borderRadius: "4px", overflow: "hidden" }}
            >
              <button onClick={() => setShowWatermarkPreview(false)}
                style={{ position: "absolute", top: "0.75rem", right: "0.75rem", zIndex: 10, background: "#1e293b", color: "#fff", border: "none", borderRadius: "50%", width: "28px", height: "28px", cursor: "pointer", fontSize: "1rem", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold" }}
              >✕</button>
              <div style={{ position: "absolute", top: "0.75rem", left: "1rem", zIndex: 10, fontSize: "0.65rem", color: "#64748b", fontFamily: "sans-serif", fontWeight: 600, textTransform: "uppercase", letterSpacing: "1px" }}>
                Preview Watermark — Skala Layar
              </div>
              {/* Layer 1: Watermark Teks */}
              <div style={{
                position: "absolute", top: "-50%", left: "-50%", width: "200%", height: "200%",
                backgroundImage: `url("data:image/svg+xml;base64,${btoa('<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'410\' height=\'120\'><text x=\'5\' y=\'55\' font-family=\'Times New Roman,serif\' font-size=\'18\' font-weight=\'bold\' fill=\'rgba(0,0,0,0.055)\' transform=\'rotate(-30,205,60)\'>SEKOLAH MASTER DEMO KOTA DEMO</text><text x=\'5\' y=\'105\' font-family=\'Times New Roman,serif\' font-size=\'18\' font-weight=\'bold\' fill=\'rgba(0,0,0,0.055)\' transform=\'rotate(-30,205,110)\'>SEKOLAH MASTER DEMO KOTA DEMO</text></svg>')}")`,
                backgroundRepeat: "repeat", backgroundSize: "410px 120px", pointerEvents: "none", zIndex: 1,
              }} />
              {/* Layer 2: Watermark Logo */}
              <div style={{
                position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
                width: "55%", height: "55%", backgroundImage: `url('${previewLogo}')`,
                backgroundRepeat: "no-repeat", backgroundPosition: "center", backgroundSize: "contain",
                opacity: 0.07, pointerEvents: "none", zIndex: 2,
              }} />
              {/* Keterangan */}
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 3 }}>
                <div style={{ fontSize: "0.7rem", color: "#94a3b8", fontFamily: "sans-serif", textAlign: "center", padding: "0.5rem 1rem", background: "rgba(255,255,255,0.7)", borderRadius: "6px", backdropFilter: "blur(4px)" }}>
                  Di sinilah tabel nilai dan informasi rapor akan tercetak.<br/>Watermark berada di bawah konten.
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* MODAL PRATINJAU SOAL SIMULASI SISWA */}
      {previewQuestion && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(15, 23, 42, 0.6)",
          backdropFilter: "blur(4px)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 9999,
          padding: "1rem"
        }}>
          <div style={{
            backgroundColor: "white",
            borderRadius: "var(--radius-lg)",
            width: "100%",
            maxWidth: "750px",
            maxHeight: "90vh",
            display: "flex",
            flexDirection: "column",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
            border: "1px solid var(--border-color)",
            overflow: "hidden"
          }}>
            {/* Header Modal */}
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "1rem 1.5rem",
              borderBottom: "1px solid var(--border-color)",
              backgroundColor: "var(--bg-alt)"
            }}>
              <div>
                <h3 style={{ margin: 0, fontWeight: 800, color: "var(--primary-dark)", fontSize: "1.1rem" }}>
                  Pratinjau Tampilan Portal Siswa
                </h3>
                <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  Ujian {previewQuestion.category || "UTS"} • Semester {previewQuestion.semester || "1"} • {previewQuestion.subject}
                </p>
              </div>
              <button 
                type="button" 
                onClick={() => setPreviewQuestion(null)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "1.5rem",
                  cursor: "pointer",
                  color: "var(--text-muted)",
                  padding: "0.25rem"
                }}
              >
                &times;
              </button>
            </div>

            {/* Content Modal */}
            <div style={{
              padding: "1.5rem",
              overflowY: "auto",
              flex: 1,
              backgroundColor: "#f8fafc"
            }}>
              {/* Badge Simulasi */}
              <div style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.3rem",
                backgroundColor: "#e0f2fe",
                color: "#0369a1",
                padding: "0.35rem 0.75rem",
                borderRadius: "var(--radius-sm)",
                fontSize: "0.75rem",
                fontWeight: "bold",
                marginBottom: "1rem"
              }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9z" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                TAMPILAN INTERAKTIF PORTAL SISWA
              </div>

              {renderPreviewQuestionLayout(previewQuestion)}

              {/* Box Kunci Jawaban (Hanya untuk Guru) */}
              <div style={{
                marginTop: "1.5rem",
                padding: "1rem",
                backgroundColor: "#ecfdf5",
                border: "1px solid #a7f3d0",
                borderRadius: "var(--radius-md)",
                color: "#065f46"
              }}>
                <h4 style={{ margin: 0, fontWeight: "bold", fontSize: "0.85rem", marginBottom: "0.25rem", textTransform: "uppercase" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", marginRight: "0.4rem", verticalAlign: "-2px" }}>
                    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
                  </svg>
                  Detail Kunci Jawaban & Validasi Guru
                </h4>
                <div style={{ fontSize: "0.85rem", lineHeight: "1.5" }}>
                  <div><strong>Tipe Soal:</strong> {previewQuestion.type}</div>
                  {previewQuestion.type === "PG" && (
                    <div><strong>Kunci Opsi Benar:</strong> Opsi {String.fromCharCode(65 + (previewQuestion.correct || 0))} (indeks: {previewQuestion.correct})</div>
                  )}
                  {previewQuestion.type === "PGK" && (
                    <div><strong>Kunci Opsi Benar (Kompleks):</strong> {(previewQuestion.correctChoices || []).map(idx => `Opsi ${String.fromCharCode(65 + idx)}`).join(", ") || "-"}</div>
                  )}
                  {(previewQuestion.type === "ISIAN" || previewQuestion.type === "MENJODOHKAN" || previewQuestion.type === "ESSAY") && (
                    <div><strong>Pedoman Jawaban/Skor:</strong> {previewQuestion.correctAnswer || "Tidak ada detail kunci tertulis."}</div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer Modal */}
            <div style={{
              display: "flex",
              justifyContent: "flex-end",
              padding: "1rem 1.5rem",
              borderTop: "1px solid var(--border-color)",
              backgroundColor: "var(--bg-alt)",
              gap: "0.5rem"
            }}>
              <button 
                type="button" 
                className="btn btn-outline" 
                onClick={() => setPreviewQuestion(null)}
                style={{ cursor: "pointer" }}
              >
                Tutup Pratinjau
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Grade Portofolio */}
      {showGradeModal && selectedPortfolioForGrade && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(0,0,0,0.5)", zIndex: 9999,
          display: "flex", justifyContent: "center", alignItems: "center", padding: "1rem"
        }}>
          <div style={{
            backgroundColor: "white", padding: "2rem", borderRadius: "var(--radius-lg)",
            width: "100%", maxWidth: "500px", maxHeight: "90vh", overflowY: "auto",
            boxShadow: "var(--shadow-xl)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h3 style={{ margin: 0, color: "var(--primary-dark)" }}>Nilai Portofolio: {selectedPortfolioForGrade.judul}</h3>
              <button onClick={() => setShowGradeModal(false)} style={{ background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer", color: "var(--text-muted)" }}>&times;</button>
            </div>
            
            <form onSubmit={handleGradePortfolioSubmit}>
              <div className="form-group">
                <label className="form-label">Kreativitas (0-100)</label>
                <input type="number" min="0" max="100" className="form-input" value={gradeForm.kreativitas} onChange={(e) => setGradeForm({...gradeForm, kreativitas: e.target.value})} required />
              </div>
              <div className="form-group">
                <label className="form-label">Teknik (0-100)</label>
                <input type="number" min="0" max="100" className="form-input" value={gradeForm.teknik} onChange={(e) => setGradeForm({...gradeForm, teknik: e.target.value})} required />
              </div>
              <div className="form-group">
                <label className="form-label">Kesesuaian (0-100)</label>
                <input type="number" min="0" max="100" className="form-input" value={gradeForm.kesesuaian} onChange={(e) => setGradeForm({...gradeForm, kesesuaian: e.target.value})} required />
              </div>
              <div className="form-group">
                <label className="form-label">Catatan Guru (Opsional)</label>
                <textarea className="form-input" value={gradeForm.catatan} onChange={(e) => setGradeForm({...gradeForm, catatan: e.target.value})} rows="3"></textarea>
              </div>
              <div className="form-group">
                <label className="form-label">Semester</label>
                <select className="form-select" value={gradeForm.semester} onChange={(e) => setGradeForm({...gradeForm, semester: e.target.value})}>
                  <option value="1">1 (Ganjil)</option>
                  <option value="2">2 (Genap)</option>
                  <option value="3">3 (Ganjil)</option>
                  <option value="4">4 (Genap)</option>
                  <option value="5">5 (Ganjil)</option>
                  <option value="6">6 (Genap)</option>
                </select>
              </div>
              
              {gradePortfolioMessage && (
                <div style={{ padding: "1rem", backgroundColor: "#d1fae5", color: "#065f46", borderRadius: "var(--radius-md)", marginBottom: "1rem", fontSize: "0.9rem" }}>
                  {gradePortfolioMessage}
                </div>
              )}
              
              <div style={{ display: "flex", gap: "1rem", marginTop: "2rem" }}>
                <button type="button" onClick={() => setShowGradeModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>Batal</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Simpan Nilai</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL JURNAL MENGAJAR */}
      {isJurnalModalOpen && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(15, 23, 42, 0.6)",
          backdropFilter: "blur(4px)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 999,
          padding: "1rem"
        }}>
          <div style={{
            backgroundColor: "white",
            borderRadius: "var(--radius-md)",
            width: "100%",
            maxWidth: "750px",
            maxHeight: "90vh",
            display: "flex",
            flexDirection: "column",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
          }}>
            {/* Header */}
            <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 800, color: "var(--primary-dark)" }}>
                {editingJournalId ? "Edit Jurnal Mengajar" : "Buat Jurnal Mengajar Baru"}
              </h3>
              <button 
                type="button" 
                onClick={() => setIsJurnalModalOpen(false)}
                style={{ background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer", color: "var(--text-muted)", padding: 0 }}
              >
                ✕
              </button>
            </div>

            {/* Content (Scrollable) */}
            <form onSubmit={handleSaveJournal} style={{ display: "flex", flexDirection: "column", overflow: "hidden", margin: 0 }}>
              <div style={{ padding: "1.5rem", overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                {jurnalMessage && (
                  <div style={{ padding: "0.75rem 1rem", backgroundColor: "#fee2e2", border: "1px solid #fca5a5", color: "#b91c1c", borderRadius: "4px", fontSize: "0.85rem", fontWeight: 600 }}>
                    {jurnalMessage}
                  </div>
                )}

                <div className="grid grid-3" style={{ gap: "1rem" }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontWeight: 700, fontSize: "0.8rem" }}>Tanggal</label>
                    <input 
                      type="date" 
                      className="form-control" 
                      value={journalDate} 
                      onChange={(e) => setJournalDate(e.target.value)} 
                      required 
                      style={{ fontSize: "0.85rem", padding: "0.4rem 0.6rem" }}
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontWeight: 700, fontSize: "0.8rem" }}>Pilih Kelas</label>
                    <select 
                      className="form-select" 
                      value={journalKelas} 
                      onChange={(e) => handleModalClassChange(e.target.value)} 
                      required
                      style={{ fontSize: "0.85rem", padding: "0.4rem 0.6rem" }}
                    >
                      <option value="">-- Pilih Kelas --</option>
                      {uniqueClasses.map((c, idx) => (
                        <option value={c} key={idx}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontWeight: 700, fontSize: "0.8rem" }}>Jam Ke-</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="e.g. 1-2 atau 3-4" 
                      value={journalJamKe} 
                      onChange={(e) => setJournalJamKe(e.target.value)} 
                      required 
                      style={{ fontSize: "0.85rem", padding: "0.4rem 0.6rem" }}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontWeight: 700, fontSize: "0.8rem" }}>Materi Pembelajaran</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="e.g. Teks Deskriptif tentang Sekolah" 
                    value={journalMateri} 
                    onChange={(e) => setJournalMateri(e.target.value)} 
                    required 
                    style={{ fontSize: "0.85rem", padding: "0.4rem 0.6rem" }}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontWeight: 700, fontSize: "0.8rem" }}>Tujuan Pembelajaran (TP) / Indikator (Opsional)</label>
                  <textarea 
                    className="form-control" 
                    rows="2" 
                    placeholder="Tuliskan tujuan pembelajaran sesi ini..." 
                    value={journalTujuan} 
                    onChange={(e) => setJournalTujuan(e.target.value)} 
                    style={{ fontSize: "0.85rem", padding: "0.4rem 0.6rem" }}
                  />
                </div>

                <div className="grid grid-2" style={{ gap: "1rem" }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontWeight: 700, fontSize: "0.8rem" }}>Catatan Aktivitas Kelas (Opsional)</label>
                    <textarea 
                      className="form-control" 
                      rows="2" 
                      placeholder="Uraian singkat proses mengajar harian..." 
                      value={journalAktivitas} 
                      onChange={(e) => setJournalAktivitas(e.target.value)} 
                      style={{ fontSize: "0.85rem", padding: "0.4rem 0.6rem" }}
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontWeight: 700, fontSize: "0.8rem" }}>Catatan Anekdot Karakter P3 (Opsional)</label>
                    <textarea 
                      className="form-control" 
                      rows="2" 
                      placeholder="Observasi khusus perilaku/profil Pelajar Pancasila..." 
                      value={journalKarakter} 
                      onChange={(e) => setJournalKarakter(e.target.value)} 
                      style={{ fontSize: "0.85rem", padding: "0.4rem 0.6rem" }}
                    />
                  </div>
                </div>

                {/* Tabel Siswa: Presensi & Nilai Harian */}
                {journalKelas && (
                  <div style={{ marginTop: "0.5rem" }}>
                    <label className="form-label" style={{ fontWeight: 700, fontSize: "0.85rem", color: "var(--primary-dark)", marginBottom: "0.5rem", display: "block" }}>
                      Presensi & Nilai Formatif Siswa ({students.filter(s => normalizeClass(s.kelas) === normalizeClass(journalKelas)).length} Siswa)
                    </label>
                    <div style={{ border: "1px solid var(--border-color)", borderRadius: "var(--radius-sm)", overflow: "hidden" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem" }}>
                        <thead>
                          <tr style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid var(--border-color)", textAlign: "left" }}>
                            <th style={{ padding: "0.5rem 0.75rem", fontWeight: 700 }}>Nama Siswa</th>
                            <th style={{ padding: "0.5rem 0.75rem", fontWeight: 700, width: "180px", textAlign: "center" }}>Status Presensi</th>
                            <th style={{ padding: "0.5rem 0.75rem", fontWeight: 700, width: "120px", textAlign: "center" }}>Nilai Formatif (0-100)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {students.filter(s => normalizeClass(s.kelas) === normalizeClass(journalKelas)).map((s, idx) => {
                            const status = journalAttendances[s.id] || "HADIR";
                            const score = journalGrades[s.id] !== undefined ? journalGrades[s.id] : "";
                            return (
                              <tr key={s.id} style={{ borderBottom: idx === students.filter(st => normalizeClass(st.kelas) === normalizeClass(journalKelas)).length - 1 ? "none" : "1px solid var(--border-color)", backgroundColor: idx % 2 === 0 ? "white" : "#fafafa" }}>
                                <td style={{ padding: "0.5rem 0.75rem", fontWeight: 600 }}>{s.name}</td>
                                <td style={{ padding: "0.5rem 0.75rem", textAlign: "center" }}>
                                  <div style={{ display: "inline-flex", gap: "0.4rem" }}>
                                    {["HADIR", "SAKIT", "IZIN", "ALFA"].map((st) => (
                                      <label key={st} style={{ display: "inline-flex", alignItems: "center", gap: "0.15rem", cursor: "pointer", fontWeight: status === st ? 700 : 500, color: status === st ? (st === "HADIR" ? "#10b981" : st === "SAKIT" ? "#3b82f6" : st === "IZIN" ? "#f59e0b" : "#ef4444") : "#64748b" }}>
                                        <input 
                                          type="radio" 
                                          name={`att-${s.id}`} 
                                          value={st} 
                                          checked={status === st} 
                                          onChange={() => setJournalAttendances(prev => ({ ...prev, [s.id]: st }))}
                                          style={{ margin: 0, transform: "scale(0.85)" }}
                                        />
                                        {st.substring(0, 1)}
                                      </label>
                                    ))}
                                  </div>
                                </td>
                                <td style={{ padding: "0.5rem 0.75rem", textAlign: "center" }}>
                                  <input 
                                    type="number" 
                                    min="0" 
                                    max="100" 
                                    className="form-control" 
                                    placeholder="-" 
                                    value={score} 
                                    onChange={(e) => setJournalGrades(prev => ({ ...prev, [s.id]: e.target.value }))}
                                    style={{ width: "65px", padding: "0.25rem", textAlign: "center", fontSize: "0.8rem", margin: "0 auto", height: "auto" }}
                                  />
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div style={{ padding: "1rem 1.5rem", borderTop: "1px solid var(--border-color)", display: "flex", justifyContent: "flex-end", gap: "0.75rem", backgroundColor: "#f8fafc" }}>
                <button 
                  type="button" 
                  className="btn btn-outline" 
                  onClick={() => setIsJurnalModalOpen(false)}
                  style={{ padding: "0.4rem 1rem", fontSize: "0.85rem" }}
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ padding: "0.4rem 1rem", fontSize: "0.85rem" }}
                >
                  Simpan Jurnal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

// Komponen Pembantu: Kotak Tanda Tangan Dinamis (Bisa PNG atau TTE)
function SignatureBox({
  title = "Kepala Sekolah",
  name = "Nama Pegawai",
  nip = "-",
  signatureImage = null,
  tteEnabled = false,
  tteProvider = "BSrE",
  tteId = "",
  width = "250px"
}) {
  const verifyUrl = typeof window !== "undefined" 
    ? `${window.location.origin}/verify?id=${tteId}&provider=${tteProvider}` 
    : `https://smk-alqodiriyah.sch.id/verify?id=${tteId}&provider=${tteProvider}`;

  return (
    <div style={{ textAlign: "center", width: width, display: "inline-block" }}>
      <div style={{ marginBottom: "0.5rem" }}>{title}</div>
      
      <div style={{ minHeight: "100px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", margin: "0.5rem 0" }}>
        {tteEnabled ? (
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", border: "2px solid #10b981", padding: "0.5rem", borderRadius: "8px", background: "#f0fdf4" }}>
            <QRCodeSVG value={verifyUrl} size={64} level="M" />
            <div style={{ fontSize: "0.6rem", textAlign: "left", lineHeight: "1.2", color: "#065f46" }}>
              <strong>Ditandatangani Elektronik</strong><br/>
              Sertifikat diterbitkan oleh<br/>
              <strong>{tteProvider}</strong><br/>
              <span style={{ fontSize: "0.55rem", wordBreak: "break-all" }}>ID: {tteId || "Tidak ada ID"}</span>
            </div>
          </div>
        ) : signatureImage ? (
          <img src={signatureImage} alt="Tanda Tangan" style={{ maxHeight: "80px", maxWidth: "100%", objectFit: "contain" }} />
        ) : (
          <div style={{ height: "80px" }}></div> // Ruang kosong untuk TTD Basah
        )}
      </div>

      <div style={{ fontWeight: "bold", textDecoration: "underline" }}>{name}</div>
      <div>NIP. {nip !== "-" && nip ? nip : "Belum Ada NIP"}</div>
    </div>
  );
}

// Komponen Sampul Rapor Lembar Cetak
function SampulSheet({ student, school }) {
  if (!student || !school) return null;

  const logoSrc = (school.logo && school.logo !== "🏫" && school.logo !== "") ? school.logo : "/logo-generic.svg";

  return (
    <div className="rapor-print-container" style={{ backgroundColor: "#fff", color: "#000", fontFamily: "'Times New Roman', Times, serif", fontSize: "1rem", marginTop: "1.5rem" }}>
      
      {/* HALAMAN 1: SAMPUL DEPAN (DATA SEKOLAH) */}
      <div className="sampul-page-1" style={{ minHeight: "297mm", padding: "3rem", display: "flex", flexDirection: "column", justifyContent: "space-between", alignItems: "center", border: "2px solid #000", boxSizing: "border-box", position: "relative", pageBreakAfter: "always", breakAfter: "page" }}>
        
        <div style={{ textAlign: "center", marginTop: "2rem" }}>
          <h1 style={{ fontSize: "2.2rem", fontWeight: "bold", letterSpacing: "1px", margin: "0 0 0.5rem 0" }}>RAPOR</h1>
          <h2 style={{ fontSize: "1.8rem", fontWeight: "bold", letterSpacing: "1px", margin: 0 }}>PESERTA DIDIK</h2>
          <h3 style={{ fontSize: "1.5rem", fontWeight: "bold", marginTop: "0.5rem", color: "#333" }}>SEKOLAH MENENGAH KEJURUAN (SMK)</h3>
        </div>

        <div style={{ margin: "3rem 0" }}>
          <img src={logoSrc} alt="Logo Sekolah" style={{ width: "160px", height: "160px", objectFit: "contain" }} />
        </div>

        <div style={{ width: "100%", maxWidth: "500px", margin: "2rem 0" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "1.1rem" }}>
            <tbody>
              <tr>
                <td style={{ width: "40%", padding: "0.75rem 0", fontWeight: 600 }}>Nama Sekolah</td>
                <td style={{ width: "5%", padding: "0.75rem 0" }}>:</td>
                <td style={{ padding: "0.75rem 0", fontWeight: "bold", textTransform: "uppercase" }}>{school.nama}</td>
              </tr>
              <tr>
                <td style={{ padding: "0.75rem 0", fontWeight: 600 }}>NPSN</td>
                <td style={{ padding: "0.75rem 0" }}>:</td>
                <td style={{ padding: "0.75rem 0" }}>{school.npsn}</td>
              </tr>
              <tr>
                <td style={{ padding: "0.75rem 0", fontWeight: 600, verticalAlign: "top" }}>Alamat Sekolah</td>
                <td style={{ padding: "0.75rem 0", verticalAlign: "top" }}>:</td>
                <td style={{ padding: "0.75rem 0", lineHeight: "1.4" }}>{school.alamat}</td>
              </tr>
              <tr>
                <td style={{ padding: "0.75rem 0", fontWeight: 600 }}>Kabupaten</td>
                <td style={{ padding: "0.75rem 0" }}>:</td>
                <td style={{ padding: "0.75rem 0" }}>Magelang</td>
              </tr>
              <tr>
                <td style={{ padding: "0.75rem 0", fontWeight: 600 }}>Provinsi</td>
                <td style={{ padding: "0.75rem 0" }}>:</td>
                <td style={{ padding: "0.75rem 0" }}>Jawa Tengah</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <span style={{ fontSize: "1.1rem", fontWeight: "bold", textTransform: "uppercase" }}>
            KEMENTERIAN PENDIDIKAN, KEBUDAYAAN, RISET, DAN TEKNOLOGI
          </span>
          <br />
          <span style={{ fontSize: "1.1rem", fontWeight: "bold" }}>REPUBLIK INDONESIA</span>
        </div>
      </div>

      {/* HALAMAN 2: BIODATA SISWA */}
      <div className="sampul-page-2" style={{ minHeight: "297mm", padding: "3rem", display: "flex", flexDirection: "column", justifyContent: "space-between", border: "2px solid #000", boxSizing: "border-box", position: "relative", pageBreakBefore: "always", breakBefore: "page" }}>
        
        <div>
          <div style={{ textAlign: "center", marginBottom: "2rem" }}>
            <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", margin: 0, textDecoration: "underline" }}>
              BIODATA PESERTA DIDIK
            </h2>
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.95rem" }}>
            <tbody>
              <tr>
                <td style={{ width: "5%", padding: "0.5rem 0", verticalAlign: "top" }}>1.</td>
                <td style={{ width: "35%", padding: "0.5rem 0", verticalAlign: "top" }}>Nama Lengkap Peserta Didik</td>
                <td style={{ width: "3%", padding: "0.5rem 0", verticalAlign: "top" }}>:</td>
                <td style={{ padding: "0.5rem 0", fontWeight: "bold", textTransform: "uppercase", verticalAlign: "top" }}>{student.name}</td>
              </tr>
              <tr>
                <td style={{ padding: "0.5rem 0", verticalAlign: "top" }}>2.</td>
                <td style={{ padding: "0.5rem 0", verticalAlign: "top" }}>Nomor Induk Siswa Nasional (NISN)</td>
                <td style={{ padding: "0.5rem 0", verticalAlign: "top" }}>:</td>
                <td style={{ padding: "0.5rem 0", verticalAlign: "top" }}>{student.nisn}</td>
              </tr>
              <tr>
                <td style={{ padding: "0.5rem 0", verticalAlign: "top" }}>3.</td>
                <td style={{ padding: "0.5rem 0", verticalAlign: "top" }}>Nomor Induk Siswa (NIS)</td>
                <td style={{ padding: "0.5rem 0", verticalAlign: "top" }}>:</td>
                <td style={{ padding: "0.5rem 0", verticalAlign: "top" }}>{student.nis}</td>
              </tr>
              <tr>
                <td style={{ padding: "0.5rem 0", verticalAlign: "top" }}>4.</td>
                <td style={{ padding: "0.5rem 0", verticalAlign: "top" }}>Tempat dan Tanggal Lahir</td>
                <td style={{ padding: "0.5rem 0", verticalAlign: "top" }}>:</td>
                <td style={{ padding: "0.5rem 0", verticalAlign: "top" }}>{student.tempatLahir}, {student.tanggalLahir}</td>
              </tr>
              <tr>
                <td style={{ padding: "0.5rem 0", verticalAlign: "top" }}>5.</td>
                <td style={{ padding: "0.5rem 0", verticalAlign: "top" }}>Jenis Kelamin</td>
                <td style={{ padding: "0.5rem 0", verticalAlign: "top" }}>:</td>
                <td style={{ padding: "0.5rem 0", verticalAlign: "top" }}>{student.jenisKelamin || "-"}</td>
              </tr>
              <tr>
                <td style={{ padding: "0.5rem 0", verticalAlign: "top" }}>6.</td>
                <td style={{ padding: "0.5rem 0", verticalAlign: "top" }}>Agama</td>
                <td style={{ padding: "0.5rem 0", verticalAlign: "top" }}>:</td>
                <td style={{ padding: "0.5rem 0", verticalAlign: "top" }}>Islam</td>
              </tr>
              <tr>
                <td style={{ padding: "0.5rem 0", verticalAlign: "top" }}>7.</td>
                <td style={{ padding: "0.5rem 0", verticalAlign: "top" }}>Status dalam Keluarga</td>
                <td style={{ padding: "0.5rem 0", verticalAlign: "top" }}>:</td>
                <td style={{ padding: "0.5rem 0", verticalAlign: "top" }}>Anak Kandung</td>
              </tr>
              <tr>
                <td style={{ padding: "0.5rem 0", verticalAlign: "top" }}>8.</td>
                <td style={{ padding: "0.5rem 0", verticalAlign: "top" }}>Anak Ke</td>
                <td style={{ padding: "0.5rem 0", verticalAlign: "top" }}>:</td>
                <td style={{ padding: "0.5rem 0", verticalAlign: "top" }}>-</td>
              </tr>
              <tr>
                <td style={{ padding: "0.5rem 0", verticalAlign: "top" }}>9.</td>
                <td style={{ padding: "0.5rem 0", verticalAlign: "top" }}>Alamat Lengkap Peserta Didik</td>
                <td style={{ padding: "0.5rem 0", verticalAlign: "top" }}>:</td>
                <td style={{ padding: "0.5rem 0", verticalAlign: "top", lineHeight: "1.4" }}>{student.alamat}</td>
              </tr>
              <tr>
                <td style={{ padding: "0.5rem 0", verticalAlign: "top" }}>10.</td>
                <td style={{ padding: "0.5rem 0", verticalAlign: "top" }}>Orang Tua / Wali</td>
                <td style={{ padding: "0.5rem 0", verticalAlign: "top" }}>:</td>
                <td style={{ padding: "0.5rem 0", verticalAlign: "top", fontWeight: "bold" }}>{student.namaOrangTua || "-"}</td>
              </tr>
              <tr>
                <td style={{ padding: "0.5rem 0", verticalAlign: "top" }}></td>
                <td style={{ padding: "0.5rem 0", verticalAlign: "top" }}>a. Nama Ayah Kandung</td>
                <td style={{ padding: "0.5rem 0", verticalAlign: "top" }}>:</td>
                <td style={{ padding: "0.5rem 0", verticalAlign: "top" }}>{student.namaAyah || "-"}</td>
              </tr>
              <tr>
                <td style={{ padding: "0.5rem 0", verticalAlign: "top" }}></td>
                <td style={{ padding: "0.5rem 0", verticalAlign: "top" }}>b. Pekerjaan Ayah</td>
                <td style={{ padding: "0.5rem 0", verticalAlign: "top" }}>:</td>
                <td style={{ padding: "0.5rem 0", verticalAlign: "top" }}>{student.pekerjaanAyah || "-"}</td>
              </tr>
              <tr>
                <td style={{ padding: "0.5rem 0", verticalAlign: "top" }}></td>
                <td style={{ padding: "0.5rem 0", verticalAlign: "top" }}>c. Nama Ibu Kandung</td>
                <td style={{ padding: "0.5rem 0", verticalAlign: "top" }}>:</td>
                <td style={{ padding: "0.5rem 0", verticalAlign: "top" }}>{student.namaIbu || "-"}</td>
              </tr>
              <tr>
                <td style={{ padding: "0.5rem 0", verticalAlign: "top" }}></td>
                <td style={{ padding: "0.5rem 0", verticalAlign: "top" }}>d. Pekerjaan Ibu</td>
                <td style={{ padding: "0.5rem 0", verticalAlign: "top" }}>:</td>
                <td style={{ padding: "0.5rem 0", verticalAlign: "top" }}>{student.pekerjaanIbu || "-"}</td>
              </tr>
              <tr>
                <td style={{ padding: "0.5rem 0", verticalAlign: "top" }}>11.</td>
                <td style={{ padding: "0.5rem 0", verticalAlign: "top" }}>Asal Sekolah Dasar (SD/MI)</td>
                <td style={{ padding: "0.5rem 0", verticalAlign: "top" }}>:</td>
                <td style={{ padding: "0.5rem 0", verticalAlign: "top" }}>{student.asalSekolah || "-"}</td>
              </tr>
              <tr>
                <td style={{ padding: "0.5rem 0", verticalAlign: "top" }}>12.</td>
                <td style={{ padding: "0.5rem 0", verticalAlign: "top" }}>Diterima di Sekolah Ini</td>
                <td style={{ padding: "0.5rem 0", verticalAlign: "top" }}></td>
                <td style={{ padding: "0.5rem 0", verticalAlign: "top" }}></td>
              </tr>
              <tr>
                <td style={{ padding: "0.5rem 0", verticalAlign: "top" }}></td>
                <td style={{ padding: "0.5rem 0", verticalAlign: "top" }}>a. Di Kelas</td>
                <td style={{ padding: "0.5rem 0", verticalAlign: "top" }}>:</td>
                <td style={{ padding: "0.5rem 0", verticalAlign: "top" }}>{student.kelas}</td>
              </tr>
              <tr>
                <td style={{ padding: "0.5rem 0", verticalAlign: "top" }}></td>
                <td style={{ padding: "0.5rem 0", verticalAlign: "top" }}>b. Pada Tanggal</td>
                <td style={{ padding: "0.5rem 0", verticalAlign: "top" }}>:</td>
                <td style={{ padding: "0.5rem 0", verticalAlign: "top" }}>{student.tanggalMasuk || "-"}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Bagian Bawah: Foto & Tanda Tangan */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: "2rem", padding: "0 1rem" }}>
          
          {/* Kotak Foto */}
          <div style={{ width: "90px", height: "120px", border: "2px solid #000", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontSize: "0.8rem", fontWeight: "bold", backgroundColor: "#fafafa" }}>
            <span>FOTO SISWA</span>
            <span style={{ fontSize: "0.75rem", marginTop: "4px" }}>3 x 4</span>
          </div>

          {/* Tanda Tangan Kepsek */}
          <div style={{ textAlign: "center", fontSize: "0.95rem", lineHeight: "1.4" }}>
            <span>Magelang, {school.tanggalCetak || "18 Desember 2026"}</span>
            <br />
            <span>Kepala Sekolah,</span>
            <br /><br /><br /><br />
            <strong style={{ textDecoration: "underline", textTransform: "uppercase" }}>{school.kepsek || "KH. Ahmad Qodir, M.Pd.I."}</strong>
            <br />
            <span>NIP. {school.kepsekNip || "-"}</span>
          </div>

        </div>

      </div>

    </div>
  );
}

// Urutan resmi mata pelajaran sekolah
const SUBJECT_ORDER = [
  "Pendidikan Agama Islam",
  "Agama Islam",
  "Pendidikan Pancasila dan Kewarganegaraan",
  "PPKn",
  "Pendidikan Pancasila",
  "Bahasa Indonesia",
  "Matematika",
  "Bahasa Inggris",
  "Ilmu Pengetahuan Alam",
  "Ilmu Pengetahuan Alam (IPA)",
  "IPA",
  "Ilmu Pengetahuan Sosial",
  "Ilmu Pengetahuan Sosial (IPS)",
  "IPS",
  "Pendidikan Jasmani Olahraga dan Kesehatan",
  "PJOK",
  "Seni Budaya",
  "Prakarya",
  "Seni Budaya dan Ketrampilan",
  "Bahasa Jawa",
  "Aswaja",
  "Aswaja (Ke-NU-an)"
];

const sortSubjects = (subList) => {
  if (!subList) return [];
  return [...subList].sort((a, b) => {
    const nameA = a?.name || "";
    const nameB = b?.name || "";
    const cleanA = nameA.toLowerCase().replace(/[^a-z0-9]/g, "").trim();
    const cleanB = nameB.toLowerCase().replace(/[^a-z0-9]/g, "").trim();

    const idxA = SUBJECT_ORDER.findIndex(name => {
      const cleanName = name.toLowerCase().replace(/[^a-z0-9]/g, "").trim();
      return cleanA.includes(cleanName) || cleanName.includes(cleanA);
    });

    const idxB = SUBJECT_ORDER.findIndex(name => {
      const cleanName = name.toLowerCase().replace(/[^a-z0-9]/g, "").trim();
      return cleanB.includes(cleanName) || cleanName.includes(cleanB);
    });

    const posA = idxA !== -1 ? idxA : 999;
    const posB = idxB !== -1 ? idxB : 999;

    if (posA !== posB) return posA - posB;
    return nameA.localeCompare(nameB);
  });
};

// Komponen Rapor Lembar Cetak
function RaporSheet({ student, school, teachers, loggedInTeacher, subjects, semester }) {
  if (!student || !school) return null;

  const activeSem = semester || getStudentActiveSemester(student.kelas, school.semester);

  // Filter mapel hanya yang sesuai dengan semester aktif
  const filteredSubjects = subjects.filter(s => {
    if (!s.untuk_semester || s.untuk_semester === "Semua") return true;
    return s.untuk_semester.split(",").includes(activeSem.toString());
  });

  const sortedSubjects = sortSubjects(filteredSubjects);
  const raporRecord = student.raporRecords?.find(r => r.semester === activeSem) || { catatanWali: "", sakit: 0, izin: 0, alfa: 0, naikKelas: null };
  const ekskulGrades = student.extracurricularGrades?.filter(g => g.semester === activeSem) || [];

  const calculatedKelas = getKelasForSemester(student.kelas, activeSem);

  // Helper normalisasi kelas
  const normalizeClass = (str) => {
    if (!str) return "";
    return String(str)
      .replace(/kelas/gi, "")
      .replace(/[^a-zA-Z0-9]/g, "")
      .toLowerCase()
      .trim();
  };

  // Cari wali kelas asli untuk tingkat kelas yang dihitung
  const targetWali = teachers?.find(t => t.role === "wali-kelas" && normalizeClass(t.kelas) === normalizeClass(calculatedKelas));
  
  let homeroomName = targetWali ? targetWali.name : "Aris Munandar, S.Or.";
  let homeroomNip = targetWali ? (targetWali.nip !== "-" ? targetWali.nip : "-") : "198804022015091002";

  // Siapkan watermark logo
  const logoSrc = (school.logo && school.logo !== "🏫" && school.logo !== "") ? school.logo : "/logo-generic.svg";

  return (
    <div className="rapor-print-container" style={{ position: "relative", overflow: "hidden", backgroundColor: "#fff", padding: "3rem", color: "#000", border: "1px solid #ccc", fontFamily: "'Times New Roman', Times, serif", fontSize: "0.95rem", marginTop: "1.5rem", lineHeight: "1.5" }}>
      {/* Latar Belakang Teks Watermark Berulang (Padat) */}
      <div style={{ position: "absolute", top: "-50%", left: "-50%", width: "200%", height: "200%", backgroundImage: `url("data:image/svg+xml,%3Csvg width='410' height='30' xmlns='http://www.w3.org/2000/svg'%3E%3Ctext x='0' y='22' font-family='Times New Roman, serif' font-size='24' font-weight='bold' fill='rgba(0,0,0,0.04)'%3ESEKOLAH MASTER DEMO KOTA DEMO%26%23160%3B%26%23160%3B%3C/text%3E%3C/svg%3E")`, backgroundRepeat: "repeat", transform: "rotate(-35deg)", pointerEvents: "none", zIndex: 0 }} />
      {/* Latar Belakang Watermark Logo Transparan */}
      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "350px", height: "350px", backgroundImage: `url('${logoSrc}')`, backgroundRepeat: "no-repeat", backgroundPosition: "center", backgroundSize: "contain", opacity: 0.06, pointerEvents: "none", zIndex: 1 }} />

      <h3 style={{ fontSize: "1.6rem", fontWeight: "900", textDecoration: "underline", textTransform: "uppercase", marginTop: "1rem", marginBottom: "2.5rem", color: "#000", textAlign: "center", letterSpacing: "0.5px" }}>
        LAPORAN HASIL BELAJAR SISWA (RAPOR)
      </h3>

      {/* Tepat 6 Field Metadata Identitas Rapor */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem", marginBottom: "1.5rem", color: "#000" }}>
        <div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <tbody>
              <tr>
                <td style={{ width: "40%", padding: "0.2rem 0" }}>Nama Siswa</td>
                <td style={{ width: "5%" }}>:</td>
                <td style={{ fontWeight: "bold" }}>{student.name}</td>
              </tr>
              <tr>
                <td style={{ padding: "0.2rem 0" }}>NIS / NISN</td>
                <td>:</td>
                <td>{student.nis} / {student.nisn}</td>
              </tr>
              <tr>
                <td style={{ padding: "0.2rem 0" }}>Nama Sekolah</td>
                <td>:</td>
                <td>Sekolah Master Demo</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <tbody>
              <tr>
                <td style={{ width: "40%", padding: "0.2rem 0" }}>Kelas</td>
                <td style={{ width: "5%" }}>:</td>
                <td style={{ fontWeight: "bold" }}>{calculatedKelas}</td>
              </tr>
              <tr>
                <td style={{ padding: "0.2rem 0" }}>Semester</td>
                <td>:</td>
                <td>{activeSem} ({parseInt(activeSem, 10) % 2 !== 0 ? "Ganjil" : "Genap"})</td>
              </tr>
              <tr>
                <td style={{ padding: "0.2rem 0" }}>Tahun Pelajaran</td>
                <td>:</td>
                <td>{getTahunAjaranForSemester(student.kelas, school.tahunAjaran, activeSem)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Tabel Nilai Rapor */}
      <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #000", marginBottom: "2rem", color: "#000" }}>
        <thead>
          <tr style={{ backgroundColor: "#f2f2f2" }}>
            <th style={{ border: "1px solid #000", padding: "0.5rem", width: "5%", textAlign: "center" }}>No</th>
            <th style={{ border: "1px solid #000", padding: "0.5rem", width: "25%", textAlign: "left" }}>Mata Pelajaran</th>
            <th style={{ border: "1px solid #000", padding: "0.5rem", width: "10%", textAlign: "center" }}>Nilai Akhir</th>
            <th style={{ border: "1px solid #000", padding: "0.5rem", width: "60%", textAlign: "left" }}>Capaian Kompetensi</th>
          </tr>
        </thead>
        <tbody>
          {["A", "B", "C"].map((groupLabel) => {
            const groupSubjects = sortedSubjects.filter(s => s.kelompok === groupLabel || (!s.kelompok && groupLabel === "A"));
            if (groupSubjects.length === 0) return null;
            
            const groupName = groupLabel === "A" ? "Muatan Nasional" : groupLabel === "B" ? "Muatan Kewilayahan" : "Muatan Peminatan Kejuruan";
            
            return (
              <React.Fragment key={groupLabel}>
                <tr style={{ backgroundColor: "#fafafa" }}>
                  <td colSpan="4" style={{ border: "1px solid #000", padding: "0.5rem", fontWeight: "bold" }}>
                    Kelompok {groupLabel} ({groupName})
                  </td>
                </tr>
                {groupSubjects.map((sub, idx) => {
                  const grade = student.grades?.find(g => g.subjectName === sub.name && g.semester === activeSem) || { tugas1: 0, tugas2: 0, uts: null, uas: null };
                  
                  let finalMark = "-";
                  let deskripsi = "Nilai harian belum dilengkapi.";

                  if (grade.uts !== null) {
                    const uasVal = grade.uas !== null ? grade.uas : 80; // Mock uas 80 jika kosong
                    finalMark = Math.round((grade.tugas1 + grade.tugas2 + grade.uts + uasVal) / 4);
                    
                    const semesterCp = sub.cps?.[activeSem];
                    if (finalMark >= 90) {
                      deskripsi = semesterCp?.cpA || sub.cpA || "Deskripsi capaian pembelajaran belum diatur untuk semester ini.";
                    } else if (finalMark >= 80) {
                      deskripsi = semesterCp?.cpB || sub.cpB || "Deskripsi capaian pembelajaran belum diatur untuk semester ini.";
                    } else if (finalMark >= 70) {
                      deskripsi = semesterCp?.cpC || sub.cpC || "Deskripsi capaian pembelajaran belum diatur untuk semester ini.";
                    } else {
                      deskripsi = semesterCp?.cpD || sub.cpD || "Deskripsi capaian pembelajaran belum diatur untuk semester ini.";
                    }
                  }

                  return (
                    <tr key={sub.id || idx}>
                      <td style={{ border: "1px solid #000", padding: "0.5rem", textAlign: "center" }}>{idx + 1}</td>
                      <td style={{ border: "1px solid #000", padding: "0.5rem" }}>{sub.name}</td>
                      <td style={{ border: "1px solid #000", padding: "0.5rem", textAlign: "center", fontWeight: "bold" }}>{finalMark}</td>
                      <td style={{ border: "1px solid #000", padding: "0.5rem", fontSize: "0.85rem", lineHeight: "1.4" }}>{deskripsi}</td>
                    </tr>
                  );
                })}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>

      {/* Ekskul dan Absensi Side-by-Side */}
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "1.5rem", marginBottom: "1.5rem", color: "#000", pageBreakInside: "avoid" }}>
        {/* KELOMPOK EKSTRAKURIKULER */}
        <div>
          <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #000" }}>
            <thead>
              <tr style={{ backgroundColor: "#f2f2f2" }}>
                <th style={{ border: "1px solid #000", padding: "0.4rem", width: "8%", textAlign: "center" }}>No</th>
                <th style={{ border: "1px solid #000", padding: "0.4rem", width: "40%", textAlign: "left" }}>Kegiatan Ekstrakurikuler</th>
                <th style={{ border: "1px solid #000", padding: "0.4rem", width: "15%", textAlign: "center" }}>Nilai</th>
                <th style={{ border: "1px solid #000", padding: "0.4rem", width: "37%", textAlign: "left" }}>Keterangan</th>
              </tr>
            </thead>
            <tbody>
              {ekskulGrades.length > 0 ? (
                ekskulGrades.map((eg, idx) => (
                  <tr key={idx}>
                    <td style={{ border: "1px solid #000", padding: "0.4rem", textAlign: "center" }}>{idx + 1}</td>
                    <td style={{ border: "1px solid #000", padding: "0.4rem" }}>{eg.ekskulName}</td>
                    <td style={{ border: "1px solid #000", padding: "0.4rem", textAlign: "center", fontWeight: "bold" }}>{eg.nilai}</td>
                    <td style={{ border: "1px solid #000", padding: "0.4rem", fontSize: "0.8rem" }}>{eg.deskripsi}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td style={{ border: "1px solid #000", padding: "0.4rem", textAlign: "center" }}>1</td>
                  <td style={{ border: "1px solid #000", padding: "0.4rem", color: "#777", fontStyle: "italic" }}>-</td>
                  <td style={{ border: "1px solid #000", padding: "0.4rem", textAlign: "center" }}>-</td>
                  <td style={{ border: "1px solid #000", padding: "0.4rem", fontSize: "0.8rem", color: "#777" }}>-</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* KELOMPOK ABSENSI */}
        <div>
          <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #000" }}>
            <thead>
              <tr style={{ backgroundColor: "#f2f2f2" }}>
                <th colSpan="2" style={{ border: "1px solid #000", padding: "0.4rem", textAlign: "center" }}>Ketidakhadiran (Absensi)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ border: "1px solid #000", padding: "0.4rem", width: "60%" }}>Sakit</td>
                <td style={{ border: "1px solid #000", padding: "0.4rem", textAlign: "center", fontWeight: "bold" }}>{raporRecord.sakit} Hari</td>
              </tr>
              <tr>
                <td style={{ border: "1px solid #000", padding: "0.4rem" }}>Izin</td>
                <td style={{ border: "1px solid #000", padding: "0.4rem", textAlign: "center", fontWeight: "bold" }}>{raporRecord.izin} Hari</td>
              </tr>
              <tr>
                <td style={{ border: "1px solid #000", padding: "0.4rem" }}>Tanpa Keterangan (Alfa)</td>
                <td style={{ border: "1px solid #000", padding: "0.4rem", textAlign: "center", fontWeight: "bold" }}>{raporRecord.alfa} Hari</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Catatan Wali Kelas & Orang Tua */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "1.5rem", color: "#000", pageBreakInside: "avoid" }}>
        <div style={{ border: "1px solid #000", padding: "0.75rem", borderRadius: "2px", minHeight: "90px" }}>
          <h4 style={{ margin: "0 0 0.4rem 0", fontWeight: "bold", fontSize: "0.9rem", borderBottom: "1px dashed #000", paddingBottom: "0.2rem" }}>Catatan Wali Kelas</h4>
          <p style={{ margin: 0, fontStyle: "italic", fontSize: "0.85rem", lineHeight: "1.4" }}>
            {raporRecord.catatanWali || "Tingkatkan terus motivasi belajar dan disiplin diri Anda."}
          </p>
        </div>
        <div style={{ border: "1px solid #000", padding: "0.75rem", borderRadius: "2px", minHeight: "90px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <h4 style={{ margin: "0 0 0.4rem 0", fontWeight: "bold", fontSize: "0.9rem", borderBottom: "1px dashed #000", paddingBottom: "0.2rem" }}>Tanggapan / Catatan Orang Tua/Wali</h4>
          <div style={{ borderBottom: "1px dotted #888", marginTop: "1.5rem" }} />
          <div style={{ borderBottom: "1px dotted #888", marginTop: "0.75rem" }} />
        </div>
      </div>

      {/* Keputusan Kenaikan / Kelulusan (Semester Genap: 2, 4, 6) */}
      {(activeSem === "2" || activeSem === "4" || activeSem === "6") && (
        <div style={{ border: "2px solid #000", padding: "0.75rem", marginBottom: "1.5rem", textAlign: "center", fontWeight: "bold", pageBreakInside: "avoid" }}>
          {activeSem === "6" ? (
            <div>
              KEPUTUSAN KELULUSAN:<br />
              Berdasarkan hasil belajar dan kriteria kelulusan, siswa dinyatakan:<br />
              <span style={{ fontSize: "1.15rem", textDecoration: "underline", textTransform: "uppercase" }}>
                {raporRecord.naikKelas === true ? "LULUS" : raporRecord.naikKelas === false ? "TIDAK LULUS" : "LULUS / TIDAK LULUS"}
              </span>
            </div>
          ) : (
            <div>
              KEPUTUSAN KENAIKAN KELAS:<br />
              Berdasarkan hasil belajar yang dicapai pada semester ganjil dan genap, siswa dinyatakan:<br />
              <span style={{ fontSize: "1.15rem", textDecoration: "underline", textTransform: "uppercase" }}>
                {raporRecord.naikKelas === true 
                  ? `NAIK KELAS KE KELAS ${activeSem === "2" ? "XI" : "XII"}` 
                  : raporRecord.naikKelas === false 
                    ? "TINGGAL KELAS (TIDAK NAIK)" 
                    : "NAIK / TINGGAL KELAS"}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Kolom Tanda Tangan — 3 pihak dalam 1 baris agar tidak terpisah halaman */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem", marginTop: "3rem", color: "#000", pageBreakInside: "avoid", breakInside: "avoid", alignItems: "start" }}>
        
        {/* TTD Orang Tua — kiri */}
        <div style={{ textAlign: "center" }}>
          <div>Mengetahui,</div>
          <div style={{ marginBottom: "4.5rem" }}>Orang Tua / Wali Siswa</div>
          <div style={{ borderBottom: "1px solid #000", width: "150px", margin: "0 auto", fontWeight: "bold" }}>
            ..................................
          </div>
        </div>
        
        {/* TTD Kepala Sekolah — tengah, sedikit lebih rendah */}
        <div style={{ textAlign: "center", paddingTop: "1.5rem" }}>
          <SignatureBox 
            title="Kepala Sekolah Sekolah Master Demo" 
            name={school.kepsek} 
            nip={school.kepsekNip} 
            signatureImage={school.kepsekSignature} 
            tteEnabled={school.tteEnabled} 
            tteProvider={school.tteProvider} 
            tteId={school.tteId} 
          />
        </div>

        {/* TTD Wali Kelas — kanan */}
        <div style={{ textAlign: "center" }}>
          <div>Magelang, {getTanggalCetakForSemester(student.kelas, school.tahunAjaran, activeSem, school.tanggalCetak)}</div>
          <SignatureBox 
            title={`Wali Kelas ${calculatedKelas}`} 
            name={homeroomName} 
            nip={homeroomNip} 
            signatureImage={loggedInTeacher?.signature || null} 
            tteEnabled={false} 
            tteProvider="" 
            tteId="" 
          />
        </div>

      </div>
    </div>
  );
}

// Komponen Surat Keterangan Nilai Rapor (SKNR) Lembar Cetak
function SknrSheet({ student, school, subjects }) {
  if (!student || !school) return null;

  // Filter mapel yang setidaknya memiliki satu semester yang dicentang
  const filteredSubjects = subjects.filter(s => {
    if (!s.untuk_semester || s.untuk_semester === "Semua") return true;
    return s.untuk_semester.trim().length > 0;
  });

  const sortedSubjects = sortSubjects(filteredSubjects);

  // Hitung nilai akhir untuk setiap mapel di setiap semester (1-6)
  const getSubjectFinalMark = (subjectName, semStr) => {
    const grade = student.grades?.find(g => g.subjectName === subjectName && g.semester === semStr);
    if (!grade || grade.uts === null) return null;
    const uasVal = grade.uas !== null ? grade.uas : 80; // default mock uas jika null
    return Math.round((grade.tugas1 + grade.tugas2 + grade.uts + uasVal) / 4);
  };

  const semesters = ["1", "2", "3", "4", "5"];

  const formatDateIndo = (dateStr) => {
    if (!dateStr) return "";
    const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  };

  const logoSrc = (school.logo && school.logo !== "🏫" && school.logo !== "") ? school.logo : "/logo-generic.svg";

  return (
    <div className="rapor-print-container" style={{ position: "relative", overflow: "hidden", backgroundColor: "#fff", padding: "3rem", color: "#000", border: "1px solid #ccc", fontFamily: "'Times New Roman', Times, serif", fontSize: "0.95rem", marginTop: "1.5rem", lineHeight: "1.5" }}>
      {/* Latar Belakang Teks Watermark Berulang (Padat) */}
      <div style={{ position: "absolute", top: "-50%", left: "-50%", width: "200%", height: "200%", backgroundImage: `url("data:image/svg+xml,%3Csvg width='410' height='30' xmlns='http://www.w3.org/2000/svg'%3E%3Ctext x='0' y='22' font-family='Times New Roman, serif' font-size='24' font-weight='bold' fill='rgba(0,0,0,0.04)'%3ESEKOLAH MASTER DEMO KOTA DEMO%26%23160%3B%26%23160%3B%3C/text%3E%3C/svg%3E")`, backgroundRepeat: "repeat", transform: "rotate(-35deg)", pointerEvents: "none", zIndex: 0 }} />
      {/* Watermark logo */}
      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "350px", height: "350px", backgroundImage: `url('${logoSrc}')`, backgroundRepeat: "no-repeat", backgroundPosition: "center", backgroundSize: "contain", opacity: 0.06, pointerEvents: "none", zIndex: 1 }} />

      {/* Kop Surat */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", borderBottom: "4px double #000", paddingBottom: "0.5rem", marginBottom: "1.5rem" }}>
        <img src={logoSrc} alt="Logo Sekolah" style={{ height: "85px", width: "85px", objectFit: "contain", marginRight: "1.5rem" }} />
        <div style={{ textAlign: "center", flex: 1, color: "#000", fontFamily: "'Times New Roman', serif" }}>
          <h3 style={{ fontSize: "1.1rem", fontWeight: "bold", margin: 0, textTransform: "uppercase", letterSpacing: "0.5px" }}>
            {school.yayasan || "YAYASAN MASTER DEMO HASAN IBRAHIM"}
          </h3>
          <h2 style={{ fontSize: "1.25rem", fontWeight: "bold", margin: "2px 0 4px 0", textTransform: "uppercase" }}>
            {school.nama}
          </h2>
          <div style={{ fontSize: "0.85rem", margin: "2px 0" }}>
            Nomor SK Ijin Operasional : {school.skIjin || "188.4/61081/20.2b/2015"}
          </div>
          <div style={{ fontSize: "0.9rem", fontWeight: "bold", margin: "2px 0" }}>
            NSS : {school.nss || "202030816051"}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;NPSN : {school.npsn}
          </div>
          <div style={{ fontSize: "0.75rem", fontStyle: "italic", color: "#008000", fontWeight: "500", marginTop: "2px" }}>
            Alamat : {school.alamat} 📞 {school.telepon || "085228476578, 08587399500"} ✉ {school.email || "smpalqodiriyah@gmail.com"}
          </div>
        </div>
      </div>

      {/* Judul Surat */}
      <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
        <h3 style={{ fontSize: "1.15rem", fontWeight: "bold", textDecoration: "underline", margin: 0, textTransform: "uppercase" }}>
          SURAT KETERANGAN NILAI RAPOR (SKNR)
        </h3>
        <span style={{ fontSize: "0.95rem" }}>
          Nomor: 421.3/086/SMK.Al-Qod/SKNR/VI/2027
        </span>
      </div>

      {/* Pembuka Surat */}
      <p style={{ margin: "0 0 1rem 0", textIndent: "2.5rem" }}>
        Yang bertanda tangan di bawah ini, Kepala Sekolah Menengah Kejuruan (SMK) Master Demo Kota Demo, menerangkan dengan sesungguhnya bahwa:
      </p>

      {/* Identitas Siswa */}
      <table style={{ width: "85%", margin: "0 auto 1.5rem auto", borderCollapse: "collapse", fontSize: "0.95rem" }}>
        <tbody>
          <tr>
            <td style={{ width: "30%", padding: "0.25rem 0" }}>Nama Siswa</td>
            <td style={{ width: "3%" }}>:</td>
            <td style={{ fontWeight: "bold" }}>{student.name}</td>
          </tr>
          <tr>
            <td style={{ padding: "0.25rem 0" }}>Nomor Induk Siswa Nasional (NISN)</td>
            <td>:</td>
            <td>{student.nisn}</td>
          </tr>
          <tr>
            <td style={{ padding: "0.25rem 0" }}>Tempat, Tanggal Lahir</td>
            <td>:</td>
            <td>{student.tempatLahir || "Magelang"}, {formatDateIndo(student.tanggalLahir)}</td>
          </tr>
          <tr>
            <td style={{ padding: "0.25rem 0" }}>Kelas Terakhir</td>
            <td>:</td>
            <td>{student.kelas}</td>
          </tr>
        </tbody>
      </table>

      <p style={{ margin: "0 0 1rem 0" }}>
        Telah menyelesaikan program pembelajaran dari kelas X, XI, dan XII (Semester 1 s.d. 5) dengan perolehan nilai rapor sebagai berikut:
      </p>

      {/* Tabel Nilai Semester 1 - 5 */}
      <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #000", marginBottom: "1.5rem", color: "#000" }}>
        <thead>
          <tr style={{ backgroundColor: "#f2f2f2" }}>
            <th style={{ border: "1px solid #000", padding: "0.5rem", width: "5%", textAlign: "center" }} rowSpan="2">No</th>
            <th style={{ border: "1px solid #000", padding: "0.5rem", width: "40%", textAlign: "left" }} rowSpan="2">Mata Pelajaran</th>
            <th style={{ border: "1px solid #000", padding: "0.4rem", textAlign: "center" }} colSpan="5">Nilai Akhir Rapor per Semester</th>
            <th style={{ border: "1px solid #000", padding: "0.5rem", width: "10%", textAlign: "center" }} rowSpan="2">Rerata</th>
          </tr>
          <tr style={{ backgroundColor: "#f2f2f2" }}>
            {semesters.map(s => (
              <th key={s} style={{ border: "1px solid #000", padding: "0.3rem", textAlign: "center", width: "8%" }}>Smt {s}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {(() => {
            let columnSums = { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0, "rerata": 0 };
            let columnCounts = { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0, "rerata": 0 };

            const rows = sortedSubjects.map((sub, idx) => {
              let subjectSum = 0;
              let subjectCount = 0;
              
              const semMarks = semesters.map(s => {
                const allowedSems = sub.untuk_semester || "Semua";
                const isAllowed = allowedSems === "Semua" || allowedSems.split(",").includes(s.toString());
                
                if (!isAllowed) return "-";

                const mark = getSubjectFinalMark(sub.name, s);
                if (mark !== null) {
                  subjectSum += mark;
                  subjectCount++;
                  columnSums[s] += mark;
                  columnCounts[s]++;
                  return mark;
                }
                return "-";
              });

              const subjectAvg = subjectCount > 0 ? Math.round(subjectSum / subjectCount) : 0;
              if (subjectAvg > 0) {
                columnSums["rerata"] += subjectAvg;
                columnCounts["rerata"]++;
              }

              return {
                no: idx + 1,
                name: sub.name,
                marks: semMarks,
                avg: subjectAvg > 0 ? subjectAvg : "-"
              };
            });

            return (
              <>
                {rows.map((r, idx) => (
                  <tr key={idx}>
                    <td style={{ border: "1px solid #000", padding: "0.4rem", textAlign: "center" }}>{r.no}</td>
                    <td style={{ border: "1px solid #000", padding: "0.4rem" }}>{r.name}</td>
                    {r.marks.map((m, mIdx) => (
                      <td key={mIdx} style={{ border: "1px solid #000", padding: "0.4rem", textAlign: "center" }}>{m}</td>
                    ))}
                    <td style={{ border: "1px solid #000", padding: "0.4rem", textAlign: "center", fontWeight: "bold" }}>{r.avg}</td>
                  </tr>
                ))}

                {/* Baris Jumlah */}
                <tr style={{ fontWeight: "bold", backgroundColor: "#f9f9f9" }}>
                  <td style={{ border: "1px solid #000", padding: "0.4rem", textAlign: "center" }} colSpan="2">Jumlah Nilai</td>
                  {semesters.map(s => (
                    <td key={s} style={{ border: "1px solid #000", padding: "0.4rem", textAlign: "center" }}>
                      {columnSums[s] > 0 ? columnSums[s] : "-"}
                    </td>
                  ))}
                  <td style={{ border: "1px solid #000", padding: "0.4rem", textAlign: "center" }}>
                    {columnSums["rerata"] > 0 ? columnSums["rerata"] : "-"}
                  </td>
                </tr>

                {/* Baris Rerata Total */}
                <tr style={{ fontWeight: "bold", backgroundColor: "#f9f9f9" }}>
                  <td style={{ border: "1px solid #000", padding: "0.4rem", textAlign: "center" }} colSpan="2">Rerata Total</td>
                  {semesters.map(s => {
                    const avgVal = columnCounts[s] > 0 ? Math.round(columnSums[s] / columnCounts[s]) : 0;
                    return (
                      <td key={s} style={{ border: "1px solid #000", padding: "0.4rem", textAlign: "center" }}>
                        {avgVal > 0 ? avgVal : "-"}
                      </td>
                    );
                  })}
                  <td style={{ border: "1px solid #000", padding: "0.4rem", textAlign: "center" }}>
                    {columnCounts["rerata"] > 0 ? Math.round(columnSums["rerata"] / columnCounts["rerata"]) : "-"}
                  </td>
                </tr>
              </>
            );
          })()}
        </tbody>
      </table>

      {/* Penutup Surat */}
      <p style={{ margin: "0 0 2rem 0", textIndent: "2.5rem" }}>
        Demikian Surat Keterangan Nilai Rapor ini dibuat dengan sebenarnya agar dapat dipergunakan sebagaimana mestinya untuk kelanjutan studi atau kepentingan lainnya.
      </p>

      {/* Tanda Tangan */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "3rem", color: "#000", pageBreakInside: "avoid" }}>
        <div style={{ textAlign: "center" }}>
          <div>Magelang, {school.tanggalCetak}</div>
          <SignatureBox 
            title="Kepala Sekolah Sekolah Master Demo" 
            name={school.kepsek} 
            nip={school.kepsekNip} 
            signatureImage={school.kepsekSignature} 
            tteEnabled={school.tteEnabled} 
            tteProvider={school.tteProvider} 
            tteId={school.tteId} 
          />
        </div>
      </div>
    </div>
  );
}

// Komponen Surat Keterangan Lulus & Transkrip Nilai (SKL/Transkrip) Lembar Cetak
function TranskripSheet({ student, school, subjects }) {
  if (!student || !school) return null;

  // Filter mapel yang setidaknya memiliki satu semester yang dicentang
  const filteredSubjects = subjects.filter(s => {
    if (!s.untuk_semester || s.untuk_semester === "Semua") return true;
    return s.untuk_semester.trim().length > 0;
  });

  const sortedSubjects = sortSubjects(filteredSubjects);

  // Hitung nilai akhir untuk setiap mapel di setiap semester (1-6)
  const getSubjectFinalMark = (subjectName, semStr) => {
    const grade = student.grades?.find(g => g.subjectName === subjectName && g.semester === semStr);
    if (!grade || grade.uts === null) return null;
    const uasVal = grade.uas !== null ? grade.uas : 80; // default mock uas jika null
    return Math.round((grade.tugas1 + grade.tugas2 + grade.uts + uasVal) / 4);
  };

  const semesters = ["1", "2", "3", "4", "5", "6"];

  const formatDateIndo = (dateStr) => {
    if (!dateStr) return "";
    const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  };

  // Cek status kelulusan (naikKelas di semester 6)
  const sem6Record = student.raporRecords?.find(r => r.semester === "6");
  const isLulus = sem6Record?.naikKelas === true;
  const isTidakLulus = sem6Record?.naikKelas === false;

  const logoSrc = (school.logo && school.logo !== "dY?" && school.logo !== "") ? school.logo : "/logo-generic.svg";

  return (
    <div style={{ position: "relative", overflow: "hidden", padding: "3rem", backgroundColor: "#fff", color: "#000", fontFamily: "'Times New Roman', Times, serif", fontSize: "11pt", lineHeight: "1.5", minHeight: "100%", width: "100%", margin: "0 auto", boxSizing: "border-box" }}>
      {/* Latar Belakang Teks Watermark Berulang (Padat) */}
      <div style={{ position: "absolute", top: "-50%", left: "-50%", width: "200%", height: "200%", backgroundImage: `url("data:image/svg+xml,%3Csvg width='410' height='30' xmlns='http://www.w3.org/2000/svg'%3E%3Ctext x='0' y='22' font-family='Times New Roman, serif' font-size='24' font-weight='bold' fill='rgba(0,0,0,0.04)'%3ESEKOLAH MASTER DEMO KOTA DEMO%26%23160%3B%26%23160%3B%3C/text%3E%3C/svg%3E")`, backgroundRepeat: "repeat", transform: "rotate(-35deg)", pointerEvents: "none", zIndex: 0 }} />
      {/* Watermark logo */}
      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "350px", height: "350px", backgroundImage: `url('${logoSrc}')`, backgroundRepeat: "no-repeat", backgroundPosition: "center", backgroundSize: "contain", opacity: 0.06, pointerEvents: "none", zIndex: 1 }} />
      
      {/* Kop Surat (Disamakan dengan SKNR) */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", borderBottom: "4px double #000", paddingBottom: "0.5rem", marginBottom: "1.5rem" }}>
        <img src={logoSrc} alt="Logo Sekolah" style={{ height: "85px", width: "85px", objectFit: "contain", marginRight: "1.5rem" }} />
        <div style={{ textAlign: "center", flex: 1, color: "#000", fontFamily: "'Times New Roman', serif" }}>
          <h3 style={{ fontSize: "1.1rem", fontWeight: "bold", margin: 0, textTransform: "uppercase", letterSpacing: "0.5px" }}>
            {school.yayasan || "YAYASAN MASTER DEMO HASAN IBRAHIM"}
          </h3>
          <h2 style={{ fontSize: "1.25rem", fontWeight: "bold", margin: "2px 0 4px 0", textTransform: "uppercase" }}>
            {school.nama}
          </h2>
          <div style={{ fontSize: "0.85rem", margin: "2px 0" }}>
            Nomor SK Ijin Operasional : {school.skIjin || "188.4/61081/20.2b/2015"}
          </div>
          <div style={{ fontSize: "0.9rem", fontWeight: "bold", margin: "2px 0" }}>
            NSS : {school.nss || "202030816051"}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;NPSN : {school.npsn}
          </div>
          <div style={{ fontSize: "0.75rem", fontStyle: "italic", color: "#008000", fontWeight: "500", marginTop: "2px" }}>
            Alamat : {school.alamat} 📞 {school.telepon || "085228476578, 08587399500"} ✉️ {school.email || "smkalqodiriyah@gmail.com"}
          </div>
        </div>
      </div>

      <div style={{ textAlign: "center", marginBottom: "2rem" }}>
        <h3 style={{ margin: "0", fontSize: "14pt", fontWeight: "bold", textDecoration: "underline" }}>SURAT KETERANGAN LULUS & TRANSKRIP NILAI</h3>
        <span style={{ fontSize: "10pt", display: "block", marginTop: "2px" }}>
          Nomor: 421.3/086/SMK.Al-Qod/SKL/VI/2027
        </span>
        <p style={{ margin: "0.2rem 0 0 0" }}>Tahun Pelajaran: {school.tahunAjaran}</p>
      </div>

      <p style={{ margin: "0 0 1rem 0" }}>
        Yang bertanda tangan di bawah ini Kepala {school.name}, menerangkan bahwa:
      </p>

      <table style={{ width: "100%", marginBottom: "1.5rem", borderCollapse: "collapse" }}>
        <tbody>
          <tr>
            <td style={{ width: "30%", padding: "0.25rem 0" }}>Nama Lengkap</td>
            <td style={{ width: "2%" }}>:</td>
            <td style={{ fontWeight: "bold" }}>{student.name}</td>
          </tr>
          <tr>
            <td style={{ padding: "0.25rem 0" }}>NIS / NISN</td>
            <td>:</td>
            <td>{student.nis} / {student.nisn}</td>
          </tr>
          <tr>
            <td style={{ padding: "0.25rem 0" }}>Tempat, Tanggal Lahir</td>
            <td>:</td>
            <td>{student.tempatLahir}, {formatDateIndo(student.tanggalLahir)}</td>
          </tr>
          <tr>
            <td style={{ padding: "0.25rem 0" }}>Peminatan / Jurusan</td>
            <td>:</td>
            <td>{student.jurusan}</td>
          </tr>
        </tbody>
      </table>

      <p style={{ margin: "0 0 1rem 0" }}>
        Berdasarkan hasil rapat pleno Dewan Guru dan kriteria kelulusan, siswa tersebut di atas dinyatakan:
      </p>

      <div style={{ textAlign: "center", margin: "1.5rem 0", padding: "1rem", border: "2px solid #000" }}>
        <h2 style={{ margin: 0, letterSpacing: "5px" }}>
          {isLulus ? "LULUS" : isTidakLulus ? "TIDAK LULUS" : "MENUNGGU KEPUTUSAN"}
        </h2>
      </div>

      <p style={{ margin: "0 0 1rem 0" }}>
        Dengan rincian perolehan nilai akademik dari Semester 1 s.d. Semester 6 sebagai berikut:
      </p>

      {/* Tabel Nilai Semester 1 - 6 */}
      <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #000", marginBottom: "1.5rem", color: "#000", fontSize: "10pt" }}>
        <thead>
          <tr style={{ backgroundColor: "#f2f2f2" }}>
            <th style={{ border: "1px solid #000", padding: "0.4rem", width: "5%", textAlign: "center" }} rowSpan="2">No</th>
            <th style={{ border: "1px solid #000", padding: "0.4rem", width: "40%", textAlign: "left" }} rowSpan="2">Mata Pelajaran</th>
            <th style={{ border: "1px solid #000", padding: "0.3rem", textAlign: "center" }} colSpan="6">Nilai Akhir Rapor Semester</th>
            <th style={{ border: "1px solid #000", padding: "0.4rem", width: "10%", textAlign: "center" }} rowSpan="2">Rerata</th>
          </tr>
          <tr style={{ backgroundColor: "#f2f2f2" }}>
            {semesters.map(s => (
              <th key={s} style={{ border: "1px solid #000", padding: "0.2rem", textAlign: "center", width: "6%" }}>Smt {s}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {(() => {
            let columnSums = { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0, "6": 0, "rerata": 0 };
            let columnCounts = { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0, "6": 0, "rerata": 0 };

            const rows = sortedSubjects.map((sub, idx) => {
              let subjectSum = 0;
              let subjectCount = 0;
              
              const semMarks = semesters.map(s => {
                const mark = getSubjectFinalMark(sub.name, s);
                if (mark !== null) {
                  subjectSum += mark;
                  subjectCount++;
                  columnSums[s] += mark;
                  columnCounts[s]++;
                  return mark;
                }
                return "-";
              });

              const subjectAvg = subjectCount > 0 ? Math.round(subjectSum / subjectCount) : 0;
              if (subjectAvg > 0) {
                columnSums["rerata"] += subjectAvg;
                columnCounts["rerata"]++;
              }

              return {
                no: idx + 1,
                name: sub.name,
                marks: semMarks,
                avg: subjectAvg > 0 ? subjectAvg : "-"
              };
            });

            return (
              <>
                {rows.map((r, idx) => (
                  <tr key={idx}>
                    <td style={{ border: "1px solid #000", padding: "0.3rem", textAlign: "center" }}>{r.no}</td>
                    <td style={{ border: "1px solid #000", padding: "0.3rem" }}>{r.name}</td>
                    {r.marks.map((m, mIdx) => (
                      <td key={mIdx} style={{ border: "1px solid #000", padding: "0.3rem", textAlign: "center" }}>{m}</td>
                    ))}
                    <td style={{ border: "1px solid #000", padding: "0.3rem", textAlign: "center", fontWeight: "bold" }}>{r.avg}</td>
                  </tr>
                ))}

                {/* Baris Jumlah */}
                <tr style={{ fontWeight: "bold", backgroundColor: "#f9f9f9" }}>
                  <td style={{ border: "1px solid #000", padding: "0.3rem", textAlign: "center" }} colSpan="2">Jumlah Nilai</td>
                  {semesters.map(s => (
                    <td key={s} style={{ border: "1px solid #000", padding: "0.3rem", textAlign: "center" }}>
                      {columnSums[s] > 0 ? columnSums[s] : "-"}
                    </td>
                  ))}
                  <td style={{ border: "1px solid #000", padding: "0.3rem", textAlign: "center" }}>
                    {columnSums["rerata"] > 0 ? columnSums["rerata"] : "-"}
                  </td>
                </tr>

                {/* Baris Rerata Total */}
                <tr style={{ fontWeight: "bold", backgroundColor: "#f9f9f9" }}>
                  <td style={{ border: "1px solid #000", padding: "0.3rem", textAlign: "center" }} colSpan="2">Rerata Total</td>
                  {semesters.map(s => {
                    const avgVal = columnCounts[s] > 0 ? Math.round(columnSums[s] / columnCounts[s]) : 0;
                    return (
                      <td key={s} style={{ border: "1px solid #000", padding: "0.3rem", textAlign: "center" }}>
                        {avgVal > 0 ? avgVal : "-"}
                      </td>
                    );
                  })}
                  <td style={{ border: "1px solid #000", padding: "0.3rem", textAlign: "center" }}>
                    {columnCounts["rerata"] > 0 ? Math.round(columnSums["rerata"] / columnCounts["rerata"]) : "-"}
                  </td>
                </tr>
              </>
            );
          })()}
        </tbody>
      </table>

      {/* Penutup Surat */}
      <p style={{ margin: "0 0 2rem 0", textIndent: "2.5rem" }}>
        Demikian Surat Keterangan Lulus dan Transkrip Nilai Akademik ini dibuat dengan sesungguhnya untuk dapat dipergunakan sebagaimana mestinya.
      </p>

      {/* Tanda Tangan */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "2rem", color: "#000", pageBreakInside: "avoid" }}>
        <div style={{ textAlign: "center" }}>
          <div>Magelang, {school.tanggalCetak}</div>
          <SignatureBox 
            title="Kepala Sekolah Sekolah Master Demo" 
            name={school.kepsek} 
            nip={school.kepsekNip} 
            signatureImage={school.kepsekSignature} 
            tteEnabled={school.tteEnabled} 
            tteProvider={school.tteProvider} 
            tteId={school.tteId} 
          />
        </div>
      </div>
    </div>
  );
}

// Komponen Ledger Nilai Kolektif Kelas Lembar Cetak
function LedgerSheet({ students, school, teachers, loggedInTeacher, subjects, semester }) {
  if (!students || students.length === 0 || !school) return null;

  const sortedSubjects = sortSubjects(subjects);

  const activeSem = semester || "1";

  // Helper normalisasi kelas
  const normalizeClass = (str) => {
    if (!str) return "";
    return String(str)
      .replace(/kelas/gi, "")
      .replace(/[^a-zA-Z0-9]/g, "")
      .toLowerCase()
      .trim();
  };

  // Tentukan kelas dari siswa pertama
  const targetClass = students[0]?.kelas || loggedInTeacher.kelas;

  // Cari wali kelas asli
  const targetWali = teachers?.find(t => t.role === "wali-kelas" && normalizeClass(t.kelas) === normalizeClass(targetClass));
  let homeroomName = targetWali ? targetWali.name : "Aris Munandar, S.Or.";
  let homeroomNip = targetWali ? (targetWali.nip !== "-" ? targetWali.nip : "-") : "198804022015091002";

  // Hitung Nilai Akhir untuk masing-masing siswa dan mata pelajaran
  const getStudentSubjectFinalMark = (stud, subjectName) => {
    const grade = stud.grades?.find(g => g.subjectName === subjectName && g.semester === activeSem);
    if (!grade || grade.uts === null) return 0; // fallback jika belum diinput atau uts kosong
    const uasVal = grade.uas !== null ? grade.uas : 80;
    return Math.round((grade.tugas1 + grade.tugas2 + grade.uts + uasVal) / 4);
  };

  // Proses data siswa beserta total, rata-rata, dan peringkat
  const processedStudents = students.map(s => {
    let total = 0;
    let count = 0;
    const marks = {};

    sortedSubjects.forEach(sub => {
      const mark = getStudentSubjectFinalMark(s, sub.name);
      marks[sub.name] = mark;
      if (mark > 0) {
        total += mark;
        count++;
      }
    });

    const average = count > 0 ? parseFloat((total / count).toFixed(1)) : 0;

    return {
      nisn: s.nisn,
      nis: s.nis || "-",
      name: s.name,
      marks,
      total,
      average
    };
  });

  // Urutkan berdasarkan total nilai descending untuk peringkat
  const sortedStudents = [...processedStudents].sort((a, b) => b.total - a.total);

  // Buat map peringkat (mengakomodasi nilai yang sama mendapat peringkat sama)
  const rankMap = {};
  let currentRank = 1;
  for (let i = 0; i < sortedStudents.length; i++) {
    if (i > 0 && sortedStudents[i].total < sortedStudents[i - 1].total) {
      currentRank = i + 1;
    }
    rankMap[sortedStudents[i].nisn] = currentRank;
  }

  const logoSrc = (school.logo && school.logo !== "🏫" && school.logo !== "") ? school.logo : "/logo-generic.svg";

  return (
    <div className="rapor-print-container" style={{ position: "relative", backgroundColor: "#fff", padding: "3rem", color: "#000", border: "1px solid #ccc", fontFamily: "'Times New Roman', Times, serif", fontSize: "0.95rem", marginTop: "1.5rem", lineHeight: "1.5" }}>
      {/* Latar Belakang Watermark Logo Transparan */}
      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "350px", height: "350px", backgroundImage: `url('${logoSrc}')`, backgroundRepeat: "no-repeat", backgroundPosition: "center", backgroundSize: "contain", opacity: 0.06, pointerEvents: "none", zIndex: 1 }} />

      <h3 style={{ fontSize: "1.6rem", fontWeight: "900", textDecoration: "underline", textTransform: "uppercase", marginTop: "1rem", marginBottom: "2.5rem", color: "#000", textAlign: "center", letterSpacing: "0.5px" }}>
        LEDGER NILAI KOLEKTIF & PERINGKAT KELAS
      </h3>

      {/* Metadata Identitas */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem", marginBottom: "1.5rem", color: "#000" }}>
        <div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <tbody>
              <tr>
                <td style={{ width: "40%", padding: "0.2rem 0" }}>Kelas</td>
                <td style={{ width: "5%" }}>:</td>
                <td style={{ fontWeight: "bold" }}>{targetClass}</td>
              </tr>
              <tr>
                <td style={{ padding: "0.2rem 0" }}>Wali Kelas</td>
                <td>:</td>
                <td>{homeroomName}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <tbody>
              <tr>
                <td style={{ width: "40%", padding: "0.2rem 0" }}>Semester</td>
                <td style={{ width: "5%" }}>:</td>
                <td style={{ fontWeight: "bold" }}>{activeSem} ({parseInt(activeSem, 10) % 2 !== 0 ? "Ganjil" : "Genap"})</td>
              </tr>
              <tr>
                <td style={{ padding: "0.2rem 0" }}>Tahun Pelajaran</td>
                <td>:</td>
                <td>{school.tahunAjaran}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Tabel Ledger */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", border: "2px solid #000", marginBottom: "2rem", color: "#000", fontSize: "0.75rem" }}>
          <thead>
            <tr style={{ backgroundColor: "#f2f2f2" }}>
              <th style={{ border: "1px solid #000", padding: "0.4rem", width: "4%", textAlign: "center" }}>No</th>
              <th style={{ border: "1px solid #000", padding: "0.4rem", width: "8%", textAlign: "center" }}>NIS/NISN</th>
              <th style={{ border: "1px solid #000", padding: "0.4rem", width: "22%", textAlign: "left" }}>Nama Siswa</th>
              {sortedSubjects.map((sub, sIdx) => (
                <th key={sIdx} style={{ border: "1px solid #000", padding: "0.4rem", textAlign: "center", fontSize: "0.7rem", verticalAlign: "middle" }}>
                  {sub.name}
                </th>
              ))}
              <th style={{ border: "1px solid #000", padding: "0.4rem", width: "6%", textAlign: "center", fontWeight: "bold" }}>JML</th>
              <th style={{ border: "1px solid #000", padding: "0.4rem", width: "6%", textAlign: "center", fontWeight: "bold" }}>RERATA</th>
              <th style={{ border: "1px solid #000", padding: "0.4rem", width: "6%", textAlign: "center", fontWeight: "bold" }}>PRK</th>
            </tr>
          </thead>
          <tbody>
            {processedStudents.map((ps, psIdx) => (
              <tr key={ps.nisn} style={{ backgroundColor: psIdx % 2 === 0 ? "transparent" : "#fafafa" }}>
                <td style={{ border: "1px solid #000", padding: "0.4rem", textAlign: "center" }}>{psIdx + 1}</td>
                <td style={{ border: "1px solid #000", padding: "0.4rem", textAlign: "center" }}>{ps.nis}/{ps.nisn}</td>
                <td style={{ border: "1px solid #000", padding: "0.4rem", fontWeight: "500" }}>{ps.name}</td>
                {sortedSubjects.map((sub, sIdx) => {
                  const mark = ps.marks[sub.name];
                  return (
                    <td key={sIdx} style={{ border: "1px solid #000", padding: "0.4rem", textAlign: "center", color: mark < sub.kkm ? "#ef4444" : "inherit", fontWeight: mark < sub.kkm ? "bold" : "normal" }}>
                      {mark > 0 ? mark : "-"}
                    </td>
                  );
                })}
                <td style={{ border: "1px solid #000", padding: "0.4rem", textAlign: "center", fontWeight: "bold" }}>{ps.total}</td>
                <td style={{ border: "1px solid #000", padding: "0.4rem", textAlign: "center", fontWeight: "bold" }}>{ps.average}</td>
                <td style={{ border: "1px solid #000", padding: "0.4rem", textAlign: "center", fontWeight: "bold", backgroundColor: rankMap[ps.nisn] <= 3 ? "#ecfdf5" : "transparent" }}>
                  {rankMap[ps.nisn]}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pengesahan Tanda Tangan */}
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "3rem", color: "#000", pageBreakInside: "avoid" }}>
        <div style={{ textAlign: "center", width: "250px" }}>
          <div>Mengetahui,</div>
          <SignatureBox 
            title={`Wali Kelas ${targetClass}`} 
            name={homeroomName} 
            nip={homeroomNip} 
            signatureImage={loggedInTeacher?.signature || null} 
            tteEnabled={false} 
            tteProvider="" 
            tteId="" 
          />
        </div>

        <div style={{ textAlign: "center", width: "250px" }}>
          <div>Magelang, {school.tanggalCetak}</div>
          <SignatureBox 
            title="Kepala Sekolah Sekolah Master Demo" 
            name={school.kepsek} 
            nip={school.kepsekNip} 
            signatureImage={school.kepsekSignature} 
            tteEnabled={school.tteEnabled} 
            tteProvider={school.tteProvider} 
            tteId={school.tteId} 
          />
        </div>
      </div>
    </div>
  );
}





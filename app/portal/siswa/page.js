"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import SiswaPenugasanTab from "./SiswaPenugasanTab";
import PklTab from "./PklTab";
import UkkTab from "./UkkTab";
import DigitalLibraryViewer from "../../components/DigitalLibraryViewer";
import { loginAction, logoutAction } from "../../actions/auth";
import { getStudentDashboardData, getExamQuestions, submitStudentExamResult, uploadStudentAnswerFile, toggleStudentEkskul, uploadPortfolio, uploadStudentProfilePhoto } from "../../actions/siswa";
import { getExamAttachment } from "../../actions/guru";
import { getStudentFinancialSummary } from "../../actions/bendahara";

function shuffleArray(array) {
  let newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

export default function PortalSiswa() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // Form login
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  // Dashboard & Ujian State
  const [dashboardData, setDashboardData] = useState(null);
  const [financialData, setFinancialData] = useState(null);
  const [view, setView] = useState("dashboard"); // "dashboard", "exam", "success"
  const [activeExam, setActiveExam] = useState(null);
  const [examWeights, setExamWeights] = useState({ pg: 100, isian: 0, essay: 0 });
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [activeQuestionIdx, setActiveQuestionIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(1200); // 20 menit
  const [examScore, setExamScore] = useState(null);
  const [examAttachment, setExamAttachment] = useState(null);
  const [studentAnswerFile, setStudentAnswerFile] = useState(null);

  // Portfolio State
  const [showPortfolioModal, setShowPortfolioModal] = useState(false);
  const [portfolioUploading, setPortfolioUploading] = useState(false);
  const [portfolioTitle, setPortfolioTitle] = useState("");
  const [portfolioDesc, setPortfolioDesc] = useState("");
  const [portfolioCategory, setPortfolioCategory] = useState("Desain Grafis");
  const [portfolioFile, setPortfolioFile] = useState(null);

  // Sidebar Tab State
  const [activeTab, setActiveTab] = useState("beranda");

  // Foto Profil State
  const [profilePhotoUrl, setProfilePhotoUrl] = useState("");
  const [photoUploading, setPhotoUploading] = useState(false);
  const photoInputRef = useRef(null);

  const timerRef = useRef(null);
  const [warnings, setWarnings] = useState(0);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const getCacheKey = (exam) => exam ? "exam_cache_" + exam.subject + "_" + exam.category + "_" + exam.semester : "exam_cache_default";

  // Cek sesi login saat masuk halaman
  useEffect(() => {
    fetchDashboard();
  }, []);

  // Timer & Auto Save
  useEffect(() => {
    if (view === "exam") {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          const nextTime = prev - 1;
          const cacheKey = getCacheKey(activeExam);
          localStorage.setItem(cacheKey, JSON.stringify({
             answers,
             timeLeft: nextTime,
             warnings
          }));
          
          if (nextTime <= 0) {
            clearInterval(timerRef.current);
            alert("Waktu ujian telah berakhir! Lembar jawaban dikumpulkan otomatis.");
            submitExam(true, activeExam, questions, examWeights);
            return 0;
          }
          return nextTime;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [view, answers, warnings, activeExam, questions]);

  // Anti-Cheat Event Listeners
  useEffect(() => {
    if (view !== 'exam') return;

    let lastWarnTime = 0;
    const handleVisibilityChange = () => {
      if (document.hidden) {
        const now = Date.now();
        if (now - lastWarnTime < 2000) return;
        lastWarnTime = now;
        setWarnings(prev => {
           const newWarn = prev + 1;
           if (newWarn >= 4) {
              submitExam(true, activeExam, questions, examWeights);
              alert("Ujian Anda dihentikan paksa karena telah melanggar aturan keluar halaman sebanyak 4 kali.");
           } else {
              setShowWarningModal(true);
           }
           return newWarn;
        });
      }
    };

    const preventDefaultAction = (e) => e.preventDefault();

    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('contextmenu', preventDefaultAction);
    document.addEventListener('copy', preventDefaultAction);
    document.addEventListener('paste', preventDefaultAction);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('contextmenu', preventDefaultAction);
      document.removeEventListener('copy', preventDefaultAction);
      document.removeEventListener('paste', preventDefaultAction);
    };
  }, [view, activeExam, questions]);

  const fetchDashboard = async () => {
    setLoading(true);
    const res = await getStudentDashboardData();
    if (res.success) {
      setSession(res.student);
      setDashboardData(res);
      setView("dashboard");
      // Set foto profil dari data student
      if (res.student?.profilePhoto) setProfilePhotoUrl(res.student.profilePhoto);
      const finRes = await getStudentFinancialSummary();
      if (finRes.success) setFinancialData(finRes);
    } else {
      setSession(null);
      setDashboardData(null);
    }
    setLoading(false);
  };

  const handleProfilePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoUploading(true);
    const formData = new FormData();
    formData.append("photo", file);
    const res = await uploadStudentProfilePhoto(formData);
    setPhotoUploading(false);
    if (res.success) {
      setProfilePhotoUrl(res.photoUrl);
      // Update session juga
      setSession(prev => ({ ...prev, profilePhoto: res.photoUrl }));
    } else {
      alert(res.error || "Gagal mengunggah foto profil.");
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError("");
    const res = await loginAction("siswa", username, password);
    if (res.success) {
      setUsername("");
      setPassword("");
      await fetchDashboard();
    } else {
      setLoginError(res.error);
    }
  };

  const handleLogout = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    await logoutAction();
    setSession(null);
    setDashboardData(null);
    setFinancialData(null);
    setProfilePhotoUrl("");
    setView("dashboard");
    setActiveTab("beranda");
  };

  // Ujian Logic
  const startExam = async (exam) => {
    try {
    setActiveExam(exam);
    const res = await getExamQuestions(exam.subject, exam.category, exam.semester);
    if (res.success && res.questions.length > 0) {
      
      const rawQs = res.questions;
      const shuffledQs = shuffleArray(rawQs).map(q => {
        let sq = { ...q };
        if (sq.type === 'PG' || sq.type === 'PGK') {
           const choicesWithIndex = (sq.choices || []).map((c, i) => ({ text: c, originalIndex: i }));
           sq.shuffledChoices = shuffleArray(choicesWithIndex);
        }
        return sq;
      });

      setQuestions(shuffledQs);
      setStudentAnswerFile(null);
      setActiveQuestionIdx(0);

      setExamWeights(res.weights || { pg: 100, isian: 0, essay: 0 });
      let initialTimeLeft = res.timeLeft || 5400; // Dinamis dari jadwal, fallback 90 menit
      let initialAnswers = {};
      let initialWarnings = 0;

      const cacheKey = getCacheKey(exam);
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
         try {
            const parsed = JSON.parse(cached);
            if (parsed.answers) initialAnswers = parsed.answers;
            if (parsed.timeLeft) initialTimeLeft = parsed.timeLeft;
            if (parsed.warnings) initialWarnings = parsed.warnings;
         } catch(e) {}
      }

      setAnswers(initialAnswers);
      setTimeLeft(initialTimeLeft);
      setWarnings(initialWarnings);
      setView("exam");
      
      try {
        if (document.documentElement.requestFullscreen) {
           await document.documentElement.requestFullscreen();
        }
      } catch(e) { console.warn(e); }

    } else {
      alert(`Maaf, belum ada soal ujian aktif untuk ${exam.category} ${exam.subject} Semester ${exam.semester}.`);
    }
    } catch (e) {
      console.error(e);
      alert("Terjadi kesalahan saat menyiapkan ujian.");
    }
  };

  // State selectors untuk 5 jenis tipe soal
  const selectPgAnswer = (qId, choiceIdx) => {
    setAnswers(prev => ({ ...prev, [qId]: choiceIdx }));
  };

  const togglePgkAnswer = (qId, choiceIdx) => {
    const current = answers[qId] || [];
    if (current.includes(choiceIdx)) {
      setAnswers(prev => ({ ...prev, [qId]: current.filter(c => c !== choiceIdx) }));
    } else {
      setAnswers(prev => ({ ...prev, [qId]: [...current, choiceIdx] }));
    }
  };

  const setMatchingAnswer = (qId, leftIdx, rightIdx) => {
    const current = answers[qId] || {};
    setAnswers(prev => ({
      ...prev,
      [qId]: { ...current, [leftIdx]: rightIdx }
    }));
  };

  const setIsianAnswer = (qId, text) => {
    setAnswers(prev => ({ ...prev, [qId]: text }));
  };

  const setEssayAnswer = (qId, text) => {
    setAnswers(prev => ({ ...prev, [qId]: text }));
  };

  const renderQuestionDetails = (q) => {
    return (
      <>
        {/* Teks Pertanyaan */}
        <div className="quiz-question-text" style={{ fontWeight: "bold", fontSize: "1.15rem", marginBottom: "1.5rem", color: "var(--primary-dark)", lineHeight: "1.5", whiteSpace: "pre-wrap" }}>
          {q.question}
        </div>

        {q.imagePath && (
          <div style={{ marginBottom: "1.5rem", textAlign: "center" }}>
            <img src={q.imagePath} alt="Ilustrasi Soal" style={{ maxWidth: "100%", maxHeight: "300px", objectFit: "contain", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }} />
          </div>
        )}

        {/* Bidang Input */}
        <div style={{ minHeight: "150px" }}>
          {q.type === "PG" && (
            <div className="quiz-choices" style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {q.choices.map((c, cIdx) => {
                const isSelected = answers[q.id] === cIdx;
                return (
                  <label className={`quiz-choice-label ${isSelected ? "selected" : ""}`} key={cIdx} onClick={() => selectPgAnswer(q.id, cIdx)} style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <input 
                      type="radio" 
                      name={`q-${q.id}`} 
                      checked={isSelected}
                      onChange={() => selectPgAnswer(q.id, cIdx)}
                    />
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                      <span>{String.fromCharCode(65 + cIdx)}. {c}</span>
                      {q.choicesImages && q.choicesImages[cIdx] && (
                        <img src={q.choicesImages[cIdx]} style={{ maxWidth: "200px", maxHeight: "100px", objectFit: "contain", borderRadius: "4px", border: "1px solid #e2e8f0", marginTop: "0.25rem" }} alt={`Opsi ${String.fromCharCode(65 + cIdx)}`} />
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
          )}

          {q.type === "PGK" && (
            <div className="quiz-choices" style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {q.choices.map((c, cIdx) => {
                const isSelected = (answers[q.id] || []).includes(cIdx);
                return (
                  <label className={`quiz-choice-label ${isSelected ? "selected" : ""}`} key={cIdx} onClick={() => togglePgkAnswer(q.id, cIdx)} style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <input 
                      type="checkbox" 
                      name={`q-${q.id}`} 
                      checked={isSelected}
                      onChange={() => togglePgkAnswer(q.id, cIdx)}
                    />
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                      <span>{String.fromCharCode(65 + cIdx)}. {c}</span>
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
              if (otherQ.type === "MENJODOHKAN") {
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
                    const selectedRightIdx = (answers[q.id] || {})[lIdx];
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
                          onChange={(e) => setMatchingAnswer(q.id, lIdx, e.target.value === "" ? "" : parseInt(e.target.value, 10))}
                        >
                          <option value="">-- Pilih Jawaban --</option>
                          {optionsPool.map((item, rIdx) => {
                            const isAlreadySelected = Object.entries(answers[q.id] || {}).some(
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
                value={answers[q.id] || ""}
                onChange={(e) => setIsianAnswer(q.id, e.target.value)}
                required
              />
            </div>
          )}

          {q.type === "ESSAY" && (
            <div className="form-group" style={{ margin: 0 }}>
              <textarea 
                className="form-textarea" 
                placeholder="Tuliskan penjelasan/uraian jawaban lengkap Anda di sini..." 
                value={answers[q.id] || ""}
                onChange={(e) => setEssayAnswer(q.id, e.target.value)}
                required
                style={{ minHeight: "120px" }}
              />
            </div>
          )}
        </div>
      </>
    );
  };

  const submitExam = async (auto = false, targetExam = activeExam, targetQuestions = questions, targetWeights = examWeights) => {
    if (!auto) {
      if (!confirm("Apakah Anda yakin ingin menyerahkan semua jawaban ujian?")) return;
    }

    if (timerRef.current) clearInterval(timerRef.current);
    try {
      if (document.fullscreenElement && document.exitFullscreen) {
         await document.exitFullscreen();
      }
    } catch(e) {}
    localStorage.removeItem(getCacheKey(targetExam));

    let pgCorrect = 0, pgTotal = 0;
    let isianCorrect = 0, isianTotal = 0;

    targetQuestions.forEach((q) => {
      const studentAns = answers[q.id];
      
      if (q.type === "PG") {
        pgTotal++;
        if (studentAns !== undefined && Number(studentAns) === q.correct) pgCorrect++;
      } 
      else if (q.type === "PGK") {
        pgTotal++;
        if (Array.isArray(studentAns) && q.correctChoices) {
          const isCorrect = studentAns.length === q.correctChoices.length && 
                            studentAns.every(v => q.correctChoices.includes(Number(v)));
          if (isCorrect) pgCorrect++;
        }
      }
      else if (q.type === "MENJODOHKAN") {
        pgTotal++;
        if (studentAns && typeof studentAns === "object" && q.matchingLeft && q.matchingRight) {
          const allCorrect = q.matchingLeft.every((_, lIdx) => {
            const chosenRightIdx = studentAns[lIdx];
            if (chosenRightIdx === undefined) return false;
            return q.matchingRight[chosenRightIdx] === q.matchingRight[lIdx];
          });
          if (allCorrect) pgCorrect++;
        }
      }
      else if (q.type === "ISIAN") {
        isianTotal++;
        if (studentAns && typeof studentAns === "string" && q.correctAnswer) {
          const isCorrect = studentAns.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();
          if (isCorrect) isianCorrect++;
        }
      }
    });

    let finalScore = 0;
    const pgScore = pgTotal > 0 ? (pgCorrect / pgTotal) * targetWeights.pg : (targetWeights.pg === 100 ? 100 : 0);
    const isianScore = isianTotal > 0 ? (isianCorrect / isianTotal) * targetWeights.isian : 0;
    
    // Essay score is always 0 initially.
    finalScore = Math.round(pgScore + isianScore);

    // Jika siswa mengunggah lembar jawaban eksternal
    let studentFilePath = null;
    if (studentAnswerFile) {
      const formData = new FormData();
      formData.append("file", studentAnswerFile);
      const uploadRes = await uploadStudentAnswerFile(formData);
      if (uploadRes.success) {
        studentFilePath = uploadRes.filePath;
      } else {
        alert("Gagal mengunggah dokumen jawaban: " + uploadRes.error);
        return;
      }
    }

    // Kirim hasil ujian ke server cloud
    const res = await submitStudentExamResult(targetExam.subject, targetExam.category, targetExam.semester, finalScore, answers, studentFilePath);
    if (res.success) {
      setExamScore(finalScore);
      setView("success");
      fetchDashboard();
    } else {
      alert("Gagal menyimpan hasil ujian online ke server.");
    }
  };

  const handlePortfolioUpload = async (e) => {
    e.preventDefault();
    if (!portfolioTitle || !portfolioFile) {
      alert("Judul dan File Karya wajib diisi!");
      return;
    }
    setPortfolioUploading(true);
    
    const formData = new FormData();
    formData.append("judul", portfolioTitle);
    formData.append("deskripsi", portfolioDesc);
    formData.append("kategori", portfolioCategory);
    formData.append("link", portfolioFile); // portfolioFile actually holds the URL string now

    const res = await uploadPortfolio(formData);
    setPortfolioUploading(false);

    if (res.success) {
      alert("Karya Portofolio berhasil diunggah!");
      setShowPortfolioModal(false);
      setPortfolioTitle("");
      setPortfolioDesc("");
      setPortfolioFile(null);
      fetchDashboard(); // Refresh data untuk memunculkan portofolio baru
    } else {
      alert(res.error || "Gagal mengunggah portofolio.");
    }
  };


  const cancelExam = () => {
    if (confirm("Batal mengerjakan ujian? Seluruh jawaban saat ini akan hilang.")) {
      if (timerRef.current) clearInterval(timerRef.current);
      setView("dashboard");
    }
  };

  const formatTime = (seconds) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
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

  return (
    <>
      <section className="page-header">
        <div className="container">
          <h1 className="page-header-title">SPEKTRA</h1>
          <div className="page-header-breadcrumbs">
            <Link href="/">Beranda</Link>
            <span className="breadcrumb-separator">/</span>
            <span>SPEKTRA — Sistem Portal Elektronik Akademik</span>
          </div>
        </div>
      </section>

      <div className="portal-wrapper" style={{
        backgroundColor: dashboardData?.student?.unit === "SMP" ? "#f0f9ff" : "var(--bg-alt)",
        minHeight: "100vh"
      }}>
        <div className="container">
          {/* 1. LOGIN FORM */}
          {!session && (
            <section className="login-section" id="portal-siswa-login-section">
              <div className="login-card">
                <div className="login-header">
                  <div className="login-icon-box">S</div>
                  <h2 className="login-card-title">Login Siswa</h2>
                  <p className="login-card-subtitle">Masuk ke SPEKTRA – Sistem Portal Elektronik Akademik</p>
                </div>

                {loginError && (
                  <div className="form-alert error" style={{ display: "block", marginBottom: "1.5rem" }}>
                    {loginError}
                  </div>
                )}


                <form onSubmit={handleLogin}>
                  <div className="form-group">
                    <label htmlFor="portal-siswa-username" className="form-label">Username</label>
                    <input 
                      type="text" 
                      id="portal-siswa-username" 
                      className="form-input" 
                      placeholder="Masukkan username siswa" 
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required 
                      autoComplete="username"
                    />
                  </div>
                  
                  <div className="form-group" style={{ marginBottom: "2rem", marginTop: "1rem" }}>
                    <label htmlFor="portal-siswa-password" className="form-label">Password</label>
                    <input 
                      type="password" 
                      id="portal-siswa-password" 
                      className="form-input" 
                      placeholder="Masukkan password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required 
                      autoComplete="current-password"
                    />
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ width: "100%" }}>Masuk ke SPEKTRA</button>
                </form>
              </div>
            </section>
          )}

          {/* 2. DASHBOARD ACTIVE - SIDEBAR + CONTENT LAYOUT */}
          {session && view === "dashboard" && (
            <div className="portal-layout" style={{ paddingTop: "2rem", paddingBottom: "3rem" }}>
              
              {/* SIDEBAR KIRI */}
              <aside className="portal-sidebar no-print">
                {/* Ornamen Geometris */}
                <div style={{ position: "absolute", top: "-15px", right: "-15px", opacity: 0.035, pointerEvents: "none", zIndex: 0 }}>
                  <svg width="100" height="100" viewBox="0 0 100 100" fill="none" stroke="var(--primary)" strokeWidth="2">
                    <circle cx="50" cy="50" r="40"/><circle cx="50" cy="50" r="25"/><circle cx="50" cy="50" r="10"/>
                  </svg>
                </div>

                {/* Avatar & Info Siswa */}
                <div className="portal-sidebar-header" style={{ position: "relative", zIndex: 1 }}>
                  <div
                    onClick={() => setActiveTab("profil")}
                    style={{ position: "relative", cursor: "pointer", flexShrink: 0 }}
                    title="Klik untuk ke Profil Saya"
                  >
                    {profilePhotoUrl ? (
                      <img
                        src={profilePhotoUrl}
                        alt={session.name}
                        style={{ width: "52px", height: "52px", borderRadius: "50%", objectFit: "cover", border: "2px solid var(--primary)", display: "block" }}
                      />
                    ) : (
                      <div className="portal-sidebar-avatar" style={{ background: "linear-gradient(135deg, var(--primary), var(--primary-dark))", color: "white", fontSize: "1.5rem", fontWeight: 800 }}>
                        {session.name ? session.name.charAt(0).toUpperCase() : "S"}
                      </div>
                    )}
                    <span style={{ position: "absolute", bottom: 0, right: 0, background: "var(--primary)", borderRadius: "50%", width: "16px", height: "16px", display: "flex", alignItems: "center", justifyContent: "center", border: "1.5px solid white" }}>
                      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </span>
                  </div>
                  <div>
                    <h4 style={{ fontWeight: 800, fontSize: "0.95rem", color: "var(--primary-dark)" }}>{session.name}</h4>
                    <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", margin: "0.1rem 0" }}>NISN: {session.nisn}</p>
                    <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", margin: 0 }}>Kelas: {session.kelas}</p>
                    <span style={{ display: "inline-block", marginTop: "0.4rem", fontSize: "0.7rem", backgroundColor: "var(--primary-light)", color: "var(--primary-dark)", padding: "0.15rem 0.5rem", borderRadius: "10px", fontWeight: "bold" }}>
                      Semester {dashboardData?.activeSemester}
                    </span>
                  </div>
                </div>

                {/* Menu Sidebar */}
                <div className="portal-sidebar-menu">
                  <button className={`sidebar-btn ${activeTab === "beranda" ? "active" : ""}`} onClick={() => setActiveTab("beranda")}>
                    <svg className="tab-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                    Beranda
                  </button>

                  <button className={`sidebar-btn ${activeTab === "ujian" ? "active" : ""}`} onClick={() => setActiveTab("ujian")}>
                    <svg className="tab-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                    Ujian Online
                  </button>

                  <button className={`sidebar-btn ${activeTab === "tugas" ? "active" : ""}`} onClick={() => setActiveTab("tugas")}>
                    <svg className="tab-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                    Tugas Harian
                  </button>

                  <button className={`sidebar-btn ${activeTab === "absensi" ? "active" : ""}`} onClick={() => setActiveTab("absensi")}>
                    <svg className="tab-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
                    Kehadiran
                  </button>

                  <button className={`sidebar-btn ${activeTab === "keuangan" ? "active" : ""}`} onClick={() => setActiveTab("keuangan")}>
                    <svg className="tab-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                    Keuangan (SPP)
                  </button>

                  <button className={`sidebar-btn ${activeTab === "ekskul" ? "active" : ""}`} onClick={() => setActiveTab("ekskul")}>
                    <svg className="tab-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                    Ekstrakurikuler
                  </button>

                  <button className={`sidebar-btn ${activeTab === "portofolio" ? "active" : ""}`} onClick={() => setActiveTab("portofolio")}>
                    <svg className="tab-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                    Portofolio DKV
                  </button>

                  <button className={`sidebar-btn ${activeTab === "perpustakaan" ? "active" : ""}`} onClick={() => setActiveTab("perpustakaan")}>
                    <svg className="tab-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
                    Perpustakaan Digital
                  </button>

                  <button className={`sidebar-btn ${activeTab === "pkl" ? "active" : ""}`} onClick={() => setActiveTab("pkl")}>
                    <svg className="tab-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                    Jurnal PKL
                  </button>

                  <button className={`sidebar-btn ${activeTab === "ukk" ? "active" : ""}`} onClick={() => setActiveTab("ukk")}>
                    <svg className="tab-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                    Sertifikasi UKK
                  </button>

                  <button className={`sidebar-btn ${activeTab === "profil" ? "active" : ""}`} onClick={() => setActiveTab("profil")}>
                    <svg className="tab-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    Profil Saya
                  </button>

                  {/* Tombol Keluar */}
                  <div style={{ marginTop: "2rem", borderTop: "1px solid var(--border-color)", paddingTop: "1rem" }}>
                    <button className="sidebar-btn" onClick={handleLogout} style={{ color: "#ef4444" }}>
                      <svg className="tab-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                      Keluar Portal
                    </button>
                  </div>
                </div>
              </aside>

              {/* KONTEN UTAMA */}
              <main className="portal-main">

                {/* === TAB: BERANDA === */}
                {activeTab === "beranda" && (
                  <div style={{ animation: "fadeIn 0.3s" }}>
                    <span style={{ fontSize: "0.85rem", textTransform: "uppercase", fontWeight: 700, color: "var(--secondary)" }}>SPEKTRA</span>
                    <h2 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--primary-dark)", marginBottom: "1.5rem" }}>
                      Selamat Datang, {session.name?.split(" ")[0]}! 👋
                    </h2>

                    {/* Info Banner Kebijakan */}
                    <div style={{ backgroundColor: "#fff8f1", padding: "1rem 1.25rem", borderRadius: "var(--radius-md)", border: "1px solid #ffedd5", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <div style={{ background: "linear-gradient(135deg, #c2410c, #9a3412)", borderRadius: "50%", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", flexShrink: 0 }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                      </div>
                      <div style={{ fontSize: "0.82rem", color: "#9a3412", lineHeight: "1.5" }}>
                        <strong>Kebijakan Pembagian Rapor & SKNR:</strong> Dokumen <strong>E-Rapor & SKNR</strong> diserahkan secara fisik oleh <strong>Wali Kelas</strong> kepada Orang Tua/Wali pada akhir semester.
                      </div>
                    </div>

                    {/* Grid Statistik Cepat */}
                    {(() => {
                      const atts = session.attendances || [];
                      const total = atts.length;
                      const hadir = atts.filter(a => a.status === "HADIR").length;
                      const sakit = atts.filter(a => a.status === "SAKIT").length;
                      const izin = atts.filter(a => a.status === "IZIN").length;
                      const alfa = atts.filter(a => a.status === "ALFA").length;
                      const percent = total > 0 ? Math.round((hadir / total) * 100) : 100;
                      const ujianSelesai = dashboardData?.availableExams?.filter(e => e.score !== null).length || 0;
                      const totalUjian = dashboardData?.availableExams?.length || 0;
                      return (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
                          {[
                            { label: "Kehadiran", value: `${percent}%`, sub: `${hadir} dari ${total} hari`, color: "#22c55e", bg: "#dcfce7" },
                            { label: "Ujian Selesai", value: `${ujianSelesai}/${totalUjian}`, sub: "Ujian dikerjakan", color: "#3b82f6", bg: "#dbeafe" },
                            { label: "Portofolio", value: session.portfolios?.length || 0, sub: "Karya diunggah", color: "#a855f7", bg: "#f3e8ff" },
                            { label: "Alfa", value: alfa, sub: `Sakit: ${sakit}, Izin: ${izin}`, color: "#ef4444", bg: "#fee2e2" },
                          ].map((stat, i) => (
                            <div key={i} style={{ background: "white", padding: "1.25rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", boxShadow: "var(--shadow-sm)" }}>
                              <div style={{ fontSize: "1.8rem", fontWeight: 900, color: stat.color }}>{stat.value}</div>
                              <div style={{ fontWeight: 700, color: "var(--primary-dark)", marginBottom: "0.2rem" }}>{stat.label}</div>
                              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{stat.sub}</div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}

                    {/* Ujian Aktif Terbaru */}
                    <h3 style={{ fontWeight: 700, color: "var(--primary-dark)", marginBottom: "1rem" }}>Ujian Aktif Semester {dashboardData?.activeSemester}</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                      {dashboardData?.availableExams?.slice(0, 3).map((exam, i) => (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem 1.25rem", backgroundColor: "white", border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-sm)" }}>
                          <div>
                            <h4 style={{ margin: 0, color: "var(--primary-dark)", fontSize: "0.95rem" }}>{exam.subject} — {exam.category}</h4>
                            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{exam.questionCount} Soal · Semester {exam.semester}</span>
                          </div>
                          <span style={{ fontSize: "0.75rem", padding: "0.25rem 0.65rem", borderRadius: "50px", fontWeight: "bold", backgroundColor: exam.score !== null ? "#dcfce7" : exam.isLocked ? "#fee2e2" : "#dbeafe", color: exam.score !== null ? "#15803d" : exam.isLocked ? "#ef4444" : "#1d4ed8" }}>
                            {exam.score !== null ? `✓ Selesai (${exam.score})` : exam.isLocked ? "🔒 Terkunci" : "▶ Buka"}
                          </span>
                        </div>
                      ))}
                      <button className="btn btn-outline" style={{ fontSize: "0.85rem", alignSelf: "flex-start" }} onClick={() => setActiveTab("ujian")}>Lihat Semua Ujian →</button>
                    </div>
                  </div>
                )}

                {/* === TAB: UJIAN ONLINE === */}
                {activeTab === "ujian" && (
                  <div style={{ animation: "fadeIn 0.3s" }}>
                    <span style={{ fontSize: "0.85rem", textTransform: "uppercase", fontWeight: 700, color: "var(--secondary)" }}>Akademik</span>
                    <h2 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--primary-dark)", marginBottom: "1.5rem" }}>Daftar Ujian Semester {dashboardData?.activeSemester}</h2>
                    <div className="exam-grid" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                      {dashboardData?.availableExams && dashboardData.availableExams.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "3rem 1.5rem", backgroundColor: "var(--bg-alt)", borderRadius: "var(--radius-md)", border: "1px dashed var(--border-color)", color: "var(--text-muted)" }}>
                          <p style={{ margin: 0, fontStyle: "italic" }}>Belum ada jadwal ujian aktif untuk Semester {dashboardData?.activeSemester}.</p>
                        </div>
                      ) : (
                        dashboardData?.availableExams?.map((exam, index) => {
                          const hasSchedule = exam.schedule !== null;
                          const startTimeStr = hasSchedule ? new Date(exam.schedule.startTime).toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "";
                          const endTimeStr = hasSchedule ? new Date(exam.schedule.endTime).toLocaleString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "";
                          return (
                            <div className="exam-card" key={index} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1.5rem", border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)", backgroundColor: "white" }}>
                              <div>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                  <h4 style={{ fontWeight: 700, color: "var(--primary-dark)", margin: 0, fontSize: "1.05rem" }}>
                                    {exam.category === "PAJ" ? "PAJ" : exam.category === "UTS" ? "UTS" : "UAS"} - {exam.subject}
                                  </h4>
                                  <span style={{ fontSize: "0.7rem", padding: "0.15rem 0.5rem", borderRadius: "4px", fontWeight: "bold", backgroundColor: exam.isLocked ? "#fee2e2" : "#dcfce7", color: exam.isLocked ? "#ef4444" : "#15803d" }}>{exam.statusText}</span>
                                </div>
                                <div style={{ fontSize: "0.83rem", color: "var(--text-muted)", marginTop: "0.4rem" }}>
                                  {exam.questionCount} Soal · Semester {exam.semester}
                                  {hasSchedule && <span style={{ marginLeft: "1rem", color: "var(--primary)", fontWeight: "bold" }}>📅 {startTimeStr} s.d. {endTimeStr}</span>}
                                </div>
                              </div>
                              <div>
                                {exam.score !== null ? (
                                  <button className="btn btn-outline" disabled style={{ backgroundColor: "#f3f4f6", color: "#9ca3af", borderColor: "#e5e7eb" }}>Selesai (Skor: {exam.score})</button>
                                ) : exam.isLocked ? (
                                  <button className="btn btn-outline" disabled style={{ backgroundColor: "#fee2e2", color: "#ef4444", borderColor: "#fca5a5", cursor: "not-allowed" }}>🔒 Terkunci</button>
                                ) : (
                                  <button className="btn btn-primary" onClick={() => startExam(exam)}>Mulai Ujian</button>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}

                {/* === TAB: TUGAS HARIAN === */}
                {activeTab === "tugas" && (
                  <div style={{ animation: "fadeIn 0.3s" }}>
                    <span style={{ fontSize: "0.85rem", textTransform: "uppercase", fontWeight: 700, color: "var(--secondary)" }}>Akademik</span>
                    <h2 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--primary-dark)", marginBottom: "1.5rem" }}>Tugas Harian</h2>
                    <SiswaPenugasanTab student={session} />
                  </div>
                )}

                {/* === TAB: KEHADIRAN === */}
                {activeTab === "absensi" && (
                  <div style={{ animation: "fadeIn 0.3s" }}>
                    <span style={{ fontSize: "0.85rem", textTransform: "uppercase", fontWeight: 700, color: "var(--secondary)" }}>Kehadiran</span>
                    <h2 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--primary-dark)", marginBottom: "1.5rem" }}>Rekap Kehadiran Saya</h2>
                    {(() => {
                      const atts = session.attendances || [];
                      const total = atts.length;
                      const hadir = atts.filter(a => a.status === "HADIR").length;
                      const sakit = atts.filter(a => a.status === "SAKIT").length;
                      const izin = atts.filter(a => a.status === "IZIN").length;
                      const alfa = atts.filter(a => a.status === "ALFA").length;
                      const percent = total > 0 ? Math.round((hadir / total) * 100) : 100;
                      return (
                        <div>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "1rem", marginBottom: "2rem" }}>
                            {[
                              { label: "Hadir", value: hadir, color: "#22c55e" },
                              { label: "Sakit", value: sakit, color: "#3b82f6" },
                              { label: "Izin", value: izin, color: "#eab308" },
                              { label: "Alfa", value: alfa, color: "#ef4444" },
                              { label: "Rasio", value: `${percent}%`, color: "var(--primary)" },
                            ].map((s, i) => (
                              <div key={i} style={{ background: "white", padding: "1.25rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", textAlign: "center", boxShadow: "var(--shadow-sm)" }}>
                                <div style={{ fontSize: "2rem", fontWeight: 900, color: s.color }}>{s.value}</div>
                                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{s.label}</div>
                              </div>
                            ))}
                          </div>
                          {atts.length === 0 ? (
                            <p style={{ color: "var(--text-muted)", fontStyle: "italic" }}>Belum ada data kehadiran tercatat.</p>
                          ) : (
                            <div className="portal-table-container">
                              <table className="portal-table">
                                <thead><tr><th>No</th><th>Tanggal</th><th>Status</th><th>Catatan</th></tr></thead>
                                <tbody>
                                  {atts.slice().reverse().map((a, i) => (
                                    <tr key={i}>
                                      <td>{i + 1}</td>
                                      <td>{a.date}</td>
                                      <td><span style={{ background: a.status === "HADIR" ? "#dcfce7" : a.status === "SAKIT" ? "#dbeafe" : a.status === "IZIN" ? "#fef3c7" : "#fee2e2", color: a.status === "HADIR" ? "#15803d" : a.status === "SAKIT" ? "#1d4ed8" : a.status === "IZIN" ? "#b45309" : "#b91c1c", padding: "0.2rem 0.6rem", borderRadius: "12px", fontSize: "0.75rem", fontWeight: "bold" }}>{a.status}</span></td>
                                      <td style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>{a.notes || "-"}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* === TAB: KEUANGAN === */}
                {activeTab === "keuangan" && (
                  <div style={{ animation: "fadeIn 0.3s" }}>
                    <span style={{ fontSize: "0.85rem", textTransform: "uppercase", fontWeight: 700, color: "var(--secondary)" }}>Keuangan</span>
                    <h2 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--primary-dark)", marginBottom: "1.5rem" }}>Riwayat & Status Keuangan (SPP)</h2>
                    {financialData?.payments && financialData.payments.length > 0 ? (
                      <div className="portal-table-container">
                        <table className="portal-table">
                          <thead><tr><th>No Kwitansi</th><th>Tanggal</th><th>Jenis Tagihan</th><th>Bulan / Periode</th><th style={{ textAlign: "right" }}>Jumlah</th><th style={{ textAlign: "center" }}>Status</th></tr></thead>
                          <tbody>
                            {financialData.payments.map(p => (
                              <tr key={p.id}>
                                <td style={{ fontWeight: "bold", fontSize: "0.8rem", color: "var(--primary)" }}>{p.receiptNo}</td>
                                <td>{p.paidAt}</td>
                                <td><strong>{p.feeName}</strong></td>
                                <td>{p.bulan !== "-" ? `Bulan ${["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"][parseInt(p.bulan)-1]} ${p.tahun}` : p.tahun}</td>
                                <td style={{ textAlign: "right", fontWeight: "bold", color: "#16a34a" }}>Rp {p.paidAmount.toLocaleString("id-ID")}</td>
                                <td style={{ textAlign: "center" }}>
                                  <span style={{ background: p.status === "LUNAS" ? "#dcfce7" : "#fef3c7", color: p.status === "LUNAS" ? "#15803d" : "#b45309", padding: "3px 8px", borderRadius: "12px", fontSize: "0.72rem", fontWeight: "bold" }}>✓ {p.status}</span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div style={{ textAlign: "center", padding: "1.5rem", color: "#94a3b8", background: "#f8fafc", borderRadius: "8px", border: "1px dashed #cbd5e1" }}>
                        💳 Belum ada catatan transaksi pembayaran. Silakan hubungi Bendahara Sekolah.
                      </div>
                    )}
                  </div>
                )}

                {/* === TAB: EKSTRAKURIKULER === */}
                {activeTab === "ekskul" && (
                  <div style={{ animation: "fadeIn 0.3s" }}>
                    <span style={{ fontSize: "0.85rem", textTransform: "uppercase", fontWeight: 700, color: "var(--secondary)" }}>Pengembangan Diri</span>
                    <h2 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--primary-dark)", marginBottom: "1.5rem" }}>Pilihan Ekstrakurikuler</h2>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "0.75rem" }}>
                      {dashboardData?.allExtracurriculars && dashboardData.allExtracurriculars.length > 0 ? (
                        dashboardData.allExtracurriculars.map(ekskulName => {
                          const isEnrolled = session?.extracurriculars?.includes(ekskulName);
                          return (
                            <div key={ekskulName} style={{ padding: "0.85rem 1rem", borderRadius: "8px", border: isEnrolled ? "2px solid #16a34a" : "1px solid #e5e7eb", backgroundColor: isEnrolled ? "#f0fdf4" : "#f8fafc", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <div>
                                <div style={{ fontWeight: 700, fontSize: "0.9rem", color: isEnrolled ? "#15803d" : "var(--primary-dark)" }}>{ekskulName}</div>
                                <div style={{ fontSize: "0.72rem", color: isEnrolled ? "#16a34a" : "#64748b" }}>{isEnrolled ? "✓ Terdaftar" : "Belum bergabung"}</div>
                              </div>
                              <button type="button" className={`btn ${isEnrolled ? "btn-outline" : "btn-primary"}`} style={{ padding: "0.3rem 0.65rem", fontSize: "0.75rem", borderColor: isEnrolled ? "#dc2626" : undefined, color: isEnrolled ? "#dc2626" : undefined, background: isEnrolled ? "white" : undefined }} onClick={async () => {
                                const res = await toggleStudentEkskul(ekskulName);
                                if (res.success) setSession(prev => ({ ...prev, extracurriculars: res.extracurriculars }));
                                else alert(res.error);
                              }}>
                                {isEnrolled ? "Batal" : "+ Pilih"}
                              </button>
                            </div>
                          );
                        })
                      ) : (
                        <div style={{ color: "#94a3b8", fontSize: "0.85rem", fontStyle: "italic" }}>Belum ada daftar ekskul dari sekolah.</div>
                      )}
                    </div>
                  </div>
                )}

                {/* === TAB: PORTOFOLIO === */}
                {activeTab === "portofolio" && (
                  <div style={{ animation: "fadeIn 0.3s" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                      <div>
                        <span style={{ fontSize: "0.85rem", textTransform: "uppercase", fontWeight: 700, color: "var(--secondary)" }}>Kreativitas</span>
                        <h2 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--primary-dark)", margin: 0 }}>Galeri Karya Portofolio DKV</h2>
                      </div>
                      <button className="btn btn-primary" onClick={() => setShowPortfolioModal(true)}>+ Unggah Karya</button>
                    </div>
                    {(!session.portfolios || session.portfolios.length === 0) ? (
                      <div style={{ textAlign: "center", padding: "3rem 1.5rem", backgroundColor: "var(--bg-alt)", borderRadius: "var(--radius-md)", border: "1px dashed var(--border-color)", color: "var(--text-muted)" }}>
                        <p style={{ margin: 0, fontStyle: "italic" }}>Belum ada karya portofolio yang diunggah. Ayo mulai berkreasi!</p>
                      </div>
                    ) : (
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "1.5rem" }}>
                        {session.portfolios.map((port, idx) => (
                          <div key={idx} style={{ backgroundColor: "white", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", overflow: "hidden", boxShadow: "var(--shadow-sm)", display: "flex", flexDirection: "column" }}>
                            <div style={{ padding: "1.25rem", borderBottom: "1px solid var(--border-color)", flex: 1 }}>
                              <span style={{ display: "inline-block", fontSize: "0.7rem", backgroundColor: "var(--bg-alt)", padding: "0.2rem 0.5rem", borderRadius: "4px", marginBottom: "0.5rem", fontWeight: "bold" }}>{port.kategori}</span>
                              <h4 style={{ margin: "0 0 0.5rem 0", color: "var(--primary-dark)" }}>{port.judul}</h4>
                              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: 0 }}>{port.deskripsi || "-"}</p>
                            </div>
                            <div style={{ padding: "1rem", backgroundColor: "var(--bg-alt)", textAlign: "center" }}>
                              <a href={port.fileUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline" style={{ display: "inline-block", padding: "0.4rem 1rem", fontSize: "0.8rem", width: "100%" }}>Lihat Karya</a>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* === TAB: PROFIL === */}
                
                {/* PKL */}
                
                {/* UKK */}
                {activeTab === "ukk" && (
                  <UkkTab session={session} />
                )}

                {activeTab === "pkl" && (
                  <PklTab session={session} />
                )}

                {activeTab === "profil" && (
                  <div style={{ animation: "fadeIn 0.3s" }}>
                    <span style={{ fontSize: "0.85rem", textTransform: "uppercase", fontWeight: 700, color: "var(--secondary)" }}>Akun Saya</span>
                    <h2 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--primary-dark)", marginBottom: "1.5rem" }}>Profil Siswa</h2>

                    {/* Input file tersembunyi untuk upload foto */}
                    <input
                      ref={photoInputRef}
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={handleProfilePhotoChange}
                    />

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                      {/* Kartu Identitas Utama */}
                      <div style={{ backgroundColor: "white", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", boxShadow: "var(--shadow-sm)", overflow: "hidden", gridColumn: "1 / -1" }}>
                        <div style={{ background: "linear-gradient(135deg, var(--primary), var(--primary-dark))", padding: "2rem", display: "flex", alignItems: "center", gap: "1.5rem" }}>
                          {/* Avatar / Foto Profil */}
                          <div style={{ position: "relative", flexShrink: 0 }}>
                            {profilePhotoUrl ? (
                              <img
                                src={profilePhotoUrl}
                                alt={session.name}
                                style={{ width: "90px", height: "90px", borderRadius: "50%", objectFit: "cover", border: "3px solid rgba(255,255,255,0.6)", display: "block" }}
                              />
                            ) : (
                              <div style={{ width: "90px", height: "90px", borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2.5rem", fontWeight: 900, color: "white", border: "3px solid rgba(255,255,255,0.5)" }}>
                                {session.name ? session.name.charAt(0).toUpperCase() : "S"}
                              </div>
                            )}
                            {/* Tombol ganti foto */}
                            <button
                              onClick={() => photoInputRef.current?.click()}
                              disabled={photoUploading}
                              title="Ganti Foto Profil"
                              style={{ position: "absolute", bottom: 0, right: 0, background: "white", borderRadius: "50%", width: "28px", height: "28px", display: "flex", alignItems: "center", justifyContent: "center", border: "none", cursor: photoUploading ? "wait" : "pointer", boxShadow: "0 1px 4px rgba(0,0,0,0.25)" }}
                            >
                              {photoUploading ? (
                                <span style={{ fontSize: "0.6rem", color: "var(--primary)" }}>...</span>
                              ) : (
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                              )}
                            </button>
                          </div>
                          <div>
                            <h3 style={{ color: "white", margin: "0 0 0.3rem 0", fontSize: "1.4rem", fontWeight: 800 }}>{session.name}</h3>
                            <p style={{ color: "rgba(255,255,255,0.8)", margin: "0 0 0.3rem 0", fontSize: "0.9rem" }}>NISN: {session.nisn}</p>
                            <button
                              onClick={() => photoInputRef.current?.click()}
                              disabled={photoUploading}
                              style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.4)", color: "white", padding: "0.25rem 0.75rem", borderRadius: "50px", fontSize: "0.72rem", cursor: "pointer", marginBottom: "0.5rem", fontWeight: "600" }}
                            >
                              {photoUploading ? "Mengunggah..." : profilePhotoUrl ? "🔄 Ganti Foto" : "📷 Upload Foto Profil"}
                            </button>
                            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                              <span style={{ background: "rgba(255,255,255,0.2)", color: "white", padding: "0.2rem 0.75rem", borderRadius: "50px", fontSize: "0.75rem", fontWeight: "bold" }}>{session.kelas}</span>
                              {session.jurusan && <span style={{ background: "rgba(255,255,255,0.2)", color: "white", padding: "0.2rem 0.75rem", borderRadius: "50px", fontSize: "0.75rem", fontWeight: "bold" }}>{session.jurusan}</span>}
                              {session.unit && <span style={{ background: "rgba(255,255,255,0.2)", color: "white", padding: "0.2rem 0.75rem", borderRadius: "50px", fontSize: "0.75rem", fontWeight: "bold" }}>{session.unit}</span>}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Data Diri */}
                      <div style={{ backgroundColor: "white", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", boxShadow: "var(--shadow-sm)", padding: "1.5rem" }}>
                        <h4 style={{ fontWeight: 800, color: "var(--primary-dark)", margin: "0 0 1.25rem 0", fontSize: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <span style={{ background: "var(--primary-light)", borderRadius: "6px", padding: "0.2rem 0.4rem" }}>🪪</span> Data Diri
                        </h4>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
                          <tbody>
                            {[
                              { label: "Nama Lengkap", value: session.name },
                              { label: "NISN", value: session.nisn },
                              { label: "Kelas", value: session.kelas },
                              { label: "Jurusan", value: session.jurusan || "-" },
                              { label: "Unit / Jenjang", value: session.unit || "-" },
                            ].map((row, i) => (
                              <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                                <td style={{ padding: "0.65rem 0", color: "var(--text-muted)", width: "45%", fontSize: "0.85rem" }}>{row.label}</td>
                                <td style={{ padding: "0.65rem 0", fontWeight: 600, color: "var(--text-color)" }}>{row.value}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Data Orang Tua & Alamat */}
                      <div style={{ backgroundColor: "white", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", boxShadow: "var(--shadow-sm)", padding: "1.5rem" }}>
                        <h4 style={{ fontWeight: 800, color: "var(--primary-dark)", margin: "0 0 1.25rem 0", fontSize: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <span style={{ background: "var(--primary-light)", borderRadius: "6px", padding: "0.2rem 0.4rem" }}>🏠</span> Data Orang Tua & Alamat
                        </h4>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
                          <tbody>
                            {[
                              { label: "Nama Orang Tua", value: session.namaOrangTua || "-" },
                              { label: "Alamat Rumah", value: session.alamat || "-" },
                              { label: "Semester Aktif", value: `Semester ${dashboardData?.activeSemester}` },
                            ].map((row, i) => (
                              <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                                <td style={{ padding: "0.65rem 0", color: "var(--text-muted)", width: "45%", fontSize: "0.85rem" }}>{row.label}</td>
                                <td style={{ padding: "0.65rem 0", fontWeight: 600, color: "var(--text-color)" }}>{row.value}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Ringkasan Akademik */}
                      <div style={{ backgroundColor: "white", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", boxShadow: "var(--shadow-sm)", padding: "1.5rem", gridColumn: "1 / -1" }}>
                        <h4 style={{ fontWeight: 800, color: "var(--primary-dark)", margin: "0 0 1.25rem 0", fontSize: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <span style={{ background: "var(--primary-light)", borderRadius: "6px", padding: "0.2rem 0.4rem" }}>📊</span> Ringkasan Akademik Semester Ini
                        </h4>
                        {(() => {
                          const atts = session.attendances || [];
                          const total = atts.length;
                          const hadir = atts.filter(a => a.status === "HADIR").length;
                          const alfa = atts.filter(a => a.status === "ALFA").length;
                          const percent = total > 0 ? Math.round((hadir / total) * 100) : 100;
                          const ujianSelesai = dashboardData?.availableExams?.filter(e => e.score !== null).length || 0;
                          const totalUjian = dashboardData?.availableExams?.length || 0;
                          const avgScore = dashboardData?.availableExams?.filter(e => e.score !== null).reduce((sum, e) => sum + e.score, 0) / (ujianSelesai || 1);
                          const ekskulCount = session.extracurriculars?.length || 0;
                          const portoCount = session.portfolios?.length || 0;
                          const stats = [
                            { label: "Kehadiran", value: `${percent}%`, detail: `${hadir}/${total} hari hadir`, color: "#22c55e", icon: "📅" },
                            { label: "Ujian Selesai", value: `${ujianSelesai}/${totalUjian}`, detail: ujianSelesai > 0 ? `Rata-rata: ${Math.round(avgScore)}` : "Belum ada", color: "#3b82f6", icon: "📝" },
                            { label: "Ekskul Diikuti", value: ekskulCount, detail: ekskulCount > 0 ? (session.extracurriculars || []).join(", ") : "Belum bergabung", color: "#f59e0b", icon: "⚽" },
                            { label: "Portofolio", value: portoCount, detail: "Karya diunggah", color: "#a855f7", icon: "🎨" },
                            { label: "Alfa", value: alfa, detail: "Hari tidak hadir", color: alfa > 3 ? "#ef4444" : "#64748b", icon: "⚠️" },
                          ];
                          return (
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "1rem" }}>
                              {stats.map((s, i) => (
                                <div key={i} style={{ padding: "1rem", borderRadius: "8px", border: "1px solid #f1f5f9", background: "#fafafa", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                                  <div style={{ fontSize: "1.2rem" }}>{s.icon}</div>
                                  <div style={{ fontSize: "1.6rem", fontWeight: 900, color: s.color }}>{s.value}</div>
                                  <div style={{ fontWeight: 700, color: "var(--primary-dark)", fontSize: "0.85rem" }}>{s.label}</div>
                                  <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "0.1rem" }}>{s.detail}</div>
                                </div>
                              ))}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                )}

                {/* === TAB: PERPUSTAKAAN DIGITAL === */}
                {activeTab === "perpustakaan" && (
                  <DigitalLibraryViewer />
                )}

              </main>
            </div>
          )}


          {session && view === "exam" && (
            <section className="section" style={{ padding: "3rem 0" }}>
              <div className="portal-content" style={{ maxWidth: "1200px", margin: "0 auto" }}>
                
                {/* Header Ujian */}
                <div className="quiz-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "var(--bg-alt)", padding: "1.25rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", marginBottom: "2rem" }}>
                  <div>
                    <h3 style={{ fontWeight: 800, color: "var(--primary-dark)", margin: 0 }}>
                      Mengerjakan: {activeExam?.category} {activeExam?.subject} (Smt {activeExam?.semester})
                    </h3>
                    <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Pilih nomor soal di panel kanan untuk menavigasi.</span>
                  </div>
                  <div className="timer-box" id="siswa-quiz-timer" style={{ backgroundColor: "#fee2e2", color: "#ef4444", fontWeight: "bold", padding: "0.5rem 1rem", borderRadius: "var(--radius-sm)", border: "1px solid #fca5a5", display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    Sisa Waktu: {formatTime(timeLeft)}
                  </div>
                </div>

                {/* Grid Layout Utama CBT Dekstop */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "2rem", alignItems: "start" }}>
                  
                  {/* Kolom Kiri: Pertanyaan Aktif */}
                  <div>
                    {(() => {
                      const q = questions[activeQuestionIdx];
                      if (!q) return <p>Tidak ada soal.</p>;
                      return (
                        <div className="quiz-question-card" style={{ border: "1px solid var(--border-color)", padding: "2rem", borderRadius: "var(--radius-lg)", backgroundColor: "white", boxShadow: "var(--shadow-sm)" }}>
                          
                          {/* Header Pertanyaan Card */}
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", borderBottom: "1px solid var(--border-color)", paddingBottom: "0.75rem" }}>
                            <span style={{ fontWeight: 800, color: "var(--primary)", fontSize: "1.1rem" }}>
                              Soal Nomor {activeQuestionIdx + 1} dari {questions.length}
                            </span>
                            <span style={{ fontSize: "0.75rem", fontWeight: "bold", padding: "0.25rem 0.5rem", borderRadius: "4px", backgroundColor: q.type === "PG" ? "#e0f2fe" : q.type === "PGK" ? "#dcfce7" : q.type === "MENJODOHKAN" ? "#fef3c7" : q.type === "ISIAN" ? "#ecfdf5" : "#e0e7ff", color: q.type === "PG" ? "#0369a1" : q.type === "PGK" ? "#15803d" : q.type === "MENJODOHKAN" ? "#b45309" : q.type === "ISIAN" ? "#047857" : "#4338ca" }}>
                              {q.type === "PG" ? "Pilihan Ganda" : q.type === "PGK" ? "Pilihan Ganda Kompleks" : q.type === "MENJODOHKAN" ? "Menjodohkan" : q.type === "ISIAN" ? "Isian Singkat" : "Essay / Uraian"}
                            </span>
                          </div>

                          {/* Konten Soal (Split jika grup, normal jika tidak) */}
                          {(q.groupText || q.groupImagePath) ? (
                            <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: "2rem", marginTop: "1rem" }}>
                              {/* Panel Kiri: Bacaan Acuan */}
                              <div style={{ borderRight: "1px solid var(--border-color)", paddingRight: "1.5rem", maxHeight: "550px", overflowY: "auto" }}>
                                <span style={{ fontSize: "0.8rem", textTransform: "uppercase", fontWeight: "bold", color: "var(--secondary)", display: "inline-flex", alignItems: "center", gap: "0.3rem", marginBottom: "0.75rem", letterSpacing: "0.5px" }}>
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                    <polyline points="14 2 14 8 20 8" />
                                    <line x1="16" y1="13" x2="8" y2="13" />
                                    <line x1="16" y1="17" x2="8" y2="17" />
                                    <line x1="10" y1="9" x2="9" y2="9" />
                                  </svg>
                                  Informasi / Bacaan Acuan
                                </span>
                                {q.groupImagePath && (
                                  <div style={{ marginBottom: "1rem", textAlign: "center" }}>
                                    <img src={q.groupImagePath} alt="Stimulus" style={{ maxWidth: "100%", maxHeight: "250px", objectFit: "contain", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }} />
                                  </div>
                                )}
                                {q.groupText && (
                                  <div style={{ fontSize: "0.98rem", lineHeight: "1.6", color: "var(--text-color)", whiteSpace: "pre-wrap", textAlign: "justify" }}>
                                    {q.groupText}
                                  </div>
                                )}
                              </div>
                              
                              {/* Panel Kanan: Pertanyaan & Input */}
                              <div>
                                {renderQuestionDetails(q)}
                              </div>
                            </div>
                          ) : (
                            /* Layout Reguler (Satu Kolom Penuh) */
                            renderQuestionDetails(q)
                          )}

                          {/* Tombol Navigasi Bawah */}
                          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "2.5rem", borderTop: "1px solid var(--border-color)", paddingTop: "1.5rem" }}>
                            <button 
                              type="button" 
                              className="btn btn-outline" 
                              disabled={activeQuestionIdx === 0}
                              onClick={() => setActiveQuestionIdx(prev => Math.max(0, prev - 1))}
                            >
                              ⬅️ Soal Sebelumnya
                            </button>
                            <button 
                              type="button" 
                              className="btn btn-primary"
                              disabled={activeQuestionIdx === questions.length - 1}
                              onClick={() => setActiveQuestionIdx(prev => Math.min(questions.length - 1, prev + 1))}
                            >
                              Soal Lanjut ➡️
                            </button>
                          </div>

                        </div>
                      );
                    })()}
                  </div>

                  {/* Kolom Kanan: Navigasi Soal / Nomor Grid */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                    
                    {/* Grid Navigasi Nomor */}
                    <div style={{ backgroundColor: "white", border: "1px solid var(--border-color)", borderRadius: "var(--radius-lg)", padding: "1.5rem", boxShadow: "var(--shadow-sm)" }}>
                      <h4 style={{ margin: "0 0 1rem 0", fontWeight: 800, color: "var(--primary-dark)", fontSize: "0.95rem" }}>
                        📌 Navigasi Soal Ujian
                      </h4>
                      
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "0.5rem" }}>
                        {questions.map((q, idx) => {
                          const isCurrent = idx === activeQuestionIdx;
                          const ans = answers[q.id];
                          const isAnswered = ans !== undefined && ans !== "" && (typeof ans !== "object" || Object.keys(ans).length > 0) && (Array.isArray(ans) ? ans.length > 0 : true);
                          
                          return (
                            <button
                              key={q.id}
                              type="button"
                              onClick={() => setActiveQuestionIdx(idx)}
                              style={{
                                height: "42px",
                                width: "100%",
                                borderRadius: "var(--radius-sm)",
                                border: isCurrent ? "2px solid var(--primary)" : "1px solid var(--border-color)",
                                backgroundColor: isCurrent ? "var(--primary-light)" : isAnswered ? "#22c55e" : "#f8fafc",
                                color: isCurrent ? "var(--primary-dark)" : isAnswered ? "white" : "var(--text-main)",
                                fontWeight: "bold",
                                fontSize: "0.9rem",
                                cursor: "pointer",
                                transition: "all 0.2s",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center"
                              }}
                            >
                              <span style={{ margin: "0 auto" }}>{idx + 1}</span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Legenda Warna */}
                      <div style={{ display: "flex", gap: "1rem", marginTop: "1.25rem", fontSize: "0.75rem", borderTop: "1px solid var(--border-color)", paddingTop: "0.75rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                          <span style={{ width: "12px", height: "12px", borderRadius: "3px", backgroundColor: "#22c55e" }}></span>
                          <span>Sudah Diisi</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                          <span style={{ width: "12px", height: "12px", borderRadius: "3px", backgroundColor: "#f8fafc", border: "1px solid var(--border-color)" }}></span>
                          <span>Belum Diisi</span>
                        </div>
                      </div>
                    </div>

                    {/* Panel Unggah Lembar Jawaban Eksternal (Opsional) */}
                    <div style={{ backgroundColor: "white", border: "1px solid var(--border-color)", borderRadius: "var(--radius-lg)", padding: "1.5rem", boxShadow: "var(--shadow-sm)" }}>
                      <h4 style={{ margin: "0 0 0.5rem 0", fontWeight: 800, color: "var(--primary-dark)", fontSize: "0.95rem" }}>
                        📤 Unggah Berkas Jawaban
                      </h4>
                      <p style={{ margin: "0 0 0.75rem 0", fontSize: "0.78rem", color: "var(--text-muted)", lineHeight: "1.4" }}>
                        Unggah foto hasil cakar atau berkas lembar pengerjaan PDF (opsional):
                      </p>
                      <input 
                        type="file" 
                        className="form-input" 
                        style={{ padding: "0.35rem 0.5rem", fontSize: "0.8rem", width: "100%", backgroundColor: "#f8fafc" }} 
                        onChange={(e) => setStudentAnswerFile(e.target.files?.[0] || null)}
                      />
                    </div>

                    {/* Tombol Batal & Selesai */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                      <button 
                        type="button" 
                        className="btn btn-primary" 
                        style={{ width: "100%", height: "40px", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "0.4rem" }}
                        onClick={() => submitExam(false)}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        Serahkan Jawaban
                      </button>
                      <button 
                        type="button" 
                        className="btn btn-outline" 
                        style={{ width: "100%", height: "40px", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "0.4rem" }}
                        onClick={cancelExam}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                        Batalkan Ujian
                      </button>
                    </div>

                  </div>

                </div>

              </div>
            </section>
          )}

          {/* 4. SUCCESS SUBMISSION SHEET */}
          {session && view === "success" && (
            <section className="section" style={{ padding: "3rem 0" }}>
              <div className="portal-content" style={{ maxWidth: "900px", margin: "0 auto" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", paddingBottom: "1rem", borderBottom: "2px solid var(--bg-alt)" }}>
                  <div>
                    <span style={{ fontSize: "0.85rem", textTransform: "uppercase", fontWeight: 700, color: "var(--secondary)" }}>SPEKTRA – Sistem Portal Elektronik Akademik</span>
                    <h2 style={{ fontSize: "1.5rem", color: "var(--primary-dark)", fontWeight: 800 }}>Ujian Selesai</h2>
                  </div>
                  <button className="btn btn-outline" style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }} onClick={handleLogout}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    Keluar Portal
                  </button>
                </div>

                <div style={{ backgroundColor: "var(--primary-light)", color: "var(--primary-dark)", padding: "1.5rem", borderRadius: "var(--radius-md)", borderLeft: "5px solid var(--primary)", marginBottom: "2.5rem" }}>
                  <h3 style={{ fontWeight: 700, fontSize: "1.1rem", marginBottom: "0.25rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="16" x2="12" y2="12" />
                      <line x1="12" y1="8" x2="12.01" y2="8" />
                    </svg>
                    Informasi Hasil Ujian
                  </h3>
                  <p style={{ fontSize: "0.9rem", lineHeight: "1.6" }}>
                    Terima kasih. Anda telah menyelesaikan pengerjaan ujian online. Nilai Anda telah terekam ke database cloud sekolah dan akan otomatis muncul pada Lembar Rapor Hasil Belajar yang dapat dicetak oleh Wali Kelas di Portal Guru.
                  </p>
                </div>

                <div style={{ textAlign: "center", padding: "2rem", border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)" }}>
                  <span style={{ fontSize: "3rem" }}>🎉</span>
                  <h3 style={{ fontWeight: 800, marginTop: "1rem", color: "var(--primary-dark)" }}>Ujian Berhasil Diserahkan!</h3>
                  <p style={{ color: "var(--text-muted)" }}>Skor ujian Anda: <strong>{examScore}</strong></p>
                  <button className="btn btn-primary" style={{ marginTop: "1.5rem" }} onClick={() => setView("dashboard")}>
                    Kembali Ke Beranda Ujian
                  </button>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>


      
      {/* Modal Peringatan Anti-Cheat */}
      {showWarningModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.8)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ backgroundColor: "white", borderRadius: "var(--radius-md)", width: "100%", maxWidth: "450px", padding: "2rem", boxShadow: "var(--shadow-lg)", textAlign: "center", borderTop: "5px solid #ef4444" }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>⚠️</div>
            <h3 style={{ margin: 0, color: "#ef4444", fontWeight: 800, fontSize: "1.25rem", marginBottom: "1rem" }}>PERINGATAN PELANGGARAN!</h3>
            <p style={{ color: "var(--text-main)", marginBottom: "1.5rem", lineHeight: "1.5" }}>
              Anda terdeteksi meninggalkan halaman ujian (pindah tab atau membuka aplikasi lain).<br/><br/>
              Ini adalah peringatan ke-<strong>{warnings}</strong> dari maksimal 3 peringatan.<br/>
              Jika Anda melanggar sebanyak 4 kali, ujian akan dihentikan secara otomatis!
            </p>
            <button className="btn btn-primary" style={{ width: "100%", backgroundColor: "#ef4444", borderColor: "#ef4444" }} onClick={() => setShowWarningModal(false)}>
              Saya Mengerti & Kembali ke Ujian
            </button>
          </div>
        </div>
      )}

      {/* Modal Unggah Portofolio */}
      {showPortfolioModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ backgroundColor: "white", borderRadius: "var(--radius-md)", width: "100%", maxWidth: "500px", padding: "2rem", boxShadow: "var(--shadow-lg)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h3 style={{ margin: 0, color: "var(--primary-dark)" }}>Unggah Karya DKV</h3>
              <button onClick={() => setShowPortfolioModal(false)} style={{ background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer", color: "var(--text-muted)" }}>&times;</button>
            </div>
            
            <form onSubmit={handlePortfolioUpload}>
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold", fontSize: "0.9rem" }}>Judul Karya</label>
                <input type="text" className="input" value={portfolioTitle} onChange={e => setPortfolioTitle(e.target.value)} required placeholder="Contoh: Desain Logo Cafe" />
              </div>
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold", fontSize: "0.9rem" }}>Kategori</label>
                <select className="input" value={portfolioCategory} onChange={e => setPortfolioCategory(e.target.value)}>
                  <option value="Desain Grafis">Desain Grafis (Poster, Logo, dll)</option>
                  <option value="Ilustrasi">Ilustrasi / Nirmana</option>
                  <option value="Fotografi">Fotografi</option>
                  <option value="Videografi">Videografi / Animasi</option>
                  <option value="UI/UX">UI/UX Web & Mobile</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold", fontSize: "0.9rem" }}>Deskripsi Singkat (Opsional)</label>
                <textarea className="input" value={portfolioDesc} onChange={e => setPortfolioDesc(e.target.value)} rows="3" placeholder="Jelaskan sedikit tentang karya ini..."></textarea>
              </div>
              <div style={{ marginBottom: "1.5rem" }}>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold", fontSize: "0.9rem" }}>File Karya</label>
                <input type="url" className="input" value={portfolioFile || ""} onChange={e => setPortfolioFile(e.target.value)} required placeholder="Masukkan Link Karya (Google Drive / Instagram / Behance)" style={{ padding: "0.5rem" }} />
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.25rem", display: "block" }}>Pastikan link (Google Drive / sosmed) bisa diakses publik.</span>
              </div>
              <div style={{ display: "flex", gap: "1rem" }}>
                <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setShowPortfolioModal(false)}>Batal</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={portfolioUploading}>
                  {portfolioUploading ? "Mengunggah..." : "Unggah Karya"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

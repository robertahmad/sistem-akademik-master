"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import * as XLSX from 'xlsx';
import { getTryOutPackages, createTryOutPackage, updateTryOutPackageStatus, deleteTryOutPackage, getUcoQuestions, addUcoQuestion, deleteUcoQuestion, getUcoSubmissions, gradeUcoSubmission, editTryOutPackage } from '@/app/actions/tryout';
import { getTeacherDashboard } from '@/app/actions/guru';

export default function TryOutGuru() {
  const [session, setSession] = useState(null);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [editPkgId, setEditPkgId] = useState(null);
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [duration, setDuration] = useState('120');

  // Detail package states
  const [selectedPkg, setSelectedPkg] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [activeTab, setActiveTab] = useState('soal');
  const [submissions, setSubmissions] = useState([]);
  const [essayScores, setEssayScores] = useState({});
  
  // New Question states
  const [showQForm, setShowQForm] = useState(false);
  const [subject, setSubject] = useState('');
  const [qText, setQText] = useState('');
  const [qChoices, setQChoices] = useState(['', '', '', '']);
  const [qCorrect, setQCorrect] = useState(0);



  useEffect(() => {
    loadPackages();
  }, []);

  async function loadPackages() {
    setLoading(true);
    const sessionRes = await getTeacherDashboard();
    if (!sessionRes || !sessionRes.success) {
      window.location.href = '/portal/guru';
      return;
    }
    setSession(sessionRes.teacher);
    
    const res = await getTryOutPackages("SMK", "XII");
    setPackages(res || []);
    setLoading(false);
  }

    const handleCreatePackage = async (e) => {
    e.preventDefault();
    if (editPkgId) {
      await editTryOutPackage(editPkgId, { title, startDate: new Date(startDate), endDate: new Date(endDate), duration });
    } else {
      await createTryOutPackage({ title, startDate: new Date(startDate), endDate: new Date(endDate), duration });
    }
    setTitle(''); setStartDate(''); setEndDate(''); setDuration('120');
    setShowForm(false);
    setEditPkgId(null);
    loadPackages();
  };

  const handleEditClick = (e, pkg) => {
    e.stopPropagation();
    setEditPkgId(pkg.id);
    setTitle(pkg.title);
    
    // Format dates for datetime-local input (YYYY-MM-DDTHH:mm)
    const formatLocal = (date) => {
      const d = new Date(date);
      d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
      return d.toISOString().slice(0, 16);
    };
    
    setStartDate(formatLocal(pkg.startDate));
    setEndDate(formatLocal(pkg.endDate));
    setDuration(pkg.duration);
    setShowForm(true);
  };

  const handleDeleteClick = async (e, pkgId) => {
    e.stopPropagation();
    if (confirm('Apakah Anda yakin ingin menghapus paket try out ini beserta seluruh data soalnya?')) {
      await deleteTryOutPackage(pkgId);
      loadPackages();
    }
  };

  const handleManage = async (pkg) => {
    setSelectedPkg(pkg);
    setActiveTab('soal');
    const q = await getUcoQuestions(pkg.id);
    setQuestions(q || []);
  };

  const handleLoadSubmissions = async () => {
    const subs = await getUcoSubmissions(selectedPkg.id);
    setSubmissions(subs || []);
    setActiveTab('hasil');
  };

  const handleGradeEssay = async (submissionId) => {
    const score = essayScores[submissionId];
    if (score === undefined || score === '') return alert('Masukkan nilai terlebih dahulu!');
    if (isNaN(score) || score < 0 || score > 100) return alert('Nilai harus antara 0 - 100');
    await gradeUcoSubmission(submissionId, parseInt(score, 10));
    alert('Nilai berhasil disimpan!');
    // reload submissions
    const subs = await getUcoSubmissions(selectedPkg.id);
    setSubmissions(subs || []);
  };

  const handleAddQuestion = async (e) => {
    e.preventDefault();
    if (!subject || !qText || qChoices.some(c => !c)) return alert("Isi semua data soal dan opsi!");
    await addUcoQuestion({
      packageId: selectedPkg.id,
      subject,
      question: qText,
      choices: qChoices,
      correct: parseInt(qCorrect, 10),
    });
    setShowQForm(false);
    setSubject('');
    setQText('');
    setQChoices(['', '', '', '']);
    // reload questions
    const q = await getUcoQuestions(selectedPkg.id);
    setQuestions(q || []);
  };

  const handleDeleteQ = async (id) => {
    if (!confirm("Hapus soal?")) return;
    await deleteUcoQuestion(id);
    const q = await getUcoQuestions(selectedPkg.id);
    setQuestions(q || []);
  };

  const handleChangeStatus = async (id, status) => {
    await updateTryOutPackageStatus(id, status);
    loadPackages();
    if (selectedPkg && selectedPkg.id === id) {
      setSelectedPkg({ ...selectedPkg, status });
    }
  };

  const handleDownloadTemplate = () => {
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
        "Mata Pelajaran"
      ]
    ];
    const sampleData = [
      [
        "Siapa penemu lampu pijar?", "PG", "Thomas Edison", "Albert Einstein", "Isaac Newton", "Galileo", "A", "", "", "", "", "Bahasa Indonesia"
      ]
    ];
    const ws = XLSX.utils.aoa_to_sheet(headers.concat(sampleData));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Soal UCO");
    XLSX.writeFile(wb, "Template_Soal_UCO.xlsx");
  };

  const handleUploadTemplate = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonRows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

        if (jsonRows.length === 0) {
          alert("File kosong!");
          return;
        }

        setLoading(true);
        for (const row of jsonRows) {
          const getValueByHeader = (headersList) => {
            for (let key in row) {
              if (headersList.some(h => key.trim().toLowerCase() === h.trim().toLowerCase())) {
                return row[key];
              }
            }
            return "";
          };

          const question = getValueByHeader(["Pertanyaan", "soal", "question"]);
          const type = String(getValueByHeader(["Tipe Soal (PG/PGK/MENJODOHKAN/ISIAN/ESSAY)", "Tipe Soal", "type"])).toUpperCase().trim() || "PG";
          const pA = String(getValueByHeader(["Pilihan A", "Opsi A"]));
          const pB = String(getValueByHeader(["Pilihan B", "Opsi B"]));
          const pC = String(getValueByHeader(["Pilihan C", "Opsi C"]));
          const pD = String(getValueByHeader(["Pilihan D", "Opsi D"]));
          const keyPg = String(getValueByHeader(["Kunci PG (A/B/C/D)", "Kunci PG"])).toUpperCase().trim();
          const keyPgk = String(getValueByHeader(["Kunci PGK (Contoh: A, C)", "Kunci PGK", "Kunci Kompleks"]));
          const matchLeftRaw = String(getValueByHeader(["Menjodohkan Kiri (Pisah Koma)", "Menjodohkan Kiri", "Kiri"]));
          const matchRightRaw = String(getValueByHeader(["Menjodohkan Kanan (Pisah Koma)", "Menjodohkan Kanan", "Kanan"]));
          const answerText = String(getValueByHeader(["Kunci Jawaban Singkat / Uraian", "Kunci Jawaban", "Kunci"]));
          const subject = String(getValueByHeader(["Mata Pelajaran", "Mapel", "Subject"])) || "Mata Pelajaran Umum";
          
          if (!question) continue;

          let correct = 0;
          if (keyPg === 'B') correct = 1;
          else if (keyPg === 'C') correct = 2;
          else if (keyPg === 'D') correct = 3;

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

          await addUcoQuestion({
            packageId: selectedPkg.id,
            subject,
            question,
            type,
            choices: [pA, pB, pC, pD].filter(c => c), // Only include non-empty choices
            correct,
            correctChoices,
            matchingLeft,
            matchingRight,
            correctAnswer: answerText
          });
        }
        
        const q = await getUcoQuestions(selectedPkg.id);
        setQuestions(q || []);
        setLoading(false);
        alert(`Berhasil mengimpor soal!`);
      } catch (err) {
        console.error(err);
        setLoading(false);
        alert("Terjadi kesalahan saat memproses file Excel.");
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = null; // reset input
  };

  if (!session || loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Memuat...</div>;

  return (
    <div style={{ backgroundColor: '#f0fdfa', minHeight: '100vh', padding: '2rem', fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto', background: '#fff', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
        
        {/* Header */}
        <div style={{ padding: '1.5rem 2rem', background: 'linear-gradient(135deg, #0f766e 0%, #0d9488 100%)', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>Manajemen Try Out (UCO)</h1>
            <p style={{ margin: '5px 0 0 0', opacity: 0.9 }}>Portal Guru SMK Kelas XII</p>
          </div>
          <Link href="/portal/guru" style={{ color: '#fff', textDecoration: 'none', background: 'rgba(255,255,255,0.2)', padding: '0.5rem 1rem', borderRadius: '8px', fontWeight: 'bold' }}>
            Kembali ke Portal
          </Link>
        </div>

        <div style={{ padding: '2rem' }}>
          {selectedPkg ? (
            <div>
              {/* Package Detail */}
              <button onClick={() => setSelectedPkg(null)} style={{ background: 'none', border: 'none', color: '#0f766e', cursor: 'pointer', fontWeight: 'bold', marginBottom: '1rem', padding: 0 }}>&larr; Kembali ke Daftar Paket</button>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '2px solid #e2e8f0' }}>
                <div>
                  <h2 style={{ margin: 0, color: '#1e293b' }}>{selectedPkg.title}</h2>
                  <p style={{ margin: '5px 0 0 0', color: '#64748b', fontSize: '0.9rem' }}>
                    Status: <span style={{ fontWeight: 'bold', color: selectedPkg.status === 'PUBLISHED' ? '#10b981' : '#f59e0b' }}>{selectedPkg.status}</span>
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {selectedPkg.status === 'DRAFT' && (
                    <button onClick={() => handleChangeStatus(selectedPkg.id, 'PUBLISHED')} style={{ background: '#10b981', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Publish Ujian</button>
                  )}
                  {selectedPkg.status === 'PUBLISHED' && (
                    <button onClick={() => handleChangeStatus(selectedPkg.id, 'CLOSED')} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Tutup Ujian</button>
                  )}
                </div>
              </div>

              {/* Tabs */}
              <div style={{ display: 'flex', borderBottom: '2px solid #e2e8f0', marginBottom: '1.5rem' }}>
                <button
                  onClick={() => setActiveTab('soal')}
                  style={{ padding: '0.75rem 1.5rem', fontWeight: 'bold', cursor: 'pointer', border: 'none', background: 'none', borderBottom: activeTab === 'soal' ? '3px solid #0f766e' : '3px solid transparent', color: activeTab === 'soal' ? '#0f766e' : '#64748b' }}
                >Bank Soal ({questions.length})</button>
                <button
                  onClick={handleLoadSubmissions}
                  style={{ padding: '0.75rem 1.5rem', fontWeight: 'bold', cursor: 'pointer', border: 'none', background: 'none', borderBottom: activeTab === 'hasil' ? '3px solid #7c3aed' : '3px solid transparent', color: activeTab === 'hasil' ? '#7c3aed' : '#64748b' }}
                >Hasil Siswa</button>
              </div>

              {/* === TAB: BANK SOAL === */}
              {activeTab === 'soal' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem', gap: '0.5rem' }}>
                    <button onClick={handleDownloadTemplate} style={{ background: '#f8fafc', color: '#0f766e', border: '1px solid #0f766e', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                      Unduh Template
                    </button>
                    <label style={{ background: '#10b981', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                      Unggah Excel
                      <input type="file" accept=".xlsx, .xls" onChange={handleUploadTemplate} style={{ display: 'none' }} />
                    </label>
                    <button onClick={() => setShowQForm(!showQForm)} style={{ background: '#0ea5e9', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                      + Tambah Soal Manual
                    </button>
                  </div>

                  {showQForm && (
                    <form onSubmit={handleAddQuestion} style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid #cbd5e1' }}>
                      <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#475569' }}>Mata Pelajaran</label>
                        <input type="text" value={subject} onChange={e => setSubject(e.target.value)} required style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                      </div>
                      <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#475569' }}>Pertanyaan</label>
                        <textarea value={qText} onChange={e => setQText(e.target.value)} required rows="3" style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                      </div>
                      <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#475569' }}>Pilihan Jawaban (A, B, C, D) — Pilih yang benar</label>
                        {qChoices.map((choice, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem', gap: '0.5rem' }}>
                            <input type="radio" name="correct" checked={qCorrect === i} onChange={() => setQCorrect(i)} />
                            <input type="text" value={choice} onChange={e => {
                              const newC = [...qChoices];
                              newC[i] = e.target.value;
                              setQChoices(newC);
                            }} placeholder={`Opsi ${String.fromCharCode(65 + i)}`} required style={{ flex: 1, padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                          </div>
                        ))}
                      </div>
                      <button type="submit" style={{ background: '#0d9488', color: '#fff', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Simpan Soal</button>
                    </form>
                  )}

                  {questions.length === 0 ? (
                    <p style={{ color: '#64748b', fontStyle: 'italic', textAlign: 'center', padding: '2rem' }}>Belum ada soal. Unggah via Excel atau tambah manual.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {questions.map((q, i) => (
                        <div key={q.id} style={{ padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                              <span style={{ fontWeight: 'bold', color: '#0ea5e9' }}>{q.subject}</span>
                              <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.4rem', borderRadius: '4px', background: '#f0fdf4', color: '#15803d', fontWeight: 'bold' }}>{q.type || 'PG'}</span>
                            </div>
                            <button onClick={() => handleDeleteQ(q.id)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>Hapus</button>
                          </div>
                          <p style={{ margin: '0 0 0.5rem 0', fontWeight: '500' }}>{i + 1}. {q.question}</p>
                          {q.choices && q.choices.length > 0 && (
                            <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#475569' }}>
                              {q.choices.map((c, idx) => (
                                <li key={idx} style={{ fontWeight: q.correct === idx ? 'bold' : 'normal', color: q.correct === idx ? '#10b981' : 'inherit' }}>
                                  {c} {q.correct === idx && '✓'}
                                </li>
                              ))}
                            </ul>
                          )}
                          {q.matchingLeft && q.matchingLeft.length > 0 && (
                            <div style={{ fontSize: '0.85rem', color: '#475569' }}>Menjodohkan: {q.matchingLeft.join(', ')} ↔ {q.matchingRight && q.matchingRight.join(', ')}</div>
                          )}
                          {(q.type === 'ISIAN' || q.type === 'ESSAY') && q.correctAnswer && (
                            <div style={{ fontSize: '0.85rem', color: '#059669' }}>Kunci: {q.correctAnswer}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* === TAB: HASIL SISWA === */}
              {activeTab === 'hasil' && (
                <div>
                  {submissions.length === 0 ? (
                    <p style={{ color: '#64748b', fontStyle: 'italic', textAlign: 'center', padding: '2rem', border: '1px dashed #cbd5e1', borderRadius: '8px' }}>Belum ada siswa yang mengumpulkan jawaban untuk paket ini.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {/* Group by student */}
                      {Array.from(new Set(submissions.map(s => s.studentNisn))).map(nisn => {
                        const studentSubs = submissions.filter(s => s.studentNisn === nisn);
                        const studentName = studentSubs[0]?.student?.name || nisn;
                        const hasEssay = questions.some(q => q.type === 'ESSAY');
                        return (
                          <div key={nisn} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                            <div style={{ background: '#f8fafc', padding: '1rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div>
                                <div style={{ fontWeight: 'bold', color: '#1e293b' }}>{studentName}</div>
                                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>NISN: {nisn}</div>
                              </div>
                            </div>
                            <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                              {studentSubs.map(sub => (
                                <div key={sub.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', background: '#fff', border: '1px solid #f1f5f9', borderRadius: '6px' }}>
                                  <div>
                                    <span style={{ fontWeight: 'bold', color: '#334155' }}>{sub.subjectName}</span>
                                    <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Dikumpulkan: {new Date(sub.createdAt).toLocaleString('id-ID')}</div>
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: sub.score >= 75 ? '#16a34a' : sub.score >= 50 ? '#d97706' : '#dc2626' }}>{sub.score}</span>
                                    {hasEssay && (
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <input
                                          type="number" min="0" max="100"
                                          placeholder="Nilai Essay"
                                          value={essayScores[sub.id] !== undefined ? essayScores[sub.id] : ''}
                                          onChange={e => setEssayScores(prev => ({ ...prev, [sub.id]: e.target.value }))}
                                          style={{ width: '90px', padding: '0.4rem 0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.9rem' }}
                                        />
                                        <button
                                          onClick={() => handleGradeEssay(sub.id)}
                                          style={{ background: '#7c3aed', color: '#fff', border: 'none', padding: '0.4rem 0.75rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem' }}
                                        >Simpan</button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

            </div>
          ) : (
            <div>
              {/* Packages List */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ margin: 0, color: '#1e293b' }}>Daftar Paket UCO</h2>
                <button onClick={() => { setShowForm(!showForm); if(showForm) { setEditPkgId(null); setTitle(''); setStartDate(''); setEndDate(''); setDuration('120'); } }} style={{ background: '#0ea5e9', color: '#fff', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                  {editPkgId ? 'Batal Edit' : '+ Buat Paket UCO'}
                </button>
              </div>

              {showForm && (
                <form onSubmit={handleCreatePackage} style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid #cbd5e1' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    <div style={{ gridColumn: 'span 2' }}>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#475569' }}>Nama Paket</label>
                      <input type="text" value={title} onChange={e => setTitle(e.target.value)} required placeholder="Misal: Try Out UNBK 1" style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#475569' }}>Waktu Mulai</label>
                      <input type="datetime-local" value={startDate} onChange={e => setStartDate(e.target.value)} required style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#475569' }}>Waktu Selesai</label>
                      <input type="datetime-local" value={endDate} onChange={e => setEndDate(e.target.value)} required style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                    </div>
                    <div style={{ gridColumn: 'span 2' }}>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#475569' }}>Durasi Pengerjaan (Menit)</label>
                      <input type="number" value={duration} onChange={e => setDuration(e.target.value)} required min="10" style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                    </div>
                  </div>
                  <button type="submit" style={{ background: '#0d9488', color: '#fff', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', width: '100%' }}>Simpan Paket</button>
                </form>
              )}

              {packages.length === 0 ? (
                <p style={{ color: '#64748b', fontStyle: 'italic', textAlign: 'center', padding: '2rem', border: '1px dashed #cbd5e1', borderRadius: '8px' }}>Belum ada paket Try Out. Silakan buat baru.</p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                  {packages.map(pkg => (
                                          <div key={pkg.id} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1.5rem', background: '#fff', transition: 'transform 0.2s', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', position: 'relative' }} onClick={() => handleManage(pkg)}>
                        <div style={{ position: 'absolute', top: '1rem', right: '1rem', display: 'flex', gap: '0.5rem' }}>
                           <button onClick={(e) => handleEditClick(e, pkg)} style={{ background: '#f59e0b', color: '#fff', border: 'none', padding: '0.3rem 0.6rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold' }}>Edit</button>
                           <button onClick={(e) => handleDeleteClick(e, pkg.id)} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '0.3rem 0.6rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold' }}>Hapus</button>
                        </div>
                        <h3 style={{ margin: '0 0 0.5rem 0', color: '#0f766e', paddingRight: '100px' }}>{pkg.title}</h3>
                      <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.85rem', color: '#64748b' }}>Mulai: {new Date(pkg.startDate).toLocaleString('id-ID')}</p>
                      <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.85rem', color: '#64748b' }}>Durasi: {pkg.duration} Menit</p>
                      <span style={{ display: 'inline-block', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', background: pkg.status === 'PUBLISHED' ? '#d1fae5' : pkg.status === 'CLOSED' ? '#fee2e2' : '#fef3c7', color: pkg.status === 'PUBLISHED' ? '#047857' : pkg.status === 'CLOSED' ? '#b91c1c' : '#d97706' }}>
                        {pkg.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


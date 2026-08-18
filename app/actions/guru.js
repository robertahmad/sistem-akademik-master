"use server";

import prisma from "../../lib/prisma";
import { getSession, setSession } from "../../lib/auth";
import { put } from '@vercel/blob';

function getStudentActiveSemester(kelas, schoolSemester) {
  const normKelas = (kelas || "").trim().toLowerCase();
  let level = 10; // Default SMK: kelas X

  // Deteksi XII dulu sebelum XI, dan XI sebelum X agar tidak salah match
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

export async function getTeacherDashboard() {
  try {
    const session = await getSession();
    if (!session || (session.role !== "wali-kelas" && session.role !== "guru-mapel")) {
      return { success: false, error: "Unauthorized" };
    }

    // Jalankan semua query secara paralel untuk performa lebih cepat
    const [school, subjectsList, questions, students, teachers, extracurriculars, dbTeacher] = await Promise.all([
      prisma.school.findFirst({ where: { id: 1 } }),
      prisma.subject.findMany({ orderBy: { name: "asc" } }),
      prisma.question.findMany({
        where: { subject: { in: session.subjects } },
        orderBy: { id: "asc" }
      }),
      // examSubmissions dihapus dari sini karena sangat berat — diambil on-demand
      prisma.student.findMany({
        include: {
          grades: true,
          extracurricularGrades: true,
          raporRecords: true,
          portfolios: true
        },
        orderBy: { name: "asc" }
      }),
      prisma.teacher.findMany({
        select: { name: true, nip: true, role: true, kelas: true }
      }),
      prisma.extracurricular.findMany({ orderBy: { name: "asc" } }),
      prisma.teacher.findUnique({ where: { id: session.id } })
    ]);

    const updatedTeacherSession = {
      ...session,
      isBendahara: dbTeacher ? dbTeacher.isBendahara : false,
      foto: dbTeacher ? dbTeacher.foto : session.foto,
      jamMengajar: dbTeacher ? dbTeacher.jamMengajar : 0,
      extracurriculars: dbTeacher ? (dbTeacher.extracurriculars || []) : []
    };

    return {
      success: true,
      teacher: updatedTeacherSession,
      school,
      subjects: subjectsList,
      questions,
      students,
      teachers,
      extracurriculars
    };
  } catch (e) {
    console.error("Error in getTeacherDashboard:", e);
    return { success: false, error: e.message || "Gagal mengambil data dashboard guru." };
  }
}

export async function saveTeacherKkmAndCp(subjectName, semester, kkm, cpA, cpB, cpC, cpD) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "wali-kelas" && session.role !== "guru-mapel")) {
      return { success: false, error: "Unauthorized" };
    }

    const currentSubject = await prisma.subject.findUnique({ where: { name: subjectName } });
    if (!currentSubject) return { success: false, error: "Mata pelajaran tidak ditemukan" };

    let currentCps = currentSubject.cps || {};
    if (typeof currentCps !== "object") currentCps = {};

    const updatedCps = {
      ...currentCps,
      [semester]: { cpA, cpB, cpC, cpD }
    };

    const updateData = {
      kkm: parseInt(kkm, 10),
      cps: updatedCps
    };

    // If semester 1 is edited, also update the global legacy fields just in case
    if (semester === "1") {
      updateData.cpA = cpA;
      updateData.cpB = cpB;
      updateData.cpC = cpC;
      updateData.cpD = cpD;
    }

    await prisma.subject.update({
      where: { name: subjectName },
      data: updateData
    });

    return { success: true };
  } catch (e) {
    console.error(e);
    return { success: false, error: "Gagal menyimpan KKM dan Target Capaian." };
  }
}

export async function addQuestion(questionData) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "wali-kelas" && session.role !== "guru-mapel")) {
      return { success: false, error: "Unauthorized" };
    }

    await prisma.question.create({
      data: {
        subject: questionData.subject,
        question: questionData.question,
        imagePath: questionData.imagePath || null,
        type: questionData.type || "PG",
        category: questionData.category || "UTS",
        semester: questionData.semester || "1",
        kelas: questionData.kelas || "X",
        choices: questionData.choices || [],
        choicesImages: questionData.choicesImages || [],
        correct: parseInt(questionData.correct || 0, 10),
        correctChoices: questionData.correctChoices || [],
        correctAnswer: questionData.correctAnswer || "",
        matchingLeft: questionData.matchingLeft || [],
        matchingLeftImages: questionData.matchingLeftImages || [],
        matchingRight: questionData.matchingRight || [],
        matchingRightImages: questionData.matchingRightImages || [],
        groupId: questionData.groupId || null,
        groupText: questionData.groupText || null,
        groupImagePath: questionData.groupImagePath || null
      }
    });

    return { success: true };
  } catch (e) {
    console.error(e);
    return { success: false, error: "Gagal menambahkan soal ujian: " + e.message };
  }
}

export async function uploadQuestionImage(formData) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "wali-kelas" && session.role !== "guru-mapel")) {
      return { success: false, error: "Unauthorized" };
    }

    const file = formData.get('file');
    if (!file || typeof file === 'string') {
      return { success: false, error: "File tidak valid." };
    }

    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const uniqueFilename = `questions/${Date.now()}_${cleanFileName}`;
    
    const blob = await put(uniqueFilename, file, { access: 'public' });

    return { success: true, filePath: blob.url };
  } catch (e) {
    console.error(e);
    return { success: false, error: "Gagal mengunggah gambar soal: " + e.message };
  }
}

export async function deleteQuestion(id) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "wali-kelas" && session.role !== "guru-mapel")) {
      return { success: false, error: "Unauthorized" };
    }

    await prisma.question.delete({
      where: { id: parseInt(id, 10) }
    });

    return { success: true };
  } catch (e) {
    console.error(e);
    return { success: false, error: "Gagal menghapus soal." };
  }
}

export async function updateQuestion(id, questionData) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "wali-kelas" && session.role !== "guru-mapel")) {
      return { success: false, error: "Unauthorized" };
    }

    await prisma.question.update({
      where: { id: parseInt(id, 10) },
      data: {
        question: questionData.question,
        imagePath: questionData.imagePath || null,
        type: questionData.type || "PG",
        category: questionData.category || "UTS",
        semester: questionData.semester || "1",
        kelas: questionData.kelas || "X",
        choices: questionData.choices || [],
        choicesImages: questionData.choicesImages || [],
        correct: parseInt(questionData.correct || 0, 10),
        correctChoices: questionData.correctChoices || [],
        correctAnswer: questionData.correctAnswer || "",
        matchingLeft: questionData.matchingLeft || [],
        matchingLeftImages: questionData.matchingLeftImages || [],
        matchingRight: questionData.matchingRight || [],
        matchingRightImages: questionData.matchingRightImages || [],
        groupId: questionData.groupId || null,
        groupText: questionData.groupText || null,
        groupImagePath: questionData.groupImagePath || null
      }
    });

    return { success: true };
  } catch (e) {
    console.error(e);
    return { success: false, error: "Gagal memperbarui soal ujian: " + e.message };
  }
}

export async function saveStudentGrade(studentNisn, subjectName, tugas1, tugas2, uts, uas, paj, targetSemester) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "wali-kelas" && session.role !== "guru-mapel")) {
      return { success: false, error: "Unauthorized" };
    }

    const school = await prisma.school.findFirst({ where: { id: 1 } });
    const student = await prisma.student.findUnique({ where: { nisn: studentNisn } });
    if (!school || !student) {
      return { success: false, error: "Data sekolah atau siswa tidak ditemukan." };
    }

    const activeSemester = targetSemester || getStudentActiveSemester(student.kelas, school.semester);
    const utsParsed = uts !== "" && uts !== null && uts !== undefined ? parseInt(uts, 10) : null;
    const uasParsed = uas !== "" && uas !== null && uas !== undefined ? parseInt(uas, 10) : null;
    const pajParsed = paj !== "" && paj !== null && paj !== undefined ? parseInt(paj, 10) : null;

    const grade = await prisma.grade.findUnique({
      where: {
        studentNisn_subjectName_semester: {
          studentNisn,
          subjectName,
          semester: String(activeSemester)
        }
      }
    });

    if (grade) {
      await prisma.grade.update({
        where: { id: grade.id },
        data: {
          tugas1: parseInt(tugas1, 10),
          tugas2: parseInt(tugas2, 10),
          uts: utsParsed,
          uas: uasParsed,
          paj: pajParsed
        }
      });
    } else {
      await prisma.grade.create({
        data: {
          studentNisn,
          subjectName,
          tugas1: parseInt(tugas1, 10),
          tugas2: parseInt(tugas2, 10),
          uts: utsParsed,
          uas: uasParsed,
          paj: pajParsed,
          semester: String(activeSemester)
        }
      });
    }

    return { success: true };
  } catch (e) {
    console.error(e);
    return { success: false, error: "Gagal menyimpan perubahan nilai siswa: " + e.message };
  }
}

export async function saveStudentEkskulGrade(studentNisn, ekskulName, nilai, deskripsi) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "wali-kelas" && session.role !== "guru-mapel")) {
      return { success: false, error: "Unauthorized" };
    }

    const school = await prisma.school.findFirst({ where: { id: 1 } });
    const student = await prisma.student.findUnique({ where: { nisn: studentNisn } });
    if (!school || !student) {
      return { success: false, error: "Data sekolah atau siswa tidak ditemukan." };
    }

    const activeSemester = getStudentActiveSemester(student.kelas, school.semester);

    const ekskulGrade = await prisma.extracurricularGrade.findUnique({
      where: {
        studentNisn_ekskulName_semester: {
          studentNisn,
          ekskulName,
          semester: activeSemester
        }
      }
    });

    if (ekskulGrade) {
      await prisma.extracurricularGrade.update({
        where: { id: ekskulGrade.id },
        data: {
          nilai,
          deskripsi
        }
      });
    } else {
      await prisma.extracurricularGrade.create({
        data: {
          studentNisn,
          ekskulName,
          nilai,
          deskripsi,
          semester: activeSemester
        }
      });
    }

    return { success: true };
  } catch (e) {
    console.error(e);
    return { success: false, error: "Gagal menyimpan nilai ekskul: " + e.message };
  }
}

export async function saveStudentRaporRecord(studentNisn, catatanWali, sakit, izin, alfa, naikKelas) {
  try {
    const session = await getSession();
    if (!session || session.role !== "wali-kelas") {
      return { success: false, error: "Hanya Wali Kelas yang dapat mengubah Catatan Rapor." };
    }

    const school = await prisma.school.findFirst({ where: { id: 1 } });
    const student = await prisma.student.findUnique({ where: { nisn: studentNisn } });
    if (!school || !student) {
      return { success: false, error: "Data sekolah atau siswa tidak ditemukan." };
    }

    const activeSemester = getStudentActiveSemester(student.kelas, school.semester);
    
    // Konversi naikKelas
    let naikKelasVal = null;
    if (naikKelas === "true" || naikKelas === true) naikKelasVal = true;
    else if (naikKelas === "false" || naikKelas === false) naikKelasVal = false;

    const record = await prisma.raporRecord.findUnique({
      where: {
        studentNisn_semester: {
          studentNisn,
          semester: activeSemester
        }
      }
    });

    if (record) {
      await prisma.raporRecord.update({
        where: { id: record.id },
        data: {
          catatanWali,
          sakit: parseInt(sakit, 10) || 0,
          izin: parseInt(izin, 10) || 0,
          alfa: parseInt(alfa, 10) || 0,
          naikKelas: naikKelasVal
        }
      });
    } else {
      await prisma.raporRecord.create({
        data: {
          studentNisn,
          semester: activeSemester,
          catatanWali,
          sakit: parseInt(sakit, 10) || 0,
          izin: parseInt(izin, 10) || 0,
          alfa: parseInt(alfa, 10) || 0,
          naikKelas: naikKelasVal
        }
      });
    }

    return { success: true };
  } catch (e) {
    console.error(e);
    return { success: false, error: "Gagal menyimpan Catatan Rapor: " + e.message };
  }
}

export async function getExamSubmissions(subjectName, category, semester) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "wali-kelas" && session.role !== "guru-mapel")) {
      return { success: false, error: "Unauthorized" };
    }

    const submissions = await prisma.examSubmission.findMany({
      where: {
        subjectName,
        category,
        semester: String(semester)
      },
      include: {
        student: true
      },
      orderBy: { student: { name: "asc" } }
    });

    return { success: true, submissions };
  } catch (e) {
    console.error(e);
    return { success: false, error: "Gagal mengambil data lembar jawaban ujian." };
  }
}

export async function saveEssayScore(submissionId, questionId, essayScoreVal) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "wali-kelas" && session.role !== "guru-mapel")) {
      return { success: false, error: "Unauthorized" };
    }

    const submission = await prisma.examSubmission.findUnique({ where: { id: submissionId } });
    if (!submission) return { success: false, error: "Submission not found" };

    // 1. Update essayScores JSON
    const essayScores = submission.essayScores && typeof submission.essayScores === "object" 
      ? { ...submission.essayScores } 
      : {};
    
    essayScores[questionId] = parseInt(essayScoreVal, 10);

    // 2. Recalculate Final Score
    const questions = await prisma.question.findMany({
      where: {
        subject: submission.subjectName,
        category: submission.category,
        semester: submission.semester
      }
    });

    let correctCount = 0;
    let gradedQuestionsCount = 0;
    let essayCount = 0;
    let totalEssayScore = 0;
    const answers = submission.answers && typeof submission.answers === "object" ? submission.answers : {};

    questions.forEach((q) => {
      if (q.type === "ESSAY") {
        essayCount++;
        if (essayScores[q.id] !== undefined) {
          totalEssayScore += essayScores[q.id];
        }
      } else {
        const studentAns = answers[q.id];
        if (q.type === "PG") {
          gradedQuestionsCount++;
          if (studentAns !== undefined && Number(studentAns) === q.correct) correctCount++;
        } else if (q.type === "PGK") {
          gradedQuestionsCount++;
          if (Array.isArray(studentAns) && q.correctChoices) {
            const isCorrect = studentAns.length === q.correctChoices.length && 
                              studentAns.every(v => q.correctChoices.includes(Number(v)));
            if (isCorrect) correctCount++;
          }
        } else if (q.type === "MENJODOHKAN") {
          gradedQuestionsCount++;
          if (studentAns && typeof studentAns === "object" && q.matchingLeft && q.matchingRight) {
            const allCorrect = q.matchingLeft.every((_, lIdx) => {
              const chosenRightIdx = studentAns[lIdx];
              if (chosenRightIdx === undefined) return false;
              return q.matchingRight[chosenRightIdx] === q.matchingRight[lIdx];
            });
            if (allCorrect) correctCount++;
          }
        } else if (q.type === "ISIAN") {
          gradedQuestionsCount++;
          if (studentAns && typeof studentAns === "string") {
            const isCorrect = studentAns.trim().toLowerCase() === (q.correctAnswer || "").trim().toLowerCase();
            if (isCorrect) correctCount++;
          }
        }
      }
    });

    const objScore = gradedQuestionsCount > 0 ? Math.round((correctCount / gradedQuestionsCount) * 100) : null;
    const avgEssayScore = essayCount > 0 ? Math.round(totalEssayScore / essayCount) : null;

    let finalScore = submission.score; // fallback
    if (objScore !== null && avgEssayScore !== null) {
      finalScore = Math.round((objScore + avgEssayScore) / 2);
    } else if (objScore !== null) {
      finalScore = objScore;
    } else if (avgEssayScore !== null) {
      finalScore = avgEssayScore;
    }

    const updatedSubmission = await prisma.examSubmission.update({
      where: { id: submissionId },
      data: { 
        essayScores,
        score: finalScore 
      }
    });

    // Update di tabel Grade
    const grade = await prisma.grade.findUnique({
      where: {
        studentNisn_subjectName_semester: {
          studentNisn: updatedSubmission.studentNisn,
          subjectName: updatedSubmission.subjectName,
          semester: updatedSubmission.semester
        }
      }
    });

    const updateData = {};
    if (updatedSubmission.category === "UTS") updateData.uts = finalScore;
    else if (updatedSubmission.category === "UAS") updateData.uas = finalScore;
    else if (updatedSubmission.category === "PAJ") updateData.paj = finalScore;

    if (grade) {
      await prisma.grade.update({
        where: { id: grade.id },
        data: updateData
      });
    } else {
      await prisma.grade.create({
        data: {
          studentNisn: updatedSubmission.studentNisn,
          subjectName: updatedSubmission.subjectName,
          semester: updatedSubmission.semester,
          tugas1: 80,
          tugas2: 80,
          ...updateData
        }
      });
    }

    return { success: true, newScore: finalScore, essayScores };
  } catch (e) {
    console.error(e);
    return { success: false, error: "Gagal menyimpan skor essay." };
  }
}


export async function overrideExamScore(submissionId, newScore) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "wali-kelas" && session.role !== "guru-mapel")) {
      return { success: false, error: "Unauthorized" };
    }

    const submission = await prisma.examSubmission.update({
      where: { id: submissionId },
      data: { score: parseInt(newScore, 10) }
    });

    // Update di tabel Grade
    const grade = await prisma.grade.findUnique({
      where: {
        studentNisn_subjectName_semester: {
          studentNisn: submission.studentNisn,
          subjectName: submission.subjectName,
          semester: submission.semester
        }
      }
    });

    const updateData = {};
    if (submission.category === "UTS") updateData.uts = parseInt(newScore, 10);
    else if (submission.category === "UAS") updateData.uas = parseInt(newScore, 10);
    else if (submission.category === "PAJ") updateData.paj = parseInt(newScore, 10);

    if (grade) {
      await prisma.grade.update({
        where: { id: grade.id },
        data: updateData
      });
    }

    return { success: true };
  } catch (e) {
    console.error(e);
    return { success: false, error: "Gagal menyimpan perubahan skor ujian." };
  }
}

export async function uploadExamAttachment(formData) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "wali-kelas" && session.role !== "guru-mapel")) {
      return { success: false, error: "Unauthorized" };
    }

    const file = formData.get('file');
    const subjectName = formData.get('subjectName');
    const category = formData.get('category');
    const semester = formData.get('semester');

    if (!file || typeof file === 'string') {
      return { success: false, error: "File tidak valid." };
    }

    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const uniqueFilename = `uploads/${Date.now()}_${cleanFileName}`;
    
    const blob = await put(uniqueFilename, file, { access: 'public' });
    const filePathUrl = blob.url;

    // Simpan ke database
    const existing = await prisma.examAttachment.findUnique({
      where: {
        subjectName_category_semester: {
          subjectName,
          category,
          semester: String(semester)
        }
      }
    });

    if (existing) {
      await prisma.examAttachment.update({
        where: { id: existing.id },
        data: {
          filePath: filePathUrl,
          fileName: file.name
        }
      });
    } else {
      await prisma.examAttachment.create({
        data: {
          subjectName,
          category,
          semester: String(semester),
          filePath: filePathUrl,
          fileName: file.name
        }
      });
    }

    return { success: true, filePath: filePathUrl, fileName: file.name };
  } catch (e) {
    console.error(e);
    return { success: false, error: "Gagal mengunggah dokumen: " + e.message };
  }
}

export async function getExamAttachment(subjectName, category, semester) {
  try {
    const attachment = await prisma.examAttachment.findUnique({
      where: {
        subjectName_category_semester: {
          subjectName,
          category,
          semester: String(semester)
        }
      }
    });
    return { success: true, attachment };
  } catch (e) {
    console.error(e);
    return { success: false, error: "Gagal memuat lampiran ujian." };
  }
}

export async function uploadTeacherFoto(formData) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "wali-kelas" && session.role !== "guru-mapel")) {
      return { success: false, error: "Unauthorized" };
    }

    const file = formData.get('file');
    if (!file || typeof file === 'string') {
      return { success: false, error: "File tidak valid." };
    }

    // Batasi ukuran file maksimum 1.5 MB untuk mencegah bloat database
    if (file.size > 1.5 * 1024 * 1024) {
      return { success: false, error: "Ukuran foto terlalu besar. Maksimum 1.5 MB." };
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Konversi file ke data URL Base64
    const mimeType = file.type || "image/jpeg";
    const base64Data = buffer.toString('base64');
    const base64String = `data:${mimeType};base64,${base64Data}`;

    // Update foto profil guru di database
    const updatedTeacher = await prisma.teacher.update({
      where: { id: session.id },
      data: { foto: base64String }
    });

    // Perbarui session cookie agar langsung terefleksi di navbar & halaman
    await setSession(updatedTeacher);

    return { success: true, filePath: base64String, teacher: updatedTeacher };
  } catch (e) {
    console.error(e);
    return { success: false, error: "Gagal menyimpan foto profil: " + e.message };
  }
}

export async function saveBulkStudentGrades(gradesArray, subjectName, targetSemester) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "wali-kelas" && session.role !== "guru-mapel")) {
      return { success: false, error: "Unauthorized" };
    }

    const school = await prisma.school.findFirst({ where: { id: 1 } });
    if (!school) {
      return { success: false, error: "Data sekolah tidak ditemukan." };
    }

    // Process all grades in a transaction
    const results = await prisma.$transaction(
      gradesArray.map(g => {
        const activeSemester = targetSemester || "1";
        const utsParsed = g.uts !== "" && g.uts !== null && g.uts !== undefined ? parseInt(g.uts, 10) : null;
        const uasParsed = g.uas !== "" && g.uas !== null && g.uas !== undefined ? parseInt(g.uas, 10) : null;
        const pajParsed = g.paj !== "" && g.paj !== null && g.paj !== undefined ? parseInt(g.paj, 10) : null;
        const tugas1Parsed = g.tugas1 !== "" && g.tugas1 !== null && g.tugas1 !== undefined ? parseInt(g.tugas1, 10) : 0;
        const tugas2Parsed = g.tugas2 !== "" && g.tugas2 !== null && g.tugas2 !== undefined ? parseInt(g.tugas2, 10) : 0;

        return prisma.grade.upsert({
          where: {
            studentNisn_subjectName_semester: {
              studentNisn: g.studentNisn,
              subjectName,
              semester: String(activeSemester)
            }
          },
          update: {
            tugas1: tugas1Parsed,
            tugas2: tugas2Parsed,
            uts: utsParsed,
            uas: uasParsed,
            paj: pajParsed
          },
          create: {
            studentNisn: g.studentNisn,
            subjectName,
            tugas1: tugas1Parsed,
            tugas2: tugas2Parsed,
            uts: utsParsed,
            uas: uasParsed,
            paj: pajParsed,
            semester: String(activeSemester)
          }
        });
      })
    );

    return { success: true, count: results.length };
  } catch (e) {
    console.error(e);
    return { success: false, error: "Gagal menyimpan massal nilai siswa: " + e.message };
  }
}

export async function saveTeachingJournal(journalData) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "wali-kelas" && session.role !== "guru-mapel")) {
      return { success: false, error: "Unauthorized" };
    }

    const {
      id,
      date,
      kelas,
      subjectName,
      jamKe,
      materi,
      tujuanPembelajaran,
      catatanAktivitas,
      catatanKarakter,
      attendances, // [ { studentId, status, notes } ]
      grades       // [ { studentId, score, notes } ]
    } = journalData;

    let journal;
    if (id) {
      journal = await prisma.teachingJournal.update({
        where: { id },
        data: {
          date,
          kelas,
          subjectName,
          jamKe,
          materi,
          tujuanPembelajaran,
          catatanAktivitas,
          catatanKarakter
        }
      });
    } else {
      journal = await prisma.teachingJournal.create({
        data: {
          teacherId: session.id,
          date,
          kelas,
          subjectName,
          jamKe,
          materi,
          tujuanPembelajaran,
          catatanAktivitas,
          catatanKarakter
        }
      });
    }

    const journalId = journal.id;

    // Sync attendances
    await prisma.journalAttendance.deleteMany({
      where: { journalId }
    });

    if (attendances && attendances.length > 0) {
      await prisma.journalAttendance.createMany({
        data: attendances.map(a => ({
          journalId,
          studentId: a.studentId,
          status: a.status,
          notes: a.notes || null
        }))
      });
    }

    // Sync grades
    await prisma.journalGrade.deleteMany({
      where: { journalId }
    });

    if (grades && grades.length > 0) {
      const validGrades = grades.filter(g => g.score !== "" && g.score !== null && g.score !== undefined);
      if (validGrades.length > 0) {
        await prisma.journalGrade.createMany({
          data: validGrades.map(g => ({
            journalId,
            studentId: g.studentId,
            score: parseInt(g.score, 10),
            notes: g.notes || null
          }))
        });
      }
    }

    return { success: true, journalId };
  } catch (e) {
    console.error(e);
    return { success: false, error: "Gagal menyimpan jurnal mengajar: " + e.message };
  }
}

export async function getTeachingJournals(subjectName, kelas) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "wali-kelas" && session.role !== "guru-mapel")) {
      return { success: false, error: "Unauthorized" };
    }

    const journals = await prisma.teachingJournal.findMany({
      where: {
        teacherId: session.id,
        ...(subjectName ? { subjectName } : {}),
        ...(kelas ? { kelas } : {})
      },
      include: {
        attendances: {
          include: {
            student: {
              select: { name: true }
            }
          }
        },
        grades: true
      },
      orderBy: [
        { date: "desc" },
        { jamKe: "desc" }
      ]
    });

    return { success: true, journals };
  } catch (e) {
    console.error(e);
    return { success: false, error: "Gagal mengambil riwayat jurnal: " + e.message };
  }
}

export async function deleteTeachingJournal(id) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "wali-kelas" && session.role !== "guru-mapel")) {
      return { success: false, error: "Unauthorized" };
    }

    await prisma.teachingJournal.delete({
      where: { id }
    });

    return { success: true };
  } catch (e) {
    console.error(e);
    return { success: false, error: "Gagal menghapus jurnal mengajar: " + e.message };
  }
}

export async function getJournalGradesAverage(subjectName, semester, kelas) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "wali-kelas" && session.role !== "guru-mapel")) {
      return { success: false, error: "Unauthorized" };
    }

    const journals = await prisma.teachingJournal.findMany({
      where: {
        teacherId: session.id,
        subjectName,
        kelas
      },
      select: {
        id: true
      }
    });

    const journalIds = journals.map(j => j.id);
    if (journalIds.length === 0) {
      return { success: true, averages: {} };
    }

    const grades = await prisma.journalGrade.findMany({
      where: {
        journalId: { in: journalIds }
      }
    });

    const studentGradesMap = {};
    grades.forEach(g => {
      if (!studentGradesMap[g.studentId]) {
        studentGradesMap[g.studentId] = [];
      }
      studentGradesMap[g.studentId].push(g.score);
    });

    const averages = {};
    for (const studentId in studentGradesMap) {
      const scores = studentGradesMap[studentId];
      const sum = scores.reduce((a, b) => a + b, 0);
      averages[studentId] = Math.round(sum / scores.length);
    }

    return { success: true, averages };
  } catch (e) {
    console.error(e);
    return { success: false, error: "Gagal memproses rata-rata nilai jurnal: " + e.message };
  }
}

// Rekap Jurnal Mengajar Bulanan
export async function getTeachingJournalRecap(subjectName, kelas, bulan, tahun) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "wali-kelas" && session.role !== "guru-mapel")) {
      return { success: false, error: "Unauthorized" };
    }

    const monthStr = String(bulan).padStart(2, "0");
    const startDate = `${tahun}-${monthStr}-01`;
    const endDate = `${tahun}-${monthStr}-31`;

    const journals = await prisma.teachingJournal.findMany({
      where: {
        teacherId: session.id,
        subjectName,
        kelas,
        date: { gte: startDate, lte: endDate }
      },
      include: {
        attendances: true,
        grades: true
      },
      orderBy: [
        { date: "asc" },
        { jamKe: "asc" }
      ]
    });

    // Hitung statistik per jurnal
    const recap = journals.map((j, idx) => {
      const hadir = j.attendances.filter(a => a.status === "HADIR").length;
      const tidak = j.attendances.filter(a => a.status !== "HADIR").length;
      const totalSiswa = j.attendances.length;
      return {
        no: idx + 1,
        id: j.id,
        date: j.date,
        jamKe: j.jamKe,
        materi: j.materi || "-",
        kompetensiDasar: j.kompetensiDasar || "-",
        metode: j.metode || "-",
        catatan: j.catatan || "",
        hadir,
        tidak,
        totalSiswa,
        attendances: j.attendances
      };
    });

    return {
      success: true,
      recap,
      subjectName,
      kelas,
      bulan,
      tahun,
      teacherName: session.name,
      totalPertemuan: recap.length
    };
  } catch (e) {
    console.error(e);
    return { success: false, error: "Gagal mengambil rekap jurnal: " + e.message };
  }
}

// Rekap Nilai Ekstrakurikuler
export async function getEkskulGradeRecap(ekskulName, semester) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "wali-kelas" && session.role !== "guru-mapel")) {
      return { success: false, error: "Unauthorized" };
    }

    // Ambil semua nilai ekskul berdasarkan nama ekskul & semester
    const grades = await prisma.extracurricularGrade.findMany({
      where: {
        ekskulName,
        ...(semester ? { semester } : {})
      },
      include: {
        student: {
          select: { name: true, kelas: true, nisn: true, nis: true }
        }
      },
      orderBy: [
        { student: { kelas: "asc" } },
        { student: { name: "asc" } }
      ]
    });

    const recap = grades.map((g, idx) => ({
      no: idx + 1,
      nisn: g.studentNisn,
      nis: g.student?.nis || "-",
      name: g.student?.name || "-",
      kelas: g.student?.kelas || "-",
      nilai: g.nilai,
      predikat: g.nilai >= 90 ? "A (Sangat Baik)"
               : g.nilai >= 80 ? "B (Baik)"
               : g.nilai >= 70 ? "C (Cukup)"
               : "D (Perlu Bimbingan)",
      deskripsi: g.deskripsi || "-",
      semester: g.semester
    }));

    // Ambil daftar semua ekskul untuk dropdown
    const allEkskul = await prisma.extracurricular.findMany({
      select: { name: true },
      orderBy: { name: "asc" }
    });

    return {
      success: true,
      recap,
      ekskulName,
      semester,
      teacherName: session.name,
      allEkskul: allEkskul.map(e => e.name),
      totalSiswa: recap.length
    };
  } catch (e) {
    console.error(e);
    return { success: false, error: "Gagal mengambil rekap nilai ekskul: " + e.message };
  }
}

// ─── EKSKUL SESSION & ABSENSI ───

export async function saveEkskulSession(ekskulName, date, keterangan, attendances) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "wali-kelas" && session.role !== "guru-mapel")) {
      return { success: false, error: "Unauthorized" };
    }

    let ekskulSession = await prisma.ekskulSession.findFirst({
      where: { ekskulName, date }
    });

    if (ekskulSession) {
      await prisma.ekskulSession.update({
        where: { id: ekskulSession.id },
        data: { keterangan, createdById: session.id }
      });
      await prisma.ekskulAttendance.deleteMany({ where: { sessionId: ekskulSession.id } });
    } else {
      ekskulSession = await prisma.ekskulSession.create({
        data: { ekskulName, date, keterangan, createdById: session.id }
      });
    }

    if (attendances && attendances.length > 0) {
      await prisma.ekskulAttendance.createMany({
        data: attendances.map(a => ({
          sessionId: ekskulSession.id,
          studentNisn: a.studentNisn,
          status: a.status
        }))
      });
    }

    return { success: true, sessionId: ekskulSession.id };
  } catch (e) {
    console.error(e);
    return { success: false, error: "Gagal menyimpan sesi ekskul: " + e.message };
  }
}

export async function getEkskulSessions(ekskulName) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "wali-kelas" && session.role !== "guru-mapel")) {
      return { success: false, error: "Unauthorized" };
    }

    const sessions = await prisma.ekskulSession.findMany({
      where: { ekskulName },
      include: {
        attendances: {
          include: { student: { select: { name: true, kelas: true, nisn: true } } }
        }
      },
      orderBy: { date: "desc" }
    });

    return { success: true, sessions };
  } catch (e) {
    console.error(e);
    return { success: false, error: "Gagal mengambil sesi ekskul: " + e.message };
  }
}

export async function deleteEkskulSession(sessionId) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "wali-kelas" && session.role !== "guru-mapel")) {
      return { success: false, error: "Unauthorized" };
    }
    await prisma.ekskulSession.delete({ where: { id: sessionId } });
    return { success: true };
  } catch (e) {
    console.error(e);
    return { success: false, error: "Gagal menghapus sesi: " + e.message };
  }
}

export async function getEkskulFullRecap(ekskulName, bulan, tahun) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "wali-kelas" && session.role !== "guru-mapel")) {
      return { success: false, error: "Unauthorized" };
    }

    const monthStr = String(bulan).padStart(2, "0");
    const startDate = `${tahun}-${monthStr}-01`;
    const endDate = `${tahun}-${monthStr}-31`;

    const sessions = await prisma.ekskulSession.findMany({
      where: { ekskulName, date: { gte: startDate, lte: endDate } },
      include: {
        attendances: {
          include: { student: { select: { name: true, kelas: true, nisn: true, nis: true } } }
        }
      },
      orderBy: { date: "asc" }
    });

    const studentMap = {};
    sessions.forEach(s => {
      s.attendances.forEach(a => {
        if (!studentMap[a.studentNisn]) {
          studentMap[a.studentNisn] = {
            nisn: a.studentNisn,
            nis: a.student?.nis || "-",
            name: a.student?.name || "-",
            kelas: a.student?.kelas || "-",
            hadir: 0, tidakHadir: 0, izin: 0, sakit: 0, perSesi: {}
          };
        }
        studentMap[a.studentNisn].perSesi[s.date] = a.status;
        if (a.status === "HADIR") studentMap[a.studentNisn].hadir++;
        else if (a.status === "TIDAK_HADIR") studentMap[a.studentNisn].tidakHadir++;
        else if (a.status === "IZIN") studentMap[a.studentNisn].izin++;
        else if (a.status === "SAKIT") studentMap[a.studentNisn].sakit++;
      });
    });

    const grades = await prisma.extracurricularGrade.findMany({ where: { ekskulName } });
    const gradeMap = {};
    grades.forEach(g => { gradeMap[g.studentNisn] = g; });

    const dates = sessions.map(s => s.date);
    const recap = Object.values(studentMap)
      .sort((a, b) => a.kelas.localeCompare(b.kelas) || a.name.localeCompare(b.name))
      .map((s, idx) => {
        const total = s.hadir + s.tidakHadir + s.izin + s.sakit;
        const pctHadir = total > 0 ? Math.round((s.hadir / total) * 100) : 0;
        const g = gradeMap[s.nisn];
        return {
          no: idx + 1, ...s, total, pctHadir,
          nilai: g?.nilai || "-",
          predikat: g ? (parseInt(g.nilai) >= 90 ? "A (Sangat Baik)" : parseInt(g.nilai) >= 80 ? "B (Baik)" : parseInt(g.nilai) >= 70 ? "C (Cukup)" : "D (Perlu Bimbingan)") : "-",
          deskripsi: g?.deskripsi || "-"
        };
      });

    return { success: true, recap, dates, sessions, ekskulName, bulan, tahun, teacherName: session.name, totalPertemuan: sessions.length };
  } catch (e) {
    console.error(e);
    return { success: false, error: "Gagal mengambil rekap ekskul: " + e.message };
  }
}

// Admin / Wali Kelas mengedit daftar ekskul yang diikuti siswa
export async function updateStudentExtracurriculars(studentNisn, extracurriculars) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "wali-kelas" && session.role !== "guru-mapel" && session.role !== "admin")) {
      return { success: false, error: "Unauthorized" };
    }

    await prisma.student.update({
      where: { nisn: studentNisn },
      data: { extracurriculars: extracurriculars || [] }
    });

    return { success: true };
  } catch (e) {
    console.error(e);
    return { success: false, error: "Gagal memperbarui ekskul siswa: " + e.message };
  }
}

export async function gradePortfolio(portfolioId, data) {
  try {
    const session = await getSession();
    if (!session || !["guru-mapel", "wali-kelas"].includes(session.role)) {
      return { success: false, error: "Unauthorized" };
    }

    const { kreativitas, teknik, kesesuaian, catatan, subjectName, semester, teacherName } = data;
    const avgScore = Math.round((Number(kreativitas) + Number(teknik) + Number(kesesuaian)) / 3);

    // Dapatkan data portofolio untuk mengetahui studentId/nisn
    const portfolio = await prisma.portfolio.findUnique({
      where: { id: portfolioId },
      include: { student: true }
    });

    if (!portfolio) {
      return { success: false, error: "Portofolio tidak ditemukan." };
    }

    // 1. Update Portfolio dengan nilai rubrik
    await prisma.portfolio.update({
      where: { id: portfolioId },
      data: {
        nilaiKreativitas: Number(kreativitas),
        nilaiTeknik: Number(teknik),
        nilaiKesesuaian: Number(kesesuaian),
        catatanGuru: catatan,
        dinilaiOleh: teacherName,
        subjectName: subjectName
      }
    });

    // 2. Integrasikan ke tabel Grade jika subjectName diberikan
    if (subjectName && semester) {
      const studentNisn = portfolio.student.nisn;
      
      const existingGrade = await prisma.grade.findUnique({
        where: {
          studentNisn_subjectName_semester: {
            studentNisn,
            subjectName,
            semester: semester.toString()
          }
        }
      });

      if (existingGrade) {
        await prisma.grade.update({
          where: { id: existingGrade.id },
          data: { portofolio: avgScore }
        });
      } else {
        await prisma.grade.create({
          data: {
            studentNisn,
            subjectName,
            semester: semester.toString(),
            portofolio: avgScore
          }
        });
      }
    }

    return { success: true, averageScore: avgScore };
  } catch (e) {
    console.error("Error in gradePortfolio:", e);
    return { success: false, error: "Gagal menyimpan nilai portofolio: " + e.message };
  }
}


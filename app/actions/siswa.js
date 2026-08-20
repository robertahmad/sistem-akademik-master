"use server";

import prisma from "../../lib/prisma";
import { getSession } from "../../lib/auth";
import { put } from "@vercel/blob";


function checkIsOffline(modeString, studentKelas, defaultMode) {
  if (!modeString) return defaultMode === "offline";
  try {
    const parsed = JSON.parse(modeString);
    const normalizedKelas = (studentKelas || "").trim().toLowerCase();
    
    // Sort keys by length descending so "XII" is checked before "XI" and "X"
    const keys = Object.keys(parsed).sort((a, b) => b.length - a.length);
    for (const key of keys) {
      // Use word boundary to ensure we match exactly "X", "XI", "XII"
      const regex = new RegExp('\\b' + key.toLowerCase() + '\\b');
      if (regex.test(normalizedKelas)) {
        return parsed[key] === "offline";
      }
    }
    
    if (parsed["GLOBAL"]) return parsed["GLOBAL"] === "offline";
  } catch (e) {
    return modeString.toLowerCase() === "offline";
  }
  return defaultMode === "offline";
}


export async function getStudentDashboardData() {
  try {
    const session = await getSession();
    if (!session || session.role !== "siswa") {
      return { success: false, error: "Unauthorized" };
    }

    const student = await prisma.student.findUnique({
      where: { nisn: session.nisn },
      include: {
        grades: true,
        attendances: true,
        portfolios: true
      }
    });

    if (!student) {
      return { success: false, error: "Siswa tidak ditemukan." };
    }

    const school = await prisma.school.findFirst({ where: { id: 1 } });
    if (!school) {
      return { success: false, error: "Data sekolah tidak ditemukan." };
    }

    // Hitung semester aktif siswa berdasarkan kelas dan semester aktif sekolah
    const normKelas = (student.kelas || "").trim().toLowerCase();
    let level = 7; // X (SMK) / VII (SMP)
    if (
      normKelas.startsWith("viii") || 
      normKelas.includes("kelas xi") || 
      normKelas.includes("kelas 8") || 
      normKelas.startsWith("8") || 
      /\bxi\b/.test(normKelas)
    ) {
      level = 8; // XI (SMK) / VIII (SMP)
    } else if (
      normKelas.startsWith("ix") || 
      normKelas.includes("kelas xii") || 
      normKelas.includes("kelas 9") || 
      normKelas.startsWith("9") || 
      /\bxii\b/.test(normKelas)
    ) {
      level = 9; // XII (SMK) / IX (SMP)
    }
    const isGanjil = (school.semester || "Ganjil").toLowerCase().trim() === "ganjil";
    let activeSemester = "1";
    if (level === 7) activeSemester = isGanjil ? "1" : "2";
    else if (level === 8) activeSemester = isGanjil ? "3" : "4";
    else activeSemester = isGanjil ? "5" : "6";

    // Ambil tingkat kelas romawi
    const gradeLevel = level === 7 ? "X" : level === 8 ? "XI" : "XII";

    // Ambil daftar mata pelajaran untuk memfilter berdasarkan jurusan siswa
    const allSubjects = await prisma.subject.findMany();
    const studentJurusan = (student.jurusan || "").trim();
    
    // Mata pelajaran yang diizinkan: jurusan kosong (umum) atau jurusan sama dengan jurusan siswa
    const validSubjectNames = allSubjects
      .filter(s => !s.jurusan || s.jurusan.trim() === "" || s.jurusan.trim() === studentJurusan)
      .map(s => s.name);

    // Ambil soal yang aktif untuk semester ini dan tingkat kelas ini, serta sesuai jurusan
    const activeSemesterQuestions = await prisma.question.findMany({
      where: { 
        semester: activeSemester,
        kelas: gradeLevel,
        subject: { in: validSubjectNames }
      }
    });

    // Grouping ujian yang tersedia berdasarkan subject & category
    const examGroups = {};
    activeSemesterQuestions.forEach(q => {
      const key = `${q.subject}_${q.category}`;
      if (!examGroups[key]) {
        examGroups[key] = {
          subject: q.subject,
          category: q.category,
          questionCount: 0
        };
      }
      examGroups[key].questionCount++;
    });

    // Petakan nilai yang sudah diperoleh siswa untuk semester aktif ini
    const gradesForActiveSemester = student.grades.filter(g => g.semester === activeSemester);

    // Ambil jadwal ujian untuk semester ini
    const schedules = await prisma.examSchedule.findMany({
      where: { semester: activeSemester }
    });

    const now = new Date();

    const availableExams = Object.values(examGroups).map(exam => {
      const grade = gradesForActiveSemester.find(g => g.subjectName === exam.subject);
      let score = null;
      if (grade) {
        if (exam.category === "UTS") score = grade.uts;
        else if (exam.category === "UAS") score = grade.uas;
        else if (exam.category === "PAJ") score = grade.paj;
      }

      const schedule = schedules.find(s => s.subjectName === exam.subject && s.category === exam.category);
      
      let isLocked = true;
      let statusText = "Jadwal Belum Diatur";
      let startTime = null;
      let endTime = null;
      let forceOpen = false;

      let isOffline = false;
      if (exam.category === "UTS" && checkIsOffline(school.utsMode, student.kelas, "online")) isOffline = true;
      if (exam.category === "UAS" && checkIsOffline(school.uasMode, student.kelas, "offline")) isOffline = true;
      if (exam.category === "PAJ" && checkIsOffline(school.pajMode, student.kelas, "offline")) isOffline = true;

      if (isOffline) {
        statusText = "Ujian Offline / Tertulis";
      } else if (schedule) {
        startTime = schedule.startTime;
        endTime = schedule.endTime;
        forceOpen = schedule.forceOpen;

        if (forceOpen) {
          isLocked = false;
          statusText = "Terbuka (Oleh Admin)";
        } else {
          const start = new Date(startTime);
          const end = new Date(endTime);
          if (now >= start && now <= end) {
            isLocked = false;
            statusText = "Berlangsung (Terbuka)";
          } else if (now < start) {
            isLocked = true;
            statusText = "Belum Dimulai";
          } else {
            isLocked = true;
            statusText = "Selesai (Terkunci)";
          }
        }
      }

      return {
        subject: exam.subject,
        category: exam.category,
        questionCount: exam.questionCount,
        score,
        semester: activeSemester,
        schedule: schedule ? {
          startTime: schedule.startTime.toISOString(),
          endTime: schedule.endTime.toISOString(),
          forceOpen: schedule.forceOpen
        } : null,
        isLocked,
        statusText
      };
    });

    const allExtracurriculars = await prisma.extracurricular.findMany({
      orderBy: { name: "asc" }
    });

    return {
      success: true,
      student: {
        id: student.id,
        name: student.name,
        nisn: student.nisn,
        kelas: student.kelas,
        alamat: student.alamat,
        namaOrangTua: student.namaOrangTua,
        extracurriculars: student.extracurriculars || [],
        unit: student.unit,
        jurusan: student.jurusan
      },
      activeSemester,
      availableExams,
      allExtracurriculars: allExtracurriculars.map(e => e.name)
    };
  } catch (e) {
    console.error(e);
    return { success: false, error: "Gagal mengambil data dashboard siswa." };
  }
}

export async function getExamQuestions(subject, category, semester) {
  try {
    const session = await getSession();
    if (!session || session.role !== "siswa") {
      return { success: false, error: "Unauthorized" };
    }

    const school = await prisma.school.findFirst({ where: { id: 1 } });
    if (school) {
      const student = await prisma.student.findUnique({ where: { nisn: session.nisn } });
      if (category === "UTS" && checkIsOffline(school.utsMode, student?.kelas, "online")) return { success: false, error: "Ujian UTS kelas Anda diselenggarakan secara offline/tertulis." };
      if (category === "UAS" && checkIsOffline(school.uasMode, student?.kelas, "offline")) return { success: false, error: "Ujian UAS kelas Anda diselenggarakan secara offline/tertulis." };
      if (category === "PAJ" && checkIsOffline(school.pajMode, student?.kelas, "offline")) return { success: false, error: "Ujian PAJ kelas Anda diselenggarakan secara offline/tertulis." };
    }

    // Periksa jadwal ujian
    const schedule = await prisma.examSchedule.findUnique({
      where: {
        subjectName_category_semester: {
          subjectName: subject,
          category,
          semester: String(semester)
        }
      }
    });

    if (!schedule) {
      return { success: false, error: "Jadwal ujian belum diatur. Ujian terkunci." };
    }

    const now = new Date();
    const isWithinTime = now >= schedule.startTime && now <= schedule.endTime;
    const isOpen = schedule.forceOpen || isWithinTime;

    if (!isOpen) {
      return { success: false, error: "Ujian terkunci (berada di luar waktu ujian)." };
    }

    const student = await prisma.student.findUnique({
      where: { nisn: session.nisn }
    });
    if (!student) {
      return { success: false, error: "Data siswa tidak ditemukan." };
    }

    const normKelas = (student.kelas || "").trim().toLowerCase();
    let gradeLevel = "X";
    if (
      normKelas.startsWith("viii") || 
      normKelas.includes("kelas xi") || 
      normKelas.includes("kelas 8") || 
      normKelas.startsWith("8") || 
      /\bxi\b/.test(normKelas)
    ) {
      gradeLevel = "XI";
    } else if (
      normKelas.startsWith("ix") || 
      normKelas.includes("kelas xii") || 
      normKelas.includes("kelas 9") || 
      normKelas.startsWith("9") || 
      /\bxii\b/.test(normKelas)
    ) {
      gradeLevel = "XII";
    }

    const questions = await prisma.question.findMany({
      where: {
        subject,
        category,
        semester: String(semester),
        kelas: gradeLevel
      },
      orderBy: { id: "asc" }
    });

    return { success: true, questions };
  } catch (e) {
    console.error(e);
    return { success: false, error: "Gagal mengambil soal ujian." };
  }
}

export async function uploadPortfolio(formData) {
  try {
    const session = await getSession();
    if (!session || session.role !== "siswa") {
      return { success: false, error: "Unauthorized" };
    }

    const judul = formData.get('judul');
    const deskripsi = formData.get('deskripsi') || "";
    const kategori = formData.get('kategori') || "Karya DKV";
    const fileUrl = formData.get('link');

    if (!judul || !fileUrl) {
      return { success: false, error: "Data tidak lengkap atau link tidak valid." };
    }

    const student = await prisma.student.findUnique({
      where: { nisn: session.nisn }
    });

    if (!student) {
      return { success: false, error: "Siswa tidak ditemukan." };
    }

    const portfolio = await prisma.portfolio.create({
      data: {
        judul,
        deskripsi,
        kategori,
        fileUrl,
        studentId: student.id
      }
    });

    return { success: true, portfolio };
  } catch (error) {
    console.error("Upload portfolio error:", error);
    return { success: false, error: "Gagal mengunggah portofolio." };
  }
}

export async function submitStudentExamResult(subject, category, semester, score, answersJson, filePath = null) {
  try {
    const session = await getSession();
    if (!session || session.role !== "siswa") {
      return { success: false, error: "Unauthorized" };
    }

    const student = await prisma.student.findUnique({ where: { nisn: session.nisn } });
    if (!student) {
      return { success: false, error: "Data siswa tidak ditemukan." };
    }

    // 1. Simpan atau update nilai di tabel Grade
    const grade = await prisma.grade.findUnique({
      where: {
        studentNisn_subjectName_semester: {
          studentNisn: session.nisn,
          subjectName: subject,
          semester: String(semester)
        }
      }
    });

    const updateData = {};
    if (category === "UTS") updateData.uts = score;
    else if (category === "UAS") updateData.uas = score;
    else if (category === "PAJ") updateData.paj = score;

    if (grade) {
      await prisma.grade.update({
        where: { id: grade.id },
        data: updateData
      });
    } else {
      await prisma.grade.create({
        data: {
          studentNisn: session.nisn,
          subjectName: subject,
          semester: String(semester),
          tugas1: 80,
          tugas2: 80,
          ...updateData
        }
      });
    }

    // 2. Simpan rincian ke tabel ExamSubmission
    const existingSubmission = await prisma.examSubmission.findUnique({
      where: {
        studentNisn_subjectName_category_semester: {
          studentNisn: session.nisn,
          subjectName: subject,
          category: category,
          semester: String(semester)
        }
      }
    });

    if (existingSubmission) {
      await prisma.examSubmission.update({
        where: { id: existingSubmission.id },
        data: {
          score,
          answers: answersJson || {},
          filePath: filePath || existingSubmission.filePath
        }
      });
    } else {
      await prisma.examSubmission.create({
        data: {
          studentNisn: session.nisn,
          subjectName: subject,
          category: category,
          semester: String(semester),
          score,
          answers: answersJson || {},
          filePath
        }
      });
    }

    return { success: true };
  } catch (e) {
    console.error(e);
    return { success: false, error: "Gagal menyimpan hasil ujian: " + e.message };
  }
}

export async function uploadStudentAnswerFile(formData) {
  try {
    const session = await getSession();
    if (!session || session.role !== "siswa") {
      return { success: false, error: "Unauthorized" };
    }

    const file = formData.get('file');
    if (!file || typeof file === 'string') {
      return { success: false, error: "File tidak valid." };
    }

    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const uniqueFilename = `student_answers/${Date.now()}_student_${session.nisn}_${cleanFileName}`;
    
    const blob = await put(uniqueFilename, file, { access: 'public' });

    return { success: true, filePath: blob.url };
  } catch (e) {
    console.error(e);
    return { success: false, error: "Gagal mengunggah lembar jawaban: " + e.message };
  }
}

export async function toggleStudentEkskul(ekskulName) {
  try {
    const session = await getSession();
    if (!session || session.role !== "siswa") {
      return { success: false, error: "Unauthorized" };
    }

    const student = await prisma.student.findUnique({
      where: { nisn: session.nisn }
    });

    if (!student) {
      return { success: false, error: "Siswa tidak ditemukan." };
    }

    let updated = [...(student.extracurriculars || [])];
    if (updated.includes(ekskulName)) {
      updated = updated.filter(e => e !== ekskulName);
    } else {
      updated.push(ekskulName);
    }

    await prisma.student.update({
      where: { nisn: session.nisn },
      data: { extracurriculars: updated }
    });

    return { success: true, extracurriculars: updated };
  } catch (e) {
    console.error(e);
    return { success: false, error: "Gagal memperbarui keikutsertaan ekstrakurikuler." };
  }
}

export async function uploadStudentProfilePhoto(formData) {
  try {
    const session = await getSession();
    if (!session || session.role !== "siswa") {
      return { success: false, error: "Unauthorized" };
    }

    const file = formData.get('photo');
    if (!file || typeof file === 'string') {
      return { success: false, error: "File foto tidak valid." };
    }

    // Validasi tipe file - hanya gambar
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return { success: false, error: "Hanya file gambar (JPG, PNG, WEBP, GIF) yang diperbolehkan." };
    }

    // Validasi ukuran file - max 5MB
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return { success: false, error: "Ukuran foto maksimal 5MB." };
    }

    const ext = file.name.split('.').pop().toLowerCase();
    const uniqueFilename = `profile-photos/profile_${session.nisn}_${Date.now()}.${ext}`;
    
    const blob = await put(uniqueFilename, file, { access: 'public' });
    const photoUrl = blob.url;

    // Update profil siswa di database
    await prisma.student.update({
      where: { nisn: session.nisn },
      data: { profilePhoto: photoUrl }
    });

    return { success: true, photoUrl };
  } catch (e) {
    console.error("Upload profile photo error:", e);
    return { success: false, error: "Gagal mengunggah foto profil: " + e.message };
  }
}

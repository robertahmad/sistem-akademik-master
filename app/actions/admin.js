"use server";

import prisma from "../../lib/prisma";
import bcrypt from "bcryptjs";
import { getSession } from "../../lib/auth";
import { put } from "@vercel/blob";
import { revalidatePath } from "next/cache";

export async function getAdminDashboard() {
  console.log("getAdminDashboard invoked");
  try {
    const session = await getSession();
    console.log("getAdminDashboard session parsed:", session ? "YES" : "NO");
    if (!session || session.role !== "admin") {
      return { success: false, error: "Unauthorized" };
    }

    let school = await prisma.school.findFirst({
      where: { id: 1 }
    });

    if (!school) {
      school = await prisma.school.create({
        data: { id: 1 }
      });
    }

    const teachers = await prisma.teacher.findMany({
      orderBy: { name: "asc" }
    });

    const students = await prisma.student.findMany({
      include: {
        grades: true,
        extracurricularGrades: true,
        raporRecords: true
      },
      orderBy: { name: "asc" }
    });

    const subjects = await prisma.subject.findMany({
      orderBy: { name: "asc" }
    });

    const extracurriculars = await prisma.extracurricular.findMany({
      orderBy: { name: "asc" }
    });

    const examSchedules = await prisma.examSchedule.findMany({
      orderBy: { startTime: "asc" }
    });

    return {
      success: true,
      school,
      teachers,
      students,
      subjects,
      extracurriculars,
      examSchedules
    };
  } catch (e) {
    console.error("CRITICAL ERROR IN getAdminDashboard:", e);
    return { success: false, error: "Gagal mengambil data dashboard admin. Error: " + e.message };
  }
}

export async function saveSchoolProfile(data) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "admin" && session.role !== "kepsek")) {
      return { success: false, error: "Unauthorized" };
    }

    let updatedPassword = data.kepsekPassword || "kepsek123";
    if (updatedPassword && !updatedPassword.startsWith("$2a$") && !updatedPassword.startsWith("$2b$")) {
      const salt = bcrypt.genSaltSync(10);
      updatedPassword = bcrypt.hashSync(updatedPassword, salt);
    }

    await prisma.school.upsert({
      where: { id: 1 },
      update: {
        nama: data.nama,
        npsn: data.npsn,
        alamat: data.alamat,
        logo: data.logo,
        kepsek: data.kepsek,
        kepsekNip: data.kepsekNip,
        kepsekUsername: data.kepsekUsername || "kepsek",
        kepsekPassword: updatedPassword,
        semester: data.semester,
        tahunAjaran: data.tahunAjaran,
        tanggalCetak: data.tanggalCetak,
        utsMode: data.utsMode || "online",
        uasMode: data.uasMode || "offline",
        pajMode: data.pajMode || "offline",
        yayasan: data.yayasan,
        skIjin: data.skIjin,
        nss: data.nss,
        telepon: data.telepon,
        email: data.email,
        komite: data.komite,
        kepalaTu: data.kepalaTu,
        wakaKur: data.wakaKur,
        wakaSis: data.wakaSis,

        // Konten Beranda
        heroTitle: data.heroTitle,
        heroSubtitle: data.heroSubtitle,
        sambutanTitle: data.sambutanTitle,
        sambutanText: data.sambutanText,
        sambutanAuthor: data.sambutanAuthor,

        // Konten Profil
        sejarahTitle: data.sejarahTitle,
        sejarahText: data.sejarahText,
        visiText: data.visiText,
        misiText: data.misiText,

        // Konten Akademik
        akademikText: data.akademikText,
        kurikulumDetail: data.kurikulumDetail,
        jamBelajar: data.jamBelajar,
        kriteriaLulus: data.kriteriaLulus,

        // Konten Galeri
        galeriImages: data.galeriImages,

        // Konten Kontak
        googleMapsUrl: data.googleMapsUrl,
        jamPelayanan: data.jamPelayanan,
        batasJamHadirSiswa: data.batasJamHadirSiswa,
        batasJamHadirGuru: data.batasJamHadirGuru
      },
      create: {
        id: 1,
        nama: data.nama,
        npsn: data.npsn,
        alamat: data.alamat,
        logo: data.logo,
        kepsek: data.kepsek,
        kepsekNip: data.kepsekNip,
        kepsekUsername: data.kepsekUsername || "kepsek",
        kepsekPassword: updatedPassword,
        semester: data.semester,
        tahunAjaran: data.tahunAjaran,
        tanggalCetak: data.tanggalCetak,
        yayasan: data.yayasan || "",
        skIjin: data.skIjin || "",
        nss: data.nss || "",
        telepon: data.telepon || "",
        email: data.email || "",
        komite: data.komite || "",
        kepalaTu: data.kepalaTu || "",
        wakaKur: data.wakaKur || "",
        wakaSis: data.wakaSis || "",
        batasJamHadirSiswa: data.batasJamHadirSiswa || "07:00",
        batasJamHadirGuru: data.batasJamHadirGuru || "06:45"
      }
    });

    return { success: true };
  } catch (e) {
    console.error(e);
    return { success: false, error: "Gagal memperbarui profil sekolah." };
  }
}

export async function uploadSchoolLogo(formData) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "admin" && session.role !== "kepsek")) {
      return { success: false, error: "Unauthorized" };
    }

    const file = formData.get('photo');
    if (!file || typeof file === 'string') {
      return { success: false, error: "File logo tidak valid." };
    }

    const ext = file.name.split('.').pop().toLowerCase();
    const uniqueFilename = `school-logo_${Date.now()}.${ext}`;
    
    const blob = await put(uniqueFilename, file, { access: 'public' });

    return { success: true, photoUrl: blob.url };
  } catch (e) {
    console.error(e);
    return { success: false, error: "Gagal mengunggah logo: " + e.message };
  }
}

export async function addTeacher(teacherData) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return { success: false, error: "Unauthorized" };
    }

    // Cek duplikasi username
    const dupTeacher = await prisma.teacher.findUnique({ where: { username: teacherData.username } });
    const dupStudent = await prisma.student.findUnique({ where: { username: teacherData.username } });
    if (dupTeacher || dupStudent || teacherData.username === "admin") {
      return { success: false, error: "Username sudah digunakan di portal." };
    }

    const hashedPassword = bcrypt.hashSync(teacherData.password, 10);

    const rawTunjangan = parseInt(teacherData.tunjangan, 10);
    const cleanTunjangan = isNaN(rawTunjangan) ? 0 : rawTunjangan;

    const rawCustomInsentif = parseInt(teacherData.customInsentif, 10);
    const cleanCustomInsentif = isNaN(rawCustomInsentif) || rawCustomInsentif <= 0 ? null : rawCustomInsentif;

    await prisma.teacher.create({
      data: {
        name: teacherData.name,
        nip: teacherData.nip || "-",
        subjects: teacherData.subjects || [],
        extracurriculars: teacherData.extracurriculars || [],
        role: teacherData.role,
        kelas: teacherData.kelas || "",
        username: teacherData.username,
        password: hashedPassword,
        jabatan: teacherData.jabatan || "-",
        tunjangan: cleanTunjangan,
        customInsentif: cleanCustomInsentif
      }
    });

    return { success: true };
  } catch (e) {
    console.error(e);
    return { success: false, error: "Gagal menambahkan guru baru." };
  }
}

export async function deleteTeacher(id) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return { success: false, error: "Unauthorized" };
    }

    await prisma.teacher.delete({
      where: { id }
    });

    return { success: true };
  } catch (e) {
    console.error(e);
    return { success: false, error: "Gagal menghapus guru." };
  }
}

export async function addStudent(studentData) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return { success: false, error: "Unauthorized" };
    }

    // Cek duplikasi NISN & Username
    const dupNisn = await prisma.student.findUnique({ where: { nisn: studentData.nisn } });
    if (dupNisn) {
      return { success: false, error: "NISN siswa sudah terdaftar." };
    }

    const dupTeacher = await prisma.teacher.findUnique({ where: { username: studentData.username } });
    const dupStudent = await prisma.student.findUnique({ where: { username: studentData.username } });
    if (dupTeacher || dupStudent || studentData.username === "admin") {
      return { success: false, error: "Username login siswa sudah digunakan." };
    }

    const hashedPassword = bcrypt.hashSync(studentData.password, 10);

    // Dapatkan data mata pelajaran aktif untuk inisialisasi nilai
    const subjects = await prisma.subject.findMany({});

    await prisma.$transaction(async (tx) => {
      const student = await tx.student.create({
        data: {
          name: studentData.name,
          nisn: studentData.nisn,
          nis: studentData.nis || "-",
          jenisKelamin: studentData.jenisKelamin || "",
          kelas: studentData.kelas || "",
          alamat: studentData.alamat || "",
          namaOrangTua: studentData.namaOrangTua || "",
          namaAyah: studentData.namaAyah || "",
          namaIbu: studentData.namaIbu || "",
          pekerjaanAyah: studentData.pekerjaanAyah || "",
          pekerjaanIbu: studentData.pekerjaanIbu || "",
          asalSekolah: studentData.asalSekolah || "",
          tempatLahir: studentData.tempatLahir || "",
          tanggalLahir: studentData.tanggalLahir || "",
          tanggalMasuk: studentData.tanggalMasuk || "",
          username: studentData.username,
          password: hashedPassword
        }
      });

      // Inisialisasi Nilai Mapel Kosong
      const gradeCreates = subjects.map(sub => ({
        studentNisn: student.nisn,
        subjectName: sub.name,
        tugas1: 0,
        tugas2: 0
      }));

      if (gradeCreates.length > 0) {
        await tx.grade.createMany({
          data: gradeCreates
        });
      }
    });

    return { success: true };
  } catch (e) {
    console.error(e);
    return { success: false, error: "Gagal menambahkan siswa baru." };
  }
}

export async function deleteStudent(id) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return { success: false, error: "Unauthorized" };
    }

    await prisma.student.delete({
      where: { id }
    });

    return { success: true };
  } catch (e) {
    console.error(e);
    return { success: false, error: "Gagal menghapus siswa." };
  }
}

export async function importStudentsExcel(studentsList) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return { success: false, error: "Unauthorized" };
    }

    const subjects = await prisma.subject.findMany({});
    let importedCount = 0;

    for (const studentData of studentsList) {
      // Cek duplikasi NISN & Username
      const dupNisn = await prisma.student.findUnique({ where: { nisn: studentData.nisn } });
      const dupTeacher = await prisma.teacher.findUnique({ where: { username: studentData.username } });
      const dupStudent = await prisma.student.findUnique({ where: { username: studentData.username } });

      if (!dupNisn && !dupTeacher && !dupStudent && studentData.username !== "admin") {
        const hashedPassword = bcrypt.hashSync(studentData.password, 10);

        await prisma.$transaction(async (tx) => {
          const student = await tx.student.create({
            data: {
              name: studentData.name,
              nisn: studentData.nisn,
              nis: studentData.nis || "-",
              jenisKelamin: studentData.jenisKelamin || "",
              kelas: studentData.kelas || "",
              alamat: studentData.alamat || "",
              namaOrangTua: studentData.namaOrangTua || "",
              namaAyah: studentData.namaAyah || "",
              namaIbu: studentData.namaIbu || "",
              pekerjaanAyah: studentData.pekerjaanAyah || "",
              pekerjaanIbu: studentData.pekerjaanIbu || "",
              asalSekolah: studentData.asalSekolah || "",
              tempatLahir: studentData.tempatLahir || "",
              tanggalLahir: studentData.tanggalLahir || "",
              tanggalMasuk: studentData.tanggalMasuk || "",
              username: studentData.username,
              password: hashedPassword
            }
          });

          const gradeCreates = subjects.map(sub => ({
            studentNisn: student.nisn,
            subjectName: sub.name,
            tugas1: 0,
            tugas2: 0
          }));

          if (gradeCreates.length > 0) {
            await tx.grade.createMany({
              data: gradeCreates
            });
          }
        });

        importedCount++;
      }
    }

    return { success: true, count: importedCount };
  } catch (e) {
    console.error(e);
    return { success: false, error: "Gagal mengimpor siswa dari file Excel." };
  }
}

export async function addSubject(subjectData) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return { success: false, error: "Unauthorized" };
    }

    const dup = await prisma.subject.findUnique({
      where: { name: subjectData.name }
    });
    if (dup) {
      return { success: false, error: "Mata pelajaran sudah terdaftar." };
    }

    await prisma.subject.create({
      data: {
        name: subjectData.name,
        kelompok: subjectData.kelompok || "A",
        untuk_kelas: subjectData.untuk_kelas || "Semua",
        untuk_semester: subjectData.untuk_semester || "Semua",
        kkm: parseInt(subjectData.kkm, 10) || 75,
        cpA: subjectData.cpA || "Sangat baik dalam menguasai seluruh materi pelajaran.",
        cpB: subjectData.cpB || "Baik dalam menguasai sebagian besar materi pelajaran.",
        cpC: subjectData.cpC || "Cukup dalam menguasai beberapa materi pelajaran.",
        cpD: subjectData.cpD || "Kurang dalam memahami kompetensi dasar pelajaran.",
        cps: subjectData.cps || null
      }
    });

    return { success: true };
  } catch (e) {
    console.error(e);
    return { success: false, error: "Gagal menambahkan mata pelajaran." };
  }
}

export async function editSubject(id, subjectData) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return { success: false, error: "Unauthorized" };
    }

    const dup = await prisma.subject.findUnique({
      where: { name: subjectData.name }
    });
    if (dup && dup.id !== id) {
      return { success: false, error: "Nama mata pelajaran sudah dipakai oleh mata pelajaran lain." };
    }

    await prisma.subject.update({
      where: { id },
      data: {
        name: subjectData.name,
        kelompok: subjectData.kelompok || "A",
        untuk_kelas: subjectData.untuk_kelas || "Semua",
        untuk_semester: subjectData.untuk_semester || "Semua",
        kkm: parseInt(subjectData.kkm, 10) || 75,
        cpA: subjectData.cpA || "Sangat baik dalam menguasai seluruh materi pelajaran.",
        cpB: subjectData.cpB || "Baik dalam menguasai sebagian besar materi pelajaran.",
        cpC: subjectData.cpC || "Cukup dalam menguasai beberapa materi pelajaran.",
        cpD: subjectData.cpD || "Kurang dalam memahami kompetensi dasar pelajaran.",
        cps: subjectData.cps || null
      }
    });

    return { success: true };
  } catch (e) {
    console.error(e);
    return { success: false, error: "Terjadi kesalahan server saat memperbarui mata pelajaran." };
  }
}
export async function deleteSubject(id) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return { success: false, error: "Unauthorized" };
    }

    await prisma.subject.delete({
      where: { id }
    });

    return { success: true };
  } catch (e) {
    console.error(e);
    return { success: false, error: "Gagal menghapus mata pelajaran." };
  }
}

export async function addExtracurricular(name) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return { success: false, error: "Unauthorized" };
    }

    const dup = await prisma.extracurricular.findUnique({
      where: { name }
    });
    if (dup) {
      return { success: false, error: "Ekstrakurikuler sudah terdaftar." };
    }

    await prisma.extracurricular.create({
      data: { name }
    });

    return { success: true };
  } catch (e) {
    console.error(e);
    return { success: false, error: "Gagal menambahkan ekstrakurikuler." };
  }
}

export async function deleteExtracurricular(id) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return { success: false, error: "Unauthorized" };
    }

    await prisma.extracurricular.delete({
      where: { id }
    });

    return { success: true };
  } catch (e) {
    console.error(e);
    return { success: false, error: "Gagal menghapus ekstrakurikuler." };
  }
}

export async function updateTeacherPassword(id, newPassword) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return { success: false, error: "Unauthorized" };
    }

    const hashedPassword = bcrypt.hashSync(newPassword, 10);
    await prisma.teacher.update({
      where: { id },
      data: { password: hashedPassword }
    });

    return { success: true };
  } catch (e) {
    console.error(e);
    return { success: false, error: "Gagal memperbarui password guru." };
  }
}

export async function updateStudentPassword(id, newPassword) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return { success: false, error: "Unauthorized" };
    }

    const hashedPassword = bcrypt.hashSync(newPassword, 10);
    await prisma.student.update({
      where: { id },
      data: { password: hashedPassword }
    });

    return { success: true };
  } catch (e) {
    console.error(e);
    return { success: false, error: "Gagal memperbarui password siswa." };
  }
}

export async function saveExamSchedule(data) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return { success: false, error: "Unauthorized" };
    }

    const { subjectName, category, semester, startTime, endTime, forceOpen } = data;

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return { success: false, error: "Tanggal mulai atau selesai tidak valid." };
    }

    if (start >= end) {
      return { success: false, error: "Waktu selesai harus setelah waktu mulai." };
    }

    const existing = await prisma.examSchedule.findUnique({
      where: {
        subjectName_category_semester: {
          subjectName,
          category,
          semester: String(semester)
        }
      }
    });

    if (existing) {
      await prisma.examSchedule.update({
        where: { id: existing.id },
        data: {
          startTime: start,
          endTime: end,
          forceOpen: Boolean(forceOpen)
        }
      });
    } else {
      await prisma.examSchedule.create({
        data: {
          subjectName,
          category,
          semester: String(semester),
          startTime: start,
          endTime: end,
          forceOpen: Boolean(forceOpen)
        }
      });
    }

    return { success: true };
  } catch (e) {
    console.error(e);
    return { success: false, error: "Gagal menyimpan jadwal ujian." };
  }
}

export async function deleteExamSchedule(id) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return { success: false, error: "Unauthorized" };
    }

    await prisma.examSchedule.delete({
      where: { id }
    });

    return { success: true };
  } catch (e) {
    console.error(e);
    return { success: false, error: "Gagal menghapus jadwal ujian." };
  }
}

export async function updateStudent(id, studentData) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return { success: false, error: "Unauthorized" };
    }

    const existingStudent = await prisma.student.findUnique({
      where: { id }
    });

    if (!existingStudent) {
      return { success: false, error: "Siswa tidak ditemukan" };
    }

    // Periksa apakah NISN baru sudah digunakan oleh siswa lain
    if (studentData.nisn !== existingStudent.nisn) {
      const dup = await prisma.student.findUnique({
        where: { nisn: studentData.nisn }
      });
      if (dup) {
        return { success: false, error: "NISN baru sudah digunakan oleh siswa lain" };
      }
    }

    // Periksa apakah Username baru sudah digunakan oleh user lain
    if (studentData.username !== existingStudent.username) {
      const dupSiswa = await prisma.student.findUnique({
        where: { username: studentData.username }
      });
      const dupGuru = await prisma.teacher.findUnique({
        where: { username: studentData.username }
      });
      if (dupSiswa || dupGuru || studentData.username === "admin") {
        return { success: false, error: "Username baru sudah digunakan" };
      }
    }

    await prisma.$transaction(async (tx) => {
      // Jika NISN berubah, update seluruh relasi terlebih dahulu agar referensi tidak putus
      if (studentData.nisn !== existingStudent.nisn) {
        await tx.grade.updateMany({
          where: { studentNisn: existingStudent.nisn },
          data: { studentNisn: studentData.nisn }
        });
        await tx.extracurricularGrade.updateMany({
          where: { studentNisn: existingStudent.nisn },
          data: { studentNisn: studentData.nisn }
        });
        await tx.raporRecord.updateMany({
          where: { studentNisn: existingStudent.nisn },
          data: { studentNisn: studentData.nisn }
        });
        await tx.examSubmission.updateMany({
          where: { studentNisn: existingStudent.nisn },
          data: { studentNisn: studentData.nisn }
        });
      }

      // Update data siswa
      await tx.student.update({
        where: { id },
        data: {
          name: studentData.name,
          nis: studentData.nis || "-",
          nisn: studentData.nisn,
          jenisKelamin: studentData.jenisKelamin || "",
          tempatLahir: studentData.tempatLahir || "",
          tanggalLahir: studentData.tanggalLahir || "",
          namaOrangTua: studentData.namaOrangTua || "",
          namaAyah: studentData.namaAyah || "",
          namaIbu: studentData.namaIbu || "",
          pekerjaanAyah: studentData.pekerjaanAyah || "",
          pekerjaanIbu: studentData.pekerjaanIbu || "",
          asalSekolah: studentData.asalSekolah || "",
          tanggalMasuk: studentData.tanggalMasuk || "",
          kelas: studentData.kelas || "",
          alamat: studentData.alamat || "",
          username: studentData.username,
          extracurriculars: studentData.extracurriculars || []
        }
      });
    });

    return { success: true };
  } catch (error) {
    console.error("Error updating student:", error);
    return { success: false, error: error.message || "Gagal mengubah data siswa" };
  }
}

export async function updateTeacher(id, teacherData) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return { success: false, error: "Unauthorized" };
    }

    const existingTeacher = await prisma.teacher.findUnique({
      where: { id }
    });

    if (!existingTeacher) {
      return { success: false, error: "Guru tidak ditemukan." };
    }

    // Cek duplikasi username
    if (teacherData.username !== existingTeacher.username) {
      const dupTeacher = await prisma.teacher.findUnique({ where: { username: teacherData.username } });
      const dupStudent = await prisma.student.findUnique({ where: { username: teacherData.username } });
      if (dupTeacher || dupStudent || teacherData.username === "admin") {
        return { success: false, error: "Username sudah digunakan di portal." };
      }
    }

    const rawTunjangan = parseInt(teacherData.tunjangan, 10);
    const cleanTunjangan = isNaN(rawTunjangan) ? 0 : rawTunjangan;

    const rawCustomInsentif = parseInt(teacherData.customInsentif, 10);
    const cleanCustomInsentif = isNaN(rawCustomInsentif) || rawCustomInsentif <= 0 ? null : rawCustomInsentif;

    await prisma.teacher.update({
      where: { id },
      data: {
        name: teacherData.name,
        nip: teacherData.nip || "-",
        subjects: teacherData.subjects || [],
        extracurriculars: teacherData.extracurriculars || [],
        role: teacherData.role,
        kelas: teacherData.role === "wali-kelas" ? (teacherData.kelas || "") : "",
        username: teacherData.username,
        jabatan: teacherData.jabatan || "-",
        tunjangan: cleanTunjangan,
        customInsentif: cleanCustomInsentif
      }
    });

    return { success: true };
  } catch (error) {
    console.error("Error updating teacher:", error);
    return { success: false, error: error.message || "Gagal mengubah data guru." };
  }
}

export async function updateTeacherCustomInsentif(id, customInsentif) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "admin" && !session.isBendahara)) {
      return { success: false, error: "Unauthorized" };
    }

    const rawInsentif = parseInt(customInsentif, 10);
    const cleanInsentif = isNaN(rawInsentif) || rawInsentif <= 0 ? null : rawInsentif;

    await prisma.teacher.update({
      where: { id },
      data: { customInsentif: cleanInsentif }
    });

    return { success: true };
  } catch (error) {
    console.error("Error updating custom insentif:", error);
    return { success: false, error: "Gagal menyimpan insentif khusus." };
  }
}

export async function getSchoolProfilePublic() {
  try {
    let school = await prisma.school.findFirst({
      where: { id: 1 }
    });
    
    if (!school) {
      school = await prisma.school.create({
        data: { id: 1 }
      });
    }

    return { success: true, school };
  } catch (error) {
    console.error("Error fetching public school profile:", error);
    return { success: false, error: error.message || "Gagal mengambil profil sekolah" };
  }
}

export async function getMajors() {
  try {
    let majors = await prisma.major.findMany({
      orderBy: { code: "asc" }
    });
    
    // Auto-seed DKV jika belum ada
    if (majors.length === 0) {
      await prisma.major.create({
        data: {
          code: "DKV",
          name: "Desain Komunikasi Visual",
          unit: "SMK"
        }
      });
      majors = await prisma.major.findMany({ orderBy: { code: "asc" } });
    }

    return { success: true, majors };
  } catch (error) {
    console.error("Error fetching majors:", error);
    return { success: false, error: error.message || "Gagal mengambil data jurusan" };
  }
}

export async function saveMajor(data) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "admin" && session.role !== "kepsek")) {
      return { success: false, error: "Unauthorized" };
    }

    const { code, name, unit } = data;
    if (!code || !name) {
      return { success: false, error: "Kode dan Nama Jurusan wajib diisi." };
    }

    const cleanCode = code.trim().toUpperCase();
    const cleanName = name.trim();

    await prisma.major.upsert({
      where: { code: cleanCode },
      update: { name: cleanName, unit: unit || "SMK" },
      create: { code: cleanCode, name: cleanName, unit: unit || "SMK" }
    });

    return { success: true };
  } catch (error) {
    console.error("Error saving major:", error);
    return { success: false, error: error.message || "Gagal menyimpan jurusan" };
  }
}

export async function deleteMajor(id) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "admin" && session.role !== "kepsek")) {
      return { success: false, error: "Unauthorized" };
    }

    await prisma.major.delete({ where: { id } });
    return { success: true };
  } catch (error) {
    console.error("Error deleting major:", error);
    return { success: false, error: error.message || "Gagal menghapus jurusan" };
  }
}

export async function importOldSmkData() {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return { success: false, error: "Unauthorized" };
    }

    const hashedDefaultPassword = await bcrypt.hash("123", 10);

    // LIVE SYNC: Tarik data riil langsung dari Database Neon milik domain smk-al-qodiriyah-windusari-next.vercel.app
    const OLD_DB_URL = "postgresql://neondb_owner:npg_5YH3cVuFWSMi@ep-spring-tree-at60vadx-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require";
    try {
      const oldPrisma = new PrismaClient({
        datasources: { db: { url: OLD_DB_URL } }
      });

      const oldSchool = await oldPrisma.school.findFirst();
      const oldStudents = await oldPrisma.student.findMany();
      const oldTeachers = await oldPrisma.teacher.findMany();
      const oldSubjects = await oldPrisma.subject.findMany();
      const oldQuestions = await oldPrisma.question.findMany();
      const oldExamSchedules = await oldPrisma.examSchedule.findMany();

      console.log(`Retrieved from old SMK domain DB: ${oldStudents.length} students, ${oldTeachers.length} teachers, ${oldSubjects.length} subjects, ${oldQuestions.length} questions`);

      if (oldSchool) {
        await prisma.school.upsert({
          where: { id: 1 },
          update: {
            nama: "SMP & SMK MASTER DEMO KOTA DEMO (TERPADU)",
            npsn: oldSchool.npsn || "69901347",
            alamat: oldSchool.alamat || undefined,
            logo: oldSchool.logo || undefined,
            kepsek: oldSchool.kepsek || undefined,
            kepsekNip: oldSchool.kepsekNip || undefined,
            yayasan: oldSchool.yayasan || undefined,
            heroTitle: oldSchool.heroTitle || "Membentuk Generasi Cerdas, Terampil & Berintegritas",
            heroSubtitle: oldSchool.heroSubtitle || "SMP & Sekolah Master Demo memadukan keunggulan akademis & keahlian DKV dengan pembinaan akhlak mulia berkarakter Islami.",
            sambutanTitle: oldSchool.sambutanTitle || "Selamat Datang di SMP & Sekolah Master Demo",
            sambutanText: oldSchool.sambutanText || undefined,
            sambutanAuthor: oldSchool.sambutanAuthor || undefined,
            sejarahTitle: oldSchool.sejarahTitle || "Perjalanan SMP & Sekolah Master Demo",
            sejarahText: oldSchool.sejarahText || undefined,
            visiText: oldSchool.visiText || undefined,
            misiText: oldSchool.misiText || undefined,
            akademikText: oldSchool.akademikText || undefined,
            galeriImages: oldSchool.galeriImages || undefined,
            googleMapsUrl: oldSchool.googleMapsUrl || undefined,
            jamPelayanan: oldSchool.jamPelayanan || undefined
          },
          create: {
            id: 1,
            nama: "SMP & SMK MASTER DEMO KOTA DEMO (TERPADU)",
            npsn: oldSchool.npsn || "69901347",
            alamat: oldSchool.alamat || "Jegedeh Wahyurejo, Candisari, Kota Demo, Magelang",
            heroTitle: oldSchool.heroTitle || "Membentuk Generasi Cerdas, Terampil & Berintegritas",
            heroSubtitle: oldSchool.heroSubtitle || "SMP & Sekolah Master Demo memadukan keunggulan akademis & keahlian DKV dengan pembinaan akhlak mulia berkarakter Islami.",
            sambutanTitle: oldSchool.sambutanTitle || "Selamat Datang di SMP & Sekolah Master Demo",
            sejarahTitle: oldSchool.sejarahTitle || "Perjalanan SMP & Sekolah Master Demo",
            sejarahText: oldSchool.sejarahText || `SMP & Sekolah Master Demo didirikan di bawah naungan Yayasan Edukasi Master.`,
            visiText: oldSchool.visiText || "Terwujudnya insan yang bertakwa, berakhlak mulia, terampil, profesional.",
            akademikText: oldSchool.akademikText || "SMP & Sekolah Master Demo menerapkan Kurikulum Merdeka Kejuruan (DKV)."
          }
        });
      }

      for (const sub of oldSubjects) {
        const existing = await prisma.subject.findFirst({ where: { name: sub.name } });
        if (!existing) {
          await prisma.subject.create({
            data: {
              name: sub.name,
              kkm: sub.kkm,
              cpA: sub.cpA,
              cpB: sub.cpB,
              cpC: sub.cpC,
              cpD: sub.cpD,
              unit: "SMK"
            }
          });
        }
      }

      for (const t of oldTeachers) {
        const existing = await prisma.teacher.findUnique({ where: { username: t.username } });
        if (!existing) {
          await prisma.teacher.create({
            data: {
              name: t.name,
              nip: t.nip,
              subjects: t.subjects,
              extracurriculars: t.extracurriculars,
              role: t.role,
              kelas: t.kelas,
              username: t.username,
              password: t.password,
              foto: t.foto,
              isBendahara: t.isBendahara,
              jamMengajar: t.jamMengajar,
              jabatan: t.jabatan,
              tunjangan: t.tunjangan,
              unit: "SMK"
            }
          });
        }
      }

      for (const st of oldStudents) {
        const existing = await prisma.student.findUnique({ where: { nisn: st.nisn } });
        if (!existing) {
          await prisma.student.create({
            data: {
              name: st.name,
              nisn: st.nisn,
              nis: st.nis,
              jenisKelamin: st.jenisKelamin,
              kelas: st.kelas,
              alamat: st.alamat,
              namaOrangTua: st.namaOrangTua,
              namaAyah: st.namaAyah,
              namaIbu: st.namaIbu,
              pekerjaanAyah: st.pekerjaanAyah,
              pekerjaanIbu: st.pekerjaanIbu,
              asalSekolah: st.asalSekolah,
              tempatLahir: st.tempatLahir,
              tanggalLahir: st.tanggalLahir,
              tanggalMasuk: st.tanggalMasuk,
              username: st.username,
              password: st.password,
              foto: st.foto,
              unit: "SMK"
            }
          });
        } else {
          await prisma.student.update({
            where: { nisn: st.nisn },
            data: { unit: "SMK", kelas: st.kelas }
          });
        }
      }

      for (const q of oldQuestions) {
        const existing = await prisma.question.findFirst({ where: { question: q.question } });
        if (!existing) {
          await prisma.question.create({
            data: {
              subject: q.subject,
              question: q.question,
              choices: q.choices,
              correct: q.correct,
              questionType: q.questionType,
              correctChoices: q.correctChoices,
              attachment: q.attachment,
              kelas: q.kelas,
              semester: q.semester
            }
          });
        }
      }

      for (const es of oldExamSchedules) {
        const existing = await prisma.examSchedule.findFirst({ where: { subjectName: es.subjectName, category: es.category } });
        if (!existing) {
          await prisma.examSchedule.create({
            data: {
              subjectName: es.subjectName,
              category: es.category,
              semester: es.semester,
              startTime: es.startTime,
              endTime: es.endTime,
              forceOpen: es.forceOpen
            }
          });
        }
      }

      await oldPrisma.$disconnect();
    } catch (oldDbErr) {
      console.warn("Live DB sync warning (fallback to local seed):", oldDbErr.message);
    }

    // 0. Fallback School Profile Update
    await prisma.school.upsert({
      where: { id: 1 },
      update: {
        nama: "SMP & SMK MASTER DEMO KOTA DEMO (TERPADU)",
        heroTitle: "Membentuk Generasi Cerdas, Terampil & Berintegritas",
        heroSubtitle: "SMP & Sekolah Master Demo memadukan keunggulan akademis & keahlian DKV dengan pembinaan akhlak mulia berkarakter Islami.",
        sambutanTitle: "Selamat Datang di SMP & Sekolah Master Demo",
        sejarahTitle: "Perjalanan SMP & Sekolah Master Demo",
        sejarahText: `SMP & Sekolah Master Demo didirikan di bawah naungan Yayasan Edukasi Master untuk menyediakan sarana pendidikan tingkat menengah SMP dan SMK kejuruan (Desain Komunikasi Visual) yang berkualitas, terjangkau, dan sarat akan pembinaan moral keagamaan bagi masyarakat di lereng Gunung Sumbing, Kota Demo, Magelang.\n\nDengan komitmen pengembangan berkelanjutan, unit SMK menghadirkan Program Keahlian Desain Komunikasi Visual (DKV) untuk mencetak lulusan yang terampil secara teknis, berjiwa wirausaha, serta berakhlak mulia.`,
        visiText: "Terwujudnya insan yang bertakwa, berakhlak mulia, terampil, profesional, menguasai ilmu pengetahuan teknologi, dan berwawasan keahlian global.",
        akademikText: "SMP & Sekolah Master Demo menerapkan Kurikulum Merdeka Kejuruan (DKV) yang dikolaborasikan secara dinamis dengan bimbingan kepesantrenan untuk menyeimbangkan kompetensi profesional dengan pembentukan karakter Islami."
      },
      create: {
        id: 1,
        nama: "SMP & SMK MASTER DEMO KOTA DEMO (TERPADU)",
        npsn: "69901347",
        alamat: "Jegedeh Wahyurejo, Candisari, Kota Demo, Magelang",
        heroTitle: "Membentuk Generasi Cerdas, Terampil & Berintegritas",
        heroSubtitle: "SMP & Sekolah Master Demo memadukan keunggulan akademis & keahlian DKV dengan pembinaan akhlak mulia berkarakter Islami.",
        sambutanTitle: "Selamat Datang di SMP & Sekolah Master Demo",
        sejarahTitle: "Perjalanan SMP & Sekolah Master Demo",
        sejarahText: `SMP & Sekolah Master Demo didirikan di bawah naungan Yayasan Edukasi Master untuk menyediakan sarana pendidikan tingkat menengah SMP dan SMK kejuruan (Desain Komunikasi Visual) yang berkualitas, terjangkau, dan sarat akan pembinaan moral keagamaan bagi masyarakat di lereng Gunung Sumbing, Kota Demo, Magelang.\n\nDengan komitmen pengembangan berkelanjutan, unit SMK menghadirkan Program Keahlian Desain Komunikasi Visual (DKV) untuk mencetak lulusan yang terampil secara teknis, berjiwa wirausaha, serta berakhlak mulia.`,
        visiText: "Terwujudnya insan yang bertakwa, berakhlak mulia, terampil, profesional, menguasai ilmu pengetahuan teknologi, dan berwawasan keahlian global.",
        akademikText: "SMP & Sekolah Master Demo menerapkan Kurikulum Merdeka Kejuruan (DKV) yang dikolaborasikan secara dinamis dengan bimbingan kepesantrenan untuk menyeimbangkan kompetensi profesional dengan pembentukan karakter Islami."
      }
    });

    // 1. Ensure Major DKV exists
    await prisma.major.upsert({
      where: { code: "DKV" },
      update: { name: "Desain Komunikasi Visual", unit: "SMK" },
      create: { code: "DKV", name: "Desain Komunikasi Visual", unit: "SMK" }
    });

    // 2. Import SMK Subjects
    const smkSubjects = [
      {
        name: "Dasar-dasar DKV",
        kkm: 75,
        unit: "SMK",
        cpA: "Sangat mahir dalam memahami prinsip tata letak (layout), nirmana, membuat sketsa bentuk, serta terampil mengoperasikan software grafis standar.",
        cpB: "Sangat baik dalam membedakan jenis-jenis tipografi, psikologi warna, dan pembuatan vektor desain dasar.",
        cpC: "Cukup baik dalam pemahaman teori desain. Perlu memperbanyak latihan menggambar anatomi dan sketsa objek.",
        cpD: "Masih kesulitan mengoperasikan alat gambar digital dan membedakan format gambar standar. Perlu latihan intensif."
      },
      {
        name: "Konsentrasi Keahlian DKV",
        kkm: 75,
        unit: "SMK",
        cpA: "Sangat ahli dalam pembuatan desain identitas visual (branding), fotografi studio komersial, produksi videografi promosi, dan manipulasi gambar bitmap.",
        cpB: "Sangat terampil menggunakan kamera DSLR, mengoperasikan pencahayaan studio, serta melakukan editing video dengan transisi yang halus.",
        cpC: "Cukup aktif dalam kegiatan projek desain kelompok. Perlu melatih kerapian pengerjaan aset vektor.",
        cpD: "Kesulitan memahami teknik komposisi visual dan pengambilan sudut gambar (angle) kamera. Perlu asistensi khusus."
      },
      {
        name: "Projek Kreatif dan Kewirausahaan",
        kkm: 75,
        unit: "SMK",
        cpA: "Sangat baik dalam perancangan ide bisnis jasa desain, melakukan analisis SWOT pasar industri kreatif, serta mahir menyusun rencana pemasaran digital.",
        cpB: "Mampu memproduksi barang/jasa kreatif bernilai jual tinggi serta memahami konsep penghitungan harga pokok produksi (HPP).",
        cpC: "Cukup memahami konsep pemasaran media sosial. Perlu meningkatkan kemandirian dalam perancangan produk kreatif.",
        cpD: "Kesulitan dalam menyusun portofolio bisnis dan penghitungan laba/rugi usaha kreatif. Perlu bimbingan berkelanjutan."
      },
      {
        name: "Praktik Kerja Lapangan (PKL)",
        kkm: 75,
        unit: "SMK",
        cpA: "Menunjukkan etos kerja profesional yang sangat tinggi, disiplin waktu, inisiatif mandiri, serta terampil menyelesaikan projek desain pesanan klien industri.",
        cpB: "Mampu beradaptasi dengan baik di lingkungan divisi kreatif industri, sopan santun, dan mampu menyelesaikan tugas sesuai instruksi supervisor.",
        cpC: "Cukup aktif dalam kegiatan PKL harian. Perlu meningkatkan komunikasi dan kerja sama tim dengan pembimbing industri.",
        cpD: "Memerlukan pembinaan intensif terkait disiplin kehadiran dan etika komunikasi dengan rekan kerja industri."
      },
      {
        name: "Projek IPAS (SMK)",
        kkm: 75,
        unit: "SMK",
        cpA: "Sangat terampil dalam merancang eksperimen ilmiah sederhana, menganalisis interaksi mahluk hidup dengan lingkungan, serta peka terhadap isu lingkungan.",
        cpB: "Sangat baik dalam penyusunan laporan hasil projek ilmiah dan memahami konsep dasar sains fisika-biologi.",
        cpC: "Cukup baik dalam pengerjaan projek kelompok IPAS. Perlu meningkatkan kerja sama tim.",
        cpD: "Kurang berpartisipasi aktif dalam kegiatan projek sains lapangan. Perlu remedial penguasaan materi dasar."
      }
    ];

    for (const sub of smkSubjects) {
      const existing = await prisma.subject.findFirst({ where: { name: sub.name } });
      if (!existing) {
        await prisma.subject.create({ data: sub });
      }
    }

    // 3. Import SMK Teachers
    const smkTeachers = [
      {
        name: "Bapak Guru Ahmad, M.Pd.",
        nip: "19850312010",
        subjects: ["Dasar-dasar DKV", "Konsentrasi Keahlian DKV"],
        extracurriculars: ["Pramuka"],
        role: "wali-kelas",
        kelas: "12 DKV 1",
        username: "guru_ahmad_smk",
        password: hashedDefaultPassword,
        unit: "SMK"
      },
      {
        name: "Rina Wijayanti, S.Pd.",
        nip: "198906152014032002",
        subjects: ["Projek IPAS (SMK)", "Projek Kreatif dan Kewirausahaan"],
        extracurriculars: ["Paskibra"],
        role: "wali-kelas",
        kelas: "11 DKV 1",
        username: "rina_smk",
        password: hashedDefaultPassword,
        unit: "SMK"
      },
      {
        name: "Budi Santoso, S.Pd.",
        nip: "198512122010121001",
        subjects: ["Bahasa Indonesia", "Dasar-dasar DKV"],
        extracurriculars: ["Drum Band"],
        role: "wali-kelas",
        kelas: "10 DKV 1",
        username: "budi_smk",
        password: hashedDefaultPassword,
        unit: "SMK"
      }
    ];

    for (const t of smkTeachers) {
      const existing = await prisma.teacher.findUnique({ where: { username: t.username } });
      if (!existing) {
        await prisma.teacher.create({ data: t });
      }
    }

    // 4. Import SMK Students
    const smkStudents = [
      {
        name: "Ahmad Fauzi (XII DKV)",
        nisn: "0098765432",
        nis: "24000",
        kelas: "12 DKV 1",
        alamat: "Jl. KH. Ahmad Dahlan No. 34, Kota Demo",
        namaOrangTua: "H. Fauzi",
        namaAyah: "H. Fauzi",
        namaIbu: "Siti Rahmah",
        pekerjaanAyah: "Wiraswasta",
        pekerjaanIbu: "Ibu Rumah Tangga",
        asalSekolah: "Sekolah Master Demo",
        tempatLahir: "Magelang",
        tanggalLahir: "2009-03-10",
        tanggalMasuk: "2024-07-15",
        username: "siswa_fauzi_smk",
        password: hashedDefaultPassword,
        unit: "SMK"
      },
      {
        name: "Rizky Ramadhan (X DKV)",
        nisn: "0081234561",
        nis: "26271001",
        kelas: "10 DKV 1",
        alamat: "Kota Demo, Magelang",
        namaOrangTua: "Budi Santoso",
        namaAyah: "Budi Santoso",
        namaIbu: "Siti Aminah",
        pekerjaanAyah: "Wiraswasta",
        pekerjaanIbu: "Ibu Rumah Tangga",
        asalSekolah: "Sekolah Master Demo",
        tempatLahir: "Magelang",
        tanggalLahir: "2010-04-12",
        tanggalMasuk: "2026-07-15",
        username: "siswa_rizky_smk",
        password: hashedDefaultPassword,
        unit: "SMK"
      },
      {
        name: "Anisa Fitriani (X DKV)",
        nisn: "0081234562",
        nis: "26271002",
        kelas: "10 DKV 1",
        alamat: "Candisari, Magelang",
        namaOrangTua: "Slamet Rahardjo",
        namaAyah: "Slamet Rahardjo",
        namaIbu: "Sri Wahyuni",
        pekerjaanAyah: "Petani",
        pekerjaanIbu: "Pedagang",
        asalSekolah: "SMP N 1 Kota Demo",
        tempatLahir: "Magelang",
        tanggalLahir: "2010-08-20",
        tanggalMasuk: "2026-07-15",
        username: "siswa_anisa_smk",
        password: hashedDefaultPassword,
        unit: "SMK"
      }
    ];

    for (const st of smkStudents) {
      const existing = await prisma.student.findUnique({ where: { nisn: st.nisn } });
      if (!existing) {
        await prisma.student.create({ data: st });
      } else {
        await prisma.student.update({ where: { nisn: st.nisn }, data: { unit: "SMK", kelas: st.kelas } });
      }
    }

    return { success: true, message: "Berhasil memulihkan & mengimpor seluruh data portal SMK lama (Mata Pelajaran DKV, PKL, Projek IPAS, Guru SMK, & Siswa DKV)!" };
  } catch (error) {
    console.error("Error importing old SMK data:", error);
    return { success: false, error: error.message || "Gagal mengimpor data SMK lama" };
  }
}

export async function updateSubjectSemesters(id, semestersString) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      throw new Error("Unauthorized");
    }

    await prisma.subject.update({
      where: { id },
      data: { untuk_semester: semestersString }
    });
    
    revalidatePath("/portal/admin");
    return { success: true };
  } catch (error) {
    console.error("Error updating subject semesters:", error);
    return { success: false, error: error.message || "Gagal menyimpan semester" };
  }
}


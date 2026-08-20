"use server";

import prisma from "../../lib/prisma";
import { getSession } from "../../lib/auth";
import { headers } from "next/headers";

// 1. Simpan IP Publik Wi-Fi Sekolah
export async function saveSchoolIp(ipAddress) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return { success: false, error: "Unauthorized" };
    }

    await prisma.school.update({
      where: { id: 1 },
      data: { schoolIp: ipAddress || null }
    });

    return { success: true };
  } catch (e) {
    console.error(e);
    return { success: false, error: "Gagal menyimpan IP Sekolah: " + e.message };
  }
}

// 2. Tunjuk Bendahara Sekolah
export async function assignTreasurer(teacherId, isBendahara) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return { success: false, error: "Unauthorized" };
    }

    await prisma.teacher.update({
      where: { id: teacherId },
      data: { isBendahara }
    });

    return { success: true };
  } catch (error) {
    console.error("Error assigning treasurer:", error);
    return { success: false, error: "Gagal menyimpan peran" };
  }
}

// 2b. Tunjuk Pengelola TU, Perpus, Sarpras
export async function assignSpecialRole(teacherId, roleField, value) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return { success: false, error: "Unauthorized" };
    }

    // Hanya izinkan field tertentu
    if (!["isTU", "isPerpus", "isSarpras", "isWakaKurikulum", "isWakaKesiswaan", "isKaprodiDkv", "isPengawas"].includes(roleField)) {
      return { success: false, error: "Invalid role field" };
    }

    await prisma.teacher.update({
      where: { id: teacherId },
      data: { [roleField]: value }
    });

    return { success: true };
  } catch (error) {
    console.error("Error assigning special role:", error);
    return { success: false, error: "Gagal menyimpan peran" };
  }
}

// 3. Simpan Beban Mengajar Guru
export async function updateTeacherLoad(teacherId, jamMengajar) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return { success: false, error: "Unauthorized" };
    }

    await prisma.teacher.update({
      where: { id: teacherId },
      data: { jamMengajar: parseInt(jamMengajar || 0, 10) }
    });

    return { success: true };
  } catch (e) {
    console.error(e);
    return { success: false, error: "Gagal menyimpan beban jam mengajar: " + e.message };
  }
}

// Helper to get client IP from request headers
export async function getClientIp() {
  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for") || headersList.get("x-real-ip") || "127.0.0.1";
  return ip.split(",")[0].trim();
}

// 4. Guru Absen Mandiri (Verifikasi IP Wi-Fi Sekolah)
export async function checkInTeacher(status, notes = "", jp = 0) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "wali-kelas" && session.role !== "guru-mapel")) {
      return { success: false, error: "Hanya guru yang dapat melakukan absensi mandiri." };
    }

    // Ambil data sekolah untuk mencocokkan IP
    const school = await prisma.school.findUnique({ where: { id: 1 } });
    const savedIp = (school?.schoolIp || "").trim();
    const clientIp = await getClientIp();

    const isLocalhost = clientIp === "127.0.0.1" || clientIp === "::1" || clientIp === "::ffff:127.0.0.1";

    // Jika ada IP terdaftar, dan bukan localhost, dan IP klien tidak cocok dengan IP sekolah
    if (savedIp && !isLocalhost && clientIp !== savedIp) {
      return { 
        success: false, 
        error: `Absensi Ditolak. Anda terhubung dengan IP: ${clientIp}. Harap hubungkan perangkat Anda ke jaringan Wi-Fi resmi sekolah (IP Resmi: ${savedIp}) untuk melakukan absensi.` 
      };
    }

    const todayDate = new Date().toLocaleDateString("sv-SE"); // Format YYYY-MM-DD
    const cleanJp = parseInt(jp, 10) || 0;
    const waktuHadir = new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

    const batasGuru = school?.batasJamHadirGuru || "06:45";
    let keterlambatan = 0;
    if (status === "HADIR") {
      keterlambatan = calculateLateness(waktuHadir, batasGuru);
    }

    await prisma.teacherAttendance.upsert({
      where: {
        teacherId_date: {
          teacherId: session.id,
          date: todayDate
        }
      },
      update: {
        status,
        notes,
        jp: cleanJp,
        waktuHadir,
        keterlambatan
      },
      create: {
        teacherId: session.id,
        date: todayDate,
        status,
        notes,
        jp: cleanJp,
        waktuHadir,
        keterlambatan
      }
    });

    return { success: true, ip: clientIp };
  } catch (e) {
    console.error(e);
    return { success: false, error: "Gagal mencatat absensi: " + e.message };
  }
}

// Helper to calculate lateness in minutes
function calculateLateness(waktuHadir, batasJam) {
  if (!waktuHadir || !batasJam) return 0;
  try {
    const [h1, m1] = waktuHadir.split(":").map(Number);
    const [h2, m2] = batasJam.split(":").map(Number);
    const time1 = h1 * 60 + m1;
    const time2 = h2 * 60 + m2;
    return time1 > time2 ? time1 - time2 : 0;
  } catch (e) {
    return 0;
  }
}

// 5. Pencatatan Kehadiran Siswa (Kamera Scan QR / Manual Input NISN)
export async function scanStudentQR(nisn, status, notes = "", waktuHadir = null) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "admin" && session.role !== "wali-kelas" && session.role !== "guru-mapel")) {
      return { success: false, error: "Unauthorized" };
    }

    // Cari siswa berdasarkan NISN
    const student = await prisma.student.findUnique({
      where: { nisn }
    });

    if (!student) {
      return { success: false, error: `Siswa dengan NISN ${nisn} tidak ditemukan.` };
    }

    const todayDate = new Date().toLocaleDateString("sv-SE"); // Format YYYY-MM-DD
    
    // Auto fill waktuHadir with server WIB time if not provided and status is HADIR
    let finalWaktuHadir = waktuHadir;
    if (!finalWaktuHadir && status === "HADIR") {
      const wibTime = new Date(new Date().getTime() + (7 * 60 * 60 * 1000));
      const hh = String(wibTime.getUTCHours()).padStart(2, '0');
      const mm = String(wibTime.getUTCMinutes()).padStart(2, '0');
      finalWaktuHadir = `${hh}:${mm}`;
    }

    // Get School limits
    const school = await prisma.school.findUnique({ where: { id: 1 } });
    const batasSiswa = school?.batasJamHadirSiswa || "07:00";
    
    // Calculate lateness only if HADIR
    let keterlambatan = 0;
    if (status === "HADIR" && finalWaktuHadir) {
      keterlambatan = calculateLateness(finalWaktuHadir, batasSiswa);
    }

    await prisma.studentAttendance.upsert({
      where: {
        studentId_date: {
          studentId: student.id,
          date: todayDate
        }
      },
      update: {
        status,
        notes,
        ...(finalWaktuHadir ? { waktuHadir: finalWaktuHadir, keterlambatan } : {})
      },
      create: {
        studentId: student.id,
        date: todayDate,
        status,
        notes,
        waktuHadir: finalWaktuHadir || null,
        keterlambatan
      }
    });

    return { success: true, studentName: student.name, className: student.kelas, foto: student.foto };
  } catch (e) {
    console.error(e);
    return { success: false, error: "Gagal mencatat absensi siswa: " + e.message };
  }
}

// 6. Ambil Data Absensi Siswa Harian
export async function getStudentAttendanceList(dateString) {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: "Unauthorized" };

    const attendances = await prisma.studentAttendance.findMany({
      where: { date: dateString },
      include: { student: true }
    });

    return { success: true, attendances };
  } catch (e) {
    console.error(e);
    return { success: false, error: e.message };
  }
}

// 7. Ambil Data Absensi Guru Harian
export async function getTeacherAttendanceList(dateString) {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: "Unauthorized" };

    const attendances = await prisma.teacherAttendance.findMany({
      where: { date: dateString },
      include: { teacher: true }
    });

    return { success: true, attendances };
  } catch (e) {
    console.error(e);
    return { success: false, error: e.message };
  }
}

// 8. Pencatatan Kehadiran Siswa Massal / Tabel Manual Admin
export async function recordStudentAttendanceBulk(attendancesList) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "admin" && session.role !== "wali-kelas" && session.role !== "guru-mapel")) {
      return { success: false, error: "Unauthorized" };
    }

    const school = await prisma.school.findUnique({ where: { id: 1 } });
    const batasSiswa = school?.batasJamHadirSiswa || "07:00";

    // Lakukan rentetan upsert secara sekuensial atau parallel
    const promises = attendancesList.map(item => {
      let keterlambatan = 0;
      if (item.status === "HADIR" && item.waktuHadir) {
        keterlambatan = calculateLateness(item.waktuHadir, batasSiswa);
      }

      return prisma.studentAttendance.upsert({
        where: {
          studentId_date: {
            studentId: item.studentId,
            date: item.date
          }
        },
        update: {
          status: item.status,
          notes: item.notes || null,
          ...(item.waktuHadir ? { waktuHadir: item.waktuHadir, keterlambatan } : {})
        },
        create: {
          studentId: item.studentId,
          date: item.date,
          status: item.status,
          notes: item.notes || null,
          waktuHadir: item.waktuHadir || null,
          keterlambatan
        }
      });
    });

    await Promise.all(promises);
    return { success: true };
  } catch (e) {
    console.error(e);
    return { success: false, error: "Gagal menyimpan absensi massal: " + e.message };
  }
}

// 9. Laporan Keuangan Bendahara Sekolah
export async function getTreasurerReport(monthStr, yearStr) {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: "Unauthorized" };

    // Pastikan user adalah admin atau guru yang diset jadi bendahara
    let isAuthorized = session.role === "admin";
    if (session.role === "wali-kelas" || session.role === "guru-mapel") {
      const dbTeacher = await prisma.teacher.findUnique({ where: { id: session.id } });
      if (dbTeacher?.isBendahara) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return { success: false, error: "Akses ditolak. Menu ini khusus Bendahara Sekolah." };
    }

    // Ambil daftar seluruh guru
    const teachers = await prisma.teacher.findMany({
      orderBy: { name: "asc" }
    });

    // Cari absensi dalam bulan terpilih (YYYY-MM-...)
    const datePrefix = `${yearStr}-${monthStr.padStart(2, "0")}`;

    const attendances = await prisma.teacherAttendance.findMany({
      where: {
        date: {
          startsWith: datePrefix
        }
      }
    });

    const school = await prisma.school.findFirst({ where: { id: 1 } });
    const rHonor = school?.rateHonorPokok ?? 25000;
    const rTransport = school?.rateTransport ?? 50000;
    const rInsentif = school?.rateInsentif ?? 15000;

    // Peta rekap
    const reportData = teachers.map(teacher => {
      const teacherAtt = attendances.filter(a => a.teacherId === teacher.id);
      const hadirCount = teacherAtt.filter(a => a.status === "HADIR").length;
      const tugasLuarCount = teacherAtt.filter(a => a.status === "TUGAS_LUAR").length;
      const alfaCount = teacherAtt.filter(a => a.status === "ALFA").length;

      // Hitung total JP mengajar riil bulan ini dari absensi harian guru
      const totalJp = teacherAtt
        .filter(a => a.status === "HADIR")
        .reduce((sum, curr) => sum + (curr.jp || 0), 0);

      // Formula Honorarium Khusus Sekolah Master Demo
      // 1. Honor Pokok Mengajar: beban jam mengajar riil * rHonor / jam
      const honorPokok = totalJp * rHonor;
      // 2. Tunjangan Jabatan: Dari database model Teacher
      const tunjanganJabatan = teacher.tunjangan || 0;
      // 3. Transport Tugas Luar: tugas luar * rTransport / tugas
      const transportTugasLuar = tugasLuarCount * rTransport;
      // 4. Insentif Kehadiran Harian: hadir * (customInsentif atau rInsentif global) / hari
      const tarifInsentifAktif = teacher.customInsentif !== null && teacher.customInsentif !== undefined ? teacher.customInsentif : rInsentif;
      const insentifKehadiran = hadirCount * tarifInsentifAktif;

      const totalHonor = honorPokok + tunjanganJabatan + transportTugasLuar + insentifKehadiran;

      return {
        id: teacher.id,
        name: teacher.name,
        nip: teacher.nip,
        jabatan: teacher.jabatan || "-",
        tunjanganJabatan,
        jamMengajar: totalJp,
        hadirCount,
        tugasLuarCount,
        alfaCount,
        honorPokok,
        transportTugasLuar,
        insentifKehadiran,
        tarifInsentifAktif, // Untuk ditampilkan di frontend jika custom
        totalHonor
      };
    });

    return { success: true, reportData, rates: { rHonor, rTransport, rInsentif } };
  } catch (e) {
    console.error(e);
    return { success: false, error: "Gagal mengambil laporan keuangan: " + e.message };
  }
}

// 10. Pencatatan Kehadiran Guru Massal / Tabel Manual Admin
export async function recordTeacherAttendanceBulk(attendancesList) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return { success: false, error: "Unauthorized" };
    }

    const school = await prisma.school.findUnique({ where: { id: 1 } });
    const batasGuru = school?.batasJamHadirGuru || "06:45";

    const promises = attendancesList.map(item => {
      let keterlambatan = 0;
      if (item.status === "HADIR" && item.waktuHadir) {
        keterlambatan = calculateLateness(item.waktuHadir, batasGuru);
      }

      const cleanJp = item.jp !== undefined ? (parseInt(item.jp, 10) || 0) : (item.status === "HADIR" ? 2 : 0);
      return prisma.teacherAttendance.upsert({
        where: {
          teacherId_date: {
            teacherId: item.teacherId,
            date: item.date
          }
        },
        update: {
          status: item.status,
          notes: item.notes || null,
          jp: cleanJp,
          ...(item.waktuHadir ? { waktuHadir: item.waktuHadir, keterlambatan } : {})
        },
        create: {
          teacherId: item.teacherId,
          date: item.date,
          status: item.status,
          notes: item.notes || null,
          jp: cleanJp,
          waktuHadir: item.waktuHadir || null,
          keterlambatan
        }
      });
    });

    await Promise.all(promises);
    return { success: true };
  } catch (e) {
    console.error(e);
    return { success: false, error: "Gagal menyimpan absensi guru massal: " + e.message };
  }
}

export async function updateFinancialRates(rateHonorPokok, rateTransport, rateInsentif) {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: "Unauthorized" };

    let isAuthorized = session.role === "admin";
    if (session.role === "wali-kelas" || session.role === "guru-mapel") {
      const dbTeacher = await prisma.teacher.findUnique({ where: { id: session.id } });
      if (dbTeacher?.isBendahara) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return { success: false, error: "Akses ditolak." };
    }

    await prisma.school.update({
      where: { id: 1 },
      data: {
        rateHonorPokok: parseInt(rateHonorPokok, 10) || 0,
        rateTransport: parseInt(rateTransport, 10) || 0,
        rateInsentif: parseInt(rateInsentif, 10) || 0
      }
    });

    return { success: true };
  } catch (e) {
    console.error(e);
    return { success: false, error: "Gagal memperbarui tarif keuangan: " + e.message };
  }
}

// 11. Rekap Absensi Siswa per Kelas per Bulan
export async function getStudentAttendanceRecap(kelas, bulan, tahun) {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: "Unauthorized" };

    const datePrefix = `${tahun}-${String(bulan).padStart(2, "0")}`;

    // Ambil semua siswa di kelas tsb
    const students = await prisma.student.findMany({
      where: { kelas },
      orderBy: { name: "asc" }
    });

    if (students.length === 0) {
      return { success: true, students: [], recap: [], dates: [], datePrefix };
    }

    const studentIds = students.map(s => s.id);

    // Ambil semua absensi bulan tsb untuk siswa di kelas ini
    const attendances = await prisma.studentAttendance.findMany({
      where: {
        studentId: { in: studentIds },
        date: { startsWith: datePrefix }
      },
      orderBy: { date: "asc" }
    });

    // Kumpulkan daftar tanggal unik yang ada data absensinya
    const datesSet = new Set(attendances.map(a => a.date));
    const dates = Array.from(datesSet).sort();

    // Buat rekap per siswa
    const recap = students.map(student => {
      const siswaAtt = attendances.filter(a => a.studentId === student.id);
      const attMap = {};
      let totalKeterlambatan = 0;
      let totalHadirJamRiil = 0;
      let akumulasiJamHadirRiil = 0; // dalam menit untuk rata-rata

      siswaAtt.forEach(a => { 
        attMap[a.date] = {
          status: a.status,
          waktuHadir: a.waktuHadir,
          keterlambatan: a.keterlambatan
        };
        if (a.keterlambatan) {
          totalKeterlambatan += a.keterlambatan;
        }
        if (a.status === "HADIR" && a.waktuHadir) {
          const [h, m] = a.waktuHadir.split(":");
          akumulasiJamHadirRiil += (parseInt(h) * 60 + parseInt(m));
          totalHadirJamRiil++;
        }
      });

      const hadir  = siswaAtt.filter(a => a.status === "HADIR").length;
      const izin   = siswaAtt.filter(a => a.status === "IZIN").length;
      const sakit  = siswaAtt.filter(a => a.status === "SAKIT").length;
      const alpha  = siswaAtt.filter(a => a.status === "ALPHA" || a.status === "ALFA").length;
      const rataRataHadir = totalHadirJamRiil > 0 ? (akumulasiJamHadirRiil / totalHadirJamRiil) : 9999;

      return {
        id: student.id,
        name: student.name,
        nisn: student.nisn,
        nis: student.nis,
        attMap,
        hadir,
        izin,
        sakit,
        alpha,
        totalHari: dates.length,
        totalKeterlambatan,
        rataRataHadir
      };
    });

    // Papan Peringkat (Leaderboard)
    // Top 5 Paling Rajin (Rata-rata datang paling awal, minimum hadir 3 kali, dan tidak sering telat)
    const topRajin = [...recap]
      .filter(s => s.hadir >= 1 && s.totalKeterlambatan === 0)
      .sort((a, b) => a.rataRataHadir - b.rataRataHadir)
      .slice(0, 5)
      .map(s => ({
        name: s.name,
        rataRata: s.rataRataHadir !== 9999 ? `${Math.floor(s.rataRataHadir / 60).toString().padStart(2, '0')}:${Math.floor(s.rataRataHadir % 60).toString().padStart(2, '0')}` : "-",
        hadir: s.hadir
      }));

    // Top 5 Perlu Perhatian (Total keterlambatan tertinggi)
    const topTerlambat = [...recap]
      .filter(s => s.totalKeterlambatan > 0)
      .sort((a, b) => b.totalKeterlambatan - a.totalKeterlambatan)
      .slice(0, 5)
      .map(s => ({
        name: s.name,
        totalMenit: s.totalKeterlambatan,
        hadir: s.hadir
      }));

    const leaderboard = { topRajin, topTerlambat };

    return { success: true, recap, dates, kelas, bulan, tahun, leaderboard };
  } catch (e) {
    console.error(e);
    return { success: false, error: "Gagal mengambil rekap absensi: " + e.message };
  }
}


export async function getTeacherAttendanceRecap(bulan, tahun) {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: "Unauthorized" };

    const datePrefix = `${tahun}-${String(bulan).padStart(2, "0")}`;

    const teachers = await prisma.teacher.findMany({
      orderBy: { name: "asc" }
    });

    if (teachers.length === 0) {
      return { success: true, teachers: [], recap: [], dates: [], datePrefix };
    }

    const teacherIds = teachers.map(t => t.id);

    const attendances = await prisma.teacherAttendance.findMany({
      where: {
        teacherId: { in: teacherIds },
        date: { startsWith: datePrefix }
      },
      orderBy: { date: "asc" }
    });

    const datesSet = new Set(attendances.map(a => a.date));
    const dates = Array.from(datesSet).sort();

    const recap = teachers.map(teacher => {
      const guruAtt = attendances.filter(a => a.teacherId === teacher.id);
      const attMap = {};
      let totalHadir = 0;
      let totalSakit = 0;
      let totalIzin = 0;
      let totalAlpa = 0;
      let totalTugasLuar = 0;

      guruAtt.forEach(a => { 
        attMap[a.date] = {
          status: a.status,
          waktuHadir: a.waktuHadir
        };
        if (a.status === "HADIR") totalHadir++;
        else if (a.status === "SAKIT") totalSakit++;
        else if (a.status === "IZIN") totalIzin++;
        else if (a.status === "ALPA") totalAlpa++;
        else if (a.status === "TUGAS_LUAR") totalTugasLuar++;
      });

      return {
        id: teacher.id,
        name: teacher.name,
        nip: teacher.nip,
        jabatan: teacher.jabatan,
        attMap,
        hadir: totalHadir,
        sakit: totalSakit,
        izin: totalIzin,
        alpa: totalAlpa,
        tugasLuar: totalTugasLuar
      };
    });

    return { success: true, recap, dates, bulan, tahun };
  } catch (e) {
    console.error(e);
    return { success: false, error: "Gagal mengambil rekap absensi guru: " + e.message };
  }
}

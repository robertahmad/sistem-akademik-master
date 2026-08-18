"use server";

import prisma from "../../lib/prisma";
import { getSession } from "../../lib/auth";

export async function getKepsekDashboard() {
  try {
    const session = await getSession();

    if (!session || session.role !== "kepsek") {
      return { success: false, error: "Unauthorized" };
    }

    const school = await prisma.school.findFirst({ where: { id: 1 } }) || {
      nama: "SEKOLAH MENENGAH PERTAMA (SMP) MASTER DEMO KOTA DEMO",
      logo: "🏫",
      tahunAjaran: "2026/2027",
      semester: "Ganjil"
    };

    const teachers = await prisma.teacher.findMany({
      orderBy: { name: "asc" }
    });

    const students = await prisma.student.findMany({
      orderBy: { name: "asc" }
    });

    const subjects = await prisma.subject.findMany({
      orderBy: { name: "asc" }
    });

    const examSchedules = await prisma.examSchedule.findMany({
      orderBy: { startTime: "asc" }
    });

    // Ambil data nilai tugas, uts, uas siswa
    const grades = await prisma.grade.findMany({
      include: {
        student: {
          select: {
            name: true,
            kelas: true
          }
        }
      }
    });

    // Ambil data pengerjaan ujian CBT siswa
    const examSubmissions = await prisma.examSubmission.findMany({
      include: {
        student: {
          select: {
            name: true,
            kelas: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    // Ambil rekap kehadiran / rapor catatan wali kelas
    const raporRecords = await prisma.raporRecord.findMany({
      include: {
        student: {
          select: {
            name: true,
            kelas: true
          }
        }
      }
    });

    return {
      success: true,
      school,
      teachers,
      students,
      subjects,
      examSchedules,
      grades,
      examSubmissions,
      raporRecords
    };
  } catch (e) {
    console.error("Kepsek dashboard load failed:", e);
    return { success: false, error: e.message };
  }
}

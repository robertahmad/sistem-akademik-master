"use server";

import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function loginAlumni(nisn, tanggalLahir) {
  try {
    const student = await prisma.student.findUnique({
      where: { nisn }
    });

    if (!student) {
      return { success: false, error: "NISN tidak ditemukan di sistem." };
    }

    if (student.tanggalLahir !== tanggalLahir) {
      return { success: false, error: "Tanggal lahir tidak sesuai." };
    }

    if (student.status !== "LULUS") {
      return { success: false, error: "Akses ditolak. Status Anda belum tercatat sebagai Alumni (LULUS)." };
    }

    // Set session cookie for alumni
    const cookieStore = await cookies();
    cookieStore.set("alumni_session", student.nisn, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/",
    });

    return { success: true };
  } catch (error) {
    console.error("Login Alumni error:", error);
    return { success: false, error: "Terjadi kesalahan sistem." };
  }
}

export async function logoutAlumni() {
  const cookieStore = await cookies();
  cookieStore.delete("alumni_session");
  redirect("/portal/alumni/login");
}

export async function getAlumniSession() {
  const cookieStore = await cookies();
  const session = cookieStore.get("alumni_session");
  
  if (!session?.value) return null;

  try {
    const student = await prisma.student.findUnique({
      where: { nisn: session.value },
      include: {
        tracerStudy: true
      }
    });
    return student;
  } catch (error) {
    return null;
  }
}

export async function submitTracerStudy(data) {
  try {
    const session = await getAlumniSession();
    if (!session) return { success: false, error: "Belum login" };

    const { status, instansi, jabatan, tahunLulus } = data;

    const tracer = await prisma.tracerStudy.upsert({
      where: { studentNisn: session.nisn },
      update: {
        status,
        instansi,
        jabatan,
        tahunLulus,
      },
      create: {
        studentNisn: session.nisn,
        status,
        instansi,
        jabatan,
        tahunLulus,
      }
    });

    return { success: true, tracer };
  } catch (error) {
    console.error("Submit Tracer Study error:", error);
    return { success: false, error: "Gagal menyimpan data tracer study." };
  }
}

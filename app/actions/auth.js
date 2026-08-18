"use server";

import prisma from "../../lib/prisma";
import bcrypt from "bcryptjs";
import { setSession, deleteSession } from "../../lib/auth";

export async function loginAction(role, username, password) {
  try {
    if (role === "admin") {
      // Validasi admin bawaan
      if (username === "admin" && password === "123") {
        await setSession({
          id: "admin",
          name: "Administrator",
          role: "admin",
          username: "admin"
        });
        return { success: true };
      }
      return { success: false, error: "Username atau password Admin salah." };
    }

    if (role === "kepsek") {
      const school = await prisma.school.findFirst({ where: { id: 1 } });
      const dbUsername = school?.kepsekUsername || "kepsek";
      const dbPassword = school?.kepsekPassword || "kepsek123";

      if (username === dbUsername) {
        let passMatch = false;
        if (dbPassword.startsWith("$2a$") || dbPassword.startsWith("$2b$")) {
          passMatch = bcrypt.compareSync(password, dbPassword);
        } else {
          passMatch = (password === dbPassword);
        }

        if (passMatch) {
          const kepsekName = school ? school.kepsek : "Fajar Nur Aktorika D.S, S.Pd.Si, M.Pd.";
          await setSession({
            id: "kepsek",
            name: kepsekName,
            role: "kepsek",
            username: dbUsername
          });
          return { success: true };
        }
      }
      return { success: false, error: "Username atau password Kepala Sekolah salah." };
    }

    if (role === "guru-mapel" || role === "wali-kelas") {
      const teacher = await prisma.teacher.findUnique({
        where: { username: username }
      });

      if (!teacher) {
        return { success: false, error: "Username atau password pendidik salah." };
      }

      // Validasi kecocokan role login
      if (teacher.role !== role) {
        return { 
          success: false, 
          error: `Gagal! Akun Anda terdaftar sebagai ${teacher.role === 'wali-kelas' ? 'Wali Kelas' : 'Guru Mata Pelajaran'}. Harap pilih peran login yang sesuai.` 
        };
      }

      const passMatch = bcrypt.compareSync(password, teacher.password);
      if (!passMatch) {
        return { success: false, error: "Username atau password pendidik salah." };
      }

      await setSession(teacher);
      return { success: true };
    }

    if (role === "siswa") {
      const student = await prisma.student.findUnique({
        where: { username: username }
      });

      if (!student) {
        return { success: false, error: "Username atau password siswa salah." };
      }

      const passMatch = bcrypt.compareSync(password, student.password);
      if (!passMatch) {
        return { success: false, error: "Username atau password siswa salah." };
      }

      await setSession({
        id: student.id,
        name: student.name,
        role: "siswa",
        kelas: student.kelas,
        username: student.username,
        nisn: student.nisn
      });
      return { success: true };
    }

    return { success: false, error: "Peran tidak valid." };
  } catch (e) {
    console.error("Login error:", e);
    return { success: false, error: "Terjadi kesalahan internal pada server." };
  }
}

export async function logoutAction() {
  await deleteSession();
  return { success: true };
}

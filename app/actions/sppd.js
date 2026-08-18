"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// Ajukan SPPD baru oleh Guru
export async function createSppd(data) {
  try {
    const sppd = await prisma.sppd.create({
      data: {
        teacherId: data.teacherId,
        keperluan: data.keperluan,
        tujuan: data.tujuan,
        tanggalBerangkat: new Date(data.tanggalBerangkat),
        tanggalKembali: new Date(data.tanggalKembali),
        transportasi: data.transportasi || "Kendaraan Pribadi",
        status: "MENUNGGU",
      },
    });
    revalidatePath("/portal/guru");
    revalidatePath("/portal/kepsek");
    return { success: true, sppd };
  } catch (error) {
    console.error("Error creating SPPD:", error);
    return { success: false, error: "Gagal mengajukan SPPD" };
  }
}

// Ambil riwayat SPPD untuk satu guru
export async function getSppdByTeacher(teacherId) {
  try {
    const sppds = await prisma.sppd.findMany({
      where: { teacherId },
      orderBy: { createdAt: "desc" },
    });
    return sppds;
  } catch (error) {
    console.error("Error fetching SPPD by teacher:", error);
    return [];
  }
}

// Ambil semua SPPD (untuk Kepsek)
export async function getAllSppd() {
  try {
    const sppds = await prisma.sppd.findMany({
      include: {
        teacher: {
          select: { name: true, nip: true, jabatan: true }
        }
      },
      orderBy: { createdAt: "desc" },
    });
    return sppds;
  } catch (error) {
    console.error("Error fetching all SPPD:", error);
    return [];
  }
}

// Setujui atau Tolak SPPD (Oleh Kepsek)
// Nomor surat otomatis dibuat saat disetujui (format: {urutan}/SPPD/SMK-Al-Q/{bulanRomawi}/{tahun})
export async function updateSppdStatus(id, status, catatan = "") {
  try {
    const sppd = await prisma.sppd.findUnique({ where: { id } });
    if (!sppd) return { success: false, error: "SPPD tidak ditemukan" };

    let nomorSurat = sppd.nomorSurat;

    if (status === "DISETUJUI" && !nomorSurat) {
      // Buat nomor surat otomatis
      const year = new Date().getFullYear();
      const month = new Date().getMonth() + 1;
      const romanMonths = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];
      const romanMonth = romanMonths[month - 1];

      // Pendekatan lebih aman: Hitung jumlah SPPD disetujui tahun ini
      const count = await prisma.sppd.count({
        where: {
          status: "DISETUJUI",
          createdAt: {
            gte: new Date(`${year}-01-01`),
            lt: new Date(`${year + 1}-01-01`),
          }
        }
      });

      const nextNumber = (count + 1).toString().padStart(3, "0");
      nomorSurat = `${nextNumber}/SPPD/SMK-Al-Q/${romanMonth}/${year}`;
    }

    const updated = await prisma.sppd.update({
      where: { id },
      data: {
        status,
        catatanKepsek: catatan,
        nomorSurat,
      },
    });
    
    revalidatePath("/portal/kepsek");
    revalidatePath("/portal/guru");
    return { success: true, sppd: updated };
  } catch (error) {
    console.error("Error updating SPPD status:", error);
    return { success: false, error: "Gagal update status SPPD" };
  }
}

// Hapus SPPD (Jika masih menunggu)
export async function deleteSppd(id) {
  try {
    await prisma.sppd.delete({
      where: { id },
    });
    revalidatePath("/portal/guru");
    return { success: true };
  } catch (error) {
    console.error("Error deleting SPPD:", error);
    return { success: false, error: "Gagal menghapus SPPD" };
  }
}

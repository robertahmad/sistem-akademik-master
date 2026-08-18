"use server";

import prisma from "../../lib/prisma";
import { getSession } from "../../lib/auth";

// 1. Upload/Create KTSP Document (For Waka Kurikulum)
export async function uploadKtsp(data) {
  try {
    const session = await getSession();
    if (!session || (!session.isWakaKurikulum && session.role !== "admin" && session.role !== "kepsek")) {
      return { success: false, error: "Unauthorized" };
    }

    const { title, tahunAjaran, fileUrl, keterangan } = data;

    if (!title || !tahunAjaran || !fileUrl) {
      return { success: false, error: "Judul, Tahun Ajaran, dan Tautan File wajib diisi" };
    }

    const doc = await prisma.ktspDocument.create({
      data: {
        title,
        tahunAjaran,
        fileUrl,
        keterangan: keterangan || "",
        uploadedBy: session.name || "Waka Kurikulum",
        status: "DRAFT" // Default status
      }
    });

    return { success: true, data: doc };
  } catch (error) {
    console.error("Upload KTSP Error:", error);
    return { success: false, error: "Gagal menyimpan dokumen KTSP: " + error.message };
  }
}

// 2. Get List of KTSP Documents
export async function getKtspList() {
  try {
    const session = await getSession();
    if (!session) return [];

    const docs = await prisma.ktspDocument.findMany({
      orderBy: { createdAt: 'desc' }
    });

    return docs;
  } catch (error) {
    console.error("Get KTSP List Error:", error);
    return [];
  }
}

// 3. Update/Approve KTSP Document (For Kepsek/Admin)
export async function updateKtspStatus(id, newStatus) {
  try {
    const session = await getSession();
    // Biasanya yang menyetujui adalah Kepsek
    if (!session || (session.role !== "kepsek" && session.role !== "admin")) {
      return { success: false, error: "Unauthorized. Hanya Kepala Sekolah yang dapat menyetujui KTSP." };
    }

    const doc = await prisma.ktspDocument.update({
      where: { id },
      data: { 
        status: newStatus,
        approvedAt: newStatus === "DISETUJUI" ? new Date() : null
      }
    });

    return { success: true, data: doc };
  } catch (error) {
    console.error("Update KTSP Status Error:", error);
    return { success: false, error: "Gagal memperbarui status dokumen: " + error.message };
  }
}

// 4. Delete KTSP Document
export async function deleteKtsp(id) {
  try {
    const session = await getSession();
    if (!session || (!session.isWakaKurikulum && session.role !== "admin")) {
      return { success: false, error: "Unauthorized" };
    }

    await prisma.ktspDocument.delete({
      where: { id }
    });

    return { success: true };
  } catch (error) {
    console.error("Delete KTSP Error:", error);
    return { success: false, error: "Gagal menghapus dokumen KTSP: " + error.message };
  }
}

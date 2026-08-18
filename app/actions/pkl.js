"use server";

import prisma from "../../lib/prisma";
import { getSession } from "../../lib/auth";
import { put } from "@vercel/blob";

// === DUDI (Dunia Usaha & Industri) ===

export async function getDudis() {
  const session = await getSession();
  if (!session || (session.role !== "guru" && session.role !== "admin")) return { success: false, error: "Unauthorized" };
  
  const dudis = await prisma.pklDudi.findMany({
    orderBy: { name: "asc" }
  });
  return { success: true, dudis };
}

export async function saveDudi(data) {
  const session = await getSession();
  if (!session || (session.role !== "guru" && session.role !== "admin")) return { success: false, error: "Unauthorized" };

  if (data.id) {
    const dudi = await prisma.pklDudi.update({
      where: { id: data.id },
      data: {
        name: data.name,
        address: data.address,
        field: data.field,
        leaderName: data.leaderName,
        mentorName: data.mentorName,
        quota: Number(data.quota) || 0
      }
    });
    return { success: true, dudi };
  } else {
    const dudi = await prisma.pklDudi.create({
      data: {
        name: data.name,
        address: data.address,
        field: data.field,
        leaderName: data.leaderName,
        mentorName: data.mentorName,
        quota: Number(data.quota) || 0
      }
    });
    return { success: true, dudi };
  }
}

export async function deleteDudi(id) {
  const session = await getSession();
  if (!session || (session.role !== "guru" && session.role !== "admin")) return { success: false, error: "Unauthorized" };
  
  await prisma.pklDudi.delete({ where: { id } });
  return { success: true };
}

export async function updateDudiSignature(dudiId, formData) {
  const session = await getSession();
  if (!session || (session.role !== "guru" && session.role !== "admin")) return { success: false, error: "Unauthorized" };

  const image = formData.get("signature");
  if (!image || image.size === 0) return { success: false, error: "No image provided" };

  try {
    const filename = `signature_dudi_${dudiId}_${Date.now()}_${image.name.replace(/\s+/g, '_')}`;
    const blob = await put(`signatures/${filename}`, image, { access: "public" });
    
    await prisma.pklDudi.update({
      where: { id: dudiId },
      data: { signature: blob.url }
    });

    return { success: true, url: blob.url };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// === PLACEMENT (Plotting Siswa ke DUDI) ===

export async function getPlacements() {
  const session = await getSession();
  if (!session || (session.role !== "guru" && session.role !== "admin")) return { success: false, error: "Unauthorized" };
  
  const placements = await prisma.pklPlacement.findMany({
    include: {
      student: true,
      dudi: true,
      grade: true
    },
    orderBy: { createdAt: "desc" }
  });
  
  // Ambil list guru untuk pemetaan nama guru
  const teachers = await prisma.teacher.findMany({
    select: { id: true, name: true }
  });
  
  const formatted = placements.map(p => {
    const t = teachers.find(x => x.id === p.teacherId);
    return { ...p, teacherName: t ? t.name : "Tidak Diketahui" };
  });

  return { success: true, placements: formatted };
}

export async function savePlacement(data) {
  const session = await getSession();
  if (!session || (session.role !== "guru" && session.role !== "admin")) return { success: false, error: "Unauthorized" };

  if (data.id) {
    const p = await prisma.pklPlacement.update({
      where: { id: data.id },
      data: {
        dudiId: data.dudiId,
        teacherId: data.teacherId,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        status: data.status || "AKTIF"
      }
    });
    return { success: true, placement: p };
  } else {
    // Cek apakah siswa sudah punya penempatan
    const existing = await prisma.pklPlacement.findUnique({
      where: { studentNisn: data.studentNisn }
    });
    if (existing) return { success: false, error: "Siswa ini sudah diplot ke tempat PKL lain." };

    const p = await prisma.pklPlacement.create({
      data: {
        studentNisn: data.studentNisn,
        dudiId: data.dudiId,
        teacherId: data.teacherId,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        status: "AKTIF"
      }
    });
    return { success: true, placement: p };
  }
}

export async function deletePlacement(id) {
  const session = await getSession();
  if (!session || (session.role !== "guru" && session.role !== "admin")) return { success: false, error: "Unauthorized" };
  
  await prisma.pklPlacement.delete({ where: { id } });
  return { success: true };
}

// === JOURNALS (E-Jurnal) ===

export async function getStudentPlacement() {
  const session = await getSession();
  if (!session || session.role !== "siswa") return { success: false, error: "Unauthorized" };
  
  const placement = await prisma.pklPlacement.findUnique({
    where: { studentNisn: session.nisn },
    include: {
      dudi: true,
      journals: {
        orderBy: { date: "desc" }
      },
      grade: true
    }
  });

  if (!placement) return { success: true, placement: null };
  
  const teacher = await prisma.teacher.findUnique({ where: { id: placement.teacherId } });
  return { 
    success: true, 
    placement: { ...placement, teacherName: teacher?.name || "-" }
  };
}

export async function saveStudentJournal(formData) {
  const session = await getSession();
  if (!session || session.role !== "siswa") return { success: false, error: "Unauthorized" };

  const placementId = formData.get("placementId");
  const date = formData.get("date");
  const activity = formData.get("activity");
  const image = formData.get("image");

  if (!placementId || !date || !activity) return { success: false, error: "Data tidak lengkap" };

  let imageUrl = null;
  if (image && image.size > 0) {
    const filename = `pkl_${session.nisn}_${Date.now()}_${image.name.replace(/\\s+/g, '_')}`;
    
    const blob = await put(`pkl/${filename}`, image, {
      access: "public",
    });
    
    imageUrl = blob.url;
  }

  const journal = await prisma.pklJournal.create({
    data: {
      placementId,
      date,
      activity,
      imagePath: imageUrl,
      status: "PENDING"
    }
  });

  return { success: true, journal };
}

export async function getJournalsForTeacher() {
  const session = await getSession();
  if (!session || session.role !== "guru") return { success: false, error: "Unauthorized" };

  // Cari username guru untuk mendapatkan ID
  const teacher = await prisma.teacher.findUnique({ where: { username: session.username } });
  if (!teacher) return { success: false, error: "Guru tidak ditemukan" };

  // Ambil semua placement yang menjadi bimbingan guru ini
  const placements = await prisma.pklPlacement.findMany({
    where: { teacherId: teacher.id },
    include: {
      student: true,
      dudi: true,
      journals: {
        orderBy: { date: "desc" }
      }
    }
  });

  return { success: true, placements };
}

export async function updateJournalStatus(journalId, status, feedback) {
  const session = await getSession();
  if (!session || session.role !== "guru") return { success: false, error: "Unauthorized" };

  await prisma.pklJournal.update({
    where: { id: journalId },
    data: { status, feedback }
  });

  return { success: true };
}

// === GRADES (Penilaian PKL) ===

export async function savePklGrade(placementId, teknisScore, nonTeknisScore, schoolScore, notes) {
  const session = await getSession();
  if (!session || session.role !== "guru") return { success: false, error: "Unauthorized" };

  const tScore = Number(teknisScore) || 0;
  const ntScore = Number(nonTeknisScore) || 0;
  const sScore = Number(schoolScore) || 0;
  
  // Rumus misal: 40% Teknis Industri, 30% Non Teknis Industri, 30% Jurnal Sekolah
  const finalScore = Math.round((tScore * 0.4) + (ntScore * 0.3) + (sScore * 0.3));

  const existing = await prisma.pklGrade.findUnique({ where: { placementId } });
  
  if (existing) {
    await prisma.pklGrade.update({
      where: { placementId },
      data: {
        teknisScore: tScore,
        nonTeknisScore: ntScore,
        schoolScore: sScore,
        finalScore,
        notes
      }
    });
  } else {
    await prisma.pklGrade.create({
      data: {
        placementId,
        teknisScore: tScore,
        nonTeknisScore: ntScore,
        schoolScore: sScore,
        finalScore,
        notes
      }
    });
  }

  return { success: true };
}

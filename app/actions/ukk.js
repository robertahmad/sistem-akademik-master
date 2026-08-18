"use server";

import prisma from "../../lib/prisma";
import { getSession } from "../../lib/auth";
import { put } from "@vercel/blob";

// === ASSESSOR (EKSTERNAL) ===

export async function loginAssessor(username, password) {
  const assessor = await prisma.assessor.findUnique({ where: { username } });
  if (!assessor) return { success: false, error: "Username tidak ditemukan." };
  if (assessor.password !== password) return { success: false, error: "Password salah." };
  return { success: true, assessor };
}

export async function getAssessors() {
  const assessors = await prisma.assessor.findMany({ orderBy: { name: "asc" } });
  return { success: true, assessors };
}

export async function createAssessor(data) {
  try {
    const assessor = await prisma.assessor.create({
      data: {
        name: data.name,
        username: data.username,
        password: data.password, 
        company: data.company
      }
    });
    return { success: true, assessor };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function deleteAssessor(id) {
  try {
    await prisma.assessor.delete({ where: { id } });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function updateAssessorSignature(assessorId, formData) {
  const session = await getSession();
  if (!session || (session.role !== "admin" && session.role !== "guru")) return { success: false, error: "Unauthorized" };

  const image = formData.get("signature");
  if (!image || image.size === 0) return { success: false, error: "No image provided" };

  try {
    const filename = `signature_assessor_${assessorId}_${Date.now()}_${image.name.replace(/\s+/g, '_')}`;
    const blob = await put(`signatures/${filename}`, image, { access: "public" });
    
    await prisma.assessor.update({
      where: { id: assessorId },
      data: { signature: blob.url }
    });

    return { success: true, url: blob.url };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// === SCHEMES & COMPONENTS ===

export async function getUkkSchemes() {
  const schemes = await prisma.ukkScheme.findMany({
    include: {
      components: { orderBy: { order: 'asc' } }
    },
    orderBy: { createdAt: 'desc' }
  });
  return { success: true, schemes };
}

export async function createUkkScheme(data) {
  try {
    const scheme = await prisma.ukkScheme.create({
      data: {
        title: data.title,
        jurusan: data.jurusan,
        description: data.description
      }
    });
    return { success: true, scheme };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function deleteUkkScheme(id) {
  try {
    await prisma.ukkScheme.delete({ where: { id } });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function addUkkComponent(schemeId, data) {
  try {
    const component = await prisma.ukkComponent.create({
      data: {
        schemeId,
        name: data.name,
        weight: parseInt(data.weight),
        criteria: data.criteria,
        order: parseInt(data.order || 0)
      }
    });
    return { success: true, component };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function deleteUkkComponent(id) {
  try {
    await prisma.ukkComponent.delete({ where: { id } });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// === EXAMS & PLOTTING ===

export async function getUkkExams() {
  const exams = await prisma.ukkExam.findMany({
    include: {
      scheme: true,
      student: { select: { name: true, nisn: true } },
      assessor: true
    },
    orderBy: { examDate: 'desc' }
  });
  return { success: true, exams };
}

export async function getUkkExamsForAssessor(assessorId) {
  const exams = await prisma.ukkExam.findMany({
    where: { assessorId },
    include: {
      scheme: { include: { components: { orderBy: { order: 'asc' } } } },
      student: { select: { name: true, nisn: true, kelas: true } },
      scores: true
    },
    orderBy: { examDate: 'asc' }
  });
  return { success: true, exams };
}

export async function createUkkExam(data) {
  try {
    const exam = await prisma.ukkExam.create({
      data: {
        schemeId: data.schemeId,
        studentNisn: data.studentNisn,
        assessorId: data.assessorId || null,
        teacherId: data.teacherId || null,
        examDate: new Date(data.examDate)
      }
    });
    return { success: true, exam };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function deleteUkkExam(id) {
  try {
    await prisma.ukkExam.delete({ where: { id } });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// === SCORING (CEKLIS) ===

const PREDICATE_MAP = {
  "SANGAT_KOMPETEN": 95,
  "KOMPETEN": 85,
  "CUKUP": 75,
  "BELUM_KOMPETEN": 60
};

export async function submitUkkScore(examId, assessorId, scoresArray) {
  try {
    const exam = await prisma.ukkExam.findUnique({
      where: { id: examId },
      include: { scheme: { include: { components: true } } }
    });
    if (!exam) return { success: false, error: "Ujian tidak ditemukan." };

    let totalScore = 0;
    
    for (const s of scoresArray) {
      const comp = exam.scheme.components.find(c => c.id === s.componentId);
      if (!comp) continue;

      const numScore = PREDICATE_MAP[s.predicate] || 0;
      totalScore += (numScore * comp.weight) / 100;

      await prisma.ukkScore.upsert({
        where: {
          examId_componentId: {
            examId: examId,
            componentId: s.componentId
          }
        },
        update: {
          predicateValue: s.predicate,
          score: numScore,
          notes: s.notes || "",
          assessorId: assessorId
        },
        create: {
          examId: examId,
          componentId: s.componentId,
          predicateValue: s.predicate,
          score: numScore,
          notes: s.notes || "",
          assessorId: assessorId
        }
      });
    }

    totalScore = Math.round(totalScore);
    let finalPredikat = "BELUM_KOMPETEN";
    if (totalScore >= 90) finalPredikat = "SANGAT_KOMPETEN";
    else if (totalScore >= 80) finalPredikat = "KOMPETEN";
    else if (totalScore >= 70) finalPredikat = "CUKUP";

    await prisma.ukkExam.update({
      where: { id: examId },
      data: {
        status: "DINILAI",
        finalScore: totalScore,
        predikat: finalPredikat
      }
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// === SISWA ===

export async function getStudentUkkExams() {
  const session = await getSession();
  if (!session || session.role !== "siswa") return { success: false, error: "Unauthorized" };

  const exams = await prisma.ukkExam.findMany({
    where: { studentNisn: session.nisn },
    include: {
      scheme: { include: { components: { orderBy: { order: 'asc' } } } },
      assessor: true,
      scores: { include: { component: true } }
    },
    orderBy: { examDate: 'desc' }
  });
  return { success: true, exams };
}

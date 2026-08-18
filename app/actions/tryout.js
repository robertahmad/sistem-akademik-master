"use server";

import prisma from "@/lib/prisma";

export async function getTryOutPackages(unit = "SMK", kelas = "XII") {
  return await prisma.tryOutPackage.findMany({
    where: { unit, kelas },
    orderBy: { createdAt: "desc" },
  });
}

export async function createTryOutPackage(data) {
  return await prisma.tryOutPackage.create({
    data: {
      title: data.title,
      unit: data.unit || "SMK",
      kelas: data.kelas || "XII",
      startDate: data.startDate,
      endDate: data.endDate,
      duration: parseInt(data.duration, 10),
      status: "DRAFT",
    }
  });
}

export async function updateTryOutPackageStatus(id, status) {
  return await prisma.tryOutPackage.update({
    where: { id },
    data: { status }
  });
}

export async function editTryOutPackage(id, data) {
  return await prisma.tryOutPackage.update({
    where: { id },
    data: {
      title: data.title,
      startDate: data.startDate,
      endDate: data.endDate,
      duration: parseInt(data.duration, 10),
    }
  });
}

export async function deleteTryOutPackage(id) {
  // Delete related submissions first
  await prisma.examSubmission.deleteMany({
    where: { category: "UCO", semester: id }
  });
  // Delete related questions
  await prisma.question.deleteMany({
    where: { category: "UCO", semester: id }
  });
  // Delete the package
  return await prisma.tryOutPackage.delete({
    where: { id }
  });
}

export async function getUcoQuestions(packageId) {
  return await prisma.question.findMany({
    where: { 
      category: "UCO",
      semester: packageId
    }
  });
}

export async function addUcoQuestion(data) {
  return await prisma.question.create({
    data: {
      subject: data.subject,
      question: data.question,
      type: data.type || "PG",
      category: "UCO",
      semester: data.packageId,
      kelas: "XII",
      unit: "SMK",
      choices: data.choices || [],
      correct: data.correct || 0,
      correctChoices: data.correctChoices || [],
      matchingLeft: data.matchingLeft || [],
      matchingRight: data.matchingRight || [],
      correctAnswer: data.correctAnswer || "",
    }
  });
}

export async function deleteUcoQuestion(id) {
  return await prisma.question.delete({
    where: { id }
  });
}

export async function getTryOutPackageById(id) {
  return await prisma.tryOutPackage.findUnique({
    where: { id }
  });
}

import { getSession } from "@/lib/auth";

export async function submitUcoResult(packageId, subject, score, answersJson) {
  const session = await getSession();
  if (!session || session.role !== "siswa") return { success: false, error: "Unauthorized" };

  const existing = await prisma.examSubmission.findUnique({
    where: {
      studentNisn_subjectName_category_semester: {
        studentNisn: session.nisn,
        subjectName: subject,
        category: "UCO",
        semester: packageId
      }
    }
  });

  if (existing) {
    await prisma.examSubmission.update({
      where: { id: existing.id },
      data: { score, answers: answersJson || {} }
    });
  } else {
    await prisma.examSubmission.create({
      data: {
        studentNisn: session.nisn,
        subjectName: subject,
        category: "UCO",
        semester: packageId,
        score,
        answers: answersJson || {}
      }
    });
  }
  return { success: true };
}



export async function gradeUcoSubmission(submissionId, score) {
  const session = await getSession();
  if (!session || (session.role !== "guru" && session.role !== "admin")) return { success: false, error: "Unauthorized" };

  await prisma.examSubmission.update({
    where: { id: submissionId },
    data: { score: parseInt(score, 10) }
  });
  return { success: true };
}



export async function getUcoSubmissions(packageId) {
  return await prisma.examSubmission.findMany({
    where: { category: "UCO", semester: packageId },
    include: { student: true }
  });
}





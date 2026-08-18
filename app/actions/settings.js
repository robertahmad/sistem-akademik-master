"use server";

import prisma from "../../lib/prisma";
import { getSession } from "../../lib/auth";
import { put } from "@vercel/blob";

export async function updateKepsekSignature(formData) {
  const session = await getSession();
  if (!session || (session.role !== "admin" && session.role !== "guru")) {
    return { success: false, error: "Unauthorized" };
  }

  const image = formData.get("signature");
  if (!image || image.size === 0) return { success: false, error: "No image provided" };

  try {
    const filename = `signature_kepsek_${Date.now()}_${image.name.replace(/\s+/g, '_')}`;
    const blob = await put(`signatures/${filename}`, image, {
      access: "public",
    });
    
    await prisma.school.update({
      where: { id: 1 },
      data: { kepsekSignature: blob.url }
    });

    return { success: true, url: blob.url };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function updateGuruSignature(formData) {
  const session = await getSession();
  if (!session || (session.role !== "wali-kelas" && session.role !== "guru-mapel" && session.role !== "admin")) {
    return { success: false, error: "Unauthorized" };
  }

  const image = formData.get("signature");
  if (!image || image.size === 0) return { success: false, error: "No image provided" };

  try {
    const filename = `signature_guru_${session.id}_${Date.now()}_${image.name.replace(/\s+/g, '_')}`;
    const blob = await put(`signatures/${filename}`, image, {
      access: "public",
    });
    
    await prisma.teacher.update({
      where: { id: session.id },
      data: { signature: blob.url }
    });

    return { success: true, url: blob.url };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function getSchoolProfile() {
  const school = await prisma.school.findFirst({ where: { id: 1 } });
  return { success: true, school };
}

export async function updateTteSettings(data) {
  const session = await getSession();
  if (!session || (session.role !== "admin" && session.role !== "guru")) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    await prisma.school.update({
      where: { id: 1 },
      data: {
        tteEnabled: data.tteEnabled,
        tteProvider: data.tteProvider,
        tteId: data.tteId
      }
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}


"use server";

import prisma from "../../lib/prisma";
import { getSession } from "../../lib/auth";

export async function getDigitalBooks() {
  try {
    const session = await getSession();
    if (!session) {
      return { success: false, error: "Unauthorized" };
    }

    const books = await prisma.libraryBook.findMany({
      where: { type: "Digital" },
      orderBy: { createdAt: "desc" }
    });

    return { success: true, books };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Gagal mengambil daftar buku digital." };
  }
}

export async function createDigitalBook({ title, author, category, coverUrl, fileUrl }) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return { success: false, error: "Unauthorized" };
    }

    const book = await prisma.libraryBook.create({
      data: {
        bookCode: `EBOOK-${Date.now()}`,
        title,
        author,
        category,
        type: "Digital",
        coverUrl,
        fileUrl,
        stock: 9999, // Unlimited for digital
        availableStock: 9999
      }
    });

    return { success: true, book };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Gagal menambahkan buku digital." };
  }
}

export async function deleteBook(id) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return { success: false, error: "Unauthorized" };
    }

    await prisma.libraryBook.delete({ where: { id } });
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Gagal menghapus buku." };
  }
}

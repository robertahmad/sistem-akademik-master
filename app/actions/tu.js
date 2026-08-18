"use server";

import prisma from "../../lib/prisma";
import { getSession } from "../../lib/auth";

// ─── 1. MODUL PERSURATAN & TATA USAHA (TU) ───

export async function getSchoolLetters() {
  try {
    const letters = await prisma.schoolLetter.findMany({
      orderBy: { createdAt: "desc" }
    });
    return { success: true, letters };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function createSchoolLetter(data) {
  try {
    const session = await getSession();
    if (!session || session.role === "siswa") {
      return { success: false, error: "Akses ditolak." };
    }

    const year = new Date().getFullYear();

    // Auto-generate nomor surat resmi jika belum diisi
    let letterNo = data.letterNo;
    if (!letterNo) {
      const count = await prisma.schoolLetter.count();
      const seq = String(count + 1).padStart(3, "0");
      letterNo = `${seq}/SMP-AQ/${data.letterType === "SURAT_KETERANGAN_SISWA" ? "Ket" : data.letterType === "SURAT_PINDAH" ? "Pnd" : "TU"}/${year}`;
    }

    const letter = await prisma.schoolLetter.create({
      data: {
        letterType: data.letterType || "SURAT_KETERANGAN_SISWA",
        letterNo: letterNo,
        title: data.title || "Surat Keterangan Siswa Aktif",
        studentNisn: data.studentNisn || "",
        recipient: data.recipient || "",
        sender: data.sender || "",
        date: data.date || new Date().toISOString().substring(0, 10),
        keterangan: data.keterangan || "",
        createdById: session.username
      }
    });

    return { success: true, letter };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function deleteSchoolLetter(id) {
  try {
    const session = await getSession();
    if (!session || session.role === "siswa") {
      return { success: false, error: "Akses ditolak." };
    }

    await prisma.schoolLetter.delete({ where: { id } });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}


// ─── 2. MODUL PERPUSTAKAAN (E-PERPUS) ───

export async function getLibraryData() {
  try {
    const books = await prisma.libraryBook.findMany({
      orderBy: { createdAt: "desc" }
    });

    const loans = await prisma.bookLoan.findMany({
      include: {
        book: true,
        student: true
      },
      orderBy: { createdAt: "desc" }
    });

    return { success: true, books, loans };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function saveLibraryBook(data) {
  try {
    const session = await getSession();
    if (!session || session.role === "siswa") {
      return { success: false, error: "Akses ditolak." };
    }

    let book;
    if (data.id) {
      book = await prisma.libraryBook.update({
        where: { id: data.id },
        data: {
          title: data.title,
          author: data.author || "Penulis Umum",
          publisher: data.publisher || "Penerbit Utama",
          category: data.category || "Pelajaran",
          stock: Number(data.stock),
          availableStock: Number(data.stock),
          location: data.location || "Rak A1"
        }
      });
    } else {
      const code = data.bookCode || `BUK-${Date.now().toString().slice(-4)}`;
      book = await prisma.libraryBook.create({
        data: {
          bookCode: code,
          title: data.title,
          author: data.author || "Penulis Umum",
          publisher: data.publisher || "Penerbit Utama",
          category: data.category || "Pelajaran",
          stock: Number(data.stock),
          availableStock: Number(data.stock),
          location: data.location || "Rak A1"
        }
      });
    }

    return { success: true, book };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function deleteLibraryBook(id) {
  try {
    await prisma.libraryBook.delete({ where: { id } });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function borrowBook({ bookId, studentNisn, dueDate }) {
  try {
    const book = await prisma.libraryBook.findUnique({ where: { id: bookId } });
    if (!book || book.availableStock <= 0) {
      return { success: false, error: "Stok buku tidak tersedia saat ini." };
    }

    const loan = await prisma.bookLoan.create({
      data: {
        bookId,
        studentNisn,
        borrowDate: new Date().toISOString().substring(0, 10),
        dueDate: dueDate || new Date(Date.now() + 7 * 86400000).toISOString().substring(0, 10),
        status: "DIPINJAM"
      }
    });

    await prisma.libraryBook.update({
      where: { id: bookId },
      data: { availableStock: book.availableStock - 1 }
    });

    return { success: true, loan };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function returnBook(loanId) {
  try {
    const loan = await prisma.bookLoan.findUnique({ where: { id: loanId }, include: { book: true } });
    if (!loan) return { success: false, error: "Transaksi tidak ditemukan." };

    await prisma.bookLoan.update({
      where: { id: loanId },
      data: {
        returnDate: new Date().toISOString().substring(0, 10),
        status: "DIKEMBALIKAN"
      }
    });

    if (loan.book) {
      await prisma.libraryBook.update({
        where: { id: loan.bookId },
        data: { availableStock: loan.book.availableStock + 1 }
      });
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}


// ─── 3. MODUL SARPRAS & INVENTARIS ASET ───

export async function getInventoryItems() {
  try {
    const items = await prisma.inventoryItem.findMany({
      orderBy: { createdAt: "desc" }
    });
    return { success: true, items };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function saveInventoryItem(data) {
  try {
    const session = await getSession();
    if (!session || session.role === "siswa") {
      return { success: false, error: "Akses ditolak." };
    }

    let item;
    if (data.id) {
      item = await prisma.inventoryItem.update({
        where: { id: data.id },
        data: {
          name: data.name,
          category: data.category || "Elektronik",
          location: data.location || "Ruang Lab Komputer",
          quantity: Number(data.quantity),
          condition: data.condition || "BAIK",
          purchaseYear: data.purchaseYear || "2026",
          keterangan: data.keterangan || ""
        }
      });
    } else {
      const code = data.itemCode || `AST-${Date.now().toString().slice(-4)}`;
      item = await prisma.inventoryItem.create({
        data: {
          itemCode: code,
          name: data.name,
          category: data.category || "Elektronik",
          location: data.location || "Ruang Lab Komputer",
          quantity: Number(data.quantity),
          condition: data.condition || "BAIK",
          purchaseYear: data.purchaseYear || "2026",
          keterangan: data.keterangan || ""
        }
      });
    }

    return { success: true, item };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function deleteInventoryItem(id) {
  try {
    await prisma.inventoryItem.delete({ where: { id } });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

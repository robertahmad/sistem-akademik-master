"use server";

import prisma from "../../lib/prisma";
import { getSession } from "../../lib/auth";

// Helper generate Nomor Kwitansi Unik
function generateReceiptNo(prefix = "KW") {
  const dateStr = new Date().toISOString().substring(0, 10).replace(/-/g, "");
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${dateStr}-${randomNum}`;
}

async function isAuthorizedBendahara(session) {
  if (!session) return false;
  if (session.role === "admin" || session.isBendahara) return true;
  if (session.username) {
    const teacher = await prisma.teacher.findUnique({ where: { username: session.username } });
    if (teacher && (teacher.isBendahara || teacher.role === "wali-kelas" || teacher.role === "guru-mapel")) return true;
  }
  if (session.role === "wali-kelas" || session.role === "guru-mapel" || session.role === "kepsek") return true;
  return false;
}

// ─── 1. FEE MASTER (PENGATURAN TARIF) ───
export async function getFeeMasters() {
  try {
    const fees = await prisma.feeMaster.findMany({
      orderBy: { name: "asc" }
    });
    return { success: true, fees };
  } catch (e) {
    console.error(e);
    return { success: false, error: "Gagal mengambil master tarif." };
  }
}

export async function saveFeeMaster(feeData) {
  try {
    const session = await getSession();
    if (!(await isAuthorizedBendahara(session))) {
      return { success: false, error: "Unauthorized" };
    }

    const { id, name, nominal, tahunAjaran, tipe } = feeData;
    const cleanNominal = parseInt(String(nominal).replace(/\D/g, "")) || 0;

    if (id) {
      await prisma.feeMaster.update({
        where: { id },
        data: { name, nominal: cleanNominal, tahunAjaran: tahunAjaran || "2026/2027", tipe: tipe || "BULANAN" }
      });
    } else {
      const existing = await prisma.feeMaster.findUnique({ where: { name } });
      if (existing) {
        await prisma.feeMaster.update({
          where: { name },
          data: { nominal: cleanNominal, tahunAjaran: tahunAjaran || "2026/2027", tipe: tipe || "BULANAN" }
        });
      } else {
        await prisma.feeMaster.create({
          data: { name, nominal: cleanNominal, tahunAjaran: tahunAjaran || "2026/2027", tipe: tipe || "BULANAN" }
        });
      }
    }
    return { success: true };
  } catch (e) {
    console.error(e);
    return { success: false, error: "Gagal menyimpan master tarif: " + e.message };
  }
}

export async function deleteFeeMaster(id) {
  try {
    const session = await getSession();
    if (!(await isAuthorizedBendahara(session))) {
      return { success: false, error: "Unauthorized" };
    }
    await prisma.feeMaster.delete({ where: { id } });
    return { success: true };
  } catch (e) {
    console.error(e);
    return { success: false, error: "Gagal menghapus tarif." };
  }
}

// ─── 2. PEMBAYARAN SISWA (SPP & TAGIHAN) ───
export async function recordStudentPayment(paymentData) {
  try {
    const session = await getSession();
    if (!(await isAuthorizedBendahara(session))) {
      return { success: false, error: "Unauthorized" };
    }

    const { studentNisn, feeName, bulan, tahun, amount, paidAmount, paidAt } = paymentData;
    const cleanAmount = parseInt(String(amount).replace(/\D/g, "")) || 0;
    const cleanPaid = parseInt(String(paidAmount).replace(/\D/g, "")) || 0;
    const status = cleanPaid >= cleanAmount ? "LUNAS" : cleanPaid > 0 ? "CICILAN" : "BELUM_LUNAS";
    const receiptNo = generateReceiptNo("KW-SPP");

    const newPayment = await prisma.studentPayment.create({
      data: {
        studentNisn,
        feeName,
        bulan: bulan || "-",
        tahun: String(tahun || new Date().getFullYear()),
        amount: cleanAmount,
        paidAmount: cleanPaid,
        status,
        paidAt: paidAt || new Date().toISOString().substring(0, 10),
        receiptNo,
        createdById: session.id
      }
    });

    return { success: true, payment: newPayment };
  } catch (e) {
    console.error(e);
    return { success: false, error: "Gagal mencatat pembayaran: " + e.message };
  }
}

export async function getStudentPayments(studentNisn) {
  try {
    const payments = await prisma.studentPayment.findMany({
      where: studentNisn ? { studentNisn } : {},
      include: { student: true },
      orderBy: { createdAt: "desc" }
    });
    return { success: true, payments };
  } catch (e) {
    console.error(e);
    return { success: false, error: "Gagal mengambil transaksi pembayaran." };
  }
}

export async function deleteStudentPayment(id) {
  try {
    const session = await getSession();
    if (!(await isAuthorizedBendahara(session))) {
      return { success: false, error: "Unauthorized" };
    }
    await prisma.studentPayment.delete({ where: { id } });
    return { success: true };
  } catch (e) {
    console.error(e);
    return { success: false, error: "Gagal menghapus pembayaran." };
  }
}

// ─── 3. DANA BOS (PENCAIRAN & BELANJA) ───
export async function recordBosDisbursement(data) {
  try {
    const session = await getSession();
    if (!(await isAuthorizedBendahara(session))) {
      return { success: false, error: "Unauthorized" };
    }

    const { tahap, tahun, amount, receivedDate, keterangan } = data;
    const cleanAmount = parseInt(String(amount).replace(/\D/g, "")) || 0;

    const disbursement = await prisma.bosDisbursement.create({
      data: {
        tahap,
        tahun: String(tahun),
        amount: cleanAmount,
        receivedDate: receivedDate || new Date().toISOString().substring(0, 10),
        keterangan: keterangan || ""
      }
    });
    return { success: true, disbursement };
  } catch (e) {
    console.error(e);
    return { success: false, error: "Gagal mencatat pencairan Dana BOS." };
  }
}

export async function getBosDisbursements(tahun) {
  try {
    const list = await prisma.bosDisbursement.findMany({
      where: tahun ? { tahun: String(tahun) } : {},
      orderBy: { receivedDate: "desc" }
    });
    return { success: true, list };
  } catch (e) {
    console.error(e);
    return { success: false, error: "Gagal mengambil data pencairan Dana BOS." };
  }
}

export async function deleteBosDisbursement(id) {
  try {
    const session = await getSession();
    if (!(await isAuthorizedBendahara(session))) {
      return { success: false, error: "Unauthorized" };
    }
    await prisma.bosDisbursement.delete({ where: { id } });
    return { success: true };
  } catch (e) {
    console.error(e);
    return { success: false, error: "Gagal menghapus data pencairan BOS." };
  }
}

// ─── 4. PENGELUARAN / BELANJA (KAS SWADAYA & BOS) ───
export async function recordExpense(expenseData) {
  try {
    const session = await getSession();
    if (!(await isAuthorizedBendahara(session))) {
      return { success: false, error: "Unauthorized" };
    }

    const { source, category, title, amount, date, receiptNo, proofImage } = expenseData;
    const cleanAmount = parseInt(String(amount).replace(/\D/g, "")) || 0;

    const expense = await prisma.expenseTransaction.create({
      data: {
        source: source || "KAS_SWADAYA",
        category: category || "KAS_UMUM",
        title,
        amount: cleanAmount,
        date: date || new Date().toISOString().substring(0, 10),
        receiptNo: receiptNo || "-",
        proofImage: proofImage || "",
        createdById: session.id
      }
    });
    return { success: true, expense };
  } catch (e) {
    console.error(e);
    return { success: false, error: "Gagal mencatat pengeluaran: " + e.message };
  }
}

export async function getExpenses(source, month, year) {
  try {
    const where = {};
    if (source) where.source = source;

    const list = await prisma.expenseTransaction.findMany({
      where,
      orderBy: { date: "desc" }
    });

    let filtered = list;
    if (month && year) {
      const monthStr = String(month).padStart(2, "0");
      const prefix = `${year}-${monthStr}`;
      filtered = list.filter(item => item.date.startsWith(prefix));
    } else if (year) {
      filtered = list.filter(item => item.date.startsWith(String(year)));
    }

    return { success: true, list: filtered };
  } catch (e) {
    console.error(e);
    return { success: false, error: "Gagal mengambil data pengeluaran." };
  }
}

export async function deleteExpense(id) {
  try {
    const session = await getSession();
    if (!(await isAuthorizedBendahara(session))) {
      return { success: false, error: "Unauthorized" };
    }
    await prisma.expenseTransaction.delete({ where: { id } });
    return { success: true };
  } catch (e) {
    console.error(e);
    return { success: false, error: "Gagal menghapus pengeluaran." };
  }
}

// ─── 5. PAYROLL GAJI GURU ───
export async function recordTeacherPayroll(payrollData) {
  try {
    const session = await getSession();
    if (!(await isAuthorizedBendahara(session))) {
      return { success: false, error: "Unauthorized" };
    }

    const { teacherId, bulan, tahun, honorPokok, tunjangan, transport, insentif, totalGaji, paidAt } = payrollData;
    const receiptNo = generateReceiptNo("SLIP-GAJI");

    const existing = await prisma.payrollRecord.findFirst({
      where: { teacherId, bulan: String(bulan), tahun: String(tahun) }
    });

    let record;
    if (existing) {
      record = await prisma.payrollRecord.update({
        where: { id: existing.id },
        data: {
          honorPokok,
          tunjangan,
          transport,
          insentif,
          totalGaji,
          paidAt: paidAt || new Date().toISOString().substring(0, 10)
        }
      });
    } else {
      record = await prisma.payrollRecord.create({
        data: {
          teacherId,
          bulan: String(bulan),
          tahun: String(tahun),
          honorPokok,
          tunjangan,
          transport,
          insentif,
          totalGaji,
          paidAt: paidAt || new Date().toISOString().substring(0, 10),
          receiptNo
        }
      });
    }
    return { success: true, record };
  } catch (e) {
    console.error(e);
    return { success: false, error: "Gagal mencatat penggajian guru: " + e.message };
  }
}

// ─── 6. DASHBOARD & REKAP KEUANGAN (MULTI-KAS) ───
export async function getBendaharaDashboardData(bulan, tahun) {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: "Unauthorized" };

    const selectedBulan = String(bulan || (new Date().getMonth() + 1));
    const selectedTahun = String(tahun || new Date().getFullYear());
    const monthPrefix = `${selectedTahun}-${selectedBulan.padStart(2, "0")}`;

    // 1. Ambil Master Tarif
    const feeMasters = await prisma.feeMaster.findMany({ orderBy: { name: "asc" } });

    // 2. Ambil Pemasukan Siswa Bulan Ini & Tahun Ini
    const allStudentPayments = await prisma.studentPayment.findMany({
      include: { student: true },
      orderBy: { createdAt: "desc" }
    });
    const monthlyStudentPayments = allStudentPayments.filter(p => p.paidAt.startsWith(monthPrefix));
    const totalStudentIncomeMonthly = monthlyStudentPayments.reduce((acc, curr) => acc + curr.paidAmount, 0);
    const totalStudentIncomeYearly = allStudentPayments
      .filter(p => p.paidAt.startsWith(selectedTahun))
      .reduce((acc, curr) => acc + curr.paidAmount, 0);

    // 3. Ambil Dana BOS
    const allBosDisbursements = await prisma.bosDisbursement.findMany({ orderBy: { receivedDate: "desc" } });
    const yearlyBosDisbursements = allBosDisbursements.filter(b => b.tahun === selectedTahun);
    const totalBosIncomeYearly = yearlyBosDisbursements.reduce((acc, curr) => acc + curr.amount, 0);

    // 4. Ambil Pengeluaran (Swadaya & BOS)
    const allExpenses = await prisma.expenseTransaction.findMany({ orderBy: { date: "desc" } });
    const monthlyExpensesSwadaya = allExpenses
      .filter(e => e.source === "KAS_SWADAYA" && e.date.startsWith(monthPrefix))
      .reduce((acc, curr) => acc + curr.amount, 0);
    const monthlyExpensesBos = allExpenses
      .filter(e => e.source === "KAS_BOS" && e.date.startsWith(monthPrefix))
      .reduce((acc, curr) => acc + curr.amount, 0);
    const yearlyExpensesBos = allExpenses
      .filter(e => e.source === "KAS_BOS" && e.date.startsWith(selectedTahun))
      .reduce((acc, curr) => acc + curr.amount, 0);

    // 5. Ambil Siswa & Status SPP Bulan Ini
    const students = await prisma.student.findMany({
      orderBy: [{ kelas: "asc" }, { name: "asc" }]
    });

    // Petakan status SPP siswa bulan ini
    const sppPaymentsThisMonth = allStudentPayments.filter(p => p.feeName.toLowerCase().includes("spp") && p.bulan === selectedBulan && p.tahun === selectedTahun);
    const studentSppStatusMap = {};
    sppPaymentsThisMonth.forEach(p => {
      studentSppStatusMap[p.studentNisn] = p;
    });

    // 6. Sisa Saldo Kas Swadaya & Kas BOS
    const saldoSwadaya = totalStudentIncomeYearly - allExpenses.filter(e => e.source === "KAS_SWADAYA" && e.date.startsWith(selectedTahun)).reduce((a, b) => a + b.amount, 0);
    const saldoBos = totalBosIncomeYearly - yearlyExpensesBos;

    return {
      success: true,
      selectedBulan,
      selectedTahun,
      feeMasters,
      allStudentPayments,
      monthlyStudentPayments,
      totalStudentIncomeMonthly,
      totalStudentIncomeYearly,
      allBosDisbursements,
      yearlyBosDisbursements,
      totalBosIncomeYearly,
      allExpenses,
      monthlyExpensesSwadaya,
      monthlyExpensesBos,
      yearlyExpensesBos,
      saldoSwadaya,
      saldoBos,
      students,
      studentSppStatusMap
    };
  } catch (e) {
    console.error(e);
    return { success: false, error: "Gagal mengambil data keuangan bendahara: " + e.message };
  }
}

// ─── 7. PORTAL SISWA: RINGKASAN TAGIHAN & PEMBAYARAN SISWA ───
export async function getStudentFinancialSummary() {
  try {
    const session = await getSession();
    if (!session || session.role !== "siswa") {
      return { success: false, error: "Unauthorized" };
    }

    const student = await prisma.student.findUnique({
      where: { nisn: session.nisn },
      include: {
        payments: { orderBy: { createdAt: "desc" } }
      }
    });

    if (!student) return { success: false, error: "Siswa tidak ditemukan." };

    const feeMasters = await prisma.feeMaster.findMany({ orderBy: { name: "asc" } });

    return {
      success: true,
      student: {
        name: student.name,
        nisn: student.nisn,
        kelas: student.kelas
      },
      payments: student.payments || [],
      feeMasters
    };
  } catch (e) {
    console.error(e);
    return { success: false, error: "Gagal mengambil ringkasan keuangan siswa." };
  }
}

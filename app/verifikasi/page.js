import prisma from "@/lib/prisma";

export default async function VerifikasiPage({ searchParams }) {
  const resolvedParams = await searchParams;
  const { doc, nisn } = resolvedParams;

  let isValid = false;
  let docTitle = "";
  let student = null;
  let school = null;

  if (doc && nisn) {
    student = await prisma.student.findUnique({ where: { nisn } });
    if (student && student.status === "LULUS") {
      isValid = true;
      school = await prisma.school.findFirst();

      if (doc === "buku-induk") docTitle = "Buku Induk Siswa";
      else if (doc === "sknr") docTitle = "Surat Keterangan Nilai Rapor (SKNR)";
      else if (doc === "skl") docTitle = "Surat Keterangan Lulus (SKL)";
      else if (doc === "transkrip") docTitle = "Transkrip Nilai Akademik";
      else docTitle = "Dokumen Resmi Alumni";
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", padding: "2rem", display: "flex", justifyContent: "center", alignItems: "center" }}>
      <div style={{ maxWidth: "500px", width: "100%", background: "#fff", borderRadius: "12px", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)", overflow: "hidden" }}>
        <div style={{ padding: "2rem", textAlign: "center", background: isValid ? "#059669" : "#dc2626", color: "#fff" }}>
          {isValid ? (
            <svg style={{ width: "64px", height: "64px", margin: "0 auto" }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          ) : (
            <svg style={{ width: "64px", height: "64px", margin: "0 auto" }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
            </svg>
          )}
          <h2 style={{ margin: "1rem 0 0 0", fontSize: "1.5rem" }}>
            {isValid ? "Dokumen Terverifikasi Asli" : "Dokumen Tidak Valid"}
          </h2>
        </div>

        <div style={{ padding: "2rem" }}>
          {isValid ? (
            <>
              <p style={{ margin: "0 0 1.5rem 0", color: "#475569", lineHeight: "1.5", textAlign: "center" }}>
                Dokumen yang Anda pindai adalah <strong>SAH</strong> dan terdaftar dalam basis data resmi <strong>{school?.nama || "Sekolah Master Demo"}</strong>.
              </p>

              <div style={{ background: "#f1f5f9", padding: "1rem", borderRadius: "8px" }}>
                <DetailRow label="Jenis Dokumen" value={docTitle} />
                <DetailRow label="Nama Pemilik" value={student.name} />
                <DetailRow label="NISN" value={student.nisn} />
                <DetailRow label="Tahun Ajaran" value={student.tahunAjaran} />
                <DetailRow label="Jurusan" value={student.jurusan} />
              </div>
            </>
          ) : (
            <p style={{ margin: 0, color: "#475569", lineHeight: "1.5", textAlign: "center" }}>
              Sistem tidak dapat memverifikasi keaslian dokumen ini. QR Code mungkin telah direkayasa, kedaluwarsa, atau siswa tersebut belum terdaftar sebagai alumni resmi (LULUS).
            </p>
          )}

          <div style={{ marginTop: "2rem", textAlign: "center" }}>
            <a href="/" style={{ color: "#2563eb", textDecoration: "none", fontWeight: 500 }}>&larr; Kembali ke Beranda</a>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "0.5rem 0", borderBottom: "1px dashed #cbd5e1" }}>
      <span style={{ color: "#64748b", fontSize: "0.9rem" }}>{label}</span>
      <strong style={{ color: "#1e293b", fontSize: "0.9rem", textAlign: "right", maxWidth: "60%" }}>{value || "-"}</strong>
    </div>
  );
}

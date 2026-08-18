import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import PrintButton from "@/app/cetak-blanko/PrintButton";

export default async function CetakTranskrip({ params }) {
  const resolvedParams = await params;
  const { nisn } = resolvedParams;

  const student = await prisma.student.findUnique({
    where: { nisn },
    include: {
      grades: true // Fetch all grades
    }
  });

  if (!student) return notFound();
  
  const school = await prisma.school.findFirst();
  const domain = "https://smk.alqodiriyah.sch.id"; 
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(`${domain}/verifikasi?nisn=${nisn}&doc=transkrip`)}`;

  let logoUrl = "/logo-generic.svg";
  if (school?.logo && school.logo.length > 5 && (school.logo.startsWith("http") || school.logo.startsWith("data:") || school.logo.startsWith("/"))) {
    logoUrl = school.logo;
  }

  // Calculate Averages per semester
  // Group by Subject first to show a list of subjects and their avg
  const subjects = {};
  student.grades.forEach(g => {
    if (!subjects[g.subjectName]) subjects[g.subjectName] = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, count: 0, total: 0 };
    const sem = parseInt(g.semester);
    if (!isNaN(sem) && sem >= 1 && sem <= 6) {
       // Average of tugas1, tugas2, uts, uas for that semester
       let sum = 0; let n = 0;
       if (g.tugas1) { sum += g.tugas1; n++; }
       if (g.tugas2) { sum += g.tugas2; n++; }
       if (g.uts) { sum += g.uts; n++; }
       if (g.uas) { sum += g.uas; n++; }
       const finalVal = n > 0 ? Math.round(sum / n) : 0;
       
       subjects[g.subjectName][sem] = finalVal;
       subjects[g.subjectName].total += finalVal;
       if (finalVal > 0) subjects[g.subjectName].count++;
    }
  });

  const subjectNames = Object.keys(subjects).sort();

  return (
    <html>
      <head>
        <title>Transkrip - {student.name}</title>
        <style dangerouslySetInnerHTML={{__html: `
          @media print {
            @page { size: A4; margin: 10mm; }
            body { margin: 0; background: #fff; }
            .no-print { display: none !important; }
            * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          }
          body { font-family: "Times New Roman", Times, serif; color: #000; background: #eee; margin: 0; padding: 0; }
          .a4-page { 
            width: 210mm; 
            min-height: 297mm; 
            margin: 1rem auto; 
            background: white; 
            padding: 15mm;
            box-shadow: 0 0 10px rgba(0,0,0,0.1); 
            box-sizing: border-box; 
            position: relative;
          }
          @media print {
            .a4-page { margin: 0; box-shadow: none; width: 100%; height: auto; padding: 0; }
          }
          .kop-surat { display: flex; align-items: center; border-bottom: 3px solid #000; padding-bottom: 10px; margin-bottom: 15px; }
          .kop-logo { width: 80px; height: 80px; object-fit: contain; }
          .kop-text { flex-grow: 1; text-align: center; }
          .kop-text h3, .kop-text h1, .kop-text p { margin: 0; line-height: 1.2; }
          table.biodata { width: 100%; border-collapse: collapse; margin-bottom: 1rem; }
          table.biodata td { padding: 3px; font-size: 10pt; }
          table.nilai { width: 100%; border-collapse: collapse; margin-bottom: 1rem; }
          table.nilai th, table.nilai td { border: 1px solid #000; padding: 6px; font-size: 10pt; text-align: center; }
          table.nilai th { background-color: #f0f0f0; }
          table.nilai td.text-left { text-align: left; }
        `}} />
      </head>
      <body>
        <div className="a4-page">
          <div className="kop-surat">
            <img src={logoUrl} alt="Logo" className="kop-logo" />
            <div className="kop-text">
              <h3>{school?.yayasan || "YAYASAN PENDIDIKAN"}</h3>
              <h1 style={{ fontSize: "1.4rem", fontWeight: "bold" }}>{school?.nama || "SEKOLAH MASTER DEMO"}</h1>
              <p style={{ fontSize: "9pt", fontStyle: "italic" }}>
                {school?.alamat || "Alamat Sekolah"} <br />
                NPSN: {school?.npsn || "-"}
              </p>
            </div>
          </div>

          <h2 style={{ textAlign: "center", marginBottom: "1rem", textDecoration: "underline", fontSize: "13pt" }}>
            TRANSKRIP NILAI AKADEMIK
          </h2>

          <table className="biodata">
            <tbody>
              <tr><td style={{width: "25%"}}>Nama Lengkap</td><td>: {student.name}</td></tr>
              <tr><td>NIS / NISN</td><td>: {student.nis} / {student.nisn}</td></tr>
              <tr><td>Tempat, Tgl Lahir</td><td>: {student.tempatLahir}, {student.tanggalLahir}</td></tr>
              <tr><td>Program Keahlian</td><td>: {student.jurusan || "-"}</td></tr>
            </tbody>
          </table>

          <table className="nilai">
            <thead>
              <tr>
                <th rowSpan="2" style={{width: "5%"}}>No</th>
                <th rowSpan="2">Mata Pelajaran</th>
                <th colSpan="6">Nilai Rata-rata per Semester</th>
                <th rowSpan="2" style={{width: "10%"}}>Ujian Akhir</th>
              </tr>
              <tr>
                <th>1</th><th>2</th><th>3</th><th>4</th><th>5</th><th>6</th>
              </tr>
            </thead>
            <tbody>
              {subjectNames.length === 0 ? (
                <tr><td colSpan="9" style={{padding: "2rem"}}>Belum ada data nilai tercatat.</td></tr>
              ) : (
                subjectNames.map((subj, idx) => (
                  <tr key={subj}>
                    <td>{idx + 1}</td>
                    <td className="text-left">{subj}</td>
                    <td>{subjects[subj][1] || "-"}</td>
                    <td>{subjects[subj][2] || "-"}</td>
                    <td>{subjects[subj][3] || "-"}</td>
                    <td>{subjects[subj][4] || "-"}</td>
                    <td>{subjects[subj][5] || "-"}</td>
                    <td>{subjects[subj][6] || "-"}</td>
                    <td>{subjects[subj].count > 0 ? Math.round(subjects[subj].total / subjects[subj].count) : "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          <div style={{ marginTop: "2rem", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div>
              <img src={qrUrl} alt="QR Code Verifikasi" style={{ width: "85px", height: "85px", border: "1px solid #ccc", padding: "4px" }} />
              <p style={{ margin: "5px 0 0 0", fontSize: "8pt", color: "#666", maxWidth: "150px" }}>* Dokumen ini sah secara digital.</p>
            </div>
            <div style={{ textAlign: "center", width: "250px" }}>
              <p style={{ margin: "0 0 4rem 0" }}>Kota Demo, ..............................<br/>Kepala Sekolah,</p>
              <p style={{ margin: 0, fontWeight: "bold", textDecoration: "underline" }}>{school?.kepalaSekolah || "___________________"}</p>
              <p style={{ margin: 0 }}>NIP. {school?.nipKepsek || "-"}</p>
            </div>
          </div>
        </div>
        <PrintButton />
      </body>
    </html>
  );
}

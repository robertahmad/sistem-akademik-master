import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import PrintButton from "@/app/cetak-blanko/PrintButton";

export default async function CetakSKL({ params }) {
  const resolvedParams = await params;
  const { nisn } = resolvedParams;

  const student = await prisma.student.findUnique({
    where: { nisn },
  });

  if (!student) return notFound();
  
  const school = await prisma.school.findFirst();
  const domain = "https://smk.alqodiriyah.sch.id"; 
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(`${domain}/verifikasi?nisn=${nisn}&doc=skl`)}`;

  // Header SKNR Kop
  let logoUrl = "/logo-smk.png";
  if (school?.logo && school.logo.length > 5 && (school.logo.startsWith("http") || school.logo.startsWith("data:") || school.logo.startsWith("/"))) {
    logoUrl = school.logo;
  }

  return (
    <html>
      <head>
        <title>SKL - {student.name}</title>
        <style dangerouslySetInnerHTML={{__html: `
          @media print {
            @page { size: A4; margin: 15mm; }
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
            padding: 15mm 20mm;
            box-shadow: 0 0 10px rgba(0,0,0,0.1); 
            box-sizing: border-box; 
            position: relative;
          }
          @media print {
            .a4-page { margin: 0; box-shadow: none; width: 100%; height: auto; padding: 0; }
          }
          .kop-surat { display: flex; align-items: center; border-bottom: 3px solid #000; padding-bottom: 15px; margin-bottom: 25px; }
          .kop-logo { width: 90px; height: 90px; object-fit: contain; }
          .kop-text { flex-grow: 1; text-align: center; }
          .kop-text h3, .kop-text h1, .kop-text p { margin: 0; line-height: 1.2; }
          table.biodata { width: 100%; border-collapse: collapse; margin-top: 1rem; }
          table.biodata td { padding: 6px 4px; vertical-align: top; font-size: 11pt; }
          .label-col { width: 35%; }
        `}} />
      </head>
      <body>
        <div className="a4-page">
          {/* KOP SURAT */}
          <div className="kop-surat">
            <img src={logoUrl} alt="Logo" className="kop-logo" />
            <div className="kop-text">
              <h3>{school?.yayasan || "YAYASAN PENDIDIKAN"}</h3>
              <h1 style={{ fontSize: "1.5rem", fontWeight: "bold" }}>{school?.nama || "SEKOLAH MASTER DEMO"}</h1>
              <p style={{ fontSize: "10pt", fontStyle: "italic" }}>
                {school?.alamat || "Alamat Sekolah"} <br />
                Email: {school?.email || "-"} | Telp: {school?.telepon || "-"}
              </p>
            </div>
          </div>

          <h2 style={{ textAlign: "center", marginBottom: "0.5rem", textDecoration: "underline", fontSize: "14pt" }}>
            SURAT KETERANGAN LULUS
          </h2>
          <p style={{ textAlign: "center", margin: "0 0 2rem 0", fontSize: "11pt" }}>Nomor: 421.5/..../SMK-ALQ/....</p>
          
          <p style={{ fontSize: "11pt", textAlign: "justify", lineHeight: "1.5" }}>
            Yang bertanda tangan di bawah ini, Kepala {school?.nama || "Sekolah Master Demo"}, dengan ini menerangkan bahwa:
          </p>

          <table className="biodata" style={{ marginLeft: "20px", width: "90%", marginBottom: "1.5rem" }}>
            <tbody>
              <tr><td className="label-col">Nama Lengkap</td><td>: <strong>{student.name}</strong></td></tr>
              <tr><td className="label-col">Tempat, Tanggal Lahir</td><td>: {student.tempatLahir}, {student.tanggalLahir}</td></tr>
              <tr><td className="label-col">NIS / NISN</td><td>: {student.nis} / {student.nisn}</td></tr>
              <tr><td className="label-col">Program Keahlian</td><td>: {student.jurusan || "-"}</td></tr>
            </tbody>
          </table>

          <p style={{ fontSize: "11pt", textAlign: "justify", lineHeight: "1.5" }}>
            Berdasarkan kriteria kelulusan dari satuan pendidikan serta hasil Rapat Pleno Dewan Guru, maka siswa yang bersangkutan dinyatakan:
          </p>
          <div style={{ textAlign: "center", margin: "2rem 0" }}>
            <h1 style={{ fontSize: "2rem", letterSpacing: "5px", margin: 0 }}>L U L U S</h1>
          </div>
          <p style={{ fontSize: "11pt", textAlign: "justify", lineHeight: "1.5" }}>
            Demikian Surat Keterangan Lulus ini dibuat agar dapat dipergunakan sebagaimana mestinya. Surat keterangan ini berlaku sementara sampai dengan diterbitkannya Ijazah asli.
          </p>

          <div style={{ marginTop: "4rem", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div>
              <img src={qrUrl} alt="QR Code Verifikasi" style={{ width: "90px", height: "90px", border: "2px solid #ccc", padding: "4px" }} />
              <p style={{ margin: "5px 0 0 0", fontSize: "8pt", color: "#666", maxWidth: "150px" }}>* Scan QR Code ini untuk memverifikasi keaslian dokumen secara digital.</p>
            </div>
            <div style={{ textAlign: "center", width: "250px" }}>
              <p style={{ margin: "0 0 4rem 0" }}>Windusari, ..............................<br/>Kepala Sekolah,</p>
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

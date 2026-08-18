import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import PrintButton from "@/app/cetak-blanko/PrintButton";

export default async function CetakBukuInduk({ params }) {
  const resolvedParams = await params;
  const { nisn } = resolvedParams;

  const student = await prisma.student.findUnique({
    where: { nisn },
  });

  if (!student) return notFound();
  
  const school = await prisma.school.findFirst();
  const domain = "https://smk.alqodiriyah.sch.id"; // Can be dynamic in production
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(`${domain}/verifikasi?nisn=${nisn}&doc=buku-induk`)}`;

  return (
    <html>
      <head>
        <title>Buku Induk - {student.name}</title>
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
            padding: 20mm;
            box-shadow: 0 0 10px rgba(0,0,0,0.1); 
            box-sizing: border-box; 
            position: relative;
          }
          @media print {
            .a4-page { margin: 0; box-shadow: none; width: 100%; height: auto; padding: 0; }
          }
          table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
          td { padding: 4px; vertical-align: top; font-size: 11pt; }
          .label-col { width: 30%; font-weight: bold; }
        `}} />
      </head>
      <body>
        <div className="a4-page">
          <h2 style={{ textAlign: "center", marginBottom: "2rem", textDecoration: "underline" }}>LEMBAR BUKU INDUK SISWA</h2>
          
          <table>
            <tbody>
              <tr><td className="label-col">Nama Lengkap</td><td>: {student.name}</td></tr>
              <tr><td className="label-col">NIS / NISN</td><td>: {student.nis} / {student.nisn}</td></tr>
              <tr><td className="label-col">Jenis Kelamin</td><td>: {student.jenisKelamin}</td></tr>
              <tr><td className="label-col">Tempat, Tanggal Lahir</td><td>: {student.tempatLahir}, {student.tanggalLahir}</td></tr>
              <tr><td className="label-col">Agama</td><td>: Islam</td></tr>
              <tr><td className="label-col">Alamat Lengkap</td><td>: {student.alamat}</td></tr>
              <tr><td className="label-col">Asal Sekolah</td><td>: {student.asalSekolah}</td></tr>
              <tr><td className="label-col">Tanggal Diterima</td><td>: {student.tanggalMasuk}</td></tr>
              <tr><td className="label-col">Nama Orang Tua</td><td></td></tr>
              <tr><td className="label-col" style={{ paddingLeft: "15px" }}>a. Ayah</td><td>: {student.namaAyah}</td></tr>
              <tr><td className="label-col" style={{ paddingLeft: "15px" }}>b. Ibu</td><td>: {student.namaIbu}</td></tr>
              <tr><td className="label-col">Pekerjaan Orang Tua</td><td></td></tr>
              <tr><td className="label-col" style={{ paddingLeft: "15px" }}>a. Ayah</td><td>: {student.pekerjaanAyah}</td></tr>
              <tr><td className="label-col" style={{ paddingLeft: "15px" }}>b. Ibu</td><td>: {student.pekerjaanIbu}</td></tr>
              <tr><td className="label-col">Tahun Lulus</td><td>: {student.status === "LULUS" ? (new Date().getFullYear()) : "Belum Lulus"}</td></tr>
            </tbody>
          </table>

          <div style={{ marginTop: "4rem", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div>
              <p style={{ margin: "0 0 5px 0", fontSize: "10pt" }}>*Dokumen ini ditandatangani secara elektronik.</p>
              <img src={qrUrl} alt="QR Code Verifikasi" style={{ width: "80px", height: "80px" }} />
              <p style={{ margin: "5px 0 0 0", fontSize: "9pt", color: "#444" }}>Scan untuk verifikasi</p>
            </div>
            <div style={{ textAlign: "center", width: "300px" }}>
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

import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import PrintButton from "./PrintButton";

export default async function CetakSppd({ params }) {
  const resolvedParams = await params;
  
  const sppd = await prisma.sppd.findUnique({
    where: { id: resolvedParams.id },
    include: { teacher: true }
  });

  if (!sppd || sppd.status !== "DISETUJUI") {
    return notFound();
  }

  const school = await prisma.school.findFirst();

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("id-ID", {
      day: "numeric", month: "long", year: "numeric"
    });
  };

  const dayDiff = Math.ceil((new Date(sppd.tanggalKembali) - new Date(sppd.tanggalBerangkat)) / (1000 * 60 * 60 * 24)) + 1;

  let logoUrl = "/logo-smk.png";
  if (school?.logo && school.logo.length > 5) {
    if (school.logo.startsWith("http") || school.logo.startsWith("data:")) {
      logoUrl = school.logo;
    } else if (school.logo.startsWith("/")) {
      logoUrl = school.logo;
    }
  }

  return (
    <html>
      <head>
        <title>Cetak SPPD - {sppd.teacher.name}</title>
        <style dangerouslySetInnerHTML={{__html: `
          @media print {
            @page { size: A4; margin: 1.5cm; }
            body { font-family: "Times New Roman", Times, serif; color: #000; background: #fff; line-height: 1.5; font-size: 12pt; }
            .page-break { page-break-before: always; }
            .no-print { display: none !important; }
          }
          body { font-family: "Times New Roman", Times, serif; color: #000; background: #eee; line-height: 1.5; font-size: 12pt; }
          .a4-page { width: 210mm; min-height: 297mm; padding: 1.5cm; margin: 1rem auto; background: white; box-shadow: 0 0 10px rgba(0,0,0,0.1); box-sizing: border-box; }
          .title { text-align: center; margin-bottom: 15px; }
          .title h2 { margin: 0; font-size: 14pt; text-decoration: underline; font-weight: bold; }
          .title p { margin: 5px 0 0 0; }
          .content-table { width: 100%; border-collapse: collapse; }
          .content-table td { padding: 8px; vertical-align: top; }
          .content-table td:first-child { width: 40px; text-align: center; }
          .content-table td:nth-child(2) { width: 250px; }
          .signature-box { width: 300px; margin-left: auto; margin-top: 50px; text-align: left; }
        `}} />
      </head>
      <body>
        {/* HALAMAN 1: SPPD DEPAN */}
        <div className="a4-page">

          {/* KOP SURAT - Gaya Resmi SKNR */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", borderBottom: "4px double #000", paddingBottom: "0.5rem", marginBottom: "1.5rem" }}>
            <img src={logoUrl} alt="Logo Sekolah" style={{ height: "85px", width: "85px", objectFit: "contain", marginRight: "1.5rem" }} />
            <div style={{ textAlign: "center", flex: 1, color: "#000", fontFamily: "'Times New Roman', serif" }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: "bold", margin: 0, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                {school?.yayasan || "YAYASAN AL QODIRIYAH HASAN IBRAHIM"}
              </h3>
              <h2 style={{ fontSize: "1.25rem", fontWeight: "bold", margin: "2px 0 4px 0", textTransform: "uppercase" }}>
                {school?.nama || "SEKOLAH MASTER DEMO WINDUSARI"}
              </h2>
              <div style={{ fontSize: "0.85rem", margin: "2px 0" }}>
                Nomor SK Ijin Operasional : {school?.skIjin || "188.4/61081/20.2b/2015"}
              </div>
              <div style={{ fontSize: "0.9rem", fontWeight: "bold", margin: "2px 0" }}>
                NSS : {school?.nss || "202030816051"}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;NPSN : {school?.npsn || "-"}
              </div>
              <div style={{ fontSize: "0.75rem", fontStyle: "italic", color: "#008000", fontWeight: "500", marginTop: "2px" }}>
                Alamat : {school?.alamat} &#9742; {school?.telepon || "085228476578"} &#9993; {school?.email || "smkalqodiriyah@gmail.com"}
              </div>
            </div>
          </div>

          <div className="title">
            <h2>SURAT PERINTAH PERJALANAN DINAS</h2>
            <p>Nomor: {sppd.nomorSurat}</p>
          </div>

          <table className="content-table" border="1">
            <tbody>
              <tr>
                <td>1.</td>
                <td>Pejabat yang berwenang memberi perintah</td>
                <td>Kepala {school?.nama || "Sekolah Master Demo"}</td>
              </tr>
              <tr>
                <td>2.</td>
                <td>Nama pegawai yang diperintah</td>
                <td><strong>{sppd.teacher.name}</strong></td>
              </tr>
              <tr>
                <td>3.</td>
                <td>a. Pangkat / Golongan<br/>b. Jabatan / Instansi</td>
                <td>a. -<br/>b. {sppd.teacher.jabatan} / {school?.nama || "Sekolah Master Demo"}</td>
              </tr>
              <tr>
                <td>4.</td>
                <td>Maksud Perjalanan Dinas</td>
                <td>{sppd.keperluan}</td>
              </tr>
              <tr>
                <td>5.</td>
                <td>Alat angkutan yang dipergunakan</td>
                <td>{sppd.transportasi}</td>
              </tr>
              <tr>
                <td>6.</td>
                <td>a. Tempat Berangkat<br/>b. Tempat Tujuan</td>
                <td>a. {school?.nama || "Sekolah Master Demo"}<br/>b. {sppd.tujuan}</td>
              </tr>
              <tr>
                <td>7.</td>
                <td>a. Lamanya perjalanan dinas<br/>b. Tanggal berangkat<br/>c. Tanggal kembali</td>
                <td>a. {dayDiff} ({dayDiff} hari)<br/>b. {formatDate(sppd.tanggalBerangkat)}<br/>c. {formatDate(sppd.tanggalKembali)}</td>
              </tr>
              <tr>
                <td>8.</td>
                <td>Pengikut: Nama</td>
                <td>-</td>
              </tr>
              <tr>
                <td>9.</td>
                <td>Keterangan lain-lain</td>
                <td>-</td>
              </tr>
            </tbody>
          </table>

          <div className="signature-box">
            <p style={{ margin: 0 }}>Dikeluarkan di: Windusari</p>
            <p style={{ margin: "0 0 10px 0" }}>Tanggal: {formatDate(sppd.createdAt)}</p>
            <p style={{ margin: 0 }}>Kepala Sekolah,</p>
            <div style={{ height: "65px", margin: "10px 0", position: "relative" }}>
              {school?.kepsekSignature && (
                <img src={school.kepsekSignature} alt="Tanda Tangan Kepsek" style={{ height: "100%", position: "absolute", left: "-20px" }} />
              )}
            </div>
            <p style={{ margin: 0, fontWeight: "bold", textDecoration: "underline" }}>{school?.kepsek || "H. Ahmad Syafi'i, S.Pd.I"}</p>
            <p style={{ margin: 0 }}>NIP. {school?.kepsekNip || "-"}</p>
          </div>
        </div>

        {/* HALAMAN 2: VISUM / BUKTI STEMPEL */}
        <div className="a4-page page-break">
          <table className="content-table" border="1" style={{ borderBottom: "none" }}>
            <tbody>
              <tr>
                <td colSpan="3" style={{ borderRight: "none" }}></td>
                <td style={{ borderLeft: "none", width: "350px", padding: "10px" }}>
                  <p style={{ margin: 0 }}>I. Berangkat dari : {school?.nama || "Sekolah Master Demo"}</p>
                  <p style={{ margin: 0 }}>&nbsp;&nbsp;&nbsp;Ke : {sppd.tujuan}</p>
                  <p style={{ margin: 0 }}>&nbsp;&nbsp;&nbsp;Pada tanggal : {formatDate(sppd.tanggalBerangkat)}</p>
                  <p style={{ margin: "20px 0 0 0" }}>Kepala Sekolah,</p>
                  <div style={{ height: "45px" }}></div>
                  <p style={{ margin: 0, fontWeight: "bold" }}><u>{school?.kepsek || "H. Ahmad Syafi'i, S.Pd.I"}</u></p>
                  <p style={{ margin: 0 }}>NIP. {school?.kepsekNip || "-"}</p>
                </td>
              </tr>
            </tbody>
          </table>
          <table className="content-table" border="1" style={{ borderTop: "none" }}>
            <tbody>
              <tr>
                <td style={{ width: "50%", padding: "10px", borderTop: "none" }}>
                  <p style={{ margin: 0 }}>II. Tiba di : {sppd.tujuan}</p>
                  <p style={{ margin: 0 }}>&nbsp;&nbsp;&nbsp;Pada tanggal : {formatDate(sppd.tanggalBerangkat)}</p>
                  <p style={{ margin: "20px 0 0 0" }}>Pejabat Instansi Tujuan,</p>
                  <div style={{ height: "50px", textAlign: "center", color: "#888", fontSize: "10pt", paddingTop: "20px" }}>
                    (Tanda Tangan &amp; Stempel)
                  </div>
                  <p style={{ margin: 0 }}>Nama: .........................................</p>
                  <p style={{ margin: 0 }}>NIP: .........................................</p>
                </td>
                <td style={{ width: "50%", padding: "10px", borderTop: "none" }}>
                  <p style={{ margin: 0 }}>Berangkat dari : {sppd.tujuan}</p>
                  <p style={{ margin: 0 }}>Ke : {school?.nama || "Sekolah Master Demo"}</p>
                  <p style={{ margin: 0 }}>Pada tanggal : {formatDate(sppd.tanggalKembali)}</p>
                  <p style={{ margin: "20px 0 0 0" }}>Pejabat Instansi Tujuan,</p>
                  <div style={{ height: "50px", textAlign: "center", color: "#888", fontSize: "10pt", paddingTop: "20px" }}>
                    (Tanda Tangan &amp; Stempel)
                  </div>
                  <p style={{ margin: 0 }}>Nama: .........................................</p>
                  <p style={{ margin: 0 }}>NIP: .........................................</p>
                </td>
              </tr>
              <tr>
                <td colSpan="2" style={{ padding: "10px" }}>
                  <p style={{ margin: 0 }}>III. Tiba kembali di : {school?.nama || "Sekolah Master Demo"}</p>
                  <p style={{ margin: 0 }}>&nbsp;&nbsp;&nbsp;&nbsp;Pada tanggal : {formatDate(sppd.tanggalKembali)}</p>
                  <p style={{ margin: 0, marginTop: "10px" }}>Telah diperiksa dengan keterangan bahwa perjalanan tersebut di atas benar-benar dilakukan atas perintahnya dan semata-mata untuk kepentingan jabatan dalam waktu sesingkat-singkatnya.</p>
                  
                  <div className="signature-box" style={{ marginTop: "15px", marginRight: "30px", marginLeft: "auto", width: "300px" }}>
                    <p style={{ margin: 0 }}>Kepala Sekolah,</p>
                    <div style={{ height: "65px", margin: "10px 0", position: "relative" }}>
                      {school?.kepsekSignature && (
                        <img src={school.kepsekSignature} alt="Tanda Tangan Kepsek" style={{ height: "100%", position: "absolute", left: "-20px" }} />
                      )}
                    </div>
                    <p style={{ margin: 0, fontWeight: "bold", textDecoration: "underline" }}>{school?.kepsek || "H. Ahmad Syafi'i, S.Pd.I"}</p>
                    <p style={{ margin: 0 }}>NIP. {school?.kepsekNip || "-"}</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <PrintButton />
        
      </body>
    </html>
  );
}



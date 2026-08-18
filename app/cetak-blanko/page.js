import prisma from "@/lib/prisma";
import PrintButton from "./PrintButton";

export default async function CetakBlanko() {
  const school = await prisma.school.findFirst();
  const textStr = "SEKOLAH MASTER DEMO";

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
        <title>Cetak Blanko Kertas Resmi - {textStr}</title>
        <style dangerouslySetInnerHTML={{__html: `
          @media print {
            @page { size: A4; margin: 0; }
            body { margin: 0; padding: 0; background: #fff; overflow: hidden; }
            .no-print { display: none !important; }
            header, footer, nav, .sidebar { display: none !important; }
            * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          }
          body { font-family: "Times New Roman", Times, serif; color: #000; background: #eee; margin: 0; padding: 0; }
          .a4-page { 
            width: 210mm; 
            height: 297mm; 
            margin: 1rem auto; 
            background: white; 
            box-shadow: 0 0 10px rgba(0,0,0,0.1); 
            box-sizing: border-box; 
            position: relative;
            overflow: hidden;
          }
          @media print {
            .a4-page { margin: 0; box-shadow: none; width: 100%; height: 297mm; page-break-after: avoid; }
          }
        `}} />
      </head>
      <body>
        <div id="rapor-printable-area" className="a4-page">
          {/* WATERMARK TEXT (DIAGONAL & REPEATING RAPAT) */}
          <svg width="100%" height="100%" style={{ position: "absolute", top: 0, left: 0, zIndex: 1 }}>
            {Array.from({ length: 26 }).map((_, i) => 
              Array.from({ length: 7 }).map((_, j) => {
                const offsetX = (i % 2 === 0) ? 0 : 160;
                const x = j * 320 + offsetX - 150;
                const y = i * 75 - 50;
                return (
                  <text 
                    key={i + "-" + j} 
                    x={x} 
                    y={y} 
                    transform={"rotate(-35 " + x + " " + y + ")"}
                    fill="rgba(0, 0, 0, 0.085)" 
                    fontSize="24" 
                    fontFamily="Arial, sans-serif" 
                    fontWeight="bold" 
                    textAnchor="middle"
                  >
                    {textStr}
                  </text>
                );
              })
            )}
          </svg>

          {/* LOGO BESAR TENGAH */}
          <img 
            src={logoUrl} 
            alt="Watermark Logo" 
            style={{ 
              position: "absolute", 
              top: "50%", 
              left: "50%", 
              transform: "translate(-50%, -50%)", 
              width: "600px", 
              height: "600px", 
              objectFit: "contain", 
              opacity: 0.15, 
              zIndex: 2 
            }} 
          />
        </div>

        <PrintButton />
      </body>
    </html>
  );
}

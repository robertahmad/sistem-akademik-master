import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const dkvSubjects = [
      {
        name: "Dasar-dasar Desain Komunikasi Visual",
        unit: "SMK",
        jurusan: "DKV",
        kkm: 75,
        cpA: "Sangat baik dalam menguasai konsep dan teori dasar DKV.",
        cpB: "Baik dalam menguasai sebagian besar konsep dasar DKV.",
        cpC: "Cukup dalam menguasai beberapa konsep dasar DKV.",
        cpD: "Kurang dalam memahami kompetensi dasar pelajaran."
      },
      {
        name: "Sketsa dan Gambar",
        unit: "SMK",
        jurusan: "DKV",
        kkm: 75,
        cpA: "Sangat baik dalam teknik menggambar manual dan proporsi.",
        cpB: "Baik dalam teknik menggambar manual dan proporsi.",
        cpC: "Cukup dalam teknik menggambar manual.",
        cpD: "Kurang dalam memahami teknik dasar menggambar."
      },
      {
        name: "Tinjauan Seni",
        unit: "SMK",
        jurusan: "DKV",
        kkm: 75,
        cpA: "Sangat baik dalam pemahaman estetika dan sejarah karya seni.",
        cpB: "Baik dalam pemahaman estetika dan sejarah karya seni.",
        cpC: "Cukup dalam pemahaman estetika dasar.",
        cpD: "Kurang dalam memahami estetika dan sejarah seni."
      },
      {
        name: "Komputer Grafis (Vektor & Bitmap)",
        unit: "SMK",
        jurusan: "DKV",
        kkm: 78,
        cpA: "Sangat mahir mengoperasikan software desain grafis.",
        cpB: "Baik dalam mengoperasikan software desain grafis.",
        cpC: "Cukup mampu mengoperasikan fungsi dasar software grafis.",
        cpD: "Kurang mampu mengoperasikan software desain grafis."
      },
      {
        name: "Fotografi Dasar & Tata Cahaya",
        unit: "SMK",
        jurusan: "DKV",
        kkm: 78,
        cpA: "Sangat mahir dalam teknik kamera dan pencahayaan.",
        cpB: "Baik dalam penguasaan teknik kamera dasar dan pencahayaan.",
        cpC: "Cukup dalam mengoperasikan kamera dan pencahayaan.",
        cpD: "Kurang memahami teknik kamera dan pencahayaan dasar."
      },
      {
        name: "Videografi & Animasi Dasar",
        unit: "SMK",
        jurusan: "DKV",
        kkm: 78,
        cpA: "Sangat baik dalam perekaman video dan pengeditan.",
        cpB: "Baik dalam perekaman video dan pengeditan.",
        cpC: "Cukup mampu merekam dan mengedit video sederhana.",
        cpD: "Kurang dalam keterampilan videografi dan animasi."
      },
      {
        name: "Desain Publikasi & Tipografi",
        unit: "SMK",
        jurusan: "DKV",
        kkm: 78,
        cpA: "Sangat terampil membuat desain publikasi cetak dan digital.",
        cpB: "Baik dalam membuat desain publikasi dan menyusun tipografi.",
        cpC: "Cukup mampu membuat desain publikasi sederhana.",
        cpD: "Kurang mampu membuat karya publikasi yang fungsional."
      },
      {
        name: "Produk Kreatif dan Kewirausahaan (PKK)",
        unit: "SMK",
        jurusan: "DKV",
        kkm: 75,
        cpA: "Sangat baik dalam merancang dan memasarkan produk kreatif.",
        cpB: "Baik dalam merancang produk kreatif bernilai jual.",
        cpC: "Cukup mampu merancang produk kreatif dasar.",
        cpD: "Kurang mampu mengaplikasikan konsep kewirausahaan."
      }
    ];

    let added = 0;
    for (const subject of dkvSubjects) {
      await prisma.subject.upsert({
        where: { name: subject.name },
        update: subject,
        create: subject,
      });
      added++;
    }

    return NextResponse.json({ success: true, message: `Berhasil menambahkan ${added} mata pelajaran DKV.` });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

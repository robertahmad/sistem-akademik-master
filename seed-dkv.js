const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

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

async function main() {
  console.log("Memulai penambahan mata pelajaran DKV...");
  let added = 0;
  for (const subject of dkvSubjects) {
    // Gunakan upsert agar tidak error jika dijalankan ulang
    const result = await prisma.subject.upsert({
      where: { name: subject.name },
      update: subject,
      create: subject,
    });
    console.log(`✅ Berhasil menyimpan: ${result.name}`);
    added++;
  }
  console.log(`\nSelesai! Berhasil menambahkan/memperbarui ${added} mata pelajaran.`);
}

main()
  .catch(e => {
    console.error("Terjadi kesalahan:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

require('dotenv').config();
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // Clear existing data in reverse order of relations
  await prisma.raporRecord.deleteMany({});
  await prisma.extracurricularGrade.deleteMany({});
  await prisma.grade.deleteMany({});
  await prisma.student.deleteMany({});
  await prisma.teacher.deleteMany({});
  await prisma.subject.deleteMany({});
  await prisma.extracurricular.deleteMany({});
  await prisma.question.deleteMany({});
  await prisma.school.deleteMany({});

  const hashedDefaultPassword = bcrypt.hashSync('123', 10);

  // 1. Seed School Profile
  await prisma.school.create({
    data: {
      id: 1,
      nama: "SEKOLAH MASTER DEMO",
      npsn: "12345678",
      alamat: "Jl. Pendidikan No. 1, Kota Demo",
      logo: "🏫",
      kepsek: "Budi Santoso, M.Pd.",
      kepsekNip: "198001012010011001",
      semester: "Ganjil",
      tahunAjaran: "2026/2027",
      tanggalCetak: "4 Juli 2026",
      yayasan: "YAYASAN MASTER DEMO HASAN IBRAHIM",
      skIjin: "188.4/61081/20.2b/2015",
      nss: "202030816051",
      telepon: "085228476578, 08587399500",
      email: "smpalqodiriyah@gmail.com"
    }
  });

  // 2. Seed Subjects
  await prisma.subject.create({
    data: {
      name: "Matematika",
      kkm: 75,
      cpA: "Sangat baik dalam memahami konsep kalkulus dasar, logika berpikir matematis, serta pengaplikasian statistik sederhana.",
      cpB: "Sangat baik dalam menyelesaikan soal-soal hitungan matematika secara runut dan sistematis.",
      cpC: "Cukup baik dalam memahami persamaan kuadrat. Perlu memperbanyak latihan soal matematika di rumah.",
      cpD: "Kurang memahami konsep matematika dasar. Perlu bimbingan intensif tambahan kelas."
    }
  });

  await prisma.subject.create({
    data: {
      name: "Bahasa Indonesia",
      kkm: 75,
      cpA: "Sangat baik dan mahir dalam menyusun teks laporan hasil observasi, esai kreatif, dan menyampaikan ide secara lisan dengan santun.",
      cpB: "Sangat terampil dalam menyusun teks laporan ilmiah dan menyampaikan gagasan secara tertulis dengan runtut.",
      cpC: "Cukup baik dalam menelaah struktur teks eksposisi. Perlu latihan menulis gagasan kreatif.",
      cpD: "Kurang memahami tata bahasa Indonesia baku. Perlu remedial intensif."
    }
  });

  await prisma.subject.create({
    data: {
      name: "Bahasa Inggris",
      kkm: 75,
      cpA: "Sangat mahir dalam percakapan (speaking) sehari-hari, menulis deskripsi teknis (technical writing), dan membaca teks manual dalam bahasa Inggris.",
      cpB: "Sangat baik dalam memahami tata bahasa (grammar) bahasa Inggris serta mampu mendengarkan dengan baik.",
      cpC: "Cukup baik dalam percakapan sederhana. Perlu memperkaya kosakata (vocabulary) bahasa Inggris.",
      cpD: "Masih kesulitan memahami percakapan dasar. Perlu bimbingan kelas remedial."
    }
  });

  await prisma.subject.create({
    data: {
      name: "Pendidikan Agama dan Budi Pekerti",
      kkm: 78,
      cpA: "Sangat baik dalam penguasaan materi keagamaan, kedisiplinan ibadah, serta memiliki akhlak mulia dalam bersosialisasi.",
      cpB: "Sangat taat dalam menjalankan ibadah harian serta memahami materi sejarah kebudayaan dan hukum agama.",
      cpC: "Cukup baik dalam perilaku keseharian. Perlu meningkatkan kualitas hafalan ayat dan bacaan ibadah.",
      cpD: "Perlu bimbingan khusus dalam kelancaran membaca kitab suci dan kedisiplinan ibadah harian."
    }
  });

  await prisma.subject.create({
    data: {
      name: "Pendidikan Pancasila",
      kkm: 75,
      cpA: "Sangat memahami hak dan kewajiban warga negara, pengamalan sila-sila Pancasila dalam keseharian, serta memiliki jiwa nasionalisme yang kuat.",
      cpB: "Sangat baik dalam memahami sistem ketatanegaraan Indonesia dan mematuhi tata tertib sekolah.",
      cpC: "Cukup baik dalam pemahaman materi konstitusi. Perlu meningkatkan keaktifan dalam diskusi kelas.",
      cpD: "Kurang memahami nilai-nilai dasar Pancasila. Perlu pembinaan perilaku berkewarganegaraan."
    }
  });

  await prisma.subject.create({
    data: {
      name: "PJOK",
      kkm: 75,
      cpA: "Sangat baik dalam keterampilan gerak olahraga bola besar/kecil, menjaga kebugaran jasmani, serta menjunjung tinggi sportivitas.",
      cpB: "Sangat aktif dalam kegiatan olahraga di lapangan serta memahami pola hidup sehat dan bersih.",
      cpC: "Cukup aktif dalam olahraga atletik dasar. Perlu meningkatkan daya tahan fisik dalam latihan berkelanjutan.",
      cpD: "Kurang berpartisipasi aktif dalam kegiatan olahraga luar kelas karena keterbatasan stamina. Perlu penyesuaian materi."
    }
  });

  await prisma.subject.create({
    data: {
      name: "Sejarah",
      kkm: 75,
      cpA: "Sangat baik dalam menganalisis peristiwa sejarah nasional dan dunia, serta mampu mengambil hikmah keteladanan tokoh sejarah.",
      cpB: "Sangat baik dalam memahami kronologi sejarah perjuangan kemerdekaan Indonesia.",
      cpC: "Cukup baik dalam memahami materi sejarah kerajaan nusantara. Perlu rajin membaca literatur sejarah.",
      cpD: "Kurang memahami keterkaitan sebab-akibat peristiwa sejarah. Perlu bimbingan pemetaan waktu sejarah."
    }
  });

  await prisma.subject.create({
    data: {
      name: "Projek IPAS",
      kkm: 75,
      cpA: "Sangat terampil dalam merancang eksperimen ilmiah sederhana, menganalisis interaksi mahluk hidup dengan lingkungan, serta peka terhadap isu lingkungan.",
      cpB: "Sangat baik dalam penyusunan laporan hasil projek ilmiah dan memahami konsep dasar sains fisika-biologi.",
      cpC: "Cukup baik dalam pengerjaan projek kelompok IPAS. Perlu meningkatkan kerja sama tim.",
      cpD: "Kurang berpartisipasi aktif dalam kegiatan projek sains lapangan. Perlu remedial penguasaan materi dasar."
    }
  });

  await prisma.subject.create({
    data: {
      name: "Informatika",
      kkm: 75,
      cpA: "Sangat mahir dalam pemecahan masalah dengan berpikir komputasional, penggunaan fitur lanjutan aplikasi perkantoran, dan memahami dasar jaringan.",
      cpB: "Sangat baik dalam membuat presentasi digital kreatif dan memahami konsep keamanan data pribadi.",
      cpC: "Cukup baik dalam penggunaan sistem operasi. Perlu melatih kecepatan mengetik sepuluh jari.",
      cpD: "Kesulitan dalam menggunakan aplikasi perkantoran dasar. Perlu pendampingan praktik intensif di laboratorium."
    }
  });

  await prisma.subject.create({
    data: {
      name: "Seni Budaya",
      kkm: 75,
      cpA: "Sangat kreatif dalam membuat karya seni rupa dua/tiga dimensi, memiliki kepekaan estetika tinggi, serta apresiatif terhadap seni tradisional.",
      cpB: "Sangat terampil dalam meniru teknik gambar arsir dan memahami ragam hias kebudayaan daerah.",
      cpC: "Cukup baik dalam menggambar perspektif dasar. Perlu meningkatkan kerapian pengerjaan karya.",
      cpD: "Kesulitan dalam mengekspresikan ide menjadi bentuk gambar dasar. Perlu bimbingan sketsa bentuk."
    }
  });

  await prisma.subject.create({
    data: {
      name: "Dasar-dasar DKV",
      kkm: 75,
      cpA: "Sangat mahir dalam memahami prinsip tata letak (layout), nirmana, membuat sketsa bentuk, serta terampil mengoperasikan software grafis standar.",
      cpB: "Sangat baik dalam membedakan jenis-jenis tipografi, psikologi warna, dan pembuatan vektor desain dasar.",
      cpC: "Cukup baik dalam pemahaman teori desain. Perlu memperbanyak latihan menggambar anatomi dan sketsa objek.",
      cpD: "Masih kesulitan mengoperasikan alat gambar digital dan membedakan format gambar standar. Perlu latihan intensif."
    }
  });

  await prisma.subject.create({
    data: {
      name: "Konsentrasi Keahlian DKV",
      kkm: 75,
      cpA: "Sangat ahli dalam pembuatan desain identitas visual (branding), fotografi studio komersial, produksi videografi promosi, dan manipulasi gambar bitmap.",
      cpB: "Sangat terampil menggunakan kamera DSLR, mengoperasikan pencahayaan studio, serta melakukan editing video dengan transisi yang halus.",
      cpC: "Cukup aktif dalam kegiatan projek desain kelompok. Perlu melatih kerapian pengerjaan aset vektor.",
      cpD: "Kesulitan memahami teknik komposisi visual dan pengambilan sudut gambar (angle) kamera. Perlu asistensi khusus."
    }
  });

  await prisma.subject.create({
    data: {
      name: "Projek Kreatif dan Kewirausahaan",
      kkm: 75,
      cpA: "Sangat baik dalam perancangan ide bisnis jasa desain, melakukan analisis SWOT pasar industri kreatif, serta mahir menyusun rencana pemasaran digital.",
      cpB: "Mampu memproduksi barang/jasa kreatif bernilai jual tinggi serta memahami konsep penghitungan harga pokok produksi (HPP).",
      cpC: "Cukup memahami konsep pemasaran media sosial. Perlu meningkatkan kemandirian dalam perancangan produk kreatif.",
      cpD: "Kesulitan dalam menyusun portofolio bisnis dan penghitungan laba/rugi usaha kreatif. Perlu bimbingan berkelanjutan."
    }
  });

  await prisma.subject.create({
    data: {
      name: "Praktik Kerja Lapangan (PKL)",
      kkm: 75,
      cpA: "Menunjukkan etos kerja profesional yang sangat tinggi, disiplin waktu, inisiatif mandiri, serta terampil menyelesaikan projek desain pesanan klien industri.",
      cpB: "Mampu beradaptasi dengan baik di lingkungan divisi kreatif industri, sopan santun, dan mampu menyelesaikan tugas sesuai instruksi supervisor.",
      cpC: "Cukup aktif dalam kegiatan PKL harian. Perlu meningkatkan komunikasi dan kerja sama tim dengan pembimbing industri.",
      cpD: "Memerlukan pembinaan intensif terkait disiplin kehadiran dan etika komunikasi dengan rekan kerja industri."
    }
  });

  // 3. Seed Extracurriculars (Ekskul)
  await prisma.extracurricular.create({ data: { name: "Pramuka" } });
  await prisma.extracurricular.create({ data: { name: "PMR (Palang Merah Remaja)" } });
  await prisma.extracurricular.create({ data: { name: "Paskibra" } });
  await prisma.extracurricular.create({ data: { name: "Drum Band" } });

  // 4. Seed Teachers
  await prisma.teacher.create({
    data: {
      name: "Bapak Guru Ahmad, M.Pd.",
      nip: "19850312010",
      subjects: ["Matematika"],
      extracurriculars: ["Pramuka"],
      role: "wali-kelas",
      kelas: "XII-DKV",
      username: "guru",
      password: hashedDefaultPassword
    }
  });

  await prisma.teacher.create({
    data: {
      name: "Rina Wijayanti, S.Pd.",
      nip: "198906152014032002",
      subjects: ["Ilmu Pengetahuan Alam (IPA)"],
      extracurriculars: ["Paskibra"],
      role: "wali-kelas",
      kelas: "XI-DKV",
      username: "rina",
      password: hashedDefaultPassword
    }
  });

  await prisma.teacher.create({
    data: {
      name: "Budi Santoso, S.Pd.",
      nip: "198512122010121001",
      subjects: ["Bahasa Indonesia"],
      extracurriculars: ["Drum Band"],
      role: "wali-kelas",
      kelas: "X-DKV",
      username: "budi",
      password: hashedDefaultPassword
    }
  });

  await prisma.teacher.create({
    data: {
      name: "Siti Rahma, S.Pd.",
      nip: "19900523020",
      subjects: ["Bahasa Indonesia", "Matematika"],
      extracurriculars: ["PMR (Palang Merah Remaja)"],
      role: "guru-mapel",
      kelas: "",
      username: "sitirahma",
      password: hashedDefaultPassword
    }
  });

  // 5. Seed Student (Ahmad Fauzi is Kelas IX -> Ganjil = Semester 5)
  const student = await prisma.student.create({
    data: {
      name: "Ahmad Fauzi",
      nisn: "0098765432",
      nis: "24000",
      kelas: "XII-DKV",
      alamat: "Jl. KH. Ahmad Dahlan No. 34, Kota Demo",
      namaOrangTua: "H. Fauzi",
      tempatLahir: "Magelang",
      tanggalLahir: "2011-03-10",
      tanggalMasuk: "2024-07-15",
      semester: "Ganjil",
      tahunAjaran: "2026/2027",
      username: "siswa",
      password: hashedDefaultPassword
    }
  });

  // 6. Seed Student Grades for Semester 1 to 5
  await prisma.grade.createMany({
    data: [
      // Semester 1
      { studentNisn: student.nisn, subjectName: "Matematika", tugas1: 75, tugas2: 80, uts: 78, uas: 80, semester: "1" },
      { studentNisn: student.nisn, subjectName: "Ilmu Pengetahuan Alam (IPA)", tugas1: 78, tugas2: 76, uts: 75, uas: 78, semester: "1" },
      { studentNisn: student.nisn, subjectName: "Bahasa Indonesia", tugas1: 80, tugas2: 82, uts: 80, uas: 82, semester: "1" },
      // Semester 2
      { studentNisn: student.nisn, subjectName: "Matematika", tugas1: 78, tugas2: 82, uts: 80, uas: 82, semester: "2" },
      { studentNisn: student.nisn, subjectName: "Ilmu Pengetahuan Alam (IPA)", tugas1: 80, tugas2: 82, uts: 78, uas: 80, semester: "2" },
      { studentNisn: student.nisn, subjectName: "Bahasa Indonesia", tugas1: 82, tugas2: 84, uts: 82, uas: 85, semester: "2" },
      // Semester 3
      { studentNisn: student.nisn, subjectName: "Matematika", tugas1: 80, tugas2: 84, uts: 82, uas: 85, semester: "3" },
      { studentNisn: student.nisn, subjectName: "Ilmu Pengetahuan Alam (IPA)", tugas1: 82, tugas2: 80, uts: 82, uas: 84, semester: "3" },
      { studentNisn: student.nisn, subjectName: "Bahasa Indonesia", tugas1: 84, tugas2: 86, uts: 85, uas: 88, semester: "3" },
      // Semester 4
      { studentNisn: student.nisn, subjectName: "Matematika", tugas1: 82, tugas2: 86, uts: 85, uas: 88, semester: "4" },
      { studentNisn: student.nisn, subjectName: "Ilmu Pengetahuan Alam (IPA)", tugas1: 85, tugas2: 84, uts: 84, uas: 86, semester: "4" },
      { studentNisn: student.nisn, subjectName: "Bahasa Indonesia", tugas1: 86, tugas2: 88, uts: 88, uas: 90, semester: "4" },
      // Semester 5
      { studentNisn: student.nisn, subjectName: "Matematika", tugas1: 85, tugas2: 90, uts: 88, uas: 90, semester: "5" },
      { studentNisn: student.nisn, subjectName: "Ilmu Pengetahuan Alam (IPA)", tugas1: 88, tugas2: 84, uts: 80, uas: 85, semester: "5" },
      { studentNisn: student.nisn, subjectName: "Bahasa Indonesia", tugas1: 90, tugas2: 92, uts: 85, uas: 92, semester: "5" },
      // Semester 6
      { studentNisn: student.nisn, subjectName: "Matematika", tugas1: 88, tugas2: 92, uts: 90, uas: 92, semester: "6" },
      { studentNisn: student.nisn, subjectName: "Ilmu Pengetahuan Alam (IPA)", tugas1: 90, tugas2: 88, uts: 85, uas: 90, semester: "6" },
      { studentNisn: student.nisn, subjectName: "Bahasa Indonesia", tugas1: 92, tugas2: 94, uts: 90, uas: 94, semester: "6" }
    ]
  });

  // 7. Seed Student Extracurricular Grade for Semester 1 to 6
  await prisma.extracurricularGrade.createMany({
    data: [
      { studentNisn: student.nisn, ekskulName: "Pramuka", nilai: "B", deskripsi: "Aktif mengikuti latihan rutin Pramuka.", semester: "1" },
      { studentNisn: student.nisn, ekskulName: "Pramuka", nilai: "B", deskripsi: "Aktif dan berpartisipasi baik dalam Perkemahan Sabtu Minggu.", semester: "2" },
      { studentNisn: student.nisn, ekskulName: "Pramuka", nilai: "A", deskripsi: "Sangat aktif dan menunjukkan inisiatif memimpin kelompok dalam baris-berbaris.", semester: "3" },
      { studentNisn: student.nisn, ekskulName: "Pramuka", nilai: "A", deskripsi: "Menunjukkan kedisiplinan dan kecakapan teknik kepramukaan yang unggul.", semester: "4" },
      { studentNisn: student.nisn, ekskulName: "Pramuka", nilai: "A", deskripsi: "Sangat aktif dalam kegiatan kepramukaan dan menunjukkan jiwa kepemimpinan regu yang unggul.", semester: "5" },
      { studentNisn: student.nisn, ekskulName: "Pramuka", nilai: "A", deskripsi: "Telah menyelesaikan program kepramukaan tingkat penggalang dengan predikat sangat memuaskan.", semester: "6" }
    ]
  });

  // 8. Seed RaporRecord for Semester 1 to 6
  await prisma.raporRecord.createMany({
    data: [
      { studentNisn: student.nisn, semester: "1", catatanWali: "Pertahankan konsentrasi dan kerajinan belajar Anda.", sakit: 1, izin: 0, alfa: 0, naikKelas: null },
      { studentNisn: student.nisn, semester: "2", catatanWali: "Selamat! Pertahankan prestasi belajar Anda agar semakin baik di kelas VIII.", sakit: 0, izin: 2, alfa: 0, naikKelas: true },
      { studentNisn: student.nisn, semester: "3", catatanWali: "Fokus belajar perlu ditingkatkan di beberapa mata pelajaran agar lebih stabil.", sakit: 0, izin: 1, alfa: 1, naikKelas: null },
      { studentNisn: student.nisn, semester: "4", catatanWali: "Prestasi yang baik. Selamat, Anda dinyatakan naik ke kelas IX.", sakit: 2, izin: 0, alfa: 0, naikKelas: true },
      { studentNisn: student.nisn, semester: "5", catatanWali: "Ananda Ahmad Fauzi menunjukkan prestasi akademik yang luar biasa dan jiwa kepemimpinan yang baik dalam organisasi kelas. Terus pertahankan prestasinya!", sakit: 0, izin: 1, alfa: 0, naikKelas: null },
      { studentNisn: student.nisn, semester: "6", catatanWali: "Selamat atas kelulusan Anda! Terus kembangkan bakat dan prestasi Anda di jenjang pendidikan selanjutnya.", sakit: 0, izin: 0, alfa: 0, naikKelas: true }
    ]
  });

  // 9. Seed Math Questions
  await prisma.question.createMany({
    data: [
      {
        subject: "Matematika",
        question: "1. Himpunan penyelesaian dari persamaan kuadrat x² - 5x + 6 = 0 adalah...",
        choices: ["x = 1 atau x = 6", "x = 2 atau x = 3", "x = -2 atau x = -3", "x = 3 atau x = -2"],
        correct: 1
      },
      {
        subject: "Matematika",
        question: "2. Nilai diskriminan (D) dari persamaan kuadrat x² + 4x + 3 = 0 adalah...",
        choices: ["D = 4", "D = 16", "D = 1", "D = 0"],
        correct: 0
      },
      {
        subject: "Matematika",
        question: "3. Sumbu simetri dari grafik fungsi kuadrat y = x² - 6x + 8 adalah...",
        choices: ["x = 3", "x = -3", "x = 6", "x = 8"],
        correct: 0
      }
    ]
  });

  console.log('Database successfully seeded with extracurriculars and semester records!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


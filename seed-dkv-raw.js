const { Client } = require('pg');

const dkvSubjects = [
  {
    name: "Dasar-dasar Desain Komunikasi Visual",
    unit: "SMK",
    jurusan: "DKV",
    kkm: 75,
    cpa: "Sangat baik dalam menguasai konsep dan teori dasar DKV.",
    cpb: "Baik dalam menguasai sebagian besar konsep dasar DKV.",
    cpc: "Cukup dalam menguasai beberapa konsep dasar DKV.",
    cpd: "Kurang dalam memahami kompetensi dasar pelajaran."
  },
  {
    name: "Sketsa dan Gambar",
    unit: "SMK",
    jurusan: "DKV",
    kkm: 75,
    cpa: "Sangat baik dalam teknik menggambar manual dan proporsi.",
    cpb: "Baik dalam teknik menggambar manual dan proporsi.",
    cpc: "Cukup dalam teknik menggambar manual.",
    cpd: "Kurang dalam memahami teknik dasar menggambar."
  },
  {
    name: "Tinjauan Seni",
    unit: "SMK",
    jurusan: "DKV",
    kkm: 75,
    cpa: "Sangat baik dalam pemahaman estetika dan sejarah karya seni.",
    cpb: "Baik dalam pemahaman estetika dan sejarah karya seni.",
    cpc: "Cukup dalam pemahaman estetika dasar.",
    cpd: "Kurang dalam memahami estetika dan sejarah seni."
  },
  {
    name: "Komputer Grafis (Vektor & Bitmap)",
    unit: "SMK",
    jurusan: "DKV",
    kkm: 78,
    cpa: "Sangat mahir mengoperasikan software desain grafis.",
    cpb: "Baik dalam mengoperasikan software desain grafis.",
    cpc: "Cukup mampu mengoperasikan fungsi dasar software grafis.",
    cpd: "Kurang mampu mengoperasikan software desain grafis."
  },
  {
    name: "Fotografi Dasar & Tata Cahaya",
    unit: "SMK",
    jurusan: "DKV",
    kkm: 78,
    cpa: "Sangat mahir dalam teknik kamera dan pencahayaan.",
    cpb: "Baik dalam penguasaan teknik kamera dasar dan pencahayaan.",
    cpc: "Cukup dalam mengoperasikan kamera dan pencahayaan.",
    cpd: "Kurang memahami teknik kamera dan pencahayaan dasar."
  },
  {
    name: "Videografi & Animasi Dasar",
    unit: "SMK",
    jurusan: "DKV",
    kkm: 78,
    cpa: "Sangat baik dalam perekaman video dan pengeditan.",
    cpb: "Baik dalam perekaman video dan pengeditan.",
    cpc: "Cukup mampu merekam dan mengedit video sederhana.",
    cpd: "Kurang dalam keterampilan videografi dan animasi."
  },
  {
    name: "Desain Publikasi & Tipografi",
    unit: "SMK",
    jurusan: "DKV",
    kkm: 78,
    cpa: "Sangat terampil membuat desain publikasi cetak dan digital.",
    cpb: "Baik dalam membuat desain publikasi dan menyusun tipografi.",
    cpc: "Cukup mampu membuat desain publikasi sederhana.",
    cpd: "Kurang mampu membuat karya publikasi yang fungsional."
  },
  {
    name: "Produk Kreatif dan Kewirausahaan (PKK)",
    unit: "SMK",
    jurusan: "DKV",
    kkm: 75,
    cpa: "Sangat baik dalam merancang dan memasarkan produk kreatif.",
    cpb: "Baik dalam merancang produk kreatif bernilai jual.",
    cpc: "Cukup mampu merancang produk kreatif dasar.",
    cpd: "Kurang mampu mengaplikasikan konsep kewirausahaan."
  }
];

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || "postgresql://neondb_owner:npg_5YH3cVuFWSMi@ep-spring-tree-at60vadx-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log("Connected to DB");

    for (const sub of dkvSubjects) {
      // Upsert
      await client.query(`
        INSERT INTO "smk_Subject" (id, name, unit, jurusan, kkm, "cpA", "cpB", "cpC", "cpD")
        VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (name) DO UPDATE SET
          unit = $2, jurusan = $3, kkm = $4, "cpA" = $5, "cpB" = $6, "cpC" = $7, "cpD" = $8
      `, [sub.name, sub.unit, sub.jurusan, sub.kkm, sub.cpa, sub.cpb, sub.cpc, sub.cpd]);
      console.log("Inserted:", sub.name);
    }
  } catch (err) {
    console.error("DB Error:", err);
  } finally {
    await client.end();
  }
}

main();

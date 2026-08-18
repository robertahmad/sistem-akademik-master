const { Client } = require('pg');

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || "postgresql://neondb_owner:npg_5YH3cVuFWSMi@ep-spring-tree-at60vadx-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log("Connected to DB");
    
    // Update DKV subjects to Kelompok C and Kelas X (as typical examples, or Semua)
    const res = await client.query(`
      UPDATE "smk_Subject" 
      SET kelompok = 'C', untuk_kelas = 'Semua', untuk_semester = 'Semua' 
      WHERE jurusan = 'DKV'
    `);
    
    console.log(`Updated ${res.rowCount} DKV subjects to Kelompok C.`);
  } catch (err) {
    console.error("DB Error:", err);
  } finally {
    await client.end();
  }
}

main();

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_5YH3cVuFWSMi@ep-spring-tree-at60vadx.c-9.us-east-1.aws.neon.tech/master_demo?sslmode=require'
});

async function run() {
  try {
    const res = await pool.query('SELECT jurusan FROM "smk_Student" LIMIT 1');
    console.log("jurusan column exists!");
  } catch (err) {
    console.error("ERROR checking jurusan column:", err.message);
  } finally {
    await pool.end();
  }
}

run();

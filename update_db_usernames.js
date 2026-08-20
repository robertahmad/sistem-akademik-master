const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_5YH3cVuFWSMi@ep-spring-tree-at60vadx.c-9.us-east-1.aws.neon.tech/master_demo?sslmode=require'
});

async function run() {
  try {
    const res = await pool.query('UPDATE "smk_Student" SET username = nisn WHERE username = \'siswa_\' || nisn');
    console.log(`Updated ${res.rowCount} students to use their NISN as username.`);
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

run();

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_5YH3cVuFWSMi@ep-spring-tree-at60vadx.c-9.us-east-1.aws.neon.tech/master_demo?sslmode=require'
});

async function run() {
  try {
    const res = await pool.query('SELECT name, nisn, username FROM "smk_Student" ORDER BY id DESC LIMIT 10');
    console.log("Latest 10 students:");
    console.table(res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

run();

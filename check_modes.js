const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_5YH3cVuFWSMi@ep-spring-tree-at60vadx.c-9.us-east-1.aws.neon.tech/master_demo?sslmode=require'
});

async function run() {
  try {
    const res = await pool.query('SELECT "utsMode", "uasMode", "pajMode" FROM "smk_School" LIMIT 1');
    console.log(res.rows[0]);
  } catch (err) {
    console.error(err.message);
  } finally {
    await pool.end();
  }
}

run();

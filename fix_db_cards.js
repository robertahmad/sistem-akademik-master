const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_5YH3cVuFWSMi@ep-spring-tree-at60vadx.c-9.us-east-1.aws.neon.tech/master_demo?sslmode=require'
});

async function run() {
  try {
    const res = await pool.query('SELECT id, nisn, nis FROM "smk_Student"');
    let count = 0;
    for (const row of res.rows) {
      if (row.nisn && row.nisn.length > 5) {
        const username = "siswa_" + row.nisn;
        const passwordHash = bcrypt.hashSync(row.nis, 10);
        await pool.query('UPDATE "smk_Student" SET username = $1, password = $2 WHERE id = $3', [username, passwordHash, row.id]);
        count++;
      }
    }
    console.log(`Updated ${count} students in DB to exactly match the cards.`);
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

run();

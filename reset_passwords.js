const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_5YH3cVuFWSMi@ep-spring-tree-at60vadx.c-9.us-east-1.aws.neon.tech/master_demo?sslmode=require'
});

async function run() {
  try {
    const hashed = bcrypt.hashSync('123', 10);
    // update all 25 students that were uploaded recently (where length of password is maybe something else, or just update all of them since it's a demo)
    // To be safe, I'll update all students where username = nisn
    const res = await pool.query('UPDATE "smk_Student" SET password = $1 WHERE username = nisn', [hashed]);
    console.log(`Updated passwords for ${res.rowCount} students to '123'.`);
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

run();

const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_5YH3cVuFWSMi@ep-spring-tree-at60vadx.c-9.us-east-1.aws.neon.tech/master_demo?sslmode=require'
});

async function run() {
  try {
    const res = await pool.query('SELECT name, nisn, nis, username, password FROM "smk_Student" WHERE nisn = $1', ['0093183499']);
    if (res.rows.length === 0) {
      console.log("Student with NISN 0093183499 NOT FOUND!");
    } else {
      const student = res.rows[0];
      console.log(`Name: ${student.name}`);
      console.log(`NISN: ${student.nisn}`);
      console.log(`NIS: ${student.nis}`);
      console.log(`Username: ${student.username}`);
      const isPasswordMatch = bcrypt.compareSync('180992', student.password);
      console.log(`Password matches '180992': ${isPasswordMatch}`);
    }
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

run();

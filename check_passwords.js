const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_5YH3cVuFWSMi@ep-spring-tree-at60vadx.c-9.us-east-1.aws.neon.tech/master_demo?sslmode=require'
});

async function run() {
  try {
    const res = await pool.query('SELECT name, nisn, username, password FROM "smk_Student" ORDER BY id DESC LIMIT 5');
    console.log("Latest 5 students passwords:");
    for (const row of res.rows) {
      console.log(`Name: ${row.name}, Username: ${row.username}, Hash: ${row.password.substring(0, 15)}...`);
      // check if it matches 123
      const is123 = bcrypt.compareSync('123', row.password);
      const isNIS = bcrypt.compareSync(row.nisn, row.password); 
      // wait, nisn is not nis. 
      console.log(`  Matches '123'? ${is123}`);
    }
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

run();

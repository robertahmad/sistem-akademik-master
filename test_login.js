const { loginAction } = require('./app/actions/auth');

async function testLogin() {
  const res = await loginAction("siswa", "0095648234", "123");
  console.log(res);
}

testLogin();

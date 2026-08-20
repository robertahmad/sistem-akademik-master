import { getStudentDashboardData } from './app/actions/siswa.js';
import { setSession } from './lib/auth.js';

async function test() {
  await setSession({
    id: 1, // dummy
    name: "Afdul Rozaq",
    role: "siswa",
    kelas: "XII DKV",
    username: "siswa_0093183499",
    nisn: "0093183499"
  });
  try {
    const data = await getStudentDashboardData();
    console.log("Success:", data.success);
    if (!data.success) console.log("Error:", data.error);
  } catch (err) {
    console.error("Crash:", err);
  }
}

test();

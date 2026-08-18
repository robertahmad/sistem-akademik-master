import { loginAction } from './app/actions/auth.js';

async function test() {
  console.log("Testing guru-mapel...");
  try {
    const res = await loginAction("guru-mapel", "makmun", "123");
    console.log("Result:", res);
  } catch (e) {
    console.error("Caught error:", e);
  }
}
test();

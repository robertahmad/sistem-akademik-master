import { loginAction } from "../../actions/auth";
import { getExamQuestions } from "../../actions/siswa";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const login = await loginAction("siswa", "siswa_0093183499", "180992");
    if (!login.success) return NextResponse.json({ step: "login", error: login.error });
    
    const exam = await getExamQuestions("Bahasa Indonesia", "UTS", "5");
    return NextResponse.json({ success: exam.success, error: exam.error, length: exam.questions ? exam.questions.length : 0 });
  } catch (error) {
    return NextResponse.json({ error: error.message });
  }
}

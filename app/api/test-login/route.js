import { loginAction } from "../../actions/auth";
import { getStudentDashboardData } from "../../actions/siswa";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const login = await loginAction("siswa", "siswa_0093183499", "180992");
    if (!login.success) {
      return NextResponse.json({ step: "login", error: login.error });
    }
    
    const dash = await getStudentDashboardData();
    if (!dash.success) {
      return NextResponse.json({ step: "dashboard", error: dash.error });
    }
    
    return NextResponse.json({ success: true, name: dash.student.name });
  } catch (error) {
    return NextResponse.json({ error: error.message });
  }
}

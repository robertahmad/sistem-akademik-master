import { submitAssignment } from '@/app/actions/assignment';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const data = await request.json();
    const res = await submitAssignment(data);
    
    if (res.success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ success: false, error: res.error }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

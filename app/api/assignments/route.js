import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const teacherId = searchParams.get('teacherId');
  const subjectName = searchParams.get('subjectName');
  
  try {
    const whereClause = {};
    if (teacherId) whereClause.teacherId = teacherId;
    if (subjectName) whereClause.subjectName = subjectName;

    const assignments = await prisma.assignment.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        submissions: {
          include: { student: true }
        },
        groups: true
      }
    });

    return NextResponse.json(assignments);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

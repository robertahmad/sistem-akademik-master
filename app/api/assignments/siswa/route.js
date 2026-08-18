import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const kelas = searchParams.get('kelas');
  const subjectName = searchParams.get('subjectName');
  const studentNisn = searchParams.get('studentNisn');
  
  try {
    const whereClause = {
      subjectName: subjectName || undefined,
      OR: [
        { kelas: "Semua Kelas" },
        { kelas: kelas || undefined }
      ]
    };

    const assignments = await prisma.assignment.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        submissions: {
          where: { studentNisn: studentNisn }
        },
        groups: {
          where: { members: { some: { studentNisn: studentNisn } } },
          include: { members: true }
        }
      }
    });

    return NextResponse.json(assignments);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

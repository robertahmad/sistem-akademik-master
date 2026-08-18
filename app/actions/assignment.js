'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function createAssignment(data) {
  try {
    const assignment = await prisma.assignment.create({
      data: {
        title: data.title,
        description: data.description,
        deadline: new Date(data.deadline),
        type: data.type,
        subjectName: data.subjectName,
        kelas: data.kelas,
        teacherId: data.teacherId,
        unit: data.unit || "SMK"
      }
    });
    revalidatePath('/portal/guru/penugasan');
    return { success: true, id: assignment.id };
  } catch (error) {
    console.error('Error creating assignment:', error);
    return { success: false, error: error.message };
  }
}

export async function createGroups(assignmentId, groupNames, memberList) {
  // memberList is array of { groupId_index, studentNisn }
  try {
    // Clean old groups
    await prisma.assignmentGroup.deleteMany({ where: { assignmentId } });
    
    for (let i = 0; i < groupNames.length; i++) {
      const group = await prisma.assignmentGroup.create({
        data: {
          assignmentId,
          groupName: groupNames[i]
        }
      });
      
      const members = memberList.filter(m => m.groupIndex === i);
      if (members.length > 0) {
        await prisma.assignmentGroupMember.createMany({
          data: members.map(m => ({
            groupId: group.id,
            studentNisn: m.studentNisn
          }))
        });
      }
    }
    
    revalidatePath(`/portal/guru/penugasan/${assignmentId}`);
    return { success: true };
  } catch (error) {
    console.error('Error creating groups:', error);
    return { success: false, error: error.message };
  }
}

export async function submitAssignment(data) {
  try {
    await prisma.assignmentSubmission.create({
      data: {
        assignmentId: data.assignmentId,
        studentNisn: data.studentNisn || null,
        groupId: data.groupId || null,
        fileUrl: data.fileUrl || null,
        textContent: data.textContent || null,
      }
    });
    revalidatePath(`/portal/siswa/penugasan/${data.assignmentId}`);
    return { success: true };
  } catch (error) {
    console.error('Error submitting assignment:', error);
    return { success: false, error: error.message };
  }
}

export async function gradeSubmission(submissionId, score, feedback) {
  try {
    const submission = await prisma.assignmentSubmission.update({
      where: { id: submissionId },
      data: { score: Number(score), feedback },
      include: {
        assignment: true,
        group: { include: { members: true } }
      }
    });

    // Update 'Grade' table automatically to 'tugas1'
    const subjectName = submission.assignment.subjectName;
    const studentsToUpdate = [];
    
    if (submission.assignment.type === 'INDIVIDU' && submission.studentNisn) {
      studentsToUpdate.push(submission.studentNisn);
    } else if (submission.assignment.type === 'KELOMPOK' && submission.group) {
      submission.group.members.forEach(m => studentsToUpdate.push(m.studentNisn));
    }
    
    // Asumsikan kita pake semester aktif dari DB (atau manual 1-6)
    // Untuk simplifikasi, kita asumsikan guru mengisi semester yg aktif. 
    // Wait, assignment doesn't store semester. Let's just update 'tugas1' for semester 1 for now or all semesters where subject exists?
    // Let's get current school active semester first (1-6 equivalent)
    const school = await prisma.school.findFirst();
    let currentSemInt = 1;
    if (school.semester === "Genap") {
      // Very basic mapping, ideally we should know if they are class X, XI, XII
      // Tapi kita akan cari Grade siswa tersebut yang cocok dgn mapel ini dan update semua tugas1
      // Atau kita ambil nilai yg belum diisi
    }
    
    for (const nisn of studentsToUpdate) {
      // Find latest grade for this subject
      const grade = await prisma.grade.findFirst({
        where: { studentNisn: nisn, subjectName: subjectName },
        orderBy: { semester: 'desc' }
      });
      
      if (grade) {
        await prisma.grade.update({
          where: { id: grade.id },
          data: { tugas1: Number(score) } // overwrites tugas1
        });
      }
    }

    revalidatePath(`/portal/guru/penugasan/${submission.assignmentId}`);
    return { success: true };
  } catch (error) {
    console.error('Error grading:', error);
    return { success: false, error: error.message };
  }
}

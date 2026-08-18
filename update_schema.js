const fs = require('fs');
let content = fs.readFileSync('prisma/schema.prisma', 'utf8');

// Add to Teacher model if not already added
if (!content.includes('assignments      Assignment[]')) {
  content = content.replace('payrollRecords   PayrollRecord[]', 'payrollRecords   PayrollRecord[]\n  assignments      Assignment[]');
}

// Add to Student model if not already added
if (!content.includes('assignmentGroupMembers AssignmentGroupMember[]')) {
  content = content.replace('bookLoans             BookLoan[]', 'bookLoans             BookLoan[]\n  assignmentGroupMembers AssignmentGroupMember[]\n  assignmentSubmissions AssignmentSubmission[]');
}

// Append new models if not already appended
if (!content.includes('model Assignment {')) {
  const newModels = `
model Assignment {
  @@map("smk_Assignment")
  id          String   @id @default(uuid())
  title       String
  description String   @db.Text
  deadline    DateTime
  type        String   @default("INDIVIDU") // INDIVIDU, KELOMPOK
  subjectName String
  kelas       String   @default("") // e.g. "X TKJ 1", "Semua Kelas"
  unit        String   @default("SMK")
  teacherId   String
  teacher     Teacher  @relation(fields: [teacherId], references: [id], onDelete: Cascade)
  createdAt   DateTime @default(now())

  submissions AssignmentSubmission[]
  groups      AssignmentGroup[]
}

model AssignmentGroup {
  @@map("smk_AssignmentGroup")
  id           String   @id @default(uuid())
  assignmentId String
  assignment   Assignment @relation(fields: [assignmentId], references: [id], onDelete: Cascade)
  groupName    String   // e.g. "Kelompok 1"
  
  members      AssignmentGroupMember[]
  submissions  AssignmentSubmission[]
}

model AssignmentGroupMember {
  @@map("smk_AssignmentGroupMember")
  id           String   @id @default(uuid())
  groupId      String
  group        AssignmentGroup @relation(fields: [groupId], references: [id], onDelete: Cascade)
  studentNisn  String
  student      Student  @relation(fields: [studentNisn], references: [nisn], onDelete: Cascade)
  
  @@unique([groupId, studentNisn])
}

model AssignmentSubmission {
  @@map("smk_AssignmentSubmission")
  id           String   @id @default(uuid())
  assignmentId String
  assignment   Assignment @relation(fields: [assignmentId], references: [id], onDelete: Cascade)
  
  studentNisn  String?  
  student      Student? @relation(fields: [studentNisn], references: [nisn], onDelete: Cascade)
  
  groupId      String?
  group        AssignmentGroup? @relation(fields: [groupId], references: [id], onDelete: Cascade)

  fileUrl      String?  @db.Text
  textContent  String?  @db.Text
  score        Int?
  feedback     String?  @db.Text
  submittedAt  DateTime @default(now())
}
`;
  content += newModels;
}

fs.writeFileSync('prisma/schema.prisma', content, 'utf8');
console.log('Schema updated successfully');

const fs = require('fs');

// --- 1. Modify app/portal/admin/page.js ---
let pagePath = 'C:/Users/USER/.gemini/antigravity/scratch/sistem-akademik-master/app/portal/admin/page.js';
let pageContent = fs.readFileSync(pagePath, 'utf8');

// A. Update headers & sample data in unduhTemplateExcel
pageContent = pageContent.replace(
  /const headers = \[\s*\["Nama Lengkap", "NIS", "NISN", "Jenis Kelamin", "Tempat Lahir", "Tanggal Lahir \(YYYY-MM-DD\)", "Nama Orang Tua \/ Wali", "Nama Ayah", "Nama Ibu", "Pekerjaan Ayah", "Pekerjaan Ibu", "Asal Sekolah", "Tanggal Masuk Sekolah \(YYYY-MM-DD\)", "Kelas", "Alamat Siswa", "Username Login", "Password"\]\s*\];/,
  `const headers = [\n      ["Nama Lengkap", "NIS", "NISN", "Jenis Kelamin", "Tempat Lahir", "Tanggal Lahir (YYYY-MM-DD)", "Nama Orang Tua / Wali", "Nama Ayah", "Nama Ibu", "Pekerjaan Ayah", "Pekerjaan Ibu", "Asal Sekolah", "Tanggal Masuk Sekolah (YYYY-MM-DD)", "Kelas", "Jurusan", "Alamat Siswa", "Username Login", "Password"]\n    ];`
);

pageContent = pageContent.replace(
  /const sampleData = \[\s*\["Rani Wijaya", "24001", "0081234567", "Perempuan", "Magelang", "2011-05-12", "Slamet Wijaya", "Slamet Wijaya", "Sumarni", "Wiraswasta", "Ibu Rumah Tangga", "SD N 1 Kota Demo", "2024-07-15", "X DKV", "Dusun Ngablak RT 02", "rani", "123"\],\s*\["Diki Hermawan", "24002", "0087654321", "Laki-laki", "Magelang", "2011-08-20", "Budi Hermawan", "Budi Hermawan", "Siti Aminah", "Petani", "Petani", "MI Master Demo", "2024-07-15", "XI DKV", "Dusun Ngabean RT 03", "diki", "123"\]\s*\];/,
  `const sampleData = [\n      ["Rani Wijaya", "24001", "0081234567", "Perempuan", "Magelang", "2011-05-12", "Slamet Wijaya", "Slamet Wijaya", "Sumarni", "Wiraswasta", "Ibu Rumah Tangga", "SD N 1 Kota Demo", "2024-07-15", "X DKV", "Desain Komunikasi Visual", "Dusun Ngablak RT 02", "rani", "123"],\n      ["Diki Hermawan", "24002", "0087654321", "Laki-laki", "Magelang", "2011-08-20", "Budi Hermawan", "Budi Hermawan", "Siti Aminah", "Petani", "Petani", "MI Master Demo", "2024-07-15", "XI DKV", "Desain Komunikasi Visual", "Dusun Ngabean RT 03", "diki", "123"]\n    ];`
);

// B. Make filename dynamic
pageContent = pageContent.replace(
  /XLSX\.writeFile\(wb, "template_siswa_smk_alqodiriyah\.xlsx"\);/,
  `XLSX.writeFile(wb, \`template_siswa_\${school?.nama ? school.nama.replace(/\\s+/g, '_').toLowerCase() : 'demo'}.xlsx\`);`
);

// C. Update parsing logic in handleExcelImport
pageContent = pageContent.replace(
  /const kelas = String\(getValueByHeader\(\["Kelas", "Tingkat Kelas"\]\)\)\.trim\(\) \|\| "X DKV";\s*const alamat = String\(getValueByHeader\(\["Alamat Siswa", "Alamat"\]\)\)\.trim\(\);/,
  `const kelas = String(getValueByHeader(["Kelas", "Tingkat Kelas"])).trim() || "X DKV";\n          const jurusan = String(getValueByHeader(["Jurusan", "Program Keahlian"])).trim();\n          const alamat = String(getValueByHeader(["Alamat Siswa", "Alamat"])).trim();`
);

pageContent = pageContent.replace(
  /kelas,\s*alamat,\s*username,\s*password/s,
  `kelas,\n            jurusan,\n            alamat,\n            username,\n            password`
);

fs.writeFileSync(pagePath, pageContent);
console.log('Updated app/portal/admin/page.js successfully.');

// --- 2. Modify app/actions/admin.js ---
let actionPath = 'C:/Users/USER/.gemini/antigravity/scratch/sistem-akademik-master/app/actions/admin.js';
let actionContent = fs.readFileSync(actionPath, 'utf8');

actionContent = actionContent.replace(
  /kelas: studentData\.kelas \|\| "",\s*alamat: studentData\.alamat \|\| "",/s,
  `kelas: studentData.kelas || "",\n          jurusan: studentData.jurusan || "",\n          alamat: studentData.alamat || "",`
);

fs.writeFileSync(actionPath, actionContent);
console.log('Updated app/actions/admin.js successfully.');

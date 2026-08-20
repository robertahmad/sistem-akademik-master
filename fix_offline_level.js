const fs = require('fs');
let path = 'C:/Users/USER/.gemini/antigravity/scratch/sistem-akademik-master/app/actions/siswa.js';
let content = fs.readFileSync(path, 'utf8');

// 1. Fix checkIsOffline function
const newCheckIsOffline = `
function checkIsOffline(modeString, studentKelas, defaultMode) {
  if (!modeString) return defaultMode === "offline";
  try {
    const parsed = JSON.parse(modeString);
    const normalizedKelas = (studentKelas || "").trim().toLowerCase();
    
    // Sort keys by length descending so "XII" is checked before "XI" and "X"
    const keys = Object.keys(parsed).sort((a, b) => b.length - a.length);
    for (const key of keys) {
      // Use word boundary to ensure we match exactly "X", "XI", "XII"
      const regex = new RegExp('\\\\b' + key.toLowerCase() + '\\\\b');
      if (regex.test(normalizedKelas)) {
        return parsed[key] === "offline";
      }
    }
    
    if (parsed["GLOBAL"]) return parsed["GLOBAL"] === "offline";
  } catch (e) {
    return modeString.toLowerCase() === "offline";
  }
  return defaultMode === "offline";
}
`;

content = content.replace(/function checkIsOffline[\s\S]*?return defaultMode === "offline";\n}/, newCheckIsOffline.trim());


// 2. Fix level parsing in getStudentDashboardData
const oldLevelLogic = `    const normKelas = (student.kelas || "").trim().toLowerCase();
    let level = 7;
    if (normKelas.startsWith("viii") || normKelas.includes("kelas xi") || normKelas.includes("kelas 8") || normKelas.startsWith("8")) {
      level = 8;
    } else if (normKelas.startsWith("ix") || normKelas.includes("kelas xii") || normKelas.includes("kelas 9") || normKelas.startsWith("9")) {
      level = 9;
    }`;

const newLevelLogic = `    const normKelas = (student.kelas || "").trim().toLowerCase();
    let level = 7; // X (SMK) / VII (SMP)
    if (
      normKelas.startsWith("viii") || 
      normKelas.includes("kelas xi") || 
      normKelas.includes("kelas 8") || 
      normKelas.startsWith("8") || 
      /\\bxi\\b/.test(normKelas)
    ) {
      level = 8; // XI (SMK) / VIII (SMP)
    } else if (
      normKelas.startsWith("ix") || 
      normKelas.includes("kelas xii") || 
      normKelas.includes("kelas 9") || 
      normKelas.startsWith("9") || 
      /\\bxii\\b/.test(normKelas)
    ) {
      level = 9; // XII (SMK) / IX (SMP)
    }`;

content = content.replace(oldLevelLogic, newLevelLogic);

fs.writeFileSync(path, content);
console.log('Fixed checkIsOffline logic and level parsing logic.');

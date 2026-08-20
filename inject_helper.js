const fs = require('fs');
let path = 'C:/Users/USER/.gemini/antigravity/scratch/sistem-akademik-master/app/actions/siswa.js';
let content = fs.readFileSync(path, 'utf8');

const functionDef = `
function checkIsOffline(modeString, studentKelas, defaultMode) {
  if (!modeString) return defaultMode === "offline";
  try {
    const parsed = JSON.parse(modeString);
    const normalizedKelas = (studentKelas || "").trim().toLowerCase();
    
    // Cari mapping kelas yang cocok (misal: "X", "XI", "XII" atau "X DKV")
    for (const key in parsed) {
      if (normalizedKelas.includes(key.toLowerCase())) {
        return parsed[key] === "offline";
      }
    }
    
    if (parsed["GLOBAL"]) return parsed["GLOBAL"] === "offline";
  } catch (e) {
    // Jika bukan JSON, cek string langsung
    return modeString.toLowerCase() === "offline";
  }
  return defaultMode === "offline";
}
`;

// Insert after imports
content = content.replace(/(import .*;\n)+/, "$&\n" + functionDef + "\n");

fs.writeFileSync(path, content);
console.log('Added checkIsOffline to app/actions/siswa.js');

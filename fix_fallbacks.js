const fs = require('fs');
let pagePath = 'C:/Users/USER/.gemini/antigravity/scratch/sistem-akademik-master/app/portal/admin/page.js';
let content = fs.readFileSync(pagePath, 'utf8');

// 1. Revert username fallback
content = content.replace(
  `username = nisn ? nisn : "siswa_" + Math.random().toString(36).substring(2, 7);`,
  `username = "siswa_" + (nisn || Math.random().toString(36).substring(2, 7));`
);

// 2. Fix password fallback from "123" to nis
content = content.replace(
  /if \(\!password\) \{\s*password = "123";\s*\}/s,
  `if (!password) {\n            password = nis || "123";\n          }`
);

fs.writeFileSync(pagePath, content);
console.log('Fixed default fallback logic in app/portal/admin/page.js');

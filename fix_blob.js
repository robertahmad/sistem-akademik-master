const fs = require('fs');
const p = 'C:/Users/USER/.gemini/antigravity/scratch/sistem-akademik-master/app/actions/admin.js';
let c = fs.readFileSync(p, 'utf8');

if (!c.includes('import { put } from "@vercel/blob"')) {
  c = c.replace('"use server";', '"use server";\nimport { put } from "@vercel/blob";');
}

c = c.replace(/const\s*\{\s*put\s*\}\s*=\s*require\('@vercel\/blob'\);\s*/g, '');

fs.writeFileSync(p, c);
console.log('Fixed @vercel/blob import');

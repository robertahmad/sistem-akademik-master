const fs = require('fs');
const p = 'C:/Users/USER/.gemini/antigravity/scratch/sistem-akademik-master/prisma/schema.prisma';
let c = fs.readFileSync(p, 'utf8');

c = c.replace(/\n\nmodel Major \{\n  @@map\("smk_Major"\)\n  id   String @id @default\(uuid\(\)\)\n  code String @unique\n  name String\n\}\n/g, '');

fs.writeFileSync(p, c);
console.log('Duplicate removed');

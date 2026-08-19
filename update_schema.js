const fs = require('fs');
const p = 'C:/Users/USER/.gemini/antigravity/scratch/sistem-akademik-master/prisma/schema.prisma';
let c = fs.readFileSync(p, 'utf8');

c = c.replace(/galeriImages\s+String\s+@default\("\/hero_school\.jpg;\/facility_computer\.jpg;\/extracurricular_scout\.jpg;\/news_silat\.jpg;\/news_ramadhan\.jpg;\/principal_headmaster\.jpg"\)/, 
  'galeriImages    String   @default("/hero_school.jpg;/facility_computer.jpg;/extracurricular_scout.jpg;/news_silat.jpg;/news_ramadhan.jpg;/principal_headmaster.jpg")\n  profilImage     String?  @default("")\n  akademikImage   String?  @default("")');

c += '\n\nmodel Major {\n  @@map("smk_Major")\n  id   String @id @default(uuid())\n  code String @unique\n  name String\n}\n';

fs.writeFileSync(p, c);
console.log('Schema updated successfully');

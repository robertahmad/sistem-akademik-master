const fs = require('fs');
let schema = fs.readFileSync('prisma/schema.prisma', 'utf8');
if (!schema.includes('isKaprodiDkv')) {
  schema = schema.replace('isWakaKesiswaan  Boolean  @default(false)', 'isWakaKesiswaan  Boolean  @default(false)\n  isKaprodiDkv     Boolean  @default(false)');
  fs.writeFileSync('prisma/schema.prisma', schema);
  console.log('Schema updated');
}

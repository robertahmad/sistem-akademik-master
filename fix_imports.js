const fs = require('fs');
let guru = fs.readFileSync('app/portal/guru/page.js', 'utf8');
if(!guru.includes('import PenugasanTab')) {
  guru = guru.replace('import Link from "next/link";', 'import Link from "next/link";\nimport PenugasanTab from "./PenugasanTab";');
  fs.writeFileSync('app/portal/guru/page.js', guru);
}

let siswa = fs.readFileSync('app/portal/siswa/page.js', 'utf8');
if(!siswa.includes('import SiswaPenugasanTab')) {
  siswa = siswa.replace('import Link from "next/link";', 'import Link from "next/link";\nimport SiswaPenugasanTab from "./SiswaPenugasanTab";');
  fs.writeFileSync('app/portal/siswa/page.js', siswa);
}
console.log('Imports fixed!');

const fs = require('fs');
const p = 'C:/Users/USER/.gemini/antigravity/scratch/sistem-akademik-master/app/portal/admin/page.js';
let c = fs.readFileSync(p, 'utf8');

const sIdx = c.indexOf('const [teachers, setTeachers] = useState([]);');
if(sIdx > -1) {
  const injection = "  const [majors, setMajors] = useState([]);\n  const [newMajor, setNewMajor] = useState({ code: '', name: '' });\n";
  c = c.substring(0, sIdx) + injection + c.substring(sIdx);
  fs.writeFileSync(p, c);
  console.log('Injected majors state successfully');
} else {
  console.log('teachers state not found');
}

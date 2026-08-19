const fs = require('fs');
const p = 'C:/Users/USER/.gemini/antigravity/scratch/sistem-akademik-master/app/portal/admin/page.js';
let c = fs.readFileSync(p, 'utf8');

const sIdx = c.indexOf('<label className="form-label">Kelas / Tingkat Siswa *</label>');
if(sIdx > -1) {
  const injection = `
  <div className="form-group" style={{marginTop: "1rem"}}>
    <label className="form-label">Jurusan / Program</label>
    <select className="form-select" value={newSiswa.jurusan || ''} onChange={e => setNewSiswa({...newSiswa, jurusan: e.target.value})}>
      <option value="">-- Umum / Tanpa Jurusan --</option>
      {majors.map(m => <option key={m.id} value={m.code}>{m.code} - {m.name}</option>)}
    </select>
  </div>
  `;
  c = c.substring(0, sIdx) + injection + c.substring(sIdx);
  fs.writeFileSync(p, c);
  console.log('Jurusan added to Siswa modal');
} else {
  console.log('Siswa modal label not found');
}

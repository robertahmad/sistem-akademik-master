const fs = require('fs');
const p = 'C:/Users/USER/.gemini/antigravity/scratch/sistem-akademik-master/app/portal/admin/page.js';
let c = fs.readFileSync(p, 'utf8');

// 1. Add imports
c = c.replace(/import\s*\{\s*getAdminDashboard,/s, "import { getAdminDashboard, saveMajor, deleteMajor, updateSchoolPublicContent, uploadPublicPhoto,");

// 2. Add state
c = c.replace(/const\s*\[school,\s*setSchool\]\s*=\s*useState\(null\);/, "const [school, setSchool] = useState(null);\n  const [majors, setMajors] = useState([]);\n  const [newMajor, setNewMajor] = useState({ code: '', name: '' });");

// 3. Set majors in fetchDashboard
c = c.replace(/setExtracurriculars\(res\.extracurriculars\s*\|\|\s*\[\]\);/s, "setExtracurriculars(res.extracurriculars || []);\n        setMajors(res.majors || []);");

// 4. Add Tab Button
c = c.replace(/<button\s*className=\{\`sidebar-btn\s*\$\{\s*activeTab\s*===\s*"mapel"\s*\?\s*"active"\s*:\s*""\s*\}\`\}\s*onClick=\{\(\)\s*=>\s*\{\s*setActiveTab\("mapel"\);\s*setMapelMessage\(""\);\s*\}\}\s*>/, 
`<button className={\`sidebar-btn \${activeTab === "jurusan" ? "active" : ""}\`} onClick={() => setActiveTab("jurusan")}>
  <svg className="tab-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
  </svg>
  Jurusan / Program
</button>
<button className={\`sidebar-btn \${activeTab === "mapel" ? "active" : ""}\`} onClick={() => { setActiveTab("mapel"); setMapelMessage(""); }}>`);

// 5. Add Tab UI for Jurusan
const jurusanTabUI = `
{activeTab === "jurusan" && (
  <div>
    <span style={{ fontSize: "0.85rem", textTransform: "uppercase", fontWeight: 700, color: "var(--secondary)" }}>Akademik</span>
    <h2 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--primary-dark)", marginBottom: "1.5rem" }}>Manajemen Jurusan</h2>
    <div style={{ background: "#fff", borderRadius: "8px", padding: "1.5rem", border: "1px solid #e2e8f0", marginBottom: "2rem" }}>
      <h4>Tambah Jurusan Baru</h4>
      <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
        <input type="text" className="form-input" placeholder="Kode (Misal: DKV)" value={newMajor.code} onChange={e => setNewMajor({...newMajor, code: e.target.value})} />
        <input type="text" className="form-input" placeholder="Nama Jurusan" value={newMajor.name} onChange={e => setNewMajor({...newMajor, name: e.target.value})} />
        <button className="btn btn-primary" onClick={async () => {
          if (!newMajor.code || !newMajor.name) return alert('Isi lengkap');
          const r = await saveMajor(newMajor);
          if (r.success) { alert('Tersimpan'); setNewMajor({code:'', name:''}); fetchDashboard(); }
          else alert(r.error);
        }}>Simpan Jurusan</button>
      </div>
    </div>
    <div style={{ background: "#fff", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
      <table className="table" style={{ width: "100%" }}>
        <thead><tr><th>Kode</th><th>Nama Jurusan</th><th>Aksi</th></tr></thead>
        <tbody>
          {majors.map(m => (
            <tr key={m.id}>
              <td>{m.code}</td>
              <td>{m.name}</td>
              <td>
                <button className="btn btn-outline" style={{borderColor: "red", color: "red", padding: "0.2rem 0.5rem"}} onClick={async () => {
                  if(confirm('Hapus?')) {
                    await deleteMajor(m.id);
                    fetchDashboard();
                  }
                }}>Hapus</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
)}
`;
c = c.replace(/\{activeTab === "mapel" && \(/, jurusanTabUI + '\n{activeTab === "mapel" && (');

fs.writeFileSync(p, c);
console.log('Jurusan UI injected');

const fs = require('fs');
const path = require('path');

const filePath = path.join('C:', 'Users', 'USER', '.gemini', 'antigravity', 'scratch', 'smk-al-qodiriyah-windusari-next', 'app', 'portal', 'guru', 'PklTab.js');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Update export default function PklTab({ session, isAdmin, adminStudents, adminTeachers })
content = content.replace(/export default function PklTab\(\{ session \}\) \{/g, 'export default function PklTab({ session, isAdmin, adminStudents, adminTeachers }) {');

// 2. Add state for placementForm
content = content.replace(/const \[dudiForm, setDudiForm\] = useState\(\{ name: "", address: "", field: "", leaderName: "", mentorName: "", quota: 0 \}\);/g, 'const [dudiForm, setDudiForm] = useState({ name: "", address: "", field: "", leaderName: "", mentorName: "", quota: 0 });\n  const [placementForm, setPlacementForm] = useState({ studentNisn: "", dudiId: "", teacherUsername: "", startDate: "", endDate: "" });');

// 3. Add handleSavePlacement
const savePlacementFunc = `
  const handleSavePlacement = async (e) => {
    e.preventDefault();
    setLoading(true);
    await savePlacement(placementForm.studentNisn, placementForm.dudiId, placementForm.teacherUsername, placementForm.startDate, placementForm.endDate);
    setPlacementForm({ studentNisn: "", dudiId: "", teacherUsername: "", startDate: "", endDate: "" });
    fetchData();
  };
`;
content = content.replace(/const handleDeleteDudi = async \(id\) => \{/g, savePlacementFunc + '\n  const handleDeleteDudi = async (id) => {');

// 4. Update the warning box logic
content = content.replace(/<div style=\{\{ background: "#fef3c7", padding: "1.5rem", borderRadius: "8px", border: "1px solid #fde68a", marginBottom: "2rem" \}\}>\s*<p style=\{\{ color: "#92400e", fontWeight: "bold", margin: 0 \}\}>⚠️ Plotting Siswa saat ini dilakukan melalui Sistem Admin Utama\. Fitur ini hanya untuk monitoring Guru\.<\/p>\s*<\/div>/g, `
          {!isAdmin && (
            <div style={{ background: "#fef3c7", padding: "1.5rem", borderRadius: "8px", border: "1px solid #fde68a", marginBottom: "2rem" }}>
               <p style={{ color: "#92400e", fontWeight: "bold", margin: 0 }}>⚠️ Plotting Siswa saat ini dilakukan melalui Sistem Admin Utama. Fitur ini hanya untuk monitoring Guru.</p>
            </div>
          )}
          {isAdmin && (
            <div style={{ background: "#f8fafc", padding: "1.5rem", borderRadius: "8px", border: "1px solid #e2e8f0", marginBottom: "2rem" }}>
              <h3 style={{ marginBottom: "1rem" }}>Tambah Penempatan Siswa Baru</h3>
              <form onSubmit={handleSavePlacement} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <select value={placementForm.studentNisn} onChange={e => setPlacementForm({...placementForm, studentNisn: e.target.value})} className="form-input" required style={{ width: "100%", padding: "0.5rem" }}>
                  <option value="">-- Pilih Siswa --</option>
                  {adminStudents && adminStudents.map(s => <option key={s.nisn} value={s.nisn}>{s.name} ({s.nisn})</option>)}
                </select>
                <select value={placementForm.dudiId} onChange={e => setPlacementForm({...placementForm, dudiId: e.target.value})} className="form-input" required style={{ width: "100%", padding: "0.5rem" }}>
                  <option value="">-- Pilih DUDI --</option>
                  {dudis.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
                <select value={placementForm.teacherUsername} onChange={e => setPlacementForm({...placementForm, teacherUsername: e.target.value})} className="form-input" required style={{ width: "100%", padding: "0.5rem", gridColumn: "1 / -1" }}>
                  <option value="">-- Pilih Guru Pembimbing --</option>
                  {adminTeachers && adminTeachers.map(t => <option key={t.username} value={t.username}>{t.name}</option>)}
                </select>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "bold", marginBottom: "0.3rem" }}>Tanggal Mulai</label>
                  <input type="date" value={placementForm.startDate} onChange={e => setPlacementForm({...placementForm, startDate: e.target.value})} className="form-input" required style={{ width: "100%", padding: "0.5rem" }}/>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "bold", marginBottom: "0.3rem" }}>Tanggal Selesai</label>
                  <input type="date" value={placementForm.endDate} onChange={e => setPlacementForm({...placementForm, endDate: e.target.value})} className="form-input" required style={{ width: "100%", padding: "0.5rem" }}/>
                </div>
                <button type="submit" style={{ gridColumn: "1 / -1", padding: "0.75rem", background: "#2563eb", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>Simpan Penempatan</button>
              </form>
            </div>
          )}
`);

// 5. Hide the DUDI form for non-admins? Wait, Guru can't create DUDI either. Let's hide it for guru!
content = content.replace(/<h3 style=\{\{ marginBottom: "1rem" \}\}>Tambah DUDI Baru<\/h3>/g, '{isAdmin && <><h3 style={{ marginBottom: "1rem" }}>Tambah DUDI Baru</h3>');
content = content.replace(/<\/form>\s*<\/div>\s*<table/g, '</form></>}</div><table');

// Delete placement button
content = content.replace(/\{p\.grade && p\.grade\.finalScore >= 70 && \(/g, `
                    {isAdmin && (
                      <button onClick={() => handleDeletePlacement(p.id)} style={{ padding: "0.4rem 0.8rem", fontSize: "0.85rem", background: "#ef4444", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", marginRight: "0.5rem" }}>Hapus</button>
                    )}
                    {p.grade && p.grade.finalScore >= 70 && (`);

const deletePlacementFunc = `
  const handleDeletePlacement = async (id) => {
    if (!confirm("Hapus penempatan ini?")) return;
    await deletePlacement(id);
    fetchData();
  };
`;
content = content.replace(/const handleApproveJournal = async/g, deletePlacementFunc + '\n  const handleApproveJournal = async');

fs.writeFileSync(filePath, content, 'utf8');
console.log('PklTab.js updated successfully.');

const fs = require('fs');
const p = 'C:/Users/USER/.gemini/antigravity/scratch/sistem-akademik-master/app/portal/admin/page.js';
let c = fs.readFileSync(p, 'utf8');

const replacement = `
                    ) : schoolSubTab === "konten" ? (
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
                        <div>
                          <h3 style={{ fontWeight: 800, color: "var(--primary-dark)", fontSize: "1.1rem", borderBottom: "2px solid var(--border-color)", paddingBottom: "0.25rem", marginBottom: "1rem" }}>📝 Konten Halaman</h3>
                          <div className="form-group">
                            <label className="form-label">Judul Utama Hero (Beranda)</label>
                            <input type="text" className="form-input" value={school.heroTitle || ""} onChange={(e) => setSchool(prev => ({ ...prev, heroTitle: e.target.value }))} />
                          </div>
                          <div className="form-group" style={{ marginTop: "1rem" }}>
                            <label className="form-label">Subjudul Hero (Beranda)</label>
                            <textarea className="form-textarea" value={school.heroSubtitle || ""} onChange={(e) => setSchool(prev => ({ ...prev, heroSubtitle: e.target.value }))} style={{ height: "60px" }} />
                          </div>
                          <div className="form-group" style={{ marginTop: "1rem" }}>
                            <label className="form-label">Teks Sejarah (Profil)</label>
                            <textarea className="form-textarea" value={school.sejarahText || ""} onChange={(e) => setSchool(prev => ({ ...prev, sejarahText: e.target.value }))} style={{ height: "150px" }} />
                          </div>
                          <button type="button" className="btn btn-primary" style={{ marginTop: "1rem" }} onClick={async () => {
                            const r = await updateSchoolPublicContent(school);
                            if (r.success) { alert("Konten teks berhasil disimpan!"); fetchDashboard(); }
                            else { alert("Gagal menyimpan teks: " + r.error); }
                          }}>Simpan Teks Konten</button>
                        </div>
                        <div>
                          <h3 style={{ fontWeight: 800, color: "var(--primary-dark)", fontSize: "1.1rem", borderBottom: "2px solid var(--border-color)", paddingBottom: "0.25rem", marginBottom: "1rem" }}>📸 Gambar Halaman Publik</h3>
                          
                          <div className="form-group">
                            <label className="form-label">Upload Foto Profil Sekolah</label>
                            <input type="file" className="form-input" accept="image/*" onChange={async (e) => {
                              if (!e.target.files[0]) return;
                              const fd = new FormData(); fd.append("file", e.target.files[0]);
                              const res = await uploadPublicPhoto(fd);
                              if (res.success) {
                                await updateSchoolPublicContent({ profilImage: res.photoUrl });
                                alert("Foto Profil berhasil diunggah!");
                                fetchDashboard();
                              }
                            }} />
                            {school.profilImage && <img src={school.profilImage} alt="Profil" style={{ width: "100px", marginTop: "0.5rem" }} />}
                          </div>

                          <div className="form-group" style={{ marginTop: "1rem" }}>
                            <label className="form-label">Upload Foto Akademik</label>
                            <input type="file" className="form-input" accept="image/*" onChange={async (e) => {
                              if (!e.target.files[0]) return;
                              const fd = new FormData(); fd.append("file", e.target.files[0]);
                              const res = await uploadPublicPhoto(fd);
                              if (res.success) {
                                await updateSchoolPublicContent({ akademikImage: res.photoUrl });
                                alert("Foto Akademik berhasil diunggah!");
                                fetchDashboard();
                              }
                            }} />
                            {school.akademikImage && <img src={school.akademikImage} alt="Akademik" style={{ width: "100px", marginTop: "0.5rem" }} />}
                          </div>

                          <div className="form-group" style={{ marginTop: "1rem" }}>
                            <label className="form-label">Upload Foto Galeri (Tambah Baru)</label>
                            <input type="file" className="form-input" accept="image/*" onChange={async (e) => {
                              if (!e.target.files[0]) return;
                              const fd = new FormData(); fd.append("file", e.target.files[0]);
                              const res = await uploadPublicPhoto(fd);
                              if (res.success) {
                                const currentGaleri = school.galeriImages ? school.galeriImages.split(';').filter(Boolean) : [];
                                currentGaleri.push(res.photoUrl);
                                await updateSchoolPublicContent({ galeriImages: currentGaleri.join(';') });
                                alert("Foto Galeri berhasil ditambahkan!");
                                fetchDashboard();
                              }
                            }} />
                            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.5rem" }}>
                              {school.galeriImages && school.galeriImages.split(';').filter(Boolean).map((img, i) => (
                                <div key={i} style={{ position: "relative" }}>
                                  <img src={img} alt="Galeri" style={{ width: "60px", height: "60px", objectFit: "cover" }} />
                                  <button type="button" onClick={async () => {
                                    if(confirm('Hapus foto ini?')) {
                                      const arr = school.galeriImages.split(';').filter(Boolean);
                                      arr.splice(i, 1);
                                      await updateSchoolPublicContent({ galeriImages: arr.join(';') });
                                      fetchDashboard();
                                    }
                                  }} style={{ position: "absolute", top: 0, right: 0, background: "red", color: "white", border: "none", cursor: "pointer", padding: "2px 5px", fontSize: "10px" }}>X</button>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
`;

const startIndex = c.indexOf(') : schoolSubTab === "konten" ? (');
const endIndex = c.indexOf(') : (', startIndex);
if (startIndex !== -1 && endIndex !== -1) {
  c = c.substring(0, startIndex) + replacement + c.substring(endIndex + 5); 
  fs.writeFileSync(p, c);
  console.log('Konten UI injected');
} else {
  console.log('Could not find boundaries', startIndex, endIndex);
}

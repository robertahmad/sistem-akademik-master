const fs = require('fs');
const p = 'C:/Users/USER/.gemini/antigravity/scratch/sistem-akademik-master/app/portal/admin/page.js';
let c = fs.readFileSync(p, 'utf8');

// Replace "📝 Konten Halaman"
c = c.replace(
  /<h3 style=\{\{\s*fontWeight:\s*800,\s*color:\s*"var\(--primary-dark\)",\s*fontSize:\s*"1\.1rem",\s*borderBottom:\s*"2px solid var\(--border-color\)",\s*paddingBottom:\s*"0\.25rem",\s*marginBottom:\s*"1rem"\s*\}\}>.*?Konten Halaman<\/h3>/,
  `<h3 style={{ fontWeight: 800, color: "var(--primary-dark)", fontSize: "1.1rem", borderBottom: "2px solid var(--border-color)", paddingBottom: "0.25rem", marginBottom: "1rem", display: "flex", alignItems: "center" }}>
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "8px", color: "var(--primary)" }}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
      <polyline points="14 2 14 8 20 8"></polyline>
      <line x1="16" y1="13" x2="8" y2="13"></line>
      <line x1="16" y1="17" x2="8" y2="17"></line>
      <polyline points="10 9 9 9 8 9"></polyline>
    </svg>
    Konten Halaman
  </h3>`
);

// Replace "📸 Gambar Halaman Publik"
c = c.replace(
  /<h3 style=\{\{\s*fontWeight:\s*800,\s*color:\s*"var\(--primary-dark\)",\s*fontSize:\s*"1\.1rem",\s*borderBottom:\s*"2px solid var\(--border-color\)",\s*paddingBottom:\s*"0\.25rem",\s*marginBottom:\s*"1rem"\s*\}\}>.*?Gambar Halaman Publik<\/h3>/,
  `<h3 style={{ fontWeight: 800, color: "var(--primary-dark)", fontSize: "1.1rem", borderBottom: "2px solid var(--border-color)", paddingBottom: "0.25rem", marginBottom: "1rem", display: "flex", alignItems: "center" }}>
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "8px", color: "var(--primary)" }}>
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
      <circle cx="8.5" cy="8.5" r="1.5"></circle>
      <polyline points="21 15 16 10 5 21"></polyline>
    </svg>
    Gambar Halaman Publik
  </h3>`
);

// Fix Delete Logic
c = c.replace(
  /<button type="button" onClick=\{async \(\) => \{\s*if\(confirm\('Hapus foto ini\?'\)\) \{\s*const arr = school\.galeriImages\.split\(';'\)\.filter\(Boolean\);\s*arr\.splice\(i, 1\);\s*await updateSchoolPublicContent\(\{ galeriImages: arr\.join\(';'\) \}\);\s*fetchDashboard\(\);\s*\}\s*\}\} style=\{\{ position: "absolute", top: 0, right: 0, background: "red", color: "white", border: "none", cursor: "pointer", padding: "2px 5px", fontSize: "10px" \}\}>X<\/button>/g,
  `<button type="button" onClick={async (e) => {
    e.preventDefault();
    if(confirm('Hapus foto ini?')) {
      const arr = school.galeriImages.split(';').filter(Boolean);
      arr.splice(i, 1);
      const newVal = arr.join(';');
      const res = await updateSchoolPublicContent({ galeriImages: newVal });
      if (res.success) {
        setSchool(prev => ({ ...prev, galeriImages: newVal }));
      } else {
        alert("Gagal menghapus foto: " + res.error);
      }
    }
  }} style={{ position: "absolute", top: 0, right: 0, background: "red", color: "white", border: "none", cursor: "pointer", padding: "2px 5px", fontSize: "10px", zIndex: 10 }}>X</button>`
);

// Also filter out any "undefined" string specifically during rendering and saving, just in case
c = c.replace(
  /\{school\.galeriImages && school\.galeriImages\.split\(';'\)\.filter\(Boolean\)\.map\(\(img, i\) => \(/g,
  `{school.galeriImages && school.galeriImages.split(';').filter(Boolean).filter(img => img !== 'undefined' && img !== 'null').map((img, i) => (`
);

fs.writeFileSync(p, c);
console.log('Icons and delete logic updated');

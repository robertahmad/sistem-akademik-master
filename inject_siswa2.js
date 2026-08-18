const fs = require('fs');
let content = fs.readFileSync('app/portal/siswa/page.js', 'utf8');

if (!content.includes('SiswaPenugasanTab')) {
  content = content.replace('import UjianSiswaSheet', 'import SiswaPenugasanTab from \'./SiswaPenugasanTab\';\nimport UjianSiswaSheet');
}

// Inject to Dashboard
const cardSearch = '<p style={{ color: "var(--text-muted)", marginTop: "0.5rem" }}>Pilih salah satu ujian yang tersedia di bawah ini:</p>';
const cardReplace = '<p style={{ color: "var(--text-muted)", marginTop: "0.5rem" }}>Pilih salah satu ujian yang tersedia di bawah ini, atau kerjakan tugas Anda.</p>\n                          <button \n                            className="btn btn-primary" \n                            style={{ marginTop: "1rem", width: "100%", padding: "0.75rem", fontSize: "1rem", fontWeight: "bold", display: "flex", justifyContent: "center", alignItems: "center", gap: "0.5rem" }}\n                            onClick={() => setView("penugasan")}\n                          >\n                            <span style={{ fontSize: "1.2rem" }}>??</span>\n                            Buka Modul Penugasan Siswa\n                          </button>';
content = content.replace(cardSearch, cardReplace);

// Inject rendering logic
const renderSearch = '{view === "dashboard" && (';
const renderReplace = '{view === "penugasan" && (\n                <SiswaPenugasanTab student={session} activeSubject={activeExam ? { name: activeExam.subject } : { name: session.kelas === "X DKV 1" ? "Fotografi Dasar & Tata Cahaya" : "Mata Pelajaran" }} />\n              )}\n\n              ' + renderSearch;
content = content.replace(renderSearch, renderReplace);

fs.writeFileSync('app/portal/siswa/page.js', content, 'utf8');
console.log('Siswa injected');

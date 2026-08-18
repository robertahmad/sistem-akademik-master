const fs = require('fs');
let content = fs.readFileSync('app/portal/guru/page.js', 'utf8');

if (!content.includes('import PenugasanTab')) {
  content = content.replace('import KkmSheet', 'import PenugasanTab from \'./PenugasanTab\';\nimport KkmSheet');
}

if (!content.includes('activeTab === "penugasan"')) {
  const buttonSearch = 'Beranda Pendidik\n                  </button>';
  const buttonReplace = buttonSearch + '\n\n                  <button \n                    className={\sidebar-btn \\}\n                    onClick={() => setActiveTab("penugasan")}\n                  >\n                    <svg className="tab-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>\n                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />\n                      <polyline points="14 2 14 8 20 8" />\n                      <line x1="16" y1="13" x2="8" y2="13" />\n                      <line x1="16" y1="17" x2="8" y2="17" />\n                      <polyline points="10 9 9 9 8 9" />\n                    </svg>\n                    Penugasan {activeSubject?.name}\n                  </button>';
  content = content.replace(buttonSearch, buttonReplace);

  const renderSearch = '{activeTab === "beranda" && (';
  const renderReplace = '{activeTab === "penugasan" && (\n                  <PenugasanTab teacher={teacher} activeSubject={activeSubject} school={school} />\n                )}\n\n                ' + renderSearch;
  content = content.replace(renderSearch, renderReplace);
}

fs.writeFileSync('app/portal/guru/page.js', content, 'utf8');
console.log('Guru injected');

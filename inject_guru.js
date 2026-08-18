const fs = require('fs');
let content = fs.readFileSync('app/portal/guru/page.js', 'utf8');

if (!content.includes('import PenugasanTab')) {
  content = content.replace('import KkmSheet', 'import PenugasanTab from \'./PenugasanTab\';\nimport KkmSheet');
}

if (!content.includes('activeTab === "penugasan"')) {
  content = content.replace('className={\sidebar-btn \\}', 'className={\sidebar-btn \\}');
  // Let's inject button right after beranda button
  const btnSearch = 'className={\sidebar-btn \\}\n                    onClick={() => setActiveTab("beranda")}\n                  >\n                    ?? Beranda\n                  </button>';
  const btnReplace = btnSearch + '\n                  <button \n                    className={\sidebar-btn \\}\n                    onClick={() => setActiveTab("penugasan")}\n                  >\n                    ?? Penugasan\n                  </button>';
  content = content.replace(btnSearch, btnReplace);

  // Inject rendering logic right after beranda block
  const renderSearch = '{activeTab === "beranda" && (';
  const renderReplace = '{activeTab === "penugasan" && (\n                  <PenugasanTab teacher={teacher} activeSubject={activeSubject} school={school} />\n                )}\n\n                ' + renderSearch;
  content = content.replace(renderSearch, renderReplace);
}

fs.writeFileSync('app/portal/guru/page.js', content, 'utf8');
console.log('Guru injected');

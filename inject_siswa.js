const fs = require('fs');
let content = fs.readFileSync('app/portal/siswa/page.js', 'utf8');

if (!content.includes('import SiswaPenugasanTab')) {
  content = content.replace('import UjianSiswaSheet', 'import SiswaPenugasanTab from \'./SiswaPenugasanTab\';\nimport UjianSiswaSheet');
}

if (!content.includes('activeTab === "penugasan"')) {
  content = content.replace('className={\sidebar-btn \\}', 'className={\sidebar-btn \\}');
  // Inject button right after beranda button
  const btnSearch = 'className={\sidebar-btn \\}\n                  onClick={() => setActiveTab("beranda")}\n                >\n                  ?? Beranda\n                </button>';
  const btnReplace = btnSearch + '\n                <button \n                  className={\sidebar-btn \\}\n                  onClick={() => setActiveTab("penugasan")}\n                >\n                  ?? Tugas Saya\n                </button>';
  content = content.replace(btnSearch, btnReplace);

  // Inject rendering logic right after beranda block
  const renderSearch = '{activeTab === "beranda" && (';
  const renderReplace = '{activeTab === "penugasan" && (\n                <SiswaPenugasanTab student={student} activeSubject={activeSubject} />\n              )}\n\n              ' + renderSearch;
  content = content.replace(renderSearch, renderReplace);
}

fs.writeFileSync('app/portal/siswa/page.js', content, 'utf8');
console.log('Siswa injected');

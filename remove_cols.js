const fs = require('fs');
let admin = fs.readFileSync('app/portal/admin/page.js', 'utf8');
admin = admin.replace('<th>NIP</th>\n                                  <th>Peran Pendidik</th>', '');
admin = admin.replace('<td>{t.nip}</td>\n                                    <td>{t.role === "wali-kelas" ? `Wali Kelas ` : "Guru Mapel"}</td>', '');
fs.writeFileSync('app/portal/admin/page.js', admin);
console.log('Columns removed');

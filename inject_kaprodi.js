const fs = require('fs');
let admin = fs.readFileSync('app/portal/admin/page.js', 'utf8');
if (!admin.includes('Kaprodi DKV?')) {
  admin = admin.replace('<th style={{ textAlign: "center" }}>Waka Kesiswaan?</th>', '<th style={{ textAlign: "center" }}>Waka Kesiswaan?</th>\n                                  <th style={{ textAlign: "center" }}>Kaprodi DKV?</th>');
  const tdSearch = '<td style={{ textAlign: "center" }}>\n                                      <input \n                                        type="checkbox" \n                                        checked={t.isWakaKesiswaan || false}\n                                        onChange={() => handleAssignSpecialRole(t.id, "isWakaKesiswaan", t.isWakaKesiswaan || false)}\n                                        style={{ width: "18px", height: "18px", cursor: "pointer" }}\n                                      />\n                                    </td>';
  const tdReplace = tdSearch + '\n                                    <td style={{ textAlign: "center" }}>\n                                      <input \n                                        type="checkbox" \n                                        checked={t.isKaprodiDkv || false}\n                                        onChange={() => handleAssignSpecialRole(t.id, "isKaprodiDkv", t.isKaprodiDkv || false)}\n                                        style={{ width: "18px", height: "18px", cursor: "pointer" }}\n                                      />\n                                    </td>';
  admin = admin.replace(tdSearch, tdReplace);
  fs.writeFileSync('app/portal/admin/page.js', admin);
  console.log('UI injected');
}

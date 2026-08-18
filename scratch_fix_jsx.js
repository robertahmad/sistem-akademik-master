const fs = require('fs');

['app/portal/guru/PklTab.js', 'app/portal/guru/UkkTab.js'].forEach(f => {
  let c = fs.readFileSync(f, 'utf8');
  
  // Replace the messed up opening tag
  c = c.replace(/\{isAdmin && \(\s*<>\s*<h3/g, '{isAdmin && (<div style={{ background: "#f8fafc", padding: "1.5rem", borderRadius: "8px", border: "1px solid #e2e8f0", marginBottom: "2rem" }}><h3');
  
  // Replace the messed up closing tag
  c = c.replace(/<\/form><\/>\)}<\/div><table/g, '</form></div>)}<table');
  
  fs.writeFileSync(f, c, 'utf8');
});

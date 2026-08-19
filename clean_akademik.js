const fs = require('fs');
const p = 'C:/Users/USER/.gemini/antigravity/scratch/sistem-akademik-master/app/akademik/page.js';
let c = fs.readFileSync(p, 'utf8');

c = c.replace(/<div className="facility-image-wrapper">[\s\S]*?<\/div>/g, '');
c = c.replace(/<div className="extra-image-wrapper">[\s\S]*?<\/div>/g, '');

c = c.replace(/<div className="facility-grid">/, '{school?.akademikImage && <div style={{ marginBottom: "2rem", borderRadius: "1rem", overflow: "hidden" }}><img src={school.akademikImage} alt="Fasilitas Akademik" style={{ width: "100%", height: "auto", objectFit: "cover", maxHeight: "400px" }} /></div>}\n          <div className="facility-grid">');

fs.writeFileSync(p, c);
console.log('Akademik images cleaned');

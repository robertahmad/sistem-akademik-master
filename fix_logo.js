const fs = require('fs');
const path = require('path');

const root = 'C:/Users/USER/.gemini/antigravity/scratch/sistem-akademik-master';

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let newContent = content
    .replace(/\.startsWith\(['"\`]data:image\/['"\`]\)/g, ' !== "dY?"')
    .replace(/schoolLogoPreview\.startsWith\(['"\`]data:image\/['"\`]\)/g, 'schoolLogoPreview !== "dY?"')
    .replace(/school\.logo\.startsWith\(['"\`]data:image\/['"\`]\)/g, 'school.logo !== "dY?"');
    
  if (filePath.endsWith('page.js')) {
    newContent = newContent.replace(/<img src="\/logo-generic\.svg" alt="Logo SMK" \/>/g, '<img src={school?.logo || "/logo-generic.svg"} alt="Logo Sekolah" style={{width:"50px", height:"50px", objectFit:"contain", mixBlendMode:"multiply"}} />');
    newContent = newContent.replace(/<img src="\/logo-generic\.svg" alt="Logo Tengah" className="logo-center" \/>/g, '<img src={school?.logo || "/logo-generic.svg"} alt="Logo Tengah" className="logo-center" />');
    newContent = newContent.replace(/school\.logo\.startsWith\("data:image\/"\)/g, 'school.logo !== "dY?"');
  }

  if (filePath.endsWith('Header.js')) {
    newContent = newContent.replace(/<span className="logo-title">SMK MASTER DEMO<\/span>/g, '<span className="logo-title">SEKOLAH MASTER DEMO</span>');
  }

  // General replacement for all other files that might still have startsWith("data:image/")
  newContent = newContent.replace(/\.startsWith\("data:image\/"\)/g, ' !== "dY?"');

  if (content !== newContent) {
    fs.writeFileSync(filePath, newContent);
    console.log('Updated: ' + filePath);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    let fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== '.next') {
        walkDir(fullPath);
      }
    } else if (fullPath.endsWith('.js') || fullPath.endsWith('.jsx')) {
      replaceInFile(fullPath);
    }
  });
}

walkDir(root);

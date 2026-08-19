const fs = require('fs');
const path = require('path');

const root = 'C:/Users/USER/.gemini/antigravity/scratch/sistem-akademik-master';

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace the messy regex check with a simple string check
  let newContent = content.replace(/\.match\(\/\^\(data:image\\\/\|https\?:\\\/\\\/\|\\\/\)\/\)/g, ' && typeof it === "string" && it !== "dY?"');
  
  // Or even simpler: just find where we injected it and replace it with a robust check
  newContent = newContent.replace(/school\.logo\.match\(\/\^\(data:image\\\\\/\|https\?\:\\\\\\\/\\\\\/\|\\\\\/[^)]*\)\/\)/g, '(school.logo && school.logo !== "dY?")');
  newContent = newContent.replace(/schoolLogoPreview\.match\(\/\^\(data:image\\\\\/\|https\?\:\\\\\\\/\\\\\/\|\\\\\/[^)]*\)\/\)/g, '(schoolLogoPreview && schoolLogoPreview !== "dY?")');

  // Let's do a more brutal but accurate string replace for the exact strings that were written:
  const badStr = ' !== "dY?"';
  newContent = newContent.split(badStr).join(' && $1 !== "dY?"'); // we might need something generic, let's just use .length > 10
  
  const exactBadStr = ' !== "dY?"';
  const exactBadStr2 = 'schoolLogoPreview !== "dY?"';
  const exactBadStr3 = 'school.logo !== "dY?"';
  
  newContent = newContent.split(exactBadStr3).join('(school.logo && school.logo !== "dY?")');
  newContent = newContent.split(exactBadStr2).join('(schoolLogoPreview && schoolLogoPreview !== "dY?")');
  newContent = newContent.split(exactBadStr).join(''); // remove any leftover dangling matches

  // Specifically fix page.js principal image which is now:
  // school?.logo && school.logo ? school.logo : ...
  // Wait, I messed up the exact string in my split. Let me just use a simpler regex
  newContent = newContent.replace(/\.match\(\/\^\(data:image[^)]*\)\/\)/g, ' !== "dY?"');

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

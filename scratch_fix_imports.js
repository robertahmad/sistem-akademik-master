const fs = require('fs');
const path = require('path');

const files = [
  path.join('app', 'actions', 'pkl.js'),
  path.join('app', 'actions', 'ukk.js'),
  path.join('app', 'actions', 'settings.js')
];

files.forEach(file => {
  const filePath = path.join('C:', 'Users', 'USER', '.gemini', 'antigravity', 'scratch', 'smk-al-qodiriyah-windusari-next', file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace import { loginAction } from "./auth"; with import { getSession } from "../../lib/auth";
    content = content.replace(/import\s+{\s*loginAction\s*}\s+from\s+["']\.\/auth["'];/g, 'import { getSession } from "../../lib/auth";');
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${file}`);
  }
});

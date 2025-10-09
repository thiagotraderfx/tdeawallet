// scripts/clone-wallet-to-ensayo.js
// Ejecutar: node scripts/clone-wallet-to-ensayo.js [--copy-lib]
const fs = require('fs');
const path = require('path');
const glob = require('glob');
const argv = process.argv.slice(2);
const copyLib = argv.includes('--copy-lib');

function copyDir(src, dest) {
  if (!fs.existsSync(src)) {
    console.warn(`Source directory does not exist: ${src}`);
    return;
  };
  const files = glob.sync('**/*', { cwd: src, dot: true, nodir: true });
  files.forEach(file => {
    const srcFile = path.join(src, file);
    const destFile = path.join(dest, file);
    const destDir = path.dirname(destFile);
    fs.mkdirSync(destDir, { recursive: true });
    let content = fs.readFileSync(srcFile, 'utf8');
    // Insert header comment for JS/TS/tsx/tsx files
    if (/\.(js|ts|jsx|tsx|mdx)$/.test(srcFile)) {
      const header = `// ENSAYO COPY - NO MODIFICAR /wallet\n// Copiado desde: ${srcFile}\n// Fecha: ${new Date().toISOString()}\n\n`;
      content = header + content;
    }
    // Replace import paths that include '/wallet' -> '/ensayo'
    content = content.replace(/(['"`])(@\/.*?\/)wallet(\/.*?['"`])/g, (m, p1, p2, p3) => `${p1}${p2}ensayo${p3}`);
    content = content.replace(/(from\s+['"`]@\/)(wallet)(\/?)/g, (m,p1,p2,p3) => `${p1}ensayo${p3}`);
    // Also replace literal strings '/wallet' -> '/ensayo' in code and templates
    content = content.replace(/\/wallet/g, '/ensayo');
    fs.writeFileSync(destFile, content, 'utf8');
    console.log('copied', srcFile, '->', destFile);
  });
}

const mappings = [
  { src: 'src/app/wallet', dest: 'src/app/ensayo' },
  { src: 'src/components/wallet', dest: 'src/components/ensayo' },
  { src: 'src/components/tx', dest: 'src/components/ensayo/tx' },
  { src: 'src/components/settings', dest: 'src/components/ensayo/settings' },
];

console.log('Iniciando copia Wallet -> Ensayo');
mappings.forEach(m => {
  copyDir(m.src, m.dest);
});

if (copyLib) {
  console.log('Copiando src/lib -> src/lib/ensayo (OPCIONAL)');
  copyDir('src/lib', 'src/lib/ensayo');
}

// Copy docs separately to avoid deep nesting issues
try {
  if (fs.existsSync('docs/scripts')) {
    const scriptFiles = fs.readdirSync('docs/scripts');
    fs.mkdirSync('docs/scripts/ensayo', { recursive: true });
    scriptFiles.forEach(file => {
      const srcFile = path.join('docs/scripts', file);
      if(fs.lstatSync(srcFile).isFile()) {
        const destFile = path.join('docs/scripts', `ensayo-${file}`);
        fs.copyFileSync(srcFile, destFile);
        console.log('copied', srcFile, '->', destFile);
      }
    });
  }
} catch (e) {
    console.error("Could not copy docs/scripts", e.message)
}


console.log('Copia finalizada. Recomendado: revisar manualmente imports y ejecutar lint/build.');

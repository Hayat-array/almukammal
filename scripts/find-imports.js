const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const dirsToScan = ['app', 'components', 'contexts', 'lib', 'routes', 'utils', 'src'];
const ignoreDirs = ['node_modules', '.next', '.git'];

function scanFile(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        if (content.includes('next/document')) {
            console.log(`FOUND: ${filePath}`);
            // Print the matching line
            const lines = content.split('\n');
            lines.forEach((line, index) => {
                if (line.includes('next/document')) {
                    console.log(`  Line ${index + 1}: ${line.trim()}`);
                }
            });
        }
    } catch (err) {
        // ignore read errors
    }
}

function scanDir(dir) {
    if (!fs.existsSync(dir)) return;

    const files = fs.readdirSync(dir);

    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            if (!ignoreDirs.includes(file)) {
                scanDir(fullPath);
            }
        } else if (file.endsWith('.js') || file.endsWith('.jsx') || file.endsWith('.ts') || file.endsWith('.tsx')) {
            scanFile(fullPath);
        }
    }
}

console.log('Scanning for imports from "next/document"...');
dirsToScan.forEach(d => scanDir(path.join(projectRoot, d)));
console.log('Scan complete.');

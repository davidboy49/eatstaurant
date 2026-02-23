const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function (file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else {
            if (file.endsWith('.tsx') || file.endsWith('.ts')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk(path.join(__dirname, 'src'));

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    // Replace color: "white" -> color: "var(--color-text-primary)"
    content = content.replace(/color:\s*['"]white['"]/g, 'color: "var(--color-text-primary)"');
    // Replace rgba(255,255,255,0.1) -> var(--color-overlay)
    content = content.replace(/rgba\(255,\s*255,\s*255,\s*0\.1\)/g, 'var(--color-overlay)');
    content = content.replace(/rgba\(255,\s*255,\s*255,\s*0\.05\)/g, 'var(--color-icon-bg)');
    content = content.replace(/rgba\(255,\s*255,\s*255,\s*0\.2\)/g, 'var(--color-overlay-hover)');
    // Hardcoded white borders -> var(--color-border)
    content = content.replace(/1px solid rgba\(255,\s*255,\s*255,\s*0\.05\)/g, '1px solid var(--color-border)');
    content = content.replace(/1px solid rgba\(255,\s*255,\s*255,\s*0\.1\)/g, '1px solid var(--color-border)');

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Updated ${file}`);
    }
});

const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, 'app');
const componentsDir = path.join(__dirname, 'components');

const replacements = [
    { from: /isDiyanet/g, to: 'isIdentityVerified' },
    { from: /Diyanet Onaylı/g, to: 'Kimlik Onaylı' },
    { from: /Diyanet onaylı/g, to: 'kimlik onaylı' },
    { from: /Diyanet Personeli misiniz\?/g, to: 'Kimlik doğrulaması yapmak ister misiniz?' },
    { from: /Diyanet Personeli/g, to: 'Kimlik Onaylı' },
    { from: /Diyanet İşleri Başkanlığı tarafından onaylı/g, to: 'platformumuz tarafından kimlik doğrulaması yapılmış' },
    { from: /Diyanet İşleri Başkanlığı/g, to: 'kapsamlı doğrulama süreçleri' },
    { from: /Diyanet Onayı:/g, to: 'Kimlik Onayı:' },
    { from: /Diyanet Badge/g, to: 'Kimlik Rozeti' },
    { from: /isDiyanetFilter/g, to: 'isIdentityFilter' }
];

function walkSync(currentDirPath, callback) {
    fs.readdirSync(currentDirPath).forEach((name) => {
        const filePath = path.join(currentDirPath, name);
        const stat = fs.statSync(filePath);
        if (stat.isFile()) {
            if (filePath.endsWith('.tsx') || filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
                callback(filePath);
            }
        } else if (stat.isDirectory()) {
            walkSync(filePath, callback);
        }
    });
}

function processFiles(dir) {
    if (!fs.existsSync(dir)) return;
    walkSync(dir, (filePath) => {
        let content = fs.readFileSync(filePath, 'utf8');
        let original = content;

        replacements.forEach(r => {
            content = content.replace(r.from, r.to);
        });

        if (content !== original) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`Updated: ${filePath}`);
        }
    });
}

processFiles(targetDir);
processFiles(componentsDir);
console.log("Replacement complete.");

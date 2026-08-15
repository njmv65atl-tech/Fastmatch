const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function processDirectory(dir) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            await processDirectory(filePath);
        } else {
            const ext = path.extname(file).toLowerCase();
            if (['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) {
                try {
                    const stats = fs.statSync(filePath);
                    // Skip if file is already less than 200KB to save time
                    if (stats.size < 200 * 1024) continue;

                    const tempPath = filePath + '.tmp';
                    await sharp(filePath)
                        .resize({ width: 800, withoutEnlargement: true })
                        .jpeg({ quality: 80 })
                        .toFile(tempPath);
                    fs.renameSync(tempPath, filePath);
                    console.log('Compressed:', filePath);
                } catch (e) {
                    console.error('Error compressing', filePath, e.message);
                }
            }
        }
    }
}

async function run() {
    console.log('Starting image compression script...');
    await processDirectory(path.join(__dirname, 'src', 'public', 'user'));
    await processDirectory(path.join(__dirname, 'src', 'public', 'chat'));
    console.log('Finished image compression script!');
}

run();

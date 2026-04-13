const sharp = require('sharp');
const path = require('path');

async function processLogo() {
  const inputPath = path.join(__dirname, 'public', 'logo.png');
  const tempPath = path.join(__dirname, 'public', 'logo_temp.png');
  
  try {
    const metadata = await sharp(inputPath).metadata();
    console.log('Current logo size:', metadata.width, 'x', metadata.height);

    // More aggressive trim with lower threshold
    await sharp(inputPath)
      .trim({ threshold: 30 })
      .toFile(tempPath);

    const newMeta = await sharp(tempPath).metadata();
    console.log('After trim:', newMeta.width, 'x', newMeta.height);

    const fs = require('fs');
    fs.renameSync(tempPath, inputPath);
    console.log('Done! Logo replaced.');
  } catch (err) {
    console.error('Error:', err);
  }
}

processLogo();

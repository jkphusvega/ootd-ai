const sharp = require('sharp');
const path = require('path');

async function processLogo() {
  const inputPath = path.join(__dirname, 'public', 'logo.png');
  const tempPath = path.join(__dirname, 'public', 'logo_temp.png');
  
  try {
    // 1. Read image as grayscale
    const image = sharp(inputPath).grayscale();
    
    // 2. We want to convert white background to transparent and black logo to solid black.
    // Luma: 255 (white) -> we want 0 alpha. 0 (black) -> we want 255 alpha.
    // Sharp's `negate()` inverts the grayscale image. So black becomes white (255), white becomes black (0).
    const alphaChannel = await image.clone().negate().toBuffer();
    
    // 3. Create a solid black canvas of the same size.
    const metadata = await sharp(inputPath).metadata();
    
    // 4. Combine solid black color with the inverted grayscale image acting as the alpha channel!
    // Then trim the transparent borders automatically.
    await sharp({
      create: {
        width: metadata.width,
        height: metadata.height,
        channels: 3,
        background: { r: 50, g: 50, b: 50 } // We'll make it dark gray like the logo text #333
      }
    })
      .joinChannel(alphaChannel)
      .trim()
      .toFile(tempPath);
      
    console.log('Logo processed successfully: trimmed and made transparent!');
    
    // Replace original
    const fs = require('fs');
    fs.renameSync(tempPath, inputPath);
  } catch (err) {
    console.error('Error processing logo:', err);
  }
}

processLogo();

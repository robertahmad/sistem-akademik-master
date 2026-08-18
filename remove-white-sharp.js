const sharp = require('sharp');

async function removeWhite() {
  try {
    const { data, info } = await sharp('public/logo-generic.svg')
      .raw()
      .toBuffer({ resolveWithObject: true });

    const pixelData = Buffer.from(data);
    for (let i = 0; i < pixelData.length; i += info.channels) {
      const r = pixelData[i];
      const g = pixelData[i + 1];
      const b = pixelData[i + 2];
      
      // Calculate distance to white
      const dist = Math.sqrt(Math.pow(255 - r, 2) + Math.pow(255 - g, 2) + Math.pow(255 - b, 2));
      
      // If alpha channel exists
      if (info.channels === 4) {
        if (dist < 40) {
          pixelData[i + 3] = 0;
        } else if (dist < 80) {
          pixelData[i + 3] = Math.floor(((dist - 40) / 40) * 255);
        }
      } else {
        // If no alpha, we can't easily add it using raw buffer without changing channels,
        // but we can just use sharp's built in methods or create a new buffer with 4 channels
      }
    }
    
    // If original didn't have alpha, we need a 4 channel buffer
    let outData = pixelData;
    let outChannels = info.channels;
    if (info.channels === 3) {
      outData = Buffer.alloc(info.width * info.height * 4);
      for (let i = 0; i < info.width * info.height; i++) {
        const r = pixelData[i * 3];
        const g = pixelData[i * 3 + 1];
        const b = pixelData[i * 3 + 2];
        const dist = Math.sqrt(Math.pow(255 - r, 2) + Math.pow(255 - g, 2) + Math.pow(255 - b, 2));
        
        outData[i * 4] = r;
        outData[i * 4 + 1] = g;
        outData[i * 4 + 2] = b;
        
        if (dist < 40) {
          outData[i * 4 + 3] = 0;
        } else if (dist < 80) {
          outData[i * 4 + 3] = Math.floor(((dist - 40) / 40) * 255);
        } else {
          outData[i * 4 + 3] = 255;
        }
      }
      outChannels = 4;
    }

    await sharp(outData, {
      raw: {
        width: info.width,
        height: info.height,
        channels: outChannels
      }
    })
    .png()
    .toFile('public/logo-generic.svg');

    console.log('Successfully created logo-generic.svg with Sharp!');
  } catch (err) {
    console.error(err);
  }
}

removeWhite();

const Jimp = require('jimp');

async function removeWhite() {
  try {
    const image = await Jimp.read('public/logo-generic.svg');
    
    // We must ensure the image has an alpha channel
    image.rgba(true);
    
    let changed = 0;
    
    image.scan(0, 0, image.bitmap.width, image.bitmap.height, function (x, y, idx) {
      const r = this.bitmap.data[idx + 0];
      const g = this.bitmap.data[idx + 1];
      const b = this.bitmap.data[idx + 2];
      
      // If it is a light color (close to white)
      if (r > 220 && g > 220 && b > 220) {
        this.bitmap.data[idx + 3] = 0; // alpha to 0
        changed++;
      }
    });
    
    console.log(`Changed ${changed} pixels to transparent.`);
    
    await image.writeAsync('public/logo-generic.svg');
    console.log('Saved to public/logo-generic.svg');
  } catch (err) {
    console.error(err);
  }
}

removeWhite();

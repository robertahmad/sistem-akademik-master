const Jimp = require('jimp');

Jimp.read('public/logo-generic.svg')
  .then(image => {
    // We will do a simple color distance from white
    image.scan(0, 0, image.bitmap.width, image.bitmap.height, function (x, y, idx) {
      const r = this.bitmap.data[idx + 0];
      const g = this.bitmap.data[idx + 1];
      const b = this.bitmap.data[idx + 2];
      
      // Calculate distance to pure white (255, 255, 255)
      const dist = Math.sqrt(Math.pow(255 - r, 2) + Math.pow(255 - g, 2) + Math.pow(255 - b, 2));
      
      // If it's very close to white (distance < 60), make it fully transparent
      if (dist < 60) {
        this.bitmap.data[idx + 3] = 0; // alpha 0
      } else if (dist < 100) {
        // smooth edge
        const alpha = Math.floor(((dist - 60) / 40) * 255);
        this.bitmap.data[idx + 3] = alpha;
      }
    });
    return image.write('public/logo-generic.svg');
  })
  .then(() => {
    console.log('Image saved with aggressive white removal.');
  })
  .catch(err => {
    console.error(err);
  });


import { ImageData } from '../types';

/**
 * Calculates the pixel difference between two images.
 */
export const calculateDifference = async (imgA: ImageData, imgB: ImageData): Promise<string> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject('Cannot get canvas context');
      return;
    }

    const width = Math.max(imgA.width, imgB.width);
    const height = Math.max(imgA.height, imgB.height);

    canvas.width = width;
    canvas.height = height;

    const image1 = new Image();
    const image2 = new Image();

    let loadedCount = 0;
    const onImageLoad = () => {
      loadedCount++;
      if (loadedCount === 2) {
        processImages();
      }
    };

    image1.crossOrigin = "Anonymous";
    image2.crossOrigin = "Anonymous";

    image1.onload = onImageLoad;
    image2.onload = onImageLoad;
    image1.onerror = reject;
    image2.onerror = reject;

    image1.src = imgA.url;
    image2.src = imgB.url;

    function processImages() {
      ctx!.clearRect(0, 0, width, height);
      drawImageContain(ctx!, image1, width, height);
      const dataA = ctx!.getImageData(0, 0, width, height).data;

      ctx!.clearRect(0, 0, width, height);
      drawImageContain(ctx!, image2, width, height);
      const dataB = ctx!.getImageData(0, 0, width, height).data;

      const diffImageData = ctx!.createImageData(width, height);
      const diffData = diffImageData.data;

      for (let i = 0; i < dataA.length; i += 4) {
        const r1 = dataA[i];
        const g1 = dataA[i + 1];
        const b1 = dataA[i + 2];
        const a1 = dataA[i + 3];

        const r2 = dataB[i];
        const g2 = dataB[i + 1];
        const b2 = dataB[i + 2];
        const a2 = dataB[i + 3];

        if (a1 === 0 && a2 === 0) {
            diffData[i] = 0;
            diffData[i+1] = 0;
            diffData[i+2] = 0;
            diffData[i+3] = 255; 
        } else {
            const rDiff = Math.abs(r1 - r2);
            const gDiff = Math.abs(g1 - g2);
            const bDiff = Math.abs(b1 - b2);
            
            const totalDiff = rDiff + gDiff + bDiff;
            
            if (totalDiff > 10) { 
                 diffData[i] = rDiff + 100; 
                 diffData[i + 1] = gDiff;
                 diffData[i + 2] = bDiff;
                 diffData[i + 3] = 255;
            } else {
                 diffData[i] = 0;
                 diffData[i+1] = 0;
                 diffData[i+2] = 0;
                 diffData[i+3] = 255; 
            }
        }
      }

      ctx!.putImageData(diffImageData, 0, 0);
      resolve(canvas.toDataURL());
    }
  });
};

/**
 * Error Level Analysis (ELA)
 * Resaves the image at a lower quality (90%) and subtracts it from the original.
 * Differences are amplified to show compression artifacts.
 */
export const generateELA = async (img: ImageData, quality: number = 0.90, scale: number = 40): Promise<string> => {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "Anonymous";
    image.src = img.url;

    image.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject('No context'); return; }

      canvas.width = img.width;
      canvas.height = img.height;

      // 1. Draw Original
      ctx.drawImage(image, 0, 0);
      const originalData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      // 2. Re-compress via toDataURL
      const compressedUrl = canvas.toDataURL('image/jpeg', quality);
      
      const compressedImage = new Image();
      compressedImage.src = compressedUrl;
      compressedImage.onload = () => {
        // 3. Draw Compressed
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(compressedImage, 0, 0);
        const compressedData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        // 4. Calculate ELA (Difference * Scale)
        const output = ctx.createImageData(canvas.width, canvas.height);
        
        for (let i = 0; i < originalData.data.length; i += 4) {
          // Calculate absolute difference per channel
          const rDiff = Math.abs(originalData.data[i] - compressedData.data[i]);
          const gDiff = Math.abs(originalData.data[i+1] - compressedData.data[i+1]);
          const bDiff = Math.abs(originalData.data[i+2] - compressedData.data[i+2]);
          
          // Amplify
          output.data[i] = rDiff * scale;
          output.data[i+1] = gDiff * scale;
          output.data[i+2] = bDiff * scale;
          output.data[i+3] = 255;
        }

        ctx.putImageData(output, 0, 0);
        resolve(canvas.toDataURL());
      };
    };
    image.onerror = reject;
  });
};

function drawImageContain(ctx: CanvasRenderingContext2D, img: HTMLImageElement, targetW: number, targetH: number) {
  const scale = Math.min(targetW / img.width, targetH / img.height);
  const w = img.width * scale;
  const h = img.height * scale;
  const x = (targetW - w) / 2;
  const y = (targetH - h) / 2;
  ctx.drawImage(img, x, y, w, h);
}

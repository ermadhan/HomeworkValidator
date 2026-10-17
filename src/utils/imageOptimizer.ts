/**
 * Compresses and resizes high-resolution camera photos or scans in-browser
 * to ensure optimal resolution for Gemini Vision OCR while keeping payload
 * well within Nginx (32MB) and network limits.
 */
export async function optimizeImageForUpload(file: File, maxDimension = 2048, quality = 0.85): Promise<{ dataUrl: string; mimeType: string }> {
  // If it's a PDF, we can't resize with canvas - return as base64 data URL directly
  if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
    const dataUrl = await fileToDataUrl(file);
    return { dataUrl, mimeType: 'application/pdf' };
  }

  // If not an image, return raw
  if (!file.type.startsWith('image/')) {
    const dataUrl = await fileToDataUrl(file);
    return { dataUrl, mimeType: file.type || 'application/octet-stream' };
  }

  // If it's an image under 800KB and already small, read directly
  if (file.size < 800 * 1024) {
    const dataUrl = await fileToDataUrl(file);
    return { dataUrl, mimeType: file.type || 'image/png' };
  }

  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let { width, height } = img;

      // Scale down proportionally if larger than maxDimension
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        // Fallback to original if canvas context unavailable
        fileToDataUrl(file).then((dataUrl) => resolve({ dataUrl, mimeType: file.type || 'image/png' }));
        return;
      }

      // Draw with white background to handle transparency
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      // Use JPEG with high quality (0.85) for photographs, or PNG if small
      const targetMime = file.type === 'image/png' && file.size < 2 * 1024 * 1024 ? 'image/png' : 'image/jpeg';
      const compressedDataUrl = canvas.toDataURL(targetMime, quality);

      resolve({
        dataUrl: compressedDataUrl,
        mimeType: targetMime,
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      fileToDataUrl(file).then((dataUrl) => resolve({ dataUrl, mimeType: file.type || 'image/png' }));
    };

    img.src = objectUrl;
  });
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

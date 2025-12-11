/**
 * Compresses an image file to a small Base64 string (thumbnail).
 * This is crucial for performance when storing data in IndexedDB with many photos.
 * Resizes to a max size (default 150px) and quality (default 0.7 JPEG).
 */
export const compressImage = (file: File, maxSize: number = 150, quality: number = 0.7): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = maxSize;
        const MAX_HEIGHT = maxSize;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          // Export as JPEG with specified quality to save space
          resolve(canvas.toDataURL('image/jpeg', quality)); 
        } else {
          reject(new Error("Could not get canvas context"));
        }
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};

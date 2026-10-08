/**
 * Image Optimizer for KruuuuLove CMS
 * - Supports JPG, JPEG, PNG, WEBP
 * - Validates file types and sizes
 * - Client-side compression & dimension optimization using HTML5 Canvas
 * - Preserves aspect ratio and crispness while reducing multi-megabyte camera photos
 */

import { CMS_CONFIG } from './config.js';

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

/**
 * Validate an uploaded image file
 * @param {File} file
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateImageFile(file) {
  if (!file) {
    return { valid: false, error: 'Please choose an image file.' };
  }

  const extension = '.' + file.name.split('.').pop().toLowerCase();
  const isTypeAllowed = ALLOWED_TYPES.includes(file.type.toLowerCase()) || ALLOWED_EXTENSIONS.includes(extension);

  if (!isTypeAllowed) {
    return {
      valid: false,
      error: `Unsupported image format (${extension}). Please upload a JPG, JPEG, PNG, or WEBP image.`
    };
  }

  const maxBytes = CMS_CONFIG.maxFileSizeMB * 1024 * 1024;
  if (file.size > maxBytes) {
    return {
      valid: false,
      error: `The image is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Maximum allowed size is ${CMS_CONFIG.maxFileSizeMB}MB.`
    };
  }

  return { valid: true };
}

/**
 * Read a file as a Data URL for instant previews
 * @param {File|Blob} file
 * @returns {Promise<string>}
 */
export function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Compress and optimize an image file
 * @param {File} file
 * @param {object} options
 * @returns {Promise<{ blob: Blob, dataUrl: string, width: number, height: number, originalSize: number, optimizedSize: number, filename: string }>}
 */
export async function optimizeImage(file, options = {}) {
  const maxDimension = options.maxDimension || CMS_CONFIG.imageMaxDimension;
  const quality = options.quality || CMS_CONFIG.imageQuality;

  const dataUrl = await fileToDataUrl(file);

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;

      // Calculate new dimensions preserving aspect ratio
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
        reject(new Error('Canvas 2D context unavailable'));
        return;
      }

      // High-quality downsampling
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      // Determine output MIME type
      // Prefer WebP for optimal compression, fallback to JPEG
      const outputType = 'image/webp';

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            // Fallback to JPEG if WebP blob generation failed
            canvas.toBlob(
              (fallbackBlob) => {
                if (!fallbackBlob) {
                  reject(new Error('Failed to create image blob'));
                  return;
                }
                finish(fallbackBlob, 'image/jpeg', '.jpg');
              },
              'image/jpeg',
              quality
            );
            return;
          }
          finish(blob, outputType, '.webp');
        },
        outputType,
        quality
      );

      function finish(blob, mimeType, ext) {
        // If optimized blob is somehow larger than original, keep original file
        if (blob.size >= file.size && ALLOWED_TYPES.includes(file.type)) {
          resolve({
            blob: file,
            dataUrl,
            width: img.width,
            height: img.height,
            originalSize: file.size,
            optimizedSize: file.size,
            filename: file.name
          });
          return;
        }

        const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || 'memory';
        const newFilename = `${baseName}${ext}`;
        const optimizedDataUrl = canvas.toDataURL(mimeType, quality);

        resolve({
          blob,
          dataUrl: optimizedDataUrl,
          width,
          height,
          originalSize: file.size,
          optimizedSize: blob.size,
          filename: newFilename
        });
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to load image for processing'));
    };

    img.src = dataUrl;
  });
}

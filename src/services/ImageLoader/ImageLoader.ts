import default_url from '../../assets/default.jpg';

/** Size (square, px) of the preview thumbnail stored next to each recent image. */
export const THUMBNAIL_SIZE = 128;

/** Background of a thumbnail when the source has transparency. */
const THUMBNAIL_BACKDROP = '#0a0e16';

async function from_bitmap(blob: Blob): Promise<ImageLoader.LoadedImage> {
  const bitmap = await createImageBitmap(blob, { imageOrientation: 'from-image' });

  return { source: bitmap, width: bitmap.width, height: bitmap.height };
}

function from_element(blob: Blob): Promise<ImageLoader.LoadedImage> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const image = new Image();

    image.onload = () => {
      resolve({ source: image, width: image.naturalWidth, height: image.naturalHeight });
    };

    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('image decode failed'));
    };

    image.src = url;
  });
}

export class ImageLoader {
  static readonly default_url = default_url;

  static load_blob = async (blob: Blob): Promise<ImageLoader.LoadedImage> => {
    try {
      return await from_bitmap(blob);
    } catch {
      return await from_element(blob);
    }
  };

  // Small square cover-cropped preview used by the recent list, so drawing the row never decodes the
  // full-size image.
  static create_thumbnail = async (blob: Blob, size: number = THUMBNAIL_SIZE): Promise<Blob | null> => {
    try {
      const image = await ImageLoader.load_blob(blob);
      const canvas = document.createElement('canvas');

      canvas.width = size;
      canvas.height = size;

      const ctx = canvas.getContext('2d');

      if (!ctx) {
        return null;
      }

      ctx.fillStyle = THUMBNAIL_BACKDROP;
      ctx.fillRect(0, 0, size, size);

      const scale = Math.max(size / image.width, size / image.height);
      const width = image.width * scale;
      const height = image.height * scale;

      ctx.drawImage(image.source, (size - width) / 2, (size - height) / 2, width, height);

      return await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.82));
    } catch {
      return null;
    }
  };
}

export namespace ImageLoader {
  export type LoadedImage = {
    source: CanvasImageSource;
    width: number;
    height: number;
  };
}

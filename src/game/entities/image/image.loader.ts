import default_url from '../../../assets/default.png';

export const MAX_SOURCE_SIDE = 4096;

export const default_image_url = default_url;

export type LoadedImage = {
  source: CanvasImageSource;
  width: number;
  height: number;
};

const from_bitmap = async (blob: Blob): Promise<LoadedImage> => {
  const bitmap = await createImageBitmap(blob, { imageOrientation: 'from-image' });

  return { source: bitmap, width: bitmap.width, height: bitmap.height };
};

const from_element = (blob: Blob): Promise<LoadedImage> =>
  new Promise((resolve, reject) => {
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

export const load_image_blob = async (blob: Blob): Promise<LoadedImage> => {
  try {
    return await from_bitmap(blob);
  } catch {
    return await from_element(blob);
  }
};

export const downscale = async (loaded: LoadedImage, max_side: number): Promise<LoadedImage> => {
  const longest = Math.max(loaded.width, loaded.height);

  if (longest <= max_side) {
    return loaded;
  }

  const scale = max_side / longest;
  const width = Math.max(1, Math.round(loaded.width * scale));
  const height = Math.max(1, Math.round(loaded.height * scale));

  try {
    const bitmap = await createImageBitmap(loaded.source, {
      resizeWidth: width,
      resizeHeight: height,
      resizeQuality: 'high',
    });

    return { source: bitmap, width, height };
  } catch {
    return loaded;
  }
};

export const load_image_file = async (file: File): Promise<LoadedImage> => {
  const loaded = await load_image_blob(file);

  return downscale(loaded, MAX_SOURCE_SIDE);
};

export const load_default_image = (): Promise<LoadedImage> =>
  new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => {
      resolve({ source: image, width: image.naturalWidth, height: image.naturalHeight });
    };

    image.onerror = () => reject(new Error('default image failed'));

    image.src = default_url;
  });

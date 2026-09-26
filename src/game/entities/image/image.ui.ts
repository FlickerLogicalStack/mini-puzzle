import { load_image_file, type LoadedImage } from './image.loader';

export const mount_image_input = (on_image: (image: LoadedImage) => void) => {
  const handle = async (file: File) => {
    try {
      on_image(await load_image_file(file));
    } catch {
      const status = document.querySelector<HTMLElement>('#controls-status');

      if (status) {
        status.textContent = 'unsupported image';
      }
    }
  };

  const input = document.querySelector<HTMLInputElement>('#controls-file');

  input?.addEventListener('change', () => {
    const file = input.files?.[0];

    if (file) {
      void handle(file);
    }
  });

  window.addEventListener('dragover', event => {
    event.preventDefault();
  });

  window.addEventListener('drop', event => {
    event.preventDefault();

    const file = event.dataTransfer?.files?.[0];

    if (file) {
      void handle(file);
    }
  });

  window.addEventListener('paste', event => {
    const item = Array.from(event.clipboardData?.items ?? []).find(entry => entry.type.startsWith('image/'));
    const file = item?.getAsFile();

    if (file) {
      void handle(file);
    }
  });
};

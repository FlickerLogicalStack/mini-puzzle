import { watch } from 'fs';
import { join } from 'path';

import { build } from './build';

const rebuild = async () => {
  try {
    await build();
    console.log('[watch] build ok');
  } catch (error) {
    console.error('[watch] build failed');
    console.error(error);
  }
};

await rebuild();

watch(join(import.meta.dir, 'src'), { recursive: true }, () => {
  void rebuild();
});

await import('./serve');

import { build as bun_build, fileURLToPath } from 'bun';
import { mkdir, readFile, rm, writeFile } from 'fs/promises';
import { join } from 'path';

const OUTDIR = 'docs';
const ENTRY = join('src', 'index.html');

const escape_script = (js: string) => js.replaceAll('</script', '<\\/script');

export const build = async () => {
  await rm(OUTDIR, { recursive: true, force: true });
  await mkdir(OUTDIR, { recursive: true });

  const result = await bun_build({
    entrypoints: [ENTRY],
    outdir: OUTDIR,
    target: 'browser',
    minify: true,
    naming: { asset: '[name].[ext]' },
  });

  if (!result.success) {
    for (const log of result.logs) {
      console.error(log);
    }

    throw new Error('build failed');
  }

  const js = result.outputs.find(output => output.path.endsWith('.js'));
  const css = result.outputs.find(output => output.path.endsWith('.css'));

  if (!js) {
    throw new Error('no js output');
  }

  const html_path = join(OUTDIR, 'index.html');
  let html = await readFile(html_path, 'utf8');

  if (css) {
    const style = (await css.text()).trim();

    html = html.replace(/<link[^>]*rel="stylesheet"[^>]*>/, () => `<style>${style}</style>`);
  }

  const script = escape_script((await js.text()).trim());

  html = html.replace(/<script[^>]*src="[^"]+\.js"[^>]*><\/script>/, () => `<script type="module">${script}</script>`);

  await writeFile(html_path, html);

  await rm(js.path, { force: true });

  if (css) {
    await rm(css.path, { force: true });
  }

  await writeFile(join(OUTDIR, '.nojekyll'), '');

  return result;
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await build();
}

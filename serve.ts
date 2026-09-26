import { file } from 'bun';
import { join, sep } from 'path';

const PORT = Number(process.env.PORT ?? 3000);
const ROOT = join(import.meta.dir, 'docs');

const MIME: Record<string, string> = {
  html: 'text/html; charset=utf-8',
  js: 'application/javascript',
  css: 'text/css',
  json: 'application/json',
  ico: 'image/x-icon',
  png: 'image/png',
  svg: 'image/svg+xml',
  txt: 'text/plain',
};

const server = Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);
    let pathname = decodeURIComponent(url.pathname);

    if (pathname.endsWith('/')) {
      pathname += 'index.html';
    }

    const file_path = join(ROOT, pathname);

    if (!file_path.startsWith(ROOT.endsWith(sep) ? ROOT : ROOT + sep)) {
      return new Response('Not Found', { status: 404 });
    }

    const entry = file(file_path);

    if (!(await entry.exists())) {
      return new Response('Not Found', { status: 404 });
    }

    const extension = pathname.split('.').pop()?.toLowerCase() ?? '';

    return new Response(entry, {
      headers: { 'Content-Type': MIME[extension] ?? 'application/octet-stream' },
    });
  },
});

console.log(`preview http://localhost:${server.port}`);

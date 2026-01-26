const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 8080;
const HOST = process.env.HOST || '127.0.0.1';

// Serve the eon.battlecell.io directory as the web root
const rootDir = path.resolve(__dirname, '..', 'eon.battlecell.io');

const mimeTypes = {
  '.html': 'text/html; charset=UTF-8',
  '.htm': 'text/html; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.mjs': 'application/javascript; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.map': 'application/json; charset=UTF-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.cur': 'image/x-icon',
  '.webp': 'image/webp',
  '.txt': 'text/plain; charset=UTF-8',
  '.wasm': 'application/wasm',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.eot': 'application/vnd.ms-fontobject'
};

function safeJoin(base, target) {
  const targetPath = path.resolve(base, target);
  if (!targetPath.startsWith(base)) {
    return base; // directory traversal safeguard
  }
  return targetPath;
}

function send(res, status, headers, body) {
  res.writeHead(status, headers);
  if (body) res.end(body);
  else res.end();
}

const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
  let filePath = urlPath;

  if (filePath === '/' || filePath === '') {
    filePath = '/index.html';
  }

  const absPath = safeJoin(rootDir, filePath);
  fs.stat(absPath, (err, stats) => {
    if (err) {
      // Try SPA-style fallback to index.html for unknown paths
      const fallbackPath = path.join(rootDir, 'index.html');
      fs.readFile(fallbackPath, (errIdx, idxData) => {
        if (errIdx) {
          return send(res, 404, { 'Content-Type': 'text/plain; charset=UTF-8', 'Cache-Control': 'no-store' }, 'Not Found');
        }
        return send(res, 200, { 'Content-Type': 'text/html; charset=UTF-8', 'Cache-Control': 'no-store' }, idxData);
      });
      return;
    }

    if (stats.isDirectory()) {
      const indexPath = path.join(absPath, 'index.html');
      fs.readFile(indexPath, (idxErr, idxData) => {
        if (idxErr) {
          return send(res, 403, { 'Content-Type': 'text/plain; charset=UTF-8', 'Cache-Control': 'no-store' }, 'Forbidden');
        }
        return send(res, 200, { 'Content-Type': 'text/html; charset=UTF-8', 'Cache-Control': 'no-store' }, idxData);
      });
      return;
    }

    const ext = path.extname(absPath).toLowerCase();
    const contentType = mimeTypes[ext] || 'application/octet-stream';
    const headers = { 'Content-Type': contentType, 'Cache-Control': 'no-store' };

    const stream = fs.createReadStream(absPath);
    stream.on('open', () => {
      res.writeHead(200, headers);
      stream.pipe(res);
    });
    stream.on('error', () => {
      send(res, 500, { 'Content-Type': 'text/plain; charset=UTF-8', 'Cache-Control': 'no-store' }, 'Internal Server Error');
    });
  });
});

server.listen(PORT, HOST, () => {
  console.log(`Local server running at http://${HOST}:${PORT}`);
  console.log(`Serving directory: ${rootDir}`);
});

#!/usr/bin/env node
/**
 * Simple local HTTP server for the configurator
 * Serves index.html on http://localhost:3000 to avoid mixed content issues
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3001;
const HOST = 'localhost';
const ROOT = path.join(__dirname, '..');

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.css': 'text/css'
};

const server = http.createServer((req, res) => {
  let filePath = path.join(ROOT, req.url === '/' ? 'index.html' : req.url);
  
  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404);
        res.end('404 Not Found');
      } else {
        res.writeHead(500);
        res.end('500 Internal Server Error');
      }
      return;
    }
    
    const ext = path.extname(filePath);
    const contentType = MIME_TYPES[ext] || 'text/plain';
    
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  });
});

server.listen(PORT, HOST, () => {
  console.log(`\n╔═══════════════════════════════════════════════════════╗`);
  console.log(`║     Otto QA Configurator - Local HTTP Server         ║`);
  console.log(`╚═══════════════════════════════════════════════════════╝\n`);
  console.log(`🌐 Configurator running at: http://${HOST}:${PORT}`);
  console.log(`📝 This local HTTP server avoids mixed content issues\n`);
  console.log(`💡 Tip: Start the companion in another terminal:`);
  console.log(`   npm run companion\n`);
  console.log(`Press Ctrl+C to stop\n`);
});

process.on('SIGINT', () => {
  console.log('\n\n👋 Server stopped');
  process.exit(0);
});

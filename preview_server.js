const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8080;

function processIncludes(content) {
  return content
    .replace(/<\?!=\s*include\(['"](.*?)['"]\);?\s*\?>/g, (match, filename) => {
      const filePath = path.join(__dirname, filename + '.html');
      if (fs.existsSync(filePath)) {
        return processIncludes(fs.readFileSync(filePath, 'utf8'));
      }
      return '';
    })
    .replace(/<\?=\s*baseUrl\s*\?>/g, '#')
    .replace(/<\?=\s*\(paginaActiva === 'mapa3d'\) \? 'active' : ''\s*\?>/g, 'active')
    .replace(/<\?=\s*\(paginaActiva === '.*?'\) \? 'active' : ''\s*\?>/g, '')
    .replace(/<\?\s*if\s*\(usuarioEsSupervisor\)\s*\{\s*\?>([\s\S]*?)<\?\s*\}\s*\?>/g, '$1');
}

const server = http.createServer((req, res) => {
  try {
    const rawHtml = fs.readFileSync(path.join(__dirname, 'Mapa3D.html'), 'utf8');
    const processedHtml = processIncludes(rawHtml);
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(processedHtml);
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Error al procesar la vista previa: ' + err.message);
  }
});

server.listen(PORT, () => {
  console.log(`🌐 Servidor de Vista Previa 3D activo en: http://localhost:${PORT}`);
  console.log('Abre la URL en tu navegador para interactuar con el Mapa 3D.');
});

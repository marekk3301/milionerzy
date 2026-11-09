/**
 * Simple zero-dependency HTTP server to serve Milionerzy locally
 * Run with: node server.js
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
    let reqUrl = req.url.split('?')[0];

    // API: Check local server availability
    if (reqUrl === '/api/check') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok', server: 'local' }));
        return;
    }

    // API: Save questions directly to disk
    if (reqUrl === '/api/save-questions' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                const payload = JSON.parse(body);
                if (!payload || !Array.isArray(payload.pytania)) {
                    throw new Error('Niepoprawny format danych (oczekiwano tablicy pytania).');
                }

                const jsonPath = path.join(__dirname, 'milionerzy.json');
                const jsPath = path.join(__dirname, 'milionerzy_data.js');

                let baseData = {};
                try {
                    baseData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
                } catch (e) {
                    baseData = {};
                }

                baseData.liczba_pytan = payload.pytania.length;
                baseData.pytania = payload.pytania;

                const jsonFormatted = JSON.stringify(baseData, null, 2);
                fs.writeFileSync(jsonPath, jsonFormatted, 'utf8');
                fs.writeFileSync(jsPath, 'window.MILIONERZY_DATA = ' + jsonFormatted + ';', 'utf8');

                console.log(`[API] Pomyślnie zaktualizowano bazę: ${payload.pytania.length} pytań zapisanych na dysku.`);

                res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify({ success: true, count: payload.pytania.length }));
            } catch (err) {
                console.error('[API Błąd]', err.message);
                res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify({ success: false, error: err.message }));
            }
        });
        return;
    }

    if (reqUrl === '/') reqUrl = '/index.html';

    const safePath = path.normalize(decodeURIComponent(reqUrl)).replace(/^(\.\.[\/\\])+/, '');
    const filePath = path.join(__dirname, safePath);

    fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('404 Not Found');
            return;
        }

        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';

        res.writeHead(200, {
            'Content-Type': contentType,
            'Cache-Control': 'no-cache'
        });

        const stream = fs.createReadStream(filePath);
        stream.pipe(res);
    });
});

server.listen(PORT, () => {
    console.log(`=========================================`);
    console.log(`  MILIONERZY serwer uruchomiony!`);
    console.log(`  Otwórz w przeglądarce: http://localhost:${PORT}`);
    console.log(`=========================================`);
});

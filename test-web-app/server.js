const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
    let filePath = '';
    
    if (req.url === '/' || req.url === '/enhanced') {
        filePath = path.join(__dirname, 'enhanced-app.html');
    } else if (req.url === '/simple') {
        filePath = path.join(__dirname, 'index.html');
    } else {
        res.writeHead(404);
        res.end(`
            <h1>ReguRoute Test Apps</h1>
            <p><a href="/">Enhanced App (Recommended)</a> - Full mobile-like interface</p>
            <p><a href="/simple">Simple App</a> - Basic testing interface</p>
        `);
        return;
    }
    
    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(500);
            res.end('Error loading page');
            return;
        }
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(data);
    });
});

const port = 8091;
server.listen(port, () => {
    console.log(`🌐 Test web app running at: http://localhost:${port}`);
    console.log('📱 Open this URL in your browser to test ReguRoute functionality');
});
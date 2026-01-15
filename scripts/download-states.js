const https = require('https');
const fs = require('fs');
const path = require('path');

const url = 'https://raw.githubusercontent.com/PublicaMundi/MappingAPI/master/data/geojson/us-states.json';
const dest = path.join(__dirname, '../data/raw/us-states.json');
const logFile = path.join(__dirname, '../download.log');

function log(message) {
	fs.appendFileSync(logFile, `[${new Date().toISOString()}] ${message}\n`);
}

log(`Starting download of ${url} to ${dest}...`);

const file = fs.createWriteStream(dest);

https.get(url, (response) => {
	if (response.statusCode !== 200) {
		log(`Failed to download: ${response.statusCode}`);
		return;
	}

	response.pipe(file);

	file.on('finish', () => {
		file.close(() => {
			log('Download completed successfully.');
		});
	});
}).on('error', (err) => {
	fs.unlink(dest, () => { });
	log(`Error downloading file: ${err.message}`);
});

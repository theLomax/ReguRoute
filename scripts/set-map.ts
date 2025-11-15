import https from 'https';
import fs from 'fs/promises';
import path from 'path';
import { pipeline } from 'stream/promises';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ORS_DATA_DIR = path.join(__dirname, '..', 'ors', 'data');
/**
 * Clears any existing .osm.pbf files from the ORS data directory.
 */
async function cleanDataDirectory() {
	console.log(`Cleaning directory: ${ORS_DATA_DIR}`);
	try {
		const files = await fs.readdir(ORS_DATA_DIR);
		for (const file of files) {
			if (file.endsWith('.osm.pbf')) {
				const filePath = path.join(ORS_DATA_DIR, file);
				console.log(`- Removing old map file: ${file}`);
				await fs.unlink(filePath);
			}
		}
	} catch (error: any) {
		if (error.code === 'ENOENT') {
			console.log('Data directory does not exist, will be created.');
		} else {
			throw error;
		}
	}
}

/**
 * Downloads a map file for a given state and saves it to the ORS data directory.
 * @param {string} state - The name of the state (e.g., 'delaware', 'colorado').
 */
async function downloadMap(state: string) {
	const fileName = `${state}-latest.osm.pbf`;
	const url = `https://download.geofabrik.de/north-america/us/${fileName}`;
	const destinationPath = path.join(ORS_DATA_DIR, fileName);

	console.log(`\nDownloading map for '${state}'...`);
	console.log(`Source: ${url}`);

	await fs.mkdir(ORS_DATA_DIR, { recursive: true });

	const response: https.IncomingMessage = await new Promise((resolve, reject) => {
		https.get(url, (res) => {
			if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
				// Handle redirects
				https.get(res.headers.location, resolve).on('error', reject);
			} else {
				resolve(res);
			}
		}).on('error', reject);
	});

	if (response.statusCode !== 200) {
		throw new Error(`Failed to download file. Status Code: ${response.statusCode}`);
	}

	await pipeline(response, fs.createWriteStream(destinationPath) as any);
	console.log(`\n✅ Map download complete!`);
	console.log(`Saved to: ${destinationPath}`);
}

(async () => {
	const state = process.argv[2];
	if (!state) {
		console.error('❌ Error: Please provide a state name as an argument.');
		console.log('Example: pnpm set-map delaware');
		process.exit(1);
	}

	try {
		await cleanDataDirectory();
		await downloadMap(state);
		console.log('\nReady to run `docker-compose up --build`');
	} catch (error: any) {
		console.error(`\n🔥 An error occurred: ${error.message}`);
		process.exit(1);
	}
})();

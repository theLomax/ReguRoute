
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const client = new Client({
	user: 'postgres',
	host: 'db',
	database: 'reguroute',
	password: 'postgres',
	port: 5432,
});

async function check() {
	try {
		await client.connect();
		const res = await client.query("SELECT count(*) as total, count(geometry) as with_geom FROM jurisdictions WHERE type='state'");

		const output = {
			timestamp: new Date().toISOString(),
			result: res.rows[0]
		};

		console.log(output);
		fs.writeFileSync(path.join(__dirname, 'db-result.json'), JSON.stringify(output, null, 2));
	} catch (err) {
		fs.writeFileSync(path.join(__dirname, 'db-result.json'), JSON.stringify({ error: err.message }, null, 2));
	} finally {
		await client.end();
	}
}

check();

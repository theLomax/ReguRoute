const http = require('http');

const data = JSON.stringify({
	origin: { lat: 39.9526, lng: -75.1652 }, // Philadelphia
	destination: { lat: 42.3601, lng: -71.0589 }, // Boston
	cargo_profile: {
		has_firearms: false,
		ammunition_capacity: 0,
		firearm_platforms: [],
		has_concealed_carry_permit: false,
		permit_states: [],
		max_ammunition_capacity_by_platform: {},
		has_nfa_items: false,
		nfa_subtypes: [],
		has_handgun: false,
		has_rifle: false,
		has_shotgun: false,
		has_suppressor: false,
		has_sbr: false,
		has_sbs: false
	}
});

const options = {
	hostname: 'localhost',
	port: 3000,
	path: '/calculate',
	method: 'POST',
	headers: {
		'Content-Type': 'application/json',
		'Content-Length': data.length
	}
};

console.log('Testing Route Calculation with Regulation Analysis...');

const req = http.request(options, (res) => {
	let responseData = '';

	res.on('data', (chunk) => {
		responseData += chunk;
	});

	res.on('end', () => {
		if (res.statusCode >= 200 && res.statusCode < 300) {
			try {
				const json = JSON.parse(responseData);
				console.log('\n--- Result ---');
				if (json.analysis) {
					console.log('✅ Analysis Object Present');
					console.log('Jurisdictions Crossed:', json.analysis.jurisdictions_crossed);
					console.log('Alerts:', JSON.stringify(json.analysis.alerts, null, 2));
				} else {
					console.log('❌ Analysis Object MISSING in response');
					console.log('Response keys:', Object.keys(json));
				}
			} catch (e) {
				console.error('Error parsing JSON:', e);
				console.log('Raw response:', responseData);
			}
		} else {
			console.error(`Request failed with status: ${res.statusCode}`);
			console.error('Body:', responseData);
		}
	});
});

req.on('error', (error) => {
	console.error('Error running test:', error);
});

req.write(data);
req.end();

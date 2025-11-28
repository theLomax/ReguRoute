/**
 * Seed Test Equipment Data
 * Inserts test equipment items into the database via the API
 */

import { testEquipment } from './test-equipment-ny-compliance';

const API_URL = 'http://localhost:3000';
const TEST_USER_EMAIL = 'test@example.com';
const TEST_USER_PASSWORD = 'password123';

interface LoginResponse {
	user: { id: string; email: string };
	token: string;
}

interface CreateEquipmentResponse {
	item: {
		id: string;
		name: string;
		category: string;
	};
}

/**
 * Login and get auth token
 */
async function login(): Promise<string> {
	const response = await fetch(`${API_URL}/auth/login`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			email: TEST_USER_EMAIL,
			password: TEST_USER_PASSWORD,
		}),
	});

	if (!response.ok) {
		throw new Error(`Login failed: ${response.statusText}`);
	}

	const data: LoginResponse = await response.json();
	return data.token;
}

/**
 * Create equipment item
 */
async function createEquipmentItem(token: string, equipment: any): Promise<void> {
	const response = await fetch(`${API_URL}/equipment-items`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${token}`,
		},
		body: JSON.stringify(equipment),
	});

	if (!response.ok) {
		const error = await response.text();
		console.error(`Failed to create ${equipment.name}: ${error}`);
		return;
	}

	const data: CreateEquipmentResponse = await response.json();
	console.log(`✓ Created: ${data.item.name} (${data.item.category})`);
}

/**
 * Main seeding function
 */
async function seedTestEquipment() {
	console.log('========================================');
	console.log('Seeding Test Equipment Data');
	console.log('========================================\n');

	try {
		// Login
		console.log(`Logging in as ${TEST_USER_EMAIL}...`);
		const token = await login();
		console.log('✓ Login successful\n');

		// Seed compliant firearms
		console.log('Creating compliant firearms...');
		console.log('─'.repeat(60));
		for (const [key, equipment] of Object.entries(testEquipment.compliant)) {
			await createEquipmentItem(token, equipment);
		}

		console.log('\nCreating non-compliant firearms...');
		console.log('─'.repeat(60));
		for (const [key, equipment] of Object.entries(testEquipment.non_compliant)) {
			await createEquipmentItem(token, equipment);
		}

		console.log('\nCreating edge case firearms...');
		console.log('─'.repeat(60));
		for (const [key, equipment] of Object.entries(testEquipment.edge_cases)) {
			await createEquipmentItem(token, equipment);
		}

		console.log('\n========================================');
		console.log('Seeding Complete!');
		console.log('========================================');
		console.log(
			`Total items: ${Object.keys(testEquipment.compliant).length + Object.keys(testEquipment.non_compliant).length + Object.keys(testEquipment.edge_cases).length}`,
		);
	} catch (error) {
		console.error('\n✗ Error:', error instanceof Error ? error.message : error);
		process.exit(1);
	}
}

// Run the seeding
seedTestEquipment();

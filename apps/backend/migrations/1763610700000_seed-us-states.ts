import { ColumnDefinitions, MigrationBuilder } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

// US States with FIPS codes
const US_STATES = [
	{ name: 'Alabama', postal_code: 'AL', fips_code: '01' },
	{ name: 'Alaska', postal_code: 'AK', fips_code: '02' },
	{ name: 'Arizona', postal_code: 'AZ', fips_code: '04' },
	{ name: 'Arkansas', postal_code: 'AR', fips_code: '05' },
	{ name: 'California', postal_code: 'CA', fips_code: '06' },
	{ name: 'Colorado', postal_code: 'CO', fips_code: '08' },
	{ name: 'Connecticut', postal_code: 'CT', fips_code: '09' },
	{ name: 'Delaware', postal_code: 'DE', fips_code: '10' },
	{ name: 'Florida', postal_code: 'FL', fips_code: '12' },
	{ name: 'Georgia', postal_code: 'GA', fips_code: '13' },
	{ name: 'Hawaii', postal_code: 'HI', fips_code: '15' },
	{ name: 'Idaho', postal_code: 'ID', fips_code: '16' },
	{ name: 'Illinois', postal_code: 'IL', fips_code: '17' },
	{ name: 'Indiana', postal_code: 'IN', fips_code: '18' },
	{ name: 'Iowa', postal_code: 'IA', fips_code: '19' },
	{ name: 'Kansas', postal_code: 'KS', fips_code: '20' },
	{ name: 'Kentucky', postal_code: 'KY', fips_code: '21' },
	{ name: 'Louisiana', postal_code: 'LA', fips_code: '22' },
	{ name: 'Maine', postal_code: 'ME', fips_code: '23' },
	{ name: 'Maryland', postal_code: 'MD', fips_code: '24' },
	{ name: 'Massachusetts', postal_code: 'MA', fips_code: '25' },
	{ name: 'Michigan', postal_code: 'MI', fips_code: '26' },
	{ name: 'Minnesota', postal_code: 'MN', fips_code: '27' },
	{ name: 'Mississippi', postal_code: 'MS', fips_code: '28' },
	{ name: 'Missouri', postal_code: 'MO', fips_code: '29' },
	{ name: 'Montana', postal_code: 'MT', fips_code: '30' },
	{ name: 'Nebraska', postal_code: 'NE', fips_code: '31' },
	{ name: 'Nevada', postal_code: 'NV', fips_code: '32' },
	{ name: 'New Hampshire', postal_code: 'NH', fips_code: '33' },
	{ name: 'New Jersey', postal_code: 'NJ', fips_code: '34' },
	{ name: 'New Mexico', postal_code: 'NM', fips_code: '35' },
	{ name: 'New York', postal_code: 'NY', fips_code: '36' },
	{ name: 'North Carolina', postal_code: 'NC', fips_code: '37' },
	{ name: 'North Dakota', postal_code: 'ND', fips_code: '38' },
	{ name: 'Ohio', postal_code: 'OH', fips_code: '39' },
	{ name: 'Oklahoma', postal_code: 'OK', fips_code: '40' },
	{ name: 'Oregon', postal_code: 'OR', fips_code: '41' },
	{ name: 'Pennsylvania', postal_code: 'PA', fips_code: '42' },
	{ name: 'Rhode Island', postal_code: 'RI', fips_code: '44' },
	{ name: 'South Carolina', postal_code: 'SC', fips_code: '45' },
	{ name: 'South Dakota', postal_code: 'SD', fips_code: '46' },
	{ name: 'Tennessee', postal_code: 'TN', fips_code: '47' },
	{ name: 'Texas', postal_code: 'TX', fips_code: '48' },
	{ name: 'Utah', postal_code: 'UT', fips_code: '49' },
	{ name: 'Vermont', postal_code: 'VT', fips_code: '50' },
	{ name: 'Virginia', postal_code: 'VA', fips_code: '51' },
	{ name: 'Washington', postal_code: 'WA', fips_code: '53' },
	{ name: 'West Virginia', postal_code: 'WV', fips_code: '54' },
	{ name: 'Wisconsin', postal_code: 'WI', fips_code: '55' },
	{ name: 'Wyoming', postal_code: 'WY', fips_code: '56' },
	// District of Columbia (treated as state-level for regulations)
	{ name: 'District of Columbia', postal_code: 'DC', fips_code: '11' },
];

export async function up(pgm: MigrationBuilder): Promise<void> {
	// Insert all US states
	for (const state of US_STATES) {
		pgm.sql(`
			INSERT INTO jurisdictions (type, name, postal_code, fips_code)
			VALUES ('state', '${state.name}', '${state.postal_code}', '${state.fips_code}');
		`);
	}
}

export async function down(pgm: MigrationBuilder): Promise<void> {
	// Remove all seeded states
	pgm.sql(`DELETE FROM jurisdictions WHERE type = 'state';`);
}

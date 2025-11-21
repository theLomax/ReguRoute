import { ColumnDefinitions, MigrationBuilder } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
	// Create enum for jurisdiction types (start with state, expand later)
	pgm.createType('jurisdiction_type', ['state', 'county', 'city']);

	pgm.createTable('jurisdictions', {
		id: {
			type: 'uuid',
			primaryKey: true,
			default: pgm.func('gen_random_uuid()'),
		},
		type: { type: 'jurisdiction_type', notNull: true },
		name: { type: 'varchar(255)', notNull: true },
		postal_code: { type: 'varchar(2)' }, // State abbreviation (e.g., 'NY')
		fips_code: { type: 'varchar(10)' }, // FIPS code for geographic identification
		parent_id: {
			type: 'uuid',
			references: 'jurisdictions',
			onDelete: 'CASCADE',
		}, // For city->county->state hierarchy
		// PostGIS geometry column for boundary polygons (added later via raw SQL)
		// geometry: geometry(MultiPolygon, 4326)
		created_at: {
			type: 'timestamp',
			notNull: true,
			default: pgm.func('current_timestamp'),
		},
		updated_at: {
			type: 'timestamp',
			notNull: true,
			default: pgm.func('current_timestamp'),
		},
	});

	// Add PostGIS geometry column for jurisdiction boundaries
	pgm.sql(`
		ALTER TABLE jurisdictions
		ADD COLUMN geometry geometry(MultiPolygon, 4326);
	`);

	// Create indexes for common queries
	pgm.createIndex('jurisdictions', 'type');
	pgm.createIndex('jurisdictions', 'postal_code');
	pgm.createIndex('jurisdictions', 'fips_code');
	pgm.createIndex('jurisdictions', 'parent_id');

	// Spatial index for geometry lookups (point-in-polygon queries)
	pgm.sql(`
		CREATE INDEX jurisdictions_geometry_idx
		ON jurisdictions USING GIST (geometry);
	`);

	// Unique constraint: one jurisdiction per type+name+parent combination
	pgm.addConstraint('jurisdictions', 'jurisdictions_unique_name', {
		unique: ['type', 'name', 'parent_id'],
	});
}

export async function down(pgm: MigrationBuilder): Promise<void> {
	pgm.dropTable('jurisdictions');
	pgm.dropType('jurisdiction_type');
}

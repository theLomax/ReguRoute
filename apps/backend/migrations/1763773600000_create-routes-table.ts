import { ColumnDefinitions, MigrationBuilder } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
	pgm.createTable('routes', {
		id: {
			type: 'uuid',
			primaryKey: true,
			default: pgm.func('gen_random_uuid()'),
		},
		user_id: {
			type: 'uuid',
			notNull: true,
			references: 'users',
			onDelete: 'CASCADE',
		},
		name: { type: 'varchar(255)', notNull: true },
		origin_name: { type: 'varchar(255)', notNull: true },
		origin_lat: { type: 'decimal(10, 7)', notNull: true },
		origin_lng: { type: 'decimal(10, 7)', notNull: true },
		destination_name: { type: 'varchar(255)', notNull: true },
		destination_lat: { type: 'decimal(10, 7)', notNull: true },
		destination_lng: { type: 'decimal(10, 7)', notNull: true },
		// Store waypoints as JSONB array: [{name, lat, lng}, ...]
		waypoints: { type: 'jsonb', default: '[]' },
		// Store the full route geometry from ORS as GeoJSON
		route_geometry: { type: 'jsonb' },
		// Store route metadata (distance, duration, etc.)
		route_metadata: { type: 'jsonb' },
		// Store cargo profile used for this route
		cargo_profile: { type: 'jsonb' },
		// Store regulation warnings/alerts for this route
		regulation_alerts: { type: 'jsonb', default: '[]' },
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

	// Index for querying user's routes
	pgm.createIndex('routes', 'user_id');

	// Index for sorting by creation date
	pgm.createIndex('routes', 'created_at');
}

export async function down(pgm: MigrationBuilder): Promise<void> {
	pgm.dropTable('routes');
}

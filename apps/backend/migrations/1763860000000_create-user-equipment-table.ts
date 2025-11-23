import { ColumnDefinitions, MigrationBuilder } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
	pgm.createTable('user_equipment', {
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
		// User-friendly name for this equipment preset (e.g., "Range Day Kit", "Hunting Trip")
		name: { type: 'varchar(255)', notNull: true },
		// Description of what this preset includes
		description: { type: 'text' },
		// The cargo profile for this equipment preset
		cargo_profile: { type: 'jsonb', notNull: true },
		// Whether this is the user's default equipment selection
		is_default: { type: 'boolean', notNull: true, default: false },
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

	// Index for querying user's equipment presets
	pgm.createIndex('user_equipment', 'user_id');

	// Unique constraint: user can only have one preset with a given name
	pgm.createIndex('user_equipment', ['user_id', 'name'], { unique: true });

	// Partial unique index: only one default per user
	pgm.sql(`
		CREATE UNIQUE INDEX user_equipment_single_default
		ON user_equipment (user_id)
		WHERE is_default = true
	`);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
	pgm.dropTable('user_equipment');
}

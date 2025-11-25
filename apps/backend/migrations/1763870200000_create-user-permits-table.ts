import { ColumnDefinitions, MigrationBuilder } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
	// Create enum for permit types
	pgm.createType('permit_type', ['ccw', 'ltc', 'chl']);

	// User permits table - CCW permits separate from equipment
	pgm.createTable('user_permits', {
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
		// Type of permit (CCW, LTC, CHL - varies by state terminology)
		permit_type: { type: 'permit_type', notNull: true },
		// State that issued the permit (postal code)
		issuing_state: { type: 'varchar(2)', notNull: true },
		// When the permit was issued
		issue_date: { type: 'date' },
		// When the permit expires
		expiration_date: { type: 'date' },
		// Whether the permit is currently active/valid
		is_active: { type: 'boolean', notNull: true, default: true },
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

	// Index for querying user's permits
	pgm.createIndex('user_permits', 'user_id');

	// Index for filtering by issuing state
	pgm.createIndex('user_permits', 'issuing_state');

	// Index for filtering active permits
	pgm.createIndex('user_permits', 'is_active');

	// Unique constraint: user can only have one permit of each type per state
	pgm.createIndex('user_permits', ['user_id', 'permit_type', 'issuing_state'], { unique: true });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
	pgm.dropTable('user_permits');
	pgm.dropType('permit_type');
}

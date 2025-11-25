import { ColumnDefinitions, MigrationBuilder } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
	// Loadouts table - named collections of equipment items
	pgm.createTable('loadouts', {
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
		// User-friendly name (e.g., "Range Day Kit", "Hunting Trip", "Competition Setup")
		name: { type: 'varchar(255)', notNull: true },
		// Description of what this loadout is for
		description: { type: 'text' },
		// Whether this is the user's default loadout selection
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

	// Index for querying user's loadouts
	pgm.createIndex('loadouts', 'user_id');

	// Unique constraint: user can only have one loadout with a given name
	pgm.createIndex('loadouts', ['user_id', 'name'], { unique: true });

	// Partial unique index: only one default per user
	pgm.sql(`
		CREATE UNIQUE INDEX loadouts_single_default
		ON loadouts (user_id)
		WHERE is_default = true
	`);

	// Junction table for loadout items (many-to-many)
	pgm.createTable('loadout_items', {
		id: {
			type: 'uuid',
			primaryKey: true,
			default: pgm.func('gen_random_uuid()'),
		},
		loadout_id: {
			type: 'uuid',
			notNull: true,
			references: 'loadouts',
			onDelete: 'CASCADE',
		},
		equipment_item_id: {
			type: 'uuid',
			notNull: true,
			references: 'equipment_items',
			onDelete: 'CASCADE',
		},
		// Quantity of this item in the loadout (default 1)
		quantity: { type: 'smallint', notNull: true, default: 1 },
		created_at: {
			type: 'timestamp',
			notNull: true,
			default: pgm.func('current_timestamp'),
		},
	});

	// Index for querying items in a loadout
	pgm.createIndex('loadout_items', 'loadout_id');

	// Index for finding which loadouts contain an item
	pgm.createIndex('loadout_items', 'equipment_item_id');

	// Unique constraint: same item can only be in a loadout once (use quantity for multiples)
	pgm.createIndex('loadout_items', ['loadout_id', 'equipment_item_id'], { unique: true });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
	pgm.dropTable('loadout_items');
	pgm.dropTable('loadouts');
}

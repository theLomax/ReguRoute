import { ColumnDefinitions, MigrationBuilder } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
	// Create enum for equipment item categories
	pgm.createType('equipment_item_category', [
		'handgun',
		'rifle',
		'shotgun',
		'nfa_item',
		'magazine',
		'other',
	]);

	// Create enum for firearm platforms (used for magazines to track what platform they're for)
	pgm.createType('firearm_platform', ['handgun', 'rifle', 'shotgun']);

	// Create enum for NFA subtypes
	pgm.createType('nfa_subtype', [
		'suppressor',
		'sbr',
		'sbs',
		'aow',
		'machine_gun',
		'destructive_device',
	]);

	pgm.createTable('equipment_items', {
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
		// User-friendly name (e.g., "Glock 19", "AR-15 Build", "30rd PMAG")
		name: { type: 'varchar(255)', notNull: true },
		// Category of item
		category: { type: 'equipment_item_category', notNull: true },

		// For firearms (handgun/rifle/shotgun)
		// If true, capacity is tracked on magazine items instead
		accepts_detachable_magazine: { type: 'boolean', default: false },
		// Optional caliber (e.g., "9mm", "5.56 NATO", ".308 Win")
		caliber: { type: 'varchar(50)' },

		// For magazines - what platform this magazine is for
		platform: { type: 'firearm_platform' },

		// Ammunition capacity - applies to:
		// - Firearms WITHOUT detachable mags (tube-fed shotguns, revolvers)
		// - Magazines (detachable mags have their own capacity)
		ammunition_capacity: { type: 'smallint' },

		// NFA-specific: required if category is 'nfa_item'
		nfa_subtype: { type: 'nfa_subtype' },

		// Measurement fields (for SBR/SBS classification, concealment laws)
		barrel_length_inches: { type: 'decimal(5,2)' },
		overall_length_inches: { type: 'decimal(5,2)' },

		// User notes about this item
		notes: { type: 'text' },
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

	// Index for querying user's equipment items
	pgm.createIndex('equipment_items', 'user_id');

	// Index for filtering by category
	pgm.createIndex('equipment_items', 'category');

	// Index for filtering magazines by platform
	pgm.createIndex('equipment_items', 'platform');

	// Index for filtering NFA items by subtype
	pgm.createIndex('equipment_items', 'nfa_subtype');

	// Unique constraint: user can only have one item with a given name
	pgm.createIndex('equipment_items', ['user_id', 'name'], { unique: true });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
	pgm.dropTable('equipment_items');
	pgm.dropType('nfa_subtype');
	pgm.dropType('firearm_platform');
	pgm.dropType('equipment_item_category');
}

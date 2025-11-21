import { ColumnDefinitions, MigrationBuilder } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
	// Create enum for regulation categories (transport-relevant from RAND data)
	pgm.createType('regulation_category', [
		'concealed_carry', // CCW permit requirements
		'open_carry', // Open carry restrictions
		'vehicle_carry', // Specific vehicle transport rules
		'magazine_capacity', // Magazine size limits
		'assault_weapons', // Assault weapon bans
		'permit_to_purchase', // Purchase permit requirements
		'registration', // Firearm registration requirements
		'preemption', // State preemption of local laws
		'waiting_period', // Waiting periods for purchase
		'age_restrictions', // Minimum age requirements
	]);

	// Create enum for permit types
	pgm.createType('permit_type', [
		'unrestricted', // Constitutional carry / no permit needed
		'shall_issue', // Must issue if requirements met
		'may_issue', // Discretionary issuance
		'no_issue', // Permits not available
	]);

	pgm.createTable('regulations', {
		id: {
			type: 'uuid',
			primaryKey: true,
			default: pgm.func('gen_random_uuid()'),
		},
		jurisdiction_id: {
			type: 'uuid',
			notNull: true,
			references: 'jurisdictions',
			onDelete: 'CASCADE',
		},
		category: { type: 'regulation_category', notNull: true },

		// Core regulation fields
		is_restricted: { type: 'boolean', notNull: true, default: false },
		restriction_level: { type: 'smallint', default: 5 }, // 1-10 severity score for routing
		permit_required: { type: 'boolean', default: false },
		permit_type: { type: 'permit_type' },

		// Specific numeric limits
		magazine_capacity_limit: { type: 'smallint' }, // null = no limit
		minimum_age: { type: 'smallint' }, // null = federal default (18/21)
		waiting_period_days: { type: 'smallint' }, // null = no waiting period

		// Complex conditional rules stored as JSON
		// e.g., { "must_be_unloaded": true, "must_be_locked": true, "direct_route_only": true }
		transport_requirements: { type: 'jsonb', default: '{}' },

		// Source and verification
		statutory_citation: { type: 'text' }, // Legal reference
		source: { type: 'varchar(50)', default: "'manual'" }, // 'rand', 'manual', 'crowdsourced'
		effective_date: { type: 'date' },
		last_verified: { type: 'date' },
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

	// Create indexes for common queries
	pgm.createIndex('regulations', 'jurisdiction_id');
	pgm.createIndex('regulations', 'category');
	pgm.createIndex('regulations', ['jurisdiction_id', 'category']);
	pgm.createIndex('regulations', 'restriction_level');

	// Unique constraint: one regulation per jurisdiction per category
	pgm.addConstraint('regulations', 'regulations_unique_jurisdiction_category', {
		unique: ['jurisdiction_id', 'category'],
	});
}

export async function down(pgm: MigrationBuilder): Promise<void> {
	pgm.dropTable('regulations');
	pgm.dropType('regulation_category');
	pgm.dropType('permit_type');
}

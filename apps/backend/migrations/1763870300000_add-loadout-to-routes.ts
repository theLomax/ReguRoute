import { ColumnDefinitions, MigrationBuilder } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
	// Add loadout_id column to routes table
	pgm.addColumn('routes', {
		loadout_id: {
			type: 'uuid',
			references: 'loadouts',
			onDelete: 'SET NULL', // Keep route if loadout is deleted
		},
	});

	// Index for querying routes by loadout
	pgm.createIndex('routes', 'loadout_id');
}

export async function down(pgm: MigrationBuilder): Promise<void> {
	pgm.dropColumn('routes', 'loadout_id');
}

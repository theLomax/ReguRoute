import { ColumnDefinitions, MigrationBuilder } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
	// Add new calibers column as text array
	pgm.addColumn('equipment_items', {
		calibers: { type: 'text[]' },
	});

	// Migrate existing caliber data to calibers array
	pgm.sql(`
		UPDATE equipment_items
		SET calibers = ARRAY[caliber]
		WHERE caliber IS NOT NULL AND caliber != ''
	`);

	// Drop old caliber column
	pgm.dropColumn('equipment_items', 'caliber');
}

export async function down(pgm: MigrationBuilder): Promise<void> {
	// Add back the old caliber column
	pgm.addColumn('equipment_items', {
		caliber: { type: 'varchar(50)' },
	});

	// Migrate first caliber back to single column
	pgm.sql(`
		UPDATE equipment_items
		SET caliber = calibers[1]
		WHERE calibers IS NOT NULL AND array_length(calibers, 1) > 0
	`);

	// Drop calibers array column
	pgm.dropColumn('equipment_items', 'calibers');
}

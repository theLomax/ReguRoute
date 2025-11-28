import { ColumnDefinitions, MigrationBuilder } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
	// Create enum for firearm features (for CA-compliant, NY-compliant, etc.)
	pgm.createType('firearm_feature', [
		'pistol_grip',
		'folding_stock',
		'collapsible_stock',
		'telescoping_stock',
		'thumbhole_stock',
		'flash_suppressor',
		'muzzle_brake',
		'barrel_shroud',
		'bayonet_lug',
		'grenade_launcher',
		'threaded_barrel',
	]);

	// Add features array column to equipment_items
	pgm.addColumn('equipment_items', {
		features: {
			type: 'firearm_feature[]',
			comment: 'Firearm features for feature-based restrictions (CA-compliant, NY-compliant, etc.)',
		},
	});
}

export async function down(pgm: MigrationBuilder): Promise<void> {
	pgm.dropColumn('equipment_items', 'features');
	pgm.dropType('firearm_feature');
}

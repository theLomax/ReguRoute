import { ColumnDefinitions, MigrationBuilder } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
	// Enable the pgcrypto extension to generate UUIDs
	pgm.createExtension('pgcrypto', { ifNotExists: true });

	pgm.createTable('users', {
		id: {
			type: 'uuid',
			primaryKey: true,
			default: pgm.func('gen_random_uuid()'),
		},
		email: { type: 'varchar(255)', notNull: true, unique: true },
		password_hash: { type: 'varchar(255)', notNull: true },
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

	// Create an index on email for faster lookups
	pgm.createIndex('users', 'email');
}

export async function down(pgm: MigrationBuilder): Promise<void> {
	pgm.dropTable('users');
	pgm.dropExtension('pgcrypto');
}

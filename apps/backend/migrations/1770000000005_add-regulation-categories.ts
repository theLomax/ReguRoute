import { MigrationBuilder, ColumnDefinitions } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  // Update regulation_category enum to include specific compliance categories
  pgm.sql(`
    ALTER TYPE regulation_category ADD VALUE IF NOT EXISTS 'ny_compliant_rifle';
    ALTER TYPE regulation_category ADD VALUE IF NOT EXISTS 'ny_compliant_pistol'; 
    ALTER TYPE regulation_category ADD VALUE IF NOT EXISTS 'ny_compliant_shotgun';
    ALTER TYPE regulation_category ADD VALUE IF NOT EXISTS 'ca_compliant_rifle';
    ALTER TYPE regulation_category ADD VALUE IF NOT EXISTS 'ca_compliant_pistol';
    ALTER TYPE regulation_category ADD VALUE IF NOT EXISTS 'ma_compliant_rifle';
    ALTER TYPE regulation_category ADD VALUE IF NOT EXISTS 'ct_compliant_rifle';
    ALTER TYPE regulation_category ADD VALUE IF NOT EXISTS 'nj_compliant_rifle';
  `);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  // Cannot remove enum values in PostgreSQL
}
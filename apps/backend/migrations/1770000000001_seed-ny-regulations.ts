import { MigrationBuilder, ColumnDefinitions } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  // Helper to get jurisdiction ID by postal code
  const getJurisdictionIdSql = (postalCode: string) => 
    `(SELECT id FROM jurisdictions WHERE type = 'state' AND postal_code = '${postalCode}' LIMIT 1)`;

  // New York Regulations
  // 1. Magazine Capacity: 10 rounds
  pgm.sql(`
    INSERT INTO regulations (
      jurisdiction_id, category, is_restricted, restriction_level, 
      permit_required, magazine_capacity_limit, statutory_citation, notes
    ) VALUES (
      ${getJurisdictionIdSql('NY')},
      'magazine_capacity',
      true,
      10, -- Critical
      false,
      10,
      'N.Y. Penal Law § 265.00',
      'Possession of magazines capable of holding more than 10 rounds is prohibited.'
    ) ON CONFLICT (jurisdiction_id, category) DO NOTHING;
  `);

  // 2. Concealed Carry: Strict permit requirement (May Issue / Restricted)
  pgm.sql(`
    INSERT INTO regulations (
      jurisdiction_id, category, is_restricted, restriction_level, 
      permit_required, statutory_citation, notes
    ) VALUES (
      ${getJurisdictionIdSql('NY')},
      'concealed_carry',
      true,
      9, -- Critical
      true,
      'N.Y. Penal Law § 400.00',
      'New York has strict permitting requirements and generally does not recognize permits from other states.'
    ) ON CONFLICT (jurisdiction_id, category) DO NOTHING;
  `);

  // 3. Transport Requirements (FOPA rules apply but NY is strict on enforcement)
  pgm.sql(`
    INSERT INTO regulations (
      jurisdiction_id, category, is_restricted, restriction_level, 
      permit_required, transport_requirements, statutory_citation, notes
    ) VALUES (
      ${getJurisdictionIdSql('NY')},
      'vehicle_carry',
      true,
      6, -- Warning/Critical
      false,
      '{"must_be_unloaded": true, "must_be_locked": true, "separate_ammo": true, "not_accessible": true}',
      'N.Y. Penal Law § 265.20',
      'Firearms must be unloaded and transported in a locked container, not the glove box or console. Ammunition should be separate.'
    ) ON CONFLICT (jurisdiction_id, category) DO NOTHING;
  `);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  // Clear regulations for seeded states
  const states = ['NY'];
  pgm.sql(`
    DELETE FROM regulations 
    WHERE jurisdiction_id IN (
      SELECT id FROM jurisdictions WHERE postal_code IN ('${states.join("','")}')
    );
  `);
}

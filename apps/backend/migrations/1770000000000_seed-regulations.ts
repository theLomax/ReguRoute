import { MigrationBuilder, ColumnDefinitions } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  // Helper to get jurisdiction ID by postal code
  const getJurisdictionIdSql = (postalCode: string) => 
    `(SELECT id FROM jurisdictions WHERE type = 'state' AND postal_code = '${postalCode}' LIMIT 1)`;

  // New Jersey Regulations
  // 1. Magazine Capacity: 10 rounds
  pgm.sql(`
    INSERT INTO regulations (
      jurisdiction_id, category, is_restricted, restriction_level, 
      permit_required, magazine_capacity_limit, statutory_citation, notes
    ) VALUES (
      ${getJurisdictionIdSql('NJ')},
      'magazine_capacity',
      true,
      10, -- Critical
      false,
      10,
      'N.J.S.A. 2C:39-1(y)',
      'Possession of magazines capable of holding more than 10 rounds is prohibited.'
    );
  `);

  // 2. Concealed Carry: Strict permit requirement
  pgm.sql(`
    INSERT INTO regulations (
      jurisdiction_id, category, is_restricted, restriction_level, 
      permit_required, statutory_citation, notes
    ) VALUES (
      ${getJurisdictionIdSql('NJ')},
      'concealed_carry',
      true,
      8, -- High/Critical
      true,
      'N.J.S.A. 2C:58-4',
      'New Jersey has strict permitting requirements and does not recognize permits from other states.'
    );
  `);

  // 3. Transport Requirements
  pgm.sql(`
    INSERT INTO regulations (
      jurisdiction_id, category, is_restricted, restriction_level, 
      permit_required, transport_requirements, statutory_citation, notes
    ) VALUES (
      ${getJurisdictionIdSql('NJ')},
      'vehicle_carry',
      true,
      5, -- Warning
      false,
      '{"must_be_unloaded": true, "must_be_locked": true, "separate_ammo": true, "must_be_in_trunk": true}',
      'N.J.S.A. 2C:39-6(g)',
      'Firearms must be unloaded and contained in a closed and fastened case, gunbox, securely tied package, or locked in the trunk.'
    );
  `);

  // Maryland Regulations
  // 1. Magazine Capacity: 10 rounds
  pgm.sql(`
    INSERT INTO regulations (
      jurisdiction_id, category, is_restricted, restriction_level, 
      permit_required, magazine_capacity_limit, statutory_citation, notes
    ) VALUES (
      ${getJurisdictionIdSql('MD')},
      'magazine_capacity',
      true,
      10, -- Critical
      false,
      10,
      'Md. Code, Crim. Law § 4-305',
      'Manufacturing, selling, offering for sale, purchasing, receiving, or transferring a detachable magazine that has a capacity of more than 10 rounds follows strict rules.'
    );
  `);

  // Delaware Regulations
  // 1. General Info
  pgm.sql(`
    INSERT INTO regulations (
      jurisdiction_id, category, is_restricted, restriction_level, 
      permit_required, statutory_citation, notes
    ) VALUES (
      ${getJurisdictionIdSql('DE')},
      'open_carry',
      false,
      2, -- Info
      false,
      'Del. Const. art. I, § 20',
      'Open carry is generally legal without a permit for anyone at least 18 years of age who is not prohibited from owning a firearm.'
    );
  `);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  // Clear regulations for seeded states
  const states = ['NJ', 'MD', 'DE'];
  pgm.sql(`
    DELETE FROM regulations 
    WHERE jurisdiction_id IN (
      SELECT id FROM jurisdictions WHERE postal_code IN ('${states.join("','")}')
    );
  `);
}

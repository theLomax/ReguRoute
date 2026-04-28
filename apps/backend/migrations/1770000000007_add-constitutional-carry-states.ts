import { MigrationBuilder, ColumnDefinitions } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  // Helper to get jurisdiction ID by postal code
  const getJurisdictionIdSql = (postalCode: string) => 
    `(SELECT id FROM jurisdictions WHERE type = 'state' AND postal_code = '${postalCode}' LIMIT 1)`;

  // Constitutional Carry States - Group 1 (2003-2017)
  // Based on official state statutes and verified effective dates

  // Alaska - Alaska Stat. § 11.61.220 (Effective 2003-09-09)
  pgm.sql(`
    INSERT INTO regulations (
      jurisdiction_id, category, is_restricted, restriction_level,
      permit_required, statutory_citation, notes,
      effective_date, last_verified, database_updated_at
    ) VALUES (
      ${getJurisdictionIdSql('AK')},
      'concealed_carry',
      false,
      1,
      false,
      'Alaska Stat. § 11.61.220',
      'Permitless carry for residents and non-residents age 21+. Military members age 18+ with military ID',
      '2003-09-09',
      '2026-01-16',
      CURRENT_TIMESTAMP
    ) ON CONFLICT (jurisdiction_id, category) DO UPDATE SET
      statutory_citation = EXCLUDED.statutory_citation,
      effective_date = EXCLUDED.effective_date,
      notes = EXCLUDED.notes,
      database_updated_at = CURRENT_TIMESTAMP;
  `);

  // Arizona - A.R.S. § 13-3112 (Effective 2010-07-29)
  pgm.sql(`
    INSERT INTO regulations (
      jurisdiction_id, category, is_restricted, restriction_level,
      permit_required, statutory_citation, notes,
      effective_date, last_verified, database_updated_at
    ) VALUES (
      ${getJurisdictionIdSql('AZ')},
      'concealed_carry',
      false,
      1,
      false,
      'A.R.S. § 13-3112',
      'Constitutional carry for age 21+. Age 18-20 requires completion of firearms safety course',
      '2010-07-29',
      '2026-01-16',
      CURRENT_TIMESTAMP
    ) ON CONFLICT (jurisdiction_id, category) DO UPDATE SET
      statutory_citation = EXCLUDED.statutory_citation,
      effective_date = EXCLUDED.effective_date,
      notes = EXCLUDED.notes,
      database_updated_at = CURRENT_TIMESTAMP;
  `);

  // Wyoming - Wyo. Stat. § 6-8-104 (Effective 2011-07-01)
  pgm.sql(`
    INSERT INTO regulations (
      jurisdiction_id, category, is_restricted, restriction_level,
      permit_required, statutory_citation, notes,
      effective_date, last_verified, database_updated_at
    ) VALUES (
      ${getJurisdictionIdSql('WY')},
      'concealed_carry',
      false,
      1,
      false,
      'Wyo. Stat. § 6-8-104',
      'Permitless carry for Wyoming residents age 21+. Non-residents need permits',
      '2011-07-01',
      '2026-01-16',
      CURRENT_TIMESTAMP
    ) ON CONFLICT (jurisdiction_id, category) DO UPDATE SET
      statutory_citation = EXCLUDED.statutory_citation,
      effective_date = EXCLUDED.effective_date,
      notes = EXCLUDED.notes,
      database_updated_at = CURRENT_TIMESTAMP;
  `);

  // Kansas - K.S.A. § 21-6302 (Effective 2015-07-01)
  pgm.sql(`
    INSERT INTO regulations (
      jurisdiction_id, category, is_restricted, restriction_level,
      permit_required, statutory_citation, notes,
      effective_date, last_verified, database_updated_at
    ) VALUES (
      ${getJurisdictionIdSql('KS')},
      'concealed_carry',
      false,
      1,
      false,
      'K.S.A. § 21-6302',
      'Constitutional carry for age 21+. Must be legally eligible to possess firearm',
      '2015-07-01',
      '2026-01-16',
      CURRENT_TIMESTAMP
    ) ON CONFLICT (jurisdiction_id, category) DO UPDATE SET
      statutory_citation = EXCLUDED.statutory_citation,
      effective_date = EXCLUDED.effective_date,
      notes = EXCLUDED.notes,
      database_updated_at = CURRENT_TIMESTAMP;
  `);

  // Maine - 17-A M.R.S. § 1052 (Effective 2015-10-15)
  pgm.sql(`
    INSERT INTO regulations (
      jurisdiction_id, category, is_restricted, restriction_level,
      permit_required, statutory_citation, notes,
      effective_date, last_verified, database_updated_at
    ) VALUES (
      ${getJurisdictionIdSql('ME')},
      'concealed_carry',
      false,
      1,
      false,
      '17-A M.R.S. § 1052',
      'Permitless carry for age 21+. Age 18+ with military service or completion of safety course',
      '2015-10-15',
      '2026-01-16',
      CURRENT_TIMESTAMP
    ) ON CONFLICT (jurisdiction_id, category) DO UPDATE SET
      statutory_citation = EXCLUDED.statutory_citation,
      effective_date = EXCLUDED.effective_date,
      notes = EXCLUDED.notes,
      database_updated_at = CURRENT_TIMESTAMP;
  `);

  // Idaho - Idaho Code § 18-3302 (Effective 2016-07-01)
  pgm.sql(`
    INSERT INTO regulations (
      jurisdiction_id, category, is_restricted, restriction_level,
      permit_required, statutory_citation, notes,
      effective_date, last_verified, database_updated_at
    ) VALUES (
      ${getJurisdictionIdSql('ID')},
      'concealed_carry',
      false,
      1,
      false,
      'Idaho Code § 18-3302',
      'Constitutional carry for residents age 18+. Enhanced permits available for reciprocity',
      '2016-07-01',
      '2026-01-16',
      CURRENT_TIMESTAMP
    ) ON CONFLICT (jurisdiction_id, category) DO UPDATE SET
      statutory_citation = EXCLUDED.statutory_citation,
      effective_date = EXCLUDED.effective_date,
      notes = EXCLUDED.notes,
      database_updated_at = CURRENT_TIMESTAMP;
  `);

  // Mississippi - Miss. Code § 45-9-101 (Effective 2016-07-01)
  pgm.sql(`
    INSERT INTO regulations (
      jurisdiction_id, category, is_restricted, restriction_level,
      permit_required, statutory_citation, notes,
      effective_date, last_verified, database_updated_at
    ) VALUES (
      ${getJurisdictionIdSql('MS')},
      'concealed_carry',
      false,
      1,
      false,
      'Miss. Code § 45-9-101',
      'Permitless carry for residents age 18+. Enhanced permits available',
      '2016-07-01',
      '2026-01-16',
      CURRENT_TIMESTAMP
    ) ON CONFLICT (jurisdiction_id, category) DO UPDATE SET
      statutory_citation = EXCLUDED.statutory_citation,
      effective_date = EXCLUDED.effective_date,
      notes = EXCLUDED.notes,
      database_updated_at = CURRENT_TIMESTAMP;
  `);

  // West Virginia - W. Va. Code § 61-7-3 (Effective 2016-05-24)
  pgm.sql(`
    INSERT INTO regulations (
      jurisdiction_id, category, is_restricted, restriction_level,
      permit_required, statutory_citation, notes,
      effective_date, last_verified, database_updated_at
    ) VALUES (
      ${getJurisdictionIdSql('WV')},
      'concealed_carry',
      false,
      1,
      false,
      'W. Va. Code § 61-7-3',
      'Constitutional carry for age 21+. Concealed carry permits still issued for reciprocity',
      '2016-05-24',
      '2026-01-16',
      CURRENT_TIMESTAMP
    ) ON CONFLICT (jurisdiction_id, category) DO UPDATE SET
      statutory_citation = EXCLUDED.statutory_citation,
      effective_date = EXCLUDED.effective_date,
      notes = EXCLUDED.notes,
      database_updated_at = CURRENT_TIMESTAMP;
  `);

  // Missouri - Mo. Rev. Stat. § 571.107 (Effective 2017-01-01)
  pgm.sql(`
    INSERT INTO regulations (
      jurisdiction_id, category, is_restricted, restriction_level,
      permit_required, statutory_citation, notes,
      effective_date, last_verified, database_updated_at
    ) VALUES (
      ${getJurisdictionIdSql('MO')},
      'concealed_carry',
      false,
      1,
      false,
      'Mo. Rev. Stat. § 571.107',
      'Permitless carry for age 19+ or 18+ military. Training requirements waived',
      '2017-01-01',
      '2026-01-16',
      CURRENT_TIMESTAMP
    ) ON CONFLICT (jurisdiction_id, category) DO UPDATE SET
      statutory_citation = EXCLUDED.statutory_citation,
      effective_date = EXCLUDED.effective_date,
      notes = EXCLUDED.notes,
      database_updated_at = CURRENT_TIMESTAMP;
  `);

  // New Hampshire - RSA 159:6 (Effective 2017-02-22)
  pgm.sql(`
    INSERT INTO regulations (
      jurisdiction_id, category, is_restricted, restriction_level,
      permit_required, statutory_citation, notes,
      effective_date, last_verified, database_updated_at
    ) VALUES (
      ${getJurisdictionIdSql('NH')},
      'concealed_carry',
      false,
      1,
      false,
      'RSA 159:6',
      'Constitutional carry for residents and non-residents age 18+',
      '2017-02-22',
      '2026-01-16',
      CURRENT_TIMESTAMP
    ) ON CONFLICT (jurisdiction_id, category) DO UPDATE SET
      statutory_citation = EXCLUDED.statutory_citation,
      effective_date = EXCLUDED.effective_date,
      notes = EXCLUDED.notes,
      database_updated_at = CURRENT_TIMESTAMP;
  `);

  // North Dakota - N.D.C.C. § 62.1-02-05 (Effective 2017-08-01)
  pgm.sql(`
    INSERT INTO regulations (
      jurisdiction_id, category, is_restricted, restriction_level,
      permit_required, statutory_citation, notes,
      effective_date, last_verified, database_updated_at
    ) VALUES (
      ${getJurisdictionIdSql('ND')},
      'concealed_carry',
      false,
      1,
      false,
      'N.D.C.C. § 62.1-02-05',
      'Permitless carry for residents age 18+. Class 1 permits available for enhanced reciprocity',
      '2017-08-01',
      '2026-01-16',
      CURRENT_TIMESTAMP
    ) ON CONFLICT (jurisdiction_id, category) DO UPDATE SET
      statutory_citation = EXCLUDED.statutory_citation,
      effective_date = EXCLUDED.effective_date,
      notes = EXCLUDED.notes,
      database_updated_at = CURRENT_TIMESTAMP;
  `);

  // Add standard vehicle transport regulations for constitutional carry states
  // These states generally follow federal FOPA guidelines
  const constitutionalCarryStates = ['AK', 'AZ', 'WY', 'KS', 'ME', 'ID', 'MS', 'WV', 'MO', 'NH', 'ND'];

  for (const state of constitutionalCarryStates) {
    pgm.sql(`
      INSERT INTO regulations (
        jurisdiction_id, category, is_restricted, restriction_level,
        transport_requirements, statutory_citation, notes,
        effective_date, last_verified, database_updated_at
      ) VALUES (
        ${getJurisdictionIdSql(state)},
        'vehicle_carry',
        false,
        2,
        '{"must_be_unloaded": true, "must_be_locked": false, "separate_ammo": false, "not_accessible": true, "federal_fopa_applies": true}',
        'Federal FOPA 18 U.S.C. § 926A',
        'Federal Firearm Owners Protection Act applies - firearms must be unloaded and not readily accessible during transport',
        '1986-05-19',
        '2026-01-16',
        CURRENT_TIMESTAMP
      ) ON CONFLICT (jurisdiction_id, category) DO UPDATE SET
        transport_requirements = EXCLUDED.transport_requirements,
        notes = EXCLUDED.notes,
        database_updated_at = CURRENT_TIMESTAMP;
    `);
  }

  // Add magazine capacity regulations (no restrictions for these states)
  for (const state of constitutionalCarryStates) {
    pgm.sql(`
      INSERT INTO regulations (
        jurisdiction_id, category, is_restricted, restriction_level,
        magazine_capacity_limit, statutory_citation, notes,
        effective_date, last_verified, database_updated_at
      ) VALUES (
        ${getJurisdictionIdSql(state)},
        'magazine_capacity',
        false,
        1,
        NULL,
        'No state-level restrictions',
        'No state-level magazine capacity restrictions - federal law applies',
        '1968-10-22',
        '2026-01-16',
        CURRENT_TIMESTAMP
      ) ON CONFLICT (jurisdiction_id, category) DO UPDATE SET
        notes = EXCLUDED.notes,
        database_updated_at = CURRENT_TIMESTAMP;
    `);
  }
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  // Remove constitutional carry regulations for Group 1 states
  const states = ['AK', 'AZ', 'WY', 'KS', 'ME', 'ID', 'MS', 'WV', 'MO', 'NH', 'ND'];
  
  pgm.sql(`
    DELETE FROM regulations 
    WHERE jurisdiction_id IN (
      SELECT id FROM jurisdictions WHERE postal_code IN ('${states.join("','")}')
    )
    AND category IN ('concealed_carry', 'vehicle_carry', 'magazine_capacity')
    AND database_updated_at >= '2026-01-16';
  `);
}
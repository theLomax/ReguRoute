import { MigrationBuilder, ColumnDefinitions } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  // Helper to get jurisdiction ID by postal code
  const getJurisdictionIdSql = (postalCode: string) => 
    `(SELECT id FROM jurisdictions WHERE type = 'state' AND postal_code = '${postalCode}' LIMIT 1)`;

  // PERMISSIVE STATES - These states follow federal guidelines without additional state restrictions

  // Michigan - Permissive state, follows federal guidelines
  pgm.sql(`
    INSERT INTO regulations (
      jurisdiction_id, category, is_restricted, restriction_level, permit_required,
      statutory_citation, notes, effective_date, last_verified, database_updated_at
    ) VALUES (
      ${getJurisdictionIdSql('MI')},
      'concealed_carry',
      true,
      6,
      true,
      'MCL 28.422',
      'Concealed pistol license required. Shall-issue state with standard requirements',
      '2001-07-01',
      '2026-01-18',
      CURRENT_TIMESTAMP
    ) ON CONFLICT (jurisdiction_id, category) DO UPDATE SET
      statutory_citation = EXCLUDED.statutory_citation,
      notes = EXCLUDED.notes,
      database_updated_at = CURRENT_TIMESTAMP;
  `);

  // Minnesota - Permit required but shall-issue
  pgm.sql(`
    INSERT INTO regulations (
      jurisdiction_id, category, is_restricted, restriction_level, permit_required,
      statutory_citation, notes, effective_date, last_verified, database_updated_at
    ) VALUES (
      ${getJurisdictionIdSql('MN')},
      'concealed_carry',
      true,
      5,
      true,
      'Minn. Stat. § 624.714',
      'Permit to carry required. Shall-issue state with background check and training requirements',
      '2003-05-28',
      '2026-01-18',
      CURRENT_TIMESTAMP
    ) ON CONFLICT (jurisdiction_id, category) DO UPDATE SET
      statutory_citation = EXCLUDED.statutory_citation,
      notes = EXCLUDED.notes,
      database_updated_at = CURRENT_TIMESTAMP;
  `);

  // North Carolina - Permit required, shall-issue
  pgm.sql(`
    INSERT INTO regulations (
      jurisdiction_id, category, is_restricted, restriction_level, permit_required,
      statutory_citation, notes, effective_date, last_verified, database_updated_at
    ) VALUES (
      ${getJurisdictionIdSql('NC')},
      'concealed_carry',
      true,
      5,
      true,
      'N.C. Gen. Stat. § 14-415.11',
      'Concealed handgun permit required. Shall-issue state with training and background requirements',
      '1995-12-01',
      '2026-01-18',
      CURRENT_TIMESTAMP
    ) ON CONFLICT (jurisdiction_id, category) DO UPDATE SET
      statutory_citation = EXCLUDED.statutory_citation,
      notes = EXCLUDED.notes,
      database_updated_at = CURRENT_TIMESTAMP;
  `);

  // New Mexico - Permit required, shall-issue
  pgm.sql(`
    INSERT INTO regulations (
      jurisdiction_id, category, is_restricted, restriction_level, permit_required,
      statutory_citation, notes, effective_date, last_verified, database_updated_at
    ) VALUES (
      ${getJurisdictionIdSql('NM')},
      'concealed_carry',
      true,
      4,
      true,
      'NMSA § 29-19-4',
      'Concealed handgun license required. Shall-issue state with training requirements',
      '2003-01-01',
      '2026-01-18',
      CURRENT_TIMESTAMP
    ) ON CONFLICT (jurisdiction_id, category) DO UPDATE SET
      statutory_citation = EXCLUDED.statutory_citation,
      notes = EXCLUDED.notes,
      database_updated_at = CURRENT_TIMESTAMP;
  `);

  // Nevada - Permit required, shall-issue
  pgm.sql(`
    INSERT INTO regulations (
      jurisdiction_id, category, is_restricted, restriction_level, permit_required,
      statutory_citation, notes, effective_date, last_verified, database_updated_at
    ) VALUES (
      ${getJurisdictionIdSql('NV')},
      'concealed_carry',
      true,
      4,
      true,
      'NRS 202.3657',
      'Concealed firearm permit required. Shall-issue state with training and competency requirements',
      '1995-10-01',
      '2026-01-18',
      CURRENT_TIMESTAMP
    ) ON CONFLICT (jurisdiction_id, category) DO UPDATE SET
      statutory_citation = EXCLUDED.statutory_citation,
      notes = EXCLUDED.notes,
      database_updated_at = CURRENT_TIMESTAMP;
  `);

  // Oregon - Permit required, shall-issue
  pgm.sql(`
    INSERT INTO regulations (
      jurisdiction_id, category, is_restricted, restriction_level, permit_required,
      statutory_citation, notes, effective_date, last_verified, database_updated_at
    ) VALUES (
      ${getJurisdictionIdSql('OR')},
      'concealed_carry',
      true,
      5,
      true,
      'ORS 166.291',
      'Concealed handgun license required. Shall-issue state with training requirements',
      '1989-01-01',
      '2026-01-18',
      CURRENT_TIMESTAMP
    ) ON CONFLICT (jurisdiction_id, category) DO UPDATE SET
      statutory_citation = EXCLUDED.statutory_citation,
      notes = EXCLUDED.notes,
      database_updated_at = CURRENT_TIMESTAMP;
  `);

  // Virginia - Permit required, shall-issue
  pgm.sql(`
    INSERT INTO regulations (
      jurisdiction_id, category, is_restricted, restriction_level, permit_required,
      statutory_citation, notes, effective_date, last_verified, database_updated_at
    ) VALUES (
      ${getJurisdictionIdSql('VA')},
      'concealed_carry',
      true,
      4,
      true,
      'Va. Code § 18.2-308',
      'Concealed handgun permit required. Shall-issue state with training or competency requirements',
      '1995-07-01',
      '2026-01-18',
      CURRENT_TIMESTAMP
    ) ON CONFLICT (jurisdiction_id, category) DO UPDATE SET
      statutory_citation = EXCLUDED.statutory_citation,
      notes = EXCLUDED.notes,
      database_updated_at = CURRENT_TIMESTAMP;
  `);

  // Wisconsin - Permit required, shall-issue
  pgm.sql(`
    INSERT INTO regulations (
      jurisdiction_id, category, is_restricted, restriction_level, permit_required,
      statutory_citation, notes, effective_date, last_verified, database_updated_at
    ) VALUES (
      ${getJurisdictionIdSql('WI')},
      'concealed_carry',
      true,
      4,
      true,
      'Wis. Stat. § 175.60',
      'Concealed carry license required. Shall-issue state with training requirements',
      '2011-11-01',
      '2026-01-18',
      CURRENT_TIMESTAMP
    ) ON CONFLICT (jurisdiction_id, category) DO UPDATE SET
      statutory_citation = EXCLUDED.statutory_citation,
      notes = EXCLUDED.notes,
      database_updated_at = CURRENT_TIMESTAMP;
  `);

  // Add vehicle transport regulations for all states - Federal FOPA compliance
  const states = ['MI', 'MN', 'NC', 'NM', 'NV', 'OR', 'VA', 'WI'];
  
  for (const state of states) {
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
        '18 U.S.C. § 926A',
        'Federal FOPA protections apply - firearms must be unloaded and not readily accessible during transport',
        '1986-05-19',
        '2026-01-18',
        CURRENT_TIMESTAMP
      ) ON CONFLICT (jurisdiction_id, category) DO UPDATE SET
        transport_requirements = EXCLUDED.transport_requirements,
        statutory_citation = EXCLUDED.statutory_citation,
        notes = EXCLUDED.notes,
        database_updated_at = CURRENT_TIMESTAMP;
    `);
  }

  // Add open carry regulations - Most of these states allow open carry
  const openCarryPermitted = ['MI', 'NC', 'NM', 'NV', 'OR', 'VA', 'WI'];
  
  for (const state of openCarryPermitted) {
    pgm.sql(`
      INSERT INTO regulations (
        jurisdiction_id, category, is_restricted, restriction_level,
        statutory_citation, notes, effective_date, last_verified, database_updated_at
      ) VALUES (
        ${getJurisdictionIdSql(state)},
        'open_carry',
        false,
        2,
        'State law',
        'Open carry generally permitted - local restrictions may apply',
        '2000-01-01',
        '2026-01-18',
        CURRENT_TIMESTAMP
      ) ON CONFLICT (jurisdiction_id, category) DO UPDATE SET
        notes = EXCLUDED.notes,
        database_updated_at = CURRENT_TIMESTAMP;
    `);
  }

  // Minnesota has restricted open carry in some circumstances
  pgm.sql(`
    INSERT INTO regulations (
      jurisdiction_id, category, is_restricted, restriction_level,
      statutory_citation, notes, effective_date, last_verified, database_updated_at
    ) VALUES (
      ${getJurisdictionIdSql('MN')},
      'open_carry',
      true,
      5,
      'Minn. Stat. § 624.714',
      'Open carry restricted in many locations. Permit recommended for open carry',
      '2003-05-28',
      '2026-01-18',
      CURRENT_TIMESTAMP
    ) ON CONFLICT (jurisdiction_id, category) DO UPDATE SET
      statutory_citation = EXCLUDED.statutory_citation,
      notes = EXCLUDED.notes,
      database_updated_at = CURRENT_TIMESTAMP;
  `);

  // Add magazine capacity - Most states have no restrictions
  for (const state of states) {
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
        'Federal law',
        'No state-level magazine capacity restrictions - federal law applies',
        '2000-01-01',
        '2026-01-18',
        CURRENT_TIMESTAMP
      ) ON CONFLICT (jurisdiction_id, category) DO UPDATE SET
        notes = EXCLUDED.notes,
        database_updated_at = CURRENT_TIMESTAMP;
    `);
  }
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  // Remove regulations for these states
  const states = ['MI', 'MN', 'NC', 'NM', 'NV', 'OR', 'VA', 'WI'];
  
  pgm.sql(`
    DELETE FROM regulations 
    WHERE jurisdiction_id IN (
      SELECT id FROM jurisdictions WHERE postal_code IN ('${states.join("','")}')
    )
    AND database_updated_at >= '2026-01-18';
  `);
}
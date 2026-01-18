import { MigrationBuilder, ColumnDefinitions } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  // Helper to get jurisdiction ID by postal code
  const getJurisdictionIdSql = (postalCode: string) => 
    `(SELECT id FROM jurisdictions WHERE type = 'state' AND postal_code = '${postalCode}' LIMIT 1)`;

  // First, add new columns for enhanced magazine restrictions
  pgm.addColumn('regulations', {
    restriction_scope: {
      type: 'jsonb',
      comment: 'Array of restriction types: manufacture, import, sale, possession, transfer'
    },
    possession_restricted: {
      type: 'boolean',
      default: false,
      comment: 'True if possession is restricted (critical for travelers)'
    },
    exemptions: {
      type: 'jsonb',
      comment: 'Structured exemption categories for comparison'
    },
    grandfathering_details: {
      type: 'jsonb',
      comment: 'Details about grandfathering provisions with consistent date format'
    },
    traveler_impact: {
      type: 'text',
      comment: 'Summary of impact on civilian travelers'
    }
  });

  // California - Strict possession ban, no civilian exemptions
  pgm.sql(`
    INSERT INTO regulations (
      jurisdiction_id, category, is_restricted, restriction_level,
      magazine_capacity_limit, statutory_citation, notes,
      effective_date, last_verified, database_updated_at,
      restriction_scope, possession_restricted, exemptions, grandfathering_details, traveler_impact
    ) VALUES (
      ${getJurisdictionIdSql('CA')},
      'magazine_capacity',
      true,
      10,
      10,
      'Cal. Penal Code § 32310',
      'Large-capacity magazine ban upheld after legal challenges. Possession of 10+ round magazines prohibited',
      '2017-07-01',
      '2026-01-16',
      CURRENT_TIMESTAMP,
      '["manufacture", "import", "sale", "possession"]',
      true,
      '{"law_enforcement": true, "military": true, "grandfathered_magazines": false, "registered_magazines": false, "licensed_dealers": true, "interstate_transport": false, "temporary_transfer": false}',
      '{"has_grandfathering": false, "cutoff_date": null, "registration_required": false}',
      'No exemptions for civilian travelers - possession prohibited'
    ) ON CONFLICT (jurisdiction_id, category) DO UPDATE SET
      statutory_citation = EXCLUDED.statutory_citation,
      magazine_capacity_limit = EXCLUDED.magazine_capacity_limit,
      restriction_scope = EXCLUDED.restriction_scope,
      possession_restricted = EXCLUDED.possession_restricted,
      exemptions = EXCLUDED.exemptions,
      grandfathering_details = EXCLUDED.grandfathering_details,
      traveler_impact = EXCLUDED.traveler_impact,
      database_updated_at = CURRENT_TIMESTAMP;
  `);

  // Connecticut - Possession ban with registration exemption
  pgm.sql(`
    INSERT INTO regulations (
      jurisdiction_id, category, is_restricted, restriction_level,
      magazine_capacity_limit, statutory_citation, notes,
      effective_date, last_verified, database_updated_at,
      restriction_scope, possession_restricted, exemptions, grandfathering_details, traveler_impact
    ) VALUES (
      ${getJurisdictionIdSql('CT')},
      'magazine_capacity',
      true,
      10,
      10,
      'Conn. Gen. Stat. § 53-202w',
      'Part of post-Sandy Hook legislation. Grandfathered magazines must be registered',
      '2013-04-04',
      '2026-01-16',
      CURRENT_TIMESTAMP,
      '["sale", "possession"]',
      true,
      '{"law_enforcement": true, "military": true, "grandfathered_magazines": true, "registered_magazines": true, "interstate_transport": false, "temporary_transfer": false}',
      '{"has_grandfathering": true, "cutoff_date": "2013-04-04", "registration_required": true}',
      'Must prove pre-2013-04-04 purchase and registration'
    ) ON CONFLICT (jurisdiction_id, category) DO UPDATE SET
      statutory_citation = EXCLUDED.statutory_citation,
      magazine_capacity_limit = EXCLUDED.magazine_capacity_limit,
      restriction_scope = EXCLUDED.restriction_scope,
      possession_restricted = EXCLUDED.possession_restricted,
      exemptions = EXCLUDED.exemptions,
      grandfathering_details = EXCLUDED.grandfathering_details,
      traveler_impact = EXCLUDED.traveler_impact,
      database_updated_at = CURRENT_TIMESTAMP;
  `);

  // Massachusetts - Long-standing restriction with grandfathering
  pgm.sql(`
    INSERT INTO regulations (
      jurisdiction_id, category, is_restricted, restriction_level,
      magazine_capacity_limit, statutory_citation, notes,
      effective_date, last_verified, database_updated_at,
      restriction_scope, possession_restricted, exemptions, grandfathering_details, traveler_impact
    ) VALUES (
      ${getJurisdictionIdSql('MA')},
      'magazine_capacity',
      true,
      10,
      10,
      'Mass. Gen. Laws Ch. 140, § 131M',
      'Long-standing restriction as part of assault weapons ban. Pre-ban magazines allowed',
      '1998-10-21',
      '2026-01-16',
      CURRENT_TIMESTAMP,
      '["sale", "transfer", "possession"]',
      true,
      '{"law_enforcement": true, "military": true, "grandfathered_magazines": true, "registered_magazines": false, "interstate_transport": false, "temporary_transfer": false}',
      '{"has_grandfathering": true, "cutoff_date": "1994-09-13", "registration_required": false}',
      'Travelers with non-grandfathered 10+ round magazines risk possession charges'
    ) ON CONFLICT (jurisdiction_id, category) DO UPDATE SET
      statutory_citation = EXCLUDED.statutory_citation,
      magazine_capacity_limit = EXCLUDED.magazine_capacity_limit,
      restriction_scope = EXCLUDED.restriction_scope,
      possession_restricted = EXCLUDED.possession_restricted,
      exemptions = EXCLUDED.exemptions,
      grandfathering_details = EXCLUDED.grandfathering_details,
      traveler_impact = EXCLUDED.traveler_impact,
      database_updated_at = CURRENT_TIMESTAMP;
  `);

  // Colorado - 15 round limit with grandfathering
  pgm.sql(`
    INSERT INTO regulations (
      jurisdiction_id, category, is_restricted, restriction_level,
      magazine_capacity_limit, statutory_citation, notes,
      effective_date, last_verified, database_updated_at,
      restriction_scope, possession_restricted, exemptions, grandfathering_details, traveler_impact
    ) VALUES (
      ${getJurisdictionIdSql('CO')},
      'magazine_capacity',
      true,
      8,
      15,
      'Colo. Rev. Stat. § 18-12-302',
      '15-round limit enacted after Aurora theater shooting. Grandfathered magazines allowed',
      '2013-07-01',
      '2026-01-16',
      CURRENT_TIMESTAMP,
      '["sale", "transfer", "possession"]',
      true,
      '{"law_enforcement": true, "military": true, "grandfathered_magazines": true, "registered_magazines": false, "interstate_transport": false, "competitive_shooting": false}',
      '{"has_grandfathering": true, "cutoff_date": "2013-07-01", "registration_required": false}',
      'Travelers with 15+ round magazines may face possession charges if not grandfathered'
    ) ON CONFLICT (jurisdiction_id, category) DO UPDATE SET
      statutory_citation = EXCLUDED.statutory_citation,
      magazine_capacity_limit = EXCLUDED.magazine_capacity_limit,
      restriction_scope = EXCLUDED.restriction_scope,
      possession_restricted = EXCLUDED.possession_restricted,
      exemptions = EXCLUDED.exemptions,
      grandfathering_details = EXCLUDED.grandfathering_details,
      traveler_impact = EXCLUDED.traveler_impact,
      database_updated_at = CURRENT_TIMESTAMP;
  `);

  // Hawaii - Recent strict restriction, no grandfathering
  pgm.sql(`
    INSERT INTO regulations (
      jurisdiction_id, category, is_restricted, restriction_level,
      magazine_capacity_limit, statutory_citation, notes,
      effective_date, last_verified, database_updated_at,
      restriction_scope, possession_restricted, exemptions, grandfathering_details, traveler_impact
    ) VALUES (
      ${getJurisdictionIdSql('HI')},
      'magazine_capacity',
      true,
      10,
      10,
      'Haw. Rev. Stat. § 134-8.5',
      'Recent legislation targeting large-capacity magazines. No grandfathering provision',
      '2022-07-01',
      '2026-01-16',
      CURRENT_TIMESTAMP,
      '["manufacture", "import", "sale", "possession"]',
      true,
      '{"law_enforcement": true, "military": true, "grandfathered_magazines": false, "registered_magazines": false, "licensed_dealers": true, "interstate_transport": false}',
      '{"has_grandfathering": false, "cutoff_date": null, "registration_required": false}',
      'No exemptions for civilian travelers - possession prohibited'
    ) ON CONFLICT (jurisdiction_id, category) DO UPDATE SET
      statutory_citation = EXCLUDED.statutory_citation,
      magazine_capacity_limit = EXCLUDED.magazine_capacity_limit,
      restriction_scope = EXCLUDED.restriction_scope,
      possession_restricted = EXCLUDED.possession_restricted,
      exemptions = EXCLUDED.exemptions,
      grandfathering_details = EXCLUDED.grandfathering_details,
      traveler_impact = EXCLUDED.traveler_impact,
      database_updated_at = CURRENT_TIMESTAMP;
  `);

  // Washington - Sales only, possession allowed
  pgm.sql(`
    INSERT INTO regulations (
      jurisdiction_id, category, is_restricted, restriction_level,
      magazine_capacity_limit, statutory_citation, notes,
      effective_date, last_verified, database_updated_at,
      restriction_scope, possession_restricted, exemptions, grandfathering_details, traveler_impact
    ) VALUES (
      ${getJurisdictionIdSql('WA')},
      'magazine_capacity',
      true,
      5,
      10,
      'RCW 9.41.370',
      'Restricts manufacture and sale but allows continued possession of existing magazines',
      '2022-07-01',
      '2026-01-16',
      CURRENT_TIMESTAMP,
      '["manufacture", "import", "sale"]',
      false,
      '{"law_enforcement": true, "military": true, "grandfathered_magazines": true, "interstate_transport": true, "temporary_transfer": true}',
      '{"has_grandfathering": true, "cutoff_date": "2022-07-01", "registration_required": false}',
      'Travelers can possess 10+ round magazines - only sales restricted'
    ) ON CONFLICT (jurisdiction_id, category) DO UPDATE SET
      statutory_citation = EXCLUDED.statutory_citation,
      magazine_capacity_limit = EXCLUDED.magazine_capacity_limit,
      restriction_scope = EXCLUDED.restriction_scope,
      possession_restricted = EXCLUDED.possession_restricted,
      exemptions = EXCLUDED.exemptions,
      grandfathering_details = EXCLUDED.grandfathering_details,
      traveler_impact = EXCLUDED.traveler_impact,
      database_updated_at = CURRENT_TIMESTAMP;
  `);

  // Illinois - Recent restriction with registration requirement
  pgm.sql(`
    INSERT INTO regulations (
      jurisdiction_id, category, is_restricted, restriction_level,
      magazine_capacity_limit, statutory_citation, notes,
      effective_date, last_verified, database_updated_at,
      restriction_scope, possession_restricted, exemptions, grandfathering_details, traveler_impact
    ) VALUES (
      ${getJurisdictionIdSql('IL')},
      'magazine_capacity',
      true,
      10,
      10,
      '720 ILCS 5/24-1.9',
      'Part of assault weapons ban. Existing magazines must be registered by January 2024',
      '2023-01-10',
      '2026-01-16',
      CURRENT_TIMESTAMP,
      '["manufacture", "sale", "possession"]',
      true,
      '{"law_enforcement": true, "military": true, "grandfathered_magazines": true, "registered_magazines": true, "interstate_transport": false}',
      '{"has_grandfathering": true, "cutoff_date": "2023-01-10", "registration_required": true}',
      'Travelers with 10+ round magazines need grandfathered/registered status'
    ) ON CONFLICT (jurisdiction_id, category) DO UPDATE SET
      statutory_citation = EXCLUDED.statutory_citation,
      magazine_capacity_limit = EXCLUDED.magazine_capacity_limit,
      restriction_scope = EXCLUDED.restriction_scope,
      possession_restricted = EXCLUDED.possession_restricted,
      exemptions = EXCLUDED.exemptions,
      grandfathering_details = EXCLUDED.grandfathering_details,
      traveler_impact = EXCLUDED.traveler_impact,
      database_updated_at = CURRENT_TIMESTAMP;
  `);

  // Rhode Island - Recent restriction with grandfathering
  pgm.sql(`
    INSERT INTO regulations (
      jurisdiction_id, category, is_restricted, restriction_level,
      magazine_capacity_limit, statutory_citation, notes,
      effective_date, last_verified, database_updated_at,
      restriction_scope, possession_restricted, exemptions, grandfathering_details, traveler_impact
    ) VALUES (
      ${getJurisdictionIdSql('RI')},
      'magazine_capacity',
      true,
      8,
      10,
      'R.I. Gen. Laws § 11-47-20.1',
      'Recent legislation with grandfathering for existing magazines',
      '2022-06-21',
      '2026-01-16',
      CURRENT_TIMESTAMP,
      '["sale", "possession"]',
      true,
      '{"law_enforcement": true, "military": true, "grandfathered_magazines": true, "registered_magazines": false, "interstate_transport": false}',
      '{"has_grandfathering": true, "cutoff_date": "2022-06-21", "registration_required": false}',
      'Travelers with non-grandfathered 10+ round magazines risk possession charges'
    ) ON CONFLICT (jurisdiction_id, category) DO UPDATE SET
      statutory_citation = EXCLUDED.statutory_citation,
      magazine_capacity_limit = EXCLUDED.magazine_capacity_limit,
      restriction_scope = EXCLUDED.restriction_scope,
      possession_restricted = EXCLUDED.possession_restricted,
      exemptions = EXCLUDED.exemptions,
      grandfathering_details = EXCLUDED.grandfathering_details,
      traveler_impact = EXCLUDED.traveler_impact,
      database_updated_at = CURRENT_TIMESTAMP;
  `);

  // Update Vermont - Add magazine restrictions to existing constitutional carry state
  pgm.sql(`
    INSERT INTO regulations (
      jurisdiction_id, category, is_restricted, restriction_level,
      magazine_capacity_limit, statutory_citation, notes,
      effective_date, last_verified, database_updated_at,
      restriction_scope, possession_restricted, exemptions, grandfathering_details, traveler_impact
    ) VALUES (
      ${getJurisdictionIdSql('VT')},
      'magazine_capacity',
      true,
      7,
      15,
      '13 V.S.A. § 4021',
      '15-round limit for handguns, 10-round for rifles. Grandfathering provision included',
      '2018-04-11',
      '2026-01-16',
      CURRENT_TIMESTAMP,
      '["sale", "possession"]',
      true,
      '{"law_enforcement": true, "military": true, "grandfathered_magazines": true, "registered_magazines": false, "interstate_transport": false}',
      '{"has_grandfathering": true, "cutoff_date": "2018-04-11", "registration_required": false}',
      'Travelers with 15+ round handgun mags or 10+ rifle mags may face possession charges'
    ) ON CONFLICT (jurisdiction_id, category) DO UPDATE SET
      statutory_citation = EXCLUDED.statutory_citation,
      magazine_capacity_limit = EXCLUDED.magazine_capacity_limit,
      restriction_scope = EXCLUDED.restriction_scope,
      possession_restricted = EXCLUDED.possession_restricted,
      exemptions = EXCLUDED.exemptions,
      grandfathering_details = EXCLUDED.grandfathering_details,
      traveler_impact = EXCLUDED.traveler_impact,
      database_updated_at = CURRENT_TIMESTAMP;
  `);

  // Create indexes for efficient querying
  pgm.createIndex('regulations', 'possession_restricted');
  pgm.createIndex('regulations', 'exemptions', { method: 'gin' });
  pgm.createIndex('regulations', 'restriction_scope', { method: 'gin' });
  pgm.createIndex('regulations', 'grandfathering_details', { method: 'gin' });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  // Remove indexes
  pgm.dropIndex('regulations', ['possession_restricted']);
  pgm.dropIndex('regulations', ['exemptions']);
  pgm.dropIndex('regulations', ['restriction_scope']);
  pgm.dropIndex('regulations', ['grandfathering_details']);

  // Remove magazine restriction regulations for these states
  const states = ['CA', 'CT', 'MA', 'CO', 'HI', 'WA', 'IL', 'RI', 'VT'];
  
  pgm.sql(`
    DELETE FROM regulations 
    WHERE jurisdiction_id IN (
      SELECT id FROM jurisdictions WHERE postal_code IN ('${states.join("','")}')
    )
    AND category = 'magazine_capacity'
    AND database_updated_at >= '2026-01-16';
  `);

  // Remove new columns
  pgm.dropColumn('regulations', 'traveler_impact');
  pgm.dropColumn('regulations', 'grandfathering_details');
  pgm.dropColumn('regulations', 'exemptions');
  pgm.dropColumn('regulations', 'possession_restricted');
  pgm.dropColumn('regulations', 'restriction_scope');
}
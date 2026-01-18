import { MigrationBuilder, ColumnDefinitions } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  // Helper to get jurisdiction ID by postal code
  const getJurisdictionIdSql = (postalCode: string) => 
    `(SELECT id FROM jurisdictions WHERE type = 'state' AND postal_code = '${postalCode}' LIMIT 1)`;

  // DISTRICT OF COLUMBIA - Federal district with unique regulations
  // DC has some of the most restrictive firearm laws in the United States

  // Concealed Carry - Very restrictive, may-issue with strict requirements
  pgm.sql(`
    INSERT INTO regulations (
      jurisdiction_id, category, is_restricted, restriction_level, permit_required,
      statutory_citation, notes, effective_date, last_verified, database_updated_at
    ) VALUES (
      ${getJurisdictionIdSql('DC')},
      'concealed_carry',
      true,
      9,
      true,
      'D.C. Code § 22-4506',
      'Concealed carry license required with strict may-issue requirements. Very difficult to obtain for non-residents',
      '2017-02-27',
      '2026-01-18',
      CURRENT_TIMESTAMP
    ) ON CONFLICT (jurisdiction_id, category) DO UPDATE SET
      statutory_citation = EXCLUDED.statutory_citation,
      notes = EXCLUDED.notes,
      restriction_level = EXCLUDED.restriction_level,
      database_updated_at = CURRENT_TIMESTAMP;
  `);

  // Magazine Capacity - 10 round limit, no grandfathering
  pgm.sql(`
    INSERT INTO regulations (
      jurisdiction_id, category, is_restricted, restriction_level,
      magazine_capacity_limit, statutory_citation, notes,
      effective_date, last_verified, database_updated_at,
      restriction_scope, possession_restricted, exemptions, grandfathering_details, traveler_impact
    ) VALUES (
      ${getJurisdictionIdSql('DC')},
      'magazine_capacity',
      true,
      10,
      10,
      'D.C. Code § 7-2506.01',
      'Large-capacity ammunition feeding device prohibition. 10+ round magazines prohibited',
      '2009-05-20',
      '2026-01-18',
      CURRENT_TIMESTAMP,
      '["manufacture", "import", "sale", "possession", "transfer"]',
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

  // Vehicle Transport - Very strict requirements
  pgm.sql(`
    INSERT INTO regulations (
      jurisdiction_id, category, is_restricted, restriction_level,
      transport_requirements, statutory_citation, notes,
      effective_date, last_verified, database_updated_at
    ) VALUES (
      ${getJurisdictionIdSql('DC')},
      'vehicle_carry',
      true,
      9,
      '{"must_be_unloaded": true, "must_be_locked": true, "separate_ammo": true, "not_accessible": true, "federal_fopa_applies": true, "additional_dc_requirements": true}',
      'D.C. Code § 22-4504.01',
      'Very strict transport requirements. Firearms must be unloaded, locked, with ammunition stored separately. Federal FOPA may provide limited protection for interstate travel',
      '2009-05-20',
      '2026-01-18',
      CURRENT_TIMESTAMP
    ) ON CONFLICT (jurisdiction_id, category) DO UPDATE SET
      transport_requirements = EXCLUDED.transport_requirements,
      statutory_citation = EXCLUDED.statutory_citation,
      notes = EXCLUDED.notes,
      database_updated_at = CURRENT_TIMESTAMP;
  `);

  // Open Carry - Prohibited
  pgm.sql(`
    INSERT INTO regulations (
      jurisdiction_id, category, is_restricted, restriction_level,
      statutory_citation, notes, effective_date, last_verified, database_updated_at
    ) VALUES (
      ${getJurisdictionIdSql('DC')},
      'open_carry',
      true,
      10,
      'D.C. Code § 22-4504',
      'Open carry prohibited. Carrying firearms openly in public is not permitted',
      '2009-05-20',
      '2026-01-18',
      CURRENT_TIMESTAMP
    ) ON CONFLICT (jurisdiction_id, category) DO UPDATE SET
      statutory_citation = EXCLUDED.statutory_citation,
      notes = EXCLUDED.notes,
      restriction_level = EXCLUDED.restriction_level,
      database_updated_at = CURRENT_TIMESTAMP;
  `);

  // Registration - Required for all firearms
  pgm.sql(`
    INSERT INTO regulations (
      jurisdiction_id, category, is_restricted, restriction_level,
      statutory_citation, notes, effective_date, last_verified, database_updated_at
    ) VALUES (
      ${getJurisdictionIdSql('DC')},
      'registration',
      true,
      9,
      'D.C. Code § 7-2502.01',
      'All firearms must be registered with Metropolitan Police Department. Registration required before possession',
      '2009-05-20',
      '2026-01-18',
      CURRENT_TIMESTAMP
    ) ON CONFLICT (jurisdiction_id, category) DO UPDATE SET
      statutory_citation = EXCLUDED.statutory_citation,
      notes = EXCLUDED.notes,
      restriction_level = EXCLUDED.restriction_level,
      database_updated_at = CURRENT_TIMESTAMP;
  `);

  // Assault Weapons - Prohibited with specific definitions
  pgm.sql(`
    INSERT INTO regulations (
      jurisdiction_id, category, is_restricted, restriction_level,
      statutory_citation, notes, effective_date, last_verified, database_updated_at,
      rule_definition
    ) VALUES (
      ${getJurisdictionIdSql('DC')},
      'assault_weapons',
      true,
      10,
      'D.C. Code § 7-2501.01',
      'Assault weapons and assault pistols prohibited. Specific list and feature-based definitions',
      '2009-05-20',
      '2026-01-18',
      CURRENT_TIMESTAMP,
      '{
        "rule_name": "DC Assault Weapon Prohibition",
        "legal_definition": "Firearms specifically listed as assault weapons or meeting feature-based criteria",
        "prohibited_conditions": {
          "OR": [
            {
              "equipment_category": "rifle",
              "features": {"contains": "detachable_magazine"},
              "AND": {
                "features": {
                  "contains_any": ["pistol_grip", "flash_suppressor", "grenade_launcher", "bayonet_lug", "folding_stock", "threaded_barrel"]
                }
              }
            },
            {
              "equipment_category": "handgun",
              "features": {"contains": "detachable_magazine"},
              "AND": {
                "features": {
                  "contains_any": ["magazine_well_outside_grip", "threaded_barrel", "barrel_shroud", "second_handgrip"]
                }
              }
            }
          ]
        },
        "result_if_prohibited": "critical",
        "description": "DC prohibits assault weapons with specific feature combinations"
      }'
    ) ON CONFLICT (jurisdiction_id, category) DO UPDATE SET
      statutory_citation = EXCLUDED.statutory_citation,
      notes = EXCLUDED.notes,
      rule_definition = EXCLUDED.rule_definition,
      restriction_level = EXCLUDED.restriction_level,
      database_updated_at = CURRENT_TIMESTAMP;
  `);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  // Remove DC regulations
  pgm.sql(`
    DELETE FROM regulations 
    WHERE jurisdiction_id IN (
      SELECT id FROM jurisdictions WHERE postal_code = 'DC'
    )
    AND database_updated_at >= '2026-01-18';
  `);
}
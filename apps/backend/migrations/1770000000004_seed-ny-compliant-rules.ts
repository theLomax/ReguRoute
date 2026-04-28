import { MigrationBuilder, ColumnDefinitions } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  // Helper to get jurisdiction ID by postal code
  const getJurisdictionIdSql = (postalCode: string) => 
    `(SELECT id FROM jurisdictions WHERE type = 'state' AND postal_code = '${postalCode}' LIMIT 1)`;

  // NY SAFE Act - Feature-Based Rifle Restrictions
  // Reference: N.Y. Penal Law § 265.00(22)(a) - Definition of "assault weapon"
  pgm.sql(`
    INSERT INTO regulations (
      jurisdiction_id, category, is_restricted, restriction_level,
      statutory_citation, notes, rule_definition
    ) VALUES (
      ${getJurisdictionIdSql('NY')},
      'ny_compliant_rifle',
      true,
      10, -- Critical
      'N.Y. Penal Law § 265.00(22)(a)',
      'NY SAFE Act: Semi-automatic rifles with prohibited features are classified as assault weapons',
      '{
        "rule_name": "NY Semi-Automatic Rifle Feature Restrictions",
        "description": "NY prohibits semi-automatic rifles with detachable magazines that possess certain features",
        "legal_definition": "Semi-automatic rifle with detachable magazine and prohibited features constitutes an assault weapon under NY law",
        "prohibited_conditions": {
          "AND": [
            {"equipment_category": "rifle"},
            {"accepts_detachable_magazine": true},
            {"OR": [
              {"features": {"contains": "pistol_grip"}},
              {"features": {"contains": "folding_stock"}},
              {"features": {"contains": "telescoping_stock"}},
              {"features": {"contains": "thumbhole_stock"}},
              {"features": {"contains": "flash_suppressor"}},
              {"features": {"contains": "bayonet_lug"}},
              {"features": {"contains": "grenade_launcher"}}
            ]}
          ]
        },
        "compliant_conditions": {
          "OR": [
            {"features": {"contains": "fixed_magazine"}},
            {"features": {"contains": "featureless"}},
            {"accepts_detachable_magazine": false}
          ]
        },
        "result_if_prohibited": "critical",
        "result_if_compliant": "allowed",
        "exemptions": [
          {
            "description": "Pre-SAFE Act registered firearms",
            "condition": {"registration_date": {"before": "2013-01-15"}}
          }
        ]
      }'
    ) ON CONFLICT (jurisdiction_id, category) DO UPDATE SET
      rule_definition = EXCLUDED.rule_definition,
      notes = EXCLUDED.notes;
  `);

  // NY SAFE Act - Feature-Based Pistol Restrictions  
  // Reference: N.Y. Penal Law § 265.00(22)(b) - Definition of "assault weapon" (pistol)
  pgm.sql(`
    INSERT INTO regulations (
      jurisdiction_id, category, is_restricted, restriction_level,
      statutory_citation, notes, rule_definition
    ) VALUES (
      ${getJurisdictionIdSql('NY')},
      'ny_compliant_pistol',
      true,
      10, -- Critical
      'N.Y. Penal Law § 265.00(22)(b)',
      'NY SAFE Act: Semi-automatic pistols with prohibited features are classified as assault weapons',
      '{
        "rule_name": "NY Semi-Automatic Pistol Feature Restrictions",
        "description": "NY prohibits semi-automatic pistols with certain features",
        "legal_definition": "Semi-automatic pistol with prohibited features constitutes an assault weapon under NY law",
        "prohibited_conditions": {
          "AND": [
            {"equipment_category": "handgun"},
            {"OR": [
              {"features": {"contains": "folding_stock"}},
              {"features": {"contains": "telescoping_stock"}},
              {"features": {"contains": "thumbhole_stock"}},
              {"features": {"contains": "shoulder_stock_pistol"}},
              {"features": {"contains": "barrel_shroud_pistol"}},
              {"features": {"contains": "flash_suppressor"}},
              {"features": {"contains": "threaded_barrel"}},
              {"features": {"contains": "magazine_well_outside_grip"}},
              {"ammunition_capacity": {"gt": 10}}
            ]}
          ]
        },
        "compliant_conditions": {
          "AND": [
            {"equipment_category": "handgun"},
            {"features": {"excludes_all": [
              "folding_stock", "telescoping_stock", "thumbhole_stock",
              "shoulder_stock_pistol", "barrel_shroud_pistol", "flash_suppressor",
              "threaded_barrel", "magazine_well_outside_grip"
            ]}},
            {"ammunition_capacity": {"lte": 10}}
          ]
        },
        "result_if_prohibited": "critical",
        "result_if_compliant": "allowed"
      }'
    ) ON CONFLICT (jurisdiction_id, category) DO UPDATE SET
      rule_definition = EXCLUDED.rule_definition,
      notes = EXCLUDED.notes;
  `);

  // NY SAFE Act - Feature-Based Shotgun Restrictions
  // Reference: N.Y. Penal Law § 265.00(22)(c) - Definition of "assault weapon" (shotgun)
  pgm.sql(`
    INSERT INTO regulations (
      jurisdiction_id, category, is_restricted, restriction_level,
      statutory_citation, notes, rule_definition
    ) VALUES (
      ${getJurisdictionIdSql('NY')},
      'ny_compliant_shotgun',
      true,
      10, -- Critical
      'N.Y. Penal Law § 265.00(22)(c)',
      'NY SAFE Act: Semi-automatic shotguns with prohibited features are classified as assault weapons',
      '{
        "rule_name": "NY Semi-Automatic Shotgun Feature Restrictions",
        "description": "NY prohibits semi-automatic shotguns with certain features",
        "legal_definition": "Semi-automatic shotgun with prohibited features constitutes an assault weapon under NY law",
        "prohibited_conditions": {
          "AND": [
            {"equipment_category": "shotgun"},
            {"OR": [
              {"features": {"contains": "folding_stock"}},
              {"features": {"contains": "telescoping_stock"}},
              {"features": {"contains": "thumbhole_stock"}},
              {"features": {"contains": "pistol_grip"}},
              {"features": {"contains": "flash_suppressor"}},
              {"features": {"contains": "bayonet_lug"}},
              {"features": {"contains": "grenade_launcher"}}
            ]}
          ]
        },
        "compliant_conditions": {
          "AND": [
            {"equipment_category": "shotgun"},
            {"features": {"excludes_all": [
              "folding_stock", "telescoping_stock", "thumbhole_stock",
              "pistol_grip", "flash_suppressor", "bayonet_lug", "grenade_launcher"
            ]}}
          ]
        },
        "result_if_prohibited": "critical",
        "result_if_compliant": "allowed"
      }'
    ) ON CONFLICT (jurisdiction_id, category) DO UPDATE SET
      rule_definition = EXCLUDED.rule_definition,
      notes = EXCLUDED.notes;
  `);

  // NY Magazine Capacity Limit  
  // Reference: N.Y. Penal Law § 265.00(23) - "Large capacity ammunition feeding device"
  pgm.sql(`
    INSERT INTO regulations (
      jurisdiction_id, category, is_restricted, restriction_level,
      magazine_capacity_limit, statutory_citation, notes, rule_definition
    ) VALUES (
      ${getJurisdictionIdSql('NY')},
      'magazine_capacity',
      true,
      10, -- Critical
      10,
      'N.Y. Penal Law § 265.00(23)',
      'NY SAFE Act: Prohibits large capacity ammunition feeding devices (>10 rounds)',
      '{
        "rule_name": "NY Magazine Capacity Limit",
        "description": "NY prohibits magazines capable of holding more than 10 rounds",
        "legal_definition": "Large capacity ammunition feeding device means magazine capable of holding more than ten rounds",
        "prohibited_conditions": {
          "OR": [
            {"ammunition_capacity": {"gt": 10}},
            {"features": {"contains": "capacity_over_ten"}}
          ]
        },
        "compliant_conditions": {
          "ammunition_capacity": {"lte": 10}
        },
        "result_if_prohibited": "critical",
        "result_if_compliant": "allowed",
        "exemptions": [
          {
            "description": "Fixed magazine with capacity >10 rounds may be compliant for rifles if other conditions met",
            "condition": {
              "AND": [
                {"features": {"contains": "fixed_magazine"}},
                {"equipment_category": "rifle"}
              ]
            }
          }
        ]
      }'
    ) ON CONFLICT (jurisdiction_id, category) DO UPDATE SET
      rule_definition = EXCLUDED.rule_definition,
      magazine_capacity_limit = EXCLUDED.magazine_capacity_limit,
      notes = EXCLUDED.notes;
  `);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  // Remove NY-specific compliance rules
  const states = ['NY'];
  pgm.sql(`
    DELETE FROM regulations 
    WHERE jurisdiction_id IN (
      SELECT id FROM jurisdictions WHERE postal_code IN ('${states.join("','")}')
    )
    AND category IN (
      'ny_compliant_rifle', 'ny_compliant_pistol', 'ny_compliant_shotgun'
    );
  `);
}
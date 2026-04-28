import { MigrationBuilder, ColumnDefinitions } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  // Create nfa_items table for tracking NFA-regulated items
  pgm.createTable('nfa_items', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    user_id: {
      type: 'uuid',
      notNull: true,
      references: '"users"',
      onDelete: 'CASCADE',
      comment: 'Owner of the NFA item'
    },
    item_type: {
      type: 'varchar(50)',
      notNull: true,
      check: "item_type IN ('suppressor', 'sbr', 'sbs', 'machine_gun', 'aow', 'destructive_device', 'other')",
      comment: 'Type of NFA item'
    },
    manufacturer: {
      type: 'varchar(100)',
      comment: 'Manufacturer of the item'
    },
    model: {
      type: 'varchar(100)',
      comment: 'Model designation'
    },
    caliber: {
      type: 'varchar(50)',
      comment: 'Caliber or bore size'
    },
    serial_number: {
      type: 'varchar(100)',
      comment: 'Serial number (encrypted storage recommended)'
    },
    barrel_length: {
      type: 'decimal(5,2)',
      comment: 'Barrel length in inches (for SBR/SBS)'
    },
    overall_length: {
      type: 'decimal(5,2)',
      comment: 'Overall length in inches'
    },
    tax_stamp_number: {
      type: 'varchar(50)',
      comment: 'ATF tax stamp control number'
    },
    registration_date: {
      type: 'date',
      comment: 'Date of ATF registration'
    },
    transfer_date: {
      type: 'date',
      comment: 'Date of transfer to current owner'
    },
    form_type: {
      type: 'varchar(20)',
      comment: 'ATF form used (Form 1, Form 4, etc.)'
    },
    trust_name: {
      type: 'varchar(200)',
      comment: 'Name of trust if registered to trust'
    },
    storage_location: {
      type: 'varchar(200)',
      comment: 'Primary storage location'
    },
    notes: {
      type: 'text',
      comment: 'Additional notes about the item'
    },
    active: {
      type: 'boolean',
      notNull: true,
      default: true,
      comment: 'Whether item is still owned/active'
    },
    created_at: {
      type: 'timestamp with time zone',
      notNull: true,
      default: pgm.func('CURRENT_TIMESTAMP')
    },
    updated_at: {
      type: 'timestamp with time zone',
      notNull: true,
      default: pgm.func('CURRENT_TIMESTAMP')
    }
  });

  // Create indexes
  pgm.createIndex('nfa_items', 'user_id');
  pgm.createIndex('nfa_items', 'item_type');
  pgm.createIndex('nfa_items', ['user_id', 'item_type']);

  // Create nfa_regulations table for state-specific NFA rules
  pgm.createTable('nfa_regulations', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    jurisdiction_id: {
      type: 'uuid',
      notNull: true,
      references: '"jurisdictions"',
      onDelete: 'CASCADE'
    },
    nfa_item_type: {
      type: 'varchar(50)',
      notNull: true,
      check: "nfa_item_type IN ('suppressor', 'sbr', 'sbs', 'machine_gun', 'aow', 'destructive_device', 'all')"
    },
    is_prohibited: {
      type: 'boolean',
      notNull: true,
      default: false,
      comment: 'Whether this NFA item type is prohibited in this jurisdiction'
    },
    possession_restricted: {
      type: 'boolean',
      notNull: true,
      default: false,
      comment: 'Whether possession requires additional state permits/licensing'
    },
    transport_restricted: {
      type: 'boolean',
      notNull: true,
      default: false,
      comment: 'Whether transport through jurisdiction is restricted'
    },
    hunting_allowed: {
      type: 'boolean',
      default: null,
      comment: 'Whether NFA item can be used for hunting (null = not specified)'
    },
    state_registration_required: {
      type: 'boolean',
      notNull: true,
      default: false,
      comment: 'Whether state registration is required in addition to federal'
    },
    notification_required: {
      type: 'boolean',
      notNull: true,
      default: false,
      comment: 'Whether law enforcement notification is required'
    },
    special_requirements: {
      type: 'jsonb',
      comment: 'Special requirements (storage, permits, notifications, etc.)'
    },
    exemptions: {
      type: 'jsonb',
      comment: 'Exemptions (law enforcement, military, etc.)'
    },
    penalties: {
      type: 'jsonb',
      comment: 'Penalties for violations'
    },
    statutory_citation: {
      type: 'text',
      comment: 'Legal citation for this regulation'
    },
    effective_date: {
      type: 'date',
      comment: 'When this regulation became effective'
    },
    last_verified: {
      type: 'date',
      notNull: true,
      default: pgm.func('CURRENT_DATE'),
      comment: 'Last verification of regulation status'
    },
    notes: {
      type: 'text',
      comment: 'Additional notes about the regulation'
    },
    created_at: {
      type: 'timestamp with time zone',
      notNull: true,
      default: pgm.func('CURRENT_TIMESTAMP')
    },
    updated_at: {
      type: 'timestamp with time zone',
      notNull: true,
      default: pgm.func('CURRENT_TIMESTAMP')
    }
  });

  // Create indexes for efficient NFA regulation lookups
  pgm.createIndex('nfa_regulations', 'jurisdiction_id');
  pgm.createIndex('nfa_regulations', 'nfa_item_type');
  pgm.createIndex('nfa_regulations', ['jurisdiction_id', 'nfa_item_type'], {
    unique: true,
    name: 'unique_nfa_regulation'
  });

  // Helper function to get state ID
  const getStateId = (postalCode: string) => 
    `(SELECT id FROM jurisdictions WHERE type = 'state' AND postal_code = '${postalCode}' LIMIT 1)`;

  // Add NFA regulations for states with specific restrictions
  
  // California - Very restrictive NFA laws
  const californiaNfaItems = [
    { type: 'suppressor', prohibited: true, citation: 'CA Penal Code § 30605' },
    { type: 'sbr', prohibited: true, citation: 'CA Penal Code § 30515' },
    { type: 'sbs', prohibited: true, citation: 'CA Penal Code § 30520' },
    { type: 'machine_gun', prohibited: true, citation: 'CA Penal Code § 32625' },
    { type: 'aow', prohibited: true, citation: 'CA Penal Code § 30600' },
    { type: 'destructive_device', prohibited: true, citation: 'CA Penal Code § 30570' }
  ];

  for (const item of californiaNfaItems) {
    pgm.sql(`
      INSERT INTO nfa_regulations (
        jurisdiction_id, nfa_item_type, is_prohibited, possession_restricted,
        transport_restricted, statutory_citation, effective_date, last_verified
      ) VALUES (
        ${getStateId('CA')}, '${item.type}', true, true, true,
        '${item.citation}', '2020-01-01', CURRENT_DATE
      );
    `);
  }

  // New York - Restrictive on most NFA items
  const newYorkNfaItems = [
    { type: 'suppressor', prohibited: true, citation: 'NY Penal Law § 265.02' },
    { type: 'sbr', prohibited: true, citation: 'NY Penal Law § 265.02' },
    { type: 'sbs', prohibited: true, citation: 'NY Penal Law § 265.02' },
    { type: 'machine_gun', prohibited: true, citation: 'NY Penal Law § 265.02' },
    { type: 'aow', prohibited: false, citation: 'NY Penal Law § 400.00' },
    { type: 'destructive_device', prohibited: true, citation: 'NY Penal Law § 265.02' }
  ];

  for (const item of newYorkNfaItems) {
    pgm.sql(`
      INSERT INTO nfa_regulations (
        jurisdiction_id, nfa_item_type, is_prohibited, possession_restricted,
        transport_restricted, state_registration_required, statutory_citation, 
        effective_date, last_verified
      ) VALUES (
        ${getStateId('NY')}, '${item.type}', ${item.prohibited}, true, true, true,
        '${item.citation}', '2013-01-15', CURRENT_DATE
      );
    `);
  }

  // New Jersey - Very restrictive
  const newJerseyNfaItems = [
    { type: 'suppressor', prohibited: true, citation: 'N.J.S.A. 2C:39-3' },
    { type: 'sbr', prohibited: true, citation: 'N.J.S.A. 2C:39-5' },
    { type: 'sbs', prohibited: true, citation: 'N.J.S.A. 2C:39-5' },
    { type: 'machine_gun', prohibited: true, citation: 'N.J.S.A. 2C:39-5' },
    { type: 'aow', prohibited: true, citation: 'N.J.S.A. 2C:39-3' },
    { type: 'destructive_device', prohibited: true, citation: 'N.J.S.A. 2C:39-3' }
  ];

  for (const item of newJerseyNfaItems) {
    pgm.sql(`
      INSERT INTO nfa_regulations (
        jurisdiction_id, nfa_item_type, is_prohibited, possession_restricted,
        transport_restricted, statutory_citation, effective_date, last_verified
      ) VALUES (
        ${getStateId('NJ')}, '${item.type}', true, true, true,
        '${item.citation}', '2018-06-13', CURRENT_DATE
      );
    `);
  }

  // Connecticut - Mixed restrictions
  pgm.sql(`
    INSERT INTO nfa_regulations (
      jurisdiction_id, nfa_item_type, is_prohibited, possession_restricted,
      transport_restricted, state_registration_required, special_requirements,
      statutory_citation, effective_date, last_verified
    ) VALUES 
    (${getStateId('CT')}, 'suppressor', true, true, true, false, 
     '{"note": "Suppressors prohibited for civilian use"}',
     'CT Gen. Stat. § 53-202', '2013-04-04', CURRENT_DATE),
    (${getStateId('CT')}, 'sbr', false, true, false, true,
     '{"permit_required": "Certificate of eligibility required"}',
     'CT Gen. Stat. § 53-202a', '2013-04-04', CURRENT_DATE),
    (${getStateId('CT')}, 'machine_gun', true, true, true, false,
     '{"law_enforcement_only": true}',
     'CT Gen. Stat. § 53-202', '2013-04-04', CURRENT_DATE);
  `);

  // Massachusetts - Mixed restrictions
  pgm.sql(`
    INSERT INTO nfa_regulations (
      jurisdiction_id, nfa_item_type, is_prohibited, possession_restricted,
      transport_restricted, state_registration_required, special_requirements,
      statutory_citation, effective_date, last_verified
    ) VALUES 
    (${getStateId('MA')}, 'suppressor', true, true, true, false,
     '{"note": "Suppressors prohibited"}',
     'MGL Ch. 269 § 10', '2004-01-01', CURRENT_DATE),
    (${getStateId('MA')}, 'sbr', false, true, false, true,
     '{"license_required": "Class A LTC required"}',
     'MGL Ch. 140 § 131', '2016-01-01', CURRENT_DATE),
    (${getStateId('MA')}, 'machine_gun', true, true, true, false,
     '{"law_enforcement_only": true}',
     'MGL Ch. 269 § 10', '2004-01-01', CURRENT_DATE);
  `);

  // Illinois - Recently liberalized suppressor laws
  pgm.sql(`
    INSERT INTO nfa_regulations (
      jurisdiction_id, nfa_item_type, is_prohibited, possession_restricted,
      transport_restricted, state_registration_required, hunting_allowed,
      special_requirements, statutory_citation, effective_date, last_verified
    ) VALUES 
    (${getStateId('IL')}, 'suppressor', false, true, false, true, true,
     '{"foid_required": "Valid FOID card required", "hunting_license": "Hunting license required for hunting use"}',
     '720 ILCS 5/33A-1', '2021-07-10', CURRENT_DATE),
    (${getStateId('IL')}, 'sbr', false, true, false, true, false,
     '{"foid_required": "Valid FOID card required"}',
     '430 ILCS 65/2', '2013-07-09', CURRENT_DATE),
    (${getStateId('IL')}, 'machine_gun', true, true, true, false,
     '{"law_enforcement_only": true}',
     '720 ILCS 5/33A-2', '2013-07-09', CURRENT_DATE);
  `);

  // Delaware - Suppressor restrictions
  pgm.sql(`
    INSERT INTO nfa_regulations (
      jurisdiction_id, nfa_item_type, is_prohibited, possession_restricted,
      transport_restricted, hunting_allowed, statutory_citation, 
      effective_date, last_verified
    ) VALUES 
    (${getStateId('DE')}, 'suppressor', true, true, true, false,
     'Del. Code Ann. tit. 11, § 1444A', '2022-07-01', CURRENT_DATE),
    (${getStateId('DE')}, 'sbr', false, false, false, true,
     'Federal law applies', '1934-06-26', CURRENT_DATE),
    (${getStateId('DE')}, 'machine_gun', false, true, false, false,
     'Del. Code Ann. tit. 11, § 1444', '1990-01-01', CURRENT_DATE);
  `);

  // Washington - Mixed restrictions with recent changes
  pgm.sql(`
    INSERT INTO nfa_regulations (
      jurisdiction_id, nfa_item_type, is_prohibited, possession_restricted,
      transport_restricted, hunting_allowed, special_requirements,
      statutory_citation, effective_date, last_verified
    ) VALUES 
    (${getStateId('WA')}, 'suppressor', false, false, false, true,
     '{"hunting_permitted": "Allowed for hunting with proper permits"}',
     'RCW 77.15.460', '2011-01-01', CURRENT_DATE),
    (${getStateId('WA')}, 'sbr', false, false, false, true,
     '{}', 'Federal law applies', '1934-06-26', CURRENT_DATE),
    (${getStateId('WA')}, 'machine_gun', false, true, false, false,
     '{"manufacture_prohibited": "Manufacturing prohibited after 1994"}',
     'RCW 9.41.190', '1994-01-01', CURRENT_DATE);
  `);

  // Hawaii - Very restrictive
  pgm.sql(`
    INSERT INTO nfa_regulations (
      jurisdiction_id, nfa_item_type, is_prohibited, possession_restricted,
      transport_restricted, state_registration_required, special_requirements,
      statutory_citation, effective_date, last_verified
    ) VALUES 
    (${getStateId('HI')}, 'suppressor', true, true, true, false,
     '{"note": "Suppressors prohibited"}',
     'HRS § 134-8', '2016-01-01', CURRENT_DATE),
    (${getStateId('HI')}, 'sbr', false, true, true, true,
     '{"permit_required": "County permit required"}',
     'HRS § 134-2', '2016-01-01', CURRENT_DATE),
    (${getStateId('HI')}, 'machine_gun', true, true, true, false,
     '{"law_enforcement_only": true}',
     'HRS § 134-8', '2016-01-01', CURRENT_DATE);
  `);

  // Add some permissive states for comparison
  
  // Texas - Generally NFA-friendly
  pgm.sql(`
    INSERT INTO nfa_regulations (
      jurisdiction_id, nfa_item_type, is_prohibited, possession_restricted,
      transport_restricted, hunting_allowed, statutory_citation, 
      effective_date, last_verified
    ) VALUES 
    (${getStateId('TX')}, 'suppressor', false, false, false, true,
     'Federal law applies', '2021-09-01', CURRENT_DATE),
    (${getStateId('TX')}, 'sbr', false, false, false, true,
     'Federal law applies', '2021-09-01', CURRENT_DATE),
    (${getStateId('TX')}, 'machine_gun', false, false, false, false,
     'Federal law applies', '2021-09-01', CURRENT_DATE);
  `);

  // Florida - NFA-friendly
  pgm.sql(`
    INSERT INTO nfa_regulations (
      jurisdiction_id, nfa_item_type, is_prohibited, possession_restricted,
      transport_restricted, hunting_allowed, statutory_citation, 
      effective_date, last_verified
    ) VALUES 
    (${getStateId('FL')}, 'suppressor', false, false, false, true,
     'Federal law applies', '2023-07-01', CURRENT_DATE),
    (${getStateId('FL')}, 'sbr', false, false, false, true,
     'Federal law applies', '2023-07-01', CURRENT_DATE),
    (${getStateId('FL')}, 'machine_gun', false, false, false, false,
     'Federal law applies', '2023-07-01', CURRENT_DATE);
  `);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable('nfa_regulations');
  pgm.dropTable('nfa_items');
}
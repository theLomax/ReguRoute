import { MigrationBuilder, ColumnDefinitions } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  // Create interstate_reciprocity table for concealed carry permit recognition
  pgm.createTable('interstate_reciprocity', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    issuing_state_id: {
      type: 'uuid',
      notNull: true,
      references: '"jurisdictions"',
      onDelete: 'CASCADE',
      comment: 'State that issued the permit'
    },
    recognizing_state_id: {
      type: 'uuid',
      notNull: true, 
      references: '"jurisdictions"',
      onDelete: 'CASCADE',
      comment: 'State that recognizes (or doesn\'t recognize) the permit'
    },
    recognition_type: {
      type: 'varchar(20)',
      notNull: true,
      check: "recognition_type IN ('full', 'partial', 'resident_only', 'none')",
      comment: 'Type of recognition offered'
    },
    permit_types: {
      type: 'jsonb',
      comment: 'Specific permit types recognized (enhanced, standard, etc.)'
    },
    restrictions: {
      type: 'jsonb',
      comment: 'Any restrictions on recognition (age, training, etc.)'
    },
    notes: {
      type: 'text',
      comment: 'Additional details about reciprocity'
    },
    effective_date: {
      type: 'date',
      comment: 'When this reciprocity arrangement became effective'
    },
    last_verified: {
      type: 'date',
      notNull: true,
      default: pgm.func('CURRENT_DATE'),
      comment: 'Last verification of reciprocity status'
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

  // Create indexes for efficient reciprocity lookups
  pgm.createIndex('interstate_reciprocity', 'issuing_state_id');
  pgm.createIndex('interstate_reciprocity', 'recognizing_state_id');
  pgm.createIndex('interstate_reciprocity', ['issuing_state_id', 'recognizing_state_id'], {
    unique: true,
    name: 'unique_reciprocity_pair'
  });

  // Create permit_types table for standardized permit classification
  pgm.createTable('permit_types', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    state_id: {
      type: 'uuid',
      notNull: true,
      references: '"jurisdictions"',
      onDelete: 'CASCADE'
    },
    permit_name: {
      type: 'varchar(100)',
      notNull: true,
      comment: 'Official name of the permit type'
    },
    permit_class: {
      type: 'varchar(20)',
      notNull: true,
      check: "permit_class IN ('standard', 'enhanced', 'provisional', 'non_resident', 'lifetime', 'military')",
      comment: 'Classification of permit for reciprocity purposes'
    },
    requirements: {
      type: 'jsonb',
      comment: 'Requirements to obtain this permit type'
    },
    reciprocity_value: {
      type: 'integer',
      notNull: true,
      default: 1,
      comment: 'Reciprocity value for recognition calculations (1-5 scale)'
    },
    active: {
      type: 'boolean',
      notNull: true,
      default: true,
      comment: 'Whether this permit type is currently being issued'
    },
    created_at: {
      type: 'timestamp with time zone',
      notNull: true,
      default: pgm.func('CURRENT_TIMESTAMP')
    }
  });

  pgm.createIndex('permit_types', 'state_id');
  pgm.createIndex('permit_types', 'permit_class');

  // Helper function to get state ID
  const getStateId = (postalCode: string) => 
    `(SELECT id FROM jurisdictions WHERE type = 'state' AND postal_code = '${postalCode}' LIMIT 1)`;

  // Create standard permit types for states that issue permits
  const permitStates = [
    // Enhanced/Standard permit states
    { code: 'TX', name: 'License to Carry', class: 'enhanced' },
    { code: 'FL', name: 'Concealed Weapon License', class: 'standard' },
    { code: 'VA', name: 'Concealed Handgun Permit', class: 'standard' },
    { code: 'PA', name: 'License to Carry Firearms', class: 'standard' },
    { code: 'NC', name: 'Concealed Handgun Permit', class: 'standard' },
    { code: 'MI', name: 'Concealed Pistol License', class: 'standard' },
    { code: 'WI', name: 'Concealed Carry License', class: 'standard' },
    { code: 'MN', name: 'Permit to Carry', class: 'standard' },
    { code: 'OR', name: 'Concealed Handgun License', class: 'standard' },
    { code: 'WA', name: 'Concealed Pistol License', class: 'standard' },
    { code: 'NV', name: 'Concealed Firearm Permit', class: 'standard' },
    { code: 'NM', name: 'Concealed Handgun License', class: 'standard' },
    { code: 'CO', name: 'Concealed Handgun Permit', class: 'standard' },
    { code: 'UT', name: 'Concealed Firearm Permit', class: 'enhanced' },
    { code: 'ID', name: 'Enhanced Concealed Weapons License', class: 'enhanced' },
    // May-issue states
    { code: 'CA', name: 'Concealed Carry Weapon License', class: 'standard' },
    { code: 'NY', name: 'Concealed Carry License', class: 'standard' },
    { code: 'NJ', name: 'Permit to Carry', class: 'standard' },
    { code: 'MD', name: 'Handgun Permit', class: 'standard' },
    { code: 'MA', name: 'License to Carry', class: 'standard' },
    { code: 'CT', name: 'Pistol Permit', class: 'standard' },
    { code: 'DE', name: 'Concealed Deadly Weapons License', class: 'standard' },
    { code: 'RI', name: 'Concealed Carry Permit', class: 'standard' },
    { code: 'HI', name: 'Carry License', class: 'standard' },
    { code: 'DC', name: 'Concealed Carry License', class: 'standard' }
  ];

  for (const permit of permitStates) {
    pgm.sql(`
      INSERT INTO permit_types (state_id, permit_name, permit_class, reciprocity_value, active)
      VALUES (
        ${getStateId(permit.code)},
        '${permit.name}',
        '${permit.class}',
        ${permit.class === 'enhanced' ? 5 : permit.class === 'standard' ? 3 : 1},
        true
      );
    `);
  }

  // Add some sample reciprocity relationships
  // Texas recognizes most permits
  const texasRecognizedStates = ['FL', 'VA', 'PA', 'NC', 'MI', 'WI', 'UT', 'ID', 'CO', 'NV', 'OR', 'WA'];
  for (const state of texasRecognizedStates) {
    pgm.sql(`
      INSERT INTO interstate_reciprocity (
        issuing_state_id, recognizing_state_id, recognition_type, 
        permit_types, effective_date, last_verified
      ) VALUES (
        ${getStateId(state)},
        ${getStateId('TX')},
        'full',
        '{"standard": true, "enhanced": true}',
        '2021-09-01',
        CURRENT_DATE
      );
    `);
  }

  // Florida recognizes many permits  
  const floridaRecognizedStates = ['TX', 'VA', 'PA', 'NC', 'MI', 'WI', 'UT', 'ID', 'CO', 'NV'];
  for (const state of floridaRecognizedStates) {
    pgm.sql(`
      INSERT INTO interstate_reciprocity (
        issuing_state_id, recognizing_state_id, recognition_type,
        permit_types, effective_date, last_verified
      ) VALUES (
        ${getStateId(state)},
        ${getStateId('FL')},
        'full',
        '{"standard": true, "enhanced": true}',
        '2023-07-01',
        CURRENT_DATE
      );
    `);
  }

  // Constitutional carry states recognize most permits but don't issue/require them
  const constitutionalCarryStates = ['AK', 'AL', 'AR', 'AZ', 'GA', 'IA', 'IN', 'KS', 'KY', 'LA', 
    'ME', 'MO', 'MS', 'MT', 'ND', 'NE', 'NH', 'OH', 'OK', 'SC', 'SD', 'TN', 'VT', 'WV', 'WY'];
  
  for (const ccState of constitutionalCarryStates) {
    for (const permitState of ['TX', 'FL', 'VA', 'PA', 'NC', 'MI', 'WI', 'UT', 'ID']) {
      pgm.sql(`
        INSERT INTO interstate_reciprocity (
          issuing_state_id, recognizing_state_id, recognition_type,
          permit_types, notes, effective_date, last_verified
        ) VALUES (
          ${getStateId(permitState)},
          ${getStateId(ccState)},
          'full',
          '{"standard": true, "enhanced": true}',
          'Constitutional carry state - permits generally recognized',
          '2020-01-01',
          CURRENT_DATE
        );
      `);
    }
  }

  // May-issue states generally don't recognize other permits
  const mayIssueStates = ['CA', 'NY', 'NJ', 'MD', 'MA', 'CT', 'HI', 'DC'];
  for (const mayIssue of mayIssueStates) {
    for (const permitState of ['TX', 'FL', 'VA', 'PA', 'NC']) {
      pgm.sql(`
        INSERT INTO interstate_reciprocity (
          issuing_state_id, recognizing_state_id, recognition_type,
          permit_types, notes, effective_date, last_verified
        ) VALUES (
          ${getStateId(permitState)},
          ${getStateId(mayIssue)},
          'none',
          '{}',
          'May-issue state - generally does not recognize out-of-state permits',
          '2020-01-01',
          CURRENT_DATE
        );
      `);
    }
  }
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable('interstate_reciprocity');
  pgm.dropTable('permit_types');
}
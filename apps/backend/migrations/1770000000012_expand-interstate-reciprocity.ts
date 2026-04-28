import { MigrationBuilder, ColumnDefinitions } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  // Helper function to get state ID
  const getStateId = (postalCode: string) => 
    `(SELECT id FROM jurisdictions WHERE type = 'state' AND postal_code = '${postalCode}' LIMIT 1)`;

  // Add comprehensive reciprocity relationships for major permit-issuing states
  
  // Virginia reciprocity (recognizes many permits)
  const virginiaRecognizedStates = [
    'TX', 'FL', 'PA', 'NC', 'MI', 'WI', 'UT', 'ID', 'CO', 'NV', 'OR', 'WA', 'MN', 'NM',
    'AL', 'AZ', 'AR', 'GA', 'IN', 'KS', 'KY', 'LA', 'MS', 'MO', 'MT', 'NE', 'ND', 'OH', 
    'OK', 'SC', 'SD', 'TN', 'WV', 'WY'
  ];
  
  for (const state of virginiaRecognizedStates) {
    pgm.sql(`
      INSERT INTO interstate_reciprocity (
        issuing_state_id, recognizing_state_id, recognition_type,
        permit_types, notes, effective_date, last_verified
      ) VALUES (
        ${getStateId(state)},
        ${getStateId('VA')},
        'full',
        '{"standard": true, "enhanced": true}',
        'Virginia recognizes most out-of-state permits',
        '2021-07-01',
        CURRENT_DATE
      ) ON CONFLICT (issuing_state_id, recognizing_state_id) DO NOTHING;
    `);
  }

  // Pennsylvania reciprocity (moderate recognition)
  const pennsylvaniaRecognizedStates = [
    'TX', 'FL', 'VA', 'NC', 'MI', 'WI', 'UT', 'ID', 'CO', 'NV', 'OR', 'WA', 'MN',
    'AL', 'AZ', 'AR', 'GA', 'IN', 'KS', 'KY', 'LA', 'MT', 'ND', 'OH', 'OK', 'SC', 'TN', 'WV'
  ];
  
  for (const state of pennsylvaniaRecognizedStates) {
    pgm.sql(`
      INSERT INTO interstate_reciprocity (
        issuing_state_id, recognizing_state_id, recognition_type,
        permit_types, notes, effective_date, last_verified
      ) VALUES (
        ${getStateId(state)},
        ${getStateId('PA')},
        'full',
        '{"standard": true}',
        'Pennsylvania recognizes permits from states with similar training requirements',
        '2020-08-01',
        CURRENT_DATE
      ) ON CONFLICT (issuing_state_id, recognizing_state_id) DO NOTHING;
    `);
  }

  // North Carolina reciprocity (selective recognition)
  const northCarolinaRecognizedStates = [
    'TX', 'FL', 'VA', 'PA', 'MI', 'WI', 'UT', 'ID', 'CO', 'NV', 'WA',
    'AL', 'AZ', 'GA', 'IN', 'KY', 'LA', 'MS', 'OH', 'OK', 'SC', 'TN', 'WV'
  ];
  
  for (const state of northCarolinaRecognizedStates) {
    pgm.sql(`
      INSERT INTO interstate_reciprocity (
        issuing_state_id, recognizing_state_id, recognition_type,
        permit_types, notes, effective_date, last_verified
      ) VALUES (
        ${getStateId(state)},
        ${getStateId('NC')},
        'full',
        '{"standard": true}',
        'North Carolina recognizes permits from states with equivalent requirements',
        '2022-01-01',
        CURRENT_DATE
      ) ON CONFLICT (issuing_state_id, recognizing_state_id) DO NOTHING;
    `);
  }

  // Michigan reciprocity (restrictive)
  const michiganRecognizedStates = ['TX', 'FL', 'VA', 'PA', 'UT', 'ID', 'AL', 'GA', 'IN', 'KY', 'OH', 'TN', 'WV'];
  
  for (const state of michiganRecognizedStates) {
    pgm.sql(`
      INSERT INTO interstate_reciprocity (
        issuing_state_id, recognizing_state_id, recognition_type,
        permit_types, restrictions, notes, effective_date, last_verified
      ) VALUES (
        ${getStateId(state)},
        ${getStateId('MI')},
        'partial',
        '{"standard": true}',
        '{"age_restriction": "21+", "training_verification": "required"}',
        'Michigan requires permit holders to be 21+ and have training documentation',
        '2023-03-01',
        CURRENT_DATE
      ) ON CONFLICT (issuing_state_id, recognizing_state_id) DO NOTHING;
    `);
  }

  // Utah Enhanced Permit reciprocity (widely recognized)
  const utahEnhancedRecognizedStates = [
    'TX', 'FL', 'VA', 'PA', 'NC', 'MI', 'WI', 'MN', 'NM', 'CO', 'NV', 'OR', 'WA',
    'AK', 'AL', 'AZ', 'AR', 'GA', 'IA', 'IN', 'KS', 'KY', 'LA', 'ME', 'MS', 'MO', 'MT', 
    'NE', 'ND', 'OH', 'OK', 'SC', 'SD', 'TN', 'VT', 'WV', 'WY'
  ];
  
  for (const state of utahEnhancedRecognizedStates) {
    pgm.sql(`
      INSERT INTO interstate_reciprocity (
        issuing_state_id, recognizing_state_id, recognition_type,
        permit_types, notes, effective_date, last_verified
      ) VALUES (
        ${getStateId('UT')},
        ${getStateId(state)},
        'full',
        '{"enhanced": true, "standard": false}',
        'Utah Enhanced permit widely recognized due to comprehensive training requirements',
        '2019-05-01',
        CURRENT_DATE
      ) ON CONFLICT (issuing_state_id, recognizing_state_id) DO NOTHING;
    `);
  }

  // Idaho Enhanced Permit reciprocity
  const idahoEnhancedRecognizedStates = [
    'TX', 'FL', 'VA', 'PA', 'NC', 'WI', 'UT', 'CO', 'NV', 'OR', 'WA', 'MN',
    'AK', 'AL', 'AZ', 'AR', 'GA', 'IA', 'IN', 'KS', 'KY', 'LA', 'MT', 'NE', 
    'ND', 'OH', 'OK', 'SC', 'SD', 'TN', 'WV', 'WY'
  ];
  
  for (const state of idahoEnhancedRecognizedStates) {
    pgm.sql(`
      INSERT INTO interstate_reciprocity (
        issuing_state_id, recognizing_state_id, recognition_type,
        permit_types, notes, effective_date, last_verified
      ) VALUES (
        ${getStateId('ID')},
        ${getStateId(state)},
        'full',
        '{"enhanced": true, "standard": false}',
        'Idaho Enhanced permit recognized for enhanced training requirements',
        '2020-07-01',
        CURRENT_DATE
      ) ON CONFLICT (issuing_state_id, recognizing_state_id) DO NOTHING;
    `);
  }

  // Wisconsin reciprocity 
  const wisconsinRecognizedStates = [
    'TX', 'FL', 'VA', 'PA', 'NC', 'MI', 'UT', 'ID', 'CO', 'NV', 'MN',
    'AL', 'AZ', 'AR', 'GA', 'IN', 'KS', 'KY', 'LA', 'MT', 'ND', 'OH', 'OK', 'SC', 'TN', 'WV'
  ];
  
  for (const state of wisconsinRecognizedStates) {
    pgm.sql(`
      INSERT INTO interstate_reciprocity (
        issuing_state_id, recognizing_state_id, recognition_type,
        permit_types, notes, effective_date, last_verified
      ) VALUES (
        ${getStateId(state)},
        ${getStateId('WI')},
        'full',
        '{"standard": true, "enhanced": true}',
        'Wisconsin recognizes most permits with training requirements',
        '2021-11-01',
        CURRENT_DATE
      ) ON CONFLICT (issuing_state_id, recognizing_state_id) DO NOTHING;
    `);
  }

  // Minnesota reciprocity (resident-only recognition for some)
  const minnesotaFullRecognitionStates = ['TX', 'FL', 'VA', 'PA', 'UT', 'ID', 'WI'];
  const minnesotaResidentOnlyStates = ['NC', 'MI', 'CO', 'NV', 'OR', 'WA', 'AL', 'GA', 'IN', 'KY', 'OH', 'TN'];
  
  for (const state of minnesotaFullRecognitionStates) {
    pgm.sql(`
      INSERT INTO interstate_reciprocity (
        issuing_state_id, recognizing_state_id, recognition_type,
        permit_types, notes, effective_date, last_verified
      ) VALUES (
        ${getStateId(state)},
        ${getStateId('MN')},
        'full',
        '{"standard": true, "enhanced": true}',
        'Minnesota recognizes permits from states with equivalent training standards',
        '2022-08-01',
        CURRENT_DATE
      ) ON CONFLICT (issuing_state_id, recognizing_state_id) DO NOTHING;
    `);
  }
  
  for (const state of minnesotaResidentOnlyStates) {
    pgm.sql(`
      INSERT INTO interstate_reciprocity (
        issuing_state_id, recognizing_state_id, recognition_type,
        permit_types, restrictions, notes, effective_date, last_verified
      ) VALUES (
        ${getStateId(state)},
        ${getStateId('MN')},
        'resident_only',
        '{"standard": true}',
        '{"residency_required": true}',
        'Minnesota only recognizes resident permits from these states',
        '2022-08-01',
        CURRENT_DATE
      ) ON CONFLICT (issuing_state_id, recognizing_state_id) DO NOTHING;
    `);
  }

  // Washington State reciprocity (very limited)
  const washingtonRecognizedStates = ['TX', 'UT', 'ID'];
  
  for (const state of washingtonRecognizedStates) {
    pgm.sql(`
      INSERT INTO interstate_reciprocity (
        issuing_state_id, recognizing_state_id, recognition_type,
        permit_types, restrictions, notes, effective_date, last_verified
      ) VALUES (
        ${getStateId(state)},
        ${getStateId('WA')},
        'partial',
        '{"enhanced": true, "standard": false}',
        '{"enhanced_only": true, "training_verification": "required"}',
        'Washington only recognizes enhanced permits with documented training',
        '2023-01-01',
        CURRENT_DATE
      ) ON CONFLICT (issuing_state_id, recognizing_state_id) DO NOTHING;
    `);
  }

  // Oregon reciprocity (very limited)
  const oregonRecognizedStates = ['TX', 'UT', 'ID'];
  
  for (const state of oregonRecognizedStates) {
    pgm.sql(`
      INSERT INTO interstate_reciprocity (
        issuing_state_id, recognizing_state_id, recognition_type,
        permit_types, restrictions, notes, effective_date, last_verified
      ) VALUES (
        ${getStateId(state)},
        ${getStateId('OR')},
        'partial',
        '{"enhanced": true, "standard": false}',
        '{"enhanced_only": true, "background_check": "required"}',
        'Oregon only recognizes enhanced permits with background check requirements',
        '2022-06-01',
        CURRENT_DATE
      ) ON CONFLICT (issuing_state_id, recognizing_state_id) DO NOTHING;
    `);
  }

  // Colorado reciprocity
  const coloradoRecognizedStates = [
    'TX', 'FL', 'VA', 'PA', 'NC', 'MI', 'WI', 'UT', 'ID', 'NV', 'MN', 'NM',
    'AL', 'AZ', 'AR', 'GA', 'IN', 'KS', 'KY', 'LA', 'MT', 'NE', 'ND', 'OH', 'OK', 'SC', 'TN', 'WV', 'WY'
  ];
  
  for (const state of coloradoRecognizedStates) {
    pgm.sql(`
      INSERT INTO interstate_reciprocity (
        issuing_state_id, recognizing_state_id, recognition_type,
        permit_types, notes, effective_date, last_verified
      ) VALUES (
        ${getStateId(state)},
        ${getStateId('CO')},
        'full',
        '{"standard": true, "enhanced": true}',
        'Colorado recognizes most permits from states with training requirements',
        '2021-05-01',
        CURRENT_DATE
      ) ON CONFLICT (issuing_state_id, recognizing_state_id) DO NOTHING;
    `);
  }

  // Nevada reciprocity
  const nevadaRecognizedStates = [
    'TX', 'FL', 'VA', 'PA', 'NC', 'WI', 'UT', 'ID', 'CO', 'MN', 'NM',
    'AK', 'AL', 'AZ', 'AR', 'GA', 'IA', 'IN', 'KS', 'KY', 'LA', 'MT', 'NE', 'ND', 'OH', 'OK', 'SC', 'TN', 'WV', 'WY'
  ];
  
  for (const state of nevadaRecognizedStates) {
    pgm.sql(`
      INSERT INTO interstate_reciprocity (
        issuing_state_id, recognizing_state_id, recognition_type,
        permit_types, notes, effective_date, last_verified
      ) VALUES (
        ${getStateId(state)},
        ${getStateId('NV')},
        'full',
        '{"standard": true, "enhanced": true}',
        'Nevada recognizes permits from most shall-issue states',
        '2020-10-01',
        CURRENT_DATE
      ) ON CONFLICT (issuing_state_id, recognizing_state_id) DO NOTHING;
    `);
  }

  // New Mexico reciprocity
  const newMexicoRecognizedStates = [
    'TX', 'FL', 'VA', 'PA', 'NC', 'WI', 'UT', 'ID', 'CO', 'NV', 'MN',
    'AL', 'AZ', 'AR', 'GA', 'IN', 'KS', 'KY', 'LA', 'MT', 'ND', 'OH', 'OK', 'SC', 'TN', 'WV', 'WY'
  ];
  
  for (const state of newMexicoRecognizedStates) {
    pgm.sql(`
      INSERT INTO interstate_reciprocity (
        issuing_state_id, recognizing_state_id, recognition_type,
        permit_types, notes, effective_date, last_verified
      ) VALUES (
        ${getStateId(state)},
        ${getStateId('NM')},
        'full',
        '{"standard": true, "enhanced": true}',
        'New Mexico recognizes most permits with equivalent requirements',
        '2021-01-01',
        CURRENT_DATE
      ) ON CONFLICT (issuing_state_id, recognizing_state_id) DO NOTHING;
    `);
  }
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  // Remove all reciprocity records added in this migration
  pgm.sql(`
    DELETE FROM interstate_reciprocity 
    WHERE last_verified = CURRENT_DATE
      AND issuing_state_id IN (
        SELECT id FROM jurisdictions 
        WHERE type = 'state' 
        AND postal_code IN ('VA', 'PA', 'NC', 'MI', 'UT', 'ID', 'WI', 'MN', 'WA', 'OR', 'CO', 'NV', 'NM')
      );
  `);
}
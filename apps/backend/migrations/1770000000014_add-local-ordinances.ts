import { MigrationBuilder, ColumnDefinitions } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  // Create local_ordinances table for city/county-level firearm regulations
  pgm.createTable('local_ordinances', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    jurisdiction_id: {
      type: 'uuid',
      notNull: true,
      references: '"jurisdictions"',
      onDelete: 'CASCADE',
      comment: 'City or county jurisdiction'
    },
    ordinance_type: {
      type: 'varchar(50)',
      notNull: true,
      check: "ordinance_type IN ('concealed_carry', 'open_carry', 'vehicle_carry', 'public_buildings', 'parks_recreation', 'assault_weapons', 'magazine_capacity', 'storage_requirements', 'discharge_prohibition', 'dealer_licensing', 'waiting_period', 'registration', 'permit_requirements', 'transport_restrictions', 'other')",
      comment: 'Type of local ordinance'
    },
    is_more_restrictive: {
      type: 'boolean',
      notNull: true,
      default: true,
      comment: 'Whether ordinance is more restrictive than state law'
    },
    prohibition_scope: {
      type: 'varchar(100)',
      comment: 'What is prohibited (e.g., "municipal buildings", "all public property")'
    },
    affected_areas: {
      type: 'jsonb',
      comment: 'Specific areas affected (parks, buildings, zones, etc.)'
    },
    permit_requirements: {
      type: 'jsonb',
      comment: 'Special permit or licensing requirements'
    },
    penalties: {
      type: 'jsonb',
      comment: 'Penalties for violations (fines, jail time, etc.)'
    },
    exemptions: {
      type: 'jsonb',
      comment: 'Exemptions (law enforcement, military, licensed security, etc.)'
    },
    enforcement_notes: {
      type: 'text',
      comment: 'Notes about enforcement practices'
    },
    ordinance_number: {
      type: 'varchar(50)',
      comment: 'Local ordinance number or code section'
    },
    state_preemption_status: {
      type: 'varchar(20)',
      check: "state_preemption_status IN ('preempted', 'allowed', 'grandfathered', 'unclear')",
      comment: 'Whether state preemption applies'
    },
    effective_date: {
      type: 'date',
      comment: 'When ordinance became effective'
    },
    last_verified: {
      type: 'date',
      notNull: true,
      default: pgm.func('CURRENT_DATE'),
      comment: 'Last verification of ordinance status'
    },
    notes: {
      type: 'text',
      comment: 'Additional notes about the ordinance'
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
  pgm.createIndex('local_ordinances', 'jurisdiction_id');
  pgm.createIndex('local_ordinances', 'ordinance_type');
  pgm.createIndex('local_ordinances', ['jurisdiction_id', 'ordinance_type']);
  pgm.createIndex('local_ordinances', 'state_preemption_status');

  // Add major metropolitan jurisdictions to the jurisdictions table
  
  // New York City
  pgm.sql(`
    INSERT INTO jurisdictions (type, name, postal_code, parent_state_code, geometry) VALUES
    ('city', 'New York City', 'NYC', 'NY', NULL),
    ('city', 'Los Angeles', 'LAX', 'CA', NULL),
    ('city', 'Chicago', 'CHI', 'IL', NULL),
    ('city', 'Houston', 'HOU', 'TX', NULL),
    ('city', 'Phoenix', 'PHX', 'AZ', NULL),
    ('city', 'Philadelphia', 'PHL', 'PA', NULL),
    ('city', 'San Antonio', 'SAT', 'TX', NULL),
    ('city', 'San Diego', 'SAN', 'CA', NULL),
    ('city', 'Dallas', 'DFW', 'TX', NULL),
    ('city', 'Austin', 'AUS', 'TX', NULL),
    ('city', 'Jacksonville', 'JAX', 'FL', NULL),
    ('city', 'San Francisco', 'SFO', 'CA', NULL),
    ('city', 'Columbus', 'CMH', 'OH', NULL),
    ('city', 'Indianapolis', 'IND', 'IN', NULL),
    ('city', 'Fort Worth', 'FTW', 'TX', NULL),
    ('city', 'Charlotte', 'CLT', 'NC', NULL),
    ('city', 'Seattle', 'SEA', 'WA', NULL),
    ('city', 'Denver', 'DEN', 'CO', NULL),
    ('city', 'Washington D.C.', 'WDC', 'DC', NULL),
    ('city', 'Boston', 'BOS', 'MA', NULL),
    ('city', 'Nashville', 'BNA', 'TN', NULL),
    ('city', 'Baltimore', 'BWI', 'MD', NULL),
    ('city', 'Oklahoma City', 'OKC', 'OK', NULL),
    ('city', 'Portland', 'PDX', 'OR', NULL),
    ('city', 'Las Vegas', 'LAS', 'NV', NULL),
    ('city', 'Milwaukee', 'MKE', 'WI', NULL),
    ('city', 'Albuquerque', 'ABQ', 'NM', NULL),
    ('city', 'Kansas City', 'MCI', 'MO', NULL),
    ('city', 'Atlanta', 'ATL', 'GA', NULL),
    ('city', 'Miami', 'MIA', 'FL', NULL);
  `);

  // Helper function to get city ID
  const getCityId = (code: string) => 
    `(SELECT id FROM jurisdictions WHERE type = 'city' AND postal_code = '${code}' LIMIT 1)`;

  // New York City - Very restrictive local laws
  const nycOrdinances = [
    {
      type: 'concealed_carry',
      scope: 'Sensitive locations',
      areas: JSON.stringify({
        prohibited_areas: [
          'Times Square', 'Subway system', 'Public schools', 'Government buildings',
          'Houses of worship', 'Playgrounds', 'Day care centers', 'Shelters',
          'Public demonstration areas'
        ],
        restrictions: 'Extensive sensitive location restrictions beyond state law'
      }),
      ordinance: 'NYC Admin Code § 10-131',
      date: '2023-09-01'
    },
    {
      type: 'assault_weapons',
      scope: 'Assault weapon storage',
      areas: JSON.stringify({
        requirements: [
          'Trigger locks required', 'Safe storage mandatory', 'Registration required'
        ]
      }),
      ordinance: 'NYC Admin Code § 10-303.1',
      date: '2013-01-01'
    },
    {
      type: 'dealer_licensing',
      scope: 'Firearm dealer operations',
      areas: JSON.stringify({
        requirements: [
          'City license required', 'Additional background checks', 'Waiting periods'
        ]
      }),
      ordinance: 'NYC Admin Code § 10-302',
      date: '2018-01-01'
    }
  ];

  for (const ord of nycOrdinances) {
    pgm.sql(`
      INSERT INTO local_ordinances (
        jurisdiction_id, ordinance_type, is_more_restrictive, prohibition_scope,
        affected_areas, ordinance_number, state_preemption_status, 
        effective_date, last_verified
      ) VALUES (
        ${getCityId('NYC')}, '${ord.type}', true, '${ord.scope}',
        '${ord.areas}', '${ord.ordinance}', 'allowed',
        '${ord.date}', CURRENT_DATE
      );
    `);
  }

  // Los Angeles - Restrictive with specific ordinances
  pgm.sql(`
    INSERT INTO local_ordinances (
      jurisdiction_id, ordinance_type, is_more_restrictive, prohibition_scope,
      affected_areas, ordinance_number, state_preemption_status,
      effective_date, last_verified
    ) VALUES 
    (${getCityId('LAX')}, 'public_buildings', true, 'City facilities and parks',
     '{"prohibited_areas": ["City Hall", "Public libraries", "Community centers", "Municipal buildings"], "enforcement": "Active"}',
     'LAMC § 55.01', 'preempted', '2015-06-01', CURRENT_DATE),
    (${getCityId('LAX')}, 'discharge_prohibition', true, 'City limits discharge ban',
     '{"scope": "Within city limits", "exceptions": ["Self-defense", "Lawful hunting areas", "Shooting ranges"]}',
     'LAMC § 55.07', 'allowed', '2010-01-01', CURRENT_DATE);
  `);

  // Chicago - Historically very restrictive
  pgm.sql(`
    INSERT INTO local_ordinances (
      jurisdiction_id, ordinance_type, is_more_restrictive, prohibition_scope,
      affected_areas, ordinance_number, state_preemption_status,
      effective_date, last_verified, notes
    ) VALUES 
    (${getCityId('CHI')}, 'assault_weapons', true, 'Assault weapon ban',
     '{"prohibited_features": ["Large capacity magazines", "Specific firearm models"], "grandfather_clause": "Pre-2013 ownership"}',
     'Chicago Municipal Code § 8-20-010', 'preempted', '2013-07-01', CURRENT_DATE, 
     'Largely preempted by state law but some provisions remain'),
    (${getCityId('CHI')}, 'dealer_licensing', true, 'Firearm dealer restrictions',
     '{"requirements": ["Special city license", "Distance requirements from schools"], "zoning": "Industrial areas only"}',
     'Chicago Municipal Code § 8-20-030', 'preempted', '2010-01-01', CURRENT_DATE,
     'Some zoning restrictions may still apply');
  `);

  // San Francisco - Very restrictive
  pgm.sql(`
    INSERT INTO local_ordinances (
      jurisdiction_id, ordinance_type, is_more_restrictive, prohibition_scope,
      affected_areas, ordinance_number, state_preemption_status,
      effective_date, last_verified
    ) VALUES 
    (${getCityId('SFO')}, 'storage_requirements', true, 'Safe storage mandate',
     '{"requirements": ["Locked container or gun safe", "Separate ammunition storage", "Trigger locks"], "penalties": {"fine": "Up to $1000", "jail": "Up to 6 months"}}',
     'SF Police Code Art. 17 § 1707', 'allowed', '2007-10-01', CURRENT_DATE),
    (${getCityId('SFO')}, 'magazine_capacity', true, 'Large capacity magazine ban',
     '{"limit": "10 rounds", "exceptions": ["Law enforcement", "Military"], "enforcement": "Immediate surrender required"}',
     'SF Police Code Art. 17 § 1706', 'preempted', '2015-01-01', CURRENT_DATE);
  `);

  // Washington D.C. - Extensive local regulations
  pgm.sql(`
    INSERT INTO local_ordinances (
      jurisdiction_id, ordinance_type, is_more_restrictive, prohibition_scope,
      affected_areas, ordinance_number, state_preemption_status,
      effective_date, last_verified
    ) VALUES 
    (${getCityId('WDC')}, 'concealed_carry', true, 'Carry restrictions',
     '{"prohibited_areas": ["Government buildings", "Schools", "Public transportation", "Protest areas"], "permit_required": "DC concealed carry permit"}',
     'D.C. Code § 7-2502.02', 'allowed', '2017-01-01', CURRENT_DATE),
    (${getCityId('WDC')}, 'registration', true, 'Firearm registration',
     '{"requirements": ["Registration required", "Background check", "Safety training"], "fees": "Registration fees apply"}',
     'D.C. Code § 7-2502.01', 'allowed', '2008-01-01', CURRENT_DATE);
  `);

  // Boston - Massachusetts local restrictions
  pgm.sql(`
    INSERT INTO local_ordinances (
      jurisdiction_id, ordinance_type, is_more_restrictive, prohibition_scope,
      affected_areas, ordinance_number, state_preemption_status,
      effective_date, last_verified
    ) VALUES 
    (${getCityId('BOS')}, 'assault_weapons', true, 'Local assault weapon interpretation',
     '{"scope": "Stricter interpretation of state assault weapon ban", "enforcement": "Active prosecution"}',
     'Boston Police Directive', 'unclear', '2016-08-01', CURRENT_DATE),
    (${getCityId('BOS')}, 'dealer_licensing', true, 'Additional dealer requirements',
     '{"requirements": ["City license", "Additional security measures", "Record keeping"]}',
     'Boston Municipal Code', 'allowed', '2014-01-01', CURRENT_DATE);
  `);

  // Seattle - Local restrictions despite state preemption
  pgm.sql(`
    INSERT INTO local_ordinances (
      jurisdiction_id, ordinance_type, is_more_restrictive, prohibition_scope,
      affected_areas, ordinance_number, state_preemption_status,
      effective_date, last_verified, notes
    ) VALUES 
    (${getCityId('SEA')}, 'storage_requirements', true, 'Safe storage ordinance',
     '{"requirements": ["Secure storage when minors present", "Gun safes or trigger locks"], "penalties": {"fine": "Up to $500", "civil_liability": "For negligent storage"}}',
     'Seattle Municipal Code § 12A.14.080', 'unclear', '2018-07-01', CURRENT_DATE,
     'Legal challenges ongoing regarding state preemption'),
    (${getCityId('SEA')}, 'discharge_prohibition', true, 'Firearm discharge ban',
     '{"scope": "Within city limits", "exceptions": ["Self-defense", "Law enforcement", "Military training"]}',
     'Seattle Municipal Code § 12A.14.010', 'allowed', '2015-01-01', CURRENT_DATE);
  `);

  // Denver - Colorado local restrictions
  pgm.sql(`
    INSERT INTO local_ordinances (
      jurisdiction_id, ordinance_type, is_more_restrictive, prohibition_scope,
      affected_areas, ordinance_number, state_preemption_status,
      effective_date, last_verified
    ) VALUES 
    (${getCityId('DEN')}, 'assault_weapons', true, 'Assault weapon ban',
     '{"prohibited_items": ["Assault weapons", "Large capacity magazines"], "grandfather_clause": "Pre-ordinance ownership allowed"}',
     'Denver Municipal Code § 38-130', 'preempted', '2020-01-01', CURRENT_DATE),
    (${getCityId('DEN')}, 'open_carry', true, 'Open carry prohibition',
     '{"scope": "City limits", "exceptions": ["Own property", "Hunting areas"], "enforcement": "Misdemeanor charge"}',
     'Denver Municipal Code § 38-117.5', 'preempted', '2003-01-01', CURRENT_DATE);
  `);

  // Philadelphia - Pennsylvania local ordinances
  pgm.sql(`
    INSERT INTO local_ordinances (
      jurisdiction_id, ordinance_type, is_more_restrictive, prohibition_scope,
      affected_areas, ordinance_number, state_preemption_status,
      effective_date, last_verified, notes
    ) VALUES 
    (${getCityId('PHL')}, 'assault_weapons', true, 'Assault weapon restrictions',
     '{"scope": "Local assault weapon ordinance", "status": "Enjoined by courts"}',
     'Philadelphia Code § 10-2000', 'preempted', '2007-01-01', CURRENT_DATE,
     'Ordinance exists but enforcement enjoined due to state preemption'),
    (${getCityId('PHL')}, 'public_buildings', true, 'City building restrictions',
     '{"prohibited_areas": ["City facilities", "Recreation centers", "Public events"]}',
     'Philadelphia Code § 10-810', 'allowed', '2012-01-01', CURRENT_DATE);
  `);

  // Houston - Texas city with limited local restrictions
  pgm.sql(`
    INSERT INTO local_ordinances (
      jurisdiction_id, ordinance_type, is_more_restrictive, prohibition_scope,
      affected_areas, ordinance_number, state_preemption_status,
      effective_date, last_verified
    ) VALUES 
    (${getCityId('HOU')}, 'discharge_prohibition', true, 'City discharge restrictions',
     '{"scope": "Within city limits", "exceptions": ["Self-defense", "Defense of property", "Shooting ranges"]}',
     'Houston Code of Ordinances § 28-21', 'allowed', '2000-01-01', CURRENT_DATE),
    (${getCityId('HOU')}, 'public_buildings', true, 'Municipal building restrictions',
     '{"prohibited_areas": ["City Hall", "Municipal courts", "Public libraries"]}',
     'Houston Code of Ordinances § 28-22', 'allowed', '2015-01-01', CURRENT_DATE);
  `);

  // Add some counties with notable ordinances
  pgm.sql(`
    INSERT INTO jurisdictions (type, name, postal_code, parent_state_code, geometry) VALUES
    ('county', 'Cook County', 'COK', 'IL', NULL),
    ('county', 'Los Angeles County', 'LAC', 'CA', NULL),
    ('county', 'King County', 'KNG', 'WA', NULL),
    ('county', 'Miami-Dade County', 'MDC', 'FL', NULL),
    ('county', 'Harris County', 'HAR', 'TX', NULL);
  `);

  // Cook County (Chicago area) - County-level assault weapon ban
  pgm.sql(`
    INSERT INTO local_ordinances (
      jurisdiction_id, ordinance_type, is_more_restrictive, prohibition_scope,
      affected_areas, ordinance_number, state_preemption_status,
      effective_date, last_verified, notes
    ) VALUES 
    ((SELECT id FROM jurisdictions WHERE postal_code = 'COK'), 'assault_weapons', true, 'County assault weapon ban',
     '{"prohibited_items": ["Assault weapons", "Large capacity magazines"], "penalties": {"fine": "Up to $1000 per day", "confiscation": "Immediate"}}',
     'Cook County Ordinance 13-O-26', 'preempted', '2013-08-01', CURRENT_DATE,
     'Largely preempted by Illinois state law');
  `);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable('local_ordinances');
  
  // Remove added jurisdictions
  pgm.sql(`
    DELETE FROM jurisdictions WHERE type IN ('city', 'county') 
    AND postal_code IN ('NYC', 'LAX', 'CHI', 'HOU', 'PHX', 'PHL', 'SAT', 'SAN', 'DFW', 'AUS',
                         'JAX', 'SFO', 'CMH', 'IND', 'FTW', 'CLT', 'SEA', 'DEN', 'WDC', 'BOS',
                         'BNA', 'BWI', 'OKC', 'PDX', 'LAS', 'MKE', 'ABQ', 'MCI', 'ATL', 'MIA',
                         'COK', 'LAC', 'KNG', 'MDC', 'HAR');
  `);
}
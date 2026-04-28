import { MigrationBuilder, ColumnDefinitions } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  // Add a database_updated_at field to track when we last verified/updated this regulation entry
  pgm.addColumn('regulations', {
    database_updated_at: {
      type: 'timestamp with time zone',
      notNull: true,
      default: pgm.func('CURRENT_TIMESTAMP'),
      comment: 'When this regulation entry was last updated in our database'
    }
  });

  // Add index for date-based queries
  pgm.createIndex('regulations', 'effective_date');
  pgm.createIndex('regulations', 'last_verified');
  pgm.createIndex('regulations', 'database_updated_at');

  // Update existing regulations with known effective dates
  // Note: These are approximate dates based on when major firearm legislation was enacted

  // New York SAFE Act - Enacted January 15, 2013
  pgm.sql(`
    UPDATE regulations 
    SET effective_date = '2013-01-15', 
        last_verified = '2026-01-16',
        database_updated_at = CURRENT_TIMESTAMP
    WHERE jurisdiction_id = (SELECT id FROM jurisdictions WHERE postal_code = 'NY') 
    AND category IN ('magazine_capacity', 'assault_weapons');
  `);

  // NY Concealed Carry - Original law from 1911, major update 2022 (Bruen response)
  pgm.sql(`
    UPDATE regulations 
    SET effective_date = '2022-09-01', 
        last_verified = '2026-01-16',
        database_updated_at = CURRENT_TIMESTAMP
    WHERE jurisdiction_id = (SELECT id FROM jurisdictions WHERE postal_code = 'NY') 
    AND category = 'concealed_carry';
  `);

  // NY Vehicle Carry - General transport law
  pgm.sql(`
    UPDATE regulations 
    SET effective_date = '1965-09-01', 
        last_verified = '2026-01-16',
        database_updated_at = CURRENT_TIMESTAMP
    WHERE jurisdiction_id = (SELECT id FROM jurisdictions WHERE postal_code = 'NY') 
    AND category = 'vehicle_carry';
  `);

  // New Jersey Assault Weapons - Enacted June 13, 1990, updated 2018
  pgm.sql(`
    UPDATE regulations 
    SET effective_date = '2018-06-13', 
        last_verified = '2026-01-16',
        database_updated_at = CURRENT_TIMESTAMP
    WHERE jurisdiction_id = (SELECT id FROM jurisdictions WHERE postal_code = 'NJ') 
    AND category = 'assault_weapons';
  `);

  // NJ Magazine Capacity - 15 to 10 rounds change in 2018
  pgm.sql(`
    UPDATE regulations 
    SET effective_date = '2018-12-10', 
        last_verified = '2026-01-16',
        database_updated_at = CURRENT_TIMESTAMP
    WHERE jurisdiction_id = (SELECT id FROM jurisdictions WHERE postal_code = 'NJ') 
    AND category = 'magazine_capacity';
  `);

  // NJ Concealed Carry - Updated after Bruen decision 2022
  pgm.sql(`
    UPDATE regulations 
    SET effective_date = '2022-12-22', 
        last_verified = '2026-01-16',
        database_updated_at = CURRENT_TIMESTAMP
    WHERE jurisdiction_id = (SELECT id FROM jurisdictions WHERE postal_code = 'NJ') 
    AND category = 'concealed_carry';
  `);

  // NJ Vehicle Carry - General transport rules
  pgm.sql(`
    UPDATE regulations 
    SET effective_date = '1979-09-01', 
        last_verified = '2026-01-16',
        database_updated_at = CURRENT_TIMESTAMP
    WHERE jurisdiction_id = (SELECT id FROM jurisdictions WHERE postal_code = 'NJ') 
    AND category = 'vehicle_carry';
  `);

  // Maryland - Assault weapons ban enacted 2013
  pgm.sql(`
    UPDATE regulations 
    SET effective_date = '2013-10-01', 
        last_verified = '2026-01-16',
        database_updated_at = CURRENT_TIMESTAMP
    WHERE jurisdiction_id = (SELECT id FROM jurisdictions WHERE postal_code = 'MD') 
    AND category IN ('assault_weapons', 'magazine_capacity');
  `);

  // MD Concealed Carry - Updated after Bruen 2022
  pgm.sql(`
    UPDATE regulations 
    SET effective_date = '2022-07-01', 
        last_verified = '2026-01-16',
        database_updated_at = CURRENT_TIMESTAMP
    WHERE jurisdiction_id = (SELECT id FROM jurisdictions WHERE postal_code = 'MD') 
    AND category = 'concealed_carry';
  `);

  // MD Vehicle Carry - General transport
  pgm.sql(`
    UPDATE regulations 
    SET effective_date = '1972-07-01', 
        last_verified = '2026-01-16',
        database_updated_at = CURRENT_TIMESTAMP
    WHERE jurisdiction_id = (SELECT id FROM jurisdictions WHERE postal_code = 'MD') 
    AND category = 'vehicle_carry';
  `);

  // Delaware - Various regulations
  pgm.sql(`
    UPDATE regulations 
    SET effective_date = '2021-01-01', 
        last_verified = '2026-01-16',
        database_updated_at = CURRENT_TIMESTAMP
    WHERE jurisdiction_id = (SELECT id FROM jurisdictions WHERE postal_code = 'DE');
  `);

  // Pennsylvania - LTCF system established 1995, updated 2011
  pgm.sql(`
    UPDATE regulations 
    SET effective_date = '2011-08-02', 
        last_verified = '2026-01-16',
        database_updated_at = CURRENT_TIMESTAMP
    WHERE jurisdiction_id = (SELECT id FROM jurisdictions WHERE postal_code = 'PA');
  `);

  // Create a function to automatically update database_updated_at when a regulation is modified
  pgm.sql(`
    CREATE OR REPLACE FUNCTION update_regulation_database_timestamp()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.database_updated_at = CURRENT_TIMESTAMP;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);

  pgm.createTrigger('regulations', 'trigger_update_database_timestamp', {
    when: 'BEFORE',
    operation: 'UPDATE',
    function: 'update_regulation_database_timestamp',
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  // Drop the trigger and function
  pgm.dropTrigger('regulations', 'trigger_update_database_timestamp');
  pgm.sql('DROP FUNCTION IF EXISTS update_regulation_database_timestamp();');

  // Drop the indexes
  pgm.dropIndex('regulations', 'database_updated_at');
  pgm.dropIndex('regulations', 'last_verified');
  pgm.dropIndex('regulations', 'effective_date');

  // Remove the new column
  pgm.dropColumn('regulations', 'database_updated_at');

  // Clear the date fields we populated
  pgm.sql('UPDATE regulations SET effective_date = NULL, last_verified = NULL');
}
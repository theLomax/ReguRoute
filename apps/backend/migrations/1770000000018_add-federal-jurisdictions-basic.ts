import { MigrationBuilder } from 'node-pg-migrate';

export const shorthands = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
    console.log('🏛️ Adding key federal jurisdictions for road travel...');
    
    const federalJurisdictions = [
        {
            name: 'Yellowstone National Park',
            type: 'national_park',
            postal_code: 'YN',
            // Simplified bounding box for Yellowstone
            coordinates: [[[-111.154175, 44.131775], [-111.154175, 45.112230], [-109.830326, 45.112230], [-109.830326, 44.131775], [-111.154175, 44.131775]]]
        },
        {
            name: 'Grand Canyon National Park', 
            type: 'national_park',
            postal_code: 'GC',
            coordinates: [[[-112.881348, 35.974654], [-112.881348, 36.413308], [-111.978149, 36.413308], [-111.978149, 35.974654], [-112.881348, 35.974654]]]
        },
        {
            name: 'Great Smoky Mountains National Park',
            type: 'national_park', 
            postal_code: 'GS',
            coordinates: [[[-83.942871, 35.433350], [-83.942871, 35.774135], [-83.090820, 35.774135], [-83.090820, 35.433350], [-83.942871, 35.433350]]]
        },
        {
            name: 'Glacier National Park',
            type: 'national_park',
            postal_code: 'GL',
            coordinates: [[[-114.411621, 48.247131], [-114.411621, 48.999931], [-113.323975, 48.999931], [-113.323975, 48.247131], [-114.411621, 48.247131]]]
        }
    ];

    let insertedCount = 0;

    for (const jurisdiction of federalJurisdictions) {
        try {
            const geometry = {
                type: 'MultiPolygon',
                coordinates: [jurisdiction.coordinates]
            };
            
            const result = await pgm.db.query(`
                INSERT INTO jurisdictions (
                    name, type, postal_code, 
                    geometry, created_at, updated_at
                )
                VALUES ($1, $2, $3, ST_Multi(ST_SetSRID(ST_GeomFromGeoJSON($4), 4326)), NOW(), NOW())
                RETURNING id, name;
            `, [jurisdiction.name, jurisdiction.type, jurisdiction.postal_code, JSON.stringify(geometry)]);

            console.log(`✅ Added ${jurisdiction.type}: ${jurisdiction.name} (${jurisdiction.postal_code})`);
            insertedCount++;
            
        } catch (error) {
            console.error(`❌ Failed to insert ${jurisdiction.name}:`, error instanceof Error ? error.message : String(error));
        }
    }

    console.log(`🎯 Federal jurisdiction loading complete: ${insertedCount} jurisdictions added`);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
    console.log('🏛️ Removing federal jurisdictions...');
    
    pgm.sql(`
        DELETE FROM jurisdictions 
        WHERE type IN ('national_park', 'federal_district', 'federal_building');
    `);
    
    console.log('✅ Federal jurisdictions removed');
}
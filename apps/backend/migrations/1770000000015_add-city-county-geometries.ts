import { MigrationBuilder } from 'node-pg-migrate';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const shorthands = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
    console.log('🗺️  Loading city and county boundary geometries...');
    
    const filePath = path.join(__dirname, '../../migrations/city-county-boundaries.json');
    
    if (!fs.existsSync(filePath)) {
        console.warn(`⚠️  Skipping city/county geometry seeding: File not found at ${filePath}`);
        return;
    }

    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    console.log(`📍 Found ${data.features.length} city/county features in GeoJSON`);

    let loadedCount = 0;
    let skippedCount = 0;

    for (const feature of data.features) {
        const jurisdictionName = feature.properties.name;
        const jurisdictionType = feature.properties.type; // 'city' or 'county'
        const postalCode = feature.properties.postal_code;
        const state = feature.properties.state;
        const geometry = JSON.stringify(feature.geometry);

        try {
            // Update the jurisdiction with the geometry
            // Use ST_Multi to ensure MultiPolygon format and proper SRID
            const result = await pgm.db.query(`
                UPDATE jurisdictions 
                SET geometry = ST_Multi(ST_SetSRID(ST_GeomFromGeoJSON($1), 4326))
                WHERE name = $2 AND type = $3 AND postal_code = $4
                RETURNING id, name;
            `, [geometry, jurisdictionName, jurisdictionType, postalCode]);

            if (result.rows.length > 0) {
                console.log(`✅ Updated ${jurisdictionType}: ${jurisdictionName}, ${state} (${postalCode})`);
                loadedCount++;
            } else {
                console.warn(`⚠️  No matching jurisdiction found for: ${jurisdictionName} (${jurisdictionType})`);
                skippedCount++;
            }
        } catch (error) {
            console.error(`❌ Failed to update ${jurisdictionName}:`, error instanceof Error ? error.message : String(error));
            skippedCount++;
        }
    }

    console.log(`🎯 Geometry loading complete: ${loadedCount} loaded, ${skippedCount} skipped`);
    
    // Verify the results
    const verificationResult = await pgm.db.query(`
        SELECT 
            type,
            COUNT(*) as total,
            COUNT(geometry) as with_geometry,
            COUNT(*) - COUNT(geometry) as missing_geometry
        FROM jurisdictions 
        WHERE type IN ('city', 'county')
        GROUP BY type
        ORDER BY type;
    `);

    console.log('📊 Verification Results:');
    for (const row of verificationResult.rows) {
        console.log(`   ${row.type}: ${row.with_geometry}/${row.total} have geometry (${row.missing_geometry} missing)`);
    }
}

export async function down(pgm: MigrationBuilder): Promise<void> {
    console.log('🗺️  Removing city and county boundary geometries...');
    
    pgm.sql(`
        UPDATE jurisdictions 
        SET geometry = NULL 
        WHERE type IN ('city', 'county');
    `);
    
    console.log('✅ City and county geometries removed');
}
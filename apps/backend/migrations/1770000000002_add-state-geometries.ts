import { MigrationBuilder } from 'node-pg-migrate';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const shorthands = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
    // The compiled migration runs in /dist-migrations-build/migrations
    // We moved the file to /apps/backend/migrations/us-states.json (source)
    // accessible via ../../migrations/us-states.json relative to the compiled file
    const filePath = path.join(__dirname, '../../migrations/us-states.json');
    
    if (!fs.existsSync(filePath)) {
        console.warn(`⚠️  Skipping state geometry seeding: File not found at ${filePath}`);
        return;
    }

    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    console.log(`Found ${data.features.length} features in GeoJSON.`);

    for (const feature of data.features) {
        const stateName = feature.properties.name;
        const geometry = JSON.stringify(feature.geometry);

        // Update the jurisdiction with the geometry
        // We use ST_Multi because the incoming data might be Polygon or MultiPolygon,
        // and our column is likely MultiPolygon (or generic Geometry).
        // ST_GeomFromGeoJSON parses the JSON.
        // We cast to proper SRID 4326 (WGS84).
        pgm.sql(`
            UPDATE jurisdictions 
            SET geometry = ST_Multi(ST_SetSRID(ST_GeomFromGeoJSON('${geometry}'), 4326))
            WHERE name = '${stateName}' AND type = 'state';
        `);
    }
}

export async function down(pgm: MigrationBuilder): Promise<void> {
    pgm.sql(`UPDATE jurisdictions SET geometry = NULL WHERE type = 'state';`);
}

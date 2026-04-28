import { MigrationBuilder } from 'node-pg-migrate';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const shorthands = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
    console.log('🏛️ Adding federal jurisdictions for road travel...');
    
    // Load federal jurisdiction boundary data
    const filePath = path.join(__dirname, '../../migrations/federal-road-travel-jurisdictions.json');
    
    if (!fs.existsSync(filePath)) {
        console.warn(`⚠️  Skipping federal jurisdiction seeding: File not found at ${filePath}`);
        return;
    }

    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    console.log(`📍 Found ${data.features.length} federal jurisdiction features`);

    let insertedCount = 0;

    for (const feature of data.features) {
        const props = feature.properties;
        const geometry = JSON.stringify(feature.geometry);

        try {
            // Insert the federal jurisdiction
            const result = await pgm.db.query(`
                INSERT INTO jurisdictions (
                    name, type, postal_code, 
                    geometry, created_at, updated_at
                )
                VALUES ($1, $2, $3, ST_Multi(ST_SetSRID(ST_GeomFromGeoJSON($4), 4326)), NOW(), NOW())
                RETURNING id, name;
            `, [props.name, props.type, props.postal_code, geometry]);

            const jurisdictionId = result.rows[0].id;
            console.log(`✅ Added ${props.type}: ${props.name} (${props.postal_code})`);
            
            // Add a basic federal regulation for each jurisdiction
            await addBasicFederalRegulation(pgm, jurisdictionId, props);
            insertedCount++;
            
        } catch (error) {
            console.error(`❌ Failed to insert ${props.name}:`, error instanceof Error ? error.message : String(error));
        }
    }

    console.log(`🎯 Federal jurisdiction loading complete: ${insertedCount} new jurisdictions added`);
}

async function addBasicFederalRegulation(pgm: MigrationBuilder, jurisdictionId: string, props: any): Promise<void> {
    try {
        await pgm.db.query(`
            INSERT INTO regulations (
                jurisdiction_id, category, is_restricted, restriction_level,
                statutory_citation, source, effective_date, last_verified, 
                notes, created_at, updated_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), $8, NOW(), NOW())
            ON CONFLICT (jurisdiction_id, category) DO NOTHING
        `, [
            jurisdictionId,
            'Transport',  // Use existing enum value
            true,
            8,  // High restriction level
            getFederalCitation(props.type),
            'federal_jurisdiction',
            '2020-01-01',
            getFederalRegulationNote(props.type, props.name)
        ]);
    } catch (error) {
        console.warn(`⚠️  Failed to add regulation for ${props.name}: ${error instanceof Error ? error.message : String(error)}`);
    }
}

function getFederalCitation(type: string): string {
    switch (type) {
        case 'national_park':
            return '36 CFR 2.4';
        case 'federal_district':
            return '18 USC 922';
        case 'federal_building':
            return '18 USC 930';
        case 'federal_airspace':
            return '49 CFR 1540';
        case 'border_zone':
            return '8 USC 1357';
        case 'national_forest':
            return '36 CFR 261';
        default:
            return 'Federal Regulations';
    }
}

function getFederalRegulationNote(type: string, name: string): string {
    switch (type) {
        case 'national_park':
            return `${name}: Federal law applies. Discharge generally prohibited except in self-defense. Follow state laws for possession.`;
        case 'federal_district':
            return `${name}: Special federal firearm regulations apply. Check current federal and local requirements.`;
        case 'federal_building':
            return `${name}: Firearms prohibited in federal buildings and security zones.`;
        case 'federal_airspace':
            return `${name}: TSA regulations apply. Firearms must be declared and transported in checked baggage.`;
        case 'border_zone':
            return `${name}: Enhanced federal enforcement authority. Ensure compliance with both federal and state laws.`;
        case 'national_forest':
            return `${name}: Generally follow state laws with federal oversight. Restrictions near facilities.`;
        default:
            return `${name}: Federal regulations apply.`;
    }
}

export async function down(pgm: MigrationBuilder): Promise<void> {
    console.log('🏛️ Removing federal jurisdictions...');
    
    // Remove regulations for federal jurisdictions
    pgm.sql(`
        DELETE FROM regulations 
        WHERE jurisdiction_id IN (
            SELECT id FROM jurisdictions 
            WHERE type IN (
                'federal_district', 'national_park', 'federal_airspace',
                'national_forest', 'border_zone', 'federal_building'
            )
        );
    `);
    
    // Remove federal jurisdictions
    pgm.sql(`
        DELETE FROM jurisdictions 
        WHERE type IN (
            'federal_district', 'national_park', 'federal_airspace',
            'national_forest', 'border_zone', 'federal_building'
        );
    `);
    
    console.log('✅ Federal jurisdictions removed');
}
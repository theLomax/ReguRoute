import { MigrationBuilder } from 'node-pg-migrate';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const shorthands = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
    console.log('🏛️ Adding federal jurisdictions relevant to road travel...');
    
    // Enum values already added manually
    
    // Load and insert federal jurisdiction boundary data
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
            
            // Add specific federal regulations for each jurisdiction type
            await addFederalRegulations(pgm, jurisdictionId, props);
            insertedCount++;
            
        } catch (error) {
            console.error(`❌ Failed to insert ${props.name}:`, error instanceof Error ? error.message : String(error));
        }
    }

    console.log(`🎯 Federal jurisdiction loading complete: ${insertedCount} jurisdictions added`);
}

async function addFederalRegulations(pgm: MigrationBuilder, jurisdictionId: string, props: any): Promise<void> {
    const regulations = getFederalRegulationsForType(props.type, props.name);
    
    for (const regulation of regulations) {
        try {
            await pgm.db.query(`
                INSERT INTO regulations (
                    id, jurisdiction_id, category, description, citation,
                    effective_date, last_verified, requirements, 
                    created_at, updated_at
                )
                VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, NOW(), $6, NOW(), NOW())
            `, [
                jurisdictionId,
                regulation.category,
                regulation.description,
                regulation.citation,
                regulation.effective_date,
                JSON.stringify(regulation.requirements)
            ]);
        } catch (error) {
            console.warn(`⚠️  Failed to add regulation ${regulation.category} for ${props.name}`);
        }
    }
}

function getFederalRegulationsForType(type: string, name: string): any[] {
    const baseDate = '2020-01-01';
    
    switch (type) {
        case 'federal_district':
            return [
                {
                    category: 'Federal Firearm Laws',
                    description: `${name} operates under federal firearm regulations with local restrictions`,
                    citation: '18 USC 922, DC Code',
                    effective_date: baseDate,
                    requirements: {
                        firearm_possession: 'federal_permit_required',
                        concealed_carry: 'dc_permit_required',
                        transport: 'locked_container_required'
                    }
                }
            ];
            
        case 'national_park':
            return [
                {
                    category: 'National Park Firearm Regulations',
                    description: `${name} follows state laws but prohibits discharge except in self-defense`,
                    citation: '36 CFR 2.4, 54 USC 100751',
                    effective_date: baseDate,
                    requirements: {
                        possession: 'state_law_applies',
                        discharge: 'prohibited_except_self_defense',
                        hunting: 'prohibited',
                        transport: 'follow_state_laws'
                    }
                }
            ];
            
        case 'federal_airspace':
            return [
                {
                    category: 'Airport Security Zone',
                    description: 'Federal aviation security zones with firearm restrictions',
                    citation: '49 CFR 1540, TSA Regulations',
                    effective_date: baseDate,
                    requirements: {
                        possession: 'prohibited_in_sterile_areas',
                        transport: 'checked_baggage_only',
                        declaration: 'required'
                    }
                }
            ];
            
        case 'federal_building':
            return [
                {
                    category: 'Federal Building Security',
                    description: 'Federal courthouse and building firearm prohibitions',
                    citation: '18 USC 930, 41 CFR 102-74',
                    effective_date: baseDate,
                    requirements: {
                        possession: 'prohibited',
                        exceptions: 'law_enforcement_only',
                        parking_areas: 'may_be_restricted'
                    }
                }
            ];
            
        case 'border_zone':
            return [
                {
                    category: 'Border Enforcement Zone',
                    description: '100-mile border zone with enhanced federal enforcement authority',
                    citation: '8 USC 1357, INA Section 287',
                    effective_date: baseDate,
                    requirements: {
                        inspection_authority: 'enhanced_federal',
                        documentation: 'recommended',
                        compliance: 'federal_and_state_laws'
                    }
                }
            ];
            
        case 'national_forest':
            return [
                {
                    category: 'National Forest Regulations',
                    description: 'National forest areas generally follow state laws with federal oversight',
                    citation: '36 CFR 261, Multiple Use Act',
                    effective_date: baseDate,
                    requirements: {
                        possession: 'state_law_applies',
                        hunting: 'seasonal_restrictions_apply',
                        discharge: 'restricted_near_facilities',
                        camping: 'follow_state_laws'
                    }
                }
            ];
            
        default:
            return [];
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
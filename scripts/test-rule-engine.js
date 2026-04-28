// Test the rule-based compliance engine
const { Client } = require('pg');

async function testRuleEngine() {
    const client = new Client({
        user: 'postgres',
        host: 'localhost',
        database: 'reguroute',
        password: 'postgres',
        port: 5432,
    });

    try {
        await client.connect();
        console.log('Connected to database');

        // First, insert the rule definitions manually to test
        const nyRifleRule = {
            rule_name: "NY-Compliant Semi-Automatic Rifle",
            description: "Semi-automatic rifle that complies with NY SAFE Act feature restrictions",
            legal_definition: "Semi-automatic rifle with detachable magazine that does NOT possess any prohibited features",
            prohibited_conditions: {
                AND: [
                    { equipment_category: "rifle" },
                    { accepts_detachable_magazine: true },
                    {
                        OR: [
                            { features: { contains: "pistol_grip" } },
                            { features: { contains: "folding_stock" } },
                            { features: { contains: "telescoping_stock" } },
                            { features: { contains: "thumbhole_stock" } },
                            { features: { contains: "flash_suppressor" } },
                            { features: { contains: "bayonet_lug" } },
                            { features: { contains: "grenade_launcher" } }
                        ]
                    }
                ]
            },
            compliant_conditions: {
                OR: [
                    { features: { contains: "fixed_magazine" } },
                    { features: { contains: "featureless" } },
                    { AND: [{ accepts_detachable_magazine: false }] }
                ]
            },
            result_if_prohibited: "critical",
            result_if_compliant: "allowed"
        };

        // Insert the rule
        await client.query(`
            INSERT INTO regulations (
                jurisdiction_id, category, is_restricted, restriction_level,
                statutory_citation, notes, rule_definition
            ) VALUES (
                (SELECT id FROM jurisdictions WHERE type = 'state' AND postal_code = 'NY' LIMIT 1),
                'ny_compliant_rifle',
                true,
                10,
                'N.Y. Penal Law § 265.00(22)(a)',
                'NY SAFE Act: Semi-automatic rifles with detachable magazines must NOT possess prohibited features',
                $1
            ) ON CONFLICT (jurisdiction_id, category) DO UPDATE SET
                rule_definition = EXCLUDED.rule_definition,
                notes = EXCLUDED.notes;
        `, [JSON.stringify(nyRifleRule)]);

        console.log('✓ Inserted NY rifle rule successfully');

        // Now test a mock API call to validate equipment against NY regulations
        console.log('\n🧪 Testing with rifle that has pistol grip and flash suppressor...');
        
        const mockCargoProfile = {
            has_firearms: true,
            has_rifle: true,
            has_handgun: false,
            has_shotgun: false,
            ammunition_capacity: 15,
            firearm_platforms: ['rifle'],
            max_ammunition_capacity_by_platform: {
                rifle: 15,
                handgun: 0,
                shotgun: 0
            }
        };

        // Get NY regulations to test against
        const regulationsResult = await client.query(`
            SELECT r.*, j.name as jurisdiction_name, j.postal_code
            FROM regulations r
            JOIN jurisdictions j ON r.jurisdiction_id = j.id
            WHERE j.postal_code = 'NY' AND r.rule_definition IS NOT NULL
        `);

        console.log(`Found ${regulationsResult.rows.length} rule-based regulations for NY`);

        for (const regulation of regulationsResult.rows) {
            console.log(`\n📋 Testing rule: ${regulation.rule_definition?.rule_name || regulation.category}`);
            
            if (regulation.rule_definition) {
                const rule = regulation.rule_definition;
                
                // Simulate equipment with problematic features
                const testEquipment = {
                    category: 'rifle',
                    platform: 'rifle',
                    ammunition_capacity: 15,
                    accepts_detachable_magazine: true,
                    features: ['pistol_grip', 'flash_suppressor'] // These should trigger NY violation
                };

                console.log(`   Equipment: ${testEquipment.category} with features: [${testEquipment.features.join(', ')}]`);
                
                // Test the prohibited conditions
                const violatesRule = evaluateCondition(rule.prohibited_conditions, testEquipment);
                const isCompliant = rule.compliant_conditions ? evaluateCondition(rule.compliant_conditions, testEquipment) : false;
                
                console.log(`   Violates prohibited conditions: ${violatesRule}`);
                console.log(`   Meets compliant conditions: ${isCompliant}`);
                
                if (violatesRule && !isCompliant) {
                    console.log(`   🚨 ALERT: ${regulation.jurisdiction_name} - ${testEquipment.category} violates ${rule.rule_name}`);
                    console.log(`      Legal definition: ${rule.legal_definition}`);
                } else {
                    console.log(`   ✅ COMPLIANT: Equipment meets ${regulation.jurisdiction_name} requirements`);
                }
            }
        }

        console.log('\n✅ Rule engine test completed successfully!');

    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        await client.end();
    }
}

// Helper function to evaluate rule conditions (simplified version)
function evaluateCondition(condition, equipment) {
    if (!condition || typeof condition !== 'object') {
        return false;
    }

    // Handle AND conditions
    if (condition.AND && Array.isArray(condition.AND)) {
        return condition.AND.every(subCondition => evaluateCondition(subCondition, equipment));
    }

    // Handle OR conditions
    if (condition.OR && Array.isArray(condition.OR)) {
        return condition.OR.some(subCondition => evaluateCondition(subCondition, equipment));
    }

    // Handle direct property checks
    for (const [key, value] of Object.entries(condition)) {
        if (key === 'equipment_category') {
            if (equipment.category !== value) return false;
        } else if (key === 'accepts_detachable_magazine') {
            if (equipment.accepts_detachable_magazine !== value) return false;
        } else if (key === 'features') {
            if (typeof value === 'object' && value !== null && equipment.features) {
                if (value.contains) {
                    if (!equipment.features.includes(value.contains)) return false;
                }
                if (value.excludes_all && Array.isArray(value.excludes_all)) {
                    const hasAnyExcludedFeature = equipment.features.some(feature => 
                        value.excludes_all.includes(feature)
                    );
                    if (hasAnyExcludedFeature) return false;
                }
            }
        }
    }

    return true;
}

testRuleEngine();
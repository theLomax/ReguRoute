// Simple test of the rule evaluation logic
console.log('🧪 Testing Rule Engine Logic...\n');

// Copy the rule evaluation functions from the backend
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
        } else if (key === 'ammunition_capacity') {
            if (typeof value === 'object' && value !== null) {
                const capacityCheck = value;
                const equipmentCapacity = equipment.ammunition_capacity || 0;
                
                if (capacityCheck.gt !== undefined && equipmentCapacity <= capacityCheck.gt) return false;
                if (capacityCheck.gte !== undefined && equipmentCapacity < capacityCheck.gte) return false;
                if (capacityCheck.lt !== undefined && equipmentCapacity >= capacityCheck.lt) return false;
                if (capacityCheck.lte !== undefined && equipmentCapacity > capacityCheck.lte) return false;
            }
        } else if (key === 'features') {
            if (typeof value === 'object' && value !== null && equipment.features) {
                const featureCheck = value;
                
                if (featureCheck.contains) {
                    if (!equipment.features.includes(featureCheck.contains)) return false;
                }
                
                if (featureCheck.excludes_all && Array.isArray(featureCheck.excludes_all)) {
                    const hasAnyExcludedFeature = equipment.features.some(feature => 
                        featureCheck.excludes_all.includes(feature)
                    );
                    if (hasAnyExcludedFeature) return false;
                }
            }
        }
    }

    return true;
}

// Test NY rifle rule
const nyRifleRule = {
    rule_name: "NY Semi-Automatic Rifle Feature Restrictions",
    description: "NY prohibits semi-automatic rifles with detachable magazines that possess certain features",
    prohibited_conditions: {
        AND: [
            { equipment_category: "rifle" },
            { accepts_detachable_magazine: true },
            {
                OR: [
                    { features: { contains: "pistol_grip" } },
                    { features: { contains: "folding_stock" } },
                    { features: { contains: "flash_suppressor" } },
                    { features: { contains: "bayonet_lug" } }
                ]
            }
        ]
    },
    compliant_conditions: {
        OR: [
            { features: { contains: "fixed_magazine" } },
            { features: { contains: "featureless" } },
            { accepts_detachable_magazine: false }
        ]
    }
};

// Test equipment scenarios
const testCases = [
    {
        name: "Standard AR-15 with pistol grip and flash suppressor",
        equipment: {
            category: "rifle",
            accepts_detachable_magazine: true,
            features: ["pistol_grip", "flash_suppressor"]
        },
        expectedViolation: true
    },
    {
        name: "NY-compliant featureless rifle",
        equipment: {
            category: "rifle", 
            accepts_detachable_magazine: true,
            features: ["featureless"]
        },
        expectedViolation: false
    },
    {
        name: "Fixed magazine rifle",
        equipment: {
            category: "rifle",
            accepts_detachable_magazine: false,
            features: ["pistol_grip"] // Features don't matter if fixed mag
        },
        expectedViolation: false
    },
    {
        name: "Handgun (should not trigger rifle rule)",
        equipment: {
            category: "handgun",
            accepts_detachable_magazine: true,
            features: ["pistol_grip"]
        },
        expectedViolation: false
    }
];

console.log('Testing NY Semi-Automatic Rifle Feature Restrictions:\n');

for (const testCase of testCases) {
    console.log(`📋 ${testCase.name}`);
    console.log(`   Equipment: ${testCase.equipment.category}, detachable mag: ${testCase.equipment.accepts_detachable_magazine}, features: [${testCase.equipment.features.join(', ')}]`);
    
    const violatesProhibited = evaluateCondition(nyRifleRule.prohibited_conditions, testCase.equipment);
    const meetsCompliant = evaluateCondition(nyRifleRule.compliant_conditions, testCase.equipment);
    
    const actualViolation = violatesProhibited && !meetsCompliant;
    
    console.log(`   Violates prohibited: ${violatesProhibited}`);
    console.log(`   Meets compliant: ${meetsCompliant}`);
    console.log(`   Final result: ${actualViolation ? '🚨 VIOLATION' : '✅ COMPLIANT'}`);
    console.log(`   Expected: ${testCase.expectedViolation ? 'VIOLATION' : 'COMPLIANT'}`);
    console.log(`   ${actualViolation === testCase.expectedViolation ? '✅ PASS' : '❌ FAIL'}\n`);
}

// Test magazine capacity rule
console.log('Testing NY Magazine Capacity Limit:\n');

const magazineRule = {
    prohibited_conditions: {
        OR: [
            { ammunition_capacity: { gt: 10 } },
            { features: { contains: "capacity_over_ten" } }
        ]
    },
    compliant_conditions: {
        ammunition_capacity: { lte: 10 }
    }
};

const magazineTests = [
    {
        name: "Standard 30-round magazine",
        equipment: { ammunition_capacity: 30 },
        expectedViolation: true
    },
    {
        name: "10-round magazine",
        equipment: { ammunition_capacity: 10 },
        expectedViolation: false
    },
    {
        name: "15-round magazine", 
        equipment: { ammunition_capacity: 15 },
        expectedViolation: true
    }
];

for (const testCase of magazineTests) {
    console.log(`📋 ${testCase.name}`);
    console.log(`   Capacity: ${testCase.equipment.ammunition_capacity} rounds`);
    
    const violatesProhibited = evaluateCondition(magazineRule.prohibited_conditions, testCase.equipment);
    const meetsCompliant = evaluateCondition(magazineRule.compliant_conditions, testCase.equipment);
    
    const actualViolation = violatesProhibited && !meetsCompliant;
    
    console.log(`   Final result: ${actualViolation ? '🚨 VIOLATION' : '✅ COMPLIANT'}`);
    console.log(`   Expected: ${testCase.expectedViolation ? 'VIOLATION' : 'COMPLIANT'}`);
    console.log(`   ${actualViolation === testCase.expectedViolation ? '✅ PASS' : '❌ FAIL'}\n`);
}

console.log('🎯 Rule engine logic test complete!');
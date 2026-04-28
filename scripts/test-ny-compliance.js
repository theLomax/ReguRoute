/**
 * Test script for New York firearm compliance detection
 * Tests known NY-restricted equipment to verify regulation system
 */

const fetch = require('node-fetch');

const API_URL = process.env.API_URL || 'http://localhost:3000';

// Test equipment items that should trigger NY violations
const testEquipment = [
  {
    name: "AR-15 Style Rifle",
    description: "Semi-automatic rifle with detachable magazine",
    category: "rifle",
    platform: "rifle", 
    ammunition_capacity: 30,
    calibers: [".223"],
    features: ["pistol_grip", "flash_suppressor", "bayonet_lug", "folding_stock"],
    notes: "Should trigger NY SAFE Act violation - assault weapon"
  },
  {
    name: "Standard Capacity Magazine",
    description: "30-round magazine for rifle",
    category: "magazine",
    platform: "rifle",
    ammunition_capacity: 30,
    calibers: [".223"],
    features: [],
    notes: "Should trigger NY magazine capacity limit (10 rounds)"
  },
  {
    name: "Glock 17 Standard",
    description: "Semi-automatic pistol with standard 17-round magazine", 
    category: "handgun",
    platform: "handgun",
    ammunition_capacity: 17,
    calibers: ["9mm"],
    features: ["threaded_barrel"],
    notes: "Should trigger NY magazine capacity limit + threaded barrel restriction"
  },
  {
    name: "AK-47 Style Rifle", 
    description: "Semi-automatic rifle with detachable magazine",
    category: "rifle",
    platform: "rifle",
    ammunition_capacity: 30,
    calibers: ["7.62x39"],
    features: ["pistol_grip", "folding_stock", "threaded_barrel"],
    notes: "Should trigger multiple NY SAFE Act violations"
  },
  {
    name: "AR-15 Pistol",
    description: "Pistol with rifle-style features",
    category: "handgun", 
    platform: "handgun",
    ammunition_capacity: 30,
    calibers: [".223"],
    features: ["pistol_grip", "flash_suppressor", "barrel_shroud"],
    notes: "Should trigger NY assault weapon - pistol category"
  },
  {
    name: "Compliant NY Rifle",
    description: "Fixed magazine rifle compliant with NY laws",
    category: "rifle",
    platform: "rifle", 
    ammunition_capacity: 10,
    calibers: [".223"],
    features: ["fixed_magazine"],
    notes: "Should be compliant with NY laws"
  }
];

// Test locations - NY should be problematic, PA should be permissive
const testLocations = [
  { lat: 40.7128, lng: -74.0060, name: "New York, NY", type: "destination" }, // NYC
  { lat: 42.3601, lng: -71.0589, name: "Boston, MA", type: "origin" }, // Boston 
  { lat: 39.9526, lng: -75.1652, name: "Philadelphia, PA", type: "waypoint" }, // Philly
];

async function createTestUser() {
  console.log('Creating test user...');
  const response = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'test-ny@reguroute.com',
      password: 'testpassword123'
    })
  });
  
  if (!response.ok) {
    const existing = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test-ny@reguroute.com',
        password: 'testpassword123'
      })
    });
    
    if (!existing.ok) throw new Error('Failed to create or login test user');
    return existing.json();
  }
  
  return response.json();
}

async function createTestEquipment(token, equipment) {
  console.log(`Creating equipment: ${equipment.name}`);
  const response = await fetch(`${API_URL}/equipment-items`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(equipment)
  });
  
  if (!response.ok) {
    const error = await response.text();
    console.warn(`Failed to create ${equipment.name}: ${error}`);
    return null;
  }
  
  const result = await response.json();
  return result.item;
}

async function createTestLoadout(token, name, itemIds) {
  console.log(`Creating loadout: ${name}`);
  const response = await fetch(`${API_URL}/loadouts`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      name,
      item_ids: itemIds
    })
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create loadout: ${error}`);
  }
  
  const result = await response.json();
  return result.loadout;
}

async function validateLocations(token, loadoutId, locations) {
  console.log('\n=== TESTING LOCATION VALIDATION ===');
  console.log(`Loadout ID: ${loadoutId}`);
  console.log(`Testing locations: ${locations.map(l => l.name).join(', ')}`);
  
  const response = await fetch(`${API_URL}/calculate/validate-locations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      loadout_id: loadoutId,
      locations
    })
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Validation failed: ${error}`);
  }
  
  return response.json();
}

function analyzeValidationResults(results, testName) {
  console.log(`\n📋 ${testName} Results:`);
  console.log(`Overall Compliance: ${results.overall_compliance ? '✅ COMPLIANT' : '❌ NON-COMPLIANT'}`);
  console.log(`Locations: ${results.summary.compliant_locations}/${results.summary.total_locations} compliant`);
  console.log(`Alerts: ${results.summary.total_critical_alerts} critical, ${results.summary.total_warning_alerts} warnings`);
  
  results.location_results.forEach(location => {
    console.log(`\n📍 ${location.location} (${location.type}):`);
    console.log(`   Status: ${location.is_compliant ? '✅ Compliant' : '❌ Issues'}`);
    
    if (location.alerts.length > 0) {
      location.alerts.forEach(alert => {
        const emoji = alert.severity === 'critical' ? '🚨' : alert.severity === 'warning' ? '⚠️' : 'ℹ️';
        console.log(`   ${emoji} ${alert.severity.toUpperCase()}: ${alert.message}`);
        if (alert.citation) console.log(`      Citation: ${alert.citation}`);
      });
    }
    
    if (location.jurisdictions.length > 0) {
      console.log(`   Jurisdictions: ${location.jurisdictions.map(j => j.name).join(', ')}`);
    }
  });
  
  if (results.suggested_modifications.length > 0) {
    console.log('\n💡 Suggestions:');
    results.suggested_modifications.forEach(suggestion => {
      console.log(`   • ${suggestion.description}`);
      console.log(`     Impact: ${suggestion.impact}`);
    });
  }
}

async function runComplianceTest() {
  try {
    console.log('🧪 Starting NY Compliance Test...\n');
    
    // Step 1: Create test user
    const auth = await createTestUser();
    const token = auth.token;
    
    // Step 2: Create test equipment 
    console.log('Creating test equipment...');
    const createdItems = [];
    for (const equipment of testEquipment) {
      const item = await createTestEquipment(token, equipment);
      if (item) {
        createdItems.push({...item, notes: equipment.notes});
        console.log(`✅ Created: ${item.name} (ID: ${item.id})`);
      }
    }
    
    if (createdItems.length === 0) {
      throw new Error('No equipment items created successfully');
    }
    
    // Step 3: Test different loadout combinations
    const testCases = [
      {
        name: "NY Problematic Loadout", 
        items: createdItems.filter(item => 
          item.notes.includes("trigger NY") || 
          item.ammunition_capacity > 10
        ),
        expectViolations: true
      },
      {
        name: "High Capacity Magazine Test",
        items: createdItems.filter(item => 
          item.ammunition_capacity >= 17
        ),
        expectViolations: true 
      },
      {
        name: "NY Compliant Loadout",
        items: createdItems.filter(item => 
          item.notes.includes("compliant") ||
          (item.ammunition_capacity <= 10 && !item.notes.includes("trigger"))
        ),
        expectViolations: false
      }
    ];
    
    // Step 4: Test each loadout
    for (const testCase of testCases) {
      if (testCase.items.length === 0) {
        console.log(`\n⚠️ Skipping ${testCase.name} - no applicable items`);
        continue;
      }
      
      console.log(`\n📦 Testing: ${testCase.name}`);
      console.log(`Equipment: ${testCase.items.map(i => i.name).join(', ')}`);
      
      const loadout = await createTestLoadout(
        token, 
        testCase.name,
        testCase.items.map(i => i.id)
      );
      
      const validationResults = await validateLocations(
        token,
        loadout.id, 
        testLocations
      );
      
      analyzeValidationResults(validationResults, testCase.name);
      
      // Check if results match expectations
      const nyLocation = validationResults.location_results.find(l => l.location.includes('New York'));
      if (nyLocation) {
        const hasViolations = !nyLocation.is_compliant;
        const criticalAlerts = nyLocation.alerts.filter(a => a.severity === 'critical').length;
        
        console.log(`\n🔍 Analysis for NY location:`);
        console.log(`   Expected violations: ${testCase.expectViolations}`);
        console.log(`   Actual violations: ${hasViolations} (${criticalAlerts} critical alerts)`);
        
        if (testCase.expectViolations && !hasViolations) {
          console.log(`   ❌ MISSED: Should have detected violations but didn't`);
        } else if (!testCase.expectViolations && hasViolations) {
          console.log(`   ❌ FALSE POSITIVE: Detected violations in compliant setup`);
        } else {
          console.log(`   ✅ CORRECT: Detection matches expectation`);
        }
      }
    }
    
    console.log('\n=== COMPLIANCE TEST COMPLETE ===\n');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Run the test
runComplianceTest();
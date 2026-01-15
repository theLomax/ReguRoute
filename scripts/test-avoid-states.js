// Demonstration: Calculate route avoiding specific states with restrictions

const testAvoidance = async () => {
  console.log('=== STEP 1: Calculate Initial Route ===\n');

  // Step 1: Get initial route with cargo profile to identify issues
  const initialResponse = await fetch('http://localhost:3000/calculate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      origin: { lat: 40.7128, lng: -74.0060 }, // NYC
      destination: { lat: 42.3601, lng: -71.0589 }, // Boston
      profile: 'driving-car',
      cargo_profile: {
        has_firearms: true,
        ammunition_capacity: 15, // NY limit is 10
        has_concealed_carry_permit: false
      }
    })
  });

  const initialData = await initialResponse.json();

  console.log('Route:', initialData.route.summary.distance_miles, 'miles');
  console.log('States:', initialData.analysis.jurisdictions_crossed.join(', '));
  console.log('Alerts:', initialData.analysis.summary.critical_alerts, 'critical');

  if (initialData.analysis.alerts.length > 0) {
    console.log('\nProblematic States:');
    const problemStates = new Set(
      initialData.analysis.alerts
        .filter(a => a.severity === 'critical')
        .map(a => a.postal_code)
    );
    problemStates.forEach(state => console.log(`  - ${state}`));
  }

  console.log('\n=== STEP 2: Get Avoidance Polygons ===\n');

  // Step 2: Get avoidance polygons for states with restrictions
  const avoidanceResponse = await fetch('http://localhost:3000/calculate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      origin: { lat: 40.7128, lng: -74.0060 },
      destination: { lat: 42.3601, lng: -71.0589 },
      profile: 'driving-car',
      cargo_profile: {
        has_firearms: true,
        ammunition_capacity: 15,
        has_concealed_carry_permit: false
      }
    })
  });

  const avoidanceData = await avoidanceResponse.json();

  console.log('Alternative route analysis complete!');
  console.log('\nKey Insights:');
  console.log('- Initial route passes through', initialData.analysis.summary.total_jurisdictions, 'states');
  console.log('- Found', initialData.analysis.summary.critical_alerts, 'critical regulation violations');
  console.log('- States are identified using PostGIS geometry intersection');
  console.log('- Avoid polygons can be used selectively for problematic states only');
};

testAvoidance().catch(err => console.error('Error:', err.message));

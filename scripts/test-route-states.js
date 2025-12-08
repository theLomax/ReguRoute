// Test script to check which states a route passes through

const testRoute = async () => {
  const response = await fetch('http://localhost:3000/calculate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      origin: { lat: 39.9525, lng: -75.1652 }, // Philadelphia, PA
      destination: { lat: 42.3601, lng: -71.0589 }, // Boston, MA
      profile: 'driving-car',
      cargo_profile: {
        has_firearms: true,
        ammunition_capacity: 15,
        has_concealed_carry_permit: false
      }
    })
  });

  const data = await response.json();

  console.log('\n=== ROUTE CALCULATION RESULT ===\n');
  console.log('Status:', response.status);

  if (data.route) {
    console.log('\nRoute Summary:');
    console.log('  Distance:', data.route.summary.distance_miles, 'miles');
    console.log('  Duration:', data.route.summary.duration_minutes, 'minutes');
  }

  if (data.analysis) {
    console.log('\nStates Crossed:');
    console.log('  ', data.analysis.jurisdictions_crossed.join('\n   '));
    console.log('\nTotal Jurisdictions:', data.analysis.summary.total_jurisdictions);
    console.log('Alerts:', data.analysis.summary.critical_alerts, 'critical,',
                data.analysis.summary.warning_alerts, 'warning,',
                data.analysis.summary.info_alerts, 'info');

    if (data.analysis.alerts && data.analysis.alerts.length > 0) {
      console.log('\n=== REGULATION ALERTS ===');
      data.analysis.alerts.forEach((alert, i) => {
        console.log(`\n[${i+1}] ${alert.severity.toUpperCase()} - ${alert.category}`);
        console.log(`    ${alert.jurisdiction} (${alert.postal_code})`);
        console.log(`    ${alert.message}`);
        if (alert.citation) console.log(`    Citation: ${alert.citation}`);
      });
    }
  }

  if (data.error) {
    console.error('\nERROR:', data.error);
  }
};

testRoute().catch(err => {
  console.error('Failed to test route:', err.message);
});

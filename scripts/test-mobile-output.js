// Simulate what the mobile app will log when calculating a route

const simulateRouteCalculation = () => {
  // Simulated API response (matching real backend format)
  const result = {
    route: {
      geometry: { type: 'LineString', coordinates: [[/* ... */]] },
      summary: {
        distance_meters: 346286,
        distance_km: 346.3,
        distance_miles: 215.2,
        duration_seconds: 17220,
        duration_minutes: 287
      },
      segments: [],
      bbox: [-74.01, 40.71, -71.06, 42.36]
    },
    analysis: {
      jurisdictions_crossed: [
        'Connecticut (CT)',
        'Massachusetts (MA)',
        'New York (NY)'
      ],
      alerts: [
        {
          jurisdiction: 'New York',
          postal_code: 'NY',
          severity: 'critical',
          category: 'Ammunition Capacity',
          message: 'New York limits ammunition capacity to 10 rounds. Your 15-round capacity exceeds the limit.',
          citation: 'N.Y. Penal Law § 265.00'
        },
        {
          jurisdiction: 'New York',
          postal_code: 'NY',
          severity: 'critical',
          category: 'Concealed Carry',
          message: 'New York requires a concealed carry permit. Your permit may not be recognized.',
          citation: 'N.Y. Penal Law § 400.00'
        },
        {
          jurisdiction: 'New York',
          postal_code: 'NY',
          severity: 'warning',
          category: 'Transport Requirements',
          message: 'New York requires firearms be transported unloaded, in a locked container, ammunition stored separately.',
          citation: 'N.Y. Penal Law § 265.20'
        }
      ],
      summary: {
        total_jurisdictions: 3,
        critical_alerts: 2,
        warning_alerts: 1,
        info_alerts: 0
      }
    }
  };

  // This is what will appear in the Expo console
  console.log('\n========== EXPO CONSOLE OUTPUT ==========\n');
  console.log('\n========================================');
  console.log('🗺️  ROUTE CALCULATED');
  console.log('========================================');
  console.log('From: New York, NY');
  console.log('To: Boston, MA');
  console.log(`Distance: ${(result.route.summary.distance_meters / 1609.34).toFixed(1)} miles`);
  console.log(`Duration: ${Math.round(result.route.summary.duration_seconds / 60)} minutes`);
  console.log('\n📍 States Crossed:');
  result.analysis.jurisdictions_crossed.forEach(state => {
    console.log(`   • ${state}`);
  });
  if (result.analysis.alerts.length > 0) {
    console.log('\n⚠️  Regulation Alerts:');
    console.log(`   Critical: ${result.analysis.summary.critical_alerts}`);
    console.log(`   Warning: ${result.analysis.summary.warning_alerts}`);
    console.log(`   Info: ${result.analysis.summary.info_alerts}`);
  } else {
    console.log('\n✅ No regulation alerts');
  }
  console.log('========================================\n');

  console.log('\n========== IN-APP UI DISPLAY ==========\n');
  console.log('📋 Route Preview Screen shows:\n');
  console.log('1. Route Map (with polyline from origin to destination)');
  console.log('2. Route Summary:');
  console.log(`   • Distance: ${result.route.summary.distance_miles} mi`);
  console.log(`   • Duration: ${Math.floor(result.route.summary.duration_minutes / 60)}h ${result.route.summary.duration_minutes % 60}m`);
  console.log('\n3. States Crossed Card:');
  result.analysis.jurisdictions_crossed.forEach(state => {
    console.log(`   • ${state}`);
  });
  console.log(`\n4. Regulation Alerts Card (${result.analysis.alerts.length} alerts):`);
  result.analysis.alerts.forEach((alert, i) => {
    console.log(`   [${i+1}] ${alert.severity.toUpperCase()} - ${alert.category}`);
    console.log(`       ${alert.message}`);
  });
  console.log('\n========================================\n');
};

simulateRouteCalculation();

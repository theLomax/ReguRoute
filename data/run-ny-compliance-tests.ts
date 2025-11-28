/**
 * NY Compliance Test Runner
 * Validates equipment against NY SAFE Act restrictions
 */

import { newYorkRestrictions } from '../packages/types/src/restrictions/new-york';
import { checkEquipmentCompliance } from '../packages/types/src/utils/compliance-checker';
import { completeTestScenarios } from './test-equipment-ny-compliance';
import type { EquipmentItem } from '../packages/types/src/index';

console.log('========================================');
console.log('NY SAFE Act Compliance Test Runner');
console.log('========================================\n');

let passedTests = 0;
let failedTests = 0;

for (const scenario of completeTestScenarios) {
	console.log(`\nTest: ${scenario.description}`);
	console.log('─'.repeat(60));

	// Run compliance check
	const result = checkEquipmentCompliance(
		scenario.equipment as EquipmentItem,
		newYorkRestrictions,
		scenario.magazineCapacity,
	);

	// Check if result matches expected
	const complianceMatch = result.compliant === scenario.expectedCompliant;
	const violationTypesMatch =
		scenario.expectedViolations.length === 0
			? result.violations.length === 0
			: scenario.expectedViolations.every((expectedType) =>
					result.violations.some((v) => v.restriction_type === expectedType),
			  );

	const testPassed = complianceMatch && violationTypesMatch;

	if (testPassed) {
		console.log('✓ PASSED');
		passedTests++;
	} else {
		console.log('✗ FAILED');
		failedTests++;
	}

	console.log(`  Expected: ${scenario.expectedCompliant ? 'COMPLIANT' : 'NON-COMPLIANT'}`);
	console.log(`  Actual:   ${result.compliant ? 'COMPLIANT' : 'NON-COMPLIANT'}`);

	if (result.violations.length > 0) {
		console.log(`  Violations (${result.violations.length}):`);
		result.violations.forEach((v) => {
			console.log(`    - ${v.restriction_type}: ${v.description}`);
		});
	}

	if (result.warnings.length > 0) {
		console.log(`  Warnings (${result.warnings.length}):`);
		result.warnings.forEach((w) => {
			console.log(`    - ${w.restriction_type}: ${w.description}`);
		});
	}

	if (!complianceMatch) {
		console.log('  ⚠ Compliance result does not match expected!');
	}
	if (!violationTypesMatch) {
		console.log('  ⚠ Violation types do not match expected!');
		console.log(`  Expected violation types: ${scenario.expectedViolations.join(', ')}`);
		console.log(
			`  Actual violation types: ${result.violations.map((v) => v.restriction_type).join(', ')}`,
		);
	}
}

console.log('\n========================================');
console.log('Test Summary');
console.log('========================================');
console.log(`Total Tests: ${passedTests + failedTests}`);
console.log(`Passed: ${passedTests}`);
console.log(`Failed: ${failedTests}`);
console.log(`Success Rate: ${((passedTests / (passedTests + failedTests)) * 100).toFixed(1)}%`);

if (failedTests === 0) {
	console.log('\n✓ All tests passed!');
	process.exit(0);
} else {
	console.log(`\n✗ ${failedTests} test(s) failed!`);
	process.exit(1);
}

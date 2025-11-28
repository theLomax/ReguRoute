/**
 * FOPA Compliance Checker Utility
 * Evaluates equipment items against jurisdiction restrictions
 * Determines FOPA (Firearm Owners Protection Act) qualification
 */

import type {
	EquipmentItem,
	JurisdictionRestriction,
	RouteComplianceResult,
	FOPAProtection,
} from '../index';

/**
 * Individual compliance check result
 */
export interface ComplianceCheckResult {
	compliant: boolean;
	violations: JurisdictionRestriction[];
	warnings: JurisdictionRestriction[];
}

/**
 * FOPA compliance analysis result
 */
export interface FOPAAnalysisResult {
	applicable: boolean;
	qualifies: boolean;
	requirements: FOPAProtection['requirements'];
	protected: boolean;
	reason?: string;
}

/**
 * Check if equipment complies with a single restriction
 */
function checkSingleRestriction(
	equipment: EquipmentItem,
	restriction: JurisdictionRestriction,
	magazineCapacity?: number,
): boolean {
	const { restriction_type, applies_to, rule } = restriction;

	// Check if restriction applies to this equipment
	if (!restrictionApplies(equipment, applies_to)) {
		return true; // Doesn't apply, so compliant
	}

	switch (restriction_type) {
		case 'prohibited_category':
			return checkProhibitedCategory(equipment, rule);

		case 'prohibited_nfa':
			return checkProhibitedNFA(equipment, rule);

		case 'prohibited_caliber':
			return checkProhibitedCaliber(equipment, rule);

		case 'max_capacity_universal':
		case 'max_capacity_by_platform':
			return checkMaxCapacity(equipment, rule, magazineCapacity);

		case 'detachable_magazine_ban':
		case 'detachable_magazine_capable_ban':
			return checkDetachableMagazineBan(equipment);

		case 'prohibited_features':
		case 'feature_count_limit':
			return checkFeatureRestrictions(equipment, rule);

		case 'min_barrel_length':
			return checkMinBarrelLength(equipment, rule);

		case 'min_overall_length':
			return checkMinOverallLength(equipment, rule);

		case 'permit_required':
		case 'registration_required':
		case 'transport_requirements':
			// These are regulatory requirements, not prohibitions
			// Mark as compliant but add to warnings
			return true;

		case 'custom':
			// Custom rules need to be evaluated based on conditions
			return checkCustomRule(equipment, rule);

		default:
			console.warn(`Unknown restriction type: ${restriction_type}`);
			return true; // Default to compliant if unknown
	}
}

/**
 * Check if a restriction applies to the given equipment
 */
function restrictionApplies(
	equipment: EquipmentItem,
	applies_to: JurisdictionRestriction['applies_to'],
): boolean {
	// Check category match
	if (applies_to.categories && !applies_to.categories.includes(equipment.category)) {
		return false;
	}

	// Check platform match (for firearms)
	if (applies_to.platforms && equipment.platform) {
		if (!applies_to.platforms.includes(equipment.platform)) {
			return false;
		}
	}

	// Check NFA type match
	if (applies_to.nfa_types && equipment.category === 'nfa_item' && equipment.nfa_subtype) {
		if (!applies_to.nfa_types.includes(equipment.nfa_subtype)) {
			return false;
		}
	}

	// Check caliber match
	if (applies_to.calibers && equipment.calibers) {
		const hasMatchingCaliber = equipment.calibers.some((caliber) =>
			applies_to.calibers!.includes(caliber),
		);
		if (!hasMatchingCaliber) {
			return false;
		}
	}

	// Check feature match
	if (applies_to.features && equipment.features) {
		const hasMatchingFeature = equipment.features.some((feature) =>
			applies_to.features!.includes(feature),
		);
		if (!hasMatchingFeature) {
			return false;
		}
	}

	return true;
}

/**
 * Check prohibited category restriction
 */
function checkProhibitedCategory(equipment: EquipmentItem, rule: any): boolean {
	if (!rule.prohibited) return true;
	return !rule.prohibited.includes(equipment.category);
}

/**
 * Check prohibited NFA restriction
 */
function checkProhibitedNFA(equipment: EquipmentItem, rule: any): boolean {
	if (equipment.category !== 'nfa_item' || !equipment.nfa_subtype) {
		return true;
	}
	if (!rule.prohibited) return true;
	return !rule.prohibited.includes(equipment.nfa_subtype);
}

/**
 * Check prohibited caliber restriction
 */
function checkProhibitedCaliber(equipment: EquipmentItem, rule: any): boolean {
	if (!equipment.calibers || !rule.prohibited) {
		return true;
	}
	return !equipment.calibers.some((caliber) => rule.prohibited.includes(caliber));
}

/**
 * Check maximum capacity restriction
 */
function checkMaxCapacity(equipment: EquipmentItem, rule: any, magazineCapacity?: number): boolean {
	const max = rule.max_value;
	if (max === undefined) return true;

	// Check magazine capacity if provided
	if (magazineCapacity !== undefined && magazineCapacity !== null) {
		return magazineCapacity <= max;
	}

	// Check fixed ammunition capacity
	if (equipment.ammunition_capacity !== undefined && equipment.ammunition_capacity !== null) {
		return equipment.ammunition_capacity <= max;
	}

	// No capacity to check
	return true;
}

/**
 * Check detachable magazine ban
 */
function checkDetachableMagazineBan(equipment: EquipmentItem): boolean {
	return !equipment.accepts_detachable_magazine;
}

/**
 * Check feature-based restrictions
 */
function checkFeatureRestrictions(equipment: EquipmentItem, rule: any): boolean {
	if (!equipment.features || equipment.features.length === 0) {
		return true; // No features, compliant
	}

	// Check if restriction requires detachable magazine
	if (rule.conditions?.requires_detachable_magazine) {
		if (!equipment.accepts_detachable_magazine) {
			return true; // Doesn't have detachable mag, so feature restrictions don't apply
		}
	}

	// Check prohibited features
	if (rule.prohibited) {
		const hasProhibitedFeature = equipment.features.some((feature) =>
			rule.prohibited.includes(feature),
		);
		if (hasProhibitedFeature) {
			return false; // Has a prohibited feature
		}
	}

	// Check feature count limit
	if (rule.max_features !== undefined) {
		const prohibitedFeatures = equipment.features.filter((feature) =>
			rule.prohibited?.includes(feature),
		);
		return prohibitedFeatures.length <= rule.max_features;
	}

	return true;
}

/**
 * Check minimum barrel length restriction
 */
function checkMinBarrelLength(equipment: EquipmentItem, rule: any): boolean {
	const min = rule.min_value;
	if (min === undefined || !equipment.barrel_length_inches) {
		return true;
	}
	return equipment.barrel_length_inches >= min;
}

/**
 * Check minimum overall length restriction
 */
function checkMinOverallLength(equipment: EquipmentItem, rule: any): boolean {
	const min = rule.min_value;
	if (min === undefined || !equipment.overall_length_inches) {
		return true;
	}
	return equipment.overall_length_inches >= min;
}

/**
 * Check custom rule (placeholder for complex rules)
 */
function checkCustomRule(equipment: EquipmentItem, rule: any): boolean {
	// Custom rules would need to be evaluated based on specific conditions
	// For now, default to compliant
	return true;
}

/**
 * Check equipment compliance against jurisdiction restrictions
 * @param equipment Equipment item to check
 * @param restrictions Array of jurisdiction restrictions
 * @param magazineCapacity Optional magazine capacity (for detachable magazines)
 * @returns Compliance check result with violations and warnings
 */
export function checkEquipmentCompliance(
	equipment: EquipmentItem,
	restrictions: JurisdictionRestriction[],
	magazineCapacity?: number,
): ComplianceCheckResult {
	const violations: JurisdictionRestriction[] = [];
	const warnings: JurisdictionRestriction[] = [];

	for (const restriction of restrictions) {
		const compliant = checkSingleRestriction(equipment, restriction, magazineCapacity);

		if (!compliant) {
			if (restriction.severity === 'prohibited') {
				violations.push(restriction);
			} else if (restriction.severity === 'regulated') {
				warnings.push(restriction);
			}
		} else {
			// Even if compliant, check if it's a regulatory requirement
			if (
				restriction.restriction_type === 'permit_required' ||
				restriction.restriction_type === 'registration_required' ||
				restriction.restriction_type === 'transport_requirements'
			) {
				warnings.push(restriction);
			}
		}
	}

	return {
		compliant: violations.length === 0,
		violations,
		warnings,
	};
}

/**
 * Check FOPA qualification for interstate transport
 * @param originCompliant Equipment is legal at origin
 * @param destinationCompliant Equipment is legal at destination
 * @returns FOPA analysis result
 */
export function checkFOPAQualification(
	originCompliant: boolean,
	destinationCompliant: boolean,
): FOPAAnalysisResult {
	const requirements: FOPAProtection['requirements'] = {
		unloaded: true,
		locked_container: true,
		not_readily_accessible: true,
		continuous_travel: true,
	};

	// FOPA requires legal at BOTH origin and destination
	const qualifies = originCompliant && destinationCompliant;

	let reason: string | undefined;
	if (!qualifies) {
		if (!originCompliant && !destinationCompliant) {
			reason = 'Equipment is illegal at both origin and destination';
		} else if (!originCompliant) {
			reason = 'Equipment is illegal at origin';
		} else {
			reason = 'Equipment is illegal at destination';
		}
	}

	return {
		applicable: true, // FOPA applies to all US interstate transport
		qualifies,
		requirements,
		protected: qualifies,
		reason,
	};
}

/**
 * Check route compliance with FOPA analysis
 * @param equipment Equipment item to check
 * @param originRestrictions Origin jurisdiction restrictions
 * @param destinationRestrictions Destination jurisdiction restrictions
 * @param transitRestrictions Array of transit jurisdiction restrictions
 * @param magazineCapacity Optional magazine capacity
 * @returns Array of route compliance results for each jurisdiction
 */
export function checkRouteCompliance(
	equipment: EquipmentItem,
	originJurisdiction: { code: string; name: string; restrictions: JurisdictionRestriction[] },
	destinationJurisdiction: { code: string; name: string; restrictions: JurisdictionRestriction[] },
	transitJurisdictions: Array<{ code: string; name: string; restrictions: JurisdictionRestriction[] }>,
	magazineCapacity?: number,
): RouteComplianceResult[] {
	const results: RouteComplianceResult[] = [];

	// Check origin compliance
	const originCheck = checkEquipmentCompliance(
		equipment,
		originJurisdiction.restrictions,
		magazineCapacity,
	);

	// Check destination compliance
	const destinationCheck = checkEquipmentCompliance(
		equipment,
		destinationJurisdiction.restrictions,
		magazineCapacity,
	);

	// Check FOPA qualification
	const fopaAnalysis = checkFOPAQualification(originCheck.compliant, destinationCheck.compliant);

	// Add origin result
	results.push({
		jurisdiction_code: originJurisdiction.code,
		jurisdiction_name: originJurisdiction.name,
		standard_compliance: {
			compliant: originCheck.compliant,
			violations: originCheck.violations,
			warnings: originCheck.warnings,
		},
		overall_status: originCheck.compliant ? 'compliant' : 'non_compliant',
	});

	// Add destination result
	results.push({
		jurisdiction_code: destinationJurisdiction.code,
		jurisdiction_name: destinationJurisdiction.name,
		standard_compliance: {
			compliant: destinationCheck.compliant,
			violations: destinationCheck.violations,
			warnings: destinationCheck.warnings,
		},
		overall_status: destinationCheck.compliant ? 'compliant' : 'non_compliant',
	});

	// Check transit jurisdictions
	for (const transitJurisdiction of transitJurisdictions) {
		const transitCheck = checkEquipmentCompliance(
			equipment,
			transitJurisdiction.restrictions,
			magazineCapacity,
		);

		// Transit jurisdictions can be FOPA protected
		let overallStatus: 'compliant' | 'fopa_protected' | 'non_compliant';
		if (transitCheck.compliant) {
			overallStatus = 'compliant';
		} else if (fopaAnalysis.protected) {
			overallStatus = 'fopa_protected';
		} else {
			overallStatus = 'non_compliant';
		}

		results.push({
			jurisdiction_code: transitJurisdiction.code,
			jurisdiction_name: transitJurisdiction.name,
			standard_compliance: {
				compliant: transitCheck.compliant,
				violations: transitCheck.violations,
				warnings: transitCheck.warnings,
			},
			fopa_analysis: fopaAnalysis,
			overall_status: overallStatus,
		});
	}

	return results;
}

/**
 * New York SAFE Act Restrictions
 * Proof of concept for jurisdiction-based firearm regulations
 *
 * Key NY Restrictions:
 * 1. Magazine capacity limited to 10 rounds (all platforms)
 * 2. Feature-based restrictions on semi-automatic firearms
 * 3. Pistol registration required (pistol permit system)
 * 4. FOPA transit allowed with proper compliance
 */

import type { JurisdictionRestriction } from '../index';

/**
 * New York state restrictions
 * Implements NY SAFE Act of 2013
 */
export const newYorkRestrictions: JurisdictionRestriction[] = [
	// ========================================
	// Magazine Capacity Restrictions
	// ========================================
	{
		id: 'ny-capacity-limit-universal',
		jurisdiction_code: 'NY',
		jurisdiction_name: 'New York',
		restriction_type: 'max_capacity_universal',
		applies_to: {
			// Applies to all platforms
			platforms: ['handgun', 'rifle', 'shotgun'],
		},
		rule: {
			max_value: 10,
		},
		severity: 'prohibited',
		citation: 'NY Penal Law § 265.00(23) - NY SAFE Act 2013',
		description: 'Magazine capacity limited to 10 rounds for all firearms',
		created_at: new Date().toISOString(),
		updated_at: new Date().toISOString(),
	},

	// ========================================
	// Rifle Feature-Based Restrictions
	// ========================================
	{
		id: 'ny-rifle-feature-ban',
		jurisdiction_code: 'NY',
		jurisdiction_name: 'New York',
		restriction_type: 'feature_count_limit',
		applies_to: {
			platforms: ['rifle'],
		},
		rule: {
			// If rifle has detachable magazine, cannot have ANY of these features
			// If rifle does NOT have detachable magazine, more features allowed
			max_features: 0, // When combined with detachable magazine
			prohibited: [
				'pistol_grip',
				'folding_stock',
				'collapsible_stock',
				'telescoping_stock',
				'thumbhole_stock',
				'flash_suppressor',
				'muzzle_brake', // NY considers this same as flash suppressor
				'grenade_launcher',
				'bayonet_lug',
			],
			conditions: {
				// This restriction only applies to rifles with detachable magazines
				requires_detachable_magazine: true,
			},
		},
		severity: 'prohibited',
		citation: 'NY Penal Law § 265.00(22) - Definition of "assault weapon"',
		description: 'Semi-automatic rifles with detachable magazines cannot have prohibited features',
		created_at: new Date().toISOString(),
		updated_at: new Date().toISOString(),
	},

	// ========================================
	// Pistol/Handgun Feature Restrictions
	// ========================================
	{
		id: 'ny-pistol-feature-ban',
		jurisdiction_code: 'NY',
		jurisdiction_name: 'New York',
		restriction_type: 'feature_count_limit',
		applies_to: {
			platforms: ['handgun'],
		},
		rule: {
			max_features: 0, // When combined with detachable magazine
			prohibited: [
				'folding_stock',
				'telescoping_stock',
				'thumbhole_stock',
				'flash_suppressor',
				'grenade_launcher',
				'barrel_shroud',
			],
			conditions: {
				requires_detachable_magazine: true,
			},
		},
		severity: 'prohibited',
		citation: 'NY Penal Law § 265.00(22)(c)',
		description: 'Semi-automatic pistols with detachable magazines cannot have prohibited features',
		created_at: new Date().toISOString(),
		updated_at: new Date().toISOString(),
	},

	// ========================================
	// Shotgun Feature Restrictions
	// ========================================
	{
		id: 'ny-shotgun-feature-ban',
		jurisdiction_code: 'NY',
		jurisdiction_name: 'New York',
		restriction_type: 'feature_count_limit',
		applies_to: {
			platforms: ['shotgun'],
		},
		rule: {
			max_features: 0,
			prohibited: [
				'pistol_grip',
				'folding_stock',
				'collapsible_stock',
				'telescoping_stock',
				'thumbhole_stock',
			],
			conditions: {
				// Applies to semi-automatic shotguns
				// Our system doesn't track action type, so this applies broadly
			},
		},
		severity: 'prohibited',
		citation: 'NY Penal Law § 265.00(22)(d)',
		description: 'Semi-automatic shotguns cannot have prohibited features',
		created_at: new Date().toISOString(),
		updated_at: new Date().toISOString(),
	},

	// ========================================
	// Administrative Requirements
	// ========================================
	{
		id: 'ny-pistol-permit-required',
		jurisdiction_code: 'NY',
		jurisdiction_name: 'New York',
		restriction_type: 'permit_required',
		applies_to: {
			categories: ['handgun'],
		},
		rule: {
			conditions: {
				permit_type: 'pistol_permit',
				note: 'NY requires pistol permit for possession of any handgun',
			},
		},
		severity: 'regulated',
		citation: 'NY Penal Law § 265.20',
		description: 'Pistol permit required for handgun possession in New York',
		created_at: new Date().toISOString(),
		updated_at: new Date().toISOString(),
	},

	// ========================================
	// NFA Item Restrictions
	// ========================================
	{
		id: 'ny-suppressor-ban',
		jurisdiction_code: 'NY',
		jurisdiction_name: 'New York',
		restriction_type: 'prohibited_nfa',
		applies_to: {
			nfa_types: ['suppressor'],
		},
		rule: {
			prohibited: ['suppressor'],
		},
		severity: 'prohibited',
		citation: 'NY Penal Law § 265.00(23)',
		description: 'Firearm suppressors are prohibited in New York',
		created_at: new Date().toISOString(),
		updated_at: new Date().toISOString(),
	},
];

/**
 * Test scenarios for NY compliance
 * These represent common firearm configurations
 */
export const newYorkTestScenarios = {
	// ========================================
	// COMPLIANT Firearms
	// ========================================
	compliant: {
		// Standard Glock 19 - compliant
		glock19_compliant: {
			name: 'Glock 19 (10-round mag)',
			category: 'handgun' as const,
			platform: 'handgun' as const,
			accepts_detachable_magazine: true,
			calibers: ['9mm' as const],
			ammunition_capacity: null, // Capacity is on the magazine
			features: [], // No prohibited features
			magazine_capacity: 10,
			expected_compliant: true,
			reason: '10-round capacity, no prohibited features',
		},

		// NY-compliant AR-15 - fixed magazine
		ar15_fixed_mag: {
			name: 'AR-15 (NY Compliant - Fixed Mag)',
			category: 'rifle' as const,
			platform: 'rifle' as const,
			accepts_detachable_magazine: false, // Key compliance feature
			calibers: ['.223 Remington' as const],
			ammunition_capacity: 10,
			features: ['pistol_grip'], // OK because NO detachable magazine
			expected_compliant: true,
			reason: 'Fixed magazine means feature restrictions do not apply',
		},

		// Featureless AR-15 - detachable mag but no features
		ar15_featureless: {
			name: 'AR-15 (Featureless)',
			category: 'rifle' as const,
			platform: 'rifle' as const,
			accepts_detachable_magazine: true,
			calibers: ['5.56 NATO' as const],
			ammunition_capacity: null,
			features: [], // No prohibited features - featureless build
			magazine_capacity: 10,
			expected_compliant: true,
			reason: 'Detachable magazine allowed if no prohibited features',
		},

		// Standard hunting rifle
		hunting_rifle: {
			name: 'Remington 700 (Bolt Action)',
			category: 'rifle' as const,
			platform: 'rifle' as const,
			accepts_detachable_magazine: false,
			calibers: ['.308 Winchester' as const],
			ammunition_capacity: 5,
			features: [],
			expected_compliant: true,
			reason: 'Traditional hunting rifle, no restricted features',
		},
	},

	// ========================================
	// NON-COMPLIANT Firearms
	// ========================================
	non_compliant: {
		// Standard AR-15 with 30-round mag
		ar15_standard: {
			name: 'AR-15 (Standard Configuration)',
			category: 'rifle' as const,
			platform: 'rifle' as const,
			accepts_detachable_magazine: true,
			calibers: ['5.56 NATO' as const],
			ammunition_capacity: null,
			features: ['pistol_grip', 'flash_suppressor', 'collapsible_stock'],
			magazine_capacity: 30,
			expected_compliant: false,
			violations: [
				'Magazine capacity exceeds 10 rounds (30 rounds)',
				'Rifle with detachable magazine has prohibited features',
			],
		},

		// Glock 19 with standard 15-round mag
		glock19_standard: {
			name: 'Glock 19 (15-round mag)',
			category: 'handgun' as const,
			platform: 'handgun' as const,
			accepts_detachable_magazine: true,
			calibers: ['9mm' as const],
			ammunition_capacity: null,
			features: [],
			magazine_capacity: 15,
			expected_compliant: false,
			violations: ['Magazine capacity exceeds 10 rounds (15 rounds)'],
		},

		// Suppressor (prohibited NFA item)
		suppressor: {
			name: 'SilencerCo Hybrid 46',
			category: 'nfa_item' as const,
			nfa_subtype: 'suppressor' as const,
			expected_compliant: false,
			violations: ['Suppressors are prohibited in New York'],
		},

		// AK-47 pattern rifle
		ak47: {
			name: 'AK-47 Pattern Rifle',
			category: 'rifle' as const,
			platform: 'rifle' as const,
			accepts_detachable_magazine: true,
			calibers: ['7.62x39mm' as const],
			ammunition_capacity: null,
			features: ['pistol_grip', 'folding_stock', 'muzzle_brake'],
			magazine_capacity: 30,
			expected_compliant: false,
			violations: [
				'Magazine capacity exceeds 10 rounds (30 rounds)',
				'Rifle with detachable magazine has prohibited features',
			],
		},
	},

	// ========================================
	// FOPA Transit Scenarios
	// ========================================
	fopa_transit: {
		// CT → PA through NY with compliant firearm
		scenario_1: {
			description: 'CT to PA through NY - Compliant firearm',
			origin: 'CT',
			destination: 'PA',
			transit_through: ['NY'],
			firearms: ['glock19_compliant'], // References compliant scenario
			legal_at_origin: true,
			legal_at_destination: true,
			fopa_protected: true,
			expected_result: 'fopa_protected',
		},

		// CT → PA through NY with NON-compliant firearm
		scenario_2: {
			description: 'CT to PA through NY - Standard AR-15 (non-compliant in NY)',
			origin: 'CT',
			destination: 'PA',
			transit_through: ['NY'],
			firearms: ['ar15_standard'], // Not compliant in NY
			legal_at_origin: true, // Legal in CT
			legal_at_destination: true, // Legal in PA
			fopa_protected: true, // FOPA allows transit
			expected_result: 'fopa_protected',
			notes: 'Legal to transit through NY under FOPA despite NY restrictions',
		},

		// Origin in NY with non-compliant firearm
		scenario_3: {
			description: 'NY to PA - Standard AR-15 (illegal at origin)',
			origin: 'NY',
			destination: 'PA',
			transit_through: [],
			firearms: ['ar15_standard'],
			legal_at_origin: false, // NOT legal in NY
			legal_at_destination: true,
			fopa_protected: false, // FOPA requires legal at origin
			expected_result: 'non_compliant',
			notes: 'FOPA does not apply - firearm is illegal at origin',
		},

		// Destination in NY with non-compliant firearm
		scenario_4: {
			description: 'PA to NY - Standard AR-15 (illegal at destination)',
			origin: 'PA',
			destination: 'NY',
			transit_through: [],
			firearms: ['ar15_standard'],
			legal_at_origin: true,
			legal_at_destination: false, // NOT legal in NY
			fopa_protected: false, // FOPA requires legal at destination
			expected_result: 'non_compliant',
			notes: 'FOPA does not apply - firearm is illegal at destination',
		},
	},
};

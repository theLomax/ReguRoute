/**
 * Test Equipment Data for NY SAFE Act Compliance Testing
 *
 * This file contains realistic firearm configurations to validate
 * the NY compliance checker against various scenarios.
 */

import type { EquipmentItem } from '@reguroute/types';

/**
 * Test equipment items for NY compliance validation
 */
export const testEquipment = {
	// ========================================
	// COMPLIANT FIREARMS
	// ========================================
	compliant: {
		// Standard handguns with 10-round magazines
		glock19_compliant: {
			name: 'Glock 19 Gen 5 (NY Compliant)',
			category: 'handgun',
			platform: 'handgun',
			accepts_detachable_magazine: true,
			calibers: ['9mm'],
			features: [],
			notes: 'Standard Glock 19 with NY-compliant 10-round magazine',
		} as Partial<EquipmentItem>,

		sig_p320_compliant: {
			name: 'SIG P320 (NY Compliant)',
			category: 'handgun',
			platform: 'handgun',
			accepts_detachable_magazine: true,
			calibers: ['9mm'],
			features: [],
			notes: 'Modular pistol with 10-round magazine',
		} as Partial<EquipmentItem>,

		// Featureless rifles
		ar15_featureless: {
			name: 'AR-15 Featureless (NY Compliant)',
			category: 'rifle',
			platform: 'rifle',
			accepts_detachable_magazine: true,
			calibers: ['5.56 NATO', '.223 Remington'],
			features: [], // No prohibited features
			barrel_length_inches: 16.0,
			overall_length_inches: 34.5,
			notes: 'Featureless AR-15 with fixed stock, no pistol grip, no flash suppressor',
		} as Partial<EquipmentItem>,

		ar15_fixed_mag: {
			name: 'AR-15 Fixed Magazine (NY Compliant)',
			category: 'rifle',
			platform: 'rifle',
			accepts_detachable_magazine: false,
			calibers: ['5.56 NATO'],
			ammunition_capacity: 10,
			features: ['pistol_grip'], // OK with fixed magazine
			barrel_length_inches: 16.0,
			overall_length_inches: 32.0,
			notes: 'AR-15 with fixed 10-round magazine - features allowed',
		} as Partial<EquipmentItem>,

		mini14_compliant: {
			name: 'Ruger Mini-14 Ranch Rifle',
			category: 'rifle',
			platform: 'rifle',
			accepts_detachable_magazine: true,
			calibers: ['.223 Remington'],
			features: [],
			barrel_length_inches: 18.5,
			overall_length_inches: 37.25,
			notes: 'Traditional semi-auto rifle, no prohibited features',
		} as Partial<EquipmentItem>,

		// Traditional hunting rifles
		remington_700: {
			name: 'Remington 700 Bolt Action',
			category: 'rifle',
			platform: 'rifle',
			accepts_detachable_magazine: false,
			calibers: ['.308 Winchester'],
			ammunition_capacity: 5,
			features: [],
			barrel_length_inches: 24.0,
			overall_length_inches: 44.5,
			notes: 'Traditional bolt-action hunting rifle',
		} as Partial<EquipmentItem>,

		// Shotguns
		mossberg_500: {
			name: 'Mossberg 500 Pump Action',
			category: 'shotgun',
			platform: 'shotgun',
			accepts_detachable_magazine: false,
			calibers: ['12 Gauge'],
			ammunition_capacity: 5,
			features: [],
			barrel_length_inches: 18.5,
			overall_length_inches: 38.5,
			notes: 'Pump-action shotgun, no prohibited features',
		} as Partial<EquipmentItem>,

		remington_870: {
			name: 'Remington 870 Express',
			category: 'shotgun',
			platform: 'shotgun',
			accepts_detachable_magazine: false,
			calibers: ['12 Gauge'],
			ammunition_capacity: 4,
			features: [],
			barrel_length_inches: 26.0,
			overall_length_inches: 46.5,
			notes: 'Standard pump shotgun for hunting',
		} as Partial<EquipmentItem>,

		// Revolvers (fixed capacity)
		smith_wesson_686: {
			name: 'Smith & Wesson 686',
			category: 'handgun',
			platform: 'handgun',
			accepts_detachable_magazine: false,
			calibers: ['.357 Magnum'],
			ammunition_capacity: 6,
			features: [],
			barrel_length_inches: 4.0,
			notes: 'Revolver, 6-round capacity',
		} as Partial<EquipmentItem>,

		// Compliant magazines
		pmag_10rd: {
			name: 'Magpul PMAG 10-Round (5.56)',
			category: 'magazine',
			platform: 'rifle',
			ammunition_capacity: 10,
			notes: 'NY-compliant 10-round AR-15 magazine',
		} as Partial<EquipmentItem>,

		glock_mag_10rd: {
			name: 'Glock 19 10-Round Magazine',
			category: 'magazine',
			platform: 'handgun',
			ammunition_capacity: 10,
			notes: 'Factory 10-round Glock magazine',
		} as Partial<EquipmentItem>,
	},

	// ========================================
	// NON-COMPLIANT FIREARMS
	// ========================================
	non_compliant: {
		// Standard configuration rifles
		ar15_standard: {
			name: 'AR-15 Standard Configuration',
			category: 'rifle',
			platform: 'rifle',
			accepts_detachable_magazine: true,
			calibers: ['5.56 NATO'],
			features: ['pistol_grip', 'flash_suppressor', 'collapsible_stock'],
			barrel_length_inches: 16.0,
			overall_length_inches: 32.0,
			notes: 'VIOLATION: Detachable mag + prohibited features',
		} as Partial<EquipmentItem>,

		ak47_standard: {
			name: 'AK-47 Pattern Rifle',
			category: 'rifle',
			platform: 'rifle',
			accepts_detachable_magazine: true,
			calibers: ['7.62x39mm'],
			features: ['pistol_grip', 'folding_stock', 'muzzle_brake'],
			barrel_length_inches: 16.5,
			overall_length_inches: 34.3,
			notes: 'VIOLATION: Detachable mag + prohibited features',
		} as Partial<EquipmentItem>,

		// Handguns with high-capacity magazines
		glock19_standard: {
			name: 'Glock 19 Standard (15-round)',
			category: 'handgun',
			platform: 'handgun',
			accepts_detachable_magazine: true,
			calibers: ['9mm'],
			features: [],
			notes: 'VIOLATION: Needs 15-round magazine (over 10-round limit)',
		} as Partial<EquipmentItem>,

		glock17_extended: {
			name: 'Glock 17 with Extended Magazine',
			category: 'handgun',
			platform: 'handgun',
			accepts_detachable_magazine: true,
			calibers: ['9mm'],
			features: [],
			notes: 'VIOLATION: Needs 17+ round magazine',
		} as Partial<EquipmentItem>,

		// Shotguns with prohibited features
		mossberg_590_tactical: {
			name: 'Mossberg 590 Tactical',
			category: 'shotgun',
			platform: 'shotgun',
			accepts_detachable_magazine: false,
			calibers: ['12 Gauge'],
			ammunition_capacity: 8,
			features: ['pistol_grip'],
			barrel_length_inches: 18.5,
			notes: 'VIOLATION: Semi-auto shotgun with pistol grip (if semi-auto)',
		} as Partial<EquipmentItem>,

		// NFA items - Suppressors
		silencerco_hybrid: {
			name: 'SilencerCo Hybrid 46',
			category: 'nfa_item',
			nfa_subtype: 'suppressor',
			calibers: ['.45 ACP', '9mm', '.308 Winchester'],
			notes: 'VIOLATION: Suppressors prohibited in NY',
		} as Partial<EquipmentItem>,

		dead_air_sandman: {
			name: 'Dead Air Sandman-S',
			category: 'nfa_item',
			nfa_subtype: 'suppressor',
			calibers: ['5.56 NATO', '.308 Winchester'],
			notes: 'VIOLATION: Suppressors prohibited in NY',
		} as Partial<EquipmentItem>,

		// Short barrel rifle (would also need length check)
		ar15_sbr: {
			name: 'AR-15 SBR 10.5"',
			category: 'nfa_item',
			nfa_subtype: 'sbr',
			platform: 'rifle',
			accepts_detachable_magazine: true,
			calibers: ['5.56 NATO'],
			features: ['pistol_grip', 'flash_suppressor'],
			barrel_length_inches: 10.5,
			overall_length_inches: 27.0,
			notes: 'VIOLATION: Multiple - SBR, features, capacity',
		} as Partial<EquipmentItem>,

		// High-capacity magazines
		pmag_30rd: {
			name: 'Magpul PMAG 30-Round',
			category: 'magazine',
			platform: 'rifle',
			ammunition_capacity: 30,
			notes: 'VIOLATION: Exceeds 10-round capacity limit',
		} as Partial<EquipmentItem>,

		drum_mag_60rd: {
			name: 'Magpul D-60 Drum Magazine',
			category: 'magazine',
			platform: 'rifle',
			ammunition_capacity: 60,
			notes: 'VIOLATION: Exceeds 10-round capacity limit',
		} as Partial<EquipmentItem>,

		glock_mag_33rd: {
			name: 'Glock 33-Round Magazine',
			category: 'magazine',
			platform: 'handgun',
			ammunition_capacity: 33,
			notes: 'VIOLATION: Exceeds 10-round capacity limit',
		} as Partial<EquipmentItem>,
	},

	// ========================================
	// EDGE CASES
	// ========================================
	edge_cases: {
		// Single feature violation
		ar15_pistol_grip_only: {
			name: 'AR-15 with Only Pistol Grip',
			category: 'rifle',
			platform: 'rifle',
			accepts_detachable_magazine: true,
			calibers: ['5.56 NATO'],
			features: ['pistol_grip'], // Just one feature
			barrel_length_inches: 16.0,
			notes: 'VIOLATION: Even single prohibited feature is non-compliant',
		} as Partial<EquipmentItem>,

		// Exactly 10 rounds (should be compliant)
		glock19_10rd_exact: {
			name: 'Glock 19 with Exactly 10 Rounds',
			category: 'handgun',
			platform: 'handgun',
			accepts_detachable_magazine: true,
			calibers: ['9mm'],
			features: [],
			notes: 'COMPLIANT: Exactly at 10-round limit',
		} as Partial<EquipmentItem>,

		// Fixed magazine with high capacity (compliant for features, not capacity)
		sks_fixed_mag: {
			name: 'SKS with Fixed 10-Round Magazine',
			category: 'rifle',
			platform: 'rifle',
			accepts_detachable_magazine: false,
			calibers: ['7.62x39mm'],
			ammunition_capacity: 10,
			features: [],
			barrel_length_inches: 20.5,
			notes: 'COMPLIANT: Fixed magazine, no prohibited features',
		} as Partial<EquipmentItem>,

		// Multi-caliber firearm
		ar15_multi_caliber: {
			name: 'AR-15 Multi-Caliber Upper',
			category: 'rifle',
			platform: 'rifle',
			accepts_detachable_magazine: true,
			calibers: ['5.56 NATO', '.223 Remington', '.300 Blackout'],
			features: [],
			barrel_length_inches: 16.0,
			notes: 'COMPLIANT: Featureless, multiple calibers',
		} as Partial<EquipmentItem>,

		// Pistol with threaded barrel (feature violation)
		glock19_threaded: {
			name: 'Glock 19 with Threaded Barrel',
			category: 'handgun',
			platform: 'handgun',
			accepts_detachable_magazine: true,
			calibers: ['9mm'],
			features: ['threaded_barrel'],
			notes: 'Check if threaded barrel is prohibited for handguns in NY',
		} as Partial<EquipmentItem>,

		// Other NFA items (not suppressors)
		short_barrel_shotgun: {
			name: 'SBS 12" Barrel',
			category: 'nfa_item',
			nfa_subtype: 'sbs',
			platform: 'shotgun',
			calibers: ['12 Gauge'],
			barrel_length_inches: 12.0,
			overall_length_inches: 26.5,
			notes: 'NFA item, but not suppressor - check NY restrictions',
		} as Partial<EquipmentItem>,

		any_other_weapon: {
			name: 'AOW - Vertical Foregrip Pistol',
			category: 'nfa_item',
			nfa_subtype: 'aow',
			calibers: ['9mm'],
			notes: 'AOW classification - check NY restrictions',
		} as Partial<EquipmentItem>,

		// Muzzle brake (treated as flash suppressor in NY)
		ar15_muzzle_brake: {
			name: 'AR-15 with Muzzle Brake',
			category: 'rifle',
			platform: 'rifle',
			accepts_detachable_magazine: true,
			calibers: ['5.56 NATO'],
			features: ['muzzle_brake'], // NY considers this prohibited
			barrel_length_inches: 16.0,
			notes: 'VIOLATION: NY treats muzzle brake as flash suppressor',
		} as Partial<EquipmentItem>,
	},
};

/**
 * Magazine capacity test scenarios
 * These are passed as separate parameter to compliance checker
 */
export const magazineCapacityTests = {
	compliant: {
		'5_rounds': 5,
		'10_rounds': 10, // Exactly at limit
		'7_rounds': 7,
	},
	non_compliant: {
		'15_rounds': 15,
		'17_rounds': 17,
		'30_rounds': 30,
		'33_rounds': 33,
		'60_rounds': 60,
		'100_rounds': 100,
	},
};

/**
 * Complete test scenarios combining equipment + magazine capacity
 */
export const completeTestScenarios = [
	// COMPLIANT scenarios
	{
		description: 'Glock 19 with 10-round magazine',
		equipment: testEquipment.compliant.glock19_compliant,
		magazineCapacity: 10,
		expectedCompliant: true,
		expectedViolations: [],
	},
	{
		description: 'Featureless AR-15 with 10-round magazine',
		equipment: testEquipment.compliant.ar15_featureless,
		magazineCapacity: 10,
		expectedCompliant: true,
		expectedViolations: [],
	},
	{
		description: 'AR-15 with fixed 10-round magazine (features OK)',
		equipment: testEquipment.compliant.ar15_fixed_mag,
		magazineCapacity: undefined, // Fixed magazine
		expectedCompliant: true,
		expectedViolations: [],
	},
	{
		description: 'Bolt-action hunting rifle',
		equipment: testEquipment.compliant.remington_700,
		magazineCapacity: undefined,
		expectedCompliant: true,
		expectedViolations: [],
	},

	// NON-COMPLIANT scenarios
	{
		description: 'AR-15 with prohibited features + 30-round mag',
		equipment: testEquipment.non_compliant.ar15_standard,
		magazineCapacity: 30,
		expectedCompliant: false,
		expectedViolations: ['max_capacity_universal', 'feature_count_limit'],
	},
	{
		description: 'Glock 19 with 15-round magazine',
		equipment: testEquipment.non_compliant.glock19_standard,
		magazineCapacity: 15,
		expectedCompliant: false,
		expectedViolations: ['max_capacity_universal'],
	},
	{
		description: 'Suppressor (prohibited NFA item)',
		equipment: testEquipment.non_compliant.silencerco_hybrid,
		magazineCapacity: undefined,
		expectedCompliant: false,
		expectedViolations: ['prohibited_nfa'],
	},
	{
		description: 'AK-47 with features + 30-round mag',
		equipment: testEquipment.non_compliant.ak47_standard,
		magazineCapacity: 30,
		expectedCompliant: false,
		expectedViolations: ['max_capacity_universal', 'feature_count_limit'],
	},

	// EDGE CASES
	{
		description: 'AR-15 with single prohibited feature (pistol grip)',
		equipment: testEquipment.edge_cases.ar15_pistol_grip_only,
		magazineCapacity: 10,
		expectedCompliant: false,
		expectedViolations: ['feature_count_limit'],
	},
	{
		description: 'Glock 19 exactly at 10-round limit',
		equipment: testEquipment.edge_cases.glock19_10rd_exact,
		magazineCapacity: 10,
		expectedCompliant: true,
		expectedViolations: [],
	},
	{
		description: 'AR-15 with muzzle brake (treated as flash suppressor)',
		equipment: testEquipment.edge_cases.ar15_muzzle_brake,
		magazineCapacity: 10,
		expectedCompliant: false,
		expectedViolations: ['feature_count_limit'],
	},
];

/**
 * FOPA transit test scenarios
 */
export const fopaTransitScenarios = [
	{
		description: 'CT → PA through NY with compliant firearm',
		origin: 'CT',
		destination: 'PA',
		transitJurisdictions: ['NY'],
		equipment: testEquipment.compliant.glock19_compliant,
		magazineCapacity: 10,
		expectedOriginCompliant: true,
		expectedDestinationCompliant: true,
		expectedNYStatus: 'compliant',
		expectedFOPAProtection: false, // Not needed, already compliant
	},
	{
		description: 'CT → PA through NY with standard AR-15',
		origin: 'CT',
		destination: 'PA',
		transitJurisdictions: ['NY'],
		equipment: testEquipment.non_compliant.ar15_standard,
		magazineCapacity: 30,
		expectedOriginCompliant: true, // Legal in CT
		expectedDestinationCompliant: true, // Legal in PA
		expectedNYStatus: 'fopa_protected',
		expectedFOPAProtection: true,
	},
	{
		description: 'NY → PA with standard AR-15 (illegal at origin)',
		origin: 'NY',
		destination: 'PA',
		transitJurisdictions: [],
		equipment: testEquipment.non_compliant.ar15_standard,
		magazineCapacity: 30,
		expectedOriginCompliant: false, // NOT legal in NY
		expectedDestinationCompliant: true,
		expectedNYStatus: 'non_compliant',
		expectedFOPAProtection: false, // FOPA requires legal at origin
	},
	{
		description: 'PA → NY with standard AR-15 (illegal at destination)',
		origin: 'PA',
		destination: 'NY',
		transitJurisdictions: [],
		equipment: testEquipment.non_compliant.ar15_standard,
		magazineCapacity: 30,
		expectedOriginCompliant: true,
		expectedDestinationCompliant: false, // NOT legal in NY
		expectedNYStatus: 'non_compliant',
		expectedFOPAProtection: false, // FOPA requires legal at destination
	},
];

import type { Caliber } from '@reguroute/types';

export interface CaliberData {
	name: Caliber;
	category: 'handgun' | 'rifle' | 'shotgun' | 'other';
	diameter_mm: number; // Actual diameter in millimeters
	normalized_diameter: number; // Diameter in 0.01mm units (diameter_mm * 100) for integer comparison
}

/**
 * Comprehensive caliber database with actual and normalized diameters
 * Normalized diameter is converted to integer hundredths of mm for regulation matching
 * Formula: normalized_diameter = Math.round(diameter_mm * 100)
 *
 * Conversion note: 1 inch = 25.4mm
 */
export const CALIBER_DATABASE: CaliberData[] = [
	// ============================================
	// Handgun Calibers
	// ============================================
	{
		name: '.22 LR',
		category: 'handgun',
		diameter_mm: 5.6,
		normalized_diameter: 560,
	},
	{
		name: '.25 ACP',
		category: 'handgun',
		diameter_mm: 6.35,
		normalized_diameter: 635,
	},
	{
		name: '.32 ACP',
		category: 'handgun',
		diameter_mm: 7.65,
		normalized_diameter: 765,
	},
	{
		name: '.380 ACP',
		category: 'handgun',
		diameter_mm: 9.0,
		normalized_diameter: 900,
	},
	{
		name: '9mm',
		category: 'handgun',
		diameter_mm: 9.0,
		normalized_diameter: 900,
	},
	{
		name: '.38 Special',
		category: 'handgun',
		diameter_mm: 9.1,
		normalized_diameter: 910,
	},
	{
		name: '.357 Magnum',
		category: 'handgun',
		diameter_mm: 9.1,
		normalized_diameter: 910,
	},
	{
		name: '.357 SIG',
		category: 'handgun',
		diameter_mm: 9.0,
		normalized_diameter: 900,
	},
	{
		name: '10mm Auto',
		category: 'handgun',
		diameter_mm: 10.2,
		normalized_diameter: 1020,
	},
	{
		name: '.40 S&W',
		category: 'handgun',
		diameter_mm: 10.2,
		normalized_diameter: 1020,
	},
	{
		name: '.44 Magnum',
		category: 'handgun',
		diameter_mm: 10.9,
		normalized_diameter: 1090,
	},
	{
		name: '.45 ACP',
		category: 'handgun',
		diameter_mm: 11.5,
		normalized_diameter: 1150,
	},
	{
		name: '.45 Colt',
		category: 'handgun',
		diameter_mm: 11.5,
		normalized_diameter: 1150,
	},
	{
		name: '5.7x28mm',
		category: 'handgun',
		diameter_mm: 5.7,
		normalized_diameter: 570,
	},

	// ============================================
	// Rifle Calibers
	// ============================================
	{
		name: '.223 Remington',
		category: 'rifle',
		diameter_mm: 5.56,
		normalized_diameter: 556,
	},
	{
		name: '5.56 NATO',
		category: 'rifle',
		diameter_mm: 5.56,
		normalized_diameter: 556,
	},
	{
		name: '.224 Valkyrie',
		category: 'rifle',
		diameter_mm: 5.69,
		normalized_diameter: 569,
	},
	{
		name: '6.5 Creedmoor',
		category: 'rifle',
		diameter_mm: 6.71,
		normalized_diameter: 671,
	},
	{
		name: '6.5 Grendel',
		category: 'rifle',
		diameter_mm: 6.71,
		normalized_diameter: 671,
	},
	{
		name: '.243 Winchester',
		category: 'rifle',
		diameter_mm: 6.17,
		normalized_diameter: 617,
	},
	{
		name: '.270 Winchester',
		category: 'rifle',
		diameter_mm: 6.86,
		normalized_diameter: 686,
	},
	{
		name: '7mm Remington Magnum',
		category: 'rifle',
		diameter_mm: 7.21,
		normalized_diameter: 721,
	},
	{
		name: '7.62x39mm',
		category: 'rifle',
		diameter_mm: 7.62,
		normalized_diameter: 762,
	},
	{
		name: '.300 Blackout',
		category: 'rifle',
		diameter_mm: 7.82,
		normalized_diameter: 782,
	},
	{
		name: '.300 Winchester Magnum',
		category: 'rifle',
		diameter_mm: 7.82,
		normalized_diameter: 782,
	},
	{
		name: '.308 Winchester',
		category: 'rifle',
		diameter_mm: 7.82,
		normalized_diameter: 782,
	},
	{
		name: '7.62 NATO',
		category: 'rifle',
		diameter_mm: 7.62,
		normalized_diameter: 762,
	},
	{
		name: '.30-06 Springfield',
		category: 'rifle',
		diameter_mm: 7.82,
		normalized_diameter: 782,
	},
	{
		name: '.30-30 Winchester',
		category: 'rifle',
		diameter_mm: 7.82,
		normalized_diameter: 782,
	},
	{
		name: '.338 Lapua Magnum',
		category: 'rifle',
		diameter_mm: 8.58,
		normalized_diameter: 858,
	},
	{
		name: '.450 Bushmaster',
		category: 'rifle',
		diameter_mm: 11.5,
		normalized_diameter: 1150,
	},
	{
		name: '.458 SOCOM',
		category: 'rifle',
		diameter_mm: 11.6,
		normalized_diameter: 1160,
	},
	{
		name: '.50 BMG',
		category: 'rifle',
		diameter_mm: 12.7,
		normalized_diameter: 1270,
	},

	// ============================================
	// Shotgun Gauges (bore diameter)
	// ============================================
	{
		name: '12 Gauge',
		category: 'shotgun',
		diameter_mm: 18.5,
		normalized_diameter: 1850,
	},
	{
		name: '20 Gauge',
		category: 'shotgun',
		diameter_mm: 15.6,
		normalized_diameter: 1560,
	},
	{
		name: '16 Gauge',
		category: 'shotgun',
		diameter_mm: 16.8,
		normalized_diameter: 1680,
	},
	{
		name: '28 Gauge',
		category: 'shotgun',
		diameter_mm: 13.8,
		normalized_diameter: 1380,
	},
	{
		name: '.410 Bore',
		category: 'shotgun',
		diameter_mm: 10.4,
		normalized_diameter: 1040,
	},

	// ============================================
	// Other/Custom
	// ============================================
	{
		name: 'Other',
		category: 'other',
		diameter_mm: 0,
		normalized_diameter: 0,
	},
];

/**
 * Get calibers filtered by category
 */
export function getCalibersByCategory(category: 'handgun' | 'rifle' | 'shotgun' | 'all'): CaliberData[] {
	if (category === 'all') {
		return CALIBER_DATABASE;
	}
	return CALIBER_DATABASE.filter(c => c.category === category || c.category === 'other');
}

/**
 * Get caliber data by name
 */
export function getCaliberData(name: Caliber): CaliberData | undefined {
	return CALIBER_DATABASE.find(c => c.name === name);
}

/**
 * Find calibers within a diameter range (for regulation matching)
 */
export function getCalibersByDiameterRange(minMm: number, maxMm: number): CaliberData[] {
	return CALIBER_DATABASE.filter(c =>
		c.normalized_diameter >= minMm && c.normalized_diameter <= maxMm
	);
}

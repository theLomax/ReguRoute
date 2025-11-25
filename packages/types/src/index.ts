/**
 * Shared TypeScript types for ReguRoute
 * Used by both backend and mobile apps
 */

import type { LineString } from 'geojson';

// ============================================
// Auth Types
// ============================================

export interface User {
	id: string;
	email: string;
	created_at: string;
	updated_at?: string;
}

export interface AuthResponse {
	user: User;
	token: string;
}

export interface LoginRequest {
	email: string;
	password: string;
}

export interface RegisterRequest {
	email: string;
	password: string;
}

// ============================================
// Equipment Item Types
// ============================================

/** Platform/type of firearm - used for platform-specific regulations */
export type FirearmPlatform = 'handgun' | 'rifle' | 'shotgun';

/** @deprecated Use FirearmPlatform instead */
export type FirearmType = FirearmPlatform;

/** NFA item sub-types for specific classification */
export type NFASubtype = 'suppressor' | 'sbr' | 'sbs' | 'aow' | 'machine_gun' | 'destructive_device';

/**
 * Common caliber/cartridge types
 * Organized by category for UI grouping
 */
export type Caliber =
	// Handgun calibers
	| '.22 LR'
	| '.25 ACP'
	| '.32 ACP'
	| '.380 ACP'
	| '9mm'
	| '.38 Special'
	| '.357 Magnum'
	| '.357 SIG'
	| '10mm Auto'
	| '.40 S&W'
	| '.44 Magnum'
	| '.45 ACP'
	| '.45 Colt'
	| '5.7x28mm'
	// Rifle calibers
	| '.223 Remington'
	| '5.56 NATO'
	| '.224 Valkyrie'
	| '6.5 Creedmoor'
	| '6.5 Grendel'
	| '.243 Winchester'
	| '.270 Winchester'
	| '7mm Remington Magnum'
	| '7.62x39mm'
	| '.300 Blackout'
	| '.300 Winchester Magnum'
	| '.308 Winchester'
	| '7.62 NATO'
	| '.30-06 Springfield'
	| '.30-30 Winchester'
	| '.338 Lapua Magnum'
	| '.450 Bushmaster'
	| '.458 SOCOM'
	| '.50 BMG'
	// Shotgun gauges
	| '12 Gauge'
	| '20 Gauge'
	| '16 Gauge'
	| '28 Gauge'
	| '.410 Bore'
	// Other/uncommon
	| 'Other';

/** @deprecated Use NFASubtype instead */
export type NFAItemType = NFASubtype;

/**
 * Equipment item categories
 * - handgun/rifle/shotgun: Firearms by platform
 * - nfa_item: NFA-regulated items (suppressors, SBRs, etc.)
 * - magazine: Detachable magazines (capacity tracked here)
 * - other: Accessories, ammo, cases, etc.
 */
export type EquipmentItemCategory = FirearmPlatform | 'nfa_item' | 'magazine' | 'other';

/** All possible equipment item types (legacy alias) */
export type EquipmentItemType = EquipmentItemCategory;

/**
 * Individual equipment item
 * Each piece of equipment is its own entry:
 * - A rifle with 2 mags and a suppressor = 4 items
 * - A shotgun with tube feed = 1 item (capacity on the firearm)
 */
export interface EquipmentItem {
	id: string;
	user_id: string;
	name: string; // User-friendly name, e.g., "Glock 19", "AR-15 Build", "30rd PMAG"
	category: EquipmentItemCategory;

	// For firearms (handgun/rifle/shotgun)
	accepts_detachable_magazine?: boolean; // If true, capacity is tracked on magazine items
	calibers?: Caliber[]; // Calibers this firearm can chamber (multi-caliber support)

	// For magazines
	platform?: FirearmPlatform; // What platform this magazine is for (for regulation matching)

	// Capacity - applies to:
	// - Firearms WITHOUT detachable mags (tube-fed shotguns, revolvers, etc.)
	// - Magazines (detachable mags have their own capacity)
	ammunition_capacity?: number;

	// NFA-specific fields
	nfa_subtype?: NFASubtype; // Required if category is 'nfa_item'

	// Measurement fields (for SBR/SBS classification, concealment laws)
	barrel_length_inches?: number;
	overall_length_inches?: number;

	notes?: string;
	created_at: string;
	updated_at: string;
}

export interface CreateEquipmentItemRequest {
	name: string;
	category: EquipmentItemCategory;
	accepts_detachable_magazine?: boolean;
	calibers?: Caliber[];
	platform?: FirearmPlatform;
	ammunition_capacity?: number;
	nfa_subtype?: NFASubtype;
	barrel_length_inches?: number;
	overall_length_inches?: number;
	notes?: string;
}

export interface UpdateEquipmentItemRequest {
	name?: string;
	category?: EquipmentItemCategory;
	accepts_detachable_magazine?: boolean;
	calibers?: Caliber[];
	platform?: FirearmPlatform;
	ammunition_capacity?: number;
	nfa_subtype?: NFASubtype;
	barrel_length_inches?: number;
	overall_length_inches?: number;
	notes?: string;
}

// ============================================
// Loadout Types (Collection of Equipment Items)
// ============================================

/** A loadout is a named collection of equipment items for a trip */
export interface Loadout {
	id: string;
	user_id: string;
	name: string; // e.g., "Range Day Kit", "Hunting Trip", "Competition Setup"
	description?: string;
	is_default: boolean;
	items: LoadoutItem[]; // Equipment items included in this loadout
	created_at: string;
	updated_at: string;
}

/** Junction between loadout and equipment item, with optional quantity */
export interface LoadoutItem {
	equipment_item_id: string;
	equipment_item: EquipmentItem; // Populated when fetching loadout
	quantity: number; // Default 1, allows multiple of same item
}

export interface CreateLoadoutRequest {
	name: string;
	description?: string;
	is_default?: boolean;
	item_ids?: string[]; // Equipment item IDs to include
}

export interface UpdateLoadoutRequest {
	name?: string;
	description?: string;
	is_default?: boolean;
}

export interface AddLoadoutItemRequest {
	equipment_item_id: string;
	quantity?: number;
}

// ============================================
// User Permits (CCW, etc.)
// ============================================

/** User's concealed carry permits - separate from equipment */
export interface UserPermit {
	id: string;
	user_id: string;
	permit_type: 'ccw' | 'ltc' | 'chl'; // CCW, License to Carry, Concealed Handgun License
	issuing_state: string; // State postal code (e.g., "TX", "FL")
	issue_date?: string;
	expiration_date?: string;
	is_active: boolean;
	created_at: string;
	updated_at: string;
}

export interface CreateUserPermitRequest {
	permit_type: 'ccw' | 'ltc' | 'chl';
	issuing_state: string;
	issue_date?: string;
	expiration_date?: string;
}

// ============================================
// Cargo Profile (Computed from Loadout + Permits)
// ============================================

/**
 * CargoProfile is computed from a Loadout and UserPermits
 * Used for route analysis - aggregates all relevant restrictions
 */
export interface CargoProfile {
	has_firearms: boolean;
	firearm_platforms: FirearmPlatform[]; // Unique platforms in loadout
	max_ammunition_capacity_by_platform: Record<FirearmPlatform, number>; // Max capacity per platform
	has_nfa_items: boolean;
	nfa_subtypes: NFASubtype[]; // Types of NFA items present
	has_concealed_carry_permit: boolean;
	permit_states: string[]; // States where user holds valid CCW permits
	// Computed flags for quick regulation checks
	has_handgun: boolean;
	has_rifle: boolean;
	has_shotgun: boolean;
	has_suppressor: boolean;
	has_sbr: boolean;
	has_sbs: boolean;
}

/** @deprecated Use nfa_subtypes instead */
export type { CargoProfile as CargoProfileWithNFAItemTypes };

/**
 * Helper to build CargoProfile from loadouts and permits
 *
 * Capacity logic:
 * - For firearms with accepts_detachable_magazine=false: use firearm's capacity
 * - For firearms with accepts_detachable_magazine=true: use magazine items' capacity
 * - For magazines: track capacity by their platform field
 *
 * When multiple loadouts are provided, items from all loadouts are combined.
 */
export function buildCargoProfile(
	loadouts: Loadout | Loadout[] | null,
	permits: UserPermit[]
): CargoProfile {
	const profile: CargoProfile = {
		has_firearms: false,
		firearm_platforms: [],
		max_ammunition_capacity_by_platform: {} as Record<FirearmPlatform, number>,
		has_nfa_items: false,
		nfa_subtypes: [],
		has_concealed_carry_permit: permits.some(p => p.is_active),
		permit_states: permits.filter(p => p.is_active).map(p => p.issuing_state),
		has_handgun: false,
		has_rifle: false,
		has_shotgun: false,
		has_suppressor: false,
		has_sbr: false,
		has_sbs: false,
	};

	// Normalize to array
	const loadoutArray = loadouts === null ? [] : Array.isArray(loadouts) ? loadouts : [loadouts];

	if (loadoutArray.length === 0) {
		return profile;
	}

	const platforms = new Set<FirearmPlatform>();
	const nfaTypes = new Set<NFASubtype>();
	const capacityByPlatform: Record<string, number> = {};

	// Process all items from all loadouts
	for (const loadout of loadoutArray) {
		if (!loadout.items) continue;

		for (const loadoutItem of loadout.items) {
			const item = loadoutItem.equipment_item;
			const category = item.category;

			// Track firearms (handgun, rifle, shotgun categories)
			if (category === 'handgun' || category === 'rifle' || category === 'shotgun') {
				profile.has_firearms = true;
				const platform = category as FirearmPlatform;
				platforms.add(platform);

				// Set convenience flags
				if (platform === 'handgun') profile.has_handgun = true;
				if (platform === 'rifle') profile.has_rifle = true;
				if (platform === 'shotgun') profile.has_shotgun = true;

				// Track capacity for firearms WITHOUT detachable magazines
				// (e.g., revolvers, tube-fed shotguns)
				if (!item.accepts_detachable_magazine && item.ammunition_capacity) {
					const current = capacityByPlatform[platform] || 0;
					capacityByPlatform[platform] = Math.max(current, item.ammunition_capacity);
				}
			}

			// Track magazines - capacity by platform
			if (category === 'magazine' && item.ammunition_capacity && item.platform) {
				const current = capacityByPlatform[item.platform] || 0;
				capacityByPlatform[item.platform] = Math.max(current, item.ammunition_capacity);
				// Also track that we have this platform
				platforms.add(item.platform);
			}

			// Track NFA items
			if (category === 'nfa_item' && item.nfa_subtype) {
				profile.has_nfa_items = true;
				nfaTypes.add(item.nfa_subtype);

				if (item.nfa_subtype === 'suppressor') profile.has_suppressor = true;
				if (item.nfa_subtype === 'sbr') profile.has_sbr = true;
				if (item.nfa_subtype === 'sbs') profile.has_sbs = true;
			}
		}
	}

	profile.firearm_platforms = Array.from(platforms);
	profile.nfa_subtypes = Array.from(nfaTypes);
	profile.max_ammunition_capacity_by_platform = capacityByPlatform as Record<FirearmPlatform, number>;

	return profile;
}

// ============================================
// Legacy Equipment Types (deprecated, for migration)
// ============================================

/** @deprecated Use Loadout instead */
export interface Equipment {
	id: string;
	user_id: string;
	name: string;
	description: string | null;
	cargo_profile: LegacyCargoProfile;
	is_default: boolean;
	created_at: string;
	updated_at: string;
}

/** @deprecated Use CargoProfile computed from Loadout */
export interface LegacyCargoProfile {
	has_firearms: boolean;
	firearm_types?: ('handgun' | 'rifle' | 'shotgun')[];
	has_concealed_carry_permit?: boolean;
	permit_states?: string[];
	ammunition_capacity?: number;
}

/** @deprecated Use CreateLoadoutRequest */
export interface CreateEquipmentRequest {
	name: string;
	description?: string;
	cargo_profile: LegacyCargoProfile;
	is_default?: boolean;
}

/** @deprecated Use UpdateLoadoutRequest */
export interface UpdateEquipmentRequest {
	name?: string;
	description?: string;
	cargo_profile?: LegacyCargoProfile;
	is_default?: boolean;
}

// ============================================
// Route Types
// ============================================

export interface Coordinates {
	lat: number;
	lng: number;
}

export interface Route {
	id: string;
	user_id: string;
	name: string;
	origin_name: string;
	origin_lat: string;
	origin_lng: string;
	destination_name: string;
	destination_lat: string;
	destination_lng: string;
	waypoints: Coordinates[];
	route_geometry: LineString | null;
	route_metadata: RouteMetadata | null;
	loadout_id: string | null; // Reference to loadout used for this route
	loadout?: Loadout; // Populated when fetching route with loadout
	cargo_profile: CargoProfile | null; // Computed from loadout at analysis time
	regulation_alerts: RegulationAlert[];
	created_at: string;
	updated_at: string;
}

export interface RouteMetadata {
	distance_meters: number;
	distance_km: number;
	distance_miles: number;
	duration_seconds: number;
	duration_minutes: number;
}

export interface CreateRouteRequest {
	name: string;
	origin_name: string;
	origin_lat: number;
	origin_lng: number;
	destination_name: string;
	destination_lat: number;
	destination_lng: number;
	waypoints?: Coordinates[];
}

export interface CalculateRouteRequest {
	origin: Coordinates;
	destination: Coordinates;
	waypoints?: Coordinates[];
	profile?: 'driving-car' | 'driving-hgv';
	avoid_polygons?: GeoJSON.MultiPolygon;
}

export interface CalculateRouteResponse {
	route: {
		geometry: LineString;
		summary: RouteMetadata;
		segments: unknown[];
		bbox: [number, number, number, number];
	};
}

// ============================================
// Regulation Analysis Types
// ============================================

export type AlertSeverity = 'info' | 'warning' | 'critical';

export interface RegulationAlert {
	jurisdiction: string;
	postal_code: string;
	severity: AlertSeverity;
	category: string;
	message: string;
	requirements?: Record<string, unknown>;
	citation?: string;
}

export interface RouteAnalysis {
	jurisdictions_crossed: string[];
	alerts: RegulationAlert[];
	summary: {
		total_jurisdictions: number;
		critical_alerts: number;
		warning_alerts: number;
		info_alerts: number;
	};
}

export interface AnalyzeByStatesRequest {
	states: string[];
	cargo_profile: CargoProfile;
}

export interface AnalyzeByGeometryRequest {
	route_geometry: LineString;
	cargo_profile: CargoProfile;
}

export interface AnalyzeRouteByIdRequest {
	cargo_profile: CargoProfile;
}

export interface AnalysisResponse {
	analysis: RouteAnalysis;
}

// ============================================
// Avoidance Polygon Types
// ============================================

export interface RestrictedJurisdiction {
	name: string;
	postal_code: string;
	reasons: string[];
	citations: string[];
}

export interface AvoidancePolygonsRequest {
	cargo_profile: CargoProfile;
}

export interface AvoidancePolygonsResponse {
	avoid_polygons: GeoJSON.MultiPolygon | null;
	restricted_jurisdictions: RestrictedJurisdiction[];
	has_restrictions: boolean;
}

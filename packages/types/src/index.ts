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
// Cargo Profile Types
// ============================================

export type FirearmType = 'handgun' | 'rifle' | 'shotgun';

export interface CargoProfile {
	has_firearms: boolean;
	firearm_types?: FirearmType[];
	has_concealed_carry_permit?: boolean;
	permit_states?: string[];
	magazine_capacity?: number;
	has_assault_weapon?: boolean;
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
	cargo_profile: CargoProfile | null;
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

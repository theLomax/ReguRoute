/**
 * OpenRouteService (ORS) API client
 * Handles route calculation requests to the local ORS instance
 */

// ORS API base URL - uses Docker service name in container network
const ORS_BASE_URL = process.env.ORS_URL || 'http://ors-app:8082';

export interface Coordinate {
	lat: number;
	lng: number;
}

export interface RouteRequest {
	origin: Coordinate;
	destination: Coordinate;
	waypoints?: Coordinate[];
	profile?: 'driving-car' | 'driving-hgv' | 'cycling-regular' | 'foot-walking';
	avoidPolygons?: GeoJSON.MultiPolygon;
}

export interface RouteSegment {
	distance: number; // meters
	duration: number; // seconds
	steps: RouteStep[];
}

export interface RouteStep {
	distance: number;
	duration: number;
	instruction: string;
	name: string;
	type: number;
	way_points: number[];
}

export interface RouteSummary {
	distance: number; // meters
	duration: number; // seconds
}

export interface RouteResult {
	geometry: GeoJSON.LineString;
	summary: RouteSummary;
	segments: RouteSegment[];
	bbox: [number, number, number, number]; // [minLng, minLat, maxLng, maxLat]
	waypoints: Array<{ location: [number, number]; name: string }>;
}

export interface ORSError {
	code: number;
	message: string;
}

/**
 * Calculate a route using OpenRouteService
 */
export async function calculateRoute(request: RouteRequest): Promise<RouteResult> {
	const { origin, destination, waypoints = [], profile = 'driving-car', avoidPolygons } = request;

	// Build coordinates array: [origin, ...waypoints, destination]
	// ORS expects [lng, lat] format
	const coordinates: [number, number][] = [
		[origin.lng, origin.lat],
		...waypoints.map((wp) => [wp.lng, wp.lat] as [number, number]),
		[destination.lng, destination.lat],
	];

	// Build ORS request body
	const body: Record<string, unknown> = {
		coordinates,
		instructions: true,
		geometry: true,
		format: 'geojson',
	};

	// Add avoid polygons if provided (for regulation-based routing)
	if (avoidPolygons) {
		body.options = {
			avoid_polygons: avoidPolygons,
		};
	}

	const response = await fetch(`${ORS_BASE_URL}/ors/v2/directions/${profile}/geojson`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(body),
	});

	if (!response.ok) {
		const errorData = (await response.json().catch(() => ({}))) as { error?: ORSError };
		throw new Error(
			`ORS API error: ${errorData.error?.message || response.statusText} (${response.status})`
		);
	}

	const data = (await response.json()) as GeoJSON.FeatureCollection;

	if (!data.features || data.features.length === 0) {
		throw new Error('No route found');
	}

	const feature = data.features[0];
	const properties = feature.properties as {
		summary: RouteSummary;
		segments: RouteSegment[];
		way_points: number[];
	};

	// ORS extends the standard GeoJSON with metadata
	const orsData = data as GeoJSON.FeatureCollection & {
		metadata?: { query?: { coordinates?: [number, number][] } };
	};

	return {
		geometry: feature.geometry as GeoJSON.LineString,
		summary: properties.summary,
		segments: properties.segments,
		bbox: data.bbox as [number, number, number, number],
		waypoints: orsData.metadata?.query?.coordinates
			? orsData.metadata.query.coordinates.map((coord, i) => ({
					location: coord,
					name: i === 0 ? 'Origin' : i === coordinates.length - 1 ? 'Destination' : `Waypoint ${i}`,
				}))
			: [],
	};
}

/**
 * Check if ORS service is healthy and ready
 */
export async function checkORSHealth(): Promise<{ status: string; ready: boolean }> {
	try {
		const response = await fetch(`${ORS_BASE_URL}/ors/v2/health`);
		const data = (await response.json()) as { status: string };
		return {
			status: data.status,
			ready: data.status === 'ready',
		};
	} catch (error) {
		return {
			status: 'unavailable',
			ready: false,
		};
	}
}

/**
 * Get information about available ORS profiles
 */
export async function getORSStatus(): Promise<{
	status: string;
	profiles: string[];
}> {
	try {
		const response = await fetch(`${ORS_BASE_URL}/ors/v2/status`);
		const data = (await response.json()) as {
			status: string;
			profiles: Record<string, unknown>;
		};
		return {
			status: data.status,
			profiles: Object.keys(data.profiles || {}),
		};
	} catch (error) {
		return {
			status: 'unavailable',
			profiles: [],
		};
	}
}

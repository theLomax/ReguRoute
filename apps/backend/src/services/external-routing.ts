import { Coordinate } from './ors.js';

interface ExternalRouteResult {
  geometry: {
    coordinates: number[][];
    type: 'LineString';
  };
  summary: {
    distance: number;
    duration: number;
  };
  segments: any[];
  bbox: number[];
  source: 'mapbox' | 'osrm' | 'local';
}

/**
 * External routing service for complete US coverage
 * Falls back to free OSRM service when local ORS unavailable
 */
export class ExternalRoutingService {
  private readonly OSRM_BASE_URL = 'https://router.project-osrm.org';
  private readonly MAPBOX_BASE_URL = 'https://api.mapbox.com/directions/v5/mapbox/driving';
  
  /**
   * Calculate route using external service (OSRM public API)
   * Provides complete worldwide coverage including full US
   */
  async calculateRoute(origin: Coordinate, destination: Coordinate): Promise<ExternalRouteResult> {
    // Try OSRM first (free, reliable, worldwide coverage)
    try {
      return await this.calculateOSRMRoute(origin, destination);
    } catch (osrmError) {
      console.warn('OSRM routing failed, trying fallback:', osrmError);
      throw new Error(`External routing unavailable: ${osrmError instanceof Error ? osrmError.message : String(osrmError)}`);
    }
  }

  /**
   * Calculate route using OSRM public API
   * Free service with worldwide OpenStreetMap coverage
   */
  private async calculateOSRMRoute(origin: Coordinate, destination: Coordinate): Promise<ExternalRouteResult> {
    const url = `${this.OSRM_BASE_URL}/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson&steps=true`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'ReguRoute/1.0 (Firearm Compliance Routing)'
      }
    });

    if (!response.ok) {
      throw new Error(`OSRM API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.routes || data.routes.length === 0) {
      throw new Error('No route found between specified coordinates');
    }

    const route = data.routes[0];
    
    return {
      geometry: {
        coordinates: route.geometry.coordinates,
        type: 'LineString'
      },
      summary: {
        distance: route.distance,
        duration: route.duration
      },
      segments: route.legs || [],
      bbox: this.calculateBbox(route.geometry.coordinates),
      source: 'osrm'
    };
  }

  /**
   * Calculate bounding box from route coordinates
   */
  private calculateBbox(coordinates: number[][]): number[] {
    if (coordinates.length === 0) return [0, 0, 0, 0];
    
    let minLng = coordinates[0][0];
    let minLat = coordinates[0][1];
    let maxLng = coordinates[0][0];
    let maxLat = coordinates[0][1];
    
    for (const [lng, lat] of coordinates) {
      minLng = Math.min(minLng, lng);
      minLat = Math.min(minLat, lat);
      maxLng = Math.max(maxLng, lng);
      maxLat = Math.max(maxLat, lat);
    }
    
    return [minLng, minLat, maxLng, maxLat];
  }

  /**
   * Check if coordinates are within contiguous US bounds
   */
  isWithinContiguousUS(coord: Coordinate): boolean {
    const { lat, lng } = coord;
    
    // Contiguous US approximate bounds
    const bounds = {
      north: 49.0,    // Northern border (approximate)
      south: 24.5,    // Southern tip of Florida
      west: -125.0,   // Pacific coast
      east: -66.9     // Atlantic coast
    };
    
    return lat >= bounds.south && lat <= bounds.north && 
           lng >= bounds.west && lng <= bounds.east;
  }

  /**
   * Estimate if this should use external routing
   * Criteria: long distance or coordinates outside local ORS coverage
   */
  shouldUseExternalRouting(origin: Coordinate, destination: Coordinate, localOrsAvailable: boolean): boolean {
    if (!localOrsAvailable) return true;
    
    // Calculate approximate distance
    const distance = this.calculateHaversineDistance(origin, destination);
    
    // Use external for routes > 800km (500 miles) or if local ORS down
    return distance > 800000;
  }

  /**
   * Calculate great circle distance between two points
   */
  private calculateHaversineDistance(coord1: Coordinate, coord2: Coordinate): number {
    const R = 6371000; // Earth's radius in meters
    const φ1 = coord1.lat * Math.PI / 180;
    const φ2 = coord2.lat * Math.PI / 180;
    const Δφ = (coord2.lat - coord1.lat) * Math.PI / 180;
    const Δλ = (coord2.lng - coord1.lng) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  }
}

// Singleton instance
export const externalRouting = new ExternalRoutingService();
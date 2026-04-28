/**
 * Hybrid Routing Service - Complete US Coverage
 * Combines local ORS with external routing for comprehensive coverage
 */

import { Coordinate, RouteRequest, RouteResult, checkORSHealth } from './ors.js';
import { externalRouting } from './external-routing.js';

export class HybridRoutingService {
  
  /**
   * Calculate route with automatic fallback strategy for complete US coverage
   */
  async calculateRoute(request: RouteRequest): Promise<RouteResult> {
    const { origin, destination, waypoints = [], profile = 'driving-car', avoidPolygons } = request;

    // Check if we should use external routing
    const orsHealth = await checkORSHealth();
    const shouldUseExternal = externalRouting.shouldUseExternalRouting(origin, destination, orsHealth.ready);
    
    if (shouldUseExternal || !orsHealth.ready) {
      console.log(`Using external routing: ORS ready=${orsHealth.ready}, should_use_external=${shouldUseExternal}`);
      
      try {
        // Use external routing for complete US coverage
        const externalResult = await externalRouting.calculateRoute(origin, destination);
        
        // Convert external result to our RouteResult format
        return {
          geometry: externalResult.geometry,
          summary: externalResult.summary,
          segments: externalResult.segments.map(leg => ({
            distance: leg.distance || 0,
            duration: leg.duration || 0,
            steps: [] // External services typically don't provide detailed steps
          })),
          bbox: externalResult.bbox as [number, number, number, number],
          waypoints: [
            { location: [origin.lng, origin.lat], name: 'Origin' },
            { location: [destination.lng, destination.lat], name: 'Destination' }
          ]
        };
      } catch (externalError) {
        console.error('External routing failed:', externalError);
        
        // If external fails and ORS is not ready, give helpful error
        if (!orsHealth.ready) {
          throw new Error('Route calculation unavailable: ORS is still building graphs and external routing failed. Please try again later.');
        }
        
        // If external fails but ORS is ready, fall through to try local ORS
        console.log('Falling back to local ORS despite distance/availability criteria');
      }
    }

    // Use local ORS - import the original function
    const { calculateRoute: originalCalculateRoute } = await import('./ors.js');
    return await originalCalculateRoute(request);
  }

  /**
   * Check routing availability and coverage
   */
  async getRoutingStatus(): Promise<{
    localOrs: { available: boolean; status: string };
    externalRouting: { available: boolean };
    coverage: {
      contiguousUS: boolean;
      worldwide: boolean;
    };
  }> {
    const orsHealth = await checkORSHealth();
    
    return {
      localOrs: {
        available: orsHealth.ready,
        status: orsHealth.status
      },
      externalRouting: {
        available: true // OSRM public API is generally available
      },
      coverage: {
        contiguousUS: true, // Always true with hybrid approach
        worldwide: true     // External service provides worldwide coverage
      }
    };
  }

  /**
   * Get recommended routing strategy for a route
   */
  getRoutingStrategy(origin: Coordinate, destination: Coordinate): {
    strategy: 'local' | 'external' | 'unavailable';
    reason: string;
    estimatedDistance: number;
  } {
    const distance = this.calculateDistance(origin, destination);
    
    return {
      strategy: distance > 800000 ? 'external' : 'local',
      reason: distance > 800000 ? 
        'Long distance route (>500 miles) - using external routing for reliability' :
        'Regional route - using local ORS for detailed compliance analysis',
      estimatedDistance: distance
    };
  }

  /**
   * Calculate great circle distance between coordinates
   */
  private calculateDistance(coord1: Coordinate, coord2: Coordinate): number {
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

// Singleton instance for use throughout the application
export const hybridRouting = new HybridRoutingService();
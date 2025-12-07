import React, { useRef, useEffect } from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, PROVIDER_DEFAULT } from 'react-native-maps';
import { useTheme } from 'react-native-paper';
import type { Coordinates, RouteGeometry } from '@reguroute/types';

interface RouteMapProps {
  origin: Coordinates;
  destination: Coordinates;
  routeGeometry?: RouteGeometry | null; // GeoJSON LineString
  interactive?: boolean;
  style?: any;
}

export default function RouteMap({
  origin,
  destination,
  routeGeometry,
  interactive = true,
  style,
}: RouteMapProps) {
  const mapRef = useRef<MapView>(null);
  const theme = useTheme();

  // Parse GeoJSON LineString to LatLng array for Polyline
  const routeCoordinates = React.useMemo(() => {
    if (!routeGeometry || routeGeometry.type !== 'LineString') return [];
    
    // GeoJSON is [lng, lat], map expects { latitude, longitude }
    return routeGeometry.coordinates.map((coord: number[]) => ({
      latitude: coord[1],
      longitude: coord[0],
    }));
  }, [routeGeometry]);

  // Fit map to markers and route
  useEffect(() => {
    if (mapRef.current && (origin || destination)) {
      const markers = [
        { latitude: origin.lat, longitude: origin.lng },
        { latitude: destination.lat, longitude: destination.lng },
      ];

      mapRef.current.fitToCoordinates(markers, {
        edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
        animated: true,
      });
    }
  }, [origin, destination, routeCoordinates]);

  return (
    <View style={[styles.container, style]}>
      <MapView
        ref={mapRef}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : PROVIDER_DEFAULT}
        style={styles.map}
        scrollEnabled={interactive}
        zoomEnabled={interactive}
        rotateEnabled={interactive}
        pitchEnabled={interactive}
        initialRegion={{
          latitude: origin.lat,
          longitude: origin.lng,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
      >
        <Marker
          coordinate={{ latitude: origin.lat, longitude: origin.lng }}
          title="Origin"
          pinColor={theme.colors.primary}
        />
        <Marker
          coordinate={{ latitude: destination.lat, longitude: destination.lng }}
          title="Destination"
          pinColor={theme.colors.error}
        />

        {routeCoordinates.length > 0 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeWidth={4}
            strokeColor={theme.colors.primary}
          />
        )}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 300,
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
});

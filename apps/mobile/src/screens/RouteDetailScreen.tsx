import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { useTheme } from 'react-native-paper';
import { useAuth } from '../contexts';
import { routesApi } from '../api';
import { Route } from '@reguroute/types';
import { LoadingSpinner, Text, RouteMap, Card, Icon, Button } from '../components';
import { MainStackParamList } from '../navigation';

type RouteDetailRouteProp = RouteProp<MainStackParamList, 'RouteDetail'>;

export default function RouteDetailScreen() {
	const theme = useTheme();
	const route = useRoute<RouteDetailRouteProp>();
	const navigation = useNavigation();
	const { token } = useAuth();
	const { routeId } = route.params;

	const [routeData, setRouteData] = useState<Route | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		async function loadRoute() {
			if (!token) return;
			try {
				const { route } = await routesApi.getById(token, routeId);
				setRouteData(route);
			} catch (error) {
				console.error('Failed to load route:', error);
				Alert.alert('Error', 'Failed to load route details');
				navigation.goBack();
			} finally {
				setIsLoading(false);
			}
		}
		loadRoute();
	}, [token, routeId, navigation]);

	const styles = React.useMemo(() => StyleSheet.create({
		container: {
			flex: 1,
			backgroundColor: theme.colors.background,
		},
		content: {
			padding: 16,
		},
		title: {
			fontSize: 24,
			fontWeight: 'bold',
			color: theme.colors.onSurface,
			marginBottom: 16,
		},
		mapContainer: {
			marginBottom: 24,
		},
		sectionTitle: {
			fontSize: 18,
			fontWeight: '600',
			color: theme.colors.onSurface,
			marginBottom: 12,
			marginTop: 8,
		},
		detailRow: {
			flexDirection: 'row',
			marginBottom: 8,
			alignItems: 'center',
		},
		detailLabel: {
			fontSize: 14,
			color: theme.colors.onSurfaceVariant,
			width: 100,
		},
		detailValue: {
			fontSize: 14,
			color: theme.colors.onSurface,
			fontWeight: '500',
			flex: 1,
		},
		card: {
			marginBottom: 16,
			padding: 16,
		},
		alertItem: {
			flexDirection: 'row',
			marginBottom: 12,
			paddingBottom: 12,
			borderBottomWidth: 1,
			borderBottomColor: theme.colors.outlineVariant,
		},
		alertContent: {
			flex: 1,
			marginLeft: 12,
		},
		alertTitle: {
			fontSize: 14,
			fontWeight: '600',
			marginBottom: 4,
		},
		alertMessage: {
			fontSize: 13,
			color: theme.colors.onSurfaceVariant,
		},
		noAlertsText: {
			textAlign: 'center',
			color: theme.colors.onSurfaceVariant,
			fontStyle: 'italic',
			marginVertical: 8,
		},
	}), [theme]);

	if (isLoading) {
		return <LoadingSpinner fullScreen message="Loading route details..." />;
	}

	if (!routeData) {
		return null;
	}

	return (
		<ScrollView style={styles.container} contentContainerStyle={styles.content}>
			<Text style={styles.title}>{routeData.name}</Text>

			<View style={styles.mapContainer}>
				<RouteMap
					origin={{ lat: parseFloat(routeData.origin_lat), lng: parseFloat(routeData.origin_lng) }}
					destination={{ lat: parseFloat(routeData.destination_lat), lng: parseFloat(routeData.destination_lng) }}
					routeGeometry={routeData.route_geometry}
					style={{ height: 300, borderRadius: 12 }}
				/>
			</View>

			<Card style={styles.card}>
				<Text style={styles.sectionTitle}>Details</Text>
				<View style={styles.detailRow}>
					<Text style={styles.detailLabel}>Origin:</Text>
					<Text style={styles.detailValue}>{routeData.origin_name}</Text>
				</View>
				<View style={styles.detailRow}>
					<Text style={styles.detailLabel}>Destination:</Text>
					<Text style={styles.detailValue}>{routeData.destination_name}</Text>
				</View>
				{routeData.route_metadata && (
					<>
						<View style={styles.detailRow}>
							<Text style={styles.detailLabel}>Distance:</Text>
							<Text style={styles.detailValue}>
								{(routeData.route_metadata.distance_meters / 1609.34).toFixed(1)} miles
							</Text>
						</View>
						<View style={styles.detailRow}>
							<Text style={styles.detailLabel}>Duration:</Text>
							<Text style={styles.detailValue}>
								{Math.round(routeData.route_metadata.duration_seconds / 60)} mins
							</Text>
						</View>
					</>
				)}
			</Card>

			<Card style={styles.card}>
				<Text style={styles.sectionTitle}>Regulation Alerts</Text>
				{routeData.regulation_alerts && routeData.regulation_alerts.length > 0 ? (
					routeData.regulation_alerts.map((alert, index) => (
						<View key={index} style={styles.alertItem}>
							<Icon 
								name={alert.severity === 'critical' ? 'warning' : 'information-circle'} 
								size={24} 
								color={alert.severity === 'critical' ? theme.colors.error : theme.colors.tertiary} 
							/>
							<View style={styles.alertContent}>
								<Text style={[styles.alertTitle, { color: theme.colors.onSurface }]}>
									{alert.jurisdiction} - {alert.category}
								</Text>
								<Text style={styles.alertMessage}>{alert.message}</Text>
							</View>
						</View>
					))
				) : (
					<Text style={styles.noAlertsText}>No regulation alerts found for this route.</Text>
				)}
			</Card>

			<Button
				title="Delete Route"
				onPress={() => {
					Alert.alert(
						'Delete Route',
						'Are you sure you want to delete this route? This action cannot be undone.',
						[
							{ text: 'Cancel', style: 'cancel' },
							{ 
								text: 'Delete', 
								style: 'destructive', 
								onPress: async () => {
									if (!token) return;
									setIsLoading(true);
									try {
										await routesApi.delete(token, routeId);
										// Refresh routes list would be ideal, but for now just go back
										navigation.goBack();
									} catch (error) {
										console.error('Failed to delete route:', error);
										Alert.alert('Error', 'Failed to delete route');
										setIsLoading(false);
									}
								}
							}
						]
					);
				}}
				variant="danger"
				fullWidth
				style={{ marginBottom: 32 }}
			/>
		</ScrollView>
	);
}

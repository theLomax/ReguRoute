import { useState, useCallback } from 'react';
import {
	View,
	Text,
	StyleSheet,
	ScrollView,
	TextInput,
	KeyboardAvoidingView,
	Platform,
	Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Coordinates, CalculateRouteResponse } from '@reguroute/types';
import { useAuth, useRoutes, useCargo } from '../contexts';
import { routesApi } from '../api';
import { colors } from '../theme';
import { Card, Button, LoadingSpinner } from '../components';

interface LocationInput {
	name: string;
	coordinates: Coordinates | null;
}

type WizardStep = 'locations' | 'preview';

export default function RoutePlanScreen() {
	const { token } = useAuth();
	const { createRoute, fetchRoutes } = useRoutes();
	const { cargoProfile } = useCargo();

	const [step, setStep] = useState<WizardStep>('locations');
	const [routeName, setRouteName] = useState('');
	const [origin, setOrigin] = useState<LocationInput>({ name: '', coordinates: null });
	const [destination, setDestination] = useState<LocationInput>({ name: '', coordinates: null });
	const [isCalculating, setIsCalculating] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [routePreview, setRoutePreview] = useState<CalculateRouteResponse | null>(null);

	// Sample Delaware locations (ORS is configured with Delaware OSM data only)
	// Routes must be within ~100km distance limit
	const SAMPLE_LOCATIONS: Record<string, Coordinates> = {
		// Delaware cities
		'wilmington': { lat: 39.7391, lng: -75.5398 },
		'dover': { lat: 39.1582, lng: -75.5244 },
		'newark': { lat: 39.6837, lng: -75.7497 },
		'middletown': { lat: 39.4496, lng: -75.7163 },
		'smyrna': { lat: 39.2998, lng: -75.6047 },
		'milford': { lat: 38.9126, lng: -75.4280 },
		'seaford': { lat: 38.6412, lng: -75.6110 },
		'georgetown': { lat: 38.6901, lng: -75.3855 },
		'lewes': { lat: 38.7746, lng: -75.1394 },
		'rehoboth': { lat: 38.7210, lng: -75.0760 },
	};

	const parseLocation = (input: string): Coordinates | null => {
		const normalized = input.toLowerCase().trim();
		return SAMPLE_LOCATIONS[normalized] || null;
	};

	const handleOriginChange = (text: string) => {
		setOrigin({
			name: text,
			coordinates: parseLocation(text),
		});
	};

	const handleDestinationChange = (text: string) => {
		setDestination({
			name: text,
			coordinates: parseLocation(text),
		});
	};

	const handleCalculateRoute = useCallback(async () => {
		if (!origin.coordinates || !destination.coordinates) {
			Alert.alert(
				'Invalid Locations',
				'Please enter valid city names (e.g., "New York", "Los Angeles")'
			);
			return;
		}

		setIsCalculating(true);
		try {
			const result = await routesApi.calculate({
				origin: origin.coordinates,
				destination: destination.coordinates,
			});
			setRoutePreview(result);
			setStep('preview');
		} catch (error) {
			Alert.alert('Error', 'Failed to calculate route. Please try again.');
			console.error('Route calculation error:', error);
		} finally {
			setIsCalculating(false);
		}
	}, [origin.coordinates, destination.coordinates]);

	const handleSaveRoute = useCallback(async () => {
		if (!routePreview || !origin.coordinates || !destination.coordinates) return;

		const name = routeName.trim() || `${origin.name} to ${destination.name}`;

		setIsSaving(true);
		try {
			await createRoute({
				name,
				origin_name: origin.name,
				origin_lat: origin.coordinates.lat,
				origin_lng: origin.coordinates.lng,
				destination_name: destination.name,
				destination_lat: destination.coordinates.lat,
				destination_lng: destination.coordinates.lng,
			});
			await fetchRoutes();
			Alert.alert('Success', 'Route saved successfully!');
			// Reset form
			setStep('locations');
			setRouteName('');
			setOrigin({ name: '', coordinates: null });
			setDestination({ name: '', coordinates: null });
			setRoutePreview(null);
		} catch (error) {
			Alert.alert('Error', 'Failed to save route. Please try again.');
			console.error('Save route error:', error);
		} finally {
			setIsSaving(false);
		}
	}, [routePreview, routeName, origin, destination, createRoute, fetchRoutes]);

	const formatDistance = (meters: number): string => {
		const miles = meters / 1609.34;
		return `${miles.toFixed(1)} mi`;
	};

	const formatDuration = (seconds: number): string => {
		const hours = Math.floor(seconds / 3600);
		const minutes = Math.round((seconds % 3600) / 60);
		if (hours > 0) {
			return `${hours}h ${minutes}m`;
		}
		return `${minutes} min`;
	};

	if (step === 'preview' && routePreview) {
		return (
			<ScrollView style={styles.container} contentContainerStyle={styles.content}>
				<Text style={styles.stepTitle}>Route Preview</Text>

				<Card style={styles.previewCard}>
					<View style={styles.routeSummary}>
						<View style={styles.locationRow}>
							<Ionicons name="location" size={20} color={colors.success} />
							<Text style={styles.locationText}>{origin.name}</Text>
						</View>
						<View style={styles.routeLine} />
						<View style={styles.locationRow}>
							<Ionicons name="flag" size={20} color={colors.error} />
							<Text style={styles.locationText}>{destination.name}</Text>
						</View>
					</View>

					<View style={styles.statsRow}>
						<View style={styles.stat}>
							<Ionicons name="speedometer-outline" size={24} color={colors.primary} />
							<Text style={styles.statValue}>
								{formatDistance(routePreview.route.summary.distance_meters)}
							</Text>
							<Text style={styles.statLabel}>Distance</Text>
						</View>
						<View style={styles.stat}>
							<Ionicons name="time-outline" size={24} color={colors.primary} />
							<Text style={styles.statValue}>
								{formatDuration(routePreview.route.summary.duration_seconds)}
							</Text>
							<Text style={styles.statLabel}>Duration</Text>
						</View>
					</View>
				</Card>

				{cargoProfile.has_firearms && (
					<Card style={styles.cargoCard}>
						<View style={styles.cargoHeader}>
							<Ionicons name="warning" size={20} color={colors.warning} />
							<Text style={styles.cargoTitle}>Cargo Profile Active</Text>
						</View>
						<Text style={styles.cargoText}>
							Your route will be analyzed for compliance based on your cargo profile.
						</Text>
					</Card>
				)}

				<TextInput
					style={styles.nameInput}
					value={routeName}
					onChangeText={setRouteName}
					placeholder="Route name (optional)"
					placeholderTextColor={colors.textMuted}
				/>

				<View style={styles.buttonRow}>
					<Button
						title="Back"
						onPress={() => setStep('locations')}
						variant="outline"
						style={styles.backButton}
					/>
					<Button
						title="Save Route"
						onPress={handleSaveRoute}
						loading={isSaving}
						style={styles.saveButton}
					/>
				</View>
			</ScrollView>
		);
	}

	return (
		<KeyboardAvoidingView
			behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
			style={styles.container}
		>
			<ScrollView contentContainerStyle={styles.content}>
				<Text style={styles.stepTitle}>Plan Your Route</Text>
				<Text style={styles.description}>
					Enter your origin and destination cities to calculate a route.
				</Text>

				<Card style={styles.inputCard}>
					<View style={styles.inputRow}>
						<View style={styles.iconContainer}>
							<Ionicons name="location" size={20} color={colors.success} />
						</View>
						<TextInput
							style={styles.locationInput}
							value={origin.name}
							onChangeText={handleOriginChange}
							placeholder="Origin (e.g., New York)"
							placeholderTextColor={colors.textMuted}
							autoCapitalize="words"
						/>
						{origin.coordinates && (
							<Ionicons name="checkmark-circle" size={20} color={colors.success} />
						)}
					</View>

					<View style={styles.divider} />

					<View style={styles.inputRow}>
						<View style={styles.iconContainer}>
							<Ionicons name="flag" size={20} color={colors.error} />
						</View>
						<TextInput
							style={styles.locationInput}
							value={destination.name}
							onChangeText={handleDestinationChange}
							placeholder="Destination (e.g., Los Angeles)"
							placeholderTextColor={colors.textMuted}
							autoCapitalize="words"
						/>
						{destination.coordinates && (
							<Ionicons name="checkmark-circle" size={20} color={colors.success} />
						)}
					</View>
				</Card>

				<Text style={styles.hint}>
					Delaware cities: Wilmington, Dover, Newark, Middletown, Smyrna, Milford, Lewes, Rehoboth
				</Text>

				{isCalculating ? (
					<LoadingSpinner message="Calculating route..." />
				) : (
					<Button
						title="Calculate Route"
						onPress={handleCalculateRoute}
						disabled={!origin.coordinates || !destination.coordinates}
						fullWidth
						style={styles.calculateButton}
					/>
				)}
			</ScrollView>
		</KeyboardAvoidingView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: colors.background,
	},
	content: {
		padding: 16,
		paddingBottom: 32,
	},
	stepTitle: {
		fontSize: 24,
		fontWeight: 'bold',
		color: colors.text,
		marginBottom: 8,
	},
	description: {
		fontSize: 14,
		color: colors.textSecondary,
		marginBottom: 24,
		lineHeight: 20,
	},
	inputCard: {
		padding: 0,
		overflow: 'hidden',
	},
	inputRow: {
		flexDirection: 'row',
		alignItems: 'center',
		padding: 16,
	},
	iconContainer: {
		width: 32,
		alignItems: 'center',
	},
	locationInput: {
		flex: 1,
		fontSize: 16,
		color: colors.text,
		marginLeft: 8,
	},
	divider: {
		height: 1,
		backgroundColor: colors.borderLight,
		marginLeft: 56,
	},
	hint: {
		fontSize: 12,
		color: colors.textMuted,
		marginTop: 12,
		marginBottom: 24,
		textAlign: 'center',
	},
	calculateButton: {
		marginTop: 8,
	},
	previewCard: {
		padding: 16,
		marginBottom: 16,
	},
	routeSummary: {
		marginBottom: 20,
	},
	locationRow: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	locationText: {
		fontSize: 16,
		color: colors.text,
		marginLeft: 12,
		fontWeight: '500',
	},
	routeLine: {
		width: 2,
		height: 24,
		backgroundColor: colors.border,
		marginLeft: 9,
		marginVertical: 4,
	},
	statsRow: {
		flexDirection: 'row',
		justifyContent: 'space-around',
		paddingTop: 16,
		borderTopWidth: 1,
		borderTopColor: colors.borderLight,
	},
	stat: {
		alignItems: 'center',
	},
	statValue: {
		fontSize: 18,
		fontWeight: '600',
		color: colors.text,
		marginTop: 4,
	},
	statLabel: {
		fontSize: 12,
		color: colors.textMuted,
		marginTop: 2,
	},
	cargoCard: {
		padding: 16,
		marginBottom: 16,
		backgroundColor: colors.warningLight,
	},
	cargoHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 8,
	},
	cargoTitle: {
		fontSize: 14,
		fontWeight: '600',
		color: colors.warning,
		marginLeft: 8,
	},
	cargoText: {
		fontSize: 13,
		color: colors.text,
		lineHeight: 18,
	},
	nameInput: {
		backgroundColor: colors.backgroundWhite,
		borderRadius: 12,
		paddingHorizontal: 16,
		paddingVertical: 14,
		fontSize: 16,
		borderWidth: 1,
		borderColor: colors.border,
		color: colors.text,
		marginBottom: 24,
	},
	buttonRow: {
		flexDirection: 'row',
		gap: 12,
	},
	backButton: {
		flex: 1,
	},
	saveButton: {
		flex: 2,
	},
});

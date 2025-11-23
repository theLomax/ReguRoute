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

	// US Northeast region locations (NY, NJ, PA, DE, MD, CT, MA, VT, NH, ME, RI)
	const SAMPLE_LOCATIONS: Record<string, Coordinates> = {
		// New York
		'new york': { lat: 40.7128, lng: -74.0060 },
		'nyc': { lat: 40.7128, lng: -74.0060 },
		'albany': { lat: 42.6526, lng: -73.7562 },
		'buffalo': { lat: 42.8864, lng: -78.8784 },
		'rochester': { lat: 43.1566, lng: -77.6088 },
		'syracuse': { lat: 43.0481, lng: -76.1474 },
		// New Jersey
		'newark': { lat: 40.7357, lng: -74.1724 },
		'jersey city': { lat: 40.7178, lng: -74.0431 },
		'trenton': { lat: 40.2206, lng: -74.7597 },
		'atlantic city': { lat: 39.3643, lng: -74.4229 },
		// Pennsylvania
		'philadelphia': { lat: 39.9526, lng: -75.1652 },
		'philly': { lat: 39.9526, lng: -75.1652 },
		'pittsburgh': { lat: 40.4406, lng: -79.9959 },
		'harrisburg': { lat: 40.2732, lng: -76.8867 },
		'allentown': { lat: 40.6084, lng: -75.4902 },
		// Delaware
		'wilmington': { lat: 39.7391, lng: -75.5398 },
		'dover': { lat: 39.1582, lng: -75.5244 },
		// Maryland
		'baltimore': { lat: 39.2904, lng: -76.6122 },
		'annapolis': { lat: 38.9784, lng: -76.4922 },
		// Washington DC
		'washington': { lat: 38.9072, lng: -77.0369 },
		'dc': { lat: 38.9072, lng: -77.0369 },
		// Connecticut
		'hartford': { lat: 41.7658, lng: -72.6734 },
		'new haven': { lat: 41.3083, lng: -72.9279 },
		'stamford': { lat: 41.0534, lng: -73.5387 },
		// Massachusetts
		'boston': { lat: 42.3601, lng: -71.0589 },
		'worcester': { lat: 42.2626, lng: -71.8023 },
		'springfield': { lat: 42.1015, lng: -72.5898 },
		// Rhode Island
		'providence': { lat: 41.8240, lng: -71.4128 },
		// Vermont
		'burlington': { lat: 44.4759, lng: -73.2121 },
		'montpelier': { lat: 44.2601, lng: -72.5754 },
		// New Hampshire
		'manchester': { lat: 42.9956, lng: -71.4548 },
		'concord': { lat: 43.2081, lng: -71.5376 },
		// Maine
		'portland': { lat: 43.6591, lng: -70.2568 },
		'augusta': { lat: 44.3106, lng: -69.7795 },
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
					Try: NYC, Boston, Philadelphia, Baltimore, DC, Pittsburgh, Hartford, Providence, Portland
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

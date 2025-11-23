import { useState, useCallback, useEffect } from 'react';
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
import type {
	Coordinates,
	CalculateRouteResponse,
	CargoProfile,
	Equipment,
	RestrictedJurisdiction,
} from '@reguroute/types';
import { useRoutes, useAuth } from '../contexts';
import { routesApi, equipmentApi, analyzeApi } from '../api';
import { colors } from '../theme';
import { Card, Button, LoadingSpinner, LocationAutocomplete, EquipmentSelector } from '../components';

interface LocationInput {
	name: string;
	coordinates: Coordinates | null;
}

type WizardStep = 'equipment' | 'locations' | 'preview';

export default function RoutePlanScreen() {
	const { createRoute, fetchRoutes } = useRoutes();
	const { token } = useAuth();

	// Equipment state
	const [equipment, setEquipment] = useState<Equipment[]>([]);
	const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
	const [customCargoProfile, setCustomCargoProfile] = useState<CargoProfile | null>(null);
	const [isLoadingEquipment, setIsLoadingEquipment] = useState(true);

	// Route state
	const [step, setStep] = useState<WizardStep>('equipment');
	const [routeName, setRouteName] = useState('');
	const [origin, setOrigin] = useState<LocationInput>({ name: '', coordinates: null });
	const [destination, setDestination] = useState<LocationInput>({ name: '', coordinates: null });
	const [isCalculating, setIsCalculating] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [routePreview, setRoutePreview] = useState<CalculateRouteResponse | null>(null);

	// Restriction analysis state
	const [restrictedJurisdictions, setRestrictedJurisdictions] = useState<RestrictedJurisdiction[]>([]);

	// Get active cargo profile
	const activeCargoProfile = selectedEquipment?.cargo_profile || customCargoProfile;

	// Load user's equipment presets
	useEffect(() => {
		async function loadEquipment() {
			if (!token) {
				setIsLoadingEquipment(false);
				return;
			}
			try {
				const { equipment: items } = await equipmentApi.getAll(token);
				setEquipment(items);
				// Auto-select default if exists
				const defaultItem = items.find(e => e.is_default);
				if (defaultItem) {
					setSelectedEquipment(defaultItem);
				}
			} catch (error) {
				console.error('Failed to load equipment:', error);
			} finally {
				setIsLoadingEquipment(false);
			}
		}
		loadEquipment();
	}, [token]);

	// Handler to create new equipment preset
	const handleCreateEquipment = async (name: string, profile: CargoProfile) => {
		if (!token) return;
		const { equipment: newItem } = await equipmentApi.create(token, {
			name,
			cargo_profile: profile,
		});
		setEquipment(prev => [...prev, newItem]);
		setSelectedEquipment(newItem);
		setCustomCargoProfile(null);
	};

	const handleOriginChange = (text: string) => {
		setOrigin({ name: text, coordinates: null });
	};

	const handleOriginSelect = (name: string, coordinates: Coordinates) => {
		setOrigin({ name, coordinates });
	};

	const handleDestinationChange = (text: string) => {
		setDestination({ name: text, coordinates: null });
	};

	const handleDestinationSelect = (name: string, coordinates: Coordinates) => {
		setDestination({ name, coordinates });
	};

	const handleCalculateRoute = useCallback(async () => {
		if (!origin.coordinates || !destination.coordinates) {
			Alert.alert('Invalid Locations', 'Please select valid cities from the suggestions.');
			return;
		}

		setIsCalculating(true);
		setRestrictedJurisdictions([]);

		try {
			// If user has cargo with restrictions, get avoidance polygons
			let avoidPolygons: GeoJSON.MultiPolygon | null = null;

			if (activeCargoProfile?.has_firearms) {
				try {
					const avoidanceResult = await analyzeApi.getAvoidancePolygons(activeCargoProfile);
					if (avoidanceResult.has_restrictions) {
						avoidPolygons = avoidanceResult.avoid_polygons;
						setRestrictedJurisdictions(avoidanceResult.restricted_jurisdictions);
					}
				} catch (error) {
					console.warn('Failed to get avoidance polygons, routing without restrictions:', error);
				}
			}

			// Calculate route with optional avoidance
			const result = await routesApi.calculate({
				origin: origin.coordinates,
				destination: destination.coordinates,
				...(avoidPolygons && { avoid_polygons: avoidPolygons }),
			});
			setRoutePreview(result);
			setStep('preview');
		} catch (error) {
			Alert.alert('Error', 'Failed to calculate route. Please try again.');
			console.error('Route calculation error:', error);
		} finally {
			setIsCalculating(false);
		}
	}, [origin.coordinates, destination.coordinates, activeCargoProfile]);

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

	// Equipment selection step
	if (step === 'equipment') {
		return (
			<KeyboardAvoidingView
				behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
				style={styles.container}
			>
				<ScrollView
					contentContainerStyle={styles.content}
					keyboardShouldPersistTaps="handled"
				>
					<Text style={styles.stepTitle}>What are you transporting?</Text>
					<Text style={styles.description}>
						Select your equipment to check for route restrictions and compliance.
					</Text>

					<EquipmentSelector
						equipment={equipment}
						selectedEquipment={selectedEquipment}
						customCargoProfile={customCargoProfile}
						isLoading={isLoadingEquipment}
						onSelectEquipment={setSelectedEquipment}
						onSetCustomProfile={setCustomCargoProfile}
						onCreateEquipment={token ? handleCreateEquipment : undefined}
					/>

					<Button
						title="Continue to Route"
						onPress={() => setStep('locations')}
						fullWidth
						style={styles.continueButton}
					/>
				</ScrollView>
			</KeyboardAvoidingView>
		);
	}

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

				{/* Restricted Jurisdictions Feedback */}
				{restrictedJurisdictions.length > 0 && (
					<Card style={styles.restrictionsCard}>
						<View style={styles.restrictionsHeader}>
							<Ionicons name="shield-checkmark" size={20} color={colors.success} />
							<Text style={styles.restrictionsTitle}>Areas Avoided</Text>
						</View>
						<Text style={styles.restrictionsSubtitle}>
							Your route avoids the following restricted areas:
						</Text>
						{restrictedJurisdictions.map((jurisdiction, index) => (
							<View key={index} style={styles.jurisdictionItem}>
								<Text style={styles.jurisdictionName}>
									{jurisdiction.name} ({jurisdiction.postal_code})
								</Text>
								{jurisdiction.reasons.map((reason, rIndex) => (
									<Text key={rIndex} style={styles.jurisdictionReason}>
										• {reason}
									</Text>
								))}
								{jurisdiction.citations.length > 0 && (
									<Text style={styles.jurisdictionCitation}>
										Source: {jurisdiction.citations[0]}
									</Text>
								)}
							</View>
						))}
					</Card>
				)}

				{/* Active Cargo Profile Info */}
				{activeCargoProfile?.has_firearms && restrictedJurisdictions.length === 0 && (
					<Card style={styles.cargoCard}>
						<View style={styles.cargoHeader}>
							<Ionicons name="checkmark-circle" size={20} color={colors.success} />
							<Text style={[styles.cargoTitle, { color: colors.success }]}>No Restrictions</Text>
						</View>
						<Text style={styles.cargoText}>
							Your route does not pass through any restricted areas for your cargo.
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
			<ScrollView
				contentContainerStyle={styles.content}
				keyboardShouldPersistTaps="handled"
			>
				<Text style={styles.stepTitle}>Plan Your Route</Text>
				<Text style={styles.description}>
					Start typing to search for cities in the US Northeast region.
				</Text>

				<Card style={styles.inputCard}>
					<LocationAutocomplete
						value={origin.name}
						onChangeText={handleOriginChange}
						onSelectLocation={handleOriginSelect}
						placeholder="Origin (e.g., Boston)"
						icon="location"
						iconColor={colors.success}
						isSelected={!!origin.coordinates}
					/>

					<View style={styles.divider} />

					<LocationAutocomplete
						value={destination.name}
						onChangeText={handleDestinationChange}
						onSelectLocation={handleDestinationSelect}
						placeholder="Destination (e.g., New York)"
						icon="flag"
						iconColor={colors.error}
						isSelected={!!destination.coordinates}
					/>
				</Card>

				<Text style={styles.hint}>
					Search for any US city - powered by OpenStreetMap
				</Text>

				{/* Equipment summary */}
				{activeCargoProfile?.has_firearms && (
					<Card style={styles.equipmentSummary}>
						<View style={styles.equipmentSummaryRow}>
							<Ionicons name="briefcase" size={18} color={colors.primary} />
							<Text style={styles.equipmentSummaryText}>
								{selectedEquipment?.name || 'Custom Equipment'}
							</Text>
							<Button
								title="Change"
								onPress={() => setStep('equipment')}
								variant="outline"
								style={styles.changeButton}
							/>
						</View>
					</Card>
				)}

				{isCalculating ? (
					<LoadingSpinner message="Calculating route..." />
				) : (
					<View style={styles.locationButtons}>
						<Button
							title="Back"
							onPress={() => setStep('equipment')}
							variant="outline"
							style={styles.locationBackButton}
						/>
						<Button
							title="Calculate Route"
							onPress={handleCalculateRoute}
							disabled={!origin.coordinates || !destination.coordinates}
							style={styles.calculateButton}
						/>
					</View>
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
	divider: {
		height: 1,
		backgroundColor: colors.borderLight,
		marginLeft: 56,
	},
	hint: {
		fontSize: 12,
		color: colors.textMuted,
		marginTop: 12,
		marginBottom: 16,
		textAlign: 'center',
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
	// Equipment step styles
	continueButton: {
		marginTop: 16,
	},
	// Location step styles
	equipmentSummary: {
		padding: 12,
		marginBottom: 16,
	},
	equipmentSummaryRow: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	equipmentSummaryText: {
		flex: 1,
		fontSize: 14,
		fontWeight: '500',
		color: colors.text,
		marginLeft: 10,
	},
	changeButton: {
		paddingHorizontal: 12,
		paddingVertical: 6,
	},
	locationButtons: {
		flexDirection: 'row',
		gap: 12,
		marginTop: 8,
	},
	locationBackButton: {
		flex: 1,
	},
	calculateButton: {
		flex: 2,
	},
	// Restrictions feedback styles
	restrictionsCard: {
		padding: 16,
		marginBottom: 16,
		backgroundColor: colors.infoLight,
	},
	restrictionsHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 8,
	},
	restrictionsTitle: {
		fontSize: 16,
		fontWeight: '600',
		color: colors.success,
		marginLeft: 8,
	},
	restrictionsSubtitle: {
		fontSize: 13,
		color: colors.textSecondary,
		marginBottom: 12,
	},
	jurisdictionItem: {
		marginBottom: 12,
		paddingBottom: 12,
		borderBottomWidth: 1,
		borderBottomColor: colors.borderLight,
	},
	jurisdictionName: {
		fontSize: 14,
		fontWeight: '600',
		color: colors.text,
		marginBottom: 4,
	},
	jurisdictionReason: {
		fontSize: 13,
		color: colors.textSecondary,
		marginLeft: 8,
		marginTop: 2,
	},
	jurisdictionCitation: {
		fontSize: 11,
		color: colors.textMuted,
		marginTop: 6,
		fontStyle: 'italic',
	},
});

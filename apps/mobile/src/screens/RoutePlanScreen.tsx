import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
	View,
	StyleSheet,
	ScrollView,
	TextInput,
	KeyboardAvoidingView,
	Platform,
	Alert,
} from 'react-native';
import { useTheme } from 'react-native-paper';
import type {
	Coordinates,
	CalculateRouteResponse,
	RestrictedJurisdiction,
	EquipmentItem,
	Loadout,
	UserPermit,
	CreateEquipmentItemRequest,
} from '@reguroute/types';
import { buildCargoProfile } from '@reguroute/types';
import { useRoutes, useAuth } from '../contexts';
import { routesApi, equipmentItemsApi, loadoutsApi, permitsApi, analyzeApi } from '../api';
import { Card, Button, LoadingSpinner, LocationAutocomplete, EquipmentSelector, Text, Icon, CheckeredFlagIcon, RouteMap } from '../components';

interface LocationInput {
	name: string;
	coordinates: Coordinates | null;
}

type WizardStep = 'equipment' | 'locations' | 'preview';

export default function RoutePlanScreen() {
	const theme = useTheme();
	const { createRoute, fetchRoutes } = useRoutes();
	const { token } = useAuth();

	// Equipment and loadout state
	const [equipmentItems, setEquipmentItems] = useState<EquipmentItem[]>([]);
	const [loadouts, setLoadouts] = useState<Loadout[]>([]);
	const [selectedLoadouts, setSelectedLoadouts] = useState<Loadout[]>([]);
	const [permits, setPermits] = useState<UserPermit[]>([]);
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

	// Compute cargo profile from selected loadouts and permits
	const activeCargoProfile = useMemo(() => {
		return buildCargoProfile(selectedLoadouts, permits);
	}, [selectedLoadouts, permits]);

	// Load user's equipment items, loadouts, and permits
	useEffect(() => {
		async function loadData() {
			if (!token) {
				setIsLoadingEquipment(false);
				return;
			}
			try {
				// Load all data in parallel
				const [itemsResult, loadoutsResult, permitsResult] = await Promise.all([
					equipmentItemsApi.getAll(token),
					loadoutsApi.getAll(token),
					permitsApi.getActive(token),
				]);

				setEquipmentItems(itemsResult.items);
				setLoadouts(loadoutsResult.loadouts);
				setPermits(permitsResult.permits);

				// Auto-select default loadout if exists
				const defaultLoadout = loadoutsResult.loadouts.find(l => l.is_default);
				if (defaultLoadout) {
					setSelectedLoadouts([defaultLoadout]);
				}
			} catch (error) {
				console.error('Failed to load equipment data:', error);
			} finally {
				setIsLoadingEquipment(false);
			}
		}
		loadData();
	}, [token]);

	// Handler to create new equipment item
	const handleCreateItem = async (data: CreateEquipmentItemRequest): Promise<EquipmentItem> => {
		if (!token) throw new Error('Not authenticated');
		const { item } = await equipmentItemsApi.create(token, data);
		setEquipmentItems(prev => [...prev, item]);
		return item;
	};

	// Handler to create new loadout
	const handleCreateLoadout = async (name: string, itemIds: string[]): Promise<Loadout> => {
		if (!token) throw new Error('Not authenticated');
		const { loadout } = await loadoutsApi.create(token, {
			name,
			item_ids: itemIds,
		});
		setLoadouts(prev => [...prev, loadout]);
		setSelectedLoadouts(prev => [...prev, loadout]);
		return loadout;
	};

	// Handler to update loadout (name and items)
	const handleUpdateLoadout = async (loadoutId: string, name: string, itemIds: string[]): Promise<Loadout> => {
		if (!token) throw new Error('Not authenticated');

		// Update name first
		await loadoutsApi.update(token, loadoutId, { name });

		// Get current loadout to find items to add/remove
		const currentLoadout = loadouts.find(l => l.id === loadoutId);
		const currentItemIds = currentLoadout?.items?.map(i => i.equipment_item_id) || [];

		// Remove items no longer selected
		for (const itemId of currentItemIds) {
			if (!itemIds.includes(itemId)) {
				await loadoutsApi.removeItem(token, loadoutId, itemId);
			}
		}

		// Add new items
		for (const itemId of itemIds) {
			if (!currentItemIds.includes(itemId)) {
				await loadoutsApi.addItem(token, loadoutId, { equipment_item_id: itemId });
			}
		}

		// Fetch updated loadout
		const { loadout } = await loadoutsApi.getById(token, loadoutId);
		setLoadouts(prev => prev.map(l => l.id === loadoutId ? loadout : l));
		return loadout;
	};

	// Handler to delete loadout
	const handleDeleteLoadout = async (loadoutId: string): Promise<void> => {
		if (!token) throw new Error('Not authenticated');
		await loadoutsApi.delete(token, loadoutId);
		setLoadouts(prev => prev.filter(l => l.id !== loadoutId));
		setSelectedLoadouts(prev => prev.filter(l => l.id !== loadoutId));
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

	const statusColors = useMemo(() => ({
		go: theme.colors.primary,
		caution: theme.colors.tertiary,
		noGo: theme.colors.error,
		neutral: theme.colors.onSurfaceVariant,
	}), [theme]);
	
	// Dynamic styles that respond to theme changes
	const styles = React.useMemo(() => StyleSheet.create({
		container: {
			flex: 1,
			backgroundColor: theme.colors.background,
		},
		content: {
			padding: 16,
			paddingBottom: 32,
		},
		stepTitle: {
			fontSize: 24,
			fontWeight: 'bold',
			color: theme.colors.onSurface,
			marginBottom: 8,
		},
		description: {
			fontSize: 14,
			color: theme.colors.onSurfaceVariant,
			marginBottom: 24,
			lineHeight: 20,
		},
		inputCard: {
			padding: 0,
			overflow: 'hidden',
		},
		divider: {
			height: 1,
			backgroundColor: theme.colors.outlineVariant,
			marginLeft: 56,
		},
		hint: {
			fontSize: 12,
			color: theme.colors.onSurfaceVariant,
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
			color: theme.colors.onSurface,
			marginLeft: 12,
			fontWeight: '500',
		},
		routeLine: {
			width: 2,
			height: 24,
			backgroundColor: theme.colors.outline,
			marginLeft: 9,
			marginVertical: 4,
		},
		statsRow: {
			flexDirection: 'row',
			justifyContent: 'space-around',
			paddingTop: 16,
			borderTopWidth: 1,
			borderTopColor: theme.colors.outlineVariant,
		},
		stat: {
			alignItems: 'center',
		},
		statValue: {
			fontSize: 18,
			fontWeight: '600',
			color: theme.colors.onSurface,
			marginTop: 4,
		},
		statLabel: {
			fontSize: 12,
			color: theme.colors.onSurfaceVariant,
			marginTop: 2,
		},
		cargoCard: {
			padding: 16,
			marginBottom: 16,
			backgroundColor: theme.colors.onSecondaryContainer,
		},
		cargoHeader: {
			flexDirection: 'row',
			alignItems: 'center',
			marginBottom: 8,
		},
		cargoTitle: {
			fontSize: 14,
			fontWeight: '600',
			marginLeft: 8,
		},
		cargoText: {
			fontSize: 13,
			color: theme.colors.onSurface,
			lineHeight: 18,
		},
		nameInput: {
			backgroundColor: theme.colors.surface,
			borderRadius: 12,
			paddingHorizontal: 16,
			paddingVertical: 14,
			fontSize: 16,
			borderWidth: 1,
			borderColor: theme.colors.outline,
			color: theme.colors.onSurface,
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
		continueButton: {
			marginTop: 0,
			paddingBlock: 8
		},
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
			color: theme.colors.onSurface,
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
		restrictionsCard: {
			padding: 16,
			marginBottom: 16,
			backgroundColor: theme.colors.tertiaryContainer,
		},
		restrictionsHeader: {
			flexDirection: 'row',
			alignItems: 'center',
			marginBottom: 8,
		},
		restrictionsTitle: {
			fontSize: 16,
			fontWeight: '600',
			color: theme.colors.tertiary,
			marginLeft: 8,
		},
		restrictionsSubtitle: {
			fontSize: 13,
			color: theme.colors.onSurfaceVariant,
			marginBottom: 12,
		},
		jurisdictionItem: {
			marginBottom: 12,
			paddingBottom: 12,
			borderBottomWidth: 1,
			borderBottomColor: theme.colors.outlineVariant,
		},
		jurisdictionName: {
			fontSize: 14,
			fontWeight: '600',
			color: theme.colors.onSurface,
			marginBottom: 4,
		},
		jurisdictionReason: {
			fontSize: 13,
			color: theme.colors.onSurfaceVariant,
			marginLeft: 8,
			marginTop: 2,
		},
		jurisdictionCitation: {
			fontSize: 11,
			color: theme.colors.onSurfaceVariant,
			marginTop: 6,
			fontStyle: 'italic',
		},
	}), [theme]);

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
						loadouts={loadouts}
						selectedLoadouts={selectedLoadouts}
						equipmentItems={equipmentItems}
						isLoading={isLoadingEquipment}
						onSelectLoadouts={setSelectedLoadouts}
						onCreateItem={token ? handleCreateItem : undefined}
						onCreateLoadout={token ? handleCreateLoadout : undefined}
						onUpdateLoadout={token ? handleUpdateLoadout : undefined}
						onDeleteLoadout={token ? handleDeleteLoadout : undefined}
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

				<RouteMap
					origin={origin.coordinates!}
					destination={destination.coordinates!}
					routeGeometry={routePreview.route.geometry}
					style={styles.previewCard}
				/>

				<Card style={styles.previewCard}>
					<View style={styles.routeSummary}>
						<View style={styles.locationRow}>
							<Icon name="location" size={20} color={statusColors.go} />
							<Text style={styles.locationText}>{origin.name}</Text>
						</View>
						<View style={styles.routeLine} />
						<View style={styles.locationRow}>
							<Icon name="flag" size={20} color={statusColors.noGo} />
							<Text style={styles.locationText}>{destination.name}</Text>
						</View>
					</View>

					<View style={styles.statsRow}>
						<View style={styles.stat}>
							<Icon name="speedometer-outline" size={24} color={theme.colors.primary} />
							<Text style={styles.statValue}>
								{formatDistance(routePreview.route.summary.distance_meters)}
							</Text>
							<Text style={styles.statLabel}>Distance</Text>
						</View>
						<View style={styles.stat}>
							<Icon name="time-outline" size={24} color={theme.colors.primary} />
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
							<Icon name="shield-checkmark" size={20} color={statusColors.go} />
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
							<Icon name="checkmark-circle-outline" size={20} color={statusColors.go} />
							<Text style={[styles.cargoTitle, { color: statusColors.go }]}>No Restrictions</Text>
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
					placeholderTextColor={theme.colors.onSurfaceVariant}
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
						icon={<Icon name="location" size={30} color={statusColors.go} />}
						isSelected={!!origin.coordinates}
					/>

					<View style={styles.divider} />

					<LocationAutocomplete
						value={destination.name}
						onChangeText={handleDestinationChange}
						onSelectLocation={handleDestinationSelect}
						placeholder="Destination (e.g., New York)"
						icon={<CheckeredFlagIcon size={30} color={theme.colors.onSurfaceVariant} />}
						isSelected={!!destination.coordinates}
					/>
				</Card>

				<Text style={styles.hint}>
					Search for any US city - powered by OpenStreetMap
				</Text>

				{/* Loadout summary */}
				{selectedLoadouts.length > 0 && (
					<Card style={styles.equipmentSummary}>
						<View style={styles.equipmentSummaryRow}>
							<Icon name="briefcase" size={18} color={theme.colors.primary} />
							<Text style={styles.equipmentSummaryText}>
								{selectedLoadouts.length === 1
									? selectedLoadouts[0].name
									: `${selectedLoadouts.length} loadouts`}
								{(() => {
									const totalItems = selectedLoadouts.reduce(
										(sum, l) => sum + (l.items?.length || 0),
										0
									);
									return totalItems > 0 ? ` (${totalItems} items)` : '';
								})()}
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
					<View style={styles.buttonRow}>
						<Button
							title="Back"
							onPress={() => setStep('equipment')}
							variant="outline"
							style={styles.backButton}
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

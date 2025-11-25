import { useState, useEffect, useCallback } from 'react';
import {
	View,
	Text,
	StyleSheet,
	ScrollView,
	TouchableOpacity,
	Alert,
	RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type {
	EquipmentItem,
	Loadout,
	UserPermit,
	CreateEquipmentItemRequest,
} from '@reguroute/types';
import { useAuth } from '../contexts';
import { equipmentItemsApi, loadoutsApi, permitsApi } from '../api';
import { colors } from '../theme';
import { Card, LoadingSpinner, EquipmentSelector } from '../components';

// US States for permit selection
const US_STATES = [
	'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
	'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
	'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
	'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
	'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
];

type TabType = 'loadouts' | 'items' | 'permits';

export default function CargoProfileScreen() {
	const { token } = useAuth();

	// Data state
	const [equipmentItems, setEquipmentItems] = useState<EquipmentItem[]>([]);
	const [loadouts, setLoadouts] = useState<Loadout[]>([]);
	const [permits, setPermits] = useState<UserPermit[]>([]);
	const [selectedLoadouts, setSelectedLoadouts] = useState<Loadout[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isRefreshing, setIsRefreshing] = useState(false);

	// UI state
	const [activeTab, setActiveTab] = useState<TabType>('loadouts');

	// Load all data
	const loadData = useCallback(async (showRefresh = false) => {
		if (!token) {
			setIsLoading(false);
			return;
		}

		if (showRefresh) {
			setIsRefreshing(true);
		}

		try {
			const [itemsResult, loadoutsResult, permitsResult] = await Promise.all([
				equipmentItemsApi.getAll(token),
				loadoutsApi.getAll(token),
				permitsApi.getAll(token),
			]);

			setEquipmentItems(itemsResult.items);
			setLoadouts(loadoutsResult.loadouts);
			setPermits(permitsResult.permits);

			// Select default loadout if exists and nothing is selected
			const defaultLoadout = loadoutsResult.loadouts.find(l => l.is_default);
			if (defaultLoadout && selectedLoadouts.length === 0) {
				setSelectedLoadouts([defaultLoadout]);
			}
		} catch (error) {
			console.error('Failed to load data:', error);
			Alert.alert('Error', 'Failed to load your equipment data.');
		} finally {
			setIsLoading(false);
			setIsRefreshing(false);
		}
	}, [token, selectedLoadouts.length]);

	useEffect(() => {
		loadData();
	}, [loadData]);

	// Handler to create new equipment item
	const handleCreateItem = async (data: CreateEquipmentItemRequest): Promise<EquipmentItem> => {
		if (!token) throw new Error('Not authenticated');
		const { item } = await equipmentItemsApi.create(token, data);
		setEquipmentItems(prev => [...prev, item]);
		return item;
	};

	// Handler to update equipment item
	const handleUpdateItem = async (itemId: string, data: CreateEquipmentItemRequest): Promise<EquipmentItem> => {
		if (!token) throw new Error('Not authenticated');
		const { item } = await equipmentItemsApi.update(token, itemId, data);
		setEquipmentItems(prev => prev.map(i => i.id === itemId ? item : i));
		// Refresh loadouts to update any that contain this item
		loadData();
		return item;
	};

	// Handler to delete equipment item
	const handleDeleteItem = async (itemId: string): Promise<void> => {
		if (!token) throw new Error('Not authenticated');
		await equipmentItemsApi.delete(token, itemId);
		setEquipmentItems(prev => prev.filter(i => i.id !== itemId));
		// Refresh loadouts since item was removed
		loadData();
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

	// Handler to add permit
	const handleAddPermit = async (state: string) => {
		if (!token) return;

		try {
			const { permit } = await permitsApi.create(token, {
				permit_type: 'ccw',
				issuing_state: state,
			});
			setPermits(prev => [...prev, permit]);
		} catch (error) {
			Alert.alert('Error', 'Failed to add permit. You may already have one for this state.');
		}
	};

	// Handler to remove permit
	const handleRemovePermit = async (permitId: string) => {
		if (!token) return;

		try {
			await permitsApi.delete(token, permitId);
			setPermits(prev => prev.filter(p => p.id !== permitId));
		} catch (error) {
			Alert.alert('Error', 'Failed to remove permit.');
		}
	};

	if (isLoading) {
		return <LoadingSpinner fullScreen message="Loading equipment..." />;
	}

	return (
		<ScrollView
			style={styles.container}
			contentContainerStyle={styles.content}
			refreshControl={
				<RefreshControl refreshing={isRefreshing} onRefresh={() => loadData(true)} />
			}
		>
			{/* Tab Selector */}
			<View style={styles.tabBar}>
				<TouchableOpacity
					style={[styles.tab, activeTab === 'loadouts' && styles.tabActive]}
					onPress={() => setActiveTab('loadouts')}
				>
					<Text style={[styles.tabText, activeTab === 'loadouts' && styles.tabTextActive]}>
						Loadouts
					</Text>
				</TouchableOpacity>
				<TouchableOpacity
					style={[styles.tab, activeTab === 'items' && styles.tabActive]}
					onPress={() => setActiveTab('items')}
				>
					<Text style={[styles.tabText, activeTab === 'items' && styles.tabTextActive]}>
						Equipment
					</Text>
				</TouchableOpacity>
				<TouchableOpacity
					style={[styles.tab, activeTab === 'permits' && styles.tabActive]}
					onPress={() => setActiveTab('permits')}
				>
					<Text style={[styles.tabText, activeTab === 'permits' && styles.tabTextActive]}>
						Permits
					</Text>
				</TouchableOpacity>
			</View>

			{/* Loadouts Tab */}
			{activeTab === 'loadouts' && (
				<View style={styles.tabContent}>
					<Text style={styles.description}>
						Create loadouts to quickly select your equipment when planning routes.
					</Text>

					<EquipmentSelector
						loadouts={loadouts}
						selectedLoadouts={selectedLoadouts}
						equipmentItems={equipmentItems}
						isLoading={false}
						onSelectLoadouts={setSelectedLoadouts}
						onCreateItem={token ? handleCreateItem : undefined}
						onUpdateItem={token ? handleUpdateItem : undefined}
						onDeleteItem={token ? handleDeleteItem : undefined}
						onCreateLoadout={token ? handleCreateLoadout : undefined}
						onUpdateLoadout={token ? handleUpdateLoadout : undefined}
						onDeleteLoadout={token ? handleDeleteLoadout : undefined}
					/>
				</View>
			)}

			{/* Equipment Items Tab */}
			{activeTab === 'items' && (
				<View style={styles.tabContent}>
					<Text style={styles.description}>
						Manage your firearms, magazines, and accessories.
					</Text>

					<EquipmentSelector
						loadouts={[]}
						selectedLoadouts={[]}
						equipmentItems={equipmentItems}
						isLoading={false}
						onSelectLoadouts={() => {}}
						onCreateItem={token ? handleCreateItem : undefined}
						onUpdateItem={token ? handleUpdateItem : undefined}
						onDeleteItem={token ? handleDeleteItem : undefined}
					/>
				</View>
			)}

			{/* Permits Tab */}
			{activeTab === 'permits' && (
				<View style={styles.tabContent}>
					<Text style={styles.description}>
						Add your concealed carry permits to get accurate reciprocity information.
					</Text>

					{/* Active Permits */}
					{permits.length > 0 && (
						<Card style={styles.section}>
							<Text style={styles.sectionTitle}>Your Permits</Text>
							{permits.map((permit) => (
								<View key={permit.id} style={styles.permitItem}>
									<View style={styles.permitInfo}>
										<Text style={styles.permitState}>{permit.issuing_state}</Text>
										<Text style={styles.permitType}>
											{permit.permit_type.toUpperCase()}
											{!permit.is_active && ' (Inactive)'}
										</Text>
									</View>
									<TouchableOpacity
										onPress={() => handleRemovePermit(permit.id)}
										style={styles.deleteButton}
									>
										<Ionicons name="close-circle" size={24} color={colors.error} />
									</TouchableOpacity>
								</View>
							))}
						</Card>
					)}

					{/* Add Permit */}
					<Card style={styles.section}>
						<Text style={styles.sectionTitle}>Add Permit</Text>
						<Text style={styles.helperText}>
							Select the state(s) where you hold valid CCW permits
						</Text>
						<View style={styles.stateGrid}>
							{US_STATES.map((state) => {
								const hasPermit = permits.some(p => p.issuing_state === state);
								return (
									<TouchableOpacity
										key={state}
										style={[
											styles.stateChip,
											hasPermit && styles.stateChipSelected,
										]}
										onPress={() => {
											if (hasPermit) {
												const permit = permits.find(p => p.issuing_state === state);
												if (permit) handleRemovePermit(permit.id);
											} else {
												handleAddPermit(state);
											}
										}}
									>
										<Text
											style={[
												styles.stateChipText,
												hasPermit && styles.stateChipTextSelected,
											]}
										>
											{state}
										</Text>
									</TouchableOpacity>
								);
							})}
						</View>
					</Card>
				</View>
			)}
		</ScrollView>
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
	tabBar: {
		flexDirection: 'row',
		backgroundColor: colors.backgroundWhite,
		borderRadius: 12,
		padding: 4,
		marginBottom: 16,
	},
	tab: {
		flex: 1,
		paddingVertical: 10,
		alignItems: 'center',
		borderRadius: 8,
	},
	tabActive: {
		backgroundColor: colors.primary,
	},
	tabText: {
		fontSize: 14,
		fontWeight: '500',
		color: colors.textSecondary,
	},
	tabTextActive: {
		color: colors.white,
	},
	tabContent: {
		flex: 1,
	},
	description: {
		fontSize: 14,
		color: colors.textSecondary,
		marginBottom: 16,
		lineHeight: 20,
	},
	section: {
		padding: 16,
		marginBottom: 16,
	},
	sectionTitle: {
		fontSize: 16,
		fontWeight: '600',
		color: colors.text,
		marginBottom: 12,
	},
	emptyCard: {
		padding: 32,
		alignItems: 'center',
		marginBottom: 16,
	},
	emptyText: {
		fontSize: 16,
		fontWeight: '500',
		color: colors.text,
		marginTop: 12,
	},
	emptySubtext: {
		fontSize: 14,
		color: colors.textMuted,
		marginTop: 4,
	},
	manageItem: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingVertical: 12,
		borderBottomWidth: 1,
		borderBottomColor: colors.borderLight,
	},
	manageItemInfo: {
		flex: 1,
	},
	manageItemName: {
		fontSize: 15,
		fontWeight: '500',
		color: colors.text,
	},
	manageItemDetail: {
		fontSize: 13,
		color: colors.textMuted,
		marginTop: 2,
	},
	deleteButton: {
		padding: 8,
	},
	permitItem: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingVertical: 12,
		borderBottomWidth: 1,
		borderBottomColor: colors.borderLight,
	},
	permitInfo: {
		flex: 1,
	},
	permitState: {
		fontSize: 18,
		fontWeight: '600',
		color: colors.text,
	},
	permitType: {
		fontSize: 13,
		color: colors.textMuted,
	},
	helperText: {
		fontSize: 13,
		color: colors.textMuted,
		marginBottom: 12,
	},
	stateGrid: {
		flexDirection: 'row',
		flexWrap: 'wrap',
	},
	stateChip: {
		paddingHorizontal: 12,
		paddingVertical: 8,
		borderRadius: 8,
		backgroundColor: colors.backgroundWhite,
		borderWidth: 1,
		borderColor: colors.border,
		marginRight: 8,
		marginBottom: 8,
		minWidth: 48,
		alignItems: 'center',
	},
	stateChipSelected: {
		backgroundColor: colors.primary,
		borderColor: colors.primary,
	},
	stateChipText: {
		fontSize: 14,
		fontWeight: '500',
		color: colors.text,
	},
	stateChipTextSelected: {
		color: colors.white,
	},
});

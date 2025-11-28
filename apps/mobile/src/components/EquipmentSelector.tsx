import React, { useState } from 'react';
import {
	View,
	StyleSheet,
	TouchableOpacity,
	ScrollView,
	Modal,
	TextInput,
	Alert,
} from 'react-native';
import { useTheme } from 'react-native-paper';
import type {
	EquipmentItem,
	Loadout,
	CreateEquipmentItemRequest,
	EquipmentItemCategory,
	Caliber,
} from '@reguroute/types';
import Text from './Text';
import Card from './Card';
import Button from './Button';
import Toggle from './Toggle';
import LoadingSpinner from './LoadingSpinner';
import { Icon } from './Icon';
import { getCalibersByCategory } from '../data/calibers';

interface EquipmentSelectorProps {
	loadouts: Loadout[];
	selectedLoadouts: Loadout[];
	equipmentItems: EquipmentItem[];
	isLoading: boolean;
	onSelectLoadouts: (loadouts: Loadout[]) => void;
	onCreateItem?: (data: CreateEquipmentItemRequest) => Promise<EquipmentItem>;
	onUpdateItem?: (itemId: string, data: CreateEquipmentItemRequest) => Promise<EquipmentItem>;
	onDeleteItem?: (itemId: string) => Promise<void>;
	onCreateLoadout?: (name: string, itemIds: string[]) => Promise<Loadout>;
	onUpdateLoadout?: (loadoutId: string, name: string, itemIds: string[]) => Promise<Loadout>;
	onDeleteLoadout?: (loadoutId: string) => Promise<void>;
}

const CATEGORIES: { value: EquipmentItemCategory | 'all'; label: string }[] = [
	{ value: 'all', label: 'All' },
	{ value: 'handgun', label: 'Handgun' },
	{ value: 'rifle', label: 'Rifle' },
	{ value: 'shotgun', label: 'Shotgun' },
	{ value: 'nfa_item', label: 'NFA' },
	{ value: 'magazine', label: 'Magazine' },
	{ value: 'other', label: 'Other' },
];

export default function EquipmentSelector({
	loadouts,
	selectedLoadouts,
	equipmentItems,
	isLoading,
	onSelectLoadouts,
	onCreateItem,
	onUpdateItem,
	onDeleteItem,
	onCreateLoadout,
	onUpdateLoadout,
	onDeleteLoadout,
}: EquipmentSelectorProps) {
	const theme = useTheme();
	const [showItemModal, setShowItemModal] = useState(false);
	const [editingItem, setEditingItem] = useState<EquipmentItem | null>(null);
	const [itemFormData, setItemFormData] = useState<CreateEquipmentItemRequest>({
		name: '',
		category: 'handgun',
	});
	const [categoryFilter, setCategoryFilter] = useState<EquipmentItemCategory | 'all'>('all');
	const [isReorderMode, setIsReorderMode] = useState(false);
	const [reorderedItems, setReorderedItems] = useState<EquipmentItem[]>([]);

	const [showLoadoutModal, setShowLoadoutModal] = useState(false);
	const [editingLoadout, setEditingLoadout] = useState<Loadout | null>(null);
	const [loadoutName, setLoadoutName] = useState('');
	const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
	const [loadoutCategoryFilter, setLoadoutCategoryFilter] = useState<EquipmentItemCategory | 'all'>('all');

	// Caliber picker state
	const [showCaliberPicker, setShowCaliberPicker] = useState(false);
	const [customCaliber, setCustomCaliber] = useState('');
	const [caliberCategoryFilter, setCaliberCategoryFilter] = useState<'handgun' | 'rifle' | 'shotgun'>('handgun');

	// Dynamic styles that respond to theme changes - MUST be before any conditional returns
	const styles = React.useMemo(() => StyleSheet.create({
		container: {
			marginBottom: 16,
		},
		label: {
			fontSize: 16,
			fontWeight: '600',
			color: theme.colors.onSurface,
			marginBottom: 4,
		},
		helperText: {
			fontSize: 13,
			color: theme.colors.onSurfaceVariant,
			marginBottom: 12,
		},
		categoryScroll: {
			marginBottom: 12,
		},
		categoryScrollContent: {
			paddingRight: 16,
		},
		categoryChip: {
			paddingHorizontal: 16,
			paddingVertical: 8,
			borderRadius: 20,
			backgroundColor: theme.colors.surface,
			borderWidth: 1,
			borderColor: theme.colors.outline,
			marginRight: 8,
		},
		categoryChipSelected: {
			backgroundColor: theme.colors.onSurface,
			borderColor: theme.colors.onSurface,
		},
		categoryChipText: {
			fontSize: 14,
			fontWeight: '500',
			color: theme.colors.onSurface,
		},
		categoryChipTextSelected: {
			color: theme.colors.surface,
		},
		categoryChipActive: {
			backgroundColor: theme.colors.onSurface,
			borderColor: theme.colors.onSurface,
		},
		categoryChipTextActive: {
			color: theme.colors.surface,
		},
		actionBar: {
			flexDirection: 'row',
			justifyContent: 'space-between',
			alignItems: 'center',
			marginBottom: 12,
		},
		actionButton: {
			flex: 1,
			marginHorizontal: 4,
		},
		actionCancel: {
			fontSize: 16,
			color: theme.colors.onSurfaceVariant,
		},
		actionTitle: {
			fontSize: 17,
			fontWeight: '600',
			color: theme.colors.onSurface,
		},
		actionDone: {
			fontSize: 16,
			fontWeight: '600',
			color: theme.colors.primary,
		},
		section: {
			padding: 0,
			marginBottom: 16,
		},
		itemRow: {
			flexDirection: 'row',
			alignItems: 'center',
			paddingVertical: 12,
			borderBottomWidth: 1,
			borderBottomColor: theme.colors.outlineVariant,
		},
		itemInfo: {
			flex: 1,
		},
		itemName: {
			fontSize: 15,
			fontWeight: '500',
			color: theme.colors.onSurface,
		},
		itemDetail: {
			fontSize: 13,
			color: theme.colors.onSurfaceVariant,
			marginTop: 2,
		},
		itemActions: {
			flexDirection: 'row',
			alignItems: 'center',
		},
		iconButton: {
			padding: 8,
			marginLeft: 8,
		},
		reorderButtons: {
			flexDirection: 'row',
			alignItems: 'center',
		},
		reorderButton: {
			padding: 8,
		},
		emptyCard: {
			padding: 32,
			alignItems: 'center',
			marginBottom: 16,
		},
		emptyText: {
			fontSize: 16,
			fontWeight: '500',
			color: theme.colors.onSurface,
			marginTop: 12,
		},
		emptySubtext: {
			fontSize: 14,
			color: theme.colors.onSurfaceVariant,
			marginTop: 4,
			textAlign: 'center',
		},
		loadoutCard: {
			backgroundColor: theme.colors.surface,
			borderRadius: 12,
			padding: 14,
			marginBottom: 8,
			borderWidth: 2,
			borderColor: theme.colors.outline,
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'space-between',
		},
		loadoutCardSelected: {
			borderColor: theme.colors.primary,
			backgroundColor: theme.colors.primaryContainer,
		},
		loadoutContent: {
			flexDirection: 'row',
			alignItems: 'center',
			flex: 1,
		},
		loadoutText: {
			marginLeft: 12,
			flex: 1,
		},
		loadoutName: {
			fontSize: 15,
			fontWeight: '500',
			color: theme.colors.onSurface,
		},
		loadoutDetail: {
			fontSize: 13,
			color: theme.colors.onSurfaceVariant,
			marginTop: 2,
		},
		defaultBadge: {
			backgroundColor: theme.colors.primaryContainer,
			paddingHorizontal: 8,
			paddingVertical: 2,
			borderRadius: 4,
			marginLeft: 8,
		},
		defaultBadgeText: {
			fontSize: 11,
			color: theme.colors.surface,
			fontWeight: '500',
		},
		createButton: {
			marginTop: 8,
		},
		modalContainer: {
			flex: 1,
			backgroundColor: theme.colors.background,
		},
		modalHeader: {
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'space-between',
			paddingHorizontal: 16,
			paddingVertical: 14,
			backgroundColor: theme.colors.surface,
			borderBottomWidth: 1,
			borderBottomColor: theme.colors.outline,
		},
		modalTitle: {
			fontSize: 17,
			fontWeight: '600',
			color: theme.colors.onSurface,
			flex: 1,
			textAlign: 'center',
		},
		modalCancel: {
			fontSize: 16,
			color: theme.colors.onSurfaceVariant,
		},
		modalDone: {
			fontSize: 16,
			fontWeight: '600',
			color: theme.colors.primary,
		},
		modalHeaderSpacer: {
			width: 40,
		},
		backButton: {
			padding: 4,
			marginLeft: 8,
		},
		modalContent: {
			flex: 1,
			padding: 16,
		},
		modalSection: {
			padding: 0,
			marginBottom: 8,
		},
		fieldLabel: {
			fontSize: 14,
			fontWeight: '500',
			color: theme.colors.onSurface,
			marginTop: 8,
			marginBottom: 8,
		},
		input: {
			backgroundColor: theme.colors.surface,
			borderRadius: 12,
			paddingHorizontal: 16,
			paddingVertical: 12,
			fontSize: 16,
			borderWidth: 1,
			borderColor: theme.colors.outline,
			color: theme.colors.onSurface,
		},
		notesInput: {
			minHeight: 80,
			textAlignVertical: 'top',
		},
		categoryGrid: {
			flexDirection: 'row',
			flexWrap: 'wrap',
			marginTop: 8,
		},
		categoryButton: {
			paddingHorizontal: 16,
			paddingVertical: 10,
			borderRadius: 8,
			backgroundColor: theme.colors.surface,
			borderWidth: 1,
			borderColor: theme.colors.outline,
			marginRight: 8,
			marginBottom: 8,
		},
		categoryButtonSelected: {
			backgroundColor: theme.colors.onSurface,
			borderColor: theme.colors.primary,
		},
		categoryButtonText: {
			fontSize: 14,
			fontWeight: '500',
			color: theme.colors.onSurface,
		},
		categoryButtonTextSelected: {
			color: theme.colors.surface,
		},
		selectableItem: {
			flexDirection: 'row',
			alignItems: 'center',
			paddingVertical: 12,
			borderBottomWidth: 1,
			borderBottomColor: theme.colors.outlineVariant,
		},
		currentlyInLoadout: {
			fontSize: 13,
			color: theme.colors.onSurfaceVariant,
			fontStyle: 'italic',
		},
		saveButton: {
			marginTop: 8,
		},
		deleteButton: {
			marginTop: 8,
			marginBottom: 32,
		},
		categoryFilterContainer: {
			marginBottom: 12,
		},
		caliberContainer: {
			marginBottom: 16,
		},
		selectedCalibersContainer: {
			flexDirection: 'row',
			flexWrap: 'wrap',
			marginBottom: 8,
			gap: 8,
		},
		caliberChip: {
			flexDirection: 'row',
			alignItems: 'center',
			backgroundColor: theme.colors.primaryContainer,
			paddingHorizontal: 12,
			paddingVertical: 6,
			borderRadius: 16,
			gap: 6,
			outlineWidth: 1,
			outlineColor: theme.colors.onSurfaceVariant
		},
		caliberChipText: {
			fontSize: 14,
			color: theme.colors.onSurface,
			fontWeight: '500',
		},
		addCaliberButton: {
			marginTop: 8,
		},
		sectionTitle: {
			fontSize: 16,
			fontWeight: '600',
			color: theme.colors.onSurface,
			marginBottom: 12,
		},
		caliberOption: {
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'space-between',
			paddingVertical: 12,
			paddingHorizontal: 16,
			borderBottomWidth: 1,
			borderBottomColor: theme.colors.outlineVariant,
			backgroundColor: theme.colors.surface,
		},
		caliberOptionContent: {
			flex: 1,
		},
		caliberOptionName: {
			fontSize: 15,
			fontWeight: '500',
			color: theme.colors.onSurface,
			marginBottom: 2,
		},
		caliberOptionDetails: {
			fontSize: 13,
			color: theme.colors.onSurfaceVariant,
		},
		addButton: {
			marginTop: 8,
		},
		caliberCategoryTabs: {
			flexDirection: 'row',
			backgroundColor: theme.colors.surface,
			borderBottomWidth: 1,
			borderBottomColor: theme.colors.outline,
		},
		caliberCategoryTab: {
			flex: 1,
			paddingVertical: 12,
			alignItems: 'center',
			borderBottomWidth: 2,
			borderBottomColor: 'transparent',
		},
		caliberCategoryTabActive: {
			borderBottomColor: theme.colors.primary,
		},
		caliberCategoryTabText: {
			fontSize: 15,
			fontWeight: '500',
			color: theme.colors.onSurfaceVariant,
		},
		caliberCategoryTabTextActive: {
			color: theme.colors.primary,
			fontWeight: '600',
		},
	}), [theme]);

	// Filter items by category
	const filteredItems = categoryFilter === 'all'
		? equipmentItems
		: equipmentItems.filter(item => item.category === categoryFilter);

	// Use reordered items if in reorder mode, otherwise use filtered items
	const displayItems = isReorderMode ? reorderedItems : filteredItems;

	const handleOpenItemModal = (item?: EquipmentItem) => {
		if (item) {
			setEditingItem(item);
			setItemFormData({
				name: item.name,
				category: item.category,
				accepts_detachable_magazine: item.accepts_detachable_magazine,
				calibers: item.calibers,
				platform: item.platform,
				ammunition_capacity: item.ammunition_capacity,
				nfa_subtype: item.nfa_subtype,
				barrel_length_inches: item.barrel_length_inches,
				overall_length_inches: item.overall_length_inches,
				notes: item.notes,
			});
		} else {
			setEditingItem(null);
			setItemFormData({
				name: '',
				category: 'handgun',
			});
		}
		setShowItemModal(true);
	};

	const handleSaveItem = async () => {
		if (!itemFormData.name.trim()) {
			Alert.alert('Name Required', 'Please enter a name for this item.');
			return;
		}

		try {
			if (editingItem && onUpdateItem) {
				await onUpdateItem(editingItem.id, itemFormData);
			} else if (onCreateItem) {
				await onCreateItem(itemFormData);
			}
			setShowItemModal(false);
			setEditingItem(null);
		} catch (error) {
			console.error('Failed to save equipment item:', error);
			const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
			Alert.alert('Error', `Failed to save equipment item: ${errorMessage}`);
		}
	};

	const handleDeleteItem = async (itemId: string) => {
		Alert.alert(
			'Delete Item',
			'Are you sure you want to delete this item? It will be removed from all loadouts.',
			[
				{ text: 'Cancel', style: 'cancel' },
				{
					text: 'Delete',
					style: 'destructive',
					onPress: async () => {
						try {
							if (onDeleteItem) {
								await onDeleteItem(itemId);
							}
						} catch (error) {
							Alert.alert('Error', 'Failed to delete item.');
						}
					},
				},
			]
		);
	};

	const handleOpenLoadoutModal = (loadout?: Loadout) => {
		if (loadout) {
			setEditingLoadout(loadout);
			setLoadoutName(loadout.name);
			setSelectedItemIds(loadout.items.map(li => li.equipment_item_id));
		} else {
			setEditingLoadout(null);
			setLoadoutName('');
			setSelectedItemIds([]);
		}
		setLoadoutCategoryFilter('all'); // ADD THIS LINE
		setShowLoadoutModal(true);
	};

	const handleSaveLoadout = async () => {
		if (!loadoutName.trim()) {
			Alert.alert('Name Required', 'Please enter a name for this loadout.');
			return;
		}

		try {
			if (editingLoadout && onUpdateLoadout) {
				await onUpdateLoadout(editingLoadout.id, loadoutName, selectedItemIds);
			} else if (onCreateLoadout) {
				await onCreateLoadout(loadoutName, selectedItemIds);
			}
			setShowLoadoutModal(false);
			setEditingLoadout(null);
		} catch (error) {
			Alert.alert('Error', 'Failed to save loadout.');
		}
	};

	const handleDeleteLoadout = async (loadoutId: string) => {
		Alert.alert(
			'Delete Loadout',
			'Are you sure you want to delete this loadout?',
			[
				{ text: 'Cancel', style: 'cancel' },
				{
					text: 'Delete',
					style: 'destructive',
					onPress: async () => {
						try {
							if (onDeleteLoadout) {
								await onDeleteLoadout(loadoutId);
							}
						} catch (error) {
							Alert.alert('Error', 'Failed to delete loadout.');
						}
					},
				},
			]
		);
	};

	const toggleLoadoutSelection = (loadout: Loadout) => {
		const isSelected = selectedLoadouts.some(l => l.id === loadout.id);
		if (isSelected) {
			onSelectLoadouts(selectedLoadouts.filter(l => l.id !== loadout.id));
		} else {
			onSelectLoadouts([...selectedLoadouts, loadout]);
		}
	};

	const toggleItemInLoadout = (itemId: string) => {
		if (selectedItemIds.includes(itemId)) {
			setSelectedItemIds(selectedItemIds.filter(id => id !== itemId));
		} else {
			setSelectedItemIds([...selectedItemIds, itemId]);
		}
	};

	const handleAddCaliber = (caliber: Caliber) => {
		const currentCalibers = itemFormData.calibers || [];
		if (!currentCalibers.includes(caliber)) {
			setItemFormData({
				...itemFormData,
				calibers: [...currentCalibers, caliber],
			});
		}
		setShowCaliberPicker(false);
		setCustomCaliber('');
	};

	const handleRemoveCaliber = (caliber: Caliber) => {
		const currentCalibers = itemFormData.calibers || [];
		setItemFormData({
			...itemFormData,
			calibers: currentCalibers.filter(c => c !== caliber),
		});
	};

	const handleAddCustomCaliber = () => {
		if (customCaliber.trim()) {
			handleAddCaliber(customCaliber.trim() as Caliber);
		}
	};

	const handleOpenCaliberPicker = () => {
		// Set initial category filter based on item category
		if (itemFormData.category === 'handgun' || itemFormData.category === 'rifle' || itemFormData.category === 'shotgun') {
			setCaliberCategoryFilter(itemFormData.category);
		} else if (itemFormData.category === 'magazine' && itemFormData.platform) {
			setCaliberCategoryFilter(itemFormData.platform as 'handgun' | 'rifle' | 'shotgun');
		} else {
			setCaliberCategoryFilter('handgun'); // Default
		}
		setShowCaliberPicker(true);
	};

	const handleEnterReorderMode = () => {
		setReorderedItems([...filteredItems]);
		setIsReorderMode(true);
	};

	const handleCancelReorder = () => {
		setIsReorderMode(false);
		setReorderedItems([]);
	};

	const handleSaveReorder = async () => {
		// For now, just exit reorder mode
		// In a full implementation, you'd call an API to save the order
		setIsReorderMode(false);
		setReorderedItems([]);
		Alert.alert('Success', 'Item order saved.');
	};

	const moveItemUp = (index: number) => {
		if (index === 0) return;
		const newItems = [...reorderedItems];
		[newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]];
		setReorderedItems(newItems);
	};

	const moveItemDown = (index: number) => {
		if (index === reorderedItems.length - 1) return;
		const newItems = [...reorderedItems];
		[newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];
		setReorderedItems(newItems);
	};

	const getCategoryLabel = (category: EquipmentItemCategory): string => {
		const labels: Record<EquipmentItemCategory, string> = {
			handgun: 'Handgun',
			rifle: 'Rifle',
			shotgun: 'Shotgun',
			nfa_item: 'NFA Item',
			magazine: 'Magazine',
			other: 'Other',
		};
		return labels[category] || category;
	};

	if (isLoading) {
		return <LoadingSpinner message="Loading equipment..." />;
	}

	// Check if we're in items-only mode (no loadout handlers provided)
	// If loadout handlers are provided, we're in loadout selection mode
	const itemsOnlyMode = !onCreateLoadout && !onUpdateLoadout && !onDeleteLoadout;

	return (
		<View style={styles.container}>
			{itemsOnlyMode ? (
				// Items-only mode: Show equipment items management
				<View>
					{/* Category Filter */}
					<ScrollView
						horizontal
						showsHorizontalScrollIndicator={false}
						style={styles.categoryScroll}
						contentContainerStyle={styles.categoryScrollContent}
					>
						{CATEGORIES.map((cat) => (
							<TouchableOpacity
								key={cat.value}
								style={[
									styles.categoryChip,
									categoryFilter === cat.value && styles.categoryChipSelected,
								]}
								onPress={() => setCategoryFilter(cat.value)}
							>
								<Text
									style={[
										styles.categoryChipText,
										categoryFilter === cat.value && styles.categoryChipTextSelected,
									]}
								>
									{cat.label}
								</Text>
							</TouchableOpacity>
						))}
					</ScrollView>

					{/* Action Bar */}
					<View style={styles.actionBar}>
						{isReorderMode ? (
							<>
								<TouchableOpacity onPress={handleCancelReorder}>
									<Text style={styles.actionCancel}>Cancel</Text>
								</TouchableOpacity>
								<Text style={styles.actionTitle}>Reorder Items</Text>
								<TouchableOpacity onPress={handleSaveReorder}>
									<Text style={styles.actionDone}>Done</Text>
								</TouchableOpacity>
							</>
						) : (
							<>
								<Button
									title="+ Add Item"
									onPress={() => handleOpenItemModal()}
									variant="primary"
									style={styles.actionButton}
								/>
								<Button
									title="Reorder"
									onPress={handleEnterReorderMode}
									variant="primary"
									style={styles.actionButton}
									disabled={displayItems.length === 0}
								/>
							</>
						)}
					</View>

					{/* Items List */}
					{displayItems.length === 0 ? (
						<Card style={styles.emptyCard}>
							<Icon name="cube-outline" size={48} color={theme.colors.onSurfaceVariant} />
							<Text style={styles.emptyText}>No items yet</Text>
							<Text style={styles.emptySubtext}>Add your first equipment item to get started</Text>
						</Card>
					) : (
						<Card style={styles.section}>
							{displayItems.map((item, index) => (
								<View key={item.id} style={styles.itemRow}>
									{isReorderMode ? (
										<>
											<View style={styles.itemInfo}>
												<Text style={styles.itemName}>{item.name}</Text>
												<Text style={styles.itemDetail}>{getCategoryLabel(item.category)}</Text>
											</View>
											<View style={styles.reorderButtons}>
												<TouchableOpacity
													onPress={() => moveItemUp(index)}
													disabled={index === 0}
													style={styles.reorderButton}
												>
													<Icon
														name="chevron-up"
														size={24}
														color={index === 0 ? theme.colors.onSurfaceVariant : theme.colors.primary}
													/>
												</TouchableOpacity>
												<TouchableOpacity
													onPress={() => moveItemDown(index)}
													disabled={index === displayItems.length - 1}
													style={styles.reorderButton}
												>
													<Icon
														name="chevron-down"
														size={24}
														color={index === displayItems.length - 1 ? theme.colors.onSurfaceVariant : theme.colors.primary}
													/>
												</TouchableOpacity>
											</View>
										</>
									) : (
										<>
											<View style={styles.itemInfo}>
												<Text style={styles.itemName}>{item.name}</Text>
												<Text style={styles.itemDetail}>{getCategoryLabel(item.category)}</Text>
											</View>
											<TouchableOpacity
												onPress={() => handleOpenItemModal(item)}
												style={styles.iconButton}
											>
												<Icon name="create-outline" size={24} color={theme.colors.primary} />
											</TouchableOpacity>
										</>
									)}
								</View>
							))}
						</Card>
					)}
				</View>
			) : (
				// Loadout selection mode
				<View>

					<Card style={styles.section}>
					<Text style={styles.label}>Select Loadouts</Text>
					<Text style={styles.helperText}>
						Choose one or more loadouts for this route
					</Text>
						{loadouts.length === 0 ? (
							<View style={styles.emptyCard}>
								<Icon name="briefcase-outline" size={48} color={theme.colors.onSurfaceVariant} />
								<Text style={styles.emptyText}>No loadouts yet</Text>
								<Text style={styles.emptySubtext}>Create your first loadout to get started</Text>
							</View>
						) : (
							<>
								{loadouts.map((loadout) => {
									const isSelected = selectedLoadouts.some(l => l.id === loadout.id);
									return (
										<View
											key={loadout.id}
											style={[
												styles.loadoutCard,
												isSelected && styles.loadoutCardSelected,
											]}
										>
											<TouchableOpacity
												style={styles.loadoutContent}
												onPress={() => toggleLoadoutSelection(loadout)}
											>
												<Icon
													name={isSelected ? 'checkbox' : 'square-outline'}
													size={24}
													color={isSelected ? theme.colors.primary : theme.colors.onSurfaceVariant}
												/>
												<View style={styles.loadoutText}>
													<Text style={styles.loadoutName}>{loadout.name}</Text>
													<Text style={styles.loadoutDetail}>
														{loadout.items.length} item{loadout.items.length !== 1 ? 's' : ''}
													</Text>
												</View>
												{loadout.is_default && (
													<View style={styles.defaultBadge}>
														<Text style={styles.defaultBadgeText}>Default</Text>
													</View>
												)}
											</TouchableOpacity>
											<TouchableOpacity
												onPress={() => handleOpenLoadoutModal(loadout)}
												style={styles.iconButton}
											>
												<Icon name="create-outline" size={24} color={theme.colors.primary} />
											</TouchableOpacity>
										</View>
									);
								})}
							</>
						)}
						{onCreateLoadout && (
							<Button
								title="+ Create New Loadout"
								onPress={() => handleOpenLoadoutModal()}
								variant="secondary"
								style={styles.createButton}
							/>
						)}
					</Card>
				</View>
			)}

			{/* Item Edit/Create Modal */}
			<Modal
				visible={showItemModal}
				animationType="slide"
				presentationStyle="pageSheet"
				onRequestClose={() => setShowItemModal(false)}
			>
				<View style={styles.modalContainer}>
					<View style={styles.modalHeader}>
						<TouchableOpacity
							onPress={() => setShowItemModal(false)}
							style={styles.backButton}
						>
							<Icon name="chevron-back" size={28} color={theme.colors.primary} />
						</TouchableOpacity>
						<Text style={styles.modalTitle}>
							{editingItem ? 'Edit Equipment' : 'New Item'}
						</Text>
						<View style={styles.modalHeaderSpacer} />
					</View>

					<ScrollView style={styles.modalContent}>
						<Card style={styles.modalSection}>
							<Text style={styles.fieldLabel}>Item Name</Text>
							<TextInput
								style={styles.input}
								value={itemFormData.name}
								onChangeText={(text) => setItemFormData({ ...itemFormData, name: text })}
								placeholder="e.g., Glock 19, AR-15 Build"
								placeholderTextColor={theme.colors.onSurfaceVariant}
							/>

							<Text style={styles.fieldLabel}>Category</Text>
							<View style={styles.categoryGrid}>
								{CATEGORIES.filter(c => c.value !== 'all').map((cat) => (
									<TouchableOpacity
										key={cat.value}
										style={[
											styles.categoryButton,
											itemFormData.category === cat.value && styles.categoryButtonSelected,
										]}
										onPress={() => setItemFormData({ ...itemFormData, category: cat.value as EquipmentItemCategory })}
									>
										<Text
											style={[
												styles.categoryButtonText,
												itemFormData.category === cat.value && styles.categoryButtonTextSelected,
											]}
										>
											{cat.label}
										</Text>
									</TouchableOpacity>
								))}
							</View>

							{/* Caliber selection for firearms and magazines */}
							{(itemFormData.category === 'handgun' || itemFormData.category === 'rifle' || itemFormData.category === 'shotgun' || itemFormData.category === 'magazine') && (
								<>
									<Text style={styles.fieldLabel}>Caliber(s)</Text>
									<View style={styles.caliberContainer}>
										{itemFormData.calibers && itemFormData.calibers.length > 0 ? (
											<View style={styles.selectedCalibersContainer}>
												{itemFormData.calibers.map((caliber) => (
													<View key={caliber} style={styles.caliberChip}>
														<Text style={styles.caliberChipText}>{caliber}</Text>
														<TouchableOpacity onPress={() => handleRemoveCaliber(caliber)}>
															<Icon name="close-circle" size={18} color={theme.colors.onSurfaceVariant} />
														</TouchableOpacity>
													</View>
												))}
											</View>
										) : (
											<Text style={styles.helperText}>No calibers selected</Text>
										)}
										<Button
											title="Add Caliber"
											onPress={handleOpenCaliberPicker}
											style={styles.addCaliberButton}
										/>
									</View>
								</>
							)}

							{/* Category-specific fields */}
							{(itemFormData.category === 'handgun' || itemFormData.category === 'rifle' || itemFormData.category === 'shotgun') && (
								<>
									<Toggle
										label="Accepts Detachable Magazine"
										value={itemFormData.accepts_detachable_magazine || false}
										onValueChange={(value) =>
											setItemFormData({ ...itemFormData, accepts_detachable_magazine: value })
										}
										thumbColorOn={theme.colors.primary}
										trackColorOn={theme.colors.outline}
									/>
									<Text style={styles.fieldLabel}>
										{itemFormData.accepts_detachable_magazine
											? 'Magazine Capacity (Optional)'
											: 'Ammunition Capacity'}
									</Text>
									<TextInput
										style={styles.input}
										value={itemFormData.ammunition_capacity?.toString() || ''}
										onChangeText={(text) => {
											const num = parseInt(text.replace(/[^0-9]/g, ''), 10);
											setItemFormData({
												...itemFormData,
												ammunition_capacity: isNaN(num) ? undefined : num,
											});
										}}
										placeholder={itemFormData.accepts_detachable_magazine
											? "e.g., 15, 17, 30 (if including magazine)"
											: "e.g., 6, 8"}
										placeholderTextColor={theme.colors.onSurfaceVariant}
										keyboardType="number-pad"
									/>
								</>
							)}

							{itemFormData.category === 'magazine' && (
								<>
									<Text style={styles.fieldLabel}>Platform</Text>
									<View style={styles.categoryGrid}>
										{['handgun', 'rifle', 'shotgun'].map((platform) => (
											<TouchableOpacity
												key={platform}
												style={[
													styles.categoryButton,
													itemFormData.platform === platform && styles.categoryButtonSelected,
												]}
												onPress={() => setItemFormData({ ...itemFormData, platform: platform as any })}
											>
												<Text
													style={[
														styles.categoryButtonText,
														itemFormData.platform === platform && styles.categoryButtonTextSelected,
													]}
												>
													{platform.charAt(0).toUpperCase() + platform.slice(1)}
												</Text>
											</TouchableOpacity>
										))}
									</View>

									<Text style={styles.fieldLabel}>Capacity</Text>
									<TextInput
										style={styles.input}
										value={itemFormData.ammunition_capacity?.toString() || ''}
										onChangeText={(text) => {
											const num = parseInt(text.replace(/[^0-9]/g, ''), 10);
											setItemFormData({
												...itemFormData,
												ammunition_capacity: isNaN(num) ? undefined : num,
											});
										}}
										placeholder="e.g., 10, 15, 30"
										placeholderTextColor={theme.colors.onSurfaceVariant}
										keyboardType="number-pad"
									/>
								</>
							)}

							<Text style={styles.fieldLabel}>Notes (Optional)</Text>
							<TextInput
								style={[styles.input, styles.notesInput]}
								value={itemFormData.notes || ''}
								onChangeText={(text) => setItemFormData({ ...itemFormData, notes: text })}
								placeholder="Additional details..."
								placeholderTextColor={theme.colors.onSurfaceVariant}
								multiline
								numberOfLines={3}
							/>
						</Card>

						<Button
							title="Save Item"
							onPress={handleSaveItem}
							style={styles.saveButton}
						/>

						{editingItem && onDeleteItem && (
							<Button
								title="Delete Item"
								onPress={() => {
									setShowItemModal(false);
									handleDeleteItem(editingItem.id);
								}}
								variant="danger"
								style={styles.deleteButton}
							/>
						)}
					</ScrollView>
				</View>
			</Modal>

			{/* Loadout Edit/Create Modal */}
			<Modal
				visible={showLoadoutModal}
				animationType="slide"
				presentationStyle="pageSheet"
				onRequestClose={() => setShowLoadoutModal(false)}
			>
				<View style={styles.modalContainer}>
					<View style={styles.modalHeader}>
						<TouchableOpacity
							onPress={() => setShowLoadoutModal(false)}
							style={styles.backButton}
						>
							<Icon name="chevron-back" size={28} color={theme.colors.primary} />
						</TouchableOpacity>
						<Text style={styles.modalTitle}>
							{editingLoadout ? 'Edit Loadout' : 'New Loadout'}
						</Text>
						<View style={styles.modalHeaderSpacer} />
					</View>

					<ScrollView style={styles.modalContent}>
						<Card style={styles.modalSection}>
							<Text style={styles.fieldLabel}>Loadout Name</Text>
							<TextInput
								style={styles.input}
								value={loadoutName}
								onChangeText={setLoadoutName}
								placeholder="e.g., Range Day Kit, Hunting Trip"
								placeholderTextColor={theme.colors.onSurfaceVariant}
							/>

							<Text style={styles.fieldLabel}>Select Equipment</Text>

							<ScrollView
								horizontal
								showsHorizontalScrollIndicator={false}
								style={styles.categoryFilterContainer}
							>
								{CATEGORIES.map((cat) => (
									<TouchableOpacity
										key={cat.value}
										style={[
											styles.categoryChip,
											loadoutCategoryFilter === cat.value && styles.categoryChipActive,
										]}
										onPress={() => setLoadoutCategoryFilter(cat.value)}
									>
										<Text
											style={[
												styles.categoryChipText,
												loadoutCategoryFilter === cat.value && styles.categoryChipTextActive,
											]}
										>
											{cat.label}
										</Text>
									</TouchableOpacity>
								))}
							</ScrollView>

							{editingLoadout && (
								<Text style={styles.helperText}>
									Select which items to include in this loadout.
								</Text>
							)}
							{equipmentItems.length === 0 ? (
								<Text style={styles.helperText}>
									No equipment yet. Create items first.
								</Text>
							) : (
								<>
									{equipmentItems
										.filter((item) => loadoutCategoryFilter === 'all' || item.category === loadoutCategoryFilter)
										.map((item) => {
											const isSelected = selectedItemIds.includes(item.id);
											return (
												<TouchableOpacity
													key={item.id}
													style={styles.selectableItem}
													onPress={() => toggleItemInLoadout(item.id)}
												>
												<Icon
													name={isSelected ? 'checkbox' : 'square-outline'}
													size={24}
													color={isSelected ? theme.colors.primary : theme.colors.onSurfaceVariant}
													style={{ marginRight: 10 }}
												/>
												<View style={styles.itemInfo}>
													<Text style={styles.itemName}>{item.name}</Text>
													<Text style={styles.itemDetail}>{getCategoryLabel(item.category)}</Text>
												</View>
											</TouchableOpacity>
										);
									})}
								</>
							)}
						</Card>

						<Button
							title="Save Loadout"
							onPress={handleSaveLoadout}
							style={styles.saveButton}
						/>

						{editingLoadout && onDeleteLoadout && (
							<Button
								title="Delete Loadout"
								onPress={() => {
									setShowLoadoutModal(false);
									handleDeleteLoadout(editingLoadout.id);
								}}
								variant="danger"
								style={styles.deleteButton}
							/>
						)}
					</ScrollView>
				</View>
			</Modal>

			{/* Caliber Picker Modal */}
			<Modal
				visible={showCaliberPicker}
				animationType="slide"
				presentationStyle="pageSheet"
				onRequestClose={() => setShowCaliberPicker(false)}
			>
				<View style={styles.modalContainer}>
					<View style={styles.modalHeader}>
						<TouchableOpacity
							onPress={() => setShowCaliberPicker(false)}
							style={styles.backButton}
						>
							<Icon name="chevron-back" size={28} color={theme.colors.primary} />
						</TouchableOpacity>
						<Text style={styles.modalTitle}>Select Caliber</Text>
						<View style={styles.modalHeaderSpacer} />
					</View>

					{/* Category tabs */}
					<View style={styles.caliberCategoryTabs}>
						{(['handgun', 'rifle', 'shotgun'] as const).map((cat) => (
							<TouchableOpacity
								key={cat}
								style={[
									styles.caliberCategoryTab,
									caliberCategoryFilter === cat && styles.caliberCategoryTabActive,
								]}
								onPress={() => setCaliberCategoryFilter(cat)}
							>
								<Text
									style={[
										styles.caliberCategoryTabText,
										caliberCategoryFilter === cat && styles.caliberCategoryTabTextActive,
									]}
								>
									{cat.charAt(0).toUpperCase() + cat.slice(1)}
								</Text>
							</TouchableOpacity>
						))}
					</View>

					<ScrollView style={styles.modalContent}>
						<Card style={styles.modalSection}>
							<Text style={styles.sectionTitle}>Standard Calibers</Text>
							{getCalibersByCategory(caliberCategoryFilter).filter(c => c.name !== 'Other').map((caliberData) => (
								<TouchableOpacity
									key={caliberData.name}
									style={styles.caliberOption}
									onPress={() => handleAddCaliber(caliberData.name)}
								>
									<View style={styles.caliberOptionContent}>
										<Text style={styles.caliberOptionName}>{caliberData.name}</Text>
									</View>
									<Icon name="add-circle-outline" size={24} color={theme.colors.primary} />
								</TouchableOpacity>
							))}
						</Card>

						<Card style={styles.modalSection}>
							<Text style={styles.sectionTitle}>Custom Caliber</Text>
							<Text style={styles.helperText}>
								Enter a custom caliber not listed above
							</Text>
							<TextInput
								style={styles.input}
								value={customCaliber}
								onChangeText={setCustomCaliber}
								placeholder="e.g., 6.8 SPC, .357 Maximum"
								placeholderTextColor={theme.colors.onSurfaceVariant}
								onSubmitEditing={handleAddCustomCaliber}
								returnKeyType="done"
							/>
							<Button
								title="Add Custom Caliber"
								onPress={handleAddCustomCaliber}
								disabled={!customCaliber.trim()}
								style={styles.addButton}
							/>
						</Card>
					</ScrollView>
				</View>
			</Modal>
		</View>
	);
}

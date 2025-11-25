import { useState } from 'react';
import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	ScrollView,
	Modal,
	TextInput,
	Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type {
	EquipmentItem,
	Loadout,
	CreateEquipmentItemRequest,
	EquipmentItemCategory,
} from '@reguroute/types';
import { colors } from '../theme';
import Card from './Card';
import Button from './Button';
import Toggle from './Toggle';
import LoadingSpinner from './LoadingSpinner';

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
			Alert.alert('Error', 'Failed to save equipment item.');
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
			// Start with empty selection when editing to prevent accidental deletions
			// Users must explicitly check items they want to keep
			setSelectedItemIds([]);
		} else {
			setEditingLoadout(null);
			setLoadoutName('');
			setSelectedItemIds([]);
		}
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

	// Check if we're in items-only mode (no loadouts props provided)
	const itemsOnlyMode = loadouts.length === 0 && selectedLoadouts.length === 0;

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
									title="Add Item"
									onPress={() => handleOpenItemModal()}
									variant="secondary"
									style={styles.actionButton}
								/>
								<Button
									title="Reorder"
									onPress={handleEnterReorderMode}
									variant="secondary"
									style={styles.actionButton}
									disabled={displayItems.length === 0}
								/>
							</>
						)}
					</View>

					{/* Items List */}
					{displayItems.length === 0 ? (
						<Card style={styles.emptyCard}>
							<Ionicons name="cube-outline" size={48} color={colors.textMuted} />
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
													<Ionicons
														name="chevron-up"
														size={24}
														color={index === 0 ? colors.textMuted : colors.primary}
													/>
												</TouchableOpacity>
												<TouchableOpacity
													onPress={() => moveItemDown(index)}
													disabled={index === displayItems.length - 1}
													style={styles.reorderButton}
												>
													<Ionicons
														name="chevron-down"
														size={24}
														color={index === displayItems.length - 1 ? colors.textMuted : colors.primary}
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
											<View style={styles.itemActions}>
												<TouchableOpacity
													onPress={() => handleOpenItemModal(item)}
													style={styles.iconButton}
												>
													<Ionicons name="create-outline" size={24} color={colors.primary} />
												</TouchableOpacity>
												<TouchableOpacity
													onPress={() => handleDeleteItem(item.id)}
													style={styles.iconButton}
												>
													<Ionicons name="trash-outline" size={24} color={colors.error} />
												</TouchableOpacity>
											</View>
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
					<Text style={styles.label}>Select Loadouts</Text>
					<Text style={styles.helperText}>
						Choose one or more loadouts for this route
					</Text>

					{loadouts.length === 0 ? (
						<Card style={styles.emptyCard}>
							<Ionicons name="briefcase-outline" size={48} color={colors.textMuted} />
							<Text style={styles.emptyText}>No loadouts yet</Text>
							<Text style={styles.emptySubtext}>Create your first loadout in the Cargo Profile screen</Text>
						</Card>
					) : (
						<>
							{loadouts.map((loadout) => {
								const isSelected = selectedLoadouts.some(l => l.id === loadout.id);
								return (
									<TouchableOpacity
										key={loadout.id}
										style={[
											styles.loadoutCard,
											isSelected && styles.loadoutCardSelected,
										]}
										onPress={() => toggleLoadoutSelection(loadout)}
										onLongPress={() => handleOpenLoadoutModal(loadout)}
									>
										<View style={styles.loadoutContent}>
											<Ionicons
												name={isSelected ? 'checkbox' : 'square-outline'}
												size={24}
												color={isSelected ? colors.primary : colors.textMuted}
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
										</View>
									</TouchableOpacity>
								);
							})}
						</>
					)}

					{onCreateLoadout && (
						<Button
							title="Create New Loadout"
							onPress={() => handleOpenLoadoutModal()}
							variant="secondary"
							style={styles.createButton}
						/>
					)}
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
						<TouchableOpacity onPress={() => setShowItemModal(false)}>
							<Text style={styles.modalCancel}>Cancel</Text>
						</TouchableOpacity>
						<Text style={styles.modalTitle}>
							{editingItem ? 'Edit Item' : 'New Item'}
						</Text>
						<TouchableOpacity onPress={handleSaveItem}>
							<Text style={styles.modalDone}>Save</Text>
						</TouchableOpacity>
					</View>

					<ScrollView style={styles.modalContent}>
						<Card style={styles.modalSection}>
							<Text style={styles.fieldLabel}>Item Name</Text>
							<TextInput
								style={styles.input}
								value={itemFormData.name}
								onChangeText={(text) => setItemFormData({ ...itemFormData, name: text })}
								placeholder="e.g., Glock 19, AR-15 Build"
								placeholderTextColor={colors.textMuted}
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

							{/* Category-specific fields can be added here */}
							{(itemFormData.category === 'handgun' || itemFormData.category === 'rifle' || itemFormData.category === 'shotgun') && (
								<>
									<Toggle
										label="Accepts Detachable Magazine"
										value={itemFormData.accepts_detachable_magazine || false}
										onValueChange={(value) =>
											setItemFormData({ ...itemFormData, accepts_detachable_magazine: value })
										}
									/>
									{!itemFormData.accepts_detachable_magazine && (
										<>
											<Text style={styles.fieldLabel}>Ammunition Capacity</Text>
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
												placeholder="e.g., 6, 8"
												placeholderTextColor={colors.textMuted}
												keyboardType="number-pad"
											/>
										</>
									)}
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
										placeholderTextColor={colors.textMuted}
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
								placeholderTextColor={colors.textMuted}
								multiline
								numberOfLines={3}
							/>
						</Card>
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
						<TouchableOpacity onPress={() => setShowLoadoutModal(false)}>
							<Text style={styles.modalCancel}>Cancel</Text>
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
								placeholderTextColor={colors.textMuted}
							/>

							<Text style={styles.fieldLabel}>Select Items</Text>
							{editingLoadout && (
								<Text style={styles.helperText}>
									Currently in loadout: {editingLoadout.items.length} item{editingLoadout.items.length !== 1 ? 's' : ''}. Check items to keep.
								</Text>
							)}
							{equipmentItems.length === 0 ? (
								<Text style={styles.helperText}>
									No equipment items yet. Create items first.
								</Text>
							) : (
								<>
									{equipmentItems.map((item) => {
										const isSelected = selectedItemIds.includes(item.id);
										const isCurrentlyInLoadout = editingLoadout?.items.some(li => li.equipment_item_id === item.id);
										return (
											<TouchableOpacity
												key={item.id}
												style={styles.selectableItem}
												onPress={() => toggleItemInLoadout(item.id)}
											>
												<Ionicons
													name={isSelected ? 'checkbox' : 'square-outline'}
													size={24}
													color={isSelected ? colors.primary : colors.textMuted}
												/>
												<View style={styles.itemInfo}>
													<Text style={styles.itemName}>
														{item.name}
														{isCurrentlyInLoadout && !isSelected && (
															<Text style={styles.currentlyInLoadout}> (currently in loadout)</Text>
														)}
													</Text>
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
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		marginBottom: 16,
	},
	label: {
		fontSize: 16,
		fontWeight: '600',
		color: colors.text,
		marginBottom: 4,
	},
	helperText: {
		fontSize: 13,
		color: colors.textMuted,
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
		backgroundColor: colors.backgroundWhite,
		borderWidth: 1,
		borderColor: colors.border,
		marginRight: 8,
	},
	categoryChipSelected: {
		backgroundColor: colors.primary,
		borderColor: colors.primary,
	},
	categoryChipText: {
		fontSize: 14,
		fontWeight: '500',
		color: colors.text,
	},
	categoryChipTextSelected: {
		color: colors.white,
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
		color: colors.textSecondary,
	},
	actionTitle: {
		fontSize: 17,
		fontWeight: '600',
		color: colors.text,
	},
	actionDone: {
		fontSize: 16,
		fontWeight: '600',
		color: colors.primary,
	},
	section: {
		padding: 16,
		marginBottom: 16,
	},
	itemRow: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingVertical: 12,
		borderBottomWidth: 1,
		borderBottomColor: colors.borderLight,
	},
	itemInfo: {
		flex: 1,
	},
	itemName: {
		fontSize: 15,
		fontWeight: '500',
		color: colors.text,
	},
	itemDetail: {
		fontSize: 13,
		color: colors.textMuted,
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
		color: colors.text,
		marginTop: 12,
	},
	emptySubtext: {
		fontSize: 14,
		color: colors.textMuted,
		marginTop: 4,
		textAlign: 'center',
	},
	loadoutCard: {
		backgroundColor: colors.backgroundWhite,
		borderRadius: 12,
		padding: 14,
		marginBottom: 8,
		borderWidth: 2,
		borderColor: colors.border,
	},
	loadoutCardSelected: {
		borderColor: colors.primary,
		backgroundColor: colors.infoLight,
	},
	loadoutContent: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	loadoutText: {
		marginLeft: 12,
		flex: 1,
	},
	loadoutName: {
		fontSize: 15,
		fontWeight: '500',
		color: colors.text,
	},
	loadoutDetail: {
		fontSize: 13,
		color: colors.textMuted,
		marginTop: 2,
	},
	defaultBadge: {
		backgroundColor: colors.primaryLight,
		paddingHorizontal: 8,
		paddingVertical: 2,
		borderRadius: 4,
		marginLeft: 8,
	},
	defaultBadgeText: {
		fontSize: 11,
		color: colors.white,
		fontWeight: '500',
	},
	createButton: {
		marginTop: 8,
	},
	modalContainer: {
		flex: 1,
		backgroundColor: colors.background,
	},
	modalHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: 16,
		paddingVertical: 14,
		backgroundColor: colors.backgroundWhite,
		borderBottomWidth: 1,
		borderBottomColor: colors.border,
	},
	modalTitle: {
		fontSize: 17,
		fontWeight: '600',
		color: colors.text,
	},
	modalCancel: {
		fontSize: 16,
		color: colors.textSecondary,
	},
	modalDone: {
		fontSize: 16,
		fontWeight: '600',
		color: colors.primary,
	},
	modalHeaderSpacer: {
		width: 60,
	},
	modalContent: {
		flex: 1,
		padding: 16,
	},
	modalSection: {
		padding: 16,
		marginBottom: 16,
	},
	fieldLabel: {
		fontSize: 14,
		fontWeight: '500',
		color: colors.text,
		marginTop: 16,
		marginBottom: 8,
	},
	input: {
		backgroundColor: colors.backgroundWhite,
		borderRadius: 12,
		paddingHorizontal: 16,
		paddingVertical: 12,
		fontSize: 16,
		borderWidth: 1,
		borderColor: colors.border,
		color: colors.text,
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
		backgroundColor: colors.backgroundWhite,
		borderWidth: 1,
		borderColor: colors.border,
		marginRight: 8,
		marginBottom: 8,
	},
	categoryButtonSelected: {
		backgroundColor: colors.primary,
		borderColor: colors.primary,
	},
	categoryButtonText: {
		fontSize: 14,
		fontWeight: '500',
		color: colors.text,
	},
	categoryButtonTextSelected: {
		color: colors.white,
	},
	selectableItem: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingVertical: 12,
		borderBottomWidth: 1,
		borderBottomColor: colors.borderLight,
	},
	currentlyInLoadout: {
		fontSize: 13,
		color: colors.textMuted,
		fontStyle: 'italic',
	},
	saveButton: {
		marginTop: 8,
	},
	deleteButton: {
		marginTop: 8,
		marginBottom: 32,
	},
});

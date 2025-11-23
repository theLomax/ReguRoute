import { useState, useEffect } from 'react';
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
import type { Equipment, CargoProfile, FirearmType } from '@reguroute/types';
import { colors } from '../theme';
import Card from './Card';
import Button from './Button';
import Toggle from './Toggle';
import Chip from './Chip';
import LoadingSpinner from './LoadingSpinner';

interface EquipmentSelectorProps {
	equipment: Equipment[];
	selectedEquipment: Equipment | null;
	customCargoProfile: CargoProfile | null;
	isLoading: boolean;
	onSelectEquipment: (equipment: Equipment | null) => void;
	onSetCustomProfile: (profile: CargoProfile | null) => void;
	onCreateEquipment?: (name: string, profile: CargoProfile) => Promise<void>;
}

const FIREARM_TYPES: { value: FirearmType; label: string }[] = [
	{ value: 'handgun', label: 'Handgun' },
	{ value: 'rifle', label: 'Rifle' },
	{ value: 'shotgun', label: 'Shotgun' },
];

const DEFAULT_CARGO_PROFILE: CargoProfile = {
	has_firearms: false,
};

export default function EquipmentSelector({
	equipment,
	selectedEquipment,
	customCargoProfile,
	isLoading,
	onSelectEquipment,
	onSetCustomProfile,
	onCreateEquipment,
}: EquipmentSelectorProps) {
	const [showCustomModal, setShowCustomModal] = useState(false);
	const [editingProfile, setEditingProfile] = useState<CargoProfile>(DEFAULT_CARGO_PROFILE);
	const [saveName, setSaveName] = useState('');
	const [showSaveOption, setShowSaveOption] = useState(false);

	// Determine active selection mode
	const selectionMode: 'none' | 'preset' | 'custom' =
		selectedEquipment ? 'preset' :
		customCargoProfile ? 'custom' :
		'none';

	// Get the active cargo profile for display
	const activeProfile = selectedEquipment?.cargo_profile || customCargoProfile;

	const handleSelectNone = () => {
		onSelectEquipment(null);
		onSetCustomProfile(null);
	};

	const handleSelectPreset = (item: Equipment) => {
		onSelectEquipment(item);
		onSetCustomProfile(null);
	};

	const handleOpenCustom = () => {
		// Start with current custom profile or selected preset's profile or default
		const initialProfile = customCargoProfile || selectedEquipment?.cargo_profile || DEFAULT_CARGO_PROFILE;
		setEditingProfile({ ...initialProfile });
		setShowCustomModal(true);
	};

	const handleSaveCustom = () => {
		onSelectEquipment(null);
		onSetCustomProfile(editingProfile);
		setShowCustomModal(false);
		setShowSaveOption(false);
		setSaveName('');
	};

	const handleSaveAsPreset = async () => {
		if (!saveName.trim()) {
			Alert.alert('Name Required', 'Please enter a name for this equipment preset.');
			return;
		}
		if (onCreateEquipment) {
			try {
				await onCreateEquipment(saveName.trim(), editingProfile);
				setShowCustomModal(false);
				setShowSaveOption(false);
				setSaveName('');
			} catch (error) {
				Alert.alert('Error', 'Failed to save equipment preset.');
			}
		}
	};

	const toggleFirearmType = (type: FirearmType) => {
		const currentTypes = editingProfile.firearm_types || [];
		const newTypes = currentTypes.includes(type)
			? currentTypes.filter(t => t !== type)
			: [...currentTypes, type];
		setEditingProfile({ ...editingProfile, firearm_types: newTypes });
	};

	const getProfileSummary = (profile: CargoProfile): string => {
		if (!profile.has_firearms) return 'No restricted items';

		const parts: string[] = [];
		if (profile.firearm_types?.length) {
			parts.push(profile.firearm_types.join(', '));
		}
		if (profile.has_assault_weapon) {
			parts.push('AWB');
		}
		if (profile.magazine_capacity) {
			parts.push(`${profile.magazine_capacity}rd`);
		}
		return parts.length > 0 ? parts.join(' · ') : 'Firearms';
	};

	if (isLoading) {
		return <LoadingSpinner message="Loading equipment..." />;
	}

	return (
		<View style={styles.container}>
			<Text style={styles.label}>Equipment / Cargo</Text>
			<Text style={styles.helperText}>
				Select what you're transporting to check for route restrictions
			</Text>

			{/* No Restricted Items Option */}
			<TouchableOpacity
				style={[
					styles.optionCard,
					selectionMode === 'none' && styles.optionCardSelected,
				]}
				onPress={handleSelectNone}
			>
				<View style={styles.optionContent}>
					<Ionicons
						name="checkmark-circle"
						size={24}
						color={selectionMode === 'none' ? colors.success : colors.textMuted}
					/>
					<View style={styles.optionText}>
						<Text style={styles.optionTitle}>No Restricted Items</Text>
						<Text style={styles.optionDescription}>Route without cargo restrictions</Text>
					</View>
				</View>
				{selectionMode === 'none' && (
					<Ionicons name="checkmark" size={20} color={colors.success} />
				)}
			</TouchableOpacity>

			{/* Saved Equipment Presets */}
			{equipment.length > 0 && (
				<>
					<Text style={styles.sectionLabel}>Saved Equipment</Text>
					{equipment.map((item) => (
						<TouchableOpacity
							key={item.id}
							style={[
								styles.optionCard,
								selectedEquipment?.id === item.id && styles.optionCardSelected,
							]}
							onPress={() => handleSelectPreset(item)}
						>
							<View style={styles.optionContent}>
								<Ionicons
									name="briefcase"
									size={24}
									color={selectedEquipment?.id === item.id ? colors.primary : colors.textMuted}
								/>
								<View style={styles.optionText}>
									<Text style={styles.optionTitle}>{item.name}</Text>
									<Text style={styles.optionDescription}>
										{getProfileSummary(item.cargo_profile)}
									</Text>
								</View>
								{item.is_default && (
									<View style={styles.defaultBadge}>
										<Text style={styles.defaultBadgeText}>Default</Text>
									</View>
								)}
							</View>
							{selectedEquipment?.id === item.id && (
								<Ionicons name="checkmark" size={20} color={colors.primary} />
							)}
						</TouchableOpacity>
					))}
				</>
			)}

			{/* Custom Profile Option */}
			<TouchableOpacity
				style={[
					styles.optionCard,
					selectionMode === 'custom' && styles.optionCardSelected,
				]}
				onPress={handleOpenCustom}
			>
				<View style={styles.optionContent}>
					<Ionicons
						name="settings"
						size={24}
						color={selectionMode === 'custom' ? colors.primary : colors.textMuted}
					/>
					<View style={styles.optionText}>
						<Text style={styles.optionTitle}>Custom Selection</Text>
						<Text style={styles.optionDescription}>
							{selectionMode === 'custom' && customCargoProfile
								? getProfileSummary(customCargoProfile)
								: 'Configure specific items for this route'}
						</Text>
					</View>
				</View>
				<Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
			</TouchableOpacity>

			{/* Active Profile Summary */}
			{activeProfile && activeProfile.has_firearms && (
				<Card style={styles.summaryCard}>
					<View style={styles.summaryHeader}>
						<Ionicons name="warning" size={18} color={colors.warning} />
						<Text style={styles.summaryTitle}>Active Restrictions Check</Text>
					</View>
					<Text style={styles.summaryText}>
						Route will be checked for compliance with:{'\n'}
						{activeProfile.firearm_types?.length ? `• Firearm types: ${activeProfile.firearm_types.join(', ')}\n` : ''}
						{activeProfile.has_assault_weapon ? '• Assault weapons regulations\n' : ''}
						{activeProfile.magazine_capacity ? `• Magazine capacity: ${activeProfile.magazine_capacity} rounds\n` : ''}
						{activeProfile.has_concealed_carry_permit ? '• Concealed carry reciprocity' : ''}
					</Text>
				</Card>
			)}

			{/* Custom Profile Modal */}
			<Modal
				visible={showCustomModal}
				animationType="slide"
				presentationStyle="pageSheet"
				onRequestClose={() => setShowCustomModal(false)}
			>
				<View style={styles.modalContainer}>
					<View style={styles.modalHeader}>
						<TouchableOpacity onPress={() => setShowCustomModal(false)}>
							<Text style={styles.modalCancel}>Cancel</Text>
						</TouchableOpacity>
						<Text style={styles.modalTitle}>Custom Equipment</Text>
						<TouchableOpacity onPress={handleSaveCustom}>
							<Text style={styles.modalDone}>Done</Text>
						</TouchableOpacity>
					</View>

					<ScrollView style={styles.modalContent}>
						{/* Firearms Toggle */}
						<Card style={styles.modalSection}>
							<Toggle
								label="Transporting Firearms"
								value={editingProfile.has_firearms}
								onValueChange={(value) =>
									setEditingProfile({ ...editingProfile, has_firearms: value })
								}
							/>

							{editingProfile.has_firearms && (
								<>
									<Text style={styles.fieldLabel}>Firearm Types</Text>
									<View style={styles.chipGroup}>
										{FIREARM_TYPES.map((type) => (
											<Chip
												key={type.value}
												label={type.label}
												selected={editingProfile.firearm_types?.includes(type.value)}
												onPress={() => toggleFirearmType(type.value)}
												style={styles.chip}
											/>
										))}
									</View>

									<Toggle
										label="Assault Weapon Designation"
										value={editingProfile.has_assault_weapon || false}
										onValueChange={(value) =>
											setEditingProfile({ ...editingProfile, has_assault_weapon: value })
										}
									/>

									<Text style={styles.fieldLabel}>Magazine Capacity</Text>
									<TextInput
										style={styles.input}
										value={editingProfile.magazine_capacity?.toString() || ''}
										onChangeText={(text) => {
											const num = parseInt(text.replace(/[^0-9]/g, ''), 10);
											setEditingProfile({
												...editingProfile,
												magazine_capacity: isNaN(num) ? undefined : num,
											});
										}}
										placeholder="Enter max capacity"
										placeholderTextColor={colors.textMuted}
										keyboardType="number-pad"
										maxLength={3}
									/>

									<Toggle
										label="Concealed Carry Permit"
										value={editingProfile.has_concealed_carry_permit || false}
										onValueChange={(value) =>
											setEditingProfile({ ...editingProfile, has_concealed_carry_permit: value })
										}
									/>
								</>
							)}
						</Card>

						{/* Save as Preset Option */}
						{onCreateEquipment && editingProfile.has_firearms && (
							<Card style={styles.modalSection}>
								<Toggle
									label="Save as Equipment Preset"
									value={showSaveOption}
									onValueChange={setShowSaveOption}
								/>
								{showSaveOption && (
									<>
										<TextInput
											style={[styles.input, styles.nameInput]}
											value={saveName}
											onChangeText={setSaveName}
											placeholder="Preset name (e.g., 'Range Day Kit')"
											placeholderTextColor={colors.textMuted}
										/>
										<Button
											title="Save Preset"
											onPress={handleSaveAsPreset}
											variant="primary"
											style={styles.saveButton}
										/>
									</>
								)}
							</Card>
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
	sectionLabel: {
		fontSize: 13,
		fontWeight: '500',
		color: colors.textSecondary,
		marginTop: 12,
		marginBottom: 8,
	},
	optionCard: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		backgroundColor: colors.backgroundWhite,
		borderRadius: 12,
		padding: 14,
		marginBottom: 8,
		borderWidth: 2,
		borderColor: colors.border,
	},
	optionCardSelected: {
		borderColor: colors.primary,
		backgroundColor: colors.infoLight,
	},
	optionContent: {
		flexDirection: 'row',
		alignItems: 'center',
		flex: 1,
	},
	optionText: {
		marginLeft: 12,
		flex: 1,
	},
	optionTitle: {
		fontSize: 15,
		fontWeight: '500',
		color: colors.text,
	},
	optionDescription: {
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
	summaryCard: {
		padding: 12,
		marginTop: 8,
		backgroundColor: colors.warningLight,
	},
	summaryHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 8,
	},
	summaryTitle: {
		fontSize: 14,
		fontWeight: '600',
		color: colors.text,
		marginLeft: 8,
	},
	summaryText: {
		fontSize: 13,
		color: colors.textSecondary,
		lineHeight: 20,
	},
	// Modal Styles
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
	chipGroup: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		marginBottom: 8,
	},
	chip: {
		marginRight: 8,
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
	nameInput: {
		marginTop: 12,
	},
	saveButton: {
		marginTop: 12,
	},
});

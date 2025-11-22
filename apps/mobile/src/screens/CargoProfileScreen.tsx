import { useState } from 'react';
import {
	View,
	Text,
	StyleSheet,
	ScrollView,
	TextInput,
	Alert,
} from 'react-native';
import type { FirearmType } from '@reguroute/types';
import { useCargo } from '../contexts';
import { colors } from '../theme';
import { Card, Toggle, Chip, Button, LoadingSpinner } from '../components';

const FIREARM_TYPES: { value: FirearmType; label: string }[] = [
	{ value: 'handgun', label: 'Handgun' },
	{ value: 'rifle', label: 'Rifle' },
	{ value: 'shotgun', label: 'Shotgun' },
];

const US_STATES = [
	'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
	'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
	'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
	'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
	'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
];

export default function CargoProfileScreen() {
	const {
		cargoProfile,
		isLoading,
		updateCargoProfile,
		toggleFirearmType,
		togglePermitState,
		resetCargoProfile,
	} = useCargo();

	const [magazineInput, setMagazineInput] = useState(
		cargoProfile.magazine_capacity?.toString() || ''
	);

	if (isLoading) {
		return <LoadingSpinner fullScreen message="Loading profile..." />;
	}

	const handleMagazineChange = (text: string) => {
		// Only allow numbers
		const numericValue = text.replace(/[^0-9]/g, '');
		setMagazineInput(numericValue);

		const capacity = numericValue ? parseInt(numericValue, 10) : undefined;
		updateCargoProfile({ magazine_capacity: capacity });
	};

	const handleReset = () => {
		Alert.alert(
			'Reset Profile',
			'Are you sure you want to reset your cargo profile to defaults?',
			[
				{ text: 'Cancel', style: 'cancel' },
				{
					text: 'Reset',
					style: 'destructive',
					onPress: () => {
						resetCargoProfile();
						setMagazineInput('');
					},
				},
			]
		);
	};

	return (
		<ScrollView style={styles.container} contentContainerStyle={styles.content}>
			<Text style={styles.description}>
				Configure your cargo profile to get accurate compliance alerts for your routes.
			</Text>

			{/* Firearms Section */}
			<Card style={styles.section}>
				<Text style={styles.sectionTitle}>Firearms</Text>

				<Toggle
					label="Transporting Firearms"
					value={cargoProfile.has_firearms}
					onValueChange={(value) => updateCargoProfile({ has_firearms: value })}
				/>

				{cargoProfile.has_firearms && (
					<>
						<Text style={styles.fieldLabel}>Firearm Types</Text>
						<View style={styles.chipGroup}>
							{FIREARM_TYPES.map((type) => (
								<Chip
									key={type.value}
									label={type.label}
									selected={cargoProfile.firearm_types?.includes(type.value)}
									onPress={() => toggleFirearmType(type.value)}
									style={styles.chip}
								/>
							))}
						</View>

						<Toggle
							label="Assault Weapon Designation"
							value={cargoProfile.has_assault_weapon || false}
							onValueChange={(value) =>
								updateCargoProfile({ has_assault_weapon: value })
							}
							helperText="Some states have specific restrictions on assault weapons"
						/>

						<Text style={styles.fieldLabel}>Magazine Capacity</Text>
						<TextInput
							style={styles.input}
							value={magazineInput}
							onChangeText={handleMagazineChange}
							placeholder="Enter max capacity"
							placeholderTextColor={colors.textMuted}
							keyboardType="number-pad"
							maxLength={3}
						/>
						<Text style={styles.helperText}>
							Some states restrict magazines over 10, 15, or 20 rounds
						</Text>
					</>
				)}
			</Card>

			{/* Permits Section */}
			<Card style={styles.section}>
				<Text style={styles.sectionTitle}>Permits</Text>

				<Toggle
					label="Concealed Carry Permit"
					value={cargoProfile.has_concealed_carry_permit || false}
					onValueChange={(value) =>
						updateCargoProfile({ has_concealed_carry_permit: value })
					}
				/>

				{cargoProfile.has_concealed_carry_permit && (
					<>
						<Text style={styles.fieldLabel}>Permit State(s)</Text>
						<Text style={styles.helperText}>
							Select the state(s) where you hold valid permits
						</Text>
						<View style={styles.stateGrid}>
							{US_STATES.map((state) => (
								<Chip
									key={state}
									label={state}
									selected={cargoProfile.permit_states?.includes(state)}
									onPress={() => togglePermitState(state)}
									style={styles.stateChip}
								/>
							))}
						</View>
					</>
				)}
			</Card>

			{/* Reset Button */}
			<Button
				title="Reset to Defaults"
				onPress={handleReset}
				variant="outline"
				style={styles.resetButton}
			/>
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
	description: {
		fontSize: 14,
		color: colors.textSecondary,
		marginBottom: 20,
		lineHeight: 20,
	},
	section: {
		padding: 16,
		marginBottom: 16,
	},
	sectionTitle: {
		fontSize: 18,
		fontWeight: '600',
		color: colors.text,
		marginBottom: 16,
	},
	fieldLabel: {
		fontSize: 14,
		fontWeight: '500',
		color: colors.text,
		marginBottom: 8,
		marginTop: 8,
	},
	chipGroup: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		marginBottom: 16,
	},
	chip: {
		marginRight: 8,
		marginBottom: 8,
	},
	stateGrid: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		marginTop: 8,
	},
	stateChip: {
		marginRight: 6,
		marginBottom: 6,
		minWidth: 48,
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
	helperText: {
		fontSize: 12,
		color: colors.textMuted,
		marginTop: 4,
		marginBottom: 8,
	},
	resetButton: {
		marginTop: 8,
	},
});

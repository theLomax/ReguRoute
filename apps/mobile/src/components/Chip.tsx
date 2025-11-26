import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from 'react-native-paper';
import Text from './Text';

interface ChipProps {
	/** Chip label text */
	label: string;
	/** Whether the chip is selected */
	selected?: boolean;
	/** Called when chip is pressed */
	onPress?: () => void;
	/** Disable the chip */
	disabled?: boolean;
	/** Container style overrides */
	style?: ViewStyle;
}

export default function Chip({
	label,
	selected = false,
	onPress,
	disabled = false,
	style,
}: ChipProps) {
	const theme = useTheme();

	const styles = React.useMemo(() => StyleSheet.create({
		container: {
			paddingHorizontal: 16,
			paddingVertical: 8,
			borderRadius: 20,
			backgroundColor: theme.colors.background,
			borderWidth: 1,
			borderColor: theme.colors.outline,
		},
		selected: {
			backgroundColor: theme.colors.primary,
			borderColor: theme.colors.primary,
		},
		disabled: {
			opacity: 0.5,
		},
		label: {
			fontSize: 14,
			color: theme.colors.onSurface,
			fontWeight: '500',
		},
		labelSelected: {
			color: theme.colors.surface,
		},
	}), [theme]);

	return (
		<TouchableOpacity
			style={[
				styles.container,
				selected && styles.selected,
				disabled && styles.disabled,
				style,
			]}
			onPress={onPress}
			disabled={disabled}
			activeOpacity={0.7}
		>
			<Text style={[styles.label, selected && styles.labelSelected]}>
				{label}
			</Text>
		</TouchableOpacity>
	);
}

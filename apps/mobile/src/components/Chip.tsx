import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../theme';

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

const styles = StyleSheet.create({
	container: {
		paddingHorizontal: 16,
		paddingVertical: 8,
		borderRadius: 20,
		backgroundColor: colors.background,
		borderWidth: 1,
		borderColor: colors.border,
	},
	selected: {
		backgroundColor: colors.primary,
		borderColor: colors.primary,
	},
	disabled: {
		opacity: 0.5,
	},
	label: {
		fontSize: 14,
		color: colors.text,
		fontWeight: '500',
	},
	labelSelected: {
		color: colors.white,
	},
});

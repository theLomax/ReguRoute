import { View, Text, Switch, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../theme';

interface ToggleProps {
	/** Label text */
	label: string;
	/** Current value */
	value: boolean;
	/** Called when value changes */
	onValueChange: (value: boolean) => void;
	/** Disable the toggle */
	disabled?: boolean;
	/** Helper text below the toggle */
	helperText?: string;
	/** Container style overrides */
	style?: ViewStyle;
}

export default function Toggle({
	label,
	value,
	onValueChange,
	disabled = false,
	helperText,
	style,
}: ToggleProps) {
	return (
		<View style={[styles.container, style]}>
			<View style={styles.row}>
				<Text style={[styles.label, disabled && styles.labelDisabled]}>
					{label}
				</Text>
				<Switch
					value={value}
					onValueChange={onValueChange}
					disabled={disabled}
					trackColor={{ false: colors.border, true: colors.primaryLight }}
					thumbColor={value ? colors.primary : colors.backgroundWhite}
				/>
			</View>
			{helperText && <Text style={styles.helperText}>{helperText}</Text>}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		marginBottom: 16,
	},
	row: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	label: {
		fontSize: 16,
		color: colors.text,
		flex: 1,
		marginRight: 12,
	},
	labelDisabled: {
		color: colors.textMuted,
	},
	helperText: {
		fontSize: 12,
		color: colors.textMuted,
		marginTop: 4,
	},
});

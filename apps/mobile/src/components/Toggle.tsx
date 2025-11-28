import React from 'react';
import { View, Switch, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from 'react-native-paper';
import Text from './Text';

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
	/** Color for the switch track when turned on */
	trackColorOn?: string;
	/** Color for the switch track when turned off */
	trackColorOff?: string;
	/** Color for the switch thumb when turned on */
	thumbColorOn?: string;
}

export default function Toggle({
	label,
	value,
	onValueChange,
	disabled = false,
	helperText,
	style,
	trackColorOn,
	trackColorOff,
	thumbColorOn,
}: ToggleProps) {
	const theme = useTheme();

	const finalTrackColorOn = trackColorOn || `${theme.colors.primary}80`;
	const finalTrackColorOff = trackColorOff || theme.colors.outline;
	const finalThumbColorOn = thumbColorOn || theme.colors.primary;
	const styles = React.useMemo(() => StyleSheet.create({
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
			color: theme.colors.onSurface,
			flex: 1,
			marginRight: 12,
		},
		labelDisabled: {
			color: theme.colors.onSurfaceVariant,
		},
		helperText: {
			fontSize: 12,
			color: theme.colors.onSurfaceVariant,
			marginTop: 4,
		},
	}), [theme]);

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
					trackColor={{ false: finalTrackColorOff, true: finalTrackColorOn }}
					thumbColor={value ? finalThumbColorOn : theme.colors.surface}
				/>
			</View>
			{helperText && <Text style={styles.helperText}>{helperText}</Text>}
		</View>
	);
}

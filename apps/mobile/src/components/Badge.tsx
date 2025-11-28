import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from 'react-native-paper';
import Text from './Text';

type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'error';
type BadgeSize = 'small' | 'medium';

interface BadgeProps {
	/** Badge content - number or short text */
	value: number | string;
	/** Visual variant */
	variant?: BadgeVariant;
	/** Size variant */
	size?: BadgeSize;
	/** Max value for number badges (shows "99+" if exceeded) */
	max?: number;
	/** Container style overrides */
	style?: ViewStyle;
}

const sizeStyles: Record<BadgeSize, { minWidth: number; height: number; fontSize: number; padding: number }> = {
	small: { minWidth: 18, height: 18, fontSize: 10, padding: 4 },
	medium: { minWidth: 22, height: 22, fontSize: 12, padding: 6 },
};

export default function Badge({
	value,
	variant = 'default',
	size = 'medium',
	max = 99,
	style,
}: BadgeProps) {
	const theme = useTheme();
	const sizeStyle = sizeStyles[size];

	// Get custom semantic colors from theme
	const warningColor = (theme as any).customColors?.semantic?.warning || '#FB923C';

	const variantColors: Record<BadgeVariant, { bg: string; text: string }> = {
		default: { bg: theme.colors.onSurfaceVariant, text: theme.colors.surface },
		primary: { bg: theme.colors.primary, text: theme.colors.surface },
		success: { bg: theme.colors.tertiary, text: theme.colors.surface },
		warning: { bg: warningColor, text: theme.colors.surface },
		error: { bg: theme.colors.error, text: theme.colors.surface },
	};

	const colorStyle = variantColors[variant];

	let displayValue: string;
	if (typeof value === 'number') {
		displayValue = value > max ? `${max}+` : String(value);
	} else {
		displayValue = value;
	}

	return (
		<View
			style={[
				styles.container,
				{
					backgroundColor: colorStyle.bg,
					minWidth: sizeStyle.minWidth,
					height: sizeStyle.height,
					paddingHorizontal: sizeStyle.padding,
				},
				style,
			]}
		>
			<Text
				style={[
					styles.text,
					{
						color: colorStyle.text,
						fontSize: sizeStyle.fontSize,
					},
				]}
			>
				{displayValue}
			</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		borderRadius: 100,
		alignItems: 'center',
		justifyContent: 'center',
	},
	text: {
		fontWeight: '600',
	},
});

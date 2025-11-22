import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../theme';

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

const variantColors: Record<BadgeVariant, { bg: string; text: string }> = {
	default: { bg: colors.textMuted, text: colors.white },
	primary: { bg: colors.primary, text: colors.white },
	success: { bg: colors.success, text: colors.white },
	warning: { bg: colors.warning, text: colors.white },
	error: { bg: colors.error, text: colors.white },
};

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
	const colorStyle = variantColors[variant];
	const sizeStyle = sizeStyles[size];

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

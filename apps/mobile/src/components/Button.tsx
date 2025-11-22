import {
	TouchableOpacity,
	Text,
	ActivityIndicator,
	StyleSheet,
	ViewStyle,
	TextStyle,
} from 'react-native';
import { colors } from '../theme';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'outline';
type ButtonSize = 'small' | 'medium' | 'large';

interface ButtonProps {
	/** Button label text */
	title: string;
	/** Called when button is pressed */
	onPress: () => void;
	/** Visual variant */
	variant?: ButtonVariant;
	/** Size variant */
	size?: ButtonSize;
	/** Disable the button */
	disabled?: boolean;
	/** Show loading spinner instead of text */
	loading?: boolean;
	/** Full width button */
	fullWidth?: boolean;
	/** Additional container style */
	style?: ViewStyle;
}

const variantStyles: Record<ButtonVariant, { container: ViewStyle; text: TextStyle; spinnerColor: string }> = {
	primary: {
		container: { backgroundColor: colors.primary },
		text: { color: colors.white },
		spinnerColor: colors.white,
	},
	secondary: {
		container: { backgroundColor: colors.background },
		text: { color: colors.text },
		spinnerColor: colors.text,
	},
	danger: {
		container: { backgroundColor: colors.error },
		text: { color: colors.white },
		spinnerColor: colors.white,
	},
	outline: {
		container: {
			backgroundColor: colors.transparent,
			borderWidth: 1,
			borderColor: colors.primary,
		},
		text: { color: colors.primary },
		spinnerColor: colors.primary,
	},
};

const sizeStyles: Record<ButtonSize, { container: ViewStyle; text: TextStyle }> = {
	small: {
		container: { paddingVertical: 8, paddingHorizontal: 12 },
		text: { fontSize: 14 },
	},
	medium: {
		container: { paddingVertical: 12, paddingHorizontal: 16 },
		text: { fontSize: 16 },
	},
	large: {
		container: { paddingVertical: 16, paddingHorizontal: 20 },
		text: { fontSize: 18 },
	},
};

export default function Button({
	title,
	onPress,
	variant = 'primary',
	size = 'medium',
	disabled = false,
	loading = false,
	fullWidth = false,
	style,
}: ButtonProps) {
	const variantStyle = variantStyles[variant];
	const sizeStyle = sizeStyles[size];

	return (
		<TouchableOpacity
			style={[
				styles.container,
				variantStyle.container,
				sizeStyle.container,
				fullWidth && styles.fullWidth,
				(disabled || loading) && styles.disabled,
				style,
			]}
			onPress={onPress}
			disabled={disabled || loading}
			activeOpacity={0.7}
		>
			{loading ? (
				<ActivityIndicator color={variantStyle.spinnerColor} />
			) : (
				<Text style={[styles.text, variantStyle.text, sizeStyle.text]}>
					{title}
				</Text>
			)}
		</TouchableOpacity>
	);
}

const styles = StyleSheet.create({
	container: {
		borderRadius: 12,
		alignItems: 'center',
		justifyContent: 'center',
	},
	fullWidth: {
		width: '100%',
	},
	disabled: {
		opacity: 0.6,
	},
	text: {
		fontWeight: '600',
	},
});

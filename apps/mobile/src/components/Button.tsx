import { ViewStyle } from 'react-native';
import { Button as PaperButton } from 'react-native-paper';

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

/**
 * Button component using React Native Paper
 * Supports multiple variants, sizes, loading states, and theming
 */
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
	// Map our variants to Paper's modes
	const getPaperMode = (): 'contained' | 'outlined' | 'text' | 'elevated' | 'contained-tonal' => {
		switch (variant) {
			case 'primary':
			case 'danger':
				return 'contained';
			case 'outline':
				return 'outlined';
			case 'secondary':
				return 'contained-tonal';
		}
	};

	// Map size to Paper's compact prop and custom sizing
	const isCompact = size === 'small';
	const contentStyle = size === 'large' ? { paddingVertical: 4 } : undefined;

	return (
		<PaperButton
			mode={getPaperMode()}
			onPress={onPress}
			disabled={disabled}
			loading={loading}
			compact={isCompact}
			style={[fullWidth && { width: '100%' }, style]}
			contentStyle={contentStyle}
			buttonColor={variant === 'danger' ? '#B33024' : undefined}
			textColor={variant === 'danger' ? '#FFFFFF' : undefined}
		>
			{title}
		</PaperButton>
	);
}

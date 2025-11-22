import { useState } from 'react';
import {
	View,
	Text,
	TextInput,
	StyleSheet,
	TextInputProps,
	ViewStyle,
} from 'react-native';
import { colors } from '../theme';

interface InputProps extends Omit<TextInputProps, 'style'> {
	/** Label text above the input */
	label?: string;
	/** Error message to display */
	error?: string;
	/** Helper text below the input */
	helperText?: string;
	/** Container style overrides */
	containerStyle?: ViewStyle;
}

export default function Input({
	label,
	error,
	helperText,
	containerStyle,
	...textInputProps
}: InputProps) {
	const [isFocused, setIsFocused] = useState(false);

	const inputBorderColor = error
		? colors.error
		: isFocused
			? colors.primary
			: colors.border;

	return (
		<View style={[styles.container, containerStyle]}>
			{label && <Text style={styles.label}>{label}</Text>}
			<TextInput
				style={[
					styles.input,
					{ borderColor: inputBorderColor },
					error && styles.inputError,
				]}
				placeholderTextColor={colors.textMuted}
				onFocus={(e) => {
					setIsFocused(true);
					textInputProps.onFocus?.(e);
				}}
				onBlur={(e) => {
					setIsFocused(false);
					textInputProps.onBlur?.(e);
				}}
				{...textInputProps}
			/>
			{error && <Text style={styles.errorText}>{error}</Text>}
			{!error && helperText && <Text style={styles.helperText}>{helperText}</Text>}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		marginBottom: 16,
	},
	label: {
		fontSize: 14,
		fontWeight: '500',
		color: colors.text,
		marginBottom: 6,
	},
	input: {
		backgroundColor: colors.backgroundWhite,
		borderRadius: 12,
		paddingHorizontal: 16,
		paddingVertical: 14,
		fontSize: 16,
		borderWidth: 1,
		color: colors.text,
	},
	inputError: {
		borderColor: colors.error,
	},
	errorText: {
		fontSize: 12,
		color: colors.error,
		marginTop: 4,
	},
	helperText: {
		fontSize: 12,
		color: colors.textMuted,
		marginTop: 4,
	},
});

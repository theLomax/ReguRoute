import { ViewStyle } from 'react-native';
import { TextInput, HelperText, TextInputProps as PaperTextInputProps } from 'react-native-paper';
import { View } from 'react-native';

interface InputProps extends Omit<PaperTextInputProps, 'theme' | 'mode' | 'error'> {
	/** Label text above the input */
	label?: string;
	/** Error message to display */
	error?: string;
	/** Helper text below the input */
	helperText?: string;
	/** Container style overrides */
	containerStyle?: ViewStyle;
}

/**
 * Input component using React Native Paper
 * Supports labels, error states, helper text, and theming
 */
export default function Input({
	label,
	error,
	helperText,
	containerStyle,
	...textInputProps
}: InputProps) {
	return (
		<View style={[{ marginBottom: 16 }, containerStyle]}>
			<TextInput
				mode="outlined"
				label={label}
				error={!!error}
				{...textInputProps}
			/>
			{error && (
				<HelperText type="error" visible={!!error}>
					{error}
				</HelperText>
			)}
			{!error && helperText && (
				<HelperText type="info" visible={true}>
					{helperText}
				</HelperText>
			)}
		</View>
	);
}

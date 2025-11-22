import { View, ActivityIndicator, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../theme';

type SpinnerSize = 'small' | 'large';

interface LoadingSpinnerProps {
	/** Size of the spinner */
	size?: SpinnerSize;
	/** Spinner color */
	color?: string;
	/** Optional message below spinner */
	message?: string;
	/** Fill available space and center */
	fullScreen?: boolean;
	/** Container style overrides */
	style?: ViewStyle;
}

export default function LoadingSpinner({
	size = 'large',
	color = colors.primary,
	message,
	fullScreen = false,
	style,
}: LoadingSpinnerProps) {
	return (
		<View style={[styles.container, fullScreen && styles.fullScreen, style]}>
			<ActivityIndicator size={size} color={color} />
			{message && <Text style={styles.message}>{message}</Text>}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		alignItems: 'center',
		justifyContent: 'center',
		padding: 16,
	},
	fullScreen: {
		flex: 1,
		backgroundColor: colors.background,
	},
	message: {
		marginTop: 12,
		fontSize: 14,
		color: colors.textSecondary,
	},
});

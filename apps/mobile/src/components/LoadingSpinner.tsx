import React from 'react';
import { View, ActivityIndicator, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from 'react-native-paper';
import Text from './Text';

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
	color,
	message,
	fullScreen = false,
	style,
}: LoadingSpinnerProps) {
	const theme = useTheme();
	const spinnerColor = color || theme.colors.primary;

	const styles = React.useMemo(() => StyleSheet.create({
		container: {
			alignItems: 'center',
			justifyContent: 'center',
			padding: 16,
		},
		fullScreen: {
			flex: 1,
			backgroundColor: theme.colors.background,
		},
		message: {
			marginTop: 12,
			fontSize: 14,
			color: theme.colors.onSurfaceVariant,
		},
	}), [theme]);

	return (
		<View style={[styles.container, fullScreen && styles.fullScreen, style]}>
			<ActivityIndicator size={size} color={spinnerColor} />
			{message && <Text style={styles.message}>{message}</Text>}
		</View>
	);
}

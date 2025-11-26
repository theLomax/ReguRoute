import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from 'react-native-paper';
import { Text } from '../components';

export default function RouteDetailScreen() {
	const theme = useTheme();

	const styles = React.useMemo(() => StyleSheet.create({
		container: {
			flex: 1,
			backgroundColor: theme.colors.background,
			alignItems: 'center',
			justifyContent: 'center',
		},
		title: {
			fontSize: 24,
			fontWeight: 'bold',
			color: theme.colors.onSurface,
		},
	}), [theme]);

	return (
		<View style={styles.container}>
			<Text style={styles.title}>Route Details</Text>
		</View>
	);
}

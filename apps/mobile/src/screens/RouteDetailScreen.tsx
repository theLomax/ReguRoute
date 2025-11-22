import { View, Text, StyleSheet } from 'react-native';

export default function RouteDetailScreen() {
	return (
		<View style={styles.container}>
			<Text style={styles.title}>Route Details</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#fff',
		alignItems: 'center',
		justifyContent: 'center',
	},
	title: {
		fontSize: 24,
		fontWeight: 'bold',
	},
});

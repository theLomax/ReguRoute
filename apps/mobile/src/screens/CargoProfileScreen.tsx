import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme';

export default function CargoProfileScreen() {
	return (
		<View style={styles.container}>
			<Text style={styles.title}>Cargo Profile</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: colors.background,
		alignItems: 'center',
		justifyContent: 'center',
	},
	title: {
		fontSize: 24,
		fontWeight: 'bold',
		color: colors.text,
	},
});

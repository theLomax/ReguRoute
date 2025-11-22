import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useAuth } from '../contexts';

export default function AccountScreen() {
	const { user, logout } = useAuth();

	const handleLogout = () => {
		Alert.alert('Logout', 'Are you sure you want to sign out?', [
			{ text: 'Cancel', style: 'cancel' },
			{ text: 'Sign Out', style: 'destructive', onPress: logout },
		]);
	};

	const getInitials = (email: string) => {
		return email.substring(0, 2).toUpperCase();
	};

	return (
		<View style={styles.container}>
			<View style={styles.avatarContainer}>
				<View style={styles.avatar}>
					<Text style={styles.avatarText}>
						{user?.email ? getInitials(user.email) : '??'}
					</Text>
				</View>
				<Text style={styles.email}>{user?.email}</Text>
			</View>

			<View style={styles.section}>
				<TouchableOpacity style={styles.menuItem}>
					<Text style={styles.menuText}>Legal Disclaimer</Text>
				</TouchableOpacity>
				<TouchableOpacity style={styles.menuItem}>
					<Text style={styles.menuText}>Privacy Policy</Text>
				</TouchableOpacity>
				<TouchableOpacity style={styles.menuItem}>
					<Text style={styles.menuText}>Terms of Service</Text>
				</TouchableOpacity>
			</View>

			<TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
				<Text style={styles.logoutText}>Sign Out</Text>
			</TouchableOpacity>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#f5f5f5',
		padding: 24,
	},
	avatarContainer: {
		alignItems: 'center',
		marginBottom: 32,
		marginTop: 24,
	},
	avatar: {
		width: 80,
		height: 80,
		borderRadius: 40,
		backgroundColor: '#2563eb',
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: 12,
	},
	avatarText: {
		color: '#fff',
		fontSize: 28,
		fontWeight: 'bold',
	},
	email: {
		fontSize: 16,
		color: '#666',
	},
	section: {
		backgroundColor: '#fff',
		borderRadius: 12,
		marginBottom: 24,
		overflow: 'hidden',
	},
	menuItem: {
		paddingVertical: 16,
		paddingHorizontal: 16,
		borderBottomWidth: 1,
		borderBottomColor: '#eee',
	},
	menuText: {
		fontSize: 16,
		color: '#1a1a1a',
	},
	logoutButton: {
		backgroundColor: '#fff',
		borderRadius: 12,
		paddingVertical: 16,
		alignItems: 'center',
		borderWidth: 1,
		borderColor: '#dc2626',
	},
	logoutText: {
		color: '#dc2626',
		fontSize: 16,
		fontWeight: '600',
	},
});

import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useAuth } from '../contexts';
import { colors } from '../theme';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import type { MainStackParamList } from '../navigation/MainStack';


type AccountScreenNavigationProp = NavigationProp<MainStackParamList>;

export default function AccountScreen() {
	const { user, logout } = useAuth();
	const navigation = useNavigation<AccountScreenNavigationProp>();

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
				<TouchableOpacity
					style={styles.menuItem}
					onPress={() => navigation.navigate('Preferences')}
				>
					<Text style={styles.menuText}>Preferences</Text>
				</TouchableOpacity>
				<TouchableOpacity
					style={styles.menuItem}
					onPress={() => navigation.navigate('LegalDisclaimer')}
				>
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
		backgroundColor: colors.background,
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
		backgroundColor: colors.primary,
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: 12,
	},
	avatarText: {
		color: colors.white,
		fontSize: 28,
		fontWeight: 'bold',
	},
	email: {
		fontSize: 16,
		color: colors.textSecondary,
	},
	section: {
		backgroundColor: colors.backgroundWhite,
		borderRadius: 12,
		marginBottom: 24,
		overflow: 'hidden',
	},
	menuItem: {
		paddingVertical: 16,
		paddingHorizontal: 16,
		borderBottomWidth: 1,
		borderBottomColor: colors.borderLight,
	},
	menuText: {
		fontSize: 16,
		color: colors.text,
	},
	logoutButton: {
		backgroundColor: colors.backgroundWhite,
		borderRadius: 12,
		paddingVertical: 16,
		alignItems: 'center',
		borderWidth: 1,
		borderColor: colors.error,
	},
	logoutText: {
		color: colors.error,
		fontSize: 16,
		fontWeight: '600',
	},
});

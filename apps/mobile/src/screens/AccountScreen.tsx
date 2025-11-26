import React from 'react';
import { View, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useTheme } from 'react-native-paper';
import { Text } from '../components';
import { useAuth } from '../contexts';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import type { MainStackParamList } from '../navigation/MainStack';


type AccountScreenNavigationProp = NavigationProp<MainStackParamList>;

export default function AccountScreen() {
	const theme = useTheme();
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

	const styles = React.useMemo(() => StyleSheet.create({
		container: {
			flex: 1,
			backgroundColor: theme.colors.background,
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
			backgroundColor: theme.colors.primary,
			alignItems: 'center',
			justifyContent: 'center',
			marginBottom: 12,
		},
		avatarText: {
			color: theme.colors.surface,
			fontSize: 28,
			fontWeight: 'bold',
		},
		email: {
			fontSize: 16,
			color: theme.colors.onSurfaceVariant,
		},
		section: {
			backgroundColor: theme.colors.surface,
			borderRadius: 12,
			marginBottom: 24,
			overflow: 'hidden',
		},
		menuItem: {
			paddingVertical: 16,
			paddingHorizontal: 16,
			borderBottomWidth: 1,
			borderBottomColor: theme.colors.outlineVariant,
		},
		menuText: {
			fontSize: 16,
			color: theme.colors.onSurface,
		},
		logoutButton: {
			backgroundColor: theme.colors.surface,
			borderRadius: 12,
			paddingVertical: 16,
			alignItems: 'center',
			borderWidth: 1,
			borderColor: theme.colors.error,
		},
		logoutText: {
			color: theme.colors.error,
			fontSize: 16,
			fontWeight: '600',
		},
	}), [theme]);

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

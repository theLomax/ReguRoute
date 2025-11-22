import { NavigationContainer } from '@react-navigation/native';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '../contexts';
import { colors } from '../theme';
import AuthStack from './AuthStack';
import MainStack from './MainStack';

export type { AuthStackParamList } from './AuthStack';
export type { MainStackParamList } from './MainStack';
export type { MainTabsParamList } from './MainTabs';

export default function RootNavigator() {
	const { isAuthenticated, isLoading } = useAuth();

	if (isLoading) {
		return (
			<View style={styles.loading}>
				<ActivityIndicator size="large" color={colors.primary} />
			</View>
		);
	}

	return (
		<NavigationContainer>
			{isAuthenticated ? <MainStack /> : <AuthStack />}
		</NavigationContainer>
	);
}

const styles = StyleSheet.create({
	loading: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: colors.background,
	},
});

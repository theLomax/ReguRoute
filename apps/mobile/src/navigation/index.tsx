import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useTheme } from 'react-native-paper';
import { useAuth } from '../contexts';
import AuthStack from './AuthStack';
import MainStack from './MainStack';

export type { AuthStackParamList } from './AuthStack';
export type { MainStackParamList } from './MainStack';
export type { MainTabsParamList } from './MainTabs';

export default function RootNavigator() {
	const theme = useTheme();
	const { isAuthenticated, isLoading } = useAuth();

	const styles = React.useMemo(() => StyleSheet.create({
		loading: {
			flex: 1,
			justifyContent: 'center',
			alignItems: 'center',
			backgroundColor: theme.colors.background,
		},
	}), [theme]);

	if (isLoading) {
		return (
			<View style={styles.loading}>
				<ActivityIndicator size="large" color={theme.colors.primary} />
			</View>
		);
	}

	return (
		<NavigationContainer>
			{isAuthenticated ? <MainStack /> : <AuthStack />}
		</NavigationContainer>
	);
}

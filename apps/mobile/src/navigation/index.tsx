import { NavigationContainer } from '@react-navigation/native';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '../contexts';
import AuthStack from './AuthStack';
import MainStack from './MainStack';

export type { AuthStackParamList } from './AuthStack';
export type { MainStackParamList } from './MainStack';

export default function RootNavigator() {
	const { isAuthenticated, isLoading } = useAuth();

	if (isLoading) {
		return (
			<View style={styles.loading}>
				<ActivityIndicator size="large" color="#2563eb" />
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
		backgroundColor: '#f5f5f5',
	},
});

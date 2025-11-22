import { NavigationContainer } from '@react-navigation/native';
import { useState } from 'react';
import AuthStack from './AuthStack';
import MainStack from './MainStack';

export type { AuthStackParamList } from './AuthStack';
export type { MainStackParamList } from './MainStack';

export default function RootNavigator() {
	// TODO: Replace with actual auth state from context/store
	const [isAuthenticated] = useState(false);

	return (
		<NavigationContainer>
			{isAuthenticated ? <MainStack /> : <AuthStack />}
		</NavigationContainer>
	);
}

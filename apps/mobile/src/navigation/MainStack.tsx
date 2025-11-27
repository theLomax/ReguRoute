import { createStackNavigator } from '@react-navigation/stack';
import { useTheme } from 'react-native-paper';
import { RouteDetailScreen, LegalDisclaimerScreen, PreferencesScreen } from '../screens';
import MainTabs from './MainTabs';

export type MainStackParamList = {
	MainTabs: undefined;
	RouteDetail: { routeId: string };
	LegalDisclaimer: undefined;
	Preferences: undefined;
};

const Stack = createStackNavigator<MainStackParamList>();

export default function MainStack() {
	const theme = useTheme();

	return (
		<Stack.Navigator
			screenOptions={{
				headerStyle: {
					backgroundColor: theme.colors.surface,
					elevation: 1,
					shadowOpacity: 0.1,
				},
				headerTitleStyle: {
					fontWeight: '600',
					fontSize: 18,
					color: theme.colors.onSurface,
				},
				headerTintColor: theme.colors.primary,
				headerBackTitleVisible: false,
			}}
		>
			<Stack.Screen
				name="MainTabs"
				component={MainTabs}
				options={{ headerShown: false }}
			/>
			<Stack.Screen
				name="RouteDetail"
				component={RouteDetailScreen}
				options={{ title: 'Route Details' }}
			/>
			<Stack.Screen
				name="LegalDisclaimer"
				component={LegalDisclaimerScreen}
				options={{ title: 'Legal Disclaimer' }}
			/>
			<Stack.Screen
				name="Preferences"
				component={PreferencesScreen}
				options={{ title: 'Preferences' }}
			/>
		</Stack.Navigator>
	);
}
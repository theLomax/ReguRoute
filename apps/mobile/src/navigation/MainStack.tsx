import { createStackNavigator } from '@react-navigation/stack';
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
	return (
		<Stack.Navigator>
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
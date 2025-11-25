import { createStackNavigator } from '@react-navigation/stack';
import { RouteDetailScreen, LegalDisclaimerScreen } from '../screens';
import MainTabs from './MainTabs';

export type MainStackParamList = {
	MainTabs: undefined;
	RouteDetail: { routeId: string };
	LegalDisclaimer: undefined; // ADD THIS LINE
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
			{/* ADD THIS SCREEN: */}
			<Stack.Screen
				name="LegalDisclaimer"
				component={LegalDisclaimerScreen}
				options={{ title: 'Legal Disclaimer' }}
			/>
		</Stack.Navigator>
	);
}
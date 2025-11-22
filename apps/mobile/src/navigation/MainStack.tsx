import { createStackNavigator } from '@react-navigation/stack';
import { RouteDetailScreen } from '../screens';
import MainTabs from './MainTabs';

export type MainStackParamList = {
	MainTabs: undefined;
	RouteDetail: { routeId: string };
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
		</Stack.Navigator>
	);
}

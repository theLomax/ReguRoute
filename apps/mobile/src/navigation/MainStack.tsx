import { createStackNavigator } from '@react-navigation/stack';
import {
	HomeScreen,
	RoutePlanScreen,
	RouteDetailScreen,
	CargoProfileScreen,
} from '../screens';

export type MainStackParamList = {
	Home: undefined;
	RoutePlan: undefined;
	RouteDetail: { routeId: string };
	CargoProfile: undefined;
};

const Stack = createStackNavigator<MainStackParamList>();

export default function MainStack() {
	return (
		<Stack.Navigator>
			<Stack.Screen name="Home" component={HomeScreen} options={{ title: 'My Routes' }} />
			<Stack.Screen name="RoutePlan" component={RoutePlanScreen} options={{ title: 'Plan Route' }} />
			<Stack.Screen name="RouteDetail" component={RouteDetailScreen} options={{ title: 'Route Details' }} />
			<Stack.Screen name="CargoProfile" component={CargoProfileScreen} options={{ title: 'Cargo Profile' }} />
		</Stack.Navigator>
	);
}

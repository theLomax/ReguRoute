import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import {
	HomeScreen,
	RoutePlanScreen,
	CargoProfileScreen,
	AccountScreen,
} from '../screens';
import { colors } from '../theme';

export type MainTabsParamList = {
	Home: undefined;
	PlanRoute: undefined;
	Cargo: undefined;
	Account: undefined;
};

const Tab = createBottomTabNavigator<MainTabsParamList>();

type TabIconName = 'home' | 'home-outline' | 'map' | 'map-outline' | 'cube' | 'cube-outline' | 'person' | 'person-outline';

const getTabIcon = (routeName: string, focused: boolean): TabIconName => {
	switch (routeName) {
		case 'Home':
			return focused ? 'home' : 'home-outline';
		case 'PlanRoute':
			return focused ? 'map' : 'map-outline';
		case 'Cargo':
			return focused ? 'cube' : 'cube-outline';
		case 'Account':
			return focused ? 'person' : 'person-outline';
		default:
			return 'home-outline';
	}
};

export default function MainTabs() {
	return (
		<Tab.Navigator
			screenOptions={({ route }) => ({
				tabBarIcon: ({ focused, color, size }) => {
					const iconName = getTabIcon(route.name, focused);
					return <Ionicons name={iconName} size={size} color={color} />;
				},
				tabBarActiveTintColor: colors.primary,
				tabBarInactiveTintColor: colors.textMuted,
				tabBarStyle: {
					paddingBottom: 18,
					paddingTop: 6,
					height: 70,
				},
				tabBarLabelStyle: {
					fontSize: 12,
					fontWeight: '500',
				},
				headerStyle: {
					backgroundColor: colors.backgroundWhite,
					elevation: 1,
					shadowOpacity: 0.1,
				},
				headerTitleStyle: {
					fontWeight: '600',
					fontSize: 18,
				},
			})}
		>
			<Tab.Screen
				name="Home"
				component={HomeScreen}
				options={{ title: 'My Routes' }}
			/>
			<Tab.Screen
				name="PlanRoute"
				component={RoutePlanScreen}
				options={{ title: 'Plan Route' }}
			/>
			<Tab.Screen
				name="Cargo"
				component={CargoProfileScreen}
				options={{ title: 'Gear' }}
			/>
			<Tab.Screen
				name="Account"
				component={AccountScreen}
				options={{ title: 'Account' }}
			/>
		</Tab.Navigator>
	);
}

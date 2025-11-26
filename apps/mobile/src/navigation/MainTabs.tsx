import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from 'react-native-paper';
import {
	HomeScreen,
	RoutePlanScreen,
	CargoProfileScreen,
	AccountScreen,
} from '../screens';

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
	const theme = useTheme();

	return (
		<Tab.Navigator
			screenOptions={({ route }) => ({
				tabBarIcon: ({ focused, color, size }) => {
					const iconName = getTabIcon(route.name, focused);
					return <Ionicons name={iconName} size={size} color={color} />;
				},
				tabBarActiveTintColor: theme.colors.primary,
				tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
				tabBarStyle: {
					paddingBottom: 18,
					paddingTop: 6,
					height: 70,
					backgroundColor: theme.colors.surface,
				},
				tabBarLabelStyle: {
					fontSize: 12,
					fontWeight: '500',
				},
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
			})}
		>
			<Tab.Screen
				name="Home"
				component={HomeScreen}
				options={{ title: 'My Routes' }}
			/>
			<Tab.Screen
				name="Cargo"
				component={CargoProfileScreen}
				options={{ title: 'Loadout' }}
			/>
			<Tab.Screen
				name="PlanRoute"
				component={RoutePlanScreen}
				options={{ title: 'Plan Route' }}
			/>
			<Tab.Screen
				name="Account"
				component={AccountScreen}
				options={{ title: 'Account' }}
			/>
		</Tab.Navigator>
	);
}

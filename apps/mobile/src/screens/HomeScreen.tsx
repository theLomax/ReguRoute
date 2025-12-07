import React, { useEffect, useCallback } from 'react';
import {
	View,
	StyleSheet,
	FlatList,
	RefreshControl,
	TouchableOpacity,
} from 'react-native';
import { useNavigation, CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useTheme } from 'react-native-paper';
import type { Route } from '@reguroute/types';
import type { MainTabsParamList, MainStackParamList } from '../navigation';
import { useRoutes } from '../contexts';
import { Card, Badge, EmptyState, LoadingSpinner, Text, Icon } from '../components';

type HomeNavigationProp = CompositeNavigationProp<
	BottomTabNavigationProp<MainTabsParamList, 'Home'>,
	StackNavigationProp<MainStackParamList>
>;

function RouteCard({ route, onPress }: { route: Route; onPress: () => void }) {
	const theme = useTheme();
	const criticalCount = route.regulation_alerts?.filter(
		(a) => a.severity === 'critical'
	).length ?? 0;
	const warningCount = route.regulation_alerts?.filter(
		(a) => a.severity === 'warning'
	).length ?? 0;

	const formatDate = (dateStr: string) => {
		const date = new Date(dateStr);
		return date.toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
		});
	};

	const styles = React.useMemo(() => StyleSheet.create({
		routeCard: {
			padding: 16,
		},
		routeHeader: {
			flexDirection: 'row',
			justifyContent: 'space-between',
			alignItems: 'center',
			marginBottom: 8,
		},
		routeName: {
			fontSize: 16,
			fontWeight: '600',
			color: theme.colors.onSurface,
			flex: 1,
			marginRight: 8,
		},
		badges: {
			flexDirection: 'row',
		},
		badgeSpacing: {
			marginLeft: 4,
		},
		routeDetails: {
			flexDirection: 'row',
			alignItems: 'center',
			gap: 4,
			marginBottom: 8,
		},
		routeText: {
			fontSize: 13,
			color: theme.colors.onSurfaceVariant,
			flex: 1,
		},
		routeDate: {
			fontSize: 12,
			color: theme.colors.onSurfaceVariant,
		},
	}), [theme]);

	return (
		<Card onPress={onPress} style={styles.routeCard}>
			<View style={styles.routeHeader}>
				<Text style={styles.routeName} numberOfLines={1}>
					{route.name}
				</Text>
				<View style={styles.badges}>
					{criticalCount > 0 && (
						<Badge value={criticalCount} variant="error" size="small" />
					)}
					{warningCount > 0 && (
						<Badge
							value={warningCount}
							variant="warning"
							size="small"
							style={styles.badgeSpacing}
						/>
					)}
				</View>
			</View>
			<View style={styles.routeDetails}>
				<Icon name="location" size={14} color={theme.colors.onSurfaceVariant} />
				<Text style={styles.routeText} numberOfLines={1}>
					{route.origin_name}
				</Text>
				<Icon name="arrow-forward" size={12} color={theme.colors.onSurfaceVariant} />
				<Text style={styles.routeText} numberOfLines={1}>
					{route.destination_name}
				</Text>
			</View>
			<Text style={styles.routeDate}>
				Updated {formatDate(route.updated_at)}
			</Text>
		</Card>
	);
}

export default function HomeScreen() {
	const theme = useTheme();
	const navigation = useNavigation<HomeNavigationProp>();
	const { routes, isLoading, fetchRoutes } = useRoutes();

	useEffect(() => {
		fetchRoutes();
	}, [fetchRoutes]);

	const handleRefresh = useCallback(() => {
		fetchRoutes();
	}, [fetchRoutes]);

	const handlePlanRoute = useCallback(() => {
		navigation.navigate('PlanRoute');
	}, [navigation]);

	const handleRoutePress = useCallback((route: Route) => {
		navigation.navigate('RouteDetail', { routeId: route.id });
	}, [navigation]);

	const styles = React.useMemo(() => StyleSheet.create({
		container: {
			flex: 1,
			backgroundColor: theme.colors.background,
		},
		listContent: {
			padding: 16,
			paddingBottom: 80,
		},
		separator: {
			height: 12,
		},
		fab: {
			position: 'absolute',
			right: 20,
			bottom: 20,
			width: 56,
			height: 56,
			borderRadius: 28,
			backgroundColor: theme.colors.primary,
			alignItems: 'center',
			justifyContent: 'center',
			shadowColor: '#000000',
			shadowOffset: { width: 0, height: 2 },
			shadowOpacity: 0.25,
			shadowRadius: 4,
			elevation: 5,
		},
	}), [theme]);

	if (isLoading && routes.length === 0) {
		return <LoadingSpinner fullScreen message="Loading routes..." />;
	}

	if (routes.length === 0) {
		return (
			<View style={styles.container}>
				<EmptyState
					icon="map-outline"
					title="No Routes Yet"
					description="Plan your first compliant travel route to get started."
					actionLabel="Plan a Route"
					onAction={handlePlanRoute}
				/>
			</View>
		);
	}

	return (
		<View style={styles.container}>
			<FlatList
				data={routes}
				keyExtractor={(item) => item.id}
				renderItem={({ item }) => (
					<RouteCard route={item} onPress={() => handleRoutePress(item)} />
				)}
				contentContainerStyle={styles.listContent}
				refreshControl={
					<RefreshControl
						refreshing={isLoading}
						onRefresh={handleRefresh}
						colors={[theme.colors.primary]}
						tintColor={theme.colors.primary}
					/>
				}
				ItemSeparatorComponent={() => <View style={styles.separator} />}
			/>
			<TouchableOpacity style={styles.fab} onPress={handlePlanRoute}>
				<Icon name="add" size={28} color={theme.colors.surface} />
			</TouchableOpacity>
		</View>
	);
}

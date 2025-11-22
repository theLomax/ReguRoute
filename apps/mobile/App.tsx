import 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider, CargoProvider, RoutesProvider } from './src/contexts';
import RootNavigator from './src/navigation';

export default function App() {
	return (
		<GestureHandlerRootView style={{ flex: 1 }}>
			<SafeAreaProvider>
				<AuthProvider>
					<CargoProvider>
						<RoutesProvider>
							<RootNavigator />
							<StatusBar style="auto" />
						</RoutesProvider>
					</CargoProvider>
				</AuthProvider>
			</SafeAreaProvider>
		</GestureHandlerRootView>
	);
}

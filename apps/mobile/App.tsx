import 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PaperProvider } from 'react-native-paper';
import { AuthProvider, CargoProvider, RoutesProvider, PreferencesProvider, usePreferences } from './src/contexts';
import { lightTheme, darkTheme, highContrastLightTheme, highContrastDarkTheme } from './src/theme/paperTheme';
import RootNavigator from './src/navigation';

/**
 * Theme-aware app content
 * Needs to be inside PreferencesProvider to access theme preference
 */
function AppContent() {
	const { effectiveTheme } = usePreferences();

	const theme =
		effectiveTheme === 'dark' ? darkTheme :
		effectiveTheme === 'high-contrast-light' ? highContrastLightTheme :
		effectiveTheme === 'high-contrast-dark' ? highContrastDarkTheme :
		lightTheme;

	return (
		<PaperProvider theme={theme}>
			<AuthProvider>
				<CargoProvider>
					<RoutesProvider>
						<RootNavigator />
						<StatusBar style={effectiveTheme === 'dark' || effectiveTheme === 'high-contrast-dark' ? 'light' : 'dark'} />
					</RoutesProvider>
				</CargoProvider>
			</AuthProvider>
		</PaperProvider>
	);
}

export default function App() {
	return (
		<GestureHandlerRootView style={{ flex: 1 }}>
			<SafeAreaProvider>
				<PreferencesProvider>
					<AppContent />
				</PreferencesProvider>
			</SafeAreaProvider>
		</GestureHandlerRootView>
	);
}

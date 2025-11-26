import 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PaperProvider, configureFonts } from 'react-native-paper';
import { AuthProvider, CargoProvider, RoutesProvider, PreferencesProvider, usePreferences } from './src/contexts';
import { lightTheme, darkTheme, highContrastLightTheme, highContrastDarkTheme } from './src/theme/paperTheme';
import RootNavigator from './src/navigation';
import React from 'react';
import type { MD3Theme } from 'react-native-paper';

/**
 * Apply font scale to a theme
 * Multiplies all font sizes by the scale factor
 */
function applyFontScale(theme: MD3Theme, scale: number): MD3Theme {
	const scaledFontConfig = {
		displayLarge: {
			...theme.fonts.displayLarge,
			fontSize: Math.round(57 * scale),
			lineHeight: Math.round(64 * scale),
		},
		displayMedium: {
			...theme.fonts.displayMedium,
			fontSize: Math.round(45 * scale),
			lineHeight: Math.round(52 * scale),
		},
		displaySmall: {
			...theme.fonts.displaySmall,
			fontSize: Math.round(36 * scale),
			lineHeight: Math.round(44 * scale),
		},
		headlineLarge: {
			...theme.fonts.headlineLarge,
			fontSize: Math.round(32 * scale),
			lineHeight: Math.round(40 * scale),
		},
		headlineMedium: {
			...theme.fonts.headlineMedium,
			fontSize: Math.round(28 * scale),
			lineHeight: Math.round(36 * scale),
		},
		headlineSmall: {
			...theme.fonts.headlineSmall,
			fontSize: Math.round(24 * scale),
			lineHeight: Math.round(32 * scale),
		},
		titleLarge: {
			...theme.fonts.titleLarge,
			fontSize: Math.round(22 * scale),
			lineHeight: Math.round(28 * scale),
		},
		titleMedium: {
			...theme.fonts.titleMedium,
			fontSize: Math.round(16 * scale),
			lineHeight: Math.round(24 * scale),
		},
		titleSmall: {
			...theme.fonts.titleSmall,
			fontSize: Math.round(14 * scale),
			lineHeight: Math.round(20 * scale),
		},
		bodyLarge: {
			...theme.fonts.bodyLarge,
			fontSize: Math.round(16 * scale),
			lineHeight: Math.round(24 * scale),
		},
		bodyMedium: {
			...theme.fonts.bodyMedium,
			fontSize: Math.round(14 * scale),
			lineHeight: Math.round(20 * scale),
		},
		bodySmall: {
			...theme.fonts.bodySmall,
			fontSize: Math.round(12 * scale),
			lineHeight: Math.round(16 * scale),
		},
		labelLarge: {
			...theme.fonts.labelLarge,
			fontSize: Math.round(14 * scale),
			lineHeight: Math.round(20 * scale),
		},
		labelMedium: {
			...theme.fonts.labelMedium,
			fontSize: Math.round(12 * scale),
			lineHeight: Math.round(16 * scale),
		},
		labelSmall: {
			...theme.fonts.labelSmall,
			fontSize: Math.round(11 * scale),
			lineHeight: Math.round(16 * scale),
		},
	};

	return {
		...theme,
		fonts: configureFonts({ config: scaledFontConfig }),
	};
}

/**
 * Theme-aware app content
 * Needs to be inside PreferencesProvider to access theme preference
 */
function AppContent() {
	const { effectiveTheme, fontScale } = usePreferences();

	// Select base theme and apply font scaling
	const theme = React.useMemo(() => {
		const baseTheme =
			effectiveTheme === 'dark' ? darkTheme :
			effectiveTheme === 'high-contrast-light' ? highContrastLightTheme :
			effectiveTheme === 'high-contrast-dark' ? highContrastDarkTheme :
			lightTheme;

		return applyFontScale(baseTheme, fontScale);
	}, [effectiveTheme, fontScale]);

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

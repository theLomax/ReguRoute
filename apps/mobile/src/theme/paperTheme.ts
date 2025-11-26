import { MD3LightTheme, MD3DarkTheme, configureFonts } from 'react-native-paper';
import type { MD3Theme } from 'react-native-paper';

/**
 * Material Design 3 Theme Configuration
 * Colors from Material Theme Builder for optimal consistency
 */

// Font configuration for consistency across the app
const fontConfig = {
	displayLarge: {
		fontFamily: 'System',
		fontSize: 57,
		fontWeight: '400' as const,
		letterSpacing: 0,
		lineHeight: 64,
	},
	displayMedium: {
		fontFamily: 'System',
		fontSize: 45,
		fontWeight: '400' as const,
		letterSpacing: 0,
		lineHeight: 52,
	},
	displaySmall: {
		fontFamily: 'System',
		fontSize: 36,
		fontWeight: '400' as const,
		letterSpacing: 0,
		lineHeight: 44,
	},
};

/**
 * Status colors for go/warn/noGo indicators
 * Used across both light and dark themes
 */
export const statusColors = {
	go: '#2E7D32',    // Green for compliant/safe
	warn: '#C46D00',  // Orange for caution
	noGo: '#B33024',  // Red for restricted/prohibited
};

/**
 * Light Theme
 * Generated with Material Theme Builder
 */
export const lightTheme: MD3Theme = {
	...MD3LightTheme,
	colors: {
		...MD3LightTheme.colors,
		primary: 'rgb(0, 93, 184)',
		onPrimary: 'rgb(255, 255, 255)',
		primaryContainer: 'rgb(214, 227, 255)',
		onPrimaryContainer: 'rgb(0, 27, 62)',
		secondary: 'rgb(86, 95, 113)',
		onSecondary: 'rgb(255, 255, 255)',
		secondaryContainer: 'rgb(218, 226, 249)',
		onSecondaryContainer: 'rgb(19, 28, 43)',
		tertiary: 'rgb(54, 106, 32)',
		onTertiary: 'rgb(255, 255, 255)',
		tertiaryContainer: 'rgb(183, 243, 152)',
		onTertiaryContainer: 'rgb(6, 33, 0)',
		error: 'rgb(186, 26, 26)',
		onError: 'rgb(255, 255, 255)',
		errorContainer: 'rgb(255, 218, 214)',
		onErrorContainer: 'rgb(65, 0, 2)',
		background: 'rgb(253, 251, 255)',
		onBackground: 'rgb(26, 27, 30)',
		surface: 'rgb(253, 251, 255)',
		onSurface: 'rgb(26, 27, 30)',
		surfaceVariant: 'rgb(224, 226, 236)',
		onSurfaceVariant: 'rgb(68, 71, 78)',
		outline: 'rgb(116, 119, 127)',
		outlineVariant: 'rgb(196, 198, 208)',
		shadow: 'rgb(0, 0, 0)',
		scrim: 'rgb(0, 0, 0)',
		inverseSurface: 'rgb(47, 48, 51)',
		inverseOnSurface: 'rgb(241, 240, 244)',
		inversePrimary: 'rgb(170, 199, 255)',
		elevation: {
			level0: 'transparent',
			level1: 'rgb(240, 243, 251)',
			level2: 'rgb(233, 238, 249)',
			level3: 'rgb(225, 234, 247)',
			level4: 'rgb(223, 232, 247)',
			level5: 'rgb(218, 229, 245)',
		},
		surfaceDisabled: 'rgba(26, 27, 30, 0.12)',
		onSurfaceDisabled: 'rgba(26, 27, 30, 0.38)',
		backdrop: 'rgba(45, 48, 56, 0.4)',
	},
	fonts: configureFonts({ config: fontConfig }),
};

/**
 * Dark Theme
 * Generated with Material Theme Builder
 */
export const darkTheme: MD3Theme = {
	...MD3DarkTheme,
	colors: {
		...MD3DarkTheme.colors,
		primary: 'rgb(170, 199, 255)',
		onPrimary: 'rgb(0, 48, 95)',
		primaryContainer: 'rgb(0, 70, 141)',
		onPrimaryContainer: 'rgb(214, 227, 255)',
		secondary: 'rgb(190, 199, 220)',
		onSecondary: 'rgb(40, 49, 65)',
		secondaryContainer: 'rgb(62, 71, 89)',
		onSecondaryContainer: 'rgb(218, 226, 249)',
		tertiary: 'rgb(155, 214, 127)',
		onTertiary: 'rgb(15, 57, 0)',
		tertiaryContainer: 'rgb(30, 81, 8)',
		onTertiaryContainer: 'rgb(183, 243, 152)',
		error: 'rgb(255, 180, 171)',
		onError: 'rgb(105, 0, 5)',
		errorContainer: 'rgb(147, 0, 10)',
		onErrorContainer: 'rgb(255, 218, 214)',
		background: 'rgb(26, 27, 30)',
		onBackground: 'rgb(227, 226, 230)',
		surface: 'rgb(26, 27, 30)',
		onSurface: 'rgb(227, 226, 230)',
		surfaceVariant: 'rgb(68, 71, 78)',
		onSurfaceVariant: 'rgb(196, 198, 208)',
		outline: 'rgb(142, 144, 153)',
		outlineVariant: 'rgb(68, 71, 78)',
		shadow: 'rgb(0, 0, 0)',
		scrim: 'rgb(0, 0, 0)',
		inverseSurface: 'rgb(227, 226, 230)',
		inverseOnSurface: 'rgb(47, 48, 51)',
		inversePrimary: 'rgb(0, 93, 184)',
		elevation: {
			level0: 'transparent',
			level1: 'rgb(33, 36, 41)',
			level2: 'rgb(38, 41, 48)',
			level3: 'rgb(42, 46, 55)',
			level4: 'rgb(43, 48, 57)',
			level5: 'rgb(46, 51, 62)',
		},
		surfaceDisabled: 'rgba(227, 226, 230, 0.12)',
		onSurfaceDisabled: 'rgba(227, 226, 230, 0.38)',
		backdrop: 'rgba(45, 48, 56, 0.4)',
	},
	fonts: configureFonts({ config: fontConfig }),
};

/**
 * High Contrast Light Theme
 * For users with visual impairments or in bright sunlight
 */
export const highContrastLightTheme: MD3Theme = {
	...lightTheme,
	colors: {
		...lightTheme.colors,
		primary: 'rgb(0, 60, 120)', // Darker blue for higher contrast
		onSurface: 'rgb(0, 0, 0)', // Pure black text
		outline: 'rgb(0, 0, 0)', // Black borders
	},
};

/**
 * High Contrast Dark Theme
 * For users with visual impairments in low-light conditions
 */
export const highContrastDarkTheme: MD3Theme = {
	...darkTheme,
	colors: {
		...darkTheme.colors,
		primary: 'rgb(200, 220, 255)', // Lighter blue for higher contrast
		onSurface: 'rgb(255, 255, 255)', // Pure white text
		outline: 'rgb(255, 255, 255)', // White borders
	},
};

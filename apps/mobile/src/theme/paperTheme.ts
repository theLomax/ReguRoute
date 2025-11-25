import { MD3LightTheme, MD3DarkTheme, configureFonts } from 'react-native-paper';
import type { MD3Theme } from 'react-native-paper';
import { colors } from './index';

/**
 * Material Design 3 Theme Configuration
 * Supports light mode, dark mode, and accessibility features
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
 * Light Theme
 * Based on Material Design 3 with custom brand colors
 */
export const lightTheme: MD3Theme = {
	...MD3LightTheme,
	colors: {
		...MD3LightTheme.colors,
		primary: colors.primary,
		primaryContainer: colors.primaryLight,
		secondary: colors.info, // Use info color as secondary
		secondaryContainer: colors.infoLight,
		tertiary: colors.success, // Use success color as tertiary
		tertiaryContainer: '#dcfce7', // Light green
		surface: colors.backgroundWhite,
		surfaceVariant: colors.background,
		surfaceDisabled: colors.borderLight,
		background: colors.background,
		error: colors.error,
		errorContainer: colors.criticalLight,
		onPrimary: colors.white,
		onPrimaryContainer: colors.primary,
		onSecondary: colors.white,
		onSecondaryContainer: colors.info,
		onTertiary: colors.white,
		onTertiaryContainer: colors.success,
		onSurface: colors.text,
		onSurfaceVariant: colors.textSecondary,
		onSurfaceDisabled: colors.textMuted,
		onError: colors.white,
		onErrorContainer: colors.error,
		onBackground: colors.text,
		outline: colors.border,
		outlineVariant: colors.borderLight,
		inverseSurface: colors.text,
		inverseOnSurface: colors.white,
		inversePrimary: colors.primaryLight,
		shadow: '#000000',
		scrim: '#000000',
		backdrop: 'rgba(0, 0, 0, 0.4)',
		elevation: {
			level0: 'transparent',
			level1: colors.backgroundWhite,
			level2: colors.backgroundWhite,
			level3: colors.backgroundWhite,
			level4: colors.backgroundWhite,
			level5: colors.backgroundWhite,
		},
	},
	fonts: configureFonts({ config: fontConfig }),
};

/**
 * Dark Theme
 * Optimized for low-light viewing with WCAG AA contrast compliance
 */
export const darkTheme: MD3Theme = {
	...MD3DarkTheme,
	colors: {
		...MD3DarkTheme.colors,
		primary: '#90CAF9', // Lighter blue for dark mode
		primaryContainer: '#1565C0',
		secondary: '#CE93D8', // Lighter purple for dark mode
		secondaryContainer: '#7B1FA2',
		tertiary: '#FFD54F', // Lighter yellow for dark mode
		tertiaryContainer: '#F57C00',
		surface: '#1E1E1E',
		surfaceVariant: '#2C2C2C',
		surfaceDisabled: '#3A3A3A',
		background: '#121212',
		error: '#EF5350',
		errorContainer: '#B71C1C',
		onPrimary: '#000000',
		onPrimaryContainer: '#E3F2FD',
		onSecondary: '#000000',
		onSecondaryContainer: '#F3E5F5',
		onTertiary: '#000000',
		onTertiaryContainer: '#FFF3E0',
		onSurface: '#E0E0E0',
		onSurfaceVariant: '#B0B0B0',
		onSurfaceDisabled: '#757575',
		onError: '#000000',
		onErrorContainer: '#FFCDD2',
		onBackground: '#E0E0E0',
		outline: '#616161',
		outlineVariant: '#424242',
		inverseSurface: '#E0E0E0',
		inverseOnSurface: '#1E1E1E',
		inversePrimary: colors.primary,
		shadow: '#000000',
		scrim: '#000000',
		backdrop: 'rgba(0, 0, 0, 0.6)',
		elevation: {
			level0: 'transparent',
			level1: '#1E1E1E',
			level2: '#232323',
			level3: '#252525',
			level4: '#272727',
			level5: '#2C2C2C',
		},
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
		primary: '#0D47A1', // Darker blue
		onSurface: '#000000', // Pure black text
		outline: '#000000', // Black borders
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
		primary: '#BBDEFB', // Even lighter blue
		onSurface: '#FFFFFF', // Pure white text
		outline: '#FFFFFF', // White borders
	},
};

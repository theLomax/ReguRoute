import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';

/**
 * User Preferences Context
 * Manages theme, accessibility, and UI preferences
 */

export type ThemeMode = 'light' | 'dark' | 'system' | 'high-contrast-light' | 'high-contrast-dark';
export type ColorBlindMode = 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';

export interface UserPreferences {
	// Theme preferences
	themeMode: ThemeMode;

	// UI preferences
	reducedMotion: boolean; // Disable animations
	textScale: number; // Font size scale: 1-5, where 3 is default (1=smallest, 5=largest)

	// Accessibility
	colorBlindMode: ColorBlindMode;
	highContrast: boolean;

	// Feature preferences
	showMetric: boolean; // Show metric units (km) vs imperial (miles)
	autoSaveRoutes: boolean;
}

interface PreferencesContextValue {
	preferences: UserPreferences;
	updatePreference: <K extends keyof UserPreferences>(
		key: K,
		value: UserPreferences[K]
	) => Promise<void>;
	resetPreferences: () => Promise<void>;
	effectiveTheme: 'light' | 'dark' | 'high-contrast-light' | 'high-contrast-dark';
	fontScale: number; // Font scale multiplier (0.85 to 1.3)
}

const defaultPreferences: UserPreferences = {
	themeMode: 'system',
	reducedMotion: false,
	textScale: 3, // Default text scale (middle of 1-5 range)
	colorBlindMode: 'none',
	highContrast: false,
	showMetric: true,
	autoSaveRoutes: false,
};

const PREFERENCES_STORAGE_KEY = '@reguroute:preferences';

const PreferencesContext = createContext<PreferencesContextValue | undefined>(undefined);

export function PreferencesProvider({ children }: { children: ReactNode }) {
	const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);
	const [isLoaded, setIsLoaded] = useState(false);
	const systemColorScheme = useColorScheme();

	// Load preferences from storage on mount
	useEffect(() => {
		loadPreferences();
	}, []);

	const loadPreferences = async () => {
		try {
			const stored = await AsyncStorage.getItem(PREFERENCES_STORAGE_KEY);
			if (stored) {
				const parsed = JSON.parse(stored);
				setPreferences({ ...defaultPreferences, ...parsed });
			}
		} catch (error) {
			console.error('Failed to load preferences:', error);
			// Continue with defaults even if loading fails
		} finally {
			// Always mark as loaded to prevent hanging
			setIsLoaded(true);
		}
	};

	const updatePreference = async <K extends keyof UserPreferences>(
		key: K,
		value: UserPreferences[K]
	) => {
		try {
			const updated = { ...preferences, [key]: value };
			setPreferences(updated);
			await AsyncStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(updated));
		} catch (error) {
			console.error('Failed to save preference:', error);
		}
	};

	const resetPreferences = async () => {
		try {
			setPreferences(defaultPreferences);
			await AsyncStorage.removeItem(PREFERENCES_STORAGE_KEY);
		} catch (error) {
			console.error('Failed to reset preferences:', error);
		}
	};

	// Calculate effective theme based on system preference and high contrast
	const effectiveTheme = React.useMemo<'light' | 'dark' | 'high-contrast-light' | 'high-contrast-dark'>(() => {
		let baseTheme: 'light' | 'dark';

		// Determine base theme
		if (preferences.themeMode === 'system') {
			baseTheme = systemColorScheme === 'dark' ? 'dark' : 'light';
		} else if (preferences.themeMode === 'high-contrast-light' || preferences.themeMode === 'high-contrast-dark') {
			return preferences.themeMode;
		} else {
			baseTheme = preferences.themeMode;
		}

		// Apply high contrast if enabled
		if (preferences.highContrast) {
			return baseTheme === 'dark' ? 'high-contrast-dark' : 'high-contrast-light';
		}

		return baseTheme;
	}, [preferences.themeMode, preferences.highContrast, systemColorScheme]);

	// Calculate font scale multiplier from textScale (1-5 → 0.85-1.3)
	const fontScale = React.useMemo(() => {
		// Map 1-5 scale to 0.85-1.3 multiplier
		// 1 = 0.85, 2 = 0.95, 3 = 1.0 (default), 4 = 1.15, 5 = 1.3
		const scaleMap: Record<number, number> = {
			1: 0.85,
			2: 0.95,
			3: 1.0,
			4: 1.15,
			5: 1.3,
		};
		return scaleMap[preferences.textScale] || 1.0;
	}, [preferences.textScale]);

	// Don't render children until preferences are loaded
	// Show a simple loading state instead of null to prevent hanging
	if (!isLoaded) {
		return null; // This will show the app's splash screen
	}

	return (
		<PreferencesContext.Provider
			value={{
				preferences,
				updatePreference,
				resetPreferences,
				effectiveTheme,
				fontScale,
			}}
		>
			{children}
		</PreferencesContext.Provider>
	);
}

export function usePreferences() {
	const context = useContext(PreferencesContext);
	if (!context) {
		throw new Error('usePreferences must be used within PreferencesProvider');
	}
	return context;
}

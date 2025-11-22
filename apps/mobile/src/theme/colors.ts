/**
 * App color palette
 * Use these constants for consistent styling across the app
 */

export const colors = {
	// Primary brand colors
	primary: '#2563eb',
	primaryLight: '#3b82f6',
	primaryDark: '#1d4ed8',

	// Neutral/text colors
	text: '#1a1a1a',
	textSecondary: '#666666',
	textMuted: '#999999',

	// Background colors
	background: '#f5f5f5',
	backgroundWhite: '#ffffff',
	backgroundCard: '#ffffff',

	// Border colors
	border: '#e0e0e0',
	borderLight: '#eeeeee',

	// Status/alert colors
	success: '#16a34a',
	warning: '#f59e0b',
	error: '#dc2626',
	info: '#0ea5e9',

	// Alert severity (for regulation alerts)
	critical: '#dc2626',
	criticalLight: '#fef2f2',
	warningLight: '#fffbeb',
	infoLight: '#f0f9ff',

	// Misc
	white: '#ffffff',
	black: '#000000',
	transparent: 'transparent',
} as const;

export type ColorName = keyof typeof colors;

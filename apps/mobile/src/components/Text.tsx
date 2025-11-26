import React from 'react';
import { Text as RNText, TextProps as RNTextProps, TextStyle, StyleSheet } from 'react-native';
import { usePreferences } from '../contexts';

/**
 * Custom Text component that automatically applies font scaling
 * Drop-in replacement for React Native's Text component
 */
export default function Text({ style, ...props }: RNTextProps) {
	const { fontScale } = usePreferences();

	// Apply font scale to any fontSize in the style
	const scaledStyle = React.useMemo(() => {
		if (!style) return undefined;

		const flatStyle = StyleSheet.flatten(style);

		if (flatStyle && typeof flatStyle === 'object' && 'fontSize' in flatStyle) {
			const fontSize = flatStyle.fontSize;
			if (typeof fontSize === 'number') {
				return {
					...flatStyle,
					fontSize: Math.round(fontSize * fontScale),
				};
			}
		}

		return flatStyle;
	}, [style, fontScale]);

	return <RNText {...props} style={scaledStyle} />;
}

import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import type { StyleProp, ViewStyle } from 'react-native';

export type IconName = keyof typeof Ionicons.glyphMap;

interface IconProps {
	name: IconName;
	size?: number;
	color?: string;
	style?: StyleProp<ViewStyle>;
}

/**
 * Icon component wrapper around Ionicons
 * Provides a consistent interface for icons across the app
 */
export function Icon({ name, size = 24, color, style }: IconProps) {
	return <Ionicons name={name} size={size} color={color} style={style} />;
}

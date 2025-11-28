import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface CheckeredFlagIconProps {
	size?: number;
	color?: string;
}

/**
 * Checkered flag icon for destination marker
 * Converted from Material Design icon
 */
export function CheckeredFlagIcon({ size = 24, color = '#e3e3e3' }: CheckeredFlagIconProps) {
	return (
		<Svg width={size} height={size} viewBox="0 -960 960 960" fill={color}>
			<Path d="M360-720h80v-80h-80v80Zm160 0v-80h80v80h-80ZM360-400v-80h80v80h-80Zm320-160v-80h80v80h-80Zm0 160v-80h80v80h-80Zm-160 0v-80h80v80h-80Zm160-320v-80h80v80h-80Zm-240 80v-80h80v80h-80ZM200-160v-640h80v80h80v80h-80v80h80v80h-80v320h-80Zm400-320v-80h80v80h-80Zm-160 0v-80h80v80h-80Zm-80-80v-80h80v80h-80Zm160 0v-80h80v80h-80Zm80-80v-80h80v80h-80Z" />
		</Svg>
	);
}

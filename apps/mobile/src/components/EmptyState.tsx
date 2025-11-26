import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from 'react-native-paper';
import Button from './Button';
import Text from './Text';

interface EmptyStateProps {
	/** Icon name from Ionicons */
	icon?: keyof typeof Ionicons.glyphMap;
	/** Main title text */
	title: string;
	/** Description text */
	description?: string;
	/** CTA button text */
	actionLabel?: string;
	/** Called when CTA button is pressed */
	onAction?: () => void;
	/** Container style overrides */
	style?: ViewStyle;
}

export default function EmptyState({
	icon = 'folder-open-outline',
	title,
	description,
	actionLabel,
	onAction,
	style,
}: EmptyStateProps) {
	const theme = useTheme();

	const styles = React.useMemo(() => StyleSheet.create({
		container: {
			flex: 1,
			alignItems: 'center',
			justifyContent: 'center',
			padding: 32,
		},
		iconContainer: {
			marginBottom: 16,
			opacity: 0.6,
		},
		title: {
			fontSize: 20,
			fontWeight: '600',
			color: theme.colors.onSurface,
			textAlign: 'center',
			marginBottom: 8,
		},
		description: {
			fontSize: 14,
			color: theme.colors.onSurfaceVariant,
			textAlign: 'center',
			lineHeight: 20,
			marginBottom: 24,
		},
		button: {
			minWidth: 160,
		},
	}), [theme]);

	return (
		<View style={[styles.container, style]}>
			<View style={styles.iconContainer}>
				<Ionicons name={icon} size={64} color={theme.colors.onSurfaceVariant} />
			</View>
			<Text style={styles.title}>{title}</Text>
			{description && <Text style={styles.description}>{description}</Text>}
			{actionLabel && onAction && (
				<Button
					title={actionLabel}
					onPress={onAction}
					variant="primary"
					style={styles.button}
				/>
			)}
		</View>
	);
}

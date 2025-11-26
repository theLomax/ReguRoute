import React from 'react';
import { View, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from 'react-native-paper';
import Text from './Text';

type AlertSeverity = 'info' | 'warning' | 'error' | 'success';

interface AlertProps {
	/** Alert message text */
	message: string;
	/** Optional title */
	title?: string;
	/** Severity level affects color */
	severity?: AlertSeverity;
	/** Show dismiss button */
	dismissible?: boolean;
	/** Called when dismiss is pressed */
	onDismiss?: () => void;
	/** Container style overrides */
	style?: ViewStyle;
}

export default function Alert({
	message,
	title,
	severity = 'info',
	dismissible = false,
	onDismiss,
	style,
}: AlertProps) {
	const theme = useTheme();

	const severityConfig: Record<AlertSeverity, {
		backgroundColor: string;
		borderColor: string;
		textColor: string;
		iconName: keyof typeof Ionicons.glyphMap;
	}> = {
		info: {
			backgroundColor: `${theme.colors.secondary}20`,
			borderColor: theme.colors.secondary,
			textColor: theme.colors.secondary,
			iconName: 'information-circle',
		},
		warning: {
			backgroundColor: '#FED7AA',
			borderColor: '#FB923C',
			textColor: '#FB923C',
			iconName: 'warning',
		},
		error: {
			backgroundColor: theme.colors.errorContainer,
			borderColor: theme.colors.error,
			textColor: theme.colors.error,
			iconName: 'alert-circle',
		},
		success: {
			backgroundColor: '#f0fdf4',
			borderColor: theme.colors.tertiary,
			textColor: theme.colors.tertiary,
			iconName: 'checkmark-circle',
		},
	};

	const config = severityConfig[severity];

	return (
		<View
			style={[
				styles.container,
				{
					backgroundColor: config.backgroundColor,
					borderColor: config.borderColor,
				},
				style,
			]}
		>
			<Ionicons
				name={config.iconName}
				size={20}
				color={config.textColor}
				style={styles.icon}
			/>
			<View style={styles.content}>
				{title && (
					<Text style={[styles.title, { color: config.textColor }]}>
						{title}
					</Text>
				)}
				<Text style={[styles.message, { color: config.textColor }]}>
					{message}
				</Text>
			</View>
			{dismissible && onDismiss && (
				<TouchableOpacity onPress={onDismiss} style={styles.dismissButton}>
					<Ionicons name="close" size={18} color={config.textColor} />
				</TouchableOpacity>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		padding: 12,
		borderRadius: 8,
		borderWidth: 1,
	},
	icon: {
		marginRight: 10,
		marginTop: 1,
	},
	content: {
		flex: 1,
	},
	title: {
		fontSize: 14,
		fontWeight: '600',
		marginBottom: 2,
	},
	message: {
		fontSize: 14,
		lineHeight: 20,
	},
	dismissButton: {
		marginLeft: 8,
		padding: 2,
	},
});

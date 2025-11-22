import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';

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

const severityConfig: Record<AlertSeverity, {
	backgroundColor: string;
	borderColor: string;
	textColor: string;
	iconName: keyof typeof Ionicons.glyphMap;
}> = {
	info: {
		backgroundColor: colors.infoLight,
		borderColor: colors.info,
		textColor: colors.info,
		iconName: 'information-circle',
	},
	warning: {
		backgroundColor: colors.warningLight,
		borderColor: colors.warning,
		textColor: colors.warning,
		iconName: 'warning',
	},
	error: {
		backgroundColor: colors.criticalLight,
		borderColor: colors.error,
		textColor: colors.error,
		iconName: 'alert-circle',
	},
	success: {
		backgroundColor: '#f0fdf4',
		borderColor: colors.success,
		textColor: colors.success,
		iconName: 'checkmark-circle',
	},
};

export default function Alert({
	message,
	title,
	severity = 'info',
	dismissible = false,
	onDismiss,
	style,
}: AlertProps) {
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

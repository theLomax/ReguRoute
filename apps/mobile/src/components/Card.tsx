import { View, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { colors } from '../theme';

interface CardProps {
	children: React.ReactNode;
	/** Called when the card is pressed */
	onPress?: () => void;
	/** Additional style overrides */
	style?: ViewStyle;
	/** Disable the default padding */
	noPadding?: boolean;
}

export default function Card({ children, onPress, style, noPadding }: CardProps) {
	const cardStyle = [
		styles.container,
		noPadding ? null : styles.padding,
		style,
	];

	if (onPress) {
		return (
			<TouchableOpacity style={cardStyle} onPress={onPress} activeOpacity={0.7}>
				{children}
			</TouchableOpacity>
		);
	}

	return <View style={cardStyle}>{children}</View>;
}

const styles = StyleSheet.create({
	container: {
		backgroundColor: colors.backgroundWhite,
		borderRadius: 12,
		shadowColor: colors.black,
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.05,
		shadowRadius: 3,
		elevation: 2,
	},
	padding: {
		padding: 16,
	},
});

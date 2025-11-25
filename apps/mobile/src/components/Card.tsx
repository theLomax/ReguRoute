import { ViewStyle } from 'react-native';
import { Card as PaperCard } from 'react-native-paper';

interface CardProps {
	children: React.ReactNode;
	/** Called when the card is pressed */
	onPress?: () => void;
	/** Additional style overrides */
	style?: ViewStyle;
	/** Disable the default padding */
	noPadding?: boolean;
}

/**
 * Card component using React Native Paper
 * Provides elevation, theming, and optional press interaction
 */
export default function Card({ children, onPress, style, noPadding }: CardProps) {
	if (onPress) {
		return (
			<PaperCard mode="elevated" style={style} onPress={onPress}>
				{noPadding ? children : <PaperCard.Content>{children}</PaperCard.Content>}
			</PaperCard>
		);
	}

	return (
		<PaperCard mode="elevated" style={style}>
			{noPadding ? children : <PaperCard.Content>{children}</PaperCard.Content>}
		</PaperCard>
	);
}

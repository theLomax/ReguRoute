import { View, Text, Image, StyleSheet } from 'react-native';
import { colors } from '../theme';

type AvatarSize = 'small' | 'medium' | 'large';

interface AvatarProps {
	/** User's email or name for generating initials */
	name?: string;
	/** Image URI for avatar photo */
	imageUri?: string;
	/** Size variant */
	size?: AvatarSize;
	/** Custom background color */
	backgroundColor?: string;
}

const sizeMap: Record<AvatarSize, { container: number; text: number }> = {
	small: { container: 32, text: 12 },
	medium: { container: 48, text: 18 },
	large: { container: 80, text: 28 },
};

function getInitials(name: string): string {
	if (!name) return '??';
	// If it's an email, use first two characters
	if (name.includes('@')) {
		return name.substring(0, 2).toUpperCase();
	}
	// Otherwise split by space and get first letter of each word
	const parts = name.trim().split(' ');
	if (parts.length === 1) {
		return parts[0].substring(0, 2).toUpperCase();
	}
	return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function Avatar({
	name,
	imageUri,
	size = 'medium',
	backgroundColor = colors.primary,
}: AvatarProps) {
	const dimensions = sizeMap[size];

	const containerStyle = {
		width: dimensions.container,
		height: dimensions.container,
		borderRadius: dimensions.container / 2,
		backgroundColor,
	};

	if (imageUri) {
		return (
			<Image
				source={{ uri: imageUri }}
				style={[styles.image, containerStyle]}
			/>
		);
	}

	return (
		<View style={[styles.container, containerStyle]}>
			<Text style={[styles.text, { fontSize: dimensions.text }]}>
				{getInitials(name || '')}
			</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		alignItems: 'center',
		justifyContent: 'center',
	},
	image: {
		resizeMode: 'cover',
	},
	text: {
		color: colors.white,
		fontWeight: 'bold',
	},
});

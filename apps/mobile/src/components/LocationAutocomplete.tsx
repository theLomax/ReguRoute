import { useState, useMemo } from 'react';
import {
	View,
	Text,
	TextInput,
	TouchableOpacity,
	StyleSheet,
	FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Coordinates } from '@reguroute/types';
import { colors } from '../theme';

// US Northeast region locations with display names and state abbreviations
const LOCATIONS: Array<{
	key: string;
	name: string;
	state: string;
	coordinates: Coordinates;
}> = [
	// New York
	{ key: 'new york', name: 'New York City', state: 'NY', coordinates: { lat: 40.7128, lng: -74.006 } },
	{ key: 'albany', name: 'Albany', state: 'NY', coordinates: { lat: 42.6526, lng: -73.7562 } },
	{ key: 'buffalo', name: 'Buffalo', state: 'NY', coordinates: { lat: 42.8864, lng: -78.8784 } },
	{ key: 'rochester', name: 'Rochester', state: 'NY', coordinates: { lat: 43.1566, lng: -77.6088 } },
	{ key: 'syracuse', name: 'Syracuse', state: 'NY', coordinates: { lat: 43.0481, lng: -76.1474 } },
	// New Jersey
	{ key: 'newark', name: 'Newark', state: 'NJ', coordinates: { lat: 40.7357, lng: -74.1724 } },
	{ key: 'jersey city', name: 'Jersey City', state: 'NJ', coordinates: { lat: 40.7178, lng: -74.0431 } },
	{ key: 'trenton', name: 'Trenton', state: 'NJ', coordinates: { lat: 40.2206, lng: -74.7597 } },
	{ key: 'atlantic city', name: 'Atlantic City', state: 'NJ', coordinates: { lat: 39.3643, lng: -74.4229 } },
	// Pennsylvania
	{ key: 'philadelphia', name: 'Philadelphia', state: 'PA', coordinates: { lat: 39.9526, lng: -75.1652 } },
	{ key: 'pittsburgh', name: 'Pittsburgh', state: 'PA', coordinates: { lat: 40.4406, lng: -79.9959 } },
	{ key: 'harrisburg', name: 'Harrisburg', state: 'PA', coordinates: { lat: 40.2732, lng: -76.8867 } },
	{ key: 'allentown', name: 'Allentown', state: 'PA', coordinates: { lat: 40.6084, lng: -75.4902 } },
	// Delaware
	{ key: 'wilmington', name: 'Wilmington', state: 'DE', coordinates: { lat: 39.7391, lng: -75.5398 } },
	{ key: 'dover', name: 'Dover', state: 'DE', coordinates: { lat: 39.1582, lng: -75.5244 } },
	// Maryland
	{ key: 'baltimore', name: 'Baltimore', state: 'MD', coordinates: { lat: 39.2904, lng: -76.6122 } },
	{ key: 'annapolis', name: 'Annapolis', state: 'MD', coordinates: { lat: 38.9784, lng: -76.4922 } },
	// Washington DC
	{ key: 'washington', name: 'Washington', state: 'DC', coordinates: { lat: 38.9072, lng: -77.0369 } },
	// Connecticut
	{ key: 'hartford', name: 'Hartford', state: 'CT', coordinates: { lat: 41.7658, lng: -72.6734 } },
	{ key: 'new haven', name: 'New Haven', state: 'CT', coordinates: { lat: 41.3083, lng: -72.9279 } },
	{ key: 'stamford', name: 'Stamford', state: 'CT', coordinates: { lat: 41.0534, lng: -73.5387 } },
	// Massachusetts
	{ key: 'boston', name: 'Boston', state: 'MA', coordinates: { lat: 42.3601, lng: -71.0589 } },
	{ key: 'worcester', name: 'Worcester', state: 'MA', coordinates: { lat: 42.2626, lng: -71.8023 } },
	{ key: 'springfield', name: 'Springfield', state: 'MA', coordinates: { lat: 42.1015, lng: -72.5898 } },
	// Rhode Island
	{ key: 'providence', name: 'Providence', state: 'RI', coordinates: { lat: 41.824, lng: -71.4128 } },
	// Vermont
	{ key: 'burlington', name: 'Burlington', state: 'VT', coordinates: { lat: 44.4759, lng: -73.2121 } },
	{ key: 'montpelier', name: 'Montpelier', state: 'VT', coordinates: { lat: 44.2601, lng: -72.5754 } },
	// New Hampshire
	{ key: 'manchester', name: 'Manchester', state: 'NH', coordinates: { lat: 42.9956, lng: -71.4548 } },
	{ key: 'concord', name: 'Concord', state: 'NH', coordinates: { lat: 43.2081, lng: -71.5376 } },
	// Maine
	{ key: 'portland', name: 'Portland', state: 'ME', coordinates: { lat: 43.6591, lng: -70.2568 } },
	{ key: 'augusta', name: 'Augusta', state: 'ME', coordinates: { lat: 44.3106, lng: -69.7795 } },
];

interface LocationAutocompleteProps {
	value: string;
	onChangeText: (text: string) => void;
	onSelectLocation: (name: string, coordinates: Coordinates) => void;
	placeholder?: string;
	icon: 'location' | 'flag';
	iconColor: string;
	isSelected: boolean;
}

export default function LocationAutocomplete({
	value,
	onChangeText,
	onSelectLocation,
	placeholder = 'Enter city name',
	icon,
	iconColor,
	isSelected,
}: LocationAutocompleteProps) {
	const [isFocused, setIsFocused] = useState(false);

	const suggestions = useMemo(() => {
		if (!value.trim() || isSelected) return [];

		const query = value.toLowerCase().trim();
		return LOCATIONS.filter(
			(loc) =>
				loc.name.toLowerCase().includes(query) ||
				loc.key.includes(query) ||
				loc.state.toLowerCase() === query
		).slice(0, 5);
	}, [value, isSelected]);

	const showSuggestions = isFocused && suggestions.length > 0;

	const handleSelect = (location: (typeof LOCATIONS)[0]) => {
		onSelectLocation(`${location.name}, ${location.state}`, location.coordinates);
		setIsFocused(false);
	};

	return (
		<View style={styles.container}>
			<View style={styles.inputRow}>
				<View style={styles.iconContainer}>
					<Ionicons name={icon} size={20} color={iconColor} />
				</View>
				<TextInput
					style={styles.input}
					value={value}
					onChangeText={onChangeText}
					placeholder={placeholder}
					placeholderTextColor={colors.textMuted}
					autoCapitalize="words"
					onFocus={() => setIsFocused(true)}
					onBlur={() => {
						// Delay to allow tap on suggestion
						setTimeout(() => setIsFocused(false), 150);
					}}
				/>
				{isSelected && <Ionicons name="checkmark-circle" size={20} color={colors.success} />}
			</View>

			{showSuggestions && (
				<View style={styles.suggestionsContainer}>
					<FlatList
						data={suggestions}
						keyExtractor={(item) => item.key}
						keyboardShouldPersistTaps="handled"
						scrollEnabled={false}
						renderItem={({ item, index }) => (
							<TouchableOpacity
								style={[
									styles.suggestionItem,
									index === suggestions.length - 1 && styles.lastSuggestionItem,
								]}
								onPress={() => handleSelect(item)}
							>
								<Ionicons name="location-outline" size={16} color={colors.textMuted} />
								<Text style={styles.suggestionName}>{item.name}</Text>
								<Text style={styles.suggestionState}>{item.state}</Text>
							</TouchableOpacity>
						)}
					/>
				</View>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		position: 'relative',
	},
	inputRow: {
		flexDirection: 'row',
		alignItems: 'center',
		padding: 16,
	},
	iconContainer: {
		width: 32,
		alignItems: 'center',
	},
	input: {
		flex: 1,
		fontSize: 16,
		color: colors.text,
		marginLeft: 8,
	},
	suggestionsContainer: {
		backgroundColor: colors.backgroundWhite,
		borderTopWidth: 1,
		borderTopColor: colors.borderLight,
		marginLeft: 56,
		marginRight: 16,
	},
	suggestionItem: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingVertical: 12,
		paddingHorizontal: 8,
		borderBottomWidth: 1,
		borderBottomColor: colors.borderLight,
	},
	lastSuggestionItem: {
		borderBottomWidth: 0,
	},
	suggestionName: {
		flex: 1,
		fontSize: 15,
		color: colors.text,
		marginLeft: 8,
	},
	suggestionState: {
		fontSize: 13,
		color: colors.textMuted,
		marginLeft: 8,
	},
});

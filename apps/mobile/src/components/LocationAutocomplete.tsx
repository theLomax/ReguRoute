import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
	View,
	TextInput,
	TouchableOpacity,
	StyleSheet,
	FlatList,
	ActivityIndicator,
} from 'react-native';
import { useTheme } from 'react-native-paper';
import type { Coordinates } from '@reguroute/types';
import { Icon } from './Icon';
import Text from './Text';

// Photon API response types
interface PhotonFeature {
	type: 'Feature';
	geometry: {
		coordinates: [number, number]; // [lng, lat]
		type: 'Point';
	};
	properties: {
		osm_id: number;
		osm_type: string;
		country: string;
		countrycode: string;
		state?: string;
		city?: string;
		name?: string;
		type: string;
	};
}

interface PhotonResponse {
	type: 'FeatureCollection';
	features: PhotonFeature[];
}

interface LocationSuggestion {
	key: string;
	name: string;
	state: string;
	coordinates: Coordinates;
}

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
	icon: React.ReactElement;
	isSelected: boolean;
}

// US State abbreviation mapping
const STATE_ABBREVIATIONS: Record<string, string> = {
	'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR', 'California': 'CA',
	'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE', 'Florida': 'FL', 'Georgia': 'GA',
	'Hawaii': 'HI', 'Idaho': 'ID', 'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA',
	'Kansas': 'KS', 'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
	'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS', 'Missouri': 'MO',
	'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV', 'New Hampshire': 'NH', 'New Jersey': 'NJ',
	'New Mexico': 'NM', 'New York': 'NY', 'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH',
	'Oklahoma': 'OK', 'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
	'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT', 'Vermont': 'VT',
	'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV', 'Wisconsin': 'WI', 'Wyoming': 'WY',
	'District of Columbia': 'DC',
};

const DEBOUNCE_MS = 300;

export default function LocationAutocomplete({
	value,
	onChangeText,
	onSelectLocation,
	placeholder = 'Enter city name',
	icon,
	isSelected,
}: LocationAutocompleteProps) {
	const theme = useTheme();
	const [isFocused, setIsFocused] = useState(false);
	const [apiSuggestions, setApiSuggestions] = useState<LocationSuggestion[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	// Guard against undefined theme
	if (!theme || !theme.colors) {
		return null;
	}

	// Local suggestions for instant feedback (fallback/offline)
	const localSuggestions = useMemo(() => {
		if (!value.trim() || isSelected) return [];

		const query = value.toLowerCase().trim();
		return LOCATIONS.filter(
			(loc) =>
				loc.name.toLowerCase().includes(query) ||
				loc.key.includes(query) ||
				loc.state.toLowerCase() === query
		).slice(0, 5);
	}, [value, isSelected]);

	// Fetch from Photon API with debouncing
	useEffect(() => {
		// Clear any pending request
		if (debounceRef.current) {
			clearTimeout(debounceRef.current);
		}

		// Don't fetch if selected, empty, or too short
		if (isSelected || !value.trim() || value.trim().length < 2) {
			setApiSuggestions([]);
			setIsLoading(false);
			return;
		}

		setIsLoading(true);

		debounceRef.current = setTimeout(async () => {
			try {
				const query = encodeURIComponent(value.trim());
				// Photon API - filter to US cities/towns
				const url = `https://photon.komoot.io/api/?q=${query}&limit=8&lang=en&osm_tag=place:city&osm_tag=place:town&osm_tag=place:village`;

				const response = await fetch(url);
				if (!response.ok) throw new Error('Geocoding failed');

				const data: PhotonResponse = await response.json();

				// Filter to US only and map to our format
				const suggestions: LocationSuggestion[] = data.features
					.filter(f => f.properties.countrycode === 'US' && f.properties.state)
					.map(f => {
						const stateAbbr = STATE_ABBREVIATIONS[f.properties.state || ''] || f.properties.state || '';
						const cityName = f.properties.name || f.properties.city || '';
						return {
							key: `${f.properties.osm_id}`,
							name: cityName,
							state: stateAbbr,
							coordinates: {
								lat: f.geometry.coordinates[1],
								lng: f.geometry.coordinates[0],
							},
						};
					})
					.filter(s => s.name && s.state)
					.slice(0, 5);

				setApiSuggestions(suggestions);
			} catch (error) {
				console.warn('Photon geocoding error:', error);
				// Fall back to local suggestions on error
				setApiSuggestions([]);
			} finally {
				setIsLoading(false);
			}
		}, DEBOUNCE_MS);

		return () => {
			if (debounceRef.current) {
				clearTimeout(debounceRef.current);
			}
		};
	}, [value, isSelected]);

	// Use API suggestions if available, otherwise local
	const suggestions = apiSuggestions.length > 0 ? apiSuggestions : localSuggestions;
	const showSuggestions = isFocused && (suggestions.length > 0 || isLoading);

	const handleSelect = (location: LocationSuggestion) => {
		onSelectLocation(`${location.name}, ${location.state}`, location.coordinates);
		setApiSuggestions([]); // Clear API suggestions on select
		setIsFocused(false);
	};

	const styles = React.useMemo(() => StyleSheet.create({
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
			color: theme.colors.onSurface,
			marginLeft: 8,
		},
		suggestionsContainer: {
			backgroundColor: theme.colors.surface,
			borderTopWidth: 1,
			borderTopColor: theme.colors.outlineVariant,
			marginLeft: 56,
			marginRight: 16,
		},
		suggestionItem: {
			flexDirection: 'row',
			alignItems: 'center',
			paddingVertical: 12,
			paddingHorizontal: 8,
			borderBottomWidth: 1,
			borderBottomColor: theme.colors.outlineVariant,
		},
		lastSuggestionItem: {
			borderBottomWidth: 0,
		},
		suggestionName: {
			flex: 1,
			fontSize: 15,
			color: theme.colors.onSurface,
			marginLeft: 8,
		},
		suggestionState: {
			fontSize: 13,
			color: theme.colors.onSurfaceVariant,
			marginLeft: 8,
		},
		loadingContainer: {
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'center',
			paddingVertical: 16,
			paddingHorizontal: 8,
		},
		loadingText: {
			fontSize: 14,
			color: theme.colors.onSurfaceVariant,
			marginLeft: 8,
		},
	}), [theme]);

	return (
		<View style={styles.container}>
			<View style={styles.inputRow}>
				<View style={styles.iconContainer}>
					{icon}
				</View>
				<TextInput
					style={styles.input}
					value={value}
					onChangeText={onChangeText}
					placeholder={placeholder}
					placeholderTextColor={theme.colors.onSurfaceVariant}
					autoCapitalize="words"
					onFocus={() => setIsFocused(true)}
					onBlur={() => {
						// Delay to allow tap on suggestion
						setTimeout(() => setIsFocused(false), 150);
					}}
				/>
				{isSelected && <Icon name="checkmark-circle" size={20} color={theme.colors.tertiary} />}
			</View>

			{showSuggestions && (
				<View style={styles.suggestionsContainer}>
					{isLoading && suggestions.length === 0 ? (
						<View style={styles.loadingContainer}>
							<ActivityIndicator size="small" color={theme.colors.primary} />
							<Text style={styles.loadingText}>Searching...</Text>
						</View>
					) : (
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
									<Icon name="location-outline" size={16} color={theme.colors.onSurfaceVariant} />
									<Text style={styles.suggestionName}>{item.name}</Text>
									<Text style={styles.suggestionState}>{item.state}</Text>
								</TouchableOpacity>
							)}
						/>
					)}
				</View>
			)}
		</View>
	);
}

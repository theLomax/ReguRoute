import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { List, Switch, RadioButton, Divider, Text, useTheme, Card } from 'react-native-paper';
import { usePreferences, type ThemeMode, type ColorBlindMode } from '../contexts';

export default function PreferencesScreen() {
	const { preferences, updatePreference } = usePreferences();
	const theme = useTheme();

	const textScaleLabels = ['Smallest', 'Small', 'Default', 'Large', 'Largest'];

	return (
		<ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
			{/* Theme Section */}
			<Card style={styles.section}>
				<Card.Content>
					<Text variant="titleMedium" style={styles.sectionTitle}>Theme</Text>

					<RadioButton.Group
						onValueChange={(value) => updatePreference('themeMode', value as ThemeMode)}
						value={preferences.themeMode}
					>
						<RadioButton.Item label="System Default" value="system" />
						<RadioButton.Item label="Light" value="light" />
						<RadioButton.Item label="Dark" value="dark" />
					</RadioButton.Group>

					<Divider style={styles.divider} />

					<List.Item
						title="High Contrast"
						description="Increase contrast for better visibility"
						left={props => <List.Icon {...props} icon="contrast-circle" />}
						right={() => (
							<Switch
								value={preferences.highContrast}
								onValueChange={(value) => updatePreference('highContrast', value)}
							/>
						)}
					/>
				</Card.Content>
			</Card>

			{/* Accessibility Section */}
			<Card style={styles.section}>
				<Card.Content>
					<Text variant="titleMedium" style={styles.sectionTitle}>Accessibility</Text>

					<Text variant="labelLarge" style={styles.subsectionTitle}>Color Blind Support</Text>
					<RadioButton.Group
						onValueChange={(value) => updatePreference('colorBlindMode', value as ColorBlindMode)}
						value={preferences.colorBlindMode}
					>
						<RadioButton.Item label="None" value="none" />
						<RadioButton.Item label="Protanopia (Red-Blind)" value="protanopia" />
						<RadioButton.Item label="Deuteranopia (Green-Blind)" value="deuteranopia" />
						<RadioButton.Item label="Tritanopia (Blue-Blind)" value="tritanopia" />
					</RadioButton.Group>

					<Divider style={styles.divider} />

					<View style={styles.textSizeContainer}>
						<View style={styles.textSizeHeader}>
							<List.Icon icon="format-size" />
							<View style={styles.textSizeTextContainer}>
								<Text variant="bodyLarge">Text Size</Text>
								<Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
									{textScaleLabels[preferences.textScale - 1]}
								</Text>
							</View>
						</View>
						<View style={styles.textSizeButtons}>
							{[1, 2, 3, 4, 5].map((scale) => (
								<TouchableOpacity
									key={scale}
									style={[
										styles.textSizeButton,
										{
											backgroundColor: preferences.textScale === scale
												? theme.colors.primaryContainer
												: theme.colors.surfaceVariant,
											borderColor: preferences.textScale === scale
												? theme.colors.primary
												: theme.colors.outline,
										},
									]}
									onPress={() => updatePreference('textScale', scale)}
								>
									<Text
										variant="labelLarge"
										style={{
											color: preferences.textScale === scale
												? theme.colors.onPrimaryContainer
												: theme.colors.onSurfaceVariant,
											fontSize: 10 + (scale * 2),
										}}
									>
										A
									</Text>
								</TouchableOpacity>
							))}
						</View>
					</View>

					<Divider style={styles.divider} />

					<List.Item
						title="Reduced Motion"
						description="Minimize animations and transitions"
						left={props => <List.Icon {...props} icon="motion-pause-outline" />}
						right={() => (
							<Switch
								value={preferences.reducedMotion}
								onValueChange={(value) => updatePreference('reducedMotion', value)}
							/>
						)}
					/>
				</Card.Content>
			</Card>

			{/* Feature Preferences Section */}
			<Card style={styles.section}>
				<Card.Content>
					<Text variant="titleMedium" style={styles.sectionTitle}>Features</Text>

					<List.Item
						title="Metric Units"
						description={preferences.showMetric ? "Show kilometers" : "Show miles"}
						left={props => <List.Icon {...props} icon="map-marker-distance" />}
						right={() => (
							<Switch
								value={preferences.showMetric}
								onValueChange={(value) => updatePreference('showMetric', value)}
							/>
						)}
					/>

					<List.Item
						title="Auto-Save Routes"
						description="Automatically save routes as you create them"
						left={props => <List.Icon {...props} icon="content-save-auto" />}
						right={() => (
							<Switch
								value={preferences.autoSaveRoutes}
								onValueChange={(value) => updatePreference('autoSaveRoutes', value)}
							/>
						)}
					/>
				</Card.Content>
			</Card>

			<View style={styles.bottomSpacer} />
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	section: {
		margin: 16,
		marginBottom: 8,
	},
	sectionTitle: {
		marginBottom: 16,
		fontWeight: '600',
	},
	subsectionTitle: {
		marginTop: 8,
		marginBottom: 8,
		marginLeft: 16,
	},
	divider: {
		marginVertical: 16,
	},
	bottomSpacer: {
		height: 32,
	},
	textSizeContainer: {
		paddingHorizontal: 16,
		paddingVertical: 8,
	},
	textSizeHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 12,
	},
	textSizeTextContainer: {
		marginLeft: 16,
		flex: 1,
	},
	textSizeButtons: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		gap: 8,
	},
	textSizeButton: {
		flex: 1,
		aspectRatio: 1,
		borderRadius: 12,
		borderWidth: 2,
		alignItems: 'center',
		justifyContent: 'center',
	},
});

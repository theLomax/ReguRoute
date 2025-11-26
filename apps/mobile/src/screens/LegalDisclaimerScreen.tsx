import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from 'react-native-paper';
import { Text } from '../components';

export default function LegalDisclaimerScreen() {
	const theme = useTheme();

	const styles = React.useMemo(() => StyleSheet.create({
		container: {
			flex: 1,
			backgroundColor: theme.colors.background,
		},
		content: {
			padding: 24,
		},
		title: {
			fontSize: 28,
			fontWeight: 'bold',
			color: theme.colors.onSurface,
			marginBottom: 24,
		},
		sectionTitle: {
			fontSize: 18,
			fontWeight: '600',
			color: theme.colors.onSurface,
			marginTop: 20,
			marginBottom: 8,
		},
		paragraph: {
			fontSize: 16,
			color: theme.colors.onSurfaceVariant,
			lineHeight: 24,
			marginBottom: 12,
		},
	}), [theme]);

	return (
		<ScrollView style={styles.container}>
			<View style={styles.content}>
				<Text style={styles.title}>Legal Disclaimer</Text>

				<Text style={styles.sectionTitle}>General Information</Text>
				<Text style={styles.paragraph}>
					ReguRoute provides information about firearms regulations for informational purposes only.
					This app is not a substitute for professional legal advice.
				</Text>

				<Text style={styles.sectionTitle}>Accuracy of Information</Text>
				<Text style={styles.paragraph}>
					While we strive to maintain accurate and up-to-date information about firearms regulations,
					laws change frequently and vary by jurisdiction. Users are responsible for verifying all
					information with appropriate legal authorities.
				</Text>

				<Text style={styles.sectionTitle}>No Legal Advice</Text>
				<Text style={styles.paragraph}>
					The information provided by ReguRoute does not constitute legal advice. Users should
					consult with qualified legal professionals regarding their specific circumstances.
				</Text>

				<Text style={styles.sectionTitle}>User Responsibility</Text>
				<Text style={styles.paragraph}>
					Users are solely responsible for complying with all applicable federal, state, and local
					laws regarding firearms transportation, possession, and use.
				</Text>

				<Text style={styles.sectionTitle}>Limitation of Liability</Text>
				<Text style={styles.paragraph}>
					ReguRoute and its developers are not liable for any damages, penalties, or legal issues
					arising from the use of this application or reliance on the information provided.
				</Text>
			</View>
		</ScrollView>
	);
}

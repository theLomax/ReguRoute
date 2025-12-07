
### How to link to new screen content

Here's how to add a Privacy Policy screen following the same structure:

#### Step-by-Step Guide
##### 1. Create the Privacy Policy Screen
Create `src/screens/PrivacyPolicyScreen.tsx`:
```tsx
import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from 'react-native-paper';
import { Text } from '../components';

export default function PrivacyPolicyScreen() {
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
				<Text style={styles.title}>Privacy Policy</Text>

				<Text style={styles.sectionTitle}>Information We Collect</Text>
				<Text style={styles.paragraph}>
					ReguRoute collects minimal information necessary to provide our services.
					We store your email address for account authentication and your route
					preferences locally on your device.
				</Text>

				<Text style={styles.sectionTitle}>How We Use Your Information</Text>
				<Text style={styles.paragraph}>
					Your information is used solely to provide route planning services and
					ensure accurate firearms regulation information for your travels.
				</Text>

				<Text style={styles.sectionTitle}>Data Storage</Text>
				<Text style={styles.paragraph}>
					Most data is stored locally on your device. Account credentials are
					securely stored and encrypted.
				</Text>

				<Text style={styles.sectionTitle}>Third-Party Services</Text>
				<Text style={styles.paragraph}>
					We use mapping services to provide route information. These services
					may collect anonymous usage data according to their own privacy policies.
				</Text>

				<Text style={styles.sectionTitle}>Your Rights</Text>
				<Text style={styles.paragraph}>
					You have the right to access, modify, or delete your account data at
					any time through the app settings.
				</Text>
			</View>
		</ScrollView>
	);
}
```

##### 2. Export the Screen
Add to src/screens/index.ts:
```tsx
export { default as LoginScreen } from './LoginScreen';
export { default as RegisterScreen } from './RegisterScreen';
export { default as HomeScreen } from './HomeScreen';
export { default as RoutePlanScreen } from './RoutePlanScreen';
export { default as RouteDetailScreen } from './RouteDetailScreen';
export { default as CargoProfileScreen } from './CargoProfileScreen';
export { default as AccountScreen } from './AccountScreen';
export { default as LegalDisclaimerScreen } from './LegalDisclaimerScreen';
export { default as PreferencesScreen } from './PreferencesScreen';
```
>ADD THIS:
```tsx
export { default as PrivacyPolicyScreen } from './PrivacyPolicyScreen';
```

##### 3. Add Route to Navigation
Update `src/navigation/MainStack.tsx`:
a) Add to imports:
```tsx
import { RouteDetailScreen, LegalDisclaimerScreen, PreferencesScreen, PrivacyPolicyScreen } from '../screens';
```
b) Add to type definition:
```jsx
export type MainStackParamList = {
	MainTabs: undefined;
	RouteDetail: { routeId: string };
	LegalDisclaimer: undefined;
	Preferences: undefined;
	PrivacyPolicy: undefined;  // ADD THIS
};
```
c) Add screen to navigator (after the other screens):
```tsx
<Stack.Screen
	name="PrivacyPolicy"
	component={PrivacyPolicyScreen}
	options={{ title: 'Privacy Policy' }}
/>
```
##### 4. Link from Account Screen
Update src/screens/AccountScreen.tsx:112-114 to add navigation:
```tsx
<TouchableOpacity 
	style={styles.menuItem}
	onPress={() => navigation.navigate('PrivacyPolicy')}
>
	<Text style={styles.menuText}>Privacy Policy</Text>
</TouchableOpacity>
```

##### Summary of the Pattern:
Create screen component in `src/screens/`
Export from `src/screens/index.ts`
Add type + import + Screen to MainStack.tsx
Add onPress navigation handler in AccountScreen.tsx
You can follow this same pattern to add Terms of Service as well!
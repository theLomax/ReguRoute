import { useState } from 'react';
import {
	View,
	Text,
	TextInput,
	TouchableOpacity,
	StyleSheet,
	KeyboardAvoidingView,
	Platform,
	ActivityIndicator,
	Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { AuthStackParamList } from '../navigation';
import { useAuth, ApiError } from '../contexts';

type RegisterNavigationProp = StackNavigationProp<AuthStackParamList, 'Register'>;

export default function RegisterScreen() {
	const navigation = useNavigation<RegisterNavigationProp>();
	const { register } = useAuth();

	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [isLoading, setIsLoading] = useState(false);

	const handleRegister = async () => {
		if (!email.trim() || !password || !confirmPassword) {
			Alert.alert('Error', 'Please fill in all fields');
			return;
		}

		if (password.length < 8) {
			Alert.alert('Error', 'Password must be at least 8 characters');
			return;
		}

		if (password !== confirmPassword) {
			Alert.alert('Error', 'Passwords do not match');
			return;
		}

		setIsLoading(true);
		try {
			await register(email.trim(), password);
			// Navigation will happen automatically via auth state change
		} catch (error) {
			const message =
				error instanceof ApiError
					? error.message
					: 'An unexpected error occurred';
			Alert.alert('Registration Failed', message);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<KeyboardAvoidingView
			behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
			style={styles.container}
		>
			<View style={styles.content}>
				<Text style={styles.title}>Create Account</Text>
				<Text style={styles.subtitle}>Join ReguRoute today</Text>

				<View style={styles.form}>
					<TextInput
						style={styles.input}
						placeholder="Email"
						placeholderTextColor="#999"
						value={email}
						onChangeText={setEmail}
						autoCapitalize="none"
						autoComplete="email"
						keyboardType="email-address"
						editable={!isLoading}
					/>

					<TextInput
						style={styles.input}
						placeholder="Password (min 8 characters)"
						placeholderTextColor="#999"
						value={password}
						onChangeText={setPassword}
						secureTextEntry
						autoComplete="new-password"
						editable={!isLoading}
					/>

					<TextInput
						style={styles.input}
						placeholder="Confirm Password"
						placeholderTextColor="#999"
						value={confirmPassword}
						onChangeText={setConfirmPassword}
						secureTextEntry
						autoComplete="new-password"
						editable={!isLoading}
					/>

					<TouchableOpacity
						style={[styles.button, isLoading && styles.buttonDisabled]}
						onPress={handleRegister}
						disabled={isLoading}
					>
						{isLoading ? (
							<ActivityIndicator color="#fff" />
						) : (
							<Text style={styles.buttonText}>Create Account</Text>
						)}
					</TouchableOpacity>
				</View>

				<TouchableOpacity
					style={styles.linkButton}
					onPress={() => navigation.goBack()}
					disabled={isLoading}
				>
					<Text style={styles.linkText}>
						Already have an account? <Text style={styles.linkTextBold}>Sign In</Text>
					</Text>
				</TouchableOpacity>
			</View>
		</KeyboardAvoidingView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#f5f5f5',
	},
	content: {
		flex: 1,
		justifyContent: 'center',
		paddingHorizontal: 24,
	},
	title: {
		fontSize: 36,
		fontWeight: 'bold',
		color: '#1a1a1a',
		textAlign: 'center',
		marginBottom: 8,
	},
	subtitle: {
		fontSize: 16,
		color: '#666',
		textAlign: 'center',
		marginBottom: 48,
	},
	form: {
		gap: 16,
	},
	input: {
		backgroundColor: '#fff',
		borderRadius: 12,
		paddingHorizontal: 16,
		paddingVertical: 14,
		fontSize: 16,
		borderWidth: 1,
		borderColor: '#e0e0e0',
		color: '#1a1a1a',
	},
	button: {
		backgroundColor: '#2563eb',
		borderRadius: 12,
		paddingVertical: 16,
		alignItems: 'center',
		marginTop: 8,
	},
	buttonDisabled: {
		opacity: 0.7,
	},
	buttonText: {
		color: '#fff',
		fontSize: 18,
		fontWeight: '600',
	},
	linkButton: {
		marginTop: 24,
		alignItems: 'center',
	},
	linkText: {
		fontSize: 15,
		color: '#666',
	},
	linkTextBold: {
		color: '#2563eb',
		fontWeight: '600',
	},
});

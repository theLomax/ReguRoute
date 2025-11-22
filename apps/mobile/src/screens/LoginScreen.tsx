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

type LoginNavigationProp = StackNavigationProp<AuthStackParamList, 'Login'>;

export default function LoginScreen() {
	const navigation = useNavigation<LoginNavigationProp>();
	const { login } = useAuth();

	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [isLoading, setIsLoading] = useState(false);

	const handleLogin = async () => {
		if (!email.trim() || !password) {
			Alert.alert('Error', 'Please enter email and password');
			return;
		}

		setIsLoading(true);
		try {
			await login(email.trim(), password);
			// Navigation will happen automatically via auth state change
		} catch (error) {
			const message =
				error instanceof ApiError
					? error.message
					: 'An unexpected error occurred';
			Alert.alert('Login Failed', message);
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
				<Text style={styles.title}>ReguRoute</Text>
				<Text style={styles.subtitle}>Plan compliant travel routes</Text>

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
						placeholder="Password"
						placeholderTextColor="#999"
						value={password}
						onChangeText={setPassword}
						secureTextEntry
						autoComplete="password"
						editable={!isLoading}
					/>

					<TouchableOpacity
						style={[styles.button, isLoading && styles.buttonDisabled]}
						onPress={handleLogin}
						disabled={isLoading}
					>
						{isLoading ? (
							<ActivityIndicator color="#fff" />
						) : (
							<Text style={styles.buttonText}>Sign In</Text>
						)}
					</TouchableOpacity>
				</View>

				<TouchableOpacity
					style={styles.linkButton}
					onPress={() => navigation.navigate('Register')}
					disabled={isLoading}
				>
					<Text style={styles.linkText}>
						Don't have an account? <Text style={styles.linkTextBold}>Sign Up</Text>
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

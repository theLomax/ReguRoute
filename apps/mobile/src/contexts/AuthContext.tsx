import {
	createContext,
	useContext,
	useState,
	useEffect,
	useCallback,
	type ReactNode,
} from 'react';
import * as SecureStore from 'expo-secure-store';
import type { User } from '@reguroute/types';
import { authApi, ApiError } from '../api';

const TOKEN_KEY = 'auth_token';

interface AuthState {
	user: User | null;
	token: string | null;
	isLoading: boolean;
	isAuthenticated: boolean;
}

interface AuthContextValue extends AuthState {
	login: (email: string, password: string) => Promise<void>;
	register: (email: string, password: string) => Promise<void>;
	logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
	const [state, setState] = useState<AuthState>({
		user: null,
		token: null,
		isLoading: true,
		isAuthenticated: false,
	});

	// Load stored token on mount
	useEffect(() => {
		async function loadToken() {
			try {
				const storedToken = await SecureStore.getItemAsync(TOKEN_KEY);
				if (storedToken) {
					// Validate token by fetching user
					const { user } = await authApi.getMe(storedToken);
					setState({
						user,
						token: storedToken,
						isLoading: false,
						isAuthenticated: true,
					});
				} else {
					setState((prev) => ({ ...prev, isLoading: false }));
				}
			} catch {
				// Token invalid or expired
				await SecureStore.deleteItemAsync(TOKEN_KEY);
				setState((prev) => ({ ...prev, isLoading: false }));
			}
		}
		loadToken();
	}, []);

	const login = useCallback(async (email: string, password: string) => {
		const response = await authApi.login({ email, password });
		await SecureStore.setItemAsync(TOKEN_KEY, response.token);
		setState({
			user: response.user,
			token: response.token,
			isLoading: false,
			isAuthenticated: true,
		});
	}, []);

	const register = useCallback(async (email: string, password: string) => {
		const response = await authApi.register({ email, password });
		await SecureStore.setItemAsync(TOKEN_KEY, response.token);
		setState({
			user: response.user,
			token: response.token,
			isLoading: false,
			isAuthenticated: true,
		});
	}, []);

	const logout = useCallback(async () => {
		await SecureStore.deleteItemAsync(TOKEN_KEY);
		setState({
			user: null,
			token: null,
			isLoading: false,
			isAuthenticated: false,
		});
	}, []);

	return (
		<AuthContext.Provider value={{ ...state, login, register, logout }}>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuth() {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error('useAuth must be used within an AuthProvider');
	}
	return context;
}

export { ApiError };

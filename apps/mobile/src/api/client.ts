import { API_BASE_URL } from './config';
import type {
	LoginRequest,
	RegisterRequest,
	AuthResponse,
	User,
} from '@reguroute/types';

class ApiError extends Error {
	constructor(
		public status: number,
		message: string
	) {
		super(message);
		this.name = 'ApiError';
	}
}

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

interface RequestOptions {
	method?: HttpMethod;
	body?: unknown;
	token?: string | null;
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
	const { method = 'GET', body, token } = options;

	const headers: Record<string, string> = {
		'Content-Type': 'application/json',
	};

	if (token) {
		headers['Authorization'] = `Bearer ${token}`;
	}

	const config: RequestInit = {
		method,
		headers,
	};

	if (body) {
		config.body = JSON.stringify(body);
	}

	const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

	if (!response.ok) {
		const error = await response.json().catch(() => ({ error: 'Unknown error' }));
		throw new ApiError(response.status, error.error || 'Request failed');
	}

	return response.json();
}

// Auth API
export const authApi = {
	login: (data: LoginRequest): Promise<AuthResponse> =>
		request('/auth/login', { method: 'POST', body: data }),

	register: (data: RegisterRequest): Promise<AuthResponse> =>
		request('/auth/register', { method: 'POST', body: data }),

	getMe: (token: string): Promise<{ user: User }> =>
		request('/auth/me', { token }),
};

export { ApiError };

import { API_BASE_URL } from './config';
import type {
	LoginRequest,
	RegisterRequest,
	AuthResponse,
	User,
	Route,
	CreateRouteRequest,
	CalculateRouteRequest,
	CalculateRouteResponse,
	Equipment,
	CreateEquipmentRequest,
	UpdateEquipmentRequest,
	CargoProfile,
	AvoidancePolygonsResponse,
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

// Routes API
export const routesApi = {
	getAll: (token: string): Promise<{ routes: Route[] }> =>
		request('/routes', { token }),

	getById: (token: string, id: string): Promise<{ route: Route }> =>
		request(`/routes/${id}`, { token }),

	create: (token: string, data: CreateRouteRequest): Promise<{ route: Route }> =>
		request('/routes', { method: 'POST', body: data, token }),

	update: (token: string, id: string, data: Partial<CreateRouteRequest>): Promise<{ route: Route }> =>
		request(`/routes/${id}`, { method: 'PATCH', body: data, token }),

	delete: (token: string, id: string): Promise<void> =>
		request(`/routes/${id}`, { method: 'DELETE', token }),

	calculate: (data: CalculateRouteRequest): Promise<CalculateRouteResponse> =>
		request('/calculate', { method: 'POST', body: data }),
};

// Equipment API
export const equipmentApi = {
	getAll: (token: string): Promise<{ equipment: Equipment[] }> =>
		request('/equipment', { token }),

	getById: (token: string, id: string): Promise<{ equipment: Equipment }> =>
		request(`/equipment/${id}`, { token }),

	getDefault: (token: string): Promise<{ equipment: Equipment | null }> =>
		request('/equipment/default', { token }),

	create: (token: string, data: CreateEquipmentRequest): Promise<{ equipment: Equipment }> =>
		request('/equipment', { method: 'POST', body: data, token }),

	update: (token: string, id: string, data: UpdateEquipmentRequest): Promise<{ equipment: Equipment }> =>
		request(`/equipment/${id}`, { method: 'PUT', body: data, token }),

	delete: (token: string, id: string): Promise<{ success: boolean; id: string }> =>
		request(`/equipment/${id}`, { method: 'DELETE', token }),
};

// Analyze API
export const analyzeApi = {
	getAvoidancePolygons: (cargoProfile: CargoProfile): Promise<AvoidancePolygonsResponse> =>
		request('/analyze/avoidance', { method: 'POST', body: { cargo_profile: cargoProfile } }),
};

export { ApiError };

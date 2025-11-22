import {
	createContext,
	useContext,
	useState,
	useCallback,
	type ReactNode,
} from 'react';
import type { Route, CreateRouteRequest } from '@reguroute/types';
import { routesApi } from '../api';
import { useAuth } from './AuthContext';

interface RoutesState {
	routes: Route[];
	isLoading: boolean;
	error: string | null;
}

interface RoutesContextValue extends RoutesState {
	fetchRoutes: () => Promise<void>;
	getRoute: (id: string) => Promise<Route | null>;
	createRoute: (data: CreateRouteRequest) => Promise<Route>;
	updateRoute: (id: string, data: Partial<CreateRouteRequest>) => Promise<Route>;
	deleteRoute: (id: string) => Promise<void>;
	clearError: () => void;
}

const RoutesContext = createContext<RoutesContextValue | null>(null);

export function RoutesProvider({ children }: { children: ReactNode }) {
	const { token } = useAuth();
	const [state, setState] = useState<RoutesState>({
		routes: [],
		isLoading: false,
		error: null,
	});

	const fetchRoutes = useCallback(async () => {
		if (!token) return;

		setState((prev) => ({ ...prev, isLoading: true, error: null }));
		try {
			const { routes } = await routesApi.getAll(token);
			setState({ routes, isLoading: false, error: null });
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Failed to fetch routes';
			setState((prev) => ({ ...prev, isLoading: false, error: message }));
		}
	}, [token]);

	const getRoute = useCallback(async (id: string): Promise<Route | null> => {
		if (!token) return null;

		try {
			const { route } = await routesApi.getById(token, id);
			return route;
		} catch {
			return null;
		}
	}, [token]);

	const createRoute = useCallback(async (data: CreateRouteRequest): Promise<Route> => {
		if (!token) throw new Error('Not authenticated');

		const { route } = await routesApi.create(token, data);
		setState((prev) => ({
			...prev,
			routes: [route, ...prev.routes],
		}));
		return route;
	}, [token]);

	const updateRoute = useCallback(async (id: string, data: Partial<CreateRouteRequest>): Promise<Route> => {
		if (!token) throw new Error('Not authenticated');

		const { route } = await routesApi.update(token, id, data);
		setState((prev) => ({
			...prev,
			routes: prev.routes.map((r) => (r.id === id ? route : r)),
		}));
		return route;
	}, [token]);

	const deleteRoute = useCallback(async (id: string): Promise<void> => {
		if (!token) throw new Error('Not authenticated');

		await routesApi.delete(token, id);
		setState((prev) => ({
			...prev,
			routes: prev.routes.filter((r) => r.id !== id),
		}));
	}, [token]);

	const clearError = useCallback(() => {
		setState((prev) => ({ ...prev, error: null }));
	}, []);

	return (
		<RoutesContext.Provider
			value={{
				...state,
				fetchRoutes,
				getRoute,
				createRoute,
				updateRoute,
				deleteRoute,
				clearError,
			}}
		>
			{children}
		</RoutesContext.Provider>
	);
}

export function useRoutes() {
	const context = useContext(RoutesContext);
	if (!context) {
		throw new Error('useRoutes must be used within a RoutesProvider');
	}
	return context;
}

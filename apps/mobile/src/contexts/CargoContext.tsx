import {
	createContext,
	useContext,
	useState,
	useCallback,
	useEffect,
	type ReactNode,
} from 'react';
import * as SecureStore from 'expo-secure-store';
import type { CargoProfile, FirearmType } from '@reguroute/types';

const CARGO_PROFILE_KEY = 'cargo_profile';

const DEFAULT_CARGO_PROFILE: CargoProfile = {
	has_firearms: false,
	firearm_types: [],
	has_concealed_carry_permit: false,
	permit_states: [],
	magazine_capacity: undefined,
	has_assault_weapon: false,
};

interface CargoContextValue {
	cargoProfile: CargoProfile;
	isLoading: boolean;
	updateCargoProfile: (updates: Partial<CargoProfile>) => Promise<void>;
	toggleFirearmType: (type: FirearmType) => Promise<void>;
	togglePermitState: (state: string) => Promise<void>;
	resetCargoProfile: () => Promise<void>;
}

const CargoContext = createContext<CargoContextValue | null>(null);

export function CargoProvider({ children }: { children: ReactNode }) {
	const [cargoProfile, setCargoProfile] = useState<CargoProfile>(DEFAULT_CARGO_PROFILE);
	const [isLoading, setIsLoading] = useState(true);

	// Load stored cargo profile on mount
	useEffect(() => {
		async function loadCargoProfile() {
			try {
				const stored = await SecureStore.getItemAsync(CARGO_PROFILE_KEY);
				if (stored) {
					const parsed = JSON.parse(stored) as CargoProfile;
					setCargoProfile({ ...DEFAULT_CARGO_PROFILE, ...parsed });
				}
			} catch (error) {
				console.error('Failed to load cargo profile:', error);
			} finally {
				setIsLoading(false);
			}
		}
		loadCargoProfile();
	}, []);

	const saveCargoProfile = useCallback(async (profile: CargoProfile) => {
		await SecureStore.setItemAsync(CARGO_PROFILE_KEY, JSON.stringify(profile));
		setCargoProfile(profile);
	}, []);

	const updateCargoProfile = useCallback(async (updates: Partial<CargoProfile>) => {
		const updated = { ...cargoProfile, ...updates };
		await saveCargoProfile(updated);
	}, [cargoProfile, saveCargoProfile]);

	const toggleFirearmType = useCallback(async (type: FirearmType) => {
		const currentTypes = cargoProfile.firearm_types || [];
		const newTypes = currentTypes.includes(type)
			? currentTypes.filter((t) => t !== type)
			: [...currentTypes, type];
		await updateCargoProfile({ firearm_types: newTypes });
	}, [cargoProfile.firearm_types, updateCargoProfile]);

	const togglePermitState = useCallback(async (state: string) => {
		const currentStates = cargoProfile.permit_states || [];
		const newStates = currentStates.includes(state)
			? currentStates.filter((s) => s !== state)
			: [...currentStates, state];
		await updateCargoProfile({ permit_states: newStates });
	}, [cargoProfile.permit_states, updateCargoProfile]);

	const resetCargoProfile = useCallback(async () => {
		await saveCargoProfile(DEFAULT_CARGO_PROFILE);
	}, [saveCargoProfile]);

	return (
		<CargoContext.Provider
			value={{
				cargoProfile,
				isLoading,
				updateCargoProfile,
				toggleFirearmType,
				togglePermitState,
				resetCargoProfile,
			}}
		>
			{children}
		</CargoContext.Provider>
	);
}

export function useCargo() {
	const context = useContext(CargoContext);
	if (!context) {
		throw new Error('useCargo must be used within a CargoProvider');
	}
	return context;
}

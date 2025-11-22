import { Platform } from 'react-native';

// Android emulator uses 10.0.2.2 to reach host machine's localhost
// iOS simulator uses localhost directly
// Physical devices need the actual IP address
const getBaseUrl = (): string => {
	if (__DEV__) {
		// For development - update this IP when testing on physical device
		if (Platform.OS === 'android') {
			// Use your computer's LAN IP for physical device testing
			return 'http://192.168.5.11:3000';
		}
		return 'http://localhost:3000';
	}
	// Production URL - update when you deploy
	return 'https://api.reguroute.com';
};

export const API_BASE_URL = getBaseUrl();

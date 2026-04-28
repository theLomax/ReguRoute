import { Platform } from 'react-native';

// Android emulator uses 10.0.2.2 to reach host machine's localhost
// iOS simulator uses localhost directly
// Physical devices need the actual IP address
const getBaseUrl = (): string => {
	if (__DEV__) {
		// For tunnel mode or local development, use localhost
		// For physical device testing, update IP address
		return 'http://localhost:3000';
	}
	// Production URL - update when you deploy
	return 'https://api.reguroute.com';
};

export const API_BASE_URL = getBaseUrl();

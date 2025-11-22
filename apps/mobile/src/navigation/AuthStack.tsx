import { createStackNavigator } from '@react-navigation/stack';
import { LoginScreen, RegisterScreen } from '../screens';

export type AuthStackParamList = {
	Login: undefined;
	Register: undefined;
};

const Stack = createStackNavigator<AuthStackParamList>();

export default function AuthStack() {
	return (
		<Stack.Navigator>
			<Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Sign In' }} />
			<Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Create Account' }} />
		</Stack.Navigator>
	);
}

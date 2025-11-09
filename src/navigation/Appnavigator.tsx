import { createStackNavigator } from '@react-navigation/stack';
import React from 'react';
import CreateAccount from '../screens/CreateAccount';
import LoginScreen from '../screens/LoginScreen';
import ClientTabNavigator from './ClientTabNavigator';
import VendorTabNavigator from './VendorTabNavigator';

// Definir los tipos de parámetros para cada pantalla
export type RootStackParamList = {
  Login: undefined;
  CreateAccount: undefined;
  ClientTabs: { user: any };
  VendorTabs: { user: any };
  Profile: { user: any };
  Settings: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  return (
    <Stack.Navigator 
      initialRouteName="Login"
      screenOptions={{
        headerStyle: {
          backgroundColor: '#6200ee',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="Login" 
        component={LoginScreen}
        options={{ 
          headerShown: false,
          title: 'Iniciar Sesión'
        }}
      />
      <Stack.Screen 
        name="CreateAccount" 
        component={CreateAccount}
        options={{ 
          title: 'Crear Cuenta',
          headerShown: true,
        }}
      />
<Stack.Screen 
  name="ClientTabs" 
  component={ClientTabNavigator}
  options={{ 
    headerShown: false,
    title: 'Explorar'
  }}
/>
      <Stack.Screen 
        name="VendorTabs" 
        component={VendorTabNavigator}
        options={{ 
          headerShown: false,
          title: 'Vendedor'
        }}
      />
    </Stack.Navigator>
  );
};

export default AppNavigator;
import { createStackNavigator } from '@react-navigation/stack';
import React from 'react';
import CreateAccount from '../screens/CreateAccount';
import LoginScreen from '../screens/LoginScreen';
import MapLocationPicker from '../screens/MapLocationPicker';
import ClientTabNavigator from './ClientTabNavigator';
import VendorTabNavigator from './VendorTabNavigator';

// Definir tipos de parámetros para cada pantalla
export type RootStackParamList = {
  Login: undefined;
  CreateAccount: undefined;
  MapLocationPicker: {
    onLocationSelected: (location: {
      address: string;
      lat: number;
      lng: number;
    }) => void;
  };
  ClientTabs: { user: any };
  VendorTabs: { user: any };
  Profile: { user: any };
  Settings: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

const AppNavigator: React.FC = () => {
  return (
    <Stack.Navigator 
      initialRouteName="Login"
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#f7fff9' },
      }}
    >
      {/* Pantalla de Login */}
      <Stack.Screen 
        name="Login" 
        component={LoginScreen}
        options={{ 
          headerShown: false,
        }}
      />

      {/* Pantalla de Crear Cuenta */}
      <Stack.Screen 
        name="CreateAccount" 
        component={CreateAccount}
        options={{ 
          headerShown: false,
        }}
      />

      {/* Selector de Ubicación en Mapa */}
      <Stack.Screen 
        name="MapLocationPicker" 
        component={MapLocationPicker}
        options={{ 
          headerShown: false,
          presentation: 'modal',
        }}
      />

      {/* Tabs de Cliente */}
      <Stack.Screen 
        name="ClientTabs" 
        component={ClientTabNavigator}
        options={{ 
          headerShown: false,
        }}
      />

      {/* Tabs de Vendedor */}
      <Stack.Screen 
        name="VendorTabs" 
        component={VendorTabNavigator}
        options={{ 
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
};

export default AppNavigator;
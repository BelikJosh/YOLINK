// navigation/VendorTabNavigator.tsx
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';
import { Text, View } from 'react-native';
import CatalogueScreenVendor from '../screens/CatalogueScreenVendor'; // Importa el componente real
import CobrarScreen from '../screens/CobrarScreen';
import HomeScreenVendor from '../screens/HomeScreenVendor';
import ProfileScreen from '../screens/ProfileScreen';
import { VendorTabParamList } from './types';

// Screens placeholder con componentes básicos (solo los que están en desarrollo)
const MakeAcountScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>Cobrar - En desarrollo</Text>
  </View>
);

const SalesScreenVendor = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>Ventas - En desarrollo</Text>
  </View>
);

const Tab = createBottomTabNavigator<VendorTabParamList>();

// Componente temporal para iconos de texto
const TextIcon = ({ emoji, focused }: { emoji: string, focused: boolean }) => (
  <Text style={{ fontSize: 20, color: focused ? '#6200ee' : '#999' }}>
    {emoji}
  </Text>
);

const VendorTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#6200ee',
        tabBarInactiveTintColor: '#999',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#f0f0f0',
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        headerStyle: {
          backgroundColor: '#6200ee',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Tab.Screen 
        name="HomeVendor" 
        component={HomeScreenVendor}
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => (
            <TextIcon emoji="🏠" focused={focused} />
          ),
        }}
      />
      <Tab.Screen 
        name="Catalogue" 
        component={CatalogueScreenVendor} // Usa el componente importado
        options={{
          title: 'Catálogue',
          tabBarIcon: ({ focused }) => (
            <TextIcon emoji="📦" focused={focused} />
          ),
        }}
      />
      <Tab.Screen 
  name="MakeCount" 
  component={CobrarScreen}
  options={{
    title: 'Make Count',
    tabBarIcon: ({ focused }) => (
      <TextIcon emoji="💰" focused={focused} />
    ),
  }}
/>
      <Tab.Screen 
        name="Sales" 
        component={SalesScreenVendor}
        options={{
          title: 'Sales',
          tabBarIcon: ({ focused }) => (
            <TextIcon emoji="📊" focused={focused} />
          ),
        }}
      />
      <Tab.Screen 
        name="ProfileVendor" 
        component={ProfileScreen}
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => (
            <TextIcon emoji="👤" focused={focused} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default VendorTabNavigator;
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';
import { Text, View } from 'react-native'; // Añade View
import HomeScreenVendor from '../screens/HomeScreenVendor';
import ProfileScreen from '../screens/ProfileScreen';
import { VendorTabParamList } from './types';

// Screens placeholder con componentes básicos
const CatalogueScreenVendor = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>Catálogo - En desarrollo</Text>
  </View>
);

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
          title: 'Inicio',
          tabBarIcon: ({ focused }) => (
            <TextIcon emoji="🏠" focused={focused} />
          ),
        }}
      />
      <Tab.Screen 
        name="Catalogue" 
        component={CatalogueScreenVendor}
        options={{
          title: 'Catálogo',
          tabBarIcon: ({ focused }) => (
            <TextIcon emoji="📦" focused={focused} />
          ),
        }}
      />
      <Tab.Screen 
        name="MakeCount" 
        component={MakeAcountScreen}
        options={{
          title: 'Cobrar',
          tabBarIcon: ({ focused }) => (
            <TextIcon emoji="💰" focused={focused} />
          ),
        }}
      />
      <Tab.Screen 
        name="Sales" 
        component={SalesScreenVendor}
        options={{
          title: 'Ventas',
          tabBarIcon: ({ focused }) => (
            <TextIcon emoji="📊" focused={focused} />
          ),
        }}
      />
      <Tab.Screen 
        name="ProfileVendor" 
        component={ProfileScreen}
        options={{
          title: 'Perfil',
          tabBarIcon: ({ focused }) => (
            <TextIcon emoji="👤" focused={focused} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default VendorTabNavigator;
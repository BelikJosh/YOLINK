import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';
import { Text, View } from 'react-native'; // Añade esta importación
import HomeScreenClient from '../screens/HomeScreenClient';
import ProfileScreen from '../screens/ProfileScreen';
import { ClientTabParamList } from './types';

// Screens placeholder
const NearStoresScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>Tiendas Cercanas - En desarrollo</Text>
  </View>
);

const ScannQRScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>Escanear QR - En desarrollo</Text>
  </View>
);

const FavoritesStoresScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>Favoritos - En desarrollo</Text>
  </View>
);

const Tab = createBottomTabNavigator<ClientTabParamList>();

// Componente temporal para iconos de texto
const TextIcon = ({ emoji, focused }: { emoji: string, focused: boolean }) => (
  <Text style={{ fontSize: 20, color: focused ? '#6200ee' : '#999' }}>
    {emoji}
  </Text>
);

const ClientTabNavigator = () => {
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
        name="Explore" 
        component={HomeScreenClient}
        options={{
          title: 'Explorar',
          tabBarIcon: ({ focused }) => (
            <TextIcon emoji="🔍" focused={focused} />
          ),
        }}
      />
      <Tab.Screen 
        name="Near" 
        component={NearStoresScreen}
        options={{
          title: 'Cercanos',
          tabBarIcon: ({ focused }) => (
            <TextIcon emoji="📍" focused={focused} />
          ),
        }}
      />
      <Tab.Screen 
        name="Scann" 
        component={ScannQRScreen}
        options={{
          title: 'Escanear',
          tabBarIcon: ({ focused }) => (
            <TextIcon emoji="📷" focused={focused} />
          ),
        }}
      />
      <Tab.Screen 
        name="Favorites" 
        component={FavoritesStoresScreen}
        options={{
          title: 'Favoritos',
          tabBarIcon: ({ focused }) => (
            <TextIcon emoji="⭐" focused={focused} />
          ),
        }}
      />
      <Tab.Screen 
        name="ProfileClient" 
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

export default ClientTabNavigator;
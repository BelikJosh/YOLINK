// navigation/ClientTabNavigator.tsx
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';
import { Text } from 'react-native';
import FavoritesStoresScreen from '../screens/FavoritesStoresScreen';
import HomeScreenClient from '../screens/HomeScreenClient';
import NearStoresScreen from '../screens/NearStoresScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ScannQRScreen from '../screens/ScannQRScreen';
import { ClientTabParamList } from './types';

const Tab = createBottomTabNavigator<ClientTabParamList>();

// Componente para iconos de texto
const TextIcon = ({ emoji, focused }: { emoji: string, focused: boolean }) => (
  <Text style={{ fontSize: 20, color: focused ? '#6200ee' : '#999' }}>
    {emoji}
  </Text>
);

// Componentes wrapper para pasar props
const HomeScreenClientWrapper = (props: any) => <HomeScreenClient {...props} />;
const ProfileScreenWrapper = (props: any) => <ProfileScreen {...props} />;
const NearStoresScreenWrapper = (props: any) => <NearStoresScreen {...props} />;
const FavoritesStoresScreenWrapper = (props: any) => <FavoritesStoresScreen {...props} />;

const ClientTabNavigator = ({ route }: any) => {
  const user = route?.params?.user;

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
      initialParams={{ user }}
    >
      <Tab.Screen
        name="Explore"
        component={HomeScreenClientWrapper}
        initialParams={{ user }}
        options={{
          title: 'Explorar',
          tabBarIcon: ({ focused }) => <TextIcon emoji="🔍" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Near"
        component={NearStoresScreenWrapper}
        options={{
          title: 'Cercanos',
          tabBarIcon: ({ focused }) => <TextIcon emoji="📍" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Scann"
        component={ScannQRScreen}
        options={{
          title: 'Escanear',
          tabBarIcon: ({ focused }) => <TextIcon emoji="📷" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Favorites"
        component={FavoritesStoresScreenWrapper}
        options={{
          title: 'Favoritos',
          tabBarIcon: ({ focused }) => <TextIcon emoji="⭐" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="ProfileClient"
        component={ProfileScreenWrapper}
        initialParams={{ user }}
        options={{
          title: 'Perfil',
          tabBarIcon: ({ focused }) => <TextIcon emoji="👤" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
};

export default ClientTabNavigator;
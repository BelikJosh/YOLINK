import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';
import { Text } from 'react-native';
import HomeScreenClient from '../screens/HomeScreenClient';
import ProfileScreen from '../screens/ProfileScreen';
import ScannQRScreen from '../screens/ScannQRScreen';
import { ClientTabParamList } from './types';

// Screens placeholder
const NearStoresScreen = () => (
  <Text style={{ textAlign: 'center', marginTop: 20 }}>Tiendas Cercanas - En desarrollo</Text>
);

const FavoritesStoresScreen = () => (
  <Text style={{ textAlign: 'center', marginTop: 20 }}>Favoritos - En desarrollo</Text>
);

const Tab = createBottomTabNavigator<ClientTabParamList>();

// Componente temporal para iconos de texto
const TextIcon = ({ emoji, focused }: { emoji: string, focused: boolean }) => (
  <Text style={{ fontSize: 20, color: focused ? '#6200ee' : '#999' }}>
    {emoji}
  </Text>
);

// Componente wrapper para ProfileScreen que pasa navigation y route
const ProfileScreenWrapper = (props: any) => {
  return <ProfileScreen {...props} />;
};

// Componente wrapper para HomeScreenClient
const HomeScreenClientWrapper = (props: any) => {
  return <HomeScreenClient {...props} />;
};

const ClientTabNavigator = ({ route }: any) => {
  // Obtener el usuario de los parámetros de navegación
  const user = route?.params?.user;

  console.log('👤 Usuario en ClientTabNavigator:', user);

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
      initialParams={{ user }} // Pasa el usuario como parámetro inicial a todos los screens
    >
      <Tab.Screen
        name="Explore"
        component={HomeScreenClientWrapper}
        initialParams={{ user }}
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
        component={ProfileScreenWrapper}
        initialParams={{ user }}
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
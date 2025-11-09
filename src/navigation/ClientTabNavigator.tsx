import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';
import FavoritesStoresScreen from '../screens/FavoritesStoresScreen';
import HomeScreenClient from '../screens/HomeScreenClient';
import NearStoresScreen from '../screens/NearStoresScreen';
import ProfileScreenClient from '../screens/ProfileScreenClient';
import ScannQRScreen from '../screens/ScannQRScreen';
import { ClientTabParamList } from './types';

const Tab = createBottomTabNavigator<ClientTabParamList>();

const ClientTabNavigator = ({ route }: any) => {
  const user = route?.params?.user;

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#4ecdc4',
        tabBarInactiveTintColor: '#95a5a6',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 2,
          borderTopColor: '#c1f9e1',
          height: 65,
          paddingBottom: 10,
          paddingTop: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 10,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        headerStyle: {
          backgroundColor: '#ffffff',
          borderBottomWidth: 2,
          borderBottomColor: '#c1f9e1',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 4,
        },
        headerTintColor: '#1a535c',
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 20,
        },
        headerTitleAlign: 'center',
      }}
      initialParams={{ user }}
    >
      <Tab.Screen
        name="Explore"
        component={HomeScreenClient}
        initialParams={{ user }}
        options={{
          title: 'Explore',
          headerShown: false,
          tabBarIcon: ({ focused, size }) => (
            <Ionicons 
              name={focused ? 'map' : 'map-outline'} 
              size={size} 
              color={focused ? '#4ecdc4' : '#95a5a6'} 
            />
          ),
        }}
      />
      <Tab.Screen
        name="Near"
        component={NearStoresScreen}
        initialParams={{ user }}
        options={{
          title: 'Near',
          tabBarIcon: ({ focused, size }) => (
            <Ionicons 
              name={focused ? 'location' : 'location-outline'} 
              size={size} 
              color={focused ? '#4ecdc4' : '#95a5a6'} 
            />
          ),
        }}
      />
      <Tab.Screen
        name="Scann"
        component={ScannQRScreen}
        initialParams={{ user }}
        options={{
          title: 'Pay',
          tabBarIcon: ({ focused, size }) => (
            <Ionicons 
              name={focused ? 'qr-code' : 'qr-code-outline'} 
              size={size + 4} 
              color={focused ? '#ff6b6b' : '#95a5a6'} 
            />
          ),
          tabBarActiveTintColor: '#ff6b6b',
        }}
      />
      <Tab.Screen
        name="Favorites"
        component={FavoritesStoresScreen}
        initialParams={{ user }}
        options={{
          title: 'Favorites',
          tabBarIcon: ({ focused, size }) => (
            <Ionicons 
              name={focused ? 'heart' : 'heart-outline'} 
              size={size} 
              color={focused ? '#ff6b6b' : '#95a5a6'} 
            />
          ),
          tabBarActiveTintColor: '#ff6b6b',
        }}
      />
      <Tab.Screen
        name="ProfileClient"
        component={ProfileScreenClient}
        initialParams={{ user }}
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused, size }) => (
            <Ionicons 
              name={focused ? 'person' : 'person-outline'} 
              size={size} 
              color={focused ? '#4ecdc4' : '#95a5a6'} 
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default ClientTabNavigator;

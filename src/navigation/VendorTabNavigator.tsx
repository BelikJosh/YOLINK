// navigation/VendorTabNavigator.tsx
import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';
import CatalogueScreenVendor from '../screens/CatalogueScreenVendor';
import CobrarScreen from '../screens/CobrarScreen';
import HomeScreenVendor from '../screens/HomeScreenVendor';
import ProfileScreen from '../screens/ProfileScreen';
import { VendorTabParamList } from './types';

const Tab = createBottomTabNavigator<VendorTabParamList>();

const VendorTabNavigator = ({ route }: any) => {
  const user = route?.params?.user;

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#4ecdc4', // Turquesa
        tabBarInactiveTintColor: '#95a5a6', // Gris
        tabBarStyle: {
          backgroundColor: '#ffffff', // Blanco
          borderTopWidth: 2,
          borderTopColor: '#c1f9e1', // Verde menta
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
        headerTintColor: '#1a535c', // Azul oscuro
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 20,
        },
        headerTitleAlign: 'center',
      }}
      initialParams={{ user }}
    >
      {/* INICIO */}
      <Tab.Screen
        name="HomeVendor"
        component={HomeScreenVendor}
        initialParams={{ user }}
        options={{
          title: 'Home',
          headerShown: false,
          tabBarIcon: ({ focused, size }) => (
            <Ionicons
              name={focused ? 'home' : 'home-outline'}
              size={size}
              color={focused ? '#4ecdc4' : '#95a5a6'}
            />
          ),
        }}
      />

      {/* CATÁLOGO */}
      <Tab.Screen
        name="Catalogue"
        component={CatalogueScreenVendor}
        initialParams={{ user }}
        options={{
          title: 'Catalogue',
          tabBarIcon: ({ focused, size }) => (
            <Ionicons
              name={focused ? 'albums' : 'albums-outline'}
              size={size}
              color={focused ? '#4ecdc4' : '#95a5a6'}
            />
          ),
        }}
      />

      {/* COBRAR */}
      <Tab.Screen
        name="MakeCount"
        component={CobrarScreen}
        initialParams={{ user }}
        options={{
          title: 'Make Count',
          tabBarIcon: ({ focused, size }) => (
            <Ionicons
              name={focused ? 'cash' : 'cash-outline'}
              size={size + 3}
              color={focused ? '#ff6b6b' : '#95a5a6'} // Rojo coral para pestaña especial
            />
          ),
          tabBarActiveTintColor: '#ff6b6b', // Rojo coral
        }}
      />

      {/* VENTAS */}
      <Tab.Screen
        name="Sales"
        component={() => (
          <React.Fragment>
            <></>
          </React.Fragment>
        )}
        initialParams={{ user }}
        options={{
          title: 'Sales',
          tabBarIcon: ({ focused, size }) => (
            <Ionicons
              name={focused ? 'stats-chart' : 'stats-chart-outline'}
              size={size}
              color={focused ? '#4ecdc4' : '#95a5a6'}
            />
          ),
        }}
      />

      {/* PERFIL */}
      <Tab.Screen
        name="ProfileVendor"
        component={ProfileScreen}
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

export default VendorTabNavigator;

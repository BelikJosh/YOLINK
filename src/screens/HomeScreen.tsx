// screens/HomeScreen.tsx
import { StackNavigationProp } from '@react-navigation/stack';
import React from 'react';
import { RootStackParamList } from '../navigation/Appnavigator';
import HomeScreenClient from './HomeScreenClient';
import HomeScreenVendor from './HomeScreenVendor';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

type Props = {
  navigation: HomeScreenNavigationProp;
  route?: any;
};

const HomeScreen = ({ navigation, route }: Props) => {
  const user = route?.params?.user;

  // Renderizar pantalla según el tipo de usuario
  if (user?.userType === 'vendor') {
    return <HomeScreenVendor navigation={navigation} route={route} />;
  } else {
    return <HomeScreenClient navigation={navigation} route={route} />;
  }
};

export default HomeScreen;
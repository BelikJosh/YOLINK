import React from 'react';
import { View, Text, Button, StyleSheet, Alert } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/Appnavigator';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

type Props = {
  navigation: HomeScreenNavigationProp;
  route?: any;
};

const HomeScreen = ({ navigation, route }: Props) => {
  // Datos del usuario logueado (vendrían del login)
  const user = route?.params?.user || { name: 'Usuario', role: 'Cliente' };

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que quieres cerrar sesión?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Sí, cerrar',
          onPress: () => navigation.navigate('Login'),
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.welcome}>¡Bienvenido!</Text>
      <Text style={styles.userInfo}>Nombre: {user.name}</Text>
      <Text style={styles.userInfo}>Rol: {user.role}</Text>
      <Text style={styles.userInfo}>Email: {user.email}</Text>

      <View style={styles.buttonContainer}>
        {user.role === 'Vendedor' && (
          <>
            <Button
              title="Gestionar Productos"
              onPress={() => Alert.alert('Vendedor', 'Funcionalidad para vendedores')}
              color="#4CAF50"
            />
            <View style={styles.spacer} />
            <Button
              title="Ver Ventas"
              onPress={() => Alert.alert('Vendedor', 'Panel de ventas')}
              color="#2196F3"
            />
            <View style={styles.spacer} />
          </>
        )}

        {user.role === 'Cliente' && (
          <>
            <Button
              title="Ver Productos"
              onPress={() => Alert.alert('Cliente', 'Catálogo de productos')}
              color="#FF9800"
            />
            <View style={styles.spacer} />
            <Button
              title="Mis Compras"
              onPress={() => Alert.alert('Cliente', 'Historial de compras')}
              color="#9C27B0"
            />
            <View style={styles.spacer} />
          </>
        )}

        <Button
          title="Ir al Perfil"
          onPress={() => navigation.navigate('Profile', { user })}
          color="#6200ee"
        />
        <View style={styles.spacer} />
        <Button
          title="Configuración"
          onPress={() => navigation.navigate('Settings')}
          color="#03dac6"
        />
        <View style={styles.spacer} />
        <Button
          title="Cerrar Sesión"
          onPress={handleLogout}
          color="#f44336"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  welcome: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  userInfo: {
    fontSize: 18,
    marginBottom: 8,
    color: '#666',
  },
  buttonContainer: {
    width: '80%',
    marginTop: 30,
  },
  spacer: {
    height: 12,
  },
});

export default HomeScreen;
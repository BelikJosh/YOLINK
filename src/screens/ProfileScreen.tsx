import React from 'react';
import { View, Text, Button, StyleSheet, ScrollView, Alert } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/Appnavigator';

type ProfileScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Profile'>;
type ProfileScreenRouteProp = RouteProp<RootStackParamList, 'Profile'>;

type Props = {
  navigation: ProfileScreenNavigationProp;
  route: ProfileScreenRouteProp;
};

const ProfileScreen = ({ navigation, route }: Props) => {
  const { user } = route.params;

  const handleEditProfile = () => {
    Alert.alert('Editar Perfil', 'Funcionalidad para editar perfil');
  };

  const handleChangePassword = () => {
    Alert.alert('Cambiar Contraseña', 'Funcionalidad para cambiar contraseña');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mi Perfil</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Información Personal</Text>
        
        <View style={styles.infoRow}>
          <Text style={styles.label}>Nombre:</Text>
          <Text style={styles.value}>{user.name}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.label}>Email:</Text>
          <Text style={styles.value}>{user.email}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.label}>Rol:</Text>
          <Text style={[styles.value, styles.role]}>{user.role}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.label}>ID de Usuario:</Text>
          <Text style={styles.value}>{user.id}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Acciones</Text>
        
        <View style={styles.buttonContainer}>
          <Button
            title="Editar Perfil"
            onPress={handleEditProfile}
            color="#6200ee"
          />
          <View style={styles.spacer} />
          <Button
            title="Cambiar Contraseña"
            onPress={handleChangePassword}
            color="#FF9800"
          />
          <View style={styles.spacer} />
          {user.role === 'Vendedor' && (
            <>
              <Button
                title="Configuración de Vendedor"
                onPress={() => Alert.alert('Vendedor', 'Configuración especial para vendedores')}
                color="#4CAF50"
              />
              <View style={styles.spacer} />
            </>
          )}
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <Button
          title="Volver al Inicio"
          onPress={() => navigation.goBack()}
          color="#757575"
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#6200ee',
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  card: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  label: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  value: {
    fontSize: 16,
    color: '#333',
  },
  role: {
    fontWeight: 'bold',
    color: '#6200ee',
  },
  buttonContainer: {
    marginVertical: 8,
  },
  spacer: {
    height: 8,
  },
});

export default ProfileScreen;
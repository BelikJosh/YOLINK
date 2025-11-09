import { StackNavigationProp } from '@react-navigation/stack';
import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { RootStackParamList } from '../navigation/types'; // Cambia a RootStackParamList

// Cambia el tipo para usar RootStackParamList
type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'VendorTabs'>;

type Props = {
  navigation: HomeScreenNavigationProp;
  route?: any;
};

const HomeScreenVendor = ({ navigation, route }: Props) => {
  const user = route?.params?.user;

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que quieres cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Sí, cerrar', 
          onPress: () => navigation.navigate('Login') // Ahora debería funcionar
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.greeting}>¡Hola, {user?.name}!</Text>
        <Text style={styles.subtitle}>Panel de Vendedor</Text>
        
        {/* Botón de cerrar sesión */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </View>

      {/* Accesos Rápidos */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Accesos Rápidos</Text>
        
        <View style={styles.quickAccessGrid}>
          <View style={styles.quickAccessItem}>
            <Text style={styles.quickAccessTitle}>9.9 BFC</Text>
            <Text style={styles.quickAccessSubtitle}>Cobras:</Text>
            <Text style={styles.quickAccessDescription}>Bluetooth</Text>
          </View>
          
          <View style={styles.quickAccessItem}>
            <Text style={styles.quickAccessTitle}>9.9 BFC</Text>
            <Text style={styles.quickAccessSubtitle}>Agregar:</Text>
            <Text style={styles.quickAccessDescription}>Nuevo Producto</Text>
          </View>
        </View>
      </View>

      {/* Últimas Ventas */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Últimas Ventas</Text>
        
        <View style={styles.salesList}>
          <View style={styles.saleItem}>
            <View style={styles.saleInfo}>
              <Text style={styles.saleProduct}>Huipil bordado</Text>
              <Text style={styles.saleTime}>Hace 10 min</Text>
            </View>
            <Text style={styles.saleAmount}>$450</Text>
          </View>
          
          <View style={styles.saleItem}>
            <View style={styles.saleInfo}>
              <Text style={styles.saleProduct}>Alebrijes x2</Text>
              <Text style={styles.saleTime}>Hace 1 hora</Text>
            </View>
            <Text style={styles.saleAmount}>$200</Text>
          </View>
        </View>
      </View>

      {/* Navegación Inferior */}
      <View style={styles.navigation}>
        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navText}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navText}>Castilla</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navText}>Matea</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navText}>Quart</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navText}>Salsa</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navText}>Perfil</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#667eea',
    padding: 20,
    paddingTop: 50,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#e2e8f0',
    marginBottom: 15,
  },
  logoutButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: 15,
  },
  quickAccessGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickAccessItem: {
    flex: 1,
    backgroundColor: '#f7fafc',
    padding: 15,
    borderRadius: 8,
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  quickAccessTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#667eea',
    marginBottom: 5,
  },
  quickAccessSubtitle: {
    fontSize: 14,
    color: '#4a5568',
    marginBottom: 2,
  },
  quickAccessDescription: {
    fontSize: 12,
    color: '#718096',
  },
  salesList: {
    marginTop: 10,
  },
  saleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  saleInfo: {
    flex: 1,
  },
  saleProduct: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: 4,
  },
  saleTime: {
    fontSize: 12,
    color: '#718096',
  },
  saleAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#48bb78',
  },
  navigation: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
  },
  navText: {
    fontSize: 12,
    color: '#4a5568',
    fontWeight: '500',
  },
});

export default HomeScreenVendor;
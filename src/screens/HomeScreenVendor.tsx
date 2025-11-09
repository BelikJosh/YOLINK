import { StackNavigationProp } from '@react-navigation/stack';
import React, { useState, useEffect } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { RootStackParamList } from '../navigation/types';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'VendorTabs'>;

type Props = {
  navigation: HomeScreenNavigationProp;
  route?: any;
};

const HomeScreenVendor = ({ navigation, route }: Props) => {
  const [user, setUser] = useState<any>(null);
  const [dashboardData, setDashboardData] = useState({
    ventasHoy: 0,
    totalHoy: 0,
    totalProductos: 0
  });

  useEffect(() => {
    cargarUsuario();
  }, []);

  const cargarUsuario = async () => {
    try {
      console.log('🔍 Cargando usuario...');
      const userString = await AsyncStorage.getItem('currentUser');
      console.log('📦 Datos de AsyncStorage:', userString);
      
      if (userString) {
        const userData = JSON.parse(userString);
        console.log('👤 Usuario cargado:', userData);
        console.log('📝 Nombre:', userData.nombre);
        console.log('📝 Descripción:', userData.descripcion);
        setUser(userData);
      }
    } catch (error) {
      console.error('Error cargando usuario:', error);
    }
  };

  useEffect(() => {
    if (user) {
      cargarDashboard();
    }
  }, [user]);

  const cargarDashboard = async () => {
    try {
      setDashboardData({
        ventasHoy: user?.ventasRealizadas || 0,
        totalHoy: user?.totalGanado || 0,
        totalProductos: 42
      });
    } catch (error) {
      console.error('Error cargando dashboard:', error);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que quieres cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Sí, cerrar', 
          onPress: async () => {
            await AsyncStorage.removeItem('currentUser');
            navigation.navigate('Login');
          }
        },
      ]
    );
  };

  const handleCobrar = () => {
    navigation.navigate('Cobrar' as any);
  };

  const handleAgregarProducto = () => {
    navigation.navigate('Catalogue' as any);
  };

  const handleHistorialVentas = () => {
    navigation.navigate('HistorialVentas' as any);
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.greeting}>
          ¡Hola, {user?.nombre || 'Vendedor'}!
        </Text>
        <Text style={styles.subtitle}>
          {user?.descripcion || 'Panel de Vendedor'}
        </Text>
        
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </View>

      {/* Estadísticas del Día */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Estadísticas de Hoy</Text>
        
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, styles.transparentCard]}>
            <MaterialIcons name="attach-money" size={24} color="#48bb78" />
            <Text style={styles.statValue}>${dashboardData.totalHoy.toFixed(2)}</Text>
            <Text style={styles.statLabel}>Dinero Obtenido</Text>
          </View>

          <View style={[styles.statCard, styles.transparentCard]}>
            <MaterialIcons name="shopping-cart" size={24} color="#667eea" />
            <Text style={styles.statValue}>{dashboardData.ventasHoy}</Text>
            <Text style={styles.statLabel}>Ventas Realizadas</Text>
          </View>

          <View style={[styles.statCard, styles.transparentCard]}>
            <MaterialIcons name="inventory" size={24} color="#ed8936" />
            <Text style={styles.statValue}>{dashboardData.totalProductos}</Text>
            <Text style={styles.statLabel}>Productos</Text>
          </View>
        </View>
      </View>

      {/* Accesos Rápidos */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Accesos Rápidos</Text>
        
        <View style={styles.quickAccessGrid}>
          <TouchableOpacity style={styles.quickAccessItem} onPress={handleCobrar}>
            <View style={styles.quickAccessContent}>
              <MaterialIcons name="payment" size={32} color="#667eea" />
              <Text style={styles.quickAccessTitle}>Cobrar</Text>
              <Text style={styles.quickAccessSubtitle}>Generar QR</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickAccessItem} onPress={handleAgregarProducto}>
            <View style={styles.quickAccessContent}>
              <MaterialIcons name="add-circle" size={32} color="#48bb78" />
              <Text style={styles.quickAccessTitle}>Agregar</Text>
              <Text style={styles.quickAccessSubtitle}>Nuevo Producto</Text>
            </View>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.historyButton} onPress={handleHistorialVentas}>
          <MaterialIcons name="history" size={20} color="#4a5568" />
          <Text style={styles.historyButtonText}>Historial de Ventas</Text>
        </TouchableOpacity>
      </View>

      {/* Últimas Ventas */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ventas Recientes</Text>
        
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
    </ScrollView>
  );
};

// Los estilos se mantienen igual...
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
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 15,
    borderRadius: 12,
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.5)',
  },
  transparentCard: {
    backgroundColor: 'rgba(247, 250, 252, 0.7)',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d3748',
    marginVertical: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#718096',
    textAlign: 'center',
  },
  quickAccessGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  quickAccessItem: {
    flex: 1,
    backgroundColor: '#f7fafc',
    padding: 20,
    borderRadius: 12,
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  quickAccessContent: {
    alignItems: 'center',
  },
  quickAccessTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2d3748',
    marginTop: 8,
    marginBottom: 4,
  },
  quickAccessSubtitle: {
    fontSize: 12,
    color: '#718096',
    textAlign: 'center',
  },
  historyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f7fafc',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  historyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4a5568',
    marginLeft: 8,
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
});

export default HomeScreenVendor;
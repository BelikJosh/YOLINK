// src/screens/NearStoresScreen.tsx
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

interface Vendor {
  id: string;
  name: string;
  category: string;
  location: {
    latitude: number;
    longitude: number;
  };
  rating: number;
  description?: string;
  horario?: {
    apertura: string;
    cierre: string;
    dias: string[];
  };
  telefono?: string;
  direccion?: string;
  distance?: number;
}

const NearStoresScreen = ({ route, navigation }: any) => {
  const { nearbyVendors = [], userLocation } = route.params || {};

  const handleVendorPress = (vendor: Vendor) => {
    Alert.alert(
      vendor.name,
      `Distancia: ${vendor.distance?.toFixed(1)} km\n\n${vendor.description || 'Sin descripción'}`,
      [
        { text: 'Cerrar', style: 'cancel' },
        { 
          text: 'Ver en mapa', 
          onPress: () => {
            console.log('Navegando a Explore con vendedor:', vendor.name);
            // Navegar de vuelta al tab de Explore con el vendedor seleccionado
            navigation.navigate('Explore', { 
              vendorToFocus: vendor 
            });
          }
        }
      ]
    );
  };

  const renderVendorItem = ({ item }: { item: Vendor }) => (
    <TouchableOpacity 
      style={styles.vendorItem}
      onPress={() => handleVendorPress(item)}
    >
      <View style={styles.vendorInfo}>
        <Text style={styles.vendorName}>{item.name}</Text>
        <Text style={styles.vendorCategory}>{item.category}</Text>
        <Text style={styles.vendorDetails}>
          ⭐ {item.rating} • {item.distance?.toFixed(1)} km
        </Text>
        {item.direccion && (
          <Text style={styles.vendorAddress}>
            <Ionicons name="location" size={12} color="#666" /> {item.direccion}
          </Text>
        )}
        {item.horario && (
          <Text style={styles.vendorSchedule}>
            <Ionicons name="time" size={12} color="#666" /> {item.horario.apertura} - {item.horario.cierre}
          </Text>
        )}
      </View>
      <Ionicons name="chevron-forward" size={20} color="#666" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tiendas Cercanas</Text>
      <Text style={styles.subtitle}>
        {nearbyVendors.length} tiendas encontradas cerca de ti
      </Text>
      
      {nearbyVendors.length > 0 ? (
        <FlatList
          data={nearbyVendors}
          renderItem={renderVendorItem}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          style={styles.list}
        />
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="location" size={64} color="#ccc" />
          <Text style={styles.emptyText}>No hay tiendas cercanas</Text>
          <Text style={styles.emptySubtext}>
            Intenta aumentar el radio de búsqueda o verifica tu conexión a internet
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  list: {
    flex: 1,
  },
  vendorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  vendorInfo: {
    flex: 1,
  },
  vendorName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  vendorCategory: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
    marginBottom: 4,
  },
  vendorDetails: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  vendorAddress: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  vendorSchedule: {
    fontSize: 12,
    color: '#666',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});

export default NearStoresScreen;
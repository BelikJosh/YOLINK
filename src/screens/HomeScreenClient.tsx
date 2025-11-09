// src/screens/HomeScreenClient.tsx
import * as Location from 'expo-location';
import React, { useEffect, useState } from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';

const { width, height } = Dimensions.get('window');

// Datos de ejemplo para vendedores/artesanías
const VENDORS_DATA = [
  {
    id: '1',
    name: 'Joyeria Jade',
    category: 'Joyería',
    location: {
      latitude: 17.0606,
      longitude: -96.7252
    },
    rating: 4.8
  },
  {
    id: '2',
    name: 'Café Colonial',
    category: 'Café',
    location: {
      latitude: 17.0610,
      longitude: -96.7230
    },
    rating: 4.5
  },
  {
    id: '3',
    name: 'Máscaras Artesanales',
    category: 'Artesanías',
    location: {
      latitude: 17.0620,
      longitude: -96.7260
    },
    rating: 4.9
  },
  {
    id: '4',
    name: 'Templo Histórico',
    category: 'Punto de Interés',
    location: {
      latitude: 17.0590,
      longitude: -96.7240
    },
    rating: 4.7
  }
];

// Ubicación por defecto (Oaxaca centro)
const DEFAULT_REGION: Region = {
  latitude: 17.0606,
  longitude: -96.7252,
  latitudeDelta: 0.02,
  longitudeDelta: 0.02,
};

export default function HomeScreenClient() {
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedVendor, setSelectedVendor] = useState<any>(null);
  const [region, setRegion] = useState<Region>(DEFAULT_REGION);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setErrorMsg('Permiso de ubicación denegado');
          return;
        }

        let location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        
        const newLocation = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude
        };
        
        setUserLocation(newLocation);
        
        // Actualizar la región para centrar en la ubicación del usuario
        setRegion({
          ...newLocation,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        });
      } catch (error) {
        console.error('Error getting location:', error);
        setErrorMsg('Error al obtener la ubicación');
      }
    })();
  }, []);

  const handleVendorPress = (vendor: any) => {
    setSelectedVendor(vendor);
    // Centrar el mapa en el vendedor seleccionado
    setRegion({
      latitude: vendor.location.latitude,
      longitude: vendor.location.longitude,
      latitudeDelta: 0.02,
      longitudeDelta: 0.02,
    });
  };

  const handleMapReady = () => {
    setMapReady(true);
  };

  return (
    <View style={styles.container}>
      {/* Mapa */}
      <MapView
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        region={region}
        onMapReady={handleMapReady}
        showsUserLocation={true}
        showsMyLocationButton={true}
        showsCompass={true}
        showsScale={true}
      >
        {/* Marcadores de vendedores */}
        {VENDORS_DATA.map((vendor) => (
          <Marker
            key={vendor.id}
            coordinate={vendor.location}
            title={vendor.name}
            description={vendor.category}
            onPress={() => handleVendorPress(vendor)}
          />
        ))}
      </MapView>

      {/* Header de búsqueda */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchTitle}>Search</Text>
        <Text style={styles.searchSubtitle}>Artesanias Oaxaqueñas</Text>
        
        {/* Lista de categorías */}
        <View style={styles.categoriesContainer}>
          {VENDORS_DATA.map((vendor) => (
            <TouchableOpacity 
              key={vendor.id} 
              style={styles.categoryItem}
              onPress={() => handleVendorPress(vendor)}
            >
              <Text style={styles.categoryText}>• {vendor.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.separator} />
      </View>

      {/* Barra inferior de navegación */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navText}>Explore</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navText}>Near</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navText}>Pay</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navText}>Favorite</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navText}>Profile</Text>
        </TouchableOpacity>
      </View>

      {/* Modal de información del vendedor */}
      {selectedVendor && (
        <View style={styles.vendorInfo}>
          <Text style={styles.vendorName}>{selectedVendor.name}</Text>
          <Text style={styles.vendorCategory}>{selectedVendor.category}</Text>
          <Text style={styles.vendorRating}>⭐ {selectedVendor.rating}</Text>
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={() => setSelectedVendor(null)}
          >
            <Text style={styles.closeButtonText}>Cerrar</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Mostrar mensaje de error si hay */}
      {errorMsg && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{errorMsg}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  searchContainer: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 1000,
  },
  searchTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  searchSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 15,
  },
  categoriesContainer: {
    marginBottom: 10,
  },
  categoryItem: {
    paddingVertical: 5,
  },
  categoryText: {
    fontSize: 14,
    color: '#333',
  },
  separator: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 5,
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingVertical: 10,
    paddingHorizontal: 5,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    zIndex: 1000,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 5,
  },
  navText: {
    fontSize: 12,
    color: '#333',
  },
  vendorInfo: {
    position: 'absolute',
    bottom: 60,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 1001,
  },
  vendorName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  vendorCategory: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  vendorRating: {
    fontSize: 14,
    color: '#ff9500',
    marginBottom: 10,
  },
  closeButton: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  errorContainer: {
    position: 'absolute',
    top: 100,
    left: 20,
    right: 20,
    backgroundColor: '#ff6b6b',
    padding: 10,
    borderRadius: 8,
    zIndex: 1001,
  },
  errorText: {
    color: 'white',
    textAlign: 'center',
  },
});
// src/screens/HomeScreenClient.tsx
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { dynamodb, GOOGLE_MAPS_API_KEY, TABLE_NAME } from '../aws-config';

const { width, height } = Dimensions.get('window');

// Interfaces para los datos
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

interface Favorite {
  vendorId: string;
  userId: string;
  fechaAgregado: string;
}

interface RouteStep {
  latitude: number;
  longitude: number;
}

export default function HomeScreenClient({ navigation, route }: any) {
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [region, setRegion] = useState<Region | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [filteredVendors, setFilteredVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string>('user123');
  const [navigationMode, setNavigationMode] = useState(false);
  const [routeCoordinates, setRouteCoordinates] = useState<RouteStep[]>([]);
  const [distanceToVendor, setDistanceToVendor] = useState<number | null>(null);
  const [locationWatcher, setLocationWatcher] = useState<any>(null);
  const [calculatingRoute, setCalculatingRoute] = useState(false);

  // Coordenadas de prueba - Centro de CDMX
  const TEST_LOCATION = {
    latitude: 19.4326,
    longitude: -99.1332
  };

  useEffect(() => {
    loadVendors();
    requestLocationPermission();
    
    return () => {
      if (locationWatcher) {
        locationWatcher.remove();
      }
    };
  }, []);

  useEffect(() => {
    filterVendors();
  }, [searchQuery, vendors]);

  const requestLocationPermission = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permiso de ubicación denegado');
        setUserLocation(TEST_LOCATION);
        setRegion({
          ...TEST_LOCATION,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        });
        return;
      }

      let location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeout: 10000,
      });
      
      const newLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      };
      
      console.log('Ubicación del usuario:', newLocation);
      setUserLocation(newLocation);
      setRegion({
        ...newLocation,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
    } catch (error) {
      console.error('Error getting location:', error);
      setErrorMsg('Error al obtener la ubicación, usando ubicación de prueba');
      setUserLocation(TEST_LOCATION);
      setRegion({
        ...TEST_LOCATION,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
    }
  };

  const loadVendors = async () => {
    try {
      setLoading(true);
      
      const params = {
        TableName: TABLE_NAME,
        FilterExpression: 'userType = :userType',
        ExpressionAttributeValues: {
          ':userType': 'vendor'
        }
      };

      const result = await dynamodb.scan(params).promise();
      
      let vendorsToUse = VENDORS_DATA_TEST;
      
      if (result.Items && result.Items.length > 0) {
        console.log('Vendedores encontrados en DynamoDB:', result.Items.length);
        
        const vendorsData: Vendor[] = result.Items.map((item: any, index: number) => {
          const vendorId = typeof item.id === 'object' ? item.id.S : item.id || `vendor-${Date.now()}-${index}`;
          
          // Generar ubicaciones más realistas alrededor del usuario
          const userLat = userLocation?.latitude || TEST_LOCATION.latitude;
          const userLng = userLocation?.longitude || TEST_LOCATION.longitude;
          
          // Distribuir vendedores en un radio de 10km
          const radius = 10; // 10km en grados aproximados
          const angle = (index / result.Items.length) * 2 * Math.PI;
          const distance = 0.05 + (Math.random() * 0.05); // 5-10km en grados
          
          const lat = userLat + (Math.cos(angle) * distance);
          const lng = userLng + (Math.sin(angle) * distance);
          
          return {
            id: vendorId,
            name: item.nombre?.S || `Vendedor ${index + 1}`,
            category: item.categoria?.S || 'General',
            location: { latitude: lat, longitude: lng },
            rating: parseFloat(item.rating?.N || (4 + Math.random()).toFixed(1)),
            description: item.descripcion?.S || 'Descripción del negocio',
            telefono: item.telefono?.S || '5512345678',
            direccion: item.ubicacion?.M?.direccion?.S || `Calle ${index + 1}, CDMX`,
            horario: item.horario?.M ? {
              apertura: item.horario.M.apertura?.S || '09:00',
              cierre: item.horario.M.cierre?.S || '18:00',
              dias: item.horario.M.dias?.L?.map((d: any) => d.S) || ['Lunes', 'Viernes']
            } : {
              apertura: '09:00',
              cierre: '18:00',
              dias: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
            }
          };
        }).filter(vendor => vendor.location.latitude !== 0 && vendor.location.longitude !== 0);

        const uniqueVendors = vendorsData.filter((vendor, index, self) => 
          index === self.findIndex(v => v.id === vendor.id)
        );

        vendorsToUse = uniqueVendors.length > 0 ? uniqueVendors : VENDORS_DATA_TEST;
      }

      console.log('Vendedores cargados:', vendorsToUse.length);
      setVendors(vendorsToUse);
      setFilteredVendors(vendorsToUse);
      
    } catch (error) {
      console.error('Error loading vendors:', error);
      setVendors(VENDORS_DATA_TEST);
      setFilteredVendors(VENDORS_DATA_TEST);
    } finally {
      setLoading(false);
    }
  };

  const filterVendors = () => {
    if (!searchQuery.trim()) {
      setFilteredVendors(vendors);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = vendors.filter(vendor =>
      vendor.name.toLowerCase().includes(query) ||
      vendor.category.toLowerCase().includes(query) ||
      vendor.description?.toLowerCase().includes(query)
    );
    setFilteredVendors(filtered);
  };

  const handleVendorPress = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setRegion({
      latitude: vendor.location.latitude,
      longitude: vendor.location.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    });
  };

  const handleAddToFavorites = async (vendor: Vendor) => {
    try {
      const favoriteId = `FAVORITE#${userId}#${vendor.id}`;
      
      const params = {
        TableName: TABLE_NAME,
        Item: {
          id: { S: favoriteId },
          userType: { S: 'favorite' },
          userId: { S: userId },
          vendorId: { S: vendor.id },
          vendorName: { S: vendor.name },
          vendorCategory: { S: vendor.category },
          vendorData: { S: JSON.stringify(vendor) },
          fechaAgregado: { S: new Date().toISOString() }
        }
      };

      console.log('Agregando a favoritos:', params.Item);
      await dynamodb.put(params).promise();
      
      Alert.alert(
        '✅ Agregado a favoritos', 
        `${vendor.name} se ha agregado a tus favoritos`,
        [
          { 
            text: 'Ver favoritos', 
            onPress: () => navigation.navigate('Favorites')
          },
          { 
            text: 'Continuar explorando', 
            style: 'cancel' 
          }
        ]
      );
      setSelectedVendor(null);
      
    } catch (error: any) {
      console.error('Error adding to favorites:', error);
      Alert.alert(
        '❌ Error', 
        `No se pudo agregar a favoritos: ${error.message || 'Error desconocido'}`
      );
    }
  };

  const handleViewNearby = () => {
    if (!userLocation) {
      Alert.alert('Error', 'No se pudo obtener tu ubicación');
      return;
    }

    // Radio ampliado a 10km
    const nearbyVendors = vendors.map(vendor => {
      const distance = calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        vendor.location.latitude,
        vendor.location.longitude
      );
      return { ...vendor, distance };
    }).filter(vendor => vendor.distance <= 10) // 10km de radio
      .sort((a, b) => (a.distance || 0) - (b.distance || 0));

    console.log(`Vendedores cercanos encontrados: ${nearbyVendors.length} en 10km`);

    navigation.navigate('Near', { 
      nearbyVendors,
      userLocation 
    });
  };

  // Función para obtener ruta real usando Google Directions API
  const getRealRoute = async (destination: { latitude: number; longitude: number }) => {
    if (!userLocation) return [];

    try {
      setCalculatingRoute(true);
      
      const origin = `${userLocation.latitude},${userLocation.longitude}`;
      const dest = `${destination.latitude},${destination.longitude}`;
      
      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${dest}&mode=walking&key=${GOOGLE_MAPS_API_KEY}`;
      
      console.log('Solicitando ruta a Google Directions API...');
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.status === 'OK' && data.routes.length > 0) {
        const route = data.routes[0];
        const points = decodePolyline(route.overview_polyline.points);
        console.log(`Ruta obtenida con ${points.length} puntos`);
        return points;
      } else {
        console.warn('No se pudo obtener ruta:', data.status);
        // Fallback a ruta directa
        return [userLocation, destination];
      }
    } catch (error) {
      console.error('Error obteniendo ruta:', error);
      // Fallback a ruta directa
      return [userLocation, destination];
    } finally {
      setCalculatingRoute(false);
    }
  };

  // Decodificar polyline de Google Maps
  const decodePolyline = (encoded: string): RouteStep[] => {
    let points = [];
    let index = 0, len = encoded.length;
    let lat = 0, lng = 0;

    while (index < len) {
      let b, shift = 0, result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      let dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lat += dlat;

      shift = 0;
      result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      let dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lng += dlng;

      points.push({
        latitude: lat / 1e5,
        longitude: lng / 1e5
      });
    }
    return points;
  };

  const startNavigation = async (vendor: Vendor) => {
    if (!userLocation) {
      Alert.alert('Error', 'No se puede iniciar navegación sin ubicación');
      return;
    }

    Alert.alert(
      'Iniciando Navegación',
      `¿Quieres trazar una ruta hacia ${vendor.name}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Trazar Ruta', 
          onPress: async () => {
            setNavigationMode(true);
            setSelectedVendor(vendor);
            
            // Obtener ruta real
            const realRoute = await getRealRoute(vendor.location);
            setRouteCoordinates(realRoute);
            
            // Calcular distancia inicial
            const initialDistance = calculateDistance(
              userLocation.latitude,
              userLocation.longitude,
              vendor.location.latitude,
              vendor.location.longitude
            );
            setDistanceToVendor(initialDistance);

            // Iniciar seguimiento de ubicación en tiempo real
            const watcher = await Location.watchPositionAsync(
              {
                accuracy: Location.Accuracy.High,
                timeInterval: 3000,
                distanceInterval: 10,
              },
              (newLocation) => {
                const updatedUserLocation = {
                  latitude: newLocation.coords.latitude,
                  longitude: newLocation.coords.longitude
                };
                
                setUserLocation(updatedUserLocation);
                
                // Actualizar distancia
                const newDistance = calculateDistance(
                  updatedUserLocation.latitude,
                  updatedUserLocation.longitude,
                  vendor.location.latitude,
                  vendor.location.longitude
                );
                setDistanceToVendor(newDistance);

                // Actualizar región para seguir al usuario
                setRegion({
                  ...updatedUserLocation,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                });

                // Si está muy cerca, detener navegación
                if (newDistance < 0.05) { // 50 metros
                  Alert.alert('🎉 ¡Llegaste!', `Has llegado a ${vendor.name}`);
                  stopNavigation();
                }
              }
            );

            setLocationWatcher(watcher);
          }
        }
      ]
    );
  };

  const stopNavigation = () => {
    setNavigationMode(false);
    setRouteCoordinates([]);
    setDistanceToVendor(null);
    if (locationWatcher) {
      locationWatcher.remove();
      setLocationWatcher(null);
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const handleMapReady = () => {
    setMapReady(true);
  };

  const generateUniqueKey = (vendor: Vendor, index: number) => {
    return `${vendor.id}-${vendor.location.latitude}-${vendor.location.longitude}-${index}`;
  };

  if (!region) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Cargando mapa...</Text>
      </View>
    );
  }

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
        {filteredVendors.map((vendor, index) => (
          <Marker
            key={generateUniqueKey(vendor, index)}
            coordinate={vendor.location}
            title={vendor.name}
            description={vendor.category}
            onPress={() => handleVendorPress(vendor)}
          />
        ))}

        {/* Línea de ruta para navegación */}
        {navigationMode && routeCoordinates.length > 1 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor="#007AFF"
            strokeWidth={6}
            lineDashPattern={[1, 0]} // Línea continua
          />
        )}
      </MapView>

      {/* Header de búsqueda */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar artesanías, comida, lugares..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>

        {/* Botón de cercanos */}
        <TouchableOpacity 
          style={styles.nearbyButton} 
          onPress={handleViewNearby}
        >
          <Ionicons name="location" size={16} color="#fff" />
          <Text style={styles.nearbyButtonText}>Ver tiendas cercanas (10km)</Text>
        </TouchableOpacity>
      </View>

      {/* Lista de resultados de búsqueda */}
      {searchQuery.length > 0 && (
        <View style={styles.resultsContainer}>
          <ScrollView style={styles.resultsList}>
            {filteredVendors.map((vendor, index) => (
              <TouchableOpacity 
                key={generateUniqueKey(vendor, index)} 
                style={styles.resultItem}
                onPress={() => handleVendorPress(vendor)}
              >
                <View style={styles.resultInfo}>
                  <Text style={styles.resultName}>{vendor.name}</Text>
                  <Text style={styles.resultCategory}>{vendor.category}</Text>
                  <Text style={styles.resultRating}>⭐ {vendor.rating}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#666" />
              </TouchableOpacity>
            ))}
            {filteredVendors.length === 0 && (
              <Text style={styles.noResults}>No se encontraron resultados</Text>
            )}
          </ScrollView>
        </View>
      )}

      {/* Modal de información del vendedor */}
      {selectedVendor && (
        <View style={styles.vendorInfo}>
          <View style={styles.vendorHeader}>
            <View style={styles.vendorTitle}>
              <Text style={styles.vendorName}>{selectedVendor.name}</Text>
              <Text style={styles.vendorCategory}>{selectedVendor.category}</Text>
              <Text style={styles.vendorRating}>⭐ {selectedVendor.rating}</Text>
              {navigationMode && distanceToVendor && (
                <Text style={styles.distanceText}>
                  📍 {distanceToVendor.toFixed(2)} km
                </Text>
              )}
            </View>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => {
                setSelectedVendor(null);
                if (navigationMode) stopNavigation();
              }}
            >
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          {selectedVendor.description && (
            <Text style={styles.vendorDescription}>{selectedVendor.description}</Text>
          )}

          {selectedVendor.direccion && (
            <View style={styles.vendorDetail}>
              <Ionicons name="location" size={16} color="#666" />
              <Text style={styles.vendorDetailText}>{selectedVendor.direccion}</Text>
            </View>
          )}

          {selectedVendor.telefono && (
            <View style={styles.vendorDetail}>
              <Ionicons name="call" size={16} color="#666" />
              <Text style={styles.vendorDetailText}>{selectedVendor.telefono}</Text>
            </View>
          )}

          <View style={styles.vendorActions}>
            {!navigationMode ? (
              <>
                <TouchableOpacity 
                  style={styles.navigationButton}
                  onPress={() => startNavigation(selectedVendor)}
                  disabled={calculatingRoute}
                >
                  {calculatingRoute ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Ionicons name="navigate" size={20} color="#fff" />
                  )}
                  <Text style={styles.navigationButtonText}>
                    {calculatingRoute ? 'Calculando ruta...' : 'Trazar Camino'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.favoriteButton}
                  onPress={() => handleAddToFavorites(selectedVendor)}
                >
                  <Ionicons name="heart" size={20} color="#fff" />
                  <Text style={styles.favoriteButtonText}>Agregar a Favoritos</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity 
                style={styles.stopNavigationButton}
                onPress={stopNavigation}
              >
                <Ionicons name="stop-circle" size={20} color="#fff" />
                <Text style={styles.stopNavigationButtonText}>Detener Navegación</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Mostrar mensaje de error si hay */}
      {errorMsg && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{errorMsg}</Text>
          <TouchableOpacity onPress={requestLocationPermission}>
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Loading */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Cargando vendedores...</Text>
        </View>
      )}
    </View>
  );
}

// Datos de prueba mejor distribuidos
const VENDORS_DATA_TEST: Vendor[] = [
  {
    id: 'test-1',
    name: 'Restaurante El Centro',
    category: 'Restaurante',
    location: {
      latitude: 19.4326,
      longitude: -99.1332
    },
    rating: 4.5,
    description: 'Auténtica comida mexicana en el corazón de la ciudad',
    direccion: 'Zócalo de la CDMX',
    telefono: '5512345678',
    horario: {
      apertura: '08:00',
      cierre: '22:00',
      dias: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
    }
  },
  {
    id: 'test-2',
    name: 'Café Bellas Artes',
    category: 'Café',
    location: {
      latitude: 19.4342,
      longitude: -99.1405
    },
    rating: 4.3,
    description: 'Café de especialidad con vista al Palacio de Bellas Artes',
    direccion: 'Av. Juárez, Centro Histórico',
    telefono: '5587654321',
    horario: {
      apertura: '07:00',
      cierre: '21:00',
      dias: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
    }
  },
  {
    id: 'test-3',
    name: 'Artesanías Mexicanas',
    category: 'Artesanías',
    location: {
      latitude: 19.4290,
      longitude: -99.1380
    },
    rating: 4.7,
    description: 'Artesanías tradicionales de todo México',
    direccion: 'Mercado de La Ciudadela',
    telefono: '5598765432',
    horario: {
      apertura: '09:00',
      cierre: '19:00',
      dias: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
    }
  },
  {
    id: 'test-4',
    name: 'Joyería La Esmeralda',
    category: 'Joyería',
    location: {
      latitude: 19.4360,
      longitude: -99.1350
    },
    rating: 4.2,
    description: 'Joyas artesanales con plata y piedras mexicanas',
    direccion: 'Calle Madero, Centro',
    telefono: '5534567890',
    horario: {
      apertura: '10:00',
      cierre: '20:00',
      dias: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
    }
  },
  {
    id: 'test-5',
    name: 'Panadería Tradicional',
    category: 'Panadería',
    location: {
      latitude: 19.4300,
      longitude: -99.1310
    },
    rating: 4.6,
    description: 'Pan tradicional mexicano recién horneado',
    direccion: 'Calle República de Uruguay',
    telefono: '5543210987',
    horario: {
      apertura: '06:00',
      cierre: '18:00',
      dias: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
    }
  },
  {
    id: 'test-6',
    name: 'Taquería Don José',
    category: 'Comida Rápida',
    location: {
      latitude: 19.4280,
      longitude: -99.1420
    },
    rating: 4.4,
    description: 'Los mejores tacos al pastor de la ciudad',
    direccion: 'Eje Central Lázaro Cárdenas',
    telefono: '5578901234',
    horario: {
      apertura: '12:00',
      cierre: '24:00',
      dias: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
    }
  }
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.8)',
    zIndex: 1002,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  searchContainer: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    zIndex: 1000,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    marginRight: 10,
    fontSize: 16,
    color: '#333',
  },
  nearbyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginTop: 10,
    alignSelf: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  nearbyButtonText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 5,
    fontSize: 14,
  },
  resultsContainer: {
    position: 'absolute',
    top: 130,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    borderRadius: 15,
    maxHeight: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 1001,
  },
  resultsList: {
    padding: 10,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  resultInfo: {
    flex: 1,
  },
  resultName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  resultCategory: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  resultRating: {
    fontSize: 12,
    color: '#ff9500',
  },
  noResults: {
    textAlign: 'center',
    color: '#666',
    fontSize: 14,
    padding: 20,
  },
  vendorInfo: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 1001,
  },
  vendorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  vendorTitle: {
    flex: 1,
  },
  vendorName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333',
  },
  vendorCategory: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  vendorRating: {
    fontSize: 14,
    color: '#ff9500',
  },
  distanceText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  vendorDescription: {
    fontSize: 14,
    color: '#333',
    marginBottom: 12,
    lineHeight: 20,
  },
  vendorDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  vendorDetailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  vendorActions: {
    marginTop: 15,
  },
  navigationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
  },
  navigationButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 16,
  },
  favoriteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
  },
  favoriteButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 16,
  },
  stopNavigationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF9500',
    borderRadius: 10,
    padding: 15,
  },
  stopNavigationButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 16,
  },
  closeButton: {
    padding: 4,
  },
  errorContainer: {
    position: 'absolute',
    top: 100,
    left: 20,
    right: 20,
    backgroundColor: '#ff6b6b',
    padding: 15,
    borderRadius: 10,
    zIndex: 1001,
    alignItems: 'center',
  },
  errorText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 14,
    marginBottom: 10,
  },
  retryText: {
    color: 'white',
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
});
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { dynamodb, TABLE_NAME } from '../aws-config';

const { width, height } = Dimensions.get('window');

interface Vendor {
  id: string;
  nombre: string;
  categoria: string;
  ubicacion: {
    direccion: string;
    lat: number;
    lng: number;
  };
  rating: number;
  descripcion?: string;
  horario?: {
    apertura: string;
    cierre: string;
    dias: string[];
  };
  telefono?: string;
  distance?: number;
}

interface Props {
  navigation: any;
  route: any;
  user: any;
}

const HomeScreenClient: React.FC<Props> = ({ navigation, route, user }) => {
  const mapRef = useRef<any>(null);
  
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [region, setRegion] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [filteredVendors, setFilteredVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);

  // Ubicación por defecto (Centro CDMX)
  const DEFAULT_LOCATION = {
    latitude: 19.4326,
    longitude: -99.1332
  };

  useEffect(() => {
    initializeApp();
  }, []);

  useEffect(() => {
    filterVendors();
  }, [searchQuery, vendors, userLocation]);

  const initializeApp = async () => {
    await requestLocationPermission();
    await loadVendors();
  };

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        setLocationError('Usando ubicación por defecto');
        setUserLocation(DEFAULT_LOCATION);
        setRegion({
          ...DEFAULT_LOCATION,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        });
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeout: 10000,
      });

      const newLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      };

      setUserLocation(newLocation);
      setRegion({
        ...newLocation,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
      
      console.log('Ubicación del usuario:', newLocation);
    } catch (error) {
      console.error('Error obteniendo ubicación:', error);
      setLocationError('Usando ubicación por defecto');
      setUserLocation(DEFAULT_LOCATION);
      setRegion({
        ...DEFAULT_LOCATION,
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
      
      if (result.Items && result.Items.length > 0) {
        console.log('Vendedores encontrados en DynamoDB:', result.Items.length);
        
        const vendorsData: Vendor[] = result.Items.map((item: any) => {
          // Manejar diferentes formatos de datos de DynamoDB
          const lat = item.ubicacion?.lat 
            ? parseFloat(item.ubicacion.lat) 
            : (item.ubicacion?.M?.lat?.N ? parseFloat(item.ubicacion.M.lat.N) : DEFAULT_LOCATION.latitude);
          
          const lng = item.ubicacion?.lng 
            ? parseFloat(item.ubicacion.lng) 
            : (item.ubicacion?.M?.lng?.N ? parseFloat(item.ubicacion.M.lng.N) : DEFAULT_LOCATION.longitude);

          return {
            id: item.id,
            nombre: item.nombre,
            categoria: item.categoria || 'General',
            ubicacion: {
              direccion: item.ubicacion?.direccion || item.ubicacion?.M?.direccion?.S || 'Dirección no disponible',
              lat: lat,
              lng: lng
            },
            rating: parseFloat(item.rating) || 4.0,
            descripcion: item.descripcion || '',
            telefono: item.telefono || '',
            horario: item.horario || {
              apertura: '09:00',
              cierre: '18:00',
              dias: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
            }
          };
        }).filter(vendor => 
          vendor.ubicacion.lat !== DEFAULT_LOCATION.latitude &&
          vendor.ubicacion.lng !== DEFAULT_LOCATION.longitude &&
          vendor.ubicacion.lat !== 0 && 
          vendor.ubicacion.lng !== 0
        );

        console.log('Vendedores procesados:', vendorsData.length);
        setVendors(vendorsData);
        setFilteredVendors(vendorsData);
      } else {
        console.log('No se encontraron vendedores en DynamoDB');
        setVendors([]);
        setFilteredVendors([]);
      }
    } catch (error) {
      console.error('Error cargando vendedores:', error);
      Alert.alert('Error', 'No se pudieron cargar los negocios');
      setVendors([]);
      setFilteredVendors([]);
    } finally {
      setLoading(false);
    }
  };

  const filterVendors = useCallback(() => {
    if (!searchQuery.trim()) {
      const vendorsWithDistance = calculateDistances(vendors);
      setFilteredVendors(vendorsWithDistance);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = vendors.filter(vendor =>
      vendor.nombre.toLowerCase().includes(query) ||
      vendor.categoria.toLowerCase().includes(query) ||
      vendor.descripcion?.toLowerCase().includes(query)
    );
    
    const filteredWithDistance = calculateDistances(filtered);
    setFilteredVendors(filteredWithDistance);
  }, [searchQuery, vendors, userLocation]);

  const calculateDistances = (vendorsList: Vendor[]): Vendor[] => {
    if (!userLocation) return vendorsList;

    return vendorsList.map(vendor => ({
      ...vendor,
      distance: calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        vendor.ubicacion.lat,
        vendor.ubicacion.lng
      )
    }));
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Radio de la Tierra en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const handleVendorPress = useCallback((vendor: Vendor) => {
    setSelectedVendor(vendor);
    
    // Animar el mapa hacia el vendedor
    if (mapRef.current && mapReady) {
      mapRef.current.animateToRegion({
        latitude: vendor.ubicacion.lat,
        longitude: vendor.ubicacion.lng,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 500);
    }
  }, [mapReady]);

  const handleAddToFavorites = async (vendor: Vendor) => {
    try {
      const favoriteId = `FAVORITE#${user.id}#${vendor.id}`;
      
      const params = {
        TableName: TABLE_NAME,
        Item: {
          id: favoriteId,
          userType: 'favorite',
          userId: user.id,
          vendorId: vendor.id,
          vendorData: JSON.stringify(vendor),
          fechaAgregado: new Date().toISOString()
        }
      };

      await dynamodb.put(params).promise();
      
      Alert.alert(
        'Agregado a favoritos', 
        `${vendor.nombre} se ha agregado a tus favoritos`,
        [
          { 
            text: 'Ver favoritos', 
            onPress: () => navigation.navigate('Favorites')
          },
          { 
            text: 'Continuar', 
            style: 'cancel' 
          }
        ]
      );
      
      setSelectedVendor(null);
    } catch (error) {
      console.error('Error agregando a favoritos:', error);
      Alert.alert('Error', 'No se pudo agregar a favoritos');
    }
  };

  const handleViewNearby = () => {
    if (!userLocation) {
      Alert.alert('Error', 'No se pudo obtener tu ubicación');
      return;
    }

    const nearbyVendors = filteredVendors
      .filter(vendor => (vendor.distance || 0) <= 10)
      .sort((a, b) => (a.distance || 0) - (b.distance || 0));

    if (nearbyVendors.length === 0) {
      Alert.alert(
        'Sin resultados', 
        'No se encontraron negocios cercanos en un radio de 10km'
      );
      return;
    }

    navigation.navigate('Near', { 
      nearbyVendors,
      userLocation 
    });
  };

  const handleMapReady = () => {
    setMapReady(true);
    console.log('Mapa listo');
  };

  const generateUniqueKey = (vendor: Vendor, index: number) => {
    return `${vendor.id}-${index}`;
  };

  if (!region) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4ecdc4" />
        <Text style={styles.loadingText}>Inicializando mapa...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Mapa */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        region={region}
        onMapReady={handleMapReady}
        showsUserLocation={true}
        showsMyLocationButton={true}
        showsCompass={true}
        showsScale={false}
        loadingEnabled={true}
        loadingIndicatorColor="#4ecdc4"
      >
        {/* Marcadores de vendedores */}
        {mapReady && filteredVendors.map((vendor, index) => (
          <Marker
            key={generateUniqueKey(vendor, index)}
            coordinate={{
              latitude: vendor.ubicacion.lat,
              longitude: vendor.ubicacion.lng
            }}
            title={vendor.nombre}
            description={vendor.categoria}
            onPress={() => handleVendorPress(vendor)}
            pinColor="#ff6b6b"
          />
        ))}
      </MapView>

      {/* Header de búsqueda */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#95a5a6" />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar negocios, categorías..."
            placeholderTextColor="#95a5a6"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#95a5a6" />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity 
          style={styles.nearbyButton} 
          onPress={handleViewNearby}
          disabled={!userLocation}
        >
          <Ionicons name="location" size={16} color="#f7fff9" />
          <Text style={styles.nearbyButtonText}>Ver cercanos (10km)</Text>
        </TouchableOpacity>
      </View>

      {/* Resultados de búsqueda */}
      {searchQuery.length > 0 && (
        <View style={styles.resultsContainer}>
          <ScrollView 
            style={styles.resultsList} 
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {filteredVendors.map((vendor, index) => (
              <TouchableOpacity 
                key={generateUniqueKey(vendor, index)} 
                style={styles.resultItem}
                onPress={() => handleVendorPress(vendor)}
              >
                <View style={styles.resultInfo}>
                  <Text style={styles.resultName}>{vendor.nombre}</Text>
                  <Text style={styles.resultCategory}>{vendor.categoria}</Text>
                  <View style={styles.resultMeta}>
                    <Ionicons name="star" size={14} color="#ff6b6b" />
                    <Text style={styles.resultRating}>{vendor.rating.toFixed(1)}</Text>
                    {vendor.distance && (
                      <Text style={styles.resultDistance}>
                        • {vendor.distance.toFixed(1)} km
                      </Text>
                    )}
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#95a5a6" />
              </TouchableOpacity>
            ))}
            {filteredVendors.length === 0 && (
              <View style={styles.noResultsContainer}>
                <Ionicons name="search-outline" size={48} color="#c1f9e1" />
                <Text style={styles.noResults}>No se encontraron resultados</Text>
                <Text style={styles.noResultsHint}>Intenta con otra búsqueda</Text>
              </View>
            )}
          </ScrollView>
        </View>
      )}

      {/* Información del vendedor seleccionado */}
      {selectedVendor && (
        <View style={styles.vendorInfo}>
          <View style={styles.vendorHeader}>
            <View style={styles.vendorTitleSection}>
              <Text style={styles.vendorName}>{selectedVendor.nombre}</Text>
              <Text style={styles.vendorCategory}>{selectedVendor.categoria}</Text>
              <View style={styles.vendorMeta}>
                <Ionicons name="star" size={16} color="#ff6b6b" />
                <Text style={styles.vendorRating}>{selectedVendor.rating.toFixed(1)}</Text>
                {selectedVendor.distance && (
                  <>
                    <Ionicons name="location" size={16} color="#4ecdc4" style={{ marginLeft: 12 }} />
                    <Text style={styles.vendorDistance}>
                      {selectedVendor.distance.toFixed(1)} km
                    </Text>
                  </>
                )}
              </View>
            </View>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setSelectedVendor(null)}
            >
              <Ionicons name="close-circle" size={28} color="#95a5a6" />
            </TouchableOpacity>
          </View>

          {selectedVendor.descripcion && (
            <Text style={styles.vendorDescription}>{selectedVendor.descripcion}</Text>
          )}

          <View style={styles.vendorDetails}>
            {selectedVendor.ubicacion.direccion && (
              <View style={styles.vendorDetail}>
                <Ionicons name="location-outline" size={18} color="#4ecdc4" />
                <Text style={styles.vendorDetailText} numberOfLines={2}>
                  {selectedVendor.ubicacion.direccion}
                </Text>
              </View>
            )}

            {selectedVendor.telefono && (
              <View style={styles.vendorDetail}>
                <Ionicons name="call-outline" size={18} color="#4ecdc4" />
                <Text style={styles.vendorDetailText}>{selectedVendor.telefono}</Text>
              </View>
            )}

            {selectedVendor.horario && (
              <View style={styles.vendorDetail}>
                <Ionicons name="time-outline" size={18} color="#4ecdc4" />
                <Text style={styles.vendorDetailText}>
                  {selectedVendor.horario.apertura} - {selectedVendor.horario.cierre}
                </Text>
              </View>
            )}
          </View>

          <TouchableOpacity 
            style={styles.favoriteButton}
            onPress={() => handleAddToFavorites(selectedVendor)}
          >
            <Ionicons name="heart-outline" size={20} color="#f7fff9" />
            <Text style={styles.favoriteButtonText}>Agregar a Favoritos</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Banner de error de ubicación */}
      {locationError && (
        <View style={styles.errorBanner}>
          <Ionicons name="information-circle-outline" size={20} color="#f7fff9" />
          <Text style={styles.errorText}>{locationError}</Text>
          <TouchableOpacity onPress={requestLocationPermission}>
            <Ionicons name="refresh" size={20} color="#f7fff9" />
          </TouchableOpacity>
        </View>
      )}

      {/* Loading overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color="#4ecdc4" />
            <Text style={styles.loadingText}>Cargando negocios...</Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7fff9',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f7fff9',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#1a535c',
    fontWeight: '600',
  },
  searchContainer: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    zIndex: 1000,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#1a535c',
  },
  nearbyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4ecdc4',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginTop: 12,
    alignSelf: 'flex-start',
    shadowColor: '#4ecdc4',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  nearbyButtonText: {
    color: '#f7fff9',
    fontWeight: '600',
    marginLeft: 6,
    fontSize: 14,
  },
  resultsContainer: {
    position: 'absolute',
    top: 145,
    left: 16,
    right: 16,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    maxHeight: 350,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 999,
  },
  resultsList: {
    padding: 8,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#c1f9e1',
  },
  resultInfo: {
    flex: 1,
  },
  resultName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a535c',
    marginBottom: 4,
  },
  resultCategory: {
    fontSize: 14,
    color: '#95a5a6',
    marginBottom: 6,
  },
  resultMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resultRating: {
    fontSize: 14,
    color: '#ff6b6b',
    fontWeight: '600',
    marginLeft: 4,
  },
  resultDistance: {
    fontSize: 14,
    color: '#4ecdc4',
    marginLeft: 4,
  },
  noResultsContainer: {
    alignItems: 'center',
    padding: 40,
  },
  noResults: {
    textAlign: 'center',
    color: '#1a535c',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
  },
  noResultsHint: {
    textAlign: 'center',
    color: '#95a5a6',
    fontSize: 14,
    marginTop: 8,
  },
  vendorInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
    zIndex: 999,
    maxHeight: height * 0.5,
  },
  vendorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  vendorTitleSection: {
    flex: 1,
  },
  vendorName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1a535c',
    marginBottom: 4,
  },
  vendorCategory: {
    fontSize: 15,
    color: '#95a5a6',
    marginBottom: 8,
  },
  vendorMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vendorRating: {
    fontSize: 15,
    color: '#ff6b6b',
    fontWeight: '600',
    marginLeft: 4,
  },
  vendorDistance: {
    fontSize: 15,
    color: '#4ecdc4',
    fontWeight: '600',
    marginLeft: 4,
  },
  vendorDescription: {
    fontSize: 14,
    color: '#1a535c',
    lineHeight: 20,
    marginBottom: 16,
  },
  vendorDetails: {
    marginBottom: 16,
  },
  vendorDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  vendorDetailText: {
    fontSize: 14,
    color: '#1a535c',
    marginLeft: 10,
    flex: 1,
  },
  favoriteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ff6b6b',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#ff6b6b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  favoriteButtonText: {
    color: '#f7fff9',
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 16,
  },
  closeButton: {
    padding: 4,
  },
  errorBanner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ff6b6b',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    zIndex: 1001,
  },
  errorText: {
    flex: 1,
    color: '#f7fff9',
    fontSize: 13,
    marginLeft: 10,
    fontWeight: '500',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1002,
  },
  loadingCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
});

export default HomeScreenClient;
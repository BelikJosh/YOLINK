import { Ionicons } from '@expo/vector-icons';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import * as Location from 'expo-location';
import React, { useCallback, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';

type RootStackParamList = {
  Login: undefined;
  CreateAccount: undefined;
  MapLocationPicker: { 
    onLocationSelected: (location: { 
      address: string; 
      lat: number; 
      lng: number 
    }) => void;
  };
  ClientTabs: { user: any };
  VendorTabs: { user: any };
};

type MapLocationPickerNavigationProp = StackNavigationProp<RootStackParamList, 'MapLocationPicker'>;
type MapLocationPickerRouteProp = RouteProp<RootStackParamList, 'MapLocationPicker'>;

interface Props {
  navigation: MapLocationPickerNavigationProp;
  route: MapLocationPickerRouteProp;
}

const MapLocationPicker: React.FC<Props> = ({ navigation, route }) => {
  const mapRef = useRef<any>(null);
  
  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number;
    lng: number;
    address: string;
  } | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [region, setRegion] = useState({
    latitude: 19.4326,
    longitude: -99.1332,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });
  const [mapReady, setMapReady] = useState(false);

  // Función para buscar dirección
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      Alert.alert('Campo vacío', 'Por favor ingresa una dirección para buscar');
      return;
    }

    setIsSearching(true);
    try {
      // Usar Nominatim para búsqueda (gratuito)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1&countrycodes=mx`
      );
      const data = await response.json();

      if (data && data.length > 0) {
        const location = data[0];
        const lat = parseFloat(location.lat);
        const lng = parseFloat(location.lon);
        
        // Actualizar región y marcador
        const newRegion = {
          latitude: lat,
          longitude: lng,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        };
        
        setRegion(newRegion);
        
        if (mapRef.current && mapReady) {
          mapRef.current.animateToRegion(newRegion, 500);
        }

        setSelectedLocation({
          lat: lat,
          lng: lng,
          address: location.display_name
        });

        Alert.alert('Ubicación encontrada', 'Toca el botón "Confirmar Ubicación" para guardar');
      } else {
        Alert.alert('No encontrado', 'No se encontró la ubicación. Intenta con otra dirección.');
      }
    } catch (error) {
      console.error('Error buscando ubicación:', error);
      Alert.alert('Error', 'Error al buscar la ubicación. Verifica tu conexión.');
    } finally {
      setIsSearching(false);
    }
  };

  // Función para obtener ubicación actual
  const handleGetCurrentLocation = async () => {
    setIsGettingLocation(true);
    
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permisos necesarios',
          'Necesitamos permisos de ubicación para obtener tu posición actual'
        );
        setIsGettingLocation(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High
      });

      const lat = location.coords.latitude;
      const lng = location.coords.longitude;

      // Obtener dirección
      const [address] = await Location.reverseGeocodeAsync({
        latitude: lat,
        longitude: lng
      });

      const direccionCompleta = [
        address.street,
        address.streetNumber,
        address.city,
        address.region
      ].filter(Boolean).join(', ');

      const newRegion = {
        latitude: lat,
        longitude: lng,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };

      setRegion(newRegion);
      
      if (mapRef.current && mapReady) {
        mapRef.current.animateToRegion(newRegion, 500);
      }

      setSelectedLocation({
        lat: lat,
        lng: lng,
        address: direccionCompleta || `${lat.toFixed(6)}, ${lng.toFixed(6)}`
      });

      Alert.alert('Ubicación obtenida', 'Tu ubicación actual ha sido marcada en el mapa');
      
    } catch (error) {
      console.error('Error obteniendo ubicación:', error);
      Alert.alert('Error', 'No se pudo obtener tu ubicación actual');
    } finally {
      setIsGettingLocation(false);
    }
  };

  // Función cuando se toca el mapa
  const handleMapPress = useCallback(async (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    
    try {
      // Obtener dirección del punto tocado
      const [address] = await Location.reverseGeocodeAsync({
        latitude: latitude,
        longitude: longitude
      });

      const direccionCompleta = [
        address.street,
        address.streetNumber,
        address.city,
        address.region
      ].filter(Boolean).join(', ');

      setSelectedLocation({
        lat: latitude,
        lng: longitude,
        address: direccionCompleta || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
      });
    } catch (error) {
      console.error('Error obteniendo dirección:', error);
      setSelectedLocation({
        lat: latitude,
        lng: longitude,
        address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
      });
    }
  }, []);

  // Confirmar ubicación seleccionada
  const handleConfirm = () => {
    if (!selectedLocation) {
      Alert.alert('Sin ubicación', 'Por favor selecciona una ubicación en el mapa primero');
      return;
    }

    route.params.onLocationSelected({
      address: selectedLocation.address,
      lat: selectedLocation.lat,
      lng: selectedLocation.lng,
    });

    navigation.goBack();
  };

  const handleMapReady = () => {
    setMapReady(true);
    console.log('Mapa listo');
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#1a535c" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ubicación del Negocio</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Mapa */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        region={region}
        onPress={handleMapPress}
        onMapReady={handleMapReady}
        showsUserLocation={true}
        showsMyLocationButton={false}
        showsCompass={true}
        loadingEnabled={true}
        loadingIndicatorColor="#4ecdc4"
      >
        {/* Marcador de ubicación seleccionada */}
        {selectedLocation && mapReady && (
          <Marker
            coordinate={{
              latitude: selectedLocation.lat,
              longitude: selectedLocation.lng
            }}
            title="Ubicación de tu negocio"
            description={selectedLocation.address}
            pinColor="#ff6b6b"
          />
        )}
      </MapView>

      {/* Barra de búsqueda flotante */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#95a5a6" />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar dirección..."
            placeholderTextColor="#95a5a6"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity 
              style={styles.clearButton}
              onPress={() => setSearchQuery('')}
            >
              <Ionicons name="close-circle" size={20} color="#95a5a6" />
            </TouchableOpacity>
          )}
        </View>
        
        <TouchableOpacity 
          style={styles.searchButton}
          onPress={handleSearch}
          disabled={isSearching}
        >
          {isSearching ? (
            <ActivityIndicator color="#f7fff9" size="small" />
          ) : (
            <Text style={styles.searchButtonText}>Buscar</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Botón de ubicación actual */}
      <View style={styles.currentLocationContainer}>
        <TouchableOpacity 
          style={styles.currentLocationButton}
          onPress={handleGetCurrentLocation}
          disabled={isGettingLocation}
        >
          {isGettingLocation ? (
            <>
              <ActivityIndicator color="#1a535c" size="small" />
              <Text style={styles.currentLocationText}>Obteniendo ubicación...</Text>
            </>
          ) : (
            <>
              <Ionicons name="locate" size={20} color="#1a535c" />
              <Text style={styles.currentLocationText}>Usar mi ubicación actual</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Instrucciones flotantes */}
      {!selectedLocation && (
        <View style={styles.instructionsContainer}>
          <View style={styles.instructionsCard}>
            <Ionicons name="information-circle" size={24} color="#4ecdc4" />
            <Text style={styles.instructionsText}>
              Toca en el mapa para marcar la ubicación de tu negocio
            </Text>
          </View>
        </View>
      )}

      {/* Panel inferior con información */}
      <View style={styles.bottomPanel}>
        {selectedLocation ? (
          <View style={styles.locationInfo}>
            <View style={styles.locationHeader}>
              <Ionicons name="location" size={24} color="#4ecdc4" />
              <Text style={styles.locationLabel}>Ubicación seleccionada</Text>
            </View>
            
            <Text style={styles.locationAddress} numberOfLines={2}>
              {selectedLocation.address}
            </Text>
            
            <View style={styles.coordinatesContainer}>
              <Ionicons name="navigate" size={16} color="#4ecdc4" />
              <Text style={styles.coordinatesText}>
                {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.placeholderContainer}>
            <Text style={styles.placeholderTitle}>
              Selecciona la ubicación de tu negocio
            </Text>
            <View style={styles.optionsList}>
              <View style={styles.optionItem}>
                <Ionicons name="search" size={16} color="#4ecdc4" />
                <Text style={styles.optionText}>Busca una dirección</Text>
              </View>
              <View style={styles.optionItem}>
                <Ionicons name="locate" size={16} color="#4ecdc4" />
                <Text style={styles.optionText}>Usa tu ubicación actual</Text>
              </View>
              <View style={styles.optionItem}>
                <Ionicons name="finger-print" size={16} color="#4ecdc4" />
                <Text style={styles.optionText}>Toca en el mapa</Text>
              </View>
            </View>
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.confirmButton,
            !selectedLocation && styles.confirmButtonDisabled,
          ]}
          onPress={handleConfirm}
          disabled={!selectedLocation}
        >
          <Ionicons name="checkmark-circle" size={24} color="#f7fff9" />
          <Text style={styles.confirmButtonText}>
            Confirmar Ubicación
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7fff9',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 50,
    backgroundColor: '#ffffff',
    borderBottomWidth: 2,
    borderBottomColor: '#c1f9e1',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a535c',
  },
  placeholder: {
    width: 40,
  },
  map: {
    flex: 1,
  },
  searchContainer: {
    position: 'absolute',
    top: 100,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    zIndex: 1000,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 2,
    borderColor: '#c1f9e1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1a535c',
    marginLeft: 12,
  },
  clearButton: {
    padding: 4,
  },
  searchButton: {
    backgroundColor: '#4ecdc4',
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 14,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 90,
    shadowColor: '#4ecdc4',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  searchButtonText: {
    color: '#f7fff9',
    fontSize: 16,
    fontWeight: 'bold',
  },
  currentLocationContainer: {
    position: 'absolute',
    top: 170,
    left: 16,
    right: 16,
    zIndex: 999,
  },
  currentLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#c1f9e1',
    padding: 14,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#c1f9e1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  currentLocationText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a535c',
    marginLeft: 8,
  },
  instructionsContainer: {
    position: 'absolute',
    top: 240,
    left: 16,
    right: 16,
    zIndex: 998,
  },
  instructionsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#c1f9e1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  instructionsText: {
    flex: 1,
    fontSize: 14,
    color: '#1a535c',
    marginLeft: 12,
    lineHeight: 20,
  },
  bottomPanel: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    borderTopWidth: 2,
    borderTopColor: '#c1f9e1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  locationInfo: {
    marginBottom: 16,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationLabel: {
    fontSize: 16,
    color: '#1a535c',
    fontWeight: '600',
    marginLeft: 8,
  },
  locationAddress: {
    fontSize: 15,
    color: '#1a535c',
    marginBottom: 12,
    lineHeight: 22,
  },
  coordinatesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#c1f9e1',
    padding: 10,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  coordinatesText: {
    fontSize: 13,
    color: '#1a535c',
    fontWeight: '500',
    marginLeft: 6,
  },
  placeholderContainer: {
    marginBottom: 16,
  },
  placeholderTitle: {
    fontSize: 16,
    color: '#1a535c',
    fontWeight: '600',
    marginBottom: 16,
  },
  optionsList: {
    gap: 12,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionText: {
    fontSize: 14,
    color: '#95a5a6',
    marginLeft: 10,
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ff6b6b',
    padding: 18,
    borderRadius: 16,
    shadowColor: '#ff6b6b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmButtonDisabled: {
    opacity: 0.5,
  },
  confirmButtonText: {
    color: '#f7fff9',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default MapLocationPicker;
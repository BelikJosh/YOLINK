import { Ionicons } from '@expo/vector-icons';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import * as Location from 'expo-location';
import React, { useCallback, useEffect, useRef, useState } from 'react';
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
  const [userLocation, setUserLocation] = useState<{latitude: number, longitude: number} | null>(null);

  useEffect(() => {
    requestInitialLocation();
  }, []);

  const requestInitialLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        const userLoc = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };

        setUserLocation(userLoc);
        
        // Centrar mapa en la ubicación del usuario
        const newRegion = {
          ...userLoc,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        };
        
        setRegion(newRegion);
      }
    } catch (error) {
      console.log('Could not get initial location:', error);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      Alert.alert('Empty Field', 'Please enter an address to search');
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1&countrycodes=mx`
      );
      const data = await response.json();

      if (data && data.length > 0) {
        const location = data[0];
        const lat = parseFloat(location.lat);
        const lng = parseFloat(location.lon);
        
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

        Alert.alert('Location Found', 'Location marked on map successfully');
      } else {
        Alert.alert('Not Found', 'Location not found. Try another address.');
      }
    } catch (error) {
      console.error('Error searching location:', error);
      Alert.alert('Error', 'Error searching location. Check your connection.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleGetCurrentLocation = async () => {
    setIsGettingLocation(true);
    
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permissions Required',
          'We need location permissions to get your current position'
        );
        setIsGettingLocation(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const lat = location.coords.latitude;
      const lng = location.coords.longitude;

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

      // Obtener dirección
      try {
        const [address] = await Location.reverseGeocodeAsync({
          latitude: lat,
          longitude: lng
        });

        const fullAddress = [
          address.street,
          address.streetNumber,
          address.city,
          address.region
        ].filter(Boolean).join(', ');

        setSelectedLocation({
          lat: lat,
          lng: lng,
          address: fullAddress || `${lat.toFixed(6)}, ${lng.toFixed(6)}`
        });
      } catch (error) {
        setSelectedLocation({
          lat: lat,
          lng: lng,
          address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`
        });
      }

      Alert.alert('Location Obtained', 'Your current location has been marked on the map');
      
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Could not get your current location. Make sure GPS is enabled.');
    } finally {
      setIsGettingLocation(false);
    }
  };

  const handleMapPress = useCallback(async (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    
    try {
      const [address] = await Location.reverseGeocodeAsync({
        latitude: latitude,
        longitude: longitude
      });

      const fullAddress = [
        address.street,
        address.streetNumber,
        address.city,
        address.region
      ].filter(Boolean).join(', ');

      setSelectedLocation({
        lat: latitude,
        lng: longitude,
        address: fullAddress || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
      });
    } catch (error) {
      console.error('Error getting address:', error);
      setSelectedLocation({
        lat: latitude,
        lng: longitude,
        address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
      });
    }
  }, []);

  const handleConfirm = () => {
    if (!selectedLocation) {
      Alert.alert('No Location', 'Please select a location on the map first');
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
        <Text style={styles.headerTitle}>Business Location</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Map */}
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
        {selectedLocation && mapReady && (
          <Marker
            coordinate={{
              latitude: selectedLocation.lat,
              longitude: selectedLocation.lng
            }}
            title="Your business location"
            description={selectedLocation.address}
            pinColor="#ff6b6b"
          />
        )}
      </MapView>

      {/* Search Container */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBarWrapper}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#4ecdc4" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search address..."
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
              <Ionicons name="search" size={20} color="#f7fff9" />
            )}
          </TouchableOpacity>
        </View>

        {/* Current Location Button */}
        <TouchableOpacity 
          style={styles.currentLocationButton}
          onPress={handleGetCurrentLocation}
          disabled={isGettingLocation}
        >
          {isGettingLocation ? (
            <>
              <ActivityIndicator color="#1a535c" size="small" />
              <Text style={styles.currentLocationText}>Getting location...</Text>
            </>
          ) : (
            <>
              <Ionicons name="locate" size={20} color="#4ecdc4" />
              <Text style={styles.currentLocationText}>Use my current location</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Instructions - Only show when no location selected */}
      {!selectedLocation && (
        <View style={styles.instructionsCard}>
          <Ionicons name="information-circle-outline" size={22} color="#4ecdc4" />
          <Text style={styles.instructionsText}>
            Tap on the map to mark your business location
          </Text>
        </View>
      )}

      {/* Bottom Panel */}
      <View style={styles.bottomPanel}>
        {selectedLocation ? (
          <View style={styles.locationInfo}>
            <View style={styles.locationHeader}>
              <Ionicons name="location" size={20} color="#4ecdc4" />
              <Text style={styles.locationLabel}>Selected Location</Text>
            </View>
            
            <Text style={styles.locationAddress} numberOfLines={3}>
              {selectedLocation.address}
            </Text>
            
            <View style={styles.coordinatesContainer}>
              <Ionicons name="navigate" size={14} color="#4ecdc4" />
              <Text style={styles.coordinatesText}>
                {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.placeholderContainer}>
            <Text style={styles.placeholderTitle}>
              Select your business location
            </Text>
            <View style={styles.optionsList}>
              <View style={styles.optionItem}>
                <Ionicons name="search" size={16} color="#4ecdc4" />
                <Text style={styles.optionText}>Search for an address</Text>
              </View>
              <View style={styles.optionItem}>
                <Ionicons name="locate" size={16} color="#4ecdc4" />
                <Text style={styles.optionText}>Use your current location</Text>
              </View>
              <View style={styles.optionItem}>
                <Ionicons name="hand-left" size={16} color="#4ecdc4" />
                <Text style={styles.optionText}>Tap on the map</Text>
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
          <Ionicons name="checkmark-circle" size={22} color="#f7fff9" />
          <Text style={styles.confirmButtonText}>
            Confirm Location
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
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 2,
    borderBottomColor: '#c1f9e1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 10,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
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
    top: 110,
    left: 16,
    right: 16,
    zIndex: 1000,
  },
  searchBarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
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
    fontSize: 15,
    color: '#1a535c',
    marginLeft: 10,
  },
  clearButton: {
    padding: 4,
  },
  searchButton: {
    backgroundColor: '#4ecdc4',
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4ecdc4',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  currentLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#c1f9e1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    gap: 8,
  },
  currentLocationText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a535c',
  },
  instructionsCard: {
    position: 'absolute',
    top: 230,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#c1f9e1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 998,
    gap: 10,
  },
  instructionsText: {
    flex: 1,
    fontSize: 13,
    color: '#1a535c',
    lineHeight: 18,
  },
  bottomPanel: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
    borderTopWidth: 2,
    borderTopColor: '#c1f9e1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  locationInfo: {
    marginBottom: 20,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 6,
  },
  locationLabel: {
    fontSize: 14,
    color: '#1a535c',
    fontWeight: '600',
  },
  locationAddress: {
    fontSize: 14,
    color: '#1a535c',
    marginBottom: 10,
    lineHeight: 20,
  },
  coordinatesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#c1f9e1',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
    gap: 6,
  },
  coordinatesText: {
    fontSize: 12,
    color: '#1a535c',
    fontWeight: '500',
  },
  placeholderContainer: {
    marginBottom: 20,
  },
  placeholderTitle: {
    fontSize: 15,
    color: '#1a535c',
    fontWeight: '600',
    marginBottom: 14,
  },
  optionsList: {
    gap: 10,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  optionText: {
    fontSize: 13,
    color: '#95a5a6',
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ff6b6b',
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#ff6b6b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    gap: 8,
  },
  confirmButtonDisabled: {
    opacity: 0.5,
  },
  confirmButtonText: {
    color: '#f7fff9',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default MapLocationPicker;
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import haversine from 'haversine-distance';
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';

const GOOGLE_MAPS_APIKEY = 'AIzaSyDvqzlFLL9XHiafJtJutIim_VcxPGRs3wk';

const HomeScreenClient = ({ route }: any) => {
  const [location, setLocation] = useState<any>(null);
  const [destination, setDestination] = useState<any>(null);
  const [storeName, setStoreName] = useState('');
  const [storeAddress, setStoreAddress] = useState('');
  const [distance, setDistance] = useState<number | null>(null);
  const [isTracking, setIsTracking] = useState(false);

  const mapRef = useRef<MapView>(null);
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);

  // Obtener ubicación inicial
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      let loc = await Location.getCurrentPositionAsync({});
      setLocation({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
    })();
  }, []);

  // Configurar destino si se recibe una tienda
  useEffect(() => {
    if (route?.params?.store) {
      const { name, address, latitude, longitude } = route.params.store;
      setDestination({ latitude, longitude });
      setStoreName(name);
      setStoreAddress(address);

      if (location && mapRef.current) {
        mapRef.current.fitToCoordinates([location, { latitude, longitude }], {
          edgePadding: { top: 100, right: 50, bottom: 100, left: 50 },
          animated: true,
        });
      }
    }
  }, [route?.params?.store, location]);

  // Calcular distancia en tiempo real
  const startTracking = async () => {
    if (!destination) return;

    setIsTracking(true);
    locationSubscription.current = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, distanceInterval: 1 },
      (loc) => {
        const newLocation = {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        };
        setLocation(newLocation);

        const dist = haversine(newLocation, destination);
        setDistance(dist);

        if (dist < 10) {
          setIsTracking(false);
          if (locationSubscription.current) {
            locationSubscription.current.remove();
          }
          alert('✅ Has llegado a tu destino');
        }
      }
    );
  };

  const stopTracking = () => {
    setIsTracking(false);
    if (locationSubscription.current) {
      locationSubscription.current.remove();
    }
  };

  const clearRoute = () => {
    stopTracking();
    setDestination(null);
    setDistance(null);
  };

  return (
    <View style={styles.container}>
      {location ? (
        <>
          <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={{
              latitude: location.latitude,
              longitude: location.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
            showsUserLocation
            followsUserLocation
          >
            {destination && (
              <Marker
                coordinate={destination}
                title={storeName}
                description={storeAddress}
              >
                <Ionicons name="storefront" size={30} color="#ff6b6b" />
              </Marker>
            )}

            {destination && (
              <MapViewDirections
                origin={location}
                destination={destination}
                apikey={GOOGLE_MAPS_APIKEY}
                strokeWidth={4}
                strokeColor="#4ecdc4"
              />
            )}
          </MapView>

          {destination && (
            <View style={styles.infoContainer}>
              <Text style={styles.title}>{storeName}</Text>
              <Text style={styles.subtitle}>{storeAddress}</Text>

              {distance !== null && (
                <Text style={styles.distance}>
                  Distancia restante: {(distance / 1000).toFixed(2)} km
                </Text>
              )}

              {!isTracking ? (
                <TouchableOpacity
                  style={styles.startButton}
                  onPress={startTracking}
                >
                  <Ionicons name="navigate" size={20} color="#fff" />
                  <Text style={styles.btnText}>Comenzar ruta</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.stopButton}
                  onPress={stopTracking}
                >
                  <Ionicons name="pause" size={20} color="#fff" />
                  <Text style={styles.btnText}>Detener seguimiento</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.clearButton}
                onPress={clearRoute}
              >
                <Ionicons name="close" size={20} color="#fff" />
                <Text style={styles.btnText}>Cerrar ruta</Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      ) : (
        <Text style={styles.loading}>Obteniendo ubicación...</Text>
      )}
    </View>
  );
};

export default HomeScreenClient;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  map: { flex: 1 },
  loading: { textAlign: 'center', marginTop: 50, color: '#1a535c' },
  infoContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 15,
    elevation: 6,
  },
  title: { fontSize: 18, fontWeight: 'bold', color: '#1a535c' },
  subtitle: { fontSize: 14, color: '#4f6367', marginBottom: 8 },
  distance: { fontSize: 14, color: '#1a535c', marginBottom: 10 },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4ecdc4',
    padding: 10,
    borderRadius: 10,
    justifyContent: 'center',
    gap: 6,
    marginBottom: 8,
  },
  stopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f4a261',
    padding: 10,
    borderRadius: 10,
    justifyContent: 'center',
    gap: 6,
    marginBottom: 8,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ff6b6b',
    padding: 10,
    borderRadius: 10,
    justifyContent: 'center',
    gap: 6,
  },
  btnText: { color: '#fff', fontWeight: '600' },
});

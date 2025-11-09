import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import haversine from 'haversine-distance';
import React, { useEffect, useRef, useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';

const GOOGLE_MAPS_APIKEY = 'AIzaSyDvqzlFLL9XHiafJtJutIim_VcxPGRs3wk';

const HomeScreenClient = ({ route, navigation }: any) => {
  const [location, setLocation] = useState<any>(null);
  const [destination, setDestination] = useState<any>(null);
  const [storeName, setStoreName] = useState('');
  const [storeAddress, setStoreAddress] = useState('');
  const [distance, setDistance] = useState<number | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [filteredVendors, setFilteredVendors] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<any[]>([]);

  const mapRef = useRef<MapView>(null);
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);

  const vendors = [
    {
      id: '1',
      name: 'Cafetería La Esquina',
      address: 'Av. Central 102, CDMX',
      latitude: 19.4326,
      longitude: -99.1332,
      category: 'Cafetería',
      schedule: '8:00 - 20:00',
      phone: '555-123-4567',
    },
    {
      id: '2',
      name: 'Tienda Orgánica VerdeVida',
      address: 'Calle Reforma 89, CDMX',
      latitude: 19.4365,
      longitude: -99.1402,
      category: 'Productos Naturales',
      schedule: '9:00 - 21:00',
      phone: '555-987-6543',
    },
  ];

  // Filtrar búsqueda
  useEffect(() => {
    if (search.trim() === '') setFilteredVendors([]);
    else {
      const filtered = vendors.filter(v =>
        v.name.toLowerCase().includes(search.toLowerCase())
      );
      setFilteredVendors(filtered);
    }
  }, [search]);

  // Obtener ubicación inicial
  useEffect(() => {
    (async () => {
      try {
        console.log('📍 Solicitando permisos de ubicación...');
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.log('❌ Permisos denegados');
          alert('⚠️ Se necesitan permisos de ubicación');
          return;
        }
        console.log('✅ Permisos concedidos');
        let loc = await Location.getCurrentPositionAsync({});
        console.log('📍 Ubicación obtenida:', loc.coords);
        setLocation({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
      } catch (error) {
        console.error('❌ Error obteniendo ubicación:', error);
      }
    })();
  }, []);

  // Si viene una tienda desde NearStores o Favoritos
  useEffect(() => {
    if (route?.params?.store) {
      try {
        console.log('🏪 Procesando tienda desde params:', route.params.store);
        const { name, address, latitude, longitude } = route.params.store;
        if (latitude && longitude) {
          setDestination({ latitude, longitude });
          setStoreName(name);
          setStoreAddress(address);
          setSelectedVendor(route.params.store);
          console.log('✅ Tienda procesada correctamente');
        }
      } catch (error) {
        console.error('❌ Error al procesar la tienda:', error);
      }
    }
  }, [route?.params?.store]);

  // Cleanup al desmontar componente
  useEffect(() => {
    return () => {
      console.log('🧹 Limpiando componente...');
      if (locationSubscription.current) {
        locationSubscription.current.remove();
        locationSubscription.current = null;
      }
    };
  }, []);

  // Seguimiento en tiempo real
  const startTracking = async () => {
    console.log('🚀 Intentando iniciar tracking...');
    if (!destination) {
      console.log('❌ No hay destino');
      return;
    }

    // Limpia cualquier suscripción existente
    if (locationSubscription.current) {
      console.log('🧹 Limpiando suscripción anterior...');
      locationSubscription.current.remove();
      locationSubscription.current = null;
    }

    setIsTracking(true);
    
    try {
      console.log('📡 Iniciando watchPositionAsync...');
      locationSubscription.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, distanceInterval: 2 },
        (loc) => {
          const newLocation = {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          };
          setLocation(newLocation);

          const dist = haversine(newLocation, destination);
          setDistance(dist);

          if (dist < 10) {
            console.log('✅ Llegaste al destino');
            setIsTracking(false);
            if (locationSubscription.current) {
              locationSubscription.current.remove();
              locationSubscription.current = null;
            }
            alert('✅ Has llegado a tu destino');
          }
        }
      );
      console.log('✅ Tracking iniciado correctamente');
    } catch (error) {
      console.error('❌ Error al iniciar tracking:', error);
      setIsTracking(false);
      alert('⚠️ Error al iniciar el seguimiento');
    }
  };

  const stopTracking = () => {
    console.log('⏸️ Deteniendo tracking...');
    setIsTracking(false);
    if (locationSubscription.current) {
      locationSubscription.current.remove();
      locationSubscription.current = null;
    }
  };

  const clearRoute = () => {
    console.log('🗑️ Limpiando ruta...');
    stopTracking();
    setDestination(null);
    setDistance(null);
    setSelectedVendor(null);
    setStoreName('');
    setStoreAddress('');
  };

  const handleVendorPress = (vendor: any) => {
    console.log('👆 Vendor presionado:', vendor);
    
    try {
      if (!vendor) {
        console.error('❌ Vendor es null o undefined');
        alert('⚠️ Error: Negocio no disponible');
        return;
      }

      if (!vendor.latitude || !vendor.longitude) {
        console.error('❌ Vendor sin coordenadas:', vendor);
        alert('⚠️ Error: Negocio sin ubicación');
        return;
      }
      
      // Detener tracking anterior si existe
      if (isTracking) {
        console.log('⏸️ Deteniendo tracking previo...');
        stopTracking();
      }
      
      console.log('✅ Configurando vendor:', vendor.name);
      setSelectedVendor(vendor);
      setDestination({ latitude: vendor.latitude, longitude: vendor.longitude });
      setStoreName(vendor.name);
      setStoreAddress(vendor.address);
      console.log('✅ Vendor configurado correctamente');
    } catch (error) {
      console.error('❌ ERROR EN handleVendorPress:', error);
      alert('⚠️ Error al seleccionar negocio');
    }
  };

  const addToFavorites = (vendor: any) => {
    console.log('❤️ Agregando a favoritos:', vendor.name);
    if (!favorites.some(f => f.id === vendor.id)) {
      setFavorites(prev => [...prev, vendor]);
      alert('❤️ Agregado a favoritos');
    } else {
      alert('⚠️ Ya está en favoritos');
    }
  };

  console.log('🔄 Renderizando componente. Location:', location ? 'OK' : 'NULL');

  return (
    <View style={styles.container}>
      {/* 🔎 Barra de búsqueda */}
      <TextInput
        style={styles.searchBar}
        placeholder="Buscar negocio..."
        value={search}
        onChangeText={setSearch}
      />

      {/* Lista de búsqueda */}
      {filteredVendors.length > 0 && (
        <FlatList
          data={filteredVendors}
          keyExtractor={(item) => item.id}
          style={styles.searchList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.searchItem}
              onPress={() => {
                console.log('🔍 Búsqueda: seleccionado', item.name);
                setSearch('');
                handleVendorPress(item);
              }}
            >
              <Ionicons name="storefront" size={18} color="#1a535c" />
              <Text style={styles.searchText}>{item.name}</Text>
            </TouchableOpacity>
          )}
        />
      )}

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
          >
            {vendors.map((vendor) => (
              <Marker
                key={vendor.id}
                coordinate={{
                  latitude: vendor.latitude,
                  longitude: vendor.longitude,
                }}
                onPress={() => {
                  console.log('📍 Marker presionado:', vendor.name);
                  handleVendorPress(vendor);
                }}
              >
                <Ionicons name="storefront" size={28} color="#ff6b6b" />
              </Marker>
            ))}

            {destination && (
              <MapViewDirections
                origin={location}
                destination={destination}
                apikey={GOOGLE_MAPS_APIKEY}
                strokeWidth={4}
                strokeColor="#4ecdc4"
                onError={(error) => console.error('❌ Error en MapViewDirections:', error)}
                onReady={(result) => console.log('✅ Ruta lista:', result.distance, 'km')}
              />
            )}
          </MapView>

          {/* Info del negocio */}
          {selectedVendor && (
            <View style={styles.infoContainer}>
              <Text style={styles.title}>{selectedVendor.name}</Text>
              <Text style={styles.subtitle}>{selectedVendor.address}</Text>
              <Text style={styles.detail}>📦 {selectedVendor.category}</Text>
              <Text style={styles.detail}>🕒 {selectedVendor.schedule}</Text>
              <Text style={styles.detail}>📞 {selectedVendor.phone}</Text>

              {distance !== null && (
                <Text style={styles.distance}>
                  Distancia: {(distance / 1000).toFixed(2)} km
                </Text>
              )}

              {!isTracking ? (
                <TouchableOpacity style={styles.startButton} onPress={startTracking}>
                  <Ionicons name="navigate" size={20} color="#fff" />
                  <Text style={styles.btnText}>Comenzar ruta</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.stopButton} onPress={stopTracking}>
                  <Ionicons name="pause" size={20} color="#fff" />
                  <Text style={styles.btnText}>Detener</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.favoriteButton}
                onPress={() => addToFavorites(selectedVendor)}
              >
                <Ionicons name="heart" size={20} color="#fff" />
                <Text style={styles.btnText}>Agregar a favoritos</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.clearButton} onPress={clearRoute}>
                <Ionicons name="close" size={20} color="#fff" />
                <Text style={styles.btnText}>Cerrar</Text>
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
  container: { flex: 1 },
  map: { flex: 1 },
  searchBar: {
    position: 'absolute',
    top: 40,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 8,
    zIndex: 10,
    elevation: 6,
  },
  searchList: {
    position: 'absolute',
    top: 80,
    left: 20,
    right: 20,
    zIndex: 11,
    backgroundColor: '#fff',
    borderRadius: 10,
    elevation: 6,
    maxHeight: 180,
  },
  searchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomColor: '#eee',
    borderBottomWidth: 1,
    gap: 10,
  },
  searchText: { color: '#1a535c', fontSize: 14 },
  loading: { textAlign: 'center', marginTop: 50 },
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
  subtitle: { fontSize: 14, color: '#4f6367', marginBottom: 4 },
  detail: { fontSize: 13, color: '#4f6367' },
  distance: { fontSize: 14, color: '#1a535c', marginVertical: 6 },
  startButton: {
    flexDirection: 'row',
    backgroundColor: '#4ecdc4',
    padding: 10,
    borderRadius: 10,
    justifyContent: 'center',
    marginVertical: 4,
  },
  stopButton: {
    flexDirection: 'row',
    backgroundColor: '#f4a261',
    padding: 10,
    borderRadius: 10,
    justifyContent: 'center',
    marginVertical: 4,
  },
  favoriteButton: {
    flexDirection: 'row',
    backgroundColor: '#ff6b6b',
    padding: 10,
    borderRadius: 10,
    justifyContent: 'center',
    marginVertical: 4,
  },
  clearButton: {
    flexDirection: 'row',
    backgroundColor: '#333',
    padding: 10,
    borderRadius: 10,
    justifyContent: 'center',
    marginVertical: 4,
  },
  btnText: { color: '#fff', fontWeight: '600', marginLeft: 5 },
});
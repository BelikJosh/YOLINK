import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { dynamodb, TABLE_NAME } from '../aws-config';

interface Store {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  categoria?: string;
  rating?: number;
  descripcion?: string;
  telefono?: string;
  horario?: {
    apertura: string;
    cierre: string;
    dias: string[];
  };
  distance?: number;
}

interface Props {
  navigation: any;
  user?: any;
}

const NearStoresScreen: React.FC<Props> = ({ navigation, user }) => {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const DEFAULT_LOCATION = {
    latitude: 19.4326,
    longitude: -99.1332,
  };

  useEffect(() => {
    initializeLocation();
    loadStores();
  }, []);

  const initializeLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        setUserLocation(DEFAULT_LOCATION);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    } catch (error) {
      console.error('Error getting location:', error);
      setUserLocation(DEFAULT_LOCATION);
    }
  };

  const loadStores = async () => {
    try {
      setLoading(true);

      const params = {
        TableName: TABLE_NAME,
        FilterExpression: 'userType = :userType',
        ExpressionAttributeValues: {
          ':userType': 'vendor',
        },
      };

      const result = await dynamodb.scan(params).promise();

      if (result.Items && result.Items.length > 0) {
        const storesData: Store[] = result.Items.map((item: any) => {
          const lat = item.ubicacion?.lat
            ? parseFloat(item.ubicacion.lat)
            : item.ubicacion?.M?.lat?.N
            ? parseFloat(item.ubicacion.M.lat.N)
            : DEFAULT_LOCATION.latitude;

          const lng = item.ubicacion?.lng
            ? parseFloat(item.ubicacion.lng)
            : item.ubicacion?.M?.lng?.N
            ? parseFloat(item.ubicacion.M.lng.N)
            : DEFAULT_LOCATION.longitude;

          return {
            id: item.id,
            name: item.nombre || 'Unnamed Store',
            address:
              item.ubicacion?.direccion ||
              item.ubicacion?.M?.direccion?.S ||
              'Address not available',
            latitude: lat,
            longitude: lng,
            categoria: item.categoria || 'General',
            rating: parseFloat(item.rating) || 4.0,
            descripcion: item.descripcion || '',
            telefono: item.telefono || '',
            horario: item.horario || {
              apertura: '09:00',
              cierre: '18:00',
              dias: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
            },
          };
        }).filter(
          (store) =>
            store.latitude !== DEFAULT_LOCATION.latitude &&
            store.longitude !== DEFAULT_LOCATION.longitude &&
            store.latitude !== 0 &&
            store.longitude !== 0
        );

        // Calcular distancias si tenemos ubicación del usuario
        const storesWithDistance = calculateDistances(storesData);
        
        // Ordenar por distancia (más cercanos primero)
        storesWithDistance.sort((a, b) => {
          if (!a.distance) return 1;
          if (!b.distance) return -1;
          return a.distance - b.distance;
        });

        setStores(storesWithDistance);
      } else {
        setStores([]);
      }
    } catch (error) {
      console.error('Error loading stores:', error);
      Alert.alert('Error', 'No se pudieron cargar las tiendas');
      setStores([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateDistances = (storesList: Store[]): Store[] => {
    if (!userLocation) return storesList;

    return storesList.map((store) => ({
      ...store,
      distance: calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        store.latitude,
        store.longitude
      ),
    }));
  };

  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
    const R = 6371; // Radio de la Tierra en km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await initializeLocation();
    await loadStores();
    setRefreshing(false);
  }, []);

  const handleNavigateToStore = (store: Store) => {
    // Navegar al HomeScreenClient (o la pantalla que tenga el mapa) con los datos de la tienda
    navigation.navigate('Explore', { store });
  };

  const handleAddToFavorites = async (store: Store) => {
    if (!user) {
      Alert.alert('Error', 'Debes iniciar sesión para agregar favoritos');
      return;
    }

    try {
      const favoriteId = `FAVORITE#${user.id}#${store.id}`;

      const params = {
        TableName: TABLE_NAME,
        Item: {
          id: favoriteId,
          userType: 'favorite',
          userId: user.id,
          vendorId: store.id,
          vendorData: JSON.stringify(store),
          fechaAgregado: new Date().toISOString(),
        },
      };

      await dynamodb.put(params).promise();

      Alert.alert('¡Agregado!', `${store.name} se agregó a tus favoritos`);
    } catch (error) {
      console.error('Error adding to favorites:', error);
      Alert.alert('Error', 'No se pudo agregar a favoritos');
    }
  };

  const renderStore = ({ item }: { item: Store }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.storeInfo}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.categoria}>{item.categoria}</Text>
        </View>
        <View style={styles.ratingContainer}>
          <Ionicons name="star" size={16} color="#ff6b6b" />
          <Text style={styles.rating}>{item.rating?.toFixed(1) || '4.0'}</Text>
        </View>
      </View>

      <View style={styles.addressContainer}>
        <Ionicons name="location-outline" size={16} color="#4ecdc4" />
        <Text style={styles.address} numberOfLines={2}>
          {item.address}
        </Text>
      </View>

      {item.distance && (
        <View style={styles.distanceContainer}>
          <Ionicons name="navigate-outline" size={16} color="#4ecdc4" />
          <Text style={styles.distance}>{item.distance.toFixed(2)} km de distancia</Text>
        </View>
      )}

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.routeButton}
          onPress={() => handleNavigateToStore(item)}
        >
          <Ionicons name="navigate" size={18} color="#fff" />
          <Text style={styles.btnText}>Trazar Ruta</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.favoriteButton}
          onPress={() => handleAddToFavorites(item)}
        >
          <Ionicons name="heart" size={18} color="#fff" />
          <Text style={styles.btnText}>Favoritos</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4ecdc4" />
        <Text style={styles.loadingText}>Cargando tiendas cercanas...</Text>
      </View>
    );
  }

  const handleRoute = (store: any) => {
    navigation.navigate('Explore', { store });
  };

  const handleFavorite = (store: any) => {
    navigation.navigate('Favorites', { store });
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.header}>Tiendas Cercanas</Text>
        <Text style={styles.subheader}>
          {stores.length} {stores.length === 1 ? 'tienda encontrada' : 'tiendas encontradas'}
        </Text>
      </View>

      {stores.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="storefront-outline" size={64} color="#c1f9e1" />
          <Text style={styles.emptyText}>No hay tiendas disponibles</Text>
          <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
            <Ionicons name="refresh" size={20} color="#fff" />
            <Text style={styles.refreshButtonText}>Recargar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={stores}
          keyExtractor={(item) => item.id}
          renderItem={renderStore}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#4ecdc4']}
              tintColor="#4ecdc4"
            />
          }
        />
      )}
    </View>
  );
};

export default NearStoresScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7fff7',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f7fff7',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#1a535c',
    fontWeight: '600',
  },
  headerContainer: {
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#c1f9e1',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a535c',
    marginBottom: 4,
  },
  subheader: {
    fontSize: 14,
    color: '#95a5a6',
  },
  listContainer: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  storeInfo: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a535c',
    marginBottom: 4,
  },
  categoria: {
    fontSize: 14,
    color: '#95a5a6',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff5f5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  rating: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ff6b6b',
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 8,
  },
  address: {
    flex: 1,
    fontSize: 14,
    color: '#4f6367',
    lineHeight: 20,
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 6,
  },
  distance: {
    fontSize: 14,
    color: '#4ecdc4',
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  routeButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#4ecdc4',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  favoriteButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#ff6b6b',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  btnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#1a535c',
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 24,
  },
  refreshButton: {
    flexDirection: 'row',
    backgroundColor: '#4ecdc4',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    gap: 8,
  },
  refreshButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
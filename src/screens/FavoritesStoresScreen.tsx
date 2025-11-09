// src/screens/FavoritesStoresScreen.tsx
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { dynamodb, TABLE_NAME } from '../aws-config';

interface FavoriteVendor {
  id: string;
  name: string;
  category: string;
  location: {
    latitude: number;
    longitude: number;
  };
  rating: number;
  description?: string;
  direccion?: string;
  telefono?: string;
  fechaAgregado: string;
}

const FavoritesStoresScreen = ({ navigation }: any) => {
  const [favorites, setFavorites] = useState<FavoriteVendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userId] = useState('user123');

  useEffect(() => {
    loadFavorites();
    
    // Agregar listener para recargar cuando se enfoque la pantalla
    const unsubscribe = navigation.addListener('focus', () => {
      loadFavorites();
    });

    return unsubscribe;
  }, [navigation]);

  const loadFavorites = async () => {
    try {
      setLoading(true);
      
      const params = {
        TableName: TABLE_NAME,
        FilterExpression: 'userType = :userType AND userId = :userId',
        ExpressionAttributeValues: {
          ':userType': 'favorite',
          ':userId': userId
        }
      };

      console.log('Cargando favoritos con params:', JSON.stringify(params, null, 2));
      const result = await dynamodb.scan(params).promise();
      
      console.log('Resultado de DynamoDB:', JSON.stringify(result, null, 2));
      
      if (result.Items && result.Items.length > 0) {
        console.log('Favoritos encontrados:', result.Items.length);
        console.log('Primer item:', JSON.stringify(result.Items[0], null, 2));
        
        const favoritesData: FavoriteVendor[] = result.Items.map((item: any) => {
          try {
            // ✅ CORRECCIÓN: Leer datos según el nuevo formato (sin .S)
            let vendorData;
            
            // Intentar leer vendorData como string directo (nuevo formato)
            if (typeof item.vendorData === 'string') {
              vendorData = JSON.parse(item.vendorData);
            } 
            // Fallback: leer formato antiguo con .S
            else if (item.vendorData?.S) {
              vendorData = JSON.parse(item.vendorData.S);
            } 
            // Si no hay vendorData, construir desde campos individuales
            else {
              vendorData = {
                name: item.vendorName || 'Sin nombre',
                category: item.vendorCategory || 'General',
                location: { latitude: 0, longitude: 0 },
                rating: 0
              };
            }

            // Leer vendorId según formato
            const vendorId = typeof item.vendorId === 'string' 
              ? item.vendorId 
              : (item.vendorId?.S || '');

            // Leer fechaAgregado según formato
            const fechaAgregado = typeof item.fechaAgregado === 'string'
              ? item.fechaAgregado
              : (item.fechaAgregado?.S || new Date().toISOString());

            console.log('Vendor procesado:', {
              id: vendorId,
              name: vendorData.name,
              category: vendorData.category
            });

            return {
              id: vendorId,
              name: vendorData.name || 'Sin nombre',
              category: vendorData.category || 'General',
              location: vendorData.location || { latitude: 0, longitude: 0 },
              rating: vendorData.rating || 0,
              description: vendorData.description,
              direccion: vendorData.direccion,
              telefono: vendorData.telefono,
              fechaAgregado: fechaAgregado
            };
          } catch (error) {
            console.error('Error parsing vendor data:', error);
            console.error('Item problemático:', JSON.stringify(item, null, 2));
            return null;
          }
        }).filter(Boolean) as FavoriteVendor[];

        console.log('Favoritos procesados:', favoritesData.length);
        setFavorites(favoritesData);
      } else {
        console.log('No hay favoritos guardados');
        setFavorites([]);
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
      Alert.alert('Error', 'No se pudieron cargar los favoritos');
      setFavorites([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadFavorites();
  };

  const removeFromFavorites = async (vendorId: string, vendorName: string) => {
    Alert.alert(
      'Eliminar de favoritos',
      `¿Estás seguro de que quieres eliminar ${vendorName} de tus favoritos?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive',
          onPress: async () => {
            try {
              const favoriteId = `FAVORITE#${userId}#${vendorId}`;
              
              // ✅ CORRECCIÓN: Usar formato correcto para el Key
              const params = {
                TableName: TABLE_NAME,
                Key: {
                  id: favoriteId  // Sin .S
                }
              };

              console.log('Eliminando favorito:', favoriteId);
              await dynamodb.delete(params).promise();
              
              // Actualizar lista local
              setFavorites(favorites.filter(fav => fav.id !== vendorId));
              Alert.alert('✅ Eliminado', 'Tienda eliminada de favoritos');
            } catch (error) {
              console.error('Error removing favorite:', error);
              Alert.alert('❌ Error', 'No se pudo eliminar de favoritos');
            }
          }
        }
      ]
    );
  };

  const handleVendorPress = (vendor: FavoriteVendor) => {
    Alert.alert(
      vendor.name,
      `¿Qué te gustaría hacer con ${vendor.name}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Ver en mapa', 
          onPress: () => navigation.navigate('Explore', { vendorToFocus: vendor })
        },
        { 
          text: 'Eliminar de favoritos', 
          style: 'destructive',
          onPress: () => removeFromFavorites(vendor.id, vendor.name)
        }
      ]
    );
  };

  const renderFavoriteItem = ({ item }: { item: FavoriteVendor }) => (
    <TouchableOpacity 
      style={styles.favoriteItem}
      onPress={() => handleVendorPress(item)}
    >
      <View style={styles.favoriteInfo}>
        <Text style={styles.favoriteName}>{item.name}</Text>
        <Text style={styles.favoriteCategory}>{item.category}</Text>
        <Text style={styles.favoriteRating}>⭐ {item.rating.toFixed(1)}</Text>
        {item.direccion && (
          <View style={styles.addressRow}>
            <Ionicons name="location" size={12} color="#666" />
            <Text style={styles.favoriteAddress}> {item.direccion}</Text>
          </View>
        )}
        {item.telefono && (
          <View style={styles.addressRow}>
            <Ionicons name="call" size={12} color="#666" />
            <Text style={styles.favoriteAddress}> {item.telefono}</Text>
          </View>
        )}
        <Text style={styles.favoriteDate}>
          Agregado: {new Date(item.fechaAgregado).toLocaleDateString('es-MX', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </Text>
      </View>
      <TouchableOpacity 
        onPress={() => removeFromFavorites(item.id, item.name)}
        style={styles.removeButton}
      >
        <Ionicons name="trash" size={20} color="#FF3B30" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Cargando favoritos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Tiendas Favoritas</Text>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
          <Ionicons name="refresh" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>
      <Text style={styles.subtitle}>
        {favorites.length} {favorites.length === 1 ? 'tienda guardada' : 'tiendas guardadas'} en tus favoritos
      </Text>
      
      {favorites.length > 0 ? (
        <FlatList
          data={favorites}
          renderItem={renderFavoriteItem}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          style={styles.list}
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="heart-outline" size={80} color="#ccc" />
          <Text style={styles.emptyText}>No tienes tiendas favoritas</Text>
          <Text style={styles.emptySubtext}>
            Agrega tiendas a tus favoritos desde el mapa para verlas aquí
          </Text>
          <TouchableOpacity 
            style={styles.exploreButton}
            onPress={() => navigation.navigate('Explore')}
          >
            <Ionicons name="map" size={20} color="white" />
            <Text style={styles.exploreButtonText}>Explorar Tiendas</Text>
          </TouchableOpacity>
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
    paddingTop: 60,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  refreshButton: {
    padding: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  list: {
    flex: 1,
  },
  favoriteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FF3B30',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  favoriteInfo: {
    flex: 1,
  },
  favoriteName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  favoriteCategory: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
    marginBottom: 4,
  },
  favoriteRating: {
    fontSize: 12,
    color: '#ff9500',
    marginBottom: 6,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  favoriteAddress: {
    fontSize: 12,
    color: '#666',
  },
  favoriteDate: {
    fontSize: 11,
    color: '#999',
    fontStyle: 'italic',
    marginTop: 4,
  },
  removeButton: {
    padding: 8,
    marginLeft: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 20,
    color: '#666',
    marginTop: 20,
    marginBottom: 8,
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingHorizontal: 40,
    marginBottom: 30,
    lineHeight: 20,
  },
  exploreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  exploreButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
});

export default FavoritesStoresScreen;
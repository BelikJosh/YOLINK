import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const FavoritesStoresScreen = ({ route, navigation }: any) => {
  const [favorites, setFavorites] = useState<any[]>([]);

  useEffect(() => {
    if (route?.params?.store) {
      const newStore = route.params.store;
      setFavorites((prev) => {
        if (!prev.some((f) => f.id === newStore.id)) {
          return [...prev, newStore];
        }
        return prev;
      });
    }
  }, [route?.params?.store]);

  const handleRoute = (store: any) => {
    navigation.navigate('Explore', { store });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Mis Tiendas Favoritas</Text>
      {favorites.length === 0 ? (
        <Text style={styles.empty}>Aún no tienes tiendas favoritas</Text>
      ) : (
        <FlatList
          data={favorites}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.address}>{item.address}</Text>

              <TouchableOpacity
                style={styles.routeButton}
                onPress={() => handleRoute(item)}
              >
                <Ionicons name="navigate" size={18} color="#fff" />
                <Text style={styles.btnText}>Comenzar ruta</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
};

export default FavoritesStoresScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7fff7', padding: 10 },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1a535c',
    textAlign: 'center',
    marginVertical: 10,
  },
  empty: { textAlign: 'center', color: '#4f6367', marginTop: 20 },
  card: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    elevation: 4,
  },
  name: { fontSize: 16, fontWeight: 'bold', color: '#1a535c' },
  address: { fontSize: 14, color: '#4f6367', marginBottom: 10 },
  routeButton: {
    flexDirection: 'row',
    backgroundColor: '#4ecdc4',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  btnText: { color: '#fff', fontWeight: '600' },
});

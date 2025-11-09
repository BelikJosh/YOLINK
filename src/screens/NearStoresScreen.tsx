import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const NearStoresScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tiendas Cercanas</Text>
      <Text>Pantalla en desarrollo</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
});

export default NearStoresScreen;
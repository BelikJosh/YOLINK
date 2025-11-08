import React, { useState } from 'react';
import { View, Text, Button, StyleSheet, ScrollView, Switch, Alert } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/Appnavigator';

type SettingsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Settings'>;

type Props = {
  navigation: SettingsScreenNavigationProp;
};

const SettingsScreen = ({ navigation }: Props) => {
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [autoSave, setAutoSave] = useState(true);

  const handleSaveSettings = () => {
    Alert.alert('Éxito', 'Configuración guardada correctamente');
  };

  const handleClearCache = () => {
    Alert.alert(
      'Limpiar Cache',
      '¿Estás seguro de que quieres limpiar la cache?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Limpiar',
          onPress: () => Alert.alert('Listo', 'Cache limpiada correctamente'),
        },
      ]
    );
  };

  const handleContactSupport = () => {
    Alert.alert('Soporte', 'Email: soporte@miempresa.com\nTel: +1 234 567 8900');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Configuración</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Preferencias</Text>
        
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Notificaciones Push</Text>
          <Switch
            value={notifications}
            onValueChange={setNotifications}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={notifications ? '#6200ee' : '#f4f3f4'}
          />
        </View>

        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Modo Oscuro</Text>
          <Switch
            value={darkMode}
            onValueChange={setDarkMode}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={darkMode ? '#6200ee' : '#f4f3f4'}
          />
        </View>

        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Guardado Automático</Text>
          <Switch
            value={autoSave}
            onValueChange={setAutoSave}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={autoSave ? '#6200ee' : '#f4f3f4'}
          />
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Privacidad y Seguridad</Text>
        
        <View style={styles.buttonContainer}>
          <Button
            title="Política de Privacidad"
            onPress={() => Alert.alert('Privacidad', 'Política de privacidad')}
            color="#757575"
          />
          <View style={styles.spacer} />
          <Button
            title="Términos de Servicio"
            onPress={() => Alert.alert('Términos', 'Términos de servicio')}
            color="#757575"
          />
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Mantenimiento</Text>
        
        <View style={styles.buttonContainer}>
          <Button
            title="Limpiar Cache"
            onPress={handleClearCache}
            color="#FF9800"
          />
          <View style={styles.spacer} />
          <Button
            title="Contactar Soporte"
            onPress={handleContactSupport}
            color="#2196F3"
          />
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <Button
          title="Guardar Configuración"
          onPress={handleSaveSettings}
          color="#4CAF50"
        />
        <View style={styles.spacer} />
        <Button
          title="Volver al Inicio"
          onPress={() => navigation.goBack()}
          color="#6200ee"
        />
      </View>

      <View style={styles.version}>
        <Text style={styles.versionText}>Versión 1.0.0</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#6200ee',
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  card: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingLabel: {
    fontSize: 16,
    color: '#333',
  },
  buttonContainer: {
    marginVertical: 8,
  },
  spacer: {
    height: 8,
  },
  version: {
    alignItems: 'center',
    padding: 20,
  },
  versionText: {
    color: '#999',
    fontSize: 14,
  },
});

export default SettingsScreen;
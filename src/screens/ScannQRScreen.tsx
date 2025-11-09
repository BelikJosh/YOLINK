import { StackNavigationProp } from '@react-navigation/stack';
import { CameraType, CameraView, useCameraPermissions } from 'expo-camera';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ClientTabParamList } from '../navigation/types';

type ScannScreenNavigationProp = StackNavigationProp<ClientTabParamList, 'Scann'>;

type Props = {
  navigation: ScannScreenNavigationProp;
};

const ScannQRScreen: React.FC<Props> = ({ navigation }) => {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [isScanning, setIsScanning] = useState(true);
  const [scannedData, setScannedData] = useState<string | null>(null);

  // Solicitar permisos automáticamente
  useEffect(() => {
    if (permission && !permission.granted) {
      requestPermission();
    }
  }, [permission]);

  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    if (!isScanning) return;
    
    console.log(`🔗 Código ${type} escaneado:`, data);
    setIsScanning(false);
    setScannedData(data);
    
    // Procesar inmediatamente el código QR
    processQRData(data);
  };

  const processQRData = (data: string) => {
    Alert.alert(
      '✅ Código QR Escaneado',
      data.length > 100 ? `${data.substring(0, 100)}...` : data,
      [
        {
          text: 'Escanear otro',
          style: 'cancel',
          onPress: () => resetScanner(),
        },
        {
          text: 'Ver detalles',
          onPress: () => showQRDetails(data),
        },
      ]
    );
  };

  const showQRDetails = (data: string) => {
    Alert.alert(
      '📋 Información del QR',
      `Contenido: ${data}\n\nLongitud: ${data.length} caracteres`,
      [
        {
          text: 'Listo',
          onPress: () => resetScanner(),
        },
      ]
    );
  };

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  const resetScanner = () => {
    setScannedData(null);
    setIsScanning(true);
  };

  // Estados de permisos
  if (!permission) {
    // Permisos aún no cargados
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#667eea" />
        <Text style={styles.message}>Cargando...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    // Permisos no concedidos
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.title}>📷 Permiso de Cámara</Text>
        <Text style={styles.subMessage}>
          Necesitamos acceso a tu cámara para escanear códigos QR de vendedores
        </Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Conceder Permiso</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Escanear QR</Text>
        <Text style={styles.subtitle}>Apunta al código QR del vendedor</Text>
      </View>

      {/* Vista de la cámara */}
      <View style={styles.cameraContainer}>
        <CameraView
          style={styles.camera}
          facing={facing}
          onBarcodeScanned={isScanning ? handleBarCodeScanned : undefined}
          barcodeScannerSettings={{
            barcodeTypes: ['qr', 'pdf417'],
          }}
        >
          <View style={styles.overlay}>
            {/* Marco de escaneo */}
            <View style={styles.scanFrame}>
              <View style={[styles.corner, styles.cornerTopLeft]} />
              <View style={[styles.corner, styles.cornerTopRight]} />
              <View style={[styles.corner, styles.cornerBottomLeft]} />
              <View style={[styles.corner, styles.cornerBottomRight]} />
            </View>
            
            {/* Instrucciones */}
            <Text style={styles.scanText}>
              {isScanning ? 'Encuadra el código QR' : '✅ Escaneo completado'}
            </Text>
          </View>
        </CameraView>
      </View>

      {/* Panel de controles */}
      <View style={styles.controls}>
        <View style={styles.buttonsRow}>
          <TouchableOpacity style={styles.actionButton} onPress={toggleCameraFacing}>
            <Text style={styles.actionButtonText}>🔄 Cámara</Text>
          </TouchableOpacity>
          
          {!isScanning && (
            <TouchableOpacity style={styles.actionButton} onPress={resetScanner}>
              <Text style={styles.actionButtonText}>📷 Nuevo Escaneo</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Resultado del escaneo */}
        {scannedData && (
          <View style={styles.resultBox}>
            <Text style={styles.resultTitle}>Último código escaneado:</Text>
            <Text style={styles.resultData} numberOfLines={2}>
              {scannedData}
            </Text>
          </View>
        )}

        {/* Información de uso */}
        <Text style={styles.infoText}>
          Escanea códigos QR de productos, pagos o promociones
        </Text>
      </View>
    </View>
  );
};

const { width } = Dimensions.get('window');
const scanFrameSize = width * 0.7;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    padding: 30,
  },
  header: {
    backgroundColor: '#1a1a1a',
    padding: 20,
    paddingTop: 60,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#ccc',
    textAlign: 'center',
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  scanFrame: {
    width: scanFrameSize,
    height: scanFrameSize,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    backgroundColor: 'transparent',
    marginBottom: 30,
  },
  corner: {
    position: 'absolute',
    width: 25,
    height: 25,
    borderColor: '#667eea',
  },
  cornerTopLeft: {
    top: -2,
    left: -2,
    borderTopWidth: 4,
    borderLeftWidth: 4,
  },
  cornerTopRight: {
    top: -2,
    right: -2,
    borderTopWidth: 4,
    borderRightWidth: 4,
  },
  cornerBottomLeft: {
    bottom: -2,
    left: -2,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
  },
  cornerBottomRight: {
    bottom: -2,
    right: -2,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
  scanText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  controls: {
    backgroundColor: '#1a1a1a',
    padding: 20,
    paddingTop: 15,
  },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 15,
    marginBottom: 15,
  },
  actionButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    minWidth: 120,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  resultBox: {
    backgroundColor: '#2d3748',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#667eea',
  },
  resultTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  resultData: {
    color: '#a0aec0',
    fontSize: 12,
    lineHeight: 16,
  },
  infoText: {
    color: '#718096',
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  message: {
    color: '#fff',
    fontSize: 16,
    marginTop: 15,
    textAlign: 'center',
  },
  subMessage: {
    color: '#ccc',
    fontSize: 14,
    textAlign: 'center',
    marginVertical: 20,
    lineHeight: 20,
  },
  // AÑADE ESTOS ESTILOS FALTANTES:
  button: {
    backgroundColor: '#667eea',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 20,
    minWidth: 200,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ScannQRScreen;
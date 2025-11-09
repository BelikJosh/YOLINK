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
  const [processingPayment, setProcessingPayment] = useState(false);

  // Solicitar permisos automáticamente
  useEffect(() => {
    if (permission && !permission.granted) {
      requestPermission();
    }
  }, [permission]);

  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    if (!isScanning || processingPayment) return;
    
    console.log(`🔗 Código ${type} escaneado:`, data);
    setIsScanning(false);
    setScannedData(data);
    
    // Procesar inmediatamente el código QR
    processQRData(data);
  };

  const processQRData = async (data: string) => {
    try {
      const qrData = JSON.parse(data);
      
      // Verificar si es un QR de pago OpenPayments
      if (qrData.type === 'open-payment' && qrData.incomingPaymentId) {
        console.log('💰 QR de pago OpenPayments detectado:', qrData);
        setProcessingPayment(true);
        
        // Iniciar flujo de pago
        await startPaymentFlow(qrData);
        
      } else {
        // QR normal - mostrar información básica
        showQRDetails(data, qrData);
      }
    } catch (error) {
      console.error('Error procesando QR:', error);
      Alert.alert(
        '❌ QR Inválido', 
        'No se pudo procesar el código QR escaneado',
        [{ text: 'OK', onPress: () => resetScanner() }]
      );
    }
  };

  const startPaymentFlow = async (qrData: any) => {
    try {
      console.log('🎯 Iniciando flujo de pago...');
      
      // 1. Iniciar pago en el backend
      const startResponse = await fetch('http://192.168.14.98:3001/op/start-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          incomingPaymentId: qrData.incomingPaymentId
        })
      });

      const startResult = await startResponse.json();

      if (startResult.ok) {
        console.log('✅ Flujo iniciado, abriendo WebView...');
        
        // 2. Navegar a la pantalla de WebView para autorización
        navigation.navigate('PaymentWebView', {
          redirectUrl: startResult.redirectUrl,
          paymentData: {
            incomingPaymentId: qrData.incomingPaymentId,
            continueUri: startResult.continueUri,
            continueAccessToken: startResult.continueAccessToken,
            amount: qrData.amount,
            description: qrData.description,
            vendor: qrData.vendor
          }
        });
        
        // Resetear scanner después de navegar
        setTimeout(() => {
          resetScanner();
          setProcessingPayment(false);
        }, 1000);
        
      } else {
        throw new Error(startResult.error || 'No se pudo iniciar el pago');
      }
    } catch (error) {
      console.error('Error en flujo de pago:', error);
      Alert.alert(
        '❌ Error de Pago', 
        `No se pudo procesar el pago: ${error.message}`,
        [{ text: 'OK', onPress: () => {
          resetScanner();
          setProcessingPayment(false);
        }}]
      );
    }
  };

  const showQRDetails = (rawData: string, parsedData: any) => {
    Alert.alert(
      '✅ Código QR Escaneado',
      `Tipo: ${parsedData.type || 'Desconocido'}\nMonto: $${parsedData.amount || 'N/A'}\nDescripción: ${parsedData.description || 'N/A'}`,
      [
        {
          text: 'Escanear otro',
          style: 'cancel',
          onPress: () => resetScanner(),
        },
        {
          text: 'Ver detalles completos',
          onPress: () => showFullQRDetails(rawData),
        },
      ]
    );
  };

  const showFullQRDetails = (data: string) => {
    Alert.alert(
      '📋 Información Completa del QR',
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
    setProcessingPayment(false);
  };

  // Estados de permisos
  if (!permission) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#667eea" />
        <Text style={styles.message}>Cargando...</Text>
      </View>
    );
  }

  if (!permission.granted) {
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
        <Text style={styles.title}>Escanear QR de Pago</Text>
        <Text style={styles.subtitle}>Apunta al código QR del vendedor</Text>
        
        {processingPayment && (
          <View style={styles.processingOverlay}>
            <ActivityIndicator size="small" color="#fff" />
            <Text style={styles.processingText}>Procesando pago...</Text>
          </View>
        )}
      </View>

      {/* Vista de la cámara */}
      <View style={styles.cameraContainer}>
        <CameraView
          style={styles.camera}
          facing={facing}
          onBarcodeScanned={isScanning && !processingPayment ? handleBarCodeScanned : undefined}
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
              {processingPayment 
                ? '🔄 Procesando pago...' 
                : isScanning 
                  ? 'Encuadra el código QR del vendedor' 
                  : '✅ Escaneo completado'
              }
            </Text>

            {/* Overlay de procesamiento */}
            {processingPayment && (
              <View style={styles.processingCameraOverlay}>
                <ActivityIndicator size="large" color="#fff" />
                <Text style={styles.processingCameraText}>Procesando pago...</Text>
              </View>
            )}
          </View>
        </CameraView>
      </View>

      {/* Panel de controles */}
      <View style={styles.controls}>
        <View style={styles.buttonsRow}>
          <TouchableOpacity 
            style={[styles.actionButton, processingPayment && styles.disabledButton]} 
            onPress={toggleCameraFacing}
            disabled={processingPayment}
          >
            <Text style={styles.actionButtonText}>🔄 Cámara</Text>
          </TouchableOpacity>
          
          {!isScanning && (
            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={resetScanner}
              disabled={processingPayment}
            >
              <Text style={styles.actionButtonText}>📷 Nuevo Escaneo</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Resultado del escaneo */}
        {scannedData && !processingPayment && (
          <View style={styles.resultBox}>
            <Text style={styles.resultTitle}>Último código escaneado:</Text>
            <Text style={styles.resultData} numberOfLines={3}>
              {scannedData.length > 150 
                ? `${scannedData.substring(0, 150)}...` 
                : scannedData
              }
            </Text>
          </View>
        )}

        {/* Información de pago procesado */}
        {processingPayment && (
          <View style={styles.paymentInfoBox}>
            <Text style={styles.paymentInfoTitle}>💳 Procesando Pago</Text>
            <Text style={styles.paymentInfoText}>
              Estamos procesando tu pago. Serás redirigido a la autorización...
            </Text>
            <ActivityIndicator size="small" color="#667eea" style={styles.paymentActivity} />
          </View>
        )}

        {/* Información de uso */}
        <Text style={styles.infoText}>
          Escanea códigos QR de pagos para comprar productos
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
    position: 'relative',
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
  processingOverlay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#667eea',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 10,
  },
  processingText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 8,
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
  processingCameraOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingCameraText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 15,
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
  disabledButton: {
    backgroundColor: '#4a5568',
    opacity: 0.6,
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
  paymentInfoBox: {
    backgroundColor: '#2d3748',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#48bb78',
  },
  paymentInfoTitle: {
    color: '#48bb78',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  paymentInfoText: {
    color: '#a0aec0',
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 10,
  },
  paymentActivity: {
    alignSelf: 'center',
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
// src/screens/PaymentWebViewScreen.tsx - VERSIÓN CORREGIDA
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { WebView } from 'react-native-webview';

// ✅ DEFINIR TIPOS PARA EL SCANN STACK
type ScannStackParamList = {
  ScannMain: undefined;
  PaymentWebView: {
    redirectUrl: string;
    paymentData: any;
  };
};

type PaymentWebViewScreenRouteProp = RouteProp<ScannStackParamList, 'PaymentWebView'>;
type PaymentWebViewScreenNavigationProp = StackNavigationProp<ScannStackParamList, 'PaymentWebView'>;

type Props = {
  route: PaymentWebViewScreenRouteProp;
  navigation: PaymentWebViewScreenNavigationProp;
};

const PaymentWebViewScreen: React.FC<Props> = ({ route, navigation }) => {
  const { redirectUrl, paymentData } = route.params;
  const [loading, setLoading] = useState(true);

  const handleNavigationStateChange = (navState: any) => {
    console.log('🔗 URL actual:', navState.url);
    
    // Detectar cuando el pago se completa
    if (navState.url.includes('/success') || navState.url.includes('/finish')) {
      handlePaymentSuccess();
    }
    
    if (navState.url.includes('/error') || navState.url.includes('/cancel')) {
      handlePaymentError();
    }
  };

  const handlePaymentSuccess = async () => {
    try {
      setLoading(true);
      
      // Completar el pago en el backend
      const completeResponse = await fetch('http://192.168.14.98:3001/op/continue-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentId: paymentData.incomingPaymentId,
          grant: 'authorized'
        })
      });

      const completeResult = await completeResponse.json();

      if (completeResult.ok) {
        Alert.alert(
          '✅ Pago Completado', 
          `Tu pago de $${paymentData.amount} ha sido procesado exitosamente.`,
          [
            { 
              text: 'Aceptar', 
              onPress: () => navigation.goBack() // ✅ Volver al scanner
            }
          ]
        );
      } else {
        Alert.alert('Error', 'No se pudo completar el pago: ' + completeResult.error);
      }
    } catch (error) {
      console.error('Error completando pago:', error);
      Alert.alert('Error', 'Hubo un problema procesando tu pago');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentError = () => {
    Alert.alert(
      '❌ Pago Cancelado',
      'El pago fue cancelado o hubo un error durante el proceso.',
      [
        { 
          text: 'Entendido', 
          onPress: () => navigation.goBack() // ✅ Volver al scanner
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#ff6b6b" />
          <Text style={styles.loadingText}>Cargando autorización...</Text>
        </View>
      )}
      
      <WebView
        source={{ uri: redirectUrl }}
        style={styles.webview}
        onLoadEnd={() => setLoading(false)}
        onNavigationStateChange={handleNavigationStateChange}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#ff6b6b',
  },
});

export default PaymentWebViewScreen;
// screens/PaymentWebViewScreen.tsx
import { RouteProp } from '@react-navigation/native';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    StyleSheet,
    View
} from 'react-native';
import { WebView } from 'react-native-webview';

type PaymentWebViewScreenProps = {
  route: RouteProp<{ params: {
    redirectUrl: string;
    paymentData: any;
  } }, 'params'>;
  navigation: any;
};

const PaymentWebViewScreen: React.FC<PaymentWebViewScreenProps> = ({ route, navigation }) => {
  const { redirectUrl, paymentData } = route.params;
  const [loading, setLoading] = useState(true);

  const handleWebViewMessage = async (event: any) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      console.log('📨 Mensaje desde WebView:', message);

      if (message.type === 'AUTHORIZATION_SUCCESS') {
        // 3. Completar el pago con los datos de autorización
        setLoading(true);
        
        const completeResponse = await fetch('http://192.168.14.168:3001/op/complete-payment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            incomingPaymentId: paymentData.incomingPaymentId,
            continueUri: paymentData.continueUri,
            continueAccessToken: paymentData.continueAccessToken,
            interact_ref: message.interact_ref,
            hash: message.hash
          })
        });

        const completeResult = await completeResponse.json();

        if (completeResult.ok) {
          Alert.alert(
            '✅ Pago Completado', 
            `Tu pago de $${paymentData.amount} ha sido procesado exitosamente.\n\nEstado: ${completeResult.outgoingPayment.state}`,
            [
              { 
                text: 'Aceptar', 
                onPress: () => navigation.goBack() 
              }
            ]
          );
          console.log('💰 Pago finalizado:', completeResult.outgoingPayment);
        } else {
          Alert.alert('Error', 'No se pudo completar el pago: ' + completeResult.error);
        }
      } else if (message.type === 'CLOSE_WEBVIEW') {
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error procesando mensaje:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#667eea" />
        </View>
      )}
      
      <WebView
        source={{ uri: redirectUrl }}
        style={styles.webview}
        onLoadEnd={() => setLoading(false)}
        onMessage={handleWebViewMessage}
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
    backgroundColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
});

export default PaymentWebViewScreen;
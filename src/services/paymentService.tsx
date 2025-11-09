// services/paymentService.ts
// services/paymentService.ts
import axios from 'axios';

// Cambia localhost por tu IP local
const API_BASE_URL = 'http://192.168.14.168:3001'; // ← USA TU IP AQUÍ

export const paymentService = {
  async generatePaymentQR(amount: string, description: string, vendorName: string) {
    try {
      console.log('🌐 Conectando a:', `${API_BASE_URL}/op/generate-qr`);
      
      const response = await axios.post(`${API_BASE_URL}/op/generate-qr`, {
        amount,
        description,
        vendorName
      }, {
        timeout: 10000, // 10 segundos timeout
      });
      
      console.log('✅ QR generado exitosamente');
      return response.data;
    } catch (error: any) {
      console.error('❌ Error generando QR:', error.message);
      console.error('URL intentada:', `${API_BASE_URL}/op/generate-qr`);
      throw error;
    }
  },

  async processPayment(qrData: any) {
    try {
      const response = await axios.post(`${API_BASE_URL}/op/process-payment`, {
        qrData
      }, {
        timeout: 10000,
      });
      return response.data;
    } catch (error: any) {
      console.error('Error procesando pago:', error.message);
      throw error;
    }
  },

  async checkServerHealth() {
    try {
      const response = await axios.get(`${API_BASE_URL}/health`, {
        timeout: 5000,
      });
      return response.data;
    } catch (error) {
      console.error('Servidor no disponible:', error);
      throw error;
    }
  }
};
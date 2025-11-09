// services/paymentService.js
const API_BASE_URL = 'http://192.168.14.168:3001';

export const paymentService = {
  async generatePaymentQR(amount: string, description: string, vendor: any) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/generate-payment-qr`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          description,
          vendor
        })
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error generando QR:', error);
      return { ok: false, error: 'Error de conexión' };
    }
  },

  async startPayment(incomingPaymentId: any) {
    try {
      const response = await fetch(`${API_BASE_URL}/op/start-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          incomingPaymentId
        })
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error iniciando pago:', error);
      return { ok: false, error: 'Error de conexión' };
    }
  }
};
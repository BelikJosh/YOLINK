// server/index.js
import express from 'express';
import cors from 'cors';
import QRCode from 'qrcode';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

const PORT = 3001;
const HOST = '0.0.0.0';

// ==================== RUTAS ====================

// Health check - PRUEBA ESTA RUTA PRIMERO
app.get('/health', (req, res) => {
  console.log('✅ Health check recibido');
  res.json({ 
    ok: true, 
    message: 'Servidor funcionando!',
    timestamp: new Date().toISOString()
  });
});

// Ruta simple de test
app.get('/op/test', (req, res) => {
  res.json({ 
    ok: true, 
    message: 'Test exitoso' 
  });
});

// Ruta PRINCIPAL para generar QR
app.post('/op/generate-qr', async (req, res) => {
  try {
    console.log('📨 Recibiendo solicitud QR:', req.body);
    
    const { amount, description, vendorName } = req.body;

    if (!amount) {
      return res.status(400).json({ 
        ok: false, 
        error: 'El monto es requerido' 
      });
    }

    // Crear datos para el QR
    const paymentData = {
      type: 'open-payment',
      amount: amount,
      description: description || 'Pago en YOLINK',
      vendor: vendorName || 'Vendedor YOLINK',
      receiver: 'https://ilp.interledger-test.dev/ocelon1',
      timestamp: new Date().toISOString()
    };

    console.log('🎯 Generando QR para:', paymentData);

    // Generar QR
    const qrCode = await QRCode.toDataURL(JSON.stringify(paymentData));

    console.log('✅ QR generado exitosamente');

    res.json({
      ok: true,
      qrCode: qrCode,
      paymentInfo: paymentData,
      message: 'QR generado correctamente'
    });

  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ 
      ok: false, 
      error: 'Error: ' + error.message 
    });
  }
});

// Ruta GET para probar QR desde navegador
app.get('/op/generate-qr', async (req, res) => {
  try {
    const testData = {
      type: 'test',
      amount: "100",
      description: "Pago de prueba desde navegador",
      vendor: "Test Vendor",
      timestamp: new Date().toISOString()
    };

    const qrCode = await QRCode.toDataURL(JSON.stringify(testData));

    res.json({
      ok: true,
      qrCode: qrCode,
      testData: testData,
      message: 'QR de prueba generado'
    });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

// Ruta para cualquier otra petición
app.use('*', (req, res) => {
  res.status(404).json({ 
    ok: false, 
    error: 'Ruta no encontrada: ' + req.originalUrl,
    rutas_disponibles: [
      'GET  /health',
      'GET  /op/test',
      'POST /op/generate-qr',
      'GET  /op/generate-qr (para prueba)'
    ]
  });
});

// Iniciar servidor
app.listen(PORT, HOST, () => {
  console.log('\n🚀 SERVIDOR INICIADO CORRECTAMENTE');
  console.log('📍 Local:    http://localhost:' + PORT);
  console.log('🌐 Red:      http://192.168.14.168:' + PORT);
  console.log('\n📋 Rutas disponibles:');
  console.log('   ✅ GET  /health');
  console.log('   ✅ GET  /op/test');
  console.log('   ✅ POST /op/generate-qr');
  console.log('   ✅ GET  /op/generate-qr (prueba)');
  console.log('\n💡 Prueba en tu navegador:');
  console.log('   http://192.168.14.168:3001/health');
  console.log('   http://192.168.14.168:3001/op/test');
});
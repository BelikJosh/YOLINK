import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import path from 'path';
import QRCode from 'qrcode';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Verificar que existen las claves
const receiverKeyPath = path.resolve(process.env.RECEIVER_PRIVATE_KEY_PATH);
const senderKeyPath = path.resolve(process.env.SENDER_PRIVATE_KEY_PATH);

if (!fs.existsSync(receiverKeyPath)) {
    console.error('❌ No existe RECEIVER_PRIVATE_KEY_PATH:', receiverKeyPath);
    process.exit(1);
}

if (!fs.existsSync(senderKeyPath)) {
    console.error('❌ No existe SENDER_PRIVATE_KEY_PATH:', senderKeyPath);
    process.exit(1);
}

console.log('✅ Todas las claves encontradas correctamente');

// Cargar claves privadas
const receiverPrivateKey = fs.readFileSync(receiverKeyPath, 'utf8');
const senderPrivateKey = fs.readFileSync(senderKeyPath, 'utf8');

// Rutas básicas
app.get('/', (req, res) => {
  res.json({ 
    message: '🚀 YoLink Server with Open Payments!',
    version: '1.0.0',
    openPayments: true,
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK',
    service: 'YoLink Open Payments Server',
    timestamp: new Date().toISOString(),
    openPaymentsConfig: {
      receiver: process.env.RECEIVER_WALLET_ADDRESS_URL,
      sender: process.env.SENDER_WALLET_ADDRESS_URL,
      keys: {
        receiver: fs.existsSync(receiverKeyPath),
        sender: fs.existsSync(senderKeyPath)
      }
    }
  });
});

// Ruta para generar JWT para Open Payments
app.post('/api/auth/generate-token', (req, res) => {
  try {
    const { keyId, role = 'receiver' } = req.body;
    
    const privateKey = role === 'receiver' ? receiverPrivateKey : senderPrivateKey;
    const keyIdToUse = keyId || (role === 'receiver' ? process.env.RECEIVER_KEY_ID : process.env.SENDER_KEY_ID);
    
    const token = jwt.sign(
      {
        iss: role === 'receiver' ? process.env.RECEIVER_WALLET_ADDRESS_URL : process.env.SENDER_WALLET_ADDRESS_URL,
        sub: keyIdToUse
      },
      privateKey,
      {
        algorithm: 'RS256',
        expiresIn: '1h',
        keyid: keyIdToUse
      }
    );
    
    res.json({
      token,
      keyId: keyIdToUse,
      role,
      expiresIn: '1h'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Ruta para información de las wallets
app.get('/api/wallets/info', (req, res) => {
  res.json({
    receiver: {
      walletAddress: process.env.RECEIVER_WALLET_ADDRESS_URL,
      keyId: process.env.RECEIVER_KEY_ID,
      publicKey: fs.readFileSync(process.env.RECEIVER_PUBLIC_KEY_PATH, 'utf8').substring(0, 100) + '...'
    },
    sender: {
      walletAddress: process.env.SENDER_WALLET_ADDRESS_URL,
      keyId: process.env.SENDER_KEY_ID,
      publicKey: fs.readFileSync(process.env.SENDER_PUBLIC_KEY_PATH, 'utf8').substring(0, 100) + '...'
    },
    redirect: {
      finish: process.env.FINISH_REDIRECT_URL
    }
  });
});

// NUEVO: Generar QR de pago para el vendedor
// ACTUALIZAR el endpoint /api/generate-payment-qr
app.post('/api/generate-payment-qr', async (req, res) => {
  try {
    const { amount, description, vendor } = req.body;
    
    if (!amount || !description) {
      return res.status(400).json({ 
        ok: false, 
        error: 'Amount y description son requeridos' 
      });
    }

    console.log('🎯 Generando QR para pago:', amount, description);

    // 1. PRIMERO crear un incoming payment válido
    const incomingResponse = await fetch(`https://ilp.interledger-test.dev/incoming-payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ILP_ACCESS_TOKEN}` // Necesitarás un token
      },
      body: JSON.stringify({
        walletAddress: process.env.RECEIVER_WALLET_ADDRESS_URL,
        amount: {
          value: amount.toString(),
          assetCode: 'USD',
          assetScale: 2
        },
        description: description,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString()
      })
    });

    let incomingPaymentId;
    
    if (incomingResponse.ok) {
      const incomingResult = await incomingResponse.json();
      incomingPaymentId = incomingResult.id;
      console.log('✅ Incoming payment creado:', incomingPaymentId);
    } else {
      // Si falla, usar un ID simulado (para desarrollo)
      console.log('⚠️ Usando incoming payment simulado');
      incomingPaymentId = `incoming_${Date.now()}_simulated`;
    }
    
    // Crear datos para el QR
    const qrData = {
      type: 'open-payment',
      incomingPaymentId: incomingPaymentId,
      amount: amount,
      description: description,
      vendor: vendor || 'Vendedor YOLink',
      timestamp: new Date().toISOString(),
      receiver: process.env.RECEIVER_WALLET_ADDRESS_URL,
      paymentUrl: `https://ilp.interledger-test.dev/op/pay/${incomingPaymentId}`
    };

    // Generar QR code
    const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrData));
    
    res.json({
      ok: true,
      qrCode: qrCodeDataURL,
      paymentInfo: {
        paymentId: incomingPaymentId,
        amount: amount,
        description: description,
        vendor: vendor,
        receiver: process.env.RECEIVER_WALLET_ADDRESS_URL,
        paymentUrl: `https://ilp.interledger-test.dev/op/pay/${incomingPaymentId}`
      }
    });
    
  } catch (error) {
    console.error('Error generando QR:', error);
    res.status(500).json({ 
      ok: false, 
      error: 'Error generando QR de pago' 
    });
  }
});

// NUEVO: Iniciar flujo de pago cuando el cliente escanea el QR
// ACTUALIZAR el endpoint /op/start-payment
app.post('/op/start-payment', async (req, res) => {
  try {
    const { incomingPaymentId } = req.body;
    
    if (!incomingPaymentId) {
      return res.status(400).json({ 
        ok: false, 
        error: 'incomingPaymentId es requerido' 
      });
    }

    console.log('💰 Iniciando pago para incoming payment:', incomingPaymentId);

    // Usar la URL directa del incoming payment
    const redirectUrl = `https://ilp.interledger-test.dev/op/pay/${incomingPaymentId}`;
    
    console.log('📍 Redirect URL:', redirectUrl);
    
    res.json({
      ok: true,
      redirectUrl: redirectUrl,
      paymentId: incomingPaymentId,
      continueUri: `http://192.168.14.168:3001/op/continue-payment`,
      continueAccessToken: `token_${Date.now()}`,
      message: 'Flujo de pago iniciado'
    });
    
  } catch (error) {
    console.error('Error iniciando pago:', error);
    res.status(500).json({ 
      ok: false, 
      error: 'Error iniciando flujo de pago: ' + error.message 
    });
  }
});

// NUEVO: Continuar pago después de la autorización
app.post('/op/continue-payment', async (req, res) => {
  try {
    const { paymentId, grant } = req.body;
    
    console.log('✅ Pago autorizado:', { paymentId, grant });
    
    // Aquí procesarías el pago exitoso
    // Notificar al vendedor, actualizar base de datos, etc.
    
    res.json({
      ok: true,
      message: 'Pago procesado exitosamente',
      paymentId: paymentId,
      completedAt: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error continuando pago:', error);
    res.status(500).json({ 
      ok: false, 
      error: 'Error procesando pago' 
    });
  }
});

// NUEVO: Webhook para notificaciones de pago
app.post('/op/webhook', async (req, res) => {
  try {
    const { event, data } = req.body;
    
    console.log('📩 Webhook recibido:', { event, data });
    
    if (event === 'payment.completed') {
      // Aquí notificarías al vendedor que el pago se completó
      console.log('💰 Pago completado:', data);
      
      // Actualizar estado en base de datos
      // Notificar al frontend via WebSockets o polling
    }
    
    res.json({ ok: true, received: true });
    
  } catch (error) {
    console.error('Error en webhook:', error);
    res.status(500).json({ ok: false, error: 'Error procesando webhook' });
  }
});

// Ruta para simular pago con Open Payments
app.post('/api/open-payments/quote', (req, res) => {
  try {
    const { receiver, amount, assetCode = 'USD', assetScale = 2 } = req.body;
    
    const quote = {
      id: 'quote_' + Date.now(),
      receiver,
      amount,
      assetCode,
      assetScale,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutos
      timestamp: new Date().toISOString()
    };
    
    res.json(quote);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Ruta para completar pago
app.post('/api/open-payments/complete', (req, res) => {
  try {
    const { paymentId, quoteId } = req.body;
    
    const result = {
      success: true,
      paymentId: paymentId || 'pay_' + Date.now(),
      quoteId,
      completedAt: new Date().toISOString(),
      redirectUrl: process.env.FINISH_REDIRECT_URL
    };
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Manejo de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log('✅ YoLink Open Payments Server running on port ' + PORT);
  console.log('📊 Health check: http://localhost:' + PORT + '/health');
  console.log('👛 Receiver: ' + process.env.RECEIVER_WALLET_ADDRESS_URL);
  console.log('👛 Sender: ' + process.env.SENDER_WALLET_ADDRESS_URL);
  console.log('🔑 Keys loaded: receiver & sender');
  console.log('💰 Endpoints disponibles:');
  console.log('   - POST /api/generate-payment-qr');
  console.log('   - POST /op/start-payment');
  console.log('   - POST /op/continue-payment');
});
// server/index.js (AJUSTES FINALES)
import dotenv from 'dotenv';
dotenv.config({ path: './.env' });

import cors from 'cors';
import express from 'express';
import fs from 'fs';
import path from 'path';
import QRCode from 'qrcode';
import { fileURLToPath } from 'url';

import openPayments from '@interledger/open-payments';
const { createAuthenticatedClient, isFinalizedGrant } = openPayments;

// ── Paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const r = (p) => (path.isAbsolute(p) ? p : path.resolve(__dirname, p));

// ── App
const app = express();
app.use(express.json());
app.use(cors({ origin: true, credentials: true }));

// ── ENV
const {
  PORT = 3001,
  RECEIVER_WALLET_ADDRESS_URL,  // Vendedor
  RECEIVER_KEY_ID,
  RECEIVER_PRIVATE_KEY_PATH,
  SENDER_WALLET_ADDRESS_URL,    // Cliente 
  SENDER_KEY_ID,
  SENDER_PRIVATE_KEY_PATH,
  FINISH_REDIRECT_URL = 'http://192.168.14.98:3001/op/finish',
} = process.env;

// Verificar variables
const required = ['RECEIVER_WALLET_ADDRESS_URL', 'RECEIVER_KEY_ID', 'RECEIVER_PRIVATE_KEY_PATH', 'SENDER_WALLET_ADDRESS_URL', 'SENDER_KEY_ID', 'SENDER_PRIVATE_KEY_PATH'];
const missing = required.filter((k) => !process.env[k] || String(process.env[k]).trim() === '');
if (missing.length) {
  console.error('❌ Faltan variables en .env:', missing);
  process.exit(1);
}

// ── Keys
const recvKeyPath = r(RECEIVER_PRIVATE_KEY_PATH);
const sendKeyPath = r(SENDER_PRIVATE_KEY_PATH);
if (!fs.existsSync(recvKeyPath)) throw new Error(`No existe RECEIVER_PRIVATE_KEY_PATH: ${recvKeyPath}`);
if (!fs.existsSync(sendKeyPath)) throw new Error(`No existe SENDER_PRIVATE_KEY_PATH: ${sendKeyPath}`);

const receiverPrivateKey = fs.readFileSync(recvKeyPath, 'utf8');
const senderPrivateKey = fs.readFileSync(sendKeyPath, 'utf8');

// ── Clients
const receiverClient = await createAuthenticatedClient({
  walletAddressUrl: RECEIVER_WALLET_ADDRESS_URL,
  keyId: RECEIVER_KEY_ID,
  privateKey: receiverPrivateKey,
  validateResponses: false,
});
const senderClient = await createAuthenticatedClient({
  walletAddressUrl: SENDER_WALLET_ADDRESS_URL,
  keyId: SENDER_KEY_ID,
  privateKey: senderPrivateKey,
  validateResponses: false,
});

// ── Helpers
async function getWalletDocs() {
  const [senderWallet, receiverWallet] = await Promise.all([
    senderClient.walletAddress.get({ url: SENDER_WALLET_ADDRESS_URL }),
    receiverClient.walletAddress.get({ url: RECEIVER_WALLET_ADDRESS_URL }),
  ]);
  return { senderWallet, receiverWallet };
}

// ==================== RUTAS PRINCIPALES ====================

// Health & debug
app.get('/health', (_req, res) => res.json({ ok: true }));

app.get('/op/wallets', async (_req, res) => {
  try {
    const docs = await getWalletDocs();
    res.json({ ok: true, ...docs });
  } catch (e) {
    console.error('wallets error:', e?.response?.data || e);
    res.status(500).json({ ok: false, error: e?.message || 'wallets failed' });
  }
});

// ── 1. GENERAR QR DE PAGO (Vendedor)
app.post('/op/generate-payment-qr', async (req, res) => {
  try {
    const { amount, description, vendorName } = req.body;

    if (!amount) {
      return res.status(400).json({ ok: false, error: 'Monto requerido' });
    }

    // 1. Crear Incoming Payment (receiver/vendedor)
    const { receiverWallet } = await getWalletDocs();
    const receiveValueMinor = Math.round(amount * 100).toString(); // Convertir a centavos

    const incomingGrant = await receiverClient.grant.request(
      { url: receiverWallet.authServer },
      { access_token: { access: [{ type: 'incoming-payment', actions: ['create','read','list'] }] } }
    );
    if (!isFinalizedGrant(incomingGrant)) throw new Error('Incoming grant no finalizado');

    const incomingPayment = await receiverClient.incomingPayment.create(
      { url: receiverWallet.resourceServer, accessToken: incomingGrant.access_token.value },
      {
        walletAddress: receiverWallet.id,
        incomingAmount: {
          assetCode: receiverWallet.assetCode,
          assetScale: receiverWallet.assetScale,
          value: receiveValueMinor
        }
      }
    );

    console.log('✅ Incoming Payment creado:', incomingPayment.id);

    // 2. Preparar datos para el QR
    const paymentData = {
      type: 'open-payment',
      incomingPaymentId: incomingPayment.id,
      amount: amount,
      description: description || 'Pago en YOLINK',
      vendor: vendorName || 'Vendedor YOLINK',
      receiverWallet: receiverWallet.id,
      timestamp: new Date().toISOString()
    };

    // 3. Generar QR
    const qrCode = await QRCode.toDataURL(JSON.stringify(paymentData));

    res.json({
      ok: true,
      qrCode: qrCode,
      paymentData: paymentData,
      incomingPayment: incomingPayment,
      message: 'QR de pago generado correctamente'
    });

  } catch (error) {
    console.error('❌ Error generando QR:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// ── 2. INICIAR PAGO (Cliente escanea QR)
app.post('/op/start-payment', async (req, res) => {
  try {
    const { incomingPaymentId } = req.body;
    
    if (!incomingPaymentId) {
      return res.status(400).json({ ok: false, error: 'incomingPaymentId requerido' });
    }

    const { senderWallet } = await getWalletDocs();

    // Crear grant OUTGOING (interactivo)
    const pendingOutgoingGrant = await senderClient.grant.request(
      { url: senderWallet.authServer },
      {
        access_token: {
          access: [{ 
            identifier: senderWallet.id, 
            type: 'outgoing-payment', 
            actions: ['read','create'],
            limits: {
              incomingPayment: incomingPaymentId
            }
          }]
        },
        interact: {
          start: ['redirect'],
          finish: { 
            method: 'redirect', 
            uri: FINISH_REDIRECT_URL, 
            nonce: Math.random().toString(36).slice(2) 
          }
        }
      }
    );

    const redirectUrl = pendingOutgoingGrant?.interact?.redirect;
    const continueUri = pendingOutgoingGrant?.continue?.uri;
    const continueAccessToken = pendingOutgoingGrant?.continue?.access_token?.value;

    if (!redirectUrl || !continueUri || !continueAccessToken) {
      throw new Error('No se obtuvo información de interacción del grant');
    }

    console.log('🎯 Iniciando flujo de pago:', { redirectUrl, continueUri });

    res.json({ 
      ok: true, 
      redirectUrl, 
      continueUri, 
      continueAccessToken,
      message: 'Flujo de pago iniciado'
    });

  } catch (error) {
    console.error('❌ Error iniciando pago:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// ── 3. PÁGINA DE FINISH (WebView)
app.get('/op/finish', (req, res) => {
  const interact_ref = req.query?.interact_ref ?? '';
  const hash = req.query?.hash ?? '';
  
  const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Open Payments - Autorización</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            margin: 0;
            padding: 20px;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            color: white;
        }
        .container {
            background: rgba(255,255,255,0.1);
            backdrop-filter: blur(10px);
            padding: 30px;
            border-radius: 20px;
            text-align: center;
            max-width: 400px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.1);
        }
        h1 {
            margin-bottom: 20px;
            font-size: 24px;
        }
        .loading {
            display: inline-block;
            width: 20px;
            height: 20px;
            border: 3px solid rgba(255,255,255,0.3);
            border-radius: 50%;
            border-top-color: #fff;
            animation: spin 1s ease-in-out infinite;
            margin-right: 10px;
        }
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>✅ Autorización Exitosa</h1>
        <p>Tu pago ha sido autorizado. Cerrando ventana...</p>
        <div style="margin-top: 20px;">
            <span class="loading"></span>
            <span>Procesando...</span>
        </div>
    </div>

    <script>
        setTimeout(function() {
            const payload = { 
                type: 'AUTHORIZATION_SUCCESS',
                interact_ref: "${interact_ref}",
                hash: "${hash}"
            };
            
            if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify(payload));
            } else {
                console.log('Datos de autorización:', payload);
            }
            
            // Cerrar automáticamente después de 2 segundos
            setTimeout(function() {
                // Intentar cerrar la ventana
                if (window.ReactNativeWebView) {
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                        type: 'CLOSE_WEBVIEW'
                    }));
                }
            }, 2000);
        }, 1000);
    </script>
</body>
</html>
  `;

  res.type('html').send(html);
});

// ── 4. FINALIZAR GRANT Y CREAR PAGO
app.post('/op/complete-payment', async (req, res) => {
  try {
    const { incomingPaymentId, continueUri, continueAccessToken, interact_ref, hash } = req.body;
    
    if (!incomingPaymentId || !continueUri || !continueAccessToken || !interact_ref) {
      return res.status(400).json({ ok: false, error: 'Parámetros requeridos faltantes' });
    }

    const { senderWallet } = await getWalletDocs();

    console.log('🎯 Completando pago...', { incomingPaymentId });

    // Continuar el grant (versión simplificada)
    let finalizedGrant;
    try {
      // Intentar con la librería primero
      finalizedGrant = await senderClient.grant.continue(
        { url: continueUri, accessToken: continueAccessToken },
        hash ? { interact_ref, hash } : { interact_ref }
      );
    } catch (libraryError) {
      console.log('⚠️  Falló librería, intentando método directo...');
      
      // Método directo como fallback
      const response = await fetch(continueUri, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `GNAP ${continueAccessToken}`,
        },
        body: JSON.stringify(hash ? { interact_ref, hash } : { interact_ref }),
      });

      if (!response.ok) {
        throw new Error(`Continue failed: ${response.status} ${await response.text()}`);
      }
      
      finalizedGrant = await response.json();
    }

    const grantAccessToken = finalizedGrant?.access_token?.value;
    if (!grantAccessToken) {
      throw new Error('No se pudo obtener access token del grant');
    }

    // CREAR EL OUTGOING PAYMENT (esto hace que aparezca como "ACCEPTED")
    const outgoingPayment = await senderClient.outgoingPayment.create(
      { url: senderWallet.resourceServer, accessToken: grantAccessToken },
      { 
        walletAddress: senderWallet.id, 
        incomingPayment: incomingPaymentId 
      }
    );

    console.log('✅ PAGO COMPLETADO - Outgoing Payment:', outgoingPayment.id);
    console.log('💰 Estado:', outgoingPayment.state);

    res.json({ 
      ok: true, 
      outgoingPayment,
      message: 'Pago completado exitosamente',
      state: outgoingPayment.state // Debería ser "PROCESSING" o "COMPLETED"
    });

  } catch (error) {
    console.error('❌ Error completando pago:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// ── 5. VERIFICAR ESTADO DE PAGO
app.get('/op/payment-status/:incomingPaymentId', async (req, res) => {
  try {
    const { incomingPaymentId } = req.params;
    const { receiverWallet } = await getWalletDocs();

    // Obtener grant para leer incoming payment
    const incomingGrant = await receiverClient.grant.request(
      { url: receiverWallet.authServer },
      { access_token: { access: [{ type: 'incoming-payment', actions: ['read'] }] } }
    );

    const incomingPayment = await receiverClient.incomingPayment.get({
      url: incomingPaymentId,
      accessToken: incomingGrant.access_token.value
    });

    res.json({
      ok: true,
      incomingPayment,
      state: incomingPayment.state,
      receivedAmount: incomingPayment.receivedAmount,
      message: 'Estado obtenido correctamente'
    });

  } catch (error) {
    console.error('❌ Error verificando estado:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log('\n🚀 SERVIDOR OPENPAYMENTS INICIADO');
  console.log('📍 Local:    http://localhost:' + PORT);
  console.log('🌐 Red:      http://192.168.14.98:' + PORT);
  console.log('\n📋 Rutas disponibles:');
  console.log('   ✅ POST /op/generate-payment-qr');
  console.log('   ✅ POST /op/start-payment');
  console.log('   ✅ GET  /op/finish');
  console.log('   ✅ POST /op/complete-payment');
  console.log('   ✅ GET  /op/payment-status/:id');
});
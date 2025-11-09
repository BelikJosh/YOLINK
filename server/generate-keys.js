const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

console.log('🔑 Generando claves RSA...');

// Crear carpeta keys si no existe
const keysDir = path.join(__dirname, 'keys');
if (!fs.existsSync(keysDir)) {
    fs.mkdirSync(keysDir, { recursive: true });
    console.log(' Carpeta keys creada');
}

// Generar clave para RECEIVER
const receiverKeys = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
        type: 'spki',
        format: 'pem'
    },
    privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem'
    }
});

// Generar clave para SENDER  
const senderKeys = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
        type: 'spki',
        format: 'pem'
    },
    privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem'
    }
});

// Guardar claves del RECEIVER
fs.writeFileSync(path.join(keysDir, 'receiver-key.pem'), receiverKeys.privateKey);
fs.writeFileSync(path.join(keysDir, 'receiver-public-key.pem'), receiverKeys.publicKey);

// Guardar claves del SENDER
fs.writeFileSync(path.join(keysDir, 'sender-key.pem'), senderKeys.privateKey);
fs.writeFileSync(path.join(keysDir, 'sender-public-key.pem'), senderKeys.publicKey);

console.log(' Claves generadas correctamente:');
console.log('   - receiver-key.pem');
console.log('   - receiver-public-key.pem');
console.log('   - sender-key.pem');
console.log('   - sender-public-key.pem');

// Verificar que los archivos se crearon
console.log('\n Verificando archivos:');
const files = fs.readdirSync(keysDir);
files.forEach(file => {
    console.log('   - ' + file);
});

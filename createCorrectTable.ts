const AWS = require('aws-sdk');

const config = {
  region: 'us-east-1',
  accessKeyId: '',
  secretAccessKey: '',
};

AWS.config.update(config);

const dynamodb = new AWS.DynamoDB();

const createCorrectTable = async () => {
  const params = {
    TableName: 'YOLINK',
    KeySchema: [
      { AttributeName: 'id', KeyType: 'HASH' }
    ],
    AttributeDefinitions: [
      { AttributeName: 'id', AttributeType: 'S' },
      { AttributeName: 'email', AttributeType: 'S' },
      { AttributeName: 'userType', AttributeType: 'S' }
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'EmailIndex',
        KeySchema: [
          { AttributeName: 'email', KeyType: 'HASH' }
        ],
        Projection: {
          ProjectionType: 'ALL'
        }
        // REMOVED: ProvisionedThroughput (no needed for PAY_PER_REQUEST)
      },
      {
        IndexName: 'UserTypeIndex',
        KeySchema: [
          { AttributeName: 'userType', KeyType: 'HASH' }
        ],
        Projection: {
          ProjectionType: 'ALL'
        }
        // REMOVED: ProvisionedThroughput (no needed for PAY_PER_REQUEST)
      }
    ],
    BillingMode: 'PAY_PER_REQUEST'
  };

  try {
    console.log('🔄 Creando tabla YOLINK...');
    const result = await dynamodb.createTable(params).promise();
    console.log('✅ Tabla YOLINK creada exitosamente!');
    console.log('Table ARN:', result.TableDescription?.TableArn);
    
    console.log('⏳ Esperando a que la tabla esté activa...');
    await waitForTableActive();
    
  } catch (error: any) {
    if (error.code === 'ResourceInUseException') {
      console.log('ℹ️ La tabla YOLINK ya existe');
    } else {
      console.error('❌ Error creando tabla:', error.message);
    }
  }
};

const waitForTableActive = async () => {
  const params = { TableName: 'YOLINK' };
  
  return new Promise((resolve) => {
    const checkTable = () => {
      dynamodb.describeTable(params, (err: any, data: any) => {
        if (err) {
          console.error('Error checking table status:', err);
          return;
        }
        
        const status = data.Table?.TableStatus;
        console.log(`Table status: ${status}`);
        
        if (status === 'ACTIVE') {
          console.log('🎉 Tabla lista para usar!');
          resolve(true);
        } else {
          console.log('⏰ Esperando...');
          setTimeout(checkTable, 3000);
        }
      });
    };
    
    checkTable();
  });
};

createCorrectTable();
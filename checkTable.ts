import AWS from 'aws-sdk';

const config = {
  region: 'us-east-1',
  accessKeyId: '',
  secretAccessKey: '',
};

AWS.config.update(config);

const dynamodb = new AWS.DynamoDB();

const checkTable = async () => {
  try {
    const result = await dynamodb.listTables().promise();
    console.log('📋 Tablas existentes:', result.TableNames);
    
    if (result.TableNames?.includes('YOLINK')) {
      console.log('✅ La tabla YOLINK existe');
      
      // Obtener detalles de la tabla
      const tableInfo = await dynamodb.describeTable({ TableName: 'YOLINK' }).promise();
      console.log('🔍 Detalles de la tabla:');
      console.log('- Partition Key:', tableInfo.Table?.KeySchema?.[0]?.AttributeName);
      console.log('- Estado:', tableInfo.Table?.TableStatus);
      console.log('- Índices:', tableInfo.Table?.GlobalSecondaryIndexes?.map(idx => idx.IndexName));
    } else {
      console.log('❌ La tabla YOLINK NO existe');
    }
  } catch (error) {
    console.error('Error verificando tabla:', error);
  }
};

checkTable();
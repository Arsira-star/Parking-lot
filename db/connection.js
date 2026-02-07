const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || 'admin';

const validateMongoUri = (uri) => {
  if (!uri || typeof uri !== 'string') return false;
  if (!/^mongodb(\+srv)?:\/\//i.test(uri)) return false;
  let hostname = null;
  try {
    const parsed = new URL(uri);
    hostname = parsed.hostname; 
  } catch (err) {
    const match = uri.match(/@([^\/\?]+)/);
    if (match && match[1]) {
      hostname = match[1].split(':')[0];
    } else {
      return false;
    }
  }
  if (!hostname) return false;
  if (hostname.indexOf('.') === -1) return false;
  const labels = hostname.split('.');
  const tld = labels[labels.length - 1];
  if (!/^[a-z]{2,63}$/i.test(tld)) return false;
  return true;
};

let client = null;

const connectToDatabase = async () => {
  try {
    if (!validateMongoUri(MONGODB_URI)) {
      console.error('Invalid MONGODB_URI: must include hostname, domain name, and tld (e.g. cluster.example.com)');
      process.exit(1);
    }

    client = new MongoClient(MONGODB_URI, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      }
    });

    await client.connect();
    await client.db(MONGODB_DB_NAME).command({ ping: 1 });
    console.log(`Connected to MongoDB database: ${MONGODB_DB_NAME}`);
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    process.exit(1);
  }
};

const getDb = () => {
  if (!client) throw new Error('MongoClient not connected. Call connectToDatabase() first.');
  return client.db(MONGODB_DB_NAME);
};

const disconnectFromDatabase = async () => {
  try {
    if (client) {
      await client.close();
      console.log('Disconnected from MongoDB');
      client = null;
    }
  } catch (error) {
    console.error('Error disconnecting from MongoDB:', error);
  }
};

module.exports = {
  connectToDatabase,
  disconnectFromDatabase,
  getDb,
  _getClient: () => client
};

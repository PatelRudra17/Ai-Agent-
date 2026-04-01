const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();

  // Set env vars for tests
  process.env.JWT_SECRET = 'test-jwt-secret-32-chars-minimum-ok';
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-32-chars-ok';
  process.env.JWT_EXPIRES_IN = '24h';
  process.env.GEMINI_API_KEY = 'test';
  process.env.CLIENT_URL = 'http://localhost:3000';

  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

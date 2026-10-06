const IDENTITY_PROVIDER =
  process.env.IDENTITY_PROVIDER || 'mock';

module.exports = {
  mockMode:
    process.env.IDENTITY_MOCK_MODE === 'true',

  shahkarEnabled:
    process.env.SHAHKAR_ENABLED === 'true',

  identityInquiryEnabled:
    process.env.IDENTITY_INQUIRY_ENABLED === 'true',

  provider: IDENTITY_PROVIDER,

  testShahkar: {
    url: process.env.TEST_SHAHKAR_URL,

    authType:
      process.env.TEST_SHAHKAR_AUTH_TYPE ||
      'bearer',

    token:
      process.env.TEST_SHAHKAR_TOKEN,

    authHeader:
      process.env.TEST_SHAHKAR_AUTH_HEADER ||
      'Authorization',

    authPrefix:
      process.env.TEST_SHAHKAR_AUTH_PREFIX ||
      'Bearer',

    apiKey:
      process.env.TEST_SHAHKAR_API_KEY,

    apiKeyHeader:
      process.env.TEST_SHAHKAR_API_KEY_HEADER ||
      'X-API-Key'
  },

  paystar: {
    shahkarUrl:
      process.env.PAYSTAR_SHAHKAR_URL,

    identityInquiryUrl:
      process.env.PAYSTAR_IDENTITY_INQUIRY_URL,

    applicationId:
      process.env.PAYSTAR_APPLICATION_ID,

    accessPassword:
      process.env.PAYSTAR_ACCESS_PASSWORD,

    apiKey:
      process.env.PAYSTAR_API_KEY
  }
};

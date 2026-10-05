const IDENTITY_PROVIDER = process.env.IDENTITY_PROVIDER || 'paystar';

const providers = {
  paystar: {
    shahkarUrl:
      'https://core.paystar.ir/api/open-banking/service/info-matching/mobile-national-id',

    // این مسیر نمونه است. قبل از استفاده واقعی، از مستندات و قرارداد
    // سرویس‌دهنده‌ات Endpoint نهایی «استعلام مشخصات هویتی» را بگیر.
    identityInquiryUrl:
      process.env.PAYSTAR_IDENTITY_INQUIRY_URL || '',

    applicationId: process.env.PAYSTAR_APPLICATION_ID,
    accessPassword: process.env.PAYSTAR_ACCESS_PASSWORD,
    apiKey: process.env.PAYSTAR_API_KEY
  },

  finnotech: {
    baseUrl: process.env.FINNOTECH_BASE_URL,
    clientId: process.env.FINNOTECH_CLIENT_ID,
    clientSecret: process.env.FINNOTECH_CLIENT_SECRET,
    scope: process.env.FINNOTECH_SCOPE || 'facility:shahkar:get'
  }
};

module.exports = {
  IDENTITY_PROVIDER,
  provider: providers[IDENTITY_PROVIDER],
  mockMode: process.env.IDENTITY_MOCK_MODE === 'true',
  shahkarEnabled: process.env.SHAHKAR_ENABLED === 'true',
  identityInquiryEnabled: process.env.IDENTITY_INQUIRY_ENABLED === 'true'
};

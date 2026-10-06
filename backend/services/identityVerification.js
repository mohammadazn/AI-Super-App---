const axios = require('axios');

const config = require(
  '../config/identityProviders'
);

class IdentityVerificationService {
  /**
   * شاهکار Lite:
   * بررسی تطبیق کد ملی با شماره موبایل
   */
  static async shahkarLite({
    nationalId,
    mobileNumber
  }) {
    // حالت Mock: بدون ارسال درخواست واقعی
    if (
      config.mockMode ||
      !config.shahkarEnabled
    ) {
      return {
        success: true,

        isMatched: null,

        status: 'pending_manual_activation',

        provider: 'mock',

        referenceId:
          `mock-shahkar-${Date.now()}`,

        message:
          'شاهکار در حالت آزمایشی Mock است.'
      };
    }

    // سرویس تستی
    if (
      config.provider === 'test_shahkar'
    ) {
      return this.verifyWithTestShahkar({
        nationalId,
        mobileNumber
      });
    }

    // سرویس PayStar عملیاتی
    if (
      config.provider === 'paystar'
    ) {
      return this.verifyWithPaystar({
        nationalId,
        mobileNumber
      });
    }

    throw new Error(
      'Identity provider is not configured correctly'
    );
  }

  /**
   * ساخت Header با توجه به نوع Authentication
   */
  static buildTestHeaders() {
    const provider = config.testShahkar;

    const headers = {
      'Content-Type': 'application/json'
    };

    // Bearer Token
    if (
      provider.authType === 'bearer' &&
      provider.token
    ) {
      headers[provider.authHeader] =
        `${provider.authPrefix} ${provider.token}`;
    }

    // API Key
    if (
      provider.authType === 'api_key' &&
      provider.apiKey
    ) {
      headers[provider.apiKeyHeader] =
        provider.apiKey;
    }

    // Basic Auth
    if (
      provider.authType === 'basic' &&
      provider.token
    ) {
      headers[provider.authHeader] =
        `Basic ${provider.token}`;
    }

    return headers;
  }

  /**
   * اتصال به API تست شاهکار
   *
   * مهم:
   * ممکن است نام فیلدهای API تستی فرق داشته باشد.
   * بعد از فرستادن نمونه Request از EchoCopy،
   * فقط بخش body و parseResponse را دقیقاً مطابق آن اصلاح می‌کنیم.
   */
  static async verifyWithTestShahkar({
    nationalId,
    mobileNumber
  }) {
    const provider = config.testShahkar;

    if (!provider.url) {
      throw new Error(
        'TEST_SHAHKAR_URL در فایل .env وارد نشده است'
      );
    }

    const response = await axios.post(
      provider.url,
      {
        national_id: nationalId,
        mobile_number: mobileNumber
      },
      {
        headers: this.buildTestHeaders(),

        timeout: 15000
      }
    );

    const data = response.data;

    /**
     * پاسخ APIهای تستی ممکن است شکل متفاوتی داشته باشد.
     * این حالت‌های رایج را بررسی می‌کنیم.
     */
    const isMatched =
      data?.data?.is_matched ??
      data?.data?.matched ??
      data?.is_matched ??
      data?.matched ??
      data?.result?.matched ??
      null;

    const referenceId =
      data?.data?.reference_id ??
      data?.data?.tracking_code ??
      data?.reference_id ??
      data?.tracking_code ??
      data?.trackingCode ??
      `test-shahkar-${Date.now()}`;

    const message =
      data?.message ??
      data?.data?.message ??
      'پاسخ از سرویس تست شاهکار دریافت شد';

    return {
      success: true,

      provider: 'test_shahkar',

      isMatched:
        typeof isMatched === 'boolean'
          ? isMatched
          : null,

      status: 'completed',

      referenceId,

      message,

      rawResponse: data
    };
  }

  /**
   * اتصال به PayStar عملیاتی
   */
  static async verifyWithPaystar({
    nationalId,
    mobileNumber
  }) {
    const provider = config.paystar;

    const response = await axios.post(
      provider.shahkarUrl,
      {
        application_id:
          provider.applicationId,

        access_password:
          provider.accessPassword,

        national_id: nationalId,

        mobile_number: mobileNumber
      },
      {
        headers: {
          Authorization:
            `Bearer ${provider.apiKey}`,

          'Content-Type':
            'application/json'
        },

        timeout: 15000
      }
    );

    const data = response.data;

    return {
      success: data.status === 1,

      provider: 'paystar',

      isMatched:
        data?.data?.is_matched === true,

      status:
        data.status === 1
          ? 'completed'
          : 'failed',

      referenceId:
        data?.data?.reference_id || null,

      message: data.message,

      rawResponse: data
    };
  }

  /**
   * فعلاً برای استعلام مشخصات هویتی در حالت تست
   */
  static async identityInquiry({
    nationalId,
    birthDate,
    firstName,
    lastName
  }) {
    if (
      config.mockMode ||
      !config.identityInquiryEnabled
    ) {
      return {
        success: true,

        isMatched: null,

        status: 'pending_manual_activation',

        provider: 'mock',

        referenceId:
          `mock-identity-${Date.now()}`,

        message:
          'استعلام مشخصات هویتی فعلاً در حالت آزمایشی است.'
      };
    }

    throw new Error(
      'برای استعلام مشخصات هویتی، Endpoint و مستندات رسمی Provider را وارد کنید.'
    );
  }
}

module.exports = IdentityVerificationService;

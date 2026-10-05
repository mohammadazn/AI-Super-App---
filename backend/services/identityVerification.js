const axios = require('axios');
const {
  IDENTITY_PROVIDER,
  provider,
  mockMode,
  shahkarEnabled,
  identityInquiryEnabled
} = require('../config/identityProviders');

class IdentityVerificationService {
  /**
   * شاهکار Lite:
   * تطبیق کد ملی با شماره موبایل تاییدشده کاربر
   */
  static async verifyShahkarLite({ nationalId, mobileNumber }) {
    if (mockMode || !shahkarEnabled) {
      return {
        success: true,
        provider: 'mock',
        isMatched: null,
        status: 'pending_manual_activation',
        message:
          'سرویس شاهکار Lite هنوز در حالت آزمایشی است و پس از دریافت مجوز فعال می‌شود.',
        referenceId: `mock-shahkar-${Date.now()}`
      };
    }

    if (IDENTITY_PROVIDER === 'paystar') {
      return this.verifyWithPaystar({ nationalId, mobileNumber });
    }

    if (IDENTITY_PROVIDER === 'finnotech') {
      return this.verifyWithFinoTech({ nationalId, mobileNumber });
    }

    throw new Error('Identity provider is not configured correctly');
  }

  /**
   * استعلام مشخصات هویتی:
   * بهتر است فقط نتیجه تطبیق ذخیره شود، نه اطلاعات کامل هویتی.
   */
  static async inquireIdentity({
    nationalId,
    birthDate,
    firstName,
    lastName
  }) {
    if (mockMode || !identityInquiryEnabled) {
      return {
        success: true,
        provider: 'mock',
        status: 'pending_manual_activation',
        isMatched: null,
        verifiedFirstName: null,
        verifiedLastName: null,
        message:
          'سرویس استعلام مشخصات هویتی هنوز در حالت آزمایشی است و پس از دریافت مجوز فعال می‌شود.',
        referenceId: `mock-identity-${Date.now()}`
      };
    }

    /**
     * مسیر و شکل پاسخ استعلام مشخصات هویتی بین Providerها متفاوت است.
     * این بخش فقط بعد از دریافت قرارداد، مستندات رسمی و کلید API نهایی شود.
     */
    if (!provider?.identityInquiryUrl) {
      throw new Error(
        'Identity inquiry endpoint is not configured. Set PAYSTAR_IDENTITY_INQUIRY_URL after provider approval.'
      );
    }

    const response = await axios.post(
      provider.identityInquiryUrl,
      {
        application_id: provider.applicationId,
        access_password: provider.accessPassword,
        national_id: nationalId,
        birth_date: birthDate,
        first_name: firstName,
        last_name: lastName
      },
      {
        headers: {
          Authorization: `Bearer ${provider.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 15000
      }
    );

    const data = response.data;

    return {
      success: data.status === 1,
      provider: 'paystar',
      status: data.status === 1 ? 'completed' : 'failed',
      isMatched: data?.data?.is_matched ?? null,

      // فقط اگر سرویس‌دهنده رسماً برگرداند و مجاز به ذخیره باشی
      verifiedFirstName: data?.data?.first_name || null,
      verifiedLastName: data?.data?.last_name || null,

      message: data.message,
      referenceId: data?.data?.reference_id || null,
      rawStatus: data.status
    };
  }

  static async verifyWithPaystar({ nationalId, mobileNumber }) {
    const response = await axios.post(
      provider.shahkarUrl,
      {
        application_id: provider.applicationId,
        access_password: provider.accessPassword,
        national_id: nationalId,
        mobile_number: mobileNumber
      },
      {
        headers: {
          Authorization: `Bearer ${provider.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 15000
      }
    );

    const data = response.data;

    return {
      success: data.status === 1,
      provider: 'paystar',
      isMatched: data?.data?.is_matched === true,
      status: data.status === 1 ? 'completed' : 'failed',
      message: data.message,
      referenceId: data?.data?.reference_id || null,
      rawStatus: data.status
    };
  }

  static async getFinoTechAccessToken() {
    const tokenUrl = `${provider.baseUrl}/oauth2/token`;

    const response = await axios.post(
      tokenUrl,
      new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: provider.clientId,
        client_secret: provider.clientSecret,
        scope: provider.scope
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        timeout: 15000
      }
    );

    return response.data.access_token;
  }

  static async verifyWithFinoTech({ nationalId, mobileNumber }) {
    const accessToken = await this.getFinoTechAccessToken();

    /**
     * clientId و شکل Query/Body را طبق قرارداد فعال‌شده فینوتک تنظیم کن.
     * مستندات فینوتک از Client Credentials و Scope مرتبط با شاهکار استفاده می‌کند.
     */
    const endpoint =
      `${provider.baseUrl}/facility/v2/clients/${provider.clientId}/shahkar/verify`;

    const response = await axios.get(endpoint, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      },
      params: {
        nationalCode: nationalId,
        mobile: mobileNumber
      },
      timeout: 15000
    });

    const data = response.data;

    return {
      success: true,
      provider: 'finnotech',
      isMatched: Boolean(data?.isMatched ?? data?.matched),
      status: 'completed',
      message: 'استعلام شاهکار انجام شد',
      referenceId: data?.trackingCode || data?.referenceId || null,
      rawStatus: data
    };
  }
}

module.exports = IdentityVerificationService;

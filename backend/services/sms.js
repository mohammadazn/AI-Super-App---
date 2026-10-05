const Kavenegar = require('kavenegar');

const kavenegar = new Kavenegar.Kavenegar(process.env.KAVENEGAR_API_KEY);

class SMSService {
  // ارسال کد تأیید
  static async sendVerificationCode(phone) {
    const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits
    
    try {
      await kavenegar.VerifyLookup({
        mobile: phone,
        template: 'verify-code',
        token: code
      });
      
      console.log(`✅ SMS sent to ${phone}, code: ${code}`);
      return { success: true, code };
    } catch (error) {
      console.error('❌ SMS Error:', error.message);
      return { 
        success: false, 
        error: error.message,
        code // برای محیط تست برگردون
      };
    }
  }
  
  // ارسال پیامک معمولی
  static async sendSMS(phone, message) {
    try {
      await kavenegar.Send({
        message: message,
        receptor: [phone],
        sender: '3000505' // شماره خدماتی
      });
      
      console.log(`✅ SMS sent to ${phone}`);
      return { success: true };
    } catch (error) {
      console.error('❌ SMS Error:', error.message);
      return { success: false, error: error.message };
    }
  }
  
  // ارسال پیامک انبوه
  static async sendBulkSMS(phoneNumbers, message) {
    try {
      await kavenegar.Send({
        message: message,
        receptor: phoneNumbers
      });
      
      console.log(`✅ Bulk SMS sent to ${phoneNumbers.length} numbers`);
      return { success: true };
    } catch (error) {
      console.error('❌ Bulk SMS Error:', error.message);
      return { success: false, error: error.message };
    }
  }
}

module.exports = SMSService;

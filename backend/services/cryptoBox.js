const crypto = require('crypto');

function getEncryptionKey() {
  const key = Buffer.from(
    process.env.KYC_ENCRYPTION_KEY || '',
    'base64'
  );

  if (key.length !== 32) {
    throw new Error(
      'KYC_ENCRYPTION_KEY must be a 32-byte Base64 key'
    );
  }

  return key;
}

function encrypt(value) {
  const iv = crypto.randomBytes(12);

  const cipher = crypto.createCipheriv(
    'aes-256-gcm',
    getEncryptionKey(),
    iv
  );

  const encrypted = Buffer.concat([
    cipher.update(String(value), 'utf8'),
    cipher.final()
  ]);

  const authTag = cipher.getAuthTag();

  return [
    iv.toString('base64'),
    authTag.toString('base64'),
    encrypted.toString('base64')
  ].join('.');
}

function decrypt(payload) {
  const [ivText, tagText, encryptedText] = payload
    .split('.');

  const iv = Buffer.from(ivText, 'base64');

  const authTag = Buffer.from(tagText, 'base64');

  const encrypted = Buffer.from(
    encryptedText,
    'base64'
  );

  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    getEncryptionKey(),
    iv
  );

  decipher.setAuthTag(authTag);

  return Buffer.concat([
    decipher.update(encrypted),
    decipher.final()
  ]).toString('utf8');
}

function sha256(buffer) {
  return crypto
    .createHash('sha256')
    .update(buffer)
    .digest('hex');
}

module.exports = {
  encrypt,
  decrypt,
  sha256
};

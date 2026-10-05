const express = require('express');
const { body, validationResult } = require('express-validator');
const { auth } = require('./auth');
const User = require('../models/User');
const KycVerification = require('../models/KycVerification');
const IdentityVerificationService = require('../services/identityVerification');

const router = express.Router();

function validate(req, res, next) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  next();
}

/**
 * نکته:
 * برای نسخه واقعی، کد ملی را قبل از ذخیره رمزنگاری کن.
 * در این نسخه اولیه، فقط برای تکمیل جریان کار است.
 */
router.post(
  '/start',
  auth,
  [
    body('nationalId')
      .matches(/^d{10}$/)
      .withMessage('کد ملی باید ۱۰ رقم باشد'),

    body('birthDate')
      .optional()
      .isString()
      .withMessage('تاریخ تولد نامعتبر است'),

    body('firstName')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('نام نامعتبر است'),

    body('lastName')
      .optional()
      .trim()
      .isLength({ min: 2, max: 70 })
      .withMessage('نام خانوادگی نامعتبر است'),

    validate
  ],
  async (req, res) => {
    try {
      const { nationalId, birthDate, firstName, lastName } = req.body;

      const user = await User.findById(req.user.userId);

      if (!user || !user.verificationCode?.verified) {
        return res.status(403).json({
          success: false,
          error: 'ابتدا شماره موبایل خود را تأیید کنید'
        });
      }

      let kyc = await KycVerification.findOne({
        userId: user._id
      });

      if (!kyc) {
        kyc = await KycVerification.create({
          userId: user._id,
          nationalIdEncrypted: nationalId,
          birthDateEncrypted: birthDate || '',
          status: 'shahkar_pending'
        });
      } else {
        kyc.nationalIdEncrypted = nationalId;
        kyc.birthDateEncrypted = birthDate || '';
        kyc.status = 'shahkar_pending';
        await kyc.save();
      }

      const shahkarResult =
        await IdentityVerificationService.verifyShahkarLite({
          nationalId,
          mobileNumber: user.phone
        });

      kyc.shahkar = {
        status: shahkarResult.isMatched === true
          ? 'matched'
          : shahkarResult.isMatched === false
            ? 'not_matched'
            : 'pending',

        checkedAt: new Date(),
        providerReference: shahkarResult.referenceId
      };

      /**
       * در حالت Mock تا دریافت مجوز:
       * نتیجه null می‌ماند و درخواست برای بررسی دستی ادامه پیدا می‌کند.
       */
      if (shahkarResult.isMatched === true) {
        kyc.status = 'shahkar_verified';
      }

      if (shahkarResult.isMatched === false) {
        kyc.status = 'rejected';
      }

      await kyc.save();

      return res.json({
        success: true,
        shahkar: {
          status: kyc.shahkar.status,
          isMatched: shahkarResult.isMatched,
          message: shahkarResult.message
        },
        nextStep:
          shahkarResult.isMatched === false
            ? 'contact_support'
            : 'identity_inquiry_or_document_upload'
      });
    } catch (error) {
      console.error('KYC Shahkar Error:', error.message);

      return res.status(500).json({
        success: false,
        error: 'خطا در استعلام شاهکار'
      });
    }
  }
);

/**
 * استعلام مشخصات هویتی.
 * این مرحله فقط در صورت فعال‌شدن سرویس واقعی اجرا خواهد شد.
 */
router.post(
  '/identity-inquiry',
  auth,
  [
    body('firstName').trim().isLength({ min: 2, max: 50 }),
    body('lastName').trim().isLength({ min: 2, max: 70 }),
    body('birthDate').isString().notEmpty(),
    validate
  ],
  async (req, res) => {
    try {
      const { firstName, lastName, birthDate } = req.body;

      const kyc = await KycVerification.findOne({
        userId: req.user.userId
      });

      if (!kyc) {
        return res.status(404).json({
          success: false,
          error: 'ابتدا مرحله کد ملی و شاهکار را آغاز کنید'
        });
      }

      const result =
        await IdentityVerificationService.inquireIdentity({
          nationalId: kyc.nationalIdEncrypted,
          birthDate,
          firstName,
          lastName
        });

      kyc.civilRegistry = {
        status: result.isMatched === true
          ? 'matched'
          : result.isMatched === false
            ? 'not_matched'
            : 'pending',

        checkedAt: new Date(),
        providerReference: result.referenceId,
        verifiedFirstName: result.verifiedFirstName,
        verifiedLastName: result.verifiedLastName
      };

      if (result.isMatched === true) {
        kyc.status = 'documents_pending';
      }

      if (result.isMatched === false) {
        kyc.status = 'rejected';
      }

      await kyc.save();

      res.json({
        success: true,
        identityInquiry: {
          status: kyc.civilRegistry.status,
          isMatched: result.isMatched,
          message: result.message
        },
        nextStep: 'upload_documents'
      });
    } catch (error) {
      console.error('Identity Inquiry Error:', error.message);

      res.status(500).json({
        success: false,
        error: 'خطا در استعلام مشخصات هویتی'
      });
    }
  }
);

/**
 * نمایش وضعیت احراز هویت برای خود کاربر
 */
router.get('/status', auth, async (req, res) => {
  try {
    const kyc = await KycVerification.findOne({
      userId: req.user.userId
    }).select('-nationalIdEncrypted -birthDateEncrypted');

    res.json({
      success: true,
      kyc: kyc || {
        status: 'not_started'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'خطا در دریافت وضعیت احراز هویت'
    });
  }
});

module.exports = router;

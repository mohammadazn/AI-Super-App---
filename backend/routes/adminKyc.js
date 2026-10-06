const router = require('express').Router();

const { auth } = require('./auth');

const KycVerification = require(
  '../models/KycVerification'
);

const User = require('../models/User');

function adminOnly(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error:
        'فقط مدیر سیستم دسترسی دارد'
    });
  }

  next();
}

/**
 * لیست کاربران در صف بررسی احراز هویت
 */
router.get(
  '/queue',
  auth,
  adminOnly,
  async (req, res) => {
    try {
      const items =
        await KycVerification.find({
          status: {
            $in: [
              'under_review',
              'documents_pending'
            ]
          }
        })
          .populate(
            'userId',
            'phone profile kycStatus'
          )
          .sort({
            updatedAt: 1
          });

      res.json({
        success: true,
        items
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

/**
 * مشاهده یک پرونده KYC
 */
router.get(
  '/:id',
  auth,
  adminOnly,
  async (req, res) => {
    try {
      const item =
        await KycVerification.findById(
          req.params.id
        ).populate(
          'userId',
          'phone profile kycStatus'
        );

      if (!item) {
        return res.status(404).json({
          success: false,
          error:
            'پرونده احراز هویت یافت نشد'
        });
      }

      res.json({
        success: true,
        item
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

/**
 * تأیید، رد یا درخواست مدارک بیشتر
 */
router.post(
  '/:id/decision',
  auth,
  adminOnly,
  async (req, res) => {
    try {
      const {
        decision,
        reason = ''
      } = req.body;

      const allowedDecisions = [
        'approved',
        'rejected',
        'need_more_documents'
      ];

      if (
        !allowedDecisions.includes(decision)
      ) {
        return res.status(400).json({
          success: false,
          error:
            'تصمیم ادمین معتبر نیست'
        });
      }

      const kyc =
        await KycVerification.findById(
          req.params.id
        );

      if (!kyc) {
        return res.status(404).json({
          success: false,
          error:
            'پرونده یافت نشد'
        });
      }

      kyc.adminReview = {
        reviewedBy: req.user.userId,

        reviewedAt: new Date(),

        decision,

        reason
      };

      if (decision === 'approved') {
        kyc.status = 'approved';
      }

      if (decision === 'rejected') {
        kyc.status = 'rejected';
      }

      if (
        decision === 'need_more_documents'
      ) {
        kyc.status = 'documents_pending';
      }

      await kyc.save();

      await User.findByIdAndUpdate(
        kyc.userId,
        {
          kycStatus: kyc.status
        }
      );

      res.json({
        success: true,
        status: kyc.status
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

module.exports = router;

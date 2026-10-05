const mongoose = require('mongoose');

const kycVerificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },

  nationalIdEncrypted: {
    type: String,
    required: true
  },

  birthDateEncrypted: {
    type: String
  },

  shahkar: {
    status: {
      type: String,
      enum: ['not_checked', 'pending', 'matched', 'not_matched', 'error'],
      default: 'not_checked'
    },
    checkedAt: Date,
    providerReference: String
  },

  civilRegistry: {
    status: {
      type: String,
      enum: ['not_checked', 'pending', 'matched', 'not_matched', 'error'],
      default: 'not_checked'
    },
    checkedAt: Date,
    providerReference: String,
    verifiedFirstName: String,
    verifiedLastName: String
  },

  documents: {
    nationalCardFrontPrivateKey: String,
    nationalCardBackPrivateKey: String,
    selfiePrivateKey: String,
    uploadedAt: Date
  },

  videoConsent: {
    privateVideoKey: String,
    videoHash: String,
    consentTextVersion: String,
    recordedAt: Date,
    uploadedAt: Date
  },

  riskAcceptance: {
    accepted: {
      type: Boolean,
      default: false
    },
    acceptedAt: Date,
    policyVersion: String,
    ipAddress: String
  },

  status: {
    type: String,
    enum: [
      'not_started',
      'mobile_verified',
      'shahkar_pending',
      'shahkar_verified',
      'documents_pending',
      'under_review',
      'approved',
      'rejected',
      'suspended'
    ],
    default: 'not_started'
  },

  adminReview: {
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reviewedAt: Date,
    decision: {
      type: String,
      enum: ['approved', 'rejected', 'need_more_documents']
    },
    reason: String
  },

  createdAt: {
    type: Date,
    default: Date.now
  },

  updatedAt: {
    type: Date,
    default: Date.now
  }
});

kycVerificationSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('KycVerification', kycVerificationSchema);

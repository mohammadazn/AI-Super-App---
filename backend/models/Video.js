const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  type: {
    type: String,
    enum: ['generated', 'edited_instagram', 'edited_youtube'],
    required: true
  },
  
  prompt: {
    type: String,
    required: true
  },
  
  videoUrl: {
    type: String,
    required: true
  },
  
  thumbnailUrl: String,
  
  duration: Number, // seconds
  
  resolution: {
    width: Number,
    height: Number
  },
  
  aspectRatio: {
    type: String,
    enum: ['9:16', '16:9', '1:1', '4:5'],
    default: '9:16'
  },
  
  creditsUsed: {
    type: Number,
    required: true
  },
  
  metadata: {
    model: String,
    style: String,
    music: Boolean,
    captions: Boolean,
    effects: [String]
  },
  
  status: {
    type: String,
    enum: ['processing', 'completed', 'failed'],
    default: 'processing'
  },
  
  downloadCount: { type: Number, default: 0 },
  shareCount: { type: Number, default: 0 },
  
  createdAt: { type: Date, default: Date.now }
});

// Indexes
videoSchema.index({ userId: 1, createdAt: -1 });
videoSchema.index({ status: 1 });

module.exports = mongoose.model('Video', videoSchema);

const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const consultationSchema = new mongoose.Schema({
  consultationId: {
    type: String,
    required: true,
    unique: true,
    default: () => uuidv4()
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  questions: [{
    id: {
      type: Number,
      required: true
    },
    type: {
      type: String,
      required: true,
      enum: ['multiple-choice', 'checkbox-list', 'short-text', 'long-text']
    },
    text: {
      type: String,
      required: true,
      trim: true
    },
    options: [{
      type: String,
      trim: true
    }],
    required: {
      type: Boolean,
      default: false
    },
    order: {
      type: Number,
      required: true
    }
  }],
  createdBy: {
    type: String,
    required: true // This will store the Firebase UID
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

// Update the updatedAt timestamp before saving
consultationSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Consultation = mongoose.model('Consultation', consultationSchema);

module.exports = Consultation; 
const mongoose = require('mongoose');
const Consultation = require('./models/Consultation');

// Database connection
const connectDB = async () => {
  try {
    const MONGODB_URI = `mongodb+srv://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@${process.env.MONGODB_CLUSTER}/${process.env.MONGODB_DATABASE}?retryWrites=true&w=majority&appName=Cluster0`;
    
    await mongoose.connect(MONGODB_URI, {
      serverApi: {
        version: '1',
        strict: true,
        deprecationErrors: true,
      }
    });
    
    console.log('Connected to MongoDB Atlas');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Consultation operations
const consultationOperations = {
  // Create a new consultation
  createConsultation: async (consultationData) => {
    try {
      const consultation = new Consultation(consultationData);
      const savedConsultation = await consultation.save();
      return {
        ...savedConsultation.toObject(),
        consultationId: savedConsultation.consultationId
      };
    } catch (error) {
      throw new Error(`Failed to create consultation: ${error.message}`);
    }
  },

  // Get all consultations for a user
  getUserConsultations: async (userId) => {
    try {
      return await Consultation.find({ createdBy: userId })
        .select('consultationId title description createdAt questions')
        .sort({ createdAt: -1 });
    } catch (error) {
      throw new Error(`Failed to fetch user consultations: ${error.message}`);
    }
  },

  // Get a single consultation by ID
  getConsultationById: async (consultationId) => {
    try {
      const consultation = await Consultation.findOne({ consultationId });
      if (!consultation) {
        throw new Error('Consultation not found');
      }
      return consultation;
    } catch (error) {
      throw new Error(`Failed to fetch consultation: ${error.message}`);
    }
  },

  // Update a consultation
  updateConsultation: async (consultationId, updateData) => {
    try {
      const consultation = await Consultation.findOneAndUpdate(
        { consultationId },
        { $set: updateData },
        { new: true, runValidators: true }
      );
      if (!consultation) {
        throw new Error('Consultation not found');
      }
      return consultation;
    } catch (error) {
      throw new Error(`Failed to update consultation: ${error.message}`);
    }
  },

  // Delete a consultation
  deleteConsultation: async (consultationId) => {
    try {
      const consultation = await Consultation.findOneAndDelete({ consultationId });
      if (!consultation) {
        throw new Error('Consultation not found');
      }
      return consultation;
    } catch (error) {
      throw new Error(`Failed to delete consultation: ${error.message}`);
    }
  }
};

module.exports = {
  connectDB,
  consultationOperations
};

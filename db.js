const mongoose = require('mongoose');
const Survey = require('./models/Survey');

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

// Survey operations
const surveyOperations = {
  // Create a new survey
  createSurvey: async (surveyData) => {
    try {
      const survey = new Survey(surveyData);
      const savedSurvey = await survey.save();
      return {
        ...savedSurvey.toObject(),
        surveyId: savedSurvey.surveyId
      };
    } catch (error) {
      throw new Error(`Failed to create survey: ${error.message}`);
    }
  },

  // Get all surveys for a user
  getUserSurveys: async (userId) => {
    try {
      return await Survey.find({ createdBy: userId })
        .select('surveyId title description createdAt questions')
        .sort({ createdAt: -1 });
    } catch (error) {
      throw new Error(`Failed to fetch user surveys: ${error.message}`);
    }
  },

  // Get a single survey by ID
  getSurveyById: async (surveyId) => {
    try {
      const survey = await Survey.findOne({ surveyId });
      if (!survey) {
        throw new Error('Survey not found');
      }
      return survey;
    } catch (error) {
      throw new Error(`Failed to fetch survey: ${error.message}`);
    }
  },

  // Update a survey
  updateSurvey: async (surveyId, updateData) => {
    try {
      const survey = await Survey.findOneAndUpdate(
        { surveyId },
        { $set: updateData },
        { new: true, runValidators: true }
      );
      if (!survey) {
        throw new Error('Survey not found');
      }
      return survey;
    } catch (error) {
      throw new Error(`Failed to update survey: ${error.message}`);
    }
  },

  // Delete a survey
  deleteSurvey: async (surveyId) => {
    try {
      const survey = await Survey.findOneAndDelete({ surveyId });
      if (!survey) {
        throw new Error('Survey not found');
      }
      return survey;
    } catch (error) {
      throw new Error(`Failed to delete survey: ${error.message}`);
    }
  }
};

module.exports = {
  connectDB,
  surveyOperations
};

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const admin = require('firebase-admin');
const { connectDB, surveyOperations } = require('./db');

const app = express();
const port = process.env.PORT || 3001;

// Connect to MongoDB
connectDB();

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKeyId: process.env.FIREBASE_PRIVATE_KEY_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    clientId: process.env.FIREBASE_CLIENT_ID,
  }),
});

// CORS configuration
app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Authentication middleware
const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Middleware
app.use(express.json());
app.use(morgan('dev'));

// Public route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the Express server!' });
});

// Public route to view a survey
app.get('/surveys/:surveyId', async (req, res) => {
  try {
    console.log('Fetching survey with ID:', req.params.surveyId);
    const survey = await surveyOperations.getSurveyById(req.params.surveyId);
    if (!survey) {
      return res.status(404).json({ error: 'Survey not found' });
    }
    res.json(survey);
  } catch (error) {
    console.error('Error fetching survey:', error);
    res.status(404).json({ error: error.message });
  }
});

// Protected route example
app.get('/protected', authenticateUser, (req, res) => {
  res.json({ 
    message: 'This is a protected route',
    user: {
      uid: req.user.uid,
      email: req.user.email
    }
  });
});

// Survey routes
app.post('/api/surveys', authenticateUser, async (req, res) => {
  try {
    const { title, description, questions } = req.body;

    // Validate required fields
    if (!title || !questions || !Array.isArray(questions)) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Create new survey
    const survey = await surveyOperations.createSurvey({
      title,
      description,
      questions,
      createdBy: req.user.uid
    });

    res.status(201).json({
      message: 'Survey saved successfully',
      survey: {
        surveyId: survey.surveyId,
        title: survey.title,
        description: survey.description,
        questions: survey.questions,
        createdAt: survey.createdAt
      }
    });
  } catch (error) {
    console.error('Error saving survey:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all surveys for the authenticated user
app.get('/api/surveys', authenticateUser, async (req, res) => {
  try {
    const surveys = await surveyOperations.getUserSurveys(req.user.uid);
    res.json(surveys);
  } catch (error) {
    console.error('Error fetching surveys:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get a single survey
app.get('/api/surveys/:surveyId', authenticateUser, async (req, res) => {
  try {
    const survey = await surveyOperations.getSurveyById(req.params.surveyId);
    res.json(survey);
  } catch (error) {
    console.error('Error fetching survey:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update a survey
app.put('/api/surveys/:surveyId', authenticateUser, async (req, res) => {
  try {
    const survey = await surveyOperations.updateSurvey(req.params.surveyId, req.body);
    res.json({
      message: 'Survey updated successfully',
      survey
    });
  } catch (error) {
    console.error('Error updating survey:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete a survey
app.delete('/api/surveys/:surveyId', authenticateUser, async (req, res) => {
  try {
    await surveyOperations.deleteSurvey(req.params.surveyId);
    res.json({ message: 'Survey deleted successfully' });
  } catch (error) {
    console.error('Error deleting survey:', error);
    res.status(500).json({ error: error.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

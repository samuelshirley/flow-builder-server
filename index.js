require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const admin = require('firebase-admin');
const { connectDB, consultationOperations } = require('./db');

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

// Public route to view a consultation
app.get('/consultations/:consultationId', async (req, res) => {
  try {
    console.log('Fetching consultation with ID:', req.params.consultationId);
    const consultation = await consultationOperations.getConsultationById(req.params.consultationId);
    if (!consultation) {
      return res.status(404).json({ error: 'Consultation not found' });
    }
    res.json(consultation);
  } catch (error) {
    console.error('Error fetching consultation:', error);
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

// Consultation routes
app.post('/api/consultations', authenticateUser, async (req, res) => {
  try {
    const { title, description, questions } = req.body;

    // Validate required fields
    if (!title || !questions || !Array.isArray(questions)) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Create new consultation
    const consultation = await consultationOperations.createConsultation({
      title,
      description,
      questions,
      createdBy: req.user.uid
    });

    res.status(201).json({
      message: 'Consultation saved successfully',
      consultation: {
        consultationId: consultation.consultationId,
        title: consultation.title,
        description: consultation.description,
        questions: consultation.questions,
        createdAt: consultation.createdAt
      }
    });
  } catch (error) {
    console.error('Error saving consultation:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all consultations for the authenticated user
app.get('/api/consultations', authenticateUser, async (req, res) => {
  try {
    const consultations = await consultationOperations.getUserConsultations(req.user.uid);
    res.json(consultations);
  } catch (error) {
    console.error('Error fetching consultations:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get a single consultation
app.get('/api/consultations/:consultationId', authenticateUser, async (req, res) => {
  try {
    const consultation = await consultationOperations.getConsultationById(req.params.consultationId);
    res.json(consultation);
  } catch (error) {
    console.error('Error fetching consultation:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update a consultation
app.put('/api/consultations/:consultationId', authenticateUser, async (req, res) => {
  try {
    const consultation = await consultationOperations.updateConsultation(req.params.consultationId, req.body);
    res.json({
      message: 'Consultation updated successfully',
      consultation
    });
  } catch (error) {
    console.error('Error updating consultation:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete a consultation
app.delete('/api/consultations/:consultationId', authenticateUser, async (req, res) => {
  try {
    await consultationOperations.deleteConsultation(req.params.consultationId);
    res.json({ message: 'Consultation deleted successfully' });
  } catch (error) {
    console.error('Error deleting consultation:', error);
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

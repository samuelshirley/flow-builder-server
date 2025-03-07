require('dotenv').config();
const mongoose = require('mongoose');

// Connect to MongoDB
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

const migrateSurveysToConsultations = async () => {
  try {
    // Get the database instance
    const db = mongoose.connection.db;
    
    // Get all documents from the surveys collection
    const surveys = await db.collection('surveys').find({}).toArray();
    console.log(`Found ${surveys.length} surveys to migrate`);

    if (surveys.length === 0) {
      console.log('No surveys to migrate');
      process.exit(0);
    }

    // Transform surveys to consultations
    const consultations = surveys.map(survey => ({
      ...survey,
      consultationId: survey.surveyId,
    }));

    // Create the consultations collection if it doesn't exist
    await db.createCollection('consultations');
    console.log('Created consultations collection');

    // Insert the transformed documents into the new collection
    const result = await db.collection('consultations').insertMany(consultations);
    console.log(`Migrated ${result.insertedCount} consultations successfully`);

    // Optionally, rename the old collection as backup
    await db.collection('surveys').rename('surveys_backup');
    console.log('Renamed old surveys collection to surveys_backup');

    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

// Run the migration
connectDB().then(() => {
  console.log('Starting migration...');
  migrateSurveysToConsultations();
}); 
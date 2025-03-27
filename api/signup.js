// Serverless function to handle user signups
import { connectToDatabase } from './db.js';

// The path to the download API endpoint
const DOWNLOAD_API_PATH = '/api/download'; 

export default async (req, res) => {
  // CORS headers to allow requests from any origin during development
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get data from request body
    const { name, email, timestamp } = req.body;

    // Validate required fields
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    // Connect to the database
    const { db } = await connectToDatabase();

    // Insert the document into the "signups" collection
    const signupsCollection = db.collection('signups');
    
    // Create signup object
    const signup = {
      name,
      email,
      timestamp: timestamp || new Date().toISOString(),
      createdAt: new Date(),
    };

    // Insert the signup data
    await signupsCollection.insertOne(signup);
    console.log(`New signup saved to MongoDB: ${name} (${email})`);

    // Create download URL with email parameter for tracking
    const downloadUrl = `${DOWNLOAD_API_PATH}?email=${encodeURIComponent(email)}`;

    // Return success with download URL
    return res.status(200).json({ 
      success: true, 
      message: 'Signup successful',
      downloadUrl
    });
  } catch (error) {
    console.error('Error in signup API:', error);
    return res.status(500).json({ error: 'An error occurred while saving your information' });
  }
}; 
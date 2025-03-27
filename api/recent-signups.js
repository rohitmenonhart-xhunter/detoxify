// Serverless function to fetch recent signups
import { connectToDatabase } from './db.js';

export default async (req, res) => {
  // CORS headers to allow requests from any origin during development
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Connect to the database
    const { db } = await connectToDatabase();

    // Get the signups collection
    const signupsCollection = db.collection('signups');
    
    // Fetch the 10 most recent signups, excluding email for privacy
    const recentSignups = await signupsCollection
      .find({})
      .project({ name: 1, timestamp: 1, _id: 0 }) // Only return name and timestamp
      .sort({ createdAt: -1 }) // Sort by most recent first
      .limit(10) // Limit to 10 results
      .toArray();
    
    console.log(`Retrieved ${recentSignups.length} recent signups from MongoDB`);
    
    // Return the recent signups
    return res.status(200).json(recentSignups);
  } catch (error) {
    console.error('Error fetching recent signups:', error);
    return res.status(500).json({ error: 'An error occurred while fetching recent signups' });
  }
}; 
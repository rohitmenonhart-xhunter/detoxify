// Serverless function to handle APK downloads
import { connectToDatabase } from './db.js';
import path from 'path';
import fs from 'fs';

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
    // Get user email from query parameter (optional for tracking)
    const { email } = req.query;
    
    // Path to the APK file (adjust for Vercel deployment)
    let filePath;
    
    // In Vercel's serverless environment, we need to use the public directory
    if (process.env.VERCEL) {
      // In Vercel, use the public directory
      filePath = path.join(process.cwd(), 'public', 'downloads', 'insta-detoxify.apk');
    } else {
      // Local development
      filePath = path.join(process.cwd(), 'public', 'downloads', 'insta-detoxify.apk');
    }
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.error(`APK file not found at path: ${filePath}`);
      return res.status(404).json({ error: 'File not found' });
    }
    
    // If email is provided, log this download
    if (email) {
      try {
        // Connect to the database
        const { db } = await connectToDatabase();
        
        // Insert the download record
        await db.collection('downloads').insertOne({
          email,
          timestamp: new Date(),
          userAgent: req.headers['user-agent'],
        });
        
        console.log(`Download recorded for: ${email}`);
      } catch (dbError) {
        console.error('Error logging download:', dbError);
        // Continue with download even if logging fails
      }
    }
    
    // Read the file into memory
    const fileContent = fs.readFileSync(filePath);
    
    // Set headers for file download
    res.setHeader('Content-Disposition', 'attachment; filename=insta-detoxify.apk');
    res.setHeader('Content-Type', 'application/vnd.android.package-archive');
    res.setHeader('Content-Length', fileContent.length);
    
    // Send the file
    return res.send(fileContent);
  } catch (error) {
    console.error('Error handling download:', error);
    return res.status(500).json({ error: 'An error occurred while processing your download' });
  }
}; 
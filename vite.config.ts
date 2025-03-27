import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import type { IncomingMessage, ServerResponse } from 'http';
import type { ViteDevServer } from 'vite';
import { MongoClient, Db } from 'mongodb';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// MongoDB connection information
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://rohitmanon2:iamunique7$@cluster0.bvvvhfs.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
const MONGODB_DB = process.env.MONGODB_DB || 'insta_detoxify';

// Cache the MongoDB connection
let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

// Connect to MongoDB
async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db(MONGODB_DB);
    
    // Cache the connection
    cachedClient = client;
    cachedDb = db;
    
    console.log('Successfully connected to MongoDB!');
    
    return { client, db };
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    throw error;
  }
}

// Define types for database objects
interface Signup {
  name: string;
  email: string;
  timestamp: string;
  createdAt: Date;
}

interface Download {
  email: string;
  timestamp: Date;
  userAgent: string;
}

// Custom middleware plugin for API routes
function apiRoutesPlugin(): Plugin {
  return {
    name: 'api-routes',
    configureServer(server: ViteDevServer) {
      server.middlewares.use(async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
        // Handle signup API
        if (req.url === '/api/signup' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk: Buffer) => {
            body += chunk.toString();
          });
          req.on('end', async () => {
            try {
              const data = JSON.parse(body);
              const { name, email, timestamp } = data;
              
              if (!name || !email) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: 'Name and email are required' }));
                return;
              }
              
              // Create signup object
              const signup: Signup = {
                name,
                email,
                timestamp: timestamp || new Date().toISOString(),
                createdAt: new Date()
              };
              
              try {
                // Connect to MongoDB and insert data
                const { db } = await connectToDatabase();
                await db.collection('signups').insertOne(signup);
                console.log(`New signup saved to MongoDB: ${name} (${email})`);
              } catch (dbError) {
                console.error('MongoDB error when saving signup:', dbError);
                res.statusCode = 500;
                res.end(JSON.stringify({ error: 'Database connection error' }));
                return;
              }
              
              // Create download URL
              const downloadUrl = `/api/download?email=${encodeURIComponent(email)}`;
              
              // Return success response
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ 
                success: true, 
                message: 'Signup successful',
                downloadUrl
              }));
            } catch (error) {
              console.error('Signup error:', error);
              res.statusCode = 500;
              res.end(JSON.stringify({ error: 'An error occurred while saving your information' }));
            }
          });
          return;
        }
        
        // Handle download API
        if (req.url?.startsWith('/api/download') && req.method === 'GET') {
          try {
            // Extract email from query params
            const email = new URL(req.url, 'http://localhost').searchParams.get('email');
            
            // Path to the APK file
            const filePath = path.join(process.cwd(), 'public', 'downloads', 'insta-detoxify.apk');
            
            // Check if file exists
            if (!fs.existsSync(filePath)) {
              res.statusCode = 404;
              res.end(JSON.stringify({ error: 'File not found' }));
              return;
            }
            
            // Log download if email is provided
            if (email) {
              try {
                // Connect to MongoDB and insert download record
                const { db } = await connectToDatabase();
                const download: Download = {
                  email,
                  timestamp: new Date(),
                  userAgent: req.headers['user-agent'] as string
                };
                await db.collection('downloads').insertOne(download);
                console.log(`Download recorded for: ${email}`);
              } catch (dbError) {
                console.error('MongoDB error when logging download:', dbError);
                // Continue with download even if logging fails
              }
            }
            
            // Set headers for file download
            res.setHeader('Content-Disposition', 'attachment; filename=insta-detoxify.apk');
            res.setHeader('Content-Type', 'application/vnd.android.package-archive');
            
            // Create read stream and pipe to response
            const fileStream = fs.createReadStream(filePath);
            fileStream.pipe(res);
            return;
          } catch (error) {
            console.error('Download error:', error);
            res.statusCode = 500;
            res.end(JSON.stringify({ error: 'An error occurred while processing your download' }));
            return;
          }
        }
        
        // Handle recent-signups API
        if (req.url === '/api/recent-signups' && req.method === 'GET') {
          try {
            // Define type for recent signups
            interface RecentSignup {
              name: string;
              timestamp: string;
            }
            
            let recentSignups: RecentSignup[] = [];
            
            try {
              // Connect to MongoDB and fetch recent signups
              const { db } = await connectToDatabase();
              recentSignups = await db.collection('signups')
                .find({})
                .project({ name: 1, timestamp: 1, _id: 0 }) // Only include name and timestamp
                .sort({ createdAt: -1 }) // Most recent first
                .limit(5) // Limit to 5 results
                .toArray() as RecentSignup[];
                
              console.log(`Retrieved ${recentSignups.length} recent signups from MongoDB`);
            } catch (dbError) {
              console.error('MongoDB error when fetching recent signups:', dbError);
              // Return empty array if database query fails
              recentSignups = [];
            }
            
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(recentSignups));
          } catch (error) {
            console.error('Recent signups error:', error);
            res.statusCode = 500;
            res.end(JSON.stringify({ error: 'An error occurred while fetching recent signups' }));
          }
          return;
        }
        
        next();
      });
    }
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    apiRoutesPlugin()
  ],
  optimizeDeps: {
    exclude: ['lucide-react'],
  }
});

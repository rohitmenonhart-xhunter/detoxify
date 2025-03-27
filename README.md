# Insta-Detoxify

A modern web application that helps users manage their Instagram usage with mindful time management tools.

## Features

- Smart time tracking with 5-minute focus sessions
- Daily inspiration and mindfulness prompts
- Message-only mode for distraction-free communication
- Privacy-focused with zero data collection (except email for download)
- MongoDB backend for handling user signups

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

## Deployment to Vercel

This project is configured for easy deployment to Vercel:

1. **Push your code to a GitHub repository**

2. **Create a new project in Vercel**
   - Connect your GitHub repository
   - Set the framework preset to "Vite"
   - Vercel will auto-detect most settings

3. **Set up environment variables**
   In your Vercel project settings, add the following environment variables:
   
   ```
   MONGODB_URI=your_mongodb_connection_string
   MONGODB_DB=insta_detoxify
   ```

4. **Deploy**
   - Vercel will automatically build and deploy your application
   - The serverless API functions in the `/api` directory will be deployed as serverless functions

5. **Verify MongoDB Connection**
   - After deployment, check the function logs in Vercel to ensure MongoDB is connecting correctly
   - Test the signup form to ensure data is being saved

## Project Structure

- `/src` - React application code
- `/api` - Serverless API functions for Vercel
- `/public` - Static assets, including the APK file for download

## Data Storage

The application collects minimal user data:
- Name and email address when users sign up
- Download records for analytics purposes

All data is stored in MongoDB and never shared with third parties. 
# AI-Job Portal - Comprehensive Deployment Guide

This guide provides detailed instructions for deploying the AI-Job Portal application to various platforms, with a focus on Render.com deployment.

## Project Overview

This is a MERN stack application with:
- **Frontend**: React with Vite, Redux for state management
- **Backend**: Node.js with Express
- **Database**: MongoDB
- **File Storage**: Cloudinary
- **AI Features**: Hugging Face API

## Prerequisites

Before deploying, ensure you have:

- Node.js (v14 or higher)
- MongoDB account (Atlas recommended for cloud deployment)
- Cloudinary account for file storage
- Hugging Face API key for AI features
- Git installed (for version control and deployment)

## Environment Variables

The application requires the following environment variables:

```
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
MONGO_URI=your_mongodb_connection_string
SECRET_KEY=your_jwt_secret_key
HUGGING_FACE_API_KEY=your_huggingface_api_key
NODE_ENV=production
PORT=8001 (or your preferred port)
```

## Local Deployment

1. Clone the repository and navigate to the project directory

2. Create a `.env` file in the root directory with the required environment variables

3. Install dependencies:
   ```bash
   npm install
   cd frontend
   npm install
   cd ..
   ```

4. Build the frontend:
   ```bash
   cd frontend
   npm run build
   cd ..
   ```

5. Start the application:
   ```bash
   npm start
   ```

6. Access the application at `http://localhost:8001`

## Render.com Deployment (Recommended)

Render.com offers a simple and efficient way to deploy full-stack applications. You can deploy this application in two ways:

### Option 1: Deploy as a Single Web Service (Recommended)

This approach deploys both frontend and backend as a single service, which is simpler to manage.

1. **Create a MongoDB Atlas Database**
   - Sign up for MongoDB Atlas (https://www.mongodb.com/cloud/atlas)
   - Create a new cluster
   - Set up a database user with password
   - Get your connection string

2. **Set Up Cloudinary**
   - Sign up for Cloudinary (https://cloudinary.com/)
   - Get your cloud name, API key, and API secret

3. **Create a Render Web Service**
   - Sign up for Render (https://render.com/)
   - From your dashboard, click "New" and select "Web Service"
   - Connect your GitHub/GitLab repository or use the public repository URL

4. **Configure the Web Service**
   - **Name**: Choose a name for your service (e.g., "ai-job-portal")
   - **Environment**: Node
   - **Region**: Choose the region closest to your users
   - **Branch**: main (or your preferred branch)
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `node backend/index.js`
   - **Plan**: Choose an appropriate plan (Free tier works for testing)

5. **Set Environment Variables**
   - Add all the required environment variables listed above
   - Make sure to set `NODE_ENV=production`

6. **Create Web Service**
   - Click "Create Web Service" to start the deployment process

7. **Monitor Deployment**
   - Render will automatically build and deploy your application
   - You can monitor the build logs to ensure everything is working correctly

8. **Access Your Application**
   - Once deployed, your application will be available at the URL provided by Render
   - The URL will be in the format: `https://your-service-name.onrender.com`

### Option 2: Deploy Frontend and Backend Separately

This approach gives you more control but requires managing two services.

#### Backend Deployment

1. **Create a new Web Service** for the backend
   - Configure as above, but with these settings:
   - **Root Directory**: `./`
   - **Build Command**: `npm install`
   - **Start Command**: `node backend/index.js`

2. **Set Environment Variables** as listed above

3. **Add an additional environment variable**:
   - `FRONTEND_URL=https://your-frontend-service-name.onrender.com`

#### Frontend Deployment

1. **Create a new Static Site** for the frontend
   - Click on "New" and select "Static Site"
   - Connect your repository

2. **Configure the Static Site**
   - **Name**: Choose a name (e.g., "ai-job-portal-frontend")
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`

3. **Set Environment Variables**
   - `VITE_API_URL=https://your-backend-service-name.onrender.com/api/v1`

4. **Create Static Site**

## Alternative Deployment Options

### Heroku Deployment

1. Create a Heroku account and install the Heroku CLI

2. Login to Heroku:
   ```bash
   heroku login
   ```

3. Create a new Heroku app:
   ```bash
   heroku create your-job-portal-app
   ```

4. Set environment variables:
   ```bash
   heroku config:set CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   heroku config:set CLOUDINARY_API_KEY=your_cloudinary_api_key
   heroku config:set CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   heroku config:set MONGO_URI=your_mongodb_connection_string
   heroku config:set SECRET_KEY=your_jwt_secret_key
   heroku config:set HUGGING_FACE_API_KEY=your_huggingface_api_key
   heroku config:set NODE_ENV=production
   ```

5. Push to Heroku:
   ```bash
   git push heroku main
   ```

### AWS Deployment

1. Create an EC2 instance with Node.js installed

2. Clone the repository to the EC2 instance

3. Create a `.env` file with the required environment variables

4. Install dependencies and build the application:
   ```bash
   npm install
   cd frontend
   npm install
   npm run build
   cd ..
   ```

5. Use PM2 to keep the application running:
   ```bash
   npm install -g pm2
   pm2 start backend/index.js
   ```

6. Configure Nginx as a reverse proxy (optional):
   ```
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           proxy_pass http://localhost:8001;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check the build logs for specific errors
   - Ensure all dependencies are correctly specified in package.json
   - Verify that the Node.js version is compatible with your code

2. **Database Connection Issues**
   - Ensure your MongoDB connection string is correct
   - Check if your IP address is whitelisted in MongoDB Atlas
   - Verify that your database user has the correct permissions

3. **File Upload Issues**
   - Verify Cloudinary credentials
   - Check if the upload directory permissions are set correctly

4. **Environment Variable Issues**
   - Double-check all environment variables are correctly set
   - Ensure there are no typos in variable names

5. **CORS Issues**
   - If deploying frontend and backend separately, ensure CORS is properly configured

### Monitoring and Maintenance

1. **Logs**
   - Regularly check application logs for errors
   - On Render, logs are available in the dashboard

2. **Updates**
   - Keep dependencies updated to patch security vulnerabilities
   - Test updates in a staging environment before deploying to production

3. **Backups**
   - Regularly backup your MongoDB database
   - MongoDB Atlas provides automated backup solutions

## Conclusion

This guide covers the deployment of the AI-Job Portal application to various platforms, with a focus on Render.com. For any issues not covered in this guide, refer to the platform-specific documentation or seek help from the community.

Happy deploying!
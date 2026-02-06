# AI-Job Portal Application - Deployment Guide

This guide provides detailed instructions for deploying the AI-Job Portal application to various platforms.

## Prerequisites

Before deploying, ensure you have:

- Node.js (v14 or higher)
- MongoDB account (Atlas for cloud deployment)
- Cloudinary account for file storage
- Hugging Face API key for AI features

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

## Deployment Options

### Option 1: Local Deployment

1. Clone the repository and navigate to the project directory

2. Create a `.env` file in the root directory with the required environment variables

3. Install dependencies and build the application:
   ```bash
   npm run build
   ```

4. Start the application:
   ```bash
   npm start
   ```

### Option 2: Heroku Deployment

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

### Option 3: AWS Deployment

1. Create an EC2 instance with Node.js installed

2. Clone the repository to the EC2 instance

3. Create a `.env` file with the required environment variables

4. Install dependencies and build the application:
   ```bash
   npm run build
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

### Option 4: DigitalOcean Deployment

1. Create a DigitalOcean Droplet with Node.js

2. Follow the same steps as AWS deployment

## MongoDB Setup

1. Create a MongoDB Atlas account or use another MongoDB provider

2. Create a new cluster and database

3. Get your connection string and add it to the environment variables

## Cloudinary Setup

1. Create a Cloudinary account

2. Get your cloud name, API key, and API secret from the dashboard

3. Add these credentials to the environment variables

## Hugging Face API Setup

1. Create a Hugging Face account

2. Generate an API key

3. Add the API key to the environment variables

## Troubleshooting

If you encounter issues during deployment:

1. Check the application logs for errors

2. Verify all environment variables are correctly set

3. Ensure MongoDB connection is working properly

4. Check if Cloudinary credentials are valid

5. Make sure the build process completed successfully

6. Verify that the port is not being used by another application

## Important Notes

- The application uses the `build` script to install dependencies and build the frontend
- The `start` script runs the backend server
- The Procfile is configured for Heroku deployment
- The application serves the frontend from the `frontend/dist` directory
- File uploads are stored in Cloudinary
- The application requires a MongoDB database for data storage
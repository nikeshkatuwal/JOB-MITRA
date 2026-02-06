# AI-Job Portal Application

## Deployment Guide

This guide will help you deploy the AI-Job Portal application to a production environment.

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- Cloudinary account for file storage
- Hugging Face API key for AI features

### Environment Variables

Make sure to set the following environment variables in your production environment:

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

### Deployment Steps

1. **Clone the repository**

```bash
git clone <repository-url>
cd Job-Portal-main
```

2. **Install dependencies and build the application**

```bash
npm run build
```

This command will install all dependencies for both backend and frontend, and build the frontend application.

3. **Start the application**

```bash
npm start
```

### Deployment to Heroku

1. **Create a Heroku account and install the Heroku CLI**

2. **Login to Heroku**

```bash
heroku login
```

3. **Create a new Heroku app**

```bash
heroku create your-job-portal-app
```

4. **Set environment variables**

```bash
heroku config:set CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
heroku config:set CLOUDINARY_API_KEY=your_cloudinary_api_key
heroku config:set CLOUDINARY_API_SECRET=your_cloudinary_api_secret
heroku config:set MONGO_URI=your_mongodb_connection_string
heroku config:set SECRET_KEY=your_jwt_secret_key
heroku config:set HUGGING_FACE_API_KEY=your_huggingface_api_key
heroku config:set NODE_ENV=production
```

5. **Push to Heroku**

```bash
git push heroku main
```

### Deployment to Other Platforms

The application can also be deployed to other platforms like AWS, DigitalOcean, or Vercel. The key requirements are:

1. A Node.js environment
2. MongoDB database connection
3. Proper environment variables configuration
4. Build the frontend before deployment

### Important Notes

- Make sure to use a production MongoDB instance, not a local development database
- Ensure all API keys and secrets are kept secure
- The application uses Cloudinary for file storage, so a valid Cloudinary account is required
- The AI features require a valid Hugging Face API key

### Troubleshooting

If you encounter any issues during deployment:

1. Check the application logs for errors
2. Verify all environment variables are correctly set
3. Ensure MongoDB connection is working properly
4. Check if Cloudinary credentials are valid

### Support

For any questions or issues, please open an issue in the repository or contact the development team.
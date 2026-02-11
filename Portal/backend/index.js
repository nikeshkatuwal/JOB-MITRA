import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./utils/db.js";
import userRoutes from "./routes/user.routes.js";
import companyRoute from "./routes/company.route.js";
import jobRoute from "./routes/job.route.js";
import applicationRoute from "./routes/application.route.js";
import path from "path";
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
dotenv.config({});

// Validate required environment variables
const requiredEnvVars = [
    'MONGO_URI',
    'SECRET_KEY',
    // 'PORT',
    // 'CLOUDINARY_CLOUD_NAME',
    // 'CLOUDINARY_API_KEY',
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
if (missingEnvVars.length > 0) {
    console.error('Missing required environment variables:', missingEnvVars);
    process.exit(1);
}

// Configure CORS based on environment
const corsOptions = {
    origin: process.env.NODE_ENV === 'production'
        ? true // Allow requests from any origin in production
        : "http://localhost:5173", // Only allow localhost in development
    credentials: true
}

app.use(cors(corsOptions));

// middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Create uploads and resumes directories if they don't exist
const uploadsDir = path.join(__dirname, 'uploads');
const resumesDir = path.join(uploadsDir, 'resumes');

if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

if (!fs.existsSync(resumesDir)) {
    fs.mkdirSync(resumesDir, { recursive: true });
}

// Serve uploaded files - this should come before route handlers
// Serve from the backend/uploads directory where files are actually stored
app.use('/api/v1/uploads', express.static(path.join(__dirname, 'uploads')));

// api's
app.use("/api/v1/user", userRoutes);
app.use("/api/v1/company", companyRoute);
app.use("/api/v1/job", jobRoute);
app.use("/api/v1/application", applicationRoute);

// // Serve frontend static files 
app.use(express.static(path.join(__dirname, "../frontend/dist")));

// For all other routes, serve the index.html file
app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, "../frontend/dist/index.html"));
});

const PORT = process.env.PORT || 8001;

app.listen(PORT, () => {
    connectDB();
    console.log(`Server running at port ${PORT}`);
});
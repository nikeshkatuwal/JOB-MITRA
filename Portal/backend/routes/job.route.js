import express from "express";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import {
    postJob,
    getAllJobs,
    getJobById,
    getAdminJobs,
    getJobRecommendations,
    trackJobView,
    trackJobApplication,
    deleteJob,
    analyzeJob
} from "../controllers/job.controller.js";

const router = express.Router();

router.route("/post").post(isAuthenticated, postJob);
router.route("/get").get(isAuthenticated, getAllJobs);
router.route("/getadminjobs").get(isAuthenticated, getAdminJobs);
router.route("/get/:id").get(isAuthenticated, getJobById);
router.get("/recommendations", isAuthenticated, getJobRecommendations);

// New tracking routes for user interactions
router.post("/track/view/:id", isAuthenticated, trackJobView);
router.post("/track/apply/:id", isAuthenticated, trackJobApplication);

// Add the delete route
router.delete("/delete/:id", isAuthenticated, deleteJob);

// Add the analyze route
router.post('/analyze', isAuthenticated, analyzeJob);

export default router;


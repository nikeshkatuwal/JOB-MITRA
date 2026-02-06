import express from 'express';
import { applyJob, checkApplicationStatus, getApplicants, getAppliedJobs, recalculateMatchScores, updateStatus } from '../controllers/application.controller.js';
import isAuthenticated from '../middlewares/isAuthenticated.js';

const router = express.Router();

router.post('/apply/:id', isAuthenticated, applyJob);
router.get('/applied', isAuthenticated, getAppliedJobs);
router.get('/:id/applicants', isAuthenticated, getApplicants);
router.post('/:id/recalculate', isAuthenticated, recalculateMatchScores);
router.put('/update/:id', isAuthenticated, updateStatus);
router.get('/check/:jobId/:userId', isAuthenticated, checkApplicationStatus);

export default router;


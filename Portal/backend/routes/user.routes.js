import express from 'express';
import { register, login, logout, updateProfile, getProfile } from '../controllers/user.controller.js';
import isAuthenticated from '../middlewares/isAuthenticated.js';
import { handleFileUpload } from '../middlewares/fileUpload.js';
import { singleUpload } from '../middlewares/mutler.js';

const router = express.Router();

// Auth routes
router.post('/register', singleUpload, register);
router.post('/login', login);
router.get('/logout', logout);

// Profile routes
router.put('/update-profile', isAuthenticated, handleFileUpload, updateProfile);
router.get('/profile', isAuthenticated, getProfile);

export default router;
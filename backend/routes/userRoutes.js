import express from 'express';
import { getUsers, updateUserProfile, deleteUserProfile } from '../controllers/userController.js';
import { protect } from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = express.Router();

router.route('/')
  .get(protect, getUsers);

router.route('/profile')
  .put(protect, upload.single('profilePicture'), updateUserProfile)
  .delete(protect, deleteUserProfile);

export default router;

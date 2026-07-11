import express from 'express';
import { protect } from '../middleware/auth.js';
import upload from '../middleware/upload.js';
import {
  accessChat,
  fetchChats,
  createGroupChat,
  togglePinChat,
  toggleArchiveChat,
  deleteChat,
  clearChat,
  toggleBlockChat,
  updateChatTheme,
  toggleMuteChat,
  toggleFavoriteChat
} from '../controllers/chatController.js';

const router = express.Router();

router.route('/')
  .post(protect, accessChat)
  .get(protect, fetchChats);

router.route('/group')
  .post(protect, upload.single('groupPicture'), createGroupChat);

router.route('/:chatId/pin').put(protect, togglePinChat);
router.route('/:chatId/archive').put(protect, toggleArchiveChat);
router.route('/:chatId/delete').put(protect, deleteChat);
router.route('/:chatId/clear').put(protect, clearChat);
router.route('/:chatId/block').put(protect, toggleBlockChat);
router.route('/:chatId/theme').put(protect, updateChatTheme);

router.route('/:chatId/mute').put(protect, toggleMuteChat);
router.route('/:chatId/favorite').put(protect, toggleFavoriteChat);

export default router;

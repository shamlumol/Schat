import express from 'express';
import { allMessages, sendMessage, reactToMessage, editMessage, deleteMessageForEveryone, deleteMessageForMe, togglePinMessage, toggleStarMessage, searchMessages, viewOnceMessage, getCallHistory } from '../controllers/messageController.js';
import { protect } from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = express.Router();

router.route('/calls/history').get(protect, getCallHistory);
router.route('/:chatId/search').get(protect, searchMessages);

router.route('/:chatId')
  .get(protect, allMessages);

router.route('/')
  .post(protect, upload.single('file'), sendMessage);

router.route('/:messageId/react').post(protect, reactToMessage);
router.route('/:messageId/edit').put(protect, editMessage);
router.route('/:messageId/delete-everyone').put(protect, deleteMessageForEveryone);
router.route('/:messageId/delete').put(protect, deleteMessageForMe);
router.route('/:messageId/pin').put(protect, togglePinMessage);
router.route('/:messageId/star').put(protect, toggleStarMessage);
router.route('/:messageId/view').put(protect, viewOnceMessage);

export default router;

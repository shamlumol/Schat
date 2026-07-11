import Message from '../models/Message.js';
import User from '../models/User.js';
import Chat from '../models/Chat.js';

// search messages in chat
export const searchMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const messages = await Message.find({
      chat: chatId,
      content: { $regex: q, $options: 'i' },
      deletedFor: { $ne: req.user._id }
    })
      .populate('sender', 'displayName profilePicture email')
      .populate('chat')
      .populate({
        path: 'replyTo',
        populate: { path: 'sender', select: 'displayName profilePicture' }
      })
      .sort({ createdAt: -1 });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// get all messages
export const allMessages = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const messages = await Message.find({ 
      chat: req.params.chatId,
      deletedFor: { $ne: req.user._id }
    })
      .populate('sender', 'displayName profilePicture email')
      .populate('chat')
      .populate({
        path: 'replyTo',
        populate: { path: 'sender', select: 'displayName profilePicture' }
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
      
    // Return in chronological order
    res.json(messages.reverse());
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// create new message
export const sendMessage = async (req, res) => {
  const { content, chatId, messageType, replyTo, isViewOnce, fileUrl, isForwarded } = req.body;

  if (!chatId) {
    console.log("sendMessage Error: Missing chatId. req.body:", req.body);
    return res.status(400).json({ message: 'Invalid data passed into request' });
  }

  try {
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    if (chat.blockedBy && chat.blockedBy.length > 0) {
      return res.status(403).json({ message: 'This chat is blocked' });
    }

    const newMessage = {
      sender: req.user._id,
      content: content || '',
      chat: chatId,
      messageType: messageType || 'text',
      isViewOnce: isViewOnce === 'true' || isViewOnce === true,
      isForwarded: isForwarded === 'true' || isForwarded === true,
    };

    if (replyTo) {
      newMessage.replyTo = replyTo;
    }

    if (req.file) {
      newMessage.fileUrl = req.file.path;
      newMessage.fileSize = req.file.size;
      newMessage.messageType = req.file.mimetype.startsWith('image/') ? 'image' : 'voice';
    } else if (fileUrl) {
      // Support for forwarded attachments or Tenor GIFs where the fileUrl is passed directly
      newMessage.fileUrl = fileUrl;
    }


    let message = await Message.create(newMessage);

    message = await message.populate('sender', 'displayName profilePicture');
    message = await message.populate('chat');
    if (replyTo) {
      message = await message.populate({
        path: 'replyTo',
        populate: { path: 'sender', select: 'displayName profilePicture' }
      });
    }
    message = await User.populate(message, {
      path: 'chat.participants',
      select: 'displayName profilePicture email',
    });

    await Chat.findByIdAndUpdate(chatId, { 
      lastMessage: message._id,
      $set: { deletedBy: [], archivedBy: [] } // Undelete and Unarchive the chat for all participants on a new message
    });

    res.json(message);
  } catch (error) {
    console.log("sendMessage try/catch Error:", error);
    res.status(400).json({ message: error.message });
  }
};

// add reaction to message
export const reactToMessage = async (req, res) => {
  const { emoji } = req.body;

  try {
    let message = await Message.findById(req.params.messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Check if user already has a reaction
    const existingReaction = message.reactions.find(
      (r) => r.userId.toString() === req.user._id.toString()
    );

    // Remove any existing reactions from this user
    message.reactions = message.reactions.filter(
      (r) => r.userId.toString() !== req.user._id.toString()
    );

    // If they clicked a new emoji, add it. (If they clicked the same one, it just toggles off)
    if (!existingReaction || existingReaction.emoji !== emoji) {
      message.reactions.push({ userId: req.user._id, emoji });
    }

    await message.save();

    message = await message.populate('sender', 'displayName profilePicture');
    message = await message.populate('chat');
    message = await message.populate({
      path: 'replyTo',
      populate: { path: 'sender', select: 'displayName profilePicture' }
    });
    const mongoose = await import('mongoose');
    const User = mongoose.model('User');
    message = await User.populate(message, {
      path: 'chat.participants',
      select: 'displayName profilePicture email',
    });

    res.json(message);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Helper function to emit socket updates for messages
const emitMessageUpdate = (req, message, event = 'message_updated') => {
  const io = req.app.get('io');
  if (io && message.chat && message.chat.participants) {
    message.chat.participants.forEach((user) => {
      // Typically, in a real app, users join a room with their user ID
      io.to(user._id ? user._id.toString() : user.toString()).emit(event, message);
    });
  }
};

// edit message
export const editMessage = async (req, res) => {
  const { content } = req.body;
  try {
    let message = await Message.findById(req.params.messageId).populate('chat');
    if (!message) return res.status(404).json({ message: 'Message not found' });
    
    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to edit this message' });
    }

    const timeDiff = Date.now() - new Date(message.createdAt).getTime();
    if (timeDiff > 5 * 60 * 1000) {
      return res.status(400).json({ message: 'Message can only be edited within 5 minutes of sending' });
    }

    message.content = content;
    message.isEdited = true;
    message.editedAt = Date.now();
    await message.save();

    message = await message.populate('sender', 'displayName profilePicture email');
    message = await message.populate({ path: 'replyTo', populate: { path: 'sender', select: 'displayName profilePicture' }});
    
    emitMessageUpdate(req, message);
    res.json(message);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// delete message for everyone
export const deleteMessageForEveryone = async (req, res) => {
  try {
    let message = await Message.findById(req.params.messageId).populate('chat');
    if (!message) return res.status(404).json({ message: 'Message not found' });
    
    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this message' });
    }

    const timeDiff = Date.now() - new Date(message.createdAt).getTime();
    if (timeDiff > 5 * 60 * 1000) {
      return res.status(400).json({ message: 'Message can only be deleted for everyone within 5 minutes of sending' });
    }

    message.isDeletedForEveryone = true;
    message.content = '';
    message.fileUrl = '';
    await message.save();

    message = await message.populate('sender', 'displayName profilePicture email');
    
    emitMessageUpdate(req, message);
    res.json(message);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// delete message for me
export const deleteMessageForMe = async (req, res) => {
  try {
    let message = await Message.findById(req.params.messageId);
    if (!message) return res.status(404).json({ message: 'Message not found' });

    if (!message.deletedFor.includes(req.user._id)) {
      message.deletedFor.push(req.user._id);
      await message.save();
    }

    res.json({ message: 'Message deleted for you', _id: req.params.messageId });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// toggle pin message
export const togglePinMessage = async (req, res) => {
  try {
    let message = await Message.findById(req.params.messageId).populate('chat');
    if (!message) return res.status(404).json({ message: 'Message not found' });

    const isPinned = message.pinnedBy?.includes(req.user._id);
    if (isPinned) {
      message.pinnedBy = message.pinnedBy.filter(id => id.toString() !== req.user._id.toString());
    } else {
      if(!message.pinnedBy) message.pinnedBy = [];
      message.pinnedBy.push(req.user._id);
    }

    await message.save();
    message = await message.populate('sender', 'displayName profilePicture email');
    message = await message.populate({ path: 'replyTo', populate: { path: 'sender', select: 'displayName profilePicture' }});

    emitMessageUpdate(req, message);
    res.json(message);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// toggle star message
export const toggleStarMessage = async (req, res) => {
  try {
    let message = await Message.findById(req.params.messageId).populate('chat');
    if (!message) return res.status(404).json({ message: 'Message not found' });

    const isStarred = message.starredBy?.includes(req.user._id);
    if (isStarred) {
      message.starredBy = message.starredBy.filter(id => id.toString() !== req.user._id.toString());
    } else {
      if(!message.starredBy) message.starredBy = [];
      message.starredBy.push(req.user._id);
    }

    await message.save();
    message = await message.populate('sender', 'displayName profilePicture email');
    message = await message.populate({ path: 'replyTo', populate: { path: 'sender', select: 'displayName profilePicture' }});

    res.json(message);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// view a view-once message
export const viewOnceMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);
    if (!message) return res.status(404).json({ message: 'Message not found' });

    if (!message.isViewOnce) {
      return res.status(400).json({ message: 'Message is not a view-once message' });
    }

    if (!message.viewedBy.includes(req.user._id)) {
      message.viewedBy.push(req.user._id);
      
      // If the viewer is the recipient (not the sender), delete the file contents to enforce privacy
      if (message.sender.toString() !== req.user._id.toString()) {
         message.fileUrl = '';
         message.content = 'This view-once message has been opened.';
      }
      
      await message.save();
    }
    
    res.json(message);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// get call history
export const getCallHistory = async (req, res) => {
  try {
    // First, find all chats where the user is a participant
    const chats = await Chat.find({ participants: req.user._id }).select('_id');
    const chatIds = chats.map(chat => chat._id);

    // Then find all call_log messages in these chats
    const calls = await Message.find({
      chat: { $in: chatIds },
      messageType: 'call_log',
      deletedFor: { $ne: req.user._id }
    })
      .populate('sender', 'displayName profilePicture email isOnline')
      .populate({
        path: 'chat',
        populate: {
          path: 'participants',
          select: 'displayName profilePicture email isOnline'
        }
      })
      .sort({ createdAt: -1 });

    res.json(calls);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

import Chat from '../models/Chat.js';
import User from '../models/User.js';

// access or create a 1-on-1 chat
export const accessChat = async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ message: 'UserId param not sent with request' });
  }

  try {
    let isChat = await Chat.find({
      isGroupChat: false,
      $and: [
        { participants: { $elemMatch: { $eq: req.user._id } } },
        { participants: { $elemMatch: { $eq: userId } } },
      ],
    })
      .populate('participants', '-password')
      .populate('lastMessage');

    isChat = await User.populate(isChat, {
      path: 'lastMessage.sender',
      select: 'displayName profilePicture email',
    });

    if (isChat.length > 0) {
      res.json(isChat[0]);
    } else {
      var chatData = {
        groupName: 'sender',
        isGroupChat: false,
        participants: [req.user._id, userId],
      };

      const createdChat = await Chat.create(chatData);
      const fullChat = await Chat.findOne({ _id: createdChat._id }).populate(
        'participants',
        '-password'
      );
      res.status(200).json(fullChat);
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// fetch all chats for a user
export const fetchChats = async (req, res) => {
  try {
    let results = await Chat.find({
      participants: { $elemMatch: { $eq: req.user._id } },
      deletedBy: { $ne: req.user._id }
    })
      .populate('participants', '-password')
      .populate('groupAdmin', '-password')
      .populate('lastMessage')
      .sort({ updatedAt: -1 });

    results = await User.populate(results, {
      path: 'lastMessage.sender',
      select: 'displayName profilePicture email',
    });

    res.status(200).json(results);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// create new group chat
export const createGroupChat = async (req, res) => {
  if (!req.body.users || !req.body.name) {
    return res.status(400).send({ message: 'Please Fill all the fields' });
  }

  let users = JSON.parse(req.body.users);

  if (users.length < 2) {
    return res.status(400).send('More than 2 users are required to form a group chat');
  }

  users.push(req.user);

  try {
    const groupChatData = {
      groupName: req.body.name,
      participants: users,
      isGroupChat: true,
      groupAdmin: [req.user._id],
    };

    // Handle group picture upload if file exists
    if (req.file) {
      groupChatData.groupPicture = req.file.path;
    }

    const groupChat = await Chat.create(groupChatData);

    const fullGroupChat = await Chat.findOne({ _id: groupChat._id })
      .populate('participants', '-password')
      .populate('groupAdmin', '-password');

    res.status(200).json(fullGroupChat);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Helper function to emit socket updates
const emitChatUpdate = (req, updatedChat) => {
  const io = req.app.get('io');
  if (io) {
    // We only need to notify the user who made the change for user-specific actions (pin, archive, mute, block, favorite)
    // For simplicity, we can emit to the user's room
    io.to(req.user._id.toString()).emit('chat_updated', updatedChat);
  }
};

// pin or unpin a chat for current user
export const togglePinChat = async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.chatId).populate('participants', '-password').populate('lastMessage');
    if (!chat) return res.status(404).json({ message: 'Chat not found' });

    const isPinned = chat.pinnedBy.includes(req.user._id);
    if (isPinned) {
      chat.pinnedBy = chat.pinnedBy.filter(id => id.toString() !== req.user._id.toString());
    } else {
      chat.pinnedBy.push(req.user._id);
    }

    const updatedChat = await chat.save();
    emitChatUpdate(req, updatedChat);
    res.json(updatedChat);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// archive or unarchive a chat for current user
export const toggleArchiveChat = async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.chatId).populate('participants', '-password').populate('lastMessage');
    if (!chat) return res.status(404).json({ message: 'Chat not found' });

    const isArchived = chat.archivedBy.includes(req.user._id);
    if (isArchived) {
      chat.archivedBy = chat.archivedBy.filter(id => id.toString() !== req.user._id.toString());
    } else {
      chat.archivedBy.push(req.user._id);
    }

    const updatedChat = await chat.save();
    emitChatUpdate(req, updatedChat);
    res.json(updatedChat);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// block or unblock a chat for current user
export const toggleBlockChat = async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.chatId).populate('participants', '-password').populate('lastMessage');
    if (!chat) return res.status(404).json({ message: 'Chat not found' });

    const isBlocked = chat.blockedBy?.includes(req.user._id);
    if (isBlocked) {
      chat.blockedBy = chat.blockedBy.filter(id => id.toString() !== req.user._id.toString());
    } else {
      chat.blockedBy.push(req.user._id);
    }

    const updatedChat = await chat.save();
    emitChatUpdate(req, updatedChat);
    res.json(updatedChat);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// mute or unmute a chat for current user
export const toggleMuteChat = async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.chatId).populate('participants', '-password').populate('lastMessage');
    if (!chat) return res.status(404).json({ message: 'Chat not found' });

    const isMuted = chat.mutedBy?.includes(req.user._id);
    if (isMuted) {
      chat.mutedBy = chat.mutedBy.filter(id => id.toString() !== req.user._id.toString());
    } else {
      chat.mutedBy.push(req.user._id);
    }

    const updatedChat = await chat.save();
    emitChatUpdate(req, updatedChat);
    res.json(updatedChat);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// favorite or unfavorite a chat for current user
export const toggleFavoriteChat = async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.chatId).populate('participants', '-password').populate('lastMessage');
    if (!chat) return res.status(404).json({ message: 'Chat not found' });

    const isFavorite = chat.favoriteBy?.includes(req.user._id);
    if (isFavorite) {
      chat.favoriteBy = chat.favoriteBy.filter(id => id.toString() !== req.user._id.toString());
    } else {
      chat.favoriteBy.push(req.user._id);
    }

    const updatedChat = await chat.save();
    emitChatUpdate(req, updatedChat);
    res.json(updatedChat);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// delete a chat for current user
// delete a chat for current user
export const deleteChat = async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.chatId);
    if (!chat) return res.status(404).json({ message: 'Chat not found' });
    
    // Add user to deletedBy array instead of deleting the document
    if (!chat.deletedBy) chat.deletedBy = [];
    if (!chat.deletedBy.includes(req.user._id)) {
      chat.deletedBy.push(req.user._id);
      await chat.save();
    }
    
    const io = req.app.get('io');
    if (io) io.to(req.user._id.toString()).emit('chat_deleted', req.params.chatId);

    res.json({ message: 'Chat deleted', _id: req.params.chatId });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// clear all messages in a chat for current user
export const clearChat = async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.chatId).populate('participants', '-password');
    if (!chat) return res.status(404).json({ message: 'Chat not found' });
    
    // Add user to deletedFor of all existing messages
    const mongoose = await import('mongoose');
    const Message = mongoose.model('Message');
    await Message.updateMany(
      { chat: req.params.chatId },
      { $addToSet: { deletedFor: req.user._id } }
    );
    
    // Set clearedAt timestamp on chat to ignore lastMessage before this time
    if (!chat.clearedAt) chat.clearedAt = new Map();
    chat.clearedAt.set(req.user._id.toString(), new Date());
    const updatedChat = await chat.save();
    
    emitChatUpdate(req, updatedChat);
    res.json(updatedChat);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// update theme for a chat
export const updateChatTheme = async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.chatId).populate('participants', '-password').populate('lastMessage');
    if (!chat) return res.status(404).json({ message: 'Chat not found' });

    chat.theme = req.body.theme || 'blue';
    const updatedChat = await chat.save();
    
    emitChatUpdate(req, updatedChat);
    res.json(updatedChat);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

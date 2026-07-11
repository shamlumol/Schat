import User from '../models/User.js';
import Chat from '../models/Chat.js';
import Message from '../models/Message.js';

// get all users (search)
export const getUsers = async (req, res) => {
  try {
    const keyword = req.query.search
      ? {
          $or: [
            { username: { $regex: `^${req.query.search}$`, $options: 'i' } },
            { displayName: { $regex: `^${req.query.search}$`, $options: 'i' } },
          ],
        }
      : {};

    const users = await User.find(keyword)
      .limit(20)
      .select('-password');

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// update user profile
export const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      if (req.body.username && req.body.username !== user.username) {
        const usernameExists = await User.findOne({ username: req.body.username });
        if (usernameExists) {
          return res.status(400).json({ message: 'Username is already taken' });
        }
      }

      user.displayName = req.body.displayName || user.displayName;
      user.username = req.body.username || user.username;
      user.email = req.body.email || user.email;
      user.bio = req.body.bio !== undefined ? req.body.bio : user.bio;
      user.theme = req.body.theme || user.theme;
      user.wallpaper = req.body.wallpaper || user.wallpaper;

      if (req.body.privacy) {
        let privacyData = req.body.privacy;
        if (typeof privacyData === 'string') {
          try {
            privacyData = JSON.parse(privacyData);
          } catch (e) {
            console.error('Failed to parse privacy data', e);
          }
        }
        
        user.privacy = {
          lastSeen: privacyData.lastSeen !== undefined ? privacyData.lastSeen : user.privacy?.lastSeen,
          profilePhoto: privacyData.profilePhoto || user.privacy?.profilePhoto,
          readReceipts: privacyData.readReceipts !== undefined ? privacyData.readReceipts : user.privacy?.readReceipts
        };
        user.markModified('privacy');
      }

      // Handle profile picture upload if file exists (Cloudinary)
      if (req.file) {
        user.profilePicture = req.file.path;
      }

      // Handle password update if provided
      if (req.body.password) {
        user.password = req.body.password; // pre-save hook will hash it
      }

      const updatedUser = await user.save();

      const payload = {
        _id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email,
        displayName: updatedUser.displayName,
        profilePicture: updatedUser.profilePicture,
        bio: updatedUser.bio,
        theme: updatedUser.theme,
        wallpaper: updatedUser.wallpaper,
        privacy: updatedUser.privacy
      };

      const io = req.app.get('io');
      if (io) {
        io.emit('user_profile_updated', payload);
      }

      res.json(payload);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.log("Profile update error:", error);
    res.status(500).json({ message: error.message || 'Internal Server Error', error: error });
  }
};

// delete user profile
export const deleteUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // 1. Delete all messages sent by this user
    await Message.deleteMany({ sender: req.user._id });

    // 2. Delete all 1-on-1 chats where this user is a participant
    await Chat.deleteMany({ isGroupChat: false, participants: req.user._id });

    // 3. Remove user from all group chats
    await Chat.updateMany(
      { isGroupChat: true, participants: req.user._id },
      { 
        $pull: { 
          participants: req.user._id, 
          groupAdmin: req.user._id 
        } 
      }
    );

    // 4. Delete the user document
    await User.findByIdAndDelete(req.user._id);

    res.json({ message: 'Account and associated data successfully deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

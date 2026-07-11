import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  chat: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat', required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, default: '' },
  messageType: { 
    type: String, 
    enum: ['text', 'image', 'voice', 'system', 'sticker', 'call_log'], 
    default: 'text' 
  },
  fileUrl: { type: String, default: '' },
  fileSize: { type: Number, default: 0 },
  replyTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
  readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  deliveredTo: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  reactions: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    emoji: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  }],
  isEdited: { type: Boolean, default: false },
  editedAt: { type: Date },
  isViewOnce: { type: Boolean, default: false },
  isForwarded: { type: Boolean, default: false },
  viewedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  deletedFor: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isDeletedForEveryone: { type: Boolean, default: false },
  pinnedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  starredBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

const Message = mongoose.model('Message', messageSchema);
export default Message;

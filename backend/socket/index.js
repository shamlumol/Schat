import User from '../models/User.js';

export const socketHandlers = (io) => {
  io.on('connection', (socket) => {
    console.log(`User Connected: ${socket.id}`);

    socket.on('setup', async (userData) => {
      socket.join(userData._id);
      socket.userId = userData._id; // Store userId on the socket
      socket.emit('connected');
      
      // Update online status
      await User.findByIdAndUpdate(userData._id, { 
        isOnline: true,
        lastSeen: new Date()
      });
      socket.broadcast.emit('user_status_change', { userId: userData._id, isOnline: true, lastSeen: new Date() });
    });

    socket.on('join_chat', (room) => {
      socket.join(room);
      console.log(`User Joined Room: ${room}`);
    });

    socket.on('typing', (room) => socket.in(room).emit('typing'));
    socket.on('stop_typing', (room) => socket.in(room).emit('stop_typing'));

    socket.on('new_message', async (newMessageReceived) => {
      var chat = newMessageReceived.chat;

      if (!chat.participants) return console.log('chat.participants not defined');

      // Assume delivered to server for all participants (save to DB? We'll handle delivery when client acks)
      chat.participants.forEach((user) => {
        if (user._id === newMessageReceived.sender._id) return;
        socket.in(user._id).emit('message_received', newMessageReceived);
      });
    });

    socket.on('message_delivered', async ({ messageId, userId }) => {
      try {
        const msg = await User.findById(userId); // wait, we need to update Message
        const mongoose = await import('mongoose');
        const Message = mongoose.model('Message');
        const updatedMsg = await Message.findByIdAndUpdate(
          messageId,
          { $addToSet: { deliveredTo: userId } },
          { new: true }
        ).populate('sender', 'displayName profilePicture').populate('chat');
        
        // Notify sender that message was delivered
        if (updatedMsg) {
          socket.in(updatedMsg.sender._id.toString()).emit('message_status_update', updatedMsg);
        }
      } catch (error) {
        console.log('bug:', error);
      }
    });

    socket.on('message_read', async ({ messageId, userId }) => {
      try {
        const mongoose = await import('mongoose');
        const Message = mongoose.model('Message');
        const updatedMsg = await Message.findByIdAndUpdate(
          messageId,
          { $addToSet: { readBy: userId, deliveredTo: userId } }, // If read, it's also delivered
          { new: true }
        ).populate('sender', 'displayName profilePicture').populate('chat');
        
        // Notify sender that message was read
        if (updatedMsg) {
          socket.in(updatedMsg.sender._id.toString()).emit('message_status_update', updatedMsg);
        }
      } catch (error) {
        console.log('bug:', error);
      }
    });

    socket.on('message_reaction', (updatedMsg) => {
      if (!updatedMsg.chat || !updatedMsg.chat.participants) return;
      updatedMsg.chat.participants.forEach((participant) => {
        const participantId = participant._id ? participant._id.toString() : participant.toString();
        if (participantId === socket.userId) return; // don't send back to self
        socket.in(participantId).emit('message_status_update', updatedMsg);
      });
    });

    // WebRTC Signaling
    socket.on('call_user', ({ userToCall, signalData, from, callerName, callerAvatar, isVideoCall }) => {
      console.log(`[WebRTC] call_user: from ${from} to ${userToCall}`);
      socket.in(userToCall).emit('incoming_call', {
        signal: signalData,
        from,
        callerName,
        callerAvatar,
        isVideoCall
      });
    });

    socket.on('answer_call', ({ to, signal }) => {
      console.log(`[WebRTC] answer_call: to ${to}`);
      socket.in(to).emit('call_accepted', signal);
    });

    socket.on('ice_candidate', ({ to, candidate }) => {
      socket.in(to).emit('ice_candidate', candidate);
    });

    socket.on('end_call', ({ to }) => {
      console.log(`[WebRTC] end_call: to ${to}`);
      socket.in(to).emit('call_ended');
    });

    socket.on('video_status_change', ({ to, isVideoOff }) => {
      socket.in(to).emit('video_status_change', isVideoOff);
    });

    socket.on('disconnect', async () => {
      console.log('User Disconnected', socket.userId);
      if (socket.userId) {
        const lastSeen = new Date();
        await User.findByIdAndUpdate(socket.userId, { 
          isOnline: false,
          lastSeen: lastSeen
        });
        socket.broadcast.emit('user_status_change', { userId: socket.userId, isOnline: false, lastSeen: lastSeen });
      }
    });
  });
};

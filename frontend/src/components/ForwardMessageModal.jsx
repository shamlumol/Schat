import React, { useState } from 'react';

const ForwardMessageModal = ({ isOpen, onClose, message, chats, user, getSenderFull, getSender, onForward }) => {
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen || !message) return null;

  const filteredChats = chats.filter(chat => {
    if (chat.isGroupChat) {
      return chat.groupName.toLowerCase().includes(searchQuery.toLowerCase());
    } else {
      const sender = getSenderFull(user, chat.participants);
      if (!sender) return false;
      return sender.displayName.toLowerCase().includes(searchQuery.toLowerCase()) || 
             sender.username.toLowerCase().includes(searchQuery.toLowerCase());
    }
  });

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/50 z-[100] backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      ></div>
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] sm:w-[360px] max-w-[90vw] bg-surface rounded-[2rem] shadow-2xl z-[101] flex flex-col max-h-[80vh] overflow-hidden border border-outline-variant/20 animate-in zoom-in duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-outline-variant/10">
          <h2 className="text-lg font-bold text-on-surface">Forward to...</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant transition-colors">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-outline-variant/10">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
            <input 
              type="text" 
              placeholder="Search chats or contacts..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface-container-low border border-outline-variant/20 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 rounded-full py-2 pl-9 pr-4 text-sm outline-none text-on-surface placeholder:text-on-surface-variant/50 transition-all"
            />
          </div>
        </div>

        {/* Message Preview */}
        <div className="bg-surface-container-lowest p-4 border-b border-outline-variant/10">
          <div className="bg-surface-container p-4 rounded-[1.5rem] border border-outline-variant/10 max-h-24 overflow-hidden relative">
            <span className="text-[10px] font-bold text-on-surface-variant mb-1 block uppercase tracking-wider">Message Preview</span>
            <p className="text-sm text-on-surface line-clamp-2">{message.content || 'Attachment / Media'}</p>
            {message.fileUrl && (
              <span className="text-xs text-primary mt-1 flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">attachment</span> Attached Media
              </span>
            )}
            <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-surface-container to-transparent pointer-events-none"></div>
          </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredChats.length > 0 ? filteredChats.map((chat) => {
            const title = chat.isGroupChat ? chat.groupName : getSender(user, chat.participants);
            const senderProfile = getSenderFull(user, chat.participants)?.profilePicture;
            const avatar = chat.isGroupChat 
              ? (chat.groupPicture || 'storefront') 
              : ((!senderProfile || senderProfile === 'default.jpg' || senderProfile === 'https://via.placeholder.com/150') ? 'person' : senderProfile);
            
            return (
              <button 
                key={chat._id}
                onClick={() => onForward(chat._id)}
                className="w-full flex items-center justify-between p-3 hover:bg-surface-container rounded-full transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-surface-variant overflow-hidden relative flex items-center justify-center">
                    {chat.isGroupChat && avatar === 'storefront' ? (
                      <span className="material-symbols-outlined text-on-surface-variant text-[20px]">group</span>
                    ) : avatar === 'person' ? (
                      <span className="material-symbols-outlined text-on-surface-variant text-[24px]">person</span>
                    ) : (
                      <img src={avatar} alt={title} className="w-full h-full object-cover" />
                    )}
                  </div>
                  <span className="font-semibold text-sm text-on-surface">{title}</span>
                </div>
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="material-symbols-outlined text-[18px]">send</span>
                </div>
              </button>
            )
          }) : (
            <div className="text-center py-8 text-on-surface-variant text-sm">
              No chats found.
            </div>
          )}
        </div>

      </div>
    </>
  );
};

export default ForwardMessageModal;

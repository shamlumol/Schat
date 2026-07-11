import React, { useState, useEffect } from 'react';

const ChatInfoModal = ({ isOpen, onClose, chat, user, setPreviewMediaUrl, messages = [], getSenderFull, getSender, onAction, onMessageJump }) => {
  const [activeView, setActiveView] = useState('main');

  // Reset view when modal closes
  useEffect(() => {
    if (!isOpen) setActiveView('main');
  }, [isOpen]);

  if (!isOpen || !chat) return null;

  const isGroup = chat.isGroupChat;
  const title = isGroup ? chat.groupName : getSender(user, chat.participants);
  const fullUser = isGroup ? null : getSenderFull(user, chat.participants);
  const hideProfilePhoto = fullUser?.privacy?.profilePhoto === 'Nobody';
  const hideLastSeen = fullUser?.privacy?.lastSeen === false;

  const avatar = isGroup
    ? (chat.groupPicture || 'storefront')
    : (hideProfilePhoto || !fullUser?.profilePicture || fullUser?.profilePicture === 'default.jpg' || fullUser?.profilePicture === 'https://via.placeholder.com/150') ? 'person' : fullUser.profilePicture;

  const isOnline = fullUser?.isOnline && !hideLastSeen;
  const isBlocked = chat.blockedBy?.includes(user?._id);
  const isFavorite = chat.favoriteBy?.includes(user?._id);

  // Filters for sub-views
  const mediaMessages = messages.filter(m => m.messageType !== 'sticker' && (m.messageType === 'image' || (m.fileUrl && !m.audioUrl)));
  const linkMessages = messages.filter(m => m.content && (m.content.includes('http://') || m.content.includes('https://') || m.content.includes('www.')));

  const handleActionClick = (action) => {
    if (['clear', 'block', 'favorite'].includes(action)) {
      onAction(action);
    } else {
      setActiveView(action);
    }
  };

  const renderHeader = (titleText) => (
    <div className="flex items-center gap-4 pt-4 pb-4 px-6 border-b border-outline-variant/10">
      <button onClick={() => setActiveView('main')} className="text-on-surface-variant hover:text-primary transition-colors">
        <span className="material-symbols-outlined text-[20px]">arrow_back</span>
      </button>
      <h2 className="text-lg font-bold font-display text-on-surface flex-1">{titleText}</h2>
    </div>
  );

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-[100] backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>
      <div
        className="fixed bottom-0 left-0 right-0 md:left-1/2 md:-translate-x-1/2 md:bottom-auto md:top-1/2 md:-translate-y-1/2 md:w-[400px] md:h-[600px] md:rounded-2xl bg-surface z-[101] rounded-t-3xl shadow-2xl animate-fade-in-up border border-outline-variant/20 flex flex-col max-h-[85vh] overflow-hidden"
      >
        {/* Drag handle for mobile */}
        <div className="w-12 h-1.5 bg-outline-variant/30 rounded-full mx-auto mt-3 mb-1 md:hidden"></div>

        {activeView === 'main' && (
          <>
            {/* Header / Avatar */}
            <div className="flex flex-col items-center pt-2 pb-6 px-6 border-b border-outline-variant/10">
              <div 
                className={`w-24 h-24 rounded-full bg-surface-variant overflow-hidden mb-4 relative shadow-md ${avatar !== 'storefront' && avatar !== 'person' ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''}`}
                onClick={() => {
                  if (setPreviewMediaUrl && avatar !== 'storefront' && avatar !== 'person') {
                    setPreviewMediaUrl(avatar);
                  }
                }}
              >
                {isGroup && avatar === 'storefront' ? (
                  <span className="material-symbols-outlined text-[48px] text-on-surface-variant absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">group</span>
                ) : avatar === 'person' ? (
                  <span className="material-symbols-outlined text-[48px] text-on-surface-variant absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">person</span>
                ) : (
                  <img src={avatar} alt={title} className="w-full h-full object-cover" />
                )}
              </div>
              <h2 className="text-xl font-bold text-on-surface text-center mb-1">{title}</h2>

              {!isGroup && !hideLastSeen && (
                <p className="text-sm text-on-surface-variant m-0 flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full inline-block ${isOnline ? 'bg-primary' : 'bg-outline-variant'}`}></span>
                  {isOnline ? 'Online' : (
                    fullUser?.lastSeen ?
                      `Last seen ${new Date(fullUser.lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                      : 'Offline'
                  )}
                </p>
              )}
              
              {!isGroup && fullUser && (
                <div className="mt-3 flex flex-col items-center gap-1 w-full px-4">
                  {fullUser.username && (
                    <p className="text-sm font-medium text-on-surface bg-surface-variant px-3 py-1 rounded-full mb-1">@{fullUser.username}</p>
                  )}
                  {fullUser.bio && (
                    <p className="text-sm text-on-surface-variant text-center leading-relaxed">"{fullUser.bio}"</p>
                  )}
                </div>
              )}

              {isGroup && (
                <p className="text-sm text-on-surface-variant m-0">{chat.participants.length} participants</p>
              )}
            </div>

            {/* Action List */}
            <div className="flex-1 overflow-y-auto py-2">
              <button onClick={() => handleActionClick('pinned')} className="w-full flex items-center gap-4 px-6 py-4 hover:bg-surface-container-low transition-colors text-on-surface">
                <span className="material-symbols-outlined text-primary">push_pin</span>
                <span className="flex-1 text-left font-medium">Pinned Messages</span>
                <span className="material-symbols-outlined text-on-surface-variant text-[18px]">chevron_right</span>
              </button>

              <button onClick={() => handleActionClick('media')} className="w-full flex items-center gap-4 px-6 py-4 hover:bg-surface-container-low transition-colors text-on-surface">
                <span className="material-symbols-outlined text-primary">image</span>
                <span className="flex-1 text-left font-medium">Media</span>
                <span className="material-symbols-outlined text-on-surface-variant text-[18px]">chevron_right</span>
              </button>

              <button onClick={() => handleActionClick('links')} className="w-full flex items-center gap-4 px-6 py-4 hover:bg-surface-container-low transition-colors text-on-surface">
                <span className="material-symbols-outlined text-[#0066FF]">link</span>
                <span className="flex-1 text-left font-medium">Links & Docs</span>
                <span className="material-symbols-outlined text-on-surface-variant text-[18px]">chevron_right</span>
              </button>

              <button onClick={() => handleActionClick('starred')} className="w-full flex items-center gap-4 px-6 py-4 hover:bg-surface-container-low transition-colors text-on-surface">
                <span className="material-symbols-outlined text-[#eab308]">star</span>
                <span className="flex-1 text-left font-medium">Starred Messages</span>
                <span className="material-symbols-outlined text-on-surface-variant text-[18px]">chevron_right</span>
              </button>

              <div className="h-px bg-outline-variant/10 my-2 mx-6"></div>

              <button onClick={() => handleActionClick('theme')} className="w-full flex items-center gap-4 px-6 py-4 hover:bg-surface-container-low transition-colors text-on-surface">
                <span className="material-symbols-outlined text-tertiary">palette</span>
                <span className="flex-1 text-left font-medium">Chat Theme</span>
                <span className="material-symbols-outlined text-on-surface-variant text-[18px]">chevron_right</span>
              </button>

              {!isGroup && (
                <button onClick={() => handleActionClick('profile')} className="w-full flex items-center gap-4 px-6 py-4 hover:bg-surface-container-low transition-colors text-on-surface">
                  <span className="material-symbols-outlined text-[#eab308]">person</span>
                  <span className="flex-1 text-left font-medium">View Profile</span>
                  <span className="material-symbols-outlined text-on-surface-variant text-[18px]">chevron_right</span>
                </button>
              )}

              <div className="h-px bg-outline-variant/10 my-2 mx-6"></div>

              <button onClick={() => handleActionClick('favorite')} className="w-full flex items-center gap-4 px-6 py-4 hover:bg-surface-container-low transition-colors text-on-surface">
                <span className={`material-symbols-outlined ${isFavorite ? 'fill text-primary' : 'text-on-surface-variant'}`}>star</span>
                <span className="flex-1 text-left font-medium">{isFavorite ? 'Remove Chat from Favorites' : 'Add Chat to Favorites'}</span>
              </button>

              <button onClick={() => handleActionClick('clear')} className="w-full flex items-center gap-4 px-6 py-4 hover:bg-error-container/30 transition-colors text-error">
                <span className="material-symbols-outlined">delete_sweep</span>
                <span className="flex-1 text-left font-medium">Clear Chat</span>
              </button>

              {!isGroup && (
                <button onClick={() => handleActionClick('block')} className="w-full flex items-center gap-4 px-6 py-4 hover:bg-error-container/30 transition-colors text-error">
                  <span className="material-symbols-outlined">{isBlocked ? 'block' : 'person_off'}</span>
                  <span className="flex-1 text-left font-medium">{isBlocked ? 'Unblock User' : 'Block User'}</span>
                </button>
              )}
            </div>
          </>
        )}

        {activeView === 'pinned' && (
          <div className="flex flex-col h-full bg-surface">
            {renderHeader('Pinned Messages')}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {messages.filter(m => m.pinnedBy?.includes(user?._id)).length > 0 ? messages.filter(m => m.pinnedBy?.includes(user?._id)).map(msg => (
                <div 
                  key={msg._id} 
                  onClick={() => { onMessageJump(msg._id); onClose(); }}
                  className="p-3 bg-surface-container-low rounded-lg border border-outline-variant/10 hover:bg-surface-container hover:border-primary/50 cursor-pointer transition-all"
                >
                  <span className="text-xs font-bold text-on-surface-variant mb-1 block">{msg.sender.displayName}</span>
                  <p className="text-sm text-on-surface break-words whitespace-pre-wrap">{msg.content || 'Attachment'}</p>
                  <span className="text-[10px] text-on-surface-variant mt-2 block">{new Date(msg.createdAt).toLocaleDateString()} at {new Date(msg.createdAt).toLocaleTimeString()}</span>
                </div>
              )) : (
                <div className="h-full flex flex-col items-center justify-center text-on-surface-variant opacity-70">
                  <span className="material-symbols-outlined text-[48px] mb-4">push_pin</span>
                  <p>No pinned messages.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeView === 'starred' && (
          <div className="flex flex-col h-full bg-surface">
            {renderHeader('Starred Messages')}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {messages.filter(m => m.starredBy?.includes(user?._id)).length > 0 ? messages.filter(m => m.starredBy?.includes(user?._id)).map(msg => (
                <div 
                  key={msg._id} 
                  onClick={() => { onMessageJump(msg._id); onClose(); }}
                  className="p-3 bg-surface-container-low rounded-lg border border-outline-variant/10 hover:bg-surface-container hover:border-[#eab308]/50 cursor-pointer transition-all"
                >
                  <span className="text-xs font-bold text-on-surface-variant mb-1 block">{msg.sender.displayName}</span>
                  <p className="text-sm text-on-surface break-words whitespace-pre-wrap">{msg.content || 'Attachment'}</p>
                  <span className="text-[10px] text-on-surface-variant mt-2 block">{new Date(msg.createdAt).toLocaleDateString()} at {new Date(msg.createdAt).toLocaleTimeString()}</span>
                </div>
              )) : (
                <div className="h-full flex flex-col items-center justify-center text-on-surface-variant opacity-70">
                  <span className="material-symbols-outlined text-[48px] mb-4 text-[#eab308]">star</span>
                  <p>No starred messages.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeView === 'media' && (
          <div className="flex flex-col h-full bg-surface">
            {renderHeader('Media')}
            <div className="flex-1 overflow-y-auto p-4">
              {mediaMessages.length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {mediaMessages.map(msg => (
                    <div 
                      key={msg._id} 
                      className="aspect-square bg-surface-container-low rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => setPreviewMediaUrl(msg.fileUrl)}
                    >
                      <img src={msg.fileUrl} alt="media" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-on-surface-variant opacity-70">
                  <span className="material-symbols-outlined text-[48px] mb-4">perm_media</span>
                  <p>No media shared yet.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeView === 'links' && (
          <div className="flex flex-col h-full bg-surface">
            {renderHeader('Links & Docs')}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {linkMessages.length > 0 ? linkMessages.map(msg => {
                const url = msg.content.split(' ').find(w => w.startsWith('http') || w.startsWith('www.'));
                const validUrl = url && url.startsWith('www.') ? `https://${url}` : url;
                return (
                  <a key={msg._id} href={validUrl} target="_blank" rel="noopener noreferrer" className="block p-3 bg-surface-container-low rounded-lg border border-outline-variant/10 hover:bg-surface-container transition-colors">
                    <p className="text-sm text-[#0066FF] break-all">{url}</p>
                    <span className="text-[10px] text-on-surface-variant mt-1 block">{new Date(msg.createdAt).toLocaleDateString()}</span>
                  </a>
                );
              }) : (
                <div className="h-full flex flex-col items-center justify-center text-on-surface-variant opacity-70">
                  <span className="material-symbols-outlined text-[48px] mb-4">link</span>
                  <p>No links shared yet.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeView === 'theme' && (
          <div className="flex flex-col h-full bg-surface">
            {renderHeader('Chat Theme')}
            <div className="flex-1 p-6">
              <p className="text-sm text-on-surface-variant mb-6 text-center">Customize the colors for this specific chat.</p>
              <div className="grid grid-cols-5 gap-4">
                {['blue', 'purple', 'green', 'orange', 'emerald', 'rose', 'amber', 'cyan', 'indigo', 'crimson'].map(theme => {
                  const themeColors = {
                    blue: '#0066FF', purple: '#9C27B0', green: '#4CAF50', orange: '#FF9800',
                    emerald: '#10B981', rose: '#F43F5E', amber: '#F59E0B', cyan: '#06B6D4',
                    indigo: '#6366F1', crimson: '#DC143C'
                  };
                  return (
                  <button
                    key={theme}
                    onClick={() => onAction('theme', theme)}
                    className={`w-10 h-10 rounded-full mx-auto relative shadow-sm transition-transform hover:scale-110 active:scale-95 ${chat.theme === theme ? 'ring-2 ring-primary ring-offset-2 ring-offset-surface' : ''}`}
                    style={{ backgroundColor: themeColors[theme] }} 
                  >
                    {chat.theme === theme && <span className="material-symbols-outlined text-white absolute inset-0 flex items-center justify-center text-[20px]">check</span>}
                  </button>
                  );
                })}

              </div>
            </div>
          </div>
        )}

        {activeView === 'profile' && !isGroup && (
          <div className="flex flex-col h-full bg-surface">
            {renderHeader('User Profile')}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center">
              <img src={avatar} alt={title} className="w-32 h-32 rounded-full object-cover mb-4 shadow-lg border-4 border-surface" />
              <h3 className="text-2xl font-bold font-display text-on-surface">{title}</h3>
              <p className="text-sm text-primary mb-6">@{fullUser?.username}</p>

              <div className="w-full bg-surface-container-low rounded-xl p-4 border border-outline-variant/10 text-center">
                <span className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">Bio</span>
                <p className="text-sm text-on-surface whitespace-pre-wrap">{fullUser?.bio || "Hey there! I'm using Schat."}</p>
              </div>


            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ChatInfoModal;

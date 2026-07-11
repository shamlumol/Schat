import React from 'react';

const ChatHeader = ({ chat, user, getSender, getSenderFull, onOpenInfo, onBack, onSearch, onCallClick, onVideoCallClick }) => {
  if (!chat) return null;

  const title = chat.isGroupChat ? chat.groupName : getSender(user, chat.participants);
  const fullUser = chat.isGroupChat ? null : getSenderFull(user, chat.participants);
  
  const hideProfilePhoto = fullUser?.privacy?.profilePhoto === 'Nobody';
  const hideLastSeen = fullUser?.privacy?.lastSeen === false;

  const avatar = chat.isGroupChat 
    ? (chat.groupPicture || 'storefront') 
    : (hideProfilePhoto || !fullUser?.profilePicture || fullUser?.profilePicture === 'default.jpg' || fullUser?.profilePicture === 'https://via.placeholder.com/150') ? 'person' : fullUser.profilePicture;

  const isOnline = fullUser?.isOnline && !hideLastSeen;

  const formatLastSeen = (dateString) => {
    if (!dateString) return 'Offline';
    const date = new Date(dateString);
    const now = new Date();
    
    const isToday = date.getDate() === now.getDate() && 
                    date.getMonth() === now.getMonth() && 
                    date.getFullYear() === now.getFullYear();
    
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = date.getDate() === yesterday.getDate() && 
                        date.getMonth() === yesterday.getMonth() && 
                        date.getFullYear() === yesterday.getFullYear();

    const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (isToday) return `today at ${time}`;
    if (isYesterday) return `yesterday at ${time}`;
    return `on ${date.toLocaleDateString()} at ${time}`;
  };
  
  return (
    <header className="h-16 border-b border-outline-variant/10 bg-surface/80 backdrop-blur-md flex items-center justify-between px-md flex-shrink-0 sticky top-0 z-10 cursor-pointer" onClick={onOpenInfo}>
      <div className="flex items-center gap-sm flex-1" onClick={(e) => { e.stopPropagation(); onOpenInfo(); }}>
        <button 
          onClick={(e) => { e.stopPropagation(); onBack(); }}
          className="md:hidden w-10 h-10 -ml-2 rounded-full hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant transition-colors mr-1"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div className="w-10 h-10 rounded-full bg-surface-variant overflow-hidden relative flex items-center justify-center">
          {chat.isGroupChat && avatar === 'storefront' ? (
            <span className="material-symbols-outlined text-on-surface-variant text-[20px]">group</span>
          ) : avatar === 'person' ? (
            <span className="material-symbols-outlined text-on-surface-variant text-[20px]">person</span>
          ) : (
            <img className="w-full h-full object-cover" src={avatar} alt="avatar" />
          )}
        </div>
        <div>
          <h3 className="text-sm font-semibold m-0 leading-none mb-1 text-on-surface">
            {title}
          </h3>
          <div className="flex items-center gap-1">
            {!chat.isGroupChat && !hideLastSeen && (
                <>
                <span className={`w-1.5 h-1.5 rounded-full inline-block ${isOnline ? 'bg-primary' : 'bg-outline-variant'}`}></span>
                <span className="font-mono text-[10px] text-on-surface-variant m-0">
                  {isOnline ? 'Online' : `Last seen ${formatLastSeen(fullUser?.lastSeen)}`}
                </span>
                </>
            )}
            {chat.isGroupChat && (
              <span className="font-mono text-[10px] text-on-surface-variant m-0">
                {chat.participants.length} participants
              </span>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
        <button onClick={onSearch} className="w-10 h-10 rounded-full hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant transition-colors group">
          <span className="material-symbols-outlined group-hover:text-primary transition-colors">search</span>
        </button>
        {!chat.isGroupChat && (
          <>
            <button onClick={onCallClick} className="w-10 h-10 rounded-full hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant transition-colors group" title="Audio Call">
              <span className="material-symbols-outlined group-hover:text-primary transition-colors">call</span>
            </button>
            <button onClick={onVideoCallClick} className="w-10 h-10 rounded-full hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant transition-colors group" title="Video Call">
              <span className="material-symbols-outlined group-hover:text-primary transition-colors">videocam</span>
            </button>
          </>
        )}
        <div className="w-px h-6 bg-outline-variant/20 mx-1"></div>
        <button 
          onClick={onOpenInfo}
          className="w-10 h-10 rounded-full hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant transition-colors"
          title="Chat Info"
        >
          <span className="material-symbols-outlined">more_vert</span>
        </button>
      </div>
    </header>
  );
};

export default ChatHeader;

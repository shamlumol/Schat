import React from 'react';

const HelpModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] animate-fade-in"
        onClick={onClose}
      ></div>
      <div 
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-surface border border-outline-variant/20 rounded-2xl shadow-2xl z-[101] overflow-hidden flex flex-col"
        style={{ width: '90vw', maxWidth: '400px', minWidth: '300px' }}
      >
        <div className="p-4 border-b border-outline-variant/10 flex justify-between items-center bg-surface-container-low">
          <h2 className="text-lg font-bold font-display text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">help</span>
            Help & About
          </h2>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
        
        <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
          <div>
            <h3 className="text-sm font-bold text-on-surface mb-2 uppercase tracking-wider">Getting Started</h3>
            <ul className="space-y-3 text-sm text-on-surface-variant">
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined text-[18px] text-primary mt-0.5">add_circle</span>
                <span>Tap the <strong>+</strong> icon in the header to start a new chat or group.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined text-[18px] text-primary mt-0.5">search</span>
                <span>Use the search bar above your chats to quickly find a conversation.</span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold text-on-surface mb-2 uppercase tracking-wider">Chat Features</h3>
            <ul className="space-y-3 text-sm text-on-surface-variant">
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined text-[18px] text-primary mt-0.5">swipe_left</span>
                <span><strong>Swipe left</strong> on any message bubble to reply to it directly.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined text-[18px] text-primary mt-0.5">touch_app</span>
                <span><strong>Right-click</strong> (or long-press) a message for options like Delete, Edit, Star, and Pin.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined text-[18px] text-primary mt-0.5">image</span>
                <span>Click the recipient's name or profile picture at the top of a chat to see shared media and settings.</span>
              </li>
            </ul>
          </div>

          <div className="bg-surface-container rounded-xl p-4 text-center mt-4 border border-outline-variant/10">
            <div className="font-display font-bold text-lg text-primary mb-1">Schat</div>
            <div className="text-xs text-on-surface-variant mb-2">Version 2.0.0</div>
            <p className="text-xs text-on-surface-variant">
              Designed for privacy, speed, and real-time communication.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default HelpModal;

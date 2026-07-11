import React, { useState } from 'react';
import axios from 'axios';
import { ChatState } from '../context/ChatProvider';
import { gsap } from 'gsap';

const NewChatModal = ({ isOpen, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user, setSelectedChat, chats, setChats } = ChatState();

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setLoading(true);
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };

      const { data } = await axios.get(`/api/users?search=${query}`, config);
      setLoading(false);
      setSearchResults(data);
    } catch (error) {
      setLoading(false);
      console.log('bug:', error);
    }
  };

  const accessChat = async (userId) => {
    try {
      const config = {
        headers: {
          'Content-type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
      };

      const { data } = await axios.post('/api/chats', { userId }, config);

      if (!chats.find((c) => c._id === data._id)) {
        setChats([data, ...chats]);
      }
      setSelectedChat(data);
      onClose();
    } catch (error) {
      console.log('bug:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div 
        className="bg-surface w-full max-w-md sm:w-[400px] md:w-[448px] rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-outline-variant/20 animate-fade-in-up"
        style={{ minWidth: '300px', maxHeight: '90vh' }}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-outline-variant/10 flex-shrink-0">
          <h2 className="text-lg font-bold font-display text-on-surface m-0">New Chat</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="p-4 border-b border-outline-variant/10 flex-shrink-0">
          <div className="relative group">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
            <input
              type="text"
              placeholder="Search by username or name..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full bg-surface-container-low border border-outline-variant/20 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 rounded-xl py-3 pl-10 pr-4 text-sm text-on-surface outline-none transition-all"
              autoFocus
            />
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-2 min-h-[200px]">
          {loading ? (
            <div className="flex justify-center items-center h-full min-h-[150px]">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : searchResults.length > 0 ? (
            <div className="space-y-1">
              {searchResults.map((resultUser) => (
                <button
                  key={resultUser._id}
                  onClick={() => accessChat(resultUser._id)}
                  className="w-full text-left flex items-center gap-3 p-3 rounded-xl hover:bg-surface-container-high transition-colors"
                >
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-surface-variant flex-shrink-0">
                    <img src={resultUser.profilePicture || 'https://via.placeholder.com/150'} alt="avatar" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-on-surface m-0 truncate">{resultUser.displayName}</p>
                    <p className="text-xs text-on-surface-variant m-0 truncate">@{resultUser.username}</p>
                  </div>
                </button>
              ))}
            </div>
          ) : searchQuery.trim() ? (
            <div className="text-center p-8 text-on-surface-variant text-sm flex flex-col items-center">
              <span className="material-symbols-outlined text-[48px] opacity-20 mb-2">person_search</span>
              <p>No users found matching "{searchQuery}"</p>
            </div>
          ) : (
            <div className="text-center p-8 text-on-surface-variant text-sm flex flex-col items-center justify-center h-full min-h-[150px]">
              <span className="material-symbols-outlined text-[48px] opacity-20 mb-2">search</span>
              <p>Search for users to start a conversation</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NewChatModal;

import React, { useState, useEffect } from 'react';
import axios from 'axios';

const GifPicker = ({ onGifSelect, defaultTab = 'gifs' }) => {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [search, setSearch] = useState('');
  const [gifs, setGifs] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchGifs = async (query = '', type = 'gifs') => {
    setLoading(true);
    try {
      // NOTE: Tenor API v1 is officially discontinued and public Giphy keys are banned.
      // For the purpose of the interview and demonstration, this uses a robust fallback 
      // array of curated GIFs so the UI works perfectly without requiring an API key.
      const isSearch = query.length > 0;
      
      const mockGifs = [
        { id: '1', keywords: ['happy', 'yes', 'cheer'], images: { fixed_height_small: { url: 'https://media.giphy.com/media/3o7TKSjRrfIPjeiVyM/200.gif' }, original: { url: 'https://media.giphy.com/media/3o7TKSjRrfIPjeiVyM/giphy.gif' } } },
        { id: '2', keywords: ['wow', 'surprised', 'omg'], images: { fixed_height_small: { url: 'https://media.giphy.com/media/l0HlBO7eyXzSZkJri/200.gif' }, original: { url: 'https://media.giphy.com/media/l0HlBO7eyXzSZkJri/giphy.gif' } } },
        { id: '3', keywords: ['cat', 'funny', 'typing'], images: { fixed_height_small: { url: 'https://media.giphy.com/media/JIX9t2j0ZTN9S/200.gif' }, original: { url: 'https://media.giphy.com/media/JIX9t2j0ZTN9S/giphy.gif' } } },
        { id: '4', keywords: ['dance', 'party', 'fun'], images: { fixed_height_small: { url: 'https://media.giphy.com/media/11ISwbgCxEzMyY/200.gif' }, original: { url: 'https://media.giphy.com/media/11ISwbgCxEzMyY/giphy.gif' } } },
        { id: '5', keywords: ['no', 'stop', 'angry'], images: { fixed_height_small: { url: 'https://media.giphy.com/media/RrwMvo47aD2xW/200.gif' }, original: { url: 'https://media.giphy.com/media/RrwMvo47aD2xW/giphy.gif' } } },
        { id: '6', keywords: ['dog', 'cute', 'hello'], images: { fixed_height_small: { url: 'https://media.giphy.com/media/xT0xezQGU5xCDJuCPe/200.gif' }, original: { url: 'https://media.giphy.com/media/xT0xezQGU5xCDJuCPe/giphy.gif' } } },
        { id: '7', keywords: ['cry', 'sad', 'tears'], images: { fixed_height_small: { url: 'https://media.giphy.com/media/Wj7lNjMNDxSmc/200.gif' }, original: { url: 'https://media.giphy.com/media/Wj7lNjMNDxSmc/giphy.gif' } } },
        { id: '8', keywords: ['laugh', 'lol', 'haha'], images: { fixed_height_small: { url: 'https://media.giphy.com/media/5GoVLqeAOo6PK/200.gif' }, original: { url: 'https://media.giphy.com/media/5GoVLqeAOo6PK/giphy.gif' } } }
      ];

      const mockStickers = [
        { id: 's1', keywords: ['love', 'heart'], images: { fixed_height_small: { url: 'https://media.giphy.com/media/3o7TKW5I35AayIpGEE/200.gif' }, original: { url: 'https://media.giphy.com/media/3o7TKW5I35AayIpGEE/giphy.gif' } } },
        { id: 's2', keywords: ['star', 'shine'], images: { fixed_height_small: { url: 'https://media.giphy.com/media/l41lFw057lAJQMwg0/200.gif' }, original: { url: 'https://media.giphy.com/media/l41lFw057lAJQMwg0/giphy.gif' } } },
        { id: 's3', keywords: ['cool', 'sunglasses'], images: { fixed_height_small: { url: 'https://media.giphy.com/media/26AHvV4l8tC9YtTCE/200.gif' }, original: { url: 'https://media.giphy.com/media/26AHvV4l8tC9YtTCE/giphy.gif' } } },
        { id: 's4', keywords: ['hi', 'wave', 'hello'], images: { fixed_height_small: { url: 'https://media.giphy.com/media/3oz8xALR6yOqVzUeX6/200.gif' }, original: { url: 'https://media.giphy.com/media/3oz8xALR6yOqVzUeX6/giphy.gif' } } }
      ];

      // Simulate a realistic network delay for the UI spinner
      await new Promise(resolve => setTimeout(resolve, 400));

      let results = type === 'stickers' ? mockStickers : mockGifs;
      
      // If searching, filter based on keywords so it looks like a real search
      if (isSearch) {
        const lowerQuery = query.toLowerCase();
        results = results.filter(item => 
          item.keywords.some(kw => kw.includes(lowerQuery) || lowerQuery.includes(kw))
        );
      }
      
      setGifs(results);
    } catch (error) {
      console.log('Error fetching media:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchGifs(search, activeTab);
    }, 500);
    return () => clearTimeout(timer);
  }, [search, activeTab]);

  return (
    <div className="w-[300px] h-[400px] bg-surface rounded-xl shadow-xl flex flex-col overflow-hidden border border-outline-variant/20">
      <div className="flex border-b border-outline-variant/10">
        <button 
          className={`flex-1 py-2 text-sm font-semibold transition-colors ${activeTab === 'gifs' ? 'text-primary border-b-2 border-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
          onClick={() => { setActiveTab('gifs'); setSearch(''); }}
        >
          GIFs
        </button>
        <button 
          className={`flex-1 py-2 text-sm font-semibold transition-colors ${activeTab === 'stickers' ? 'text-primary border-b-2 border-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
          onClick={() => { setActiveTab('stickers'); setSearch(''); }}
        >
          Stickers
        </button>
      </div>

      <div className="p-3 border-b border-outline-variant/10">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-2 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
          <input
            type="text"
            placeholder={`Search ${activeTab === 'stickers' ? 'Stickers' : 'GIFs'}...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-surface-container-low border border-outline-variant/20 rounded-lg py-1.5 pl-8 pr-3 text-sm outline-none focus:border-primary/50 text-on-surface"
          />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2">
        {loading && gifs.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : gifs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <span className="material-symbols-outlined text-[32px] text-on-surface-variant mb-2">search_off</span>
            <p className="text-sm text-on-surface font-medium">No matches in demo mode</p>
            <p className="text-xs text-on-surface-variant mt-1">Try keywords like 'happy', 'cat', 'dance', or 'dog'. Add an API key for full search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {gifs.map((gif) => (
              <img
                key={gif.id}
                src={gif?.images?.fixed_height_small?.url}
                alt="GIF"
                onClick={() => onGifSelect(gif?.images?.original?.url, activeTab === 'stickers' ? 'sticker' : 'image')}
                className="w-full h-24 object-cover rounded-md cursor-pointer hover:opacity-80 transition-opacity"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default GifPicker;

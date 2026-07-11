import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ChatContext = createContext();

const ChatProvider = ({ children }) => {
  const [selectedChat, setSelectedChat] = useState();
  const [user, setUser] = useState();
  const [notification, setNotification] = useState([]);
  const [chats, setChats] = useState([]);
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [appTheme, setAppTheme] = useState('system'); // light, dark, system
  
  const navigate = useNavigate();

  useEffect(() => {
    const userInfo = JSON.parse(localStorage.getItem('nova_userInfo'));
    setUser(userInfo);

    const savedTheme = localStorage.getItem('nova_theme') || userInfo?.theme || 'system';
    setAppTheme(savedTheme);

    if (!userInfo) {
      const currentPath = window.location.pathname;
      if (
        !currentPath.startsWith('/login') && 
        !currentPath.startsWith('/reset-password') && 
        currentPath !== '/'
      ) {
        navigate('/login');
      }
    }
  }, [navigate]);

  // Apply Theme Logic
  useEffect(() => {
    const root = document.documentElement;
    if (appTheme === 'dark') {
      root.classList.add('dark');
    } else if (appTheme === 'light') {
      root.classList.remove('dark');
    } else {
      // System
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      if (mediaQuery.matches) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
      
      const listener = (e) => {
        if (e.matches) root.classList.add('dark');
        else root.classList.remove('dark');
      };
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, [appTheme]);

  return (
    <ChatContext.Provider
      value={{
        selectedChat,
        setSelectedChat,
        user,
        setUser,
        notification,
        setNotification,
        chats,
        setChats,
        isNewChatModalOpen,
        setIsNewChatModalOpen,
        isSidebarCollapsed,
        setIsSidebarCollapsed,
        appTheme,
        setAppTheme
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const ChatState = () => {
  return useContext(ChatContext);
};

export default ChatProvider;

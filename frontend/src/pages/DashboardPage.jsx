import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { gsap } from 'gsap'
import axios from 'axios'
import io from 'socket.io-client'
import { ChatState } from '../context/ChatProvider'
import NewChatModal from '../components/NewChatModal'
import ChatHeader from '../components/ChatHeader'
import ChatInfoModal from '../components/ChatInfoModal'
import CallModal from '../components/CallModal';
import { useWebRTC } from '../hooks/useWebRTC';
import ForwardMessageModal from '../components/ForwardMessageModal'
import GenericModal from '../components/GenericModal'
import EmojiPicker from 'emoji-picker-react'
import GifPicker from '../components/GifPicker'
import AudioPlayer from '../components/AudioPlayer'


const ENDPOINT = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001"
var socket, selectedChatCompare

const renderMessageWith3DEmojis = (text, query = '', messageId = null, searchResults = [], searchIndex = 0) => {
  if (!text) return null;
  // Regex to match emojis (ES2018 standard)
  const regex = /(\p{Emoji_Presentation}|\p{Extended_Pictographic})/gu;
  const parts = text.split(regex);
  
  return parts.map((part, i) => {
    if (!part) return null;
    if (part.match(regex)) {
      let unified = Array.from(part).map(c => c.codePointAt(0).toString(16)).join('_');
      // Fix heart emoji variants
      if (unified === '2764-fe0f' || unified === '2764') unified = '2764_fe0f';
      
      return (
        <span key={i} className="inline-flex items-center">
          <picture>
            <source srcSet={`https://fonts.gstatic.com/s/e/notoemoji/latest/${unified}/512.webp`} type="image/webp" />
            <img 
              src={`https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/${unified.replace(/_/g, '-')}.png`} 
              alt={part} 
              className="w-[2.5em] h-[2.5em] mx-[2px] align-middle object-contain inline-block drop-shadow-md hover:scale-110 transition-transform"
              onError={(e) => {
                e.target.parentElement.style.display = 'none';
                if (e.target.parentElement.nextSibling) e.target.parentElement.nextSibling.style.display = 'inline';
              }}
            />
          </picture>
          <span style={{ display: 'none' }}>{part}</span>
        </span>
      );
    }
    
    // Highlight logic for non-emoji text parts
    if (query.trim()) {
      const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const qRegex = new RegExp(`(${escapedQuery})`, 'gi');
      const textParts = part.split(qRegex);
      
      const messageMatches = searchResults.filter(r => r.messageId === messageId);
      let localMatchCounter = 0;

      return (
        <span key={i}>
          {textParts.map((tPart, j) => {
            if (tPart.toLowerCase() === query.toLowerCase()) {
              const matchObj = messageMatches[localMatchCounter];
              localMatchCounter++;
              const isActive = matchObj && matchObj.globalIndex === searchIndex;
              return (
                <mark 
                  key={j} 
                  id={matchObj ? `search-match-${matchObj.globalIndex}` : undefined}
                  className={isActive ? "bg-primary text-on-primary rounded px-0.5 font-bold shadow-[0_0_8px_rgba(0,102,255,0.6)]" : "bg-primary/30 text-primary rounded px-0.5 font-bold"}
                >
                  {tPart}
                </mark>
              );
            }
            return <span key={j}>{tPart}</span>;
          })}
        </span>
      );
    }
    
    return <span key={i}>{part}</span>;
  });
};

function DashboardPage({ viewMode = 'all' }) {
  const navigate = useNavigate()
  const { user, setUser, selectedChat, setSelectedChat, chats, setChats, notification, setNotification, isNewChatModalOpen, setIsNewChatModalOpen } = ChatState() || {}

  const getWallpaperClass = (wpId) => {
    if (wpId?.startsWith('http') || wpId?.startsWith('data:')) return 'bg-cover bg-center bg-no-repeat'
    switch (wpId) {
      case 'gradient-sunset': return 'bg-gradient-to-br from-rose-400/20 via-fuchsia-500/20 to-indigo-500/20 dark:from-rose-900/30 dark:via-fuchsia-900/30 dark:to-indigo-900/30'
      case 'gradient-ocean': return 'bg-gradient-to-br from-cyan-500/20 via-blue-500/20 to-indigo-600/20 dark:from-cyan-900/30 dark:via-blue-900/30 dark:to-indigo-950/30'
      case 'gradient-aurora': return 'bg-gradient-to-br from-emerald-400/20 via-teal-500/20 to-sky-500/20 dark:from-emerald-900/30 dark:via-teal-900/30 dark:to-sky-900/30'
      case 'gradient-midnight': return 'bg-gradient-to-br from-indigo-900/40 via-purple-900/40 to-slate-900/40 dark:from-indigo-950/50 dark:via-purple-950/50 dark:to-slate-950/50'
      case 'mesh-candy': return 'bg-gradient-to-tr from-pink-300/20 via-purple-300/20 to-indigo-400/20 dark:from-pink-900/30 dark:via-purple-900/30 dark:to-indigo-950/30'
      case 'mesh-ember': return 'bg-gradient-to-br from-orange-500/20 via-red-500/20 to-rose-600/20 dark:from-orange-900/30 dark:via-red-900/30 dark:to-rose-950/30'
      case 'mesh-obsidian': return 'bg-gradient-to-br from-zinc-800/80 via-neutral-900/90 to-black/90 dark:from-zinc-950/90 dark:via-black dark:to-black'
      
      /* New Stylish Themes with Dark/Light mode support */
      case 'gradient-cyberpunk': return 'bg-gradient-to-br from-yellow-300/30 via-pink-500/30 to-purple-600/30 dark:from-yellow-600/20 dark:via-pink-700/20 dark:to-purple-900/20'
      case 'gradient-emerald': return 'bg-gradient-to-br from-green-300/30 via-emerald-500/20 to-teal-700/20 dark:from-green-900/30 dark:via-emerald-950/30 dark:to-teal-950/30'
      case 'gradient-lavender': return 'bg-gradient-to-tr from-indigo-300/30 via-purple-400/20 to-pink-300/20 dark:from-indigo-900/30 dark:via-purple-950/30 dark:to-pink-900/30'
      case 'mesh-crimson': return 'bg-gradient-to-bl from-rose-500/30 via-red-700/20 to-stone-900/20 dark:from-rose-900/40 dark:via-red-950/40 dark:to-black/40'
      
      /* Unique Style Themes */
      case 'style-glass': return 'bg-style-glass'
      case 'style-nebula': return 'bg-style-nebula'
      case 'style-isometric': return 'bg-style-isometric'
      
      default: return 'bg-surface-dim'
    }
  }

  const wallpaperClass = getWallpaperClass(user?.wallpaper || 'default')
  
  const [messages, setMessages] = useState([])
  const [inputText, setInputText] = useState('')
  const [editingMessage, setEditingMessage] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isChatOpenMobile, setIsChatOpenMobile] = useState(false)
  const [socketConnected, setSocketConnected] = useState(false)
  const [typing, setTyping] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [replyingTo, setReplyingTo] = useState(null)
  const [reactionHoverId, setReactionHoverId] = useState(null)
  const [selectedFile, setSelectedFile] = useState(null)
  const [filePreview, setFilePreview] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordedAudioFile, setRecordedAudioFile] = useState(null);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingIntervalRef = useRef(null);

  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    mode: 'alert',
    title: '',
    message: '',
    defaultValue: '',
    onConfirm: () => {},
  });

  const showAlert = (message, title = 'Alert', type = 'default') => {
    setModalConfig({
      isOpen: true,
      mode: 'alert',
      type,
      title,
      message,
      defaultValue: '',
      onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false })),
    });
  };

  const showPrompt = (message, title, defaultValue, onConfirm) => {
    setModalConfig({
      isOpen: true,
      mode: 'prompt',
      type: 'default',
      title,
      message,
      defaultValue,
      onConfirm: (val) => {
        onConfirm(val);
        setModalConfig(prev => ({ ...prev, isOpen: false }));
      },
    });
  };


  const [isChatInfoOpen, setIsChatInfoOpen] = useState(false);
  const [chatInfoTab, setChatInfoTab] = useState('media');
  const [chatTheme, setChatTheme] = useState('blue');
  
  const [isChatSearchOpen, setIsChatSearchOpen] = useState(false);
  const [chatSearchQuery, setChatSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchIndex, setSearchIndex] = useState(0);

  const handleCallEnded = async (logMessage) => {
    if (!logMessage || !selectedChat) return;
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      
      const formData = new FormData();
      formData.append('content', logMessage);
      formData.append('chatId', selectedChat._id);
      formData.append('messageType', 'call_log');
      
      const { data } = await axios.post('/api/messages', formData, config);
      socket.emit('new_message', data);
      
      setMessages(prev => [...prev, data]);
      setChats(prev => prev.map(c => c._id === selectedChat._id ? { ...c, lastMessage: data } : c));
    } catch (error) {
      console.log('err log call: ->', error);
    }
  };

  const {
    localStream,
    remoteStream,
    isReceivingCall,
    callerName,
    callerAvatar,
    callAccepted,
    callEnded,
    isVideoCall,
    isMuted,
    isVideoOff,
    isRemoteVideoOff,
    activeCall,
    callUser,
    answerCall,
    endCall,
    declineCall,
    toggleMute,
    toggleVideo
  } = useWebRTC(socket, user, handleCallEnded);

  const [isNavMenuOpen, setIsNavMenuOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [previewMediaUrl, setPreviewMediaUrl] = useState(null);
  const [isViewOnce, setIsViewOnce] = useState(false);
  const navMenuRef = useRef(null);

  // Close nav menu on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (navMenuRef.current && !navMenuRef.current.contains(event.target)) {
        setIsNavMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const executeChatSearch = (query) => {
    setChatSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      setSearchIndex(0);
      return;
    }
    
    // Local search for instant feedback and accurate counts
    const results = [];
    messages.forEach(m => {
      if (m.content) {
        const matches = m.content.toLowerCase().match(new RegExp(query.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'));
        if (matches) {
          for (let i = 0; i < matches.length; i++) {
            results.push(m._id);
          }
        }
      }
    });
    
    setSearchResults(results);
    setSearchIndex(0);
    if (results.length > 0) {
      setTimeout(() => {
        document.getElementById(`message-${results[0]}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  };

  const jumpToMatch = (direction) => {
    if (searchResults.length === 0) return;
    let newIndex = searchIndex + direction;
    if (newIndex < 0) newIndex = searchResults.length - 1;
    if (newIndex >= searchResults.length) newIndex = 0;
    setSearchIndex(newIndex);
    
    // Scroll to the specific occurrence highlight
    const targetElement = document.getElementById(`search-match-${newIndex}`);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      // Fallback
      document.getElementById(`message-${searchResults[newIndex]?.messageId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const [chatContextMenu, setChatContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    chat: null
  });

  const [msgActionMenu, setMsgActionMenu] = useState({ visible: false, message: null, x: 0, y: 0 });
  const [swipeState, setSwipeState] = useState({ id: null, startX: 0, currentX: 0 });
  const [chatInfoModalOpen, setChatInfoModalOpen] = useState(false);
  const [forwardingMessage, setForwardingMessage] = useState(null);
  const [sidebarWidth, setSidebarWidth] = useState(320);
  const [mediaPickerMode, setMediaPickerMode] = useState(null); // 'emoji', 'gif', 'sticker', null
  const composerRef = useRef(null);

  // Close media picker on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (composerRef.current && !composerRef.current.contains(event.target)) {
        if (mediaPickerMode !== null) {
          setMediaPickerMode(null);
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [mediaPickerMode]);

  // Close reaction menu on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (reactionHoverId && !e.target.closest('.reaction-menu-container')) {
        setReactionHoverId(null);
      }
    };
    document.addEventListener("pointerdown", handleClickOutside);
    return () => document.removeEventListener("pointerdown", handleClickOutside);
  }, [reactionHoverId]);

  const handleMessageAction = async (action, message, newContent = null) => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      let url = `/api/messages/${message._id}/${action}`;
      if (action === 'delete-everyone' || action === 'delete' || action === 'pin' || action === 'star') {
        const { data } = await axios.put(url, {}, config);
        if (action === 'delete') {
          setMessages(prev => prev.filter(m => m._id !== message._id));
        } else {
          setMessages(prev => prev.map(m => m._id === message._id ? data : m));
        }
      } else if (action === 'edit') {
        const { data } = await axios.put(url, { content: newContent }, config);
        setMessages(prev => prev.map(m => m._id === message._id ? data : m));
      } else if (action === 'copy') {
        navigator.clipboard.writeText(message.content);
      }
      setMsgActionMenu({ visible: false, message: null, x: 0, y: 0 });
    } catch (error) {
      console.log('bug:', error);
      showAlert(error.response?.data?.message || 'Action failed', 'Action Failed', 'danger');
    }
  };

  const handleTouchStartMsg = (e, id) => {
    setSwipeState({ id, startX: e.touches[0].clientX, currentX: e.touches[0].clientX });
  };
  const handleTouchMoveMsg = (e, id) => {
    if (swipeState.id === id) {
      setSwipeState(prev => ({ ...prev, currentX: e.touches[0].clientX }));
    }
  };
  const handleTouchEndMsg = (e, message) => {
    if (swipeState.id === message._id) {
      const diff = swipeState.startX - swipeState.currentX;
      if (diff > 50) { // Swiped left by 50px
        setReplyingTo(message);
      }
    }
    setSwipeState({ id: null, startX: 0, currentX: 0 });
  };

  const handleReaction = async (messageId, emoji) => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axios.post(`/api/messages/${messageId}/react`, { emoji }, config);
      
      // Update local messages
      setMessages(prev => prev.map(m => m._id === messageId ? data : m));
      
      // Emit socket event to notify others
      socket.emit("message_reaction", data);
      setReactionHoverId(null);
    } catch (error) {
      console.log("Error reacting to message:", error);
    }
  };

  const threadEndRef = useRef(null)
  const containerRef = useRef(null)
  const fileInputRef = useRef(null)

  const getSender = (loggedUser, users) => {
    if (!users || users.length === 0) return "Unknown User";
    if (users.length === 1) return users[0]?.displayName || "Unknown User";
    return users[0]?._id === loggedUser?._id ? (users[1]?.displayName || "Unknown User") : (users[0]?.displayName || "Unknown User");
  }
  
  const getSenderFull = (loggedUser, users) => {
    if (!users || users.length === 0) return null;
    if (users.length === 1) return users[0];
    return users[0]?._id === loggedUser?._id ? users[1] : users[0];
  }

  const fetchChats = async () => {
    if (!user) return
    try {
      const config = {
        headers: { Authorization: `Bearer ${user.token}` },
      }
      const { data } = await axios.get('/api/chats', config)
      setChats(data)
    } catch (error) {
      console.log('bug:', error)
    }
  }

  const fetchMessages = async () => {
    if (!selectedChat) return
    try {
      const config = {
        headers: { Authorization: `Bearer ${user.token}` },
      }
      const { data } = await axios.get(`/api/messages/${selectedChat._id}`, config)
      setMessages(data)
      socket.emit('join_chat', selectedChat._id)
    } catch (error) {
      console.log('bug:', error)
    }
  }

  // Socket IO Connection
  useEffect(() => {
    if (user) {
      socket = io(ENDPOINT)
      socket.emit("setup", user)
      socket.on("connected", () => setSocketConnected(true))
      socket.on("typing", () => setIsTyping(true))
      socket.on("stop_typing", () => setIsTyping(false))
    }
    return () => {
      if (socket) socket.disconnect()
    }
  }, [user])

  // Fetch initial chats
  useEffect(() => {
    fetchChats()
    // Initial entrance animations
    const ctx = gsap.context(() => {
      gsap.from('.chat-sidebar-item', {
        x: -30, opacity: 0, duration: 0.6, stagger: 0.1, ease: 'power3.out',
      })
      gsap.from('.chat-main-window', {
        opacity: 0, duration: 0.8, ease: 'power2.out',
      })
    }, containerRef)

    return () => ctx.revert()
  }, [user])

  // Fetch messages when a chat is selected
  useEffect(() => {
    fetchMessages()
    selectedChatCompare = selectedChat
  }, [selectedChat])

  // Join socket room
  useEffect(() => {
    if (socketConnected && selectedChat) {
      socket.emit("join chat", selectedChat._id)
    }
  }, [selectedChat, socketConnected])

  // Clear selected chat when switching views (e.g., from archive to all)
  useEffect(() => {
    setSelectedChat(null);
  }, [viewMode]);

  useEffect(() => {
    if (!socket) return
    
    const messageReceivedHandler = (newMessageReceived) => {
      if (!selectedChatCompare || selectedChatCompare._id !== newMessageReceived.chat._id) {
        if (!notification.includes(newMessageReceived)) {
          setNotification([newMessageReceived, ...notification])
          fetchChats() // update latest message
          // Emit message delivered since it reached the client but isn't read yet
          if (newMessageReceived.sender._id !== user._id) {
            socket.emit('message_delivered', { messageId: newMessageReceived._id, userId: user._id });
          }
        }
      } else {
        setMessages((prev) => [...prev, newMessageReceived])
        fetchChats() // update latest message and bring to top even if chat is open
        // Emit message read since the chat is open
        if (newMessageReceived.sender._id !== user._id && user?.privacy?.readReceipts !== false) {
          socket.emit('message_read', { messageId: newMessageReceived._id, userId: user._id });
        }
      }
    };

    const messageStatusHandler = (updatedMsg) => {
      setMessages((prev) => prev.map(m => m._id === updatedMsg._id ? updatedMsg : m));
      // Also update latest message in chat list if needed
      setChats((prev) => prev.map(c => {
        if (c.lastMessage?._id === updatedMsg._id) {
           return { ...c, lastMessage: updatedMsg };
        }
        return c;
      }));
    };

    const userStatusHandler = ({ userId, isOnline, lastSeen }) => {
      setChats(prev => prev.map(chat => ({
        ...chat,
        participants: chat.participants.map(p => 
          p._id === userId ? { ...p, isOnline, lastSeen } : p
        )
      })));
      if (selectedChatCompare && selectedChatCompare.participants.some(p => p._id === userId)) {
        setSelectedChat(prev => ({
          ...prev,
          participants: prev.participants.map(p => 
            p._id === userId ? { ...p, isOnline, lastSeen } : p
          )
        }));
      }
    };

    const userProfileUpdateHandler = (updatedUser) => {
      // Update chats list
      setChats(prev => prev.map(chat => ({
        ...chat,
        participants: chat.participants.map(p => 
          p._id === updatedUser._id ? { ...p, ...updatedUser } : p
        )
      })));
      
      // Update selected chat if open
      if (selectedChatCompare && selectedChatCompare.participants.some(p => p._id === updatedUser._id)) {
        setSelectedChat(prev => ({
          ...prev,
          participants: prev.participants.map(p => 
            p._id === updatedUser._id ? { ...p, ...updatedUser } : p
          )
        }));
      }

      // Update messages from this user
      setMessages(prev => prev.map(msg => {
        if (msg.sender._id === updatedUser._id) {
          return { ...msg, sender: { ...msg.sender, ...updatedUser } };
        }
        return msg;
      }));
    };

    const chatUpdatedHandler = (updatedChat) => {
      setChats(prev => prev.map(c => c._id === updatedChat._id ? updatedChat : c));
      if (selectedChatCompare?._id === updatedChat._id) {
        setSelectedChat(updatedChat);
      }
    };

    const chatDeletedHandler = (deletedChatId) => {
      setChats(prev => prev.filter(c => c._id !== deletedChatId));
      if (selectedChatCompare?._id === deletedChatId) {
        setSelectedChat(null);
      }
    };

    const messageUpdatedHandler = (updatedMsg) => {
      setMessages((prev) => prev.map(m => m._id === updatedMsg._id ? updatedMsg : m));
    };

    socket.on("message_received", messageReceivedHandler)
    socket.on("message_status_update", messageStatusHandler)
    socket.on("user_status_change", userStatusHandler)
    socket.on("user_profile_updated", userProfileUpdateHandler)
    socket.on("chat_updated", chatUpdatedHandler)
    socket.on("chat_deleted", chatDeletedHandler)
    socket.on("message_updated", messageUpdatedHandler)
    
    return () => {
      socket.off("message_received", messageReceivedHandler)
      socket.off("message_status_update", messageStatusHandler)
      socket.off("user_status_change", userStatusHandler)
      socket.off("user_profile_updated", userProfileUpdateHandler)
      socket.off("chat_updated", chatUpdatedHandler)
      socket.off("chat_deleted", chatDeletedHandler)
      socket.off("message_updated", messageUpdatedHandler)
    }
  }, [selectedChatCompare, notification, user])

  // Mark all unread messages as read when opening a chat
  useEffect(() => {
    if (selectedChat && messages.length > 0) {
      messages.forEach(msg => {
        if (msg.sender._id !== user._id && (!msg.readBy || !msg.readBy.includes(user._id))) {
          if (user?.privacy?.readReceipts !== false) {
            socket.emit('message_read', { messageId: msg._id, userId: user._id });
          }
        }
      });
    }
  }, [selectedChat, messages, user])

  // Auto-scroll on new message
  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const executeForwardMessage = async (targetChatId) => {
    if (!forwardingMessage) return;
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      
      let payload = {
        chatId: targetChatId,
        content: forwardingMessage.content,
        isForwarded: true,
      };

      // Also forward fileUrl and messageType if they exist
      if (forwardingMessage.fileUrl) {
        payload.fileUrl = forwardingMessage.fileUrl;
        payload.messageType = forwardingMessage.messageType || 'text';
        payload.fileName = forwardingMessage.fileName;
        payload.isViewOnce = forwardingMessage.isViewOnce;
      }

      const { data } = await axios.post('/api/messages', payload, config);
      socket.emit('new_message', data);
      
      // If we are currently viewing the target chat, append it to messages
      if (selectedChat && selectedChat._id === targetChatId) {
        setMessages([...messages, data]);
      }
      
      fetchChats(); // Update chat list latest message
      setForwardingMessage(null);
    } catch (error) {
      console.log('err forward message: ->', error);
    }
  };

  const handleSendGif = async (gifUrl, mediaType = 'image') => {
    setMediaPickerMode(null);
    try {
      setUploading(true);
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      
      const payload = {
        chatId: selectedChat._id,
        content: '', // Empty content, we rely on fileUrl
        fileUrl: gifUrl,
        messageType: mediaType // 'image' or 'sticker'
      };

      const { data } = await axios.post('/api/messages', payload, config);
      socket.emit('new_message', data);
      setMessages([...messages, data]);
      fetchChats();
      setChats(prev => prev.map(c => c._id === selectedChat._id ? { ...c, lastMessage: data } : c));
    } catch (error) {
      console.log('err send gif: ->', error);
    } finally {
      setUploading(false);
    }
  };

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault()
    if (!inputText.trim() && !selectedFile) return
    if (!selectedChat) return

    socket.emit("stop_typing", selectedChat._id)
    
    if (editingMessage) {
      handleMessageAction('edit', editingMessage, inputText);
      setEditingMessage(null);
      setInputText('');
      return;
    }

    const currentInput = inputText
    setInputText('')

    try {
      setUploading(true)
      let config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      }
      
      let postData;
      if (selectedFile) {
        // Axios auto-sets Content-Type to multipart/form-data with boundary when passing FormData
        postData = new FormData();
        postData.append('content', currentInput);
        postData.append('chatId', selectedChat._id);
        postData.append('file', selectedFile);
        postData.append('isViewOnce', isViewOnce);
        if (replyingTo) postData.append('replyTo', replyingTo._id);
      } else {
        config.headers['Content-Type'] = 'application/json';
        postData = {
          content: currentInput,
          chatId: selectedChat._id,
        };
        if (replyingTo) postData.replyTo = replyingTo._id;
      }

      const { data } = await axios.post('/api/messages', postData, config)

      socket.emit("new_message", data)
      setMessages(prev => [...prev, data])
      fetchChats() // Update chat list to bring this chat to the top
      setSelectedFile(null)
      setFilePreview(null)
      setIsViewOnce(false)
      setReplyingTo(null)
      setUploading(false)
      setShowEmojiPicker(false)
    } catch (error) {
      console.log('bug:', error)
      setUploading(false)
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file && !file.type.startsWith('image/')) {
      showAlert('Only images are allowed!', 'Invalid File', 'danger');
      return
    }
    setSelectedFile(file)
    setFilePreview(URL.createObjectURL(file))
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      
      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      
      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= 59) {
            stopRecording(false);
            return 60;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      showAlert("Microphone access is required for voice messages.", 'Microphone Error', 'danger');
    }
  };

  const stopRecording = (discard = false) => {
    if (mediaRecorderRef.current && isRecording) {
      setIsRecording(false);
      clearInterval(recordingIntervalRef.current);
      mediaRecorderRef.current.stop();
      
      mediaRecorderRef.current.onstop = async () => {
        // Stop tracks after recorder finishes
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());

        if (discard) {
          audioChunksRef.current = [];
          return;
        }

        // Prevent sending empty audio if less than 1 second
        if (audioChunksRef.current.length === 0) return;

        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        if (audioBlob.size < 1000) return; // Ignore very small recordings (e.g. 0 duration)

        const audioFile = new File([audioBlob], `voice-${Date.now()}.webm`, { type: 'audio/webm' });
        
        setRecordedAudioFile(audioFile);
        setAudioPreviewUrl(URL.createObjectURL(audioFile));
      };
    }
  };

  const sendRecordedAudio = async () => {
    if (!recordedAudioFile) return;
    try {
      setUploading(true);
      let postData = new FormData();
      postData.append('content', '');
      postData.append('chatId', selectedChat._id);
      postData.append('file', recordedAudioFile);
      postData.append('messageType', 'voice');
      if (replyingTo) postData.append('replyTo', replyingTo._id);
      
      let config = { headers: { Authorization: `Bearer ${user.token}` } };
      
      const { data } = await axios.post('/api/messages', postData, config);
      socket.emit('new_message', data);
      
      setMessages([...messages, data]);
      fetchChats(); // Update chat list to bring this chat to the top
      
      setReplyingTo(null);
      setRecordedAudioFile(null);
      setAudioPreviewUrl(null);
    } catch (error) {
      console.log('bug:', error);
    } finally {
      setUploading(false);
    }
  };

  const toggleChatState = async (action) => {
    if (!selectedChat) return;
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axios.put(`/api/chats/${selectedChat._id}/${action}`, {}, config);
      
      // Update chats list
      setChats(prevChats => prevChats.map(c => c._id === data._id ? data : c));
      setSelectedChat(data);
    } catch (error) {
      console.log('bug:', error);
    }
  }

  const handleThemeChange = async (theme) => {
    setChatTheme(theme);
    if (!selectedChat) return;
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axios.put(`/api/chats/${selectedChat._id}/theme`, { theme }, config);
      setChats(prevChats => prevChats.map(c => c._id === data._id ? data : c));
      setSelectedChat(data);
    } catch (error) {
      console.log('bug:', error);
    }
  }

  const handleViewOnce = async (message) => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axios.put(`/api/messages/${message._id}/view`, {}, config);
      // Immediately open the preview if they're not the sender (and it had content), but since we get the data back (with fileUrl potentially cleared if it was the recipient), wait, the backend clears it upon viewing.
      // So if the user is the recipient, we should probably preview the original url BEFORE we mark it as viewed, or the backend should return the original for this request? 
      // Actually, since the recipient can only see it once, let's show it using the current message.fileUrl in state before backend clears it.
      if (message.fileUrl) {
         setPreviewMediaUrl(message.fileUrl);
      }
      setMessages(prev => prev.map(m => m._id === data._id ? data : m));
    } catch (error) {
      console.log('err mark view once:', error);
      showAlert('Error viewing message: ' + (error.response?.data?.message || error.message), 'Error', 'danger');
    }
  };

  const toggleChatStateContextMenu = async (action, targetChat) => {
    if (!targetChat) return;
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axios.put(`/api/chats/${targetChat._id}/${action}`, {}, config);
      
      if (action === 'delete') {
        setChats(prevChats => prevChats.filter(c => c._id !== targetChat._id));
        if (selectedChat?._id === targetChat._id) {
          setSelectedChat(null);
        }
      } else if (action === 'clear') {
        setChats(prevChats => prevChats.map(c => c._id === data._id ? data : c));
        if (selectedChat?._id === data._id) {
          setMessages([]); // Clear messages in the UI
        }
      } else {
        setChats(prevChats => prevChats.map(c => c._id === data._id ? data : c));
        if (selectedChat?._id === data._id) {
          setSelectedChat(data);
        }
      }
      closeContextMenu();
    } catch (error) {
      console.log('bug:', error);
    }
  }

  const handleContextMenu = (e, chat) => {
    e.preventDefault();
    setChatContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      chat: chat
    });
  };

  const closeContextMenu = () => {
    setChatContextMenu(prev => ({ ...prev, visible: false }));
  };

  let touchTimer = useRef(null);
  const handleTouchStart = (e, chat) => {
    const touch = e.touches[0];
    touchTimer.current = setTimeout(() => {
      setChatContextMenu({
        visible: true,
        x: touch.clientX,
        y: touch.clientY,
        chat: chat
      });
    }, 500); // 500ms long press
  };
  const handleTouchEnd = () => {
    if (touchTimer.current) clearTimeout(touchTimer.current);
  };
  const handleTouchMove = () => {
    if (touchTimer.current) clearTimeout(touchTimer.current); // Cancel on scroll
  };

  const handleTyping = (e) => {
    setInputText(e.target.value)

    if (!socketConnected || !selectedChat) return

    if (!typing) {
      setTyping(true)
      socket.emit("typing", selectedChat._id)
    }
    let lastTypingTime = new Date().getTime()
    var timerLength = 3000
    setTimeout(() => {
      var timeNow = new Date().getTime()
      var timeDiff = timeNow - lastTypingTime
      if (timeDiff >= timerLength && typing) {
        socket.emit("stop_typing", selectedChat._id)
        setTyping(false)
      }
    }, timerLength)
  }

  const handleKeyDown = (e) => {
    // 13 is Enter keyCode. e.key is 'Enter'.
    if ((e.key === 'Enter' || e.keyCode === 13) && !e.shiftKey) {
      // Ignore IME composition confirmation (common in non-English keyboards)
      if (e.nativeEvent.isComposing) return;
      
      e.preventDefault()
      // Calling handleSendMessage with event
      handleSendMessage(e)
    }
  }

  const handleChatSelect = (chat) => {
    setSelectedChat(chat)
    setChatTheme(chat.theme || 'blue')
    setIsChatOpenMobile(true)
    setNotification(prev => prev.filter(n => n.chat._id !== chat._id))
    gsap.fromTo('.chat-main-window', 
      { opacity: 0.7, y: 5 },
      { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' }
    )
  }

  const handleChatAction = async (e, chat, action) => {
    e.stopPropagation();
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      if (action === 'delete') {
        await axios.put(`/api/chats/${chat._id}/delete`, {}, config);
        setChats(prev => prev.filter(c => c._id !== chat._id));
        if (selectedChat?._id === chat._id) setSelectedChat(null);
      } else {
        const res = await axios.put(`/api/chats/${chat._id}/${action}`, {}, config);
        setChats(prev => prev.map(c => c._id === chat._id ? res.data : c));
        if (selectedChat?._id === chat._id) {
          setSelectedChat(res.data);
          if (action === 'clear') setMessages([]);
        }
      }
    } catch (error) {
      console.log('bug:', error);
    }
  };

  // filter chats (todo: optimize this later if list gets huge)
  const filteredChats = chats?.filter(c => {
    const isPinned = c.pinnedBy?.includes(user?._id)
    const isArchived = c.archivedBy?.includes(user?._id)
    
    if (viewMode === 'pinned' && !isPinned) return false;
    if (viewMode === 'archive' && !isArchived) return false;
    if (viewMode === 'all' && isArchived) return false;

    const title = c.isGroupChat ? c.groupName : getSender(user, c.participants)
    return title?.toLowerCase().includes(searchQuery.toLowerCase())
  }).sort((a, b) => {
    const aPinned = a.pinnedBy?.includes(user?._id);
    const bPinned = b.pinnedBy?.includes(user?._id);
    if (aPinned && !bPinned) return -1;
    if (!aPinned && bPinned) return 1;
    return 0;
  }) || [];

  const handleSidebarMouseDown = (e) => {
    e.preventDefault();
    document.addEventListener('mousemove', handleSidebarMouseMove);
    document.addEventListener('mouseup', handleSidebarMouseUp);
  };

  const handleSidebarMouseMove = (e) => {
    const newWidth = e.clientX;
    if (newWidth > 250 && newWidth < 500) {
      setSidebarWidth(newWidth);
    }
  };

  const handleSidebarMouseUp = () => {
    document.removeEventListener('mousemove', handleSidebarMouseMove);
    document.removeEventListener('mouseup', handleSidebarMouseUp);
  };

  return (
    <div ref={containerRef} className="bg-background text-on-background h-screen w-screen overflow-hidden flex font-body relative">
      {/* Main Layout Container */}
      <div className="flex-1 flex h-full">
        
        {/* CONVERSATION LIST (Left Column) */}
        <aside 
          className={`h-full flex flex-col bg-surface border-r border-outline-variant/10 flex-shrink-0 w-full md:w-auto ${
            isChatOpenMobile ? 'hidden md:flex' : 'flex'
          }`}
          style={{ width: isChatOpenMobile || window.innerWidth < 768 ? undefined : `${sidebarWidth}px` }}
        >
          {/* Search Header */}
          <div className="p-md pb-sm relative">
            <div className="flex justify-between items-center mb-md">
              <div className="flex items-center gap-2">
                {viewMode === 'archive' && (
                  <button onClick={() => navigate('/dashboard')} className="w-8 h-8 rounded-full hover:bg-surface-variant flex items-center justify-center text-on-surface transition-colors -ml-2">
                    <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                  </button>
                )}
                <h2 className="text-xl font-bold font-display m-0">{viewMode === 'archive' ? 'Archived' : 'Messages'}</h2>
              </div>
              <div className="flex gap-2 relative" ref={navMenuRef}>
                <button 
                  onClick={() => navigate('/calls')}
                  className="hidden md:flex w-8 h-8 rounded-full bg-secondary-container text-on-secondary-container hover:bg-secondary items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-sm"
                  title="Call History"
                >
                  <span className="material-symbols-outlined text-[18px]">call</span>
                </button>
                <button 
                  onClick={() => setIsNewChatModalOpen(true)}
                  className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container hover:bg-inverse-primary flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-sm"
                  title="New Chat"
                >
                  <span className="material-symbols-outlined text-[20px]">add</span>
                </button>
                <button 
                  onClick={() => setIsNavMenuOpen(!isNavMenuOpen)}
                  className="w-8 h-8 rounded-full hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant transition-colors"
                  title="Menu"
                >
                  <span className="material-symbols-outlined text-[20px]">more_vert</span>
                </button>

                {/* 3-Dots Dropdown Menu */}
                {isNavMenuOpen && (
                  <div className="absolute right-0 top-10 w-48 bg-surface-container-high rounded-xl shadow-lg border border-outline-variant/20 z-50 overflow-hidden animate-fade-in-up origin-top-right">
                    <button onClick={() => { setIsNavMenuOpen(false); navigate('/settings?tab=profile'); }} className="w-full px-4 py-3 text-left hover:bg-surface-variant text-sm flex items-center gap-3 transition-colors">
                      <span className="material-symbols-outlined text-[18px]">person</span> Profile
                    </button>
                    <button onClick={() => { setIsNavMenuOpen(false); navigate('/settings?tab=appearance'); }} className="w-full px-4 py-3 text-left hover:bg-surface-variant text-sm flex items-center gap-3 transition-colors">
                      <span className="material-symbols-outlined text-[18px]">settings</span> Settings
                    </button>
                    {viewMode !== 'archive' && (
                      <button onClick={() => { setIsNavMenuOpen(false); navigate('/archive'); }} className="w-full px-4 py-3 text-left hover:bg-surface-variant text-sm flex items-center gap-3 transition-colors">
                        <span className="material-symbols-outlined text-[18px]">archive</span> Archived Chats
                      </button>
                    )}

                    <div className="border-t border-outline-variant/10"></div>
                    <button onClick={() => {
                      localStorage.removeItem('nova_userInfo')
                      localStorage.removeItem('nova_theme')
                      localStorage.removeItem('nova_displayName')
                      localStorage.removeItem('nova_username')
                      localStorage.removeItem('nova_bio')
                      localStorage.removeItem('nova_email')
                      setUser(null)
                      navigate('/')
                    }} className="w-full px-4 py-3 text-left hover:bg-error-container hover:text-on-error-container text-error text-sm flex items-center gap-3 transition-colors">
                      <span className="material-symbols-outlined text-[18px]">logout</span> Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="relative group">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors pointer-events-none text-[18px]">search</span>
              <input
                className="w-full bg-surface-container-low border border-outline-variant/20 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 rounded-full py-2 pl-10 pr-4 text-sm text-on-surface placeholder:text-on-surface-variant/50 transition-all outline-none"
                placeholder="Search messages..."
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Chat List */}
          <div className="flex-1 overflow-y-auto px-xs pb-sm space-y-1">
            {filteredChats.map((chat) => {
              const isActive = selectedChat?._id === chat._id
              const lastMessage = chat.lastMessage
              const title = chat.isGroupChat ? chat.groupName : getSender(user, chat.participants)
              const senderFull = getSenderFull(user, chat.participants);
              const senderProfile = senderFull?.profilePicture;
              const senderPrivacy = senderFull?.privacy;
              const hideProfilePhoto = senderPrivacy?.profilePhoto === 'Nobody';
              const hideLastSeen = senderPrivacy?.lastSeen === false;
              
              const avatar = chat.isGroupChat ? (chat.groupPicture || 'storefront') : (hideProfilePhoto || !senderProfile || senderProfile === 'default.jpg' || senderProfile === 'https://via.placeholder.com/150') ? 'person' : senderProfile;
              const online = !chat.isGroupChat && senderFull?.isOnline && !hideLastSeen;
              
              const getLastMessagePreview = () => {
                if (!lastMessage) return 'No messages';
                let prefix = '';
                if (lastMessage.sender?._id === user?._id) {
                  prefix = 'You: ';
                } else if (chat.isGroupChat && lastMessage.sender?.displayName) {
                  prefix = lastMessage.sender.displayName.split(' ')[0] + ': ';
                }
                
                let content = lastMessage.content;
                if (!content) {
                  if (lastMessage.messageType === 'image') content = '📷 Image';
                  else if (lastMessage.messageType === 'voice') content = '🎤 Voice Message';
                  else if (lastMessage.messageType === 'sticker') content = 'Sticker';
                  else content = 'Attachment';
                }
                return prefix + content;
              };
              
              const unreadCount = notification.filter(n => n.chat._id === chat._id).length;

              return (
                <button
                  key={chat._id}
                  onClick={() => handleChatSelect(chat)}
                  onContextMenu={(e) => handleContextMenu(e, chat)}
                  onTouchStart={(e) => handleTouchStart(e, chat)}
                  onTouchEnd={handleTouchEnd}
                  onTouchMove={handleTouchMove}
                  className={`group relative chat-sidebar-item w-full text-left flex items-start gap-sm p-3 rounded-lg border transition-all ${
                    isActive
                      ? 'bg-surface-container-highest/50 border-primary/20'
                      : 'hover:bg-surface-container-low border-transparent'
                  }`}
                >
                  <div className="w-12 h-12 rounded-full bg-surface-variant flex-shrink-0 overflow-hidden relative flex items-center justify-center">
                    {avatar === 'storefront' ? (
                      <span className="material-symbols-outlined text-on-surface-variant text-[24px]">group</span>
                    ) : avatar === 'person' ? (
                      <span className="material-symbols-outlined text-on-surface-variant text-[24px]">person</span>
                    ) : (
                      <img className="w-full h-full object-cover" alt={title} src={avatar} />
                    )}
                    {online && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-primary rounded-full border-2 border-surface-container-highest"></div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 pr-2">
                    <div className="flex justify-between items-baseline mb-1">
                      <span className="text-sm font-semibold truncate text-on-surface flex items-center gap-1">
                        {chat.pinnedBy?.includes(user?._id) && <span className="material-symbols-outlined text-primary" style={{ fontSize: '12px' }}>push_pin</span>}
                        {chat.favoriteBy?.includes(user?._id) && <span className="material-symbols-outlined opacity-60" style={{ fontSize: '12px' }}>star</span>}
                        {title}
                      </span>
                      <span className={`font-mono text-[10px] whitespace-nowrap ml-1 ${isActive ? 'text-primary' : 'text-on-surface-variant'}`}>
                        {lastMessage ? new Date(lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <p className={`text-xs truncate m-0 flex-1 ${isActive ? 'text-on-surface' : 'text-on-surface-variant'}`}>
                        {getLastMessagePreview()}
                      </p>
                      <div className="flex items-center gap-1.5 ml-2">
                        {unreadCount > 0 && (
                          <div className="bg-primary text-on-primary text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center shadow-sm animate-pulse-once">
                            {unreadCount}
                          </div>
                        )}
                        {chat.mutedBy?.includes(user?._id) && <span className="material-symbols-outlined text-[14px] text-on-surface-variant">notifications_off</span>}
                      </div>
                    </div>
                  </div>

                </button>
              )
            })}
            {filteredChats.length === 0 && (
              <div className="text-center py-xl text-on-surface-variant text-sm">
                No conversations found
              </div>
            )}
          </div>
        </aside>

        {/* Resizer Handle */}
        <div 
          className="hidden md:block w-1.5 cursor-col-resize hover:bg-primary/20 active:bg-primary/50 transition-colors z-30 flex-shrink-0 relative"
          onMouseDown={handleSidebarMouseDown}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-8 w-1 rounded-full bg-outline-variant/30 pointer-events-none"></div>
        </div>

        {/* ACTIVE CONVERSATION (Right Column) */}
        <main 
          data-theme={chatTheme}
          className={`chat-main-window flex-1 h-full flex flex-col relative min-w-0 transition-colors duration-500 ${wallpaperClass} ${
            isChatOpenMobile ? 'flex' : 'hidden md:flex'
          }`}
          style={(user?.wallpaper?.startsWith('http') || user?.wallpaper?.startsWith('data:')) ? { backgroundImage: `url(${user.wallpaper})` } : {}}
        >
          {selectedChat ? (
            <>
              {/* Chat Header */}
              <ChatHeader 
                chat={selectedChat} 
                user={user} 
                getSender={getSender} 
                getSenderFull={getSenderFull} 
                onCallClick={() => {
                  const fullUser = getSenderFull(user, selectedChat.participants);
                  const name = getSender(user, selectedChat.participants);
                  if (fullUser) callUser(fullUser._id, name, fullUser.profilePicture, false);
                }}
                onVideoCallClick={() => {
                  const fullUser = getSenderFull(user, selectedChat.participants);
                  const name = getSender(user, selectedChat.participants);
                  if (fullUser) callUser(fullUser._id, name, fullUser.profilePicture, true);
                }}
                onOpenInfo={() => setChatInfoModalOpen(true)} 
                onBack={() => setIsChatOpenMobile(false)} 
                onSearch={() => setIsChatSearchOpen(!isChatSearchOpen)}
              />

              {/* Chat Search Bar */}
              {isChatSearchOpen && (
                <div className="bg-surface/90 backdrop-blur border-b border-outline-variant/10 p-2 flex items-center px-4 animate-fade-in-up shadow-sm absolute w-full z-10" style={{ top: '64px' }}>
                  <div className="relative flex-1 flex items-center">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
                    <input
                      autoFocus
                      type="text"
                      className="w-full bg-surface-container-low border border-outline-variant/20 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 rounded-full py-1.5 pl-9 pr-24 text-sm outline-none"
                      placeholder="Search in conversation..."
                      value={chatSearchQuery}
                      onChange={(e) => executeChatSearch(e.target.value)}
                    />
                    {searchResults.length > 0 && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs text-on-surface-variant">
                        <span>{searchIndex + 1} / {searchResults.length}</span>
                        <button onClick={() => jumpToMatch(-1)} className="hover:text-primary transition-colors"><span className="material-symbols-outlined text-[16px]">expand_less</span></button>
                        <button onClick={() => jumpToMatch(1)} className="hover:text-primary transition-colors"><span className="material-symbols-outlined text-[16px]">expand_more</span></button>
                      </div>
                    )}
                  </div>
                  <button onClick={() => { setIsChatSearchOpen(false); executeChatSearch(''); }} className="w-8 h-8 rounded-full hover:bg-surface-container-high ml-2 flex items-center justify-center text-on-surface-variant">
                    <span className="material-symbols-outlined text-[18px]">close</span>
                  </button>
                </div>
              )}

              {/* Message Thread */}
              <div className="flex-1 overflow-y-auto p-md space-y-md relative">
                {messages.map((message) => {
                  if (message.messageType === 'call_log') {
                    const isVideo = message.content.toLowerCase().includes('video');
                    const isMissed = message.content.toLowerCase().includes('missed');
                    const isDeclined = message.content.toLowerCase().includes('declined');
                    return (
                      <div key={message._id} className="flex justify-center my-4">
                        <div className="bg-surface-container/50 backdrop-blur-sm px-4 py-2 rounded-full flex items-center gap-2 border border-outline-variant/10 shadow-sm text-xs text-on-surface-variant font-medium animate-fade-in">
                          <span className={`material-symbols-outlined text-[16px] ${isMissed || isDeclined ? 'text-error' : 'text-primary'}`}>
                            {isVideo ? (isMissed || isDeclined ? 'videocam_off' : 'videocam') : (isMissed || isDeclined ? 'phone_missed' : 'call')}
                          </span>
                          {message.content}
                        </div>
                      </div>
                    );
                  }

                  const isOutgoing = message.sender._id === user?._id
                  const time = new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  
                  const getMessageStatusIcon = (msg) => {
                    const readCount = msg.readBy?.filter(id => id !== msg.sender._id).length || 0;
                    const deliveredCount = msg.deliveredTo?.filter(id => id !== msg.sender._id).length || 0;
                    
                    const hideReadReceipts = user?.privacy?.readReceipts === false || getSenderFull(user, selectedChat.participants)?.privacy?.readReceipts === false;
                    
                    if (readCount > 0 && !hideReadReceipts) return <span className="material-symbols-outlined text-primary text-[14px] fill" title="Read">done_all</span>;
                    if (deliveredCount > 0) return <span className="material-symbols-outlined text-on-surface-variant text-[14px]" title="Delivered">done_all</span>;
                    return <span className="material-symbols-outlined text-on-surface-variant text-[14px]" title="Sent">check</span>;
                  }

                  const reactionOptions = [
                    { emoji: '❤️', img: 'https://fonts.gstatic.com/s/e/notoemoji/latest/2764_fe0f/512.webp' },
                    { emoji: '👍', img: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f44d/512.webp' },
                    { emoji: '😂', img: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f602/512.webp' },
                    { emoji: '😮', img: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f62e/512.webp' },
                    { emoji: '😢', img: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f622/512.webp' },
                    { emoji: '😡', img: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f621/512.webp' }
                  ];

                  const timeSinceSent = Date.now() - new Date(message.createdAt).getTime();
                  const canEditOrDeleteForEveryone = isOutgoing && timeSinceSent <= 5 * 60 * 1000;
                  
                  // Calculate swipe transform
                  const isSwipingThis = swipeState.id === message._id;
                  const swipeDiff = isSwipingThis ? swipeState.startX - swipeState.currentX : 0;
                  const transformX = isSwipingThis && swipeDiff > 0 ? Math.min(swipeDiff, 80) * -1 : 0;

                  // Long press simulation (context menu fallback)
                  const handleContextMenu = (e) => {
                    e.preventDefault();
                    setMsgActionMenu({ visible: true, message, x: e.clientX, y: e.clientY });
                  };

                  let longPressTimer;
                  let initialTouch = null;
                  const onTouchStart = (e) => {
                    initialTouch = { x: e.touches[0].clientX, y: e.touches[0].clientY };
                    handleTouchStartMsg(e, message._id);
                    longPressTimer = setTimeout(() => {
                      setMsgActionMenu({ visible: true, message, x: e.touches[0].clientX, y: e.touches[0].clientY });
                      setSwipeState({ id: null, startX: 0, currentX: 0 }); // Cancel swipe
                    }, 400);
                  };
                  const onTouchMove = (e) => {
                    if (initialTouch) {
                      const moveX = Math.abs(e.touches[0].clientX - initialTouch.x);
                      const moveY = Math.abs(e.touches[0].clientY - initialTouch.y);
                      if (moveX > 10 || moveY > 10) {
                        clearTimeout(longPressTimer);
                      }
                    }
                    handleTouchMoveMsg(e, message._id);
                  };
                  const onTouchEnd = (e) => {
                    clearTimeout(longPressTimer);
                    handleTouchEndMsg(e, message);
                  };

                  return (
                    <div 
                      key={message._id} 
                      className={`message-bubble flex items-end gap-sm group relative ${isOutgoing ? 'justify-end' : ''}`}
                    >
                      {!isOutgoing && (
                        <div className="w-7 h-7 rounded-full bg-surface-variant flex-shrink-0 overflow-hidden mr-2 mt-1 relative flex items-center justify-center">
                        {message.sender.profilePicture && message.sender.profilePicture !== 'default.jpg' && message.sender.profilePicture !== 'https://via.placeholder.com/150' ? (
                          <img className="w-full h-full object-cover" src={message.sender.profilePicture} alt="avatar" />
                        ) : (
                          <span className="material-symbols-outlined text-[16px] text-on-surface-variant">person</span>
                        )}
                      </div>
                      )}
                      
                      <div 
                        className={`max-w-[70%] flex flex-col relative ${isOutgoing ? 'items-end' : 'items-start'}`}
                        style={{ transform: `translateX(${transformX}px)`, transition: isSwipingThis ? 'none' : 'transform 0.2s ease' }}
                        onTouchStart={onTouchStart}
                        onTouchMove={onTouchMove}
                        onTouchEnd={onTouchEnd}
                        onContextMenu={handleContextMenu}
                      >
                        {message.isDeletedForEveryone ? (
                          <div className={`p-3 rounded-2xl shadow-sm inline-block text-left relative ${isOutgoing ? 'bg-surface-container text-on-surface-variant rounded-br-sm' : 'bg-surface-container-highest text-on-surface-variant rounded-bl-sm'}`}>
                            <span className="material-symbols-outlined text-[16px] inline-block align-middle mr-1">block</span>
                            <span className="italic text-sm align-middle">This message was deleted</span>
                          </div>
                        ) : (
                          <>
                            <span className={`font-mono text-[10px] text-on-surface-variant mb-1 block ${isOutgoing ? 'mr-1' : 'ml-1'}`}>
                              {isOutgoing ? `You, ${time}` : `${message.sender.displayName}, ${time}`}
                              {message.isEdited && ' (edited)'}
                            </span>
                            <div 
                              className={
                                (!message.content && !message.replyTo && !message.isForwarded && (message.messageType === 'image' || message.messageType === 'sticker' || message.messageType === 'voice'))
                                  ? 'inline-block text-left relative cursor-pointer'
                                  : `p-3 rounded-2xl shadow-sm inline-block text-left relative cursor-pointer ${isOutgoing ? 'bg-primary-container text-on-primary-container rounded-br-sm shadow-[0_4px_12px_rgba(0,102,255,0.15)]' : 'bg-surface-container-highest text-on-surface rounded-bl-sm'}`
                              }
                              onClick={() => setReactionHoverId(reactionHoverId === message._id ? null : message._id)}
                              onDoubleClick={(e) => { e.stopPropagation(); setMsgActionMenu({ visible: true, message, x: e.clientX || window.innerWidth/2, y: e.clientY || window.innerHeight/2 }); }}
                            >
                              {message.isForwarded && (
                                <div className="flex items-center gap-1 mb-1 text-[11px] font-medium opacity-70">
                                  <span className="material-symbols-outlined text-[14px]">forward</span>
                                  <i>Forwarded</i>
                                </div>
                              )}
                              {message.replyTo && (
                                <div className={`mb-2 p-2 rounded-lg border-l-2 text-xs ${isOutgoing ? 'bg-black/10 border-primary/50' : 'bg-black/5 dark:bg-white/5 border-primary/50'}`}>
                                  <span className="font-bold block mb-1 opacity-80">{message.replyTo.sender?.displayName}</span>
                                  <span className="opacity-70 line-clamp-2">{message.replyTo.content || 'Attachment'}</span>
                                </div>
                              )}
                              
                              {message.messageType === 'image' && (
                                <>
                                  {message.isViewOnce ? (
                                    !message.viewedBy?.includes(user?._id) && !isOutgoing ? (
                                      <button 
                                        onClick={(e) => { e.stopPropagation(); handleViewOnce(message); }}
                                        className="flex items-center gap-2 bg-surface/20 hover:bg-surface/30 p-3 rounded-xl mb-2 transition-colors border border-outline-variant/20"
                                      >
                                        <span className="material-symbols-outlined text-[24px]">visibility</span>
                                        <span className="text-sm font-semibold">View Once Image</span>
                                      </button>
                                    ) : (
                                      <div className="flex items-center gap-2 bg-surface/10 p-3 rounded-xl mb-2 border border-outline-variant/10 opacity-70">
                                        <span className="material-symbols-outlined text-[24px]">visibility_off</span>
                                        <span className="text-sm italic">{isOutgoing ? 'You sent a view-once image' : 'Viewed'}</span>
                                      </div>
                                    )
                                  ) : (
                                    message.fileUrl && (
                                      <img 
                                        src={message.fileUrl} 
                                        alt="attachment" 
                                        onClick={(e) => { e.stopPropagation(); setPreviewMediaUrl(message.fileUrl); }}
                                        className="max-w-[200px] sm:max-w-[300px] rounded-xl mb-2 object-contain cursor-pointer hover:opacity-90 transition-opacity" 
                                      />
                                    )
                                  )}
                                </>
                              )}
                              {message.messageType === 'sticker' && message.fileUrl && (
                                <img 
                                  src={message.fileUrl} 
                                  alt="sticker" 
                                  className="w-24 h-24 sm:w-32 sm:h-32 object-contain mb-1 drop-shadow-md" 
                                />
                              )}
                              {message.messageType === 'voice' && message.fileUrl && (
                                <AudioPlayer src={message.fileUrl} />
                              )}
                              {message.messageType !== 'voice' && (
                                <p className="m-0 text-sm break-words whitespace-pre-wrap" id={`message-${message._id}`}>{renderMessageWith3DEmojis(message.content, chatSearchQuery, message._id, searchResults, searchIndex)}</p>
                              )}
                              
                              {/* Reactions */}
                              {message.reactions && message.reactions.length > 0 && (
                                <div 
                                  onTouchStart={(e) => e.stopPropagation()}
                                  className={`absolute ${isOutgoing ? 'right-2' : 'left-2'} -bottom-3.5 flex items-center bg-surface border border-outline-variant/30 rounded-full px-1.5 py-0.5 shadow-sm z-20`}
                                >
                                  {Array.from(new Set(message.reactions.map(r => r.emoji))).map(emoji => {
                                    const option = reactionOptions.find(o => o.emoji === emoji);
                                    return option ? (
                                      <img 
                                        key={emoji} 
                                        src={option.img} 
                                        alt={emoji} 
                                        onClick={(e) => { e.stopPropagation(); handleReaction(message._id, emoji); }}
                                        className="w-3.5 h-3.5 -ml-1 first:ml-0 border border-surface rounded-full cursor-pointer hover:scale-125 transition-transform" 
                                      />
                                    ) : null;
                                  })}
                                </div>
                              )}
                            </div>
                          </>
                        )}

                        {!message.isDeletedForEveryone && (
                          <div className={`flex items-center gap-1 ${isOutgoing ? 'mr-1' : 'ml-1'} ${message.reactions?.length > 0 ? 'mt-4' : 'mt-1'}`}>
                            {isOutgoing && getMessageStatusIcon(message)}
                            {message.pinnedBy?.length > 0 && <span className="material-symbols-outlined text-primary" style={{ fontSize: '12px' }} title="Pinned">push_pin</span>}
                            {message.starredBy?.includes(user?._id) && <span className="material-symbols-outlined opacity-60" style={{ fontSize: '12px' }} title="Starred">star</span>}
                          </div>
                        )}
                      </div>

                      {/* Reply visual cue on swipe */}
                      {isSwipingThis && transformX < -30 && (
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 mr-4 text-primary bg-primary-container p-2 rounded-full shadow-md z-10 animate-fade-in">
                          <span className="material-symbols-outlined text-[20px]">reply</span>
                        </div>
                      )}

                      {/* Hover/Tap Quick Reactions Menu */}
                      {reactionHoverId === message._id && !message.isDeletedForEveryone && (
                        <div 
                          className={`reaction-menu-container absolute bottom-full mb-2 bg-surface/95 backdrop-blur-sm border border-outline-variant/20 shadow-2xl rounded-full px-3 py-2 flex gap-3 animate-fade-in-up z-50 ${isOutgoing ? 'right-0 origin-bottom-right' : 'left-0 origin-bottom-left'}`}
                        >
                          {reactionOptions.map(opt => {
                            const isReacted = message.reactions?.some(r => r.userId === user._id && r.emoji === opt.emoji);
                            return (
                              <button 
                                key={opt.emoji} 
                                onClick={(e) => { e.stopPropagation(); handleReaction(message._id, opt.emoji); setReactionHoverId(null); }}
                                className={`hover:scale-[1.4] transition-transform w-6 h-6 flex items-center justify-center rounded-full ${isReacted ? 'bg-primary/20 scale-[1.2]' : ''}`}
                              >
                                <img src={opt.img} alt={opt.emoji} className="w-full h-full object-contain" />
                              </button>
                            );
                          })}
                          <div className="w-px h-6 bg-outline-variant/30 mx-1"></div>
                          <button 
                            onClick={(e) => { e.stopPropagation(); setMsgActionMenu({ visible: true, message, x: isOutgoing ? window.innerWidth - 150 : 50, y: e.clientY || (e.touches ? e.touches[0].clientY : 0) }); setReactionHoverId(null); }} 
                            className="w-6 h-6 flex items-center justify-center text-on-surface-variant hover:text-on-surface"
                          >
                            <span className="material-symbols-outlined text-[18px]">more_vert</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
                {isTyping && (
                  <div className="message-bubble flex items-end gap-sm">
                    <div className="bg-surface-container-low text-on-surface p-3 rounded-2xl rounded-bl-sm border border-outline-variant/5 shadow-sm inline-block">
                      <span className="typing-indicator flex gap-1">
                        <span className="w-1.5 h-1.5 bg-on-surface-variant rounded-full animate-bounce"></span>
                        <span className="w-1.5 h-1.5 bg-on-surface-variant rounded-full animate-bounce delay-75"></span>
                        <span className="w-1.5 h-1.5 bg-on-surface-variant rounded-full animate-bounce delay-150"></span>
                      </span>
                    </div>
                  </div>
                )}
                <div ref={threadEndRef} />
              </div>

              {/* Message Composer */}
              <div ref={composerRef} className="p-md bg-surface/60 backdrop-blur-xl border-t border-outline-variant/10 flex-shrink-0 relative">
                {mediaPickerMode === 'emoji' && (
                  <div className="absolute bottom-14 left-0 z-50 animate-in fade-in slide-in-from-bottom-2">
                    <EmojiPicker 
                      emojiStyle="apple" 
                      onEmojiClick={(emojiData) => setInputText(prev => prev + emojiData.emoji)} 
                    />
                  </div>
                )}
                {mediaPickerMode === 'gif' && (
                  <div className="absolute bottom-full left-16 mb-2 z-50 shadow-xl rounded-xl overflow-hidden">
                    <GifPicker onGifSelect={handleSendGif} defaultTab="gifs" />
                  </div>
                )}

                <form onSubmit={handleSendMessage} className="bg-surface-container-low border border-outline-variant/20 rounded-2xl flex flex-col focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/50 transition-all overflow-hidden shadow-sm">
                  {replyingTo && (
                    <div className="bg-black/5 dark:bg-white/5 border-l-4 border-primary px-3 py-2 mx-2 mt-2 rounded-lg relative">
                      <div className="text-xs font-bold text-primary mb-1">Replying to {replyingTo.sender?.displayName || 'User'}</div>
                      <div className="text-xs text-on-surface-variant truncate pr-6">{replyingTo.content || 'Attachment'}</div>
                      <button 
                        type="button" 
                        onClick={() => setReplyingTo(null)}
                        className="absolute top-1/2 -translate-y-1/2 right-2 w-6 h-6 flex items-center justify-center rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-on-surface-variant"
                      >
                        <span className="material-symbols-outlined text-[16px]">close</span>
                      </button>
                    </div>
                  )}
                  {filePreview && (
                    <div className="p-3 border-b border-outline-variant/10 relative inline-block self-start mt-2 ml-2">
                       <img src={filePreview} alt="preview" className="h-20 rounded-md object-cover" />
                       <button type="button" onClick={() => { setSelectedFile(null); setFilePreview(null); setIsViewOnce(false); }} className="absolute -top-2 -right-2 bg-surface-container-highest rounded-full w-6 h-6 flex items-center justify-center text-on-surface shadow-md">
                         <span className="material-symbols-outlined text-[14px]">close</span>
                       </button>
                       <button 
                         type="button" 
                         onClick={() => setIsViewOnce(!isViewOnce)} 
                         className={`absolute -bottom-2 -right-2 rounded-full w-8 h-8 flex items-center justify-center shadow-md transition-colors ${isViewOnce ? 'bg-primary text-on-primary' : 'bg-surface-container-highest text-on-surface-variant hover:text-on-surface'}`}
                         title={isViewOnce ? "View once enabled" : "Enable view once"}
                       >
                         <span className="font-bold text-[12px]">1</span>
                       </button>
                    </div>
                  )}
                  
                  {audioPreviewUrl ? (
                    <div className="flex items-center justify-between px-4 py-3 bg-surface-container-low rounded-t-2xl gap-4">
                      <div className="flex-1 bg-surface-variant/20 rounded-full">
                        <AudioPlayer src={audioPreviewUrl} />
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          type="button" 
                          onClick={() => { setRecordedAudioFile(null); setAudioPreviewUrl(null); }} 
                          className="w-10 h-10 rounded-full flex items-center justify-center text-error hover:bg-error/10 transition-colors"
                          title="Discard voice note"
                        >
                          <span className="material-symbols-outlined text-[20px]">delete</span>
                        </button>
                        <button 
                          type="button" 
                          onClick={sendRecordedAudio} 
                          disabled={uploading}
                          className={`w-10 h-10 rounded-full flex items-center justify-center text-on-primary shadow-md hover:scale-105 active:scale-95 transition-all ${uploading ? 'bg-surface-variant text-on-surface-variant' : 'bg-primary'}`}
                          title="Send voice note"
                        >
                          {uploading ? (
                            <div className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <span className="material-symbols-outlined text-[18px]">send</span>
                          )}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col w-full">
                      {editingMessage && (
                        <div className="flex items-center justify-between px-4 py-1.5 bg-primary/10 rounded-t-2xl border-b border-primary/20">
                          <div className="flex items-center gap-2 text-xs text-primary font-semibold">
                            <span className="material-symbols-outlined text-[14px]">edit</span>
                            Editing Message
                          </div>
                          <button 
                            type="button" 
                            onClick={() => { setEditingMessage(null); setInputText(''); }}
                            className="text-on-surface-variant hover:text-error transition-colors"
                          >
                            <span className="material-symbols-outlined text-[16px]">close</span>
                          </button>
                        </div>
                      )}
                      <textarea
                        id="chat-input-field"
                        className={`w-full bg-transparent border-none focus:ring-0 resize-none py-3 px-4 text-sm text-on-surface placeholder:text-on-surface-variant/50 outline-none max-h-32 ${editingMessage ? 'bg-primary/5 rounded-b-2xl' : ''}`}
                        placeholder={isRecording ? "Recording..." : (editingMessage ? "Edit your message..." : "Type a message...")}
                        rows={1}
                        value={inputText}
                        onChange={handleTyping}
                        onKeyDown={handleKeyDown}
                        disabled={isRecording}
                      />
                    </div>
                  )}
                  {!audioPreviewUrl && (
                    <div className="flex items-center justify-between px-2 pb-2">
                      <div className="flex items-center gap-1">
                        <input 
                          type="file" 
                          ref={fileInputRef} 
                          onChange={handleFileChange} 
                          accept="image/*" 
                          className="hidden" 
                        />
                        <button type="button" onClick={() => fileInputRef.current?.click()} className="w-9 h-9 rounded-full hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant transition-colors" title="Attach file">
                          <span className="material-symbols-outlined text-[20px]">attach_file</span>
                        </button>
                        <button type="button" onClick={() => setMediaPickerMode(mediaPickerMode === 'emoji' ? null : 'emoji')} className={`hidden md:flex w-9 h-9 rounded-full items-center justify-center transition-colors ${mediaPickerMode === 'emoji' ? 'bg-primary/20 text-primary' : 'hover:bg-surface-container-high text-on-surface-variant'}`} title="Insert emoji">
                          <span className="material-symbols-outlined text-[20px]">
                            {mediaPickerMode === 'emoji' ? 'keyboard' : 'mood'}
                          </span>
                        </button>
                        <button type="button" onClick={() => setMediaPickerMode(mediaPickerMode === 'gif' ? null : 'gif')} className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${mediaPickerMode === 'gif' ? 'bg-primary/20 text-primary' : 'hover:bg-surface-container-high text-on-surface-variant'}`} title="Insert GIF">
                          <span className="material-symbols-outlined text-[20px]">gif_box</span>
                        </button>

                      </div>
                      <div className="flex items-center gap-2">
                        {isRecording && (
                           <div className="flex items-center gap-2 mr-2 text-error animate-pulse">
                             <span className="w-2 h-2 rounded-full bg-error"></span>
                             <span className="text-sm font-mono">{Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}</span>
                           </div>
                        )}
                        
                        {(inputText.trim() || selectedFile) ? (
                          <button
                            type="submit"
                            disabled={uploading}
                            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-[0_2px_8px_rgba(0,102,255,0.3)] hover:scale-105 active:scale-95 ml-1 ${
                              uploading ? 'bg-surface-variant text-on-surface-variant' : 'bg-primary-container text-on-primary-container hover:bg-primary-container/90'
                            }`}
                          >
                            {uploading ? (
                              <div className="w-4 h-4 border-2 border-on-surface-variant border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <span className="material-symbols-outlined text-[18px]">send</span>
                            )}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              if (isRecording) {
                                stopRecording(false);
                              } else {
                                startRecording();
                              }
                            }}
                            title={isRecording ? "Click to finish recording" : "Click to record"}
                            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-[0_2px_8px_rgba(0,102,255,0.3)] hover:scale-105 active:scale-95 ml-1 ${
                              isRecording ? 'bg-error text-white animate-pulse scale-110' : 'bg-primary text-on-primary hover:bg-primary/90'
                            }`}
                          >
                            <span className="material-symbols-outlined text-[20px]">{isRecording ? 'stop' : 'mic'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-on-surface-variant">
              Select a conversation to start messaging
            </div>
          )}
        </main>

        {/* ACTIVE CHAT INFO PANEL (Right-most Column) */}
        {isChatInfoOpen && selectedChat && (
          <aside className="w-full md:w-[320px] lg:w-[350px] h-full flex flex-col bg-surface border-l border-outline-variant/10 flex-shrink-0 animate-fade-in-left absolute md:relative right-0 z-40">
            <header className="h-16 border-b border-outline-variant/10 flex items-center justify-between px-4">
              <h3 className="font-semibold">Contact Info</h3>
              <button onClick={() => setIsChatInfoOpen(false)} className="w-8 h-8 rounded-full hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </header>
            
            <div className="flex-1 overflow-y-auto">
              <div className="p-6 flex flex-col items-center border-b border-outline-variant/10">
                <div className="w-24 h-24 rounded-full bg-surface-variant flex-shrink-0 overflow-hidden relative flex items-center justify-center mb-4">
                  {selectedChat.isGroupChat ? (
                    selectedChat.groupPicture ? (
                      <img className="w-full h-full object-cover" src={selectedChat.groupPicture} alt="Group" />
                    ) : (
                      <span className="material-symbols-outlined text-on-surface-variant text-[40px]">group</span>
                    )
                  ) : (
                    getSenderFull(user, selectedChat.participants)?.profilePicture && getSenderFull(user, selectedChat.participants)?.profilePicture !== 'default.jpg' && getSenderFull(user, selectedChat.participants)?.profilePicture !== 'https://via.placeholder.com/150' ? (
                      <img className="w-full h-full object-cover" src={getSenderFull(user, selectedChat.participants)?.profilePicture} alt="Profile" />
                    ) : (
                      <span className="material-symbols-outlined text-on-surface-variant text-[40px]">person</span>
                    )
                  )}
                </div>
                <h2 className="text-xl font-bold mb-1">{selectedChat.isGroupChat ? selectedChat.groupName : getSender(user, selectedChat.participants)}</h2>
                <p className="text-sm text-on-surface-variant">{selectedChat.isGroupChat ? 'Group Chat' : 'Direct Message'}</p>
              </div>

              <div className="p-4 border-b border-outline-variant/10">
                <h4 className="font-semibold mb-3 text-sm text-on-surface-variant uppercase tracking-wider">Chat Theme</h4>
                <div className="flex gap-3 flex-wrap">
                  {['blue', 'purple', 'green', 'orange', 'emerald', 'rose', 'amber', 'cyan', 'indigo', 'crimson'].map(theme => {
                    const themeColors = {
                      blue: '#0066FF', purple: '#9C27B0', green: '#4CAF50', orange: '#FF9800',
                      emerald: '#10B981', rose: '#F43F5E', amber: '#F59E0B', cyan: '#06B6D4',
                      indigo: '#6366F1', crimson: '#DC143C'
                    };
                    return (
                      <button 
                        key={theme} 
                        onClick={() => handleThemeChange(theme)} 
                        className={`w-8 h-8 rounded-full shadow-sm flex items-center justify-center transition-transform ${chatTheme === theme ? 'scale-110 ring-2 ring-offset-2 ring-surface' : 'hover:scale-110'}`} 
                        style={{ backgroundColor: themeColors[theme] }}
                      >
                      {chatTheme === theme && <span className="material-symbols-outlined text-white text-[16px]">check</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="p-4">
                <div className="flex gap-4 border-b border-outline-variant/10 mb-4">
                  <button onClick={() => setChatInfoTab('media')} className={`pb-2 text-sm font-semibold border-b-2 transition-colors ${chatInfoTab === 'media' ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-on-surface'}`}>Media</button>
                  <button onClick={() => setChatInfoTab('links')} className={`pb-2 text-sm font-semibold border-b-2 transition-colors ${chatInfoTab === 'links' ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-on-surface'}`}>Links</button>
                  <button onClick={() => setChatInfoTab('docs')} className={`pb-2 text-sm font-semibold border-b-2 transition-colors ${chatInfoTab === 'docs' ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-on-surface'}`}>Docs</button>
                </div>
                
                <div className="grid grid-cols-3 gap-2">
                  {chatInfoTab === 'media' && messages.filter(m => m.messageType === 'image').length === 0 && (
                    <div className="col-span-3 text-center text-sm text-on-surface-variant py-4">No media found</div>
                  )}
                  {chatInfoTab === 'media' && messages.filter(m => m.messageType === 'image').map((m, i) => (
                    <div key={i} className="aspect-square bg-surface-variant rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity">
                      <img src={m.fileUrl} alt="Media" className="w-full h-full object-cover" />
                    </div>
                  ))}
                  {chatInfoTab === 'links' && (
                    <div className="col-span-3 text-center text-sm text-on-surface-variant py-4">No links found</div>
                  )}
                  {chatInfoTab === 'docs' && (
                    <div className="col-span-3 text-center text-sm text-on-surface-variant py-4">No documents found</div>
                  )}
                </div>
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* Mobile Bottom Navigation Bar */}
      {!isChatOpenMobile && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-surface-container-low border-t border-outline-variant/10 flex items-center justify-around z-40">
          <Link to="/dashboard" className="flex flex-col items-center gap-1 text-primary animate-fade-in-up">
            <span className="material-symbols-outlined fill">chat</span>
            <span className="text-[10px] font-semibold">Messages</span>
          </Link>
          <Link to="/calls" className="flex flex-col items-center gap-1 text-on-surface-variant animate-fade-in-up">
            <span className="material-symbols-outlined">call</span>
            <span className="text-[10px]">Calls</span>
          </Link>
          <Link to="/settings" className="flex flex-col items-center gap-1 text-on-surface-variant animate-fade-in-up">
            <span className="material-symbols-outlined">settings</span>
            <span className="text-[10px]">Settings</span>
          </Link>
        </div>
      )}

      {/* Context Menu */}
      {chatContextMenu.visible && (
        <>
          <div className="fixed inset-0 z-50" onClick={closeContextMenu} onContextMenu={(e) => { e.preventDefault(); closeContextMenu(); }}></div>
          <div 
            className="fixed z-[60] w-52 bg-surface-container-low border border-outline-variant/20 shadow-xl rounded-xl py-2 flex flex-col animate-fade-in-up backdrop-blur-sm"
            style={{ 
              top: Math.min(chatContextMenu.y, window.innerHeight - 250), 
              left: Math.min(chatContextMenu.x, window.innerWidth - 200) 
            }}
          >
            <button 
              onClick={() => toggleChatStateContextMenu('pin', chatContextMenu.chat)}
              className="flex items-center gap-3 px-4 py-2 hover:bg-surface-container-high transition-colors text-sm text-left w-full text-on-surface"
            >
              <span className={`material-symbols-outlined text-[18px] ${chatContextMenu.chat.pinnedBy?.includes(user?._id) ? 'fill' : 'text-on-surface-variant'}`}>push_pin</span>
              {chatContextMenu.chat.pinnedBy?.includes(user?._id) ? 'Unpin Chat' : 'Pin Chat'}
            </button>
            <button 
              onClick={() => toggleChatStateContextMenu('archive', chatContextMenu.chat)}
              className="flex items-center gap-3 px-4 py-2 hover:bg-surface-container-high transition-colors text-sm text-left w-full text-on-surface"
            >
              <span className={`material-symbols-outlined text-[18px] ${chatContextMenu.chat.archivedBy?.includes(user?._id) ? 'fill' : 'text-on-surface-variant'}`}>archive</span>
              {chatContextMenu.chat.archivedBy?.includes(user?._id) ? 'Unarchive Chat' : 'Archive Chat'}
            </button>
            <button 
              onClick={() => toggleChatStateContextMenu('mute', chatContextMenu.chat)}
              className="flex items-center gap-3 px-4 py-2 hover:bg-surface-container-high transition-colors text-sm text-left w-full text-on-surface"
            >
              <span className={`material-symbols-outlined text-[18px] ${chatContextMenu.chat.mutedBy?.includes(user?._id) ? 'fill' : 'text-on-surface-variant'}`}>notifications_off</span>
              {chatContextMenu.chat.mutedBy?.includes(user?._id) ? 'Unmute Chat' : 'Mute Chat'}
            </button>
            <button 
              onClick={() => toggleChatStateContextMenu('clear', chatContextMenu.chat)}
              className="flex items-center gap-3 px-4 py-2 hover:bg-surface-container-high transition-colors text-sm text-left w-full text-on-surface"
            >
              <span className="material-symbols-outlined text-[18px] text-on-surface-variant">cleaning_services</span>
              Clear Chat
            </button>
            <div className="h-px bg-outline-variant/10 my-1 mx-2"></div>
            <button 
              onClick={() => toggleChatStateContextMenu('block', chatContextMenu.chat)}
              className="flex items-center gap-3 px-4 py-2 hover:bg-surface-container-high transition-colors text-sm text-left w-full text-on-surface"
            >
              <span className="material-symbols-outlined text-[18px] text-on-surface-variant">block</span>
              {chatContextMenu.chat.blockedBy?.includes(user?._id) ? 'Unblock User' : 'Block User'}
            </button>
            <button 
              onClick={() => toggleChatStateContextMenu('delete', chatContextMenu.chat)}
              className="flex items-center gap-3 px-4 py-2 hover:bg-error/10 transition-colors text-sm text-left w-full text-error"
            >
              <span className="material-symbols-outlined text-[18px]">delete</span>
              Delete Chat
            </button>
          </div>
        </>
      )}

      {/* Modals */}
      <ChatInfoModal 
        isOpen={chatInfoModalOpen} 
        onClose={() => setChatInfoModalOpen(false)} 
        chat={selectedChat} 
        user={user} 
        setPreviewMediaUrl={setPreviewMediaUrl}
        messages={messages}
        getSenderFull={getSenderFull} 
        getSender={getSender} 
        onAction={(action, payload) => {
          if (['clear', 'block', 'favorite'].includes(action)) {
            setChatInfoModalOpen(false);
            toggleChatStateContextMenu(action, selectedChat);
          } else if (action === 'theme') {
            handleThemeChange(payload);
          } else {
            console.log('Action handled internally:', action);
          }
        }} 
        onMessageJump={(msgId) => {
          const el = document.getElementById(`message-${msgId}`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            const container = el.closest('.max-w-\\[70\\%\\]') || el;
            container.classList.add('bg-primary/20', 'transition-colors', 'duration-500');
            setTimeout(() => {
              container.classList.remove('bg-primary/20');
            }, 2000);
          }
        }}
      />
      
      <ForwardMessageModal
        isOpen={!!forwardingMessage}
        onClose={() => setForwardingMessage(null)}
        message={forwardingMessage}
        chats={chats}
        user={user}
        getSenderFull={getSenderFull}
        getSender={getSender}
        onForward={executeForwardMessage}
      />

      {/* Message Actions Menu */}
      {msgActionMenu.visible && (
        <>
          <div className="fixed inset-0 z-[60]" onClick={() => setMsgActionMenu({ visible: false, message: null, x: 0, y: 0 })} onContextMenu={(e) => { e.preventDefault(); setMsgActionMenu({ visible: false, message: null, x: 0, y: 0 }); }}></div>
          <div 
            className="fixed z-[70] w-56 bg-surface-container-low border border-outline-variant/20 shadow-2xl rounded-xl py-2 flex flex-col animate-fade-in-up backdrop-blur-md"
            style={{ 
              top: Math.min(msgActionMenu.y, window.innerHeight - 300), 
              left: Math.min(msgActionMenu.x, window.innerWidth - 250) 
            }}
          >
            <button 
              onClick={() => handleMessageAction('copy', msgActionMenu.message)}
              className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface-container-high transition-colors text-sm text-left w-full text-on-surface"
            >
              <span className="material-symbols-outlined text-[18px]">content_copy</span>
              Copy Text
            </button>
            
            {msgActionMenu.message.sender._id === user?._id && (Date.now() - new Date(msgActionMenu.message.createdAt).getTime() <= 5 * 60 * 1000) && (
              <button 
                onClick={() => {
                  setEditingMessage(msgActionMenu.message);
                  setInputText(msgActionMenu.message.content);
                  setReplyingTo(null);
                  setMsgActionMenu({ visible: false, message: null, x: 0, y: 0 });
                  
                  // Focus the input field if possible
                  setTimeout(() => {
                    const input = document.getElementById('chat-input-field');
                    if (input) input.focus();
                  }, 50);
                }}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface-container-high transition-colors text-sm text-left w-full text-on-surface"
              >
                <span className="material-symbols-outlined text-[18px]">edit</span>
                Edit Message
              </button>
            )}

            <button 
              onClick={() => handleMessageAction('pin', msgActionMenu.message)}
              className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface-container-high transition-colors text-sm text-left w-full text-on-surface"
            >
              <span className={`material-symbols-outlined text-[18px] ${msgActionMenu.message.pinnedBy?.includes(user?._id) ? 'fill text-primary' : ''}`}>push_pin</span>
              {msgActionMenu.message.pinnedBy?.includes(user?._id) ? 'Unpin Message' : 'Pin Message'}
            </button>
            
            <button 
              onClick={() => handleMessageAction('star', msgActionMenu.message)}
              className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface-container-high transition-colors text-sm text-left w-full text-on-surface"
            >
              <span className={`material-symbols-outlined text-[18px] ${msgActionMenu.message.starredBy?.includes(user?._id) ? 'fill text-on-surface-variant' : 'text-on-surface-variant'}`}>star</span>
              {msgActionMenu.message.starredBy?.includes(user?._id) ? 'Unstar Message' : 'Star Message'}
            </button>

            <button 
              onClick={() => {
                setForwardingMessage(msgActionMenu.message);
                setMsgActionMenu({ visible: false, message: null, x: 0, y: 0 });
              }}
              className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface-container-high transition-colors text-sm text-left w-full text-on-surface"
            >
              <span className="material-symbols-outlined text-[18px]">forward</span>
              Forward Message
            </button>
            
            <div className="h-px bg-outline-variant/10 my-1 mx-2"></div>
            
            <button 
              onClick={() => handleMessageAction('delete', msgActionMenu.message)}
              className="flex items-center gap-3 px-4 py-2.5 hover:bg-error/10 transition-colors text-sm text-left w-full text-error"
            >
              <span className="material-symbols-outlined text-[18px]">delete</span>
              Delete For Me
            </button>

            {msgActionMenu.message.sender._id === user?._id && (Date.now() - new Date(msgActionMenu.message.createdAt).getTime() <= 5 * 60 * 1000) && (
              <button 
                onClick={() => handleMessageAction('delete-everyone', msgActionMenu.message)}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-error/10 transition-colors text-sm text-left w-full text-error font-medium"
              >
                <span className="material-symbols-outlined text-[18px]">delete_forever</span>
                Delete For Everyone
              </button>
            )}
          </div>
        </>
      )}

      <NewChatModal isOpen={isNewChatModalOpen} onClose={() => setIsNewChatModalOpen(false)} />
      
      <GenericModal 
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
        onConfirm={modalConfig.onConfirm}
        title={modalConfig.title}
        message={modalConfig.message}
        mode={modalConfig.mode}
        type={modalConfig.type}
        defaultValue={modalConfig.defaultValue}
      />

      {(activeCall || isReceivingCall) && (
        <CallModal 
          localStream={localStream}
          remoteStream={remoteStream}
          isReceivingCall={isReceivingCall}
          callerName={callerName}
          callerAvatar={callerAvatar}
          acceptCall={answerCall}
          declineCall={declineCall}
          endCall={endCall}
          isVideoCall={isVideoCall}
          toggleMute={toggleMute}
          toggleVideo={toggleVideo}
          isMuted={isMuted}
          isVideoOff={isVideoOff}
          isRemoteVideoOff={isRemoteVideoOff}
          callAccepted={callAccepted}
          callEnded={callEnded}
        />
      )}

      {/* Image Preview Modal */}
      {previewMediaUrl && (
        <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center animate-fade-in" onClick={() => setPreviewMediaUrl(null)}>
          <div className="absolute top-4 right-4 z-[201]">
             <button onClick={() => setPreviewMediaUrl(null)} className="w-10 h-10 bg-surface/20 hover:bg-surface/40 rounded-full flex items-center justify-center text-white transition-colors">
               <span className="material-symbols-outlined">close</span>
             </button>
          </div>
          <img src={previewMediaUrl} alt="Preview" className="max-w-[95vw] max-h-[90vh] object-contain rounded-xl shadow-2xl" onClick={e => e.stopPropagation()} />
        </div>
      )}

      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
        {notification.map(n => (
          <div key={`notif-${n._id}`} 
               className="pointer-events-auto bg-surface text-on-surface shadow-[0_4px_20px_rgba(0,0,0,0.15)] rounded-xl p-3 flex items-center gap-3 cursor-pointer border border-outline-variant/30 transition-all hover:scale-105 active:scale-95"
               onClick={() => {
                 handleChatSelect(n.chat);
               }}
          >
            <img src={n.sender.profilePicture || 'default.jpg'} alt="Avatar" className="w-10 h-10 rounded-full object-cover shadow-sm" />
            <div className="flex-1 min-w-[150px]">
              <p className="text-sm font-bold m-0">{n.sender.displayName}</p>
              <p className="text-xs text-on-surface-variant m-0 truncate max-w-[200px]">{n.content || (n.messageType === 'image' ? '📷 Image' : 'Attachment')}</p>
            </div>
            <button 
              className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-surface-variant text-on-surface-variant transition-colors ml-2"
              onClick={(e) => {
                e.stopPropagation();
                setNotification(prev => prev.filter(notif => notif._id !== n._id));
              }}
            >
              <span className="material-symbols-outlined text-[14px]">close</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default DashboardPage

import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ChatState } from '../context/ChatProvider';

function CallsPage() {
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = ChatState();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCalls = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        const { data } = await axios.get('/api/messages/calls/history', config);
        setCalls(data);
      } catch (error) {
        console.log('err fetch calls: ->', error);
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchCalls();
  }, [user]);

  const getOtherParticipant = (chat) => {
    if (!chat || !chat.participants) return null;
    return chat.participants.find(p => p._id !== user._id);
  };

  return (
    <div className="bg-background text-on-background h-screen w-screen overflow-hidden flex flex-col font-body">
      {/* Header */}
      <div className="bg-surface border-b border-outline-variant/10 p-4 flex items-center shadow-sm">
        <button 
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full hover:bg-surface-container-high flex items-center justify-center mr-4 transition-colors text-on-surface-variant"
        >
          <span className="material-symbols-outlined text-[24px]">arrow_back</span>
        </button>
        <h1 className="text-2xl font-bold font-display">Call History</h1>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 flex justify-center bg-surface-container-lowest">
        <div className="w-full max-w-3xl space-y-2">
          {loading ? (
            <div className="text-center py-10 text-on-surface-variant">Loading calls...</div>
          ) : calls.length === 0 ? (
            <div className="text-center py-20 text-on-surface-variant flex flex-col items-center">
              <span className="material-symbols-outlined text-6xl mb-4 opacity-50">call</span>
              <p className="text-lg">No recent calls</p>
            </div>
          ) : (
            calls.map(call => {
              const isOutgoing = call.sender._id === user._id;
              const isMissed = call.content.toLowerCase().includes('missed');
              const isDeclined = call.content.toLowerCase().includes('declined');
              const isVideo = call.content.toLowerCase().includes('video');
              const otherUser = isOutgoing ? getOtherParticipant(call.chat) : call.sender;
              
              if (!otherUser) return null;

              const avatar = otherUser.profilePicture || 'https://via.placeholder.com/150';
              const name = otherUser.displayName;
              const time = new Date(call.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
              
              let callIcon = isVideo ? 'videocam' : 'call';
              let callColor = 'text-primary';
              if (isMissed || isDeclined) {
                callIcon = isVideo ? 'videocam_off' : 'phone_missed';
                callColor = 'text-error';
              }

              return (
                <div key={call._id} className="bg-surface p-4 rounded-2xl flex items-center justify-between border border-outline-variant/10 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 bg-surface-variant">
                      <img src={avatar} alt={name} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <h3 className={`font-semibold text-lg leading-none mb-1 ${isMissed && !isOutgoing ? 'text-error' : 'text-on-surface'}`}>{name}</h3>
                      <div className="flex items-center gap-1 text-sm text-on-surface-variant">
                        <span className={`material-symbols-outlined text-[16px] ${isOutgoing ? 'text-green-500' : 'text-blue-500'}`}>
                          {isOutgoing ? 'call_made' : 'call_received'}
                        </span>
                        <span>{call.content}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-on-surface-variant hidden sm:inline-block">{time}</span>
                    <button 
                      onClick={() => navigate('/dashboard')}
                      className={`w-10 h-10 rounded-full bg-surface-container-high hover:bg-surface-variant flex items-center justify-center transition-colors ${callColor}`}
                      title="Call back (Go to chat)"
                    >
                      <span className="material-symbols-outlined text-[20px]">{isVideo ? 'videocam' : 'call'}</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export default CallsPage;

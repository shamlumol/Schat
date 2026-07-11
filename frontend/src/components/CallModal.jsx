import React, { useEffect, useRef } from 'react';

const CallModal = ({
  localStream,
  remoteStream,
  isReceivingCall,
  callerName,
  callerAvatar,
  acceptCall,
  declineCall,
  endCall,
  isVideoCall,
  toggleMute,
  toggleVideo,
  isMuted,
  isVideoOff,
  isRemoteVideoOff,
  callAccepted,
  callEnded
}) => {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const [callDuration, setCallDuration] = React.useState(0);

  useEffect(() => {
    let interval = null;
    if (callAccepted) {
      interval = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setCallDuration(0);
    }
    return () => clearInterval(interval);
  }, [callAccepted]);

  const formatDuration = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, isVideoOff]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, isRemoteVideoOff]); // Rerun if remote video toggles to ensure ref attaches

  // If receiving call but haven't accepted yet
  if (isReceivingCall && !callAccepted) {
    return (
      <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-surface-container rounded-[2rem] p-8 w-[320px] sm:w-[360px] shadow-2xl flex flex-col items-center border border-outline-variant/20 animate-in zoom-in duration-300">
          <div className="w-28 h-28 rounded-full overflow-hidden mb-6 border-[3px] border-primary shadow-[0_0_20px_rgba(var(--color-primary),0.3)] animate-pulse">
            <img src={callerAvatar || 'https://via.placeholder.com/150'} alt="caller" className="w-full h-full object-cover" />
          </div>
          <h2 className="text-2xl font-bold text-on-surface mb-1 tracking-tight truncate w-full text-center">{callerName}</h2>
          <p className="text-on-surface-variant mb-10 text-base font-medium whitespace-nowrap">
            Incoming {isVideoCall ? 'Video' : 'Audio'} Call...
          </p>
          
          <div className="flex gap-8 w-full justify-center">
            <button 
              onClick={declineCall}
              className="w-16 h-16 rounded-full bg-error text-white shadow-[0_4px_14px_rgba(220,38,38,0.4)] flex items-center justify-center hover:scale-105 transition-all"
            >
              <span className="material-symbols-outlined text-[32px]">call_end</span>
            </button>
            <button 
              onClick={acceptCall}
              className="w-16 h-16 rounded-full bg-green-500 text-white shadow-[0_4px_14px_rgba(34,197,94,0.4)] flex items-center justify-center hover:scale-105 transition-all animate-[bounce_2s_infinite]"
            >
              <span className="material-symbols-outlined text-[32px]">call</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // active call view (hacky fixed width for mobile)
  return (
    <div className="fixed inset-0 z-[100] bg-black text-white overflow-hidden flex flex-col">
      {/* Remote Video (Full Screen) */}
      <div className="absolute inset-0 bg-surface-container-highest flex items-center justify-center">
        {remoteStream && isVideoCall && !isRemoteVideoOff ? (
          <video 
            playsInline 
            ref={remoteVideoRef} 
            autoPlay 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center animate-in zoom-in duration-300">
            <div className="w-32 h-32 rounded-full overflow-hidden mb-4 border-4 border-surface-variant shadow-2xl">
               <img src={callerAvatar || 'https://via.placeholder.com/150'} alt="caller" className="w-full h-full object-cover" />
            </div>
            <h2 className="text-3xl font-bold">{callerName}</h2>
            <p className="text-on-surface-variant mt-2 text-lg">
              {!callAccepted ? 'Ringing...' : (
                <span className="font-mono text-primary font-medium tracking-wider">{formatDuration(callDuration)}</span>
              )}
            </p>
            {isVideoCall && isRemoteVideoOff && callAccepted && (
              <p className="text-sm text-on-surface-variant/70 mt-2 italic bg-black/40 px-3 py-1 rounded-full">
                Video Paused
              </p>
            )}
          </div>
        )}
      </div>

      {/* Video Call Active Timer Overlay */}
      {isVideoCall && callAccepted && (
        <div className="absolute top-6 left-6 bg-black/50 backdrop-blur-md px-4 py-1.5 rounded-full text-white font-mono text-sm shadow-lg z-20 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
          {formatDuration(callDuration)}
        </div>
      )}

      {/* Local Video (PIP) */}
      {isVideoCall && localStream && !isVideoOff && (
        <div className="absolute top-6 right-6 w-32 h-48 md:w-48 md:h-72 bg-black rounded-2xl overflow-hidden shadow-2xl border-2 border-surface-variant z-10">
          <video 
            playsInline 
            muted 
            ref={localVideoRef} 
            autoPlay 
            className="w-full h-full object-cover scale-x-[-1]" 
          />
        </div>
      )}

      {/* Controls Overlay */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-surface/30 backdrop-blur-xl border border-white/10 rounded-full px-6 py-4 flex items-center gap-6 shadow-2xl z-20">
        <button 
          onClick={toggleMute}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isMuted ? 'bg-error text-white' : 'bg-white/20 hover:bg-white/30 text-white'}`}
        >
          <span className="material-symbols-outlined text-[24px]">
            {isMuted ? 'mic_off' : 'mic'}
          </span>
        </button>
        
        {isVideoCall && (
          <button 
            onClick={toggleVideo}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isVideoOff ? 'bg-error text-white' : 'bg-white/20 hover:bg-white/30 text-white'}`}
          >
            <span className="material-symbols-outlined text-[24px]">
              {isVideoOff ? 'videocam_off' : 'videocam'}
            </span>
          </button>
        )}

        <button 
          onClick={endCall}
          className="w-14 h-14 rounded-full bg-error text-white shadow-lg flex items-center justify-center hover:scale-105 transition-transform"
        >
          <span className="material-symbols-outlined text-[28px]">call_end</span>
        </button>
      </div>
    </div>
  );
};

export default CallModal;

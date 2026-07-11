import { useState, useRef, useEffect } from 'react';

export const useWebRTC = (socket, user, onCallEnded) => {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isReceivingCall, setIsReceivingCall] = useState(false);
  const [callerName, setCallerName] = useState('');
  const [callerAvatar, setCallerAvatar] = useState('');
  const [callerSignal, setCallerSignal] = useState(null);
  const [callerId, setCallerId] = useState('');
  const [callTargetId, setCallTargetId] = useState('');
  const [callAccepted, setCallAccepted] = useState(false);
  const [callEnded, setCallEnded] = useState(false);
  const [isVideoCall, setIsVideoCall] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isRemoteVideoOff, setIsRemoteVideoOff] = useState(false);
  const [activeCall, setActiveCall] = useState(false);
  const [callStartTime, setCallStartTime] = useState(null);

  const connectionRef = useRef(null);

  useEffect(() => {
    if (!socket) return;

    const handleIncomingCall = (data) => {
      setIsReceivingCall(true);
      setCallerId(data.from);
      setCallerName(data.callerName);
      setCallerAvatar(data.callerAvatar);
      setCallerSignal(data.signal);
      setIsVideoCall(data.isVideoCall);
      setActiveCall(true);
      setCallEnded(false);
    };

    const handleCallEnded = () => {
      cleanupCall(false);
    };

    const handleVideoStatusChange = (status) => {
      setIsRemoteVideoOff(status);
    };

    socket.on('incoming_call', handleIncomingCall);
    socket.on('call_ended', handleCallEnded);
    socket.on('video_status_change', handleVideoStatusChange);

    return () => {
      socket.off('incoming_call', handleIncomingCall);
      socket.off('call_ended', handleCallEnded);
      socket.off('video_status_change', handleVideoStatusChange);
    };
  }, [socket]);

  const getMediaStream = async (video) => {
    if (!navigator.mediaDevices) {
      alert("Media devices not supported. Please ensure you are using HTTPS or localhost.");
      return null;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video, audio: true });
      setLocalStream(stream);
      return stream;
    } catch (err) {
      console.log("err get local stream: ->", err);
      alert("Failed to access camera/microphone. Please check browser permissions.");
      return null;
    }
  };

  const createPeerConnection = (targetUserId, stream) => {
    const peer = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:global.stun.twilio.com:3478' }
      ]
    });

    stream.getTracks().forEach(track => {
      peer.addTrack(track, stream);
    });

    peer.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
    };

    peer.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('ice_candidate', {
          to: targetUserId,
          candidate: event.candidate
        });
      }
    };

    return peer;
  };

  const callUser = async (targetUserId, targetUserName, targetUserAvatar, video = true) => {
    const stream = await getMediaStream(video);
    if (!stream) return;

    setIsVideoCall(video);
    setActiveCall(true);
    setCallTargetId(targetUserId);
    setCallerName(targetUserName);
    setCallerAvatar(targetUserAvatar);
    setCallEnded(false);

    const peer = createPeerConnection(targetUserId, stream);
    connectionRef.current = peer;

    // We are the caller, we need to handle the answer and incoming ICE candidates
    const handleCallAccepted = async (signal) => {
      setCallAccepted(true);
      setCallStartTime(Date.now());
      await peer.setRemoteDescription(new RTCSessionDescription(signal));
    };

    const handleIceCandidate = async (candidate) => {
      try {
        await peer.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) {
        console.log('Error adding received ice candidate', e);
      }
    };

    socket.on('call_accepted', handleCallAccepted);
    socket.on('ice_candidate', handleIceCandidate);

    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);

    socket.emit('call_user', {
      userToCall: targetUserId,
      signalData: offer,
      from: user._id,
      callerName: user.displayName,
      callerAvatar: user.profilePicture,
      isVideoCall: video
    });
  };

  const answerCall = async () => {
    setCallAccepted(true);
    setCallStartTime(Date.now());
    const stream = await getMediaStream(isVideoCall);
    if (!stream) {
      cleanupCall(true);
      return;
    }

    const peer = createPeerConnection(callerId, stream);
    connectionRef.current = peer;

    const handleIceCandidate = async (candidate) => {
      try {
        await peer.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) {
        console.log('Error adding received ice candidate', e);
      }
    };

    socket.on('ice_candidate', handleIceCandidate);

    await peer.setRemoteDescription(new RTCSessionDescription(callerSignal));
    const answer = await peer.createAnswer();
    await peer.setLocalDescription(answer);

    socket.emit('answer_call', { signal: answer, to: callerId });
  };

  const cleanupCall = (emitEnd = true, isDeclining = false) => {
    let callLogMessage = '';
    
    if (activeCall) {
      if (callAccepted && callStartTime) {
        const durationSeconds = Math.floor((Date.now() - callStartTime) / 1000);
        const m = Math.floor(durationSeconds / 60).toString().padStart(2, '0');
        const s = (durationSeconds % 60).toString().padStart(2, '0');
        callLogMessage = `${isVideoCall ? 'Video' : 'Audio'} call ended (${m}:${s})`;
      } else if (isDeclining) {
        callLogMessage = `Declined ${isVideoCall ? 'video' : 'audio'} call`;
      } else {
        callLogMessage = `Missed ${isVideoCall ? 'video' : 'audio'} call`;
      }
    }

    if (emitEnd && activeCall) {
      const toId = isReceivingCall ? callerId : callTargetId;
      if (toId) {
        socket.emit('end_call', { to: toId });
      }
    }

    setCallEnded(true);
    setCallAccepted(false);
    setIsReceivingCall(false);
    setActiveCall(false);
    setCallerName('');
    setCallerAvatar('');
    setCallerSignal(null);
    setCallerId('');
    setCallTargetId('');
    setCallStartTime(null);
    setIsRemoteVideoOff(false);
    
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    setRemoteStream(null);

    if (connectionRef.current) {
      connectionRef.current.close();
      connectionRef.current = null;
    }

    socket.off('call_accepted');
    socket.off('ice_candidate');

    if (callLogMessage && onCallEnded) {
      onCallEnded(callLogMessage);
    }

    return callLogMessage;
  };

  const toggleMute = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        const newVideoOffStatus = !videoTrack.enabled;
        setIsVideoOff(newVideoOffStatus);
        
        const toId = isReceivingCall ? callerId : callTargetId;
        if (toId) {
          socket.emit('video_status_change', { to: toId, isVideoOff: newVideoOffStatus });
        }
      }
    }
  };

  return {
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
    endCall: () => cleanupCall(true, false),
    declineCall: () => cleanupCall(true, true),
    cleanupCall,
    toggleMute,
    toggleVideo
  };
};

import React, { useState, useEffect, useRef } from 'react';

const AudioPlayer = ({ src }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const setAudioData = () => {
      if (audio.duration === Infinity) {
        // Fix for Chrome webm duration bug
        audio.currentTime = 1e101;
        const updateDur = () => {
          setDuration(audio.duration);
          audio.currentTime = 0;
          audio.removeEventListener('timeupdate', updateDur);
        };
        audio.addEventListener('timeupdate', updateDur);
      } else {
        setDuration(audio.duration);
      }
    };

    const setAudioTime = () => {
      setCurrentTime(audio.currentTime);
    };

    const onAudioEnd = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    // Force load metadata
    audio.addEventListener('loadedmetadata', setAudioData);
    audio.addEventListener('timeupdate', setAudioTime);
    audio.addEventListener('ended', onAudioEnd);

    // If metadata already loaded before useEffect
    if (audio.readyState >= 1) {
      setAudioData();
    }

    return () => {
      audio.removeEventListener('loadedmetadata', setAudioData);
      audio.removeEventListener('timeupdate', setAudioTime);
      audio.removeEventListener('ended', onAudioEnd);
    };
  }, []);

  // Use original src. Cloudinary might serve webm as raw which breaks mp4 transcode.
  const safeSrc = src;

  const togglePlayPause = () => {
    const prevValue = isPlaying;
    setIsPlaying(!prevValue);
    if (!prevValue) {
      audioRef.current.play();
    } else {
      audioRef.current.pause();
    }
  };

  const handleSeek = (e) => {
    const newTime = (e.nativeEvent.offsetX / e.currentTarget.offsetWidth) * duration;
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (time) => {
    if (isNaN(time) || !isFinite(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  return (
    <div className="flex items-center gap-3 p-1 min-w-[200px]">
      <audio ref={audioRef} src={safeSrc} preload="metadata" />
      
      <button 
        onClick={togglePlayPause} 
        className="w-8 h-8 flex-shrink-0 bg-primary/20 text-primary rounded-full flex items-center justify-center hover:bg-primary/30 transition-colors"
      >
        <span className="material-symbols-outlined text-[18px]">
          {isPlaying ? 'pause' : 'play_arrow'}
        </span>
      </button>

      <div className="flex-1 flex flex-col justify-center min-w-0 pt-1">
        <div 
          className="h-1.5 bg-outline-variant/30 rounded-full relative cursor-pointer overflow-hidden" 
          onClick={handleSeek}
        >
          <div 
            className="absolute top-0 left-0 h-full bg-primary transition-all duration-75"
            style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
          />
        </div>
        <div className="flex justify-between items-center mt-1">
          <span className="text-[9px] font-mono font-medium text-on-surface-variant">{formatTime(currentTime)}</span>
          <span className="text-[9px] font-mono font-medium text-on-surface-variant">{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
};

export default AudioPlayer;

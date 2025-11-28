import React, { createContext, useContext, useState, useRef } from 'react';

const FloatingPlayerContext = createContext();

export const FloatingPlayerProvider = ({ children }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [streamData, setStreamData] = useState(null);
  const [rtcEngine, setRtcEngine] = useState(null);
  const [remoteUid, setRemoteUid] = useState(null);
  const [streamEnded, setStreamEnded] = useState(false);

  const showFloatingPlayer = (data, engine, uid) => {
    console.log('[FloatingPlayer] Showing with data:', data);
    console.log('[FloatingPlayer] Engine:', engine ? 'Present' : 'Missing');
    console.log('[FloatingPlayer] RemoteUid:', uid);
    setStreamData(data);
    setRtcEngine(engine);
    setRemoteUid(uid);
    setStreamEnded(false);
    setIsVisible(true);
    setIsMinimized(true);
  };

  const hideFloatingPlayer = () => {
    console.log('[FloatingPlayer] Hiding and cleaning up');
    
    // Clean up RTC engine if stream has ended
    if (streamEnded && rtcEngine) {
      try {
        console.log('[FloatingPlayer] Cleaning up RTC engine');
        rtcEngine.leaveChannel();
        rtcEngine.unregisterEventHandler();
        rtcEngine.release();
      } catch (err) {
        console.warn('[FloatingPlayer] Error cleaning up RTC engine:', err);
      }
    }
    
    setIsVisible(false);
    setIsMinimized(false);
    setStreamData(null);
    setRtcEngine(null);
    setRemoteUid(null);
    setStreamEnded(false);
  };

  const markStreamEnded = () => {
    console.log('[FloatingPlayer] Stream ended');
    setStreamEnded(true);
    setRemoteUid(null);
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  const value = {
    isVisible,
    isMinimized,
    streamData,
    rtcEngine,
    remoteUid,
    streamEnded,
    showFloatingPlayer,
    hideFloatingPlayer,
    toggleMinimize,
    markStreamEnded,
  };

  return (
    <FloatingPlayerContext.Provider value={value}>
      {children}
    </FloatingPlayerContext.Provider>
  );
};

export const useFloatingPlayer = () => {
  const context = useContext(FloatingPlayerContext);
  if (!context) {
    throw new Error('useFloatingPlayer must be used within FloatingPlayerProvider');
  }
  return context;
};


import { useState, useRef, useCallback, useEffect } from 'react';
import { io } from 'socket.io-client';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export default function useWebRTC(socket, userId) {
  const [callState, setCallState] = useState('idle'); // idle | calling | ringing | connected | ended
  const [remoteStream, setRemoteStream] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  const peerRef = useRef(null);
  const targetUserRef = useRef(null);
  const timerRef = useRef(null);

  // Start call timer
  const startTimer = () => {
    setCallDuration(0);
    timerRef.current = setInterval(() => {
      setCallDuration((d) => d + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  // Get local media stream
  const getLocalMedia = async (video = false) => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video });
    setLocalStream(stream);
    return stream;
  };

  // Create peer connection
  const createPeerConnection = (stream) => {
    const pc = new RTCPeerConnection(ICE_SERVERS);

    stream.getTracks().forEach((track) => pc.addTrack(track, stream));

    pc.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
    };

    pc.onicecandidate = (event) => {
      if (event.candidate && socket && targetUserRef.current) {
        socket.emit('call:ice-candidate', {
          targetUserId: targetUserRef.current,
          candidate: event.candidate,
        });
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') {
        setCallState('connected');
        startTimer();
      }
      if (['disconnected', 'failed', 'closed'].includes(pc.connectionState)) {
        endCall();
      }
    };

    peerRef.current = pc;
    return pc;
  };

  // Initiate a call
  const startCall = useCallback(async (targetUserId, callerInfo = {}) => {
    try {
      targetUserRef.current = targetUserId;
      setCallState('calling');

      const stream = await getLocalMedia();
      const pc = createPeerConnection(stream);

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socket.emit('call:initiate', {
        targetUserId,
        offer: pc.localDescription,
        callerInfo,
      });
    } catch (err) {
      console.error('Failed to start call:', err);
      setCallState('idle');
    }
  }, [socket]);

  // Answer incoming call
  const answerCall = useCallback(async () => {
    if (!incomingCall) return;

    try {
      targetUserRef.current = incomingCall.callerInfo?.userId;
      setCallState('connected');

      const stream = await getLocalMedia();
      const pc = createPeerConnection(stream);

      await pc.setRemoteDescription(new RTCSessionDescription(incomingCall.offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit('call:answer', {
        callerUserId: incomingCall.callerInfo?.userId,
        answer: pc.localDescription,
      });

      setIncomingCall(null);
      startTimer();
    } catch (err) {
      console.error('Failed to answer call:', err);
      setCallState('idle');
    }
  }, [incomingCall, socket]);

  // Reject incoming call
  const rejectCall = useCallback(() => {
    if (incomingCall) {
      socket.emit('call:reject', { callerUserId: incomingCall.callerInfo?.userId });
      setIncomingCall(null);
      setCallState('idle');
    }
  }, [incomingCall, socket]);

  // End call
  const endCall = useCallback(() => {
    if (targetUserRef.current && socket) {
      socket.emit('call:end', { targetUserId: targetUserRef.current });
    }

    // Cleanup
    if (peerRef.current) {
      peerRef.current.close();
      peerRef.current = null;
    }
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
      setLocalStream(null);
    }
    setRemoteStream(null);
    setCallState('idle');
    setIsMuted(false);
    targetUserRef.current = null;
    stopTimer();
  }, [localStream, socket]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  }, [localStream]);

  // Listen for socket events
  useEffect(() => {
    if (!socket) return;

    socket.on('call:incoming', (data) => {
      setIncomingCall(data);
      setCallState('ringing');
    });

    socket.on('call:answered', async ({ answer }) => {
      if (peerRef.current) {
        await peerRef.current.setRemoteDescription(new RTCSessionDescription(answer));
      }
    });

    socket.on('call:ice-candidate', async ({ candidate }) => {
      if (peerRef.current) {
        await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      }
    });

    socket.on('call:rejected', () => {
      endCall();
    });

    socket.on('call:ended', () => {
      endCall();
    });

    socket.on('call:user-offline', () => {
      setCallState('idle');
    });

    return () => {
      socket.off('call:incoming');
      socket.off('call:answered');
      socket.off('call:ice-candidate');
      socket.off('call:rejected');
      socket.off('call:ended');
      socket.off('call:user-offline');
    };
  }, [socket, endCall]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      endCall();
      stopTimer();
    };
  }, []);

  return {
    callState,
    localStream,
    remoteStream,
    incomingCall,
    isMuted,
    callDuration,
    startCall,
    answerCall,
    rejectCall,
    endCall,
    toggleMute,
  };
}

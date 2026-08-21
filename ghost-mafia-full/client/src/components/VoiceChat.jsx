import { useState, useRef, useEffect } from 'react';
import { getSocket } from '../api/socket';

/**
 * VoiceChat — WebRTC mesh voice via socket signaling.
 * Each peer opens an offer/answer with every other peer.
 * Works in small rooms (8–20 players); for larger scale use SFU.
 */
export default function VoiceChat({ code, players }) {
  const [enabled, setEnabled] = useState(false);
  const [muted, setMuted] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const streamRef = useRef(null);
  const peers = useRef({}); // socketId -> RTCPeerConnection
  const socket = getSocket();

  const cleanup = () => {
    Object.values(peers.current).forEach((pc) => pc.close());
    peers.current = {};
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  };

  const createPeer = (targetId, initiator) => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }],
    });
    if (streamRef.current) streamRef.current.getTracks().forEach((t) => pc.addTrack(t, streamRef.current));
    pc.onicecandidate = (e) => { if (e.candidate) socket.emit('voice:ice', { to: targetId, candidate: e.candidate }); };
    pc.ontrack = (e) => {
      let audio = document.getElementById(`voice-${targetId}`);
      if (!audio) { audio = document.createElement('audio'); audio.id = `voice-${targetId}`; audio.autoplay = true; document.body.appendChild(audio); }
      audio.srcObject = e.streams[0];
    };
    if (initiator) {
      pc.createOffer().then((o) => pc.setLocalDescription(o)).then(() => {
        socket.emit('voice:offer', { to: targetId, sdp: pc.localDescription });
      });
    }
    peers.current[targetId] = pc;
    return pc;
  };

  useEffect(() => {
    if (!enabled) return;
    socket.on('voice:offer', async ({ from, sdp }) => {
      const pc = createPeer(from, false);
      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit('voice:answer', { to: from, sdp: pc.localDescription });
    });
    socket.on('voice:answer', async ({ from, sdp }) => {
      const pc = peers.current[from];
      if (pc) await pc.setRemoteDescription(new RTCSessionDescription(sdp));
    });
    socket.on('voice:ice', async ({ from, candidate }) => {
      const pc = peers.current[from];
      if (pc) await pc.addIceCandidate(new RTCIceCandidate(candidate));
    });
    socket.on('voice:userJoined', ({ socketId }) => createPeer(socketId, true));
    socket.on('voice:userLeft', ({ socketId }) => {
      peers.current[socketId]?.close();
      delete peers.current[socketId];
      document.getElementById(`voice-${socketId}`)?.remove();
    });
    return () => {
      socket.off('voice:offer'); socket.off('voice:answer');
      socket.off('voice:ice'); socket.off('voice:userJoined'); socket.off('voice:userLeft');
    };
  }, [enabled]);

  // Voice activity detection
  useEffect(() => {
    if (!enabled || !streamRef.current) return;
    const ctx = new AudioContext();
    const src = ctx.createMediaStreamSource(streamRef.current);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    src.connect(analyser);
    const data = new Uint8Array(analyser.frequencyBinCount);
    let raf;
    const detect = () => {
      analyser.getByteFrequencyData(data);
      const avg = data.reduce((a, b) => a + b, 0) / data.length;
      setSpeaking(avg > 12);
      raf = requestAnimationFrame(detect);
    };
    detect();
    return () => { cancelAnimationFrame(raf); ctx.close(); };
  }, [enabled]);

  const startVoice = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      streamRef.current = stream;
      setEnabled(true);
      socket.emit('voice:join', { code });
    } catch {
      alert('Mikrofonga ruxsat bering (brauzer sozlamalaridan).');
    }
  };

  const stopVoice = () => {
    setEnabled(false);
    socket.emit('voice:leave', { code });
    cleanup();
  };

  const toggleMute = () => {
    if (!streamRef.current) return;
    streamRef.current.getAudioTracks().forEach((t) => { t.enabled = muted; });
    setMuted((m) => !m);
  };

  return (
    <div className="glass rounded-xl p-3 flex items-center gap-3">
      <span className={`text-xl transition-transform ${speaking && enabled ? 'scale-125' : ''}`}>🎤</span>
      {!enabled ? (
        <button onClick={startVoice} className="flex-1 text-xs py-2 rounded-lg bg-neon-blue/20 text-neon-blue hover:bg-neon-blue/30 transition">
          Ovozli chat qo'shilish
        </button>
      ) : (
        <>
          <button onClick={toggleMute} className={`flex-1 text-xs py-2 rounded-lg transition ${muted ? 'bg-neon-red/20 text-neon-red' : 'bg-green-900/30 text-green-400'}`}>
            {muted ? '🔇 Ovoz o\'chirilgan' : '🔊 Ovoz yoqiq'}
          </button>
          <button onClick={stopVoice} className="text-xs px-2 py-2 rounded-lg glass text-mist hover:text-neon-red transition">
            Chiqish
          </button>
        </>
      )}
    </div>
  );
}

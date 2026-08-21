import { useEffect, useRef, useState, useCallback } from 'react';
import { getSocket } from '../api/socket';
import { useAuth } from '../context/AuthContext';

export function useRoom(code) {
  const { user } = useAuth();
  const socket = getSocket();
  const [players, setPlayers] = useState([]);
  const [gameState, setGameState] = useState(null); // publicState
  const [myRole, setMyRole] = useState(null);       // { role, label, emoji, team }
  const [mafiaTeam, setMafiaTeam] = useState([]);
  const [votes, setVotes] = useState({});
  const [timer, setTimer] = useState(null);
  const [messages, setMessages] = useState([]);     // all channels array
  const [kicked, setKicked] = useState(false);
  const [gameResult, setGameResult] = useState(null);

  const addMsg = useCallback((msg) => {
    setMessages((prev) => [...prev.slice(-200), { ...msg, id: Date.now() + Math.random() }]);
  }, []);

  useEffect(() => {
    if (!code) return;
    if (!socket.connected) socket.connect();

    socket.emit('room:join', { code });

    socket.on('room:players', setPlayers);
    socket.on('game:state', setGameState);
    socket.on('game:yourRole', setMyRole);
    socket.on('game:mafiaTeam', ({ teammates }) => setMafiaTeam(teammates));
    socket.on('game:votes', setVotes);
    socket.on('game:timer', ({ seconds }) => setTimer(seconds));
    socket.on('game:ended', setGameResult);
    socket.on('chat:message', addMsg);
    socket.on('admin:kicked', () => setKicked(true));

    return () => {
      socket.emit('room:leave', { code });
      socket.off('room:players', setPlayers);
      socket.off('game:state', setGameState);
      socket.off('game:yourRole', setMyRole);
      socket.off('game:mafiaTeam');
      socket.off('game:votes', setVotes);
      socket.off('game:timer');
      socket.off('game:ended', setGameResult);
      socket.off('chat:message', addMsg);
      socket.off('admin:kicked');
    };
  }, [code]);

  const startGame = useCallback(() => socket.emit('game:start', { code }), [code]);
  const sendAction = useCallback((action, target) => socket.emit('game:action', { code, action, target }), [code]);
  const sendVote = useCallback((target) => socket.emit('game:vote', { code, target }), [code]);
  const sniperShot = useCallback((target) => socket.emit('game:sniperShot', { code, target }), [code]);
  const sendChat = useCallback((channel, text) => socket.emit('chat:send', { code, channel, text }), [code]);
  const kickPlayer = useCallback((target) => socket.emit('admin:kick', { code, target }), [code]);
  const mutePlayer = useCallback((target) => socket.emit('admin:mute', { code, target }), [code]);
  const setRoleConfig = useCallback((config) => socket.emit('admin:setRoleConfig', { code, config }), [code]);

  const isHost = players.length > 0 && players[0]?.username === user?.username;
  const me = players.find((p) => p.username === user?.username);

  return {
    players, gameState, myRole, mafiaTeam, votes, timer,
    messages, kicked, gameResult,
    isHost, me,
    startGame, sendAction, sendVote, sniperShot, sendChat, kickPlayer, mutePlayer, setRoleConfig,
  };
}

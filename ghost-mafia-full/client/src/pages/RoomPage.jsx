import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRoom } from '../hooks/useRoom';
import { useAuth } from '../context/AuthContext';
import NavBar from '../components/NavBar';
import PlayerCard from '../components/PlayerCard';
import ChatPanel from '../components/ChatPanel';
import PhaseBanner from '../components/PhaseBanner';
import RoleCard from '../components/RoleCard';
import VoiceChat from '../components/VoiceChat';
import AdminPanel from '../components/AdminPanel';
import GameResult from '../components/GameResult';

export default function RoomPage() {
  const { code } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sidebar, setSidebar] = useState('chat'); // 'chat' | 'admin'
  const [myAction, setMyAction] = useState(null);

  const {
    players, gameState, myRole, mafiaTeam, votes, timer,
    messages, kicked, gameResult,
    isHost, me,
    startGame, sendAction, sendVote, sniperShot, sendChat,
    kickPlayer, mutePlayer, setRoleConfig,
  } = useRoom(code);

  const phase = gameState?.phase || 'lobby';

  // Kicked redirect
  if (kicked) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center px-4">
        <div className="glass rounded-2xl p-10 glow-red">
          <span className="text-4xl block mb-4">👢</span>
          <h2 className="font-display text-xl text-neon-red mb-2">Chiqarildi</h2>
          <p className="text-mist mb-6">Admin seni xonadan chiqardi.</p>
          <button onClick={() => navigate('/lobby')} className="px-6 py-2.5 rounded-xl glass text-bone">
            Lobbyga qaytish
          </button>
        </div>
      </div>
    );
  }

  // ── What actions can current player take? ────────────────────────────────
  const canAct = me?.isAlive && phase === 'night' && ['mafia','don','detective','doctor','bodyguard'].includes(myRole?.role);
  const canVote = me?.isAlive && phase === 'voting';
  const canSnipe = me?.isAlive && phase === 'day' && myRole?.role === 'sniper';
  const hasVoted = votes[user?.username];

  const handleTarget = (target) => {
    if (canAct) { sendAction(myRole.role, target); setMyAction(target); }
    else if (canVote) { sendVote(target); setMyAction(target); }
    else if (canSnipe) { sniperShot(target); setMyAction(target); }
  };

  const canTarget = (canAct || canVote || canSnipe);

  // Count votes per player
  const voteCounts = {};
  Object.values(votes).forEach((v) => { voteCounts[v] = (voteCounts[v] || 0) + 1; });

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />

      {gameResult && (
        <GameResult result={gameResult} onPlayAgain={() => navigate('/lobby')} />
      )}

      <main className="flex-1 max-w-7xl mx-auto w-full px-3 sm:px-6 py-4 flex flex-col gap-4 min-h-0">

        {/* Top bar */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="glass rounded-xl px-3 py-2">
            <span className="text-xs text-mist">Kod: </span>
            <span className="font-display text-neon-blue text-sm tracking-widest">{code}</span>
          </div>
          <PhaseBanner phase={phase} dayCount={gameState?.dayCount} timer={timer} />
          <div className="ml-auto flex gap-2">
            {isHost && phase === 'lobby' && (
              <button
                onClick={startGame}
                disabled={players.length < 4}
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-neon-red to-neon-red-dim text-bone glow-red hover:brightness-110 disabled:opacity-40 transition"
              >
                🚀 O'yinni boshlash
              </button>
            )}
            <button
              onClick={() => navigate('/lobby')}
              className="px-3 py-2 rounded-xl glass text-mist hover:text-neon-red text-sm transition"
            >
              ← Chiqish
            </button>
          </div>
        </div>

        <div className="flex-1 grid lg:grid-cols-[1fr_320px] gap-4 min-h-0">
          {/* Left – game area */}
          <div className="flex flex-col gap-4 min-h-0">

            {/* My role card (night/day only) */}
            {myRole && phase !== 'lobby' && (
              <RoleCard myRole={myRole} mafiaTeam={mafiaTeam} />
            )}

            {/* Action prompts */}
            <AnimatePresence>
              {canTarget && !myAction && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="glass rounded-xl px-4 py-3 border border-neon-red/30"
                >
                  <p className="text-sm text-neon-red">
                    {canAct && '🌙 Nishon tanlang — o\'yinchi kartasiga bosing.'}
                    {canVote && '🗳️ Kim osılishi kerak? Tanlang!'}
                    {canSnipe && '🎯 Snipper! Kunduzi bir marta o\'q uzishingiz mumkin.'}
                  </p>
                </motion.div>
              )}
              {myAction && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass rounded-xl px-4 py-2 border border-neon-blue/30"
                >
                  <p className="text-sm text-neon-blue">✓ Nishon: <strong>{myAction}</strong></p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Players grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
              {players.map((p) => (
                <PlayerCard
                  key={p.username}
                  player={p}
                  myRole={myRole}
                  isMe={p.username === user?.username}
                  canTarget={canTarget && p.username !== user?.username && p.isAlive}
                  onTarget={handleTarget}
                  voted={!!votes[user?.username] && votes[user?.username] === p.username}
                  voteCount={voteCounts[p.username] || 0}
                  isMuted={p.isMuted}
                  isAdmin={isHost}
                  onKick={kickPlayer}
                  onMute={mutePlayer}
                />
              ))}
              {players.length === 0 && (
                <div className="col-span-full text-center text-mist py-10 text-sm">
                  O'yinchilar kutilmoqda... Do'stlaringizni kod orqali taklif qiling.
                </div>
              )}
            </div>

            {/* Lobby: waiting for host */}
            {phase === 'lobby' && !isHost && players.length > 0 && (
              <div className="text-center text-mist text-sm glass rounded-xl p-4">
                🎮 Host o'yinni boshlashini kuting...
                <br />
                <span className="text-xs opacity-60">Kamida 4 o'yinchi kerak ({players.length}/4)</span>
              </div>
            )}

            {/* Voice chat */}
            {phase !== 'lobby' && (
              <VoiceChat code={code} players={players} />
            )}
          </div>

          {/* Right – sidebar */}
          <div className="flex flex-col gap-3 min-h-0 max-h-[calc(100vh-12rem)]">
            {isHost && (
              <div className="flex glass rounded-xl overflow-hidden">
                {[['chat','💬 Chat'],['admin','⚙️ Admin']].map(([id, label]) => (
                  <button key={id} onClick={() => setSidebar(id)}
                    className={`flex-1 py-2 text-xs font-medium transition ${sidebar === id ? 'bg-neon-blue/20 text-neon-blue' : 'text-mist'}`}>
                    {label}
                  </button>
                ))}
              </div>
            )}

            {(sidebar === 'admin' && isHost) ? (
              <AdminPanel players={players} onRoleConfig={setRoleConfig} onKick={kickPlayer} onMute={mutePlayer} />
            ) : (
              <ChatPanel messages={messages} onSend={sendChat} myDead={me && !me.isAlive} />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

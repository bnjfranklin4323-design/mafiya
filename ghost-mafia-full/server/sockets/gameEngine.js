'use strict';
/**
 * Ghost Mafia — Game Engine
 * ─────────────────────────
 * Rollar:
 *   mafia      – kechasi odam o'ldiradi
 *   don        – mafia rahbari, detektivga ko'rinmaydi
 *   detective  – kechasi bir kishini tekshiradi (mafia yoki yo'q)
 *   doctor     – kechasi bir kishini qutqaradi
 *   sniper     – kunduzi bir marta o'q uzadi (mafia bo'lsa o'ladi, aks holda sniper o'ladi)
 *   bodyguard  – kechasi bir kishini himoya qiladi (mafia keladigan bo'lsa bodyguard o'ladi)
 *   joker      – agar osishda tanlansa — hamma yutqazadi
 *   maniac     – yolg'iz o'yinchi, hamma o'ldirilsa yutadi
 *   civilian   – ovoz berish orqali mafialni topadi
 */

const ROLES = {
  mafia:     { team: 'mafia',    label: 'Mafia',      emoji: '🔫' },
  don:       { team: 'mafia',    label: 'Don',         emoji: '🎩' },
  detective: { team: 'civilian', label: 'Detektiv',    emoji: '🔍' },
  doctor:    { team: 'civilian', label: 'Doktor',      emoji: '🩺' },
  sniper:    { team: 'civilian', label: 'Snipper',     emoji: '🎯' },
  bodyguard: { team: 'civilian', label: 'Qo\'riqchi',  emoji: '🛡️' },
  joker:     { team: 'neutral',  label: 'Joker',       emoji: '🃏' },
  maniac:    { team: 'neutral',  label: 'Maniac',      emoji: '🔪' },
  civilian:  { team: 'civilian', label: 'Tinch fuqaro',emoji: '🕯️' },
};

/**
 * playerCount → default role list
 * Returns array of role-strings (not shuffled)
 */
function buildRoleList(playerCount, config = {}) {
  const n = playerCount;
  const mafiaCount  = config.mafia     ?? Math.max(1, Math.floor(n / 4));
  const donCount    = config.don       ?? (n >= 10 ? 1 : 0);
  const detectiveN  = config.detective ?? 1;
  const doctorN     = config.doctor    ?? 1;
  const sniperN     = config.sniper    ?? 0;
  const bodyguardN  = config.bodyguard ?? 0;
  const jokerN      = config.joker     ?? (n >= 12 ? 1 : 0);
  const maniacN     = config.maniac    ?? 0;

  const special = [
    ...Array(mafiaCount).fill('mafia'),
    ...Array(donCount).fill('don'),
    ...Array(detectiveN).fill('detective'),
    ...Array(doctorN).fill('doctor'),
    ...Array(sniperN).fill('sniper'),
    ...Array(bodyguardN).fill('bodyguard'),
    ...Array(jokerN).fill('joker'),
    ...Array(maniacN).fill('maniac'),
  ];
  const civilianCount = Math.max(0, n - special.length);
  return [...special, ...Array(civilianCount).fill('civilian')];
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function assignRoles(players, roleConfig) {
  const roleList = shuffle(buildRoleList(players.length, roleConfig));
  return players.map((p, i) => ({ ...p, role: roleList[i], isAlive: true }));
}

// ─── Win-condition check ────────────────────────────────────────────────────
function checkWinner(players) {
  const alive = players.filter((p) => p.isAlive);
  const mafiaAlive = alive.filter((p) => ['mafia', 'don'].includes(p.role));
  const civilianAlive = alive.filter((p) => ['civilian', 'detective', 'doctor', 'sniper', 'bodyguard'].includes(p.role));
  const maniacAlive = alive.filter((p) => p.role === 'maniac');

  // Maniac wins alone
  if (maniacAlive.length > 0 && alive.length === 1) return 'maniac';
  // Mafia wins when they match/outnumber civilians (no maniac)
  if (mafiaAlive.length >= civilianAlive.length + maniacAlive.length) return 'mafia';
  // Civilians win when all mafia dead
  if (mafiaAlive.length === 0 && maniacAlive.length === 0) return 'civilian';
  return null;
}

// ─── Night resolution ──────────────────────────────────────────────────────
/**
 * actions: { mafiaTarget, doctorTarget, detectiveTarget, sniperTarget, bodyguardTarget }
 * Returns { killed: username|null, sniperResult, detectiveResult, events: string[] }
 */
function resolveNight(players, actions) {
  const { mafiaTarget, doctorTarget, detectiveTarget, sniperTarget, bodyguardTarget } = actions;
  const byName = Object.fromEntries(players.map((p) => [p.username, p]));
  const events = [];
  let killed = null;

  // Bodyguard blocks mafia on bodyguardTarget
  if (bodyguardTarget && mafiaTarget === bodyguardTarget) {
    // bodyguard sacrifices themselves
    const bg = players.find((p) => p.role === 'bodyguard' && p.isAlive);
    if (bg) { bg.isAlive = false; killed = bg.username; events.push(`🛡️ Qo'riqchi o'z jonini fido qildi!`); }
    // mafia kill blocked
    if (doctorTarget === killed) { /* can't revive if bodyguard */ }
  } else if (mafiaTarget) {
    const target = byName[mafiaTarget];
    if (target) {
      // Doctor saves?
      if (doctorTarget === mafiaTarget) {
        events.push(`🩺 Doktor kimnidir megirda qutqarib qoldi!`);
      } else {
        target.isAlive = false;
        killed = mafiaTarget;
        events.push(`🌙 Kechasi ${mafiaTarget} o'ldirildi.`);
      }
    }
  }

  // Sniper fires on day phase but resolved here for simplicity
  let sniperResult = null;
  if (sniperTarget) {
    const target = byName[sniperTarget];
    const sniper = players.find((p) => p.role === 'sniper' && p.isAlive);
    if (target && sniper) {
      if (['mafia', 'don'].includes(target.role)) {
        target.isAlive = false;
        sniperResult = { success: true, target: sniperTarget };
        events.push(`🎯 Snipper ${sniperTarget} ni o'ldirdi!`);
      } else {
        sniper.isAlive = false;
        sniperResult = { success: false, target: sniperTarget };
        events.push(`🎯 Snipper nishonga tegmadi va o'zi halok bo'ldi!`);
      }
    }
  }

  // Detective check
  let detectiveResult = null;
  if (detectiveTarget) {
    const target = byName[detectiveTarget];
    if (target) {
      const isMafia = ['mafia'].includes(target.role); // don looks clean
      detectiveResult = { target: detectiveTarget, isMafia };
    }
  }

  return { players, killed, sniperResult, detectiveResult, events };
}

// ─── Voting resolution ─────────────────────────────────────────────────────
/**
 * votes: { [voterUsername]: targetUsername }
 * Returns { hanged: username|null, jokerWin: bool, tieVote: bool }
 */
function resolveVote(players, votes) {
  const counts = {};
  Object.values(votes).forEach((v) => { counts[v] = (counts[v] || 0) + 1; });

  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  if (sorted.length === 0) return { hanged: null, jokerWin: false, tieVote: true };

  const [top, second] = sorted;
  if (second && top[1] === second[1]) return { hanged: null, jokerWin: false, tieVote: true };

  const hanged = top[0];
  const target = players.find((p) => p.username === hanged && p.isAlive);
  if (!target) return { hanged: null, jokerWin: false, tieVote: false };

  const jokerWin = target.role === 'joker';
  target.isAlive = false;
  return { hanged, jokerWin, tieVote: false };
}

module.exports = { ROLES, assignRoles, checkWinner, resolveNight, resolveVote };

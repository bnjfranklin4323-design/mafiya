'use strict';
/**
 * GameStore — in-memory game state per room code
 * Persists through a round; rooms are cleaned up when they end or all leave.
 *
 * State shape:
 * {
 *   code, players:[{userId,username,avatar,role,isAlive,socketId}],
 *   phase: 'lobby'|'night'|'day'|'voting'|'ended',
 *   dayCount, nightActions:{mafiaTarget,doctorTarget,detectiveTarget,sniperTarget,bodyguardTarget},
 *   votes:{[username]:target}, timer:null|NodeJS.Timeout,
 *   chat: { global:[], room:[], dead:[] },
 *   roleConfig, timerSeconds
 * }
 */

const states = new Map();

function get(code) { return states.get(code) || null; }

function getOrCreate(code, defaults = {}) {
  if (!states.has(code)) {
    states.set(code, {
      code,
      players: [],
      phase: 'lobby',
      dayCount: 0,
      nightActions: {},
      votes: {},
      timer: null,
      chat: { global: [], room: [], dead: [] },
      roleConfig: defaults.roleConfig || {},
      timerSeconds: defaults.timerSeconds || 60,
    });
  }
  return states.get(code);
}

function set(code, patch) {
  const s = getOrCreate(code);
  Object.assign(s, patch);
  return s;
}

function del(code) { states.delete(code); }

function all() { return [...states.values()]; }

module.exports = { get, getOrCreate, set, del, all };

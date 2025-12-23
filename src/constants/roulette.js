// constants/roulette.js

export const API_URL = import.meta.env.VITE_API_URL || '';
export const SOCKET_URL = "https://roleta-fuza.sortehub.online";

export const ROULETTE_SOURCES = {
  immersive: '🌟 Immersive Roulette',
  brasileira: '🇧🇷 Roleta Brasileira',
  brasileira_playtech: '🇧🇷 Brasileira PlayTech',
  speed: '💨 Speed Roulette',
  xxxtreme: '⚡ XXXtreme Lightning',
  vipauto: '🚘 Auto Roulette Vip',
};

export const ROULETTE_GAME_IDS = {
  auto: 120,
  vipauto: 31,
  bacbo: 54,
  malta: 80,
  footballstudio: 53,
  immersive: 55,
  lightning: 33,
  reddoor: 35,
  aovivo: 34,
  brasileira_playtech: 102,
  brasileira: 101,
  relampago: 81,
  speedauto: 82,
  speed: 36,
  viproulette: 32,
  xxxtreme: 83
};

export const FILTER_OPTIONS = [
  { value: 100, label: 'Últimas 100 Rodadas' },
  { value: 300, label: 'Últimas 300 Rodadas' },
  { value: 500, label: 'Últimas 500 Rodadas' },
  { value: 1000, label: 'Últimas 1000 Rodadas' },
  { value: 'all', label: 'Histórico Completo' }
];

export const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
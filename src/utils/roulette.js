// utils/roulette.js

import { RED_NUMBERS } from '../constants/roulette';

/**
 * Retorna a cor de um número da roleta
 */
export const getNumberColor = (num) => {
  if (num === 0) return 'green';
  return RED_NUMBERS.includes(num) ? 'red' : 'black';
};

/**
 * Formata tooltip com estatísticas de "puxada" do número
 */
export const formatPullTooltip = (number, pullStats, previousStats) => {
  const pullStatsMap = pullStats?.get(number);
  const prevStatsMap = previousStats?.get(number);

  let pullString = "(Nenhum)";
  if (pullStatsMap && pullStatsMap.size > 0) {
    const pulledNumbers = [...pullStatsMap.keys()].slice(0, 5);
    pullString = pulledNumbers.join(', ');
    if (pullStatsMap.size > 5) pullString += ', ...';
  }

  let prevString = "(Nenhum)";
  if (prevStatsMap && prevStatsMap.size > 0) {
    const prevNumbers = [...prevStatsMap.keys()].slice(0, 5);
    prevString = prevNumbers.join(', ');
    if (prevStatsMap.size > 5) prevString += ', ...';
  }

  return `Número: ${number}\nPuxou: ${pullString}\nVeio Antes: ${prevString}`;
};

/**
 * Calcula estatísticas de quais números "puxam" outros
 * (qual número veio DEPOIS de cada número)
 */
export const computePullStats = (history) => {
  const pullMap = new Map();
  for (let i = 0; i <= 36; i++) pullMap.set(i, new Map());
  
  for (let i = 1; i < history.length; i++) {
    const curr = history[i].number;
    const next = history[i - 1].number;
    const stats = pullMap.get(curr);
    stats.set(next, (stats.get(next) || 0) + 1);
  }
  
  return pullMap;
};

/**
 * Calcula estatísticas de quais números vieram ANTES de cada número
 */
export const computePreviousStats = (history) => {
  const prevMap = new Map();
  for (let i = 0; i <= 36; i++) prevMap.set(i, new Map());
  
  for (let i = 0; i < history.length - 1; i++) {
    const curr = history[i].number;
    const prev = history[i + 1].number;
    const stats = prevMap.get(curr);
    stats.set(prev, (stats.get(prev) || 0) + 1);
  }
  
  return prevMap;
};

/**
 * Converte item da API para formato interno
 */
export const convertSpinItem = (item) => ({
  number: parseInt(item.signal, 10),
  color: getNumberColor(parseInt(item.signal, 10)),
  signal: item.signal,
  gameId: item.gameId,
  signalId: item.signalId || item.signalid || item.id,
  date: item.timestamp
});
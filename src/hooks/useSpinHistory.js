// hooks/useSpinHistory.js

import { useState, useEffect, useCallback, useMemo } from 'react';
import { API_URL } from '../constants/roulette';
import { 
  convertSpinItem, 
  computePullStats, 
  computePreviousStats 
} from '../utils/roulette';
import { processErrorResponse } from '../errorHandler';

export const useSpinHistory = ({
  selectedRoulette,
  userEmail,
  isAuthenticated,
  historyFilter,
  onPaywallRequired
}) => {
  const [spinHistory, setSpinHistory] = useState([]);
  const [selectedResult, setSelectedResult] = useState(null);
  const [numberPullStats, setNumberPullStats] = useState(() => new Map());
  const [numberPreviousStats, setNumberPreviousStats] = useState(() => new Map());

  // Fetch history via polling
  const fetchHistory = useCallback(async () => {
    if (!userEmail) return;
    
    let sourceQuery = selectedRoulette;
    if (selectedRoulette === 'brasileira_playtech') {
      sourceQuery = 'Brasileira PlayTech';
    }

    try {
      const response = await fetch(
        `${API_URL}/api/full-history?source=${sourceQuery}&userEmail=${encodeURIComponent(userEmail)}`
      );
      
      if (!response.ok) {
        const errorInfo = await processErrorResponse(response, 'history');
        if (errorInfo.requiresPaywall || response.status === 403) {
          onPaywallRequired(errorInfo.checkoutUrl || '');
        }
        throw new Error(errorInfo.message);
      }

      const data = await response.json();
      
      setSpinHistory(prev => {
        if (data.length === 0) return prev;
        
        if (prev.length === 0) {
          const converted = data.map(convertSpinItem);
          setSelectedResult(converted[0] || null);
          return converted;
        }
        
        const latestId = prev[0]?.signalId;
        const newItems = [];
        
        for (const item of data) {
          const currentId = item.signalId || item.signalid || item.id;
          if (String(currentId) === String(latestId)) break;
          newItems.push(convertSpinItem(item));
        }
        
        if (newItems.length === 0) return prev;
        
        setSelectedResult(newItems[0]);
        return [...newItems, ...prev];
      });
    } catch (error) {
      console.error("Erro ao buscar histórico:", error.message);
    }
  }, [selectedRoulette, userEmail, onPaywallRequired]);

  // Polling effect
  useEffect(() => {
    if (!isAuthenticated || !userEmail) return;

    fetchHistory();

    // Socket handles brasileira_playtech
    if (selectedRoulette === 'brasileira_playtech') {
      console.log("🛑 Polling desativado para PlayTech (Usando Socket)");
      return;
    }

    console.log("🔄 Polling ativado (5s)");
    const intervalId = setInterval(fetchHistory, 5000);
    return () => clearInterval(intervalId);
  }, [fetchHistory, isAuthenticated, userEmail, selectedRoulette]);

  // Compute pull stats in idle time
  useEffect(() => {
    if (spinHistory.length === 0) return;

    const timeoutId = setTimeout(() => {
      const compute = () => {
        const pullStats = computePullStats(spinHistory);
        const prevStats = computePreviousStats(spinHistory);
        setNumberPullStats(pullStats);
        setNumberPreviousStats(prevStats);
      };

      if ('requestIdleCallback' in window) {
        requestIdleCallback(compute, { timeout: 2000 });
      } else {
        compute();
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [spinHistory]);

  // Add new spin (used by socket)
  const addSpin = useCallback((newSpin) => {
    setSpinHistory(prev => {
      if (prev.length > 0 && String(prev[0].signalId) === String(newSpin.signalId)) {
        return prev;
      }
      
      const newList = [newSpin, ...prev].slice(0, 1000);
      setSelectedResult(newSpin);
      return newList;
    });
  }, []);

  // Clear history (used when changing roulette)
  const clearHistory = useCallback(() => {
    setSpinHistory([]);
    setSelectedResult(null);
  }, []);

  // Filtered history based on filter option
  const filteredSpinHistory = useMemo(() => {
    if (historyFilter === 'all') return spinHistory;
    return spinHistory.slice(0, Number(historyFilter));
  }, [spinHistory, historyFilter]);

  // Stats computed from filtered history
  const stats = useMemo(() => {
    const historyCount = filteredSpinHistory.length;
    
    if (historyCount === 0) {
      return {
        historyFilter: 0,
        colorFrequencies: { red: '0.0', black: '0.0', green: '0.0' },
        latestNumbers: []
      };
    }

    const colorCounts = filteredSpinHistory.reduce((acc, curr) => {
      acc[curr.color] = (acc[curr.color] || 0) + 1;
      return acc;
    }, {});

    return {
      historyFilter: historyCount,
      colorFrequencies: {
        red: ((colorCounts.red || 0) / historyCount * 100).toFixed(1),
        black: ((colorCounts.black || 0) / historyCount * 100).toFixed(1),
        green: ((colorCounts.green || 0) / historyCount * 100).toFixed(1)
      },
      latestNumbers: spinHistory.slice(0, 100)
    };
  }, [filteredSpinHistory, spinHistory]);

  return {
    spinHistory,
    filteredSpinHistory,
    selectedResult,
    setSelectedResult,
    numberPullStats,
    numberPreviousStats,
    stats,
    addSpin,
    clearHistory
  };
};